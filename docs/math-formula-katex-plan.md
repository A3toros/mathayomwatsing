# Math Formula Support with KaTeX - Implementation Plan

## Overview
Add math formula support using KaTeX for rendering LaTeX notation. This plan focuses on the web app only, providing a simple UI helper to insert LaTeX code for exponents, square roots, and fractions.

## Architecture Decision
- **Rendering**: KaTeX (lightweight, fast, no runtime dependencies)
- **Visual Editing**: Custom wrapper using contentEditable div + KaTeX rendering
- **Storage**: LaTeX code stored as text in database (with `$...$` delimiters for inline math)
- **Display**: KaTeX renders LaTeX on the client side

**Custom Editor Approach**:
- Create custom visual math editor using contentEditable div
- Render LaTeX in real-time using KaTeX as user types
- Handle cursor positioning for exponents (cursor moves up visually)
- Export LaTeX code when user clicks "Insert"
- Insert LaTeX code into regular input/textarea fields

---

## Phase 1: Setup KaTeX

### 1.1 Install Dependencies
```bash
npm install katex react-katex
```

**Note**: We create a custom visual editor wrapper - no MathLive needed.

### 1.2 Import KaTeX CSS
- Add to `src/main.jsx`:
  ```javascript
  import 'katex/dist/katex.min.css';
  ```

### 1.3 Create Math Renderer Component
**File**: `src/components/math/MathRenderer.jsx`

- Component that:
  - Takes text content with LaTeX delimiters (`$...$` for inline, `$$...$$` for display)
  - Parses text to find LaTeX blocks
  - Renders LaTeX using `react-katex` (`InlineMath` and `BlockMath`)
  - Falls back to plain text if LaTeX fails to render
  - Handles mixed text and math content

**Example**:
```javascript
"Solve for x: $x^2 + 5x + 6 = 0$"
→ Renders: "Solve for x: " [KaTeX rendered formula]
```

---

## Phase 2: Create Math Helper UI Components

### 2.1 Math Helper Modal Component
**File**: `src/components/math/MathHelperModal.jsx`

- Modal/popup component with **custom visual math editor** and **3 toolbar buttons**:

  **Custom Visual Editor (Main)**:
  - Uses `contentEditable` div with KaTeX rendering
  - Maintains internal LaTeX string state
  - Renders LaTeX in real-time using KaTeX as user types
  - Tracks cursor position and "mode" (normal, superscript, inside sqrt, numerator, denominator)
  - Visually shows cursor moving up for exponents

  **Toolbar Buttons**:

  1. **Exponent Button** (x²):
     - Sets editor mode to "superscript"
     - Cursor visually moves up (rendered as superscript in preview)
     - User types exponent directly (e.g., "2") while in superscript mode
     - Renders as x² in real-time preview
     - Example: Type "x", press button (cursor moves up), type "2" → visual result: x²

  2. **Square Root Button** (√):
     - If text is selected/highlighted: wraps selected text with `\sqrt{...}`
     - If no selection: inserts `\sqrt{}` and sets mode to "inside sqrt"
     - Cursor moves inside square root (mode = "inside sqrt")
     - User types inside square root
     - Example: Select "x+1", press button → becomes `\sqrt{x+1}` visually

  3. **Fraction Button** (a/b):
     - Inserts `\frac{}{}` template
     - Sets mode to "numerator" (top layer)
     - Cursor moves to numerator position (rendered as fraction in preview)
     - User types numerator, presses Tab/Arrow Down → mode switches to "denominator" (bottom layer)
     - User types denominator
     - Visual fraction appears as user types
     - Example: Press button (cursor in numerator), type "1", Tab (cursor in denominator), type "2" → visual result: ½

  **How it works**:
  - User types or uses buttons in custom editor
  - LaTeX is built internally based on mode and input
  - Real-time KaTeX preview shows visual result
  - User clicks "Insert" button
  - Modal exports LaTeX string
  - LaTeX code is inserted into the original input/textarea field
  - KaTeX renders the LaTeX code everywhere else

### 2.1.1 Custom Math Editor Implementation
**File**: `src/components/math/CustomMathEditor.jsx`

**Simple Custom Editor for 3 Functions Only**:

