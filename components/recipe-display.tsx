"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VectorValues {
  S: number;
  A: number;
  B: number;
  I: number;
  T: number;
}

interface RecipeDisplayProps {
  vectors: VectorValues;
}

const BASE_CAPACITY = 45;

interface Ingredient {
  name: string;
  shortName: string;
  category: "base" | "modifier" | "accent";
  baseAmount: number;
  vectorInfluence: Partial<Record<keyof VectorValues, number>>;
  unit: string;
}

const INGREDIENTS: Ingredient[] = [
  {
    name: "London Dry Gin",
    shortName: "Gin",
    category: "base",
    baseAmount: 30,
    vectorInfluence: { A: 0.3, T: 0.2, I: 0.2 },
    unit: "ml",
  },
  {
    name: "Bourbon Whiskey",
    shortName: "Bourbon",
    category: "base",
    baseAmount: 15,
    vectorInfluence: { S: 0.3, B: 0.2, I: 0.3 },
    unit: "ml",
  },
  {
    name: "Monin Syrup",
    shortName: "Syrup",
    category: "modifier",
    baseAmount: 15,
    vectorInfluence: { S: 0.8, T: 0.1 },
    unit: "ml",
  },
  {
    name: "Fresh Lemon",
    shortName: "Lemon",
    category: "modifier",
    baseAmount: 20,
    vectorInfluence: { A: 0.7, T: 0.2 },
    unit: "ml",
  },
  {
    name: "Aromatic Bitters",
    shortName: "Bitters",
    category: "accent",
    baseAmount: 2,
    vectorInfluence: { B: 0.6, I: 0.3 },
    unit: "dsh",
  },
  {
    name: "Soda Water",
    shortName: "Soda",
    category: "accent",
    baseAmount: 30,
    vectorInfluence: { T: 0.5, A: 0.1 },
    unit: "ml",
  },
];

function calculateRecipe(vectors: VectorValues) {
  const { I, B, T } = vectors;
  const recipe: Array<{
    name: string;
    shortName: string;
    amount: number;
    unit: string;
    category: string;
  }> = [];

  // Calculate base spirit total based on Intensity
  const baseMultiplier = I; // I controls how much base spirit
  const maxBaseTotal = BASE_CAPACITY * baseMultiplier;

  // Calculate Gin and Bourbon ratio based on B and T
  // Higher B = more Bourbon, Higher T = more Gin (for texture)
  const bourbonRatio = B > 0 || T > 0 ? B / (B + T + 0.001) : 0.33;
  const ginRatio = 1 - bourbonRatio;

  for (const ingredient of INGREDIENTS) {
    let influence = 0;
    let hasActiveVector = false;

    for (const [vecKey, weight] of Object.entries(ingredient.vectorInfluence)) {
      const vecValue = vectors[vecKey as keyof VectorValues];
      if (vecValue > 0) {
        influence += vecValue * (weight as number);
        hasActiveVector = true;
      }
    }

    // If no active vector influences this ingredient, skip it
    if (!hasActiveVector && Object.keys(ingredient.vectorInfluence).length > 0) {
      continue;
    }

    const normalizedInfluence = Math.min(influence / 0.8, 1);
    let amount = 0;

    if (ingredient.category === "base") {
      // Base spirits are controlled by I and distributed by B/T ratio
      if (ingredient.shortName === "Gin") {
        amount = maxBaseTotal * ginRatio;
      } else if (ingredient.shortName === "Bourbon") {
        amount = maxBaseTotal * bourbonRatio;
      }
    } else {
      amount = ingredient.baseAmount * normalizedInfluence;
    }

    if (amount > 0.1) {
      recipe.push({
        name: ingredient.name,
        shortName: ingredient.shortName,
        amount: Math.round(amount * 10) / 10,
        unit: ingredient.unit,
        category: ingredient.category,
      });
    }
  }

  return recipe;
}

