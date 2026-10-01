import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCB1i1DOHdqz-R2FQasi3fABk1TLvmzQTc',
  authDomain: 'registro-igreja-1433a.firebaseapp.com',
  projectId: 'registro-igreja-1433a',
  storageBucket: 'registro-igreja-1433a.appspot.com',
  messagingSenderId: '1094930781004',
  appId: '1:1094930781004:web:4829b8e387cfba803735e9',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
