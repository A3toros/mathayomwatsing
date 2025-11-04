# Math Notation Support Implementation Plan
## Exponents, Square Roots, and Fractions for Multiple Choice and Input Tests

### Overview
This document outlines the plan for adding support for mathematical notation (exponents, square roots, and fractions) to:
1. **Multiple Choice Tests**: Question display and answer options (viewing only)
2. **Input Tests**: Question display AND student answer input with simple button-based interface

---

## Current State Analysis

### 1. Question Storage
- **Database Schema**: Questions are stored as `TEXT` fields in `multiple_choice_test_questions` table:
  - `question TEXT NOT NULL`
  - `option_a TEXT NOT NULL`
  - `option_b TEXT NOT NULL`
  - `option_c TEXT`, `option_d TEXT`, `option_e TEXT`, `option_f TEXT`

### 2. Current Rendering
- **Web App** (`src/components/test/MultipleChoiceQuestion.jsx`):
  - Uses `dangerouslySetInnerHTML` with basic HTML formatting
  - Supports: `**bold**`, `*italic*`, line breaks
  - No math notation support

- **Mobile App** (`MWSExpo/src/components/questions/MultipleChoiceQuestion.tsx`):
  - Uses plain text rendering
  - No math notation support

### 3. Question Creation
- **Web Creator** (`src/components/forms/QuestionForm.jsx`):
  - Uses basic textarea inputs
  - No math notation input support

---

## Implementation Approach

### Phase 1: Choose Math Rendering Library

#### Option A: KaTeX (Recommended)
**Pros:**
- Fast rendering (client-side, no server needed)
- Lightweight (~50KB)
- Great for static math expressions
- Excellent browser compatibility
- Works well with React

**Cons:**
- Less comprehensive than MathJax
- Requires LaTeX syntax knowledge

#### Option B: MathJax
**Pros:**
- More comprehensive math support
- Better for complex expressions
- More formatting options

**Cons:**
- Heavier (~200KB+)
- Slower rendering
- More complex setup

**Recommendation: KaTeX** - Better performance for typical school math needs (exponents, square roots, fractions)

---

## Phase 2: Syntax Design

### Input Syntax for Teachers
We'll use LaTeX-style syntax that's intuitive and easy to type:

#### Exponents
- `x^2` → renders as x²
- `x^{n+1}` → renders as x^(n+1) with proper superscript
- `2^3` → renders as 2³

#### Square Roots
- `\sqrt{x}` → renders as √x
- `\sqrt{25}` → renders as √25
- `\sqrt{x^2 + y^2}` → renders as √(x² + y²)

#### Fractions
- `\frac{a}{b}` → renders as a proper fraction with numerator on top, denominator on bottom, and horizontal line between them:
  ```
     a
    ───
     b
  ```
- `\frac{1}{2}` → renders as proper fraction (½ style, but with horizontal line):
  ```
     1
    ───
     2
  ```
- `\frac{x+1}{x-1}` → renders as:
  ```
    x + 1
    ──────
    x - 1
  ```
- `\frac{3}{4} + \frac{1}{4}` → renders as two proper fractions side by side
- `\frac{\sqrt{x}}{2}` → renders as:
  ```
    √x
   ────
    2
  ```

#### Combined Examples
- `x^2 + \sqrt{16}` → x² + √16
- `\sqrt{x^2 + y^2}` → √(x² + y²)
- `(a + b)^2 = a^2 + 2ab + b^2` → (a + b)² = a² + 2ab + b²
- `\frac{x^2 + 1}{\sqrt{x}}` → renders as proper fraction:
  ```
    x² + 1
   ────────
     √x
  ```
- `\frac{1}{2} + \frac{1}{3} = \frac{5}{6}` → renders as:
  ```
     1     1     5
    ─── + ─── = ───
     2     3     6
  ```

### Alternative: Inline Syntax (Simpler)
For teachers who prefer simpler syntax:
- `x^2` → x² (same)
- `sqrt(x)` → √x (alternative to `\sqrt{x}`)

### Fraction Display Format

**YES - Fractions render with proper vertical format:**

When you use `\frac{a}{b}`, KaTeX automatically renders it as:
- **Numerator on top**
- **Denominator on bottom**  
- **Horizontal line (fraction bar) between them**

Example: `\frac{1}{2}` renders as:
```
   1
  ───
   2
```

