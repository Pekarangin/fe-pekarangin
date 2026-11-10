export const CELL_AREA_M2 = 0.25;
export const TOTAL_CELLS = 64; // 8x8

/**
 * Generate grid cell indices centered radially around (3.5, 3.5)
 * for a given area in m².
 */
export function generateGridCellsForArea(areaM2: number): number[] {
  if (isNaN(areaM2) || areaM2 <= 0) return [];
  const neededCount = Math.max(1, Math.min(TOTAL_CELLS, Math.round(areaM2 / CELL_AREA_M2)));

  // All 64 cells sorted by Euclidean distance from grid center (3.5, 3.5)
  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => {
    const r = Math.floor(i / 8);
    const c = i % 8;
    const distSq = Math.pow(r - 3.5, 2) + Math.pow(c - 3.5, 2);
    return { index: i, dist: distSq, r, c };
  });

  cells.sort((a, b) => {
    if (Math.abs(a.dist - b.dist) > 0.0001) return a.dist - b.dist;
    if (a.r !== b.r) return a.r - b.r;
    return a.c - b.c;
  });

  return cells
    .slice(0, neededCount)
    .map(c => c.index)
    .sort((a, b) => a - b);
}
