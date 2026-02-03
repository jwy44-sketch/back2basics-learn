"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import {
  fetchQuestions,
  buildTopicsQueue,
  recordAnswer,
  type Question,
} from "@/lib/questions";
import { presentQuestion } from "@/lib/presentedQuestion";
import { toggleBookmark, getBookmarks } from "@/lib/storage";

const SESSIONS = ["Session 1", "Session 2", "Session 3", "Session 4"];
const TOPICS = [
  "Skills and Roles", "Communication", "Standards of Conduct", "Team Dynamics",
  "Contract Principles", "Plan Solicitation", "Request Offers", "Price/Cost Analysis",
  "Negotiation", "Source Selection", "Disagreements", "Administer Contract",
  "Manage Changes", "Ensure Quality", "Subcontracts", "Closeout",
];

export default function TopicsPage() {
  const [session, setSession] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [shuffle] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("alwaysShuffle") !== "false";
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [searched, setSearched] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions().then(setQuestions).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setBookmarked(new Set(getBookmarks()));
  }, []);

  const presentedQueue = useMemo(
    () => queue.map((q) => presentQuestion(q, { shuffleChoices: shuffle })),
    [queue, shuffle]
  );
  const current = presentedQueue[index];

  const doSearch = useCallback(() => {
    const q = buildTopicsQueue(questions, session, topic, difficulty, search, shuffle);
    setQueue(q);
    setIndex(0);
    setSearched(true);
  }, [questions, session, topic, difficulty, search, shuffle]);

  const handleAnswer = useCallback(
    async (questionId: string, selectedIndex: number) => {
      const q = presentedQueue.find((x) => x.id === questionId);
      if (!q) return;
      recordAnswer(questionId, q.presentedCorrectIndex, selectedIndex, "topic", q.session, q.topic);
    },
    [presentedQueue]
  );

  const handleNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, queue.length - 1));
  }, [queue.length]);

  const handleBookmark = useCallback((questionId: string) => {
    const isNow = toggleBookmark(questionId);
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (isNow) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Topics</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Session</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All</option>
            {SESSIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Topic</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Difficulty (1-5)</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">All</option>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Search prompt</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={doSearch}
          disabled={loading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          Search
        </button>
      </div>

      {searched && (
        <>
          {loading ? (
            <div>Loading...</div>
          ) : !queue.length ? (
            <div>No questions found.</div>
          ) : !current ? (
            <div className="text-center py-12">
              <p>Done!</p>
              <button onClick={() => { setSearched(false); setQueue([]); }}>
                New Search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-500">{index + 1} / {queue.length}</p>
              <QuestionCard
                key={current.id}
                question={current}
                onAnswer={handleAnswer}
                onNext={handleNext}
                onBookmark={handleBookmark}
                isBookmarked={bookmarked.has(current.id)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
