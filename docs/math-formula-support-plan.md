# Math Formula Support Implementation Plan

## Overview
Add math formula support using KaTeX for rendering and React-Mathlive for input/editing in both teacher and student interfaces.

## Technologies

### 1. KaTeX
- **Purpose**: Render math formulas as HTML/CSS
- **Library**: `katex` (core library) and `katex/dist/katex.min.css` (CSS)
- **React wrapper**: `react-katex` (optional, makes it easier to use in React)

### 2. React-Mathlive
- **Purpose**: Visual math formula editor (WYSIWYG)
- **Library**: `react-mathlive`
- **Features**: 
  - Visual editor with buttons for exponents, square roots, fractions
  - Can insert LaTeX code
  - Can export to LaTeX format

## Implementation Steps

### Phase 1: Setup and Dependencies

#### 1.1 Install Dependencies

**Web App (React/Vite):**
```bash
npm install katex react-katex react-mathlive
```

**Android App (React Native/Expo):**
```bash
npm install katex react-katex
# Note: React-Mathlive may not work in React Native - need alternative
# Consider: react-native-math-view or custom solution
```

#### 1.2 Import KaTeX CSS

**Web App:**
- In `src/main.jsx` or `src/App.jsx`:
```javascript
import 'katex/dist/katex.min.css';
```

**Android App:**
- KaTeX CSS needs to be handled differently in React Native
- Use `react-native-math-view` or custom rendering solution
- Or use WebView for math rendering

### Phase 2: Teacher Cabinet - Test Creator

#### 2.1 Create Math Formula Button Component

**File**: `src/components/math/MathFormulaButton.jsx`

**Features:**
- Button that opens a popup/modal
- Popup contains React-Mathlive editor
- Buttons for:
  - Exponents (superscript): `x^2`
  - Square root: `\sqrt{x}` (should cover highlighted text)
  - Fractions: `\frac{top}{bottom}` (separate input for numerator and denominator)
- Insert button to insert LaTeX code into the field
- Preview using KaTeX

**Props:**
- `onInsert`: Callback with LaTeX string
- `initialValue`: Optional initial LaTeX value for editing
- `fieldType`: "question" | "answer" | "option"

#### 2.2 Create Math Formula Modal Component

**File**: `src/components/math/MathFormulaModal.jsx`

**Features:**
- Modal dialog with React-Mathlive editor
- Toolbar with buttons:
  - Exponents button
  - Square root button (wraps selected text)
  - Fraction button (opens fraction editor)
- Preview section showing rendered formula
- Insert button to insert into the field
- Cancel button to close without inserting

#### 2.3 Update Test Creator Components

**Files to modify:**
- `src/teacher/TestCreator.jsx` (or wherever test creator is)
- Question input fields
- Answer fields (for input tests)
- Option fields (for multiple choice)
- True/False answer fields

**Implementation:**
1. Add MathFormulaButton next to each relevant field
2. When clicked, open MathFormulaModal
3. On insert, append LaTeX code to the field value
4. Store LaTeX code in the database (alongside or as part of the text)

**Example field structure:**
```javascript
// Question field with math button
<div className="flex items-center gap-2">
  <input 
    type="text" 
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
  />
  <MathFormulaButton
    onInsert={(latex) => setQuestion(prev => prev + latex)}
    fieldType="question"
  />
</div>
```

### Phase 3: Student Cabinet - Input Tests

#### 3.1 Web App - Input Test Component

**File**: `src/components/test/InputTestStudent.jsx` (or similar)

**Implementation:**
1. Add MathFormulaButton next to answer input field
2. Same modal as teacher's side
3. Allow students to insert math formulas when answering
4. Store answer with LaTeX code in database

#### 3.2 Android App - Input Test Component

**File**: `MWSExpo/app/tests/input/[testId]/index.tsx`

**Challenges:**
- React-Mathlive may not work in React Native
- Need native lightweight solution

**Recommended Approach: Native Lightweight Helper**
- Create a lightweight native component with:
  - **Toolbar**: Buttons for common math operations
  - **TextInput**: For typing/editing LaTeX code
  - **Preview**: Real-time preview using WebView with KaTeX

**File**: `MWSExpo/src/components/math/MathInputHelper.tsx`

**Component Structure:**
```typescript
// Modal component with:
1. Toolbar (top section):
   - Exponents button (x²): Inserts `^{}`
   - Square root button (√): Inserts `\sqrt{}`
   - Fraction button (a/b): Inserts `\frac{}{}`
   - Clear button
   - Common symbols buttons (π, ±, ×, ÷, etc.)

2. TextInput (middle section):
   - Multiline input for LaTeX code
   - Placeholder: "Type LaTeX code or use buttons above"
   - Auto-focus on open
   - Supports editing existing LaTeX

3. Preview (bottom section):
   - WebView with KaTeX rendering
   - Shows real-time preview as user types
   - Error handling for invalid LaTeX

4. Action buttons:
   - Insert button: Inserts LaTeX into answer field
   - Cancel button: Closes without inserting
```