- Lightweight React component that:
  - Uses simple text input or contentEditable div
  - Maintains LaTeX string state (e.g., `"x^{2}"`, `"\\sqrt{x+1}"`, `"\\frac{1}{2}"`)
  - Tracks editing mode: `'normal' | 'superscript' | 'inside-sqrt' | 'numerator' | 'denominator'`
  - Renders LaTeX in real-time using KaTeX (preview area below input)
  - Handles keyboard input to build LaTeX string based on current mode
  - Exports LaTeX string via `getValue()` method

**Simplified Approach**:
- **Input Area**: Regular text input or contentEditable div where user types
- **Preview Area**: KaTeX renders the LaTeX string in real-time below input
- **Mode Tracking**: Simple state variable tracking current editing mode
- **LaTeX Building**: Build LaTeX string based on mode and user input
- **No complex cursor positioning**: Just track mode and build LaTeX accordingly

**Example Flow**:
1. User types "x" → LaTeX: `"x"`
2. User clicks exponent button → Mode: `'superscript'`, LaTeX: `"x^{}"`
3. User types "2" → LaTeX: `"x^{2}"`, Preview shows: x²
4. User clicks "Insert" → Returns `"x^{2}"`

- Props:
  - `isOpen`: boolean
  - `onClose`: function
  - `onInsert`: function(latexString) - callback with LaTeX code to insert
  - `selectedText`: string - currently selected text in the input field (for square root wrapping)
  - `initialValue`: string - initial LaTeX value to load into MathfieldElement

### 2.2 Math Helper Button Component
**File**: `src/components/math/MathHelperButton.jsx`

- Button component (π symbol or "Math" text)
- Opens `MathHelperModal` when clicked
- Positioned next to input/textarea fields
- Tracks selected text from input/textarea for passing to modal

**Props**:
- `onInsert`: function(latexString) - callback when LaTeX is inserted
- `selectedText`: string - currently selected text in input/textarea
- `initialValue`: string - current value of input/textarea to load into modal

---

## Phase 3: Integrate into Teacher's Cabinet

### 3.1 Test Creator Component
**File**: `src/teacher/TeacherTests.jsx`

#### 3.1.1 Input Tests
- Add `MathHelperButton` next to:
  - Question text textarea
  - Each correct answer input field (primary + additional answers)

#### 3.1.2 Multiple Choice Tests
- Add `MathHelperButton` next to:
  - Question text textarea
  - Each answer option input field

#### 3.1.3 True/False Tests
- Add `MathHelperButton` next to:
  - Question text textarea

### 3.2 Implementation Details
- For textareas: Insert LaTeX at cursor position or append if no cursor
- For input fields: Append LaTeX to current value
- Track selected text in input fields for square root wrapping
- Use `MathRenderer` to display preview of questions/answers as they're typed

---

## Phase 4: Integrate into Student Cabinet

### 4.1 Input Question Component
**File**: `src/components/test/InputQuestion.jsx`

- Add `MathHelperButton` next to answer input field
- Student can type LaTeX code directly or use helper buttons
- Display question text using `MathRenderer` component

---

## Phase 5: Database & Storage

### 5.1 Verify Database Schema
- Check that question/answer fields in database are `TEXT` or `VARCHAR` (not JSON)
- LaTeX code with `$...$` delimiters will be stored as plain text
- Example stored value: `"Solve for x: $x^2 + 5x + 6 = 0$"`

### 5.2 Test Creation API
- Ensure `save-test-with-assignments` function preserves LaTeX code
- No special escaping needed - LaTeX is stored as-is

### 5.3 Test Submission API
- Ensure submission functions preserve LaTeX code in student answers
- Check functions:
  - `submit-input-test.js`
  - `submit-multiple-choice-test.js`
  - `submit-true-false-test.js`

### 5.4 Test Retrieval API
- Ensure `get-test-questions` returns LaTeX code as-is
- No special parsing needed

---

## Phase 6: Rendering in Display Components

### 6.1 Question Display Components
Update all question components to use `MathRenderer`:

- `src/components/test/InputQuestion.jsx`
- `src/components/test/MultipleChoiceQuestion.jsx`
- `src/components/test/TrueFalseQuestion.jsx`

Replace `dangerouslySetInnerHTML` or plain text with `<MathRenderer content={...} />`

### 6.2 Results Display Components
Update results components to render math:

- `src/components/test/TestResults.jsx`
- `src/components/test/TestAnswerModal.jsx`

