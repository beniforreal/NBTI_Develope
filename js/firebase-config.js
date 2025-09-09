const firebaseConfig = {
  apiKey: "AIzaSyBrMBRBEuYv1ws1Kvwoc__XhAciksdDnys",
  authDomain: "nbti-37b3f.firebaseapp.com",
  projectId: "nbti-37b3f",
  storageBucket: "nbti-37b3f.firebasestorage.app",
  messagingSenderId: "91397959616",
  appId: "1:91397959616:web:a1e33b9d2cfbb6a758a225",
  measurementId: "G-B07ZSG3910"
};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// 세션 지속 시간을 1시간으로 설정
setPersistence(auth, browserLocalPersistence).catch((error) => {
  // console.error('세션 지속 설정 실패:', error);
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
window.firebaseAnalytics = analytics;
