# Large Canvas Implementation Plan

## Current Architecture Analysis

### Current Canvas Approach
- **Base Canvas**: 600x800 pixels
- **Max Canvas**: 1536x2048 pixels  
- **Zoom Range**: 0.25x to 2.0x (to reach max canvas)
- **Problem**: Upscaling small canvas causes quality loss

### Proposed Large Canvas Approach
- **Base Canvas**: 1536x2048 pixels (keep original max size)
- **Viewport**: 600x800 pixels (initial zoom 0.5x)
- **Zoom Range**: 0.25x to 1.0x (downscaling only)
- **Benefit**: Native high resolution, better quality

## Implementation Changes Required

### 1. Frontend Changes

#### A. DrawingTestStudent.jsx
**Current Logic:**
```javascript
// Current - small canvas approach
const canvasWidth = question.canvas_width || 600;
const canvasHeight = question.canvas_height || 800;
setCanvasSize({ width: canvasWidth, height: canvasHeight });
```

**New Logic:**
```javascript
// New - large canvas approach
const baseCanvasWidth = question.max_canvas_width || 1536;
const baseCanvasHeight = question.max_canvas_height || 2048;
const viewportWidth = question.canvas_width || 600;
const viewportHeight = question.canvas_height || 800;

setCanvasSize({ 
  width: baseCanvasWidth, 
  height: baseCanvasHeight 
});

// Calculate initial zoom to fit viewport
const initialZoomX = viewportWidth / baseCanvasWidth;
const initialZoomY = viewportHeight / baseCanvasHeight;
const initialZoom = Math.min(initialZoomX, initialZoomY, 1.0);

setZoom(initialZoom);
```

**Key Changes:**
1. Use `max_canvas_width/height` as actual canvas size
2. Use `canvas_width/height` as viewport size
3. Calculate initial zoom to fit viewport
4. Update zoom limits (0.25x to 1.0x instead of 0.25x to 2.0x)

#### B. DrawingTestCreator.jsx
**Current Defaults:**
```javascript
canvas_width: 600,
canvas_height: 800,
max_canvas_width: 1536,
max_canvas_height: 2048
```

**New Defaults:**
```javascript
canvas_width: 600,        // Viewport width
canvas_height: 800,       // Viewport height  
max_canvas_width: 1536,   // Actual canvas width (keep original)
max_canvas_height: 2048,  // Actual canvas height (keep original)
```

**UI Changes:**
1. Rename "Base Width/Height" to "Viewport Width/Height"
2. Rename "Max Width/Height" to "Canvas Width/Height"
3. Add explanation: "Canvas is the actual drawing area, viewport is the initial display size"
4. Add recommended canvas sizes (2048x2560, 3072x4096, etc.)

#### C. DrawingModal.jsx
**Changes Needed:**
1. Update canvas size calculation to use large canvas
2. Adjust zoom limits for downscaling only
3. Update initial zoom calculation
4. Ensure drawing data scaling works correctly

#### D. useKonvaCanvas.js Hook
**New Functionality:**
```javascript
export const useKonvaCanvas = (containerRef, canvasSize, viewportSize) => {
  const [canvasSize, setCanvasSize] = useState(canvasSize);
  const [viewportSize, setViewportSize] = useState(viewportSize);
  const [initialZoom, setInitialZoom] = useState(1);
  
  const calculateInitialZoom = () => {
    const zoomX = viewportSize.width / canvasSize.width;
    const zoomY = viewportSize.height / canvasSize.height;
    return Math.min(zoomX, zoomY, 1.0);
  };
  
  // ... rest of hook logic
};
```

### 2. Backend Changes

#### A. Database Schema Updates
**Current Schema:**
```sql
canvas_width INTEGER DEFAULT 600,     -- Individual canvas width
canvas_height INTEGER DEFAULT 800,   -- Individual canvas height  
max_canvas_width INTEGER DEFAULT 1536,  -- Maximum canvas width
max_canvas_height INTEGER DEFAULT 2048, -- Maximum canvas height
```

**New Schema (Semantic Change):**
```sql
canvas_width INTEGER DEFAULT 600,     -- Viewport width (display size)
canvas_height INTEGER DEFAULT 800,   -- Viewport height (display size)
max_canvas_width INTEGER DEFAULT 1536,  -- Actual canvas width (drawing area)
max_canvas_height INTEGER DEFAULT 2048, -- Actual canvas height (drawing area)
```

**Migration Strategy:**
1. No schema changes needed - just semantic interpretation
2. Update default values in application code
3. Existing data remains compatible

#### B. API Functions Updates

**functions/save-test-with-assignments.js:**
- Update default values for new canvas sizes
- Add validation for canvas vs viewport relationships
- Ensure max_canvas >= canvas (viewport)

**functions/get-drawing-test.js:**
- No changes needed - just returns existing data
- Frontend interprets the data differently

**functions/submit-drawing-test.js:**
- No changes needed - drawing data format remains same
- Coordinates are already relative to actual canvas size

#### C. Data Validation
**New Validation Rules:**
```javascript
// Ensure canvas is larger than viewport
if (max_canvas_width < canvas_width || max_canvas_height < canvas_height) {
  throw new Error('Canvas size must be larger than viewport size');
}

// Ensure reasonable aspect ratios
const aspectRatio = max_canvas_width / max_canvas_height;
if (aspectRatio < 0.5 || aspectRatio > 2.0) {
  throw new Error('Canvas aspect ratio should be between 0.5 and 2.0');
}
```

