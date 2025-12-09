import React from 'react';
import './Score.css';

const NumberDisplay = ({ number }) => {
  const digits = number.toString().split('');
  
  return (
    <div className="number-display">
      {digits.map((digit, index) => (
        <img
          key={index}
          src={`/assets/${digit}.png`}
          alt={digit}
          className="digit-image"
        />
      ))}
    </div>
  );
};

const Score = ({ score, highScore, gameStarted, gameOver }) => {
  return (
    <div className="score-container">
      {!gameStarted && !gameOver && (
        <div className="start-message">
          <h1>Santa Flappy Bird</h1>
          <p>Tap or Press Space to Start</p>
        </div>
      )}
      
      {gameStarted && !gameOver && (
        <div className="current-score">
          <NumberDisplay number={score} />
        </div>
      )}
      
      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <div className="final-score">
            <span>Score: </span>
            <NumberDisplay number={score} />
          </div>
          <div className="high-score">
            <span>Best: </span>
            <NumberDisplay number={highScore} />
          </div>
          <p className="restart-message">Tap or Press Space to Restart</p>
        </div>
      )}
    </div>
  );
};

export default Score;
