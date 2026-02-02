"use client";

import { useState, useEffect, useCallback } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import { fetchQuestions, buildExamQueue, recordAnswer, type Question } from "@/lib/questions";

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions().then(setQuestions).finally(() => setLoading(false));
  }, []);

  const current = queue[index];

  const startExam = useCallback(() => {
    const q = buildExamQueue(questions, count, preset);
    setQueue(q);
    setIndex(0);
    setStarted(true);
  }, [questions, count, preset]);

  const handleAnswer = useCallback(
    async (questionId: string, selectedIndex: number) => {
      const q = queue.find((x) => x.id === questionId);
      if (!q) return;
      recordAnswer(questionId, q.correctIndex, selectedIndex, "exam", q.session, q.topic);
    },
    [queue]
  );

  const handleNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, queue.length - 1));
  }, [queue.length]);

  if (loading && !started) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!started) {
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
        <button onClick={() => setStarted(false)} className="text-primary-600 mt-4">
          Back
        </button>
      </div>
    );

  if (!current)
    return (
      <div className="text-center py-12">
        <p className="text-xl mb-4">Exam complete!</p>
        <a href="/" className="text-primary-600">Home</a>
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-slate-500">{index + 1} / {queue.length} (Exam)</p>
      <QuestionCard
        key={current.id}
        id={current.id}
        prompt={current.prompt}
        choices={current.choices}
        correctIndex={current.correctIndex}
        explanation={current.explanation}
        session={current.session}
        topic={current.topic}
        onAnswer={handleAnswer}
        onNext={handleNext}
        showBookmark={false}
        mode="exam"
      />
    </div>
  );
}
