# Complete Canvas Implementation: Large Canvas + Two-Finger Gestures

## Overview
This file provides the complete implementation for:
1. Large canvas approach (1536x2048 canvas, 600x800 viewport)
2. Two-finger gesture support (pinch-to-zoom, two-finger pan)
3. Both student drawing and teacher viewing interfaces

## 1. Student Drawing Interface (DrawingTestStudent.jsx)

### A. Canvas Size Logic
```javascript
// Initialize canvas with large canvas approach
useEffect(() => {
  if (question) {
    // Use max_canvas as actual canvas size
    const actualCanvasWidth = question.max_canvas_width || 1536;
    const actualCanvasHeight = question.max_canvas_height || 2048;
    const viewportWidth = question.canvas_width || 600;
    const viewportHeight = question.canvas_height || 800;
    
    setCanvasSize({
      width: actualCanvasWidth,   // 1536 - actual canvas
      height: actualCanvasHeight  // 2048 - actual canvas
    });
    
    // Calculate initial zoom to fit viewport
    const initialZoomX = viewportWidth / actualCanvasWidth;   // 600/1536 = 0.39
    const initialZoomY = viewportHeight / actualCanvasHeight; // 800/2048 = 0.39
    const initialZoom = Math.min(initialZoomX, initialZoomY, 1.0);
    
    setZoom(initialZoom);
  }
}, [question]);
```

### B. Two-Finger Gesture State
```javascript
// Two-finger gesture state
const [lastTouchDistance, setLastTouchDistance] = useState(null);
const [lastTouchCenter, setLastTouchCenter] = useState(null);
const [isTwoFingerGesture, setIsTwoFingerGesture] = useState(false);
```

### C. Touch Event Handlers
```javascript
const getTouchDistance = (touches) => {
  if (touches.length < 2) return 0;
  const touch1 = touches[0];
  const touch2 = touches[1];
  return Math.sqrt(
    Math.pow(touch2.clientX - touch1.clientX, 2) + 
    Math.pow(touch2.clientY - touch1.clientY, 2)
  );
};

const getTouchCenter = (touches) => {
  if (touches.length < 2) return null;
  const touch1 = touches[0];
  const touch2 = touches[1];
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
};

const handleTouchStart = (e) => {
  e.evt.preventDefault();
  const touches = e.evt.touches;
  
  if (touches.length === 2) {
    // Two-finger gesture - start zoom/pan
    setIsTwoFingerGesture(true);
    setLastTouchDistance(getTouchDistance(touches));
    setLastTouchCenter(getTouchCenter(touches));
    setIsDrawing(false); // Stop any drawing
  } else if (touches.length === 1) {
    // Single finger - normal drawing
    setIsTwoFingerGesture(false);
    handleMouseDown(e);
  }
};

const handleTouchMove = (e) => {
  e.evt.preventDefault();
  const touches = e.evt.touches;
  
  if (touches.length === 2 && isTwoFingerGesture) {
    // Two-finger gesture - handle zoom and pan
    const stage = stageRef.current;
    const currentDistance = getTouchDistance(touches);
    const currentCenter = getTouchCenter(touches);
    
    if (lastTouchDistance && lastTouchCenter) {
      // Calculate zoom
      const scaleChange = currentDistance / lastTouchDistance;
      const oldScale = stage.scaleX();
      const newScale = oldScale * scaleChange;
      
      // Apply zoom limits (0.25x to 1.0x for large canvas)
      const maxCanvasWidth = question?.max_canvas_width || 1536;
      const maxCanvasHeight = question?.max_canvas_height || 2048;
      const maxZoomX = maxCanvasWidth / canvasSize.width;
      const maxZoomY = maxCanvasHeight / canvasSize.height;
      const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0); // Cap at 1.0x
      const clampedScale = Math.max(0.25, Math.min(maxZoom, newScale));
      
      // Calculate pan
      const deltaX = currentCenter.x - lastTouchCenter.x;
      const deltaY = currentCenter.y - lastTouchCenter.y;
      
      // Apply transformations
      const currentPos = stage.position();
      const newPos = {
        x: currentPos.x + deltaX,
        y: currentPos.y + deltaY
      };
      
      stage.scale({ x: clampedScale, y: clampedScale });
      stage.position(newPos);
      stage.batchDraw();
      
      setZoom(clampedScale);
    }
    
    setLastTouchDistance(currentDistance);
    setLastTouchCenter(currentCenter);
  } else if (touches.length === 1 && !isTwoFingerGesture) {
    // Single finger - normal drawing
    handleMouseMove(e);
  }
};

const handleTouchEnd = (e) => {
  e.evt.preventDefault();
  const touches = e.evt.touches;
  
  if (touches.length === 0) {
    // All fingers lifted
    setIsTwoFingerGesture(false);
    setLastTouchDistance(null);
    setLastTouchCenter(null);
    handleMouseUp();
  } else if (touches.length === 1) {
    // One finger remaining - switch to single finger mode
    setIsTwoFingerGesture(false);
    setLastTouchDistance(null);
    setLastTouchCenter(null);
  }
};
```

