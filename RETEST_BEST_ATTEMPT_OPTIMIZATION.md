Title: Retest Best Attempt + Teacher UI Retest Indicators (Simple, ID-Linked)

Objective
- Keep retests linked to the original test_id (no clones), optimize best-attempt reads, and surface clear retest indicators in TeacherResults.

1) Link retests to original test
- Keep using original test tables as the source of truth for `test_id`.
- Relations:
  - `retest_assignments.test_id` → original `test_id` (parent).
  - `retest_targets.retest_assignment_id` → issuance per student.
  - `test_attempts.test_id` → always the original `test_id`.
  - `test_attempts.retest_assignment_id` → non-null only for retest attempts.
- Optional UI convenience: allow `parent_test_id` in payloads; backend relies on `test_id`.

2) Server flags per student/test (Teacher view)
- Extend `functions/get-teacher-student-results.js` select with retest metadata per row:
  - `retest_offered`: EXISTS retest target within active window and attempts left.
  - `attempts_left`: `GREATEST(ra.max_attempts - tgt.attempt_count, 0)`.
  - `retest_status`: `tgt.status` (ASSIGNED | IN_PROGRESS | FAILED | PASSED).

SQL sketch (per UNION branch):
```sql
LEFT JOIN LATERAL (
  SELECT TRUE AS retest_offered,
         GREATEST(ra.max_attempts - tgt.attempt_count, 0) AS attempts_left,
         tgt.status AS retest_status
  FROM retest_targets tgt
  JOIN retest_assignments ra ON ra.id = tgt.retest_assignment_id
  WHERE tgt.student_id = main.student_id
    AND ra.test_id   = main.test_id
    AND now() BETWEEN ra.window_start AND ra.window_end
    AND tgt.attempt_count < ra.max_attempts
  LIMIT 1
) rt ON TRUE
```
Then, in the top-level select:
```sql
COALESCE(rt.retest_offered, FALSE) AS retest_offered,
COALESCE(rt.attempts_left, 0)      AS attempts_left,
rt.retest_status                   AS retest_status
```

3) Best retest score optimization
- Keep `COALESCE(best.score, original.score)` via either:
  - Index-only approach:
    ```sql
    CREATE INDEX IF NOT EXISTS idx_test_attempts_best_retest
    ON test_attempts (student_id, test_id, percentage DESC, attempt_number DESC)
    WHERE retest_assignment_id IS NOT NULL;
    ```
    Use existing `LEFT JOIN LATERAL` ordered by `percentage DESC NULLS LAST, attempt_number DESC LIMIT 1`.
  - Or mirror table `retest_best_attempts` with UPSERT on retest submit (see below) for O(1) reads.

3.1) Index-only “best pointer” (no mirror, no write-path changes)
- Goal: make the best-attempt fetch index-only so it behaves like a pointer to the best row, without any extra table.
- Recommended index (Postgres 11+):
  ```sql
  CREATE INDEX IF NOT EXISTS idx_test_attempts_best_pointer
  ON test_attempts (
    student_id,
    test_id,
    percentage DESC,
    attempt_number DESC
  )
  INCLUDE (score, max_score, submitted_at)
  WHERE retest_assignment_id IS NOT NULL;
  ```
- Query shape (per-branch lateral):
  ```sql
  LEFT JOIN LATERAL (
    SELECT ta.score, ta.max_score
    FROM test_attempts ta
    WHERE ta.student_id = main.student_id
      AND ta.test_id    = main.test_id
      AND ta.retest_assignment_id IS NOT NULL
    ORDER BY ta.percentage DESC NULLS LAST, ta.attempt_number DESC
    LIMIT 1
  ) best ON TRUE
  ```
- Rationale:
  - The index ordering matches the ORDER BY, allowing an index-only, top-1 walk.
  - The INCLUDE list provides `score` and `max_score`, removing heap fetches in most cases.
  - No schema/table changes; fully read-only optimization.

Mirror table schema (optional):
```sql
CREATE TABLE IF NOT EXISTS retest_best_attempts (
  student_id TEXT NOT NULL,
  test_id INTEGER NOT NULL,
  score INTEGER,
  max_score INTEGER,
  percentage NUMERIC(5,2),
  attempt_number INTEGER,
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, test_id)
);
```

UPSERT (retest submit only):
```sql
INSERT INTO retest_best_attempts AS rba (...)
VALUES (...)
ON CONFLICT (student_id, test_id)
DO UPDATE SET ... -- prefer higher percentage, tie-break by attempt_number
```

4) Teacher UI — Retest badges
- In `src/teacher/TeacherResults.jsx`:
  - If `result.retest_offered` is true, render a small blue "Retest" pill next to the score pill with title "Retest offered (X left)", where X = `result.attempts_left`.
  - If `result.retest_status === 'IN_PROGRESS'`, show a yellow dot; if `'FAILED'`, orange dot; if `'PASSED'`, green check. Keep best-score coalescing intact.
  - Clicking the badge triggers the same handler as clicking a red score to open the prefilled retest modal.

JSX sketch:
```jsx
{result.retest_offered && (
  <span
    className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs cursor-pointer"
    title={`Retest offered (${result.attempts_left} left)`}
    onClick={(e) => {
      e.preventDefault(); e.stopPropagation();
      openRetestModal({ failedStudentIds: [student.student_id], test_type: test.test_type, original_test_id: test.test_id, subject_id: test.subject_id });
    }}
  >Retest</span>
)}
{result.retest_status === 'IN_PROGRESS' && <span className="ml-1 h-2 w-2 rounded-full bg-yellow-400 inline-block" />}
{result.retest_status === 'FAILED'      && <span className="ml-1 h-2 w-2 rounded-full bg-orange-500 inline-block" />}
{result.retest_status === 'PASSED'      && <span className="ml-1 text-green-600">✔</span>}
```

5) Rollout
- Backend:
  - Add index (if using index-only plan).
  - Extend `get-teacher-student-results` with the `rt` lateral join and new fields.
  - (Optional) Add mirror table + UPSERT in retest submit functions; backfill once.
- Frontend:
  - Read new flags from API and render badges in `TeacherResults.jsx`.

6) Testing
- Offer a retest to one student; verify badge shows with correct attempts_left and status.
- Submit a failing retest; status becomes FAILED; attempts decrement.
- Submit a passing retest; status PASSED, best score coalesced; badge can disappear when no attempts left or window closed.


