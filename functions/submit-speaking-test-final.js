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
      parent_test_id
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

    // Convert base64 audio to buffer
    console.log('Converting base64 audio to buffer...');
    const audioBuffer = Buffer.from(audio_blob, 'base64');
    console.log('Audio buffer created, size:', audioBuffer.length);
    
    // Keep audio as WebM format (no conversion needed)
    console.log('Using WebM format for Supabase upload...');
    console.log('Audio buffer size:', audioBuffer.length);

    // Upload to Supabase
    console.log('Uploading to Supabase...');
    const audioUrl = await uploadAudioToSupabase(audioBuffer, test_id, student_id);
    console.log('Supabase upload complete, URL:', audioUrl);
    
    // Debug: Check if audioUrl is valid
    if (!audioUrl || audioUrl === 'null' || audioUrl === '') {
      console.error('❌ Audio URL is empty or invalid:', audioUrl);
      throw new Error('Audio upload failed - no URL returned');
    }

    // Save to database
    console.log('Saving to database...');
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
      parent_test_id
    }, userInfo);
    console.log('Database save complete');

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

    // Get current academic period
    const academicPeriod = await sql`
      SELECT id FROM academic_year 
      WHERE start_date <= NOW() AND end_date >= NOW() 
      ORDER BY start_date DESC LIMIT 1
    `;
    
    const academic_period_id = academicPeriod[0]?.id || 3; // Default to period 3 if none found
    
    // Use user info from JWT token (like other tests)
    const grade = userInfo.grade;
    const classValue = userInfo.class;

    // Insert into speaking_test_results table
    console.log('About to insert into speaking_test_results table with:', {
      test_id, test_name, teacher_id, subject_id, grade, classValue, student_id, question_id, audio_url
    });
    const result = await sql`
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
        retest_assignment_id,
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
        ${scores.vocab_mistakes || 0},
        ${scores.overall_score},
        ${Math.round(scores.overall_score / 10)},
        10,
        ${time_taken},
        ${caught_cheating},
        ${visibility_change_times},
        ${retest_assignment_id},
        ${academic_period_id},
        true,
        NOW(),
        NOW(),
        ${scores.ai_feedback ? JSON.stringify(scores.ai_feedback) : null}
      )
      RETURNING id
    `;

    console.log('Test attempt saved with ID:', result[0].id);
    return result[0].id;

  } catch (error) {
    console.error('Database save error:', error);
    throw new Error(`Database save failed: ${error.message}`);
  }
}
