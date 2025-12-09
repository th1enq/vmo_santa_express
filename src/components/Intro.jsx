import React, { useState, useEffect } from 'react';
import './Intro.css';

// Preload Christmas tree images
const preloadTreeImages = () => {
  const treeTypes = [
    { path: 'CHRISTMAS TREE SMALL - FANTASY', name: 'Christmas Tree Small Fantasy', frames: 127 },
    { path: 'CHRISTMAS TREE MEDIUM - GREEN', name: 'Christmas Tree Medium Green', frames: 119 },
    { path: 'CHRISTMAS TREE SMALL- GREEN TEAL', name: 'Christmas Tree Small Green Teal', frames: 127 }
  ];

  treeTypes.forEach(tree => {
    // Preload every 10th frame to reduce initial load
    for (let i = 0; i < tree.frames; i += 10) {
      const frameNumber = String(i).padStart(3, '0');
      const img = new Image();
      img.src = `/assets/${tree.path}/${tree.name}_${frameNumber}.png`;
    }
  });
};

const SCRIPTS = [
  {
    id: 1,
    sprite: 'santa_popup',
    text: "Ho ho ho… Merry Christmas!\n\nI'm all set to deliver gifts to the VMO family.\n\nCome along with me!"
  },
  {
    id: 2,
    sprite: 'santa_popup',
    text: "This is exciting! The Christmas spirit is stronger than ever!\n\nLet's spread joy to everyone at VMO!"
  },
  {
    id: 3,
    sprite: 'santa_popup',
    text: "Uh-oh… The path ahead looks tough.\n\nI need your help to get these gifts safely to the VMO team!"
  }
];

const Intro = ({ onComplete }) => {
  const [currentScript, setCurrentScript] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  const script = SCRIPTS[currentScript];
  const fullText = script.text;

  // Preload tree images on mount
  useEffect(() => {
    preloadTreeImages();
  }, []);

  // Typing animation
  useEffect(() => {
    if (charIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 30);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, fullText]);

  // Reset when changing script
  useEffect(() => {
    setDisplayedText('');
    setCharIndex(0);
  }, [currentScript]);

  const handleNext = () => {
    if (charIndex < fullText.length) {
      // Skip typing animation
      setDisplayedText(fullText);
      setCharIndex(fullText.length);
    } else if (currentScript < SCRIPTS.length - 1) {
      // Next script
      setCurrentScript(currentScript + 1);
    } else {
      // Complete intro
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="intro-container" onClick={handleNext}>
      <div className="intro-background">
        {/* Snowflakes effect */}
        <div className="snowflakes">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="snowflake" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}>❄</div>
          ))}
        </div>
        
        <div className="intro-content">
          <div className="santa-portrait">
            <img 
              src={`/assets/${script.sprite}.png`}
              alt="Santa"
              className="santa-image"
            />
            
            {/* Dialog bubble above Santa */}
            <div className="dialog-bubble">
              <img src="/assets/dialog.png" alt="" className="dialog-bg" />
              <div className="dialog-content">
                <div className="dialog-text">
                  {displayedText.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < displayedText.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                  {charIndex < fullText.length && <span className="cursor">▋</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="skip-button" onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}>
          Skip Intro ⏭
        </button>
      </div>
    </div>
  );
};

export default Intro;