function calculateMetrics(
  vectors: VectorValues,
  recipe: Array<{ amount: number; unit: string; category: string }>
) {
  const { S, A, B } = vectors;

  // pH calculation (2.3 - 7.0)
  const basePH = 4.5;
  const pH = Math.max(2.3, Math.min(7.0, basePH - A * 2.2 + S * 0.5 - B * 0.3));

  // Brix calculation (0 - 65%)
  const brix = Math.max(0, Math.min(65, S * 50 + 5));

  // ABV calculation (0 - 40%)
  const totalVolume = recipe.reduce((sum, item) => {
    if (item.unit === "ml") return sum + item.amount;
    return sum;
  }, 0);

  const spiritVolume = recipe
    .filter((item) => item.category === "base")
    .reduce((sum, item) => sum + item.amount, 0);

  const abv = totalVolume > 0 ? Math.min(40, (spiritVolume / totalVolume) * 40) : 0;

  return {
    pH: Math.round(pH * 100) / 100,
    brix: Math.round(brix * 10) / 10,
    abv: Math.round(abv * 10) / 10,
  };
}

export function RecipeDisplay({ vectors }: RecipeDisplayProps) {
  const recipe = useMemo(() => calculateRecipe(vectors), [vectors]);
  const metrics = useMemo(() => calculateMetrics(vectors, recipe), [vectors, recipe]);

  const hasActiveVectors = Object.values(vectors).some((v) => v > 0);

  const totalBase = recipe
    .filter((item) => item.category === "base")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
          Recipe
        </h3>
        <span className="font-mono text-[9px] tabular-nums text-muted-foreground/40">
          {totalBase.toFixed(1)}/{BASE_CAPACITY}ml
        </span>
      </div>

      {/* Recipe List */}
      <div className="flex-1 space-y-1 overflow-auto min-h-0">
        <AnimatePresence mode="popLayout">
          {hasActiveVectors ? (
            recipe.slice(0, 4).map((item, index) => (
              <motion.div
                key={item.shortName}
                className="flex items-center justify-between text-[10px]"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                transition={{ delay: index * 0.02 }}
              >
                <span className="font-mono text-foreground/70 truncate">
                  {item.shortName}
                </span>
                <span className="font-mono tabular-nums text-foreground">
                  {item.amount}
                  <span className="text-muted-foreground/50 ml-0.5 text-[9px]">
                    {item.unit}
                  </span>
                </span>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-2">
              <span className="font-mono text-[9px] text-muted-foreground/40">
                --
              </span>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/20">
        <div className="text-center">
          <span className="font-mono text-[8px] uppercase text-muted-foreground/50 block">
            pH
          </span>
          <span
            className="font-mono text-[11px] tabular-nums"
            style={{
              color: hasActiveVectors ? "oklch(0.70 0.16 100)" : "oklch(0.35 0.02 260)",
            }}
          >
            {hasActiveVectors ? metrics.pH.toFixed(1) : "--"}
          </span>
        </div>
        <div className="text-center">
          <span className="font-mono text-[8px] uppercase text-muted-foreground/50 block">
            Brix
          </span>
          <span
            className="font-mono text-[11px] tabular-nums"
            style={{
              color: hasActiveVectors ? "oklch(0.75 0.18 30)" : "oklch(0.35 0.02 260)",
            }}
          >
            {hasActiveVectors ? `${metrics.brix.toFixed(0)}°` : "--"}
          </span>
        </div>
        <div className="text-center">
          <span className="font-mono text-[8px] uppercase text-muted-foreground/50 block">
            ABV
          </span>
          <span
            className="font-mono text-[11px] tabular-nums"
            style={{
              color: hasActiveVectors ? "oklch(0.65 0.20 25)" : "oklch(0.35 0.02 260)",
            }}
          >
            {hasActiveVectors ? `${metrics.abv.toFixed(0)}%` : "--"}
          </span>
        </div>
      </div>
    </div>
  );
}
