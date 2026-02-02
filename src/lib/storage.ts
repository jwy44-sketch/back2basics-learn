"use client";

/**
 * Share Mode: all progress stored in localStorage.
 * Keys: b2b_progress_v1, b2b_bookmarks_v1, b2b_attempts_v1
 */

const PROGRESS_KEY = "b2b_progress_v1";
const BOOKMARKS_KEY = "b2b_bookmarks_v1";
const ATTEMPTS_KEY = "b2b_attempts_v1";

export interface ProgressEntry {
  proficiency: number;
  correctCount: number;
  incorrectCount: number;
  lastAnsweredAt: string | null;
  nextDueAt: string | null;
}

export interface AttemptEntry {
  questionId: string;
  topic: string;
  session: string;
  wasCorrect: boolean;
  at: string;
}

function safeJsonParse<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeJsonSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage set failed", e);
  }
}

export function getProgress(): Record<string, ProgressEntry> {
  return safeJsonParse<Record<string, ProgressEntry>>(PROGRESS_KEY, {});
}

export function setProgress(progress: Record<string, ProgressEntry>): void {
  safeJsonSet(PROGRESS_KEY, progress);
}

export function getBookmarks(): string[] {
  return safeJsonParse<string[]>(BOOKMARKS_KEY, []);
}

export function setBookmarks(ids: string[]): void {
  safeJsonSet(BOOKMARKS_KEY, ids);
}

export function toggleBookmark(questionId: string): boolean {
  const ids = getBookmarks();
  const idx = ids.indexOf(questionId);
  if (idx >= 0) {
    ids.splice(idx, 1);
    setBookmarks(ids);
    return false;
  } else {
    ids.push(questionId);
    setBookmarks(ids);
    return true;
  }
}

export function getAttempts(): AttemptEntry[] {
  return safeJsonParse<AttemptEntry[]>(ATTEMPTS_KEY, []);
}

export function addAttempt(entry: Omit<AttemptEntry, "at">): void {
  const attempts = getAttempts();
  attempts.push({ ...entry, at: new Date().toISOString() });
  // Keep last 2000 attempts to limit storage
  if (attempts.length > 2000) {
    attempts.splice(0, attempts.length - 2000);
  }
  safeJsonSet(ATTEMPTS_KEY, attempts);
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(BOOKMARKS_KEY);
  localStorage.removeItem(ATTEMPTS_KEY);
}
