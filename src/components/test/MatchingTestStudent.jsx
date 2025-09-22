import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { clearTestData } from '@/utils/cacheUtils';

// ✅ REUSE EXISTING COMPONENTS
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import PerfectModal from '../ui/PerfectModal';
import { Notification, useNotification } from '../ui/Notification';

// ✅ REUSE EXISTING HOOKS
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { useAntiCheating } from '../../hooks/useAntiCheating';

// ✅ REUSE EXISTING UTILITIES
import { calculateScore, formatScore } from '../../utils/scoreCalculation';
import { coordinateUtils } from '../../utils/coordinateUtils';

const MatchingTestStudent = ({
  testData,
  onTestComplete,
  onBackToCabinet,
  isTestComplete = false,
  testScore = null
}) => {
  // Dynamic imports for Konva components to avoid loading them when not needed
  const [KonvaComponents, setKonvaComponents] = useState(null);
  const [Konva, setKonva] = useState(null);
  
  useEffect(() => {
    // Only load Konva when this component is actually rendered
    const loadKonva = async () => {
      try {
        const [konvaComponents, konva] = await Promise.all([
          import('react-konva'),
          import('konva')
        ]);
        setKonvaComponents(konvaComponents);
        setKonva(konva.default);
      } catch (error) {
        console.error('Failed to load Konva:', error);
      }
    };
    
    loadKonva();
  }, []);
  
  // Helper function to get Konva components
  const getKonvaComponents = () => {
    if (!KonvaComponents) return null;
    return {
      Stage: KonvaComponents.Stage,
      Layer: KonvaComponents.Layer,
      Rect: KonvaComponents.Rect,
      Arrow: KonvaComponents.Arrow,
      KonvaImage: KonvaComponents.Image,
      KonvaText: KonvaComponents.Text,
      Group: KonvaComponents.Group
    };
  };
  
  const [wordPositions, setWordPositions] = useState({});
  const [placedWords, setPlacedWords] = useState({});
  const [testProgress, setTestProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);
  const [originalImageWidth, setOriginalImageWidth] = useState(0);
  const [originalImageHeight, setOriginalImageHeight] = useState(0);
  const [hoverBlockId, setHoverBlockId] = useState(null);
  const [testStartTime, setTestStartTime] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  
  const { showNotification } = useNotification();
  const { makeAuthenticatedRequest } = useApi();
  const { user } = useAuth();
  
  // Anti-cheating tracking
  const { startTracking, stopTracking, getCheatingData, clearData } = useAntiCheating(
    'matching_type', 
    testData?.id,
    user?.student_id || user?.id
  );
  
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const stageWidthRef = useRef(0);
  const [stageHeight, setStageHeight] = useState(400);
  const dragStartPositionsRef = useRef({});

  // Reset words and placements
  const handleReset = useCallback(() => {
    setShowResetModal(true);
  }, []);

  // Confirm reset
  const confirmReset = useCallback(() => {
    setPlacedWords({});
    setWordPositions({});
    setShowResetModal(false);
    // stage height will recompute via effect
  }, []);

  // Handle back to cabinet with confirmation
  const handleBackToCabinet = useCallback(() => {
    setShowBackModal(true);
  }, []);

  // Confirm back to cabinet
  const confirmBackToCabinet = useCallback(() => {
    setShowBackModal(false);
    onBackToCabinet();
  }, [onBackToCabinet]);

  // Process test data exactly like legacy
  const processedData = useMemo(() => {
    if (!testData) return null;

    // Process blocks exactly like legacy
    const blocks = testData.blocks.map(block => {
      // Parse coordinates if needed (same as legacy)
      let coordinates = block.coordinates;
      if (typeof coordinates === 'string') {
        try {
          coordinates = JSON.parse(coordinates);
        } catch (e) {
          console.error('❌ Failed to parse coordinates:', e);
          coordinates = { x: 0, y: 0, width: 100, height: 100 };
        }
      }
      // Normalize coordinate values to numbers with sane fallbacks
      coordinates = {
        x: (typeof coordinates.x === 'number' ? coordinates.x : Number(coordinates.x)) || 0,
        y: (typeof coordinates.y === 'number' ? coordinates.y : Number(coordinates.y)) || 0,
        width: (typeof coordinates.width === 'number' ? coordinates.width : Number(coordinates.width)) || 30,
        height: (typeof coordinates.height === 'number' ? coordinates.height : Number(coordinates.height)) || 10
      };
      
      return {
        id: block.id,
        word: block.word,
        coordinates: coordinates,
        hasArrow: block.hasArrow,
        arrow: block.arrow
      };
    });

    // Use arrows directly (already processed in MatchingTestPage)
    const arrows = Array.isArray(testData.arrows) ? testData.arrows : [];

    // Process words exactly like legacy
    const words = testData.words.map(word => ({
      id: word.id,
      word: word.word,
      blockId: null,
      isPlaced: false,
      isCorrect: false
    }));

    return { blocks, arrows, words };
  }, [testData]);

  // Load and process image exactly like legacy
  useEffect(() => {
    if (!testData?.image_url) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    
    image.onload = () => {
      console.log('🖼️ Image loaded successfully');
      
      // Store original dimensions
      setOriginalImageWidth(image.width);
      setOriginalImageHeight(image.height);
      
      // Calculate image position and scale (exactly like legacy)
      const containerWidth = containerRef.current?.clientWidth || 800;
      const containerHeight = containerRef.current?.clientHeight || 600;
      
      const scaleX = containerWidth / image.width;
      const scaleY = containerHeight / image.height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
      
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      
      const x = (containerWidth - scaledWidth) / 2;
      const y = (containerHeight - scaledHeight) / 2;
      
      setImageInfo({
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
        scaleX: scale,
        scaleY: scale,
        scale: scale,
        image: image
      });
      
      // cache stage width for layouting words
      stageWidthRef.current = containerRef.current?.clientWidth || 800;
      console.log('🔍 Image info calculated:', {
        x, y, width: scaledWidth, height: scaledHeight, scaleX: scale, scaleY: scale
      });
    };
    
    image.onerror = () => {
      console.error('❌ Failed to load image');
      showNotification('Failed to load test image', 'error');
    };
    
    image.src = testData.image_url;
  }, [testData?.image_url, showNotification]);

  // Initialize word positions BELOW the image, inside the canvas, with wrapping
  useEffect(() => {
    if (!processedData || !imageInfo) return;
    const stageWidth = stageWidthRef.current || (containerRef.current?.clientWidth || 800);
    const margin = 12;
    const lineHeight = 38; // match word rect height + spacing
    let cursorX = imageInfo.x;
    let cursorY = imageInfo.y + imageInfo.height + margin;
    const rightEdge = imageInfo.x + imageInfo.width;
    const newPositions = {};
    processedData.words.forEach((word) => {
      if (!Object.prototype.hasOwnProperty.call(placedWords, word.id)) {
        const textValue = typeof word.word === 'string' ? word.word : '';
        const boxWidth = Math.max(60, textValue.length * 8 + 20);
        // wrap to next line if needed
        if (cursorX + boxWidth > Math.min(stageWidth - margin, rightEdge)) {
          cursorX = imageInfo.x;
          cursorY += lineHeight;
        }
        // only assign if not already set to preserve initial drags
        if (!wordPositions[word.id]) {
          newPositions[word.id] = { x: cursorX, y: cursorY };
        }
        cursorX += boxWidth + margin;
      }
    });
    if (Object.keys(newPositions).length) {
      setWordPositions(prev => ({ ...prev, ...newPositions }));
    }
    // Compute required stage height to fit image and words
    const maxWordY = Object.values(newPositions).reduce((m, p) => Math.max(m, p.y), cursorY);
    const required = Math.max(imageInfo.y + imageInfo.height + margin, maxWordY + lineHeight + margin);
    setStageHeight(Math.max(400, Math.ceil(required)));
  }, [processedData, imageInfo, placedWords, wordPositions]);

  // Render blocks exactly like legacy
  const renderBlocks = useCallback(() => {
    if (!imageInfo || !processedData) return [];
    
    const components = getKonvaComponents();
    if (!components) return [];

    return processedData.blocks.map(block => {
      const coordinates = block.coordinates;
      
      // Calculate block position using same logic as legacy
      let blockX, blockY, blockWidth, blockHeight;
      
      // Use absolute coordinates with unified scale
      blockX = imageInfo.x + (coordinates.x * (imageInfo.scale ?? imageInfo.scaleX));
      blockY = imageInfo.y + (coordinates.y * (imageInfo.scale ?? imageInfo.scaleY));
      blockWidth = coordinates.width * (imageInfo.scale ?? imageInfo.scaleX);
      blockHeight = coordinates.height * (imageInfo.scale ?? imageInfo.scaleY);
      
      const placedWordId = placedWords[block.id];
      
      return (
        <components.Group key={block.id}>
          <components.Rect
            x={blockX}
            y={blockY}
            width={blockWidth}
            height={blockHeight}
            fill={placedWordId ? "rgba(40, 167, 69, 0.4)" : (hoverBlockId === block.id ? "rgba(0, 123, 255, 0.25)" : "rgba(0, 123, 255, 0.15)")}
            stroke={placedWordId ? "#28a745" : (hoverBlockId === block.id ? "#0056b3" : "#007bff")}
            strokeWidth={2}
            cornerRadius={6}
            shadowColor={placedWordId ? "rgba(40, 167, 69, 0.3)" : "rgba(0, 123, 255, 0.3)"}
            shadowBlur={10}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={0.5}
          />
          
          {/* Show word text inside block when placed (like legacy) */}
          {placedWordId && (
            <components.KonvaText
              x={blockX + 5}
              y={blockY + (blockHeight / 2) - 10}
              width={blockWidth - 10}
              height={20}
              text={processedData.words.find(w => w.id === placedWordId)?.word || ''}
              fontSize={Math.min(12, blockWidth / 8)}
              fontFamily="Arial"
              fill="#2c3e50"
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          )}
        </components.Group>
      );
    });
  }, [imageInfo, processedData, placedWords, KonvaComponents]);

  // Render arrows exactly like legacy
  const renderArrows = useCallback(() => {
    if (!imageInfo || !processedData) return [];
    
    const components = getKonvaComponents();
    if (!components) return [];

    console.log('🔍 Processing arrows:', processedData.arrows);

    return processedData.arrows.map(arrow => {
      console.log('🔍 Arrow data:', arrow);
      
      // Check if arrow has proper structure
      if (!arrow.start || !arrow.end) {
        console.warn('⚠️ Arrow missing start/end coordinates:', arrow);
        return null;
      }
      
      // Prefer relative coordinates when available for best alignment
      let startX, startY, endX, endY;
      if (
        arrow.rel_start_x !== null && arrow.rel_start_y !== null &&
        arrow.rel_end_x !== null && arrow.rel_end_y !== null &&
        arrow.image_width && arrow.image_height &&
        arrow.image_width > 0 && arrow.image_height > 0
      ) {
        const origW = arrow.image_width;
        const origH = arrow.image_height;
        const scaleX = imageInfo.width / origW;
        const scaleY = imageInfo.height / origH;
        startX = imageInfo.x + (Number(arrow.rel_start_x) / 100) * origW * scaleX;
        startY = imageInfo.y + (Number(arrow.rel_start_y) / 100) * origH * scaleY;
        endX = imageInfo.x + (Number(arrow.rel_end_x) / 100) * origW * scaleX;
        endY = imageInfo.y + (Number(arrow.rel_end_y) / 100) * origH * scaleY;
      } else {
        // Fallback to absolute coordinates. Detect whether values are in original px or already canvas-scaled.
        const scale = imageInfo.scale ?? imageInfo.scaleX ?? 1;
        const sx = Number(arrow.start.x);
        const sy = Number(arrow.start.y);
        const ex = Number(arrow.end.x);
        const ey = Number(arrow.end.y);

        const inCanvasSpace = (
          sx <= imageInfo.width + 1 && ex <= imageInfo.width + 1 &&
          sy <= imageInfo.height + 1 && ey <= imageInfo.height + 1
        );

        if (inCanvasSpace) {
          // Coordinates are already in canvas space → don't rescale, just offset by image position
          startX = imageInfo.x + (isNaN(sx) ? 0 : sx);
          startY = imageInfo.y + (isNaN(sy) ? 0 : sy);
          endX = imageInfo.x + (isNaN(ex) ? 0 : ex);
          endY = imageInfo.y + (isNaN(ey) ? 0 : ey);
        } else {
          // Coordinates are in original image space → apply scale
          startX = imageInfo.x + ((isNaN(sx) ? 0 : sx) * scale);
          startY = imageInfo.y + ((isNaN(sy) ? 0 : sy) * scale);
          endX = imageInfo.x + ((isNaN(ex) ? 0 : ex) * scale);
          endY = imageInfo.y + ((isNaN(ey) ? 0 : ey) * scale);
        }
      }
      
      return (
        <components.Arrow
          key={arrow.id}
          points={[startX, startY, endX, endY]}
          stroke={arrow.style?.color || "#dc3545"}
          fill={arrow.style?.color || "#dc3545"}
          strokeWidth={arrow.style?.thickness || 3}
          pointerLength={10}
          pointerWidth={10}
        />
      );
    }).filter(Boolean); // Remove null arrows
  }, [imageInfo, processedData, KonvaComponents]);

  // Render words exactly like legacy
  const renderWords = useCallback(() => {
    if (!processedData) return [];
    
    const components = getKonvaComponents();
    if (!components) return [];

    return processedData.words.map(word => {
      const position = wordPositions[word.id] || { x: 0, y: 0 };
      const textValue = typeof word.word === 'string' ? word.word : '';
      const wordBoxWidth = Math.max(60, textValue.length * 8 + 20);
      const isPlaced = Object.values(placedWords).includes(word.id);
      
      // Don't render words that are already placed
      if (isPlaced) {
        return null;
      }
      return (
        <components.Group
          key={word.id}
          x={position.x}
          y={position.y}
          draggable={true}
          onDragEnd={(e) => handleWordDragEnd(e, word.id)}
        >
          <components.Rect
            width={wordBoxWidth}
            height={34}
            fill="#ffffff"
            stroke="#ced4da"
            strokeWidth={1}
            cornerRadius={4}
            shadowColor="rgba(0,0,0,0.1)"
            shadowBlur={5}
            shadowOffset={{ x: 0, y: 2 }}
            shadowOpacity={0.3}
            listening={true}
          />
          <components.KonvaText
            text={textValue}
            fontSize={14}
            fontFamily="Arial"
            fill="#343a40"
            padding={8}
            align="center"
            verticalAlign="middle"
            width={wordBoxWidth}
            height={34}
            listening={false}
          />
        </components.Group>
      );
    });
  }, [processedData, wordPositions, placedWords, imageInfo, KonvaComponents]);

  // Simplified drag end handler following react-konva pattern
  const handleWordDragEnd = useCallback((e, wordId) => {
    const wordX = e.target.x();
    const wordY = e.target.y();
    
    // Update position immediately
    setWordPositions(prev => ({ ...prev, [wordId]: { x: wordX, y: wordY } }));
    
    if (!imageInfo || !processedData) return;

    const word = processedData.words.find(w => w.id === wordId);
    if (!word) return;

    const textValue = typeof word.word === 'string' ? word.word : '';
    const wordBoxWidth = Math.max(60, textValue.length * 8 + 20);
    const wordRect = { x: wordX, y: wordY, width: wordBoxWidth, height: 34 };

    const scale = imageInfo.scale ?? imageInfo.scaleX ?? 1;
    const rectsOverlap = (r1, r2) => !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );

    const targetBlock = processedData.blocks.find(block => {
      const c = block.coordinates;
      const blockRect = {
        x: imageInfo.x + (c.x * scale),
        y: imageInfo.y + (c.y * scale),
        width: c.width * scale,
        height: c.height * scale
      };
      return rectsOverlap(wordRect, blockRect);
    });

    if (targetBlock) {
      setPlacedWords(prev => ({ ...prev, [targetBlock.id]: wordId }));

      // Center the word in the target block
      const c = targetBlock.coordinates;
      const blockX = imageInfo.x + (c.x * scale);
      const blockY = imageInfo.y + (c.y * scale);
      const blockWidth = c.width * scale;
      const blockHeight = c.height * scale;

      setWordPositions(prev => ({
        ...prev,
        [wordId]: {
          x: blockX + (blockWidth - wordBoxWidth) / 2,
          y: blockY + (blockHeight - 34) / 2
        }
      }));
      showNotification(`Word "${word.word}" placed in block`, 'success');
    }
  }, [imageInfo, processedData, showNotification]);

  // Calculate progress (like legacy)
  const calculateProgress = useCallback(() => {
    if (!processedData) return 0;
    
    const totalWords = processedData.words.length;
    const placedCount = Object.keys(placedWords).length;
    
    return totalWords > 0 ? (placedCount / totalWords) * 100 : 0;
  }, [processedData, placedWords]);

  // Update progress
  useEffect(() => {
    const progress = calculateProgress();
    setTestProgress(progress);
  }, [calculateProgress]);

  // Start test timer when component mounts
  useEffect(() => {
    if (testData && !testStartTime) {
      const startTime = new Date();
      setTestStartTime(startTime);
      console.log('⏱️ Test timer started at:', startTime.toISOString());
      
      // Start anti-cheating tracking
      startTracking();
      console.log('🛡️ Anti-cheating tracking started');
    }
  }, [testData, testStartTime, startTracking]);

  // Handle test submission (like legacy)
  const handleSubmitTest = useCallback(async () => {
    if (!processedData) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate score by checking if words are in correct blocks
      const totalWords = processedData.words.length;
      let correctPlacements = 0;
      
      // Check each block to see if the correct word is placed in it
      console.log('🔍 Scoring check - placedWords:', placedWords);
      console.log('🔍 Scoring check - blocks:', processedData.blocks.map(b => ({ id: b.id, word: b.word })));
      console.log('🔍 Scoring check - words:', processedData.words.map(w => ({ id: w.id, word: w.word })));
      
      processedData.blocks.forEach(block => {
        const placedWordId = placedWords[block.id];
        console.log(`🔍 Block ${block.id} (expects "${block.word}") has placed word ID: ${placedWordId}`);
        
        if (placedWordId) {
          // Find the word that was placed in this block
          const placedWord = processedData.words.find(word => word.id === placedWordId);
          console.log(`🔍 Placed word:`, placedWord);
          
          if (placedWord && placedWord.word === block.word) {
            correctPlacements++;
            console.log(`✅ Correct! Block ${block.id} has correct word "${placedWord.word}"`);
          } else {
            console.log(`❌ Incorrect! Block ${block.id} expected "${block.word}" but got "${placedWord?.word || 'nothing'}"`);
          }
        } else {
          console.log(`❌ Block ${block.id} has no word placed`);
        }
      });
      
      const score = correctPlacements;
      const maxScore = totalWords;
      
      console.log(`🎯 Final Score: ${score}/${maxScore} (${Math.round((score/maxScore)*100)}%)`);
      
      // Calculate timing
      const endTime = new Date();
      const timeTaken = testStartTime ? Math.round((endTime - testStartTime) / 1000) : 0; // in seconds
      const startedAt = testStartTime ? testStartTime.toISOString() : endTime.toISOString();
      
      console.log('⏱️ Test timing:', {
        startedAt,
        endTime: endTime.toISOString(),
        timeTaken: `${timeTaken} seconds`
      });
      
      // Get anti-cheating data
      const cheatingData = getCheatingData();
      console.log('🛡️ Anti-cheating data for submission:', cheatingData);
      
      // Prepare submission data
      const submissionData = {
        test_id: testData.id,
        test_name: testData.test_name,
        teacher_id: testData.teacher_id || null,
        subject_id: testData.subject_id || null,
        student_id: user.student_id,
        answers: placedWords,
        score: score,
        maxScore: maxScore,
        time_taken: timeTaken,
        started_at: startedAt,
        submitted_at: endTime.toISOString(),
        // Add anti-cheating data
        caught_cheating: cheatingData.caught_cheating,
        visibility_change_times: cheatingData.visibility_change_times
      };
      
      
      // Submit test results
      console.log('🔍 Submitting test data:', submissionData);
      const response = await makeAuthenticatedRequest('/.netlify/functions/submit-matching-type-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      
      const result = await response.json();
      console.log('🔍 Submission response:', result);
      
      if (result.success) {
        showNotification('Test submitted successfully!', 'success');
        
        // Clear anti-cheating data
        stopTracking();
        clearData();
        
        // Clear test data from cache
        if (user?.student_id) {
          clearTestData(user.student_id, 'matching_type', testData.id);
        }
        
        // Mark test as completed in localStorage
        if (user?.student_id) {
          const completionKey = `test_completed_${user.student_id}_matching_type_${testData.id}`;
          localStorage.setItem(completionKey, 'true');
          console.log('✅ Test marked as completed in localStorage:', completionKey);
        }
        
        // Cache the test results immediately after successful submission (following other tests pattern)
        if (user?.student_id) {
          const { setCachedData, CACHE_TTL } = await import('@/utils/cacheUtils');
          const cacheKey = `student_results_table_${user.student_id}`;
          setCachedData(cacheKey, result, CACHE_TTL.student_results_table);
          console.log('🎓 Test results cached with key:', cacheKey);
        }
        
        if (onTestComplete) {
          onTestComplete(score);
        }
      } else {
        throw new Error(result.message || 'Failed to submit test');
      }
    } catch (error) {
      console.error('❌ Error submitting test:', error);
      showNotification(`Error submitting test: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [processedData, placedWords, testData, user, testStartTime, makeAuthenticatedRequest, showNotification, onTestComplete]);

  if (!testData || !processedData) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{testData.test_name}</h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-2xl font-bold text-blue-600">{Math.round(testProgress)}%</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${testProgress}%` }}
            />
          </div>
        </div>

        {/* Test Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Single responsive canvas area (words inside canvas) */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              {/* Reset and Back Buttons - above image */}
              <div className="mb-4 text-center space-x-4">
                <Button
                  onClick={handleReset}
                  variant="secondary"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleBackToCabinet}
                  variant="secondary"
                >
                  Back to Cabinet
                </Button>
              </div>
              <div 
                ref={containerRef}
                className="w-full bg-gray-100 rounded-lg overflow-hidden"
                style={{ height: `${stageHeight}px` }}
              >
                {imageInfo && KonvaComponents ? (
                  (() => {
                    const { Stage, Layer, KonvaImage } = getKonvaComponents();
                    return (
                      <Stage
                        ref={stageRef}
                        width={containerRef.current?.clientWidth || 800}
                        height={stageHeight}
                      >
                        {/* Base layer: image, blocks, arrows */}
                        <Layer>
                          {/* Background Image */}
                          <KonvaImage
                            ref={imageRef}
                            image={imageInfo.image}
                            x={imageInfo.x}
                            y={imageInfo.y}
                            width={imageInfo.width}
                            height={imageInfo.height}
                            listening={false}
                          />
                          
                          {/* Blocks */}
                          {renderBlocks()}
                          
                          {/* Arrows */}
                          {renderArrows()}
                        </Layer>

                        {/* Top layer: draggable words */}
                        <Layer listening={true}>
                          {renderWords()}
                        </Layer>
                      </Stage>
                    );
                  })()
                ) : imageInfo ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner size="lg" />
                    <span className="ml-2 text-gray-600">Loading Konva canvas...</span>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 text-center">
                <Button
                  onClick={handleSubmitTest}
                  disabled={isSubmitting || testProgress < 100}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Test'}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        <PerfectModal
          isOpen={showResetModal}
          onClose={() => setShowResetModal(false)}
          title="Reset Test"
          size="small"
        >
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset? This will clear all your progress and placed words.
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
          isOpen={showBackModal}
          onClose={() => setShowBackModal(false)}
          title="Exit Test"
          size="small"
        >
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Are you sure you want to go back to cabinet? Your progress will be saved but you will exit the test.
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
                Go Back
              </Button>
            </div>
          </div>
        </PerfectModal>

      </div>
    </div>
  );
};

export default MatchingTestStudent;