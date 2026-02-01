"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

  const apiUrl = weakMode ? "/api/weak-areas" : "/api/learn";
  const { data, isLoading } = useQuery({
    queryKey: [apiUrl, shuffle],
    queryFn: () =>
      fetch(`${apiUrl}?shuffle=${shuffle}`).then((r) => r.json()),
  });

  useEffect(() => {
    if (data && Array.isArray(data)) setQueue(data);
  }, [data]);

  const current = queue[index];

  const handleAnswer = useCallback(
    async (questionId: string, selectedIndex: number) => {
      await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          selectedIndex,
          mode: weakMode ? "weak-area" : "learn",
        }),
      });
    },
    [weakMode]
  );

  const handleNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, queue.length - 1));
  }, [queue.length]);

  const handleBookmark = useCallback(async (questionId: string) => {
    const res = await fetch("/api/bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    });
    const data = await res.json();
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (data.isBookmarked) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }, []);

  if (isLoading || !queue.length) {
    return (
      <div className="text-center py-12">
        {isLoading ? "Loading..." : "No questions available. Run db:seed first."}
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
