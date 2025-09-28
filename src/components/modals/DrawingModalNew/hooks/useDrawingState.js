import { useState, useCallback } from 'react';

export const useDrawingState = () => {
  // Single state object for all drawing-related state
  const [drawingState, setDrawingState] = useState({
    // Canvas state
    zoom: 1.0,                    // Start at 100% (max zoom)
    position: { x: 0, y: 0 },     // Canvas position
    rotation: 0,                  // Canvas rotation
    
    // Drawing state
    currentTool: 'pencil',        // Current drawing tool
    currentColor: '#000000',      // Current color
    currentThickness: 2,          // Current line thickness
    isDrawing: false,             // Currently drawing
    
    // Current drawing
    currentLine: [],              // Current line being drawn
    currentShape: null,           // Current shape being drawn
    
    // Display state
    isFullscreen: false,          // Fullscreen mode
    preFullscreenState: null,     // State before fullscreen
  });

  // Separate state for drawing data
  const [drawingData, setDrawingData] = useState([]);

  // State update functions
  const updateDrawingState = useCallback((updates) => {
    setDrawingState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetDrawingState = useCallback(() => {
    setDrawingState({
      zoom: 1.0,
      position: { x: 0, y: 0 },
      rotation: 0,
      currentTool: 'pencil',
      currentColor: '#000000',
      currentThickness: 2,
      isDrawing: false,
      currentLine: [],
      currentShape: null,
      isFullscreen: false,
      preFullscreenState: null,
    });
  }, []);

  const startDrawing = useCallback((point) => {
    const pointData = {
      x: point.x,
      y: point.y,
      color: drawingState.currentColor,
      thickness: drawingState.currentThickness,
    };

    if (drawingState.currentTool === 'pencil') {
      setDrawingState(prev => ({
        ...prev,
        isDrawing: true,
        currentLine: [pointData]
      }));
    } else if (['line', 'rectangle', 'circle'].includes(drawingState.currentTool)) {
      setDrawingState(prev => ({
        ...prev,
        isDrawing: true,
        currentShape: {
          type: drawingState.currentTool,
          startX: point.x,
          startY: point.y,
          endX: point.x,
          endY: point.y,
          color: drawingState.currentColor,
          thickness: drawingState.currentThickness,
        }
      }));
    }
  }, [drawingState.currentTool, drawingState.currentColor, drawingState.currentThickness]);

  const continueDrawing = useCallback((point) => {
    if (!drawingState.isDrawing) return;

    const pointData = {
      x: point.x,
      y: point.y,
      color: drawingState.currentColor,
      thickness: drawingState.currentThickness,
    };

    if (drawingState.currentTool === 'pencil') {
      setDrawingState(prev => ({
        ...prev,
        currentLine: [...prev.currentLine, pointData]
      }));
    } else if (drawingState.currentShape) {
      setDrawingState(prev => ({
        ...prev,
        currentShape: {
          ...prev.currentShape,
          endX: point.x,
          endY: point.y,
        }
      }));
    }
  }, [drawingState.isDrawing, drawingState.currentTool, drawingState.currentColor, drawingState.currentThickness, drawingState.currentShape]);

  const finishDrawing = useCallback(() => {
    if (!drawingState.isDrawing) return;

    if (drawingState.currentTool === 'pencil' && drawingState.currentLine.length > 0) {
      setDrawingData(prev => [...prev, drawingState.currentLine]);
    } else if (drawingState.currentShape) {
      setDrawingData(prev => [...prev, drawingState.currentShape]);
    }

    setDrawingState(prev => ({
      ...prev,
      isDrawing: false,
      currentLine: [],
      currentShape: null
    }));
  }, [drawingState.isDrawing, drawingState.currentTool, drawingState.currentLine, drawingState.currentShape]);

  return {
    drawingState,
    setDrawingState,
    drawingData,
    setDrawingData,
    updateDrawingState,
    resetDrawingState,
    startDrawing,
    continueDrawing,
    finishDrawing,
  };
};
