"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllQuestions, type Question } from "@/lib/questions";
import { useBookmarks } from "@/lib/useBookmarks";

const QUIZ_COUNTS = [10, 25, 50, "All"] as const;

export default function BookmarksPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState<(typeof QUIZ_COUNTS)[number]>(10);
  const { bookmarks, toggleBookmark } = useBookmarks();

  useEffect(() => {
    getAllQuestions().then(setQuestions).finally(() => setLoading(false));
  }, []);

  const bookmarkedQuestions = useMemo(
    () => questions.filter((q) => bookmarks.has(q.id)),
    [questions, bookmarks]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of bookmarkedQuestions) {
      if (!map.has(q.topic)) map.set(q.topic, []);
      map.get(q.topic)!.push(q);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [bookmarkedQuestions]);

  const handleStartQuiz = () => {
    if (!bookmarkedQuestions.length) return;
    const selectedCount = count === "All" ? bookmarkedQuestions.length : count;
    router.push(`/exam?bookmarks=1&count=${selectedCount}`);
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!bookmarkedQuestions.length)
    return (
      <div className="text-center py-12">
        <p>No bookmarks yet. Star questions during Learn or Exam.</p>
        <a href="/learn" className="text-primary-600 hover:underline mt-4 inline-block">
          Go to Learn
        </a>
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={count}
            onChange={(e) => {
              const value = e.target.value === "All" ? "All" : Number(e.target.value);
              setCount(value as (typeof QUIZ_COUNTS)[number]);
            }}
            className="border rounded px-3 py-2"
          >
            {QUIZ_COUNTS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <button
            onClick={handleStartQuiz}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Start Quiz from Bookmarks
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {grouped.map(([topic, list]) => (
          <details key={topic} className="bg-white rounded-lg shadow p-4">
            <summary className="cursor-pointer font-semibold text-slate-700">
              {topic} <span className="text-sm text-slate-500">({list.length})</span>
            </summary>
            <ul className="mt-3 space-y-3">
              {list.map((q) => (
                <li key={q.id} className="border rounded-lg p-3">
                  <p className="font-medium text-slate-800">{q.prompt}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="px-2 py-1 rounded bg-slate-100">{q.session}</span>
                    <span className="px-2 py-1 rounded bg-slate-100">{q.topic}</span>
                    {q.difficulty && (
                      <span className="px-2 py-1 rounded bg-slate-100">Difficulty {q.difficulty}</span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleBookmark(q.id)}
                    className="mt-3 text-sm text-slate-500 hover:text-slate-700"
                  >
                    Remove bookmark
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
