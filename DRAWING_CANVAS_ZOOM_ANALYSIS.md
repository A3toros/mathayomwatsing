# Drawing Canvas Zoom and Fullscreen Analysis

## 🎯 **OVERVIEW**

This document analyzes how canvas zoom and fullscreen functionality is implemented in the drawing test system. The implementation uses a sophisticated approach with large canvas support, responsive zoom controls, and multi-touch gesture handling.

## 🏗️ **ARCHITECTURE**

### **Core Components:**
- `DrawingTestStudent.jsx` - Main component handling zoom logic
- `DrawingCanvas` - Embedded canvas component with zoom functionality
- Konva.js - Canvas rendering library with built-in zoom/pan support

### **Key Concepts:**
1. **Large Canvas Approach** - Uses high-resolution canvas (1536x2048) with viewport display (600x800)
2. **Responsive Zoom** - Dynamic zoom calculation based on screen size
3. **Multi-touch Gestures** - Two-finger zoom and pan support
4. **Fullscreen Mode** - Automatic zoom adjustment for fullscreen display

## 📐 **CANVAS DIMENSIONS SYSTEM**

### **Canvas Size Configuration:**
```javascript
// Database fields from question object:
canvas_width: 600,        // Viewport width (display size)
canvas_height: 800,       // Viewport height (display size)
max_canvas_width: 1536,   // Actual canvas width (high resolution)
max_canvas_height: 2048  // Actual canvas height (high resolution)
```

### **Size Relationship:**
- **Viewport Size**: 600x800 (what user sees initially)
- **Actual Canvas**: 1536x2048 (high-resolution drawing surface)
- **Zoom Factor**: 2.56x (1536/600) for full resolution display

## 🔍 **ZOOM IMPLEMENTATION**

### **1. Zoom State Management:**
```javascript
const [zoom, setZoom] = useState(1.0);
const [fitZoom, setFitZoom] = useState(0.25);
const zoomInitializedRef = useRef(false);
```

### **2. Zoom Limits:**
```javascript
// Maximum zoom calculation
const maxCanvasWidth = question?.max_canvas_width || 1536;
const maxCanvasHeight = question?.max_canvas_height || 2048;
const maxZoomX = maxCanvasWidth / canvasSize.width;
const maxZoomY = maxCanvasHeight / canvasSize.height;
const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0); // Cap at 1.0x

// Minimum zoom
const minZoom = 0.25;
const clampedScale = Math.max(minZoom, Math.min(maxZoom, newScale));
```

### **3. Zoom Methods:**

#### **A. Mouse Wheel Zoom:**
```javascript
const handleWheel = (e) => {
  e.evt.preventDefault();
  const stage = stageRef.current;
  const oldScale = stage.scaleX();
  const pointer = stage.getPointerPosition();
  
  // Calculate zoom towards mouse position
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };
  
  const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
  const clampedScale = Math.max(fitZoom, Math.min(maxZoom, newScale));
  
  // Update stage with new scale and position
  stage.scale({ x: clampedScale, y: clampedScale });
  stage.position(newPos);
  stage.batchDraw();
};
```

#### **B. Button Controls:**
```javascript
// Zoom In Button
onClick={() => {
  const stage = stageRef.current;
  const newScale = Math.min(maxZoom, stage.scaleX() * 1.2);
  stage.scale({ x: newScale, y: newScale });
  stage.batchDraw();
  onZoomChange(newScale);
}}

// Zoom Out Button
onClick={() => {
  const stage = stageRef.current;
  const newScale = Math.max(fitZoom, stage.scaleX() * 0.8);
  stage.scale({ x: newScale, y: newScale });
  stage.batchDraw();
  onZoomChange(newScale);
}}
```

## 📱 **TOUCH GESTURE HANDLING**

