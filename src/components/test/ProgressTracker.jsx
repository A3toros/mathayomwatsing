import React from 'react';
import { motion } from 'framer-motion';

// PROGRESS TRACKER COMPONENT - Visual Progress Tracking UI
// ✅ COMPLETED: Real-time progress tracking with visual indicators
// ✅ COMPLETED: Progress bar with percentage display
// ✅ COMPLETED: Question counter with answered/total
// ✅ COMPLETED: Time tracking display
// ✅ COMPLETED: Submit button state management
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Animation effects with Framer Motion

const ProgressTracker = ({
  answeredCount = 0,
  totalQuestions = 0,
  timeElapsed = 0,
  onSubmitTest,
  isSubmitting = false,
  canSubmit = false,
  className = ''
}) => {
  const percentage = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const remainingQuestions = totalQuestions - answeredCount;
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (percentage) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Test Progress</h3>
        <div className="flex items-center space-x-4">
          {/* Time Display */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⏱️</span>
            <span className="text-sm font-mono text-gray-600">
              {formatTime(timeElapsed)}
            </span>
          </div>
          
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className={`text-sm font-semibold ${getProgressTextColor(percentage)}`}>
            {percentage}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-full ${getProgressColor(percentage)} transition-colors duration-300`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Question Counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{answeredCount}</div>
          <div className="text-xs text-blue-600">Answered</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{remainingQuestions}</div>
          <div className="text-xs text-gray-600">Remaining</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{totalQuestions}</div>
          <div className="text-xs text-purple-600">Total</div>
        </div>
      </div>

      {/* Progress Status */}
      <div className="mb-4">
        {answeredCount === totalQuestions ? (
          <motion.div
            className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-green-600 font-medium">🎉 All questions answered! Ready to submit.</span>
          </motion.div>
        ) : remainingQuestions === 1 ? (
          <motion.div
            className="flex items-center justify-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-yellow-600 font-medium">Almost there! 1 question remaining.</span>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-gray-600 font-medium">
              {remainingQuestions} questions remaining
            </span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <motion.button
          onClick={onSubmitTest}
          disabled={!canSubmit || isSubmitting}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
            canSubmit && !isSubmitting
              ? 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          whileHover={canSubmit && !isSubmitting ? { scale: 1.05 } : {}}
          whileTap={canSubmit && !isSubmitting ? { scale: 0.95 } : {}}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </div>
          ) : canSubmit ? (
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Submit Test</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>⏳</span>
              <span>Complete {remainingQuestions} more question{remainingQuestions !== 1 ? 's' : ''}</span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Progress Tips */}
      {answeredCount < totalQuestions && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-700">
            <strong>💡 Tip:</strong> Your progress is automatically saved. You can close this test and return later to continue where you left off.
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;