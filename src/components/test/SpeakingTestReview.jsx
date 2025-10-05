import React, { useEffect, useState, useRef } from 'react';
import AudioPlayer from './AudioPlayer';

const SpeakingTestReview = ({ result, isOpen, onClose, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const unmountedRef = useRef(false);

  // Cleanup effect to set unmounted flag
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  // Ensure the desired tab opens when the modal is shown
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  if (!isOpen || !result) return null;

  // Extract data from the result prop
  const testData = {
    test_id: result.test_id,
    test_name: result.test_name,
    subject_id: result.subject_id
  };
  
  // Normalize audio URL: allow override from caller, else from answers
  let normalizedAudioUrl = result?.__audioUrl || undefined;
  const ans = normalizedAudioUrl ? undefined : result?.answers;
  if (typeof ans === 'string') {
    normalizedAudioUrl = ans;
  } else if (ans && typeof ans === 'object') {
    normalizedAudioUrl = ans.audio_url;
  }

  // Debug: show initial transcript sources
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[SpeakingReview] Transcript sources', {
      fromResult: result?.transcript,
      fromAnswersObject: (typeof ans === 'object' && ans?.transcript) ? ans.transcript : undefined,
      hasAnswers: !!ans,
      test_id: result?.test_id,
      student_id: result?.student_id
    });
  // we intentionally depend only on ids to avoid spam
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.test_id, result?.student_id]);

  const [fetchedTranscript, setFetchedTranscript] = useState('');

  useEffect(() => {
    // If no transcript present, fetch from API (DB column)
    const controller = new AbortController();
    let isCancelled = false;
    const fallbackStudentId = result?.__studentId || result?.student_id;
    if (!result?.transcript && !(typeof ans === 'object' && ans?.transcript) && result?.test_id && fallbackStudentId) {
      (async () => {
        try {
          const url = `/.netlify/functions/get-speaking-test-new?action=transcript&test_id=${encodeURIComponent(result.test_id)}&student_id=${encodeURIComponent(fallbackStudentId)}`;
          // eslint-disable-next-line no-console
          console.log('[SpeakingReview] Fetching transcript from API:', { url });
          const token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
          const resp = await fetch(url, {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
            signal: controller.signal
          });
          // eslint-disable-next-line no-console
          console.log('[SpeakingReview] Transcript API response:', { ok: resp.ok, status: resp.status });
          const data = await resp.json().catch(() => ({}));
          // eslint-disable-next-line no-console
          console.log('[SpeakingReview] Transcript API body:', data);
          if (!isCancelled && !unmountedRef.current) {
            if (resp.ok) {
              setFetchedTranscript(data.transcript || '');
            } else {
              // eslint-disable-next-line no-console
              console.warn('[SpeakingReview] Transcript API failed:', data?.error || 'unknown error');
            }
          }
        } catch (e) {
          if (e.name !== 'AbortError' && !unmountedRef.current) {
            // eslint-disable-next-line no-console
            console.error('[SpeakingReview] Transcript fetch error:', e);
          }
        }
      })();
    }
    return () => {
      isCancelled = true;
      try { controller.abort(); } catch (_) {}
    };
  }, [result]);

  const studentResults = {
    score: result.score,
    max_score: result.max_score,
    percentage: result.percentage,
    audio_url: normalizedAudioUrl,
    transcript: result.transcript || fetchedTranscript || ((typeof ans === 'object' && ans?.transcript) ? ans.transcript : undefined),
    time_taken: result.time_taken,
    started_at: result.started_at,
    submitted_at: result.submitted_at
  };

  const handleScoreUpdate = async (updatedScores) => {
    // For now, just log the update - in a real implementation,
    // this would call an API to update the scores in the database
    console.log('Score update requested:', updatedScores);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Speaking Test Review - {testData.test_name}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'audio', label: 'Audio' },
              { id: 'transcript', label: 'Transcript' },
              { id: 'scoring', label: 'Scoring' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Name</label>
                  <p className="mt-1 text-sm text-gray-900">{testData.test_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Score</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {studentResults.score} / {studentResults.max_score} ({studentResults.percentage}%)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Taken</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {studentResults.time_taken ? `${Math.floor(studentResults.time_taken / 60)}:${(studentResults.time_taken % 60).toString().padStart(2, '0')}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submitted At</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {studentResults.submitted_at ? new Date(studentResults.submitted_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Audio Recording</h3>
              {studentResults.audio_url ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Click the play button to listen to the student's recording:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <AudioPlayer 
                      audioUrl={studentResults.audio_url}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No audio recording available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Transcript</h3>
              {studentResults.transcript ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{studentResults.transcript}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No transcript available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Score Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Score</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {studentResults.score} / {studentResults.max_score}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Percentage</label>
                  <p className="mt-1 text-sm text-gray-900">{studentResults.percentage}%</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Score editing functionality can be implemented here to allow teachers to manually adjust scores.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakingTestReview;