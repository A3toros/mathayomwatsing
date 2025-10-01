# Mobile Canvas Padding Refactor Plan

## Goal
- Reduce padding to 0 on the parent container of the drawing canvas on mobile viewports.
- Remove any spacing between the canvas and its immediate container so the canvas uses full available width on mobile.

## Current Symptoms
- Parent wrapper uses Tailwind padding classes like `p-6` and `p-1 sm:p-2` causing mobile padding.
- Inner wrappers add borders/rounded/spacing that visually create gaps between the canvas and its container.

## Target Locations (to verify/edit)
- `src/components/test/DrawingTestStudent.jsx`
  - Card wrapper around the Stage: currently includes `p-1 sm:p-2`.
  - Stage wrapper has `border border-gray-300 rounded-lg shadow-sm`.
- `src/components/modals/DrawingModalNew/DrawingModal.jsx`
  - Canvas card container in the viewer/editor area.
- Any shared wrapper applying `p-*` or `gap-*` around `.drawing-canvas-container`.

## Strategy
1. Enforce zero padding on mobile for the canvas parent card/container.
   - Replace `p-1 sm:p-2` with `p-0 sm:p-2` where the canvas is rendered.
   - If there is an outer `p-6` (marketing card wrapper), add a mobile override class: `p-0 sm:p-6`.
2. Remove inner spacing between canvas and container:
   - Ensure the immediate wrapper of the Konva Stage has `p-0 m-0`.
   - Remove/unset `gap-*` between nested flex wrappers on mobile: `gap-0 sm:gap-1`.
   - If a border frame is desired, keep `border` on the Stage element, not on outer wrappers, to prevent double borders/gaps.
3. Make the canvas fill the container width on mobile:
   - Parent wrappers: `w-full max-w-full`.
   - Stage container: `w-full` and no extra padding/margins.
4. Keep overlays (zoom controls, fullscreen button) absolutely positioned without adding layout padding.
   - Position with `absolute` inside a `relative` container that has `p-0` on mobile.

5. Remove visual frames on mobile that create perceived gaps.
   - Move borders/rounded/shadows to desktop-only using Tailwind responsive variants.
   - Ensure no centering wrappers (`flex justify-center`) constrain width.

## Concrete Edits
1. DrawingTestStudent.jsx
   - Find the Card wrapping the canvas and change:
     - `className="p-1 sm:p-2"` → `className="p-0 sm:p-2"`.
   - Ensure the immediate `.drawing-canvas-container` has `p-0 m-0` and no `gap-*` on mobile:
     - e.g., `className="w-full drawing-canvas-container relative p-0 m-0"`.
   - Stage wrapper (the div that holds the Stage) should remain `relative` and `p-0`.
   - Keep `border/rounded/shadow` on the Stage element only to avoid extra spacing.

### Exact code targets in DrawingTestStudent.jsx
- Change the canvas Card wrapper:
  - Before:
    - `<Card className="p-1 sm:p-2">`
  - After:
    - `<Card className="p-0 sm:p-2">`
- Update the canvas container div:
  - Before:
    - `<div className="w-full drawing-canvas-container relative">`
  - After:
    - `<div className="w-full drawing-canvas-container relative p-0 m-0">`
- Do not alter Stage element classes; keep borders on Stage to avoid outer gaps.

#### Additional gap sources in DrawingTestStudent.jsx
- Stage element currently adds a frame that creates perceived spacing:
  - Before (excerpt):
    - `className=\"border border-gray-300 rounded-lg shadow-sm ...\"`
  - After (mobile removes frame, desktop keeps it):
    - `className=\"border-0 rounded-none shadow-none sm:border sm:rounded-lg sm:shadow-sm ...\"`
- Stage inline style should ensure full width on mobile:
  - Before:
    - `style={{ maxWidth: '100%', height: 'auto' }}`
  - After (equivalent but explicit):
    - `style={{ width: '100%', height: 'auto' }}`
- Avoid centering wrappers around Stage on mobile:
  - Replace any surrounding `flex justify-center` with `block` on mobile (e.g., `block sm:flex sm:justify-center`).

2. DrawingModal.jsx (DrawingModalNew)
   - Locate the canvas container Card and change any `p-1 sm:p-2` to `p-0 sm:p-2`.
   - For any outer marketing card with `p-6`, prefer `p-0 sm:p-6`.
   - Normalize inner wrappers to avoid side padding: add `p-0` on mobile.

### Exact code targets in DrawingModal.jsx
- The drawing container (around CanvasViewer/ViewerCanvas):
  - Before:
    - `<div className="flex-1 min-h-0 relative overflow-hidden bg-gray-100 p-4 select-none">`
  - After:
    - `<div className="flex-1 min-h-0 relative overflow-hidden bg-gray-100 p-0 sm:p-4 select-none">`
- Keep overlays (`ZoomControls`, fullscreen button) absolutely positioned; no padding added to their parent.

#### Additional gap sources in DrawingModal.jsx
- Parent container background highlights space around canvas:
  - Before:
    - `bg-gray-100 p-4`
  - After (mobile):
    - `bg-white p-0 sm:bg-gray-100 sm:p-4`
- If an outer Card-like wrapper exists, remove frame on mobile:
  - Use `rounded-none border-0 sm:rounded-xl sm:border` on the wrapper.

3. Optional CSS utility (if we need a single choke point)
   - In `src/styles/globals.css`, add a helper class for mobile-only zero padding:
     - `.mobile:p-0 { padding: 0 !important; }` via Tailwind plugin or use Tailwind responsive: `p-0 sm:p-2` wherever needed.

## Tailwind Class Patterns
- Parent card (mobile → desktop):
  - `p-0 sm:p-2 md:p-4`
- Container wrappers:
  - `p-0 m-0 w-full max-w-full`
  - `gap-0 sm:gap-1`
- Stage element (keeps visual frame without adding gaps):
  - Mobile: `border-0 rounded-none shadow-none`
  - Desktop+: `sm:border sm:rounded-lg sm:shadow-sm`

## QA Checklist
- Mobile (<640px):
  - No white padding around the canvas parent container.
  - Canvas touches the container edges (no inner gaps).
  - Overlays (zoom controls, percentage, fullscreen) are visible and not clipped.
  - Pan/zoom work; no layout shift due to padding.
- Tablet (≥640px):
  - Padding returns (`sm:p-2`), layout looks balanced.
- Desktop:
  - No regressions; existing padding preserved.

## Rollout Steps
1. Implement class changes in `DrawingTestStudent.jsx` and `DrawingModal.jsx`.
2. Verify mobile views in browser devtools for multiple widths (e.g., 360px, 414px, 480px).
3. Adjust any remaining `gap-*` utilities conflicting on mobile.
4. Ship behind a quick PR; small surface area and reversible.

## Notes
- Prefer Tailwind responsive utilities for zero-padding on mobile (`p-0 sm:p-2`) over custom CSS to keep consistency.
- Keep borders on the Stage wrapper only to avoid double frames and unexpected spacing.