### **1. Two-Finger Gesture Detection:**
```javascript
const GESTURE_THRESHOLDS = {
  scaleDelta: isHighDPI ? 0.03 : 0.05,  // Zoom sensitivity
  centerDelta: isHighDPI ? 15 : 20,      // Pan sensitivity
  minTouchDistance: 10,                  // Minimum gesture distance
};

const getTouchDistance = (touches) => {
  if (touches.length < 2) return 0;
  const touch1 = touches[0];
  const touch2 = touches[1];
  return Math.sqrt(
    Math.pow(touch2.clientX - touch1.clientX, 2) + 
    Math.pow(touch2.clientY - touch1.clientY, 2)
  );
};
```

### **2. Gesture State Management:**
```javascript
const [lastTouchDistance, setLastTouchDistance] = useState(null);
const [lastTouchCenter, setLastTouchCenter] = useState(null);
const [isTwoFingerGesture, setIsTwoFingerGesture] = useState(false);
const [gestureType, setGestureType] = useState(null); // 'zoom' | 'pan' | null
const [isGestureActive, setIsGestureActive] = useState(false);
```

### **3. Zoom Gesture Implementation:**
```javascript
if (scaleDelta > GESTURE_THRESHOLDS.scaleDelta) {
  setGestureType('zoom');
  
  const scaleChange = currentDistance / lastTouchDistance;
  const oldScale = stage.scaleX();
  const newScale = oldScale * scaleChange;
  const clampedScale = Math.max(0.25, Math.min(maxZoom, newScale));
  
  // Zoom towards finger center (natural pinch-to-zoom)
  const zoomPoint = currentCenter;
  const mousePointTo = {
    x: (zoomPoint.x - stage.x()) / oldScale,
    y: (zoomPoint.y - stage.y()) / oldScale,
  };
  
  const newPos = {
    x: zoomPoint.x - mousePointTo.x * clampedScale,
    y: zoomPoint.y - mousePointTo.y * clampedScale,
  };
  
  // Throttled update using requestAnimationFrame
  const updateStage = () => {
    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position(newPos);
    stage.batchDraw();
  };
  
  if (!animationId) {
    animationId = requestAnimationFrame(updateStage);
  }
}
```

### **4. Pan Gesture Implementation:**
```javascript
else if (centerDelta > GESTURE_THRESHOLDS.centerDelta) {
  setGestureType('pan');
  
  const deltaX = currentCenter.x - lastTouchCenter.x;
  const deltaY = currentCenter.y - lastTouchCenter.y;
  
  // Only pan if not completely zoomed out
  const minZoom = 0.25;
  const currentScale = stage.scaleX();
  let newPos;
  
  if (currentScale <= minZoom) {
    // At minimum zoom, keep centered
    const stageWidth = responsiveDimensions.width;
    const stageHeight = responsiveDimensions.height;
    const canvasWidth = canvasSize.width * currentScale;
    const canvasHeight = canvasSize.height * currentScale;
    newPos = {
      x: (stageWidth - canvasWidth) / 2,
      y: (stageHeight - canvasHeight) / 2,
    };
  } else {
    // Normal pan
    const currentPos = stage.position();
    newPos = {
      x: currentPos.x + deltaX,
      y: currentPos.y + deltaY,
    };
  }
  
  stage.position(newPos);
  stage.batchDraw();
}
```

## 🖥️ **FULLSCREEN MODE**

### **1. Fullscreen Toggle:**
```javascript
const toggleFullscreen = () => {
  if (!isFullscreen) {
    // Enter fullscreen
    const canvasContainer = document.querySelector('.drawing-canvas-container');
    if (canvasContainer) {
      if (canvasContainer.requestFullscreen) {
        canvasContainer.requestFullscreen();
      } else if (canvasContainer.webkitRequestFullscreen) {
        canvasContainer.webkitRequestFullscreen();
      } else if (canvasContainer.msRequestFullscreen) {
        canvasContainer.msRequestFullscreen();
      }
    }
  } else {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
};
```

### **2. Fullscreen Event Listeners:**
```javascript
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('msfullscreenchange', handleFullscreenChange);

  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('msfullscreenchange', handleFullscreenChange);
  };
}, []);
```

