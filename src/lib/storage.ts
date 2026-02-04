"use client";

/**
 * Share Mode: all progress stored in localStorage.
 * Keys: b2b_progress_v1, b2b_bookmarks_v1, b2b_attempts_v1
 */

const PROGRESS_KEY = "b2b_progress_v1";
const BOOKMARKS_KEY = "b2b_bookmarks_v1";
const ATTEMPTS_KEY = "b2b_attempts_v1";
const FLAGGED_KEY = "b2b_flagged_v1";

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

export interface FlaggedQuestionEntry {
  questionId: string;
  reason: string;
  at?: string;
  createdAt?: string;
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

export function getFlaggedQuestions(): FlaggedQuestionEntry[] {
  return safeJsonParse<FlaggedQuestionEntry[]>(FLAGGED_KEY, []);
}

export function flagQuestion(questionId: string, reason: string): void {
  const flagged = getFlaggedQuestions();
  const existing = flagged.find((entry) => entry.questionId === questionId);
  const timestamp = new Date().toISOString();
  if (existing) {
    existing.reason = reason;
    existing.at = timestamp;
    existing.createdAt = existing.createdAt ?? timestamp;
  } else {
    flagged.push({ questionId, reason, at: timestamp, createdAt: timestamp });
  }
  safeJsonSet(FLAGGED_KEY, flagged);
}

export function flagConfusingQuestion(questionId: string): void {
  const flagged = getFlaggedQuestions();
  const existing = flagged.find((entry) => entry.questionId === questionId);
  const timestamp = new Date().toISOString();
  if (existing) {
    existing.reason = "confusing";
    existing.createdAt = existing.createdAt ?? timestamp;
    existing.at = timestamp;
  } else {
    flagged.push({ questionId, reason: "confusing", createdAt: timestamp });
  }
  safeJsonSet(FLAGGED_KEY, flagged);
}

export function clearFlaggedQuestions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FLAGGED_KEY);
}
