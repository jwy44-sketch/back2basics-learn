"use client";

import { useState, useEffect, useCallback } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import {
  fetchQuestions,
  buildBookmarksQueue,
  recordAnswer,
  type Question,
} from "@/lib/questions";
import { toggleBookmark, getBookmarks } from "@/lib/storage";

export default function BookmarksPage() {
  const [shuffle] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("alwaysShuffle") !== "false";
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshQueue = useCallback(() => {
    const q = buildBookmarksQueue(questions, shuffle);
    setQueue(q);
    setIndex(0);
  }, [questions, shuffle]);

  useEffect(() => {
    fetchQuestions().then((q) => {
      setQuestions(q);
      setQueue(buildBookmarksQueue(q, shuffle));
    }).finally(() => setLoading(false));
  }, [shuffle]);

  useEffect(() => {
    const check = () => refreshQueue();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [refreshQueue]);

  const current = queue[index];

  const handleAnswer = useCallback(
    async (questionId: string, selectedIndex: number) => {
      const q = queue.find((x) => x.id === questionId);
      if (!q) return;
      recordAnswer(questionId, q.correctIndex, selectedIndex, "topic", q.session, q.topic);
    },
    [queue]
  );

  const handleNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, queue.length - 1));
  }, [queue.length]);

  const handleBookmark = useCallback((questionId: string) => {
    toggleBookmark(questionId);
    refreshQueue();
  }, [refreshQueue]);

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!queue.length)
    return (
      <div className="text-center py-12">
        <p>No bookmarks yet. Star questions during Learn or Review.</p>
        <a href="/learn" className="text-primary-600 hover:underline mt-4 inline-block">
          Go to Learn
        </a>
      </div>
    );

  if (!current)
    return (
      <div className="text-center py-12">
        <p className="text-xl mb-4">Done!</p>
        <a href="/" className="text-primary-600 hover:underline">Home</a>
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-slate-500">{index + 1} / {queue.length} (Bookmarks)</p>
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
        isBookmarked={true}
        mode="topic"
      />
    </div>
  );
}
