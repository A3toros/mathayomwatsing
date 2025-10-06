# Text Block Drag Refactor Plan

## Current Problem
- **Teacher View** (`ViewerCanvas`): Has interactive text block logic (should be read-only)
- **Student View** (`CanvasViewer`): Has static text blocks (should be interactive)

## Goal
- **Teacher View**: Remove interactive logic, make text blocks read-only
- **Student View**: Add interactive text block logic for dragging and editing

## Plan

### Phase 1: Remove Interactive Logic from Teacher View (ViewerCanvas)

#### Files to modify:
- `src/components/modals/DrawingModalNew/components/ViewerCanvas.jsx`

#### Changes needed:
1. **Remove drag state management**:
   - Remove `dragEnabledFor` ref
   - Remove `longPressTimers` ref
   - Remove `enableDragForIndex` function
   - Remove `disableDragForIndex` function

2. **Remove interactive event handlers**:
   - Remove `onPointerDown` with long-press timer
   - Remove `onPointerUp` with timer cleanup
   - Remove `onPointerLeave` with timer cleanup
   - Remove `onDblClick` and `onDblTap` handlers

3. **Remove draggable functionality**:
   - Remove `draggable={dragEnabledFor.current.has(i)}` prop
   - Remove `onTextBoxEdit` prop and related logic

4. **Simplify text block rendering**:
   - Keep text blocks as static `Rect` and `Text` elements
   - Remove `Group` wrapper with event handlers
   - Make text blocks purely visual (read-only)

### Phase 2: Add Interactive Logic to Student View (CanvasViewer)

#### Files to modify:
- `src/components/modals/DrawingModalNew/components/CanvasViewer.jsx`

#### Changes needed:
1. **Add drag state management**:
   - Add `dragEnabledFor` ref (Set of enabled indices)
   - Add `longPressTimers` ref (Map of timer IDs)
   - Add `enableDragForIndex` function
   - Add `disableDragForIndex` function

2. **Add interactive event handlers**:
   - Add `onPointerDown` with 400ms long-press timer
   - Add `onPointerUp` with timer cleanup
   - Add `onPointerLeave` with timer cleanup
   - Add `onDblClick` and `onDblTap` for text editing

3. **Add draggable functionality**:
   - Add `draggable={dragEnabledFor.current.has(i)}` prop
   - Add `onTextBoxEdit` prop for text editing
   - Add drag event handlers (`onDragStart`, `onDragMove`, `onDragEnd`)

4. **Wrap text blocks in Group**:
   - Replace static `Rect` and `Text` with `Group` wrapper
   - Add all event handlers to the `Group`
   - Keep `Rect` and `Text` as children of the `Group`

### Phase 3: Update DrawingModal Integration

#### Files to modify:
- `src/components/modals/DrawingModalNew/DrawingModal.jsx`

#### Changes needed:
1. **Teacher View (ViewerCanvas)**:
   - Remove `onTextBoxEdit` prop (no longer needed)
   - Keep as read-only viewer

2. **Student View (CanvasViewer)**:
   - Add `onTextBoxEdit` prop for text editing functionality
   - Ensure proper event handling integration

### Phase 4: Add Text Editing Functionality

#### Files to modify:
- `src/components/modals/DrawingModalNew/components/CanvasViewer.jsx`
- `src/components/modals/DrawingModalNew/DrawingModal.jsx`

#### Changes needed:
1. **Add text editing state**:
   - Add `editingTextIndex` state
   - Add `editingTextValue` state
   - Add text editing modal/input handling

2. **Add text editing handlers**:
   - Add `handleTextEdit` function
   - Add `handleTextSave` function
   - Add `handleTextCancel` function

3. **Add text editing UI**:
   - Add text editing input/modal
   - Add save/cancel buttons
   - Handle text editing workflow

## Implementation Order

1. **Step 1**: Remove interactive logic from `ViewerCanvas` (teacher view)
2. **Step 2**: Add interactive logic to `CanvasViewer` (student view)
3. **Step 3**: Update `DrawingModal` integration
4. **Step 4**: Add text editing functionality
5. **Step 5**: Test both teacher and student views

