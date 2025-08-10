// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

import {
  API_KEY,
  AUTH_DOMAIN,
  PROJECT_ID,
  STORAGE_BUCKET,
  MESSAGING_SENDERID,
  APP_ID,
  MEASUREMENT_ID,
} from "./constants";

// Firebase 配置
const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDERID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID,
};

// 初始化 Firebase App
const app = initializeApp(firebaseConfig);

// 導出 Auth 服務
export const auth = getAuth(app);

// 導出 Google Provider
export const googleProvider = new GoogleAuthProvider();

// 導出 Firestore
export const db = getFirestore(app);

// 導出 Analytics（僅在瀏覽器環境）
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };