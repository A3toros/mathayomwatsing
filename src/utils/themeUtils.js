/**
 * Theme utility functions for managing theme classes and styles
 */

/**
 * Cyberpunk color palette from cyberpunk.css
 */
export const CYBERPUNK_COLORS = {
  yellow: '#f8ef02',
  cyan: '#00ffd2',
  red: '#ff003c',
  blue: '#136377',
  green: '#446d44',
  purple: 'purple',
  black: '#000',
  white: '#fff',
  dark: '#333',
};

/**
 * BLACKPINK theme color palette - black and pink with glowing effects
 */
export const KPOP_COLORS = {
  primary: '#ec4899',        // Pink-500 (BLACKPINK pink - main accent)
  primaryDark: '#db2777',    // Pink-600 (darker pink)
  primaryLight: '#f472b6',   // Pink-400 (lighter pink)
  secondary: '#a855f7',      // Purple-500 (vibrant purple)
  background: '#000000',     // Black (BLACKPINK black)
  backgroundSecondary: '#1a0014', // Dark pink-black (deep background)
  backgroundTertiary: '#2d1b3d',  // Dark purple-black
  text: '#ffffff',           // White (bright text on dark)
  textSecondary: '#fce7f3',  // Pink-50 (soft pink text)
  textAccent: '#ec4899',    // Pink-500 (accent text)
  border: '#ec4899',         // Pink-500 (glowing borders)
  borderSecondary: '#a855f7', // Purple-500 (purple borders)
  accent: '#f472b6',         // Pink-400 (bright accent)
  glow: '#ec4899',           // Pink glow
  glowPurple: '#a855f7',    // Purple glow
  success: '#10b981',        // Green-500 (success states)
  error: '#ef4444',          // Red-500 (error states)
  white: '#ffffff',
  black: '#000000',
};

/**
 * Converts hex color to rgba
 */
const hexToRgba = (hex, alpha = 1) => {
  if (hex.startsWith('#')) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex; // Return as-is if not hex
};

/**
 * Converts named color to rgba (for 'purple')
 */
export const colorToRgba = (color, alpha = 1) => {
  if (color === 'purple') {
    return `rgba(128, 0, 128, ${alpha})`;
  }
  return hexToRgba(color, alpha);
};

/**
 * Returns a varied cyberpunk card background color with pure colors
 * Uses exact cyberpunk.css colors: red, yellow, purple, and cyan
 * Pure colors - no opacity, solid backgrounds
 * @param {number} index - Optional index to determine color (for consistent coloring)
 * @returns {Object} Object with className and style for card background
 */
export const getCyberpunkCardBg = (index = null) => {
  const colorConfigs = [
    { bg: CYBERPUNK_COLORS.red, border: CYBERPUNK_COLORS.red }, // Red
    { bg: CYBERPUNK_COLORS.yellow, border: CYBERPUNK_COLORS.yellow }, // Yellow
    { bg: CYBERPUNK_COLORS.purple, border: CYBERPUNK_COLORS.purple }, // Purple
    { bg: CYBERPUNK_COLORS.cyan, border: CYBERPUNK_COLORS.cyan }, // Cyan
    { bg: CYBERPUNK_COLORS.red, border: CYBERPUNK_COLORS.red }, // Red (variant)
    { bg: CYBERPUNK_COLORS.yellow, border: CYBERPUNK_COLORS.yellow }, // Yellow (variant)
    { bg: CYBERPUNK_COLORS.purple, border: CYBERPUNK_COLORS.purple }, // Purple (variant)
  ];
  
  const selected = index !== null 
    ? colorConfigs[index % colorConfigs.length]
    : colorConfigs[Math.floor(Math.random() * colorConfigs.length)];
  
  // Pure colors - solid black background with colored border
  return {
    className: 'border-2',
    style: {
      backgroundColor: CYBERPUNK_COLORS.black, // Pure black background
      borderColor: selected.border, // Pure color border - no opacity
      borderWidth: '2px',
    }
  };
};

/**
 * Returns a varied BLACKPINK card background with dark backgrounds and glowing pink/purple borders
 * Uses black/pink/purple color scheme with bright glowing effects
 * @param {number} index - Optional index to determine color (for consistent coloring)
 * @returns {Object} Object with className and style for card background
 */