## Expected Results

### Teacher View (ViewerCanvas):
- ✅ Text blocks are read-only (no dragging, no editing)
- ✅ Teachers can view student drawings with text blocks
- ✅ No interactive text block functionality

### Student View (CanvasViewer):
- ✅ Text blocks are draggable (long-press to enable)
- ✅ Text blocks can be edited (double-tap to edit)
- ✅ Proper mobile touch handling
- ✅ Text editing workflow

## Files to Create/Modify

### Files to modify:
1. `src/components/modals/DrawingModalNew/components/ViewerCanvas.jsx`
2. `src/components/modals/DrawingModalNew/components/CanvasViewer.jsx`
3. `src/components/modals/DrawingModalNew/DrawingModal.jsx`
4. `src/components/test/TextBox.jsx` ⭐ **CRITICAL FIX NEEDED**

### New files (if needed):
1. `src/components/modals/DrawingModalNew/components/TextEditModal.jsx` (for text editing UI)

## ⚠️ **CRITICAL ISSUE FOUND: TextBox.jsx**

### **Current Problems in `src/components/test/TextBox.jsx`:**

#### **❌ Problem 1: Immediate Dragging (No Long-Press)**
```javascript
<Group
  x={x}
  y={y}
  draggable  // ❌ ALWAYS draggable - should require long-press
  onClick={(e) => {
    e.cancelBubble = true;
    onSelect(id);
  }}
  onDblClick={handleDoubleClick}  // ❌ Only desktop double-click
  onDragEnd={handleDragEnd}
>
```

#### **❌ Problem 2: Missing Mobile Touch Events**
- Only has `onDblClick` (desktop only)
- Missing `onDblTap` for mobile double-tap
- Missing long-press activation logic

#### **❌ Problem 3: No Drag State Management**
- No `dragEnabledFor` ref
- No `longPressTimers` ref
- No `enableDragForIndex`/`disableDragForIndex` functions
- No `onPointerDown`/`onPointerUp`/`onPointerLeave` handlers

### **Required Fixes for TextBox.jsx:**

1. **Add long-press activation logic**:
   - Add `dragEnabledFor` ref (Set of enabled indices)
   - Add `longPressTimers` ref (Map of timer IDs)
   - Add `enableDragForIndex`/`disableDragForIndex` functions

2. **Add mobile touch event handlers**:
   - Add `onPointerDown` with 400ms long-press timer
   - Add `onPointerUp` with timer cleanup
   - Add `onPointerLeave` with timer cleanup
   - Add `onDblTap` for mobile double-tap

3. **Add conditional dragging**:
   - Change `draggable` to `draggable={dragEnabledFor.current.has(id)}`
   - Add proper drag state management

4. **Add mobile touch support**:
   - Add `onDblTap` alongside `onDblClick`
   - Ensure proper mobile touch handling

## **What Double-Tap Does:**

### **Current Flow (Desktop):**
1. **Double-click** → `handleDoubleClick` → `onUpdate(id, { isEditing: true })`
2. **Parent component** (`DrawingTestStudent.jsx`) receives `isEditing: true`
3. **Parent sets state**: `setIsEditingText(true)` + `setEditingTextBox(textBox)`
4. **TextEditOverlay appears**: A textarea overlay positioned over the text block
5. **User can edit**: Type new text, press Enter to save, or Escape to cancel
6. **On save**: `handleTextBoxUpdate` updates the text content

### **Missing Mobile Flow:**
- **Mobile double-tap** should do the **exact same thing** as desktop double-click
- **Problem**: `TextBox.jsx` only has `onDblClick` (desktop) - missing `onDblTap` (mobile)
- **Solution**: Add `onDblTap={handleDoubleClick}` to the Group component

### **TextEditOverlay Features:**
- ✅ **Auto-focus**: Textarea gets focus and selects all text
- ✅ **Keyboard shortcuts**: Enter to save, Escape to cancel
- ✅ **Auto-save on blur**: Saves when user clicks away
- ✅ **Positioned overlay**: Appears exactly over the text block
- ✅ **Styled**: Orange border, proper sizing, z-index 1000

