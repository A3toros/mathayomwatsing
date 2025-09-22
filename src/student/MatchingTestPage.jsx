import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import { useAntiCheating } from '../hooks/useAntiCheating';
import { useNotification } from '../components/ui/Notification';
import MatchingTestStudent from '../components/test/MatchingTestStudent';
import TestResults from '../components/test/TestResults';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Card from '../components/ui/Card';

const MatchingTestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { makeAuthenticatedRequest } = useApi();
  const { showNotification } = useNotification();
  
  const [testData, setTestData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Anti-cheating tracking
  const { startTracking, stopTracking, getCheatingData, clearData } = useAntiCheating(
    'matching_type', 
    testData?.id
  );

  // Check if test is already completed
  const checkTestCompleted = useCallback(() => {
    if (!user?.student_id || !testId) return false;
    
    const completionKey = `test_completed_${user.student_id}_matching_type_${testId}`;
    const isCompleted = localStorage.getItem(completionKey) === 'true';
    
    if (isCompleted) {
      console.log('🎓 Test already completed, redirecting to cabinet');
      showNotification('This test has already been completed', 'info');
      navigate('/student');
      return true;
    }
    
    return false;
  }, [user?.student_id, testId, navigate, showNotification]);

  // Load test data
  const loadTestData = useCallback(async () => {
    if (!testId) {
      setError('Test ID is required');
      setIsLoading(false);
      return;
    }

    // Check if test is already completed first
    if (checkTestCompleted()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load test information using get-matching-type-test function
      const testResponse = await makeAuthenticatedRequest(`/.netlify/functions/get-matching-type-test?test_id=${testId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!testResponse.ok) {
        throw new Error('Failed to load test data');
      }

      const testResult = await testResponse.json();
      
      if (!testResult.success) {
        throw new Error(testResult.message || 'Failed to load test');
      }

      const test = testResult.data;
      console.log('🔍 Test data from get-matching-type-test:', test);
      
      // Load test questions (blocks) using GET method
      const questionsResponse = await makeAuthenticatedRequest(`/.netlify/functions/get-test-questions?test_id=${testId}&test_type=matching_type`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!questionsResponse.ok) {
        throw new Error('Failed to load test questions');
      }

      const questionsResult = await questionsResponse.json();
      
      if (!questionsResult.success) {
        throw new Error(questionsResult.message || 'Failed to load test questions');
      }

      console.log('🔍 Questions data from get-test-questions:', questionsResult);

      // Process test data for the component (matching legacy structure)
      const processedTestData = {
        id: test.test_id,
        test_name: test.test_name,
        teacher_id: test.teacher_id,
        subject_id: test.subject_id,
        image_url: test.image_url,
        image: null, // Will be loaded separately
        
        // Process blocks (support both legacy flat format and nested blocks array)
        blocks: (() => {
          if (Array.isArray(questionsResult.questions) && questionsResult.questions.length > 0) {
            const q0 = questionsResult.questions[0];
            // Newer format: a wrapper with blocks array
            if (Array.isArray(q0.blocks)) {
              return q0.blocks.map((b, idx) => {
                // Determine coordinates from various possible shapes
                let coords = b.block_coordinates || b.coordinates || (typeof b.x === 'number' ? { x: b.x, y: b.y, width: b.width, height: b.height } : null);
                if (typeof coords === 'string') {
                  try { coords = JSON.parse(coords); } catch { coords = null; }
                }
                if (!coords || typeof coords !== 'object') {
                  coords = { x: 0, y: 0, width: 30, height: 10 };
                }
                coords = {
                  x: (typeof coords.x === 'number' ? coords.x : Number(coords.x)) || 0,
                  y: (typeof coords.y === 'number' ? coords.y : Number(coords.y)) || 0,
                  width: (typeof coords.width === 'number' ? coords.width : Number(coords.width)) || 30,
                  height: (typeof coords.height === 'number' ? coords.height : Number(coords.height)) || 10
                };
                return {
                  id: b.block_id || b.question_id || b.id || idx + 1,
                  word: b.word || `Word ${idx + 1}`,
                  coordinates: coords,
                  hasArrow: !!b.has_arrow,
                  arrow: b.arrow || null
                };
              });
            }
            // Legacy flat format
            return questionsResult.questions.map((question) => {
              console.log('🔍 Processing question:', question);
              let coordinates;
              try {
                coordinates = typeof question.block_coordinates === 'string' 
                  ? JSON.parse(question.block_coordinates) 
                  : question.block_coordinates;
              } catch {
                coordinates = { x: 0, y: 0, width: 100, height: 100 };
              }
              if (!coordinates || typeof coordinates !== 'object') {
                coordinates = { x: 0, y: 0, width: 100, height: 100 };
              }
              coordinates = {
                x: (typeof coordinates.x === 'number' ? coordinates.x : Number(coordinates.x)) || 0,
                y: (typeof coordinates.y === 'number' ? coordinates.y : Number(coordinates.y)) || 0,
                width: (typeof coordinates.width === 'number' ? coordinates.width : Number(coordinates.width)) || 100,
                height: (typeof coordinates.height === 'number' ? coordinates.height : Number(coordinates.height)) || 100
              };
              return {
                id: question.question_id,
                word: question.word,
                coordinates: coordinates,
                hasArrow: question.has_arrow,
                arrow: question.arrow
              };
            });
          }
          return [];
        })(),
        
        // Process words (support nested words array, including string arrays)
        words: (() => {
          if (Array.isArray(questionsResult.questions) && questionsResult.questions.length > 0) {
            const q0 = questionsResult.questions[0];
            if (Array.isArray(q0.words)) {
              // Handle words as array of strings (legacy wrapper) or array of objects
              const wordsArray = q0.words;
              const blocksArray = Array.isArray(q0.blocks) ? q0.blocks : [];
              const isStringArray = typeof wordsArray[0] === 'string';
              if (isStringArray) {
                return wordsArray.map((wStr, idx) => {
                  const baseId = (blocksArray[idx]?.question_id) || (blocksArray[idx]?.block_id) || (questionsResult.questions[idx]?.question_id) || (idx + 1);
                  return {
                    id: `w_${baseId}_${idx}`,
                    word: String(wStr),
                    blockId: null,
                    isPlaced: false,
                    isCorrect: false
                  };
                });
              }
              return wordsArray.map((w, idx) => ({
                id: `w_${w.question_id || w.id || idx + 1}_${idx}`,
                word: w.word || String(w.text || ''),
                blockId: null,
                isPlaced: false,
                isCorrect: false
              }));
            }
            return questionsResult.questions.map((question) => ({
              id: `w_${question.question_id}`,
              word: question.word,
              blockId: null,
              isPlaced: false,
              isCorrect: false
            }));
          }
          return [];
        })(),
        
        // Process arrows exactly like legacy
        arrows: test.arrows ? test.arrows.map(arrow => {
          console.log('🔍 Processing arrow:', arrow);
          return {
          id: arrow.id,
          questionId: arrow.question_id,
          blockId: arrow.block_id || arrow.question_id, // prefer block_id when provided
          start: { 
            x: Number(arrow.start_x) || 0,
            y: Number(arrow.start_y) || 0
          },
          end: { 
            x: Number(arrow.end_x) || 0,
            y: Number(arrow.end_y) || 0
          },
          rel_start_x: arrow.rel_start_x !== null ? Number(arrow.rel_start_x) : null,
          rel_start_y: arrow.rel_start_y !== null ? Number(arrow.rel_start_y) : null,
          rel_end_x: arrow.rel_end_x !== null ? Number(arrow.rel_end_x) : null,
          rel_end_y: arrow.rel_end_y !== null ? Number(arrow.rel_end_y) : null,
          image_width: arrow.image_width ? Number(arrow.image_width) : null,
          image_height: arrow.image_height ? Number(arrow.image_height) : null,
          style: (typeof arrow.style === 'string' ? 
                  JSON.parse(arrow.style) : 
                  arrow.style) || { color: '#dc3545', thickness: 3 }
          };
        }) : []
      };

      // Load and process image
      if (test.image_url) {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          processedTestData.image = image;
          setTestData(processedTestData);
          setIsLoading(false);
        };
        image.onerror = () => {
          console.warn('Failed to load test image');
          setTestData(processedTestData);
          setIsLoading(false);
        };
        image.src = test.image_url;
      } else {
        setTestData(processedTestData);
        setIsLoading(false);
      }

    } catch (error) {
      console.error('Error loading test data:', error);
      setError(error.message || 'Failed to load test');
      setIsLoading(false);
    }
  }, [testId, makeAuthenticatedRequest]);

  // Load test data on mount
  useEffect(() => {
    if (user?.student_id) {
      loadTestData();
    }
  }, [loadTestData, user?.student_id]);

  // Handle test completion
  const handleTestComplete = useCallback(async (result) => {
    console.log('Test completed:', result);
    showNotification('Test completed successfully!', 'success');
    
    // Use the result data from the component directly (like regular tests)
    const score = parseInt(result) || 0;
    // For matching tests, the maxScore should be the number of blocks/words
    const maxScore = testData?.blocks?.length || testData?.words?.length || 0;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    const testResultsData = {
      showResults: true,
      testInfo: {
        test_name: testData?.test_name || 'Test',
        id: testData?.id,
        test_id: testData?.id
      },
      testType: 'matching_type',
      score: score,
      totalQuestions: maxScore,
      percentage: percentage,
      passed: percentage >= 60,
      questionAnalysis: testData?.questions?.map((question, index) => ({
        questionNumber: index + 1,
        isCorrect: index < score,
        userAnswer: index < score ? `Matched: ${question.word}` : 'Not answered',
        correctAnswer: `Match: ${question.word}`
      })) || Array.from({ length: maxScore }, (_, index) => ({
        questionNumber: index + 1,
        isCorrect: index < score,
        userAnswer: index < score ? 'Matched' : 'Not answered',
        correctAnswer: 'Match required'
      })),
      timestamp: new Date().toISOString(),
      caught_cheating: false,
      visibility_change_times: 0
    };
    
    console.log('🎯 Using test results data:', testResultsData);
    setTestResults(testResultsData);
    setShowResults(true);
  }, [testData, showNotification]);

  // Handle back to cabinet
  const handleBackToCabinet = useCallback(() => {
    navigate('/student');
  }, [navigate]);

  // Handle retake test
  const handleRetakeTest = useCallback(() => {
    setShowResults(false);
    setTestResults(null);
    // Reload test data
    loadTestData();
  }, [loadTestData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <Card.Body className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading test...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <Card.Body className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Test</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleBackToCabinet}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Dashboard
            </button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // No test data
  if (!testData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <Card.Body className="text-center">
            <div className="text-gray-500 text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Test Data</h2>
            <p className="text-gray-600 mb-4">Unable to load test data</p>
            <button
              onClick={handleBackToCabinet}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Dashboard
            </button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Show test results if test is completed
  if (showResults && testResults) {
    return (
      <div className="bg-gray-50 overflow-y-auto min-h-screen">
        <TestResults
          testResults={testResults}
          onBackToCabinet={handleBackToCabinet}
          onRetakeTest={handleRetakeTest}
          isLoading={false}
        />
      </div>
    );
  }

  // Render matching test
  return (
    <MatchingTestStudent
      testData={testData}
      onTestComplete={handleTestComplete}
      onBackToCabinet={handleBackToCabinet}
    />
  );
};

export default MatchingTestPage;