export const getKpopCardBg = (index = null) => {
  const colorConfigs = [
    { 
      background: '#1a0014', // Dark pink-black
      border: KPOP_COLORS.primary,      // Pink-500
      shadow: '0 0 30px rgba(236, 72, 153, 0.8), 0 0 60px rgba(236, 72, 153, 0.6), 0 0 90px rgba(236, 72, 153, 0.4), inset 0 0 30px rgba(236, 72, 153, 0.2)'
    },
    { 
      background: '#2d1b3d', // Dark purple-black
      border: KPOP_COLORS.secondary,    // Purple-500
      shadow: '0 0 30px rgba(168, 85, 247, 0.8), 0 0 60px rgba(168, 85, 247, 0.6), 0 0 90px rgba(168, 85, 247, 0.4), inset 0 0 30px rgba(168, 85, 247, 0.2)'
    },
    { 
      background: '#1f0a1f', // Darker pink-black
      border: KPOP_COLORS.primaryDark,  // Pink-600
      shadow: '0 0 30px rgba(219, 39, 119, 0.8), 0 0 60px rgba(219, 39, 119, 0.6), 0 0 90px rgba(219, 39, 119, 0.4), inset 0 0 30px rgba(219, 39, 119, 0.2)'
    },
    { 
      background: '#2a1b3d', // Dark purple variant
      border: KPOP_COLORS.primaryLight, // Pink-400
      shadow: '0 0 30px rgba(244, 114, 182, 0.8), 0 0 60px rgba(244, 114, 182, 0.6), 0 0 90px rgba(244, 114, 182, 0.4), inset 0 0 30px rgba(244, 114, 182, 0.2)'
    },
    { 
      background: '#1a0a1a', // Deep black-pink
      border: KPOP_COLORS.primary,      // Pink-500
      shadow: '0 0 30px rgba(236, 72, 153, 0.8), 0 0 60px rgba(236, 72, 153, 0.6), 0 0 90px rgba(236, 72, 153, 0.4), inset 0 0 30px rgba(236, 72, 153, 0.2)'
    },
    { 
      background: '#2d1b3d', // Dark purple-black (repeat)
      border: KPOP_COLORS.secondary,    // Purple-500
      shadow: '0 0 30px rgba(168, 85, 247, 0.8), 0 0 60px rgba(168, 85, 247, 0.6), 0 0 90px rgba(168, 85, 247, 0.4), inset 0 0 30px rgba(168, 85, 247, 0.2)'
    },
  ];
  
  const selected = index !== null 
    ? colorConfigs[index % colorConfigs.length]
    : colorConfigs[Math.floor(Math.random() * colorConfigs.length)];
  
  // BLACKPINK style: Dark backgrounds with bright glowing pink/purple borders
  return {
    className: 'border-2',
    style: {
      backgroundColor: selected.background, // Dark black/pink/purple backgrounds
      borderColor: selected.border, // Bright pink/purple glowing borders
      borderWidth: '2px',
      boxShadow: selected.shadow, // Glowing pink/purple shadows
    }
  };
};

/**
 * Returns theme-specific Tailwind CSS class mappings
 * @param {string} theme - 'light' | 'cyberpunk' | 'kpop'
 * @returns {Object} Object with theme-specific class names
 */