### **Implementation Priority:**
1. **HIGH PRIORITY**: Fix `TextBox.jsx` - this is the main issue
2. Remove interactive logic from `ViewerCanvas.jsx` (teacher view)
3. Update `DrawingModal.jsx` integration

## **Complete Fix for TextBox.jsx:**

### **Current Broken Code:**
```javascript
<Group
  x={x}
  y={y}
  draggable  // ❌ ALWAYS draggable - causes immediate dragging
  onClick={(e) => {
    e.cancelBubble = true;
    onSelect(id);
  }}
  onDblClick={handleDoubleClick}  // ❌ Only desktop - missing mobile
  onDragEnd={handleDragEnd}
>
```

### **Fixed Code:**
```javascript
const TextBox = ({ 
  id, 
  x, 
  y, 
  width, 
  height, 
  text, 
  fontSize,
  color,
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete 
}) => {
  // ✅ Add drag state management
  const dragEnabledFor = useRef(new Set());
  const longPressTimers = useRef(new Map());

  const enableDragForIndex = (index) => {
    dragEnabledFor.current.add(index);
  };

  const disableDragForIndex = (index) => {
    dragEnabledFor.current.delete(index);
  };

  const handleDoubleClick = (e) => {
    e.cancelBubble = true;
    onUpdate(id, { isEditing: true });
  };

  const handleDragEnd = (e) => {
    onUpdate(id, { 
      x: e.target.x(), 
      y: e.target.y() 
    });
  };

  return (
    <Group
      x={x}
      y={y}
      draggable={dragEnabledFor.current.has(id)}  // ✅ Conditional dragging
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(id);
      }}
      onDblClick={handleDoubleClick}  // ✅ Desktop double-click
      onDblTap={handleDoubleClick}     // ✅ Mobile double-tap
      onPointerDown={(e) => {          // ✅ Long-press activation
        e.cancelBubble = true;
        const timerId = setTimeout(() => {
          enableDragForIndex(id);
        }, 400);
        longPressTimers.current.set(id, timerId);
      }}
      onPointerUp={(e) => {            // ✅ Timer cleanup
        e.cancelBubble = true;
        const timerId = longPressTimers.current.get(id);
        if (timerId) {
          clearTimeout(timerId);
          longPressTimers.current.delete(id);
        }
        setTimeout(() => disableDragForIndex(id), 0);
      }}
      onPointerLeave={() => {          // ✅ Timer cleanup on leave
        const timerId = longPressTimers.current.get(id);
        if (timerId) {
          clearTimeout(timerId);
          longPressTimers.current.delete(id);
        }
        disableDragForIndex(id);
      }}
      onDragEnd={handleDragEnd}
    >
      {/* Rect and Text elements remain the same */}
    </Group>
  );
};
```

### **Key Changes:**
1. **✅ Add imports**: `import { useRef } from 'react';`
2. **✅ Add drag state**: `dragEnabledFor` and `longPressTimers` refs
3. **✅ Add helper functions**: `enableDragForIndex` and `disableDragForIndex`
4. **✅ Add mobile touch**: `onDblTap={handleDoubleClick}`
5. **✅ Add long-press logic**: `onPointerDown`, `onPointerUp`, `onPointerLeave`
6. **✅ Add conditional dragging**: `draggable={dragEnabledFor.current.has(id)}`

### **Expected Behavior After Fix:**
- **✅ Long-press (400ms)**: Enables dragging
- **✅ Double-tap**: Opens text editing overlay
- **✅ Single tap**: Selects text block
- **✅ Drag end**: Updates position
- **✅ Mobile support**: Works on both desktop and mobile

## Testing Checklist

- [ ] Teacher view: Text blocks are read-only
- [ ] Student view: Text blocks are draggable (long-press)
- [ ] Student view: Text blocks can be edited (double-tap)
- [ ] Mobile touch handling works correctly
- [ ] No conflicts between teacher and student views
- [ ] Text editing workflow works properly
