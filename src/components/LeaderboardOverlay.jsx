import React, { useMemo, useState } from 'react';
import './LeaderboardOverlay.css';

const LeaderboardOverlay = ({ entries = [], onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  const totalPages = Math.ceil(entries.length / entriesPerPage);
  
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = entries.slice(startIndex, endIndex);

  const CELL_SIZE = 8;

  // Map to sprite sheet positions:
  // - '0' starts at index 16, spans 10 chars (0-9)
  // - 'A' starts at index 33, spans 26 chars (A-Z)
  const mapCharToIndex = (ch) => {
    const upper = ch.toUpperCase();
    if (upper >= '0' && upper <= '9') {
      return 16 + (upper.charCodeAt(0) - '0'.charCodeAt(0));
    }
    if (upper >= 'A' && upper <= 'Z') {
      return 33 + (upper.charCodeAt(0) - 'A'.charCodeAt(0));
    }
    // Fallback to '?' at index 15 (just before digits block) to show unknown char
    return 15;
  };

  const BitmapText = ({ text }) => {
    const chars = useMemo(() => text.split(''), [text]);
    return (
      <span className="bitmap-text">
        {chars.map((ch, i) => {
          const index = mapCharToIndex(ch);
          const x = -index * CELL_SIZE;
          return (
            <span
              key={`${ch}-${i}`}
              className="bitmap-char"
              style={{ backgroundPosition: `${x}px 0` }}
            />
          );
        })}
      </span>
    );
  };

  const handleSkip = (e) => {
    e.stopPropagation();
    onClose();
  };

  const handleNextPage = (e) => {
    e.stopPropagation();
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = (e) => {
    e.stopPropagation();
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="leaderboard-overlay" onClick={onClose} role="presentation">
      <div className="leaderboard-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Skip button */}
        <button
          className="leaderboard-skip"
          type="button"
          onClick={handleSkip}
          aria-label="Skip"
        >
          <img src="/assets/back.png" alt="Skip" />
        </button>

        <img
          src="/assets/leaderboard_title.png"
          alt="Leaderboard"
          className="leaderboard-title"
        />

        <div className="leaderboard-list">
          {/* Header row */}
          <div className="leaderboard-header">
            <span className="lb-rank ka1-font">
              <span className="score-value-ka1">Rank</span>
            </span>
            <span className="lb-id ka1-font">
              <span className="score-value-ka1">VMO_ID</span>
            </span>
            <span className="lb-score ka1-font">
              <span className="score-value-ka1">Score</span>
            </span>
          </div>

          {currentEntries.length === 0 && (
            <div className="leaderboard-empty ka1-font">
              <span className="score-value-ka1">NO DATA</span>
            </div>
          )}

          {currentEntries.map((item, index) => {
            const idText = `${(item.vmoId || '----').toString().toUpperCase()}`;
            const scoreText = (item.score ?? 0).toString();
            const rankNumber = startIndex + index + 1;
            const rankText = `${rankNumber}.`;
            return (
              <div className="leaderboard-row" key={item.id ?? index}>
                <span className="lb-rank ka1-font" aria-label={`Rank ${rankNumber}`}>
                  <span className="score-value-ka1">{rankText}</span>
                </span>
                <span className="lb-id ka1-font">
                  <span className="score-value-ka1">{idText}</span>
                </span>
                <span className="lb-score ka1-font">
                  <span className="score-value-ka1">{scoreText}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Pagination arrows */}
        {totalPages > 1 && (
          <>
            {currentPage > 1 && (
              <button
                className="leaderboard-arrow leaderboard-arrow-left"
                type="button"
                onClick={handlePrevPage}
                aria-label="Previous page"
              >
                <span>‹</span>
              </button>
            )}
            {currentPage < totalPages && (
              <button
                className="leaderboard-arrow leaderboard-arrow-right"
                type="button"
                onClick={handleNextPage}
                aria-label="Next page"
              >
                <span>›</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardOverlay;
