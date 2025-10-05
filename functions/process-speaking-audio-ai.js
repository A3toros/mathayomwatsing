const { neon } = require('@neondatabase/serverless');
const axios = require('axios');
const OpenAI = require('openai');

// Import helper functions directly (avoiding path issues)
function getCEFRDescription(level) {
  const descriptions = {
    'A1': 'Beginner - Basic vocabulary, simple sentences',
    'A2': 'Elementary - Everyday vocabulary, present/past tenses', 
    'B1': 'Intermediate - Varied vocabulary, complex sentences',
    'B2': 'Upper-Intermediate - Advanced vocabulary, sophisticated structures',
    'C1': 'Advanced - Nuanced vocabulary, complex discourse',
    'C2': 'Proficiency - Native-like fluency and accuracy'
  };
  return descriptions[level] || descriptions['B1'];
}

function getScoringGuidelines(level) {
  const guidelines = {
    'A1': `A1 LEVEL EXPECTATIONS:
- Grammar: Basic present tense, simple sentences (I am, I like, I have)
- Vocabulary: Basic words (good, bad, big, small, happy, sad)
- Pronunciation: Clear enough to understand basic words
- Fluency: Slow but understandable, many pauses acceptable
- Content: Simple responses to basic questions`,
    
    'A2': `A2 LEVEL EXPECTATIONS:
- Grammar: Present/past tenses, simple future (will), basic conditionals
- Vocabulary: Everyday words, basic adjectives, common verbs
- Pronunciation: Generally clear, some errors acceptable
- Fluency: Steady pace, some hesitation acceptable
- Content: Clear responses to familiar topics`,
    
    'B1': `B1 LEVEL EXPECTATIONS:
- Grammar: Present/past/future, conditionals, passive voice, reported speech
- Vocabulary: Varied vocabulary, some idiomatic expressions
- Pronunciation: Clear pronunciation, minor errors acceptable
- Fluency: Natural pace, occasional hesitation
- Content: Detailed responses with examples and explanations`,
    
    'B2': `B2 LEVEL EXPECTATIONS:
- Grammar: Complex tenses, subjunctive, advanced conditionals, perfect tenses
- Vocabulary: Advanced vocabulary, synonyms, collocations
- Pronunciation: Clear pronunciation, native-like intonation
- Fluency: Natural pace, minimal hesitation
- Content: Sophisticated responses with analysis and evaluation`,
    
    'C1': `C1 LEVEL EXPECTATIONS:
- Grammar: Perfect grammar, complex structures, nuanced tense usage
- Vocabulary: Sophisticated vocabulary, precise word choice, idioms
- Pronunciation: Near-native pronunciation and intonation
- Fluency: Natural, flowing speech with minimal hesitation
- Content: Complex, nuanced responses with critical thinking`,
    
    'C2': `C2 LEVEL EXPECTATIONS:
- Grammar: Perfect grammar, native-like structures
- Vocabulary: Expert-level vocabulary, precise terminology
- Pronunciation: Native-like pronunciation and intonation
- Fluency: Natural, flowing speech without hesitation
- Content: Expert-level responses with sophisticated analysis`
  };
  return guidelines[level] || guidelines['B1'];
}

// Environment variables
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_BASE_URL = process.env.ASSEMBLYAI_BASE_URL || 'https://api.assemblyai.com';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize OpenAI client for GPT-4o Mini
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
});

const sql = neon(process.env.NEON_DATABASE_URL);

exports.handler = async (event, context) => {
  console.log('=== AI FEEDBACK PROCESSING WITH GPT-4O MINI ===');
  
  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { test_id, audio_blob, question_id } = body;

    console.log('AI Feedback request data:', {
      test_id,
      question_id,
      has_audio_blob: !!audio_blob,
      audio_blob_size: audio_blob ? audio_blob.length : 0
    });

    // Get test configuration and question details
    const testConfig = await sql`
      SELECT st.min_words, st.time_limit, st.min_duration, st.max_duration, st.passing_score,
             stq.prompt, stq.difficulty_level
      FROM speaking_tests st
      LEFT JOIN speaking_test_questions stq ON st.id = stq.test_id
      WHERE st.id = ${test_id} AND stq.id = ${question_id}
    `;

    if (testConfig.length === 0) {
      throw new Error('Speaking test or question not found');
    }

    const config = testConfig[0];
    console.log('Test configuration:', config);

    // Process audio with AssemblyAI for transcription
    console.log('Processing audio with AssemblyAI...');
    const transcript = await transcribeAudioWithAssemblyAI(audio_blob);
    console.log('Transcript:', transcript);

    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Your speech was not recognized, please speak louder');
    }

    // Analyze with GPT-4o Mini
    console.log('Analyzing with GPT-4o Mini...');
    const analysis = await analyzeWithGPT4oMini(transcript, config.prompt, config.difficulty_level);
    console.log('GPT-4o Mini analysis:', analysis);

    // Calculate overall score
    const overallScore = calculateOverallScore(analysis);
    console.log('Overall score:', overallScore);

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
        // Use existing columns only
        grammar_mistakes: analysis.grammar_mistakes,
        vocabulary_mistakes: analysis.vocabulary_mistakes,
        word_count: analysis.word_count,
        overall_score: overallScore,
        // Store detailed feedback in transcript or as JSON in existing fields
        feedback: analysis.feedback,
        improved_transcript: analysis.improved_transcript,
        grammar_corrections: analysis.grammar_corrections || [],
        vocabulary_corrections: analysis.vocabulary_corrections || [],
        // Add individual category scores for frontend display
        grammar_score: analysis.grammar_score,
        vocabulary_score: analysis.vocabulary_score,
        pronunciation_score: analysis.pronunciation_score,
        fluency_score: analysis.fluency_score,
        content_score: analysis.content_score,
        passed: overallScore >= config.passing_score
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

