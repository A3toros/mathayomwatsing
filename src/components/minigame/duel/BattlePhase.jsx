import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Image, Group, Text, Rect } from 'react-konva';
import { motion } from 'framer-motion';
import { useAssetLoader } from '../../../hooks/useAssetLoader';
import CharacterSprite from './CharacterSprite';
import SpellProjectile from './SpellProjectile';
import useGameLoop from '../../../hooks/useGameLoop';
import useKeyboardControls from '../../../hooks/useKeyboardControls';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;

// Detect screen orientation and aspect ratio
const getScreenOrientation = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / height;
  
  // Check if mobile (portrait) - typically aspect ratio < 1
  const isMobile = aspectRatio < 1.2; // Portrait or close to portrait
  const isDesktop = aspectRatio >= 1.5; // 16:9 or wider
  
  return {
    isMobile,
    isDesktop,
    aspectRatio,
    width,
    height
  };
};

const BattlePhase = ({
  matchData,
  selectedCharacter,
  studentNickname,
  damage,
  battleState,
  onPlayerMove,
  onSpellCast,
  onSpellHit,
  onRoundReady
}) => {
  const [screenOrientation, setScreenOrientation] = useState(() => getScreenOrientation());
  const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 300 });
  const [opponentPosition, setOpponentPosition] = useState({ x: 700, y: 300 });
  const [activeSpells, setActiveSpells] = useState([]);
  const [playerHp, setPlayerHp] = useState(200);
  const [opponentHp, setOpponentHp] = useState(200);
  const [roundTime, setRoundTime] = useState(10);
  const [hpInitialized, setHpInitialized] = useState(false);
  const roundTimeInitializedRef = useRef(false); // Track if roundTime has been initialized from battleState
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isPlayer1, setIsPlayer1] = useState(true);
  const [spellCooldown, setSpellCooldown] = useState(0); // Cooldown remaining in ms
  const lastSpellCastTimeRef = useRef(0); // Track last spell cast time
  const [keys, setKeys] = useState({});
  const [touchControls, setTouchControls] = useState({ up: false, down: false, left: false, right: false });
  const [playerIsHurt, setPlayerIsHurt] = useState(false);
  const [opponentIsHurt, setOpponentIsHurt] = useState(false);
  const hitSpellsRef = useRef(new Set()); // Track spells that have already been hit
  const tempSpellHitsRef = useRef(new Map()); // Track hits on temp spells: Map<tempSpellId, {hitTargetId, casterId, type}>
  const { loadImage } = useAssetLoader();
  const stageRef = useRef(null);
  const lastMoveTime = useRef(0);
  const touchStartRef = useRef(null);
  
  // Character sprite dimensions (from CharacterSprite component)
  const CHARACTER_WIDTH = 60;
  const CHARACTER_HEIGHT = 100;
  const CHARACTER_OFFSET_X = -30; // Character is centered at position
  const CHARACTER_OFFSET_Y = -50; // Character is centered at position

  // Detect screen orientation changes
  useEffect(() => {
    const handleResize = () => {
      setScreenOrientation(getScreenOrientation());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load background - only game_background_3.png
  useEffect(() => {
    const loadBg = async () => {
      const bg = await loadImage(`Art/Background/PNG/game_background_3/game_background_3.png`);
      setBackgroundImage(bg);
    };
    loadBg();
  }, [loadImage]);

  // Initialize player positions based on orientation
  useEffect(() => {
    if (screenOrientation.isMobile) {
      // Mobile: player bottom, opponent top
      setPlayerPosition({ x: screenOrientation.width / 2, y: screenOrientation.height - 150 });
      setOpponentPosition({ x: screenOrientation.width / 2, y: 150 });
    } else {
      // Desktop: player left, opponent right
      setPlayerPosition({ x: 100, y: 300 });
      setOpponentPosition({ x: 700, y: 300 });
    }
  }, [screenOrientation]);

  // Initialize HP from battle state when round starts
  useEffect(() => {
    if (battleState && !hpInitialized) {
      if (battleState.player1Hp !== undefined && battleState.player2Hp !== undefined) {
        const initialPlayerHp = isPlayer1 ? battleState.player1Hp : battleState.player2Hp;
        const initialOpponentHp = isPlayer1 ? battleState.player2Hp : battleState.player1Hp;
        setPlayerHp(initialPlayerHp);
        setOpponentHp(initialOpponentHp);
        setHpInitialized(true);
        console.log('[BattlePhase] HP initialized:', { playerHp: initialPlayerHp, opponentHp: initialOpponentHp });
      }
    }
  }, [battleState, isPlayer1, hpInitialized]);

  // Update positions and HP from battle state
  useEffect(() => {
    if (battleState) {
      if (battleState.opponentPosition) {
        setOpponentPosition(battleState.opponentPosition);
      }
      
      // Update HP when battleState changes (from spell-hit messages)
      // Use functional state updates to always get the latest values
      if (battleState.player1Hp !== undefined || battleState.player2Hp !== undefined) {
        // Use refs to get current HP values for comparison
        setPlayerHp(prevPlayerHp => {
          const newPlayerHp = isPlayer1 
            ? (battleState.player1Hp !== undefined ? battleState.player1Hp : prevPlayerHp)
            : (battleState.player2Hp !== undefined ? battleState.player2Hp : prevPlayerHp);
          
          // Update opponent HP in a separate call
          setOpponentHp(prevOpponentHp => {
            const newOpponentHp = isPlayer1 
              ? (battleState.player2Hp !== undefined ? battleState.player2Hp : prevOpponentHp)
              : (battleState.player1Hp !== undefined ? battleState.player1Hp : prevOpponentHp);
            
            // Calculate HP changes
            const playerHpChange = newPlayerHp - prevPlayerHp;
            const opponentHpChange = newOpponentHp - prevOpponentHp;
            
            console.log('[BattlePhase] HP Bar Update Calculation:', {
              battleState: { player1Hp: battleState.player1Hp, player2Hp: battleState.player2Hp },
              isPlayer1,
              player: {
                currentHp: prevPlayerHp,
                newHp: newPlayerHp,
                change: playerHpChange,
                calculation: `${prevPlayerHp} + ${playerHpChange} = ${newPlayerHp}`,
                decreased: newPlayerHp < prevPlayerHp
              },
              opponent: {
                currentHp: prevOpponentHp,
                newHp: newOpponentHp,
                change: opponentHpChange,
                calculation: `${prevOpponentHp} + ${opponentHpChange} = ${newOpponentHp}`,
                decreased: newOpponentHp < prevOpponentHp
              }
            });
            
            // Check if HP decreased (character was hit)
            if (newPlayerHp < prevPlayerHp) {
              const damageTaken = prevPlayerHp - newPlayerHp;
              console.log('[BattlePhase] Player HP decreased:', {
                previous: prevPlayerHp,
                damage: damageTaken,
                calculation: `${prevPlayerHp} - ${damageTaken} = ${newPlayerHp}`,
                final: newPlayerHp
              });
              setPlayerIsHurt(true);
              setTimeout(() => setPlayerIsHurt(false), 500); // Hurt animation duration
            }
            if (newOpponentHp < prevOpponentHp) {
              const damageTaken = prevOpponentHp - newOpponentHp;
              console.log('[BattlePhase] Opponent HP decreased:', {
                previous: prevOpponentHp,
                damage: damageTaken,
                calculation: `${prevOpponentHp} - ${damageTaken} = ${newOpponentHp}`,
                final: newOpponentHp
              });
              setOpponentIsHurt(true);
              setTimeout(() => setOpponentIsHurt(false), 500); // Hurt animation duration
            }
            
            // Always update HP when battleState changes (even if values are the same, to ensure sync)
            if (newPlayerHp !== prevPlayerHp || newOpponentHp !== prevOpponentHp) {
              console.log('[BattlePhase] Applying HP bar update:', {
                playerHp: { from: prevPlayerHp, to: newPlayerHp },
                opponentHp: { from: prevOpponentHp, to: newOpponentHp }
              });
            }
            
            return newOpponentHp;
          });
          
          return newPlayerHp;
        });
      }
      
      // Only initialize roundTime once from battleState, don't reset it on every battleState change
      if (battleState.roundTimeLeft !== undefined && !roundTimeInitializedRef.current) {
        setRoundTime(Math.max(0, battleState.roundTimeLeft));
        roundTimeInitializedRef.current = true;
      }
    }
  }, [battleState, isPlayer1]); // battleState changes trigger HP updates
  
  // Reset roundTime initialization flag when round changes
  useEffect(() => {
    if (battleState?.round) {
      // Round changed, allow re-initialization
      roundTimeInitializedRef.current = false;
    }
  }, [battleState?.round]);

  // Update active spells from battle state
  useEffect(() => {
    if (battleState?.activeSpells) {
      // Check if any server spells match temp spells that were hit
      battleState.activeSpells.forEach(serverSpell => {
        if (!serverSpell.isTemp && tempSpellHitsRef.current) {
          // Check if this server spell matches a hit temp spell
          tempSpellHitsRef.current.forEach((hitInfo, tempSpellId) => {
            if (hitInfo.casterId === serverSpell.casterId && hitInfo.type === serverSpell.type) {
              // Temp spell was hit and server confirmed - send hit with server spell ID
              onSpellHit(serverSpell.id, hitInfo.hitTargetId);
              tempSpellHitsRef.current.delete(tempSpellId);
            }
          });
        }
      });
      
      setActiveSpells(battleState.activeSpells);
    }
  }, [battleState?.activeSpells, onSpellHit]);

  // Handle spell creation locally (before WebSocket sync)
  // NOTE: We create a temporary spell for visual feedback, but we need to wait for
  // the server's spell-cast message to get the correct spell ID for collision detection
  const handleLocalSpellCast = useCallback((spellType, direction) => {
    // Check cooldown (1 second = 1000ms)
    const now = Date.now();
    const timeSinceLastCast = now - lastSpellCastTimeRef.current;
    const cooldownDuration = 1000; // 1 second
    
    if (timeSinceLastCast < cooldownDuration) {
      // Still on cooldown
      const remainingCooldown = cooldownDuration - timeSinceLastCast;
      setSpellCooldown(remainingCooldown);
      return; // Don't cast spell
    }
    
    // Update last cast time
    lastSpellCastTimeRef.current = now;
    setSpellCooldown(cooldownDuration);
    
    // Create spell slightly offset from player position to avoid immediate collision
    const offsetDistance = 40; // Offset to avoid hitting caster
    let startPos;
    
    if (screenOrientation.isMobile) {
      // Mobile: offset vertically (up from player)
      startPos = {
        x: playerPosition.x,
        y: playerPosition.y - offsetDistance
      };
    } else {
      // Desktop: offset horizontally (right from player)
      startPos = {
        x: playerPosition.x + offsetDistance,
        y: playerPosition.y
      };
    }
    
    const targetPos = screenOrientation.isMobile
      ? { x: opponentPosition.x, y: opponentPosition.y } // Mobile: target is above
      : { x: opponentPosition.x, y: opponentPosition.y }; // Desktop: target is to the right
    
    // Create temporary spell for immediate visual feedback
    const tempSpell = {
      id: `temp_${Date.now()}_${Math.random()}`,
      type: spellType,
      startPosition: startPos,
      targetPosition: targetPos,
      direction: direction,
      casterId: isPlayer1 ? 'player1' : 'player2',
      createdAt: Date.now(),
      isTemp: true // Mark as temporary
    };
    
    // Add to active spells immediately for visual feedback
    setActiveSpells(prev => [...prev, tempSpell]);
    
    // Send to server - server will create spell with real ID
    onSpellCast(spellType, direction);
  }, [playerPosition, opponentPosition, screenOrientation, isPlayer1, onSpellCast]);
  
  // Cooldown timer - update remaining cooldown
  useEffect(() => {
    if (spellCooldown <= 0) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastCast = now - lastSpellCastTimeRef.current;
      const cooldownDuration = 1000;
      const remaining = Math.max(0, cooldownDuration - timeSinceLastCast);
      
      setSpellCooldown(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 50); // Update every 50ms for smooth UI
    
    return () => clearInterval(interval);
  }, [spellCooldown]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
    };
    const handleKeyUp = (e) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch controls for mobile
  useEffect(() => {
    if (!screenOrientation.isMobile) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!touchStartRef.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const threshold = 10; // Minimum movement to register

      setTouchControls({
        up: deltaY < -threshold,
        down: deltaY > threshold,
        left: deltaX < -threshold,
        right: deltaX > threshold
      });
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      touchStartRef.current = null;
      setTouchControls({ up: false, down: false, left: false, right: false });
    };

    const canvas = stageRef.current?.getStage()?.container();
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [screenOrientation.isMobile]);

  // Movement logic - supports both keyboard and touch
  useEffect(() => {
    const moveInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastMoveTime.current < 50) return; // Throttle to ~20fps
      lastMoveTime.current = now;

      let newX = playerPosition.x;
      let newY = playerPosition.y;
      let moved = false;

      if (screenOrientation.isMobile) {
        // Mobile: vertical layout - player on bottom half
        const halfHeight = screenOrientation.height / 2;
        const playerMinY = halfHeight; // Bottom half
        const playerMaxY = screenOrientation.height - 100;
        const playerMinX = 0;
        const playerMaxX = screenOrientation.width - 50;

        // Touch controls
        if (touchControls.left) {
          newX = Math.max(playerMinX, newX - PLAYER_SPEED);
          moved = true;
        }
        if (touchControls.right) {
          newX = Math.min(playerMaxX, newX + PLAYER_SPEED);
          moved = true;
        }
        if (touchControls.up) {
          newY = Math.max(playerMinY, newY - PLAYER_SPEED);
          moved = true;
        }
        if (touchControls.down) {
          newY = Math.min(playerMaxY, newY + PLAYER_SPEED);
          moved = true;
        }
      } else {
        // Desktop: horizontal layout - player on left half
        const halfWidth = CANVAS_WIDTH / 2;
        const playerMinX = 0;
        const playerMaxX = halfWidth - 50;
        const playerMinY = 0;
        const playerMaxY = CANVAS_HEIGHT - 100;

        // Keyboard controls
        if (keys['a'] || keys['arrowleft']) {
          newX = Math.max(playerMinX, newX - PLAYER_SPEED);
          moved = true;
        }
        if (keys['d'] || keys['arrowright']) {
          newX = Math.min(playerMaxX, newX + PLAYER_SPEED);
          moved = true;
        }
        if (keys['w'] || keys['arrowup']) {
          newY = Math.max(playerMinY, newY - PLAYER_SPEED);
          moved = true;
        }
        if (keys['s'] || keys['arrowdown']) {
          newY = Math.min(playerMaxY, newY + PLAYER_SPEED);
          moved = true;
        }
      }

      if (moved) {
        setPlayerPosition({ x: newX, y: newY });
        onPlayerMove({ x: newX, y: newY });
      }
    }, 16);

    return () => clearInterval(moveInterval);
  }, [keys, touchControls, playerPosition, onPlayerMove, screenOrientation]);

  // Spell casting (1 = Fire Arrow, 2 = Water Spell) - Desktop keyboard
  useEffect(() => {
    if (screenOrientation.isMobile) return; // Skip keyboard on mobile
    
    const handleSpellKey = (key, spellType) => {
      if (keys[key]) {
        const direction = isPlayer1 ? 1 : -1; // Desktop: 1 = right, -1 = left
        handleLocalSpellCast(spellType, direction);
        setKeys(prev => ({ ...prev, [key]: false })); // Prevent spam
      }
    };

    handleSpellKey('1', 'fire_arrow');
    handleSpellKey('2', 'water_spell');
  }, [keys, isPlayer1, screenOrientation.isMobile, handleLocalSpellCast]);

  // Round timer
  useEffect(() => {
    if (roundTime > 0) {
      const timer = setInterval(() => {
        setRoundTime(prev => {
          if (prev <= 0) return 0;
          return prev - 0.1;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [roundTime]);

      // Handle spell collisions with proper hitbox matching sprite size
      // Hitbox moves with character position and matches sprite dimensions exactly
      const handleSpellUpdate = useCallback((spellId, position) => {
        const spell = activeSpells.find(s => s.id === spellId);
        if (!spell) return;

        // Determine who cast this spell
        const spellCasterId = spell.casterId || spell.owner;
        const isPlayerSpell = spellCasterId === (isPlayer1 ? 'player1' : 'player2');
        const isOpponentSpell = spellCasterId === (isPlayer1 ? 'player2' : 'player1');

    // Hitbox matches character sprite dimensions exactly (60x100)
    // Character sprite is centered at position with offset (-30, -50)
    const playerBounds = {
      x: playerPosition.x + CHARACTER_OFFSET_X,
      y: playerPosition.y + CHARACTER_OFFSET_Y,
      width: CHARACTER_WIDTH,
      height: CHARACTER_HEIGHT
    };

    const opponentBounds = {
      x: opponentPosition.x + CHARACTER_OFFSET_X,
      y: opponentPosition.y + CHARACTER_OFFSET_Y,
      width: CHARACTER_WIDTH,
      height: CHARACTER_HEIGHT
    };

    // Spell projectile is 40x40, centered at position with offset (-20, -20)
    // So the spell's bounding box is:
    const SPELL_SIZE = 40;
    const SPELL_OFFSET = 20;
    const spellBounds = {
      x: position.x - SPELL_OFFSET,
      y: position.y - SPELL_OFFSET,
      width: SPELL_SIZE,
      height: SPELL_SIZE
    };

    // AABB (Axis-Aligned Bounding Box) collision detection
    // Check if two rectangles overlap
    const checkBoxCollision = (box1, box2) => {
      return box1.x < box2.x + box2.width &&
             box1.x + box1.width > box2.x &&
             box1.y < box2.y + box2.height &&
             box1.y + box1.height > box2.y;
    };

    // Only check collision with the target (opponent), never the caster
    let hitTarget = false;
    let hitTargetId = null;
    
    if (isPlayerSpell) {
      // Player's spell - only check opponent collision using bounding box
      hitTarget = checkBoxCollision(spellBounds, opponentBounds);
      
      if (hitTarget) {
        hitTargetId = isPlayer1 ? 'player2' : 'player1';
      }
    } else if (isOpponentSpell) {
      // Opponent's spell - only check player collision using bounding box
      hitTarget = checkBoxCollision(spellBounds, playerBounds);
      
      if (hitTarget) {
        hitTargetId = isPlayer1 ? 'player1' : 'player2';
      }
    }

        if (hitTarget && hitTargetId) {
          // Check if we've already reported this hit (prevent duplicate reports)
          if (hitSpellsRef.current.has(spellId)) {
            return; // Already processed this hit
          }
          
          // Mark this spell as hit
          hitSpellsRef.current.add(spellId);
          
          // Trigger hurt animation immediately for visual feedback
          if (hitTargetId === (isPlayer1 ? 'player1' : 'player2')) {
            setPlayerIsHurt(true);
            setTimeout(() => setPlayerIsHurt(false), 500);
          } else {
            setOpponentIsHurt(true);
            setTimeout(() => setOpponentIsHurt(false), 500);
          }
          
          if (spell.isTemp) {
            // Temp spell hit - store hit info, will send when server confirms
            tempSpellHitsRef.current.set(spellId, { 
              hitTargetId, 
              casterId: spell.casterId, 
              type: spell.type 
            });
            // Don't remove temp spell yet - wait for server confirmation
          } else {
            // Confirmed spell - send hit immediately
            setActiveSpells(prev => prev.filter(s => s.id !== spellId));
            hitSpellsRef.current.delete(spellId);
            onSpellHit(spellId, hitTargetId);
          }
        }
  }, [activeSpells, playerPosition, opponentPosition, isPlayer1, onSpellHit]);
  
  // Clean up hit tracking when spells are removed
  useEffect(() => {
    const activeSpellIds = new Set(activeSpells.map(s => s.id));
    // Remove hit tracking for spells that are no longer active
    hitSpellsRef.current.forEach(spellId => {
      if (!activeSpellIds.has(spellId)) {
        hitSpellsRef.current.delete(spellId);
      }
    });
  }, [activeSpells]);

  // Ready for round
  useEffect(() => {
    if (battleState && battleState.round && !battleState.roundTimeLeft) {
      onRoundReady();
    }
  }, [battleState, onRoundReady]);

  // Handle fire button press
  const handleFireButton = (spellType) => {
    // Cooldown check is handled in handleLocalSpellCast
    const direction = screenOrientation.isMobile 
      ? (isPlayer1 ? 1 : -1) // Mobile: 1 = up (towards opponent at top), -1 = down
      : (isPlayer1 ? 1 : -1); // Desktop: 1 = right (towards opponent on right), -1 = left
    handleLocalSpellCast(spellType, direction);
  };
  
  // Calculate cooldown percentage for UI
  const cooldownPercent = Math.min(100, (spellCooldown / 1000) * 100);
  const isOnCooldown = spellCooldown > 0;

  const canvasWidth = screenOrientation.isMobile ? screenOrientation.width : CANVAS_WIDTH;
  const canvasHeight = screenOrientation.isMobile ? screenOrientation.height : CANVAS_HEIGHT;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900 relative overflow-hidden">
      {/* UI Overlay */}
      <div className={`absolute ${screenOrientation.isMobile ? 'top-1 left-1 right-1' : 'top-4 left-4 right-4'} z-10`}>
        {screenOrientation.isMobile ? (
          // Mobile: Compact single-line layout
          <div className="flex items-center gap-1 bg-gray-800 bg-opacity-90 rounded-lg px-2 py-1">
            {/* Player HP - Compact */}
            <div className="flex-1 min-w-0">
              <div className="text-white text-[10px] truncate mb-0.5">{studentNickname}</div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <motion.div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                  initial={{ width: `${(playerHp / 200) * 100}%` }}
                  animate={{ width: `${(playerHp / 200) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <div className="text-white text-[9px] mt-0.5">{playerHp}/200</div>
            </div>

            {/* Round Timer - Compact */}
            <div className="bg-gray-700 rounded px-2 py-1 mx-1">
              <div className="text-white text-sm font-bold">
                {Math.ceil(roundTime)}s
              </div>
            </div>

            {/* Opponent HP - Compact */}
            <div className="flex-1 min-w-0">
              <div className="text-white text-[10px] truncate mb-0.5">Opponent</div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <motion.div
                  className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                  initial={{ width: `${(opponentHp / 200) * 100}%` }}
                  animate={{ width: `${(opponentHp / 200) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <div className="text-white text-[9px] mt-0.5">{opponentHp}/200</div>
            </div>
          </div>
        ) : (
          // Desktop: Original layout
          <div className="flex justify-between items-center">
            {/* Player HP */}
            <div className="bg-gray-800 rounded-lg p-2 md:p-4 min-w-[150px] md:min-w-[200px]">
              <div className="text-white text-xs md:text-sm mb-1">{studentNickname}</div>
              <div className="w-full bg-gray-700 rounded-full h-3 md:h-4">
                <motion.div
                  className="bg-green-500 h-3 md:h-4 rounded-full transition-all duration-300"
                  initial={{ width: `${(playerHp / 200) * 100}%` }}
                  animate={{ width: `${(playerHp / 200) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <div className="text-white text-xs mt-1">{playerHp} / 200 HP</div>
            </div>

            {/* Round Timer */}
            <div className="bg-gray-800 rounded-lg p-2 md:p-4 text-center">
              <div className="text-white text-xl md:text-2xl font-bold">
                {Math.ceil(roundTime)}s
              </div>
            </div>

            {/* Opponent HP */}
            <div className="bg-gray-800 rounded-lg p-2 md:p-4 min-w-[150px] md:min-w-[200px]">
              <div className="text-white text-xs md:text-sm mb-1">Opponent</div>
              <div className="w-full bg-gray-700 rounded-full h-3 md:h-4">
                <motion.div
                  className="bg-red-500 h-3 md:h-4 rounded-full transition-all duration-300"
                  initial={{ width: `${(opponentHp / 200) * 100}%` }}
                  animate={{ width: `${(opponentHp / 200) * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <div className="text-white text-xs mt-1">{opponentHp} / 200 HP</div>
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="relative">
        <Stage 
          width={canvasWidth} 
          height={canvasHeight} 
          ref={stageRef}
        >
          <Layer>
            {/* Background - rotate 90deg on mobile */}
            {backgroundImage && (
              <Group
                rotation={screenOrientation.isMobile ? 90 : 0}
                x={screenOrientation.isMobile ? canvasWidth / 2 : 0}
                y={screenOrientation.isMobile ? canvasHeight / 2 : 0}
                offsetX={screenOrientation.isMobile ? canvasHeight / 2 : 0}
                offsetY={screenOrientation.isMobile ? canvasWidth / 2 : 0}
              >
                <Image
                  image={backgroundImage}
                  x={0}
                  y={0}
                  width={screenOrientation.isMobile ? canvasHeight : canvasWidth}
                  height={screenOrientation.isMobile ? canvasWidth : canvasHeight}
                />
              </Group>
            )}

            {/* Center divider */}
            {screenOrientation.isMobile ? (
              // Mobile: horizontal divider (top/bottom split)
              <Rect
                x={0}
                y={canvasHeight / 2 - 2}
                width={canvasWidth}
                height={4}
                fill="#666"
                opacity={0.5}
              />
            ) : (
              // Desktop: vertical divider (left/right split)
              <Rect
                x={canvasWidth / 2 - 2}
                y={0}
                width={4}
                height={canvasHeight}
                fill="#666"
                opacity={0.5}
              />
            )}

            {/* Player Character */}
            <CharacterSprite
              characterId={selectedCharacter}
              position={playerPosition}
              isMoving={
                screenOrientation.isMobile 
                  ? Object.values(touchControls).some(v => v)
                  : Object.values(keys).some(v => v)
              }
              direction={
                screenOrientation.isMobile 
                  ? (isPlayer1 ? 1 : -1) // Mobile: facing up/down
                  : (isPlayer1 ? 1 : -1) // Desktop: facing left/right
              }
              isHurt={playerIsHurt}
            />

            {/* Opponent Character */}
            <CharacterSprite
              characterId={matchData?.opponentCharacter || 'archer'}
              position={opponentPosition}
              isMoving={false}
              direction={
                screenOrientation.isMobile 
                  ? (isPlayer1 ? -1 : 1) // Mobile: opponent faces opposite
                  : (isPlayer1 ? -1 : 1) // Desktop: opponent faces opposite
              }
              isHurt={opponentIsHurt}
            />

                {/* Active Spells */}
                {activeSpells.map((spell) => {
                  // Determine which character cast this spell to show correct visual
                  const spellCasterId = spell.casterId || spell.owner;
                  const isPlayerSpell = spellCasterId === (isPlayer1 ? 'player1' : 'player2');
                  const casterCharacterId = isPlayerSpell 
                    ? selectedCharacter 
                    : (matchData?.opponentCharacter || 'archer');
                  
                  return (
                    <SpellProjectile
                      key={spell.id}
                      spell={spell}
                      isMobile={screenOrientation.isMobile}
                      characterId={casterCharacterId} // Use caster's character ID to determine spell visual
                      onUpdate={(pos) => handleSpellUpdate(spell.id, pos)}
                    />
                  );
                })}

            {/* Player Nickname */}
            <Text
              x={playerPosition.x - 30}
              y={playerPosition.y - 60}
              text={studentNickname}
              fontSize={14}
              fill="white"
              fontStyle="bold"
            />

            {/* Opponent Nickname */}
            <Text
              x={opponentPosition.x - 30}
              y={opponentPosition.y - 60}
              text={matchData?.opponentNickname || 'Opponent'}
              fontSize={14}
              fill="white"
              fontStyle="bold"
            />
          </Layer>
        </Stage>
      </div>

          {/* Controls */}
          {screenOrientation.isMobile ? (
            // Mobile: Touch controls and fire buttons - Compact
            <div className="absolute bottom-2 left-2 right-2 z-10">
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleFireButton('fire_arrow')}
                  disabled={isOnCooldown}
                  className={`relative bg-red-600 text-white font-semibold py-2 px-3 rounded-lg shadow-lg transition-all text-xs ${
                    isOnCooldown 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-red-700 active:scale-95'
                  }`}
                >
                  <span className="relative z-10">🔥 Fire</span>
                  {isOnCooldown && (
                    <div 
                      className="absolute inset-0 bg-red-800 rounded-lg transition-all duration-50"
                      style={{ 
                        clipPath: `inset(${100 - cooldownPercent}% 0 0 0)`,
                        transition: 'clip-path 0.05s linear'
                      }}
                    />
                  )}
                </button>
                <button
                  onClick={() => handleFireButton('water_spell')}
                  disabled={isOnCooldown}
                  className={`relative bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg shadow-lg transition-all text-xs ${
                    isOnCooldown 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-blue-700 active:scale-95'
                  }`}
                >
                  <span className="relative z-10">💧 Water</span>
                  {isOnCooldown && (
                    <div 
                      className="absolute inset-0 bg-blue-800 rounded-lg transition-all duration-50"
                      style={{ 
                        clipPath: `inset(${100 - cooldownPercent}% 0 0 0)`,
                        transition: 'clip-path 0.05s linear'
                      }}
                    />
                  )}
                </button>
              </div>
              <div className="text-white text-[10px] text-center mt-1 opacity-75">
                Touch and drag to move
              </div>
            </div>
          ) : (
        // Desktop: Keyboard controls
        <div className="mt-4 text-center text-white">
          <div className="mb-2">
            <kbd className="px-2 py-1 bg-gray-800 rounded">WASD</kbd> or <kbd className="px-2 py-1 bg-gray-800 rounded">Arrow Keys</kbd> to move
          </div>
          <div>
            <kbd className="px-2 py-1 bg-gray-800 rounded">1</kbd> Fire Arrow | <kbd className="px-2 py-1 bg-gray-800 rounded">2</kbd> Water Spell
          </div>
        </div>
      )}
    </div>
  );
};

export default BattlePhase;

