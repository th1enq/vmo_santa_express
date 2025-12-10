import { ref, set, get, onValue, off } from 'firebase/database';
import { database } from '../firebase';
import { 
  validateVmoId, 
  validateScore, 
  validateGameState,
  checkRateLimit,
  createDataHash
} from '../utils/security';

const LEADERBOARD_PATH = 'leaderboard';

/**
 * Lưu điểm cao nhất của người chơi với validation và security checks
 * Mỗi người chỉ lưu điểm cao nhất của họ (key là vmoId)
 * @param {string} vmoId - ID của người chơi
 * @param {number} score - Điểm số
 * @param {Object} gameState - Trạng thái game để validate
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const savePlayerScore = async (vmoId, score, gameState = {}) => {
  // Validate VMO ID
  const sanitizedVmoId = validateVmoId(vmoId);
  if (!sanitizedVmoId) {
    return { success: false, error: 'Invalid VMO ID' };
  }

  // Rate limiting check
  if (!checkRateLimit(sanitizedVmoId)) {
    return { success: false, error: 'Too many save attempts' };
  }

  // Validate game state
  const gameStateToValidate = {
    score,
    gameStarted: gameState.gameStarted,
    gameOver: gameState.gameOver,
    pipesPassed: gameState.pipesPassed,
    playTimeSeconds: gameState.playTimeSeconds,
    isDead: gameState.isDead
  };
  
  if (!validateGameState(gameStateToValidate)) {
    return { success: false, error: 'Invalid game state' };
  }

  try {
    const playerRef = ref(database, `${LEADERBOARD_PATH}/${sanitizedVmoId}`);
    
    // Lấy điểm hiện tại của người chơi
    const snapshot = await get(playerRef);
    const currentData = snapshot.val();
    const previousScore = currentData?.score || 0;
    
    // Validate score với previous score
    if (!validateScore(score, previousScore)) {
      return { success: false, error: 'Invalid score' };
    }
    
    // Chỉ cập nhật nếu điểm mới cao hơn điểm cũ
    if (!currentData || score > previousScore) {
      const timestamp = Date.now();
      const dataHash = createDataHash(sanitizedVmoId, score, timestamp);
      
      await set(playerRef, {
        vmoId: sanitizedVmoId,
        score: score,
        updatedAt: timestamp,
        pipesPassed: gameState.pipesPassed || 0,
        playTimeSeconds: gameState.playTimeSeconds || 0,
        hash: dataHash
      });
      
      return { success: true };
    }
    
    return { success: true, message: 'Score not higher than current' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Lấy điểm cao nhất của một người chơi từ Firebase
 * @param {string} vmoId - VMO ID của người chơi
 * @returns {Promise<number>} Điểm cao nhất hoặc 0 nếu không có
 */
export const getPlayerHighScore = async (vmoId) => {
  try {
    const sanitizedVmoId = validateVmoId(vmoId);
    if (!sanitizedVmoId) {
      return 0;
    }

    const playerRef = ref(database, `${LEADERBOARD_PATH}/${sanitizedVmoId}`);
    const snapshot = await get(playerRef);
    
    if (!snapshot.exists()) {
      return 0;
    }
    
    const data = snapshot.val();
    return data?.score || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Lấy top 10 người chơi điểm cao nhất
 * @returns {Promise<Array>} Mảng các entry leaderboard
 */
export const getTop10Leaderboard = async () => {
  try {
    const leaderboardRef = ref(database, LEADERBOARD_PATH);
    const snapshot = await get(leaderboardRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    // Chuyển đổi snapshot thành mảng và sắp xếp theo điểm giảm dần
    const data = snapshot.val();
    const entries = Object.keys(data)
      .map(key => {
        const entry = data[key];
        // Validate và sanitize dữ liệu
        const score = typeof entry.score === 'number' && entry.score >= 0 && entry.score <= 10000 
          ? Math.floor(entry.score) 
          : 0;
        const vmoId = typeof entry.vmoId === 'string' && entry.vmoId.length <= 10
          ? entry.vmoId.slice(0, 10)
          : key.slice(0, 10);
        
        return {
          id: key,
          vmoId: vmoId,
          score: score
        };
      })
      .filter(entry => entry.score > 0); // Chỉ lấy entries có điểm hợp lệ
    
    // Sắp xếp theo điểm giảm dần
    entries.sort((a, b) => b.score - a.score);
    
    // Chỉ lấy top 10
    return entries.slice(0, 10);
  } catch (error) {
    return [];
  }
};

/**
 * Lắng nghe thay đổi của leaderboard (real-time)
 * @param {Function} callback - Hàm callback được gọi khi có thay đổi
 * @returns {Function} Hàm để unsubscribe
 */
export const subscribeToLeaderboard = (callback) => {
  try {
    const leaderboardRef = ref(database, LEADERBOARD_PATH);
    
    const unsubscribe = onValue(leaderboardRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const data = snapshot.val();
      const entries = Object.keys(data)
        .map(key => {
          const entry = data[key];
          // Validate và sanitize dữ liệu
          const score = typeof entry.score === 'number' && entry.score >= 0 && entry.score <= 10000 
            ? Math.floor(entry.score) 
            : 0;
          const vmoId = typeof entry.vmoId === 'string' && entry.vmoId.length <= 10
            ? entry.vmoId.slice(0, 10)
            : key.slice(0, 10);
          
          return {
            id: key,
            vmoId: vmoId,
            score: score
          };
        })
        .filter(entry => entry.score > 0); // Chỉ lấy entries có điểm hợp lệ
      
      // Sắp xếp theo điểm giảm dần
      entries.sort((a, b) => b.score - a.score);
      
      // Chỉ lấy top 10
      callback(entries.slice(0, 10));
    }, (error) => {
      callback([]);
    });
    
    return () => {
      off(leaderboardRef, 'value', unsubscribe);
    };
  } catch (error) {
    return () => {};
  }
};
