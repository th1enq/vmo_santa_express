import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Santa from './components/Santa';
import PipePair from './components/Pipe';
import Gift from './components/Gift';
import Score from './components/Score';
import Smoke from './components/Smoke';
import Ground from './components/Ground';
import ChristmasTree from './components/ChristmasTree';
import Decor from './components/Decor';
import Intro from './components/Intro';
import MainMenu from './components/MainMenu';
import FloatingGiftbox from './components/FloatingGiftbox';
import EnterID from './components/EnterID';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

// Audio files
const createSound = (src) => {
  const audio = new Audio(src);
  audio.volume = 0.3;
  return audio;
};

const soundFiles = {
  wing: '/assets/audio/wing.wav',
  point: '/assets/audio/point.wav',
  hit: '/assets/audio/hit.wav',
  die: '/assets/audio/die.wav',
  swoosh: '/assets/audio/swoosh.wav'
};

// Background music
const bgMusic = new Audio('/assets/audio/bg.wav');
bgMusic.volume = 0.2;
bgMusic.loop = true;

const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_WIDTH = 90;
const PIPE_GAP_DESKTOP = 280;
const PIPE_GAP_MOBILE = 240; // Slightly harder on mobile
const PIPE_SPEED = 3;
const SANTA_SIZE = 100;
const SANTA_HITBOX_PADDING = 20; // Reduce hitbox by 20px on each side
const GIFT_DROP_INTERVAL = 3000; // Drop gift every 3 seconds
const GIFT_DROP_INTERVAL_MOBILE = 5000; // Drop gift every 5 seconds on mobile (less frequent)
const GIFT_FALL_SPEED = 2;
const GIFT_GRAVITY = 0.3;
const GIFT_SIZE = 60;

// Detect mobile device
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

