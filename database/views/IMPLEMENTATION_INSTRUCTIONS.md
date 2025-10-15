## Implementation Instructions: Switch Functions to Views

Scope: Update read-only Netlify functions to use views for SELECTs. Keep DML as-is.

### Functions and Exact Changes

1) functions/get-student-active-tests.js
   - Replace user-grade/class lookup + per-type joins with:
     - `SELECT * FROM student_active_tests_view WHERE student_id = ${student_id}`
   - Remove subsequent per-test table lookups for `test_name`, `num_questions`, teacher, subject; ensure the view exposes these columns (already in `student_active_tests_view.sql`).
   - Keep retest target fetch if not included; otherwise use view-provided fields.

2) functions/get-teacher-active-tests.js
   - Replace all per-type UNION SELECTs with:
     - Admin: `SELECT * FROM teacher_active_tests_view ORDER BY assigned_at DESC`.
     - Teacher: `SELECT * FROM teacher_active_tests_view WHERE teacher_id = ${teacherId} ORDER BY assigned_at DESC`.
   - Remove repeated EXTRACT days_remaining calc if the view exposes window; optionally compute days_remaining in SQL within the view later.

3) functions/get-test-assignments.js
   - Replace per-type queries with:
     - `SELECT * FROM test_assignments_comprehensive_view WHERE test_id = ${testId}` (and optional filters by test_type, grade, class, subject_id).
   - Remove enrichment queries for test names; the view provides `test_name`.

4) functions/get-all-tests.js
   - Use: `SELECT * FROM all_tests_comprehensive_view [WHERE teacher_id = ${teacherId}]`.

5) functions/get-student-test-results.js
   - Use: `SELECT * FROM student_test_results_view WHERE student_id = ${studentId}`.

6) functions/get-teacher-student-results.js
   - Use: `SELECT * FROM teacher_student_results_view WHERE teacher_id = ${teacherId}`.

7) functions/get-test-results.js
   - Use: `SELECT * FROM all_test_results_view WHERE test_id = ${testId} [AND test_type = ${testType}]`.

8) functions/get-test-performance.js
   - Ensure query is against `test_performance_by_test` (present in migration):
     - `SELECT * FROM test_performance_by_test WHERE teacher_id = ${teacherId} ORDER BY submitted_at`.

9) functions/get-student-results-view.js
   - Keep using `student_results_view`; if missing, ensure `student_results_view` is created as wrapper to `student_test_results_view`.

10) functions/get-teacher-assignments.js
    - Replace DISTINCT selections from `teacher_subjects` with:
      - `SELECT * FROM teacher_assignments_overview_view WHERE teacher_id = ${teacherId}`.
    - Admin path can select without filter.

11) functions/get-teacher-grades-classes.js
    - Replace DISTINCT grade/class selections with:
      - `SELECT * FROM teacher_classes_summary_view WHERE teacher_id = ${teacherId}` (admin: omit filter).

### Notes on Columns Expected from Views
- student_active_tests_view: student_id, test_type, test_id, test_name, teacher_id, subject_id, grade, class, academic_period_id, assigned_at, due_date/window_end, is_active.
- teacher_active_tests_view: teacher_id, test_type, test_id, test_name, grade, class, subject_id, assigned_at, due_date/window_end, is_active.
- test_assignments_comprehensive_view: id, test_type, test_id, test_name, teacher_id, subject_id, grade, class, academic_period_id, assigned_at, due_date.
- all_tests_comprehensive_view: per-test metadata across types, normalized columns.
- student_test_results_view: per-student results rows across types and attempts.
- teacher_student_results_view: rows grouped per teacher/student/test including latest/best attempt.
- all_test_results_view: union of all result tables, normalized.
- test_performance_by_test: one row per test (per type) with aggregates like average_score and total_students.
- teacher_assignments_overview_view: test assignment rows with retest window.
- teacher_classes_summary_view: teacher_id, subject_id, grade, class, active_students.

### Risk Checklist
- Verify views expose all columns referenced in function responses; adjust SELECT list or add aliases.
- Ensure auth/tenant filters (teacher_id/student_id) are applied in SQL WHERE clauses.
- Maintain existing sorting/pagination semantics; add ORDER BY in query if needed.
- Keep DML flows (submit/update) unchanged.

### Test Plan
- Unit: mock DB and assert functions now hit a single SELECT each.
- Integration: compare old vs new JSON for a sample dataset.
- Performance: profile p95 latency for endpoints before/after.


