import { useState, useCallback, useRef } from 'react';

/**
 * Extract frames from a sprite sheet image
 * Supports both grid-based (framesPerRow < total frames) and horizontal strip (framesPerRow = total frames)
 * @param {Image} spriteSheet - The loaded sprite sheet image
 * @param {number} frameWidth - Width of each frame
 * @param {number} frameHeight - Height of each frame
 * @param {number} framesPerRow - Number of frames per row in the grid (or total frames for horizontal strip)
 * @param {Array<number>} frameIndices - Array of frame indices to extract (0-based, left-to-right, top-to-bottom)
 * @returns {Promise<Array<Image>>} Promise that resolves to array of frame images
 */
function extractFramesFromSpriteSheet(spriteSheet, frameWidth, frameHeight, framesPerRow, frameIndices) {
  return new Promise((resolve, reject) => {
    const frames = [];
    const canvas = document.createElement('canvas');
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    let loadedCount = 0;
    let hasError = false;

    if (frameIndices.length === 0) {
      resolve(frames);
      return;
    }

    // Check if sprite sheet is loaded
    if (!spriteSheet || !spriteSheet.complete || spriteSheet.naturalWidth === 0) {
      reject(new Error('Sprite sheet image not loaded'));
      return;
    }

    frameIndices.forEach((frameIndex) => {
      try {
        // Calculate grid position
        const row = Math.floor(frameIndex / framesPerRow);
        const col = frameIndex % framesPerRow;
        
        // Calculate source position in sprite sheet
        const sourceX = col * frameWidth;
        const sourceY = row * frameHeight;

        // Validate source position
        if (sourceX + frameWidth > spriteSheet.width || sourceY + frameHeight > spriteSheet.height) {
          console.warn(`Frame ${frameIndex} extends beyond sprite sheet bounds. Sheet: ${spriteSheet.width}x${spriteSheet.height}, Frame: ${sourceX},${sourceY} ${frameWidth}x${frameHeight}`);
        }

        // Clear canvas
        ctx.clearRect(0, 0, frameWidth, frameHeight);
        
        // Draw the frame from sprite sheet
        ctx.drawImage(
          spriteSheet,
          sourceX, sourceY,  // Source position (x, y) in grid
          frameWidth, frameHeight,  // Source size
          0, 0,  // Destination position
          frameWidth, frameHeight  // Destination size
        );

        // Create new image from canvas
        const frameImg = new Image();
        frameImg.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(new Error(`Failed to create frame image for frame ${frameIndex}`));
          }
        };
        frameImg.onload = () => {
          loadedCount++;
          if (loadedCount === frameIndices.length && !hasError) {
            resolve(frames);
          }
        };
        frameImg.src = canvas.toDataURL();
        frames.push(frameImg);
      } catch (error) {
        if (!hasError) {
          hasError = true;
          reject(error);
        }
      }
    });
  });
}

export function useAssetLoader() {
  const loadedAssetsRef = useRef(new Map());

  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      // Normalize path - if it's a relative path (starts with Art/), prepend /
      // This ensures Vite serves it from the public directory
      let normalizedSrc = src;
      if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/') && !src.startsWith('data:')) {
        normalizedSrc = `/${src}`;
      }
      
      // Check if already loaded (use original src as key for caching)
      if (loadedAssetsRef.current.has(src)) {
        resolve(loadedAssetsRef.current.get(src));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        loadedAssetsRef.current.set(src, img);
        resolve(img);
      };
      
      img.onerror = (error) => {
        console.error(`Failed to load image: ${normalizedSrc} (original: ${src})`, error);
        reject(new Error(`Failed to load image: ${normalizedSrc}`));
      };
      
      img.src = normalizedSrc;
    });
  }, []);

  /**
   * Load a sprite sheet and extract specific frames by indices
   * @param {string} src - Path to sprite sheet image
   * @param {number} frameWidth - Width of each frame
   * @param {number} frameHeight - Height of each frame
   * @param {number} framesPerRow - Number of frames per row in the grid
   * @param {Array<number>} frameIndices - Array of frame indices to extract
   * @returns {Promise<Array<Image>>} Promise that resolves to array of frame images
   */
  const loadSpriteSheet = useCallback(async (src, frameWidth, frameHeight, framesPerRow, frameIndices) => {
    const cacheKey = `${src}_${frameWidth}_${frameHeight}_${framesPerRow}_${frameIndices.join(',')}`;
    
    // Check cache
    if (loadedAssetsRef.current.has(cacheKey)) {
      return loadedAssetsRef.current.get(cacheKey);
    }

    // Load the sprite sheet
    const spriteSheet = await loadImage(src);
    
    // Extract frames by indices (returns a Promise)
    const frames = await extractFramesFromSpriteSheet(spriteSheet, frameWidth, frameHeight, framesPerRow, frameIndices);
    
    // Cache the frames
    loadedAssetsRef.current.set(cacheKey, frames);
    
    return frames;
  }, [loadImage]);

  const loadMultipleImages = useCallback(async (srcs) => {
    const promises = srcs.map(src => loadImage(src));
    return Promise.all(promises);
  }, [loadImage]);

  return {
    loadImage,
    loadSpriteSheet,
    loadMultipleImages
  };
}

