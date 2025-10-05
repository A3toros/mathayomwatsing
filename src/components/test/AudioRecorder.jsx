import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';

const AudioRecorder = forwardRef(({ 
  onRecordingComplete, 
  minDuration = 0, 
  maxDuration = 600,
  minWords = 50,
  maxAttempts = 3,
  currentAttempt = 1 
}, ref) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);
  const [recordingQuality, setRecordingQuality] = useState('good');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useImperativeHandle(ref, () => ({
    startRecording: () => startRecording(),
    stopRecording: () => stopRecording(),
    pauseRecording: () => pauseRecording(),
    resumeRecording: () => resumeRecording()
  }));

  // Note: Microphone permission is now handled by the parent component
  // This component assumes permission has already been granted

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Check if microphone is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser');
      }
      
      // Request microphone access with explicit permission request
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      console.log('🎤 Microphone permission granted');
      
      streamRef.current = stream;
      
      // Set up audio analysis for quality monitoring
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start monitoring audio quality
      monitorAudioQuality();
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Call onRecordingComplete with the blob and recording time
        onRecordingComplete(audioBlob, recordingTime);
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Auto-stop at max duration
          if (newTime >= maxDuration) {
            stopRecording();
          }
          
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      
      if (error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotSupportedError') {
        setError('Microphone access is not supported in this browser. Please use a modern browser.');
      } else {
        setError(`Failed to access microphone: ${error.message}`);
      }
    }
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Check if recording meets minimum requirements
      if (recordingTime < minDuration) {
        setError(`Recording must be at least ${minDuration} seconds long.`);
        return;
      }
    }
  }, [isRecording, recordingTime, minDuration, audioBlob, onRecordingComplete]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    }
  }, [isRecording, isPaused, maxDuration, stopRecording]);

  const monitorAudioQuality = useCallback(() => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkQuality = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      
      // Determine quality based on volume
      if (average < 10) {
        setRecordingQuality('poor');
      } else if (average < 30) {
        setRecordingQuality('fair');
      } else {
        setRecordingQuality('good');
      }
      
      if (isRecording) {
        animationRef.current = requestAnimationFrame(checkQuality);
      }
    };
    
    checkQuality();
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityColor = () => {
    switch (recordingQuality) {
      case 'poor': return 'text-red-600';
      case 'fair': return 'text-yellow-600';
      case 'good': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityText = () => {
    switch (recordingQuality) {
      case 'poor': return 'Poor audio quality - speak closer to microphone';
      case 'fair': return 'Fair audio quality - good for recording';
      case 'good': return 'Excellent audio quality';
      default: return 'Monitoring audio quality...';
    }
  };

  return (
    <div className="audio-recorder bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Record Your Response</h3>
        <p className="text-gray-600">
          Speak clearly and at a normal pace. You can pause and resume if needed.
        </p>
      </div>

      {/* Recording Status */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {formatTime(recordingTime)}
        </div>
        <div className={`text-sm ${getQualityColor()}`}>
          {getQualityText()}
        </div>
        {isPaused && (
          <div className="text-yellow-600 font-semibold mt-2">
            ⏸️ Recording Paused
          </div>
        )}
      </div>

      {/* Audio Visualization */}
      {isRecording && (
        <div className="mb-6">
          <div className="flex justify-center items-center space-x-1 h-8">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="bg-blue-400 rounded-sm"
                style={{
                  width: '4px',
                  height: `${Math.random() * 20 + 4}px`,
                  animation: 'pulse 0.5s ease-in-out infinite'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Controls - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="w-full sm:w-auto bg-red-600 text-white px-6 py-4 rounded-full hover:bg-red-700 flex items-center justify-center space-x-2 min-h-[48px] text-lg font-semibold"
          >
            <span className="text-xl">🎤</span>
            <span>Start Recording</span>
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                className="w-full sm:w-auto bg-yellow-600 text-white px-6 py-4 rounded-full hover:bg-yellow-700 flex items-center justify-center space-x-2 min-h-[48px] text-lg font-semibold"
              >
                <span className="text-xl">⏸️</span>
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="w-full sm:w-auto bg-green-600 text-white px-6 py-4 rounded-full hover:bg-green-700 flex items-center justify-center space-x-2 min-h-[48px] text-lg font-semibold"
              >
                <span className="text-xl">▶️</span>
                <span>Resume</span>
              </button>
            )}
            <button
              onClick={stopRecording}
              className="w-full sm:w-auto bg-gray-600 text-white px-6 py-4 rounded-full hover:bg-gray-700 flex items-center justify-center space-x-2 min-h-[48px] text-lg font-semibold"
            >
              <span className="text-xl">⏹️</span>
              <span>Stop & Submit</span>
            </button>
          </>
        )}
      </div>


      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Attempt Info */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Attempt {currentAttempt} of {maxAttempts}
        {currentAttempt < maxAttempts && (
          <span className="ml-2 text-blue-600">
            (You can re-record if needed)
          </span>
        )}
      </div>
    </div>
  );
});

export default AudioRecorder;
