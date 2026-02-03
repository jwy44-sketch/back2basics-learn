"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import { fetchQuestions, buildExamQueue, recordAnswer, type Question } from "@/lib/questions";
import { checkAnswer, presentQuestion } from "@/lib/presentedQuestion";

const PRESETS = [
  "All Sessions Mixed",
  "Session 1 Only",
  "Session 2 Only",
  "Session 3 Only",
  "Session 4 Only",
  "Weak Areas Only",
];
const COUNTS = [10, 25, 50];

export default function ExamPage() {
  const [count, setCount] = useState(25);
  const [preset, setPreset] = useState("All Sessions Mixed");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [shuffleChoices] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("alwaysShuffle") !== "false";
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"setup" | "exam" | "review" | "results">("setup");
  const [attempts, setAttempts] = useState<
    { questionId: string; topic: string; session: string; wasCorrect: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions().then(setQuestions).finally(() => setLoading(false));
  }, []);

  const presentedQueue = useMemo(
    () => queue.map((q) => presentQuestion(q, { shuffleChoices })),
    [queue, shuffleChoices]
  );
  const current = (phase === "exam" || phase === "review") ? presentedQueue[index] : undefined;

  const startExam = useCallback(() => {
    const q = buildExamQueue(questions, count, preset);
    setQueue(q);
    setIndex(0);
    setAttempts([]);
    setPhase("exam");
  }, [questions, count, preset]);

  const handleAnswer = useCallback(
    async (questionId: string, selectedIndex: number) => {
      const q = presentedQueue.find((x) => x.id === questionId);
      if (!q) return;
      const wasCorrect = checkAnswer(q, selectedIndex);
      recordAnswer(questionId, q.presentedCorrectIndex, selectedIndex, phase === "review" ? "exam-review" : "exam", q.session, q.topic);
      setAttempts((prev) => {
        if (prev.some((entry) => entry.questionId === questionId)) return prev;
        return [...prev, { questionId, topic: q.topic, session: q.session, wasCorrect }];
      });
    },
    [presentedQueue, phase]
  );

  const handleNext = useCallback(() => {
    setIndex((i) => {
      const nextIndex = i + 1;
      if (nextIndex >= queue.length) {
        setPhase("results");
        return i;
      }
      return nextIndex;
    });
  }, [queue.length]);

  if (loading && phase === "setup") {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (phase === "setup") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Exam Sprint</h1>
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Question count</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            >
              {COUNTS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {PRESETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="timer"
              checked={timerEnabled}
              onChange={(e) => setTimerEnabled(e.target.checked)}
            />
            <label htmlFor="timer">Enable timer (optional)</label>
          </div>
          <button
            onClick={startExam}
            disabled={!questions.length}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  if (!queue.length)
    return (
      <div className="text-center py-12">
        <p>No questions available for this preset.</p>
        <button onClick={() => setPhase("setup")} className="text-primary-600 mt-4">
          Back
        </button>
      </div>
    );

  if (phase === "results") {
    const total = attempts.length;
    const correct = attempts.filter((a) => a.wasCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const missedIds = new Set(attempts.filter((a) => !a.wasCorrect).map((a) => a.questionId));
    const missedQuestions = queue.filter((q) => missedIds.has(q.id));

    const buildBreakdown = (key: "topic" | "session") => {
      const map = new Map<string, { correct: number; total: number }>();
      for (const attempt of attempts) {
        const label = attempt[key];
        const entry = map.get(label) ?? { correct: 0, total: 0 };
        entry.total += 1;
        if (attempt.wasCorrect) entry.correct += 1;
        map.set(label, entry);
      }
      return Array.from(map.entries())
        .map(([label, data]) => ({
          label,
          correct: data.correct,
          total: data.total,
          accuracy: data.total ? Math.round((data.correct / data.total) * 100) : 0,
        }))
        .sort((a, b) => a.accuracy - b.accuracy);
    };

    const topicBreakdown = buildBreakdown("topic");
    const sessionBreakdown = buildBreakdown("session");
    const weakTopics = topicBreakdown.filter((t) => t.total >= 2).slice(0, 3);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold">Exam complete!</p>
          <p className="text-slate-600">
            Score: {correct} / {total} ({accuracy}%)
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow p-4 space-y-2">
            <p className="font-semibold">Breakdown by topic</p>
            <ul className="text-sm text-slate-600 space-y-1">
              {topicBreakdown.map((entry) => (
                <li key={entry.label} className="flex justify-between">
                  <span>{entry.label}</span>
                  <span>{entry.correct}/{entry.total} ({entry.accuracy}%)</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow p-4 space-y-2">
            <p className="font-semibold">Breakdown by session</p>
            <ul className="text-sm text-slate-600 space-y-1">
              {sessionBreakdown.map((entry) => (
                <li key={entry.label} className="flex justify-between">
                  <span>{entry.label}</span>
                  <span>{entry.correct}/{entry.total} ({entry.accuracy}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <p className="font-semibold">Weak topics detected</p>
          {weakTopics.length ? (
            <ul className="text-sm text-slate-600 space-y-1">
              {weakTopics.map((entry) => (
                <li key={entry.label}>{entry.label} ({entry.accuracy}%)</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No weak topics detected from this exam.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setPhase("setup")}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          >
            New Exam
          </button>
          <button
            onClick={() => {
              if (!missedQuestions.length) return;
              setQueue(missedQuestions);
              setIndex(0);
              setPhase("review");
            }}
            disabled={!missedQuestions.length}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Review missed questions ({missedQuestions.length})
          </button>
          <a href="/" className="px-4 py-2 text-primary-600 hover:underline">
            Home
          </a>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="text-center py-12">
        <p className="text-xl mb-4">Review complete!</p>
        <button onClick={() => setPhase("results")} className="text-primary-600">
          Back to results
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-500">
        {index + 1} / {queue.length} ({phase === "review" ? "Exam Review" : "Exam"})
      </p>
      <QuestionCard
        key={current.id}
        question={current}
        onAnswer={handleAnswer}
        onNext={handleNext}
        showBookmark={false}
        mode={phase === "review" ? "exam-review" : "exam"}
      />
    </div>
  );
}
