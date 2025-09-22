import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const DrawingModal = ({ 
  drawing, 
  isOpen, 
  onClose, 
  onScoreChange, 
  onMaxScoreChange 
}) => {
  const [drawingData, setDrawingData] = useState([]);
  const [questionsData, setQuestionsData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 800 });
  const [zoom, setZoom] = useState(1.0); // Start at 100% = 384x512 (4x smaller)
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);

  // Clamp position to prevent canvas from going off-screen
  const clampPosition = (newPos, scale) => {
    const stage = stageRef.current;
    if (!stage) return newPos;
    
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    const canvasWidth = canvasSize.width * scale;
    const canvasHeight = canvasSize.height * scale;

    // If canvas is smaller than screen → center it
    const minX = Math.min(0, stageWidth - canvasWidth);
    const minY = Math.min(0, stageHeight - canvasHeight);

    const maxX = canvasWidth < stageWidth ? (stageWidth - canvasWidth) / 2 : 0;
    const maxY = canvasHeight < stageHeight ? (stageHeight - canvasHeight) / 2 : 0;

    return {
      x: Math.min(maxX, Math.max(minX, newPos.x)),
      y: Math.min(maxY, Math.max(minY, newPos.y)),
    };
  };
  
  // Two-finger gesture state
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const [lastTouchCenter, setLastTouchCenter] = useState(null);
  const [isTwoFingerGesture, setIsTwoFingerGesture] = useState(false);
  const [gestureType, setGestureType] = useState(null); // 'zoom' | 'pan' | null
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [preFullscreenState, setPreFullscreenState] = useState(null);
  
  // Animation throttling
  let animationId = null;
  
  // Device-adaptive thresholds
  const getDevicePixelRatio = () => window.devicePixelRatio || 1;
  const isHighDPI = getDevicePixelRatio() > 1.5;
  
  const GESTURE_THRESHOLDS = {
    scaleDelta: isHighDPI ? 0.03 : 0.05, // More sensitive on high-DPI
    centerDelta: isHighDPI ? 15 : 20,    // Adjusted for pixel density
    minTouchDistance: 10,                // Minimum distance to register gesture
  };
  
  // Comprehensive cleanup function
  const resetGestureState = () => {
    setIsGestureActive(false);
    setGestureType(null);
    setLastTouchDistance(null);
    setLastTouchCenter(null);
    setIsDragging(false);
    
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
  
  // Fullscreen handler with state preservation
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Save current state before entering fullscreen
      setPreFullscreenState({
        zoom: zoom,
        position: { ...position }
      });
      
      // Enter fullscreen
      const container = document.documentElement;
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
        
        // Set zoom to 25% to show full canvas
        const fullscreenZoom = 0.25;
        setZoom(fullscreenZoom);
        
        // Apply zoom and clamp position
        const stage = stageRef.current;
        if (stage) {
          stage.scale({ x: fullscreenZoom, y: fullscreenZoom });
          const clampedPos = clampPosition({ x: 0, y: 0 }, fullscreenZoom);
          stage.position(clampedPos);
          stage.batchDraw();
          setPosition(clampedPos);
        }
        
        console.log('🎨 Fullscreen - Zoom:', fullscreenZoom.toFixed(2));
        console.log('🎨 Fullscreen - Position:', clampedPos);
      });
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        
        // Restore previous state instead of hard-resetting
        if (preFullscreenState) {
          setZoom(preFullscreenState.zoom);
          setPosition(preFullscreenState.position);
          setPreFullscreenState(null);
        } else {
          // Fallback to default if no previous state
          setZoom(0.25);
          setPosition({ x: 0, y: 0 });
        }
      });
    }
  };

  useEffect(() => {
    if (isOpen && drawing) {
      // Set initial state: 25% zoom (max resolution 1536x2048), centered
      const initialScale = 0.25;
      setZoom(initialScale);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      
      // Apply initial scale to stage
      const stage = stageRef.current;
      if (stage) {
        stage.scale({ x: initialScale, y: initialScale });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
      }
      
      // Parse drawing data from answers field
      console.log('🎨 DrawingModal - drawing object:', drawing);
      console.log('🎨 DrawingModal - drawing.answers:', drawing.answers);
      
      let parsedDrawingData = [];
      
      if (drawing.answers) {
        console.log('🎨 DrawingModal - drawing.answers type:', typeof drawing.answers);
        console.log('🎨 DrawingModal - drawing.answers:', drawing.answers);
        
        let answers;
        
        if (typeof drawing.answers === 'string') {
          console.log('🎨 DrawingModal - drawing.answers is a string, parsing JSON...');
          try {
            answers = JSON.parse(drawing.answers);
            console.log('🎨 DrawingModal - parsed answers:', answers);
          } catch (e) {
            console.error('🎨 DrawingModal - Error parsing JSON string:', e);
            answers = null;
          }
        } else if (Array.isArray(drawing.answers)) {
          console.log('🎨 DrawingModal - drawing.answers is already an array');
          answers = drawing.answers;
        } else {
          console.log('🎨 DrawingModal - drawing.answers is neither string nor array:', typeof drawing.answers);
          answers = null;
        }
        
        if (answers) {
          
          if (Array.isArray(answers) && answers.length > 0) {
            // Process all questions and store them separately
            console.log('🎨 DrawingModal - processing', answers.length, 'questions');
            
            const questions = [];
            
            answers.forEach((answer, questionIndex) => {
              console.log(`🎨 DrawingModal - processing question ${questionIndex + 1}:`, answer);
              
              let questionDrawingData = [];
              
              if (typeof answer === 'string') {
                try {
                  const parsedDrawing = JSON.parse(answer);
                  console.log(`🎨 DrawingModal - parsed drawing data for question ${questionIndex + 1}:`, parsedDrawing);
                  
                  if (Array.isArray(parsedDrawing)) {
                    // Check if it's an array of lines or a single line (array of points)
                    if (parsedDrawing.length > 0 && Array.isArray(parsedDrawing[0])) {
                      // It's an array of lines
                      questionDrawingData = parsedDrawing;
                      console.log(`🎨 DrawingModal - question ${questionIndex + 1} has lines:`, parsedDrawing);
                    } else {
                      // It's a single line (array of points), wrap it in an array
                      questionDrawingData = [parsedDrawing];
                      console.log(`🎨 DrawingModal - question ${questionIndex + 1} has single line:`, parsedDrawing);
                    }
                  } else {
                    console.log(`🎨 DrawingModal - parsed drawing for question ${questionIndex + 1} is not an array`);
                  }
                } catch (parseError) {
                  console.error(`🎨 DrawingModal - Error parsing question ${questionIndex + 1}:`, parseError);
                }
              } else if (Array.isArray(answer)) {
                // Answer is already an array
                questionDrawingData = answer;
                console.log(`🎨 DrawingModal - question ${questionIndex + 1} is already array:`, answer);
              } else {
                console.log(`🎨 DrawingModal - question ${questionIndex + 1} is not a string or array`);
              }
              
              questions.push({
                questionNumber: questionIndex + 1,
                drawingData: questionDrawingData
              });
            });
            
            console.log('🎨 DrawingModal - processed questions:', questions);
            setQuestionsData(questions);
            
            // Set the first question as current
            if (questions.length > 0) {
              console.log('🎨 DrawingModal - Setting first question data:', questions[0].drawingData);
              setDrawingData(questions[0].drawingData);
              setCurrentQuestionIndex(0);
              console.log('🎨 DrawingModal - First question set, drawingData length:', questions[0].drawingData.length);
            } else {
              console.log('🎨 DrawingModal - No questions to display');
            }
          } else {
            console.log('🎨 DrawingModal - answers is not an array or is empty');
          }
        } else {
          console.log('🎨 DrawingModal - answers is null or invalid');
        }
      } else {
        console.log('🎨 DrawingModal - No answers field in drawing object');
      }
      
      // If no drawing data found, try alternative approaches
      if (parsedDrawingData.length === 0) {
        console.log('🎨 DrawingModal - No drawing data found, trying alternative approaches...');
        
        // Check if drawing data might be in a different field
        if (drawing.drawing_data) {
          console.log('🎨 DrawingModal - Found drawing_data field:', drawing.drawing_data);
          try {
            const alternativeData = JSON.parse(drawing.drawing_data);
            if (Array.isArray(alternativeData)) {
              parsedDrawingData = alternativeData;
              console.log('🎨 DrawingModal - Using drawing_data field:', alternativeData);
            }
          } catch (e) {
            console.error('🎨 DrawingModal - Error parsing drawing_data:', e);
          }
        }
        
        // Check if answers might be a direct array
        if (drawing.answers && Array.isArray(drawing.answers)) {
          console.log('🎨 DrawingModal - answers is already an array:', drawing.answers);
          parsedDrawingData = drawing.answers;
        }
      }
      
      setDrawingData(parsedDrawingData);
      console.log('🎨 DrawingModal - Final drawing data:', parsedDrawingData);
      
      // Set canvas size using large canvas approach
      const actualCanvasWidth = drawing?.max_canvas_width || 1536;
      const actualCanvasHeight = drawing?.max_canvas_height || 2048;
      const viewportWidth = drawing?.canvas_width || 600;
      const viewportHeight = drawing?.canvas_height || 800;
      
      setCanvasSize({
        width: actualCanvasWidth,   // 1536 - actual canvas
        height: actualCanvasHeight  // 2048 - actual canvas
      });
      
      // Start at 25% zoom to see the full canvas
      const initialZoom = 0.25;
      
      setZoom(initialZoom);
      
      console.log('🎨 DrawingModal - Canvas size set:', actualCanvasWidth, 'x', actualCanvasHeight);
      console.log('🎨 DrawingModal - Viewport size:', viewportWidth, 'x', viewportHeight);
      console.log('🎨 DrawingModal - Initial zoom:', initialZoom.toFixed(2));
      console.log('🎨 DrawingModal - Image resolution:', actualCanvasWidth * actualCanvasHeight, 'pixels');
      console.log('🎨 DrawingModal - Aspect ratio:', (actualCanvasWidth / actualCanvasHeight).toFixed(2));
    }
  }, [isOpen, drawing]);
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      resetGestureState();
    };
  }, []);

  // Ensure first question is displayed when questionsData changes
  useEffect(() => {
    console.log('🎨 DrawingModal - questionsData changed:', questionsData.length, 'questions');
    console.log('🎨 DrawingModal - currentQuestionIndex:', currentQuestionIndex);
    console.log('🎨 DrawingModal - drawingData.length:', drawingData.length);
    
    if (questionsData.length > 0) {
      console.log('🎨 DrawingModal - Setting first question from questionsData');
      setDrawingData(questionsData[0].drawingData);
      setCurrentQuestionIndex(0);
      console.log('🎨 DrawingModal - First question data:', questionsData[0].drawingData);
    }
  }, [questionsData]);

  const handleZoomIn = () => {
    const minZoom = 0.25; // 25% = 1536x2048 (max resolution)
    const maxZoom = 1.0;  // 100% = 384x512 (4x smaller)
    
    setZoom(prev => {
      const newZoom = Math.min(prev * 1.2, maxZoom);
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
      
      // Apply zoom and clamp position
      const stage = stageRef.current;
      if (stage) {
        stage.scale({ x: clampedZoom, y: clampedZoom });
        const clampedPos = clampPosition(position, clampedZoom);
        stage.position(clampedPos);
        stage.batchDraw();
        setPosition(clampedPos);
      }
      
      return clampedZoom;
    });
  };

  const handleZoomOut = () => {
    const minZoom = 0.25; // 25% = 1536x2048 (max resolution)
    const maxZoom = 1.0;  // 100% = 384x512 (4x smaller)
    
    setZoom(prev => {
      const newZoom = Math.max(prev / 1.2, minZoom);
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
      
      // Apply zoom and clamp position
      const stage = stageRef.current;
      if (stage) {
        stage.scale({ x: clampedZoom, y: clampedZoom });
        const clampedPos = clampPosition(position, clampedZoom);
        stage.position(clampedPos);
        stage.batchDraw();
        setPosition(clampedPos);
      }
      
      return clampedZoom;
    });
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Two-finger gesture functions
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
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 2) {
      // Two-finger gesture - start zoom/pan
      setIsGestureActive(true);
      setGestureType(null); // Will be determined in touch move
      setLastTouchDistance(getTouchDistance(touches));
      setLastTouchCenter(getTouchCenter(touches));
      setIsDragging(false); // Stop any dragging
    } else if (touches.length === 1) {
      // Single finger - normal drag
      setIsGestureActive(false);
      setGestureType(null);
      handleMouseDown(e);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 2 && isGestureActive) {
      // Two-finger gesture - handle zoom and pan with improved logic
      const stage = stageRef.current;
      const currentDistance = getTouchDistance(touches);
      const currentCenter = getTouchCenter(touches);
      
      if (lastTouchDistance && lastTouchCenter && stage && currentDistance > GESTURE_THRESHOLDS.minTouchDistance) {
        // Detect if user is zooming or panning (percentage-based thresholds)
        const scaleDelta = Math.abs(currentDistance / lastTouchDistance - 1);
        const centerDelta = Math.sqrt(
          Math.pow(currentCenter.x - lastTouchCenter.x, 2) + 
          Math.pow(currentCenter.y - lastTouchCenter.y, 2)
        );
        
        if (scaleDelta > GESTURE_THRESHOLDS.scaleDelta) {
          // User is pinching - ZOOM ONLY
          setGestureType('zoom');
          
          const scaleChange = currentDistance / lastTouchDistance;
          const oldScale = stage.scaleX();
          const newScale = oldScale * scaleChange;
          
          // Apply zoom limits (0.25x to 1.0x for large canvas)
          const maxCanvasWidth = drawing?.max_canvas_width || 1536;
          const maxCanvasHeight = drawing?.max_canvas_height || 2048;
          const maxZoomX = maxCanvasWidth / canvasSize.width;
          const maxZoomY = maxCanvasHeight / canvasSize.height;
          const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0); // Cap at 1.0x
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
            animationId = null;
          };
          
          if (!animationId) {
            animationId = requestAnimationFrame(updateStage);
          }
          
          setZoom(clampedScale);
          setPosition(newPos);
          
          console.log('🎨 DrawingModal - Zoom gesture - Scale:', clampedScale.toFixed(2), 'Center:', zoomPoint);
          
        } else if (centerDelta > GESTURE_THRESHOLDS.centerDelta) {
          // User is moving fingers - PAN ONLY
          setGestureType('pan');
          
          const deltaX = currentCenter.x - lastTouchCenter.x;
          const deltaY = currentCenter.y - lastTouchCenter.y;
          
          const currentPos = stage.position();
          const newPos = {
            x: currentPos.x + deltaX,
            y: currentPos.y + deltaY,
          };
          
          // Throttled update using requestAnimationFrame
          const updateStage = () => {
            stage.position(newPos);
            stage.batchDraw();
            animationId = null;
          };
          
          if (!animationId) {
            animationId = requestAnimationFrame(updateStage);
          }
          
          setPosition(newPos);
          
          console.log('🎨 DrawingModal - Pan gesture - Delta:', deltaX.toFixed(1), deltaY.toFixed(1));
        }
      }
      
      setLastTouchDistance(currentDistance);
      setLastTouchCenter(currentCenter);
    } else if (touches.length === 1 && !isGestureActive) {
      // Single finger - normal drag
      setIsGestureActive(false);
      setGestureType(null);
      handleMouseMove(e);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 0) {
      // All fingers lifted - clean reset
      resetGestureState();
      handleMouseUp();
    } else if (touches.length === 1) {
      // One finger remaining - switch to single finger mode
      setIsGestureActive(false);
      setGestureType(null);
      setLastTouchDistance(null);
      setLastTouchCenter(null);
      // Continue with single finger drawing if needed
    }
    // If still 2+ fingers, continue with gesture
  };

  // Constrain pan position to keep canvas visible
  const constrainPanPosition = (stage) => {
    const scale = stage.scaleX();
    const stageWidth = 800; // Modal stage width
    const stageHeight = 600; // Modal stage height
    const canvasWidth = canvasSize.width * scale;
    const canvasHeight = canvasSize.height * scale;
    
    // Calculate bounds - allow some canvas to be outside view but not too much
    const maxX = Math.max(0, (canvasWidth - stageWidth) * 0.5);
    const maxY = Math.max(0, (canvasHeight - stageHeight) * 0.5);
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

  const handleDragMove = (e) => {
    // Constrain panning in real-time during drag
    const stage = e.target;
    constrainPanPosition(stage);
  };

  const handleDownload = () => {
    if (stageRef.current) {
      // Export at the scaled size (what teacher actually sees)
      const scaledWidth = Math.round(canvasSize.width * zoom);
      const scaledHeight = Math.round(canvasSize.height * zoom);
      
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 1,
        x: 0,
        y: 0,
        width: scaledWidth,
        height: scaledHeight
      });
      
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `drawing-${drawing?.name || 'student'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('🎨 DrawingModal - PNG exported at scaled size:', {
        originalSize: `${canvasSize.width}x${canvasSize.height}`,
        scaledSize: `${scaledWidth}x${scaledHeight}`,
        zoom: zoom.toFixed(2)
      });
    }
  };

  const handleScoreSubmit = () => {
    if (drawing?.score !== undefined && drawing?.max_score !== undefined) {
      // Score is already updated via the input onChange handlers
      onClose();
    }
  };

  if (!isOpen || !drawing) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Drawing Submission
              </h3>
              <p className="text-sm text-gray-600">
                {drawing.name} {drawing.surname} - {drawing.test_name}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Question Navigation */}
          {questionsData.length > 1 && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        const newIndex = currentQuestionIndex - 1;
                        setCurrentQuestionIndex(newIndex);
                        setDrawingData(questionsData[newIndex].drawingData);
                      }
                    }}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {questionsData.length}
                  </span>
                  <Button
                    onClick={() => {
                      if (currentQuestionIndex < questionsData.length - 1) {
                        const newIndex = currentQuestionIndex + 1;
                        setCurrentQuestionIndex(newIndex);
                        setDrawingData(questionsData[newIndex].drawingData);
                      }
                    }}
                    disabled={currentQuestionIndex === questionsData.length - 1}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  {questionsData[currentQuestionIndex]?.drawingData?.length || 0} lines
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Drawing Container */}
            <div className="flex-1 relative overflow-auto bg-gray-100 p-4">
              <div
                className="w-full h-full flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {(() => {
                  console.log('🎨 DrawingModal - Rendering check - drawingData.length:', drawingData.length);
                  console.log('🎨 DrawingModal - drawingData:', drawingData);
                  return drawingData.length === 0;
                })() ? (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <X className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">No drawing data available</p>
                  </div>
                ) : isFullscreen ? (
                  // Fullscreen mode - separate container
                  <div className="fixed inset-0 bg-black flex items-center justify-center">
                    <div
                      style={{
                        width: `${canvasSize.width * zoom}px`,
                        height: `${canvasSize.height * zoom}px`,
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        transformOrigin: 'center center'
                      }}
                    >
                      <Stage
                        ref={stageRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        scaleX={zoom}
                        scaleY={zoom}
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
                          const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0); // Cap at 1.0x (no upscaling)
                          
                          const oldZoom = zoom;
                          const newZoom = e.evt.deltaY > 0 
                            ? Math.max(oldZoom * 0.9, 0.25) // Zoom out
                            : Math.min(oldZoom * 1.1, maxZoom); // Zoom in
                          
                          const newWidth = Math.round(canvasSize.width * newZoom);
                          const newHeight = Math.round(canvasSize.height * newZoom);
                          
                          const newPos = {
                            x: position.x + (canvasSize.width * oldZoom - newWidth) / 2,
                            y: position.y + (canvasSize.height * oldZoom - newHeight) / 2
                          };
                          
                          setZoom(newZoom);
                          setPosition(newPos);
                        }}
                      >
                        <Layer>
                          {/* White background for PNG export */}
                          <Rect
                            x={0}
                            y={0}
                            width={canvasSize.width}
                            height={canvasSize.height}
                            fill="white"
                            stroke="white"
                            strokeWidth={0}
                          />
                          {drawingData.map((line, index) => {
                            // Each line should be an array of points
                            if (Array.isArray(line) && line.length > 0) {
                              // Find the bounds of all drawing data to scale properly
                              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                              
                              line.forEach(point => {
                                if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                                  minX = Math.min(minX, point.x);
                                  minY = Math.min(minY, point.y);
                                  maxX = Math.max(maxX, point.x);
                                  maxY = Math.max(maxY, point.y);
                                }
                              });
                              
                              // Only render if we have valid bounds
                              if (minX !== Infinity && minY !== Infinity && maxX !== -Infinity && maxY !== -Infinity) {
                                // Scale points to fit the actual canvas size
                                const scaleX = canvasSize.width / (questionData?.max_canvas_width || 1536);
                                const scaleY = canvasSize.height / (questionData?.max_canvas_height || 2048);
                                
                                const scaledPoints = line
                                  .filter(point => point && typeof point.x === 'number' && typeof point.y === 'number')
                                  .map(point => ({
                                    x: point.x * scaleX,
                                    y: point.y * scaleY
                                  }));
                                
                                if (scaledPoints.length > 0) {
                                  return (
                                    <Line
                                      key={index}
                                      points={scaledPoints.flatMap(p => [p.x, p.y])}
                                      stroke="black"
                                      strokeWidth={2}
                                      lineCap="round"
                                      lineJoin="round"
                                    />
                                  );
                                }
                              }
                            }
                            return null;
                          })}
                        </Layer>
                      </Stage>
                    </div>
                  </div>
                ) : (
                  // Normal mode - original container
                  <div
                    style={{
                      transform: `rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                      transformOrigin: 'center center',
                      width: `${canvasSize.width * zoom}px`,
                      height: `${canvasSize.height * zoom}px`,
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  >
                    <Stage
                      ref={stageRef}
                      width={canvasSize.width}
                      height={canvasSize.height}
                      scaleX={zoom}
                      scaleY={zoom}
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
                        const maxZoom = Math.min(maxZoomX, maxZoomY, 1.0); // Cap at 1.0x (no upscaling)
                        
                        const oldZoom = zoom;
                        const newZoom = e.evt.deltaY > 0 
                          ? Math.max(oldZoom * 0.9, 0.25) // Zoom out
                          : Math.min(oldZoom * 1.1, maxZoom); // Zoom in
                        
                        const newWidth = Math.round(canvasSize.width * newZoom);
                        const newHeight = Math.round(canvasSize.height * newZoom);
                        const newResolution = newWidth * newHeight;
                        
                        console.log('🎨 DrawingModal - Wheel zoom:', oldZoom.toFixed(2), '->', newZoom.toFixed(2));
                        console.log('🎨 DrawingModal - New effective size:', newWidth, 'x', newHeight);
                        console.log('🎨 DrawingModal - New resolution:', newResolution, 'pixels');
                        console.log('🎨 DrawingModal - Max allowed resolution:', maxCanvasWidth * maxCanvasHeight, 'pixels');
                        console.log('🎨 DrawingModal - Within bounds:', newResolution <= (maxCanvasWidth * maxCanvasHeight));
                        
                        setZoom(newZoom);
                      }}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                      onLoad={() => {
                        console.log('🎨 DrawingModal - Stage loaded with dimensions:', canvasSize.width, 'x', canvasSize.height);
                        console.log('🎨 DrawingModal - Current zoom level:', zoom);
                        console.log('🎨 DrawingModal - Effective display size:', canvasSize.width * zoom, 'x', canvasSize.height * zoom);
                        console.log('🎨 DrawingModal - Total pixels displayed:', Math.round(canvasSize.width * zoom * canvasSize.height * zoom));
                      }}
                    >
                      <Layer>
                        {/* White background for PNG export */}
                        <Rect
                          x={0}
                          y={0}
                          width={canvasSize.width}
                          height={canvasSize.height}
                          fill="white"
                          stroke="white"
                          strokeWidth={0}
                        />
                        {drawingData.map((line, index) => {
                          // Each line should be an array of points
                          if (Array.isArray(line) && line.length > 0) {
                            // Find the bounds of all drawing data to scale properly
                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                            
                            drawingData.forEach(drawingLine => {
                              if (Array.isArray(drawingLine)) {
                                drawingLine.forEach(point => {
                                  if (point && typeof point === 'object' && point.x !== undefined && point.y !== undefined) {
                                    minX = Math.min(minX, point.x);
                                    minY = Math.min(minY, point.y);
                                    maxX = Math.max(maxX, point.x);
                                    maxY = Math.max(maxY, point.y);
                                  }
                                });
                              }
                            });
                            
                            // Calculate scale factors to fit the drawing in the canvas
                            const drawingWidth = maxX - minX;
                            const drawingHeight = maxY - minY;
                            const scaleX = drawingWidth > 0 ? (canvasSize.width * 0.8) / drawingWidth : 1;
                            const scaleY = drawingHeight > 0 ? (canvasSize.height * 0.8) / drawingHeight : 1;
                            const scale = Math.min(scaleX, scaleY);
                            
                            // Center the drawing in the canvas
                            const offsetX = (canvasSize.width - drawingWidth * scale) / 2 - minX * scale;
                            const offsetY = (canvasSize.height - drawingHeight * scale) / 2 - minY * scale;
                            
                            // Convert array of points to flat array for Konva with scaling and centering
                            const points = line.flatMap(point => [
                              (point.x * scale) + offsetX,
                              (point.y * scale) + offsetY
                            ]);
                            
                            console.log(`🎨 DrawingModal - Line ${index}:`, {
                              originalPoints: line.length,
                              scaledPoints: points.length / 2,
                              scale,
                              offsetX,
                              offsetY,
                              firstPoint: { x: points[0], y: points[1] },
                              lastPoint: { x: points[points.length-2], y: points[points.length-1] }
                            });
                            
                            return (
                              <Line
                                key={index}
                                points={points}
                                stroke={line[0]?.color || '#000000'}
                                strokeWidth={(line[0]?.thickness || 2) * scale}
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
                  </div>
                )}
              </div>

              {/* Image Controls */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <Button
                  onClick={handleZoomIn}
                  variant="secondary"
                  size="icon"
                  className="w-10 h-10"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleZoomOut}
                  variant="secondary"
                  size="icon"
                  className="w-10 h-10"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleRotate}
                  variant="secondary"
                  size="icon"
                  className="w-10 h-10"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="secondary"
                  size="icon"
                  className="w-10 h-10"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleFullscreen}
                  variant="secondary"
                  size="icon"
                  className="w-10 h-10"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </Button>
              </div>

              {/* Zoom Level Indicator */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                {Math.round(zoom * 100)}%
              </div>
            </div>

            {/* Scoring Section */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Score:</label>
                    <input
                      type="number"
                      min="0"
                      max={drawing.max_score || 100}
                      value={drawing.score || ''}
                      onChange={(e) => onScoreChange(drawing.id, e.target.value)}
                      className="w-20 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Max Score:</label>
                    <input
                      type="number"
                      min="1"
                      value={drawing.max_score || 100}
                      onChange={(e) => onMaxScoreChange(drawing.id, e.target.value)}
                      className="w-20 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="100"
                    />
                  </div>
                  {drawing.score !== undefined && drawing.max_score !== undefined && (
                    <div className="text-sm text-gray-600">
                      Percentage: {Math.round((drawing.score / drawing.max_score) * 100)}%
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleScoreSubmit}
                  variant="primary"
                  size="sm"
                >
                  Save Score
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DrawingModal;
