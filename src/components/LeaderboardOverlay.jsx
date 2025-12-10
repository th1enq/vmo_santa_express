import React, { useMemo } from 'react';
import './LeaderboardOverlay.css';

const LeaderboardOverlay = ({ entries = [], onClose }) => {
  const topEntries = entries.slice(0, 5);

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

  return (
    <div className="leaderboard-overlay" onClick={onClose} role="presentation">
      <div className="leaderboard-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <img
          src="/assets/leaderboard_title.png"
          alt="Leaderboard"
          className="leaderboard-title"
        />

        <div className="leaderboard-list">
          {topEntries.length === 0 && (
            <div className="leaderboard-empty">
              <BitmapText text="NO DATA" />
            </div>
          )}

          {topEntries.map((item, index) => {
            const idText = (item.vmoId || '----').toString().toUpperCase();
            const scoreText = (item.score ?? 0).toString();
            const cupSources = [
              '/assets/gold_trophy_16x16_2.png',
              '/assets/platinum_trophy_16x16_2.png',
              '/assets/silver_trophy_16x16_2.png',
              '/assets/bronze_trophy_16x16_2.png',
              '/assets/silhoutte_trophy_16x16_2.png',
            ];
            const cupSrc = cupSources[index] || cupSources[cupSources.length - 1];
            return (
              <div className="leaderboard-row" key={item.id ?? index}>
                <span className="lb-rank" aria-label={`Rank ${index + 1}`}>
                  <img src={cupSrc} alt={`Rank ${index + 1}`} />
                </span>
                <span className="lb-id">
                  <BitmapText text={idText} />
                </span>
                <span className="lb-score">
                  <BitmapText text={scoreText} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardOverlay;
