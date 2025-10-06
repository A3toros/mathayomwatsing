const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
const axios = require('axios');

// AI Provider Configuration
const SPEAKING_AI_CONFIG = {
  // AI Providers
  STT_PROVIDER: 'assemblyai',           // Speech-to-text provider
  GRAMMAR_CHECKER: 'assemblyai',        // Grammar checking provider
  VOCAB_ANALYZER: 'assemblyai',         // Vocabulary analysis provider
  
  // Language Settings
  DEFAULT_LANGUAGE: 'en-US',            // Default language for analysis
  SUPPORTED_LANGUAGES: ['en-US', 'en-GB'], // Supported language codes
  
  // AssemblyAI Settings
  ASSEMBLYAI_MODEL: 'universal',         // AssemblyAI speech model
  ASSEMBLYAI_FEATURES: ['sentiment', 'entities', 'highlights'], // Additional features
  
  // LanguageTool Settings (Public API)
  LANGUAGETOOL_URL: process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check',  // Public API endpoint
  LANGUAGETOOL_LANGUAGE: process.env.LANGUAGETOOL_LANGUAGE || 'en-US',        // LanguageTool language code
  LANGUAGETOOL_LEVEL: process.env.LANGUAGETOOL_LEVEL || 'default'          // LanguageTool analysis level
};

// Scoring Configuration
const SPEAKING_SCORE_CONFIG = {
  // Scoring Weights (must sum to 1.0)
  WORD_WEIGHT: 0.30,        // 30% - Word count score
  GRAMMAR_WEIGHT: 0.40,     // 40% - Grammar score  
  VOCAB_WEIGHT: 0.30,       // 30% - Vocabulary score
  
  // Points Deduction
  POINTS_PER_GRAMMAR_ERROR: 2.0,  // Points deducted per grammar mistake
  POINTS_PER_VOCAB_ERROR: 2.0,    // Points deducted per vocabulary mistake
  
  // Validation
  MIN_WORDS_DEFAULT: 50,    // Default minimum word count
  MAX_SCORE: 100,           // Maximum possible score
  MIN_SCORE: 0              // Minimum possible score
};

// AssemblyAI Integration
const uploadAudioToAssemblyAI = async (audioBlob) => {
  try {
    const baseUrl = process.env.ASSEMBLYAI_BASE_URL || "https://api.assemblyai.com";
    const headers = {
      authorization: process.env.ASSEMBLYAI_API_KEY,
    };

    // audioBlob is already a Buffer from base64, no need to convert
    const audioBuffer = audioBlob;
    
    const uploadResponse = await axios.post(`${baseUrl}/v2/upload`, audioBuffer, {
      headers,
    });
    
    return uploadResponse.data.upload_url;
  } catch (error) {
    console.error('Audio upload to AssemblyAI failed:', error);
    throw new Error(`Audio upload failed: ${error.message}`);
  }
};

