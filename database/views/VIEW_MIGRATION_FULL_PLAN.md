## Full Views Migration Plan (Actual Code → Proposed Changes)

This document enumerates each read-focused Netlify function, shows its current SQL usage (with in-repo code references where available), and specifies the exact change to adopt the corresponding SQL view.

Notes:
- Keep DML endpoints (submit/update/delete) unchanged.
- If a needed column is missing from a view, extend the view rather than re-adding joins in JS.

---

### get-student-active-tests.js
Current (grade/class lookup → assignments → per-type test table lookups → teacher/subject lookups):
```113:166:functions/get-student-active-tests.js
// Get student's grade and class
const studentInfo = await sql`
  SELECT grade, class FROM users WHERE student_id = ${student_id}
`;
// ...
const assignments = await sql`
  SELECT /* fields */
  FROM test_assignments ta
  LEFT JOIN subjects s ON ta.subject_id = s.subject_id
  WHERE ta.grade = ${assignmentGrade}
  AND ta.class = ${assignmentClass}
  AND ta.is_active = true
  ORDER BY ta.assigned_at DESC
`;
```
```176:257:functions/get-student-active-tests.js
// Per-type test lookups (multiple_choice, true_false, input, matching_type, word_matching, drawing, fill_blanks, speaking)
```

Proposed change (single view query + optional retest check):
```sql
SELECT * FROM student_active_tests_view
WHERE student_id = $1
ORDER BY assigned_at DESC;
```
Code edit: Replace the users/assignments + per-type lookups with one SELECT from `student_active_tests_view`, then retain current retest availability check using `retest_targets`/`retest_assignments`.

---

### get-teacher-active-tests.js
Current (7x UNION ALL across test tables joined to `test_assignments`, for admin and teacher paths):
```64:172:functions/get-teacher-active-tests.js
// Admin: UNION ALL across multiple_choice/true_false/input/matching_type/word_matching/drawing/speaking
```
```254:463:functions/get-teacher-active-tests.js
// Teacher: same UNION ALL filtered by teacher_id
```

Proposed change:
```sql
-- Admin
SELECT * FROM teacher_active_tests_view ORDER BY assigned_at DESC;
-- Teacher
SELECT * FROM teacher_active_tests_view WHERE teacher_id = $1 ORDER BY assigned_at DESC;
```
Code edit: Replace the UNION blocks with a single SELECT to `teacher_active_tests_view` (filtered for teacher path). Remove duplicated days_remaining calculations or add them to the view later.

---

### get-test-assignments.js
Current (per-type SELECTs + enrichment + client-side combine):
```217:241:functions/get-test-assignments.js
SELECT /* fields */
FROM test_assignments ta
LEFT JOIN subjects s ON ta.subject_id = s.subject_id
LEFT JOIN multiple_choice_tests mct ON ta.test_id = mct.id AND ta.test_type = 'multiple_choice'
WHERE ta.test_type = 'multiple_choice'
```
```244:266:functions/get-test-assignments.js
-- Repeats for true_false
```
```269:291:functions/get-test-assignments.js
-- Repeats for input
```
```294:316:functions/get-test-assignments.js
-- Repeats for matching_type
```
```319:339:functions/get-test-assignments.js
-- Repeats for word_matching
```
```342:364:functions/get-test-assignments.js
-- Repeats for fill_blanks
```
```367:389:functions/get-test-assignments.js
-- Repeats for drawing; then arrays are merged in JS
```

Proposed change:
```sql
SELECT * FROM test_assignments_comprehensive_view
WHERE test_id = $1
-- optionally AND test_type = $2 AND grade = $3 AND class = $4 AND subject_id = $5
ORDER BY assigned_at DESC;
```
Code edit: Replace all per-type queries and combination logic with a single SELECT to `test_assignments_comprehensive_view` and return.

View columns now available (added): `num_questions`, `test_created_at`, `test_updated_at`.

---

### get-test-performance.js
Current: targets an aggregate; ensure view usage.
Proposed change:
```sql
SELECT * FROM test_performance_by_test
WHERE teacher_id = $1
ORDER BY submitted_at;
```
Code edit: Replace any ad-hoc aggregation with the view query above.

---

### get-student-results-view.js
Current: already references `student_results_view`.
Proposed change: Ensure `student_results_view` exists; if not, create a shim:
```sql
CREATE OR REPLACE VIEW student_results_view AS
SELECT * FROM student_test_results_view;
```
Code edit: none if the view exists; otherwise, add the shim view.

---

### get-student-test-results.js
Current: manual unions/joins per result table.
Proposed change:
```sql
SELECT * FROM student_test_results_view WHERE student_id = $1;
```
Code edit: Replace manual queries with single view SELECT.

---

### get-test-results.js
Current: unions/joins across per-test result tables to return results for a given test.
Proposed change:
```sql
SELECT * FROM all_test_results_view WHERE test_id = $1 [AND test_type = $2] ORDER BY submitted_at DESC;
```
Code edit: Replace manual union with single SELECT against `all_test_results_view`, preserving optional `test_type` filter and ordering.

---

### get-teacher-student-results.js
Current: manual joins/grouping.
Proposed change:
```sql
SELECT * FROM teacher_student_results_view WHERE teacher_id = $1;
```
Code edit: Replace custom join logic with single view SELECT.

---

### get-all-tests.js
Current: joins across per-test tables.
Proposed change:
```sql
SELECT * FROM all_tests_comprehensive_view [WHERE teacher_id = $1] ORDER BY created_at DESC;
```
Code edit: Replace various table scans/unions with the comprehensive view.

---

### get-teacher-assignments.js
Current: DISTINCT grade/class from `teacher_subjects`.
```81:90:functions/get-teacher-assignments.js
SELECT DISTINCT ts.grade, ts.class, ts.teacher_id
FROM teacher_subjects ts
```
Proposed change:
```sql
SELECT * FROM teacher_assignments_overview_view WHERE teacher_id = $1;
-- admin: omit WHERE
```
Code edit: Replace DISTINCT projection with view SELECT to include assignment windows and test metadata.

View columns now available (added): `days_remaining` (computed from assignment window).

---

### get-teacher-grades-classes.js
Current: DISTINCT grade/class with subject joins.
```67:78:functions/get-teacher-grades-classes.js
SELECT DISTINCT ts.grade, ts.class, ts.subject_id, ts.teacher_id, s.subject
FROM teacher_subjects ts
```
Proposed change:
```sql
SELECT * FROM teacher_classes_summary_view WHERE teacher_id = $1;
-- admin: omit WHERE
```
Code edit: Replace DISTINCT with summarized view including active student counts.

View columns now available (added): `subject_name` (joined from `subjects`).

---

### Directory endpoints
- get-all-users.js → `directory_users_view`
- get-all-teachers.js / get-admin-teachers.js → `directory_teachers_view`
- get-all-subjects.js → `directory_subjects_view`

Proposed change examples:
```sql
SELECT * FROM directory_users_view;
SELECT * FROM directory_teachers_view;
SELECT * FROM directory_subjects_view;
```

---

## Implementation Order
1) Ensure all views exist (as in `database/views/*.sql`). Add missing shims if needed.
2) For each function above, replace the current SELECT logic with the view-based query shown.
3) Keep existing auth filters and ordering; apply as WHERE/ORDER BY on the view.
4) Test each endpoint against staging data; verify payload compatibility and latency.


