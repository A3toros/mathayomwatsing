import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import { DRAWING_TOOLS, ZOOM_CONFIG } from '../utils/constants';

const CanvasViewer = forwardRef(({ 
  drawingData, 
  drawingState, 
  canvasSize, 
  zoom, 
  position, 
  onTouchStart, 
  onTouchMove, 
  onTouchEnd 
}, ref) => {
  // Internal container ref to measure available space
  const containerRef = useRef(null);
  const [fitZoom, setFitZoom] = useState(0.25);
  const [contentBounds, setContentBounds] = useState(null);

  // Compute dynamic min zoom to fit the canvas into container (rotation-aware)
  useEffect(() => {
    const rawW = canvasSize.width ?? canvasSize.WIDTH;
    const rawH = canvasSize.height ?? canvasSize.HEIGHT;
    const computeFit = () => {
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth || 1;
      const ch = el.clientHeight || 1;
      // Swap width/height when rotated 90/270 degrees
      const rotated = Math.abs(drawingState.rotation % 180) === 90;
      const canvasW = rotated ? rawH : rawW;
      const canvasH = rotated ? rawW : rawH;
      const fit = Math.min(cw / (canvasW || 1), ch / (canvasH || 1));
      setFitZoom(Math.min(fit, 1));
    };
    computeFit();
    window.addEventListener('resize', computeFit);
    return () => window.removeEventListener('resize', computeFit);
  }, [canvasSize.width, canvasSize.height, canvasSize.WIDTH, canvasSize.HEIGHT, drawingState.rotation]);

  // Display scale: never smaller than fit
  // Compute content-fit scale so that all drawn lines are visible
  const contentFitScale = useMemo(() => {
    const el = containerRef.current;
    if (!el || !contentBounds) return 0;
    const cw = el.clientWidth || 1;
    const ch = el.clientHeight || 1;
    const scale = Math.min(cw / Math.max(contentBounds.width, 1), ch / Math.max(contentBounds.height, 1));
    return Math.min(scale, ZOOM_CONFIG.MAX);
  }, [contentBounds]);

  const displayScale = useMemo(() => {
    // Canvas-first policy: never go below canvas fit
    const enforcedMin = fitZoom || 1;
    return Math.max(zoom, enforcedMin);
  }, [zoom, fitZoom]);

  // At fit zoom, center stage; otherwise use provided position
  const stagePosition = useMemo(() => {
    const canvasW = canvasSize.width ?? canvasSize.WIDTH;
    const canvasH = canvasSize.height ?? canvasSize.HEIGHT;
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const cw = containerRef.current.clientWidth || 1;
    const ch = containerRef.current.clientHeight || 1;
    
    // Always center the canvas for better visibility
    const centeredX = (cw - canvasW * displayScale) / 2;
    const centeredY = (ch - canvasH * displayScale) / 2;
    
    // At or below fit zoom, center the full canvas (not content)
    if (zoom <= fitZoom) return { x: centeredX, y: centeredY };
    
    // If zoomed in, use the provided position or center
    return {
      x: position.x !== undefined ? position.x : centeredX,
      y: position.y !== undefined ? position.y : centeredY,
    };
  }, [position, zoom, fitZoom, displayScale, canvasSize.width, canvasSize.height, contentBounds, contentFitScale]);

  // Compute bounds of all drawing content to auto-fit
  useEffect(() => {
    if (!Array.isArray(drawingData) || drawingData.length === 0) {
      setContentBounds(null);
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const addPoint = (x, y) => {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    };

    drawingData.forEach((item) => {
      if (Array.isArray(item)) {
        // Pencil line: array of points {x,y}
        item.forEach(p => addPoint(p.x, p.y));
      } else if (item && typeof item === 'object') {
        if (item.type === 'line') {
          addPoint(item.startX, item.startY);
          addPoint(item.endX, item.endY);
        } else if (item.type === 'rectangle') {
          addPoint(item.startX, item.startY);
          addPoint(item.endX, item.endY);
        } else if (item.type === 'circle') {
          const radius = Math.sqrt(Math.pow(item.endX - item.startX, 2) + Math.pow(item.endY - item.startY, 2)) / 2;
          const centerX = (item.startX + item.endX) / 2;
          const centerY = (item.startY + item.endY) / 2;
          addPoint(centerX - radius, centerY - radius);
          addPoint(centerX + radius, centerY + radius);
        }
      }
    });

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      setContentBounds(null);
      return;
    }

    // Add small padding
    const padding = 16;
    const width = Math.max(1, (maxX - minX) + padding * 2);
    const height = Math.max(1, (maxY - minY) + padding * 2);
    setContentBounds({
      minX: minX - padding,
      minY: minY - padding,
      width,
      height,
    });
  }, [drawingData]);

  // Debug logging
  useEffect(() => {
    console.log('CanvasViewer - drawingData:', drawingData);
    console.log('CanvasViewer - drawingData length:', drawingData?.length);
    if (drawingData && drawingData.length > 0) {
      console.log('CanvasViewer - first item:', drawingData[0]);
    }
  }, [drawingData]);

  // Debug canvas dimensions and positioning
  useEffect(() => {
    const canvasW = canvasSize.width ?? canvasSize.WIDTH;
    const canvasH = canvasSize.height ?? canvasSize.HEIGHT;
    console.log('CanvasViewer - canvas dimensions:', { width: canvasW, height: canvasH });
    console.log('CanvasViewer - zoom:', zoom, 'fitZoom:', fitZoom, 'displayScale:', displayScale);
    console.log('CanvasViewer - stagePosition:', stagePosition);
  }, [canvasSize, zoom, fitZoom, displayScale, stagePosition]);

  // Render drawing element
  const renderDrawingElement = (item, index) => {
    console.log(`CanvasViewer - rendering element ${index}:`, item);
    
    if (Array.isArray(item)) {
      // It's a line (pencil drawing)
      console.log(`CanvasViewer - rendering line with ${item.length} points`);
      return (
        <Line
          key={index}
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
          key={index}
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
          key={index}
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
          key={index}
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
  };

  // Render current drawing
  const renderCurrentDrawing = () => {
    if (!drawingState.isDrawing) return null;

    if (drawingState.currentTool === DRAWING_TOOLS.PENCIL && drawingState.currentLine.length > 0) {
      return (
        <Line
          points={drawingState.currentLine.flatMap(p => [p.x, p.y])}
          stroke={drawingState.currentColor}
          strokeWidth={drawingState.currentThickness}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
        />
      );
    } else if (drawingState.currentShape) {
      const { type, startX, startY, endX, endY, color, thickness } = drawingState.currentShape;
      
      if (type === DRAWING_TOOLS.LINE) {
        return (
          <Line
            points={[startX, startY, endX, endY]}
            stroke={color}
            strokeWidth={thickness}
            lineCap="round"
          />
        );
      } else if (type === DRAWING_TOOLS.RECTANGLE) {
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        return (
          <Rect
            x={x}
            y={y}
            width={width}
            height={height}
            stroke={color}
            strokeWidth={thickness}
            fill="transparent"
          />
        );
      } else if (type === DRAWING_TOOLS.CIRCLE) {
        const radius = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
        ) / 2;
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        return (
          <Circle
            x={centerX}
            y={centerY}
            radius={radius}
            stroke={color}
            strokeWidth={thickness}
            fill="transparent"
          />
        );
      }
    }
    return null;
  };

  const containerStyle = drawingState.isFullscreen
    ? {
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        zIndex: 60,
      }
    : {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      };

  const canvasStyle = {
    transform: `rotate(${drawingState.rotation}deg)`,
    transformOrigin: 'center center',
  };

  return (
    <div style={containerStyle} ref={containerRef}>
      <div style={canvasStyle}>
        <Stage
          ref={ref}
          width={Math.max((canvasSize.width ?? canvasSize.WIDTH) || 0, 1536)}
          height={Math.max((canvasSize.height ?? canvasSize.HEIGHT) || 0, 2048)}
          scaleX={displayScale}
          scaleY={displayScale}
          x={stagePosition.x}
          y={stagePosition.y}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Layer>
            {/* White background */}
            <Rect
              x={0}
              y={0}
              width={Math.max((canvasSize.width ?? canvasSize.WIDTH) || 0, 1536)}
              height={Math.max((canvasSize.height ?? canvasSize.HEIGHT) || 0, 2048)}
              fill="white"
            />
            
            {/* Existing drawings */}
            {drawingData.map((item, index) => {
              console.log(`CanvasViewer - mapping item ${index}:`, item);
              return renderDrawingElement(item, index);
            })}
            
            {/* Current drawing */}
            {renderCurrentDrawing()}
          </Layer>
        </Stage>
      </div>
    </div>
  );
});

CanvasViewer.displayName = 'CanvasViewer';

export default CanvasViewer;
