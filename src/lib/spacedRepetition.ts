/**
 * Spaced repetition algorithm
 * proficiency: 0.0 - 1.0, start 0.20
 * correct: +0.15 (cap 1.0)
 * incorrect: -0.20 (floor 0.0)
 * mastered: >= 0.85
 */

const CORRECT_DELTA = 0.15;
const INCORRECT_DELTA = -0.2;
const INITIAL_PROFICIENCY = 0.2;
const MASTERED_THRESHOLD = 0.85;

export function getInitialProficiency(): number {
  return INITIAL_PROFICIENCY;
}

export function updateProficiency(
  current: number,
  wasCorrect: boolean
): number {
  const delta = wasCorrect ? CORRECT_DELTA : INCORRECT_DELTA;
  const next = current + delta;
  return Math.max(0, Math.min(1, next));
}

export function isMastered(proficiency: number): boolean {
  return proficiency >= MASTERED_THRESHOLD;
}

/**
 * Calculate next due date based on proficiency
 * <0.25 => +10m
 * <0.40 => +1h
 * <0.55 => +4h
 * <0.70 => +1d
 * <0.85 => +3d
 * >=0.85 => +7d
 */
export function getNextDueOffsetMs(proficiency: number): number {
  if (proficiency < 0.25) return 10 * 60 * 1000; // 10 min
  if (proficiency < 0.4) return 60 * 60 * 1000; // 1 hour
  if (proficiency < 0.55) return 4 * 60 * 60 * 1000; // 4 hours
  if (proficiency < 0.7) return 24 * 60 * 60 * 1000; // 1 day
  if (proficiency < 0.85) return 3 * 24 * 60 * 60 * 1000; // 3 days
  return 7 * 24 * 60 * 60 * 1000; // 7 days
}
