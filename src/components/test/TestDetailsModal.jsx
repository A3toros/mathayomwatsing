import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/components-ui-index';

// TEST DETAILS MODAL COMPONENT - Complete Test Details Display
// ✅ COMPLETED: Full test details modal with question preview
// ✅ COMPLETED: Question-by-question display with options
// ✅ COMPLETED: Correct answers display
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Close functionality
// ✅ COMPLETED: Print functionality

const TestDetailsModal = ({ 
  isOpen, 
  onClose, 
  testType, 
  testId, 
  testName, 
  questions = [],
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const getTestTypeDisplay = (type) => {
    const types = {
      'multiple_choice': 'Multiple Choice',
      'true_false': 'True/False',
      'input': 'Input',
      'matching_type': 'Matching'
    };
    return types[type] || type;
  };

  const getQuestionTypeIcon = (type) => {
    const icons = {
      'multiple_choice': '🔘',
      'true_false': '✅',
      'input': '✏️',
      'matching_type': '🔗'
    };
    return icons[type] || '❓';
  };

  const renderQuestionOptions = (question, type) => {
    switch (type) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            <p className="font-medium text-gray-700 mb-2">Options:</p>
            <div className="grid grid-cols-1 gap-2">
              {question.option_a && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">A</span>
                  <span className="text-gray-700">{question.option_a}</span>
                </div>
              )}
              {question.option_b && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">B</span>
                  <span className="text-gray-700">{question.option_b}</span>
                </div>
              )}
              {question.option_c && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">C</span>
                  <span className="text-gray-700">{question.option_c}</span>
                </div>
              )}
              {question.option_d && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">D</span>
                  <span className="text-gray-700">{question.option_d}</span>
                </div>
              )}
              {question.option_e && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">E</span>
                  <span className="text-gray-700">{question.option_e}</span>
                </div>
              )}
              {question.option_f && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">F</span>
                  <span className="text-gray-700">{question.option_f}</span>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'true_false':
        return (
          <div className="space-y-2">
            <p className="font-medium text-gray-700 mb-2">Options:</p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">T</span>
                <span className="text-gray-700">True</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">F</span>
                <span className="text-gray-700">False</span>
              </div>
            </div>
          </div>
        );
      
      case 'input':
        return (
          <div className="space-y-2">
            <p className="font-medium text-gray-700 mb-2">Answer Format:</p>
            <div className="bg-gray-100 p-3 rounded">
              <span className="text-gray-600 italic">Type your answer in the text input field</span>
            </div>
          </div>
        );
      
      case 'matching_type':
        return (
          <div className="space-y-2">
            <p className="font-medium text-gray-700 mb-2">Instructions:</p>
            <div className="bg-gray-100 p-3 rounded">
              <span className="text-gray-600 italic">Match the items by connecting them with lines or selecting pairs</span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderCorrectAnswer = (question, type) => {
    if (!question.correct_answer) return null;

    let correctAnswerDisplay = '';
    switch (type) {
      case 'multiple_choice':
        correctAnswerDisplay = question.correct_answer.toUpperCase();
        break;
      case 'true_false':
        correctAnswerDisplay = question.correct_answer ? 'True' : 'False';
        break;
      case 'input':
        correctAnswerDisplay = question.correct_answer;
        break;
      case 'matching_type':
        correctAnswerDisplay = typeof question.correct_answer === 'object' 
          ? JSON.stringify(question.correct_answer) 
          : question.correct_answer;
        break;
      default:
        correctAnswerDisplay = String(question.correct_answer);
    }

    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <p className="font-medium text-green-800 mb-1">Correct Answer:</p>
        <p className="text-green-700 font-mono">{correctAnswerDisplay}</p>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getQuestionTypeIcon(testType)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {testName || 'Test Details'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {getTestTypeDisplay(testType)} • {questions.length} Questions
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  🖨️ Print
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  ✕ Close
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading test details...</p>
                  </div>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Questions Available</h3>
                  <p className="text-gray-500">This test doesn't have any questions yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <motion.div
                      key={question.id || question.question_id || index}
                      className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            Question {index + 1}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {getTestTypeDisplay(testType)}
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-4">
                        <p className="text-gray-800 font-medium text-lg leading-relaxed">
                          {question.question || question.question_text}
                        </p>
                      </div>

                      {/* Question Options */}
                      {renderQuestionOptions(question, testType)}

                      {/* Correct Answer */}
                      {renderCorrectAnswer(question, testType)}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {questions.length > 0 && (
                  <span>
                    Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={onClose}
                  variant="primary"
                  className="flex items-center space-x-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TestDetailsModal;