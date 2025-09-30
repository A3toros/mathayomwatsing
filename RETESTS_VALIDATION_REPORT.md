## Retests Feature – Backend/Frontend Validity Review

Scope: Newly added/updated code paths for retests and related admin actions.

### New/Updated Backend Functions
- `functions/create-retest-assignment.js`
- `functions/get-retest-eligible-students.js`
- `functions/get-retest-assignments.js`
- `functions/get-retest-targets.js`
- `functions/cancel-retest-assignment.js`
- Updated submission handlers with retest support:
  - `functions/submit-multiple-choice-test.js`
  - `functions/submit-true-false-test.js`
  - `functions/submit-input-test.js`
  - `functions/submit-matching-type-test.js`
  - `functions/submit-word-matching-test.js`
  - `functions/submit-fill-blanks-test.js`
  - `functions/submit-drawing-test.js`
- Admin actions:
  - `functions/check-overdue-assignments.js`
  - `functions/refresh-class-summary-semester.js`

### Frontend Additions
- `src/services/retestService.js` – wrappers for retest endpoints
- `src/teacher/TeacherCabinet.jsx` – added hooks to load retests/targets; class summary fetch already semester-based
- `src/admin/AdminCabinet.jsx` – added buttons for refresh view and overdue assignment checks (responsive layout)

---

### Security & Auth
- All new retest endpoints validate JWT via `validateToken` and restrict to `teacher` or `admin`. Good.
- `create-retest-assignment` uses `teacher_id` from token (or admin-provided), but does not yet verify ownership of the original test. Risk: a teacher could create a retest for another teacher’s test if they guess IDs. Recommendation: enforce ownership by checking `(test_type, test_id)` belongs to `effectiveTeacherId` before insert.
- Student submission endpoints continue to verify `student` role; retest flow verifies the student is a target within an active window and under `max_attempts`. Good.

### Data Model & Migrations
- File `retests_schema.sql` introduces:
  - `retest_assignments` (policy/window/attempts, keyed by `(test_type, test_id)`)
  - `retest_targets` (per-student targeting, attempt_count/status)
  - Helpful indexes, partial active-window index
- Important: Submission handlers now optionally insert `retest_assignment_id` and `attempt_number` into result tables:
  - `multiple_choice_test_results`, `true_false_test_results`, `input_test_results`, `matching_type_test_results`, `word_matching_test_results`, `fill_blanks_test_results`, `drawing_test_results`.
  - These columns must exist to avoid runtime SQL errors. In `retests_schema.sql`, the ALTER TABLE statements are currently commented out. Action required: run those ALTERs (or remove the conditional columns in code and rely solely on `test_attempts`).
- Cross-test attempt tracking uses `test_attempts` upserts everywhere (good for analytics and eligibility).

### Business Logic Validity
- Retest creation: Accepts `window_start`, `window_end`, `max_attempts`, `scoring_policy`, `passing_threshold`. Basic validation present.
- Eligibility (`get-retest-eligible-students`): Uses `test_attempts` best percentage per student vs threshold. Valid for MVP; if `test_attempts` not fully backfilled for older tests, may miss some students. Consider recompute or joining result tables for historical.
- Submissions:
  - Validates retest window and `max_attempts` before recording attempt.
  - Computes `attempt_number = attempt_count + 1`.
  - Upserts into `test_attempts` with score/percentage when available.
  - Updates `retest_targets.status`: PASSED if percentage ≥ 50 else FAILED (drawing sets IN_PROGRESS until score exists). Note: assignment-specific `passing_threshold` is not used here yet; logic uses fixed 50. Recommendation: fetch threshold from `retest_assignments` for status.
- Drawing flow: Handles unscored submit by marking retest target IN_PROGRESS; on later manual scoring, we currently do not update retest status in `update-drawing-test-score.js`. Recommendation: extend `update-drawing-test-score.js` to compute percentage, update `test_attempts`, and set target status PASSED/FAILED if tied to a retest.

### API Contracts & CORS
- All endpoints include CORS and handle OPTIONS. Origins vary (`*` vs env var). Unify to `ALLOWED_ORIGIN` if needed.
- Netlify function paths match frontend service wrappers.

### Frontend Integration Validity
- `retestService.js` aligns with endpoints; uses `tokenManager` for auth.
- `TeacherCabinet.jsx`: added loaders for retests and targets; no UI presented (safe). Class summary already points to `get-class-summary-semester`.
- `AdminCabinet.jsx`: new buttons call refresh and overdue endpoints; notifications implemented; responsive layout using `flex flex-wrap` + `whitespace-nowrap`. Good.

### Performance Considerations
- Retest endpoints do simple queries; indexes exist for common scans.
- Semester view refresh triggered manually by admin; optional smart-refresh in teacher UI remains a future improvement.

### Edge Cases & Risks
- Missing result-table columns for `retest_assignment_id` and `attempt_number` will cause insert errors. Must run ALTERs in `retests_schema.sql` (uncomment and apply) before deploying.
- Ownership check missing in `create-retest-assignment`. Add validation before creating targets.
- `get-retest-eligible-students` assumes `test_attempts` completeness; if missing, recompute or union best-of from result tables.
- `cancel-retest-assignment` sets `window_end` to now; consider also updating open targets to EXPIRED for clarity.
- For drawing: no linkage from `update-drawing-test-score.js` to retest/update of `test_attempts`. Add logic to update attempt and `retest_targets` status when score is entered.
- Default pass threshold hard-coded to 50 in submission handlers; should use `passing_threshold` from the related `retest_assignments` row.

### Quick Test Checklist
1) Run `retests_schema.sql` including the commented ALTERs for result tables.
2) Create a retest (POST `create-retest-assignment`) with a small window (now+1h) and 1–2 students.
3) Verify `get-retest-assignments` shows counts, and `get-retest-targets` lists targets.
4) Submit a retest attempt for one student with payload including `retest_assignment_id`.
5) Confirm:
   - Result row inserted
   - `test_attempts` upserted
   - `retest_targets.attempt_count` incremented and `status` updated
6) For drawing:
   - Submit unscored attempt → `status` becomes IN_PROGRESS
   - After teacher scoring, ensure status becomes PASSED/FAILED once score is available (requires enhancing `update-drawing-test-score.js`).

### Required Follow-ups (Recommended)
- DB: Apply ALTERs to add `retest_assignment_id` and `attempt_number` to all result tables used.
- Security: Enforce ownership in `create-retest-assignment` for `(test_type, test_id)`.
- Threshold: Use `retest_assignments.passing_threshold` instead of fixed 50.
- Drawing score update: Extend `update-drawing-test-score.js` to update `test_attempts` and retest status when grading.
- Optional: Add smart refresh call in teacher UI when cache is stale.

Overall: The design is coherent and consistent with the plan. With the noted migrations and minor enhancements, it should function correctly and be robust in production.


