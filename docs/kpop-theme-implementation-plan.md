# K-Pop Theme Implementation Plan

## Overview
Add a new "K-Pop" theme option alongside the existing "Light" and "Cyberpunk" themes in the student settings. The K-Pop theme will feature vibrant violet/purple colors inspired by the K-Pop aesthetic, with a modern, energetic feel.

## Current State Analysis

### Existing Theme System
- **ThemeContext** (`src/contexts/ThemeContext.jsx`): Manages theme state with 'light' and 'cyberpunk' options
- **themeUtils.js** (`src/utils/themeUtils.js`): Contains color definitions, theme classes, and utility functions
- **SettingsModal** (`src/components/modals/SettingsModal.jsx`): UI for theme selection with toggle buttons
- **useTheme hook** (`src/hooks/useTheme.js`): Provides theme context access
- **Storage**: Themes are persisted to localStorage with key `student_theme_preference`

### Current Themes
1. **Light Theme**: White backgrounds, gray text, blue accents (original pre-cyberpunk styling)
2. **Cyberpunk Theme**: Black backgrounds, neon cyan/yellow/red/purple accents, glow effects

## K-Pop Theme Design Specifications

### Color Palette (Based on K-Pop Stack Example)
```javascript
KPOP_COLORS = {
  primary: '#8b5cf6',        // Violet-500 (main accent)
  primaryDark: '#7c3aed',   // Violet-600 (darker variant)
  primaryLight: '#a78bfa',  // Violet-400 (lighter variant)
  secondary: '#ec4899',     // Pink-500 (accent color)
  background: '#ffffff',    // White (clean background)
  backgroundSecondary: '#faf5ff', // Violet-50 (subtle background)
  text: '#1e1b4b',          // Violet-900 (dark text)
  textSecondary: '#6b21a8', // Violet-800 (secondary text)
  border: '#c4b5fd',        // Violet-300 (borders)
  accent: '#f59e0b',        // Amber-500 (gold accent)
  success: '#10b981',       // Green-500 (success states)
  error: '#ef4444',         // Red-500 (error states)
}
```

### Visual Characteristics
- **Background**: White with subtle violet tints (`bg-white`, `bg-violet-50`)
- **Primary Accent**: Vibrant violet/purple (`violet-500`, `#8b5cf6`)
- **Typography**: Bold, energetic fonts with drop shadows
- **Buttons**: Violet backgrounds with white text, hover effects
- **Cards**: White backgrounds with violet borders and subtle shadows
- **Effects**: Soft shadows and gradients (no neon glow like cyberpunk)
- **Overall Feel**: Modern, vibrant, energetic, clean

## Implementation Steps

### Phase 1: Update Theme Utilities

#### 1.1 Add K-Pop Color Constants
**File**: `src/utils/themeUtils.js`

- Add `KPOP_COLORS` constant object (similar to `CYBERPUNK_COLORS`)
- Define all color values based on the palette above
- Add helper function `getKpopCardBg(index)` for varied card backgrounds (optional)

#### 1.2 Update `getThemeClasses()` Function
**File**: `src/utils/themeUtils.js`

- Add `kpop` theme object to the `themes` object in `getThemeClasses()`
- Define Tailwind classes for:
  - Backgrounds: `bg-white`, `bg-violet-50`
  - Text: `text-violet-900`, `text-violet-800`
  - Borders: `border-violet-300`, `border-violet-500`
  - Buttons: `bg-violet-500`, `bg-violet-600` (hover)
  - Cards: `bg-white`, `border-violet-200`
  - Inputs: `bg-white`, `border-violet-300`

#### 1.3 Update `getThemeStyles()` Function
**File**: `src/utils/themeUtils.js`

- Add `kpop` case to return inline styles
- Define styles for:
  - Text shadows (subtle, not neon)
  - Button hover effects
  - Card shadows
  - Border highlights
- Keep effects subtle and modern (no neon glow)

