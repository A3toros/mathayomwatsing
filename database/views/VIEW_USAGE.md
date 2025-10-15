## Netlify Functions ↔ SQL Views Mapping

This document maps Netlify functions in `functions/` to SQL views under `database/views/` to optimize read-heavy queries and reduce duplication. Where a function currently queries raw tables, a recommended view is listed. New view proposals are marked as Proposed.

### Existing Views
- `all_tests_comprehensive_view.sql`
- `all_test_results_view.sql`
- `student_active_tests_view.sql`
- `teacher_active_tests_view.sql`
- `test_assignments_comprehensive_view.sql`
- `student_test_results_view.sql`
- `teacher_student_results_view.sql`
- `delete-test-data_view.sql` (maintenance)

### Function → View Recommendations

- get-student-active-tests.js → `student_active_tests_view`
  - Purpose: list active tests for a student with assignment window/status.

- get-teacher-active-tests.js → `teacher_active_tests_view`
  - Purpose: list active tests for a teacher across classes/subjects.

- get-test-assignments.js → `test_assignments_comprehensive_view`
  - Purpose: show assignments per test including classes, windows, and counts.

- get-test-results.js → `all_test_results_view`
  - Purpose: aggregated/denormalized results across test types by test.

- get-teacher-student-results.js → `teacher_student_results_view`
  - Purpose: per-teacher student results rollup for grading dashboards.

- get-student-test-results.js → `student_test_results_view`
  - Purpose: per-student view of results across test types and attempts.

- get-all-tests.js → `all_tests_comprehensive_view`
  - Purpose: canonical list of tests with metadata for admin/teacher UIs.

- get-student-results-view.js → `student_results_view` (already referenced in code)
  - Note: ensure `student_results_view` exists or back it with `student_test_results_view` if overlapping.

### Additional Functions Benefiting From Views (Proposed)

- get-teacher-assignments.js → Proposed: `teacher_assignments_overview_view`
  - Content: teacher → classes → tests with active window and assignment counts.

- get-teacher-grades-classes.js → Proposed: `teacher_classes_summary_view`
  - Content: classes taught by teacher, student counts, current assignments.

- get-test-performance.js → Proposed/Ensure: `test_performance_by_test`
  - Code comment references this. Provide view aggregating mean/median/max per test and completion counts.

- get-all-users.js / get-all-teachers.js / get-all-subjects.js → Proposed: `directory_users_view`, `directory_teachers_view`, `directory_subjects_view`
  - Content: normalized listing with last activity, is_active, and related counts (optional) for admin grids.

### Implementation Notes

- Prefer views to encapsulate joins across `tests`, `assignments`, `retest_assignments`, `test_attempts`, and result tables to keep Netlify function code simple and fast.
- Where functions update/insert (submit-* and update-*), keep using raw DML; views are for reads.
- Ensure all views filter by `is_active` and respect academic period scoping where applicable.
- Add supporting indexes for view predicates/joins (see `database_optimization_indexes.sql`).

### Next Steps

1) Confirm presence of `student_results_view` and `test_performance_by_test` (referenced by code). If missing, add them.
2) Add proposed views where listed, then update functions to query the views instead of raw tables.
3) Benchmark critical endpoints before/after to validate performance gains.