export const getThemeClasses = (theme) => {
  const themes = {
    light: {
      // ORIGINAL PRE-CYBERPUNK STYLING - restore exact original appearance
      background: 'bg-white', // Original: simple white background
      backgroundSecondary: 'bg-gray-50',
      text: 'text-gray-900', // Original: standard dark text
      textSecondary: 'text-gray-600',
      border: 'border-gray-300', // Original: standard gray borders
      headerBg: 'bg-blue-600', // Original: blue header background
      headerText: 'text-white', // Original: white text in headers
      headerBorder: 'border-blue-700', // Original: darker blue border
      buttonPrimary: 'bg-blue-500 text-white hover:bg-blue-600', // Original: standard blue buttons
      buttonSecondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300', // Original: gray secondary buttons
      buttonOutline: 'border-gray-300 text-gray-700 hover:bg-gray-50', // Original: outline buttons
      cardBg: 'bg-white', // Original: white card backgrounds
      cardBorder: 'border-gray-200', // Original: light gray borders
      inputBg: 'bg-white', // Original: white input backgrounds
      inputBorder: 'border-gray-300', // Original: gray input borders
      inputText: 'text-gray-900', // Original: dark input text
      progressBg: 'bg-gray-200', // Original: gray progress background
      progressFill: 'bg-blue-500', // Original: blue progress fill
      // No glow effects, no neon colors, no special fonts
    },
    cyberpunk: {
      // ENHANCED CYBERPUNK STYLING WITH EXACT CYBERPUNK.CSS COLORS
      background: 'bg-black',
      backgroundSecondary: 'bg-gray-900',
      // Text colors - components should use inline styles with CYBERPUNK_COLORS
      text: '', // Use inline style: { color: CYBERPUNK_COLORS.cyan }
      textSecondary: '', // Use inline style: { color: CYBERPUNK_COLORS.yellow }
      border: '', // Use inline style: { borderColor: CYBERPUNK_COLORS.cyan }
      headerBg: 'bg-black',
      headerText: '', // Use inline style: { color: CYBERPUNK_COLORS.cyan }
      headerBorder: '', // Use inline style: { borderColor: CYBERPUNK_COLORS.cyan }
      buttonPrimary: '', // Use inline style
      buttonSecondary: 'bg-gray-800', // Use inline style for text and border
      buttonOutline: '', // Use inline style
      // Varied card backgrounds - use getCyberpunkCardBg() for individual cards
      cardBg: '', // Use getCyberpunkCardBg() instead
      cardBorder: '', // Use getCyberpunkCardBg() instead
      inputBg: 'bg-black',
      inputBorder: '', // Use inline style: { borderColor: CYBERPUNK_COLORS.yellow }
      inputText: '', // Use inline style: { color: CYBERPUNK_COLORS.yellow }
      progressBg: 'bg-gray-800',
      progressFill: '', // Use inline style with gradient
      // Additional color variants for buttons and accents
      buttonRed: '', // Use inline style
      buttonYellow: '', // Use inline style
      buttonPurple: '', // Use inline style
    },
    kpop: {
      // BLACKPINK THEME - BLACK AND PINK WITH GLOWING EFFECTS
      background: 'bg-black',
      backgroundSecondary: 'bg-black',
      text: '', // Use inline style: { color: KPOP_COLORS.text }
      textSecondary: '', // Use inline style: { color: KPOP_COLORS.textSecondary }
      border: '', // Use inline style: { borderColor: KPOP_COLORS.border }
      headerBg: 'bg-black',
      headerText: '', // Use inline style: { color: KPOP_COLORS.primary }
      headerBorder: '', // Use inline style: { borderColor: KPOP_COLORS.border }
      buttonPrimary: '', // Use inline style with pink glow
      buttonSecondary: '', // Use inline style
      buttonOutline: '', // Use inline style
      cardBg: '', // Use getKpopCardBg() instead
      cardBorder: '', // Use getKpopCardBg() instead
      inputBg: 'bg-black',
      inputBorder: '', // Use inline style: { borderColor: KPOP_COLORS.border }
      inputText: '', // Use inline style: { color: KPOP_COLORS.text }
      progressBg: 'bg-black',
      progressFill: '', // Use inline style with pink gradient
      // Additional color variants
      buttonPink: '', // Use inline style with pink glow
      buttonPurple: '', // Use inline style with purple glow
    }
  };
  return themes[theme] || themes.cyberpunk;
};

/**
 * Returns theme-specific inline style objects
 * @param {string} theme - 'light' | 'cyberpunk' | 'kpop'
 * @returns {Object} Object with theme-specific inline styles
 */

