# Complete Frontend/Backend Changes Checklist

## Frontend Changes Required

### 1. **src/components/test/DrawingTestStudent.jsx** - MAJOR CHANGES
**Current Issues:**
- Uses `canvas_width/height` (600x800) as actual canvas size ❌
- Broken fullscreen mode using screen dimensions ❌
- No two-finger gesture support ❌
- Wrong zoom limits allowing upscaling ❌

**Changes Needed:**
- [ ] **Replace canvas size logic** (lines 610-615)
  - OLD: `const canvasWidth = question.canvas_width || 600;`
  - NEW: `const actualCanvasWidth = question.max_canvas_width || 1536;`
- [ ] **Replace getResponsiveDimensions function** (lines 650-669)
  - OLD: Uses screen size for fullscreen
  - NEW: Uses viewport size with calculated zoom
- [ ] **Add two-finger gesture state** (new)
  - `const [lastTouchDistance, setLastTouchDistance] = useState(null);`
  - `const [lastTouchCenter, setLastTouchCenter] = useState(null);`
  - `const [isTwoFingerGesture, setIsTwoFingerGesture] = useState(false);`
- [ ] **Replace touch handlers** (lines 119-132)
  - OLD: Basic single-finger only
  - NEW: Two-finger gesture detection and handling
- [ ] **Update zoom limits** (lines 696-703)
  - OLD: `const maxZoom = Math.min(maxZoomX, maxZoomY, 5);`
  - NEW: `const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0);`
- [ ] **Update Stage component** (lines 200-300)
  - OLD: `width={canvasSize.width}` (600)
  - NEW: `width={viewportWidth}` (600) with proper zoom
- [ ] **Update background Rect** (lines 230-237)
  - OLD: `width={width}` (600)
  - NEW: `width={canvasSize.width}` (1536)

### 2. **src/components/modals/DrawingModal.jsx** - MAJOR CHANGES
**Current Issues:**
- Uses `canvas_width/height` as canvas size ❌
- Wrong zoom calculations ❌
- No two-finger gesture support ❌

**Changes Needed:**
- [ ] **Replace canvas size logic** (lines 161-178)
  - OLD: `width: drawing.canvas_width`
  - NEW: `width: drawing.max_canvas_width`
- [ ] **Add two-finger gesture state** (new)
  - Same gesture state as student view
- [ ] **Add two-finger gesture functions** (new)
  - `getTouchDistance`, `getTouchCenter`, touch handlers
- [ ] **Update Stage component** (lines 432-475)
  - Add `onTouchStart`, `onTouchMove`, `onTouchEnd`
  - Update zoom limits to 1.0x max
- [ ] **Update zoom controls** (lines 196-237)
  - Add "Fit to Viewport", "Full Canvas" buttons
  - Update zoom limits

### 3. **src/components/test/DrawingTestCreator.jsx** - MINOR CHANGES
**Current Issues:**
- UI labels are confusing ❌
- Default values are correct but labels wrong ❌

**Changes Needed:**
- [ ] **Update UI labels** (lines 240-283)
  - OLD: "Base Width/Height" → NEW: "Viewport Width/Height"
  - OLD: "Max Width/Height" → NEW: "Canvas Width/Height"
- [ ] **Add explanation text** (new)
  - "Canvas is the actual drawing area, viewport is the initial display size"
- [ ] **Update default values** (lines 32-36)
  - Keep same values but update comments

### 4. **src/hooks/useKonvaCanvas.js** - NEW FILE/MAJOR CHANGES
**Current Issues:**
- Basic hook, needs enhancement for large canvas ❌

**Changes Needed:**
- [ ] **Add viewport parameter** (new)
- [ ] **Add initial zoom calculation** (new)
- [ ] **Add canvas vs viewport logic** (new)

## Backend Changes Required

### 1. **functions/save-test-with-assignments.js** - NO CHANGES NEEDED ✅
**Status:** Already handles canvas dimensions correctly
- Lines 371-377: Properly saves `canvas_width`, `canvas_height`, `max_canvas_width`, `max_canvas_height`
- No changes needed

### 2. **functions/get-drawing-test.js** - NO CHANGES NEEDED ✅
**Status:** Already returns correct data structure
- Lines 42-47: Returns all canvas dimensions
- No changes needed

### 3. **functions/submit-drawing-test.js** - NO CHANGES NEEDED ✅
**Status:** Already handles drawing data correctly
- Lines 54-75: Properly processes drawing data
- No changes needed

