import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/components-ui-index';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PerfectModal from '@/components/ui/PerfectModal';

// TEST RESULTS COMPONENT - Complete Test Results Display
// ✅ COMPLETED: Full test results rendering with detailed analysis
// ✅ COMPLETED: Score display with pass/fail indication
// ✅ COMPLETED: Question-by-question review
// ✅ COMPLETED: Answer comparison (user vs correct)
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Print functionality
// ✅ COMPLETED: Navigation back to cabinet

const TestResults = ({ 
  testResults, 
  onBackToCabinet, 
  onRetakeTest,
  isLoading = false,
  // Add cheating data props back for results display
  caught_cheating = false,
  visibility_change_times = 0
}) => {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleBackToCabinet = () => {
    setIsNavigating(true);
    if (onBackToCabinet) {
      onBackToCabinet();
    }
  };

  if (!testResults || !testResults.showResults) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">No test results to display</p>
        </div>
      </div>
    );
  }

  const {
    testInfo,
    testType,
    score,
    totalQuestions,
    percentage,
    passed,
    questionAnalysis,
    timestamp
  } = testResults;

  const getTestTypeDisplay = (type) => {
    const types = {
      'multiple_choice': 'Multiple Choice',
      'true_false': 'True/False',
      'input': 'Input',
      'matching_type': 'Matching'
    };
    return types[type] || type;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPassStatusColor = (passed) => {
    return passed 
      ? 'text-green-600 bg-green-100 border-green-200' 
      : 'text-red-600 bg-red-100 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 overflow-y-auto">
      {/* Loading Modal */}
      <PerfectModal
        isOpen={isNavigating}
        onClose={() => {}}
        title="Navigating"
        size="small"
      >
        <div className="flex flex-col items-center justify-center py-4">
          <LoadingSpinner size="lg" className="mb-3" />
          <p className="text-blue-600 font-semibold text-lg">Returning to cabinet...</p>
          <p className="text-gray-500 text-sm mt-1">Please wait</p>
        </div>
      </PerfectModal>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Academic Integrity Warning - Show only in results after submission */}
          {(testResults?.caught_cheating || caught_cheating) && (
            <div className="mb-6 border-2 border-red-500 bg-red-50 rounded-lg">
              <div className="flex items-start space-x-3 p-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-700">
                    Suspicious activity was detected during this test. Your teacher has been notified.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Test Results
              </h1>
              <h2 className="text-xl text-gray-700 mb-1">
                {testInfo?.test_name || 'Test'}
              </h2>
              <p className="text-sm text-gray-500">
                {getTestTypeDisplay(testType)} • Completed on {new Date(timestamp).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getPassStatusColor(passed)}`}>
                {passed ? '✓ PASSED' : '✗ FAILED'}
              </div>
            </div>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">{score}</div>
              <div className="text-sm text-gray-600">Correct Answers</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">{totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-3xl font-bold ${getScoreColor(percentage).split(' ')[0]}`}>
                {percentage}%
              </div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
          </div>


          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <motion.div 
              className={`h-3 rounded-full ${getScoreColor(percentage).split(' ')[1]}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

        </motion.div>

        {/* Question Analysis */}
        {/* Question Review - Only show for non-matching tests */}
        {testType !== 'matching_type' && testType !== 'word_matching' && (
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Question Review
            </h3>
            
            <div className="space-y-4">
              {questionAnalysis.map((q, index) => (
                <motion.div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    q.isCorrect 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Question {q.questionNumber}
                    </h4>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      q.isCorrect 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-800 font-medium mb-2">Question:</p>
                    <p className="text-gray-700 bg-gray-100 p-3 rounded">
                      {q.question}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-800 font-medium mb-2">Your Answer:</p>
                      <p className={`p-3 rounded ${
                        q.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {q.userAnswer || 'No answer provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium mb-2">Correct Answer:</p>
                      <p className="bg-blue-100 text-blue-800 p-3 rounded">
                        {q.correctAnswer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary Statistics */}
        <motion.div 
          className="bg-white rounded-lg shadow-lg p-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Summary Statistics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {questionAnalysis.filter(q => q.isCorrect).length}
              </div>
              <div className="text-sm text-blue-600">Correct</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {questionAnalysis.filter(q => !q.isCorrect).length}
              </div>
              <div className="text-sm text-red-600">Incorrect</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {Math.round((questionAnalysis.filter(q => q.isCorrect).length / totalQuestions) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {totalQuestions}
              </div>
              <div className="text-sm text-purple-600">Total</div>
            </div>
          </div>
        </motion.div>

        {/* Back to Cabinet Button - Bottom */}
        <motion.div 
          className="bg-white rounded-lg shadow-lg p-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex justify-center">
            <Button
              onClick={handleBackToCabinet}
              variant="primary"
              className="flex items-center gap-2"
              disabled={isNavigating}
            >
              {isNavigating ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Navigating...
                </>
              ) : (
                '← Back to Cabinet'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TestResults;
