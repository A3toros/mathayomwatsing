import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotification } from '../ui/Notification';

// Drawing canvas component with zoom functionality
const DrawingCanvas = ({ 
  width, 
  height, 
  lines, 
  onDrawingChange, 
  currentTool, 
  currentColor, 
  currentThickness,
  zoom,
  onZoomChange,
  isPanning,
  isFullscreen,
  constrainPanPosition,
  handleWheel,
  stageRef,
  setIsPanning,
  responsiveDimensions,
  canvasSize,
  question
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState([]);
  const [currentShape, setCurrentShape] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const containerRef = useRef(null);
  const [fitZoom, setFitZoom] = useState(0.25);

  useEffect(() => {
    const computeFit = () => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth || 1;
      const ch = el.clientHeight || 1;
      const fit = Math.min(cw / (canvasSize.width || 1), ch / (canvasSize.height || 1));
      setFitZoom(Math.min(fit, 1.0));
    };
    computeFit();
    window.addEventListener('resize', computeFit);
    return () => window.removeEventListener('resize', computeFit);
  }, [canvasSize.width, canvasSize.height, isFullscreen]);

  const handleMouseDown = (e) => {
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    
    if (currentTool === 'pan') {
      // Pan handling is now done by Konva's draggable property
      return;
    }
    
    setIsDrawing(true);
    // Adjust coordinates for zoom level
    const adjustedPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY()
    };
    
    setStartPoint(adjustedPos);
    
    if (currentTool === 'pencil') {
      setCurrentLine([{ x: adjustedPos.x, y: adjustedPos.y, color: currentColor, thickness: currentThickness }]);
    } else if (['line', 'rectangle', 'circle'].includes(currentTool)) {
      setCurrentShape({
        type: currentTool,
        startX: adjustedPos.x,
        startY: adjustedPos.y,
        endX: adjustedPos.x,
        endY: adjustedPos.y,
        color: currentColor,
        thickness: currentThickness
      });
    }
  };

  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    const point = stage.getPointerPosition();
    
    if (currentTool === 'pan') {
      // Pan handling is now done by Konva's draggable property
      return;
    }
    
    if (!isDrawing) return;
    
    // Adjust coordinates for zoom level
    const adjustedPoint = {
      x: (point.x - stage.x()) / stage.scaleX(),
      y: (point.y - stage.y()) / stage.scaleY()
    };
    
    if (currentTool === 'pencil') {
      const newLine = [...currentLine, { x: adjustedPoint.x, y: adjustedPoint.y, color: currentColor, thickness: currentThickness }];
      setCurrentLine(newLine);
    } else if (['line', 'rectangle', 'circle'].includes(currentTool) && currentShape) {
      setCurrentShape({
        ...currentShape,
        endX: adjustedPoint.x,
        endY: adjustedPoint.y
      });
    }
  };

  const handleMouseUp = () => {
    if (currentTool === 'pan') {
      // Pan handling is now done by Konva's draggable property
      return;
    }
    
    if (isDrawing) {
      if (currentTool === 'pencil') {
        const newLines = [...lines, currentLine];
        onDrawingChange(newLines);
        setCurrentLine([]);
      } else if (['line', 'rectangle', 'circle'].includes(currentTool) && currentShape) {
        const newLines = [...lines, currentShape];
        onDrawingChange(newLines);
        setCurrentShape(null);
      }
      setIsDrawing(false);
      setStartPoint(null);
    }
  };

  // Two-finger gesture state
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const [lastTouchCenter, setLastTouchCenter] = useState(null);
  const [isTwoFingerGesture, setIsTwoFingerGesture] = useState(false);
  const [gestureType, setGestureType] = useState(null); // 'zoom' | 'pan' | 'zoom+pan' | null
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  
  // Animation throttling
  let animationId = null;
  
  // Device-adaptive thresholds
  const getDevicePixelRatio = () => window.devicePixelRatio || 1;
  const isHighDPI = getDevicePixelRatio() > 1.5;
  
  const GESTURE_THRESHOLDS = {
    scaleDelta: isHighDPI ? 0.06 : 0.08, // Require larger change to classify as zoom
    centerDelta: isHighDPI ? 8 : 12,     // Lower pan threshold for responsiveness
    minTouchDistance: 10,                // Minimum distance to register gesture
    combinedGestureThreshold: 0.03       // Allow combined gesture detection
  };
  
  // Comprehensive cleanup function
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

  // Touch event handlers for mobile devices with two-finger gesture support
  const handleTouchStart = (e) => {
    e.evt.preventDefault(); // Prevent default touch behavior
    const touches = e.evt.touches;
    
    if (touches.length === 2) {
      // Two-finger gesture - start zoom/pan
      setIsGestureActive(true);
      setGestureType(null); // Will be determined in touch move
      setLastTouchDistance(getTouchDistance(touches));
      setLastTouchCenter(getTouchCenter(touches));
      setIsDrawing(false); // Stop any drawing
    } else if (touches.length === 1) {
      // Single finger - normal drawing
      setIsGestureActive(false);
      setGestureType(null);
      handleMouseDown(e);
    }
  };

  const handleTouchMove = (e) => {
    e.evt.preventDefault(); // Prevent default touch behavior
    const touches = e.evt.touches;
    
    if (touches.length === 2 && isGestureActive) {
      // Two-finger gesture - handle zoom and pan
      const stage = stageRef.current;
      const currentDistance = getTouchDistance(touches);
      const currentCenter = getTouchCenter(touches);
      
      if (lastTouchDistance && lastTouchCenter && stage && currentDistance > GESTURE_THRESHOLDS.minTouchDistance) {
        // Detect if user is zooming or panning (percentage and distance thresholds)
        const scaleDelta = Math.abs(currentDistance / lastTouchDistance - 1);
        const centerDelta = Math.sqrt(
          Math.pow(currentCenter.x - lastTouchCenter.x, 2) + 
          Math.pow(currentCenter.y - lastTouchCenter.y, 2)
        );

        // Compute common values
        const oldScale = stage.scaleX();
        const scaleChange = currentDistance / lastTouchDistance;
        const proposedScale = oldScale * scaleChange;
        const maxCanvasWidth = question?.max_canvas_width || 1536;
        const maxCanvasHeight = question?.max_canvas_height || 2048;
        const maxZoomX = maxCanvasWidth / canvasSize.width;
        const maxZoomY = maxCanvasHeight / canvasSize.height;
        const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0);
        const clampedScale = Math.max(0.25, Math.min(maxZoom, proposedScale));

        const deltaX = currentCenter.x - lastTouchCenter.x;
        const deltaY = currentCenter.y - lastTouchCenter.y;
        const currentPos = stage.position();
        let newPos = { x: currentPos.x, y: currentPos.y };

        // If panning allowed at this scale
        const minZoom = 0.25;
        const currentScale = stage.scaleX();
        if (currentScale <= minZoom) {
          const stageWidth = responsiveDimensions.width;
          const stageHeight = responsiveDimensions.height;
          const canvasWidth = canvasSize.width * currentScale;
          const canvasHeight = canvasSize.height * currentScale;
          newPos = {
            x: (stageWidth - canvasWidth) / 2,
            y: (stageHeight - canvasHeight) / 2,
          };
        } else {
          newPos = {
            x: currentPos.x + deltaX,
            y: currentPos.y + deltaY,
          };
        }

        // Decide gesture type(s)
        const doZoom = scaleDelta > GESTURE_THRESHOLDS.scaleDelta;
        const doPan = centerDelta > GESTURE_THRESHOLDS.centerDelta;

        // Apply updates in a single animation frame
        const updateStage = () => {
          if (doZoom) {
            // Zoom towards finger center
            const zoomPoint = currentCenter;
            const mousePointTo = {
              x: (zoomPoint.x - stage.x()) / oldScale,
              y: (zoomPoint.y - stage.y()) / oldScale,
            };
            newPos = {
              x: zoomPoint.x - mousePointTo.x * clampedScale,
              y: zoomPoint.y - mousePointTo.y * clampedScale,
            };
            stage.scale({ x: clampedScale, y: clampedScale });
            onZoomChange(clampedScale);
          }
          if (doPan) {
            stage.position(newPos);
          }
          stage.batchDraw();
          animationId = null;
        };

        if (!animationId) {
          animationId = requestAnimationFrame(updateStage);
        }

        // Update gesture state
        if (doZoom && doPan) {
          setGestureType('zoom+pan');
          setIsZooming(true);
          setIsPanning(true);
        } else if (doZoom) {
          setGestureType('zoom');
          setIsZooming(true);
        } else if (doPan) {
          setGestureType('pan');
          setIsPanning(true);
        }
        
        console.log('🎨 Gesture', { scaleDelta: scaleDelta.toFixed(3), centerDelta: centerDelta.toFixed(1), doZoom, doPan, clampedScale: clampedScale.toFixed(2), newPos });
      }
      
      setLastTouchDistance(currentDistance);
      setLastTouchCenter(currentCenter);
    } else if (touches.length === 1 && !isGestureActive) {
      // Single finger - normal drawing
      handleMouseMove(e);
    }
  };

  const handleTouchEnd = (e) => {
    e.evt.preventDefault(); // Prevent default touch behavior
    const touches = e.evt.touches;
    
    if (touches.length === 0) {
      // All fingers lifted - save line first, then clean reset
      handleMouseUp(); // Save the line first
      resetGestureState(); // Then reset gesture state
      setIsZooming(false);
      setIsPanning(false);
    } else if (touches.length === 1) {
      // One finger remaining - switch to single finger mode
      setIsGestureActive(false);
      setGestureType(null);
      setLastTouchDistance(null);
      setLastTouchCenter(null);
      setIsZooming(false);
      setIsPanning(false);
      // Continue with single finger drawing if needed
    }
    // If still 2+ fingers, continue with gesture
  };



  // Calculate responsive dimensions
  const getResponsiveDimensions = () => {
    if (isFullscreen) {
      // In fullscreen, use almost the entire screen
      return {
        width: window.innerWidth - 20, // Small margin
        height: window.innerHeight - 20 // Small margin
      };
    }
    
    const containerWidth = window.innerWidth - 16; // Minimal padding
    const containerHeight = window.innerHeight - 150; // Space for UI elements
    
    const maxWidth = Math.min(width, containerWidth);
    const maxHeight = Math.min(height, containerHeight);
    
    return {
      width: Math.max(250, maxWidth), // Minimum 250px width
      height: Math.max(300, maxHeight) // Minimum 300px height
    };
  };

  return (
    <div className="relative w-full flex justify-center">
      <div className="w-full max-w-full flex justify-center">
        <div 
          className="relative"
          style={{
            border: isFullscreen && (responsiveDimensions.width < window.innerWidth - 40 || responsiveDimensions.height < window.innerHeight - 40) 
              ? '2px solid #000000' 
              : 'none',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
            <div ref={containerRef} className="w-full h-full">
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
                onWheel={handleWheel || (() => {})}
              onDragStart={() => {
                console.log('🎯 Drag started');
                if (currentTool === 'pan') {
                  setIsPanning(true);
                }
              }}
              onDragEnd={() => {
                console.log('🎯 Drag ended');
                if (currentTool === 'pan') {
                  setIsPanning(false);
                  // Only constrain if the canvas is way out of bounds
                  if (constrainPanPosition) {
                    const stage = stageRef.current;
                    const el = containerRef.current;
                    const stageWidth = (el?.clientWidth) || responsiveDimensions.width;
                    const stageHeight = (el?.clientHeight) || responsiveDimensions.height;
                    const canvasWidth = canvasSize.width * stage.scaleX();
                    const canvasHeight = canvasSize.height * stage.scaleY();
                    
                    // Only constrain if canvas is completely outside view
                    const currentX = stage.x();
                    const currentY = stage.y();
                    
                    if (currentX > stageWidth || currentX < -canvasWidth || 
                        currentY > stageHeight || currentY < -canvasHeight) {
                      constrainPanPosition(stage);
                    }
                  }
                }
              }}
                draggable={currentTool === 'pan' && zoom > 0.25}
                className={`border border-gray-300 rounded-lg shadow-sm ${
                  currentTool === 'pan' ? 'cursor-grab' : 
                  isPanning ? 'cursor-grabbing' : 
                  'cursor-crosshair'
                }`}
                style={{
                  maxWidth: '100%',
                  height: 'auto'
                }}
                onLoad={() => {
                  console.log('�� DrawingTestStudent - Stage loaded with dimensions:', responsiveDimensions.width, 'x', responsiveDimensions.height);
                  console.log('�� DrawingTestStudent - Canvas size:', canvasSize.width, 'x', canvasSize.height);
                  console.log('�� DrawingTestStudent - Current zoom level:', zoom);
                  console.log('�� DrawingTestStudent - Effective display size:', Math.round(canvasSize.width * zoom), 'x', Math.round(canvasSize.height * zoom));
                  console.log('�� DrawingTestStudent - Total pixels displayed:', Math.round(canvasSize.width * zoom * canvasSize.height * zoom));
                }}
              >
                <Layer>
                  {/* Background */}
                  <Rect
                    x={0}
                    y={0}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    fill="white"
                  />
                  
                  {/* Existing drawings */}
                  {lines.map((item, i) => {
                    if (Array.isArray(item)) {
                      // It's a line (pencil drawing)
                      return (
                        <Line
                          key={i}
                          points={item.flatMap(p => [p.x, p.y])}
                          stroke={item[0]?.color || '#000000'}
                          strokeWidth={item[0]?.thickness || 2}
                          tension={0.5}
                          lineCap="round"
                          lineJoin="round"
                        />
                      );
                    } else if (item.type === 'line') {
                      // It's a line shape
                      return (
                        <Line
                          key={i}
                          points={[item.startX, item.startY, item.endX, item.endY]}
                          stroke={item.color}
                          strokeWidth={item.thickness}
                          lineCap="round"
                        />
                      );
                    } else if (item.type === 'rectangle') {
                      // It's a rectangle
                      const width = Math.abs(item.endX - item.startX);
                      const height = Math.abs(item.endY - item.startY);
                      const x = Math.min(item.startX, item.endX);
                      const y = Math.min(item.startY, item.endY);
                      return (
                        <Rect
                          key={i}
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          stroke={item.color}
                          strokeWidth={item.thickness}
                          fill="transparent"
                        />
                      );
                    } else if (item.type === 'circle') {
                      // It's a circle
                      const radius = Math.sqrt(
                        Math.pow(item.endX - item.startX, 2) + Math.pow(item.endY - item.startY, 2)
                      ) / 2;
                      const centerX = (item.startX + item.endX) / 2;
                      const centerY = (item.startY + item.endY) / 2;
                      return (
                        <Circle
                          key={i}
                          x={centerX}
                          y={centerY}
                          radius={radius}
                          stroke={item.color}
                          strokeWidth={item.thickness}
                          fill="transparent"
                        />
                      );
                    }
                    return null;
                  })}
                  
                  {/* Current drawing being created */}
                  {currentTool === 'pencil' && (
                    <Line
                      points={currentLine.flatMap(p => [p.x, p.y])}
                      stroke={currentColor}
                      strokeWidth={currentThickness}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                    />
                  )}
                  
                  {currentShape && currentShape.type === 'line' && (
                    <Line
                      points={[currentShape.startX, currentShape.startY, currentShape.endX, currentShape.endY]}
                      stroke={currentShape.color}
                      strokeWidth={currentShape.thickness}
                      lineCap="round"
                    />
                  )}
                  
                  {currentShape && currentShape.type === 'rectangle' && (
                    <Rect
                      x={Math.min(currentShape.startX, currentShape.endX)}
                      y={Math.min(currentShape.startY, currentShape.endY)}
                      width={Math.abs(currentShape.endX - currentShape.startX)}
                      height={Math.abs(currentShape.endY - currentShape.startY)}
                      stroke={currentShape.color}
                      strokeWidth={currentShape.thickness}
                      fill="transparent"
                    />
                  )}
                  
                  {currentShape && currentShape.type === 'circle' && (
                    <Circle
                      x={(currentShape.startX + currentShape.endX) / 2}
                      y={(currentShape.startY + currentShape.endY) / 2}
                      radius={Math.sqrt(
                        Math.pow(currentShape.endX - currentShape.startX, 2) + 
                        Math.pow(currentShape.endY - currentShape.startY, 2)
                      ) / 2}
                      stroke={currentShape.color}
                      strokeWidth={currentShape.thickness}
                      fill="transparent"
                    />
                  )}
                </Layer>
              </Stage>
            </div>
            
            {/* Zoom controls overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <button
                onClick={() => {
                  const stage = stageRef.current;
                  const oldScale = stage.scaleX();
                  const maxCanvasWidth = question?.max_canvas_width || 1536;
                  const maxCanvasHeight = question?.max_canvas_height || 2048;
                  const maxZoomX = maxCanvasWidth / canvasSize.width;
                  const maxZoomY = maxCanvasHeight / canvasSize.height;
                  const maxZoom = Math.min(maxZoomX, maxZoomY, 5);
                  
                  const newScale = Math.min(maxZoom, stage.scaleX() * 1.2);
                  stage.scale({ x: newScale, y: newScale });
                  stage.batchDraw();
                  
                  console.log('�� DrawingTestStudent - Zoom In button:', oldScale.toFixed(2), '->', newScale.toFixed(2));
                  console.log('�� DrawingTestStudent - New effective size:', Math.round(canvasSize.width * newScale), 'x', Math.round(canvasSize.height * newScale));
                  console.log('�� DrawingTestStudent - New resolution:', Math.round(canvasSize.width * newScale * canvasSize.height * newScale), 'pixels');
                  
                  onZoomChange(newScale);
                  // zoomInitializedRef.current = true; // Mark that user has interacted with zoom
                }}
                className="w-8 h-8 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => {
                  const stage = stageRef.current;
                  const oldScale = stage.scaleX();
                  const newScale = Math.max(0.25, stage.scaleX() * 0.8); // Minimum 25% zoom
                  stage.scale({ x: newScale, y: newScale });
                  stage.batchDraw();
                  
                  console.log('�� DrawingTestStudent - Zoom Out button:', oldScale.toFixed(2), '->', newScale.toFixed(2));
                  console.log('�� DrawingTestStudent - New effective size:', Math.round(canvasSize.width * newScale), 'x', Math.round(canvasSize.height * newScale));
                  console.log('�� DrawingTestStudent - New resolution:', Math.round(canvasSize.width * newScale * canvasSize.height * newScale), 'pixels');
                  
                  onZoomChange(newScale);
                  // zoomInitializedRef.current = true; // Mark that user has interacted with zoom
                }}
                className="w-8 h-8 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold"
                title="Zoom Out"
              >
                −
              </button>
              <button
                onClick={() => {
                  const stage = stageRef.current;
                  const oldScale = stage.scaleX();
                  stage.scale({ x: 1, y: 1 });
                  stage.position({ x: 0, y: 0 });
                  stage.batchDraw();
                  // zoomInitializedRef.current = true; // Mark that user has interacted with zoom
                  
                  console.log('�� DrawingTestStudent - Reset zoom:', oldScale.toFixed(2), '-> 1.00');
                  console.log('�� DrawingTestStudent - Reset effective size:', canvasSize.width, 'x', canvasSize.height);
                  console.log('�� DrawingTestStudent - Reset resolution:', canvasSize.width * canvasSize.height, 'pixels');
                  
                  onZoomChange(1);
                }}
                className="w-8 h-8 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center justify-center text-gray-600 text-xs"
                title="Reset Zoom"
              >
                1:1
              </button>
            </div>
            
            {/* Zoom level indicator */}
            <div className="absolute bottom-2 left-2 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-600 shadow-sm">
              {Math.round(zoom * 100)}%
            </div>
        </div>
      </div>
    </div>
  );
};

// Simple rich text renderer
const SimpleRichTextRenderer = ({ content }) => {
  if (!content) {
    return <div className="text-gray-500 italic">No instructions provided</div>;
  }
  
  const renderLexicalNode = (node) => {
    if (!node) return '';
    
    
    // Handle text nodes
    if (node.type === 'text') {
      let text = node.text || '';
      
      // Apply formatting
      if (node.format) {
        if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
        if (node.format & 2) text = `<em>${text}</em>`; // Italic
        if (node.format & 8) text = `<u>${text}</u>`; // Underline
        if (node.format & 16) text = `<s>${text}</s>`; // Strikethrough
      }
      
      // Apply color from style attribute (Lexical uses style string)
      if (node.style) {
        const colorMatch = node.style.match(/color:\s*([^;]+)/);
        if (colorMatch) {
          text = `<span style="color: ${colorMatch[1].trim()}">${text}</span>`;
        }
      }
      
      // Apply color from textStyle (alternative Lexical format)
      if (node.textStyle) {
        const colorMatch = node.textStyle.match(/color:\s*([^;]+)/);
        if (colorMatch) {
          text = `<span style="color: ${colorMatch[1].trim()}">${text}</span>`;
        }
      }
      
      return text;
    }
    
    // Handle paragraph nodes
    if (node.type === 'paragraph') {
      const children = node.children ? node.children.map(renderLexicalNode).join('') : '';
      
      // Check for alignment in format string (Lexical format)
      let alignment = 'text-left';
      if (node.format) {
        if (node.format === 'center') alignment = 'text-center';
        else if (node.format === 'right') alignment = 'text-right';
        else if (node.format === 'left') alignment = 'text-left';
      }
      
      return `<p class="${alignment}">${children}</p>`;
    }
    
    // Handle heading nodes
    if (node.type === 'heading') {
      const level = node.tag || 'h1';
      const children = node.children ? node.children.map(renderLexicalNode).join('') : '';
      return `<${level}>${children}</${level}>`;
    }
    
    // Handle list nodes
    if (node.type === 'list') {
      const listTag = node.listType === 'bullet' ? 'ul' : 'ol';
      
      const children = node.children ? node.children.map(child => {
        if (child.type === 'listitem') {
          const itemContent = child.children ? child.children.map(renderLexicalNode).join('') : '';
          
          // Handle list item alignment and combine with base styles
          let styles = 'margin: 4px 0; display: list-item;';
          if (child.format) {
            if (child.format === 'center') styles += ' text-align: center;';
            else if (child.format === 'right') styles += ' text-align: right;';
            else if (child.format === 'left') styles += ' text-align: left;';
          }
          
          return `<li style="${styles}">${itemContent}</li>`;
        }
        return '';
      }).join('') : '';
      
      return `<${listTag} style="margin: 8px 0; padding-left: 20px; list-style-type: ${node.listType === 'bullet' ? 'disc' : 'decimal'}; display: block;">${children}</${listTag}>`;
    }
    
    // Handle other nodes
    if (node.children) {
      return node.children.map(renderLexicalNode).join('');
    }
    
    return '';
  };
  
  // Handle different content types
  let displayContent = content;
  
  // If it's a JSON string, try to parse it
  if (typeof content === 'string' && content.startsWith('{')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.text) {
        displayContent = parsed.text;
      } else if (parsed.content) {
        displayContent = parsed.content;
      } else if (parsed.root && parsed.root.children) {
        // Handle Lexical JSON format with proper rendering
        displayContent = parsed.root.children.map(renderLexicalNode).join('');
      }
    } catch (e) {
      // If parsing fails, use the original content
      console.log('Failed to parse Lexical content:', e);
    }
  }
  
  return (
    <div 
      className="max-w-none rich-text-content"
      style={{
        lineHeight: '1.6',
        fontSize: '14px'
      }}
      dangerouslySetInnerHTML={{ __html: displayContent }} 
    />
  );
};