async function analyzeWithGPT4oMini(transcript, prompt, difficultyLevel) {
  try {
    const analysisPrompt = `
You are an expert ESL speaking test evaluator. Analyze this student's response:

PROMPT: "${prompt}"
STUDENT RESPONSE: "${transcript}"
STUDENT LEVEL: ${difficultyLevel} (${getCEFRDescription(difficultyLevel)})

IMPORTANT: Evaluate the student based on their CURRENT LEVEL (${difficultyLevel}). 
- For A1 students: Expect basic vocabulary, simple present tense, basic sentence structure
- For A2 students: Expect everyday vocabulary, present/past tenses, simple complex sentences
- For B1 students: Expect varied vocabulary, conditional sentences, some complex structures
- For B2 students: Expect advanced vocabulary, sophisticated grammar, complex discourse
- For C1 students: Expect nuanced vocabulary, complex grammar, native-like structures
- For C2 students: Expect expert-level vocabulary, perfect grammar, native-like fluency

CRITICAL: Focus ONLY on grammar, vocabulary, pronunciation, fluency, and content accuracy. 
- Do NOT make corrections based on inclusivity, diversity, or political correctness
- Do NOT suggest changes for social or cultural reasons
- Only correct actual grammar errors, vocabulary misuse, or clarity issues
- "A person" vs "people" is NOT a grammar error - both are grammatically correct
- Focus on language learning, not social commentary

Evaluate on these 5 categories and return JSON:
{
  "grammar_score": 0-25,        // Grammar accuracy appropriate for ${difficultyLevel} level
  "vocabulary_score": 0-20,     // Word choice and variety appropriate for ${difficultyLevel} level
  "pronunciation_score": 0-15,  // Clarity and accuracy appropriate for ${difficultyLevel} level
  "fluency_score": 0-20,        // Pace, pauses, flow appropriate for ${difficultyLevel} level
  "content_score": 0-20,        // How well they addressed the prompt (appropriate for ${difficultyLevel} level)
  "grammar_mistakes": number,   // Count of grammar errors for ${difficultyLevel} level
  "vocabulary_mistakes": number, // Count of vocabulary issues for ${difficultyLevel} level
  "word_count": number,         // Total words spoken
  "feedback": "string",         // Teacher-style feedback message appropriate for ${difficultyLevel} level
  "improved_transcript": "string", // Corrected version of the transcript with grammar and vocabulary improvements
  "grammar_corrections": [      // Array of specific grammar mistakes with explanations
    {
      "mistake": "original incorrect phrase",
      "correction": "corrected phrase", 
      "explanation": "why this is wrong and how to fix it"
    }
  ],
  "vocabulary_corrections": [   // Array of specific vocabulary issues with explanations
    {
      "mistake": "original word/phrase",
      "correction": "better word/phrase",
      "explanation": "why this is better and when to use it"
    }
  ]
}

SCORING GUIDELINES FOR ${difficultyLevel}:
${getScoringGuidelines(difficultyLevel)}
`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: analysisPrompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('GPT-4o Mini analysis error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

function calculateOverallScore(analysis) {
  const { 
    grammar_score, 
    vocabulary_score, 
    pronunciation_score, 
    fluency_score, 
    content_score 
  } = analysis;
  
  // Sum all category scores (already weighted by GPT-4o Mini)
  const totalScore = grammar_score + vocabulary_score + pronunciation_score + 
                    fluency_score + content_score;
  
  return Math.max(0, Math.min(100, Math.round(totalScore)));
}