export const getThemeStyles = (theme) => {
  if (theme === 'cyberpunk') {
    return {
      background: {
        backgroundColor: CYBERPUNK_COLORS.black // Pure black background - no gradients
      },
      glow: {
        boxShadow: `0 0 8px ${CYBERPUNK_COLORS.cyan}, 0 0 12px ${CYBERPUNK_COLORS.cyan}`
      },
      glowRed: {
        boxShadow: `0 0 8px ${CYBERPUNK_COLORS.red}, 0 0 12px ${CYBERPUNK_COLORS.red}`
      },
      glowYellow: {
        boxShadow: `0 0 6px ${CYBERPUNK_COLORS.yellow}, 0 0 10px ${CYBERPUNK_COLORS.yellow}`
      },
      glowPurple: {
        boxShadow: `0 0 8px ${CYBERPUNK_COLORS.purple}, 0 0 12px ${CYBERPUNK_COLORS.purple}`
      },
      glowGreen: {
        boxShadow: `0 0 8px ${CYBERPUNK_COLORS.green}, 0 0 12px ${CYBERPUNK_COLORS.green}`
      },
      textShadow: {
        textShadow: `0 0 10px ${CYBERPUNK_COLORS.cyan}, 0 0 20px ${CYBERPUNK_COLORS.cyan}, 0 0 30px ${CYBERPUNK_COLORS.cyan}`
      },
      textShadowYellow: {
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.yellow}, 0 0 16px ${CYBERPUNK_COLORS.yellow}`
      },
      textShadowRed: {
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.red}, 0 0 16px ${CYBERPUNK_COLORS.red}`
      },
      textShadowPurple: {
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.purple}, 0 0 16px ${CYBERPUNK_COLORS.purple}`
      },
      textShadowGreen: {
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.green}, 0 0 16px ${CYBERPUNK_COLORS.green}`
      },
      // Neon text colors for direct use - pure colors, no opacity
      textCyan: {
        color: CYBERPUNK_COLORS.cyan,
        textShadow: `0 0 10px ${CYBERPUNK_COLORS.cyan}, 0 0 20px ${CYBERPUNK_COLORS.cyan}, 0 0 30px ${CYBERPUNK_COLORS.cyan}`
      },
      textYellow: {
        color: CYBERPUNK_COLORS.yellow,
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.yellow}, 0 0 16px ${CYBERPUNK_COLORS.yellow}`
      },
      textRed: {
        color: CYBERPUNK_COLORS.red,
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.red}, 0 0 16px ${CYBERPUNK_COLORS.red}`
      },
      textPurple: {
        color: CYBERPUNK_COLORS.purple,
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.purple}, 0 0 16px ${CYBERPUNK_COLORS.purple}`
      },
      textGreen: {
        color: CYBERPUNK_COLORS.green,
        textShadow: `0 0 8px ${CYBERPUNK_COLORS.green}, 0 0 16px ${CYBERPUNK_COLORS.green}`
      }
    };
  }
  
  if (theme === 'kpop') {
    return {
      background: {
        backgroundColor: KPOP_COLORS.background,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)'
      },
      backgroundSecondary: {
        backgroundColor: KPOP_COLORS.backgroundSecondary
      },
      // Bright glowing pink/purple shadows - BLACKPINK style (ENHANCED)
      glow: {
        boxShadow: `0 0 30px ${KPOP_COLORS.glow}, 0 0 60px ${KPOP_COLORS.glow}, 0 0 90px ${KPOP_COLORS.glow}, 0 0 120px rgba(236, 72, 153, 0.3)`
      },
      glowPurple: {
        boxShadow: `0 0 30px ${KPOP_COLORS.glowPurple}, 0 0 60px ${KPOP_COLORS.glowPurple}, 0 0 90px ${KPOP_COLORS.glowPurple}, 0 0 120px rgba(168, 85, 247, 0.3)`
      },
      glowRed: {
        boxShadow: `0 0 30px ${KPOP_COLORS.primary}, 0 0 60px ${KPOP_COLORS.primary}, 0 0 90px ${KPOP_COLORS.primary}, 0 0 120px rgba(236, 72, 153, 0.3)`
      },
      shadow: {
        boxShadow: `0 0 20px ${KPOP_COLORS.glow}, 0 0 40px ${KPOP_COLORS.glow}, 0 0 60px rgba(236, 72, 153, 0.4)`
      },
      shadowMd: {
        boxShadow: `0 0 30px ${KPOP_COLORS.glow}, 0 0 60px ${KPOP_COLORS.glow}, 0 0 90px rgba(236, 72, 153, 0.4)`
      },
      shadowLg: {
        boxShadow: `0 0 40px ${KPOP_COLORS.glow}, 0 0 80px ${KPOP_COLORS.glow}, 0 0 120px rgba(236, 72, 153, 0.5)`
      },
      // Bright glowing text shadows - BLACKPINK style (ENHANCED)
      textShadow: {
        textShadow: `0 0 15px ${KPOP_COLORS.glow}, 0 0 30px ${KPOP_COLORS.glow}, 0 0 45px ${KPOP_COLORS.glow}, 0 0 60px rgba(236, 72, 153, 0.4)`
      },
      textShadowMd: {
        textShadow: `0 0 12px ${KPOP_COLORS.glow}, 0 0 24px ${KPOP_COLORS.glow}, 0 0 36px rgba(236, 72, 153, 0.5)`
      },
      textShadowRed: {
        textShadow: `0 0 15px ${KPOP_COLORS.primary}, 0 0 30px ${KPOP_COLORS.primary}, 0 0 45px rgba(236, 72, 153, 0.6)`
      },
      // Bright pink/purple text colors with glow (ENHANCED)
      textPink: {
        color: KPOP_COLORS.primary,
        textShadow: `0 0 15px ${KPOP_COLORS.primary}, 0 0 30px ${KPOP_COLORS.primary}, 0 0 45px ${KPOP_COLORS.primary}, 0 0 60px rgba(236, 72, 153, 0.5)`
      },
      textPurple: {
        color: KPOP_COLORS.secondary,
        textShadow: `0 0 15px ${KPOP_COLORS.secondary}, 0 0 30px ${KPOP_COLORS.secondary}, 0 0 45px ${KPOP_COLORS.secondary}, 0 0 60px rgba(168, 85, 247, 0.5)`
      },
      textWhite: {
        color: KPOP_COLORS.text,
        textShadow: `0 0 10px ${KPOP_COLORS.glow}, 0 0 20px ${KPOP_COLORS.glow}, 0 0 30px rgba(236, 72, 153, 0.4)`
      },
      textAccent: {
        color: KPOP_COLORS.textAccent,
        textShadow: `0 0 12px ${KPOP_COLORS.textAccent}, 0 0 24px ${KPOP_COLORS.textAccent}, 0 0 36px rgba(236, 72, 153, 0.5)`
      },
      // Legacy names for compatibility (ENHANCED)
      textViolet: {
        color: KPOP_COLORS.primary,
        textShadow: `0 0 15px ${KPOP_COLORS.primary}, 0 0 30px ${KPOP_COLORS.primary}, 0 0 45px rgba(236, 72, 153, 0.5)`
      },
      textVioletDark: {
        color: KPOP_COLORS.text,
        textShadow: `0 0 8px ${KPOP_COLORS.glow}, 0 0 16px rgba(236, 72, 153, 0.3)`
      },
      textVioletLight: {
        color: KPOP_COLORS.primaryLight,
        textShadow: `0 0 12px ${KPOP_COLORS.primaryLight}, 0 0 24px ${KPOP_COLORS.primaryLight}, 0 0 36px rgba(244, 114, 182, 0.5)`
      },
      // Button hover effects
      buttonHover: {
        transition: 'all 0.2s ease-in-out'
      },
      // Header gradient - black to pink with more pink accent
      headerGradient: {
        background: 'linear-gradient(135deg, #000000 0%, #1a0014 20%, #ec4899 60%, #f472b6 100%)',
        boxShadow: `0 0 30px ${KPOP_COLORS.primary}, 0 0 60px ${KPOP_COLORS.primary}, 0 0 90px rgba(236, 72, 153, 0.5), inset 0 0 30px rgba(236, 72, 153, 0.2)`
      },
      // Header text with glow - pink text with white outline
      headerText: {
        color: KPOP_COLORS.primary,
        textShadow: `-1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff, 0 -1px 0 #ffffff, 0 1px 0 #ffffff, -1px 0 0 #ffffff, 1px 0 0 #ffffff, 0 0 15px ${KPOP_COLORS.primary}, 0 0 30px ${KPOP_COLORS.primary}, 0 0 45px ${KPOP_COLORS.primary}, 0 0 60px rgba(236, 72, 153, 0.5)`
      }
    };
  }
  
  // Light theme: NO special styles - return empty object to use default/standard styling
  // This ensures we restore the original appearance without any cyberpunk effects
  return {};
};

/**
 * Applies theme to document root (for CSS variables or data attributes)
 * @param {string} theme - 'light' | 'cyberpunk' | 'kpop'
 */
export const applyThemeToDocument = (theme) => {
  if (typeof document === 'undefined') return;
  
  // Set data-theme attribute on document root
  if (theme === 'cyberpunk') {
    document.documentElement.setAttribute('data-theme', 'cyberpunk');
  } else if (theme === 'kpop') {
    document.documentElement.setAttribute('data-theme', 'kpop');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
};