### 3. Performance Optimizations

#### A. Canvas Rendering
**Konva Stage Configuration:**
```javascript
<Stage
  width={viewportWidth}           // Display size
  height={viewportHeight}         // Display size
  scaleX={zoom}                   // Zoom level
  scaleY={zoom}                   // Zoom level
  // Canvas content is drawn at full resolution
>
  <Layer>
    {/* Drawing content at full canvas resolution */}
  </Layer>
</Stage>
```

#### B. Memory Management
**Optimizations:**
1. Use `perfectDrawEnabled={false}` for better performance
2. Implement canvas virtualization for very large canvases
3. Add memory usage monitoring
4. Implement progressive loading for complex drawings

#### C. Mobile Performance
**Mobile-Specific Optimizations:**
1. Reduce max canvas size on mobile devices
2. Implement canvas quality scaling based on device
3. Add performance warnings for low-end devices

### 4. User Experience Improvements

#### A. Zoom Behavior
**New Zoom Logic:**
```javascript
// Zoom limits based on canvas vs viewport
const minZoom = 0.25; // Can zoom out to 25%
const maxZoom = 1.0;  // Can zoom in to 100% (full canvas)
const initialZoom = Math.min(viewportWidth / canvasWidth, viewportHeight / canvasHeight);
```

#### B. Pan Constraints
**Updated Pan Logic:**
```javascript
const constrainPanPosition = (stage) => {
  const scale = stage.scaleX();
  const canvasWidth = canvasSize.width * scale;
  const canvasHeight = canvasSize.height * scale;
  const viewportWidth = viewportSize.width;
  const viewportHeight = viewportSize.height;
  
  // Allow panning within reasonable bounds
  const maxPanX = Math.max(0, (canvasWidth - viewportWidth) * 0.5);
  const maxPanY = Math.max(0, (canvasHeight - viewportHeight) * 0.5);
  
  // ... constraint logic
};
```

#### C. Visual Indicators
**New UI Elements:**
1. Canvas resolution indicator
2. Zoom level display
3. Viewport vs canvas size info
4. Performance warnings

### 5. Migration Strategy

#### Phase 1: Backend Preparation
1. Update default values in database schema
2. Add validation for canvas/viewport relationships
3. Update API functions with new defaults
4. Test with existing data

#### Phase 2: Frontend Updates
1. Update DrawingTestCreator with new UI
2. Modify DrawingTestStudent canvas logic
3. Update DrawingModal for large canvas
4. Add new zoom/pan behavior

#### Phase 3: Testing & Optimization
1. Test on various devices and screen sizes
2. Optimize performance for large canvases
3. Add mobile-specific optimizations
4. User acceptance testing

#### Phase 4: Rollout
1. Deploy backend changes
2. Deploy frontend changes
3. Monitor performance metrics
4. Gather user feedback

### 6. Recommended Canvas Sizes

#### Standard Sizes
```javascript
const CANVAS_PRESETS = {
  'Small': { canvas: { width: 1024, height: 1280 }, viewport: { width: 400, height: 500 } },
  'Medium': { canvas: { width: 1536, height: 2048 }, viewport: { width: 600, height: 800 } },
  'Large': { canvas: { width: 1536, height: 2048 }, viewport: { width: 800, height: 1000 } },
  'Extra Large': { canvas: { width: 1536, height: 2048 }, viewport: { width: 1200, height: 1600 } }
};
```

#### Mobile Optimized
```javascript
const MOBILE_CANVAS_PRESETS = {
  'Mobile Small': { canvas: { width: 1024, height: 1280 }, viewport: { width: 300, height: 400 } },
  'Mobile Medium': { canvas: { width: 1536, height: 2048 }, viewport: { width: 400, height: 600 } }
};
```

### 7. Benefits of This Approach

#### Technical Benefits
1. **Better Quality**: No upscaling artifacts
2. **Better Performance**: Native resolution rendering
3. **Smoother Zoom**: Downscaling is more efficient
4. **Future-Proof**: Easy to add higher resolutions

#### User Experience Benefits
1. **Crisp Details**: Sharp lines at all zoom levels
2. **Natural Feel**: Behaves like professional drawing apps
3. **Better Mobile UX**: Optimized for touch devices
4. **Professional Quality**: Matches industry standards

#### Development Benefits
1. **Cleaner Code**: Simpler zoom/pan logic
2. **Better Testing**: More predictable behavior
3. **Easier Maintenance**: Less complex scaling code
4. **Scalable**: Easy to add new canvas sizes

### 8. Implementation Timeline

#### Week 1: Backend Changes
- Update database defaults
- Modify API functions
- Add validation logic
- Test with existing data

#### Week 2: Frontend Core Changes
- Update DrawingTestStudent
- Modify DrawingTestCreator
- Update DrawingModal
- Test basic functionality

#### Week 3: UI/UX Improvements
- Add new zoom/pan behavior
- Implement canvas presets
- Add performance optimizations
- Mobile testing

#### Week 4: Testing & Deployment
- Comprehensive testing
- Performance optimization
- User acceptance testing
- Production deployment

This implementation plan provides a complete roadmap for transitioning to the large canvas approach while maintaining backward compatibility and improving overall user experience.
