# Drawing TextBox Gesture Fix Plan

## Goals

- After creation, a text box must NOT be draggable by default.
- Do NOT auto-switch to the pan tool after creating a text box.
- Mobile/Touch interactions:
  - Double-tap: opens text edit overlay for the specific text box.
  - Long-press (≈400–500ms): temporarily enables dragging for that specific text box; dragging ends disables it again.
- Prevent Stage (canvas) panning from stealing taps meant for text boxes.

## Current Issues (Diagnosis)

- Stage handles single-finger gestures and may begin panning before text box events finish, which suppresses TextBox `dbltap` and interferes with long-press.
- Mixed event handling (pointer vs touch) and `preventDefault` at Stage level disrupt Konva's `tap/dbltap` recognition on child nodes.
- Long-press timers race with gesture start; if the Stage or node begins moving first, drag can occur unexpectedly.
- `onDblTap` is only on the `Group`, but users often hit the `Rect`/`Text` children, so `dbltap` may not reach the parent.

## High-Level Strategy

1) Gate Stage interactions when the target is a text box: if the event originates from a text box node, the Stage should not treat it as drawing/pan input.
2) Use a per-instance, ref-based drag gate in `TextBox` (NOT React state) to enable/disable `draggable` deterministically and immediately.
3) Align to Konva's mobile-friendly events for text boxes: use `onTap`/`onDblTap` on `Group`, `Rect`, and `Text`, bubble-cancel early.
4) Add long-press with movement threshold; cancel timer on any meaningful move prior to timeout.
5) Do not auto-switch to pan after text creation; remain in text/select mode.

## File-Level Changes

### 1. `src/components/test/DrawingTestStudent.jsx`

- Creation flow (text tool):
  - Remove the `setCurrentTool('pan')` call after creating a new text box.
  - Keep current tool in `text` (or introduce a `select`/`none` mode) to avoid Stage becoming draggable right after creation.

- Stage gesture arbitration (mobile and mouse):
  - In `handleTouchStart/Move/End` and mouse handlers, if `e.target` is part of a text box (Group or its Rect/Text children), skip Stage single-finger drawing/panning logic for that event.
  - Do NOT call `preventDefault` for single-finger interactions originating from text box nodes.
  - Only allow Stage `draggable` when `currentTool === 'pan'` AND the event is not targeting a text box.

- Touch-action style for container:
  - Ensure Stage/container wrapper uses `touch-action: manipulation` (or `none` where appropriate) to prevent browser double-tap zoom from consuming `dbltap`.

### 2. `src/components/test/TextBox.jsx`

- Event alignment:
  - Add `onTap` and `onDblTap` to `Group`, `Rect`, and `Text`.
  - In both handlers, call `e.cancelBubble = true` immediately.
  - `onDblTap` → invoke `onUpdate(id, { isEditing: true })` and dispatch any existing edit overlay event.

- Long-press to enable drag:
  - Use refs:
    - `isDragEnabledRef` (boolean) to gate dragging.
    - `longPressTimerRef` for the timer id.
    - `pressStartPosRef` to record initial pointer position.
  - `onPointerDown`:
    - Record start position `pressStartPosRef`.
    - Start `longPressTimerRef = setTimeout(enableDrag, 450)`.
  - `onPointerMove`:
    - If distance from `pressStartPosRef` exceeds threshold (e.g., 4–6 px) before timer fires, cancel the timer (treat as a move, not a long-press).
  - `onPointerUp`/`onPointerLeave`:
    - Clear timer; if drag was enabled, disable it immediately.

- Drag gating:
  - Set `Group.draggable(isDragEnabledRef.current)` with a Konva node reference (e.g., via `ref` or `useEffect`).
  - Additionally, provide a `dragBoundFunc` that returns the current position when `isDragEnabledRef.current === false` to hard-prevent motion even if Konva attempts to start dragging.
  - On `dragend`, immediately set `isDragEnabledRef.current = false` and update `Group.draggable(false)`.

- Hit area coverage:
  - Attach `onTap/onDblTap` to `Rect` and `Text`, not just the parent `Group`.
  - Keep `e.cancelBubble = true` in all text box handlers to avoid Stage seeing these taps.

### 3. `src/components/modals/DrawingModalNew/components/ViewerCanvas.jsx`

- No functional changes (teacher view is read-only). Ensure text boxes remain non-draggable there.

## Interaction Rules

- After creation:
  - Text box is NOT draggable.
  - Tool remains `text` (or a neutral `select`); do not auto-switch to pan.
  - Double-tap anywhere on the text box (Rect/Text/Group) opens editing overlay.
  - Long-press enables drag; dragging ends disables drag.

## Movement Thresholds and Timings

- Long-press timeout: 450 ms (tunable 350–500 ms).
- Movement threshold during press: 4–6 px; cancel long-press if exceeded before timeout.

## Testing Checklist

- Creation
  - Create a text box; verify it does not move on slight finger slides; Stage does not pan; no tool switch to pan.
- Double-tap
  - Double-tap Rect, Text, and Group area → edit overlay opens; Stage does not pan.
- Long-press drag
  - Press and hold 450 ms → text box becomes draggable; drag updates position; releasing disables drag.
- Stage pan
  - With pan tool active, touching a text box should NOT pan Stage (text box interactions win); touching outside text boxes pans normally.
- Gesture conflicts
  - Quick tap sequences still recognize `dbltap` reliably; long-press timer does not interfere with `dbltap` window.

## Rollback Plan

- Keep current code paths behind a feature flag (optional) or preserve a minimal diff to quickly revert to previous behavior if needed.

## Implementation Notes

- Prefer refs over React state for drag gating to avoid async state timing issues versus Konva's drag-start decision.
- Avoid mixing touch/pointer on the same element when relying on Konva's `tap/dbltap` detection; use Konva's `onTap/onDblTap` for mobile hit targets.
- Centralize a helper to detect whether an event target is a text box node (by name or a flag on `attrs`) to simplify Stage arbitration.


