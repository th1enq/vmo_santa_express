import React from 'react';
import './ChristmasTree.css';

const ChristmasTree = React.memo(({ treeX, gap, gameHeight, type, size, showHitbox = false }) => {
  // Determine height based on size (larger = taller, fills more gap)
  const heights = {
    small: 200,
    medium: 300,
    large: 400
  };
  
  const treeHeight = heights[size];
  const treeHitboxPadding = 0; // Remove padding for full width hitbox
  const treeHitboxHeightReduction = 0; // Reduce hitbox height from top
  
  return (
    <div
      className={`christmas-tree ${showHitbox ? 'show-hitbox' : ''}`}
      style={{
        left: `${treeX}px`,
        bottom: '60px',
        height: `${treeHeight + 20}px`,
        width: '90px', // Match PIPE_WIDTH
      }}
    >
      <img
        src="/assets/red_pipe.png"
        alt="tree"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          objectPosition: 'bottom center',
          display: 'block',
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
});

ChristmasTree.displayName = 'ChristmasTree';

export default ChristmasTree;
