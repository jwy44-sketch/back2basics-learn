"use client";

import { useMemo, useState, useEffect } from "react";
import { getAllQuestions, type Question } from "@/lib/questions";
import { getAttempts } from "@/lib/storage";
import { useBookmarks } from "@/lib/useBookmarks";

const PAGE_SIZE = 25;
const SESSIONS = ["Session 1", "Session 2", "Session 3", "Session 4"];

type SortOption = "default" | "difficulty" | "missed" | "bookmarked";

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionFilter, setSessionFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("All Topics");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("default");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAnswer, setShowAnswer] = useState<Set<string>>(new Set());
  const [showExplanation, setShowExplanation] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const { bookmarks, toggleBookmark } = useBookmarks();

  useEffect(() => {
    getAllQuestions().then(setQuestions).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const attemptsByQuestion = useMemo(() => {
    const attempts = getAttempts();
    const map = new Map<string, { incorrect: number; total: number }>();
    for (const attempt of attempts) {
      const entry = map.get(attempt.questionId) ?? { incorrect: 0, total: 0 };
      entry.total += 1;
      if (!attempt.wasCorrect) entry.incorrect += 1;
      map.set(attempt.questionId, entry);
    }
    return map;
  }, []);

  const sessionFiltered = useMemo(() => {
    if (!sessionFilter) return questions;
    return questions.filter((q) => q.session === sessionFilter);
  }, [questions, sessionFilter]);

  const topics = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of sessionFiltered) {
      map.set(q.topic, (map.get(q.topic) ?? 0) + 1);
    }
    return ["All Topics", ...Array.from(map.keys()).sort()].map((topic) => ({
      topic,
      count: topic === "All Topics" ? sessionFiltered.length : map.get(topic) ?? 0,
    }));
  }, [sessionFiltered]);

  const filtered = useMemo(() => {
    let list = sessionFiltered;
    if (topicFilter !== "All Topics") {
      list = list.filter((q) => q.topic === topicFilter);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((q) => q.prompt.toLowerCase().includes(term));
    }
    if (sort === "difficulty") {
      list = [...list].sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));
    } else if (sort === "missed") {
      list = [...list].sort((a, b) => {
        const aMissed = attemptsByQuestion.get(a.id)?.incorrect ?? 0;
        const bMissed = attemptsByQuestion.get(b.id)?.incorrect ?? 0;
        return bMissed - aMissed;
      });
    } else if (sort === "bookmarked") {
      list = [...list].sort((a, b) => {
        const aMarked = bookmarks.has(a.id) ? 1 : 0;
        const bMarked = bookmarks.has(b.id) ? 1 : 0;
        return bMarked - aMarked;
      });
    }
    return list;
  }, [attemptsByQuestion, bookmarks, search, sessionFiltered, sort, topicFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const toggleSetItem = (
    setter: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void,
    id: string
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      <aside className="space-y-4">
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="font-semibold text-slate-700">Topics</h2>
          <div className="space-y-1 max-h-[60vh] overflow-auto pr-1">
            {topics.map((item) => (
              <button
                key={item.topic}
                onClick={() => {
                  setTopicFilter(item.topic);
                  setPage(1);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  topicFilter === item.topic ? "bg-primary-100 text-primary-700" : "hover:bg-slate-100"
                }`}
              >
                <span className="flex justify-between">
                  <span>{item.topic}</span>
                  <span className="text-slate-400">{item.count}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <label className="text-sm font-semibold text-slate-600">Session</label>
          <select
            value={sessionFilter}
            onChange={(e) => {
              setSessionFilter(e.target.value);
              setTopicFilter("All Topics");
              setPage(1);
            }}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All Sessions</option>
            {SESSIONS.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg shadow p-4">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search prompt text..."
            className="flex-1 border rounded px-3 py-2 min-w-[220px]"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="border rounded px-3 py-2"
          >
            <option value="default">Default</option>
            <option value="difficulty">Difficulty (low→high)</option>
            <option value="missed">Most missed</option>
            <option value="bookmarked">Bookmarked first</option>
          </select>
          <div className="text-sm text-slate-500">
            {filtered.length} questions
          </div>
        </div>

        <div className="space-y-4">
          {paged.map((q) => (
            <div key={q.id} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-800">{q.prompt}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="px-2 py-1 rounded bg-slate-100">{q.topic}</span>
                    <span className="px-2 py-1 rounded bg-slate-100">{q.session}</span>
                    {q.difficulty && (
                      <span className="px-2 py-1 rounded bg-slate-100">Difficulty {q.difficulty}</span>
                    )}
                    {q.tags?.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded bg-slate-100">{tag}</span>
                    ))}
                    {q.farRefs?.map((ref) => (
                      <span key={ref} className="px-2 py-1 rounded bg-slate-100">{ref}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    toggleBookmark(q.id);
                    setToast(bookmarks.has(q.id) ? "Removed bookmark" : "Bookmarked");
                  }}
                  className="text-2xl hover:scale-110 transition"
                  aria-label={bookmarks.has(q.id) ? "Remove bookmark" : "Add bookmark"}
                >
                  {bookmarks.has(q.id) ? "⭐" : "☆"}
                </button>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  onClick={() => toggleSetItem(setExpanded, q.id)}
                  className="text-primary-600 hover:underline"
                >
                  {expanded.has(q.id) ? "Hide Details" : "View Details"}
                </button>
                <button
                  onClick={() => toggleSetItem(setShowAnswer, q.id)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  {showAnswer.has(q.id) ? "Hide answer" : "Show answer"}
                </button>
                <button
                  onClick={() => toggleSetItem(setShowExplanation, q.id)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  {showExplanation.has(q.id) ? "Hide explanation" : "Show explanation"}
                </button>
              </div>

              {expanded.has(q.id) && (
                <div className="border-t pt-3 space-y-2 text-sm text-slate-600">
                  {q.choices.map((choice, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded border ${
                        showAnswer.has(q.id) && idx === q.correctIndex
                          ? "border-green-500 bg-green-50"
                          : "border-slate-200"
                      }`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                      {choice}
                    </div>
                  ))}
                  {showAnswer.has(q.id) && (
                    <p className="text-sm text-slate-700">
                      Correct answer: {q.choices[q.correctIndex]}
                    </p>
                  )}
                  {showExplanation.has(q.id) && (
                    <p className="text-sm text-slate-700">{q.explanation}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded border border-slate-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded border border-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2 rounded-lg shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
