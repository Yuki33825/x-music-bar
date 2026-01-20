"use client";

import React, { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";

interface VectorValues {
  S: number;
  A: number;
  B: number;
  I: number;
  T: number;
}

interface InteractiveRadarProps {
  vectors: VectorValues;
  onChange: (values: VectorValues) => void;
}

const DIMENSIONS = [
  { key: "S" as const, label: "S", fullName: "Sweetness", color: "oklch(0.75 0.18 30)" },
  { key: "A" as const, label: "A", fullName: "Acidity", color: "oklch(0.70 0.16 100)" },
  { key: "B" as const, label: "B", fullName: "Bitterness", color: "oklch(0.55 0.12 60)" },
  { key: "I" as const, label: "I", fullName: "Intensity", color: "oklch(0.65 0.20 25)" },
  { key: "T" as const, label: "T", fullName: "Texture", color: "oklch(0.65 0.15 280)" },
];

export function InteractiveRadar({ vectors, onChange }: InteractiveRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<keyof VectorValues | null>(null);
  const [hovering, setHovering] = useState<keyof VectorValues | null>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });

  // Match FluidicCore's sizing: use full container dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    
    // Also observe container size changes
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener("resize", updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  const { width, height } = dimensions;
  // Match FluidicCore exactly: center is width/2, height/2
  const centerX = width / 2;
  const centerY = height / 2;
  // Match FluidicCore's baseRadius calculation: Math.min(width, height) * 0.32
  const maxRadius = Math.min(width, height) * 0.32;
  const levels = 4;
  const hitRadius = Math.max(16, maxRadius * 0.22);

  const getAngle = useCallback((index: number) => {
    return (index / 5) * Math.PI * 2 - Math.PI / 2;
  }, []);

  const getPointPosition = useCallback(
    (index: number, value: number) => {
      const angle = getAngle(index);
      const radius = value * maxRadius;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    },
    [centerX, centerY, maxRadius, getAngle]
  );

  const getAxisEndpoint = useCallback(
    (index: number) => {
      const angle = getAngle(index);
      const labelOffset = Math.min(22, maxRadius * 0.25);
      return {
        x: centerX + Math.cos(angle) * maxRadius,
        y: centerY + Math.sin(angle) * maxRadius,
        labelX: centerX + Math.cos(angle) * (maxRadius + labelOffset),
        labelY: centerY + Math.sin(angle) * (maxRadius + labelOffset),
        angle,
      };
    },
    [centerX, centerY, maxRadius, getAngle]
  );

  const calculateValueFromPosition = useCallback(
    (clientX: number, clientY: number, dimIndex: number) => {
      if (!svgRef.current) return null;

      const rect = svgRef.current.getBoundingClientRect();
      const x = clientX - rect.left - centerX;
      const y = clientY - rect.top - centerY;

      const angle = getAngle(dimIndex);
      const axisX = Math.cos(angle);
      const axisY = Math.sin(angle);

      // Project point onto axis
      const projection = x * axisX + y * axisY;
      const normalizedValue = Math.max(0, Math.min(1, projection / maxRadius));

      return Math.round(normalizedValue * 100) / 100;
    },
    [centerX, centerY, maxRadius, getAngle]
  );

  const handlePointerDown = useCallback(
    (key: keyof VectorValues, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(key);
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;

      const dimIndex = DIMENSIONS.findIndex((d) => d.key === dragging);
      if (dimIndex === -1) return;

      const newValue = calculateValueFromPosition(e.clientX, e.clientY, dimIndex);
      if (newValue !== null) {
        onChange({
          ...vectors,
          [dragging]: newValue,
        });
      }
    },
    [dragging, vectors, onChange, calculateValueFromPosition]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const polygonPoints = useMemo(() => {
    return DIMENSIONS.map((dim, i) => {
      const pos = getPointPosition(i, vectors[dim.key]);
      return `${pos.x},${pos.y}`;
    }).join(" ");
  }, [vectors, getPointPosition]);

  const hasActiveVectors = Object.values(vectors).some((v) => v > 0);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="touch-none absolute inset-0"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Background glow */}
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.75 0.15 30 / 0.08)" />
            <stop offset="100%" stopColor="oklch(0.75 0.15 30 / 0)" />
          </radialGradient>
        </defs>
        <circle cx={centerX} cy={centerY} r={maxRadius * 1.3} fill="url(#radarGlow)" />

        {/* Level circles */}
        {Array.from({ length: levels }).map((_, i) => {
          const levelRadius = ((i + 1) / levels) * maxRadius;
          return (
            <circle
              key={i}
              cx={centerX}
              cy={centerY}
              r={levelRadius}
              fill="none"
              stroke="oklch(0.30 0.02 260)"
              strokeWidth="0.5"
              strokeDasharray="4,5"
            />
          );
        })}

        {/* Axis lines and labels */}
        {DIMENSIONS.map((dim, i) => {
          const endpoint = getAxisEndpoint(i);
          const isActive = vectors[dim.key] > 0;
          const isHovered = hovering === dim.key;
          const isDragged = dragging === dim.key;

          return (
            <g key={dim.key}>
              <line
                x1={centerX}
                y1={centerY}
                x2={endpoint.x}
                y2={endpoint.y}
                stroke={isActive || isHovered || isDragged ? dim.color : "oklch(0.35 0.02 260)"}
                strokeWidth={isDragged ? 2 : isHovered ? 1.5 : 1}
                strokeDasharray={isActive ? "none" : "4,4"}
                style={{
                  filter: isActive || isDragged ? `drop-shadow(0 0 4px ${dim.color})` : "none",
                  transition: "stroke-width 0.15s ease",
                }}
              />
              <text
                x={endpoint.labelX}
                y={endpoint.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="select-none"
                style={{
                  fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
                  fontSize: "13px",
                  fontWeight: isActive || isDragged ? 600 : 500,
                  letterSpacing: "0.02em",
                  fill: isActive || isDragged ? dim.color : "oklch(0.60 0.02 260)",
                  filter: isDragged ? `drop-shadow(0 0 6px ${dim.color})` : "none",
                }}
              >
                {dim.label}
              </text>
            </g>
          );
        })}

        {/* Shape polygon */}
        {hasActiveVectors && (
          <motion.polygon
            points={polygonPoints}
            fill="oklch(0.80 0.06 260 / 0.08)"
            stroke="oklch(0.90 0.03 260)"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              transformOrigin: `${centerX}px ${centerY}px`,
              filter: "drop-shadow(0 0 12px oklch(0.85 0.04 260 / 0.4))",
            }}
          />
        )}

        {/* Interactive value points (follows value) - also acts as hit area */}
        {DIMENSIONS.map((dim, i) => {
          const pos = getPointPosition(i, vectors[dim.key]);
          const isActive = vectors[dim.key] > 0;
          const isDragged = dragging === dim.key;
          const isHovered = hovering === dim.key;

          return (
            <g key={`value-${dim.key}`}>
              {/* Hit area at value position */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={hitRadius}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => handlePointerDown(dim.key, e)}
                onPointerEnter={() => setHovering(dim.key)}
                onPointerLeave={() => setHovering(null)}
              />
              {/* Visual point */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={isDragged ? 10 : isHovered ? 8 : isActive ? 6 : 4}
                fill={isActive || isDragged || isHovered ? dim.color : "oklch(0.40 0.02 260)"}
                initial={false}
                animate={{ cx: pos.x, cy: pos.y }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  filter:
                    isDragged || isActive
                      ? `drop-shadow(0 0 ${isDragged ? 14 : 8}px ${dim.color})`
                      : "none",
                  pointerEvents: "none",
                }}
              />
            </g>
          );
        })}

        {/* Interactive hit areas (fixed at axis endpoints) */}
        {DIMENSIONS.map((dim, i) => {
          const endpoint = getAxisEndpoint(i);
          const isDragged = dragging === dim.key;
          const isHovered = hovering === dim.key;

          return (
            <g key={`control-${dim.key}`}>
              {/* Invisible hit area - fixed at endpoint */}
              <circle
                cx={endpoint.x}
                cy={endpoint.y}
                r={hitRadius}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => handlePointerDown(dim.key, e)}
                onPointerEnter={() => setHovering(dim.key)}
                onPointerLeave={() => setHovering(null)}
              />

              {/* Visual control ring at endpoint */}
              <circle
                cx={endpoint.x}
                cy={endpoint.y}
                r={isDragged ? 14 : isHovered ? 12 : 10}
                fill="none"
                stroke={isDragged || isHovered ? dim.color : "oklch(0.45 0.02 260)"}
                strokeWidth={isDragged ? 2.5 : isHovered ? 2 : 1.5}
                style={{
                  filter: isDragged ? `drop-shadow(0 0 8px ${dim.color})` : "none",
                  transition: "r 0.15s ease, stroke-width 0.15s ease",
                  cursor: "pointer",
                  pointerEvents: "none",
                }}
              />

              {/* Value label when dragging */}
              {isDragged && (
                <text
                  x={endpoint.x}
                  y={endpoint.y - 24}
                  textAnchor="middle"
                  className="select-none"
                  style={{
                    fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    fill: dim.color,
                    filter: `drop-shadow(0 0 4px oklch(0 0 0 / 0.8))`,
                  }}
                >
                  {vectors[dim.key].toFixed(2)}
                </text>
              )}
            </g>
          );
        })}

        {/* Center point */}
        <circle cx={centerX} cy={centerY} r={3} fill="oklch(0.50 0.02 260)" />

        {/* Instructions - positioned at bottom center of SVG */}
        <text
          x={centerX}
          y={height - 16}
          textAnchor="middle"
          className="select-none"
          style={{
            fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.04em",
            fill: "oklch(0.55 0.02 260)",
          }}
        >
          Drag to blend taste and texture
        </text>
      </svg>
    </div>
  );
}
