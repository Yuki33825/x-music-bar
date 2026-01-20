"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FluidicCore } from "@/components/fluidic-core";
import { SabitSliders } from "@/components/sabit-sliders";
import { InteractiveRadar } from "@/components/interactive-radar";
// Custom icon component: Cyber cocktail glass with digital sound waves
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
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        {/* Glass outline gradient */}
        <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Martini glass outline */}
      <path
        d="M5 3H19L12 12V19H15V21H9V19H12V12L5 3Z"
        stroke="url(#glassGradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Digital sound waves inside glass */}
      <g filter="url(#glow)">
        {/* Wave 1 */}
        <path
          d="M7.5 6L8.5 5L9.5 7L10.5 4.5L11.5 7L12.5 5L13.5 7L14.5 5L15.5 6.5L16.5 5"
          stroke="url(#waveGradient)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Wave 2 */}
        <path
          d="M8.5 8.5L9.5 7.5L10.5 9L11.5 7L12.5 9.5L13.5 7.5L14.5 9L15.5 8"
          stroke="url(#waveGradient)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.8"
        />
        {/* Wave 3 - subtle */}
        <path
          d="M9.5 10.5L10.5 10L11.5 11L12.5 9.5L13.5 11L14 10.5"
          stroke="url(#waveGradient)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.6"
        />
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
  const [vectors, setVectors] = useState<VectorValues>(DEFAULT_VALUES);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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
    <main className="min-h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-4 pt-4 pb-2">
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
            }}
          >
            x-Music Bar
          </h1>
        </div>
      </header>

      {/* Fluidic Core with Interactive Radar overlay */}
      <section className="flex-1 px-4 py-2">
        <motion.div
          className="relative rounded-2xl border border-border/30 overflow-hidden h-full"
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
          <div ref={containerRef} className="h-full min-h-[280px] relative flex items-center justify-center">
            {/* Square drawing area - centered in container */}
            {containerSize.width > 0 && containerSize.height > 0 && (
              <div 
                className="relative"
                style={{
                  width: Math.min(containerSize.width, containerSize.height),
                  height: Math.min(containerSize.width, containerSize.height),
                }}
              >
                {/* FluidicCore */}
                <FluidicCore vectors={vectors} />
                {/* Semi-transparent overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "oklch(0.05 0.01 260 / 0.3)",
                  }}
                />
                {/* Interactive Radar */}
                <InteractiveRadar vectors={vectors} onChange={setVectors} />
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Bottom Section - SABIT Values Display */}
      <section className="shrink-0 px-4 pt-2 pb-4">
        <motion.div
          className="rounded-2xl border border-border/30 p-3"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.12 0.015 260) 0%, oklch(0.10 0.012 260) 100%)",
            boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.03)",
            maxHeight: "180px",
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
