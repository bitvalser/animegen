import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAi-N5LLuRUWKFACl9yZeHNYpGK7SodXSU',
  authDomain: 'animegen.firebaseapp.com',
  projectId: 'animegen',
  storageBucket: 'animegen.appspot.com',
  messagingSenderId: '829029055258',
  appId: '1:829029055258:web:63373099fafbc4de4f4aa3',
  measurementId: 'G-L78YMD5NE9',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const analytics = getAnalytics(firebaseApp);
export const firestore = getFirestore(firebaseApp);
