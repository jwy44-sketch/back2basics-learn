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

export default function BookmarksPage() {
  const [shuffle] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("alwaysShuffle") !== "false";
  });
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bookmarks", shuffle],
    queryFn: () =>
      fetch(`/api/bookmarks?shuffle=${shuffle}`).then((r) => r.json()),
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
        mode: "topic",
      }),
    });
  }, []);

  const handleNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, queue.length - 1));
  }, [queue.length]);

  const handleBookmark = useCallback(async (questionId: string) => {
    await fetch("/api/bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    refetch();
  }, [refetch]);

  if (isLoading) return <div className="text-center py-12">Loading...</div>;
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
