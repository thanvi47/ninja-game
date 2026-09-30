import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Default / fallback Firebase config. 
// Can be customized with real credentials in .env (e.g. VITE_FIREBASE_API_KEY)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let db = null;
let isConnected = false;

// Initialize Firebase if credentials exist
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    isConnected = true;
    console.log("🔥 Firebase initialized successfully for global high scores!");
  } else {
    console.log("ℹ️ Firebase credentials not provided in .env - running in Local/Offline Leaderboard mode.");
  }
} catch (err) {
  console.warn("⚠️ Firebase init error, falling back to local leaderboard:", err);
}

// Default initial high scores for the ninja clan leaderboard
const DEFAULT_LEADERBOARD = [
  { name: "Kanzo Hattori", score: 12500, scrolls: 45, date: "Master" },
  { name: "Shinzo", score: 8400, scrolls: 30, date: "Genin" },
  { name: "Kemumaki", score: 6200, scrolls: 22, date: "Rival" },
  { name: "Shishimaru", score: 4100, scrolls: 15, date: "Chunin" },
  { name: "Tsubame", score: 2900, scrolls: 9, date: "Kunoichi" }
];

const LOCAL_STORAGE_KEY = 'ninja_hattori_leaderboard';

export const leaderboardService = {
  isConfigured() {
    return isConnected;
  },

  async saveScore(playerName, score, scrolls, distance) {
    const entry = {
      name: (playerName || 'Ninja').trim().slice(0, 15),
      score: Math.floor(score),
      scrolls: Math.floor(scrolls),
      distance: Math.floor(distance),
      timestamp: Date.now()
    };

    // 1. Always save to LocalStorage
    try {
      const local = this.getLocalScores();
      local.push(entry);
      local.sort((a, b) => b.score - a.score);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local.slice(0, 20)));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    // 2. If Firebase Firestore is active, save to cloud
    if (isConnected && db) {
      try {
        await addDoc(collection(db, 'highscores'), {
          ...entry,
          createdAt: new Date()
        });
        console.log("☁️ High score successfully synced to Firebase Firestore!");
      } catch (err) {
        console.warn("Could not save to Firebase, saved locally:", err);
      }
    }

    return entry;
  },

  getLocalScores() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }
    // Seed default leaderboard if empty
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
    return [...DEFAULT_LEADERBOARD];
  },

  async getTopScores(count = 7) {
    if (isConnected && db) {
      try {
        const q = query(collection(db, 'highscores'), orderBy('score', 'desc'), limit(count));
        const snapshot = await getDocs(q);
        const scores = [];
        snapshot.forEach(doc => {
          scores.push(doc.data());
        });
        if (scores.length > 0) {
          return scores;
        }
      } catch (err) {
        console.warn("Failed fetching from Firebase, using local data:", err);
      }
    }

    // Fallback to local storage
    const local = this.getLocalScores();
    return local.slice(0, count);
  }
};
