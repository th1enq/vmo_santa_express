import React, { useState, useEffect, useCallback, useRef } from 'react';
import './EnterID.css';

const EnterID = ({ onSubmit, onCancel }) => {
  const [vmoId, setVmoId] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const inputRef = useRef(null);
  const MAX_LENGTH = 4;

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Character map for gbs-mono.png (128x112, 8x8 chars, 16 columns x 14 rows)
  const getCharPosition = (char) => {
    const charCode = char.charCodeAt(0);
    
    // ASCII mapping to sprite position
    // Row 0 (0-15): Space(32) to /
    // Row 1 (16-31): 0-9, :;<=>?
    // Row 2 (32-47): @, A-O
    // Row 3 (48-63): P-Z, [\]^_
    // Row 4 (64-79): `, a-o
    // Row 5 (80-95): p-z, {|}~
    
    let index;
    if (charCode >= 32 && charCode <= 126) {
      index = charCode - 32;
    } else if (char === '_') {
      index = 63; // underscore position
    } else {
      return null;
    }
    
    const col = index % 16;
    const row = Math.floor(index / 16);
    
    return { col, row };
  };

  const renderText = (text) => {
    return text.split('').map((char, index) => {
      const pos = getCharPosition(char.toUpperCase());
      if (!pos) return null;
      
      return (
        <div
          key={index}
          className="bitmap-char"
          style={{
            backgroundImage: 'url(/assets/gbs-mono.png)',
            backgroundPosition: `-${pos.col * 8}px -${pos.row * 8}px`,
            width: '8px',
            height: '8px',
            imageRendering: 'pixelated',
            display: 'inline-block'
          }}
        />
      );
    });
  };

  const handleKeyDown = useCallback((e) => {
    // Skip if the hidden input is focused (mobile keyboard is active)
    if (document.activeElement === inputRef.current) {
      return;
    }
    
    if (e.key === 'Enter') {
      if (vmoId.trim().length === MAX_LENGTH) {
        onSubmit(vmoId.trim());
      } else {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
      }
    } else if (e.key === 'Backspace') {
      setVmoId(prev => prev.slice(0, -1));
      setShowWarning(false);
    } else if (e.key.length === 1 && vmoId.length < MAX_LENGTH) {
      // Only allow digits 0-9
      if (/^[0-9]$/.test(e.key)) {
        setVmoId(prev => prev + e.key);
        setShowWarning(false);
      }
    }
  }, [vmoId, onSubmit, onCancel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle hidden input change (for mobile keyboard)
  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, MAX_LENGTH);
    setVmoId(value);
    setShowWarning(false);
  };

  // Handle hidden input keydown (for Enter key on mobile)
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (vmoId.trim().length === MAX_LENGTH) {
        onSubmit(vmoId.trim());
      } else {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
      }
    }
  };

  // Focus input when clicking on the input area only
  const handleInputAreaClick = (e) => {
    e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle confirm button click
  const handleConfirmClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Blur input first to ensure state is updated
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Use a small timeout to ensure state is synced
    setTimeout(() => {
      const currentValue = inputRef.current ? inputRef.current.value : vmoId;
      const cleanValue = currentValue.replace(/[^0-9]/g, '').trim();
      
      if (cleanValue.length === MAX_LENGTH) {
        onSubmit(cleanValue);
      } else {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 2000);
      }
    }, 50);
  };

  return (
    <div className="enter-id-overlay">
      <div className="enter-id-container">
        {/* Hidden input for mobile keyboard */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={vmoId}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className="hidden-input"
          autoComplete="off"
          maxLength={MAX_LENGTH}
        />
        
        <div className="bitmap-text-container">
          <div className="bitmap-line">
            {renderText('ENTER YOUR VMO_ID')}
          </div>
          
          <div className="bitmap-input-line" onClick={handleInputAreaClick}>
            <div className="bitmap-input-display">
              {renderText(vmoId)}
              {vmoId.length < MAX_LENGTH && (
                <div
                  className="bitmap-char"
                  style={{
                    backgroundImage: 'url(/assets/gbs-mono.png)',
                    backgroundPosition: `-${15 * 8}px -${3 * 8}px`, // underscore position
                    width: '8px',
                    height: '8px',
                    imageRendering: 'pixelated',
                    display: 'inline-block'
                  }}
                />
              )}
            </div>
          </div>
          
          <div className="bitmap-button-hints">
            <div className="bitmap-line confirm-button" onClick={handleConfirmClick}>
              {renderText('CONFIRM')}
            </div>
            {showWarning && (
              <div className="bitmap-line warning-text">
                {renderText('PLEASE ENTER 4 DIGITS')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterID;