### D. Stage Component with Large Canvas
```javascript
<Stage
  ref={stageRef}
  width={viewportWidth}        // 600 - viewport size
  height={viewportHeight}      // 800 - viewport size
  scaleX={zoom}                // 0.39 - initial zoom
  scaleY={zoom}                // 0.39 - initial zoom
  onMousedown={handleMouseDown}
  onMousemove={handleMouseMove}
  onMouseup={handleMouseUp}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  onWheel={handleWheel}
  draggable={currentTool === 'pan' && zoom > 0.25}
  className={`border border-gray-300 rounded-lg shadow-sm ${
    currentTool === 'pan' ? 'cursor-grab' : 
    isPanning ? 'cursor-grabbing' : 
    'cursor-crosshair'
  }`}
>
  <Layer>
    {/* Background at full canvas size */}
    <Rect
      x={0}
      y={0}
      width={canvasSize.width}    // 1536 - full canvas
      height={canvasSize.height}  // 2048 - full canvas
      fill="white"
    />
    
    {/* Drawing content at full canvas resolution */}
    {lines.map((item, i) => {
      // ... existing drawing logic
    })}
  </Layer>
</Stage>
```

## 2. Teacher View Interface (DrawingModal.jsx)

### A. Canvas Size Logic for Teacher View
```javascript
const DrawingModal = ({ drawing, isOpen, onClose, onScoreChange, onMaxScoreChange }) => {
  // Canvas dimensions - use large canvas approach
  const actualCanvasWidth = drawing?.max_canvas_width || 1536;
  const actualCanvasHeight = drawing?.max_canvas_height || 2048;
  const viewportWidth = drawing?.canvas_width || 600;
  const viewportHeight = drawing?.canvas_height || 800;
  
  // Calculate initial zoom to fit viewport
  const initialZoomX = viewportWidth / actualCanvasWidth;   // 600/1536 = 0.39
  const initialZoomY = viewportHeight / actualCanvasHeight; // 800/2048 = 0.39
  const initialZoom = Math.min(initialZoomX, initialZoomY, 1.0);
  
  const [zoom, setZoom] = useState(initialZoom);
  const [canvasSize, setCanvasSize] = useState({
    width: actualCanvasWidth,
    height: actualCanvasHeight
  });
  
  // Two-finger gesture state
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const [lastTouchCenter, setLastTouchCenter] = useState(null);
  const [isTwoFingerGesture, setIsTwoFingerGesture] = useState(false);
};
```

### B. Two-Finger Gesture Functions (Same as Student)
```javascript
// Same getTouchDistance, getTouchCenter, handleTouchStart, 
// handleTouchMove, handleTouchEnd functions as student view
```

