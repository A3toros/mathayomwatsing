import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';

const FeedbackDisplay = ({ 
  transcript, 
  scores, 
  audioBlob, 
  recordingTime,
  onReRecord, 
  onFinalSubmit, 
  canReRecord, 
  attemptNumber, 
  maxAttempts,
  isSubmitting = false
}) => {
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  
  console.log('🎤 FeedbackDisplay received recordingTime:', recordingTime);

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getOverallGrade = () => {
    return getScoreGrade(scores?.overall_score || 0, 100);
  };

  const getOverallColor = () => {
    return getScoreColor(scores?.overall_score || 0, 100);
  };

  return (
    <div className="feedback-display bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Speaking Test Results</h2>
        <p className="text-gray-600">Review your performance and decide whether to submit or re-record.</p>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-6">
        <div className="text-center">
          <div className={`text-4xl font-bold ${getOverallColor()}`}>
            {scores?.overall_score || 0}/100
          </div>
          <div className={`text-2xl font-semibold ${getOverallColor()} mt-2`}>
            Grade: {getOverallGrade()}
          </div>
          <div className="text-gray-600 mt-2">
            {scores?.overall_score >= 80 ? 'Excellent work!' : 
             scores?.overall_score >= 60 ? 'Good job!' : 
             scores?.overall_score >= 50 ? 'Not bad, but could be better.' : 
             'Keep practicing!'}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Word Count</span>
            <span className={`font-bold ${getScoreColor(scores?.word_score || 0, 30)}`}>
              {scores?.word_score || 0}/30
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {scores?.word_count || 0} words spoken
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.min((scores?.word_score || 0) / 30 * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Grammar</span>
            <span className={`font-bold ${getScoreColor(scores?.grammar_score || 0, 40)}`}>
              {scores?.grammar_score || 0}/40
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {scores?.grammar_mistakes || 0} mistakes found
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${Math.min((scores?.grammar_score || 0) / 40 * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Vocabulary</span>
            <span className={`font-bold ${getScoreColor(scores?.vocab_score || 0, 30)}`}>
              {scores?.vocab_score || 0}/30
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {scores?.vocabulary_mistakes || 0} vocabulary issues
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${Math.min((scores?.vocab_score || 0) / 30 * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Audio Playback */}
      {audioBlob && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Your Recording</h3>
          <AudioPlayer audioBlob={audioBlob} recordingTime={recordingTime} />
        </div>
      )}

      {/* Transcript */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Transcript</h3>
          <button
            onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showDetailedFeedback ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-800 leading-relaxed">{transcript}</p>
        </div>
      </div>

      {/* Detailed Feedback */}
      {showDetailedFeedback && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Detailed Analysis</h4>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Word Count Analysis:</span>
              <span className="ml-2 text-gray-700">
                You spoke {scores?.word_count || 0} words. 
                {scores?.word_count >= 50 ? ' Great job meeting the minimum requirement!' : 
                 ' Consider speaking more to meet the minimum word requirement.'}
              </span>
            </div>
            <div>
              <span className="font-medium">Grammar Analysis:</span>
              <span className="ml-2 text-gray-700">
                {scores?.grammar_mistakes === 0 ? 'Perfect grammar!' : 
                 `Found ${scores?.grammar_mistakes || 0} grammar ${scores?.grammar_mistakes === 1 ? 'mistake' : 'mistakes'}.`}
              </span>
              {scores?.grammar_corrections && scores.grammar_corrections.length > 0 && (
                <div className="mt-2 ml-4">
                  <button
                    onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    {showDetailedFeedback ? 'Hide' : 'Show'} detailed corrections
                  </button>
                  {showDetailedFeedback && (
                    <div className="mt-2 space-y-2">
                      {scores.grammar_corrections.map((correction, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <div className="flex items-start space-x-2">
                            <span className="text-red-600 font-mono text-sm">✗</span>
                            <div className="flex-1">
                              <div className="text-sm">
                                <span className="font-medium text-red-600">{correction.original}</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium text-green-600">{correction.suggested}</span>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                <strong>Context:</strong> "...{correction.context.before}<span className="bg-red-100">{correction.context.problem}</span>{correction.context.after}..."
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                <strong>Explanation:</strong> {correction.explanation}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <span className="font-medium">Vocabulary Analysis:</span>
              <span className="ml-2 text-gray-700">
                {scores?.vocabulary_mistakes === 0 ? 'Excellent vocabulary usage!' : 
                 `Found ${scores?.vocabulary_mistakes || 0} vocabulary ${scores?.vocabulary_mistakes === 1 ? 'issue' : 'issues'}.`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Attempt {attemptNumber} of {maxAttempts}
        </div>
        <div className="flex space-x-4">
          {canReRecord && (
            <button
              onClick={onReRecord}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Re-record</span>
            </button>
          )}
          <button
            onClick={onFinalSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg flex items-center space-x-2 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>Submit Final</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Re-record Notice */}
      {!canReRecord && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Maximum attempts reached.</strong> This is your final attempt. 
            Click "Submit Final" to complete the test.
          </p>
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;