This is the standard mathematical notation format, not inline a/b style.

**Note**: For fractions, `\frac{a}{b}` is the standard and recommended way. It **always** renders as a proper vertical fraction with a horizontal line. If you want inline fractions (a/b style without the horizontal line), you can use `$a/b$`, but this won't have the proper fraction formatting.

---

## Phase 3: Implementation Steps

### Step 1: Install Dependencies

**Web App (package.json):**
```bash
npm install katex react-katex
```

**Mobile App (MWSExpo/package.json):**
```bash
npm install react-native-math-view
# OR use react-native-render-html with math support
```

### Step 2: Create Math Rendering Utility

**File**: `src/utils/mathRenderer.js`

```javascript
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders math notation from LaTeX syntax
 * @param {string} text - Text that may contain math expressions
 * @param {boolean} displayMode - Whether to render in display mode (block) or inline
 * @returns {string} - HTML string with rendered math
 */
export const renderMathInText = (text, displayMode = false) => {
  if (!text) return '';
  
  // Pattern to match math expressions: $...$ for inline, $$...$$ for display
  const mathPattern = displayMode 
    ? /\$\$(.*?)\$\$/g 
    : /\$(.*?)\$/g;
  
  let processedText = text;
  let match;
  
  while ((match = mathPattern.exec(text)) !== null) {
    try {
      const mathExpression = match[1];
      const rendered = katex.renderToString(mathExpression, {
        throwOnError: false,
        displayMode: displayMode
      });
      processedText = processedText.replace(match[0], rendered);
    } catch (error) {
      console.error('Math rendering error:', error);
      // Keep original text if rendering fails
    }
  }
  
  return processedText;
};

/**
 * Enhanced version that also handles basic formatting
 * Supports: **bold**, *italic*, $math$, and regular HTML
 */
export const renderEnhancedText = (text) => {
  if (!text) return '';
  
  // First, escape existing HTML to prevent XSS
  let processed = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Render math expressions
  processed = renderMathInText(processed, false);
  
  // Apply basic formatting
  processed = processed
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  
  return processed;
};
```

### Step 3: Update Question Creator Interface

**File**: `src/components/forms/QuestionForm.jsx`

**Changes Needed:**
1. Add math notation helper/toolbar to textarea inputs
2. Add syntax examples/tooltips
3. Optional: Add live preview of math rendering

**UI Enhancement:**
- Add "Math Helper" button next to textarea
- Show syntax examples: `x^2`, `\sqrt{x}`, `x^{n+1}`
- Tooltip with common math syntax

### Step 4: Update Question Rendering (Web)

**File**: `src/components/test/MultipleChoiceQuestion.jsx`

**Changes:**
1. Import math rendering utility
2. Update `formatQuestionText` function to use `renderEnhancedText`
3. Ensure KaTeX CSS is loaded

**Code Changes:**
```javascript
import { renderEnhancedText } from '../../utils/mathRenderer';

const formatQuestionText = useCallback((text) => {
  if (!text) return '';
  return renderEnhancedText(text);
}, []);
```

### Step 5: Update Question Rendering (Mobile)

**File**: `MWSExpo/src/components/questions/MultipleChoiceQuestion.tsx`

**Options:**
1. Use `react-native-math-view` library
2. Use `react-native-render-html` with math support
3. Use WebView to render KaTeX (simpler but heavier)

**Recommendation**: Use `react-native-math-view` for native rendering

### Step 6: Create Math Input Component for Students (Input Tests)

**File**: `src/components/math/MathInputToolbar.jsx` (NEW)

**Purpose**: Simple button-based interface for students to input math notation without typing LaTeX

**Features:**
- Visual buttons for common math symbols
- Click to insert at cursor position
- Live preview of math being entered
- No LaTeX knowledge required

**UI Design:**
```
┌─────────────────────────────────────────┐
│ Math Symbols:                           │
│ [x²] [x³] [√x] [ⁿ√x] [a/b] [x^n] [()]  │
│                                         │
│ Answer: [___________________________]   │
│ Preview: x² + √16 = 20                  │
└─────────────────────────────────────────┘
```

**Symbol Buttons:**
- **x²** - Square (x^2)
- **x³** - Cube (x^3)
- **x^n** - Power (x^n)
- **√x** - Square root (\sqrt{x})
- **ⁿ√x** - Nth root (\sqrt[n]{x})
- **a/b** - Fraction (\frac{a}{b})
- **( )** - Parentheses
- **+ - × ÷** - Basic operations

