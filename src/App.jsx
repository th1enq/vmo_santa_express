import React, { useState, useEffect, useCallback, useRef } from 'react';
import Santa from './components/Santa';
import PipePair from './components/Pipe';
import Gift from './components/Gift';
import Score from './components/Score';
import Smoke from './components/Smoke';
import Ground from './components/Ground';
import ChristmasTree from './components/ChristmasTree';
import Decor from './components/Decor';
import Intro from './components/Intro';
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

const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_WIDTH = 90;
const PIPE_GAP_DESKTOP = 280;
const PIPE_GAP_MOBILE = 240; // Slightly harder on mobile
const PIPE_SPEED = 3;
const SANTA_SIZE = 100;
const SANTA_HITBOX_PADDING = 20; // Reduce hitbox by 20px on each side
const GIFT_DROP_INTERVAL = 3000; // Drop gift every 3 seconds
const GIFT_FALL_SPEED = 2;
const GIFT_GRAVITY = 0.3;
const GIFT_SIZE = 60;

// Detect mobile device
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [santaY, setSantaY] = useState(300);
  const [santaVelocity, setSantaVelocity] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [pipes, setPipes] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [smokes, setSmokes] = useState([]);
  const [decors, setDecors] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [gameWidth, setGameWidth] = useState(800);
  const [gameHeight, setGameHeight] = useState(900);
  const [showHitbox, setShowHitbox] = useState(false);
  const [pipeGap, setPipeGap] = useState(PIPE_GAP_DESKTOP);
  const [enableSmoke, setEnableSmoke] = useState(!isMobile); // Disable smoke on mobile
  
  const gameLoopRef = useRef(null);
  const pipeTimerRef = useRef(null);
  const giftTimerRef = useRef(null);
  const decorTimerRef = useRef(null);
  const scoredPipesRef = useRef(new Set());
  const gameContainerRef = useRef(null);
  const santaYRef = useRef(300);

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

  // Measure game container size
  useEffect(() => {
    const updateGameSize = () => {
      if (gameContainerRef.current) {
        const rect = gameContainerRef.current.getBoundingClientRect();
        setGameWidth(rect.width);
        setGameHeight(rect.height);
        
        // Adjust pipe gap based on screen width
        if (rect.width < 500) {
          setPipeGap(PIPE_GAP_MOBILE); // Easier on small screens
        } else {
          setPipeGap(PIPE_GAP_DESKTOP);
        }
      }
    };
    
    updateGameSize();
    window.addEventListener('resize', updateGameSize);
    
    return () => {
      window.removeEventListener('resize', updateGameSize);
    };
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('santaFlappyHighScore', score.toString());
    }
  }, [score, highScore]);

  const jump = useCallback(() => {
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
  }, [gameOver, gameStarted, isDead, playSound, gameWidth, enableSmoke]);

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
      const generatePipe = () => {
        // Random tree properties first
        const types = ['fantasy', 'green', 'greenTeal'];
        const treeType = types[Math.floor(Math.random() * types.length)];
        
        // Random tree size
        const sizes = ['small', 'medium', 'large'];
        const treeSize = sizes[Math.floor(Math.random() * sizes.length)];
        
        // Tree heights based on size
        const treeHeights = { small: 250, medium: 300, large: 350 };
        const treeHeight = treeHeights[treeSize];
        const groundHeight = 80;
        
        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        const gapSize = isMobile ? 155 : 180; // Mobile: 155, Desktop: 180
        
        // Calculate tree top position (from top of screen)
        const treeTopY = gameHeight - groundHeight - treeHeight;
        
        // Pipe top height = tree top - gap
        // This ensures gap is always exactly 90px regardless of tree size
        const height = treeTopY - gapSize;
        
        setPipes((prev) => [
          ...prev,
          {
            id: Date.now(),
            x: gameWidth,
            topHeight: height,
            passed: false,
            treeType,
            treeSize,
          },
        ]);
      };

      // Generate first pipe immediately
      generatePipe();

      // Then generate pipes at intervals
      pipeTimerRef.current = setInterval(generatePipe, 2000);

      return () => {
        if (pipeTimerRef.current) {
          clearInterval(pipeTimerRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, gameWidth, gameHeight]);

  // Generate decorations (similar to pipes)
  useEffect(() => {
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
      const initialDelay = setTimeout(() => {
        dropGift();
        giftTimerRef.current = setInterval(dropGift, GIFT_DROP_INTERVAL);
      }, 1000);

      return () => {
        clearTimeout(initialDelay);
        if (giftTimerRef.current) {
          clearInterval(giftTimerRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, gameWidth]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(() => {
        // Get current positions for collision detection
        const currentSantaY = santaYRef.current;
        const santaLeftPos = gameWidth * 0.15;
        const santaLeft = santaLeftPos + SANTA_HITBOX_PADDING;
        const santaRight = santaLeft + SANTA_SIZE - (SANTA_HITBOX_PADDING * 2);
        const santaTop = currentSantaY + SANTA_HITBOX_PADDING;
        const santaBottom = currentSantaY + SANTA_SIZE - SANTA_HITBOX_PADDING;

        // Update santa position
        setSantaY((y) => {
          const newY = y + santaVelocity;
          
          // If dead, allow falling off screen
          if (isDead) {
            if (newY > gameHeight + SANTA_SIZE) {
              // Santa has fallen off screen completely
              if (!gameOver) {
                setGameOver(true);
              }
            }
            return newY; // Keep falling
          }
          
          // Normal collision (when alive)
          // Check ground collision
          if (newY >= gameHeight - SANTA_SIZE) {
            if (!isDead) {
              playSound('hit');
              setTimeout(() => playSound('die'), 100);
              setIsDead(true);
            }
            return gameHeight - SANTA_SIZE;
          }
          // Check ceiling collision
          if (newY < 0) {
            if (!isDead) {
              playSound('hit');
              setTimeout(() => playSound('die'), 100);
              setIsDead(true);
            }
            return 0;
          }
          return newY;
        });

        // Update santa velocity
        // Always apply gravity when dead to make Santa fall
        if (isDead) {
          setSantaVelocity((v) => v + GRAVITY);
        } else if (santaY < gameHeight - SANTA_SIZE) {
          setSantaVelocity((v) => v + GRAVITY);
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
        setPipes((prevPipes) => {
          const updatedPipes = prevPipes
            .map((pipe) => ({
              ...pipe,
              x: pipe.x - PIPE_SPEED,
            }))
            .filter((pipe) => pipe.x > -PIPE_WIDTH);

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
            const treeHeights = { small: 250, medium: 300, large: 350 };
            const treeHeight = treeHeights[pipe.treeSize];
            const groundHeight = 80; // Ground height
            const treeHitboxHeightReduction = 40; // Reduce hitbox height from top
            
            // Convert tree position to top-down coordinates
            // Tree is positioned from bottom, so treeTop (in top-down coords) = gameHeight - groundHeight - treeHeight
            const treeTopY = gameHeight - groundHeight - treeHeight + treeHitboxHeightReduction; // Move hitbox down
            const treeBottomY = gameHeight - groundHeight;
            
            // Tree collision: Santa overlaps with tree area
            // Use smaller hitbox for more forgiving gameplay
            const treeHitboxPadding = 20; // Make tree hitbox narrower
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

        // Update decorations position
        setDecors((prevDecors) => {
          return prevDecors
            .map((decor) => ({
              ...decor,
              x: decor.x - PIPE_SPEED,
            }))
            .filter((decor) => decor.x > -200); // Remove when off screen
        });

        // Update gifts position
        setGifts((prevGifts) => {
          const updatedGifts = prevGifts.map((gift) => {
            let newVelocityY = gift.velocityY + GIFT_GRAVITY;
            let newY = gift.y + newVelocityY;
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

        // Update smoke animations
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
      }, 1000 / 60); // 60 FPS

      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, santaVelocity, santaY, gameHeight, gameWidth, isDead]);

  return (
    <>
      {showIntro && <Intro onComplete={() => setShowIntro(false)} />}
      
      <div className={`game-container ${showIntro ? 'intro-active' : ''}`} ref={gameContainerRef}>
        <Score 
          score={score} 
          highScore={highScore}
          gameStarted={gameStarted}
          gameOver={gameOver}
        />
        
        <Santa santaY={santaY} rotation={rotation} isDead={isDead} showHitbox={showHitbox} />
      
      {pipes.map((pipe) => (
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

      {gifts.map((gift) => (
        <Gift
          key={gift.id}
          giftX={gift.x}
          giftY={gift.y}
          spriteIndex={gift.spriteIndex}
          isBreaking={gift.isBreaking}
        />
      ))}

      {smokes.map((smoke) => (
        <Smoke
          key={smoke.id}
          x={smoke.x}
          y={smoke.y}
          frame={smoke.frame}
        />
      ))}

      {/* Decorations */}
      {decors.map((decor) => (
        <Decor
          key={decor.id}
          x={decor.x}
          gameHeight={gameHeight}
          type={decor.type}
        />
      ))}

      <Ground gameWidth={gameWidth} gameStarted={gameStarted} gameOver={gameOver} />
    </div>
    </>
  );
}

export default App;
