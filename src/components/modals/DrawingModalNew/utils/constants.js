// Constants for DrawingModal

// Canvas configuration
export const CANVAS_CONFIG = {
  WIDTH: 1536,
  HEIGHT: 2048,
  ASPECT_RATIO: 1536 / 2048, // 3:4
};

// Zoom configuration
export const ZOOM_CONFIG = {
  MIN: 0.25,        // 25% - shows full canvas
  MAX: 1.0,         // 100% - max zoom (full resolution)
  INITIAL: 0.25,    // Start at min zoom to show full canvas (teacher view)
  STEP: 0.1,        // Zoom step size
};

// Gesture thresholds
export const GESTURE_THRESHOLDS = {
  SCALE_DELTA: 0.05,      // 5% change = zoom gesture
  CENTER_DELTA: 20,       // 20px movement = pan gesture
  MIN_TOUCH_DISTANCE: 10, // Minimum distance to register
};

// Drawing tools
export const DRAWING_TOOLS = {
  PENCIL: 'pencil',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  PAN: 'pan',
};

// Color palette
export const COLOR_PALETTE = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
];

// Default settings
export const DEFAULT_SETTINGS = {
  color: '#000000',
  thickness: 2,
  tool: 'pencil',
};

// Performance settings
export const PERFORMANCE_CONFIG = {
  THROTTLE_MS: 16,        // 60fps
  RAF_THROTTLE: true,     // Use requestAnimationFrame
  HIGH_DPI_THRESHOLD: 1.5, // Device pixel ratio threshold
};

// UI settings
export const UI_CONFIG = {
  TOOLBAR_SIZE: 40,       // Toolbar button size
  COLOR_BUTTON_SIZE: 32,  // Color button size
  ZOOM_INDICATOR_SIZE: 12, // Zoom indicator font size
  SHADOW_DEPTH: 'lg',     // Shadow depth
};

// Animation settings
export const ANIMATION_CONFIG = {
  DURATION: 200,          // Animation duration in ms
  EASING: 'ease-out',     // Animation easing
  ZOOM_DURATION: 150,     // Zoom animation duration
  PAN_DURATION: 100,      // Pan animation duration
};

// Export settings
export const EXPORT_CONFIG = {
  MIME_TYPE: 'image/png',
  QUALITY: 1,
  PIXEL_RATIO: 1,
  FILENAME_PREFIX: 'drawing',
  DATE_FORMAT: 'YYYY-MM-DD',
};
