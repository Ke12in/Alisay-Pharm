// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDoPjYaAVlXvTruE4Bh5wywAp5vzin7_PY",
  authDomain: "pharmacy-ali.firebaseapp.com",
  projectId: "pharmacy-ali",
  storageBucket: "pharmacy-ali.firebasestorage.app",
  messagingSenderId: "1099294219790",
  appId: "1:1099294219790:web:900d2bb54ae39bfde5265f",
  measurementId: "G-CX8T5Q1JFK"
};

// Initialize Firebase (compat version)
firebase.initializeApp(firebaseConfig);
// Optionally initialize analytics if needed
if (typeof firebase.analytics === 'function') {
  firebase.analytics();
} 