### **3. Responsive Dimensions in Fullscreen:**
```javascript
const getResponsiveDimensions = () => {
  if (isFullscreen) {
    // In fullscreen, use viewport size with calculated zoom
    const viewportWidth = question?.canvas_width || 600;
    const viewportHeight = question?.canvas_height || 800;
    
    // Calculate zoom to fit viewport in screen
    const screenWidth = window.innerWidth - 40; // Margin for UI
    const screenHeight = window.innerHeight - 40; // Margin for UI
    
    const zoomX = screenWidth / viewportWidth;   // 1920/600 = 3.2
    const zoomY = screenHeight / viewportHeight; // 1080/800 = 1.35
    const fullscreenZoom = Math.min(zoomX, zoomY, 1.0); // Don't upscale
    
    return {
      width: viewportWidth,   // 600 - viewport size
      height: viewportHeight, // 800 - viewport size
      zoom: fullscreenZoom    // Calculated zoom
    };
  }
  
  // Normal mode - use viewport size
  const viewportWidth = question?.canvas_width || 600;
  const viewportHeight = question?.canvas_height || 800;
  
  return {
    width: viewportWidth,
    height: viewportHeight,
    zoom: 1.0
  };
};
```

## 🎨 **CANVAS RENDERING**

### **1. Stage Configuration:**
```javascript
<Stage
  ref={stageRef}
  width={responsiveDimensions.width}
  height={responsiveDimensions.height}
  scaleX={isFullscreen ? responsiveDimensions.zoom : zoom}
  scaleY={isFullscreen ? responsiveDimensions.zoom : zoom}
  onMouseDown={handleMouseDown}
  onMousemove={handleMouseMove}
  onMouseup={handleMouseUp}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  onWheel={handleWheel}
  onDragStart={() => {
    if (currentTool === 'pan') {
      setIsPanning(true);
    }
  }}
  onDragEnd={() => {
    setIsPanning(false);
  }}
  draggable={currentTool === 'pan'}
>
```

### **2. Drawing Tools Integration:**
- **Pencil Tool**: Direct drawing with zoom-aware coordinates
- **Shape Tools**: Rectangle, circle, line with zoom scaling
- **Pan Tool**: Konva's built-in drag functionality

## ⚡ **PERFORMANCE OPTIMIZATIONS**

### **1. Animation Throttling:**
```javascript
let animationId = null;

const updateStage = () => {
  stage.scale({ x: clampedScale, y: clampedScale });
  stage.position(newPos);
  stage.batchDraw();
  animationId = null;
};

if (!animationId) {
  animationId = requestAnimationFrame(updateStage);
}
```

### **2. Gesture State Cleanup:**
```javascript
const resetGestureState = () => {
  setIsGestureActive(false);
  setGestureType(null);
  setLastTouchDistance(null);
  setLastTouchCenter(null);
  setIsDrawing(false);
  setStartPoint(null);
  
  // Cancel any pending animations
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // Stop any running Konva animations
  if (stageRef.current) {
    stageRef.current.stop();
  }
};
```

### **3. Device-Adaptive Thresholds:**
```javascript
const getDevicePixelRatio = () => window.devicePixelRatio || 1;
const isHighDPI = getDevicePixelRatio() > 1.5;

const GESTURE_THRESHOLDS = {
  scaleDelta: isHighDPI ? 0.03 : 0.05, // More sensitive on high-DPI
  centerDelta: isHighDPI ? 15 : 20,    // Adjusted for pixel density
  minTouchDistance: 10,                // Minimum distance to register gesture
};
```

## 🔧 **CONFIGURATION OPTIONS**

### **1. Zoom Limits:**
- **Minimum Zoom**: 0.25x (25% of original size)
- **Maximum Zoom**: 1.0x (100% - no upscaling)
- **Fit Zoom**: Automatically calculated to fit canvas in container

### **2. Gesture Sensitivity:**
- **High-DPI Devices**: More sensitive thresholds
- **Standard Devices**: Standard thresholds
- **Minimum Touch Distance**: 10px to register gesture

