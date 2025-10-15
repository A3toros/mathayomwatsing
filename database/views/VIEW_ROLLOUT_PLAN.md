## Views Rollout Plan (Functions → Views + SQL Changes)

### Goals
- Reduce query complexity in Netlify functions by centralizing joins/filters into SQL views.
- Improve performance and consistency across student/teacher/admin dashboards.
- Keep DML (INSERT/UPDATE) in functions; use views for SELECT-only endpoints.

### Confirm/Ensure Existing Views
- `student_active_tests_view`
- `teacher_active_tests_view`
- `test_assignments_comprehensive_view`
- `all_tests_comprehensive_view`
- `student_test_results_view`
- `teacher_student_results_view`
- `all_test_results_view`
- `test_performance_by_test` (present in `database_schema_migration.sql`)
- `student_results_view` (referenced by code; add if missing or alias to `student_test_results_view`)

### Functions → Views (Actionable Mapping)

1) get-student-active-tests.js → `student_active_tests_view`
   - Replace raw table queries with: `SELECT * FROM student_active_tests_view WHERE student_id = $1 AND NOW() BETWEEN window_start AND window_end;`
   - SQL change: None (view exists). Validate columns used in function.

2) get-teacher-active-tests.js → `teacher_active_tests_view`
   - Use: `SELECT * FROM teacher_active_tests_view WHERE teacher_id = $1;`
   - SQL change: None (view exists). Add indexes if missing on key predicates.

3) get-test-assignments.js → `test_assignments_comprehensive_view`
   - Use: `SELECT * FROM test_assignments_comprehensive_view WHERE test_id = $1;`
   - SQL change: None. Confirm includes class/grade/subject/window fields.

4) get-test-results.js → `all_test_results_view`
   - Use: `SELECT * FROM all_test_results_view WHERE test_id = $1 [AND test_type = $2];`
   - SQL change: None. Ensure union covers all test types and includes is_completed.

5) get-student-test-results.js → `student_test_results_view`
   - Use: `SELECT * FROM student_test_results_view WHERE student_id = $1;`
   - SQL change: None.

6) get-teacher-student-results.js → `teacher_student_results_view`
   - Use: `SELECT * FROM teacher_student_results_view WHERE teacher_id = $1;`
   - SQL change: None.

7) get-all-tests.js → `all_tests_comprehensive_view`
   - Use: `SELECT * FROM all_tests_comprehensive_view [WHERE teacher_id = $1];`
   - SQL change: None.

8) get-test-performance.js → `test_performance_by_test`
   - Use: `SELECT * FROM test_performance_by_test WHERE teacher_id = $1 ORDER BY submitted_at;`
   - SQL change: Present in migration. Confirm column list alignment with function.

9) get-student-results-view.js → `student_results_view`
   - Use: `SELECT * FROM student_results_view WHERE student_id = $1;`
   - SQL change: Create if missing, or define as wrapper of `student_test_results_view`.

10) get-teacher-assignments.js → Proposed: `teacher_assignments_overview_view`
    - Use: `SELECT * FROM teacher_assignments_overview_view WHERE teacher_id = $1;`
    - SQL change: Create view.

11) get-teacher-grades-classes.js → Proposed: `teacher_classes_summary_view`
    - Use: `SELECT * FROM teacher_classes_summary_view WHERE teacher_id = $1;`
    - SQL change: Create view.

12) get-admin-teachers.js / get-all-teachers.js → Proposed: `directory_teachers_view`
    - Use: `SELECT * FROM directory_teachers_view;`
    - SQL change: Create view.

13) get-all-users.js → Proposed: `directory_users_view`
    - Use: `SELECT * FROM directory_users_view;`
    - SQL change: Create view.

14) get-all-subjects.js → Proposed: `directory_subjects_view`
    - Use: `SELECT * FROM directory_subjects_view;`
    - SQL change: Create view.

### New View Definitions (SQL Skeletons)

-- teacher_assignments_overview_view
```sql
CREATE OR REPLACE VIEW teacher_assignments_overview_view AS
SELECT
  ta.teacher_id,
  ta.test_type,
  ta.test_id,
  ta.subject_id,
  ta.academic_period_id,
  ta.grade,
  ta.class,
  ta.assigned_at,
  ta.due_date,
  ta.is_active,
  ra.id AS retest_assignment_id,
  ra.window_start,
  ra.window_end,
  ra.max_attempts
FROM test_assignments ta
LEFT JOIN retest_assignments ra
  ON ra.test_type = ta.test_type AND ra.test_id = ta.test_id
WHERE ta.is_active = true;
```

-- teacher_classes_summary_view
```sql
CREATE OR REPLACE VIEW teacher_classes_summary_view AS
SELECT
  ts.teacher_id,
  ts.subject_id,
  ts.grade,
  ts.class,
  COUNT(*) FILTER (WHERE u.is_active) AS active_students
FROM teacher_subjects ts
JOIN users u ON u.grade = ts.grade AND u.class = ts.class
GROUP BY ts.teacher_id, ts.subject_id, ts.grade, ts.class;
```

-- directory_* views
```sql
CREATE OR REPLACE VIEW directory_users_view AS
SELECT student_id, grade, class, number, name, surname, nickname, is_active, updated_at
FROM users;

CREATE OR REPLACE VIEW directory_teachers_view AS
SELECT teacher_id, username, first_name, last_name, is_active, updated_at
FROM teachers;

CREATE OR REPLACE VIEW directory_subjects_view AS
SELECT subject_id, subject, created_at
FROM subjects;
```

-- student_results_view (shim if needed)
```sql
CREATE OR REPLACE VIEW student_results_view AS
SELECT * FROM student_test_results_view;
```

### Rollout Steps
1) Create missing views above in a migration under `database/views/` or append to `database_schema_migration.sql`.
2) Update listed functions to select from the views (read-only paths only).
3) Verify with staging data: compare row counts/columns vs old queries.
4) Benchmark p95 latency; add indexes if predicates differ from existing ones.
5) Deploy.