**Implementation:**
```javascript
import React, { useState, useRef } from 'react';
import { renderMathInText } from '../../utils/mathRenderer';

export const MathInputToolbar = ({ 
  value, 
  onChange, 
  placeholder = "Enter your answer..." 
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);
  
  const mathSymbols = [
    { label: 'x²', syntax: '^2', display: 'x²' },
    { label: 'x³', syntax: '^3', display: 'x³' },
    { label: 'xⁿ', syntax: '^n', display: 'xⁿ' },
    { label: '√x', syntax: '\\sqrt{x}', display: '√x' },
    { label: 'ⁿ√x', syntax: '\\sqrt[n]{x}', display: 'ⁿ√x' },
    { label: 'a/b', syntax: '\\frac{a}{b}', display: 'a/b' },
    { label: '( )', syntax: '()', display: '()' },
    { label: '×', syntax: '\\times', display: '×' },
    { label: '÷', syntax: '\\div', display: '÷' },
  ];
  
  const insertSymbol = (syntax) => {
    const input = inputRef.current;
    if (!input) return;
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newValue = before + syntax + after;
    
    onChange(newValue);
    
    // Set cursor position after inserted symbol
    setTimeout(() => {
      input.focus();
      const newPosition = start + syntax.length;
      input.setSelectionRange(newPosition, newPosition);
    }, 0);
  };
  
  return (
    <div className="math-input-container">
      <div className="math-toolbar mb-2">
        <button 
          onClick={() => setShowToolbar(!showToolbar)}
          className="math-toolbar-toggle px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          📐 Math Symbols {showToolbar ? '▼' : '▶'}
        </button>
        {showToolbar && (
          <div className="math-symbols-grid mt-2 p-3 bg-gray-50 rounded border border-gray-200 grid grid-cols-4 gap-2">
            {mathSymbols.map((symbol, index) => (
              <button
                key={index}
                onClick={() => insertSymbol(symbol.syntax)}
                className="math-symbol-btn px-3 py-2 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 text-sm"
                title={`Insert ${symbol.display}`}
              >
                {symbol.display}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onSelect={(e) => {
          setCursorPosition(e.target.selectionStart);
        }}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />
      
      {value && (
        <div className="math-preview mt-2 p-3 bg-gray-50 rounded border border-gray-200">
          <span className="text-sm text-gray-600">Preview: </span>
          <span 
            className="math-preview-content"
            dangerouslySetInnerHTML={{ 
              __html: renderMathInText(`$${value}$`) 
            }} 
          />
        </div>
      )}
    </div>
  );
};
```

### Step 7: Update Input Question Component for Math Support

**File**: `src/components/test/InputQuestion.jsx`

**Changes:**
1. Import `MathInputToolbar` component
2. Replace standard text input with `MathInputToolbar` when math notation is enabled
3. Store student answers in LaTeX format internally
4. Display rendered math in preview

**Code Changes:**
```javascript
import { MathInputToolbar } from '../math/MathInputToolbar';

// In renderStudentMode(), replace the standard input:
{mathNotationEnabled ? (
  <MathInputToolbar
    value={answer}
    onChange={handleAnswerChange}
    placeholder="Enter your answer (use math symbols button)..."
  />
) : (
  <input
    type="text"
    value={answer}
    onChange={(e) => handleAnswerChange(e.target.value)}
    // ... existing props
  />
)}
```

**Note**: `mathNotationEnabled` can be:
- A prop passed to InputQuestion
- A test-level setting
- Auto-detected if question contains math notation

### Step 8: Update Answer Validation for Math Notation

**File**: `src/utils/answerValidator.js` (NEW)

**Purpose**: Validate and normalize student answers with math notation

