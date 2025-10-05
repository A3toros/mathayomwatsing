import React, { useState, useRef, useEffect } from 'react';

const AudioPlayer = ({ audioBlob, audioUrl, recordingTime, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [audioObjectUrl, setAudioObjectUrl] = useState('');
  const [unsupportedFormat, setUnsupportedFormat] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [signedTried, setSignedTried] = useState(false);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const unmountedRef = useRef(false);

  // Cleanup effect to set unmounted flag
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);


  // Memoize audio URL creation and cleanup
  useEffect(() => {
    let aborted = false;
    if (audioUrl) {
      // Direct URL provided (e.g., from Supabase)
      console.log('AudioPlayer: Using provided URL:', audioUrl);
      if (!aborted) setAudioObjectUrl(audioUrl);
    } else if (audioBlob) {
      // Check if audioBlob is valid
      if (!audioBlob || audioBlob.size === 0) {
        console.log('Invalid audio blob provided to AudioPlayer');
        if (!aborted) setIsLoading(false);
        return;
      }
      
      // Check if audioBlob is actually a Blob
      if (!(audioBlob instanceof Blob)) {
        console.error('audioBlob is not a Blob:', typeof audioBlob, audioBlob);
        if (!aborted) setIsLoading(false);
        return;
      }
      
      console.log('AudioPlayer: Creating URL for blob:', {
        size: audioBlob.size,
        type: audioBlob.type,
        isBlob: audioBlob instanceof Blob
      });
      
      const url = URL.createObjectURL(audioBlob);
      if (!aborted) setAudioObjectUrl(url);
      
      return () => {
        aborted = true;
        console.log('AudioPlayer: Revoking URL');
        URL.revokeObjectURL(url);
      };
    }
    return () => { aborted = true; };
  }, [audioBlob, audioUrl]);

  useEffect(() => {
    let aborted = false;
    async function ensureReachable(url) {
      if (!url) return url;
      // If we've already switched to a signed URL or already tried signing, skip probing
      if (signedTried || /\/object\/sign\//.test(url)) {
        return url;
      }
      try {
        const head = await fetch(url, { method: 'HEAD' });
        if (head.ok) return url;
        if (!signedTried) {
          const u = new URL(url);
          const path = u.pathname.replace(/^\/storage\/v1\/object\/public\//, '');
          const bucket = path.split('/')[0];
          const filePath = path.substring(bucket.length + 1);
          const resp = await fetch(`/.netlify/functions/get-speaking-test-new?action=sign-audio&bucket=${encodeURIComponent(bucket)}&file_path=${encodeURIComponent(filePath)}`);
          if (resp.ok) {
            const { url: signed } = await resp.json();
            if (!aborted && !unmountedRef.current) {
              setSignedTried(true);
              setAudioObjectUrl(signed);
            }
            return signed;
          }
        }
      } catch (_) {}
      return url;
    }

    (async () => {
      if (audioUrl) {
        const maybeSigned = await ensureReachable(audioUrl);
        if (!aborted && !unmountedRef.current && !signedTried) {
          setAudioObjectUrl(maybeSigned);
        }
      }
    })();
    return () => { aborted = true; };
  }, [audioUrl, signedTried]);

  // Reset error states whenever we switch source URL
  useEffect(() => {
    let aborted = false;
    if (audioObjectUrl) {
      if (!aborted) {
        setUnsupportedFormat(false);
        setLoadError(null);
        setIsLoading(true);
      }
    }
    return () => { aborted = true; };
  }, [audioObjectUrl]);

  useEffect(() => {
    if (audioRef.current && audioObjectUrl) {
      const audio = audioRef.current;
      let aborted = false;
      
      console.log('AudioPlayer: Setting up audio with URL:', audioObjectUrl);
      
      // Assign src directly to improve metadata detection on some browsers
      try { audio.src = audioObjectUrl; } catch (_) {}
      // Force reload to ensure metadata event re-triggers
      audio.load();
      
      const updateDuration = () => {
        if (aborted || unmountedRef.current) return;
        let audioDuration = audio.duration;
        console.log('Audio duration:', audioDuration);
        console.log('Recording time prop:', recordingTime);
        // If Infinity, force browser to compute by seeking far
        if (audioDuration === Infinity) {
          try {
            audio.currentTime = 1e101;
            audio.ontimeupdate = () => {
              if (aborted || unmountedRef.current) return;
              audio.ontimeupdate = null;
              const fixed = audio.duration;
              console.log('Fixed duration via seek trick:', fixed);
              if (!aborted) {
                setDuration(isFinite(fixed) && fixed > 0 ? fixed : 0);
                audio.currentTime = 0;
                setIsLoading(false);
              }
            };
            return; // wait for ontimeupdate
          } catch (e) {
            console.warn('Seek trick failed:', e);
          }
        }
        // If invalid, try seekable/buffered end as fallback heuristics
        if (isNaN(audioDuration) || !isFinite(audioDuration) || audioDuration <= 0) {
          const useSeekable = audio.seekable && audio.seekable.length > 0 && isFinite(audio.seekable.end(0));
          const useBuffered = !useSeekable && audio.buffered && audio.buffered.length > 0 && isFinite(audio.buffered.end(audio.buffered.length - 1));
          if (useSeekable) {
            audioDuration = audio.seekable.end(0);
            console.log('Using seekable end as duration fallback:', audioDuration);
          } else if (useBuffered) {
            audioDuration = audio.buffered.end(audio.buffered.length - 1);
            console.log('Using buffered end as duration fallback:', audioDuration);
          }
        }
        if (isNaN(audioDuration) || !isFinite(audioDuration) || audioDuration <= 0) {
          console.warn('Invalid audio duration after fallbacks:', audioDuration);
          if (recordingTime && recordingTime > 0) {
            console.log('Using recording time as fallback:', recordingTime);
            if (!aborted) setDuration(recordingTime);
          } else {
            if (!aborted) setDuration(0);
          }
        } else {
          if (!aborted) setDuration(audioDuration);
        }
        if (!aborted) setIsLoading(false);
      };

      const handleLoadedMetadata = () => { 
        if (aborted || unmountedRef.current) return;
        updateDuration(); 
      };
      const handleDurationChange = () => { 
        if (aborted || unmountedRef.current) return;
        updateDuration(); 
      };
      const handleCanPlay = () => { 
        if (aborted || unmountedRef.current) return;
        updateDuration(); 
      };
      const handleCanPlayThrough = () => { 
        if (aborted || unmountedRef.current) return;
        updateDuration(); 
      };

      const handleTimeUpdate = () => {
        if (aborted || unmountedRef.current) return;
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        if (aborted || unmountedRef.current) return;
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handlePlay = () => {
        if (aborted || unmountedRef.current) return;
        setIsPlaying(true);
      };
      const handlePause = () => {
        if (aborted || unmountedRef.current) return;
        setIsPlaying(false);
      };
      
      const handleError = (e) => {
        if (aborted || unmountedRef.current) return;
        console.error('Audio loading error:', e);
        console.error('Audio error details:', {
          error: audio.error,
          networkState: audio.networkState,
          readyState: audio.readyState,
          src: audio.src,
          currentSrc: audio.currentSrc
        });
        const code = audio.error?.code;
        console.log('Audio error code:', code, 'MEDIA_ERR_SRC_NOT_SUPPORTED is 4');
        // Only mark unsupported for MEDIA_ERR_SRC_NOT_SUPPORTED (code 4)
        if (code === 4) {
          console.log('Marking format as unsupported due to error code 4');
          setUnsupportedFormat(true);
        } else {
          console.log('Not marking as unsupported, error code:', code);
        }
        setLoadError(audio.error || { code });
        setIsLoading(false);
      };

      // Fallback timer in case neither loadedmetadata nor error fires (e.g., unsupported AAC)
      const fallbackTimer = setTimeout(() => {
        if (aborted || unmountedRef.current) return;
        if (audio.readyState === 0) {
          console.warn('AudioPlayer: Fallback timeout reached; stopping loader but not marking unsupported');
          setIsLoading(false);
        }
      }, 6000);

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('canplaythrough', handleCanPlayThrough);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('error', handleError);

      return () => {
        aborted = true;
        clearTimeout(fallbackTimer);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('error', handleError);
        // Clean up the audio element
        audio.pause();
        audio.src = '';
        audio.load();
      };
    }
  }, [audioObjectUrl, recordingTime]);

  // Handle recordingTime prop changes
  useEffect(() => {
    let aborted = false;
    if (recordingTime && recordingTime > 0 && (isNaN(duration) || !isFinite(duration) || duration <= 0)) {
      console.log('Updating duration from recordingTime prop:', recordingTime);
      if (!aborted) {
        setDuration(recordingTime);
      }
    }
    return () => { aborted = true; };
  }, [recordingTime, duration]);

  const togglePlayPause = () => {
    console.log('Play button clicked, audioRef.current:', audioRef.current);
    console.log('Audio src:', audioRef.current?.src);
    console.log('Audio readyState:', audioRef.current?.readyState);
    console.log('Audio networkState:', audioRef.current?.networkState);
    
    if (audioRef.current) {
      if (isPlaying) {
        console.log('Pausing audio');
        audioRef.current.pause();
      } else {
        console.log('Playing audio');
        audioRef.current.play().catch(error => {
          console.error('Play failed:', error);
        });
      }
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && progressRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = Math.max(0, Math.min(duration, (clickX / width) * duration));
      
      // Only set currentTime if it's a valid number
      if (isFinite(newTime) && newTime >= 0) {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioBlob && !audioUrl) {
    return (
      <div className={`audio-player ${className}`}>
        <div className="text-center text-gray-500 py-8">
          No audio available
        </div>
      </div>
    );
  }

  // Infer MIME type from URL for better compatibility diagnostics
  const inferMimeFromUrl = (url) => {
    try {
      const lower = (url || '').toLowerCase();
      // Remove query parameters and hash for extension detection
      const cleanUrl = lower.split('?')[0].split('#')[0];
      if (cleanUrl.endsWith('.webm')) return 'audio/webm';
      if (cleanUrl.endsWith('.mp3')) return 'audio/mpeg';
      if (cleanUrl.endsWith('.m4a')) return 'audio/mp4';
      if (cleanUrl.endsWith('.aac')) return 'audio/aac';
      if (cleanUrl.endsWith('.wav')) return 'audio/wav';
      return undefined;
    } catch (_) {
      return undefined;
    }
  };

  const guessedType = inferMimeFromUrl(audioObjectUrl || audioUrl);
  
  // Check if browser supports WebM
  const webmSupported = React.useMemo(() => {
    if (typeof window === 'undefined') return true;
    const audio = document.createElement('audio');
    return audio.canPlayType('audio/webm') !== '';
  }, []);
  
  console.log('AudioPlayer: URL analysis', {
    audioObjectUrl,
    audioUrl,
    guessedType,
    unsupportedFormat,
    loadError,
    webmSupported,
    canPlayWebM: typeof window !== 'undefined' ? document.createElement('audio').canPlayType('audio/webm') : 'unknown'
  });

  return (
    <div className={`audio-player bg-gray-50 rounded-lg p-4 ${className}`}>
      <audio ref={audioRef} preload="metadata" controls={false} style={{ display: 'none' }} crossOrigin="anonymous">
        {/* Provide a <source> with inferred type to help browser decoding */}
        <source src={audioObjectUrl} type={guessedType} />
      </audio>
      
      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Loading audio...</p>
        </div>
      ) : unsupportedFormat ? (
        <div className="text-center py-4">
          <p className="text-sm text-red-600">
            This audio format isn't supported by your browser.
          </p>
          {audioObjectUrl ? (
            <a
              href={audioObjectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm"
            >
              Open in new tab
            </a>
          ) : null}
          {guessedType ? (
            <p className="text-xs text-gray-500 mt-1">Detected type: {guessedType}</p>
          ) : null}
          <p className="text-xs text-gray-500 mt-1">
            Browser WebM support: {webmSupported ? 'Yes' : 'No'} 
            {!webmSupported && ' - Try using Chrome, Firefox, or Edge'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Preferred format: WebM</p>
        </div>
      ) : loadError ? (
        <div className="text-center py-4">
          <p className="text-sm text-red-600">Playback failed. Please try opening the audio directly.</p>
          {audioObjectUrl ? (
            <a
              href={audioObjectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm"
            >
              Open in new tab
            </a>
          ) : null}
          {guessedType ? (
            <p className="text-xs text-gray-500 mt-1">Detected type: {guessedType}</p>
          ) : null}
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-4">
            <div
              ref={progressRef}
              className="w-full bg-gray-200 rounded-full h-2 cursor-pointer hover:h-3 transition-all"
              onClick={handleSeek}
            >
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16"
                />
              </div>
            </div>

            {/* Playback Speed */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Speed:</span>
              <select
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
          </div>

          {/* Audio Info */}
          <div className="mt-3 text-xs text-gray-500 text-center">
            Audio format: WebM • Duration: {formatTime(duration)}
          </div>
        </>
      )}
    </div>
  );
};

export default AudioPlayer;
