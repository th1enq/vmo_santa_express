import React from 'react';
import './FloatingGiftbox.css';

const FloatingGiftbox = React.memo(({ x, y, showHitbox }) => {
  return (
    <div
      className="floating-giftbox"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <img
        src="/assets/Giftbox.png"
        alt="floating giftbox"
        style={{
          width: '60px',
          height: 'auto',
          imageRendering: 'auto',
        }}
      />
      {showHitbox && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '60px',
            height: '60px',
            border: '2px solid yellow',
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
});

FloatingGiftbox.displayName = 'FloatingGiftbox';

export default FloatingGiftbox;