**Implementation:**
```javascript
import katex from 'katex';

/**
 * Normalize math expressions for comparison
 * Handles equivalent formats (e.g., x^2 vs x²)
 */
export const normalizeMathExpression = (expression) => {
  if (!expression) return '';
  
  // Remove whitespace
  let normalized = expression.trim();
  
  // Normalize common variations
  normalized = normalized.replace(/\s+/g, ''); // Remove all spaces
  normalized = normalized.replace(/\\cdot/g, '*'); // \cdot to *
  normalized = normalized.replace(/\\times/g, '*'); // \times to *
  normalized = normalized.replace(/\\div/g, '/'); // \div to /
  
  return normalized;
};

/**
 * Compare two math expressions (student answer vs correct answer)
 * Handles equivalent formats
 */
export const compareMathAnswers = (studentAnswer, correctAnswer) => {
  // Normalize both expressions
  const normalizedStudent = normalizeMathExpression(studentAnswer);
  const normalizedCorrect = normalizeMathExpression(correctAnswer);
  
  // Direct comparison
  if (normalizedStudent === normalizedCorrect) return true;
  
  // Try rendering both and comparing
  try {
    const studentRendered = katex.renderToString(normalizedStudent, { throwOnError: false });
    const correctRendered = katex.renderToString(normalizedCorrect, { throwOnError: false });
    
    // Compare rendered output (for equivalent expressions)
    // This is a simplified approach - may need more sophisticated comparison
    return studentRendered === correctRendered;
  } catch (error) {
    // Fallback to string comparison
    return normalizedStudent === normalizedCorrect;
  }
};

/**
 * Validate if math expression is well-formed
 */
export const validateMathExpression = (expression) => {
  if (!expression) return { valid: true, error: null };
  
  try {
    // Try to render the expression
    katex.renderToString(expression, { throwOnError: true });
    return { valid: true, error: null };
  } catch (error) {
    return { 
      valid: false, 
      error: 'Invalid math expression. Please check your syntax.' 
    };
  }
};
```

### Step 9: Update Database Schema (Optional)

**Current State**: TEXT fields can store LaTeX syntax directly
**No Schema Changes Needed**: LaTeX syntax is plain text

**Considerations:**
- Current TEXT fields are sufficient
- LaTeX syntax is human-readable
- No migration needed

---

## Phase 4: User Experience Enhancements

### For Teachers (Creators)

1. **Math Syntax Helper**
   - Tooltip/help icon with common syntax
   - Examples: `x^2`, `\sqrt{x}`, `\frac{a}{b}`, `x^{n+1}`
   - Quick reference guide

2. **Live Preview (Optional)**
   - Show rendered math as teacher types
   - Helps catch syntax errors early

3. **Syntax Validation (Optional)**
   - Warn if math syntax is invalid
   - Highlight errors in red

### For Students

1. **Clean Rendering (Multiple Choice & Input Tests)**
   - Math expressions render clearly
   - Proper sizing and spacing
   - Responsive on mobile

2. **No Syntax Visible (Multiple Choice Tests)**
   - Students see rendered math, not LaTeX code
   - Clean, professional appearance

3. **Simple Math Input (Input Tests)** ✅ **NEW**
   - Button-based interface for math symbols
   - No LaTeX knowledge required
   - Click to insert symbols at cursor position
   - Live preview shows how answer will look
   - Intuitive symbol buttons (x², √x, a/b, etc.)
   - Supports all common math operations

---

## Phase 5: Testing Requirements

### Test Cases

1. **Basic Exponents**
   - Input: `x^2`
   - Expected: x² rendered correctly

2. **Complex Exponents**
   - Input: `x^{n+1}`
   - Expected: x^(n+1) with proper superscript

3. **Square Roots**
   - Input: `\sqrt{25}`
   - Expected: √25 rendered correctly

4. **Fractions**
   - Input: `\frac{1}{2}`
   - Expected: Proper vertical fraction with numerator (1) on top, denominator (2) on bottom, and horizontal line between them
   - Input: `\frac{x+1}{x-1}`
   - Expected: Proper vertical fraction with (x+1) on top, (x-1) on bottom, and horizontal line between them
   - Input: `\frac{\sqrt{x}}{2}`
   - Expected: Proper vertical fraction with √x on top, 2 on bottom, and horizontal line between them
   - Note: Fractions render in vertical format (not inline a/b style) with the horizontal line

5. **Combined Expressions**
   - Input: `x^2 + \sqrt{16} = 20`
   - Expected: x² + √16 = 20
   - Input: `\frac{x^2 + 1}{\sqrt{x}}`
   - Expected: (x² + 1)/√x rendered correctly
   - Input: `\frac{1}{2} + \frac{1}{3} = \frac{5}{6}`
   - Expected: ½ + ⅓ = ⅚ rendered correctly

