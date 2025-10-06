const { neon } = require('@neondatabase/serverless');
const { createClient } = require('@supabase/supabase-js');
const { validateToken } = require('./validate-token');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const sql = neon(process.env.NEON_DATABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async (event, context) => {
  console.log('=== FINAL SUBMISSION PROCESSING ===');
  
  try {
    // Validate JWT token and get user info
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is student
    if (userInfo.role !== 'student') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Access denied' })
      };
    }

    // Parse request body
    const body = JSON.parse(event.body);
    const { 
      test_id, 
      test_name, 
      teacher_id, 
      subject_id, 
      student_id, 
      question_id,
      audio_blob,
      transcript,
      scores,
      audio_duration,
      time_taken,
      caught_cheating,
      visibility_change_times,
      retest_assignment_id,
      parent_test_id,
      academic_period_id
    } = body;

    console.log('Final submission data:', {
      test_id,
      test_name,
      teacher_id,
      subject_id,
      student_id,
      question_id,
      has_audio_blob: !!audio_blob,
      has_transcript: !!transcript,
      has_scores: !!scores,
      audio_duration,
      time_taken,
      caught_cheating,
      visibility_change_times,
      retest_assignment_id,
      parent_test_id
    });

    // Extra debug for potential hangs
    try {
      const blobInfo = typeof audio_blob === 'string' ? {
        provided: true,
        length: audio_blob.length,
        prefix: audio_blob.slice(0, 32)
      } : { provided: !!audio_blob, length: null, prefix: null };
      console.log('Audio blob debug:', blobInfo);
    } catch (_) { console.log('Audio blob debug: failed to inspect'); }

    let audioUrl = null;
    if (audio_blob) {
      console.log('Converting base64 audio to buffer...');
      // Support both raw base64 and data URLs like "data:audio/webm;base64,XXXX"
      const base64Data = typeof audio_blob === 'string' && audio_blob.includes(',')
        ? audio_blob.split(',')[1]
        : audio_blob;
      const base64Length = typeof base64Data === 'string' ? base64Data.length : 0;
      console.log('Base64 payload length:', base64Length);
      const audioBuffer = Buffer.from(base64Data, 'base64');
      console.log('Audio buffer created, size:', audioBuffer.length);
      console.log('Using WebM format for Supabase upload...');
      const tUploadStart = Date.now();
      console.log('Uploading to Supabase (including retests)...');
      try {
        audioUrl = await uploadAudioToSupabase(audioBuffer, test_id, student_id);
      } catch (e) {
        console.error('Supabase upload threw:', e && e.message);
        throw e;
      }
      const tUploadMs = Date.now() - tUploadStart;
      console.log('Supabase upload complete in', tUploadMs + 'ms', 'URL:', audioUrl);
      if (!audioUrl || audioUrl === 'null' || audioUrl === '') {
        console.error('❌ Audio URL is empty or invalid:', audioUrl);
        throw new Error('Audio upload failed - no URL returned');
      }
    } else {
      console.log('No audio_blob provided; continuing without audio upload');
      audioUrl = null;
    }

    // Save to database
    console.log('Saving to database...');
    const tDbStart = Date.now();
    await saveToDatabase({
      test_id,
      test_name,
      teacher_id,
      subject_id,
      student_id,
      question_id,
      audio_url: audioUrl,
      transcript,
      scores,
      audio_duration,
      time_taken,
      caught_cheating,
      visibility_change_times,
      retest_assignment_id,
      parent_test_id,
      academic_period_id
    }, userInfo);
    const tDbMs = Date.now() - tDbStart;
    console.log('Database save complete in', tDbMs + 'ms');

    console.log('Returning success response');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Speaking test submitted successfully',
        audio_url: audioUrl,
        scores
      })
    };

  } catch (error) {
    console.error('Final submission error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};


async function uploadAudioToSupabase(audioBuffer, testId, studentId) {
  try {
    const fileName = `speaking-test-${testId}-student-${studentId}-${Date.now()}.webm`;
    const filePath = `speaking-tests/${fileName}`;

    const { data, error } = await supabase.storage
      .from('audio')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/webm',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath);

    console.log('🔗 Generated public URL:', urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
}

async function saveToDatabase(data, userInfo) {
  try {
    const {
      test_id,
      test_name,
      teacher_id,
      subject_id,
      student_id,
      question_id,
      audio_url,
      transcript,
      scores,
      audio_duration,
      time_taken,
      caught_cheating,
      visibility_change_times,
      retest_assignment_id
    } = data;

    // Get academic period ID from frontend (no database query needed)
    const { academic_period_id } = data;
    
    // Use user info from JWT token (like other tests)
    const grade = userInfo.grade;
    const classValue = userInfo.class;

    // Originals -> speaking_test_results; retests -> ONLY test_attempts
    let result = null;
    if (!retest_assignment_id) {
      console.log('About to insert ORIGINAL into speaking_test_results table with:', {
        test_id, test_name, teacher_id, subject_id, grade, classValue, student_id, question_id, audio_url
      });
      result = await sql`
        INSERT INTO speaking_test_results (
          test_id,
          test_name,
          teacher_id,
          subject_id,
          grade,
          class,
          number,
          student_id,
          name,
          surname,
          nickname,
          question_id,
          audio_url,
          transcript,
          word_count,
          grammar_mistakes,
          vocabulary_mistakes,
          overall_score,
          score,
          max_score,
          time_taken,
          caught_cheating,
          visibility_change_times,
          academic_period_id,
          is_completed,
          submitted_at,
          created_at,
          ai_feedback
        ) VALUES (
          ${test_id},
          ${test_name},
          ${teacher_id},
          ${subject_id},
          ${grade},
          ${classValue},
          ${userInfo.number},
          ${userInfo.student_id},
          ${userInfo.name},
          ${userInfo.surname},
          ${userInfo.nickname},
          ${question_id},
          ${audio_url},
          ${transcript},
          ${scores.word_count},
          ${scores.grammar_mistakes || 0},
          ${scores.vocabulary_mistakes || scores.vocab_mistakes || 0},
          ${scores.overall_score},
          ${Math.round(scores.overall_score / 10)},
          10,
          ${time_taken},
          ${caught_cheating},
          ${visibility_change_times},
          ${academic_period_id},
          true,
          NOW(),
          NOW(),
          ${scores.ai_feedback ? JSON.stringify(scores.ai_feedback) : null}
        )
        RETURNING id
      `;
      console.log('Original speaking result saved with ID:', result[0].id);
    } else {
      console.log('Skipping speaking_test_results insert for RETEST; writing only to test_attempts');
    }
    
    // If this is a retest, write to test_attempts ONLY
    if (retest_assignment_id) {
      console.log('Writing retest to test_attempts...');
      
      // Get retest assignment details
      const retestAssignment = await sql`
        SELECT * FROM retest_assignments WHERE id = ${retest_assignment_id}
      `;
      
      if (retestAssignment.length > 0) {
        const assignment = retestAssignment[0];
        const parentTestId = assignment.original_test_id || test_id;

        // Compute next attempt number from existing attempts to avoid duplicate key
        const nextAttemptRows = await sql`
          SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_attempt
          FROM test_attempts
          WHERE student_id = ${userInfo.student_id}
            AND test_id = ${parentTestId}
            AND retest_assignment_id IS NOT NULL
        `;
        const computedNextAttempt = Number(nextAttemptRows[0]?.next_attempt || 1);
        const attemptNumber = computedNextAttempt;
        
        // Construct answers JSON for speaking tests (store audio only in top-level column)
        const speakingAnswers = {
          transcript: transcript,
          overall_score: Math.round(scores.overall_score),
          word_count: scores.word_count,
          grammar_mistakes: scores.grammar_mistakes || 0,
          vocabulary_mistakes: scores.vocabulary_mistakes || scores.vocab_mistakes || 0,
          grammar_corrections: scores.grammar_corrections || [],
          vocabulary_corrections: scores.vocabulary_corrections || [],
          language_use_corrections: scores.language_use_corrections || [],
          audio_url: audio_url || null
        };
        
        // Insert into test_attempts
        await sql`
          INSERT INTO test_attempts (
            student_id, test_id, attempt_number, score, max_score, percentage,
            time_taken, started_at, submitted_at, is_completed,
            answers, answers_by_id, question_order, caught_cheating, visibility_change_times,
            retest_assignment_id, test_name, teacher_id, subject_id, grade, class, number,
            name, surname, nickname, academic_period_id, audio_url
          )
          VALUES (
            ${userInfo.student_id}, ${parentTestId}, ${attemptNumber}, 
            ${Math.round(scores.overall_score / 10)}, 10, ${Math.round(scores.overall_score)},
            ${time_taken || null}, NOW(), NOW(), true,
            ${JSON.stringify(speakingAnswers)}, ${JSON.stringify({})}, ${JSON.stringify([])}, 
            ${caught_cheating || false}, ${visibility_change_times || 0},
            ${retest_assignment_id}, ${test_name}, ${teacher_id}, ${subject_id}, 
            ${grade}, ${classValue}, ${userInfo.number},
            ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname}, 
            ${academic_period_id}, ${audio_url}
          )
        `;
        
        console.log('Retest written to test_attempts');
        
        // Mirror other tests: update retest_targets attempts and status
        try {
          const percentageVal = Math.round(scores.overall_score);
          console.log('Updating retest_targets with percentage:', percentageVal);

          if (percentageVal >= 50) {
            await sql`
              UPDATE retest_targets tgt
              SET attempt_count = ra.max_attempts,
                  last_attempt_at = NOW(),
                  status = 'PASSED'
              FROM retest_assignments ra
              WHERE tgt.retest_assignment_id = ra.id
                AND tgt.retest_assignment_id = ${retest_assignment_id}
                AND tgt.student_id = ${userInfo.student_id}
            `;
          } else {
            await sql`
              UPDATE retest_targets 
              SET attempt_count = attempt_count + 1,
                  last_attempt_at = NOW(),
                  status = 'FAILED'
              WHERE retest_assignment_id = ${retest_assignment_id}
                AND student_id = ${userInfo.student_id}
            `;
          }
          console.log('Retest targets updated');
        } catch (err) {
          console.error('Failed to update retest_targets:', err);
        }

        // Update best retest values
        console.log('Updating best retest values...');
        await sql`SELECT update_best_retest_values(${userInfo.student_id}, ${parentTestId})`;
        console.log('Best retest values updated');
      }
    }
    
    // Return inserted id for originals; null for retests
    return result && Array.isArray(result) && result[0] ? result[0].id : null;

  } catch (error) {
    console.error('Database save error:', error);
    throw new Error(`Database save failed: ${error.message}`);
  }
}