const DrawingTestStudent = ({ 
  question, 
  questionIndex, 
  studentAnswer, 
  onAnswerChange, 
  mode, 
  testId, 
  testType 
}) => {
  const { showNotification } = useNotification();

  // State management
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawing state
  const [currentTool, setCurrentTool] = useState('pencil');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentThickness, setCurrentThickness] = useState(2);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [responsiveDimensions, setResponsiveDimensions] = useState({ width: 600, height: 800 });
  const zoomInitializedRef = useRef(false);
  const [fitZoom, setFitZoom] = useState(0.25);

  // Colors palette
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000',
    '#808080', '#FFC0CB', '#A52A2A', '#000080'
  ];

  // Check screen size for pan tool
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Initialize question data with large canvas approach
  useEffect(() => {
    if (question) {
      // Use max_canvas as actual canvas size, canvas as viewport size
      const actualCanvasWidth = question.max_canvas_width || 1536;
      const actualCanvasHeight = question.max_canvas_height || 2048;
      const viewportWidth = question.canvas_width || 600;
      const viewportHeight = question.canvas_height || 800;
      
      setCanvasSize({
        width: actualCanvasWidth,   // 1536 - actual canvas
        height: actualCanvasHeight  // 2048 - actual canvas
      });
      
      // Only set initial zoom if it hasn't been initialized yet
      if (!zoomInitializedRef.current) {
        const initialZoom = 1.0; // Start at 100% zoom (full resolution view)
        setZoom(initialZoom);
        zoomInitializedRef.current = true;

        // Optionally center the canvas within the viewport
        const offsetX = (viewportWidth - actualCanvasWidth * initialZoom) / 2;
        const offsetY = (viewportHeight - actualCanvasHeight * initialZoom) / 2;
        if (!isNaN(offsetX) && !isNaN(offsetY) && stageRef.current) {
          const newPos = { x: offsetX, y: offsetY };
          stageRef.current.position(newPos);
          stageRef.current.batchDraw();
        }

        console.log('🎨 DrawingTestStudent - Canvas size set:', actualCanvasWidth, 'x', actualCanvasHeight);
        console.log('🎨 DrawingTestStudent - Viewport size:', viewportWidth, 'x', viewportHeight);
        console.log('🎨 DrawingTestStudent - Initial zoom:', initialZoom.toFixed(2));
        console.log('🎨 DrawingTestStudent - Image resolution:', actualCanvasWidth * actualCanvasHeight, 'pixels');
        console.log('🎨 DrawingTestStudent - Aspect ratio:', (actualCanvasWidth / actualCanvasHeight).toFixed(2));
      } else {
        console.log('🎨 DrawingTestStudent - Preserving user zoom:', zoom.toFixed(2));
      }
      
      // Load existing drawing from student answer
      if (studentAnswer && typeof studentAnswer === 'string') {
        try {
          const savedLines = JSON.parse(studentAnswer);
          setLines(savedLines);
        } catch (e) {
          console.log('No valid drawing data found');
        }
      }
      
      setIsLoading(false);
    }
  }, [question, studentAnswer]);

  // Compute dynamic fit zoom from the actual container (normal/fullscreen)
  useEffect(() => {
    const computeFit = () => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth || 1;
      const ch = el.clientHeight || 1;
      const fit = Math.min(cw / (canvasSize.width || 1), ch / (canvasSize.height || 1));
      setFitZoom(Math.min(fit, 1.0));
    };
    computeFit();
    window.addEventListener('resize', computeFit);
    return () => window.removeEventListener('resize', computeFit);
  }, [canvasSize.width, canvasSize.height, isFullscreen]);

  // Drawing functions
  const handleDrawingChange = (newLines) => {
    setLines(newLines);
    // Save the drawing data as the student answer in the old format
    // The newLines array already contains line segments (arrays of points)
    // We just need to ensure the structure is correct for the old format
    onAnswerChange(question.question_id, JSON.stringify(newLines));
  };

  const clearCanvas = () => {
    setLines([]);
    onAnswerChange(question.question_id, '');
  };


  // Calculate responsive dimensions for the canvas with large canvas approach
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

  // Update responsive dimensions when needed
  useEffect(() => {
    const updateDimensions = () => {
      setResponsiveDimensions(getResponsiveDimensions());
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isFullscreen, canvasSize]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    
    // Calculate maximum zoom based on large canvas approach
    const maxCanvasWidth = question?.max_canvas_width || 1536;
    const maxCanvasHeight = question?.max_canvas_height || 2048;
    const maxZoomX = maxCanvasWidth / canvasSize.width;
    const maxZoomY = maxCanvasHeight / canvasSize.height;
    const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0); // Cap at 1.0x (no upscaling)
    
    const clampedScale = Math.max(fitZoom, Math.min(maxZoom, newScale));
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    // If at fit zoom, center within container
    if (clampedScale <= fitZoom && containerRef.current) {
      const cw = containerRef.current.clientWidth || 1;
      const ch = containerRef.current.clientHeight || 1;
      newPos.x = (cw - canvasSize.width * clampedScale) / 2;
      newPos.y = (ch - canvasSize.height * clampedScale) / 2;
    }
    
    stage.scale({ x: clampedScale, y: clampedScale });
    stage.position(newPos);
    stage.batchDraw();
    
    console.log('🎨 DrawingTestStudent - Wheel zoom:', oldScale.toFixed(2), '->', clampedScale.toFixed(2));
    console.log('🎨 DrawingTestStudent - New effective size:', Math.round(canvasSize.width * clampedScale), 'x', Math.round(canvasSize.height * clampedScale));
    console.log('🎨 DrawingTestStudent - New resolution:', Math.round(canvasSize.width * clampedScale * canvasSize.height * clampedScale), 'pixels');
    
    setZoom(clampedScale);
    zoomInitializedRef.current = true; // Mark that user has interacted with zoom
  };

  // Constrain pan position to keep canvas visible
        const constrainPanPosition = (stage) => {
          const scale = stage.scaleX();
          const el = containerRef.current;
          const stageWidth = (el?.clientWidth) || responsiveDimensions.width;
          const stageHeight = (el?.clientHeight) || responsiveDimensions.height;
          const canvasWidth = canvasSize.width * scale;
          const canvasHeight = canvasSize.height * scale;
          
          // At maximum zoom out (fit), NO dragging allowed - always center
          if (scale <= fitZoom) {
            const centerX = (stageWidth - canvasWidth) / 2;
            const centerY = (stageHeight - canvasHeight) / 2;
            stage.position({ x: centerX, y: centerY });
            stage.batchDraw();
            return;
          }
          
          // If canvas is smaller than or equal to stage, center it (no dragging)
          if (canvasWidth <= stageWidth && canvasHeight <= stageHeight) {
            const centerX = (stageWidth - canvasWidth) / 2;
            const centerY = (stageHeight - canvasHeight) / 2;
            stage.position({ x: centerX, y: centerY });
            stage.batchDraw();
            return;
          }
          
          // Canvas is larger than stage, allow panning but keep some canvas visible
          const maxX = Math.max(0, canvasWidth - stageWidth);
          const maxY = Math.max(0, canvasHeight - stageHeight);
          const minX = -maxX;
          const minY = -maxY;
          
          const currentX = stage.x();
          const currentY = stage.y();
          
          const constrainedX = Math.max(minX, Math.min(maxX, currentX));
          const constrainedY = Math.max(minY, Math.min(maxY, currentY));
          
          if (constrainedX !== currentX || constrainedY !== currentY) {
            stage.position({ x: constrainedX, y: constrainedY });
            stage.batchDraw();
          }
        };


  // Fullscreen functionality
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

  // Listen for fullscreen changes
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
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (stageRef.current) stageRef.current.stop();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">No drawing question data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`drawing-question max-w-6xl mx-auto p-1 sm:p-2 ${isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-y-auto' : ''}`}>
      {/* Question Header - hidden in fullscreen */}
      {!isFullscreen && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Question {questionIndex + 1}
          </h3>
        </div>
      )}

      {/* Task Content - hidden in fullscreen */}
      {!isFullscreen && question.question_json && question.question_json.trim() && (
        <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Task:</h4>
          <div className="text-gray-700">
            <SimpleRichTextRenderer content={question.question_json} />
          </div>
        </div>
      )}

      {/* Drawing Tools - hidden in fullscreen */}
      {!isFullscreen && (
        <Card className="p-1 sm:p-2 mb-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Tool Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Tool:</label>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentTool('pencil')}
                className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border rounded-lg transition-colors ${
                  currentTool === 'pencil' 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title="Pencil (Freehand drawing)"
              >
                ✏️
              </button>
              <button
                onClick={() => setCurrentTool('line')}
                className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border rounded-lg transition-colors ${
                  currentTool === 'line' 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title="Line"
              >
                📏
              </button>
              <button
                onClick={() => setCurrentTool('rectangle')}
                className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border rounded-lg transition-colors ${
                  currentTool === 'rectangle' 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title="Rectangle"
              >
                ⬜
              </button>
              <button
                onClick={() => setCurrentTool('circle')}
                className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border rounded-lg transition-colors ${
                  currentTool === 'circle' 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title="Circle"
              >
                ⭕
              </button>
              {isLargeScreen && (
                <button
                  onClick={() => setCurrentTool('pan')}
                  className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border rounded-lg transition-colors ${
                    currentTool === 'pan' 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Pan (Move canvas)"
                >
                  ✋
                </button>
              )}
            </div>
          </div>

          {/* Color Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <div 
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-xs sm:text-sm text-gray-700">Color</span>
            </button>
            
            {/* Color Picker Popup */}
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-30 min-w-max">
                <div className="flex flex-wrap gap-2 max-w-xs">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setCurrentColor(color);
                        setShowColorPicker(false);
                      }}
                      className={`w-10 h-10 rounded border-2 hover:scale-110 transition-transform flex-shrink-0 ${
                        currentColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Thickness Slider */}
          <div className="flex items-center gap-1 sm:gap-2">
            <label className="text-xs sm:text-sm text-gray-700">Thickness:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={currentThickness}
              onChange={(e) => setCurrentThickness(parseInt(e.target.value))}
              className="w-16 sm:w-20"
            />
            <span className="text-xs text-gray-500 w-6 sm:w-8">{currentThickness}px</span>
          </div>

          {/* Clear Button */}
          <Button
            onClick={clearCanvas}
            variant="secondary"
            size="sm"
          >
            Clear
          </Button>
        </div>
        </Card>
      )}

      {/* Drawing Canvas */}
      <Card className="p-1 sm:p-2">
        <div className="w-full drawing-canvas-container relative">
            <DrawingCanvas
              width={canvasSize.width}
              height={canvasSize.height}
              lines={lines}
              onDrawingChange={handleDrawingChange}
              currentTool={currentTool}
              currentColor={currentColor}
              currentThickness={currentThickness}
              zoom={zoom}
              onZoomChange={setZoom}
              isPanning={isPanning}
              isFullscreen={isFullscreen}
              constrainPanPosition={constrainPanPosition}
              handleWheel={handleWheel}
              stageRef={stageRef}
              setIsPanning={setIsPanning}
              responsiveDimensions={responsiveDimensions}
              canvasSize={canvasSize}
              question={question}
            />
            
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-2 left-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition-all duration-200 z-10"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                // Exit fullscreen icon (double cross)
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                // Enter fullscreen icon (double cross)
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </button>
        </div>
      </Card>
    </div>
  );
};

export default DrawingTestStudent;