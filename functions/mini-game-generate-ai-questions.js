const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');
const { OpenAI } = require('openai');
require('dotenv').config();

const sql = neon(process.env.NEON_DATABASE_URL);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.URL || 'https://mathayomwatsing.netlify.app',
    'X-Title': 'Mathayom Watsing Testing System'
  }
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  try {
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: 'Teacher access required' })
      };
    }

    const body = JSON.parse(event.body);
    const { subject, grade, topic, numQuestions, subjectName } = body;

    if (!subject || !grade || !topic || !numQuestions) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: subject, grade, topic, numQuestions'
        })
      };
    }

    const isMathOrScience = subjectName && (
      subjectName.toLowerCase().includes('math') || 
      subjectName.toLowerCase().includes('mathematics') ||
      subjectName.toLowerCase().includes('science') ||
      subjectName.toLowerCase().includes('physics') ||
      subjectName.toLowerCase().includes('chemistry')
    );

    console.log('=== AI QUESTION GENERATION DEBUG ===');
    console.log('Request parameters:', {
      subject: subjectName || subject,
      grade,
      topic,
      numQuestions,
      isMathOrScience
    });

    const questions = await generateQuestionsWithGPT4(
      subjectName || subject,
      grade,
      topic,
      numQuestions,
      isMathOrScience
    );

    console.log('Generated questions count:', questions?.length);
    
    // Log sample questions with full content
    console.log('[Return] Sample questions (first 3):');
    questions.slice(0, 3).forEach((q, idx) => {
      console.log(`  Question ${idx + 1} (ID: ${q.question_id}):`, {
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer
      });
    });
    
    const responseBody = {
      success: true,
      questions: questions
    };
    
    console.log('[Return] Response body structure:', {
      success: responseBody.success,
      questionsCount: responseBody.questions?.length,
      firstQuestionId: responseBody.questions?.[0]?.question_id
    });
    
    console.log('=== END AI QUESTION GENERATION DEBUG ===');

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(responseBody)
    };
  } catch (error) {
    console.error('=== AI QUESTION GENERATION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      status: error?.status,
      code: error?.code,
      name: error?.name
    });
    console.error('=== END ERROR DEBUG ===');

    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate questions',
        message: error.message
      })
    };
  }
};