6. **In Question Text**
   - Input: `What is the value of $x^2$ when $x = 5$?`
   - Expected: Proper rendering of both math expressions
   - Input: `What is $\frac{1}{2} + \frac{1}{3}$?`
   - Expected: Proper rendering of fraction expression

7. **In Answer Options**
   - All options render math correctly (including fractions)
   - No layout issues with fractions
   - Fractions display properly in radio button options

8. **Edge Cases**
   - Empty math expressions: `$$`
   - Invalid syntax: `x^`, `\frac{}{}`
   - Mixed content: `Regular text $x^2$ more text`
   - Nested fractions: `\frac{\frac{1}{2}}{3}`
   - Fractions with exponents: `\frac{x^2}{y^2}`

9. **Cross-browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome Mobile)

10. **Mobile App Testing**
   - React Native rendering
   - Performance on older devices
   - Fractions render correctly on mobile

---

## Phase 6: Documentation

### For Teachers

**Quick Reference Guide:**
```
Exponents:
  x^2        → x²
  x^{n+1}    → x^(n+1)
  (a+b)^2    → (a+b)²

Square Roots:
  \sqrt{x}   → √x
  \sqrt{25}  → √25
  \sqrt{x^2 + y^2} → √(x² + y²)

Fractions (renders with numerator on top, denominator on bottom, horizontal line between):
  \frac{a}{b}      →  a
                       ───
                        b
  
  \frac{1}{2}      →   1
                       ───
                       2
  
  \frac{x+1}{x-1}  →  x + 1
                       ──────
                       x - 1
  
  \frac{\sqrt{x}}{2} →  √x
                        ────
                         2

Usage:
  Wrap math expressions in $ signs:
  What is $x^2$ when $x = 5$?
  What is $\frac{1}{2} + \frac{1}{3}$?
  
  Note: Fractions always render in vertical format with horizontal line
```

### For Developers

**API Documentation:**
- `renderMathInText(text, displayMode)` - Render math in text
- `renderEnhancedText(text)` - Render text with math and formatting
- Usage examples in code comments

---

## Phase 7: Rollout Strategy

### Step 1: Development
- Implement math rendering utility
- Update web app components
- Test thoroughly

### Step 2: Beta Testing
- Test with sample questions
- Get teacher feedback
- Fix any issues

### Step 3: Mobile App Update
- Implement mobile rendering
- Test on various devices
- Ensure performance is acceptable

### Step 4: Documentation
- Create teacher guide
- Update help documentation
- Add inline help/tooltips

### Step 5: Production Release
- Deploy to production
- Monitor for issues
- Gather user feedback

---

## Technical Considerations

### Performance
- KaTeX is fast, but consider caching rendered math
- Lazy load KaTeX CSS on first use
- Pre-render common expressions if possible

### Accessibility
- Ensure math expressions are readable by screen readers
- Add `aria-label` attributes
- Consider MathML for better accessibility

### Security
- Sanitize user input before rendering
- KaTeX has built-in XSS protection
- Validate math syntax before saving

### Backward Compatibility
- Existing questions without math notation should still work
- Graceful fallback if math rendering fails
- Display original text if rendering error occurs

---

## Alternative Implementation: Simplified Syntax

If LaTeX syntax is too complex for teachers, consider a simpler alternative:

### Simplified Syntax
```
Exponents:
  x^2       → x²
  x^(n+1)   → x^(n+1)

Square Roots:
  sqrt(x)   → √x
  sqrt(25)  → √25

Fractions:
  (a)/(b)   → a/b (simpler, but less standard than \frac{a}{b})
```

**Trade-off**: Simpler syntax but less standard and less extensible. LaTeX syntax is recommended for better compatibility and future extensibility.

---

## Future Enhancements

1. **More Math Symbols**
   - Integrals: `\int`
   - Greek letters: `\alpha`, `\beta`
   - Summation: `\sum`
   - Limits: `\lim_{x \to \infty}`
   - Matrices and determinants

2. **Math Editor**
   - Visual equation editor
   - Click-to-insert symbols
   - WYSIWYG interface

3. **Math Input for Students** ✅ **NOW INCLUDED**
   - Allow students to input math notation in answers
   - Simple button-based interface (no LaTeX typing required)
   - Visual math symbol toolbar
   - Live preview of student input
   - Useful for input-type tests

