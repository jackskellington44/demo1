// ============================================
// FIREBASE CONFIGURATION
// ============================================

export const firebaseConfig = {
  apiKey: "AIzaSyASpTOH6fqNmzBqQXwKe7W_2hIG9DJmVME",
  authDomain: "demodotcom-9e2ea.firebaseapp.com",
  databaseURL: "https://demodotcom-9e2ea-default-rtdb.firebaseio.com",
  projectId: "demodotcom-9e2ea",
  storageBucket: "demodotcom-9e2ea.firebasestorage.app",
  messagingSenderId: "558126877181",
  appId: "1:558126877181:web:f74492772a187d8c173194"
};

// ============================================
// FIREBASE SERVICE REFERENCES
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('✓ Firebase initialized');