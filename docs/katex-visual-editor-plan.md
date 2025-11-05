# KaTeX Visual Editor Implementation Plan - Web App Only

## Overview
This document outlines the plan for adding KaTeX support with a **custom-built visual editor wrapper** to the web application. The visual editor will allow teachers and students to input mathematical notation (exponents, square roots, fractions) using intuitive button-based interfaces without requiring LaTeX syntax knowledge.

**Important**: We are building a **custom wrapper**, NOT using MathLive or any other existing math editor library. We will use KaTeX for rendering only, and build our own editor interface.

---

## Requirements Summary

### Teacher's Cabinet (Test Creator)
- **Location**: In test creator, near each question and answer field
- **Test Types**: Input, Multiple Choice, True/False tests
- **Button Placement**: Close to each question and answer input field
- **Functionality**: Button opens popup with visual editor for:
  - Exponents
  - Square root (should cover all highlighted text)
  - Fractions (type on top and bottom layers)

### Student Cabinet
- **Location**: In input tests only
- **Functionality**: Same button and visual editor as teachers
- **Purpose**: Allow students to type math notation in their answers

### Visual Editor Requirements
- **Single Input Field**: Only 1 input field in the editor
- **Square Root**: Press square root button → type symbols inside the square root
- **Exponent**: Press exponent button → type exponent on top of X, Y, or any symbol typed before
- **Fraction**: Press fraction button → type numerator on top, denominator on bottom

### Technical Requirements
- **Custom Wrapper**: Build our own visual editor, NOT using MathLive or other libraries
- Math formulas must render correctly for students
- Formulas must be correctly written to and read from database
- Store formulas in LaTeX format in database
- Render formulas using KaTeX when displaying
- **Insert Behavior**: When "Insert" button is clicked, insert math formula at cursor position in original text field WITHOUT deleting existing text

---

## Current State Analysis

### Existing Dependencies
- ✅ `katex` (v0.16.25) - Already installed
- ✅ `react-katex` (v3.1.0) - Already installed

### Components to Modify
1. **Teacher Components**:
   - `src/components/forms/QuestionForm.jsx` - Test creator form
   - `src/components/test/InputQuestion.jsx` - Input question component (teacher mode)
   - `src/components/test/MultipleChoiceQuestion.jsx` - Multiple choice component (teacher mode)
   - `src/components/test/TrueFalseQuestion.jsx` - True/false component (teacher mode)

2. **Student Components**:
   - `src/components/test/InputQuestion.jsx` - Input question component (student mode)

3. **New Components to Create**:
   - `src/components/math/MathVisualEditor.jsx` - Main visual editor component
   - `src/components/math/MathEditorButton.jsx` - Button component for triggering editor
   - `src/utils/mathRenderer.js` - Utility for rendering math (if not exists)

---

## Implementation Plan

### Phase 1: Setup and Dependencies

#### Step 1.1: Import KaTeX CSS
**File**: `src/main.jsx` or `src/App.jsx`

Add KaTeX CSS import:
```javascript
import 'katex/dist/katex.min.css';
```

#### Step 1.2: Create Math Rendering Utility
**File**: `src/utils/mathRenderer.js` (NEW)

Create utility functions for:
- Rendering LaTeX to HTML using KaTeX
- Parsing and validating math expressions
- Converting between different math formats

**Key Functions**:
```javascript
// Render LaTeX string to HTML
export const renderMathExpression = (latex, displayMode = false) => { ... }

// Render math within text (finds $...$ or $$...$$ and renders)
export const renderMathInText = (text, displayMode = false) => { ... }

// Validate LaTeX expression
export const validateMathExpression = (latex) => { ... }
```

---

### Phase 2: Create Visual Editor Component

#### Step 2.1: Create MathVisualEditor Component
**File**: `src/components/math/MathVisualEditor.jsx` (NEW)

**Purpose**: Visual editor popup with single input field and buttons for math operations

**Features**:
1. **Single Input Field**: Textarea for typing math expressions
2. **Button Toolbar**: 
   - Exponent button (x², xⁿ)
   - Square root button (√)
   - Fraction button (a/b)
   - Parentheses button
   - Basic operations (+, -, ×, ÷)
