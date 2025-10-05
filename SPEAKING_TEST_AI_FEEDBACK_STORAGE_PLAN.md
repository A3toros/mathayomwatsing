## Goal
Persist the complete AI evaluation payload for speaking tests (scores, feedback, improved transcript, detailed corrections, and auxiliary metrics) in a single JSON column `ai_feedback`, and surface it in the teacher view (AI Analysis) for class results.

## Scope
- Database: Add `ai_feedback` JSONB column to `speaking_test_results`.
- Backend: Persist full AI response object alongside existing fields when generating results.
- API: Include `ai_feedback` in teacher results endpoints used by `TeacherResults.jsx`.
- UI (Teacher): Render an "AI Analysis" section with structured details from `ai_feedback`.

## Data Model
Add to `speaking_test_results`:
- `ai_feedback JSONB NULL` — stores the full AI payload below.

Canonical `ai_feedback` shape (example):
```json
{
  "overall_score": 79,
  "word_count": 103,
  "feedback": "string",
  "improved_transcript": "string",
  "grammar_score": 18,
  "vocabulary_score": 15,
  "pronunciation_score": 12,
  "fluency_score": 16,
  "content_score": 18,
  "grammar_mistakes": 3,
  "vocabulary_mistakes": 2,
  "grammar_corrections": [
    { "mistake": "string", "correction": "string", "explanation": "string" }
  ],
  "vocabulary_corrections": [
    { "mistake": "string", "correction": "string", "explanation": "string" }
  ],
  "prompt": "original prompt",
  "difficulty_level": "B1"
}
```

## Database Migration (Postgres/Neon)
**File:** `database_schema_new.sql` (line 2033-2076)
```sql
ALTER TABLE speaking_test_results
  ADD COLUMN IF NOT EXISTS ai_feedback JSONB;

-- Optional index for teacher queries filtering by presence
CREATE INDEX IF NOT EXISTS idx_speaking_results_ai_feedback
  ON speaking_test_results USING GIN (ai_feedback);
```

## Backend Changes

### 1. AI Processing Function
**File:** `functions/process-speaking-audio-ai.js` (line 139-159)
- Add `ai_feedback` to the response body after AI analysis
- Include full AI payload in the JSON response

### 2. Database Save Functions
**Files:** 
- `functions/submit-speaking-test.js` (line 800-820)
- `functions/submit-speaking-test-final.js` (line 220-280)

Add `ai_feedback` column to INSERT statements:
```js
const aiFeedback = {
  overall_score: overallScore,
  word_count: analysis.word_count,
  feedback: analysis.feedback,
  improved_transcript: analysis.improved_transcript,
  grammar_score: analysis.grammar_score,
  vocabulary_score: analysis.vocabulary_score,
  pronunciation_score: analysis.pronunciation_score,
  fluency_score: analysis.fluency_score,
  content_score: analysis.content_score,
  grammar_mistakes: analysis.grammar_mistakes,
  vocabulary_mistakes: analysis.vocabulary_mistakes,
  grammar_corrections: analysis.grammar_corrections || [],
  vocabulary_corrections: analysis.vocabulary_corrections || [],
  prompt: config.prompt,
  difficulty_level: config.difficulty_level,
  ai_model: "openai/gpt-4o-mini",
  transcript
};
```

2) Persist along with existing insert/update of `speaking_test_results`:
```sql
-- example upsert skeleton
INSERT INTO speaking_test_results (..., overall_score, word_count, transcript, ai_feedback)
VALUES (..., ${overallScore}, ${analysis.word_count}, ${transcript}, ${aiFeedback}::jsonb)
ON CONFLICT (student_id, test_id, question_id)
DO UPDATE SET overall_score = EXCLUDED.overall_score,
              word_count = EXCLUDED.word_count,
              transcript = EXCLUDED.transcript,
              ai_feedback = EXCLUDED.ai_feedback,
              updated_at = NOW();
```

3) Include `ai_feedback` in the function’s JSON response for immediate UI use.

## API Changes
**File:** `functions/get-teacher-student-results.js` (line 499-528)
- Add `ai_feedback` to the SELECT statement for speaking test results
- Include `ai_feedback` in the response for teacher results display

## UI (Teacher) — AI Analysis

### 1. Teacher Results Table
**File:** `src/teacher/TeacherResults.jsx` (line 1508-1512)
- Modify "View Audio" button to "View Audio / AI Analysis"
- Pass `ai_feedback` data to the modal

### 2. Speaking Test Review Modal
**File:** `src/components/test/SpeakingTestReview.jsx` (line 148-168)
- "AI Analysis" tab already exists (line 152)
- Add compact AI feedback rendering when `result.ai_feedback` exists:
  - Collapsible section with summary scores (Grammar/Vocabulary/Pronunciation/Fluency/Content) in a small grid
  - Expandable feedback text (truncated by default)
  - Collapsible "Improved transcript" and "Corrections" sections
  - Use accordion/collapse UI to minimize space usage

Minimal shape check:
```js
const ai = result.ai_feedback || null;
if (ai) {
  // render analysis UI
}
```

## Fetch Strategy (Performance)
- Do not prefetch large blobs or full AI payloads for all rows.
- In the class results table, render a "View audio / AI Analysis" button per attempt.
- Only when the teacher clicks this button:
  1) Fetch the audio URL/stream for that result.
  2) Fetch (or expand) the `ai_feedback` JSON if not already present in the row payload.
- Backend endpoints:
  - Keep results listing lightweight; include a boolean `has_ai_feedback` and small summary (overall_score, word_count) only.
  - Provide a detail endpoint (e.g., `get-speaking-result-detail?id=<result_id>`) that returns: `audio_url` (or signed URL) and full `ai_feedback`.
- UI flow:
  - On click, open a side panel/modal with an audio player and the AI Analysis panel populated from `ai_feedback`.
  - Cache the fetched detail in memory to avoid refetch on repeated opens.

## UI Design — Compact Layout
- Use collapsible sections/accordions for AI Analysis to minimize vertical space.
- Show summary scores in a compact grid (e.g., 2x3 or 3x2).
- Truncate long feedback text with "Show more" toggle.
- Group corrections in collapsible lists.
- Consider a tabbed interface: "Audio" | "AI Analysis" | "Details".

## Backfill (Optional)
For recent results that have transcript and scores, you may generate a minimal `ai_feedback` from existing columns to avoid empty panels.

## Rollout Notes
- Migration can be applied online (adds column only).
- Changes are backward compatible: UI and APIs should treat `ai_feedback` as optional.
- Log and monitor payload size; JSONB column is suitable for this data.

## Validation
- E2E: Complete a speaking test; verify DB row contains `ai_feedback` JSON populated; teacher view shows "AI Analysis" with all details.