function App() {
  const [showLoading, setShowLoading] = useState(true);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showEnterID, setShowEnterID] = useState(false);
  const [vmoId, setVmoId] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [santaY, setSantaY] = useState(300);
  const [santaVelocity, setSantaVelocity] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [smokes, setSmokes] = useState([]);
  const [decors, setDecors] = useState([]);
  const [floatingGiftboxes, setFloatingGiftboxes] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isDead, setIsDead] = useState(false);
  // Fixed game dimensions to prevent layout issues across devices
  const FIXED_GAME_WIDTH = 500;
  const FIXED_GAME_HEIGHT = 750;
  const [gameWidth, setGameWidth] = useState(FIXED_GAME_WIDTH);
  const [gameHeight, setGameHeight] = useState(FIXED_GAME_HEIGHT);
  const [showHitbox, setShowHitbox] = useState(false);
  const [pipeGap, setPipeGap] = useState(PIPE_GAP_DESKTOP);
  const [enableSmoke, setEnableSmoke] = useState(!isMobile); // Disable smoke on mobile for performance
  
  const gameLoopRef = useRef(null);
  const pipeTimerRef = useRef(null);
  const giftTimerRef = useRef(null);
  const decorTimerRef = useRef(null);
  const scoredPipesRef = useRef(new Set());
  const gameContainerRef = useRef(null);
  const santaYRef = useRef(300);
  const bgMusicRef = useRef(bgMusic);

  // Play sound helper function - creates new audio instance each time
  const playSound = useCallback((soundName) => {
    if (soundFiles[soundName]) {
      const sound = createSound(soundFiles[soundName]);
      sound.play().catch(err => console.log('Audio play failed:', err));
    }
  }, []);

  // Update santaYRef whenever santaY changes
  useEffect(() => {
    santaYRef.current = santaY;
  }, [santaY]);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('santaFlappyHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Use fixed game dimensions for desktop, dynamic for mobile
  useEffect(() => {
    const updateDimensions = () => {
      if (isMobile || window.innerWidth <= 800) {
        // Mobile: use full screen dimensions
        const screenHeight = window.innerHeight;
        setGameWidth(window.innerWidth);
        setGameHeight(screenHeight);
        // Mobile: gap as percentage of screen height
        // Desktop ratio: 200/750 = 26.7%, but mobile should be easier
        // Use 18% for mobile (more forgiving)
        const calculatedGap = Math.round(screenHeight * 0.25);
        // Clamp gap between 120 and 200 to ensure playability
        const finalGap = Math.max(120, Math.min(200, calculatedGap));
        setPipeGap(finalGap);
        console.log(`Mobile - Screen Height: ${screenHeight}, Gap: ${finalGap} (${((finalGap/screenHeight)*100).toFixed(1)}%)`);
      } else {
        // Desktop: use fixed dimensions
        setGameWidth(FIXED_GAME_WIDTH);
        setGameHeight(FIXED_GAME_HEIGHT);
        // Desktop: gap as percentage of fixed height (26.7% of 750 = 200)
        setPipeGap(200);
        console.log(`Desktop - Height: ${FIXED_GAME_HEIGHT}, Gap: 200 (26.7%)`);
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('santaFlappyHighScore', score.toString());
    }
  }, [score, highScore]);

  const jump = useCallback(() => {
    // Don't allow jumping when loading, intro, enter ID, or menu is showing
    if (showLoading || showIntro || showEnterID || showMainMenu) {
      return;
    }
    
    if (gameOver) {
      // Restart game
      playSound('swoosh');
      setSantaY(300);
      setSantaVelocity(0);
      setRotation(0);
      setIsDead(false);
      setPipes([]);
      setGifts([]);
      setSmokes([]);
      setDecors([]);
      setScore(0);
      setGameOver(false);
      setGameStarted(false);
      scoredPipesRef.current.clear();
    } else if (!gameStarted) {
      setGameStarted(true);
      playSound('wing');
      setSantaVelocity(JUMP_STRENGTH);
      // Add smoke effect (disabled on mobile for performance)
      if (enableSmoke) {
        const santaLeft = gameWidth * 0.15;
        setSmokes(prev => [...prev, {
          id: Date.now(),
          x: santaLeft - 50,
          y: santaYRef.current,
          frame: 0,
          createdAt: Date.now()
        }]);
      }
    } else if (!isDead) {
      playSound('wing');
      setSantaVelocity(JUMP_STRENGTH);
      // Add smoke effect (disabled on mobile for performance)
      if (enableSmoke) {
        const santaLeft = gameWidth * 0.15;
        setSmokes(prev => [...prev, {
          id: Date.now(),
          x: santaLeft - 60,
          y: santaYRef.current,
          frame: 0,
          createdAt: Date.now()
        }]);
      }
    }
  }, [gameOver, gameStarted, isDead, playSound, gameWidth, enableSmoke, showLoading, showIntro, showEnterID, showMainMenu]);

  // Handle keyboard and touch input
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
      // Toggle hitbox visualization with 'D' key
      if (e.code === 'KeyD') {
        e.preventDefault();
        setShowHitbox((prev) => !prev);
      }
    };

    const handleTouch = (e) => {
      e.preventDefault();
      jump();
    };

    const handleClick = (e) => {
      // Only trigger jump if clicking on game container, not other elements
      if (e.target === gameContainerRef.current || 
          gameContainerRef.current?.contains(e.target)) {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    // Add touch/click listeners to game container instead of window
    const container = gameContainerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouch);
      container.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (container) {
        container.removeEventListener('touchstart', handleTouch);
        container.removeEventListener('click', handleClick);
      }
    };
  }, [jump]);

  // Generate pipes
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Use a ref to track last spawn time to ensure consistent spacing
      let lastSpawnTime = Date.now();
      const minSpawnInterval = 2000; // Minimum 2 seconds between spawns
      
      const generatePipe = () => {
        const now = Date.now();
        
        // Check time-based spawn interval
        if (now - lastSpawnTime < minSpawnInterval) {
          return;
        }
        
        setPipes((prevPipes) => {
          // Additional distance check - ensure last pipe has moved far enough from spawn point
          const minDistance = 250; // Minimum distance from right edge
          
          if (prevPipes.length > 0) {
            const lastPipe = prevPipes[prevPipes.length - 1];
            // Check actual position - pipe should be at least minDistance away from right edge
            if (lastPipe.x > gameWidth - minDistance) {
              return prevPipes; // Don't spawn yet
            }
          }
          
          // Update spawn time
          lastSpawnTime = now;
          
          // Random tree properties first
          const types = ['fantasy', 'green', 'greenTeal'];
          const treeType = types[Math.floor(Math.random() * types.length)];
          
          // Random tree size with more variation
          const sizes = ['small', 'medium', 'large'];
          const treeSize = sizes[Math.floor(Math.random() * sizes.length)];
          
          // Tree heights based on size - wider range for more variation
          const treeHeights = { small: 200, medium: 300, large: 400 };
          const treeHeight = treeHeights[treeSize];
          const groundHeight = 80;
          
          // Use dynamic gap from state instead of fixed value
          const currentGap = pipeGap;
          
          // Calculate tree top position (from top of screen)
          // Use current gameHeight to ensure proper calculations
          const currentGameHeight = gameHeight;
          const treeTopY = currentGameHeight - groundHeight - treeHeight;
          
          // Pipe top height = tree top - gap
          // This ensures gap is always exactly currentGap regardless of tree size
          // Calculate pipe height to maintain exact gap
          const height = treeTopY - currentGap;
          
          // Safety check: ensure pipe height is not negative
          if (height < 0) {
            console.error(`Invalid pipe height: ${height}. Skipping pipe generation.`);
            return prevPipes;
          }
          
          console.log(`Pipe spawn - gameHeight: ${currentGameHeight}, gap: ${currentGap}, treeSize: ${treeSize}, treeHeight: ${treeHeight}, pipeHeight: ${height}, treeTopY: ${treeTopY}`);
          
          // Validate calculations
          const pipeBottom = height + currentGap;
          const treeTop = currentGameHeight - groundHeight - treeHeight;
          
          // Ensure gap is exactly currentGap
          if (Math.abs(pipeBottom - treeTop) > 1) {
            console.warn(`Gap mismatch: pipeBottom=${pipeBottom}, treeTop=${treeTop}, gap=${pipeBottom - treeTop}`);
          }
          
          // 50% chance to spawn a floating giftbox between pipes
          const shouldSpawnGiftbox = Math.random() > 0.5;
          
          const newPipe = {
            id: Date.now(),
            x: gameWidth,
            topHeight: height,
            passed: false,
            treeType,
            treeSize,
          };
          
          // Spawn floating giftbox in the gap
          if (shouldSpawnGiftbox) {
            const giftboxY = height + currentGap / 2 - 30; // Center in gap
            const randomOffset = Math.random() * 40 - 20; // Random offset ±20px
            
            setFloatingGiftboxes((prev) => [
              ...prev,
              {
                id: Date.now() + Math.random(),
                x: gameWidth + PIPE_WIDTH / 2 - 30, // Center horizontally
                initialY: giftboxY + randomOffset,
                animationOffset: Math.random() * Math.PI * 2, // Random start phase
              },
            ]);
          }
          
          return [...prevPipes, newPipe];
        });
      };

      // Generate first pipe after a delay
      const firstPipeTimeout = setTimeout(generatePipe, 1500);

      // Check for new pipes regularly
      pipeTimerRef.current = setInterval(generatePipe, 220); // Check every 200ms

      return () => {
        clearTimeout(firstPipeTimeout);
        if (pipeTimerRef.current) {
          clearInterval(pipeTimerRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, gameWidth, gameHeight, pipeGap]);

  // Generate decorations (similar to pipes)
  useEffect(() => {
    // Temporarily disabled decorations
    /*
    if (gameStarted && !gameOver) {
      const generateDecor = () => {
        // 60% chance to spawn a decor
        if (Math.random() < 0.6) {
          // Random type: 1 (48x96) or 2 (152x96)
          const decorType = Math.random() < 0.5 ? 1 : 2;
          
          // Check if there's enough space from last decor and pipes
          setDecors((prev) => {
            // Check distance from last decor
            const lastDecor = prev[prev.length - 1];
            const minDecorDistance = 150;
            
            if (lastDecor && (gameWidth - lastDecor.x) < minDecorDistance) {
              return prev; // Too close to last decor
            }
            
            // Check collision with pipes/trees
            const minTreeDistance = 20;
            const treeWidthEstimate = 200;
            
            const tooCloseToTree = pipes.some(pipe => {
              const pipeLeft = pipe.x;
              const treeLeft = pipeLeft;
              const treeRight = pipeLeft + treeWidthEstimate;
              
              const decorLeft = gameWidth;
              const decorRight = gameWidth + 200;
              
              return (
                (decorLeft < treeRight + minTreeDistance && decorRight > treeLeft - minTreeDistance)
              );
            });
            
            if (tooCloseToTree) {
              return prev;
            }
            
            return [
              ...prev,
              {
                id: Date.now() + Math.random(),
                x: gameWidth,
                type: decorType,
              },
            ];
          });
        }
      };

      // Generate decors - less frequently on mobile for performance
      const scheduleNextDecor = () => {
        const delay = isMobile 
          ? Math.random() * 1400 + 1000  // 1-2.4s on mobile (less frequent)
          : Math.random() * 700 + 500;   // 0.5-1.2s on desktop
        decorTimerRef.current = setTimeout(() => {
          if (gameStarted && !gameOver) {
            generateDecor();
            scheduleNextDecor();
          }
        }, delay);
      };
      scheduleNextDecor();

      return () => {
        if (decorTimerRef.current) {
          clearTimeout(decorTimerRef.current);
        }
      };
    }
    */
  }, [gameStarted, gameOver, gameWidth]);

  // Generate gifts
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const dropGift = () => {
        const santaLeft = gameWidth * 0.15;
        const giftSpriteIndex = Math.floor(Math.random() * 8); // Random gift from 0-7
        
        const newGift = {
          id: Date.now() + Math.random(), // Ensure unique ID
          x: santaLeft + SANTA_SIZE / 2 - GIFT_SIZE / 2, // Center under Santa
          y: santaYRef.current + SANTA_SIZE, // Use ref to get current Santa Y position
          spriteIndex: giftSpriteIndex,
          velocityY: 0,
          isBreaking: false,
          breakingTime: 0, // Track how long it's been breaking
        };
        
        console.log('Dropping gift:', newGift);
        
        setGifts((prev) => [...prev, newGift]);
      };

      // Start dropping gifts after a short delay
      // Use longer interval on mobile for better performance
      const giftInterval = isMobile ? GIFT_DROP_INTERVAL_MOBILE : GIFT_DROP_INTERVAL;
      const initialDelay = setTimeout(() => {
        dropGift();
        giftTimerRef.current = setInterval(dropGift, giftInterval);
      }, 1000);

      return () => {
        clearTimeout(initialDelay);
        if (giftTimerRef.current) {
          clearInterval(giftTimerRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, gameWidth]);

  // Game loop - optimized for mobile performance
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Use requestAnimationFrame for better performance
      // Target FPS: 60 for desktop, 30 for mobile (optimized for performance)
      const targetFPS = isMobile ? 30 : 60;
      const frameInterval = 1000 / targetFPS;
      let lastFrameTime = performance.now();
      let animationFrameId = null;
      
      const gameLoop = (currentTime) => {
        const deltaTime = currentTime - lastFrameTime;
        
        // Throttle to target FPS but use deltaTime for consistent speed
        if (deltaTime >= frameInterval) {
          // Calculate speed multiplier based on actual frame time to maintain consistent speed
          const speedMultiplier = deltaTime / (1000 / 60); // Normalize to 60 FPS speed
          lastFrameTime = currentTime - (deltaTime % frameInterval);
          
          // Get current positions for collision detection
          const currentSantaY = santaYRef.current;
          const santaLeftPos = gameWidth * 0.15;
          
          // Adjust Santa size and hitbox padding for mobile
          const currentSantaSize = isMobile ? 80 : SANTA_SIZE;
          const scaleFactor = isMobile ? 0.8 : 1;
        
          // Hitbox padding matching visual hitbox in Santa.css
          const hitboxPaddingLeft = 20 * scaleFactor;   // 20px desktop, 16px mobile
          const hitboxPaddingRight = 10 * scaleFactor;  // 10px desktop, 8px mobile
          const hitboxPaddingTop = 20 * scaleFactor;    // 20px desktop, 16px mobile
          const hitboxPaddingBottom = 10 * scaleFactor; // 10px desktop, 8px mobile
          
          const santaLeft = santaLeftPos + hitboxPaddingLeft;
          const santaRight = santaLeftPos + currentSantaSize - hitboxPaddingRight;
          const santaTop = currentSantaY + hitboxPaddingTop;
          const santaBottom = currentSantaY + currentSantaSize - hitboxPaddingBottom;

          // Update santa position
          setSantaY((y) => {
          const newY = y + (santaVelocity * speedMultiplier);
          const groundHeight = 80;
          const groundLevel = gameHeight - groundHeight;
          
          // Calculate Santa's bottom position with hitbox padding
          const santaBottomEdge = newY + currentSantaSize - hitboxPaddingBottom;
          
          // Check ground collision using hitbox
          if (santaBottomEdge >= groundLevel) {
            if (!isDead) {
              playSound('hit');
              setTimeout(() => playSound('die'), 100);
              setIsDead(true);
            }
            // Stop at ground level and trigger game over
            if (!gameOver) {
              setTimeout(() => setGameOver(true), 500);
            }
            // Return position where bottom of hitbox touches ground
            return groundLevel - currentSantaSize + hitboxPaddingBottom;
          }
          
          // Check ceiling collision using hitbox
          const santaTopEdge = newY + hitboxPaddingTop;
          
          if (santaTopEdge < 0) {
            if (!isDead) {
              playSound('hit');
              setTimeout(() => playSound('die'), 100);
              setIsDead(true);
            }
            return -hitboxPaddingTop;
          }
          
            return newY;
          });

          // Update santa velocity
          // Stop applying gravity when at ground level
          const groundHeight = 80;
          const groundLevel = gameHeight - groundHeight;
          const santaBottomEdge = santaY + currentSantaSize - hitboxPaddingBottom;
          
          if (isDead && santaBottomEdge < groundLevel) {
            setSantaVelocity((v) => v + (GRAVITY * speedMultiplier));
          } else if (!isDead && santaBottomEdge < groundLevel) {
            setSantaVelocity((v) => v + (GRAVITY * speedMultiplier));
          } else {
            // At ground, stop velocity
            setSantaVelocity(0);
          }

          // Update rotation based on velocity (handle death spin)
          if (isDead) {
            // Continuous spin when dead
            setRotation((r) => r + 10);
          } else {
            const newRotation = Math.min(Math.max(santaVelocity * 5, -45), 45);
            setRotation(newRotation);
          }

          // Update pipes position and check collision
          // Remove pipes that are far off-screen to reduce memory usage
          setPipes((prevPipes) => {
          const updatedPipes = prevPipes
            .map((pipe) => ({
              ...pipe,
              x: pipe.x - (PIPE_SPEED * speedMultiplier),
            }))
            .filter((pipe) => pipe.x > -PIPE_WIDTH * 2); // Keep slightly more for smooth transitions

          // Check collision and scoring with each pipe
          updatedPipes.forEach((pipe) => {
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + PIPE_WIDTH;

            // Check if santa passed the pipe for scoring
            if (!scoredPipesRef.current.has(pipe.id) && santaRight > pipeRight) {
              scoredPipesRef.current.add(pipe.id);
              playSound('point');
              setScore((s) => s + 1);
            }

            // Check collision with top pipe
            if (santaRight > pipeLeft && santaLeft < pipeRight) {
              if (santaTop < pipe.topHeight) {
                if (!isDead) {
                  console.log('TOP PIPE COLLISION!', {
                    santaTop,
                    pipeTopHeight: pipe.topHeight,
                  });
                  playSound('hit');
                  setTimeout(() => playSound('die'), 100);
                  setIsDead(true);
                }
              }
            }
            
            // Check collision with Christmas tree (bottom obstacle)
            const treeHeights = { small: 200, medium: 300, large: 400 };
            const treeHeight = treeHeights[pipe.treeSize];
            const groundHeight = 80; // Ground height
            const treeHitboxHeightReduction = 0; // No reduction - full height hitbox
            
            // Convert tree position to top-down coordinates
            // Tree is positioned from bottom, so treeTop (in top-down coords) = gameHeight - groundHeight - treeHeight
            const treeTopY = gameHeight - groundHeight - treeHeight + treeHitboxHeightReduction;
            const treeBottomY = gameHeight - groundHeight;
            
            // Tree collision: Santa overlaps with tree area
            // Use full width hitbox
            const treeHitboxPadding = 0; // Full width hitbox
            if (santaRight > (pipeLeft + treeHitboxPadding) && santaLeft < (pipeRight - treeHitboxPadding)) {
              // Check if any part of Santa is inside the tree (using top-down Y coordinates)
              if (santaBottom > treeTopY && santaTop < treeBottomY) {
                if (!isDead) {
                  console.log('TREE COLLISION!', {
                    santaTop,
                    santaBottom,
                    treeTopY,
                    treeBottomY,
                    treeSize: pipe.treeSize,
                    gameHeight
                  });
                  playSound('hit');
                  setTimeout(() => playSound('die'), 100);
                  setIsDead(true);
                }
              }
            }
          });

            return updatedPipes;
          });

          // Update floating giftboxes position and check collision
          setFloatingGiftboxes((prevGiftboxes) => {
            // Use same hitbox as main collision detection
            const giftboxSantaLeft = santaLeft;
            const giftboxSantaRight = santaRight;
            const giftboxSantaTop = santaTop;
            const giftboxSantaBottom = santaBottom;
            
            return prevGiftboxes
              .map((giftbox) => {
                const newGiftbox = {
                  ...giftbox,
                  x: giftbox.x - (PIPE_SPEED * speedMultiplier),
                };
                
                // Check collision with Santa
                if (!giftbox.collected && !isDead) {
                  const giftboxLeft = giftbox.x;
                  const giftboxRight = giftbox.x + 60; // Giftbox size
                  const giftboxTop = giftbox.initialY;
                  const giftboxBottom = giftbox.initialY + 60;
                  
                  const collision = 
                    giftboxSantaRight > giftboxLeft &&
                    giftboxSantaLeft < giftboxRight &&
                    giftboxSantaBottom > giftboxTop &&
                    giftboxSantaTop < giftboxBottom;
                  
                  if (collision) {
                    // Collect giftbox
                    playSound('point');
                    setScore((prev) => prev + 1);
                    newGiftbox.collected = true;
                    return null; // Remove from array
                  }
                }
                
                return newGiftbox;
              })
              .filter((giftbox) => giftbox && giftbox.x > -100); // Remove when off screen or collected
          });

          // Update decorations position (only on desktop)
          if (!isMobile) {
            setDecors((prevDecors) => {
            return prevDecors
              .map((decor) => ({
                ...decor,
                x: decor.x - (PIPE_SPEED * speedMultiplier),
              }))
              .filter((decor) => decor.x > -200); // Remove when off screen
            });
          }

          // Update gifts position
          setGifts((prevGifts) => {
          const updatedGifts = prevGifts.map((gift) => {
            let newVelocityY = gift.velocityY + (GIFT_GRAVITY * speedMultiplier);
            let newY = gift.y + (newVelocityY * speedMultiplier);
            let isBreaking = gift.isBreaking; // Keep existing breaking state
            let breakingTime = gift.breakingTime || 0;

            // Only check collision if not already breaking
            if (!isBreaking) {
              // Check collision with pipes
              pipes.forEach((pipe) => {
                const giftLeft = gift.x;
                const giftRight = gift.x + GIFT_SIZE;
                const giftTop = newY;
                const giftBottom = newY + GIFT_SIZE;

                const pipeLeft = pipe.x;
                const pipeRight = pipe.x + PIPE_WIDTH;

                // Check if gift overlaps with pipe horizontally
                if (giftRight > pipeLeft && giftLeft < pipeRight) {
                  // Check if gift hits top or bottom pipe
                  if (giftTop < pipe.topHeight || giftBottom > pipe.topHeight + pipeGap) {
                    isBreaking = true;
                  }
                }
              });
            }

            // If breaking, stop falling and increment breaking time
            if (isBreaking) {
              breakingTime += 1;
              newVelocityY = 0; // Stop falling
              newY = gift.y; // Keep position
            }

            return {
              ...gift,
              y: newY,
              velocityY: newVelocityY,
              isBreaking: isBreaking,
              breakingTime: breakingTime,
            };
          });

          // Remove gifts that have been breaking for too long (30 frames = 0.5 seconds) or are off screen
          return updatedGifts.filter((gift) => {
            if (gift.isBreaking && gift.breakingTime > 30) {
              return false; // Remove after breaking animation
            }
            return gift.y < gameHeight + 100; // Allow some overflow
          });
          });

          // Update smoke animations (only on desktop)
          if (!isMobile) {
            setSmokes((prevSmokes) => {
            const now = Date.now();
            return prevSmokes
              .map((smoke) => {
                const elapsed = now - smoke.createdAt;
                const frame = Math.floor(elapsed / 50); // 50ms per frame
                return {
                  ...smoke,
                  frame: frame,
                };
              })
              .filter((smoke) => smoke.frame < 7); // Remove after 7 frames
            });
          }
        }
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(gameLoop);
      };
      
      // Start the animation loop
      animationFrameId = requestAnimationFrame(gameLoop);
      gameLoopRef.current = animationFrameId;

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [gameStarted, gameOver, santaVelocity, santaY, gameHeight, gameWidth, isDead, isMobile, pipeGap, playSound]);

  const handlePlay = () => {
    setShowMainMenu(false);
    // Start background music
    bgMusicRef.current.play().catch(err => console.log('Background music play failed:', err));
    // Start game directly, don't show intro again
  };

  const handleLeaderboard = () => {
    setShowMainMenu(false);
    setShowLeaderboard(true);
  };

  const handleCredits = () => {
    setShowMainMenu(false);
    setShowCredits(true);
  };

  // Filter objects in viewport for better performance (only render visible objects)
  const visiblePipes = useMemo(() => {
    const viewportMargin = 200;
    return pipes.filter((pipe) => pipe.x > -viewportMargin && pipe.x < gameWidth + viewportMargin);
  }, [pipes, gameWidth]);

  const visibleGifts = useMemo(() => {
    return gifts.filter((gift) => 
      gift.x > -100 && gift.x < gameWidth + 100 && gift.y < gameHeight + 100
    );
  }, [gifts, gameWidth, gameHeight]);

  const visibleFloatingGiftboxes = useMemo(() => {
    return floatingGiftboxes.filter((giftbox) => 
      giftbox.x > -200 && giftbox.x < gameWidth + 200
    );
  }, [floatingGiftboxes, gameWidth]);

  const visibleDecors = useMemo(() => {
    if (isMobile) return [];
    return decors.filter((decor) => decor.x > -200 && decor.x < gameWidth + 200);
  }, [decors, gameWidth, isMobile]);

  return (
    <>
      {showLoading && <LoadingScreen onComplete={() => {
        setShowLoading(false);
        setShowEnterID(true);
      }} />}

      {showMainMenu && (
        <MainMenu 
          onPlay={handlePlay}
          onLeaderboard={handleLeaderboard}
          onCredits={handleCredits}
        />
      )}

      {showIntro && <Intro onComplete={() => {
        setShowIntro(false);
        setShowMainMenu(true);
      }} />}

      {showEnterID && <EnterID 
        onSubmit={(id) => {
          setVmoId(id);
          setShowEnterID(false);
          setShowIntro(true);
        }} 
        onCancel={() => {
          setShowEnterID(false);
          setShowIntro(true);
        }}
      />}
      
      <div className={`game-container ${showLoading || showIntro || showEnterID || showMainMenu ? 'intro-active' : ''}`} ref={gameContainerRef}>
        <Score 
          score={score} 
          highScore={highScore}
          gameStarted={gameStarted}
          gameOver={gameOver}
        />
        
        <Santa santaY={santaY} rotation={rotation} isDead={isDead} showHitbox={showHitbox} />
      
      {/* Only render pipes in viewport for better performance */}
      {visiblePipes.map((pipe) => (
        <React.Fragment key={pipe.id}>
          <PipePair
            pipeX={pipe.x}
            topPipeHeight={pipe.topHeight}
            gap={pipeGap}
            gameHeight={gameHeight}
            showHitbox={showHitbox}
          />
          <ChristmasTree
            treeX={pipe.x}
            gap={pipeGap}
            gameHeight={gameHeight}
            type={pipe.treeType}
            size={pipe.treeSize}
            showHitbox={showHitbox}
          />
        </React.Fragment>
      ))}

      {/* Floating giftboxes - disabled on mobile */}
      {visibleFloatingGiftboxes.map((giftbox) => (
        <FloatingGiftbox
          key={giftbox.id}
          x={giftbox.x}
          y={giftbox.initialY}
          showHitbox={showHitbox}
        />
      ))}

      {/* Only render gifts in viewport */}
      {visibleGifts.map((gift) => (
        <Gift
          key={gift.id}
          giftX={gift.x}
          giftY={gift.y}
          spriteIndex={gift.spriteIndex}
          isBreaking={gift.isBreaking}
        />
      ))}

      {/* Smoke effects - disabled on mobile */}
      {!isMobile && smokes.map((smoke) => (
        <Smoke
          key={smoke.id}
          x={smoke.x}
          y={smoke.y}
          frame={smoke.frame}
        />
      ))}

      {/* Decorations - disabled on mobile for performance */}
      {visibleDecors.map((decor) => (
        <Decor
          key={decor.id}
          x={decor.x}
          gameHeight={gameHeight}
          type={decor.type}
        />
      ))}

      <Ground gameWidth={gameWidth} gameStarted={gameStarted} gameOver={gameOver} showHitbox={showHitbox} />
    </div>
    </>
  );
}

export default App;
