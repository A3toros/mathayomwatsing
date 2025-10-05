import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import SpeakingTestStudent from '../components/test/SpeakingTestStudent';
import TestResults from '../components/test/TestResults';

const SpeakingTestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useApi();
  
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadTestData();
    checkCompletionStatus();
  }, [testId]);

  const loadTestData = async () => {
    try {
      setIsLoading(true);
      
      // Load test data
      const testResponse = await api.getSpeakingTest(testId);
      if (testResponse.success) {
        setTestData(testResponse.test);
      } else {
        throw new Error(testResponse.message || 'Failed to load test');
      }

      // Load questions
      const questionsResponse = await api.getSpeakingTestQuestions(testId);
      if (questionsResponse.success) {
        setQuestions(questionsResponse.questions);
      }

    } catch (error) {
      console.error('Error loading test data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCompletionStatus = () => {
    // Check if test is already completed using localStorage (following other tests pattern)
    const studentId = user?.student_id || user?.id;
    const completionKey = `test_completed_${studentId}_speaking_${testId}`;
    const completed = localStorage.getItem(completionKey) === 'true';
    
    if (completed) {
      setIsCompleted(true);
      // Try to get cached result
      const cachedResult = localStorage.getItem(`speaking_test_result_${testId}`);
      if (cachedResult) {
        setTestResult(JSON.parse(cachedResult));
      }
    }
  };

  const handleTestComplete = async (result) => {
    try {
      setIsCompleted(true);
      setTestResult(result);
      
      // Store result for caching
      localStorage.setItem(`speaking_test_result_${testId}`, JSON.stringify(result));
      
      // Force refresh of student cabinet
      window.dispatchEvent(new CustomEvent('testCompleted', { 
        detail: { testId, testType: 'speaking' } 
      }));
      
      // Navigate back to student cabinet after a delay (like other tests)
      setTimeout(() => {
        navigate('/student');
      }, 2000);
      
    } catch (error) {
      console.error('Error handling test completion:', error);
    }
  };

  const handleExit = () => {
    navigate('/student');
  };

  if (isLoading) {
    return (
      <div className="speaking-test-page min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading speaking test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="speaking-test-page min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Test</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleExit}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted && testResult) {
    return (
      <div className="speaking-test-page min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={handleExit}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Speaking Test Results</h1>
          </div>
          
          <TestResults
            testType="speaking"
            testData={testData}
            result={testResult}
            onRetake={() => {
              setIsCompleted(false);
              setTestResult(null);
              const studentId = JSON.parse(localStorage.getItem('userData') || '{}').student_id;
              localStorage.removeItem(`test_completed_${studentId}_speaking_${testId}`);
            }}
          />
        </div>
      </div>
    );
  }

  if (!testData || questions.length === 0) {
    return (
      <div className="speaking-test-page min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Test Data</h2>
          <p className="text-gray-600 mb-6">Unable to load test information</p>
          <button
            onClick={handleExit}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get the first question (speaking tests typically have one question)
  const currentQuestion = questions[0];

  return (
    <div className="speaking-test-page min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={handleExit}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <SpeakingTestStudent
          testData={{
            ...testData,
            test_id: parseInt(testId), // Add the test_id from URL params
            question_id: currentQuestion?.id,
            prompt: currentQuestion?.prompt,
            start_time: Date.now()
          }}
          onComplete={handleTestComplete}
          onExit={handleExit}
          onTestComplete={handleTestComplete}
        />
      </div>
    </div>
  );
};

export default SpeakingTestPage;
