/**
 * Character Sprite Sheet Configuration
 * Uses spritelist PNG files with frames arranged in a grid
 * 
 * Frame indices are 0-based, arranged left-to-right, top-to-bottom in the grid
 * Example: If grid is 6 frames wide:
 *   Row 0: frames 0-5
 *   Row 1: frames 6-11
 *   Row 2: frames 12-17
 *   etc.
 */

export const CHARACTER_SPRITE_CONFIG = {
  archer: {
    gender: 'men',
    spriteSheet: 'Archer_spritelist.png', // Use spritelist file
    frameWidth: 48, // Based on Phaser example pattern
    frameHeight: 48,
    framesPerRow: 14, // Grid width (frames per row) - updated to 14
    animations: {
      idle: {
        // Use Idle.png file for character selection (6 frames, horizontal strip)
        file: 'Idle.png',
        numFrames: 6, // Idle.png has 6 frames
        frameDuration: 500
      },
      walk: {
        // Use Walk.png file for walking (8 frames, horizontal strip)
        file: 'Walk.png',
        numFrames: 8, // Walk.png has 8 frames
        frameDuration: 200
      },
      run: {
        // Reuse walk animation for running
        file: 'Walk.png',
        numFrames: 8,
        frameDuration: 150
      },
      attack: {
        // Use Shot_1.png file for attack (14 frames, horizontal strip)
        file: 'Shot_1.png',
        numFrames: 14, // Shot_1.png has 14 frames
        frameDuration: 200
      },
      hurt: {
        // Use Hurt.png file for hurt animation (3 frames, horizontal strip)
        file: 'Hurt.png',
        numFrames: 3, // Hurt.png has 3 frames
        frameDuration: 300
      },
      dead: {
        // Use Dead.png file for death animation (3 frames, horizontal strip)
        file: 'Dead.png',
        numFrames: 3, // Dead.png has 3 frames
        frameDuration: 0 // Stay on last frame when dead
      }
    }
  },
  swordsman: {
    gender: 'men',
    spriteSheet: null, // Not using spritelist, using individual PNG files
    frameWidth: 64, // Will be calculated from image dimensions
    frameHeight: 64, // Will be calculated from image dimensions
    framesPerRow: null, // Not using grid layout
    animations: {
      idle: {
        // Use Idle.png file for character selection and in-game idle (8 frames, horizontal strip)
        file: 'Idle.png',
        numFrames: 8, // Idle.png has 8 frames
        frameDuration: 500
      },
      walk: {
        // Use Walk.png file for walking (8 frames, horizontal strip)
        file: 'Walk.png',
        numFrames: 8, // Walk.png has 8 frames
        frameDuration: 200
      },
      run: {
        // Reuse walk animation for running
        file: 'Walk.png',
        numFrames: 8,
        frameDuration: 150
      },
      attack: {
        // Use Attack_1.png file for attack (6 frames, horizontal strip)
        file: 'Attack_1.png',
        numFrames: 6, // Attack_1.png has 6 frames
        frameDuration: 200
      },
      hurt: {
        // Use Hurt.png file for hurt animation (3 frames, horizontal strip)
        file: 'Hurt.png',
        numFrames: 3, // Hurt.png has 3 frames
        frameDuration: 300
      },
      dead: {
        // Use Dead.png file for death animation (3 frames, horizontal strip)
        file: 'Dead.png',
        numFrames: 3, // Dead.png has 3 frames
        frameDuration: 0 // Stay on last frame when dead
      }
    }
  },
  wizard: {
    gender: 'men',
    spriteSheet: null, // Not using spritelist, using individual PNG files
    frameWidth: 64, // Will be calculated from image dimensions
    frameHeight: 64, // Will be calculated from image dimensions
    framesPerRow: null, // Not using grid layout
    animations: {
      idle: {
        // Use Idle.png file for character selection and in-game idle (6 frames, horizontal strip)
        file: 'Idle.png',
        numFrames: 6, // Idle.png has 6 frames
        frameDuration: 500
      },
      walk: {
        // Use Walk.png file for walking (7 frames, horizontal strip)
        file: 'Walk.png',
        numFrames: 7, // Walk.png has 7 frames
        frameDuration: 200
      },
      run: {
        // Reuse walk animation for running
        file: 'Walk.png',
        numFrames: 7,
        frameDuration: 150
      },
      attack: {
        // Use Attack_1.png file for attack (10 frames, horizontal strip)
        file: 'Attack_1.png',
        numFrames: 10, // Attack_1.png has 10 frames
        frameDuration: 200
      },
      hurt: {
        // Use Hurt.png file for hurt animation (4 frames, horizontal strip)
        file: 'Hurt.png',
        numFrames: 4, // Hurt.png has 4 frames
        frameDuration: 300
      },
      dead: {
        // Use Dead.png file for death animation (4 frames, horizontal strip)
        file: 'Dead.png',
        numFrames: 4, // Dead.png has 4 frames
        frameDuration: 0 // Stay on last frame when dead
      }
    }
  },
  enchantress: {
    gender: 'women',
    spriteSheet: null, // Not using spritelist, using individual PNG files
    frameWidth: 64, // Will be calculated from image dimensions
    frameHeight: 64, // Will be calculated from image dimensions
    framesPerRow: null, // Not using grid layout
    animations: {
      idle: {
        // Use Idle.png file for character selection and in-game idle (5 frames, horizontal strip)
        file: 'Idle.png',
        numFrames: 5, // Idle.png has 5 frames
        frameDuration: 500
      },
      walk: {
        // Use Walk.png file for walking (8 frames, horizontal strip)
        file: 'Walk.png',
        numFrames: 8, // Walk.png has 8 frames
        frameDuration: 200
      },
      run: {
        // Reuse walk animation for running
        file: 'Walk.png',
        numFrames: 8,
        frameDuration: 150
      },
      attack: {
        // Use Attack_1.png file for attack (6 frames, horizontal strip)
        file: 'Attack_1.png',
        numFrames: 6, // Attack_1.png has 6 frames
        frameDuration: 200
      },
      hurt: {
        // Use Hurt.png file for hurt animation (2 frames, horizontal strip)
        file: 'Hurt.png',
        numFrames: 2, // Hurt.png has 2 frames
        frameDuration: 300
      },
      dead: {
        // Use Dead.png file for death animation (5 frames, horizontal strip)
        file: 'Dead.png',
        numFrames: 5, // Dead.png has 5 frames
        frameDuration: 0 // Stay on last frame when dead
      }
    }
  },
  knight: {
    gender: 'women',
    spriteSheet: null, // Not using spritelist, using individual PNG files
    frameWidth: 64, // Will be calculated from image dimensions
    frameHeight: 64, // Will be calculated from image dimensions
    framesPerRow: null, // Not using grid layout
    animations: {
      idle: {
        // Use Idle.png file for character selection and in-game idle (6 frames, horizontal strip)
        file: 'Idle.png',
        numFrames: 6, // Idle.png has 6 frames
        frameDuration: 500
      },
      walk: {
        // Use Walk.png file for walking (8 frames, horizontal strip)
        file: 'Walk.png',
        numFrames: 8, // Walk.png has 8 frames
        frameDuration: 200
      },
      run: {
        // Reuse walk animation for running
        file: 'Walk.png',
        numFrames: 8,
        frameDuration: 150
      },
      attack: {
        // Use Attack_1.png file for attack (5 frames, horizontal strip)
        file: 'Attack_1.png',
        numFrames: 5, // Attack_1.png has 5 frames
        frameDuration: 200
      },
      hurt: {
        // Use Hurt.png file for hurt animation (3 frames, horizontal strip)
        file: 'Hurt.png',
        numFrames: 3, // Hurt.png has 3 frames
        frameDuration: 300
      },
      dead: {
        // Use Dead.png file for death animation (4 frames, horizontal strip)
        file: 'Dead.png',
        numFrames: 4, // Dead.png has 4 frames
        frameDuration: 0 // Stay on last frame when dead
      }
    }
  },
  musketeer: {
    gender: 'women',
    spriteSheet: null, // Not using spritelist, using individual PNG files
    frameWidth: 64, // Will be calculated from image dimensions
    frameHeight: 64, // Will be calculated from image dimensions
    framesPerRow: null, // Not using grid layout
    animations: {
      idle: {
        // Use Idle.png file for character selection and in-game idle (5 frames, horizontal strip)
        file: 'Idle.png',
        numFrames: 5, // Idle.png has 5 frames
        frameDuration: 500
      },
      walk: {
        // Use Walk.png file for walking (8 frames, horizontal strip)
        file: 'Walk.png',
        numFrames: 8, // Walk.png has 8 frames
        frameDuration: 200
      },
      run: {
        // Reuse walk animation for running
        file: 'Walk.png',
        numFrames: 8,
        frameDuration: 150
      },
      attack: {
        // Use Attack_1.png file for attack (5 frames, horizontal strip)
        file: 'Attack_1.png',
        numFrames: 5, // Attack_1.png has 5 frames
        frameDuration: 200
      },
      hurt: {
        // Use Hurt.png file for hurt animation (2 frames, horizontal strip)
        file: 'Hurt.png',
        numFrames: 2, // Hurt.png has 2 frames
        frameDuration: 300
      },
      dead: {
        // Use Dead.png file for death animation (4 frames, horizontal strip)
        file: 'Dead.png',
        numFrames: 4, // Dead.png has 4 frames
        frameDuration: 0 // Stay on last frame when dead
      }
    }
  }
};

