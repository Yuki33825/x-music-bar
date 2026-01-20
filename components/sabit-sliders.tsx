"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Candy, Citrus, Coffee, Gauge, Sparkles } from "lucide-react";

interface VectorValues {
  S: number;
  A: number;
  B: number;
  I: number;
  T: number;
}

interface SabitSlidersProps {
  values: VectorValues;
}

const DIMENSIONS = [
  {
    key: "S" as const,
    label: "S",
    fullName: "Sweetness",
    icon: Candy,
    color: "oklch(0.75 0.18 30)",
    glowColor: "oklch(0.75 0.18 30 / 0.6)",
  },
  {
    key: "A" as const,
    label: "A",
    fullName: "Acidity",
    icon: Citrus,
    color: "oklch(0.70 0.16 100)",
    glowColor: "oklch(0.70 0.16 100 / 0.6)",
  },
  {
    key: "B" as const,
    label: "B",
    fullName: "Bitterness",
    icon: Coffee,
    color: "oklch(0.55 0.12 60)",
    glowColor: "oklch(0.55 0.12 60 / 0.6)",
  },
  {
    key: "I" as const,
    label: "I",
    fullName: "Intensity",
    icon: Gauge,
    color: "oklch(0.65 0.20 25)",
    glowColor: "oklch(0.65 0.20 25 / 0.6)",
  },
  {
    key: "T" as const,
    label: "T",
    fullName: "Texture",
    icon: Sparkles,
    color: "oklch(0.65 0.15 280)",
    glowColor: "oklch(0.65 0.15 280 / 0.6)",
  },
];

export function SabitSliders({ values }: SabitSlidersProps) {
  const total = useMemo(() => {
    return Object.values(values).reduce((sum, v) => sum + v, 0);
  }, [values]);

  const percentages = useMemo(() => {
    if (total === 0) {
      // Equal distribution when no values
      return DIMENSIONS.map(() => 20);
    }
    return DIMENSIONS.map((dim) => (values[dim.key] / total) * 100);
  }, [values, total]);

  const hasActiveVectors = total > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-3">
        <h2
          style={{
            fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "oklch(0.55 0.02 260)",
            textTransform: "uppercase",
          }}
        >
          SABIT Balance
        </h2>
      </div>

      {/* Stacked Bar */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          height: "64px",
          background: "oklch(0.12 0.015 260)",
          boxShadow: "inset 0 2px 4px oklch(0 0 0 / 0.4)",
        }}
      >
        <div className="absolute inset-0 flex">
          {DIMENSIONS.map((dim, index) => {
            const Icon = dim.icon;
            const value = values[dim.key];
            const percentage = percentages[index];
            const isActive = value > 0;
            // Show full name if wide enough, otherwise show label
            const showFullName = percentage >= 15;

            return (
              <motion.div
                key={dim.key}
                className="relative flex items-center justify-center overflow-hidden"
                style={{
                  background: hasActiveVectors && isActive
                    ? `linear-gradient(180deg, ${dim.color}90, ${dim.color})`
                    : "oklch(0.18 0.015 260)",
                  boxShadow: isActive ? `inset 0 0 20px ${dim.glowColor}` : "none",
                  borderRight: index < DIMENSIONS.length - 1 
                    ? "1px solid oklch(0.10 0.01 260 / 0.5)" 
                    : "none",
                }}
                initial={{ width: "20%" }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Content - only show if segment is wide enough */}
                <motion.div
                  className="flex flex-col items-center justify-center gap-0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: percentage >= 8 ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Icon */}
                  <Icon
                    size={14}
                    style={{
                      color: isActive ? "oklch(0.98 0.01 260)" : "oklch(0.45 0.02 260)",
                      filter: isActive ? "drop-shadow(0 1px 2px oklch(0 0 0 / 0.3))" : "none",
                    }}
                  />
                  
                  {/* Full Name or Label */}
                  <span
                    style={{
                      fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
                      fontSize: showFullName ? "8px" : "9px",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      color: isActive ? "oklch(0.98 0.01 260)" : "oklch(0.45 0.02 260)",
                      textShadow: isActive ? "0 1px 2px oklch(0 0 0 / 0.3)" : "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {showFullName ? dim.fullName : dim.label}
                  </span>
                  
                  {/* Percentage */}
                  <span
                    style={{
                      fontFamily: "'SF Mono', 'Fira Code', monospace",
                      fontSize: "10px",
                      fontWeight: 500,
                      color: isActive ? "oklch(0.95 0.02 260)" : "oklch(0.40 0.02 260)",
                      textShadow: isActive ? "0 1px 2px oklch(0 0 0 / 0.3)" : "none",
                    }}
                  >
                    {hasActiveVectors ? `${Math.round(percentage)}%` : "—"}
                  </span>
                </motion.div>

                {/* Glow overlay for active segments */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(180deg, oklch(1 0 0 / 0.1) 0%, transparent 50%)`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend - compact row below */}
      <div className="shrink-0 mt-2 flex justify-between px-1">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;
          const value = values[dim.key];
          const isActive = value > 0;

          return (
            <div key={dim.key} className="flex items-center gap-1">
              <Icon
                size={10}
                style={{ color: isActive ? dim.color : "oklch(0.45 0.02 260)" }}
              />
              <span
                style={{
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontSize: "10px",
                  fontWeight: 500,
                  color: isActive ? dim.color : "oklch(0.45 0.02 260)",
                }}
              >
                {value.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