3. **Live Preview**: Shows rendered math below input
4. **Selection Handling**: 
   - Square root wraps selected text
   - Exponent applies to selected text or previous character
5. **Fraction Editor**: 
   - Separate input areas for numerator and denominator
   - Or single input with visual fraction structure

**Component Structure**:
```jsx
<MathVisualEditor
  value={currentValue}
  onChange={handleChange}
  onClose={handleClose}
  onSave={handleSave}
  initialValue={text}
/>
```

**UI Design**:
```
┌─────────────────────────────────────────┐
│  Math Visual Editor            [×]     │
├─────────────────────────────────────────┤
│  Input: [___________________________]   │
│                                         │
│  Toolbar:                               │
│  [x²] [xⁿ] [√x] [a/b] [()] [+][-][×][÷]│
│                                         │
│  Live Preview:                          │
│  x² + √16 = 20                          │
│                                         │
│  [Cancel]  [Insert]                     │
└─────────────────────────────────────────┘
```

**Key Behaviors**:
1. **Exponent Button**:
   - If text is selected: wraps in `^{...}`
   - If no selection: inserts `^` and places cursor after caret
   - Example: Select "x" → click exponent → becomes "x^"

2. **Square Root Button**:
   - If text is selected: wraps in `\sqrt{...}`
   - If no selection: inserts `\sqrt{}` with cursor inside braces
   - Example: Select "x+1" → click square root → becomes "\sqrt{x+1}"

3. **Fraction Button**:
   - Opens fraction editor with two input fields (numerator and denominator)
   - Or inserts `\frac{}{}` with cursor in numerator
   - User types numerator, then denominator

---

### Phase 3: Create Math Editor Button Component

#### Step 3.1: Create MathEditorButton Component
**File**: `src/components/math/MathEditorButton.jsx` (NEW)

**Purpose**: Small button placed next to input fields that opens the visual editor

**Features**:
- Small icon button (e.g., "fx" or "√" icon)
- Positioned next to input/textarea fields
- Opens MathVisualEditor popup/modal
- **Captures cursor position** from the original field before opening editor
- **Inserts math formula at cursor position** when "Insert" is clicked, WITHOUT deleting existing text

**Component Structure**:
```jsx
<MathEditorButton
  inputRef={inputRef} // Reference to the input/textarea element
  value={fieldValue}
  onChange={handleFieldChange}
  position="right" // or "left"
  size="small"
/>
```

**Key Behavior**:
1. When button is clicked:
   - Capture current cursor position from input field using `inputRef.selectionStart`
   - Store the input reference and cursor position
   - Open MathVisualEditor modal with cursor position and input reference
2. When "Insert" is clicked in editor:
   - Insert the math formula at the stored cursor position
   - Preserve all existing text before and after cursor
   - Update cursor position to after inserted formula

**Example Implementation**:
```jsx
const MathEditorButton = ({ inputRef, onChange, ... }) => {
  const [showEditor, setShowEditor] = useState(false);
  
  const handleClick = () => {
    if (inputRef?.current) {
      const cursorPos = inputRef.current.selectionStart || 0;
      setShowEditor(true);
      // Pass cursor position and input ref to editor
    }
  };
  
  const handleInsert = (mathFormula) => {
    if (inputRef?.current) {
      const cursorPos = inputRef.current.selectionStart || 0;
      const currentValue = inputRef.current.value || '';
      const beforeCursor = currentValue.substring(0, cursorPos);
      const afterCursor = currentValue.substring(cursorPos);
      
      // Insert formula at cursor position WITHOUT deleting existing text
      const newValue = beforeCursor + mathFormula + afterCursor;
      
      // Update input field
      inputRef.current.value = newValue;
      
      // Trigger onChange to notify parent component
      const event = new Event('input', { bubbles: true });
      inputRef.current.dispatchEvent(event);
      
      // Move cursor after inserted formula
      const newCursorPos = cursorPos + mathFormula.length;
      setTimeout(() => {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    setShowEditor(false);
  };
  
  return (
    <>
      <button onClick={handleClick}>fx</button>
      {showEditor && (
        <MathVisualEditor
          inputRef={inputRef?.current}
          cursorPosition={inputRef?.current?.selectionStart || 0}
          onSave={handleInsert}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
};
```

