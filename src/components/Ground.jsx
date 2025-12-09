import React from 'react';
import './Ground.css';

const Ground = ({ gameWidth, gameStarted, gameOver, showHitbox }) => {
  // New tiles.png dimensions: 336x112
  // Use full image as repeating background
  const imageWidth = 336;
  const imageHeight = 112;
  const displayHeight = 80; // Keep ground height at 80px
  const scale = displayHeight / imageHeight; // Scale to fit 80px height
  const displayWidth = imageWidth * scale; // Scaled width to maintain aspect ratio
  
  // Animation should run when game started and not over
  const shouldAnimate = gameStarted && !gameOver;
  
  return (
    <div className="ground-container">
      {showHitbox && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px',
            border: '3px solid red',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            pointerEvents: 'none',
            zIndex: 101,
          }}
        />
      )}
      <div 
        className={`ground-tiles ${shouldAnimate ? 'moving' : ''}`}
        style={{
          '--tile-width': `${displayWidth}px`,
          width: `${displayWidth * 6}px`, // Multiple tiles for seamless loop
          height: `${displayHeight}px`,
          backgroundImage: 'url(/assets/tiles.png)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: `${displayWidth}px ${displayHeight}px`,
          backgroundPosition: '0 0',
          imageRendering: 'pixelated',
        }}
      >
      </div>
    </div>
  );
};

export default Ground;
