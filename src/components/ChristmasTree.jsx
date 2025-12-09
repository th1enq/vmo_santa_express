import React, { useState, useEffect } from 'react';
import './ChristmasTree.css';

const TREE_CONFIGS = {
  fantasy: {
    large: { path: 'CHRISTMAS TREE LARGE - FANTASY', frames: 161, name: 'Christmas Tree Large Fantasy' },
    medium: { path: 'CHRISTMAS TREE MEDIUM - FANTASY', frames: 119, name: 'Christmas Tree Medium Fantasy' },
    small: { path: 'CHRISTMAS TREE SMALL - FANTASY', frames: 127, name: 'Christmas Tree Small Fantasy' }
  },
  green: {
    large: { path: 'CHRISTMAS TREE LARGE - GREEN', frames: 161, name: 'Christmas Tree Large Green' },
    medium: { path: 'CHRISTMAS TREE MEDIUM - GREEN', frames: 119, name: 'Christmas Tree Medium Green' },
    small: { path: 'CHRISTMAS TREE SMALL- GREEN', frames: 127, name: 'Christmas Tree Small Green' }
  },
  greenTeal: {
    large: { path: 'CHRISTMAS TREE LARGE - GREEN TEAL', frames: 161, name: 'Christmas Tree Large Green Teal' },
    medium: { path: 'CHRISTMAS TREE MEDIUM - GREEN TEAL', frames: 119, name: 'Christmas Tree Medium Green Teal' },
    small: { path: 'CHRISTMAS TREE SMALL- GREEN TEAL', frames: 127, name: 'Christmas Tree Small Green Teal' }
  }
};

const ChristmasTree = ({ treeX, gap, gameHeight, type, size, showHitbox = false }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  
  const config = TREE_CONFIGS[type][size];
  
  // Detect mobile for performance optimization
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
  
  // Animation loop - reduced FPS on mobile, skip every other frame
  useEffect(() => {
    const fps = isMobile ? 100 : 50; // 10 FPS on mobile, 20 FPS on desktop
    const frameSkip = isMobile ? 2 : 1; // Skip every other frame on mobile
    
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + frameSkip) % config.frames);
    }, fps);
    
    return () => clearInterval(interval);
  }, [config.frames, isMobile]);
  
  const frameNumber = String(currentFrame).padStart(3, '0');
  const imagePath = `/assets/${config.path}/${config.name}_${frameNumber}.png`;
  
  // Determine height based on size (larger = taller, fills more gap)
  const heights = {
    small: 250,
    medium: 300,
    large: 350
  };
  
  const treeHeight = heights[size];
  const treeHitboxPadding = 20; // Same as collision detection
  const treeHitboxHeightReduction = 20; // Reduce hitbox height from top
  
  return (
    <div
      className={`christmas-tree ${showHitbox ? 'show-hitbox' : ''}`}
      style={{
        left: `${treeX}px`,
        bottom: '80px',
        height: `${treeHeight}px`,
        width: '90px', // Match PIPE_WIDTH
      }}
    >
      <img
        src={imagePath}
        alt="christmas tree"
        style={{
          height: '100%',
          width: 'auto',
          imageRendering: 'pixelated',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      {showHitbox && (
        <div
          className="tree-hitbox"
          style={{
            position: 'absolute',
            left: `${treeHitboxPadding}px`,
            right: `${treeHitboxPadding}px`,
            top: `${treeHitboxHeightReduction}px`,
            bottom: 0,
            border: '2px solid rgba(255, 165, 0, 0.8)',
            boxShadow: '0 0 10px rgba(255, 165, 0, 0.6)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default ChristmasTree;
