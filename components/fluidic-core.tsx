"use client";

import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

interface FluidicCoreProps {
  vectors: {
    S: number;
    A: number;
    B: number;
    I: number;
    T: number;
  };
}

export function FluidicCore({ vectors }: FluidicCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }>
  >([]);

  const visualParams = useMemo(() => {
    const { S, A, B, I, T } = vectors;

    // Color: Sweetness shifts to warm pink/orange
    const hue = 280 + S * 80 - A * 30;
    const saturation = 0.3 + S * 0.4 + A * 0.2;
    const lightness = 0.5 - B * 0.3 + I * 0.2;

    // Shape: S = smooth, A = spiky
    const smoothness = 0.3 + S * 0.7 - A * 0.5;
    const spikeIntensity = A * 0.8;
    const spikeFrequency = 3 + A * 12;

    // Texture from Bitterness
    const roughness = B * 0.6;

    // Glow from Intensity
    const glowIntensity = I * 0.8;
    const pulseSpeed = 0.5 + I * 2;

    // Particles from Texture
    const particleDensity = Math.floor(T * 50);
    const particleJitter = T * 3;

    return {
      hue,
      saturation,
      lightness,
      smoothness,
      spikeIntensity,
      spikeFrequency,
      roughness,
      glowIntensity,
      pulseSpeed,
      particleDensity,
      particleJitter,
    };
  }, [vectors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get size from parent container (which is now a square)
    const rect = container.getBoundingClientRect();
    const size = rect.width; // Square, so width === height
    if (size === 0) return;

    const width = size;
    const height = size;
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.35;

    // Set canvas size with devicePixelRatio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;

      ctx.clearRect(0, 0, width, height);

      const {
        hue,
        saturation,
        lightness,
        smoothness,
        spikeIntensity,
        spikeFrequency,
        roughness,
        glowIntensity,
        pulseSpeed,
        particleDensity,
        particleJitter,
      } = visualParams;

      // Check if any vectors are active
      const hasActiveVectors = Object.values(vectors).some((v) => v > 0);

      if (!hasActiveVectors) {
        // Draw empty state - subtle pulsing ring
        const emptyPulse = Math.sin(time * 0.5) * 0.1 + 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.3 * emptyPulse, 0, Math.PI * 2);
        ctx.strokeStyle = "oklch(0.25 0.02 260)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = "10px monospace";
        ctx.fillStyle = "oklch(0.35 0.02 260)";
        ctx.textAlign = "center";
        ctx.fillText("ADJUST SABIT", centerX, centerY + baseRadius * 0.5);

        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Pulse effect from Intensity
      const pulse = Math.sin(time * pulseSpeed * Math.PI) * 0.1 + 1;
      const currentRadius = baseRadius * pulse;

      // Create organic fluid shape
      const points: Array<{ x: number; y: number }> = [];
      const numPoints = 120;

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        let r = currentRadius;

        // Organic noise
        const noiseScale = 0.3;
        const noise1 =
          Math.sin(angle * 3 + time * 0.5) *
          Math.cos(angle * 2 - time * 0.3) *
          noiseScale *
          smoothness;
        const noise2 =
          Math.sin(angle * 5 + time * 0.7) *
          Math.cos(angle * 4 + time * 0.4) *
          noiseScale *
          0.5 *
          smoothness;
        r += r * (noise1 + noise2);

        // Spikes from Acidity
        if (spikeIntensity > 0.05) {
          const spikeNoise =
            Math.sin(angle * spikeFrequency + time * 2) *
            spikeIntensity *
            0.15 *
            (1 + Math.sin(time * 3 + angle * 2) * 0.5);
          r += r * spikeNoise;

          const vibration =
            Math.sin(time * 15 + angle * 20) * spikeIntensity * 0.02;
          r += r * vibration;
        }

        // Roughness from Bitterness
        if (roughness > 0.05) {
          const roughNoise =
            (Math.random() - 0.5) *
            roughness *
            0.08 *
            (1 + Math.sin(angle * 8 + time) * 0.5);
          r += r * roughNoise;
        }

        points.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
        });
      }

      // Outer glow layers (neon effect)
      if (glowIntensity > 0.05) {
        const glowLayers = 6;
        for (let g = glowLayers; g >= 1; g--) {
          const glowRadius = 1 + (g / glowLayers) * 0.5 * glowIntensity;
          const glowAlpha =
            ((glowLayers - g + 1) / glowLayers) * 0.2 * glowIntensity;

          ctx.beginPath();
          ctx.moveTo(
            centerX + (points[0].x - centerX) * glowRadius,
            centerY + (points[0].y - centerY) * glowRadius
          );

          for (let i = 1; i < points.length; i++) {
            const p0 = points[(i - 1 + points.length) % points.length];
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];

            const cp1x = p1.x - (p2.x - p0.x) * 0.15;
            const cp1y = p1.y - (p2.y - p0.y) * 0.15;

            ctx.quadraticCurveTo(
              centerX + (cp1x - centerX) * glowRadius,
              centerY + (cp1y - centerY) * glowRadius,
              centerX + (p1.x - centerX) * glowRadius,
              centerY + (p1.y - centerY) * glowRadius
            );
          }

          ctx.closePath();
          const glowColor = `hsla(${hue}, ${saturation * 100}%, ${lightness * 100 + 20}%, ${glowAlpha})`;
          ctx.fillStyle = glowColor;
          ctx.fill();
        }
      }

      // Main fluid gradient
      const gradient = ctx.createRadialGradient(
        centerX - currentRadius * 0.2,
        centerY - currentRadius * 0.2,
        0,
        centerX,
        centerY,
        currentRadius * 1.2
      );

      const coreLight = Math.min(lightness + 0.3 + glowIntensity * 0.2, 0.9);
      const coreSat = saturation;
      const midLight = lightness;
      const edgeLight = Math.max(lightness - 0.15, 0.1);

      gradient.addColorStop(
        0,
        `hsla(${hue}, ${coreSat * 100}%, ${coreLight * 100}%, 0.95)`
      );
      gradient.addColorStop(
        0.4,
        `hsla(${hue}, ${coreSat * 100}%, ${midLight * 100}%, 0.9)`
      );
      gradient.addColorStop(
        0.8,
        `hsla(${hue - 20}, ${coreSat * 80}%, ${edgeLight * 100}%, 0.85)`
      );
      gradient.addColorStop(
        1,
        `hsla(${hue - 40}, ${coreSat * 60}%, ${edgeLight * 80}%, 0.7)`
      );

      // Draw main shape
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i <= points.length; i++) {
        const p0 = points[(i - 1 + points.length) % points.length];
        const p1 = points[i % points.length];
        const p2 = points[(i + 1) % points.length];

        const cp1x = p1.x - (p2.x - p0.x) * 0.15;
        const cp1y = p1.y - (p2.y - p0.y) * 0.15;

        ctx.quadraticCurveTo(cp1x, cp1y, p1.x, p1.y);
      }

      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Neon edge glow
      ctx.strokeStyle = `hsla(${hue}, ${saturation * 100}%, ${lightness * 100 + 30}%, ${0.4 + glowIntensity * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Roughness texture overlay
      if (roughness > 0.1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i <= points.length; i++) {
          const p1 = points[i % points.length];
          ctx.lineTo(p1.x, p1.y);
        }
        ctx.closePath();
        ctx.clip();

        const textureGrain = 600;
        for (let i = 0; i < textureGrain * roughness; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * currentRadius * 1.1;
          const tx = centerX + Math.cos(angle) * dist;
          const ty = centerY + Math.sin(angle) * dist;
          const size = Math.random() * 2 + 0.5;

          ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.15 * roughness})`;
          ctx.beginPath();
          ctx.arc(tx, ty, size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Inner bloom
      if (glowIntensity > 0.1) {
        const innerGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          currentRadius * 0.6
        );
        innerGradient.addColorStop(
          0,
          `hsla(${hue + 20}, ${saturation * 100}%, ${Math.min(lightness * 100 + 40, 95)}%, ${glowIntensity * 0.5})`
        );
        innerGradient.addColorStop(
          0.5,
          `hsla(${hue}, ${saturation * 100}%, ${lightness * 100}%, ${glowIntensity * 0.2})`
        );
        innerGradient.addColorStop(1, "hsla(0, 0%, 0%, 0)");

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i <= points.length; i++) {
          const p1 = points[i % points.length];
          ctx.lineTo(p1.x, p1.y);
        }
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = innerGradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // Particles from Texture
      if (particleDensity > 0) {
        while (particlesRef.current.length < particleDensity) {
          const angle = Math.random() * Math.PI * 2;
          const dist = currentRadius * (0.9 + Math.random() * 0.3);
          particlesRef.current.push({
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * particleJitter,
            vy: (Math.random() - 0.5) * particleJitter - 0.5,
            life: 0,
            maxLife: 60 + Math.random() * 60,
            size: 1 + Math.random() * 3,
          });
        }

        while (particlesRef.current.length > particleDensity) {
          particlesRef.current.pop();
        }

        particlesRef.current = particlesRef.current.filter((p) => {
          p.x += p.vx + (Math.random() - 0.5) * particleJitter * 0.3;
          p.y += p.vy + (Math.random() - 0.5) * particleJitter * 0.3;
          p.life++;

          const lifeRatio = p.life / p.maxLife;
          const alpha = Math.sin(lifeRatio * Math.PI) * 0.8;

          if (alpha > 0.01) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue + (Math.random() - 0.5) * 30}, ${saturation * 100}%, ${lightness * 100 + 20}%, ${alpha})`;
            ctx.fill();

            // Particle glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2 * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, ${saturation * 100}%, ${lightness * 100 + 20}%, ${alpha * 0.2})`;
            ctx.fill();
          }

          return p.life < p.maxLife;
        });
      } else {
        particlesRef.current = [];
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [visualParams, vectors]);

  return (
    <motion.div
      ref={containerRef}
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
    </motion.div>
  );
}