#### 1.4 Update `applyThemeToDocument()` Function
**File**: `src/utils/themeUtils.js`

- Add `'kpop'` case to set `data-theme="kpop"` attribute

### Phase 2: Update Theme Context

#### 2.1 Update ThemeContext Type Definition
**File**: `src/contexts/ThemeContext.jsx`

- Update context default to include `'kpop'` as valid theme
- Add `isKpop: false` to context default
- Update comment: `// 'light' | 'cyberpunk' | 'kpop'`

#### 2.2 Update ThemeProvider Component
**File**: `src/contexts/ThemeContext.jsx`

- Update `useState` initializer to handle `'kpop'` theme from localStorage
- Update `setTheme` validation to accept `'kpop'` as valid theme
- Add `isKpop: theme === 'kpop'` to context value
- Update default fallback logic to handle kpop theme

### Phase 3: Update Settings Modal

#### 3.1 Add K-Pop Theme Toggle Button
**File**: `src/components/modals/SettingsModal.jsx`

- Add third toggle button for "K-Pop Theme" after Cyberpunk theme
- Style button with violet colors when active
- Add active state indicator (similar to existing theme buttons)
- Ensure button works in both light and cyberpunk themes (for when viewing settings)

#### 3.2 Update Modal Styling for K-Pop Theme
**File**: `src/components/modals/SettingsModal.jsx`

- Add conditional styling for when `isKpop` is true
- Use violet colors instead of cyan/blue
- Apply kpop theme styles to modal background, borders, text

### Phase 4: Update Components to Support K-Pop Theme

#### 4.1 Identify Components Using Theme
**Files to Update**:
- `src/student/StudentCabinet.jsx`
- `src/student/StudentTests.jsx`
- `src/student/StudentResults.jsx`
- `src/components/test/MultipleChoiceQuestion.jsx`
- `src/components/test/WordMatchingStudent.jsx`
- `src/components/test/SpeakingTestStudent.jsx`
- Any other student-facing components

#### 4.2 Update Component Theme Logic
For each component:

- Add `isKpop` check alongside `isCyberpunk` and `isLight`
- Add conditional styling for kpop theme:
  ```jsx
  className={`... ${isKpop ? 'bg-violet-50 text-violet-900' : isCyberpunk ? '...' : '...'}`}
  style={isKpop ? { color: KPOP_COLORS.primary } : isCyberpunk ? {...} : {}}
  ```
- Update button styles to use violet colors when `isKpop`
- Update card backgrounds to use white with violet borders
- Update text colors to use violet shades

#### 4.3 Update Test Components
- MultipleChoiceQuestion: Add kpop styling for options, buttons
- WordMatchingStudent: Add kpop colors for blocks, arrows
- SpeakingTestStudent: Add kpop styling for recording interface
- Other test components as needed

### Phase 5: Testing & Refinement

#### 5.1 Visual Testing
- Test theme switching between all three themes
- Verify colors are consistent across all pages
- Check that kpop theme looks good on all student pages
- Ensure no styling conflicts or broken layouts

#### 5.2 Functional Testing
- Test theme persistence (localStorage)
- Test theme switching in SettingsModal
- Verify theme applies immediately on change
- Test theme on page refresh (should persist)

#### 5.3 Cross-Component Testing
- Test all student pages with kpop theme
- Test all test types with kpop theme
- Verify buttons, cards, inputs all styled correctly
- Check responsive design with kpop theme

## File Changes Summary

### Files to Modify
1. `src/utils/themeUtils.js` - Add KPOP_COLORS, update theme functions
2. `src/contexts/ThemeContext.jsx` - Add kpop theme support
3. `src/components/modals/SettingsModal.jsx` - Add kpop theme toggle
4. `src/hooks/useTheme.js` - (May need update if it exports theme types)

