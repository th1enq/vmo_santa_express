import React from 'react';
import './Pipe.css';

const PipePair = React.memo(({ pipeX, topPipeHeight, gap, gameHeight, showHitbox = false }) => {
  return (
    <>
      {/* Top Pipe only */}
      <div
        className={`pipe pipe-top ${showHitbox ? 'show-hitbox' : ''}`}
        style={{
          left: `${pipeX}px`,
          height: `${topPipeHeight + 40}px`,
          top: '-20px',
        }}
      >
        <img 
          src="/assets/red_pipe.png" 
          alt="pipe"
          className="pipe-image"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            objectPosition: 'bottom center',
            transform: 'rotate(180deg)',
            transformOrigin: 'center center',
            display: 'block',
          }}
        />
      </div>
    </>
  );
});

PipePair.displayName = 'PipePair';

export default PipePair;
