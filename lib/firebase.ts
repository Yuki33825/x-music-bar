/**
 * Firebase Realtime Database 設定
 * x-Music Bar: 観客とパフォーマー間のリアルタイム同期
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// Firebase設定（環境変数から読み込み）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase アプリとデータベースの遅延初期化
let app: FirebaseApp | null = null;
let database: Database | null = null;

/**
 * Firebaseアプリを取得（遅延初期化）
 */
export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be initialized on the client side");
  }
  
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

/**
 * Firebaseデータベースを取得（遅延初期化）
 */
export function getFirebaseDatabase(): Database {
  if (!database) {
    database = getDatabase(getFirebaseApp());
  }
  return database;
}