### 4. **functions/update-drawing-test-score.js** - NO CHANGES NEEDED ✅
**Status:** Only handles scoring, no canvas logic
- No changes needed

### 5. **database_schema_new.sql** - NO CHANGES NEEDED ✅
**Status:** Schema is perfect as-is
- `canvas_width/height` = viewport size (600x800)
- `max_canvas_width/height` = actual canvas size (1536x2048)
- No changes needed

## Files That DON'T Need Changes

### Frontend Files (No Changes Needed):
- `src/components/ui/Card.jsx` ✅
- `src/components/ui/Button.jsx` ✅
- `src/components/ui/LoadingSpinner.jsx` ✅
- `src/components/ui/Notification.jsx` ✅
- `src/contexts/AuthContext.jsx` ✅
- `src/services/apiClient.js` ✅
- `src/services/authService.js` ✅
- `src/services/testService.js` ✅
- `src/services/userService.js` ✅
- `src/utils/` (all utility files) ✅

### Backend Files (No Changes Needed):
- `functions/validate-token.js` ✅
- `functions/get-all-tests.js` ✅
- `functions/get-teacher-active-tests.js` ✅
- `functions/get-student-active-tests.js` ✅
- `functions/assign-test.js` ✅
- `functions/assign-test-to-classes.js` ✅
- `functions/check-test-completion.js` ✅
- `functions/delete-test.js` ✅
- `functions/delete-test-data.js` ✅
- `functions/delete-test-assignments.js` ✅
- `functions/remove-assignment.js` ✅
- `functions/get-test-questions.js` ✅
- `functions/get-test-results.js` ✅
- `functions/get-teacher-student-results.js` ✅
- `functions/get-student-test-results.js` ✅

## Implementation Priority

### Phase 1: Core Canvas Logic (Critical)
1. **DrawingTestStudent.jsx** - Canvas size logic (lines 610-615)
2. **DrawingTestStudent.jsx** - getResponsiveDimensions (lines 650-669)
3. **DrawingTestStudent.jsx** - Zoom limits (lines 696-703)
4. **DrawingModal.jsx** - Canvas size logic (lines 161-178)

### Phase 2: Two-Finger Gestures (Important)
5. **DrawingTestStudent.jsx** - Touch handlers (lines 119-132)
6. **DrawingModal.jsx** - Touch handlers (new)
7. **Both files** - Stage component updates

### Phase 3: UI Improvements (Nice to Have)
8. **DrawingTestCreator.jsx** - UI labels (lines 240-283)
9. **DrawingModal.jsx** - Zoom controls (lines 196-237)
10. **useKonvaCanvas.js** - Hook enhancement

## Risk Assessment

### High Risk (Core Functionality):
- **DrawingTestStudent.jsx** canvas size logic - Could break drawing completely
- **getResponsiveDimensions** - Could break fullscreen mode
- **Zoom limits** - Could break zoom functionality

### Medium Risk (User Experience):
- **Two-finger gestures** - Could interfere with drawing
- **DrawingModal.jsx** canvas logic - Could break teacher viewing

### Low Risk (UI Polish):
- **UI labels** - Cosmetic only
- **Zoom controls** - Enhancement only

## Testing Requirements

### Phase 1 Testing:
- [ ] Student can draw normally
- [ ] Fullscreen mode works correctly
- [ ] Zoom in/out works properly
- [ ] Teacher can view drawings correctly

### Phase 2 Testing:
- [ ] Two-finger zoom works on mobile
- [ ] Two-finger pan works on mobile
- [ ] Single-finger drawing still works
- [ ] Gesture switching works smoothly

### Phase 3 Testing:
- [ ] UI labels are clear
- [ ] Zoom controls work properly
- [ ] Performance is acceptable
- [ ] Mobile experience is smooth

## Summary

**Total Files to Change: 3**
- `src/components/test/DrawingTestStudent.jsx` (MAJOR)
- `src/components/modals/DrawingModal.jsx` (MAJOR)  
- `src/components/test/DrawingTestCreator.jsx` (MINOR)

**Total Backend Changes: 0** ✅
- All backend functions already work correctly
- Database schema is perfect as-is
- No API changes needed

**Total New Files: 1**
- `src/hooks/useKonvaCanvas.js` (enhanced version)

This is a frontend-only change with no breaking backend modifications required!
