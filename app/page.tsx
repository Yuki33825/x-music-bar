"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FluidicCore } from "@/components/fluidic-core";
import { SabitSliders } from "@/components/sabit-sliders";
import { InteractiveRadar } from "@/components/interactive-radar";
// Custom icon component: Cyber cocktail glass with digital sound wave
function XMusicBarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Neon blue-purple gradient */}
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        {/* Glass outline gradient */}
        <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        {/* Strong glow filter */}
        <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Sound wave - in background behind glass, centered */}
      <g>
        <path
          d="M4 10 L6 8.5 L8 11 L10 9.5 L12 12 L14 9.5 L16 11 L18 8.5 L20 10"
          stroke="url(#waveGradient)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.8"
        />
      </g>
      
      {/* Regular cocktail glass - in front, centered */}
      <g stroke="url(#glassGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Top rim (elliptical) */}
        <ellipse cx="12" cy="8" rx="7" ry="0.8" />
        {/* Body and stem as one connected path */}
        <path d="M5 8.5 L8 13.5 L12 14.5 L16 13.5 L19 8.5 M12 14.5 L12 20.5" />
        {/* Base (circular) */}
        <ellipse cx="12" cy="21.5" rx="2" ry="0.5" />
      </g>
    </svg>
  );
}

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

export default function XMusicBar() {
  const [vectors, setVectorsLocal] = useState<VectorValues>(DEFAULT_VALUES);
  const [isConnected, setIsConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const firebaseRef = useRef<any>(null);

  // Firebase初期化（遅延読み込み）
  useEffect(() => {
    let mounted = true;
    
    const initFirebase = async () => {
      try {
        const { initializeApp, getApps } = await import("firebase/app");
        const { getDatabase, ref, set, onValue } = await import("firebase/database");
        
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
        
        if (mounted) {
          firebaseRef.current = { database, ref, set, onValue };
          
          // 接続状態の監視
          const connectedRef = ref(database, ".info/connected");
          onValue(connectedRef, (snapshot) => {
            if (mounted) setIsConnected(snapshot.val() === true);
          });
        }
      } catch (err) {
        console.error("Firebase init error:", err);
      }
    };

    initFirebase();
    return () => { mounted = false; };
  }, []);

  // Firebaseへの書き込みを含むsetVectors
  const setVectors = useCallback((newVectors: VectorValues) => {
    setVectorsLocal(newVectors);
    
    if (firebaseRef.current) {
      const { database, ref, set } = firebaseRef.current;
      const sabitRef = ref(database, "sabit/current");
      set(sabitRef, { ...newVectors, timestamp: Date.now() }).catch(console.error);
    }
  }, []);

  // Measure shared container and calculate square drawing area centered within it
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Use the smaller dimension to create a square drawing area
        const squareSize = Math.min(rect.width, rect.height);
        // Center the square within the container
        setContainerSize({ 
          width: rect.width, 
          height: rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <main className="min-h-[100dvh] h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header - compact */}
      <header className="shrink-0 px-4 pt-2 pb-1 md:pt-1 md:pb-0.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(145deg, oklch(0.14 0.02 260) 0%, oklch(0.08 0.015 270) 100%)",
                boxShadow: `
                  0 0 0 1px oklch(0.25 0.03 270),
                  0 4px 16px oklch(0.5 0.2 270 / 0.3),
                  inset 0 1px 0 oklch(1 0 0 / 0.05)
                `,
              }}
            >
              <XMusicBarIcon className="w-7 h-7" />
            </div>
            <h1
              style={{
                fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
                fontSize: "17px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "oklch(0.95 0.01 260)",
                lineHeight: "40px",
                display: "flex",
                alignItems: "center",
              }}
            >
              x-Music Bar
            </h1>
          </div>
          {/* 接続状態インジケーター */}
          <div 
            className="flex items-center gap-1.5"
            title={isConnected ? "Firebaseに接続中" : "オフライン"}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: isConnected ? "oklch(0.75 0.2 145)" : "oklch(0.5 0.05 260)",
                boxShadow: isConnected ? "0 0 6px oklch(0.75 0.2 145)" : "none",
              }}
            />
            <span 
              className="text-xs"
              style={{ color: "oklch(0.5 0.02 260)" }}
            >
              {isConnected ? "SYNC" : "LOCAL"}
            </span>
          </div>
        </div>
      </header>

      {/* Fluidic Core with Interactive Radar overlay */}
      <section className="flex-1 min-h-0 px-2 py-1 md:px-0.5 md:py-0">
        <motion.div
          className="relative rounded-2xl overflow-visible h-full min-h-0"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.10 0.015 260) 0%, oklch(0.08 0.01 260) 100%)",
            boxShadow: `
              inset 0 1px 0 oklch(1 0 0 / 0.03),
              0 0 60px oklch(0.75 0.15 30 / 0.08)
            `,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Container - measure full size */}
          <div ref={containerRef} className="h-full relative flex items-center justify-center p-2 md:p-0.5">
            {/* Square drawing area - centered in container with padding for labels */}
            {containerSize.width > 0 && containerSize.height > 0 && (() => {
              // Size the square by the limiting dimension to maximize visibility.
              const availableWidth = containerSize.width - 4;
              const availableHeight = containerSize.height - 4;
              const squareSize = Math.min(availableWidth, availableHeight) * 0.98;
              return (
                <div 
                  className="relative"
                  style={{
                    width: squareSize,
                    height: squareSize,
                  }}
                >
                  {/* FluidicCore */}
                  <FluidicCore vectors={vectors} />
                  {/* Interactive Radar */}
                  <InteractiveRadar vectors={vectors} onChange={setVectors} />
                </div>
              );
            })()}
          </div>
        </motion.div>
      </section>

      {/* Bottom Section - SABIT Values Display (responsive height) */}
      <section className="shrink-0 px-4 pt-1 pb-4 md:pt-0.5 md:pb-2">
        <motion.div
          className="rounded-2xl border border-border/30 p-2 sm:p-3"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.12 0.015 260) 0%, oklch(0.10 0.012 260) 100%)",
            boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.03)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SabitSliders values={vectors} />
        </motion.div>
      </section>
    </main>
  );
}
