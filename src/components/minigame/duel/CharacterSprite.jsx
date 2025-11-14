import React, { useState, useEffect, useRef } from 'react';
import { Image, Group } from 'react-konva';
import { useAssetLoader } from '../../../hooks/useAssetLoader';
import { CHARACTER_SPRITE_CONFIG } from '../../../config/characterSpriteSheets';

const CharacterSprite = ({ characterId, position, isMoving, direction, isAttacking = false, isHurt = false, isDead = false }) => {
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [frameIndex, setFrameIndex] = useState(0);
  const [animationFrames, setAnimationFrames] = useState({}); // Store extracted frame images
  const { loadSpriteSheet, loadImage } = useAssetLoader();
  const animationRef = useRef(null);

  // Get character config
  const charConfig = CHARACTER_SPRITE_CONFIG[characterId] || CHARACTER_SPRITE_CONFIG.archer;
  const configGender = charConfig.gender;

  // Load character sprite sheets and extract frames
  useEffect(() => {
    const loadCharacterFrames = async () => {
      const frames = {};
      const { animations } = charConfig;
      
      for (const [animName, animConfig] of Object.entries(animations)) {
        try {
          // Character folder names are capitalized (Archer, not archer)
          const characterFolderName = characterId.charAt(0).toUpperCase() + characterId.slice(1);
          
          // Determine sprite path:
          // 1. If animation has its own file (like Shot_1.png for attack), use that
          // 2. Otherwise, use spritelist file if available
          // 3. Fall back to individual animation file
          let spritePath;
          let framesPerRow;
          let frameWidth = charConfig.frameWidth;
          let frameHeight = charConfig.frameHeight;
          
          if (animConfig.file) {
            // Animation has its own sprite sheet file (e.g., Shot_1.png, Walk.png)
            spritePath = `Art/Characters/${configGender}/${characterFolderName}/${animConfig.file}`;
            const numFrames = animConfig.numFrames || 2;
            framesPerRow = numFrames; // For horizontal strips, framesPerRow = numFrames
            
            // Calculate frame dimensions from actual image (same logic as CharacterSelection)
            try {
              const testImg = await loadImage(spritePath);
              const actualFrameWidth = Math.floor(testImg.width / numFrames);
              const actualFrameHeight = testImg.height;
              console.log(`${characterId} ${animName} ${animConfig.file} dimensions: ${testImg.width}x${testImg.height}, calculated frame: ${actualFrameWidth}x${actualFrameHeight}`);
              
              // Use calculated dimensions if they differ significantly from config
              if (Math.abs(actualFrameWidth - frameWidth) > 5) {
                console.log(`Using calculated frame dimensions for ${animName}: ${actualFrameWidth}x${actualFrameHeight} (config had ${frameWidth}x${frameHeight})`);
                frameWidth = actualFrameWidth;
                frameHeight = actualFrameHeight;
              }
            } catch (e) {
              console.warn(`Could not pre-check image dimensions for ${characterId} ${animName}:`, e);
            }
          } else if (charConfig.spriteSheet) {
            // Use main spritelist file
            spritePath = `Art/Characters/${configGender}/${characterFolderName}/${charConfig.spriteSheet}`;
            framesPerRow = charConfig.framesPerRow || 14;
          } else {
            // Fallback to individual animation file
            spritePath = `Art/Characters/${configGender}/${characterFolderName}/${animConfig.file}`;
            framesPerRow = animConfig.framesPerRow || charConfig.framesPerRow || 14;
          }
          
          // Extract frames from sprite sheet
          // If frame indices are specified, use them; otherwise extract sequentially
          let extractedFrames;
          if (animConfig.frameIndices && animConfig.frameIndices.length > 0) {
            extractedFrames = await loadSpriteSheet(
              spritePath,
              frameWidth, // Use calculated or config frameWidth
              frameHeight, // Use calculated or config frameHeight
              framesPerRow,
              animConfig.frameIndices
            );
          } else {
            // Extract frames sequentially (for horizontal strips or default)
            const numFrames = animConfig.numFrames || 2;
            const frameIndices = Array.from({ length: numFrames }, (_, i) => i);
            extractedFrames = await loadSpriteSheet(
              spritePath,
              frameWidth, // Use calculated or config frameWidth
              frameHeight, // Use calculated or config frameHeight
              framesPerRow,
              frameIndices
            );
          }
          
          frames[animName] = {
            frames: extractedFrames,
            frameDuration: animConfig.frameDuration
          };
        } catch (error) {
          console.error(`Failed to load ${characterId} ${animName} sprite sheet:`, error);
          frames[animName] = null;
        }
      }
      
      setAnimationFrames(frames);
    };
    
    loadCharacterFrames();
  }, [characterId, charConfig, loadSpriteSheet]);

  // Determine animation state
  useEffect(() => {
    if (isDead) {
      setCurrentAnimation('dead');
    } else if (isHurt) {
      setCurrentAnimation('hurt');
    } else if (isAttacking) {
      setCurrentAnimation('attack');
    } else if (isMoving) {
      setCurrentAnimation('walk');
    } else {
      setCurrentAnimation('idle');
    }
  }, [isMoving, isAttacking, isHurt, isDead]);

  // Animation loop - cycle through extracted frames
  useEffect(() => {
    const animData = animationFrames[currentAnimation];
    if (!animData || !animData.frames || animData.frames.length === 0) return;

    const numFrames = animData.frames.length;
    const frameDuration = animData.frameDuration || 
                         (currentAnimation === 'attack' ? 150 : 
                          currentAnimation === 'hurt' ? 300 :
                          currentAnimation === 'dead' ? 0 : 500);

    if (frameDuration === 0) {
      // Dead state - stay on first frame
      setFrameIndex(0);
      return;
    }

    // Cycle through frames
    animationRef.current = setInterval(() => {
      setFrameIndex(prev => {
        const nextIndex = (prev + 1) % numFrames;
        
        // If attack animation completes, return to idle
        if (currentAnimation === 'attack' && nextIndex === 0) {
          setCurrentAnimation('idle');
          return 0;
        }
        
        return nextIndex;
      });
    }, frameDuration);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [currentAnimation, animationFrames]);

  // Get current animation frames
  const animData = animationFrames[currentAnimation];
  if (!animData || !animData.frames || animData.frames.length === 0) {
    return null; // Still loading
  }

  const { frameWidth, frameHeight } = charConfig;
  const currentFrame = animData.frames[frameIndex];
  if (!currentFrame) {
    return null;
  }

  return (
    <Group x={position.x} y={position.y}>
      <Image
        image={currentFrame}
        x={-30}
        y={-50}
        width={60}
        height={100}
        scaleX={direction}
      />
    </Group>
  );
};

export default CharacterSprite;

