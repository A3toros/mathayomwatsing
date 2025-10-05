Title: Drawing Test Scoring - Inline Edit Like Speaking

Goal
- Make drawing test scoring behave like speaking tests: simple score out of 10, editable inline in the class results table and in the View Drawing modal.

Scope
- Teacher UI only (class results table + View Drawing modal)
- Backend update call for persisting drawing scores
- No DB schema changes (reuse existing score/max_score fields)

UI Changes
1) Class Results Table (src/teacher/TeacherResults.jsx)
   - Remove Edit Column and Save controls for drawing test columns.
   - For each drawing score cell, show a pill with “score/10”.
   - Default display: if score is null/undefined, show 0/10 (fixed max 10).
   - Make the score editable inline:
     - Click or double-click the pill → transforms into a small numeric input (0–10).
     - On blur or Enter, save new score; revert to pill on success.
     - While saving, show spinner/disabled state; on error, show toast and revert.

Exact code locations (TeacherResults table):
- Drawing column cell render (desktop): around lines 1465–1511
  - Link button: "View Drawing"
  - Replace edit-column inputs (1467–1511) with inline input (0–10) and save-on-blur
- Drawing column cell render (mobile): around lines 1550–1569 (and following)
  - Same replacement as desktop for inline score edit (0–10)
- Remove column-level edit plumbing for drawing:
  - State/hooks near lines 153–171: `editingColumns`, `columnScores`, `isSavingColumn`, refs
  - Handlers: `handleStartColumnEditing`, `handleCancelColumnEditing`, `handleSaveColumnScores`
  - Any UI referencing “Edit Column” or “Save” within drawing headers

2) View Drawing Modal (src/components/modals/DrawingModalNew/DrawingModal.jsx)
   - Add a simple scoring section mirroring speaking:
     - Label: “Score”
     - Input: number 0–10 (max fixed at 10, uneditable)
     - Save on blur or with a small Save button within the modal header/footer.
   - Keep the artwork preview unchanged.

Exact code locations (View Drawing modal):
- src/components/modals/DrawingModalNew/DrawingModal.jsx
  - Add scoring block near existing header/actions: simple input (0–10), read-only max 10
  - Save on blur or small button; reuse drawing score update endpoint

Behavior & Validation
- Accept integer or decimal input; clamp to [0, 10].
- Max score is always 10 for drawing; display only, not editable.
- When score is changed, immediately persist and update UI state for the student row.
- If the record has retest flags or cheating flags, continue to render them (no change in badges).

Backend Integration
- Use existing update endpoint for drawing scores (UPDATE_DRAWING_TEST_SCORE).
- Request shape (example):
  {
    test_name: string, // or test_id if required by existing API
    student_id: string,
    score: number,     // 0..10
    max_score: 10
  }
- On success: refresh row state or minimally patch local state to avoid full reload.
- On failure: show notification, revert input to previous value.

Endpoint usage in code:
- Use existing UPDATE_DRAWING_TEST_SCORE endpoint already referenced in TeacherResults utilities
- Payload: { test_name (or test_id), student_id, score (0–10), max_score: 10 }

Data Defaults
- When rendering a drawing result with null/undefined score:
  - Display 0/10 by default.
  - The first saved edit writes score=0..10, max_score=10.

Edge Cases
- Missing result row: disable editing and show “-”.
- Concurrent edits: disable input while request in-flight.
- Mobile: ensure input is large enough and not clipped in narrow cells.

Implementation Steps
1) Remove drawing column Edit/Save controls in TeacherResults table.
2) Replace drawing score pill with inline editable input; wire save-on-blur & Enter.
3) Normalize display to 0/10 when score is null; enforce max_score to 10 in UI.
4) Implement scoring UI in View Drawing modal; reuse the same save call.
5) Update local state after successful save; avoid full table reload when possible.
6) Add minimal error handling and toasts.

Testing
- Desktop and mobile table: edit several rows; verify persistence and UI update.
- Modal: change score and verify table reflects changes without refresh.
- Validate clamping, decimals, invalid input.

Rollout
- Ship behind no flag; low risk UI-only change with existing endpoint.
- If issues arise, revert to read-only pill without removing endpoint.


