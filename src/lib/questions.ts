"use client";

import {
  updateProficiency,
  getNextDueOffsetMs,
  getInitialProficiency,
  isMastered,
} from "./spacedRepetition";
import { shuffle } from "./shuffle";
import { getProgress, setProgress, getBookmarks, addAttempt } from "./storage";

export interface Question {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  session: string;
  topic: string;
  difficulty?: number;
}

const INITIAL_PROFICIENCY = getInitialProficiency();

export async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch("/questions.json");
  if (!res.ok) throw new Error("Failed to load questions");
  const raw = await res.json();
  return raw.map((q: { choices?: string[] | string }) => ({
    ...q,
    choices: Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices || "[]"),
  }));
}

export async function fetchResources(): Promise<{ id: string; title: string; url: string; category: string }[]> {
  const res = await fetch("/resources.json");
  if (!res.ok) throw new Error("Failed to load resources");
  return res.json();
}

function getOrCreateProgress(questionId: string) {
  const progress = getProgress();
  let entry = progress[questionId];
  if (!entry) {
    entry = {
      proficiency: INITIAL_PROFICIENCY,
      correctCount: 0,
      incorrectCount: 0,
      lastAnsweredAt: null,
      nextDueAt: new Date(Date.now() + getNextDueOffsetMs(INITIAL_PROFICIENCY)).toISOString(),
    };
    progress[questionId] = entry;
  }
  return { progress, entry };
}

export function recordAnswer(
  questionId: string,
  correctIndex: number,
  selectedIndex: number,
  mode: string,
  session: string,
  topic: string
): { wasCorrect: boolean } {
  const wasCorrect = selectedIndex === correctIndex;
  const { progress, entry } = getOrCreateProgress(questionId);

  const newProficiency = updateProficiency(entry.proficiency, wasCorrect);
  const nextDueAt = new Date(Date.now() + getNextDueOffsetMs(newProficiency)).toISOString();

  progress[questionId] = {
    proficiency: newProficiency,
    correctCount: entry.correctCount + (wasCorrect ? 1 : 0),
    incorrectCount: entry.incorrectCount + (wasCorrect ? 0 : 1),
    lastAnsweredAt: new Date().toISOString(),
    nextDueAt,
  };
  setProgress(progress);

  addAttempt({ questionId, topic, session, wasCorrect });
  return { wasCorrect };
}

export function buildLearnQueue(questions: Question[], doShuffle: boolean): Question[] {
  const progressMap = getProgress();
  const now = new Date();

  const withProgress = questions.map((q) => {
    const p = progressMap[q.id];
    const proficiency = p?.proficiency ?? INITIAL_PROFICIENCY;
    const nextDueAt = p?.nextDueAt ? new Date(p.nextDueAt) : null;
    const isDue = !nextDueAt || nextDueAt <= now;
    return { q, proficiency, isDue };
  });

  const due = withProgress.filter((x) => x.isDue).map((x) => x.q);
  const notDue = withProgress.filter((x) => !x.isDue).map((x) => x.q);
  notDue.sort((a, b) => {
    const ap = withProgress.find((x) => x.q.id === a.id)!.proficiency;
    const bp = withProgress.find((x) => x.q.id === b.id)!.proficiency;
    return ap - bp;
  });

  let queue = due.length > 0 ? due : notDue.slice(0, 50);
  if (doShuffle) queue = shuffle(queue);
  return queue;
}

