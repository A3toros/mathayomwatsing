/**
 * Convert any audio blob to WAV format
 * NOTE: Now optimized to 16kHz for smaller file sizes
 * This is an alias for convertBlobToWav16kHz() for backward compatibility
 * @param {Blob} blob - Audio blob
 * @param {AudioContext} audioContext - Existing AudioContext or null
 * @returns {Promise<Blob>} WAV blob at 16 kHz, mono, 16-bit
 */
export async function convertBlobToWav(blob, audioContext) {
  // Delegate to the optimized 16kHz conversion function
  return convertBlobToWav16kHz(blob, audioContext);
}

/**
 * Convert any audio blob to WAV format at 16 kHz sample rate
 * Optimized for speech recognition (Assembly AI)
 * @param {Blob} blob - Audio blob (typically WebM/Opus from MediaRecorder)
 * @param {AudioContext} audioContext - Existing AudioContext or null
 * @returns {Promise<Blob>} WAV blob at 16 kHz, mono, 16-bit
 */
export async function convertBlobToWav16kHz(blob, audioContext) {
  if (!blob) {
    return blob;
  }

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const context = await getAudioContext(audioContext);
    const decodedBuffer = await decodeAudioData(context, arrayBuffer);
    
    // Resample to 16kHz if needed
    const resampledBuffer = await resampleAudioBuffer(decodedBuffer, 16000);
    
    // Convert to mono if stereo
    const monoBuffer = await convertToMono(resampledBuffer);
    
    // Encode as WAV using existing function (will use 16kHz from resampled buffer)
    const wavBuffer = audioBufferToWav(monoBuffer);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
    
    return wavBlob;
  } catch (error) {
    console.warn('convertBlobToWav16kHz: failed to convert, returning original blob', error);
    return blob;
  }
}

async function getAudioContext(existingContext) {
  if (existingContext && existingContext.state !== 'closed') {
    return existingContext;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('AudioContext is not supported in this browser');
  }

  const context = new AudioCtx();
  if (context.state === 'suspended' && context.resume) {
    try {
      await context.resume();
    } catch (_) {
      // Ignore resume errors; context can still decode.
    }
  }

  return context;
}

function decodeAudioData(context, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const bufferCopy = arrayBuffer.slice(0);
    const decodePromise = context.decodeAudioData(bufferCopy, resolve, reject);
    if (decodePromise && typeof decodePromise.then === 'function') {
      decodePromise.then(resolve).catch(reject);
    }
  });
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels || 1;
  const sampleRate = buffer.sampleRate || 44100;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const totalSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, byteRate, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bytesPerSample * 8, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  /* write interleaved data */
  let offset = 44;
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < numFrames; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Resample AudioBuffer to target sample rate
 * @param {AudioBuffer} audioBuffer - Source AudioBuffer
 * @param {number} targetSampleRate - Target sample rate (e.g., 16000)
 * @returns {Promise<AudioBuffer>} Resampled AudioBuffer
 */
async function resampleAudioBuffer(audioBuffer, targetSampleRate) {
  const originalSampleRate = audioBuffer.sampleRate;
  
  // If already at target rate, return as-is
  if (originalSampleRate === targetSampleRate) {
    return audioBuffer;
  }
  
  const numberOfChannels = audioBuffer.numberOfChannels;
  const ratio = targetSampleRate / originalSampleRate;
  const newLength = Math.round(audioBuffer.length * ratio);
  
  // Use OfflineAudioContext for efficient resampling
  const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContext) {
    console.warn('OfflineAudioContext not supported, cannot resample');
    return audioBuffer; // Fallback: return original
  }
  
  const offlineContext = new OfflineAudioContext(
    numberOfChannels,
    newLength,
    targetSampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  
  try {
    const resampledBuffer = await offlineContext.startRendering();
    return resampledBuffer;
  } catch (error) {
    console.warn('Resampling failed, returning original buffer', error);
    return audioBuffer; // Fallback: return original
  }
}

/**
 * Convert AudioBuffer to mono (single channel)
 * @param {AudioBuffer} audioBuffer - Source AudioBuffer (can be mono or stereo)
 * @returns {Promise<AudioBuffer>} Mono AudioBuffer
 */
async function convertToMono(audioBuffer) {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer;
  }
  
  const numberOfChannels = 1;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  // Create new mono buffer
  const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContext) {
    console.warn('OfflineAudioContext not supported, cannot convert to mono');
    return audioBuffer; // Fallback: return original
  }
  
  const offlineContext = new OfflineAudioContext(
    numberOfChannels,
    length,
    sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // If stereo, mix channels to mono
  if (audioBuffer.numberOfChannels === 2) {
    const merger = offlineContext.createChannelMerger(1);
    const splitter = offlineContext.createChannelSplitter(2);
    
    source.connect(splitter);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 1, 0);
    merger.connect(offlineContext.destination);
  } else {
    // For other multi-channel, just take first channel
    const splitter = offlineContext.createChannelSplitter(1);
    source.connect(splitter);
    splitter.connect(offlineContext.destination, 0, 0);
  }
  
  source.start();
  
  try {
    const monoBuffer = await offlineContext.startRendering();
    return monoBuffer;
  } catch (error) {
    console.warn('Mono conversion failed, returning original buffer', error);
    return audioBuffer; // Fallback: return original
  }
}

