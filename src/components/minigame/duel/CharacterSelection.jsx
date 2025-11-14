import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAssetLoader } from '../../../hooks/useAssetLoader';
import { CHARACTER_SPRITE_CONFIG } from '../../../config/characterSpriteSheets';

const CHARACTERS = [
  { id: 'archer', name: 'Archer' },
  { id: 'swordsman', name: 'Swordsman' },
  { id: 'wizard', name: 'Wizard' },
  { id: 'enchantress', name: 'Enchantress' },
  { id: 'knight', name: 'Knight' },
  { id: 'musketeer', name: 'Musketeer' }
];

const CharacterSelection = ({ studentNickname, onSelect, onJoinLobby, hasSelectedCharacter }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [characterFrames, setCharacterFrames] = useState({}); // Store extracted frames for each character
  const [frameIndices, setFrameIndices] = useState({}); // Current frame index for each character
  const { loadSpriteSheet, loadImage } = useAssetLoader();
  const animationRefs = useRef({});

  useEffect(() => {
    // Load and extract frames from sprite sheets
    const loadCharacters = async () => {
      const frames = {};
      const indices = {};
      
      for (const char of CHARACTERS) {
        try {
          const charConfig = CHARACTER_SPRITE_CONFIG[char.id];
          if (!charConfig) continue;
          
          // Character folder names are capitalized (Archer, not archer)
          const characterFolderName = char.id.charAt(0).toUpperCase() + char.id.slice(1);
          
          // Use Idle.png file for character selection (preferred) or spritelist
          const idleConfig = charConfig.animations.idle;
          let spritePath;
          let framesPerRow;
          let frameIndices;
          let frameWidth = charConfig.frameWidth;
          let frameHeight = charConfig.frameHeight;
          
          if (idleConfig.file) {
            // Use Idle.png file (horizontal strip with 6 frames)
            spritePath = `Art/Characters/${charConfig.gender}/${characterFolderName}/${idleConfig.file}`;
            const numFrames = idleConfig.numFrames || 6;
            framesPerRow = numFrames; // For horizontal strip, framesPerRow = numFrames
            frameIndices = Array.from({ length: numFrames }, (_, i) => i);
            
            // For horizontal strips, calculate frameWidth from image dimensions
            try {
              const testImg = await loadImage(spritePath);
              const actualFrameWidth = Math.floor(testImg.width / numFrames);
              const actualFrameHeight = testImg.height;
              console.log(`${char.id} Idle.png dimensions: ${testImg.width}x${testImg.height}, calculated frame: ${actualFrameWidth}x${actualFrameHeight}`);
              
              // Use calculated dimensions if they differ significantly from config
              if (Math.abs(actualFrameWidth - frameWidth) > 5) {
                console.log(`Using calculated frame dimensions: ${actualFrameWidth}x${actualFrameHeight} (config had ${frameWidth}x${frameHeight})`);
                frameWidth = actualFrameWidth;
                frameHeight = actualFrameHeight;
              }
            } catch (e) {
              console.warn(`Could not pre-check image dimensions for ${char.id}:`, e);
            }
          } else if (idleConfig.frameIndices && charConfig.spriteSheet) {
            // Use spritelist with frame indices
            spritePath = `Art/Characters/${charConfig.gender}/${characterFolderName}/${charConfig.spriteSheet}`;
            framesPerRow = charConfig.framesPerRow || 14;
            frameIndices = idleConfig.frameIndices;
          } else {
            // Fallback: use spritelist or default
            spritePath = charConfig.spriteSheet
              ? `Art/Characters/${charConfig.gender}/${characterFolderName}/${charConfig.spriteSheet}`
              : `Art/Characters/${charConfig.gender}/${characterFolderName}/Idle.png`;
            const numFrames = idleConfig.numFrames || 6;
            framesPerRow = numFrames;
            frameIndices = Array.from({ length: numFrames }, (_, i) => i);
          }
          
          // Extract frames from sprite sheet
          try {
            const extractedFrames = await loadSpriteSheet(
              spritePath,
              frameWidth, // Use calculated or config frameWidth
              frameHeight, // Use calculated or config frameHeight
              framesPerRow,
              frameIndices
            );
            console.log(`Loaded ${extractedFrames.length} frames for ${char.id} from ${spritePath} (expected ${frameIndices.length})`);
            if (extractedFrames.length !== frameIndices.length) {
              console.warn(`Frame count mismatch for ${char.id}: got ${extractedFrames.length}, expected ${frameIndices.length}`);
            }
            frames[char.id] = extractedFrames;
          } catch (error) {
            console.error(`Failed to extract frames for ${char.id}:`, error);
            // Don't set frames, will show loading spinner
          }
          
          indices[char.id] = 0; // Start at first frame
        } catch (error) {
          console.error(`Failed to load character ${char.id}:`, error);
        }
      }
      
      setCharacterFrames(frames);
      setFrameIndices(indices);
    };
    
    loadCharacters();
  }, [loadSpriteSheet]);

  // Animate each character's frames
  useEffect(() => {
    // Start animations for all loaded characters
    Object.keys(characterFrames).forEach(charId => {
      const frames = characterFrames[charId];
      if (!frames || frames.length === 0) return;

      const charConfig = CHARACTER_SPRITE_CONFIG[charId];
      const frameDuration = charConfig?.animations?.idle?.frameDuration || 500;

      animationRefs.current[charId] = setInterval(() => {
        setFrameIndices(prev => ({
          ...prev,
          [charId]: ((prev[charId] || 0) + 1) % frames.length
        }));
      }, frameDuration);
    });

    // Cleanup on unmount
    return () => {
      Object.values(animationRefs.current).forEach(interval => {
        clearInterval(interval);
      });
      animationRefs.current = {};
    };
  }, [characterFrames]);

  const handleSelect = (characterId) => {
    setSelectedId(characterId);
    onSelect(characterId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Choose Your Champion
          </motion.h1>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300"
          >
            Welcome, {studentNickname}!
          </motion.p>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {CHARACTERS.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(character.id)}
              className={`
                relative cursor-pointer rounded-lg overflow-hidden
                ${selectedId === character.id
                  ? 'ring-4 ring-yellow-400 shadow-2xl'
                  : 'ring-2 ring-gray-600 hover:ring-yellow-500'
                }
                bg-gradient-to-br from-gray-800 to-gray-900
                transition-all duration-300
              `}
            >
              {/* Character Image - Show one extracted frame at a time */}
              <div className="aspect-square flex items-center justify-center bg-gray-900 p-4">
                {characterFrames[character.id] && characterFrames[character.id].length > 0 ? (
                  (() => {
                    const currentFrameIndex = frameIndices[character.id] || 0;
                    const currentFrame = characterFrames[character.id][currentFrameIndex];
                    return currentFrame ? (
                      <img
                        src={currentFrame.src}
                        alt={character.name}
                        className="max-w-full max-h-full object-contain"
                        style={{
                          imageRendering: 'pixelated' // Keep pixel art crisp
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                  </div>
                )}
              </div>

              {/* Character Name */}
              <div className="p-4 bg-gray-800 text-center">
                <h3 className="text-lg font-semibold text-white">{character.name}</h3>
              </div>

              {/* Selection Indicator */}
              {selectedId === character.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 bg-yellow-400 rounded-full p-2"
                >
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

            {/* Instructions */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-8 text-gray-400"
            >
              {selectedId ? 'Click "Join Lobby" to continue' : 'Click on a character to select'}
            </motion.p>

            {/* Join Lobby Button - shown after character selection */}
            {selectedId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    console.log('[CharacterSelection] Join Lobby button clicked', { selectedId, onJoinLobby: !!onJoinLobby });
                    if (onJoinLobby) {
                      onJoinLobby();
                    } else {
                      console.error('[CharacterSelection] onJoinLobby is not defined');
                    }
                  }}
                  disabled={!onJoinLobby}
                  className={`px-8 py-4 text-white font-bold text-lg rounded-lg shadow-lg transition-all ${
                    onJoinLobby
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 cursor-pointer'
                      : 'bg-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  Join Lobby
                </motion.button>
                {!onJoinLobby && (
                  <p className="text-red-400 text-sm mt-2">Error: Join function not available</p>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      );
    };

    export default CharacterSelection;

