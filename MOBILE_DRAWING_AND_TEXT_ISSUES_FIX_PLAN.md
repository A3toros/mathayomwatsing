# Mobile Drawing and Text Box Issues Fix Plan

## Problem Analysis

### Issue 1: Page Still Scrolls While Drawing
**Root Cause**: The current `handleTouchMove` implementation has a logical flaw:
- Line 492-496: `preventDefault()` is called for single-finger drawing, but only when `!isGestureActive`
- However, `isGestureActive` is only set to `true` for two-finger gestures (line 421)
- For single-finger drawing, `isGestureActive` remains `false`, so `preventDefault()` should work
- **The issue**: The condition `touches.length === 1 && !isGestureActive` may not be sufficient to prevent all scrolling scenarios

### Issue 2: Text Box Double-Tap Doesn't Work on Mobile
**Root Cause**: Mobile devices don't have native "double-click" events:
- `TextBox.jsx` line 18-21: Uses `onDblClick={handleDoubleClick}` 
- Mobile browsers don't fire `dblclick` events reliably
- Need to implement custom double-tap detection using touch events
- `TextEditOverlay.jsx` needs mobile-specific input handling

## Solution Plan

### Phase 1: Fix Scrolling While Drawing
1. **Enhanced Touch Event Prevention**
   - Add `preventDefault()` to `handleTouchStart` for single-finger touches when drawing
   - Add `preventDefault()` to `handleTouchMove` for ALL single-finger movements during drawing
   - Add `preventDefault()` to `handleTouchEnd` when finishing a drawing stroke
   - Ensure `touch-action: none` CSS property is set on the canvas container

2. **CSS Touch Action Fix**
   - Add `touch-action: none` to the Konva Stage container
   - This prevents browser's default touch behaviors (scroll, zoom, pan)

### Phase 2: Fix Text Box Double-Tap on Mobile
1. **Custom Double-Tap Detection**
   - Replace `onDblClick` with custom touch event handling in `TextBox.jsx`
   - Implement tap timing detection (e.g., 300ms between taps)
   - Track tap coordinates to ensure they're within reasonable distance

2. **Mobile-Optimized Text Editing**
   - Update `TextEditOverlay.jsx` to handle mobile keyboard properly
   - Add mobile-specific input attributes (`inputMode`, `autoComplete`)
   - Ensure proper focus and selection on mobile devices
   - Add touch event handling for mobile text editing

3. **Touch Event Integration**
   - Add touch event handlers to `TextBox` component
   - Ensure touch events don't interfere with drawing functionality
   - Implement proper event propagation control

### Phase 3: Enhanced Mobile Experience
1. **Touch Feedback**
   - Add visual feedback for text box selection on mobile
   - Implement haptic feedback if available
   - Add loading states for text editing

2. **Keyboard Handling**
   - Ensure mobile keyboard doesn't interfere with canvas
   - Handle keyboard show/hide events properly
   - Maintain canvas position when keyboard appears

## Implementation Steps

### Step 1: Fix Scrolling Issue
```javascript
// In handleTouchStart - add preventDefault for single finger drawing
if (touches.length === 1) {
  e.evt.preventDefault(); // Add this line
  setIsGestureActive(false);
  setGestureType(null);
  handleMouseDown(e);
}

// In handleTouchMove - ensure preventDefault for all single finger drawing
} else if (touches.length === 1 && !isGestureActive) {
  e.evt.preventDefault(); // This should already be there
  handleMouseMove(e);
}

// Add CSS touch-action: none to canvas container
```

### Step 2: Fix Text Box Double-Tap
```javascript
// In TextBox.jsx - replace onDblClick with custom touch handling
const [lastTap, setLastTap] = useState(null);
const DOUBLE_TAP_DELAY = 300;

const handleTouchStart = (e) => {
  const now = Date.now();
  if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
    // Double tap detected
    e.cancelBubble = true;
    onUpdate(id, { isEditing: true });
    setLastTap(null);
  } else {
    setLastTap(now);
  }
};
```

### Step 3: Mobile Text Editing
```javascript
// In TextEditOverlay.jsx - add mobile-specific attributes
<textarea
  ref={textareaRef}
  defaultValue={initialText}
  inputMode="text"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck="false"
  // ... existing props
/>
```

## Files to Modify

1. **src/components/test/DrawingTestStudent.jsx**
   - Add `preventDefault()` to `handleTouchStart` for single-finger touches
   - Ensure `touch-action: none` CSS is applied to canvas container
   - Add CSS class for touch-action control

2. **src/components/test/TextBox.jsx**
   - Replace `onDblClick` with custom touch event handling
   - Add double-tap detection logic
   - Add touch event handlers

3. **src/components/test/TextEditOverlay.jsx**
   - Add mobile-specific input attributes
   - Improve mobile keyboard handling
   - Add touch event support

4. **src/components/test/DrawingTestStudent.jsx** (CSS)
   - Add `touch-action: none` to canvas container
   - Ensure proper mobile styling

## Testing Checklist

- [ ] Single-finger drawing doesn't scroll the page
- [ ] Two-finger zoom/pan still works
- [ ] Text box double-tap works on mobile
- [ ] Text editing opens mobile keyboard
- [ ] Text editing doesn't interfere with drawing
- [ ] All touch gestures work as expected
- [ ] No regression in desktop functionality

## Expected Outcomes

1. **Scrolling Fixed**: Page will not scroll while drawing with single finger
2. **Text Editing Fixed**: Double-tap on text boxes will open editing mode on mobile
3. **Mobile Keyboard**: Text editing will properly trigger mobile keyboard
4. **Gesture Preservation**: Two-finger zoom/pan will continue to work
5. **No Regressions**: Desktop functionality remains unchanged

## Risk Assessment

- **Low Risk**: CSS touch-action changes are well-supported
- **Medium Risk**: Custom double-tap detection may need fine-tuning
- **Low Risk**: Mobile keyboard handling is standard web practice

## Success Criteria

- User can draw without page scrolling on mobile
- User can double-tap text boxes to edit on mobile
- Mobile keyboard appears and works properly for text editing
- All existing functionality preserved
- No performance degradation
