import React from 'react';
import './Pipe.css';

const PipePair = ({ pipeX, topPipeHeight, gap, gameHeight, showHitbox = false }) => {
  return (
    <>
      {/* Top Pipe only */}
      <div
        className={`pipe pipe-top ${showHitbox ? 'show-hitbox' : ''}`}
        style={{
          left: `${pipeX}px`,
          height: `${topPipeHeight + 20}px`,
          top: '-20px',
        }}
      >
        <img 
          src="/assets/red_pipe.png" 
          alt="pipe"
          className="pipe-image"
          style={{
            transform: 'rotate(180deg)',
          }}
        />
      </div>
    </>
  );
};

export default PipePair;