### Files to Update (Component Styling)
1. `src/student/StudentCabinet.jsx`
2. `src/student/StudentTests.jsx`
3. `src/student/StudentResults.jsx`
4. `src/components/test/MultipleChoiceQuestion.jsx`
5. `src/components/test/WordMatchingStudent.jsx`
6. `src/components/test/SpeakingTestStudent.jsx`
7. Any other student-facing components using theme

### New Files (Optional)
- None required (all changes are additions to existing files)

## Technical Details

### Theme Storage
- **Key**: `student_theme_preference` (existing)
- **Values**: `'light'` | `'cyberpunk'` | `'kpop'`
- **Location**: localStorage
- **Default**: `'cyberpunk'` (or current default)

### Theme Context Structure (Updated)
```javascript
const ThemeContext = createContext({
  theme: 'cyberpunk', // 'light' | 'cyberpunk' | 'kpop'
  setTheme: (theme) => {},
  isCyberpunk: true,
  isLight: false,
  isKpop: false, // NEW
  themeClasses: {},
});
```

### Theme Utility Functions (Updated)
```javascript
// themeUtils.js additions
export const KPOP_COLORS = {
  primary: '#8b5cf6',
  primaryDark: '#7c3aed',
  primaryLight: '#a78bfa',
  // ... more colors
};

export const getThemeClasses = (theme) => {
  const themes = {
    light: { /* existing */ },
    cyberpunk: { /* existing */ },
    kpop: { /* NEW - violet-based styling */ }
  };
  return themes[theme] || themes.cyberpunk;
};

export const getThemeStyles = (theme) => {
  if (theme === 'cyberpunk') { /* existing */ }
  if (theme === 'kpop') {
    return {
      // Subtle shadows, violet accents, modern styling
    };
  }
  return {}; // light theme
};
```

## Design Decisions

### Why Violet/Purple?
- Matches K-Pop Stack example aesthetic
- Vibrant and energetic (fits K-Pop culture)
- Distinct from light (blue) and cyberpunk (cyan/neon)
- Modern and appealing to students

### Why White Backgrounds?
- Clean and modern (like K-Pop Stack)
- Better readability than dark backgrounds
- Distinguishes from cyberpunk (black)
- Professional yet vibrant

### Why Subtle Effects?
- No neon glow (distinguishes from cyberpunk)
- Soft shadows for depth
- Modern gradient accents
- Maintains professional appearance

## Migration Notes

### Backward Compatibility
- Existing themes (light, cyberpunk) remain unchanged
- Existing localStorage values continue to work
- Default theme behavior unchanged
- No breaking changes to existing components

### Gradual Rollout
- Can be implemented incrementally
- Components can be updated one at a time
- Missing kpop styling will fallback to light theme
- No rush to update all components at once

## Success Criteria

1. ✅ K-Pop theme appears in SettingsModal alongside Light and Cyberpunk
2. ✅ Theme can be selected and persists across sessions
3. ✅ All student pages display correctly with kpop theme
4. ✅ Colors are consistent and match the K-Pop aesthetic
5. ✅ No visual bugs or styling conflicts
6. ✅ Theme switching is smooth and immediate
7. ✅ All test components work with kpop theme

## Estimated Effort

- **Phase 1** (Theme Utilities): 1-2 hours
- **Phase 2** (Theme Context): 30 minutes
- **Phase 3** (Settings Modal): 1 hour
- **Phase 4** (Component Updates): 3-4 hours (depending on number of components)
- **Phase 5** (Testing): 1-2 hours

**Total**: ~6-9 hours

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Theme Utilities) - foundation
3. Move to Phase 2 (Theme Context) - core functionality
4. Implement Phase 3 (Settings Modal) - user interface
5. Update components incrementally (Phase 4)
6. Test thoroughly (Phase 5)

## Notes

- K-Pop theme should feel vibrant and energetic but still professional
- Colors should be consistent across all components
- Consider adding subtle animations/transitions for theme switching
- May want to add theme preview in SettingsModal (optional enhancement)

