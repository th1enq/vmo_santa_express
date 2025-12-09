import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoaded(true);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        onComplete();
      }
    };

    const handleClick = () => {
      onComplete();
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
    };
  }, [loaded, onComplete]);

  return (
    <div className="loading-screen" style={{ cursor: loaded ? 'pointer' : 'default' }}>
      <div className="loading-content">
        <img 
          src="/assets/santa_express.png" 
          alt="Santa Express Game Title" 
          className="game-title-logo"
        />
        
        <div className="santa-circle">
          <img 
            src="/assets/santa_logo.png" 
            alt="Santa Logo" 
            className="santa-logo-img"
          />
        </div>
        
        <div className="loading-bar-container">
          <div 
            className="loading-bar-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {!loaded ? (
          <div className="loading-text">
            Loading... {progress}%
          </div>
        ) : (
          <div className="loading-text press-enter">
            Press ENTER or CLICK to start
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
