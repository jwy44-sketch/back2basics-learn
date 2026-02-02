"use client";

import { useState, useEffect, useCallback } from "react";
import { QuestionCard } from "@/components/QuestionCard";
import {
  fetchQuestions,
  buildReviewQueue,
  recordAnswer,
  type Question,
} from "@/lib/questions";
import { toggleBookmark, getBookmarks } from "@/lib/storage";

export default function ReviewPage() {
  const [shuffle] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("alwaysShuffle") !== "false";
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions().then((q) => {
      setQuestions(q);
      setQueue(buildReviewQueue(q, shuffle));
    }).finally(() => setLoading(false));
  }, [shuffle]);

  useEffect(() => {
    setBookmarked(new Set(getBookmarks()));
  }, []);

  const current = queue[index];

  const handleAnswer = useCallback(
    async (questionId: string, selectedIndex: number) => {
      const q = queue.find((x) => x.id === questionId);
      if (!q) return;
      recordAnswer(questionId, q.correctIndex, selectedIndex, "review", q.session, q.topic);
    },
    [queue]
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

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!queue.length)
    return (
      <div className="text-center py-12">
        <p>No wrong answers to review. Keep learning!</p>
        <a href="/learn" className="text-primary-600 hover:underline mt-4 inline-block">
          Go to Learn
        </a>
      </div>
    );

  if (!current)
    return (
      <div className="text-center py-12">
        <p className="text-xl mb-4">Review complete!</p>
        <a href="/" className="text-primary-600 hover:underline">Home</a>
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-slate-500">{index + 1} / {queue.length} (Wrong Answers)</p>
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
        mode="review"
      />
    </div>
  );
}
