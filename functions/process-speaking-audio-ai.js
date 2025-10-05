const { neon } = require('@neondatabase/serverless');
const axios = require('axios');

// Environment variables
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_BASE_URL = process.env.ASSEMBLYAI_BASE_URL || 'https://api.assemblyai.com';
const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check';
const LANGUAGETOOL_LANGUAGE = process.env.LANGUAGETOOL_LANGUAGE || 'en-US';
const LANGUAGETOOL_LEVEL = process.env.LANGUAGETOOL_LEVEL || 'default';

// Scoring configuration
const SPEAKING_SCORE_CONFIG = {
  WORD_WEIGHT: 0.30,
  GRAMMAR_WEIGHT: 0.40,
  VOCAB_WEIGHT: 0.30,
  POINTS_PER_GRAMMAR_ERROR: 2,
  POINTS_PER_VOCAB_ERROR: 1
};

const sql = neon(process.env.NEON_DATABASE_URL);

exports.handler = async (event, context) => {
  console.log('=== AI FEEDBACK PROCESSING ===');
  
  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { test_id, audio_blob } = body;

    console.log('AI Feedback request data:', {
      test_id,
      has_audio_blob: !!audio_blob,
      audio_blob_size: audio_blob ? audio_blob.length : 0
    });

    // Get test configuration
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

    // Process audio with AI
    console.log('Processing audio with AssemblyAI...');
    const transcript = await transcribeAudioWithAssemblyAI(audio_blob);
    console.log('Transcript:', transcript);

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Your speech was not recognized, please speak louder');
    }

    // Analyze grammar with LanguageTool
    console.log('Analyzing grammar with LanguageTool...');
    const grammarAnalysis = await analyzeGrammarWithLanguageTool(transcript);
    console.log('Grammar analysis:', grammarAnalysis);

    // Analyze vocabulary with LanguageTool
    console.log('Analyzing vocabulary with LanguageTool...');
    const vocabAnalysis = await analyzeVocabularyWithLanguageTool(transcript);
    console.log('Vocabulary analysis:', vocabAnalysis);

    // Calculate scores
    const scores = calculateSpeakingScore(transcript, grammarAnalysis, vocabAnalysis, config);
    console.log('Calculated scores:', scores);

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
        transcript,
        score_breakdown: scores,
        grammar_analysis: grammarAnalysis,
        vocab_analysis: vocabAnalysis
      })
    };

  } catch (error) {
    console.error('AI Feedback processing error:', error);
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

async function transcribeAudioWithAssemblyAI(audioBlob) {
  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBlob, 'base64');
    
    // Upload audio to AssemblyAI
    const uploadResponse = await axios.post(`${ASSEMBLYAI_BASE_URL}/v2/upload`, audioBuffer, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/octet-stream'
      }
    });

    const audioUrl = uploadResponse.data.upload_url;
    console.log('Audio uploaded to AssemblyAI:', audioUrl);

    // Start transcription
    const transcriptionResponse = await axios.post(`${ASSEMBLYAI_BASE_URL}/v2/transcript`, {
      audio_url: audioUrl,
      language_detection: true,
      punctuate: true,
      format_text: true
    }, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const transcriptId = transcriptionResponse.data.id;
    console.log('Transcription started, ID:', transcriptId);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(`${ASSEMBLYAI_BASE_URL}/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY
        }
      });

      const status = statusResponse.data.status;
      console.log(`Transcription status: ${status} (attempt ${attempts + 1})`);

      if (status === 'completed') {
        return statusResponse.data.text;
      } else if (status === 'error') {
        throw new Error(`Transcription failed: ${statusResponse.data.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Transcription timeout');

  } catch (error) {
    console.error('AssemblyAI error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

async function analyzeGrammarWithLanguageTool(text) {
  try {
    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('language', LANGUAGETOOL_LANGUAGE);
    formData.append('level', LANGUAGETOOL_LEVEL);
    
    const response = await fetch(LANGUAGETOOL_URL, {
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

    const matches = result.matches || [];
    
    // Calculate grammar score
    const totalErrors = matches.length;
    const grammarScore = Math.max(0, 100 - (totalErrors * SPEAKING_SCORE_CONFIG.POINTS_PER_GRAMMAR_ERROR));
    
    // Extract detailed corrections
    const detailedCorrections = matches.map(match => ({
      original: match.context.text.substring(match.context.offset, match.context.offset + match.context.length),
      suggested: match.replacements?.[0]?.value || '',
      message: match.message,
      shortMessage: match.shortMessage,
      rule: match.rule.id,
      category: match.rule.category.id,
      severity: match.rule.issueType,
      context: {
        before: match.context.text.substring(0, match.context.offset),
        problem: match.context.text.substring(match.context.offset, match.context.offset + match.context.length),
        after: match.context.text.substring(match.context.offset + match.context.length)
      },
      explanation: match.rule.description
    }));

    return {
      score: grammarScore,
      total_errors: totalErrors,
      detailed_corrections: detailedCorrections,
      raw_matches: matches
    };

  } catch (error) {
    console.error('LanguageTool grammar analysis error:', error);
    return {
      score: 0,
      total_errors: 999,
      detailed_corrections: [],
      raw_matches: [],
      error: error.message
    };
  }
}

async function analyzeVocabularyWithLanguageTool(text) {
  try {
    const formData = new URLSearchParams();
    formData.append('text', text);
    formData.append('language', LANGUAGETOOL_LANGUAGE);
    formData.append('level', LANGUAGETOOL_LEVEL);
    
    const response = await fetch(LANGUAGETOOL_URL, {
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

    const matches = result.matches || [];
    
    // Filter for vocabulary/style-related issues
    const vocabMatches = matches.filter(match => 
      match.rule.category.id === 'STYLE' || 
      match.rule.category.id === 'REDUNDANCY' ||
      match.rule.category.id === 'REPETITIONS'
    );

    // Count unique words
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const uniqueWords = new Set(words);
    
    // Manual detection of word repetitions
    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    const repeatedWords = Object.entries(wordCounts)
      .filter(([word, count]) => count > 2)
      .map(([word, count]) => ({ word, count }));

    // Calculate vocabulary score using new formula
    const vocabWarnings = vocabMatches.length + repeatedWords.length;
    const vocabScore = uniqueWords.size > 0 
      ? Math.max(0, (uniqueWords.size - vocabWarnings) / uniqueWords.size * 100)
      : 0;

    return {
      score: vocabScore,
      unique_words: uniqueWords.size,
      total_words: words.length,
      vocab_warnings: vocabWarnings,
      repeated_words: repeatedWords,
      style_matches: vocabMatches,
      raw_matches: matches
    };

  } catch (error) {
    console.error('LanguageTool vocabulary analysis error:', error);
    return {
      score: 0,
      unique_words: 0,
      total_words: 0,
      vocab_warnings: 999,
      repeated_words: [],
      style_matches: [],
      raw_matches: [],
      error: error.message
    };
  }
}

function calculateSpeakingScore(transcript, grammarAnalysis, vocabAnalysis, config) {
  const wordCount = transcript.split(/\s+/).length;
  
  // Word Score: 30 points max, based on word count vs minimum
  const wordScore = Math.min(30, (wordCount / config.min_words) * 30);
  
  // Grammar Score: 40 points max, deduct 2 points per error
  const grammarScore = Math.max(0, 40 - (grammarAnalysis.total_errors * 2));
  
  // Vocabulary Score: 30 points max, based on quality
  const vocabScore = Math.min(30, (vocabAnalysis.score / 100) * 30);
  
  const overallScore = Math.round(wordScore + grammarScore + vocabScore);

  return {
    word_count: wordCount,
    word_score: Math.round(wordScore),
    grammar_score: Math.round(grammarScore),
    vocab_score: Math.round(vocabScore),
    overall_score: overallScore,
    passed: overallScore >= config.passing_score
  };
}
