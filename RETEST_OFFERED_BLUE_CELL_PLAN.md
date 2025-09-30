### Goal
When a retest is offered to a student for a specific test, set `retest_offered = true` in the corresponding results row; surface this flag to the teacher class results and render that score cell in blue. Keep best-score compute-on-read logic unchanged.

### Backend changes (exact files/functions)
- Offer retest: set flag at creation time
  - Add new endpoint: `functions/create-retest-assignment.js`
    - After you `INSERT` into `retest_assignments` and `retest_targets` for each targeted student, call:
      - `await sql`SELECT set_retest_offered(${studentId}, ${testId}, true)`;`
    - If you already have an offer handler elsewhere, place the same call there.

- Expose flag in class results API
  - File: `functions/get-teacher-student-results.js`
    - In each UNION branch, add the base-table column to the SELECT list:
      - Example (multiple choice): `..., mc.retest_offered, ...`
      - Do the same for: `tf.retest_offered`, `i.retest_offered`, `m.retest_offered`, `w.retest_offered`, `d.retest_offered`, `fb.retest_offered`.
    - Keep existing `LEFT JOIN LATERAL` for best retest; only add the extra column.

- Optional: clear flag when retest finishes
  - In submit handlers, after retest concludes (passed early or attempts exhausted), you may flip the flag off:
    - Files:
      - `functions/submit-multiple-choice-test.js`
      - `functions/submit-true-false-test.js`
      - `functions/submit-input-test.js`
      - `functions/submit-matching-type-test.js`
      - `functions/submit-word-matching-test.js`
      - `functions/submit-fill-blanks-test.js`
      - `functions/submit-drawing-test.js`
    - After updating `retest_targets.status`, call:
      - `await sql`SELECT set_retest_offered(${studentId}, ${testId}, false)`;`
    - This step is optional if you want the blue indicator to persist until manually cleared.

### Frontend changes (exact files/components)
- Blue state in score cell
  - File: `src/teacher/TeacherResults.jsx`
    - In the main table score pill render, branch styling when `result.retest_offered === true`:
      - Add classes: `bg-blue-50 text-blue-700 border border-blue-200` (or similar Tailwind palette).
      - Keep existing red clickable logic for <50% intact; blue is an additional state.

- Carry retest_offered through data
  - File: `src/services/resultService.js`
    - Ensure the fetch method returning class results does not strip `retest_offered`.
  - File: `src/teacher/TeacherResults.jsx`
    - Verify `loadResults` preserves `retest_offered` on each result row.

- Refresh after offering retest
  - File: `src/teacher/TeacherCabinet.jsx`
    - After `create-retest-assignment` resolves, invalidate any cached results and trigger a refetch.
    - If using cache utilities, clear keys like `teacher_data_${teacherId}`, `teacher_tests_${teacherId}` and refetch `get-teacher-student-results`.

### Styling guideline
- Blue state should be obvious but not overpowering. Suggested:
  - Score pill base class + `bg-blue-50 text-blue-700` when `retest_offered` true
  - Tooltip/title: "Retest offered"

### Notes
- Database function `set_retest_offered(student_id, test_id, flag)` is provided in `retest_best_index_and_flags.sql` (plpgsql). It safely updates across result tables.
- Compute-on-read for best score stays as is; this change is only a visibility indicator.

### QA checklist
- Offer retest → row turns blue within a refresh.
- Submit passing retest (early pass) → confirm optional clearing if implemented.
- Ensure blue does not override red clickable (<50%) behavior; both can coexist (red text on blue bg acceptable).
- Verify all test types show the blue state.