### C. Teacher View Stage Component
```javascript
<Stage
  ref={stageRef}
  width={viewportWidth}        // 600 - viewport size
  height={viewportHeight}      // 800 - viewport size
  scaleX={zoom}                // 0.39 - initial zoom
  scaleY={zoom}                // 0.39 - initial zoom
  onDragMove={handleDragMove}
  onDragEnd={() => constrainPanPosition(stageRef.current)}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  onWheel={(e) => {
    e.evt.preventDefault();
    const maxCanvasWidth = drawing?.max_canvas_width || 1536;
    const maxCanvasHeight = drawing?.max_canvas_height || 2048;
    const maxZoomX = maxCanvasWidth / canvasSize.width;
    const maxZoomY = maxCanvasHeight / canvasSize.height;
    const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0); // Cap at 1.0x
    
    const oldZoom = zoom;
    const newZoom = e.evt.deltaY > 0 
      ? Math.max(oldZoom * 0.9, 0.25) // Zoom out
      : Math.min(oldZoom * 1.1, maxZoom); // Zoom in
    
    setZoom(newZoom);
  }}
  style={{
    maxWidth: '100%',
    maxHeight: '100%'
  }}
>
  <Layer>
    {/* Background at full canvas size */}
    <Rect
      x={0}
      y={0}
      width={canvasSize.width}    // 1536 - full canvas
      height={canvasSize.height}  // 2048 - full canvas
      fill="white"
    />
    
    {/* Drawing content at full canvas resolution */}
    {drawingData.map((line, index) => {
      if (Array.isArray(line) && line.length > 0) {
        const points = line.flatMap(point => [point.x, point.y]);
        return (
          <Line
            key={index}
            points={points}
            stroke={line[0]?.color || '#000000'}
            strokeWidth={line[0]?.thickness || 2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
      }
      return null;
    })}
  </Layer>
</Stage>
```

## 3. Teacher View UI Enhancements

### A. Canvas Information Display
```javascript
{/* Canvas Info Display */}
<div className="canvas-info bg-gray-100 p-2 rounded mb-2">
  <div className="flex justify-between text-sm text-gray-600">
    <span>Canvas: {actualCanvasWidth}×{actualCanvasHeight}</span>
    <span>Viewport: {viewportWidth}×{viewportHeight}</span>
    <span>Zoom: {Math.round(zoom * 100)}%</span>
  </div>
</div>
```

### B. Enhanced Zoom Controls
```javascript
const handleZoomIn = () => {
  const newZoom = Math.min(zoom * 1.2, 1.0); // Max 100% (full canvas)
  setZoom(newZoom);
};

const handleZoomOut = () => {
  const newZoom = Math.max(zoom / 1.2, 0.25); // Min 25%
  setZoom(newZoom);
};

const handleFitToViewport = () => {
  const fitZoomX = viewportWidth / actualCanvasWidth;
  const fitZoomY = viewportHeight / actualCanvasHeight;
  const fitZoom = Math.min(fitZoomX, fitZoomY, 1.0);
  setZoom(fitZoom);
};

const handleFullCanvas = () => {
  setZoom(1.0); // Show full canvas at 100%
};
```

### C. Navigation Controls
```javascript
{/* Navigation Controls */}
<div className="flex space-x-2 mb-4">
  <Button onClick={handleFitToViewport} size="sm">
    Fit to Viewport
  </Button>
  <Button onClick={handleFullCanvas} size="sm">
    Full Canvas
  </Button>
  <Button onClick={handleZoomOut} size="sm">
    Zoom Out
  </Button>
  <Button onClick={handleZoomIn} size="sm">
    Zoom In
  </Button>
</div>
```

## 4. Performance Optimizations

### A. Canvas Rendering Optimization
```javascript
<Stage
  // ... other props
  perfectDrawEnabled={false}  // Better performance for large canvases
  listening={true}
  draggable={true}
>
```

### B. Memory Management
```javascript
// Add memory management for large canvases
useEffect(() => {
  const totalPixels = actualCanvasWidth * actualCanvasHeight;
  if (totalPixels > 3000000) { // > 3MP
    console.warn('Large canvas detected - consider reducing resolution for better performance');
  }
}, [actualCanvasWidth, actualCanvasHeight]);
```

### C. Gesture Smoothing
```javascript
// Add debouncing for smooth gestures
const [gestureTimeout, setGestureTimeout] = useState(null);

const smoothGesture = (callback) => {
  if (gestureTimeout) clearTimeout(gestureTimeout);
  setGestureTimeout(setTimeout(callback, 16)); // ~60fps
};
```

## 5. Mobile Optimizations

### A. Responsive Viewport Sizing
```javascript
const getResponsiveViewport = () => {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Mobile: smaller viewport
  if (screenWidth < 768) {
    return {
      width: Math.min(400, screenWidth - 40),
      height: Math.min(500, screenHeight - 200)
    };
  }
  
  // Desktop: larger viewport
  return {
    width: Math.min(800, screenWidth - 100),
    height: Math.min(1000, screenHeight - 200)
  };
};
```

### B. Touch Event Optimization
```javascript
// Prevent default browser gestures
const preventDefaultGestures = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

// Add to touch handlers
const handleTouchStart = (e) => {
  preventDefaultGestures(e);
  // ... rest of logic
};
```

