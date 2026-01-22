/**
 * Firebase Realtime Database との同期フック
 * 観客とパフォーマー間でSABIT値をリアルタイム同期
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ref, onValue, set, off, Database } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase";

// ベクトル値の型定義
export interface VectorValues {
  S: number;
  A: number;
  B: number;
  I: number;
  T: number;
}

// デフォルト値
const DEFAULT_VALUES: VectorValues = {
  S: 0,
  A: 0,
  B: 0,
  I: 0,
  T: 0,
};

// Firebaseのパス
const SABIT_PATH = "sabit/current";

/**
 * 観客用: SABIT値をFirebaseに書き込むフック
 * 値が変更されるとFirebaseに自動的に同期
 */
export function useSyncedVectorsWrite() {
  const [vectors, setVectorsLocal] = useState<VectorValues>(DEFAULT_VALUES);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<Database | null>(null);

  // Firebase初期化
  useEffect(() => {
    try {
      dbRef.current = getFirebaseDatabase();
      
      // 接続状態の監視
      const connectedRef = ref(dbRef.current, ".info/connected");
      onValue(connectedRef, (snapshot) => {
        setIsConnected(snapshot.val() === true);
        if (snapshot.val() === true) {
          setError(null);
        }
      });

      return () => {
        if (dbRef.current) {
          off(ref(dbRef.current, ".info/connected"));
        }
      };
    } catch (err) {
      console.error("Firebase initialization error:", err);
      setError("Firebase接続エラー");
    }
  }, []);

  // Firebaseへの書き込み
  const setVectors = useCallback((newVectors: VectorValues) => {
    setVectorsLocal(newVectors);
    
    if (!dbRef.current) return;
    
    try {
      const sabitRef = ref(dbRef.current, SABIT_PATH);
      set(sabitRef, {
        ...newVectors,
        timestamp: Date.now(),
      }).catch((err) => {
        console.error("Firebase write error:", err);
        setError("データの送信に失敗しました");
      });
    } catch (err) {
      console.error("Firebase reference error:", err);
      setError("Firebase接続エラー");
    }
  }, []);

  return {
    vectors,
    setVectors,
    isConnected,
    error,
  };
}

/**
 * パフォーマー用: FirebaseからSABIT値をリアルタイムで購読するフック
 * 観客が値を変更すると自動的に更新される
 */
export function useSyncedVectorsRead() {
  const [vectors, setVectors] = useState<VectorValues>(DEFAULT_VALUES);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<Database | null>(null);

  // Firebase初期化とリアルタイム購読
  useEffect(() => {
    try {
      dbRef.current = getFirebaseDatabase();
      
      // SABIT値の購読
      const sabitRef = ref(dbRef.current, SABIT_PATH);
      onValue(sabitRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setVectors({
            S: data.S ?? 0,
            A: data.A ?? 0,
            B: data.B ?? 0,
            I: data.I ?? 0,
            T: data.T ?? 0,
          });
          if (data.timestamp) {
            setLastUpdated(new Date(data.timestamp));
          }
        }
      }, (err) => {
        console.error("Firebase read error:", err);
        setError("データの受信に失敗しました");
      });

      // 接続状態の監視
      const connectedRef = ref(dbRef.current, ".info/connected");
      onValue(connectedRef, (snapshot) => {
        setIsConnected(snapshot.val() === true);
        if (snapshot.val() === true) {
          setError(null);
        }
      });

      return () => {
        if (dbRef.current) {
          off(ref(dbRef.current, SABIT_PATH));
          off(ref(dbRef.current, ".info/connected"));
        }
      };
    } catch (err) {
      console.error("Firebase subscription error:", err);
      setError("Firebase接続エラー");
    }
  }, []);

  return {
    vectors,
    isConnected,
    lastUpdated,
    error,
  };
}
