"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { QuestionCard } from "@/components/QuestionCard";

interface Question {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  session: string;
  topic: string;
}

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
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [searched, setSearched] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  const params = new URLSearchParams();
  if (session) params.set("session", session);
  if (topic) params.set("topic", topic);
  if (difficulty) params.set("difficulty", difficulty);
  if (search.trim()) params.set("search", search.trim());
  params.set("shuffle", String(shuffle));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["topics", params.toString()],
    queryFn: () => fetch(`/api/topics?${params}`).then((r) => r.json()),
    enabled: searched,
  });

  useEffect(() => {
    if (data && Array.isArray(data)) setQueue(data);
  }, [data]);

  const current = queue[index];

  const doSearch = () => setSearched(true);

  const handleAnswer = useCallback(async (questionId: string, selectedIndex: number) => {
    await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId,
        selectedIndex,
        mode: "topic",
      }),
    });
  }, []);

  const handleNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, queue.length - 1));
  }, [queue.length]);

  const handleBookmark = useCallback(async (questionId: string) => {
    const res = await fetch("/api/bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    const d = await res.json();
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (d.isBookmarked) next.add(questionId);
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
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Search
        </button>
      </div>

      {searched && (
        <>
          {isLoading ? (
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
                id={current.id}
                prompt={current.prompt}
                choices={current.choices}
                correctIndex={current.correctIndex}
                explanation={current.explanation}
                session={current.session}
                topic={current.topic}
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
