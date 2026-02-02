"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchQuestions, computeStats } from "@/lib/questions";

export default function HomePage() {
  const [stats, setStats] = useState<{
    totalQuestions: number;
    masteredCount: number;
    accuracy: number;
    totalAttempts: number;
    weakTopics?: { topic: string; accuracy: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions()
      .then((questions) => setStats(computeStats(questions)))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">
        Back2Basics Learn
      </h1>
      <p className="text-slate-600">
        Study FAR and contracting with adaptive spaced repetition. Continue learning, focus on weak areas, or take an exam sprint.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          href="/learn"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border-2 border-primary-200 hover:border-primary-400"
        >
          <h2 className="text-xl font-semibold text-primary-700 mb-2">
            Continue Learn
          </h2>
          <p className="text-slate-600">
            Study with adaptive spaced repetition. Due items first, then lowest proficiency.
          </p>
        </Link>

        <Link
          href="/learn?mode=weak"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border-2 border-amber-200 hover:border-amber-400"
        >
          <h2 className="text-xl font-semibold text-amber-800 mb-2">
            Focus Weak Areas
          </h2>
          <p className="text-slate-600">
            70% from weakest 3 topics, 30% from mixed pool. Target your gaps.
          </p>
        </Link>

        <Link
          href="/exam"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border-2 border-slate-200 hover:border-slate-400"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Exam Sprint
          </h2>
          <p className="text-slate-600">
            10 / 25 / 50 questions. Choose preset: All Sessions, Session Only, or Weak Areas.
          </p>
        </Link>

        <Link
          href="/review"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border-2 border-red-200 hover:border-red-400"
        >
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Wrong Answers
          </h2>
          <p className="text-slate-600">
            Review questions you&apos;ve missed. Shuffle available.
          </p>
        </Link>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading stats...</div>
      ) : stats ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-500 text-sm">Total Questions</p>
              <p className="text-2xl font-bold">{stats.totalQuestions}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Mastered</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.masteredCount}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Accuracy</p>
              <p className="text-2xl font-bold">
                {Math.round((stats.accuracy ?? 0) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Attempts</p>
              <p className="text-2xl font-bold">{stats.totalAttempts}</p>
            </div>
          </div>
          {stats.weakTopics && stats.weakTopics.length > 0 && (
            <div className="mt-4">
              <p className="text-slate-500 text-sm mb-2">Weak Topics</p>
              <ul className="list-disc list-inside">
                {stats.weakTopics.map((t) => (
                  <li key={t.topic}>
                    {t.topic}: {Math.round(t.accuracy * 100)}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
