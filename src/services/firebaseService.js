import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  validateVmoId, 
  validateScore, 
  validateGameState,
  checkRateLimit,
  createDataHash
} from '../utils/security';

const LEADERBOARD_COLLECTION = 'leaderboard';

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
    const playerDocRef = doc(db, LEADERBOARD_COLLECTION, sanitizedVmoId);
    
    // Lấy điểm hiện tại của người chơi
    const docSnap = await getDoc(playerDocRef);
    const currentData = docSnap.exists() ? docSnap.data() : null;
    const previousScore = currentData?.score || 0;
    
    // Validate score với previous score
    if (!validateScore(score, previousScore)) {
      return { success: false, error: 'Invalid score' };
    }
    
    // Chỉ cập nhật nếu điểm mới cao hơn điểm cũ
    if (!currentData || score > previousScore) {
      const timestamp = Date.now();
      const dataHash = createDataHash(sanitizedVmoId, score, timestamp);
      
      await setDoc(playerDocRef, {
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

    const playerDocRef = doc(db, LEADERBOARD_COLLECTION, sanitizedVmoId);
    const docSnap = await getDoc(playerDocRef);
    
    if (!docSnap.exists()) {
      return 0;
    }
    
    const data = docSnap.data();
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
    const leaderboardRef = collection(db, LEADERBOARD_COLLECTION);
    const q = query(leaderboardRef, orderBy('score', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    // Chuyển đổi snapshot thành mảng
    const entries = [];
    querySnapshot.forEach((doc) => {
      const entry = doc.data();
      // Validate và sanitize dữ liệu
      const score = typeof entry.score === 'number' && entry.score >= 0 && entry.score <= 10000 
        ? Math.floor(entry.score) 
        : 0;
      const vmoId = typeof entry.vmoId === 'string' && entry.vmoId.length <= 10
        ? entry.vmoId.slice(0, 10)
        : doc.id.slice(0, 10);
      
      if (score > 0) { // Chỉ lấy entries có điểm hợp lệ
        entries.push({
          id: doc.id,
          vmoId: vmoId,
          score: score
        });
      }
    });
    
    return entries;
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
    const leaderboardRef = collection(db, LEADERBOARD_COLLECTION);
    const q = query(leaderboardRef, orderBy('score', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        callback([]);
        return;
      }
      
      const entries = [];
      querySnapshot.forEach((doc) => {
        const entry = doc.data();
        // Validate và sanitize dữ liệu
        const score = typeof entry.score === 'number' && entry.score >= 0 && entry.score <= 10000 
          ? Math.floor(entry.score) 
          : 0;
        const vmoId = typeof entry.vmoId === 'string' && entry.vmoId.length <= 10
          ? entry.vmoId.slice(0, 10)
          : doc.id.slice(0, 10);
        
        if (score > 0) { // Chỉ lấy entries có điểm hợp lệ
          entries.push({
            id: doc.id,
            vmoId: vmoId,
            score: score
          });
        }
      });
      
      callback(entries);
    }, (error) => {
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    return () => {};
  }
};
