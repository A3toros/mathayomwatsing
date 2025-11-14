import { useEffect, useRef } from 'react';

export default function useGameLoop(callback, isRunning = true) {
  const callbackRef = useRef(callback);
  const frameRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isRunning) return;

    const loop = (timestamp) => {
      callbackRef.current(timestamp);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isRunning]);

  return frameRef;
}

