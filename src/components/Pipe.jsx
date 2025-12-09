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
          height: `${topPipeHeight}px`,
          top: 0,
        }}
      >
        <img 
          src="/assets/pipe_green.png" 
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