export function buildWeakAreasQueue(questions: Question[], doShuffle: boolean): Question[] {
  const progressMap = getProgress();
  const topicAcc = new Map<string, { correct: number; incorrect: number; questions: Question[] }>();

  for (const q of questions) {
    const p = progressMap[q.id];
    const correct = p?.correctCount ?? 0;
    const incorrect = p?.incorrectCount ?? 0;
    if (correct + incorrect === 0) continue;
    const t = q.topic;
    if (!topicAcc.has(t)) topicAcc.set(t, { correct: 0, incorrect: 0, questions: [] });
    const acc = topicAcc.get(t)!;
    acc.correct += correct;
    acc.incorrect += incorrect;
    acc.questions.push(q);
  }

  const weakTopics = Array.from(topicAcc.entries())
    .map(([topic, data]) => ({
      topic,
      accuracy: data.correct + data.incorrect > 0 ? data.correct / (data.correct + data.incorrect) : 1,
      questions: data.questions,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakest3 = weakTopics.slice(0, 3);
  const weakIds = new Set(weakest3.flatMap((t) => t.questions.map((q) => q.id)));
  const weakQs = weakest3.flatMap((t) => t.questions);
  const otherQs = questions.filter((q) => !weakIds.has(q.id));

  const weakCount = Math.ceil(weakQs.length * 0.7) || weakQs.length;
  const otherCount = Math.min(Math.ceil(weakQs.length * 0.3) || 10, otherQs.length);
  let combined = [...shuffle(weakQs).slice(0, weakCount), ...shuffle(otherQs).slice(0, otherCount)];
  if (combined.length === 0) combined = shuffle(questions).slice(0, 50);
  if (doShuffle) combined = shuffle(combined);
  return combined;
}

export function buildReviewQueue(questions: Question[], doShuffle: boolean): Question[] {
  const progressMap = getProgress();
  const wrong = questions
    .filter((q) => (progressMap[q.id]?.incorrectCount ?? 0) > 0)
    .sort((a, b) => (progressMap[b.id]?.incorrectCount ?? 0) - (progressMap[a.id]?.incorrectCount ?? 0));
  return doShuffle ? shuffle(wrong) : wrong;
}

export function buildBookmarksQueue(questions: Question[], doShuffle: boolean): Question[] {
  const ids = getBookmarks();
  const byId = new Map(questions.map((q) => [q.id, q]));
  const list = ids.map((id) => byId.get(id)).filter(Boolean) as Question[];
  return doShuffle ? shuffle(list) : list;
}

export function buildExamQueue(
  questions: Question[],
  count: number,
  preset: string
): Question[] {
  let filtered: Question[];
  if (preset === "Weak Areas Only") {
    const progressMap = getProgress();
    const withWrong = questions.filter((q) => (progressMap[q.id]?.incorrectCount ?? 0) > 0);
    filtered = withWrong.length > 0 ? withWrong : questions;
  } else if (preset.startsWith("Session ")) {
    const session = preset.replace(" Only", "");
    filtered = questions.filter((q) => q.session === session);
  } else {
    filtered = questions;
  }
  const shuffled = shuffle(filtered);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function buildTopicsQueue(
  questions: Question[],
  session: string,
  topic: string,
  difficulty: string,
  search: string,
  doShuffle: boolean
): Question[] {
  let filtered = questions;
  if (session) filtered = filtered.filter((q) => q.session === session);
  if (topic) filtered = filtered.filter((q) => q.topic === topic);
  if (difficulty) {
    const d = parseInt(difficulty, 10);
    if (!isNaN(d)) filtered = filtered.filter((q) => (q.difficulty ?? 1) === d);
  }
  if (search.trim()) {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter((q) => q.prompt.toLowerCase().includes(s));
  }
  return doShuffle ? shuffle(filtered) : filtered;
}

export function computeStats(questions: Question[]) {
  const progressMap = getProgress();
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let masteredCount = 0;

  const topicMap = new Map<string, { correct: number; total: number }>();
  for (const q of questions) {
    const p = progressMap[q.id];
    if (!p) continue;
    totalCorrect += p.correctCount;
    totalIncorrect += p.incorrectCount;
    if (isMastered(p.proficiency)) masteredCount++;

    const t = q.topic;
    const acc = topicMap.get(t) ?? { correct: 0, total: 0 };
    acc.correct += p.correctCount;
    acc.total += p.correctCount + p.incorrectCount;
    topicMap.set(t, acc);
  }

  const totalAttempts = totalCorrect + totalIncorrect;
  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
  const topicStats = Array.from(topicMap.entries()).map(([topic, data]) => ({
    topic,
    accuracy: data.total > 0 ? data.correct / data.total : 0,
    total: data.total,
  }));
  const weakTopics = topicStats
    .filter((t) => t.total >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  return {
    totalQuestions: questions.length,
    masteredCount,
    accuracy: Math.round(accuracy * 100) / 100,
    totalAttempts,
    weakTopics,
  };
}