4. **Mobile Native Rendering**
   - Better performance with native math rendering
   - Offline support

---

## Files to Modify

### Web App
1. `package.json` - Add KaTeX dependencies
2. `src/utils/mathRenderer.js` - **NEW** - Math rendering utility
3. `src/components/test/MultipleChoiceQuestion.jsx` - Update rendering
4. `src/components/forms/QuestionForm.jsx` - Add math helper UI
5. `src/components/test/InputQuestion.jsx` - Update if needed
6. `index.html` - Add KaTeX CSS link

### Mobile App
1. `MWSExpo/package.json` - Add math rendering library
2. `MWSExpo/src/components/questions/MultipleChoiceQuestion.tsx` - Update rendering
3. `MWSExpo/src/components/questions/InputQuestion.tsx` - **UPDATE** - Add math input support
4. `MWSExpo/src/components/math/MathInputToolbar.tsx` - **NEW** - Math input toolbar for students
5. `MWSExpo/src/utils/mathRenderer.ts` - **NEW** - Math rendering utility

### Documentation
1. `MATH_NOTATION_IMPLEMENTATION_PLAN.md` - This file
2. Teacher guide (to be created)
3. Developer documentation updates

---

## Estimated Timeline

- **Phase 1-2**: Research and design (2-3 days)
- **Phase 3**: Implementation (8-12 days)
  - Math utility: 1 day
  - Math input toolbar: 2-3 days
  - Answer validator: 1 day
  - Web app updates: 2-3 days
  - Mobile app updates: 2-3 days
- **Phase 4**: UX enhancements (2-3 days)
- **Phase 5**: Testing (4-6 days)
  - Multiple choice tests: 2 days
  - Input tests with math input: 2-3 days
  - Cross-browser/mobile testing: 1 day
- **Phase 6**: Documentation (1-2 days)
- **Phase 7**: Rollout (1-2 days)

**Total**: ~18-26 days

---

## Success Criteria

1. ✅ Teachers can input exponents using `x^2` syntax
2. ✅ Teachers can input square roots using `\sqrt{x}` syntax
3. ✅ Teachers can input fractions using `\frac{a}{b}` syntax
4. ✅ Math renders correctly in web app for students (multiple choice)
5. ✅ Math renders correctly in mobile app for students (multiple choice)
6. ✅ **Students can input math notation in input tests using button-based interface**
7. ✅ **Math input toolbar is simple and intuitive (no LaTeX knowledge required)**
8. ✅ **Live preview shows how student answer will look**
9. ✅ **Answer validation works correctly with math notation**
10. ✅ Existing questions without math still work
11. ✅ No performance degradation
12. ✅ Works across all major browsers
13. ✅ Mobile rendering is smooth and readable (including fractions)
14. ✅ Fractions display properly in answer options
15. ✅ Documentation is clear and helpful

---

## Questions to Resolve

1. **Syntax Preference**: LaTeX (`\sqrt{x}`) vs Simplified (`sqrt(x)`)
2. **Display Mode**: Inline ($...$) vs Display ($$...$$) vs auto-detect
3. **Error Handling**: Show errors or fallback to plain text?
4. **Mobile Library**: Which library to use for React Native?
5. **Accessibility**: How to ensure screen reader compatibility?
6. **Math Input Interface**: 
   - ✅ **RESOLVED**: Button-based toolbar for students (no LaTeX typing required)
   - Auto-detect when math input is needed (test setting or question contains math)
   - Which symbols to include in the toolbar (prioritize common ones)
7. **Answer Comparison**: 
   - How to handle equivalent formats (x^2 vs x²)?
   - Should we normalize before comparison?
   - ✅ **RESOLVED**: Use normalization and rendering comparison

---

## Next Steps

1. Review and approve this plan
2. Decide on syntax preference (LaTeX vs Simplified)
3. Choose mobile rendering library
4. Begin Phase 1 implementation
5. Set up testing environment
6. Create sample test questions with math notation

---

## References

- KaTeX Documentation: https://katex.org/
- KaTeX React Component: https://github.com/KaTeX/KaTeX
- MathJax Documentation: https://www.mathjax.org/
- React Native Math View: https://github.com/calvium/react-native-math-view
- LaTeX Math Syntax: https://www.overleaf.com/learn/latex/Mathematical_expressions