**Styling**:
- Small, unobtrusive button
- Positioned inline with input field
- Icon: "fx" or mathematical symbol

---

### Phase 4: Integrate Visual Editor into Teacher Components

#### Step 4.1: Update QuestionForm Component
**File**: `src/components/forms/QuestionForm.jsx`

**Changes**:
1. Import `MathEditorButton` component
2. Add button next to question textarea
3. Add button next to each answer option input (for multiple choice)
4. Add button next to correct answer input (for true/false)
5. Add button next to each answer field (for input tests)

**Implementation**:
```jsx
// For question field
<div className="relative">
  <textarea ... />
  <MathEditorButton
    value={questionText}
    onChange={(newValue) => handleQuestionChange(newValue)}
    position="right"
  />
</div>

// For answer fields
<div className="relative">
  <input ... />
  <MathEditorButton
    value={answerValue}
    onChange={(newValue) => handleAnswerChange(newValue)}
    position="right"
  />
</div>
```

#### Step 4.2: Update InputQuestion Component (Teacher Mode)
**File**: `src/components/test/InputQuestion.jsx`

**Changes**:
1. Add `MathEditorButton` next to question textarea
2. Add `MathEditorButton` next to each answer input field
3. Ensure math formulas are saved correctly

**Location**: In `renderTeacherMode()` function

#### Step 4.3: Update MultipleChoiceQuestion Component (Teacher Mode)
**File**: `src/components/test/MultipleChoiceQuestion.jsx`

**Changes**:
1. Add `MathEditorButton` next to question textarea
2. Add `MathEditorButton` next to each option input field
3. Ensure math formulas are saved correctly

#### Step 4.4: Update TrueFalseQuestion Component (Teacher Mode)
**File**: `src/components/test/TrueFalseQuestion.jsx`

**Changes**:
1. Add `MathEditorButton` next to question textarea
2. Note: True/false typically doesn't need answer math input, but include for consistency

---

### Phase 5: Integrate Visual Editor into Student Components

#### Step 5.1: Update InputQuestion Component (Student Mode)
**File**: `src/components/test/InputQuestion.jsx`

**Changes**:
1. Add `MathEditorButton` next to answer input field
2. Ensure math formulas are saved correctly
3. Ensure math formulas are displayed correctly when loading saved answers

**Location**: In `renderStudentMode()` function

**Note**: Only for input tests, not multiple choice or true/false

---

### Phase 6: Math Rendering for Display

#### Step 6.1: Update Question Display Components

**Files to Update**:
- `src/components/test/InputQuestion.jsx`
- `src/components/test/MultipleChoiceQuestion.jsx`
- `src/components/test/TrueFalseQuestion.jsx`

**Changes**:
1. Import `renderMathInText` utility
2. Update `formatQuestion()` function to render math
3. Use `dangerouslySetInnerHTML` with rendered math
4. Ensure KaTeX CSS is loaded

**Implementation**:
```javascript
import { renderMathInText } from '../../utils/mathRenderer';

const formatQuestion = useCallback((questionText) => {
  if (!questionText) return '';
  
  // Render math expressions in text
  // Support both $...$ for inline and $$...$$ for display
  return renderMathInText(questionText, false);
}, []);
```

#### Step 6.2: Update Answer Display Components

**For Student Answers**:
- When displaying student answers, render math if present
- Use same `renderMathInText` utility

**For Correct Answers**:
- When showing correct answers, render math
- Ensure proper formatting

---

### Phase 7: Database Storage

#### Step 7.1: Storage Format
- **Format**: Store LaTeX syntax directly in TEXT fields
- **No Schema Changes**: Existing TEXT fields can store LaTeX
- **Examples**:
  - `x^2` for exponent
  - `\sqrt{x}` for square root
  - `\frac{a}{b}` for fraction

#### Step 7.2: Validation
- Validate LaTeX syntax before saving
- Show error if invalid syntax
- Allow saving even if syntax is invalid (for manual editing)

---

## Visual Editor Detailed Design

### MathVisualEditor Component Structure