## 6. Fullscreen Mode Fix

### A. Current Fullscreen Problem
The current fullscreen implementation is broken because it uses wrong canvas dimensions:

```javascript
// BROKEN - uses canvas size instead of viewport
const getResponsiveDimensions = () => {
  if (isFullscreen) {
    return {
      width: window.innerWidth - 20,  // Uses screen size
      height: window.innerHeight - 20 // Uses screen size
    };
  }
  // ... rest of logic
};
```

### B. Fixed Fullscreen Implementation
```javascript
const getResponsiveDimensions = () => {
  if (isFullscreen) {
    // In fullscreen, use viewport size, not canvas size
    const viewportWidth = question?.canvas_width || 600;
    const viewportHeight = question?.canvas_height || 800;
    
    // Calculate zoom to fit viewport in screen
    const screenWidth = window.innerWidth - 40; // Margin for UI
    const screenHeight = window.innerHeight - 40; // Margin for UI
    
    const zoomX = screenWidth / viewportWidth;
    const zoomY = screenHeight / viewportHeight;
    const fullscreenZoom = Math.min(zoomX, zoomY, 1.0); // Don't upscale
    
    return {
      width: viewportWidth,   // 600 - viewport size
      height: viewportHeight, // 800 - viewport size
      zoom: fullscreenZoom    // Calculated zoom to fit screen
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

### C. Stage Component with Fixed Fullscreen
```javascript
<Stage
  ref={stageRef}
  width={responsiveDimensions.width}   // Viewport width (600)
  height={responsiveDimensions.height} // Viewport height (800)
  scaleX={isFullscreen ? responsiveDimensions.zoom : zoom}
  scaleY={isFullscreen ? responsiveDimensions.zoom : zoom}
  // ... other props
>
  <Layer>
    {/* Background at full canvas size */}
    <Rect
      x={0}
      y={0}
      width={canvasSize.width}    // 1536 - full canvas
      height={canvasSize.height}  // 2048 - full canvas
      fill="white"
    />
    {/* ... drawing content */}
  </Layer>
</Stage>
```

### D. Fullscreen Zoom Management
```javascript
// Update zoom when entering/exiting fullscreen
useEffect(() => {
  if (isFullscreen) {
    const fullscreenZoom = responsiveDimensions.zoom;
    setZoom(fullscreenZoom);
  } else {
    // Reset to normal zoom when exiting fullscreen
    const normalZoom = calculateNormalZoom();
    setZoom(normalZoom);
  }
}, [isFullscreen, responsiveDimensions]);
```

## 7. Code Cleanup & Replacement Strategy

### A. Functions to Remove (Old/Broken)
```javascript
// REMOVE - Old broken functions in DrawingTestStudent.jsx
const getResponsiveDimensions = () => {
  if (isFullscreen) {
    return {
      width: window.innerWidth - 20,  // BROKEN - uses screen size
      height: window.innerHeight - 20 // BROKEN - uses screen size
    };
  }
  // ... old logic
};

// REMOVE - Old canvas size logic
useEffect(() => {
  if (question) {
    const canvasWidth = question.canvas_width || 600;  // BROKEN - uses viewport as canvas
    const canvasHeight = question.canvas_height || 800; // BROKEN - uses viewport as canvas
    setCanvasSize({ width: canvasWidth, height: canvasHeight });
  }
}, [question]);

// REMOVE - Old zoom limits
const maxZoomX = maxCanvasWidth / canvasSize.width;  // BROKEN calculation
const maxZoomY = maxCanvasHeight / canvasSize.height; // BROKEN calculation
const maxZoom = Math.min(maxZoomX, maxZoomY, 5); // BROKEN - allows upscaling
```

### B. Functions to Replace (New/Correct)
```javascript
// REPLACE WITH - New correct functions
const getResponsiveDimensions = () => {
  if (isFullscreen) {
    const viewportWidth = question?.canvas_width || 600;
    const viewportHeight = question?.canvas_height || 800;
    
    const screenWidth = window.innerWidth - 40;
    const screenHeight = window.innerHeight - 40;
    
    const zoomX = screenWidth / viewportWidth;
    const zoomY = screenHeight / viewportHeight;
    const fullscreenZoom = Math.min(zoomX, zoomY, 1.0);
    
    return {
      width: viewportWidth,
      height: viewportHeight,
      zoom: fullscreenZoom
    };
  }
  
  const viewportWidth = question?.canvas_width || 600;
  const viewportHeight = question?.canvas_height || 800;
  
  return {
    width: viewportWidth,
    height: viewportHeight,
    zoom: 1.0
  };
};