**Native Lightweight Helper - Detailed Implementation:**

**Component Props:**
```typescript
interface MathInputHelperProps {
  visible: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
  initialValue?: string;
  selectedText?: string; // For square root wrapping
  cursorPosition?: number; // For inserting at specific position
}
```

**Toolbar Section (Top):**
- Horizontal scrollable row of buttons
- Each button is TouchableOpacity with icon/text
- Button actions:
  - **Exponents (x²)**: Inserts `^{}` at cursor, moves cursor inside braces
  - **Square Root (√)**: 
    - If `selectedText` prop exists: Wraps with `\sqrt{selectedText}`
    - Otherwise: Inserts `\sqrt{}` at cursor
  - **Fraction (a/b)**: Opens fraction editor sub-modal
  - **Common Symbols**: Quick insert buttons for π, ±, ×, ÷, ≤, ≥, ≠, ∞
  - **Clear**: Clears TextInput content
- Buttons are large (min 44x44 touch target) for mobile UX

**TextInput Section (Middle):**
- Multiline TextInput component
- Style: Rounded border, padding, font size 16+
- Placeholder: "Type LaTeX code or use buttons above"
- Auto-focus when modal opens
- Supports editing existing LaTeX code (from `initialValue` prop)
- Tracks cursor position for smart insertions
- Scrollable if content is long

**Preview Section (Bottom):**
- WebView component with KaTeX
- HTML template includes:
  - KaTeX CSS and JS (CDN or bundled)
  - Real-time rendering of current LaTeX in TextInput
  - Error handling: Shows "Invalid LaTeX syntax" if rendering fails
- Updates on TextInput change (debounced for performance)
- Scrollable if formula is long
- Minimum height: 100px for visibility

**Fraction Editor Sub-Modal:**
- Opens when fraction button is pressed
- Two TextInputs:
  - Numerator (top)
  - Denominator (bottom)
- Preview shows `\frac{numerator}{denominator}`
- Insert button: Combines into `\frac{num}{den}` and inserts into main TextInput
- Cancel button: Closes without inserting

**Action Buttons (Bottom):**
- Horizontal row with two buttons
- **Insert Button**: 
  - Calls `onInsert(latex)` with current TextInput content
  - Closes modal
  - Inserts at cursor position in answer field (if `cursorPosition` provided)
- **Cancel Button**: 
  - Calls `onClose()` without inserting
  - Closes modal

**Features:**
- ✅ Lightweight and fast (native React Native components)
- ✅ Real-time preview (WebView with KaTeX)
- ✅ Touch-friendly buttons (large touch targets)
- ✅ Keyboard support for LaTeX typing
- ✅ Square root wraps selected text
- ✅ Fraction editor with separate inputs
- ✅ Smart cursor positioning after button insertions
- ✅ Error handling for invalid LaTeX
- ✅ Performance optimized (debounced preview updates)

### Phase 4: Database Storage

#### 4.1 Database Schema

**Current schema** (assumed):
- Questions and answers stored as text/varchar

**Changes needed:**
- Store LaTeX code directly in text fields
- OR create separate columns for math formulas
- OR use JSON fields to separate text and math parts

**Recommended Approach:**
- Store LaTeX code inline with text
- Use delimiters: `$...$` for inline math, `$$...$$` for display math
- Example: `"What is the value of $x^2 + 5$?"`

#### 4.2 Update Backend Functions

**Files to modify:**
- Test submission functions (all test types)
- Test creation functions
- Question retrieval functions

**Changes:**
- Ensure LaTeX code is preserved when storing/retrieving
- No special handling needed if stored as text with delimiters
- If using separate columns, update SQL queries

### Phase 5: Rendering Math Formulas

#### 5.1 Web App - Display Components

**Create reusable component:**

**File**: `src/components/math/MathRenderer.jsx`

```javascript
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export function MathRenderer({ content }) {
  // Parse content for LaTeX delimiters
  // $...$ for inline, $$...$$ for block
  // Render with KaTeX
}
```

**Usage:**
- Replace text rendering with MathRenderer
- Use in:
  - Test questions display
  - Test answers display
  - Test results display
  - Student answer review

#### 5.2 Android App - Display Components

**File**: `MWSExpo/src/components/math/MathRenderer.tsx`

**Options:**
1. **WebView with KaTeX**: Render HTML with KaTeX in WebView
2. **react-native-math-view**: Native math rendering (if available)
3. **Custom solution**: Parse LaTeX and render using native components

**Recommended**: WebView with KaTeX for consistency

**Implementation:**
```typescript
import { WebView } from 'react-native-webview';

export function MathRenderer({ content }: { content: string }) {
  // Parse content for LaTeX
  // Generate HTML with KaTeX
  // Render in WebView
}
```

