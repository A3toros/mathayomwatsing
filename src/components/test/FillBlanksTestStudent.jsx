import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotification } from '../ui/Notification';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { useAntiCheating } from '../../hooks/useAntiCheating';
import { useLocalStorageManager } from '../../hooks/useLocalStorage';
import { getCachedData, setCachedData, CACHE_TTL, clearTestData } from '../../utils/cacheUtils';
import PerfectModal from '../ui/PerfectModal';

const FillBlanksTestStudent = ({ 
  testText,
  blanks,
  separateType = true, // true = separate mode, false = inline mode
  testId, 
  testName = 'Unknown Test',
  teacherId = 'Unknown Teacher',
  subjectId,
  onTestComplete,
  onAnswerChange
}) => {
  // Debug logging
  console.log('🔍 FillBlanksTestStudent Props Debug:');
  console.log('- testText:', testText);
  console.log('- blanks:', blanks);
  console.log('- separateType:', separateType);
  console.log('- testId:', testId);
  console.log('- testName:', testName);
  console.log('- teacherId:', teacherId);
  console.log('- subjectId:', subjectId);
  
  // Early return if no test data (following other test patterns)
  if (!testText || !blanks || !Array.isArray(blanks)) {
    console.log('❌ FillBlanksTestStudent: Missing test data');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <Card.Body className="text-center">
            <div className="text-gray-500 text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Test Data</h2>
            <p className="text-gray-600 mb-4">Unable to load fill blanks test data</p>
            <Button onClick={() => window.history.back()} variant="primary">
              Back to Dashboard
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }
  
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const { showNotification } = useNotification();
  const { makeAuthenticatedRequest } = useApi();
  const { user } = useAuth();
  
  // Anti-cheating tracking (following matching test pattern)
  const { startTracking, stopTracking, getCheatingData, clearData } = useAntiCheating(
    'fill_blanks', 
    testId,
    user?.student_id || user?.id
  );
  
  const { getItem, setItem } = useLocalStorageManager();

  // Render main text with numbered blanks (separate mode)
  const renderTextWithBlanks = useCallback((text, blanks) => {
    try {
       // Parse Lexical JSON if it's a string
       let content = text;
       if (typeof text === 'string' && text.startsWith('{')) {
         try {
           const parsed = JSON.parse(text);
           if (parsed.root && parsed.root.children) {
             // Extract text content from Lexical JSON and find blanks
             content = parsed.root.children.map(child => {
               if (child.children) {
                 return child.children.map(textNode => {
                   // Check if this is a blank (has the special styling)
                   if (textNode.style && textNode.style.includes('background-color: #f0f9ff')) {
                     return `[BLANK_PLACEHOLDER]`;
                   }
                   return textNode.text || '';
                 }).join('');
               }
               return '';
             }).join(' ');
           }
         } catch (e) {
           console.error('Error parsing Lexical JSON:', e);
         }
       }
       
       // Replace blank placeholders with styled numbered blanks
       let processedContent = content;
       blanks.forEach((blank, index) => {
         const numberedBlank = `[${index + 1}_________]`;
         processedContent = processedContent.replace('[BLANK_PLACEHOLDER]', numberedBlank);
       });
       
       // Split content and style the blanks
       const parts = processedContent.split(/(\[\d+_________\])/);
       const result = parts.map((part, index) => {
         if (part.match(/\[\d+_________\]/)) {
           return (
             <span 
               key={index}
               className="inline-block px-3 py-1 mx-1 bg-purple-100 text-purple-800 border-2 border-purple-400 rounded-lg font-mono font-bold shadow-sm"
             >
               {part}
             </span>
           );
         }
         return <span key={index}>{part}</span>;
       });
       
       return (
         <div className="prose max-w-none mb-6">
           <div className="text-lg leading-relaxed whitespace-pre-wrap">
             {result}
           </div>
         </div>
       );
     } catch (error) {
       console.error('Error rendering text with blanks:', error);
       return <div className="text-red-500">Error loading test content</div>;
     }
   }, []);

  // Render main text with clickable dropdown blanks (inline mode)
  const renderTextWithInlineBlanks = useCallback((text, blanks) => {
    try {
      // Parse Lexical JSON if it's a string
      let content = text;
      if (typeof text === 'string' && text.startsWith('{')) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.root && parsed.root.children) {
            // Extract text content from Lexical JSON and find blanks
            content = parsed.root.children.map(child => {
              if (child.children) {
                return child.children.map(textNode => {
                  // Check if this is a blank (has the special styling)
                  if (textNode.style && textNode.style.includes('background-color: #f0f9ff')) {
                    return `[BLANK_PLACEHOLDER]`;
                  }
                  return textNode.text || '';
                }).join('');
              }
              return '';
            }).join(' ');
          }
        } catch (e) {
          console.error('Error parsing Lexical JSON:', e);
        }
      }
      
      const blankElements = [];
      
      // Replace blank placeholders with clickable dropdowns
      blanks.forEach((blank, index) => {
        const selectedAnswer = answers[blank.id];
        const selectedOption = selectedAnswer ? blank.options[selectedAnswer.charCodeAt(0) - 65] : null;
        
         const blankDisplay = selectedOption ? (
           <span 
             key={index}
             className="inline-block px-3 py-2 bg-green-100 text-green-800 rounded-lg border-2 border-green-400 cursor-pointer hover:bg-green-200 hover:border-green-500 transition-all duration-200 font-bold shadow-sm"
             onClick={() => setShowDropdown(blank.id)}
           >
             {selectedOption}
           </span>
         ) : (
           <span 
             key={index}
             className="inline-block px-3 py-2 bg-purple-100 text-purple-800 rounded-lg border-2 border-purple-400 cursor-pointer hover:bg-purple-200 hover:border-purple-500 transition-all duration-200 font-bold shadow-sm"
             onClick={() => setShowDropdown(blank.id)}
           >
             {index + 1}_________
           </span>
         );
        
        blankElements.push(blankDisplay);
        // Replace the first occurrence of [BLANK_PLACEHOLDER] with a unique marker
        content = content.replace('[BLANK_PLACEHOLDER]', `__BLANK_${blank.id}__`);
      });
      
      // Split content and insert blank elements
      const parts = content.split(/__BLANK_\d+__/);
      const result = [];
      
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) {
          result.push(<span key={`text-${i}`}>{parts[i]}</span>);
        }
        if (i < blankElements.length) {
          result.push(blankElements[i]);
        }
      }
      
      return (
        <div className="prose max-w-none mb-6">
          <div className="text-lg leading-relaxed whitespace-pre-wrap">
            {result}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering text with inline blanks:', error);
      return <div className="text-red-500">Error loading test content</div>;
    }
  }, [answers]);

  // Handle answer change
  const handleAnswerChange = useCallback((blankId, answer) => {
    const newAnswers = { ...answers, [blankId]: answer };
    setAnswers(newAnswers);
    
    // Notify parent component to update progress bar
    if (onAnswerChange) {
      onAnswerChange(blankId, answer);
    }
  }, [answers, onAnswerChange]);

  // Render questions with multiple choice options
  const renderQuestions = useCallback((blanks) => {
    return (
      <div className="space-y-6">
        {blanks.map((blank, index) => {
          // Handle different data structures from backend
          const blankOptions = blank.blank_options || blank.options || [];
          const correctAnswers = blank.correct_answers || [];
          // Use question_json (individual question text) or fallback to question field
          const questionText = blank.question_json || blank.question || `Blank ${index + 1}`;
          
          // Debug: Log question text for each blank
          console.log(`🔍 Blank ${index + 1} question text:`, questionText);
          
          return (
            <Card key={blank.question_id || blank.id || index} className="p-4">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Question {index + 1}
                </h4>
                <p className="text-gray-600 mb-4">{questionText}</p>
              </div>
              
              <div className="space-y-3">
                {blankOptions.filter(option => option && option.trim().length > 0).map((option, optIndex) => (
                <label key={optIndex} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <input
                    type="radio"
                    name={`blank_${blank.question_id || blank.id || index}`}
                    value={String.fromCharCode(65 + optIndex)}
                    checked={answers[blank.question_id || blank.id || index] === String.fromCharCode(65 + optIndex)}
                    onChange={(e) => handleAnswerChange(blank.question_id || blank.id || index, e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <span className="text-gray-700">{option}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>
          );
        })}
      </div>
    );
  }, [answers, handleAnswerChange]);

  // Initialize test start time, shuffle blanks, and load saved progress
  useEffect(() => {
    if (testId && user?.student_id) {
      const startTime = new Date();
      setTestStartTime(startTime);
      
      // Start anti-cheating tracking (following matching test pattern)
      startTracking();
      console.log('🛡️ Anti-cheating tracking started for fill blanks test');
      
      // Load saved progress using cache pattern (following word matching)
      const progressKey = `test_progress_${user.student_id}_fill_blanks_${testId}`;
      const savedProgress = getCachedData(progressKey);
      if (savedProgress) {
        setAnswers(savedProgress.answers || {});
        setTestStartTime(new Date(savedProgress.startTime));
        console.log('🎯 Fill blanks test progress restored:', savedProgress);
      }
    }
  }, [testId, user?.student_id, blanks, startTracking]);

  // Auto-save progress (following word matching pattern)
  useEffect(() => {
    if (testStartTime && user?.student_id && testId) {
      const interval = setInterval(() => {
        const progressData = {
          answers: answers,
          startTime: testStartTime.toISOString()
        };
        const progressKey = `test_progress_${user.student_id}_fill_blanks_${testId}`;
        setCachedData(progressKey, progressData, CACHE_TTL.test_progress);
        console.log('🎯 Fill blanks progress auto-saved');
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [testStartTime, answers, user?.student_id, testId]);

  // Cleanup anti-cheating on component unmount (following matching test pattern)
  useEffect(() => {
    return () => {
      stopTracking();
      clearData();
      console.log('🛡️ Fill blanks test component unmounted - anti-cheating cleanup');
    };
  }, [stopTracking, clearData]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Calculate score using frontend scoring (following multiple choice pattern)
      const totalBlanks = blanks.length;
      let correctBlanks = 0;
      
      // Check each blank answer
      blanks.forEach((blank, index) => {
        const studentAnswer = answers[blank.id];
        if (studentAnswer && studentAnswer === blank.correct_answer) {
          correctBlanks++;
        }
      });
      
      const score = correctBlanks;
      const maxScore = totalBlanks;
      
      console.log(`🎯 Fill Blanks Score: ${score}/${maxScore} (${Math.round((score/maxScore)*100)}%)`);
      
      // Calculate timing
      const endTime = new Date();
      const timeTaken = testStartTime ? Math.round((endTime - testStartTime) / 1000) : 0;
      const startedAt = testStartTime ? testStartTime.toISOString() : endTime.toISOString();
      
      // Get anti-cheating data (following matching test pattern)
      const cheatingData = getCheatingData();
      console.log('🛡️ Anti-cheating data for fill blanks submission:', cheatingData);
      
      // Prepare submission data (following word matching pattern)
      const submissionData = {
        test_id: testId,
        test_name: testName,
        teacher_id: teacherId || null,
        subject_id: subjectId || null,
        student_id: user.student_id,
        answers: answers,
        score: score,
        maxScore: maxScore,
        time_taken: timeTaken,
        started_at: startedAt,
        submitted_at: endTime.toISOString(),
        caught_cheating: cheatingData.caught_cheating,
        visibility_change_times: cheatingData.visibility_change_times
      };
      
      console.log('🎯 Submitting fill blanks test:', submissionData);
      
      // Submit test results (following word matching pattern)
      const response = await makeAuthenticatedRequest('/.netlify/functions/submit-fill-blanks-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('Test submitted successfully!', 'success');

        // Clear anti-cheating data (following matching test pattern)
        stopTracking();
        clearData();
        console.log('🛡️ Anti-cheating tracking stopped and data cleared for fill blanks test');

        // Clear test data from cache (following word matching pattern)
        if (user?.student_id) {
          clearTestData(user.student_id, 'fill_blanks', testId);
          console.log('🎓 Fill blanks test data cleared from cache');
        }

        // Mark test as completed in localStorage (following word matching pattern)
        if (user?.student_id) {
          const completionKey = `test_completed_${user.student_id}_fill_blanks_${testId}`;
          localStorage.setItem(completionKey, 'true');
          console.log('✅ Fill blanks test marked as completed in localStorage:', completionKey);
        }

        // Cache the test results immediately after successful submission (following word matching pattern)
        if (user?.student_id) {
          const cacheKey = `student_results_table_${user.student_id}`;
          setCachedData(cacheKey, result, CACHE_TTL.student_results_table);
          console.log('🎓 Fill blanks test results cached with key:', cacheKey);
        }

        setShowSubmitModal(false);

        // Navigate back to student cabinet with score (following word matching pattern)
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
      showNotification('Error submitting test. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, blanks, testId, testName, teacherId, subjectId, testStartTime, getCheatingData, stopTracking, clearData, makeAuthenticatedRequest, showNotification, onTestComplete, user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <Card>
        {isSubmitting && (
          <Card.Header>
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <LoadingSpinner size="small" />
                <span>Submitting...</span>
              </div>
            </div>
          </Card.Header>
        )}
        <Card.Body>
          {/* Main Text - Different rendering based on mode */}
          {separateType === true ? (
            <>
              {/* Separate Mode: Numbered blanks + Questions below */}
              {renderTextWithBlanks(testText, blanks)}
              {renderQuestions(blanks)}
            </>
          ) : (
            <>
              {/* Inline Mode: Clickable blanks in text */}
              {renderTextWithInlineBlanks(testText, blanks)}
            </>
          )}
        </Card.Body>
        
        {/* Inline Mode Dropdown */}
        {separateType === false && showDropdown && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Select Answer</h3>
              <div className="space-y-2">
                {blanks.find(b => b.id === showDropdown)?.options.filter(option => option.trim().length > 0).map((option, optIndex) => (
                  <button
                    key={optIndex}
                     onClick={() => {
                       handleAnswerChange(showDropdown, String.fromCharCode(65 + optIndex));
                       setShowDropdown(null);
                     }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg border border-gray-200"
                  >
                    <span className="font-semibold text-blue-600 mr-2">
                      {String.fromCharCode(65 + optIndex)})
                    </span>
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => setShowDropdown(null)}
                  variant="secondary"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <Card.Footer>
          <div className="flex gap-3">
          </div>
        </Card.Footer>
      </Card>

    </motion.div>
  );
};

export default FillBlanksTestStudent;