### **3. Fullscreen Behavior:**
- **Automatic Zoom**: Calculated to fit viewport in screen
- **No Upscaling**: Maximum zoom capped at 1.0x
- **UI Margins**: 40px margin for UI elements

## 📊 **DEBUGGING AND LOGGING**

### **1. Zoom State Logging:**
```javascript
console.log('🎨 DrawingTestStudent - Zoom gesture - Scale:', clampedScale.toFixed(2), 'Center:', zoomPoint);
console.log('🎨 DrawingTestStudent - New effective size:', Math.round(canvasSize.width * clampedScale), 'x', Math.round(canvasSize.height * clampedScale));
console.log('🎨 DrawingTestStudent - New resolution:', Math.round(canvasSize.width * clampedScale * canvasSize.height * clampedScale), 'pixels');
```

### **2. Canvas Initialization Logging:**
```javascript
console.log('🎨 DrawingTestStudent - Canvas size set:', actualCanvasWidth, 'x', actualCanvasHeight);
console.log('🎨 DrawingTestStudent - Viewport size:', viewportWidth, 'x', viewportHeight);
console.log('🎨 DrawingTestStudent - Initial zoom:', initialZoom.toFixed(2));
console.log('🎨 DrawingTestStudent - Image resolution:', actualCanvasWidth * actualCanvasHeight, 'pixels');
console.log('🎨 DrawingTestStudent - Aspect ratio:', (actualCanvasWidth / actualCanvasHeight).toFixed(2));
```

## 🎯 **KEY FEATURES**

### **✅ Implemented Features:**
1. **Multi-touch Zoom**: Two-finger pinch-to-zoom
2. **Multi-touch Pan**: Two-finger drag to pan
3. **Mouse Wheel Zoom**: Scroll wheel zoom with mouse position focus
4. **Button Controls**: Zoom in/out buttons with visual feedback
5. **Fullscreen Mode**: Automatic zoom adjustment for fullscreen
6. **Responsive Design**: Adaptive zoom based on screen size
7. **High-DPI Support**: Device-specific gesture sensitivity
8. **Performance Optimization**: Throttled updates and animation cleanup

### **🔧 Technical Highlights:**
- **Large Canvas Support**: High-resolution drawing with viewport display
- **Gesture Recognition**: Sophisticated two-finger gesture detection
- **Zoom Constraints**: Intelligent zoom limits based on canvas size
- **Cross-Platform**: Fullscreen API support for all browsers
- **Memory Management**: Proper cleanup of animations and event listeners

## 📝 **USAGE EXAMPLES**

### **1. Basic Zoom Implementation:**
```javascript
// Set initial zoom
const initialZoom = 1.0;
setZoom(initialZoom);

// Handle zoom change
const handleZoomChange = (newZoom) => {
  setZoom(newZoom);
  onZoomChange(newZoom);
};
```

### **2. Fullscreen Toggle:**
```javascript
// Toggle fullscreen mode
const toggleFullscreen = () => {
  if (!isFullscreen) {
    // Enter fullscreen
    const container = document.querySelector('.drawing-canvas-container');
    container?.requestFullscreen();
  } else {
    // Exit fullscreen
    document.exitFullscreen();
  }
};
```

### **3. Touch Gesture Handling:**
```javascript
// Handle two-finger gestures
const handleTouchMove = (e) => {
  const touches = e.evt.touches;
  
  if (touches.length === 2 && isGestureActive) {
    // Detect zoom vs pan
    const scaleDelta = Math.abs(currentDistance / lastTouchDistance - 1);
    const centerDelta = Math.sqrt(/* distance calculation */);
    
    if (scaleDelta > GESTURE_THRESHOLDS.scaleDelta) {
      // Handle zoom
      handleZoomGesture();
    } else if (centerDelta > GESTURE_THRESHOLDS.centerDelta) {
      // Handle pan
      handlePanGesture();
    }
  }
};
```

---

**Status**: ✅ Complete Implementation  
**Last Updated**: 2025-01-28  
**Version**: 1.0  
**Maintainer**: Development Team
