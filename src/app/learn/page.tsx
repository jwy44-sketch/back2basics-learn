"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { QuestionCard } from "@/components/QuestionCard";
import {
  fetchQuestions,
  buildLearnQueue,
  buildWeakAreasQueue,
  recordAnswer,
  type Question,
} from "@/lib/questions";
import { presentQuestion } from "@/lib/presentedQuestion";
import { toggleBookmark, getBookmarks } from "@/lib/storage";

function LearnContent() {
  const searchParams = useSearchParams();
  const weakMode = searchParams.get("mode") === "weak";
  const [shuffle] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("alwaysShuffle") !== "false";
  });
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const questions = await fetchQuestions();
        if (cancelled) return;
        const q = weakMode
          ? buildWeakAreasQueue(questions, shuffle)
          : buildLearnQueue(questions, shuffle);
        setQueue(q);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [weakMode, shuffle]);

  useEffect(() => {
    setBookmarked(new Set(getBookmarks()));
  }, []);

  const presentedQueue = useMemo(
    () => queue.map((q) => presentQuestion(q, { shuffleChoices: shuffle })),
    [queue, shuffle]
  );
  const current = presentedQueue[index];

  const handleAnswer = useCallback(
    async (questionId: string, selectedIndex: number) => {
      const q = presentedQueue.find((x) => x.id === questionId);
      if (!q) return;
      recordAnswer(
        questionId,
        q.presentedCorrectIndex,
        selectedIndex,
        weakMode ? "weak-area" : "learn",
        q.session,
        q.topic
      );
    },
    [presentedQueue, weakMode]
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

  if (loading) {
    return (
      <div className="text-center py-12">Loading...</div>
    );
  }

  if (!queue.length) {
    return (
      <div className="text-center py-12">
        No questions available. Check that /questions.json exists.
      </div>
    );
  }

  if (!current) {
    return (
      <div className="text-center py-12">
        <p className="text-xl mb-4">Session complete!</p>
        <a href="/" className="text-primary-600 hover:underline">
          Return to Home
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-500">
        {index + 1} / {queue.length}
        {weakMode && " (Weak Areas)"}
      </p>
      <QuestionCard
        key={current.id}
        question={current}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onBookmark={handleBookmark}
        isBookmarked={bookmarked.has(current.id)}
        mode={weakMode ? "weak-area" : "learn"}
      />
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <LearnContent />
    </Suspense>
  );
}
