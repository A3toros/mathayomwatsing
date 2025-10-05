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

  // Debug logging
  console.log('🎯 FeedbackDisplay received scores:', scores);
  console.log('🎯 Individual score values:', {
    grammar_score: scores?.grammar_score,
    vocabulary_score: scores?.vocabulary_score,
    pronunciation_score: scores?.pronunciation_score,
    fluency_score: scores?.fluency_score,
    content_score: scores?.content_score
  });

  return (
    <div className="feedback-display bg-white rounded-lg shadow-lg p-3 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Speaking Test Results</h2>
        <p className="text-gray-600">Review your performance and decide whether to submit or re-record.</p>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 sm:p-6 rounded-lg mb-6">
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

      {/* Score Breakdown - All 5 AI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Grammar Score */}
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Grammar</span>
            <span className={`font-bold ${getScoreColor(scores?.grammar_score || 0, 25)}`}>
              {scores?.grammar_score || 0}/25
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {scores?.grammar_mistakes || 0} mistakes found
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${Math.min((scores?.grammar_score || 0) / 25 * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Vocabulary Score */}
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Vocabulary</span>
            <span className={`font-bold ${getScoreColor(scores?.vocabulary_score || 0, 20)}`}>
              {scores?.vocabulary_score || 0}/20
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {scores?.vocabulary_mistakes || 0} vocabulary issues
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${Math.min((scores?.vocabulary_score || 0) / 20 * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Pronunciation Score */}
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Pronunciation</span>
            <span className={`font-bold ${getScoreColor(scores?.pronunciation_score || 0, 15)}`}>
              {scores?.pronunciation_score || 0}/15
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Clarity and accuracy
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-orange-600 h-2 rounded-full"
              style={{ width: `${Math.min((scores?.pronunciation_score || 0) / 15 * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Fluency Score */}
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Fluency</span>
            <span className={`font-bold ${getScoreColor(scores?.fluency_score || 0, 20)}`}>
              {scores?.fluency_score || 0}/20
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Pace, pauses, and flow
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.min((scores?.fluency_score || 0) / 20 * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Content Score */}
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Content</span>
            <span className={`font-bold ${getScoreColor(scores?.content_score || 0, 20)}`}>
              {scores?.content_score || 0}/20
            </span>
          </div>
          <div className="text-sm text-gray-600">
            How well addressed the prompt
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${Math.min((scores?.content_score || 0) / 20 * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Word Count (Bonus Info) */}
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Word Count</span>
            <span className="font-bold text-gray-700">
              {scores?.word_count || 0} words
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Total words spoken
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gray-600 h-2 rounded-full"
              style={{ width: `${Math.min((scores?.word_count || 0) / 100 * 100, 100)}%` }}
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

      {/* AI Feedback - Prominent Display */}
      {scores?.feedback && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-6 rounded-lg border border-green-200">
          <div className="flex items-start space-x-3">
            <span className="text-green-600 text-2xl">🤖</span>
            <div className="flex-1">
              <div className="font-semibold text-green-800 mb-3 text-lg">AI Feedback</div>
              <p className="text-gray-700 leading-relaxed">{scores.feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Improved Transcript */}
      {scores?.improved_transcript && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-2 mb-3">
            <span className="text-green-600 text-lg">✨</span>
            <div>
              <h4 className="font-semibold text-green-800 mb-2">Improved Version</h4>
              <p className="text-sm text-gray-600 mb-3">
                Here's how your response could be improved with better grammar and vocabulary:
              </p>
            </div>
          </div>
          <div className="bg-white border border-green-200 rounded p-3">
            <p className="text-gray-800 leading-relaxed">{scores.improved_transcript}</p>
          </div>
        </div>
      )}

      {/* Show Details Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showDetailedFeedback ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Detailed Feedback */}
      {showDetailedFeedback && (
        <div className="mb-6 bg-blue-50 p-3 sm:p-4 rounded-lg">
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
                <div className="mt-2 space-y-2">
                  {scores.grammar_corrections.map((correction, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2 sm:p-3">
                      <div className="flex items-start space-x-2">
                        <span className="text-red-600 font-mono text-sm">✗</span>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium text-red-600">{correction.mistake}</span>
                            <span className="mx-2">→</span>
                            <span className="font-medium text-green-600">{correction.correction}</span>
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
            <div>
              <span className="font-medium">Vocabulary Analysis:</span>
              <span className="ml-2 text-gray-700">
                {scores?.vocabulary_mistakes === 0 ? 'Excellent vocabulary usage!' : 
                 `Found ${scores?.vocabulary_mistakes || 0} vocabulary ${scores?.vocabulary_mistakes === 1 ? 'issue' : 'issues'}.`}
              </span>
              {scores?.vocabulary_corrections && scores.vocabulary_corrections.length > 0 && (
                <div className="mt-2 space-y-2">
                  {scores.vocabulary_corrections.map((correction, index) => (
                    <div key={index} className="bg-purple-50 border border-purple-200 rounded p-2 sm:p-3">
                      <div className="flex items-start space-x-2">
                        <span className="text-purple-600 font-mono text-sm">📝</span>
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium text-purple-600">{correction.mistake}</span>
                            <span className="mx-2">→</span>
                            <span className="font-medium text-green-600">{correction.correction}</span>
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
          </div>
        </div>
      )}

      {/* Attempt Info */}
      <div className="text-sm text-gray-600 mb-3">
        Attempt {attemptNumber} of {maxAttempts}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {canReRecord && (
          <button
            onClick={onReRecord}
            className="w-full sm:w-auto bg-yellow-600 text-white px-4 py-2.5 rounded-lg hover:bg-yellow-700 flex items-center justify-center space-x-2 min-h-[40px] text-base font-medium"
          >
            <span>🔄</span>
            <span>Re-record</span>
          </button>
        )}
        <button
          onClick={onFinalSubmit}
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 min-h-[40px] text-base font-medium ${
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

      {/* Re-record Notice */}
      {!canReRecord && (
        <div className="mt-4 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
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