### Phase 6: Integration Points

#### 6.1 Teacher Cabinet - Test Creator

**Components to modify:**
1. **Input Test Creator**:
   - Question field → Add MathFormulaButton
   - Answer field(s) → Add MathFormulaButton

2. **Multiple Choice Test Creator**:
   - Question field → Add MathFormulaButton
   - Each option field (A, B, C, D, E, F) → Add MathFormulaButton
   - Correct answer field → Add MathFormulaButton

3. **True/False Test Creator**:
   - Question field → Add MathFormulaButton
   - (True/False answers don't need math)

**UI Placement:**
- Button icon: Mathematical symbol (e.g., π or Σ)
- Position: Right side of input field, aligned
- Tooltip: "Insert Math Formula"

#### 6.2 Student Cabinet - Input Tests

**Web App:**
- Same MathFormulaButton component
- Same modal as teacher's side
- Position: Next to answer input field

**Android App:**
- Native lightweight MathInputHelper component
- Modal with:
  - Toolbar (buttons for common operations)
  - TextInput (for LaTeX editing)
  - Preview (real-time KaTeX rendering)
- Position: Next to answer input field
- Behavior:
  - If text selected: Square root wraps selected text
  - Fraction button opens sub-modal with numerator/denominator inputs
  - Real-time preview updates as user types

### Phase 7: Testing

#### 7.1 Test Cases

1. **Teacher Side:**
   - Create test with math in question
   - Create test with math in answer (input)
   - Create test with math in options (multiple choice)
   - Edit existing test with math
   - Verify math renders correctly in preview

2. **Student Side (Web):**
   - View test with math question
   - Answer with math formula
   - Submit test
   - View results with math formulas

3. **Student Side (Android):**
   - View test with math question (rendered correctly)
   - Answer with math formula
   - Submit test
   - View results with math formulas

4. **Database:**
   - Verify LaTeX code is stored correctly
   - Verify LaTeX code is retrieved correctly
   - Test with special characters

5. **Edge Cases:**
   - Mixed text and math in same field
   - Multiple math formulas in one field
   - Long formulas
   - Special LaTeX characters

### Phase 8: Error Handling

#### 8.1 Invalid LaTeX

- Validate LaTeX syntax before inserting
- Show error message if invalid
- Allow user to edit/remove invalid LaTeX

#### 8.2 Rendering Errors

- Catch KaTeX rendering errors
- Fallback to showing raw LaTeX code
- Log errors for debugging

#### 8.3 Database Issues

- Handle special characters in LaTeX
- Ensure proper escaping
- Test with various LaTeX syntax

## File Structure

```
src/
├── components/
│   └── math/
│       ├── MathFormulaButton.jsx       # Button component (web)
│       ├── MathFormulaModal.jsx       # Modal with React-Mathlive (web)
│       ├── MathRenderer.jsx           # KaTeX renderer (web)
│       └── MathInputHelper.tsx         # Simplified input helper (Android)
│
MWSExpo/
├── src/
│   └── components/
│       └── math/
│           ├── MathInputHelper.tsx     # Math input helper (Android)
│           └── MathRenderer.tsx        # Math renderer (Android)
```

## Dependencies Summary

### Web App
```json
{
  "katex": "^0.16.0",
  "react-katex": "^3.0.1",
  "react-mathlive": "^0.1.0"
}
```

### Android App
```json
{
  "katex": "^0.16.0",
  "react-katex": "^3.0.1",
  "react-native-webview": "^13.0.0"
}
```

**Note**: For Android app, we'll use:
- Native React Native components (View, TextInput, TouchableOpacity)
- WebView for KaTeX preview (lightweight, no heavy dependencies)
- No React-Mathlive (not compatible with React Native)

## Implementation Order

1. **Phase 1**: Setup dependencies and CSS
2. **Phase 5**: Create MathRenderer components (so we can see results)
3. **Phase 2**: Teacher cabinet - test creator
4. **Phase 3**: Student cabinet - web app
5. **Phase 3**: Student cabinet - Android app
6. **Phase 4**: Database storage verification
7. **Phase 6**: Integration and testing
8. **Phase 7-8**: Testing and error handling

## Notes

1. **React-Mathlive compatibility**: Verify if it works in React Native. If not, use WebView or alternative solution.

2. **LaTeX delimiters**: Use `$...$` for inline math and `$$...$$` for display math (standard LaTeX convention).

3. **Performance**: KaTeX is fast, but consider lazy loading for large tests with many formulas.

4. **Accessibility**: Ensure math formulas are accessible (screen readers, etc.).

5. **Mobile UX**: On mobile, math input should be easy and intuitive. Consider full-screen modal for math editor.

6. **Backward compatibility**: Ensure existing tests without math formulas still work correctly.

