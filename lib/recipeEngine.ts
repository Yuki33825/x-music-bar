/**
 * x-Music Bar: 科学的根拠に基づくレシピ生成エンジン
 * 
 * 各素材はSABITベクトルで特性を定義:
 * - [S] Sweetness: 糖度800g/Lを1.0として正規化
 * - [A] Acidity: pH2.0を1.0として正規化
 * - [B] Bitterness: カンパリの苦味を1.0として正規化
 * - [I] Intensity: ABV 50%を1.0として正規化
 * - [T] Texture: 炭酸4.0volを1.0として正規化
 */

// 素材の型定義
export interface Ingredient {
  name: string;
  s: number; // Sweetness
  a: number; // Acidity
  b: number; // Bitterness
  i: number; // Intensity (Alcohol)
  t: number; // Texture (Carbonation)
}

// レシピアイテムの型定義
export interface RecipeItem {
  name: string;
  ml: string;
}

// レシピ結果の型定義
export interface RecipeResult {
  totalVolume: string;
  recipe: RecipeItem[];
}

// SABIT入力値の型定義
export interface SABITInput {
  s: number;
  a: number;
  b: number;
  i: number;
  t: number;
}

/**
 * 15素材のSABITベクトル定義
 * 各値の根拠はコメントに記載
 */
export const INGREDIENTS: Ingredient[] = [
  // === スピリッツ ===
  { name: "ジン (Tanqueray)",     s: 0.00, a: 0.00, b: 0.15, i: 0.95, t: 0.00 }, // ABV 47.3% / ボタニカル由来の軽い苦味
  { name: "ウォッカ",             s: 0.00, a: 0.00, b: 0.00, i: 0.80, t: 0.00 }, // ABV 40.0% / ニュートラルスピリッツ
  { name: "ウイスキー (Jameson)", s: 0.05, a: 0.00, b: 0.20, i: 0.80, t: 0.00 }, // ABV 40.0% / 樽由来の苦味と微かな甘み
  { name: "ホワイトラム",         s: 0.08, a: 0.00, b: 0.00, i: 0.80, t: 0.00 }, // ABV 40.0% / サトウキビ由来の甘み
  
  // === リキュール ===
  { name: "カンパリ",             s: 0.31, a: 0.00, b: 1.00, i: 0.50, t: 0.00 }, // 糖度 250g/L / キナ由来の苦味（基準値）/ ABV 25%
  { name: "チンザノロッソ",       s: 0.19, a: 0.15, b: 0.40, i: 0.30, t: 0.00 }, // 糖度 150g/L / ハーブの苦味 / ABV 15%
  { name: "カルーア",             s: 0.55, a: 0.05, b: 0.45, i: 0.40, t: 0.00 }, // 糖度 444g/L / コーヒーの苦味 / ABV 20%
  { name: "コアントロー",         s: 0.31, a: 0.10, b: 0.05, i: 0.80, t: 0.00 }, // 糖度 250g/L / オレンジピールの微かな苦味 / ABV 40%
  
  // === ジュース・シロップ ===
  { name: "レモンジュース",       s: 0.05, a: 0.95, b: 0.05, i: 0.00, t: 0.00 }, // pH 2.3 / 微かな苦味（白いワタ由来）
  { name: "ライムジュース",       s: 0.05, a: 1.00, b: 0.05, i: 0.00, t: 0.00 }, // pH 2.0（基準値）/ 微かな苦味
  { name: "シンプルシロップ",     s: 1.00, a: 0.00, b: 0.00, i: 0.00, t: 0.10 }, // 糖度 800g/L（基準値）/ シロップの粘度
  { name: "グレナディン",         s: 0.90, a: 0.20, b: 0.00, i: 0.00, t: 0.20 }, // 高糖度 / ザクロの酸味

  // === 炭酸飲料 ===
  { name: "トニックウォーター",   s: 0.12, a: 0.20, b: 0.45, i: 0.00, t: 0.80 }, // 糖度 90g/L / キニーネの苦味 / 炭酸 3.0vol
  { name: "ジンジャーエール",     s: 0.13, a: 0.20, b: 0.00, i: 0.00, t: 0.90 }, // 糖度 100g/L / 炭酸 3.5vol
  { name: "ソーダ (強炭酸)",      s: 0.00, a: 0.00, b: 0.00, i: 0.00, t: 1.00 }, // 炭酸 4.0vol（基準値）
];

/**
 * SABIT入力値からレシピを算出
 * 
 * アルゴリズム:
 * 1. 動的な合計容量: Texture(T)に連動し 60ml 〜 150ml で伸縮
 *    - T=0: 60ml（ショートカクテル）
 *    - T=1: 150ml（ロングカクテル）
 * 2. 各素材の適合度を内積で計算
 * 3. ソフトマックス関数で確率分布に変換
 * 4. 分布に基づいて容量を配分
 * 
 * @param input - SABIT値（各 0.0 - 1.0）
 * @returns レシピ結果
 */
export const calculateDynamicRecipe = (input: SABITInput): RecipeResult => {
  // 動的な合計容量: Texture(T)に連動し 60ml 〜 150ml で伸縮
  // V_total = 60 + 90 × T
  const totalVolume = 60 + (90 * input.t);

  // 各素材の適合度計算（内積）
  const scores = INGREDIENTS.map(ing => {
    const dotProduct = 
      (input.s * ing.s) + 
      (input.a * ing.a) + 
      (input.b * ing.b) + 
      (input.i * ing.i) + 
      (input.t * ing.t);
    return { name: ing.name, score: Math.max(0, dotProduct) };
  });

  // ソフトマックス関数による確率分布
  // sigma (温度パラメータ) = 12.0
  // 高いほど差が強調され、低いほど均一な分布になる
  const sigma = 12.0;
  const expScores = scores.map(s => Math.exp(s.score * sigma));
  const sumExpScores = expScores.reduce((acc, val) => acc + val, 0);

  // ml換算してフィルタリング
  const recipe = scores
    .map((s, i) => ({
      name: s.name,
      ml: (expScores[i] / sumExpScores) * totalVolume
    }))
    .filter(item => item.ml >= 1.0) // 1ml未満の微量は無視
    .sort((a, b) => b.ml - a.ml);   // 分量の多い順にソート

  return {
    totalVolume: totalVolume.toFixed(1),
    recipe: recipe.map(r => ({ ...r, ml: r.ml.toFixed(1) }))
  };
};

/**
 * VectorValues形式からSABITInput形式に変換
 * @param vectors - 大文字キーのベクトル値 (0-100)
 * @returns 小文字キーの正規化されたベクトル値 (0-1)
 */
export const vectorsToSABIT = (vectors: { S: number; A: number; B: number; I: number; T: number }): SABITInput => {
  return {
    s: vectors.S / 100,
    a: vectors.A / 100,
    b: vectors.B / 100,
    i: vectors.I / 100,
    t: vectors.T / 100,
  };
};
