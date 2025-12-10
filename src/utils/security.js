/**
 * Security utilities để chống hack và manipulation
 */

// Giới hạn điểm tối đa hợp lý (10000 điểm)
const MAX_SCORE = 10000;

// Giới hạn điểm tăng tối đa trong một lần chơi (phòng tránh hack điểm)
const MAX_SCORE_INCREASE = 1000;

// Thời gian chơi tối thiểu để điểm hợp lệ (giây)
const MIN_PLAY_TIME_SECONDS = 2;

// Rate limiting: số lần lưu điểm tối đa trong một khoảng thời gian
const MAX_SAVE_ATTEMPTS_PER_HOUR = 100;

/**
 * Validate và sanitize VMO ID
 * @param {string} vmoId - VMO ID cần validate
 * @returns {string|null} - VMO ID đã được sanitize hoặc null nếu invalid
 */
export const validateVmoId = (vmoId) => {
  if (!vmoId || typeof vmoId !== 'string') {
    return null;
  }

  // Chỉ cho phép chữ số và chữ cái, độ dài 4 ký tự
  const sanitized = vmoId.trim().toUpperCase().slice(0, 4);
  const validPattern = /^[A-Z0-9]{4}$/;

  if (!validPattern.test(sanitized)) {
    return null;
  }

  return sanitized;
};

/**
 * Validate điểm số
 * @param {number} score - Điểm số cần validate
 * @param {number} previousScore - Điểm số trước đó (nếu có)
 * @returns {boolean} - true nếu hợp lệ
 */
export const validateScore = (score, previousScore = 0) => {
  // Kiểm tra score là số
  if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
    return false;
  }

  // Kiểm tra score là số nguyên dương
  if (score < 0 || score !== Math.floor(score)) {
    return false;
  }

  // Kiểm tra điểm không vượt quá giới hạn
  if (score > MAX_SCORE) {
    return false;
  }

  // Kiểm tra điểm không tăng quá nhanh (phòng tránh hack)
  if (score > previousScore + MAX_SCORE_INCREASE) {
    return false;
  }

  return true;
};

/**
 * Validate game state trước khi lưu điểm
 * @param {Object} gameState - Trạng thái game
 * @returns {boolean} - true nếu game state hợp lệ
 */
export const validateGameState = (gameState) => {
  const {
    score,
    gameStarted,
    gameOver,
    pipesPassed,
    playTimeSeconds,
    isDead
  } = gameState;

  // Game phải đã bắt đầu và kết thúc
  if (!gameStarted || !gameOver) {
    return false;
  }

  // Player phải đã chết
  if (!isDead) {
    return false;
  }

  // Validate điểm số
  if (!validateScore(score)) {
    return false;
  }

  // Kiểm tra thời gian chơi tối thiểu (phòng tránh hack nhanh)
  if (playTimeSeconds < MIN_PLAY_TIME_SECONDS) {
    return false;
  }

  // Kiểm tra có pipes đã pass (đảm bảo game đã thực sự chơi)
  if (pipesPassed !== undefined && pipesPassed >= 0) {
    // Điểm số phải khớp với số pipes đã pass (cho phép sai số nhỏ do giftboxes)
    // Mỗi pipe = 1 điểm, giftbox = 1 điểm
    const maxPossibleScore = pipesPassed + 50; // Cho phép thêm 50 điểm từ giftboxes
    if (score > maxPossibleScore) {
      return false;
    }
  }

  return true;
};

/**
 * Sanitize string để chống XSS
 * @param {string} str - String cần sanitize
 * @returns {string} - String đã được sanitize
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return '';
  }

  // Escape HTML special characters
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Rate limiting: Kiểm tra số lần lưu điểm trong một khoảng thời gian
 * @param {string} vmoId - VMO ID
 * @returns {boolean} - true nếu có thể lưu
 */
export const checkRateLimit = (vmoId) => {
  const storageKey = `score_save_attempts_${vmoId}`;
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      localStorage.setItem(storageKey, JSON.stringify({
        attempts: [now],
        lastReset: now
      }));
      return true;
    }

    const data = JSON.parse(stored);
    const attempts = data.attempts || [];
    
    // Xóa các attempts cũ hơn 1 giờ
    const recentAttempts = attempts.filter(time => now - time < oneHour);
    
    // Kiểm tra số lần attempts
    if (recentAttempts.length >= MAX_SAVE_ATTEMPTS_PER_HOUR) {
      return false;
    }

    // Thêm attempt mới
    recentAttempts.push(now);
    localStorage.setItem(storageKey, JSON.stringify({
      attempts: recentAttempts,
      lastReset: now
    }));

    return true;
  } catch (error) {
    // Nếu có lỗi, cho phép lưu để không block user hợp lệ
    return true;
  }
};

/**
 * Tạo hash đơn giản để verify tính toàn vẹn của dữ liệu
 * @param {string} vmoId - VMO ID
 * @param {number} score - Điểm số
 * @param {number} timestamp - Timestamp
 * @returns {string} - Hash string
 */
export const createDataHash = (vmoId, score, timestamp) => {
  const str = `${vmoId}_${score}_${timestamp}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};