```jsx
const MathVisualEditor = ({
  value = '',
  onChange,
  onClose,
  onSave,
  initialValue = '',
  cursorPosition = null, // Cursor position in original field
  inputRef = null // Reference to original input/textarea
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const editorInputRef = useRef(null);

  // Handle exponent button
  const handleExponent = () => {
    const { start, end } = selection;
    const selectedText = inputValue.substring(start, end);
    
    if (selectedText) {
      // Wrap selected text in exponent
      const newValue = 
        inputValue.substring(0, start) + 
        `^{${selectedText}}` + 
        inputValue.substring(end);
      setInputValue(newValue);
      // Place cursor after exponent
      setTimeout(() => {
        editorInputRef.current?.focus();
        editorInputRef.current?.setSelectionRange(
          start + selectedText.length + 4, 
          start + selectedText.length + 4
        );
      }, 0);
    } else {
      // Insert caret at cursor
      const newValue = 
        inputValue.substring(0, start) + 
        '^' + 
        inputValue.substring(end);
      setInputValue(newValue);
      setTimeout(() => {
        editorInputRef.current?.focus();
        editorInputRef.current?.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  };

  // Handle square root button
  const handleSquareRoot = () => {
    const { start, end } = selection;
    const selectedText = inputValue.substring(start, end);
    
    if (selectedText) {
      // Wrap selected text in square root
      const newValue = 
        inputValue.substring(0, start) + 
        `\\sqrt{${selectedText}}` + 
        inputValue.substring(end);
      setInputValue(newValue);
      // Place cursor after square root
      setTimeout(() => {
        editorInputRef.current?.focus();
        editorInputRef.current?.setSelectionRange(
          start + selectedText.length + 8, 
          start + selectedText.length + 8
        );
      }, 0);
    } else {
      // Insert empty square root
      const newValue = 
        inputValue.substring(0, start) + 
        '\\sqrt{}' + 
        inputValue.substring(end);
      setInputValue(newValue);
      // Place cursor inside braces
      setTimeout(() => {
        editorInputRef.current?.focus();
        editorInputRef.current?.setSelectionRange(start + 6, start + 6);
      }, 0);
    }
  };

  // Handle fraction button
  const handleFraction = () => {
    const { start } = selection;
    const newValue = 
      inputValue.substring(0, start) + 
      '\\frac{}{}' + 
      inputValue.substring(selection.end);
    setInputValue(newValue);
    // Place cursor in numerator
    setTimeout(() => {
      editorInputRef.current?.focus();
      editorInputRef.current?.setSelectionRange(start + 6, start + 6);
    }, 0);
  };

  // Track selection
  const handleSelect = (e) => {
    setSelection({
      start: e.target.selectionStart,
      end: e.target.selectionEnd
    });
  };

  return (
    <div className="math-visual-editor-modal">
      <div className="math-visual-editor-content">
        <div className="math-editor-header">
          <h3>Math Visual Editor</h3>
          <button onClick={onClose}>×</button>
        </div>
        
        <div className="math-editor-input-section">
          <textarea
            ref={editorInputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange?.(e.target.value);
            }}
            onSelect={handleSelect}
            className="math-editor-input"
            placeholder="Type math expression or use buttons below..."
          />
        </div>

        <div className="math-editor-toolbar">
          <button onClick={handleExponent} title="Exponent">
            x²
          </button>
          <button onClick={() => handleExponent('n')} title="Exponent (n)">
            xⁿ
          </button>
          <button onClick={handleSquareRoot} title="Square Root">
            √x
          </button>
          <button onClick={handleFraction} title="Fraction">
            a/b
          </button>
          <button onClick={() => insertText('(')} title="Left Parenthesis">
            (
          </button>
          <button onClick={() => insertText(')')} title="Right Parenthesis">
            )
          </button>
          <button onClick={() => insertText('+')} title="Plus">
            +
          </button>
          <button onClick={() => insertText('-')} title="Minus">
            -
          </button>
          <button onClick={() => insertText('\\times')} title="Times">
            ×
          </button>
          <button onClick={() => insertText('\\div')} title="Divide">
            ÷
          </button>
        </div>

        <div className="math-editor-preview">
          <div className="preview-label">Preview:</div>
          <div 
            className="preview-content"
            dangerouslySetInnerHTML={{
              __html: renderMathExpression(inputValue, false)
            }}
          />
        </div>

        <div className="math-editor-actions">
          <button onClick={onClose} className="btn-cancel">
            Cancel
          </button>
          <button 
            onClick={() => {
              // Insert math formula at cursor position in original field
              if (inputRef && cursorPosition !== null) {
                const currentValue = inputRef.value || '';
                const beforeCursor = currentValue.substring(0, cursorPosition);
                const afterCursor = currentValue.substring(cursorPosition);
                const newValue = beforeCursor + inputValue + afterCursor;
                
                // Update the original input field
                inputRef.value = newValue;
                
                // Trigger onChange event to notify parent
                const event = new Event('input', { bubbles: true });
                inputRef.dispatchEvent(event);
                
                // Set cursor position after inserted formula
                const newCursorPos = cursorPosition + inputValue.length;
                setTimeout(() => {
                  inputRef.focus();
                  inputRef.setSelectionRange(newCursorPos, newCursorPos);
                }, 0);
              }
              
              onSave?.(inputValue);
              onClose();
            }} 
            className="btn-save"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Implementation Steps Checklist

### Phase 1: Setup
- [ ] Import KaTeX CSS in main entry point
- [ ] Create `src/utils/mathRenderer.js` utility
- [ ] Test math rendering with sample expressions

### Phase 2: Visual Editor Component
- [ ] Create `src/components/math/MathVisualEditor.jsx`
- [ ] Implement single input field
- [ ] Implement exponent button (with selection handling)
- [ ] Implement square root button (with selection handling)
- [ ] Implement fraction button
- [ ] Implement live preview
- [ ] Style the editor modal/popup
- [ ] Test all button interactions

### Phase 3: Editor Button Component
- [ ] Create `src/components/math/MathEditorButton.jsx`
- [ ] Style button to be small and unobtrusive
- [ ] Implement popup/modal opening
- [ ] Test button placement next to inputs

### Phase 4: Teacher Integration
- [ ] Update `QuestionForm.jsx` - add buttons to question fields
- [ ] Update `QuestionForm.jsx` - add buttons to answer fields
- [ ] Update `InputQuestion.jsx` (teacher mode) - add buttons
- [ ] Update `MultipleChoiceQuestion.jsx` (teacher mode) - add buttons
- [ ] Update `TrueFalseQuestion.jsx` (teacher mode) - add buttons
- [ ] Test math input in all test types

### Phase 5: Student Integration
- [ ] Update `InputQuestion.jsx` (student mode) - add button to answer field
- [ ] Test math input for students
- [ ] Test math answer saving and loading

### Phase 6: Rendering
- [ ] Update question display to render math
- [ ] Update answer display to render math
- [ ] Test math rendering in all components
- [ ] Ensure KaTeX CSS is properly loaded

### Phase 7: Database & Validation
- [ ] Test LaTeX storage in database
- [ ] Test LaTeX retrieval from database
- [ ] Add validation for LaTeX syntax (optional)
- [ ] Test edge cases (empty math, invalid syntax)

---

## Styling Guidelines

### Math Editor Modal
- Centered modal overlay
- Clean, modern design
- Responsive on mobile devices
- Clear button labels
- Live preview prominently displayed

### Editor Button
- Small icon button (e.g., 24x24px or 32x32px)
- Positioned inline with input field
- Icon: "fx" or mathematical symbol (√, x²)
- Hover effect
- Tooltip: "Math Editor"

### Live Preview
- Rendered math displayed clearly
- Good contrast
- Proper spacing
- Responsive sizing

---

## Testing Requirements

### Functional Testing
1. **Exponent Button**:
   - Test with selected text
   - Test without selection
   - Test with multiple selections
   - Test exponent on existing text

2. **Square Root Button**:
   - Test with selected text
   - Test without selection
   - Test wrapping complex expressions

3. **Fraction Button**:
   - Test inserting fraction
   - Test typing numerator and denominator
   - Test nested fractions

4. **Integration**:
   - Test in teacher mode (all test types)
   - Test in student mode (input tests)
   - Test saving to database
   - Test loading from database
   - Test rendering in questions
   - Test rendering in answers

### Edge Cases
- Empty input
- Invalid LaTeX syntax
- Very long expressions
- Nested expressions (fraction in fraction)
- Special characters

### Browser Compatibility
- Chrome
- Firefox
- Safari
- Edge

---

## Example Usage

### Teacher Creating Question
1. Teacher types question text: "What is the value of " (cursor is here)
2. Clicks math editor button next to question field
   - **Cursor position is captured** (e.g., position 25)
3. Visual editor opens (empty editor)
4. Teacher types "x" and selects it
5. Clicks exponent button → becomes "x^"
6. Types "2" → becomes "x^2"
7. Clicks "Insert" → 
   - **Formula "x^2" is inserted at cursor position 25**
   - **Existing text is preserved**: "What is the value of x^2" (cursor now at position 29)
   - No text is deleted
8. Teacher continues typing: " when x = 5?"
   - Final text: "What is the value of x^2 when x = 5?"
9. Question saves with LaTeX: "What is the value of x^2 when x = 5?"
10. Student sees rendered: "What is the value of x² when x = 5?"

### Student Answering Question
1. Student sees question with math notation rendered
2. Student types answer: "The answer is " (cursor is here)
3. Student clicks math editor button next to answer field
   - **Cursor position is captured** (e.g., position 14)
4. Visual editor opens (empty editor)
5. Student types "x" and selects it
6. Clicks exponent button → becomes "x^"
7. Types "2" → becomes "x^2"
8. Clicks "Insert" → 
   - **Formula "x^2" is inserted at cursor position 14**
   - **Existing text is preserved**: "The answer is x^2" (cursor now at position 18)
   - No text is deleted
9. Student continues typing: " = 25"
   - Final answer: "The answer is x^2 = 25"
10. Answer saves as LaTeX: "The answer is x^2 = 25"
11. On review, answer displays as: "The answer is x² = 25"

---

## Files to Create/Modify

### New Files
1. `src/components/math/MathVisualEditor.jsx`
2. `src/components/math/MathEditorButton.jsx`
3. `src/utils/mathRenderer.js` (if not exists)

### Files to Modify
1. `src/main.jsx` or `src/App.jsx` - Add KaTeX CSS import
2. `src/components/forms/QuestionForm.jsx` - Add editor buttons
3. `src/components/test/InputQuestion.jsx` - Add editor buttons, update rendering
4. `src/components/test/MultipleChoiceQuestion.jsx` - Add editor buttons, update rendering
5. `src/components/test/TrueFalseQuestion.jsx` - Add editor buttons, update rendering

---

## Success Criteria

1. ✅ KaTeX CSS is imported and loaded
2. ✅ Visual editor component works with single input field
3. ✅ Exponent button works (wraps selection or inserts caret)
4. ✅ Square root button works (wraps selection or inserts empty)
5. ✅ Fraction button works (inserts fraction structure)
6. ✅ Editor buttons appear next to question/answer fields in teacher mode
7. ✅ Editor button appears next to answer field in student mode (input tests)
8. ✅ Math formulas render correctly when displaying questions
9. ✅ Math formulas render correctly when displaying answers
10. ✅ Math formulas save correctly to database (LaTeX format)
11. ✅ Math formulas load correctly from database
12. ✅ Live preview works in visual editor
13. ✅ All test types support math input (input, multiple choice, true/false)
14. ✅ UI is clean and intuitive
15. ✅ **Insert preserves existing text** - formula is inserted at cursor position without deleting any text
16. ✅ **Cursor position is correctly captured** and restored after insertion

---

## Notes

- **Custom Wrapper**: We are building our own custom visual editor wrapper. We are NOT using MathLive or any other existing math editor library. KaTeX is used only for rendering, not for editing.
- **Web App Only**: This plan focuses on web app implementation. Android app implementation would require separate React Native components.
- **LaTeX Storage**: All math is stored as LaTeX in database TEXT fields
- **Insert Behavior**: The editor inserts math formulas at the cursor position in the original text field WITHOUT deleting any existing text. This preserves all user input.
- **Backward Compatibility**: Existing questions without math notation will continue to work
- **Future Enhancements**: Could add more math symbols, equation editor, etc.

---

## References

- KaTeX Documentation: https://katex.org/
- KaTeX React: https://github.com/KaTeX/KaTeX
- LaTeX Math Syntax: https://www.overleaf.com/learn/latex/Mathematical_expressions

