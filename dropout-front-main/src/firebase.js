// Firebase initialization
import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

// NOTE: Keys are public client-side config; do not store secrets here
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBSrFNuIbTk2khv-qO-lxhQ3IuRcVrwO2k",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "student-prediction-eec30.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "student-prediction-eec30",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "student-prediction-eec30.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1067622216494",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1067622216494:web:243bf65c993b851f1dc0bf",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-CQVSF1VZ42"
};

// Check if Firebase app is already initialized
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

// Export Analytics only if supported (SSR/build friendly)
let analytics = null;
if (typeof window !== 'undefined') {
  (async () => {
    try {
      if (await isAnalyticsSupported()) {
        analytics = getAnalytics(app);
      }
    } catch (e) {
      console.warn('Firebase Analytics not available:', e.message);
    }
  })();
}

export const auth = getAuth(app);

// Utility function to check if current domain is authorized
export const isDomainAuthorized = () => {
  const currentDomain = window.location.hostname;
  const authorizedDomains = [
    'localhost',
    'student-prediction-eec30.firebaseapp.com',
    // Add your Vercel domains here or use environment variable
    process.env.REACT_APP_VERCEL_URL || ''
  ];
  
  // Check for Vercel domain patterns
  const isVercelDomain = currentDomain.includes('vercel.app') || 
                        currentDomain.includes('dropout-front');
  
  return authorizedDomains.some(domain => 
    currentDomain === domain || currentDomain.includes(domain)
  ) || isVercelDomain;
};

// Helper function for better error messages
export const getAuthErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/unauthorized-domain':
      return `Domain "${window.location.hostname}" is not authorized. Please add it to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'Authentication cancelled by user.';
    default:
      return error.message || 'An authentication error occurred.';
  }
};

export { app, analytics };