async function generateQuestionsWithGPT4(subject, grade, topic, numQuestions, useKaTeX) {
  const maxAttempts = 3;
  let lastError = null;

  const mathInstructions = useKaTeX ? `
IMPORTANT FOR MATH/SCIENCE QUESTIONS:
- Use KaTeX syntax for all mathematical expressions
- Inline math: Use $...$ (e.g., $x^2 + 5 = 10$)
- Display math: Use $$...$$ for equations on their own line
- Examples:
  * Fractions: $\\frac{a}{b}$ or $\\frac{numerator}{denominator}$
  * Powers: $x^2$, $y^{3}$
  * Subscripts: $H_2O$, $CO_2$
  * Square roots: $\\sqrt{x}$, $\\sqrt[3]{8}$
  * Greek letters: $\\alpha$, $\\beta$, $\\pi$, $\\theta$
  * Operators: $\\times$, $\\div$, $\\pm$, $\\leq$, $\\geq$
- Always wrap mathematical expressions in $...$ or $$...$$
- For question text, use inline math: $expression$
- For complex equations, use display math: $$expression$$
` : '';

  // Build prompt similar to speaking test pattern - concise and direct
  const prompt = `You are an expert educational content creator. Always respond with valid JSON only.

Generate ${numQuestions} multiple-choice questions for ${grade}th grade ${subject} on topic: "${topic}".

${mathInstructions}

REQUIREMENTS:
- Each question: exactly 4 options (A, B, C, D), only ONE correct
- Appropriate for ${grade}th grade level
- Test understanding of: "${topic}"
- Engaging, educational, varied difficulty
- Distractors: plausible but clearly incorrect

${useKaTeX ? 'MATH/SCIENCE: Use KaTeX syntax. Inline: $expression$. Display: $$expression$$' : ''}

RETURN JSON:
{
  "questions": [
    {
      "question_id": 1,
      "question_text": "Question text${useKaTeX ? ' (use $...$ for math)' : ''}",
      "option_a": "Option A",
      "option_b": "Option B",
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_answer": "A"
    }
  ]
}

RULES:
- question_id: sequential from 1
- correct_answer: exactly "A", "B", "C", or "D"
- All fields required
${useKaTeX ? '- Math expressions: use $...$ or $$...$$' : ''}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[GPT Request] Attempt ${attempt}/${maxAttempts}`);
      console.log('[GPT Request] Prompt length:', prompt.length);
      console.log('[GPT Request] Prompt preview:', prompt.substring(0, 200) + '...');

      // Use same pattern as speaking test - simpler message structure, no max_tokens limit
      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      console.log('[GPT Response] Status: Success');
      console.log('[GPT Response] Model:', response.model);
      console.log('[GPT Response] Usage:', {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens
      });

      const content = response.choices[0].message.content;
      console.log('[GPT Response] Content length:', content?.length);
      console.log('[GPT Response] Content preview:', content?.substring(0, 300) + '...');

      const result = JSON.parse(content);
      console.log('[GPT Response] Parsed JSON keys:', Object.keys(result));
      console.log('[GPT Response] Questions array length:', result.questions?.length);

      if (!result.questions || !Array.isArray(result.questions)) {
        throw new Error('Invalid response format: missing questions array');
      }

      if (result.questions.length !== numQuestions) {
        console.warn(`[Validation] Generated ${result.questions.length} questions, expected ${numQuestions}`);
      }

      // Validate each question
      console.log('[Validation] Validating questions...');
      for (let i = 0; i < result.questions.length; i++) {
        const q = result.questions[i];
        console.log(`[Validation] Question ${i + 1}:`, {
          has_id: !!q.question_id,
          has_text: !!q.question_text,
          has_options: !!(q.option_a && q.option_b && q.option_c && q.option_d),
          correct_answer: q.correct_answer
        });

        if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
          throw new Error(`Question ${i + 1} is missing required fields`);
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
          throw new Error(`Question ${i + 1} has invalid correct_answer: ${q.correct_answer}`);
        }
        if (!q.question_id) {
          q.question_id = i + 1;
        }
      }

      console.log('[Validation] All questions validated successfully');
      
      // Log sample questions for debugging
      console.log('[Sample Questions] First 3 questions:');
      result.questions.slice(0, 3).forEach((q, idx) => {
        console.log(`  Question ${idx + 1}:`, {
          id: q.question_id,
          text: q.question_text?.substring(0, 100) + '...',
          options: {
            A: q.option_a?.substring(0, 50) + '...',
            B: q.option_b?.substring(0, 50) + '...',
            C: q.option_c?.substring(0, 50) + '...',
            D: q.option_d?.substring(0, 50) + '...'
          },
          correct: q.correct_answer
        });
      });
      
      console.log('[Return] Returning questions array with length:', result.questions.length);
      return result.questions;
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.code;
      const isTimeout = err?.name === 'TimeoutError' || err?.code === 'ETIMEDOUT';
      const isRetryableStatus = [408, 409, 425, 429, 500, 502, 503, 504].includes(Number(status));
      const shouldRetry = attempt < maxAttempts && (isRetryableStatus || isTimeout || status === undefined);

      console.error(`[GPT Error] Attempt ${attempt}/${maxAttempts} failed:`, {
        status,
        code: err?.code,
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.substring(0, 500)
      });

      console.warn(`[GPT Retry] Will retry: ${shouldRetry}`, {
        isRetryableStatus,
        isTimeout,
        status,
        attempt,
        maxAttempts
      });

      if (!shouldRetry) {
        throw err;
      }

      // Use same backoff pattern as speaking test
      const backoffMs = Math.min(1000, 250 * Math.pow(2, attempt - 1));
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError || new Error('Failed to generate questions after all retries');
}

