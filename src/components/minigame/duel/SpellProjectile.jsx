import React, { useState, useEffect, useRef } from 'react';
import { Image, Group } from 'react-konva';
import { useAssetLoader } from '../../../hooks/useAssetLoader';

const SPELL_CONFIG = {
  fire_arrow: {
    // Fire Arrow animation (8 frames) - used for all characters except archer
    frames: 8,
    frameDuration: 80,
    speed: 10,
    path: 'Art/Spells/Fire Arrow/PNG/Fire Arrow_Frame_',
    isSingleImage: false
  },
  fire_arrow_archer: {
    // Arrow.png from character folder (single frame, no animation) - only for archer
    frames: 1,
    frameDuration: 0, // No animation needed
    speed: 10,
    path: 'Art/Characters/men/Archer/Arrow.png', // Single image file
    isSingleImage: true
  },
  water_spell: {
    frames: 8,
    frameDuration: 80,
    speed: 5,
    path: 'Art/Spells/Water Spell/PNG/Water Spell_Frame_',
    isSingleImage: false
  }
};

const SpellProjectile = ({ spell, onUpdate, isMobile = false, characterId = null }) => {
  const [position, setPosition] = useState(spell.startPosition || { x: 0, y: 0 });
  const [frameIndex, setFrameIndex] = useState(0);
  const [spellImages, setSpellImages] = useState([]);
  const { loadImage } = useAssetLoader();
  const animationRef = useRef(null);
  const movementRef = useRef(null);

  // Determine which config to use based on spell type and character
  // Archer uses arrow, all other characters use Fire Arrow animation
  const getSpellConfig = () => {
    if (spell.type === 'fire_arrow') {
      // Check if character is archer
      if (characterId === 'archer') {
        return SPELL_CONFIG.fire_arrow_archer;
      } else {
        // All other characters use Fire Arrow animation
        return SPELL_CONFIG.fire_arrow;
      }
    }
    return SPELL_CONFIG[spell.type] || SPELL_CONFIG.fire_arrow;
  };
  
  const config = getSpellConfig();
  
  // Calculate speed based on distance and travel time (2-3 seconds)
  // direction: 1 = right/up, -1 = left/down
  // isMobile: true = vertical movement (up/down), false = horizontal (left/right)
  const calculateSpeed = () => {
    if (!spell.startPosition || !spell.targetPosition) {
      return config.speed; // Fallback to default
    }
    
    const distance = isMobile
      ? Math.abs(spell.targetPosition.y - spell.startPosition.y) // Vertical distance on mobile
      : Math.abs(spell.targetPosition.x - spell.startPosition.x); // Horizontal distance on desktop
    
    // Target travel time: 2.5 seconds (average of 2-3 seconds)
    const targetTime = 2500; // milliseconds
    const updateInterval = 16; // milliseconds (60fps)
    const numUpdates = targetTime / updateInterval; // Number of updates in 2.5 seconds
    const speedPerUpdate = distance / numUpdates; // pixels per update
    
    return speedPerUpdate;
  };
  
  const projectileSpeed = calculateSpeed();

  // Load spell images
  useEffect(() => {
    const loadSpellImages = async () => {
      const images = [];
      
      if (config.isSingleImage) {
        // Single image file (like Arrow.png)
        try {
          const img = await loadImage(config.path);
          images.push(img);
        } catch (error) {
          console.error(`Failed to load spell image:`, error);
        }
      } else {
        // Multiple frame files
        for (let i = 1; i <= config.frames; i++) {
          try {
            const path = `${config.path}${String(i).padStart(2, '0')}.png`;
            const img = await loadImage(path);
            images.push(img);
          } catch (error) {
            console.error(`Failed to load spell frame ${i}:`, error);
          }
        }
      }
      
      setSpellImages(images);
    };
    loadSpellImages();
  }, [spell.type, config, loadImage]);

  // Animation loop (skip if single image)
  useEffect(() => {
    if (spellImages.length === 0 || config.isSingleImage) {
      // Single image - no animation needed, stay on frame 0
      setFrameIndex(0);
      return;
    }

    animationRef.current = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % spellImages.length);
    }, config.frameDuration);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [spellImages.length, config.frameDuration, config.isSingleImage]);

  // Movement - direction based on screen orientation
  useEffect(() => {
    movementRef.current = setInterval(() => {
      setPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        if (isMobile) {
          // Mobile: move vertically (up/down)
          // direction: 1 = up (towards opponent at top), -1 = down
          newY = prev.y - (projectileSpeed * spell.direction); // Negative because Y increases downward
        } else {
          // Desktop: move horizontally (left/right)
          // direction: 1 = right (towards opponent on right), -1 = left
          newX = prev.x + (projectileSpeed * spell.direction);
        }
        
        // Check bounds
        const outOfBounds = isMobile
          ? (newY < -50 || newY > 1050) // Mobile vertical bounds
          : (newX < -50 || newX > 850); // Desktop horizontal bounds
        
        if (outOfBounds) {
          // Out of bounds, remove spell
          if (movementRef.current) {
            clearInterval(movementRef.current);
          }
          return prev;
        }

        const newPos = { x: newX, y: newY };
        onUpdate(newPos);
        return newPos;
      });
    }, 16); // ~60fps

    return () => {
      if (movementRef.current) {
        clearInterval(movementRef.current);
      }
    };
  }, [projectileSpeed, spell.direction, isMobile, onUpdate]);

  const currentFrame = spellImages[frameIndex];

  if (!currentFrame || spellImages.length === 0) {
    return null;
  }

  // Rotate arrow based on direction and orientation
  const rotation = isMobile
    ? (spell.direction === 1 ? -90 : 90) // Mobile: up = -90deg, down = 90deg
    : (spell.direction === 1 ? 0 : 180); // Desktop: right = 0deg, left = 180deg

  return (
    <Group x={position.x} y={position.y} rotation={rotation}>
      <Image
        image={currentFrame}
        x={-20}
        y={-20}
        width={40}
        height={40}
      />
    </Group>
  );
};

export default SpellProjectile;

