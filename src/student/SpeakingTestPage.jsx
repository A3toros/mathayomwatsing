import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import SpeakingTestStudent from '../components/test/SpeakingTestStudent';
import TestResults from '../components/test/TestResults';
import Button from '../components/ui/Button';

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
      <div className="min-h-screen bg-gray-50 overflow-y-auto">
        {/* Speaking Test Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Speaking Test</h1>
              </div>
              
              <Button
                variant="outline"
                onClick={handleExit}
              >
                Back to Cabinet
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Loading speaking test...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-y-auto">
        {/* Speaking Test Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Speaking Test</h1>
              </div>
              
              <Button
                variant="outline"
                onClick={handleExit}
              >
                Back to Cabinet
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Test</h2>
              <p className="text-gray-600 mb-6">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted && testResult) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-y-auto">
        {/* Speaking Test Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Speaking Test Results</h1>
              </div>
              
              <Button
                variant="outline"
                onClick={handleExit}
              >
                Back to Cabinet
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="min-h-screen bg-gray-50 overflow-y-auto">
        {/* Speaking Test Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Speaking Test</h1>
              </div>
              
              <Button
                variant="outline"
                onClick={handleExit}
              >
                Back to Cabinet
              </Button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Test Data</h2>
              <p className="text-gray-600 mb-6">Unable to load test information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get the first question (speaking tests typically have one question)
  const currentQuestion = questions[0];

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {/* Speaking Test Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Speaking Test</h1>
            </div>
            
            <Button
              variant="outline"
              onClick={handleExit}
            >
              Back to Cabinet
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