const transcribeAudioWithAssemblyAI = async (audioUrl) => {
  try {
    const baseUrl = process.env.ASSEMBLYAI_BASE_URL || "https://api.assemblyai.com";
    const headers = {
      authorization: process.env.ASSEMBLYAI_API_KEY,
    };

    const data = {
      audio_url: audioUrl,
      speech_model: "universal", // Use universal model for better accuracy
      language_detection: true,
      auto_highlights: true,
      sentiment_analysis: true,
      entity_detection: true
    };

    const url = `${baseUrl}/v2/transcript`;
    const response = await axios.post(url, data, { headers: headers });
    const transcriptId = response.data.id;
    
    // Poll for completion
    const pollingEndpoint = `${baseUrl}/v2/transcript/${transcriptId}`;
    
    while (true) {
      const pollingResponse = await axios.get(pollingEndpoint, {
        headers: headers,
      });
      const transcriptionResult = pollingResponse.data;

      if (transcriptionResult.status === "completed") {
        return {
          text: transcriptionResult.text,
          confidence: transcriptionResult.confidence,
          language: transcriptionResult.language_code,
          highlights: transcriptionResult.auto_highlights_result,
          sentiment: transcriptionResult.sentiment_analysis_results,
          entities: transcriptionResult.entities
        };
      } else if (transcriptionResult.status === "error") {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      } else {
        // Wait 3 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error('AssemblyAI transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

// LanguageTool Integration
const checkGrammarWithLanguageTool = async (transcript, language = 'en-US') => {
  try {
    const formData = new URLSearchParams();
    formData.append('text', transcript);
    formData.append('language', language);
    formData.append('level', 'picky'); // Use picky level for more thorough checking
    formData.append('enabledOnly', 'false');
    
    const response = await fetch(SPEAKING_AI_CONFIG.LANGUAGETOOL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SpeakingTestApp/1.0'
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('LanguageTool API error:', error);
    return { matches: [] }; // Return empty matches if API fails
  }
};

const analyzeGrammarWithLanguageTool = async (transcript, language = 'en-US') => {
  try {
    const languageToolResult = await checkGrammarWithLanguageTool(transcript, language);
    
    // Count grammar mistakes from LanguageTool
    const grammarMistakes = languageToolResult.matches?.length || 0;
    
    // Categorize mistakes by type
    const mistakeCategories = {
      grammar: 0,
      spelling: 0,
      style: 0,
      punctuation: 0,
      other: 0
    };
    
    languageToolResult.matches?.forEach(match => {
      const category = match.rule?.category?.id || 'other';
      switch (category) {
        case 'GRAMMAR':
          mistakeCategories.grammar++;
          break;
        case 'SPELLING':
          mistakeCategories.spelling++;
          break;
        case 'STYLE':
          mistakeCategories.style++;
          break;
        case 'PUNCTUATION':
          mistakeCategories.punctuation++;
          break;
        default:
          mistakeCategories.other++;
      }
    });
    
    // Generate detailed corrections and suggestions
    const detailedCorrections = languageToolResult.matches?.map(match => {
      const context = match.context;
      const text = context.text;
      const offset = context.offset;
      const length = match.length;
      
      // Extract the problematic text
      const problemText = text.substring(offset, offset + length);
      
      // Get suggested replacements
      const replacements = match.replacements || [];
      const suggestedText = replacements.length > 0 ? replacements[0].value : problemText;
      
      // Create detailed correction
      return {
        original: problemText,
        suggested: suggestedText,
        message: match.message,
        shortMessage: match.shortMessage,
        rule: match.rule?.description,
        category: match.rule?.category?.id || 'OTHER',
        severity: match.rule?.issueType || 'UNKNOWN',
        context: {
          before: text.substring(Math.max(0, offset - 20), offset),
          problem: problemText,
          after: text.substring(offset + length, Math.min(text.length, offset + length + 20))
        },
        explanation: match.rule?.description || 'Grammar issue detected'
      };
    }) || [];
    
    return {
      totalMistakes: grammarMistakes,
      categories: mistakeCategories,
      matches: languageToolResult.matches || [],
      corrections: detailedCorrections,
      language: languageToolResult.language?.code || language
    };
  } catch (error) {
    console.error('Grammar analysis with LanguageTool error:', error);
    return {
      totalMistakes: 0,
      categories: { grammar: 0, spelling: 0, style: 0, punctuation: 0, other: 0 },
      matches: [],
      language: language
    };
  }
};

const analyzeVocabularyWithLanguageTool = async (transcript, assemblyAIHighlights, language = 'en-US') => {
  try {
    // Calculate unique words (distinct tokens)
    const words = transcript.split(/\s+/).filter(word => word.length > 0);
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    const uniqueWordCount = uniqueWords.size;
    
    // Get LanguageTool results for vocabulary analysis
    const languageToolResult = await checkGrammarWithLanguageTool(transcript, language);
    
    // Get vocabulary warnings from LanguageTool (style-related matches)
    const vocabWarnings = languageToolResult.matches?.filter(match => 
      match.rule?.category?.id === 'STYLE' || 
      match.rule?.description?.toLowerCase().includes('vocabulary') ||
      match.rule?.description?.toLowerCase().includes('word choice') ||
      match.rule?.description?.toLowerCase().includes('repetition') ||
      match.rule?.description?.toLowerCase().includes('redundant') ||
      match.rule?.description?.toLowerCase().includes('repetitive') ||
      match.rule?.description?.toLowerCase().includes('word repetition') ||
      match.rule?.description?.toLowerCase().includes('repeated word')
    ) || [];
    
    // Also detect word repetition manually
    const wordCounts = {};
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      wordCounts[lowerWord] = (wordCounts[lowerWord] || 0) + 1;
    });
    
    // Count repeated words (appearing more than once)
    let manualRepetitions = 0;
    Object.entries(wordCounts).forEach(([word, count]) => {
      if (count > 1) {
        manualRepetitions += count - 1; // Count extra occurrences
      }
    });
    
    const vocabWarningCount = vocabWarnings.length + manualRepetitions;
    
    // Calculate vocabulary quality score: (unique_words - vocab_warnings) / unique_words * 100
    const vocabQualityScore = uniqueWordCount > 0 
      ? Math.max(0, (uniqueWordCount - vocabWarningCount) / uniqueWordCount * 100)
      : 0;
    
    // Convert quality score to mistakes (inverse relationship)
    // Higher quality = fewer mistakes
    const vocabMistakes = Math.max(0, Math.round((100 - vocabQualityScore) / 10));
    
    const vocabularyIssues = [];
    
    // Add specific vocabulary issues based on warnings
    vocabWarnings.forEach(warning => {
      vocabularyIssues.push(warning.message);
    });
    
    // Add general vocabulary quality feedback
    if (vocabQualityScore < 50) {
      vocabularyIssues.push('Poor vocabulary quality - many style issues');
    } else if (vocabQualityScore < 70) {
      vocabularyIssues.push('Average vocabulary quality - some style issues');
    } else if (vocabQualityScore < 90) {
      vocabularyIssues.push('Good vocabulary quality - few style issues');
    } else {
      vocabularyIssues.push('Excellent vocabulary quality');
    }
    
    return {
      vocabMistakes,
      uniqueWordCount,
      vocabWarningCount,
      vocabQualityScore,
      manualRepetitions,
      vocabularyIssues,
      languageToolMatches: vocabWarnings
    };
  } catch (error) {
    console.error('Vocabulary analysis with LanguageTool error:', error);
    return {
      vocabMistakes: 0,
      uniqueWordCount: 0,
      vocabWarningCount: 0,
      vocabQualityScore: 0,
      vocabularyIssues: [],
      languageToolMatches: []
    };
  }
};

// Calculate speaking test scores
const calculateSpeakingScore = async (transcript, testConfig, assemblyAIResult) => {
  const { min_words } = testConfig;
  const { WORD_WEIGHT, GRAMMAR_WEIGHT, VOCAB_WEIGHT, POINTS_PER_GRAMMAR_ERROR, POINTS_PER_VOCAB_ERROR } = SPEAKING_SCORE_CONFIG;
  
  // 1. Word Count Score (30%): min(actual_words / min_words, 1) * 30
  const actualWords = transcript.split(/\s+/).filter(word => word.length > 0).length;
  const wordScore = Math.min(actualWords / min_words, 1) * (WORD_WEIGHT * 100);
  
  // 2. Grammar Score (40%): max(40 - (grammar_mistakes * 2), 0)
  const grammarAnalysis = await analyzeGrammarWithLanguageTool(transcript, assemblyAIResult.language);
  const grammarScore = Math.max((GRAMMAR_WEIGHT * 100) - (grammarAnalysis.totalMistakes * POINTS_PER_GRAMMAR_ERROR), 0);
  
  // 3. Vocabulary Score (30%): Use vocabulary quality score directly
  const vocabAnalysis = await analyzeVocabularyWithLanguageTool(transcript, assemblyAIResult.highlights, assemblyAIResult.language);
  const vocabScore = (vocabAnalysis.vocabQualityScore / 100) * (VOCAB_WEIGHT * 100);
  
  // 4. Total Score: word_score + grammar_score + vocab_score
  const overallScore = wordScore + grammarScore + vocabScore;
  
  return {
    word_score: Math.round(wordScore * 100) / 100,
    grammar_score: Math.round(grammarScore * 100) / 100,
    vocab_score: Math.round(vocabScore * 100) / 100,
    overall_score: Math.round(overallScore * 100) / 100,
    word_count: actualWords,
    grammar_mistakes: grammarAnalysis.totalMistakes,
    vocabulary_mistakes: vocabAnalysis.vocabMistakes,
    stt_confidence: assemblyAIResult.confidence,
    language: assemblyAIResult.language,
    highlights: assemblyAIResult.highlights,
    sentiment: assemblyAIResult.sentiment,
    entities: assemblyAIResult.entities,
    // Enhanced analysis results
    grammar_categories: grammarAnalysis.categories,
    grammar_matches: grammarAnalysis.matches,
    grammar_corrections: grammarAnalysis.corrections || [],
    vocabulary_issues: vocabAnalysis.vocabularyIssues,
    unique_word_count: vocabAnalysis.uniqueWordCount,
    vocab_warning_count: vocabAnalysis.vocabWarningCount,
    vocab_quality_score: vocabAnalysis.vocabQualityScore,
    language_tool_matches: vocabAnalysis.languageToolMatches
  };
};

exports.handler = async function(event, context) {
  console.log('=== submit-speaking-test function called ===');
  console.log('Event method:', event.httpMethod);
  console.log('Event headers:', event.headers);
  console.log('Event body type:', typeof event.body);
  console.log('Event body length:', event.body ? event.body.length : 'null');
  console.log('Event body:', event.body);
  
  // Debug all environment variables
  console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
  console.log('Database variables:');
  console.log('- NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('- POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
  
  console.log('Supabase variables:');
  console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
  console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
  
  console.log('AssemblyAI variables:');
  console.log('- ASSEMBLYAI_API_KEY:', process.env.ASSEMBLYAI_API_KEY ? 'SET' : 'NOT SET');
  console.log('- ASSEMBLYAI_BASE_URL:', process.env.ASSEMBLYAI_BASE_URL ? 'SET' : 'NOT SET');
  
  console.log('LanguageTool variables:');
  console.log('- LANGUAGETOOL_URL:', process.env.LANGUAGETOOL_URL ? 'SET' : 'NOT SET');
  console.log('- LANGUAGETOOL_LANGUAGE:', process.env.LANGUAGETOOL_LANGUAGE ? 'SET' : 'NOT SET');
  console.log('- LANGUAGETOOL_LEVEL:', process.env.LANGUAGETOOL_LEVEL ? 'SET' : 'NOT SET');
  console.log('=== END ENVIRONMENT DEBUG ===');
  
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    // Validate token
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    
    // Check if user is student
    if (userInfo.role !== 'student') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Student role required.' })
      };
    }

    const { 
      test_id,
      test_name,
      teacher_id,
      subject_id,
      question_id,
      audio_blob, // Base64 encoded audio data
      audio_duration,
      time_taken,
      started_at,
      submitted_at,
      caught_cheating = false,
      visibility_change_times = 0,
      is_completed = true,
      retest_assignment_id,
      parent_test_id,
      transcript, // Already processed transcript
      scores, // Already processed scores
      final_submission = false // Flag to indicate if this is final submission
    } = JSON.parse(event.body);
    
    console.log('=== COMPREHENSIVE SUBMISSION DEBUG ===');
    console.log('Parsed request data:', {
      test_id,
      test_name,
      teacher_id,
      subject_id,
      question_id,
      audio_duration,
      time_taken,
      caught_cheating,
      visibility_change_times,
      retest_assignment_id,
      parent_test_id,
      final_submission,
      has_transcript: !!transcript,
      has_scores: !!scores,
      has_audio_blob: !!audio_blob
    });
    console.log('=== END SUBMISSION DEBUG ===');

    // Validate input based on submission type
    if (final_submission) {
      // Final submission - requires processed results
      if (!test_id || !test_name || !teacher_id || !subject_id || !question_id || !transcript || !scores) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Missing required fields for final submission: test_id, test_name, teacher_id, subject_id, question_id, transcript, scores'
          })
        };
      }
    } else {
      // Initial AI processing - requires audio
      if (!test_id || !test_name || !teacher_id || !subject_id || !question_id || !audio_blob) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Missing required fields for AI processing: test_id, test_name, teacher_id, subject_id, question_id, audio_blob'
          })
        };
      }
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.NEON_DATABASE_URL);
    console.log('Database connection established');
    
    // Begin transaction
    console.log('Starting database transaction...');
    await sql`BEGIN`;
    console.log('Transaction started successfully');
    
    try {
      if (final_submission) {
        // Final submission - save to database
        console.log('=== FINAL SUBMISSION DEBUG ===');
        console.log('Processing final submission...');
        console.log('Final submission data:', {
          test_id,
          test_name,
          teacher_id,
          subject_id,
          transcript: transcript ? transcript.substring(0, 100) + '...' : 'null',
          scores: scores ? JSON.stringify(scores).substring(0, 100) + '...' : 'null',
          audio_blob_size: audio_blob ? audio_blob.length : 'null'
        });
        console.log('=== END FINAL SUBMISSION DEBUG ===');
        
        // Upload audio to Supabase if audio_blob is provided
        let audioUrl = null;
        if (audio_blob) {
          console.log('Uploading audio to Supabase...');
          try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
              process.env.SUPABASE_URL,
              process.env.SUPABASE_SERVICE_KEY
            );
            
            // Convert base64 to buffer
            const audioBuffer = Buffer.from(audio_blob, 'base64');
            
            // Generate unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `speaking-test-${test_id}-${userInfo.student_id}-${timestamp}.webm`;
            const filePath = `speaking-tests/${filename}`;
            
            // Upload to Supabase
            const { data, error } = await supabase.storage
              .from('audio')
              .upload(filePath, audioBuffer, {
                contentType: 'audio/webm',
                upsert: false
              });
            
             if (error) {
               console.error('=== SUPABASE UPLOAD ERROR DEBUG ===');
               console.error('Supabase upload error:', error);
               console.error('Error details:', {
                 status: error.status,
                 statusCode: error.statusCode,
                 message: error.message
               });
               console.log('Continuing without audio upload - bucket may not exist');
               audioUrl = null; // Set to null instead of throwing error
               console.log('=== END SUPABASE UPLOAD ERROR DEBUG ===');
             } else {
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('audio')
                .getPublicUrl(filePath);
              
              audioUrl = urlData.publicUrl;
              console.log('Audio uploaded successfully:', audioUrl);
            }
          } catch (error) {
            console.error('Audio upload error:', error);
            console.log('Continuing without audio upload');
            audioUrl = null; // Set to null instead of failing
           }
         }
         
         console.log('=== AFTER SUPABASE UPLOAD DEBUG ===');
         console.log('Audio upload completed, audioUrl:', audioUrl);
         console.log('=== END AFTER SUPABASE UPLOAD DEBUG ===');
         
         // Get academic period ID from frontend (no database query needed)
        const { academic_period_id } = JSON.parse(event.body);
        const academicPeriodId = academic_period_id;
        console.log('Academic period ID from frontend:', academicPeriodId);

        // Handle retest logic
        let attemptNumber = 1;
        let effectiveParentTestId = test_id;
        
        if (retest_assignment_id) {
          console.log('Processing retest assignment...');
          const retestAssignment = await sql`
            SELECT * FROM retest_assignments WHERE id = ${retest_assignment_id}
          `;
          
          if (retestAssignment.length > 0) {
            effectiveParentTestId = retestAssignment[0].original_test_id;
            attemptNumber = retestAssignment[0].attempt_number;
            console.log('Retest assignment found:', retestAssignment[0]);
          }
        }

        // Insert into test_attempts (like other tests)
        console.log('=== DATABASE WRITE DEBUG ===');
        console.log('Recording test attempt...');
        console.log('Database write data:', {
          student_id: userInfo.student_id,
          test_id,
          attemptNumber,
          score: Math.round(scores.overall_score),
          transcript_length: transcript ? transcript.length : 0,
          scores_keys: scores ? Object.keys(scores) : [],
          audio_url: audioUrl
        });
        console.log('=== END DATABASE WRITE DEBUG ===');
        
        // Construct answers JSON for speaking tests (store audio only in top-level column)
        const speakingAnswers = {
          transcript: transcript,
          overall_score: Math.round(scores.overall_score),
          word_count: scores.word_count,
          grammar_mistakes: scores.grammar_mistakes,
          vocabulary_mistakes: scores.vocabulary_mistakes,
          grammar_corrections: scores.grammar_corrections || [],
          vocabulary_corrections: scores.vocabulary_corrections || [],
          language_use_corrections: scores.language_use_corrections || []
        };
        
        await sql`
          INSERT INTO test_attempts (
            student_id, test_id, attempt_number, score, max_score, percentage,
            time_taken, started_at, submitted_at, is_completed,
            answers, answers_by_id, question_order, caught_cheating, visibility_change_times,
            retest_assignment_id, test_name, teacher_id, subject_id, grade, class, number,
            name, surname, nickname, academic_period_id, audio_url
          )
          VALUES (
            ${userInfo.student_id}, ${test_id}, ${attemptNumber}, ${Math.round(scores.overall_score / 10)}, 10, ${Math.round(scores.overall_score)},
            ${time_taken || null}, ${started_at || null}, ${submitted_at || new Date().toISOString()}, ${is_completed || true},
            ${JSON.stringify(speakingAnswers)}, ${JSON.stringify({})}, ${JSON.stringify([])}, ${caught_cheating || false}, ${visibility_change_times || 0},
            ${retest_assignment_id}, ${test_name}, ${teacher_id}, ${subject_id}, ${userInfo.grade}, ${userInfo.class}, ${userInfo.number},
            ${userInfo.name}, ${userInfo.surname}, ${userInfo.nickname}, ${academicPeriodId}, ${audioUrl}
          )
        `;
        
        console.log('Test attempt recorded successfully');
        
        // Update best retest values if this is a retest
        if (retest_assignment_id) {
          console.log('Updating best retest values...');
          await sql`SELECT update_best_retest_values(${userInfo.student_id}, ${test_id})`;
          console.log('Best retest values updated');
        }
        
        // Commit transaction
        await sql`COMMIT`;
        console.log('Transaction committed successfully');
        
        console.log('=== FINAL SUBMISSION RETURN DEBUG ===');
        console.log('Returning final submission results:', {
          success: true,
          test_id,
          student_id: userInfo.student_id,
          score: Math.round(scores.overall_score),
          audio_url: audioUrl
        });
        console.log('=== END FINAL SUBMISSION RETURN DEBUG ===');
        
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: 'Speaking test submitted successfully'
          })
        };
        
      } else {
        // Initial AI processing - analyze audio
        console.log('=== AI PROCESSING DEBUG ===');
        console.log('Processing audio with AI...');
        console.log('AI processing data:', {
          test_id,
          has_audio_blob: !!audio_blob,
          audio_blob_size: audio_blob ? audio_blob.length : 'null',
          final_submission
        });
        console.log('=== END AI PROCESSING DEBUG ===');
        
        // Get test configuration
        console.log('Getting test configuration...');
        const testConfig = await sql`
          SELECT min_words, time_limit, min_duration, max_duration, passing_score
          FROM speaking_tests 
          WHERE id = ${test_id}
        `;
        
        if (testConfig.length === 0) {
          throw new Error('Speaking test not found');
        }
        
        const config = testConfig[0];
        console.log('Test configuration:', config);

        // Process audio with AssemblyAI
        console.log('Processing audio with AssemblyAI...');
        const audioBlob = Buffer.from(audio_blob, 'base64');
        const audioUrl = await uploadAudioToAssemblyAI(audioBlob);
        const assemblyAIResult = await transcribeAudioWithAssemblyAI(audioUrl);
        const transcript = assemblyAIResult.text;
        
        console.log('Transcription completed:', transcript.substring(0, 100) + '...');

        // Calculate scores
        console.log('Calculating scores...');
        const scores = await calculateSpeakingScore(transcript, config, assemblyAIResult);
        console.log('=== SCORES CALCULATION DEBUG ===');
        console.log('Scores calculated:', scores);
        console.log('Score breakdown:', {
          word_score: scores.word_score,
          grammar_score: scores.grammar_score,
          vocab_score: scores.vocab_score,
          overall_score: Math.round(scores.overall_score),
          transcript_length: transcript ? transcript.length : 0
        });
        console.log('=== END SCORES CALCULATION DEBUG ===');
        
        console.log('=== AI PROCESSING RETURN DEBUG ===');
        console.log('Returning AI processing results:', {
          success: true,
          transcript_length: transcript ? transcript.length : 0,
          scores_keys: scores ? Object.keys(scores) : [],
          overall_score: scores ? Math.round(scores.overall_score) : 'null'
        });
        console.log('=== END AI PROCESSING RETURN DEBUG ===');
        
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            message: 'Audio processed successfully',
            transcript: transcript,
            score_breakdown: {
              word_count: scores.word_count,
              grammar_mistakes: scores.grammar_mistakes,
              vocabulary_mistakes: scores.vocabulary_mistakes,
              overall_score: Math.round(scores.overall_score),
              word_score: scores.word_score,
              grammar_score: scores.grammar_score,
              vocab_score: scores.vocab_score
            }
          })
        };
      }

   
    } catch (error) {
      // Rollback transaction on error
      console.error('Error during database operations, rolling back transaction...');
      console.error('Error details:', error);
      await sql`ROLLBACK`;
      console.log('Transaction rolled back');
      throw error;
    }
    
  } catch (error) {
    console.error('Submit speaking test error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Failed to submit speaking test',
        error: error.message
      })
    };
  }
};
