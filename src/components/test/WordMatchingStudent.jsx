import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import Konva from 'konva';

import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import PerfectModal from '../ui/PerfectModal';
import { useNotification } from '../ui/Notification';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useTestProgress } from '../../hooks/useTestProgress';
import { useAntiCheating } from '../../hooks/useAntiCheating';
import { getCachedData, setCachedData, clearTestData, CACHE_TTL } from '../../utils/cacheUtils';

const WordMatchingStudent = ({ testData, onTestComplete, onBackToCabinet }) => {
  const { user } = useAuth();
  const { makeAuthenticatedRequest } = useApi();
  
  // Responsive sizing hook
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  const { getCheatingData, stopTracking, clearData } = useAntiCheating();

  // State management
  const [displayData, setDisplayData] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  
  // Container ref for actual width
  const containerRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(800);
  
  // Responsive breakpoints
  const BREAKPOINTS = {
    VERY_SMALL: 400,
    MOBILE: 600,
    TABLET: 900
  };
  
  // Abstract sizing scale
  const SCALE = {
    VERY_SMALL: 0.6,
    MOBILE: 0.8,
    TABLET: 0.9,
    DESKTOP: 1.0
  };
  
  // Base dimensions (desktop reference)
  const BASE = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 400,
    BLOCK_WIDTH: 140,
    BLOCK_HEIGHT: 50,
    BLOCK_SPACING: 100,
    MARGIN: 50,
    PADDING: 20
  };
  
  // Determine screen size category
  const isVerySmall = screenSize.width < BREAKPOINTS.VERY_SMALL;
  const isMobile = screenSize.width >= BREAKPOINTS.VERY_SMALL && screenSize.width < BREAKPOINTS.MOBILE;
  const isTablet = screenSize.width >= BREAKPOINTS.MOBILE && screenSize.width < BREAKPOINTS.TABLET;
  const isDesktop = screenSize.width >= BREAKPOINTS.TABLET;
  
  // Get current scale factor
  const scale = isVerySmall ? SCALE.VERY_SMALL : 
                isMobile ? SCALE.MOBILE : 
                isTablet ? SCALE.TABLET : SCALE.DESKTOP;
  
  // Update canvas width when container is available
  useEffect(() => {
    const updateCanvasWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        console.log('🎯 Container width detected:', width);
        if (width > 0) {
          setCanvasWidth(width);
        }
      }
    };

    // Initial check
    updateCanvasWidth();

    // Use multiple attempts for mobile devices
    const timeoutIds = [
      setTimeout(updateCanvasWidth, 50),
      setTimeout(updateCanvasWidth, 100),
      setTimeout(updateCanvasWidth, 200),
      setTimeout(updateCanvasWidth, 500)
    ];

    // Also listen for resize events
    window.addEventListener('resize', updateCanvasWidth);

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      window.removeEventListener('resize', updateCanvasWidth);
    };
  }, [displayData]); // Re-run when displayData changes
  const canvasHeight = Math.max(
    BASE.CANVAS_HEIGHT * scale, 
    (displayData?.leftWords?.length || 3) * BASE.BLOCK_SPACING * scale + BASE.PADDING * 2
  );
  
  // Responsive block dimensions
  const blockWidth = BASE.BLOCK_WIDTH * scale;
  const blockHeight = BASE.BLOCK_HEIGHT * scale;
  const blockSpacing = BASE.BLOCK_SPACING * scale;
  
  // Responsive positioning
  const margin = BASE.MARGIN * scale;
  const minGap = 60 * scale; // Minimum gap between left and right blocks
  const leftBlockX = margin;
  
  // Debug logging for mobile issues
  console.log('🎯 Mobile Debug:', {
    screenWidth: screenSize.width,
    containerWidth: containerRef.current?.clientWidth,
    canvasWidth,
    scale,
    blockWidth,
    margin,
    leftBlockX,
    displayDataLoaded: !!displayData
  });
  
  // Check if blocks can fit side by side
  const minRequiredWidth = leftBlockX + blockWidth + 20 + blockWidth + margin;
  const canFitSideBySide = minRequiredWidth <= canvasWidth;
  
  // Keep right blocks inside canvas - constrained by parent container
  // Ensure right blocks never go outside the canvas
  let rightBlockX;
  let actualBlockWidth = blockWidth;
  let actualBlockHeight = blockHeight;
  
  if (canFitSideBySide) {
    // Normal side-by-side layout
    rightBlockX = Math.min(
      Math.max(
        leftBlockX + blockWidth + 20, // Minimum gap from left block
        canvasWidth - blockWidth - margin // Right edge with margin
      ),
      canvasWidth - blockWidth - margin // Never exceed right edge
    );
  } else {
    // Very small screen - make blocks smaller and ensure they fit
    const availableWidth = canvasWidth - margin * 2;
    const maxBlockWidth = Math.floor((availableWidth - 20) / 2); // Split available width between two blocks
    actualBlockWidth = Math.max(60, maxBlockWidth); // Minimum 60px width
    actualBlockHeight = Math.max(30, actualBlockHeight * (actualBlockWidth / blockWidth)); // Scale height proportionally
    
    rightBlockX = leftBlockX + actualBlockWidth + 20;
    
    console.log('🎯 Very small screen - adjusted block size:', {
      availableWidth,
      maxBlockWidth,
      actualBlockWidth,
      actualBlockHeight
    });
  }
  
  console.log('🎯 Right Block Position:', {
    rightBlockX,
    rightBlockRightEdge: rightBlockX + actualBlockWidth,
    canvasWidth,
    fits: (rightBlockX + actualBlockWidth) <= canvasWidth,
    canFitSideBySide,
    minRequiredWidth
  });
  
  const blockStartY = margin;
  
  // Abstract font sizes
  const FONT_SIZES = {
    DRAGGED_WORD: Math.max(8, 14 * scale),
    ORIGINAL_WORD: Math.max(10, 16 * scale),
    LEFT_WORD: Math.max(10, 14 * scale)
  };
  
  // Abstract stroke width
  const STROKE_WIDTH = Math.max(1, 3 * scale);
  const [studentArrows, setStudentArrows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);

  // Initialize test data
  useEffect(() => {
    if (testData) {
      setDisplayData(testData);
      setTestStartTime(new Date());
      
      // Restore progress if available
      if (user?.student_id) {
        const progressKey = `test_progress_${user.student_id}_word_matching_${testData.id}`;
        const savedProgress = getCachedData(progressKey);
        if (savedProgress) {
          setStudentAnswers(savedProgress.answers || {});
          setStudentArrows(savedProgress.arrows || []);
          setTestStartTime(new Date(savedProgress.startTime));
          console.log('🎯 Test progress restored:', savedProgress);
        }
      }
    }
  }, [testData, user?.student_id]);

  // Auto-save progress
  useEffect(() => {
    if (displayData && testStartTime && user?.student_id) {
      const interval = setInterval(() => {
        const progressData = {
          answers: studentAnswers,
          arrows: studentArrows,
          startTime: testStartTime.toISOString()
        };
        const progressKey = `test_progress_${user.student_id}_word_matching_${testData.id}`;
        setCachedData(progressKey, progressData, CACHE_TTL.test_progress);
        console.log('🎯 Progress auto-saved');
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [displayData, studentAnswers, studentArrows, testStartTime, user?.student_id, testData?.id]);

  // Handle word click for arrow mode
  const handleWordClick = useCallback((side, index) => {
    if (testData.interaction_type !== 'arrow') return;

    if (selectedWord) {
      if (selectedWord.side === side && selectedWord.index === index) {
        // Deselect if clicking the same word
        setSelectedWord(null);
      } else if (selectedWord.side !== side) {
        // Create arrow connection
        const newArrow = {
          id: Date.now().toString(),
          startWord: selectedWord,
          endWord: { side, index },
          color: '#3B82F6'
        };
        setStudentArrows(prev => [...prev, newArrow]);
        setStudentAnswers(prev => ({
          ...prev,
          [selectedWord.index]: index
        }));
        setSelectedWord(null);
      }
    } else {
      // Select word
      setSelectedWord({ side, index });
    }
  }, [selectedWord, testData?.interaction_type]);

  // Handle drag end for drag mode
  const handleDragEnd = useCallback((leftIndex, rightIndex) => {
    if (testData.interaction_type !== 'drag') return;

    setStudentAnswers(prev => ({
      ...prev,
      [leftIndex]: rightIndex
    }));
  }, [testData?.interaction_type]);

  // Handle reset
  const handleReset = useCallback(() => {
    setShowResetModal(true);
  }, []);

  // Confirm reset
  const confirmReset = useCallback(() => {
    setStudentAnswers({});
    setStudentArrows([]);
    setSelectedWord(null);
    setShowResetModal(false);
  }, []);

  // Handle back to cabinet
  const handleBackToCabinet = useCallback(() => {
    setShowBackModal(true);
  }, []);

  // Confirm back to cabinet
  const confirmBackToCabinet = useCallback(() => {
    setShowBackModal(false);
    if (onBackToCabinet) {
      onBackToCabinet();
    }
  }, [onBackToCabinet]);

  // Submit test
  const handleSubmitTest = useCallback(async () => {
    if (!displayData) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate score based on interaction type
      const totalPairs = displayData.leftWords.length;
      let correctMatches = 0;
      let finalAnswers = {};
      
      if (testData.interaction_type === 'drag') {
        // Drag mode scoring
        Object.entries(studentAnswers).forEach(([leftDisplayIndex, rightDisplayIndex]) => {
          const expectedRightIndex = displayData.correctPairs[leftDisplayIndex];
          if (rightDisplayIndex === expectedRightIndex) {
            correctMatches++;
          }
          finalAnswers[leftDisplayIndex] = rightDisplayIndex;
        });
      } else {
        // Arrow mode scoring
        studentArrows.forEach(arrow => {
          const leftIndex = arrow.startWord.side === 'left' ? arrow.startWord.index : arrow.endWord.index;
          const rightIndex = arrow.startWord.side === 'right' ? arrow.startWord.index : arrow.endWord.index;
          
          if (displayData.correctPairs[leftIndex] === rightIndex) {
            correctMatches++;
          }
          finalAnswers[leftIndex] = rightIndex;
        });
      }
      
      const score = correctMatches;
      const maxScore = totalPairs;
      
      console.log(`🎯 Final Score: ${score}/${maxScore} (${Math.round((score/maxScore)*100)}%)`);
      
      // Calculate timing
      const endTime = new Date();
      const timeTaken = testStartTime ? Math.round((endTime - testStartTime) / 1000) : 0;
      const startedAt = testStartTime ? testStartTime.toISOString() : endTime.toISOString();
      
      // Get anti-cheating data
      const cheatingData = getCheatingData();
      
      // Prepare submission data
      const submissionData = {
        test_id: testData.id,
        test_name: testData.test_name,
        teacher_id: testData.teacher_id || null,
        subject_id: testData.subject_id || null,
        student_id: user.student_id,
        interaction_type: testData.interaction_type,
        answers: finalAnswers,
        score: score,
        maxScore: maxScore,
        time_taken: timeTaken,
        started_at: startedAt,
        submitted_at: endTime.toISOString(),
        caught_cheating: cheatingData.caught_cheating,
        visibility_change_times: cheatingData.visibility_change_times
      };
      
      console.log('🎯 Submission data being sent:', submissionData);
      console.log('🎯 TestData structure:', testData);
      
      // Submit test results
      console.log('🎯 Submitting test results...');
      const response = await makeAuthenticatedRequest('/.netlify/functions/submit-word-matching-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      console.log('🎯 Submission response received:', response.status);
      
      const result = await response.json();
      
      if (result.success) {
        // Clear data and cache
        stopTracking();
        clearData();
        
        if (user?.student_id) {
          const completionKey = `test_completed_${user.student_id}_word_matching_${testData.id}`;
          localStorage.setItem(completionKey, 'true');
          console.log('✅ Test marked as completed in localStorage:', completionKey);
          
          // Clear test progress and anti-cheating data after submission
          clearTestData(user.student_id, 'word_matching', testData.id);
          console.log('🎓 Test data cleared from cache');
          
          // Cache the test results immediately after successful submission (following other tests pattern)
          const cacheKey = `student_results_table_${user.student_id}`;
          setCachedData(cacheKey, result, CACHE_TTL.student_results_table);
          console.log('🎓 Test results cached with key:', cacheKey);
        }
        
        // Navigate back to student cabinet with score
        setTimeout(() => {
          if (onTestComplete) {
            onTestComplete(score);
          }
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to submit test');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [displayData, studentAnswers, studentArrows, testData, user, testStartTime, getCheatingData, stopTracking, clearData, makeAuthenticatedRequest, onTestComplete]);

  if (!displayData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-600 font-semibold text-lg">Submitting test...</p>
            <p className="text-gray-500 text-sm mt-1">Please wait while we process your results</p>
          </div>
        </div>
      )}
      {/* Test Header */}
      <Card className="mb-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{testData.test_name}</h2>
          <p className="text-gray-600">
            {testData.interaction_type === 'drag' 
              ? 'Drag words from left to right to match them' 
              : 'Click on the word or phrase on the left, then click on the matching word or phrase on the right to connect them'
            }
          </p>
        </div>
      </Card>

      {/* Test Content */}
      {testData.interaction_type === 'drag' ? (
        // Drag Mode with Konva
        <Card className="mb-6">
          <div 
            ref={containerRef}
            className="relative w-full"
          >
            <Stage 
              width={canvasWidth} 
              height={canvasHeight}
              className={`border-2 border-gray-200 rounded-lg ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
            >
              <Layer>
                {/* Left Words - Draggable */}
                {displayData.leftWords.map((word, index) => {
                  const isDragged = studentAnswers[index] !== undefined;
                  const y = blockStartY + index * blockSpacing;
                  
                  return (
                    <Group
                      key={`left-${index}`}
                      x={leftBlockX}
                      y={y}
                      draggable={!isDragged}
                      onDragStart={(e) => {
                        // Bring to front when dragging starts
                        e.target.moveToTop();
                      }}
                      onDragEnd={(e) => {
                        const stage = e.target.getStage();
                        const rightWords = displayData.rightWords;
                        const rightWordWidth = actualBlockWidth + 60; // Responsive drop zone width
                        const rightWordHeight = actualBlockHeight + 30; // Responsive drop zone height
                        const rightStartX = rightBlockX - 30; // Responsive drop zone position (already calculated from right edge)
                        const rightStartY = blockStartY - 15; // Responsive drop zone position
                        
                        console.log('🎯 Drop detection - Word dropped at:', e.target.x(), e.target.y());
                        
                        // Check if dropped on any right word
                        for (let rightIndex = 0; rightIndex < rightWords.length; rightIndex++) {
                          const rightY = rightStartY + rightIndex * blockSpacing;
                          const dropZoneLeft = rightStartX;
                          const dropZoneRight = rightStartX + rightWordWidth;
                          const dropZoneTop = rightY;
                          const dropZoneBottom = rightY + rightWordHeight;
                          
                          console.log(`🎯 Checking drop zone ${rightIndex}:`, {
                            left: dropZoneLeft,
                            right: dropZoneRight,
                            top: dropZoneTop,
                            bottom: dropZoneBottom,
                            word: rightWords[rightIndex]
                          });
                          
                          if (
                            e.target.x() >= dropZoneLeft &&
                            e.target.x() <= dropZoneRight &&
                            e.target.y() >= dropZoneTop &&
                            e.target.y() <= dropZoneBottom
                          ) {
                            // Match found!
                            console.log(`✅ Match found! Word "${displayData.leftWords[index]}" matched with "${rightWords[rightIndex]}"`);
                            setStudentAnswers(prev => ({
                              ...prev,
                              [index]: rightIndex
                            }));
                            break;
                          }
                        }
                        
                        // Reset position if not dropped on target
                        console.log('❌ No match found, resetting position');
                        e.target.position({ x: leftBlockX, y: y });
                      }}
                    >
                      <Rect
                        width={actualBlockWidth}
                        height={actualBlockHeight}
                        fill={isDragged ? '#e5e7eb' : '#3b82f6'}
                        stroke={isDragged ? '#9ca3af' : '#1d4ed8'}
                        strokeWidth={2}
                        cornerRadius={8}
                        opacity={isDragged ? 0.5 : 1}
                      />
                      <Text
                        text={word}
                        x={actualBlockWidth / 2} // Center horizontally
                        y={actualBlockHeight / 2} // Center vertically
                        fontSize={FONT_SIZES.LEFT_WORD}
                        fontFamily="Arial"
                        fill={isDragged ? '#dc2626' : 'white'} // Red color when dragged
                        align="center"
                        verticalAlign="middle"
                        width={actualBlockWidth}
                        offsetX={actualBlockWidth / 2} // Center horizontally
                        offsetY={actualBlockHeight / 2} // Center vertically
                        wrap="word"
                        ellipsis={true}
                        listening={false}
                      />
                    </Group>
                  );
                })}
                
                {/* Right Words - Drop Targets */}
                {displayData.rightWords.map((word, index) => {
                  const y = blockStartY + index * blockSpacing;
                  const matchedLeftIndex = Object.keys(studentAnswers).find(
                    leftIndex => studentAnswers[leftIndex] === index
                  );
                  
                  return (
                    <Group key={`right-${index}`} x={rightBlockX} y={y}>
                      <Rect
                        width={actualBlockWidth}
                        height={actualBlockHeight}
                        fill={matchedLeftIndex ? '#10b981' : '#f3f4f6'}
                        stroke={matchedLeftIndex ? '#059669' : '#d1d5db'}
                        strokeWidth={2}
                        cornerRadius={8}
                      />
                      <Text
                        text={word}
                        x={actualBlockWidth / 2} // Center horizontally
                        y={actualBlockHeight / 2} // Center vertically
                        fontSize={FONT_SIZES.ORIGINAL_WORD} // Responsive font size
                        fontFamily="Arial"
                        fill="#000000" // Always black for right block words
                        align="center"
                        verticalAlign="middle"
                        width={actualBlockWidth}
                        offsetX={actualBlockWidth / 2} // Center horizontally
                        offsetY={actualBlockHeight / 2} // Center vertically
                        wrap="word"
                        ellipsis={true}
                        listening={false}
                      />
                      {/* Show matched word if any */}
                      {matchedLeftIndex && (
                        <Text
                          text={displayData.leftWords[matchedLeftIndex]}
                          x={blockWidth / 2} // Center horizontally
                          y={blockHeight / 4} // Positioned higher for spacing
                          fontSize={FONT_SIZES.DRAGGED_WORD} // Responsive font size
                          fontFamily="Arial"
                          fill="#dc2626" // Red for dragged word
                          align="center"
                          verticalAlign="middle"
                          width={actualBlockWidth}
                          offsetX={actualBlockWidth / 2} // Center horizontally
                          offsetY={actualBlockHeight / 8} // Center vertically
                          wrap="word"
                          ellipsis={true}
                        />
                      )}
                    </Group>
                  );
                })}
                
              </Layer>
            </Stage>
          </div>
        </Card>
      ) : (
        // Arrow Mode with Konva
        <Card className="mb-6">
          <div 
            ref={containerRef}
            className="relative w-full"
          >
            <Stage 
              width={canvasWidth} 
              height={canvasHeight}
              className={`border-2 border-gray-200 rounded-lg ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
            >
              <Layer>
                {/* Left Words - Clickable */}
                {displayData.leftWords.map((word, index) => {
                  const y = blockStartY + index * blockSpacing;
                  const isSelected = selectedWord?.side === 'left' && selectedWord?.index === index;
                  
                  return (
                    <Group
                      key={`left-${index}`}
                      x={leftBlockX}
                      y={y}
                      onClick={() => handleWordClick('left', index)}
                    >
                      <Rect
                        width={actualBlockWidth}
                        height={actualBlockHeight}
                        fill={isSelected ? '#3b82f6' : '#f3f4f6'}
                        stroke={isSelected ? '#1d4ed8' : '#d1d5db'}
                        strokeWidth={isSelected ? 3 : 2}
                        cornerRadius={8}
                      />
                      <Text
                        text={word}
                        x={blockWidth / 2} // Center horizontally
                        y={blockHeight / 2} // Center vertically
                        fontSize={FONT_SIZES.LEFT_WORD} // Responsive font size
                        fontFamily="Arial"
                        fill={isSelected ? 'white' : '#374151'}
                        align="center"
                        verticalAlign="middle"
                        width={actualBlockWidth}
                        offsetX={actualBlockWidth / 2} // Center horizontally
                        offsetY={actualBlockHeight / 2} // Center vertically
                        wrap="word"
                        ellipsis={true}
                        listening={false}
                      />
                    </Group>
                  );
                })}
                
                {/* Right Words - Clickable */}
                {displayData.rightWords.map((word, index) => {
                  const y = blockStartY + index * blockSpacing;
                  const isSelected = selectedWord?.side === 'right' && selectedWord?.index === index;
                  
                  return (
                    <Group
                      key={`right-${index}`}
                      x={rightBlockX}
                      y={y}
                      onClick={() => handleWordClick('right', index)}
                    >
                      <Rect
                        width={actualBlockWidth}
                        height={actualBlockHeight}
                        fill={isSelected ? '#3b82f6' : '#f3f4f6'}
                        stroke={isSelected ? '#1d4ed8' : '#d1d5db'}
                        strokeWidth={isSelected ? 3 : 2}
                        cornerRadius={8}
                      />
                      <Text
                        text={word}
                        x={blockWidth / 2} // Center horizontally
                        y={blockHeight / 2} // Center vertically
                        fontSize={FONT_SIZES.ORIGINAL_WORD} // Responsive font size
                        fontFamily="Arial"
                        fill="#000000" // Always black for right block words
                        align="center"
                        verticalAlign="middle"
                        width={actualBlockWidth}
                        offsetX={actualBlockWidth / 2} // Center horizontally
                        offsetY={actualBlockHeight / 2} // Center vertically
                        wrap="word"
                        ellipsis={true}
                        listening={false}
                      />
                    </Group>
                  );
                })}
                
                {/* Draw arrows between selected words */}
                {studentArrows.map((arrow, arrowIndex) => {
                  const startY = blockStartY + arrow.startWord.index * blockSpacing + blockHeight / 2;
                  const endY = blockStartY + arrow.endWord.index * blockSpacing + blockHeight / 2;
                  
                  return (
                    <Line
                      key={arrowIndex}
                      points={[leftBlockX + blockWidth + 20, startY, rightBlockX - 20, endY]} // Responsive arrow positioning
                      stroke={arrow.color || '#3b82f6'}
                      strokeWidth={STROKE_WIDTH} // Responsive stroke width
                      lineCap="round"
                      lineJoin="round"
                    />
                  );
                })}
                
              </Layer>
            </Stage>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <div className={`submit-section flex justify-center space-x-4 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button
            onClick={handleBackToCabinet}
            variant="outline"
            disabled={isSubmitting}
          >
            Back to Cabinet
          </Button>
          <Button
            onClick={handleSubmitTest}
            disabled={isSubmitting}
            className="px-8"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Test'
            )}
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      <PerfectModal
        isOpen={showResetModal && !isSubmitting}
        onClose={() => setShowResetModal(false)}
        title="Reset Test"
        size="small"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Are you sure you want to reset? This will clear all your progress and answers.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setShowResetModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReset}
              variant="primary"
            >
              Reset
            </Button>
          </div>
        </div>
      </PerfectModal>

      {/* Back to Cabinet Confirmation Modal */}
      <PerfectModal
        isOpen={showBackModal && !isSubmitting}
        onClose={() => setShowBackModal(false)}
        title="Exit Test"
        size="small"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Are you sure you want to leave the test? Your progress will be saved.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setShowBackModal(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBackToCabinet}
              variant="primary"
            >
              Leave
            </Button>
          </div>
        </div>
      </PerfectModal>
    </motion.div>
  );
};

export default WordMatchingStudent;
