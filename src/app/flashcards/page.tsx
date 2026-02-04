"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import { getAllQuestions, type Question } from "@/lib/questions";
import { shuffle } from "@/lib/shuffle";
import { useBookmarks } from "@/lib/useBookmarks";
import { flagConfusingQuestion } from "@/lib/storage";

const SESSIONS = ["Session 1", "Session 2", "Session 3", "Session 4"];

export default function FlashcardsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("All Topics");
  const [session, setSession] = useState("");
  const [shuffleDeck, setShuffleDeck] = useState(true);
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [deck, setDeck] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { bookmarks, toggleBookmark } = useBookmarks();
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    getAllQuestions().then(setQuestions).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const topics = useMemo(() => {
    const set = new Set(questions.map((q) => q.topic));
    return ["All Topics", ...Array.from(set).sort()];
  }, [questions]);

  const buildDeck = () => {
    let list = questions;
    if (topic !== "All Topics") list = list.filter((q) => q.topic === topic);
    if (session) list = list.filter((q) => q.session === session);
    if (onlyBookmarked) list = list.filter((q) => bookmarks.has(q.id));
    if (shuffleDeck) list = shuffle(list);
    setDeck(list);
    setIndex(0);
    setShowAnswer(false);
    setShowExplanation(false);
  };

  useEffect(() => {
    if (!questions.length) return;
    buildDeck();
  }, [questions, topic, session, onlyBookmarked, shuffleDeck, bookmarks]);

  const current = deck[index];

  const handleNext = () => {
    if (!deck.length) return;
    setIndex((prev) => Math.min(deck.length - 1, prev + 1));
    setShowAnswer(false);
    setShowExplanation(false);
  };

  const handlePrev = () => {
    if (!deck.length) return;
    setIndex((prev) => Math.max(0, prev - 1));
    setShowAnswer(false);
    setShowExplanation(false);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") handleNext();
      if (event.key === "ArrowLeft") handlePrev();
      if (event.key === " ") {
        event.preventDefault();
        setShowAnswer((prev) => !prev);
      }
      if (event.key.toLowerCase() === "e") {
        setShowExplanation((prev) => !prev);
      }
      if (event.key.toLowerCase() === "b" && current) {
        toggleBookmark(current.id);
        setToast(bookmarks.has(current.id) ? "Removed bookmark" : "Bookmarked");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, bookmarks, toggleBookmark]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;
    const delta = event.clientX - pointerStartX.current;
    if (delta > 60) handlePrev();
    if (delta < -60) handleNext();
    pointerStartX.current = null;
  };

  const explanationFallback = current
    ? {
        takeaway: `Key takeaway: ${current.topic}${current.session ? ` in ${current.session}` : ""}.`,
        trap: "Common trap: choosing an option that sounds right but doesn’t match the prompt focus.",
      }
    : null;

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-3">
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {topics.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={session}
          onChange={(e) => setSession(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Sessions</option>
          {SESSIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={shuffleDeck}
            onChange={(e) => setShuffleDeck(e.target.checked)}
          />
          Shuffle
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyBookmarked}
            onChange={(e) => setOnlyBookmarked(e.target.checked)}
          />
          Only Bookmarked
        </label>
        <button
          onClick={buildDeck}
          className="px-3 py-2 rounded border border-slate-200 text-sm"
        >
          Reshuffle
        </button>
        <div className="ml-auto text-sm text-slate-500">
          Card {deck.length ? index + 1 : 0} of {deck.length}
        </div>
      </div>

      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all"
          style={{ width: deck.length ? `${((index + 1) / deck.length) * 100}%` : "0%" }}
        />
      </div>

      {current ? (
        <div
          className="bg-white rounded-lg shadow p-6 min-h-[280px] flex flex-col justify-between"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-800">{current.prompt}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="px-2 py-1 rounded bg-slate-100">{current.topic}</span>
                  <span className="px-2 py-1 rounded bg-slate-100">{current.session}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  toggleBookmark(current.id);
                  setToast(bookmarks.has(current.id) ? "Removed bookmark" : "Bookmarked");
                }}
                className="text-2xl hover:scale-110 transition"
              >
                {bookmarks.has(current.id) ? "⭐" : "☆"}
              </button>
            </div>

            {showAnswer && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600">Answer</p>
                <p className="text-slate-700">
                  {current.choices[current.correctIndex]}
                </p>
                <div className="space-y-2">
                  {current.choices.map((choice, idx) => (
                    <div
                      key={choice}
                      className={`px-3 py-2 rounded border ${
                        idx === current.correctIndex ? "border-green-500 bg-green-50" : "border-slate-200"
                      }`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                      {choice}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showExplanation && (
              <div className="space-y-2 text-sm text-slate-700">
                <p className="font-semibold text-slate-600">Explanation</p>
                {current.explanation && current.explanation.length > 60 ? (
                  <p>{current.explanation}</p>
                ) : (
                  <>
                    <p>{explanationFallback?.takeaway}</p>
                    <p>{explanationFallback?.trap}</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowAnswer((prev) => !prev)}
              className="px-4 py-2 rounded border border-slate-200"
            >
              {showAnswer ? "Hide Answer" : "Reveal Answer"}
            </button>
            <button
              onClick={() => setShowExplanation((prev) => !prev)}
              className="px-4 py-2 rounded border border-slate-200"
            >
              {showExplanation ? "Hide Explanation" : "Reveal Explanation"}
            </button>
            <button
              onClick={() => {
                flagConfusingQuestion(current.id);
                setToast("Saved");
              }}
              className="px-4 py-2 rounded border border-slate-200"
            >
              Mark Confusing
            </button>
            <div className="ml-auto flex gap-2">
              <button
                onClick={handlePrev}
                className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">No cards match your filters.</div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2 rounded-lg shadow">
          {toast}
        </div>
      )}
    </div>
  );
}
