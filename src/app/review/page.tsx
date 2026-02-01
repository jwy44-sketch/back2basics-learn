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

export default function ReviewPage() {
  const [shuffle] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("alwaysShuffle") !== "false";
  });
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["review", shuffle],
    queryFn: () =>
      fetch(`/api/review?shuffle=${shuffle}`).then((r) => r.json()),
  });

  useEffect(() => {
    if (data && Array.isArray(data)) setQueue(data);
  }, [data]);

  const current = queue[index];

  const handleAnswer = useCallback(async (questionId: string, selectedIndex: number) => {
    await fetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId,
        selectedIndex,
        mode: "review",
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

  if (isLoading) return <div className="text-center py-12">Loading...</div>;
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
