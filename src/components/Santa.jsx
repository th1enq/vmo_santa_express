import React from 'react';
import './Santa.css';

const Santa = ({ santaY, santaX, rotation, isDead, showHitbox = false }) => {
  // Santa sprite is 2048x2048 with 4x4 grid (each sprite is 512x512)
  // Normal: (0, 0)
  // Dead: (3, 3) - row 3, col 3
  const spriteSize = 512; // 2048 / 4 = 512
  let offsetX = 0;
  let offsetY = 0;
  
  if (isDead) {
    offsetX = 3 * spriteSize; // col 3
    offsetY = 3 * spriteSize; // row 3
  }
  
  // Calculate scale: want Santa to be 100px, sprite is 512px
  // scale = 100 / 512 = 0.1953125 ≈ 0.20
  
  return (
    <div
      className={`santa ${isDead ? 'santa-dead' : ''} ${showHitbox ? 'show-hitbox' : ''}`}
      style={{
        top: `${santaY}px`,
        left: santaX !== undefined ? `${santaX}px` : '15%',
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <img
        src="/assets/santa.png"
        alt="Santa"
        style={{
          objectFit: 'none',
          objectPosition: `-${offsetX}px -${offsetY}px`,
          width: '2048px',
          height: '2048px',
          transform: 'scale(0.1953125)',
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
};

export default Santa;
