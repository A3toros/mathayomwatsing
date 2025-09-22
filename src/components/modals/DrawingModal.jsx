import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Stage, Layer, Line } from 'react-konva';
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
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);

  useEffect(() => {
    if (isOpen && drawing) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      
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
      
      // Set canvas size from drawing data or use defaults
      if (drawing.canvas_width && drawing.canvas_height) {
        setCanvasSize({
          width: drawing.canvas_width,
          height: drawing.canvas_height
        });
        console.log('🎨 DrawingModal - Using canvas size from drawing data:', drawing.canvas_width, 'x', drawing.canvas_height);
        console.log('🎨 DrawingModal - Image resolution:', drawing.canvas_width * drawing.canvas_height, 'pixels');
        console.log('🎨 DrawingModal - Aspect ratio:', (drawing.canvas_width / drawing.canvas_height).toFixed(2));
      } else {
        // Simple approach: Use maximum canvas size to show all lines
        setCanvasSize({
          width: 1536,
          height: 2048
        });
        console.log('🎨 DrawingModal - Using maximum canvas size to show all lines');
        console.log('🎨 DrawingModal - Image resolution:', 1536 * 2048, 'pixels');
        console.log('🎨 DrawingModal - This will display all drawing lines to the teacher');
      }
    }
  }, [isOpen, drawing]);

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
    const maxCanvasWidth = drawing?.max_canvas_width || 1536;
    const maxCanvasHeight = drawing?.max_canvas_height || 2048;
    const maxZoomX = maxCanvasWidth / canvasSize.width;
    const maxZoomY = maxCanvasHeight / canvasSize.height;
    const maxZoom = Math.min(maxZoomX, maxZoomY, 5); // Cap at 5x for performance
    
    setZoom(prev => {
      const newZoom = Math.min(prev * 1.2, maxZoom);
      const newWidth = Math.round(canvasSize.width * newZoom);
      const newHeight = Math.round(canvasSize.height * newZoom);
      const newResolution = newWidth * newHeight;
      
      console.log('🎨 DrawingModal - Zoom In:', prev.toFixed(2), '->', newZoom.toFixed(2));
      console.log('🎨 DrawingModal - New effective size:', newWidth, 'x', newHeight);
      console.log('🎨 DrawingModal - New resolution:', newResolution, 'pixels');
      console.log('🎨 DrawingModal - Max allowed resolution:', maxCanvasWidth * maxCanvasHeight, 'pixels');
      console.log('🎨 DrawingModal - Within bounds:', newResolution <= (maxCanvasWidth * maxCanvasHeight));
      
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    const maxCanvasWidth = drawing?.max_canvas_width || 1536;
    const maxCanvasHeight = drawing?.max_canvas_height || 2048;
    
    setZoom(prev => {
      const newZoom = Math.max(prev / 1.2, 0.25); // Minimum 25% zoom
      const newWidth = Math.round(canvasSize.width * newZoom);
      const newHeight = Math.round(canvasSize.height * newZoom);
      const newResolution = newWidth * newHeight;
      
      console.log('🎨 DrawingModal - Zoom Out:', prev.toFixed(2), '->', newZoom.toFixed(2));
      console.log('🎨 DrawingModal - New effective size:', newWidth, 'x', newHeight);
      console.log('🎨 DrawingModal - New resolution:', newResolution, 'pixels');
      console.log('🎨 DrawingModal - Max allowed resolution:', maxCanvasWidth * maxCanvasHeight, 'pixels');
      console.log('🎨 DrawingModal - Within bounds:', newResolution <= (maxCanvasWidth * maxCanvasHeight));
      
      return newZoom;
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
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2
      });
      
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `drawing-${drawing?.name || 'student'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
                ) : (
                  <div
                    style={{
                      transform: `rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
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
                      onWheel={(e) => {
                        e.evt.preventDefault();
                        const maxCanvasWidth = drawing?.max_canvas_width || 1536;
                        const maxCanvasHeight = drawing?.max_canvas_height || 2048;
                        const maxZoomX = maxCanvasWidth / canvasSize.width;
                        const maxZoomY = maxCanvasHeight / canvasSize.height;
                        const maxZoom = Math.min(maxZoomX, maxZoomY, 5);
                        
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
