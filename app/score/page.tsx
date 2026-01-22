"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateDynamicRecipe, vectorsToSABIT } from "@/lib/recipeEngine";

interface VectorValues {
  S: number;
  A: number;
  B: number;
  I: number;
  T: number;
}

const DEFAULT_VALUES: VectorValues = {
  S: 0,
  A: 0,
  B: 0,
  I: 0,
  T: 0,
};

/**
 * パフォーマー用スコア（レシピ）表示画面
 * 
 * - 暗いバーでの視認性を考慮したダークモード
 * - 合計容量を最上部に大きく表示
 * - 素材と分量をリスト形式で表示
 * - Firebaseからリアルタイムで値を受信
 */
export default function ScorePage() {
  const [vectors, setVectors] = useState<VectorValues>(DEFAULT_VALUES);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Firebase初期化（遅延読み込み）
  useEffect(() => {
    let mounted = true;
    let unsubscribeSabit: (() => void) | null = null;
    let unsubscribeConnected: (() => void) | null = null;

    const initFirebase = async () => {
      try {
        const { initializeApp, getApps } = await import("firebase/app");
        const { getDatabase, ref, onValue, off } = await import("firebase/database");
        
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const database = getDatabase(app);
        
        if (!mounted) return;

        // SABIT値のリアルタイム購読
        const sabitRef = ref(database, "sabit/current");
        onValue(sabitRef, (snapshot) => {
          const data = snapshot.val();
          if (data && mounted) {
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
          if (mounted) setError("データの受信に失敗しました");
        });

        // 接続状態の監視
        const connectedRef = ref(database, ".info/connected");
        onValue(connectedRef, (snapshot) => {
          if (mounted) {
            setIsConnected(snapshot.val() === true);
            if (snapshot.val() === true) setError(null);
          }
        });

        unsubscribeSabit = () => off(sabitRef);
        unsubscribeConnected = () => off(connectedRef);
      } catch (err) {
        console.error("Firebase init error:", err);
        if (mounted) setError("Firebase接続エラー");
      }
    };

    initFirebase();
    
    return () => {
      mounted = false;
      if (unsubscribeSabit) unsubscribeSabit();
      if (unsubscribeConnected) unsubscribeConnected();
    };
  }, []);

  // レシピ計算
  const recipe = useMemo(() => {
    const sabitInput = vectorsToSABIT(vectors);
    return calculateDynamicRecipe(sabitInput);
  }, [vectors]);

  // 接続状態のインジケーター色
  const connectionColor = isConnected 
    ? "oklch(0.75 0.2 145)" // 緑
    : "oklch(0.65 0.2 25)"; // 赤

  return (
    <main 
      className="min-h-[100dvh] h-[100dvh] flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg, oklch(0.08 0.01 260) 0%, oklch(0.05 0.008 260) 100%)",
      }}
    >
      {/* ヘッダー - 接続状態 */}
      <header className="shrink-0 px-6 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h1 
            className="text-lg font-semibold"
            style={{ color: "oklch(0.7 0.02 260)" }}
          >
            x-Music Bar Score
          </h1>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: connectionColor,
                boxShadow: `0 0 8px ${connectionColor}`,
              }}
            />
            <span 
              className="text-xs"
              style={{ color: "oklch(0.5 0.02 260)" }}
            >
              {isConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>
        {error && (
          <p className="text-xs mt-1" style={{ color: "oklch(0.7 0.2 25)" }}>
            {error}
          </p>
        )}
      </header>

      {/* 合計容量 - メイン表示 */}
      <section className="shrink-0 px-6 py-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          key={recipe.totalVolume}
        >
          <p 
            className="text-sm uppercase tracking-widest mb-2"
            style={{ color: "oklch(0.5 0.03 270)" }}
          >
            Total Volume
          </p>
          <p 
            className="font-mono font-bold"
            style={{ 
              fontSize: "clamp(4rem, 15vw, 8rem)",
              color: "oklch(0.95 0.02 270)",
              textShadow: "0 0 40px oklch(0.6 0.15 270 / 0.5)",
              lineHeight: 1,
            }}
          >
            {recipe.totalVolume}
            <span 
              className="text-2xl ml-2"
              style={{ color: "oklch(0.6 0.02 270)" }}
            >
              ml
            </span>
          </p>
        </motion.div>
      </section>

      {/* SABIT値表示 */}
      <section className="shrink-0 px-6 pb-4">
        <div className="flex justify-center gap-4">
          {(["S", "A", "B", "I", "T"] as const).map((key) => (
            <div 
              key={key}
              className="text-center"
            >
              <p 
                className="text-xs font-medium mb-1"
                style={{ color: "oklch(0.5 0.02 260)" }}
              >
                {key}
              </p>
              <p 
                className="font-mono text-lg"
                style={{ color: "oklch(0.8 0.03 270)" }}
              >
                {vectors[key]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 区切り線 */}
      <div 
        className="mx-6 h-px"
        style={{ 
          background: "linear-gradient(90deg, transparent, oklch(0.3 0.02 270), transparent)",
        }}
      />

      {/* レシピリスト */}
      <section className="flex-1 min-h-0 px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {recipe.recipe.map((item, index) => (
            <motion.div
              key={item.name}
              className="flex items-center justify-between py-3 border-b"
              style={{ 
                borderColor: "oklch(0.2 0.01 260)",
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* 素材名 */}
              <div className="flex items-center gap-3">
                <span 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{ 
                    backgroundColor: "oklch(0.2 0.02 270)",
                    color: "oklch(0.7 0.03 270)",
                  }}
                >
                  {index + 1}
                </span>
                <span 
                  className="font-medium"
                  style={{ 
                    color: "oklch(0.9 0.01 260)",
                    fontSize: "clamp(1rem, 4vw, 1.25rem)",
                  }}
                >
                  {item.name}
                </span>
              </div>

              {/* 分量 */}
              <span 
                className="font-mono font-bold"
                style={{ 
                  color: "oklch(0.95 0.1 270)",
                  fontSize: "clamp(1.25rem, 5vw, 1.75rem)",
                  textShadow: "0 0 20px oklch(0.6 0.15 270 / 0.3)",
                }}
              >
                {item.ml}
                <span 
                  className="text-sm ml-1 font-normal"
                  style={{ color: "oklch(0.6 0.02 270)" }}
                >
                  ml
                </span>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* レシピが空の場合 */}
        {recipe.recipe.length === 0 && (
          <div 
            className="text-center py-12"
            style={{ color: "oklch(0.4 0.02 260)" }}
          >
            <p>レシピを待機中...</p>
            <p className="text-sm mt-2">観客がSABIT値を操作すると表示されます</p>
          </div>
        )}
      </section>

      {/* フッター - 最終更新時刻 */}
      <footer className="shrink-0 px-6 py-3 text-center">
        <p 
          className="text-xs"
          style={{ color: "oklch(0.4 0.02 260)" }}
        >
          {lastUpdated 
            ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
            : "Waiting for data..."
          }
        </p>
      </footer>
    </main>
  );
}
