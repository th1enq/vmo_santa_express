import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env vars without prefix
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get Firebase config from env
  const firebaseConfig = {
    FIREBASE_API_KEY: env.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: env.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_DATABASE_URL: env.FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: env.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: env.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  }
  
  return {
    plugins: [react()],
    base: '/',
    define: {
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify(firebaseConfig.FIREBASE_API_KEY),
      'import.meta.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(firebaseConfig.FIREBASE_AUTH_DOMAIN),
      'import.meta.env.FIREBASE_DATABASE_URL': JSON.stringify(firebaseConfig.FIREBASE_DATABASE_URL),
      'import.meta.env.FIREBASE_PROJECT_ID': JSON.stringify(firebaseConfig.FIREBASE_PROJECT_ID),
      'import.meta.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(firebaseConfig.FIREBASE_STORAGE_BUCKET),
      'import.meta.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(firebaseConfig.FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.FIREBASE_APP_ID': JSON.stringify(firebaseConfig.FIREBASE_APP_ID),
    },
  }
})
