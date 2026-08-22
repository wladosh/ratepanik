/**
 * XP / Level progression helpers.
 *
 * Formula (UX-spec):
 *   xp_to_next(level) = 100 + (level - 1) * 50
 *
 * Level 1→2: 100 XP
 * Level 2→3: 150 XP
 * Level 3→4: 200 XP
 * ...
 *
 * Total XP to reach level L (cumulative from level 1):
 *   sum_{k=1}^{L-1} (100 + (k-1)*50)
 *   = (L-1)*100 + 50 * sum_{k=0}^{L-2} k
 *   = (L-1)*100 + 50 * (L-2)(L-1)/2
 *   = (L-1) * (100 + 25*(L-2))
 *   = (L-1) * (50 + 25*L)
 *   = 25*(L-1)*(L+2)        for L >= 1
 */

/** XP required to go from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return 100 + (level - 1) * 50;
}

/** Total cumulative XP required to *reach* the given level (from level 1). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 25 * (level - 1) * (level + 2);
}

/** Determine which level a player is at given their total XP. */
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  // Solve 25*(L-1)*(L+2) <= xp for largest integer L
  // 25*(L-1)*(L+2) = 25*(L²+L-2) <= xp
  // L²+L-2 <= xp/25
  // L² + L - (2 + xp/25) <= 0
  // quadratic: L = (-1 + sqrt(1 + 4*(2 + xp/25))) / 2
  const n = xp / 25;
  const L = Math.floor((-1 + Math.sqrt(1 + 4 * (n + 2))) / 2);
  // Verify and clamp (numerical safety)
  if (xpForLevel(L + 1) <= xp) return L + 1;
  return Math.max(1, L);
}

export interface XpProgress {
  level: number;
  /** XP accumulated within the current level. */
  current: number;
  /** XP needed to reach the next level from current level start. */
  needed: number;
  /** Progress ratio 0..1 within current level. */
  ratio: number;
}

/** Full progress breakdown for a given total XP value. */
export function xpProgressInLevel(xp: number): XpProgress {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const current = xp - base;
  const needed = xpToNext(level);
  return {
    level,
    current,
    needed,
    ratio: needed > 0 ? current / needed : 0,
  };
}
