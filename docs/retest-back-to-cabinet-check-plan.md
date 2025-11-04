# Retest “Back to Cabinet” Check Plan (Web App)

Goal
- When user presses Back to Cabinet on Test Results for a RETEST, show a spinner while we check retest state locally, then navigate with correct button state:
  - Start Retest: retest_available is true, attempts remain, and student did not pass
  - ✓ Completed: attempts exhausted OR student passed (even if attempts remain)

Constraints
- Web app only
- No API calls; rely on local data (results + localStorage)
- Do NOT alter regular tests flow

Signals to Use (Local Only)
- retest_available: supplied by results/test context (preferred). If absent, infer from presence of attempts meta
- attempts meta (localStorage): `retest_attempts_{studentId}_{testType}_{testId}` JSON → { used, max }
- completion keys: `test_completed_{studentId}_{testType}_{testId}` (string 'true')
- pass status (results in memory): prefer `passed`; fallback to `best_retest_percentage || percentage || percentage_score >= 60`

Flow
1) On Back to Cabinet click in Test Results:
   - If retest_available === true (preferred) OR attempts meta exists → retest flow; else regular flow
2) Retest flow steps:
   - Show spinner overlay immediately
   - Compute attemptsLeft:
     - Read attempts meta; if present → attemptsLeft = max - used (>=0); else attemptsLeft = null
   - Determine pass status from in-memory results for the specific test
   - Decision:
     - If (attemptsLeft !== null && attemptsLeft > 0 && !passed) → keep Start Retest (no completion mark)
     - Else → Mark completion locally: set `test_completed_{studentId}_{type}_{id}` = 'true`
   - Keep spinner visible for a minimum time (e.g., 350–500ms) to avoid flash
   - Navigate back to cabinet
3) Regular flow steps:
   - No spinner or checks added; just navigate

UI Integration Points
- Test Results component
  - Wrap Back to Cabinet click with retest-aware handler
  - Render small centered overlay spinner (modal) while checking
- Student Cabinet
  - No changes required; it already reads completion keys and renders ✓ Completed vs Start Retest

Helper Function (Optional)
- Encapsulate the retest decision logic. Inputs: { testType, testId, studentId, retestAvailable (optional), currentResult (optional) }
- Side-effect: write completion key when applicable

Edge Cases
- Missing results entry: assume not passed; if attempts meta unknown, prefer Start Retest
- Picture/matching naming must match cabinet keys; use the same identifier as Active Tests (`matching_type`)
- If both passed and attempts remain → show ✓ Completed per requirement

Spinner Spec
- Overlay covers viewport with light dim background (e.g., black/20)
- Content: small spinner + text “Preparing cabinet…”
- Display at least 350ms even if checks finish faster
- Only for retest flow

Acceptance Criteria
- For retests, pressing Back to Cabinet shows spinner and returns with correct state without reload
- Regular tests remain instant with no spinner
- No network calls are made during this process