// REPLACE WITH - New canvas size logic
useEffect(() => {
  if (question) {
    const actualCanvasWidth = question.max_canvas_width || 1536;
    const actualCanvasHeight = question.max_canvas_height || 2048;
    const viewportWidth = question.canvas_width || 600;
    const viewportHeight = question.canvas_height || 800;
    
    setCanvasSize({
      width: actualCanvasWidth,
      height: actualCanvasHeight
    });
    
    const initialZoomX = viewportWidth / actualCanvasWidth;
    const initialZoomY = viewportHeight / actualCanvasHeight;
    const initialZoom = Math.min(initialZoomX, initialZoomY, 1.0);
    
    setZoom(initialZoom);
  }
}, [question]);

// REPLACE WITH - New zoom limits
const maxCanvasWidth = question?.max_canvas_width || 1536;
const maxCanvasHeight = question?.max_canvas_height || 2048;
const maxZoomX = maxCanvasWidth / canvasSize.width;
const maxZoomY = maxCanvasHeight / canvasSize.height;
const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0); // CORRECT - no upscaling
```

### C. Teacher View Cleanup
```javascript
// REMOVE - Old teacher view canvas logic
if (drawing.canvas_width && drawing.canvas_height) {
  setCanvasSize({
    width: drawing.canvas_width,    // BROKEN - uses viewport as canvas
    height: drawing.canvas_height   // BROKEN - uses viewport as canvas
  });
}

// REPLACE WITH - New teacher view logic
const actualCanvasWidth = drawing?.max_canvas_width || 1536;
const actualCanvasHeight = drawing?.max_canvas_height || 2048;
const viewportWidth = drawing?.canvas_width || 600;
const viewportHeight = drawing?.canvas_height || 800;

setCanvasSize({
  width: actualCanvasWidth,
  height: actualCanvasHeight
});

const initialZoomX = viewportWidth / actualCanvasWidth;
const initialZoomY = viewportHeight / actualCanvasHeight;
const initialZoom = Math.min(initialZoomX, initialZoomY, 1.0);
setZoom(initialZoom);
```

## 8. Implementation Checklist

### Phase 1: Core Implementation & Cleanup
- [ ] **Remove old broken getResponsiveDimensions function**
- [ ] **Replace with new correct getResponsiveDimensions function**
- [ ] **Remove old canvas size logic in useEffect**
- [ ] **Replace with new large canvas logic**
- [ ] **Remove old zoom limit calculations**
- [ ] **Replace with new zoom limits (no upscaling)**
- [ ] **Remove old teacher view canvas logic**
- [ ] **Replace with new teacher view logic**
- [ ] Add two-finger gesture support to student view
- [ ] Add two-finger gesture support to teacher view
- [ ] Test basic functionality

### Phase 2: UI Enhancements
- [ ] Add canvas information display
- [ ] Update zoom controls for both views
- [ ] Add navigation controls for teacher view
- [ ] Implement responsive viewport sizing

### Phase 3: Performance & Mobile
- [ ] Add performance optimizations
- [ ] Implement mobile-specific optimizations
- [ ] Add gesture smoothing
- [ ] Test on various devices

### Phase 4: Polish & Testing
- [ ] Add visual feedback for gestures
- [ ] Implement accessibility features
- [ ] Comprehensive testing
- [ ] Performance monitoring

## 7. Key Benefits

### Technical Benefits
1. **Better Quality**: No upscaling artifacts, only downscaling
2. **Better Performance**: Native resolution rendering
3. **Smooth Gestures**: Natural two-finger zoom and pan
4. **Professional Feel**: Behaves like industry-standard apps

### User Experience Benefits
1. **Crisp Details**: Sharp lines at all zoom levels
2. **Natural Navigation**: Intuitive touch gestures
3. **Better Mobile UX**: Optimized for touch devices
4. **Consistent Experience**: Same behavior for students and teachers

This implementation provides a complete solution for both student drawing and teacher viewing with large canvas support and two-finger gesture recognition.