Replace plain text with `<MathRenderer content={...} />` for:
- Question text
- Student answers
- Correct answers

### 6.3 Teacher Results View
**File**: `src/teacher/TeacherResults.jsx`

- Use `MathRenderer` when displaying questions and answers in results tables

---

## Phase 7: Testing & Validation

### 7.1 Teacher Side Testing
1. Create input test with math in question and answer
2. Create multiple choice test with math in question and options
3. Create true/false test with math in question
4. Verify math renders correctly in preview
5. Submit test and verify math is stored correctly in DB

### 7.2 Student Side Testing
1. View test with math questions - verify math renders correctly
2. Use math helper buttons to input math formulas
3. Submit test and verify math is stored correctly
4. View results - verify math renders correctly in all contexts

### 7.3 Database Verification
1. Check database directly - verify LaTeX code is stored correctly
2. Verify no special characters are escaped/encoded incorrectly
3. Verify `$...$` delimiters are preserved

### 7.4 Edge Cases
1. Mixed text and math: `"Solve $x^2 = 4$ for x"`
2. Multiple math formulas in one field
3. Nested formulas: `$\sqrt{x^2 + y^2}$`
4. Fractions with exponents: `$\frac{x^2}{y^3}$`
5. Long formulas
6. Special LaTeX characters: `\{`, `\}`, `\$`, etc.

---

## Phase 8: File Structure

```
src/
├── components/
│   ├── math/
│   │   ├── MathRenderer.jsx          # KaTeX renderer component
│   │   ├── MathHelperModal.jsx        # Modal with math helper buttons
│   │   └── MathHelperButton.jsx       # Button that opens modal
│   └── test/
│       ├── InputQuestion.jsx          # Updated with MathRenderer + MathHelperButton
│       ├── MultipleChoiceQuestion.jsx # Updated with MathRenderer + MathHelperButton
│       └── TrueFalseQuestion.jsx      # Updated with MathRenderer + MathHelperButton
├── teacher/
│   ├── TeacherTests.jsx               # Updated with MathHelperButton for test creation
│   └── TeacherResults.jsx             # Updated with MathRenderer for results
└── main.jsx                           # Updated with KaTeX CSS import
```

---

## Phase 9: Implementation Steps (Order)

1. **Install KaTeX** → `npm install katex react-katex`
2. **Create MathRenderer** → Basic component that parses and renders LaTeX
3. **Create MathHelperModal** → UI for inserting LaTeX code
4. **Create MathHelperButton** → Button component
5. **Update TeacherTests.jsx** → Add buttons to test creator
6. **Update InputQuestion.jsx** → Add button and MathRenderer for students
7. **Update MultipleChoiceQuestion.jsx** → Add MathRenderer
8. **Update TrueFalseQuestion.jsx** → Add MathRenderer
9. **Update TestResults.jsx** → Add MathRenderer
10. **Update TestAnswerModal.jsx** → Add MathRenderer
11. **Update TeacherResults.jsx** → Add MathRenderer
12. **Test end-to-end** → Create test, take test, view results
13. **Verify database** → Check stored LaTeX code

---

## Phase 10: LaTeX Format Guidelines

### Inline Math
- Use `$...$` delimiters for inline math
- Example: `"Solve for x: $x^2 + 5x + 6 = 0$"`

### Display Math
- Use `$$...$$` delimiters for display math (centered, on own line)
- Example: `"The quadratic formula is: $$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$"`

### Common Patterns
- **Exponent**: `x^{2}` or `x^2`
- **Square Root**: `\sqrt{x}` or `\sqrt{x^2 + y^2}`
- **Fraction**: `\frac{numerator}{denominator}`
- **Mixed**: `x^{\frac{1}{2}}` (exponent with fraction)

---

## Notes

- **No Math Editor**: This plan uses simple LaTeX text input with helper buttons, not a full WYSIWYG math editor
- **KaTeX Only**: KaTeX is lightweight and renders on the client side - no server-side processing needed
- **Text Storage**: LaTeX code is stored as plain text in the database - no special encoding required
- **Backward Compatible**: Existing tests without math formulas will continue to work (plain text is rendered as-is)

---

## Future Enhancements (Out of Scope)

- Full WYSIWYG math editor (MathLive integration)
- Math formula validation
- Math formula autocomplete
- Visual equation builder
- Copy/paste from external math editors

