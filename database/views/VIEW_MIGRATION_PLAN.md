## Views Migration Plan: Current vs New (Concise)

Purpose: keep function code smaller by moving joins/filters to SQL views. Below shows actual current code shape and the new minimal query.

### get-student-active-tests.js
- Current (multiple queries by `test_type`, lookups for teacher/subject, retest check):
```sql
-- users → grade/class, then test_assignments, then per-type test tables, teachers, subjects, retest_targets/assignments
```
- New:
```sql
SELECT * FROM student_active_tests_view WHERE student_id = $1 ORDER BY assigned_at DESC;
```
- Code change: one SELECT + existing retest check (optional if view later includes flags).

### get-teacher-active-tests.js
- Current (7 UNION ALL blocks across test tables + assignments):
```sql
-- union of multiple_choice/true_false/input/matching_type/word_matching/drawing/fill_blanks joined to test_assignments
```
- New:
```sql
-- Admin
SELECT * FROM teacher_active_tests_view ORDER BY assigned_at DESC;
-- Teacher
SELECT * FROM teacher_active_tests_view WHERE teacher_id = $1 ORDER BY assigned_at DESC;
```

### get-test-assignments.js
- Current (multiple per-type SELECTs + enrichment):
```sql
-- per-type joins to subjects + test tables, combined in JS
```
- New:
```sql
SELECT * FROM test_assignments_comprehensive_view WHERE test_id = $1; -- optional test_type/grade/class filters
```

### get-all-tests.js
- Current: builds across per-test tables.
- New:
```sql
SELECT * FROM all_tests_comprehensive_view [WHERE teacher_id = $1];
```

### get-student-test-results.js
- Current: joins per result table.
- New:
```sql
SELECT * FROM student_test_results_view WHERE student_id = $1;
```

### get-teacher-student-results.js
- Current: manual joins/grouping.
- New:
```sql
SELECT * FROM teacher_student_results_view WHERE teacher_id = $1;
```

### get-test-results.js
- Current: unions of result tables.
- New:
```sql
SELECT * FROM all_test_results_view WHERE test_id = $1 [AND test_type = $2];
```

### get-test-performance.js
- Current: uses aggregate; ensure it targets the view.
- New:
```sql
SELECT * FROM test_performance_by_test WHERE teacher_id = $1 ORDER BY submitted_at;
```

### get-teacher-assignments.js
- Current: DISTINCT from `teacher_subjects`.
- New:
```sql
SELECT * FROM teacher_assignments_overview_view WHERE teacher_id = $1; -- admin: omit filter
```

### get-teacher-grades-classes.js
- Current: DISTINCT `grade,class` with joins.
- New:
```sql
SELECT * FROM teacher_classes_summary_view WHERE teacher_id = $1; -- admin: omit filter
```

### Notes
- Keep DML endpoints unchanged (submit/update flows).
- If view lacks a needed column, add it to the view rather than re-introducing joins in JS.
- Add ORDER BY in SQL where UI depends on ordering.


