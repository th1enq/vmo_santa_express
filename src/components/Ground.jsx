import React from 'react';
import './Ground.css';

const Ground = ({ gameWidth, gameStarted, gameOver }) => {
  // Ground tile at position (0, 0) with size 32x32 in tiles.png
  // Scale to 80px height (original ground height)
  const originalTileSize = 32;
  const displayHeight = 80;
  const scale = displayHeight / originalTileSize; // 80/32 = 2.5
  const displayWidth = originalTileSize * scale; // 32 * 2.5 = 80px
  
  // Calculate how many tiles needed to fill the width (double for seamless loop)
  const tileCount = Math.ceil(gameWidth / displayWidth) + 2;
  
  // Animation should run when game started and not over
  const shouldAnimate = gameStarted && !gameOver;
  
  return (
    <div className="ground-container">
      <div 
        className={`ground-tiles ${shouldAnimate ? 'moving' : ''}`}
        style={{
          '--tile-width': `${displayWidth}px`,
        }}
      >
        {/* Ground tiles */}
        {Array.from({ length: tileCount }).map((_, index) => (
          <div
            key={index}
            className="ground-tile"
            style={{
              left: `${index * displayWidth}px`,
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
            }}
          >
            <img
              src="/assets/tiles.png"
              alt="ground"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'none',
                objectPosition: '0px 0px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                imageRendering: 'pixelated',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ground;
