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

const Score = ({ score, highScore, gameStarted, gameOver, onRetry, onShowLeaderboard }) => {
  const handleShowLeaderboard = () => {
    if (typeof onShowLeaderboard === 'function') {
      onShowLeaderboard();
    }
  };

  return (
    <div className={`score-container ${gameOver ? 'game-over-active' : ''}`}>
      {!gameStarted && !gameOver && (
        <div className="start-message">
          <img
            src="/assets/santa_express.png"
            alt="Santa Express"
            className="start-title"
          />
          <p>Tap or Press Space to Start</p>
        </div>
      )}
      
      {gameStarted && !gameOver && (
        <div className="current-score">
          <NumberDisplay number={score} />
        </div>
      )}
      
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-card">
            <img
              src="/assets/gameover.png"
              alt="Game Over"
              className="game-over-title"
            />

            <div className="game-over-scores">
              <div className="score-row">
              <img src="/assets/score.png" alt="Score" className="score-label" />
                <NumberDisplay number={score} />
              </div>
              <div className="score-row">
              <img src="/assets/best.png" alt="Best" className="score-label" />
                <NumberDisplay number={highScore} />
              </div>
            </div>

            <div className="game-over-actions" aria-hidden="true">
              <button
                className="game-over-btn"
                type="button"
                onClick={onRetry}
                aria-label="Retry"
              >
                <img src="/assets/retry.png" alt="Retry" />
              </button>
              <button
                className="game-over-btn"
                type="button"
                onClick={handleShowLeaderboard}
                aria-label="Leaderboard"
              >
                <img src="/assets/leaderboard.png" alt="Leaderboard" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Score;
