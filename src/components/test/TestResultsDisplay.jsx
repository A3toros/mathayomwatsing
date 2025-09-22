import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { calculateTestScore } from '../../utils/scoreCalculation';

const TestResultsDisplay = ({ 
  testInfo, 
  questions, 
  testType, 
  studentAnswers, 
  onBackToCabinet,
  checkAnswerCorrectness,
  formatStudentAnswerForDisplay,
  getCorrectAnswer
}) => {
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const calculateResults = () => {
      try {
        const calculatedScore = calculateTestScore(questions, studentAnswers, testType).score;
        const totalQuestions = testInfo?.num_questions || questions?.length || 0;
        const calculatedPercentage = totalQuestions > 0 ? Math.round((calculatedScore / totalQuestions) * 100) : 0;
        
        setScore(calculatedScore);
        setPercentage(calculatedPercentage);
        setIsLoading(false);
      } catch (error) {
        console.error('Error calculating test results:', error);
        setScore(0);
        setPercentage(0);
        setIsLoading(false);
      }
    };

    if (questions && questions.length > 0) {
      calculateResults();
    } else {
      setIsLoading(false);
    }
  }, [questions, studentAnswers, testType, testInfo, calculateTestScore]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">Calculating results...</div>
      </div>
    );
  }

  const totalQuestions = testInfo?.num_questions || questions?.length || 0;
  const testName = testInfo?.test_name || testInfo?.title || 'Test';

  return (
    <div className="test-results-page max-w-4xl mx-auto p-6">
      {/* Results Header */}
      <Card className="mb-6">
        <div className="results-header text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Test Results: {testName}
          </h2>
          <p className="text-gray-600">
            {testType === 'matching_type' ? 'Matching Test' : 
             testType === 'multiple_choice' ? 'Multiple Choice Test' :
             testType === 'true_false' ? 'True/False Test' :
             testType === 'input' ? 'Input Test' :
             testType === 'drawing' ? 'Drawing Test' : 'Test'}
          </p>
        </div>
      </Card>
      
      {/* Results Summary */}
      <Card className="mb-6">
        <div className="results-summary">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Your Score: {score} / {totalQuestions} ({percentage}%)
          </h3>
          
          {/* Score Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                percentage >= 80 ? 'bg-green-500' :
                percentage >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{width: `${percentage}%`}}
            ></div>
          </div>
          
          {/* Score Description */}
          <div className="text-center">
            <p className={`text-lg font-medium ${
              percentage >= 80 ? 'text-green-600' :
              percentage >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {percentage >= 80 ? 'Excellent!' :
               percentage >= 60 ? 'Good job!' :
               'Keep practicing!'}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Questions Review */}
      {questions && questions.length > 0 && (
        <Card className="mb-6">
          <div className="questions-review">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Question Review</h3>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const studentAnswer = studentAnswers[String(question.question_id)] || 'No answer';
                console.log('🔍 TestResultsDisplay - Question', index + 1, ':', { question, studentAnswer, testType });
                const isCorrect = checkAnswerCorrectness(question, studentAnswer, testType);
                console.log('🔍 TestResultsDisplay - isCorrect result:', isCorrect);
                
                return (
                  <div 
                    key={question.question_id || index} 
                    className={`question-review p-4 rounded-lg border-2 ${
                      isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="question-review-header flex justify-between items-start mb-3">
                      <h4 className="text-lg font-medium text-gray-800">
                        Question {index + 1}
                      </h4>
                      <span className={`text-2xl font-bold ${
                        isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    
                    <div className="question-text mb-3">
                      <p className="text-gray-700 font-medium">{question.question}</p>
                    </div>
                    
                    <div className="answer-section space-y-2">
                      <p className="student-answer">
                        <strong className="text-gray-600">Your Answer:</strong>{' '}
                        <span className={`font-medium ${
                          isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {formatStudentAnswerForDisplay(studentAnswer, testType, question)}
                        </span>
                      </p>
                      
                      {!isCorrect && (
                        <p className="correct-answer">
                          <strong className="text-gray-600">Correct Answer:</strong>{' '}
                          <span className="text-green-700 font-medium">
                            {formatStudentAnswerForDisplay(getCorrectAnswer(question, testType), testType)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
      
      {/* Results Actions */}
      <Card>
        <div className="results-actions text-center">
          <Button 
            onClick={onBackToCabinet}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
          >
            Back to Cabinet
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TestResultsDisplay;
