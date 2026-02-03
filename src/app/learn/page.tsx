"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LearnQuestionCard } from "@/components/QuestionCard";
import {
  fetchQuestions,
  buildLearnQueue,
  buildWeakAreasQueue,
  recordAnswer,
  type Question,
} from "@/lib/questions";
import { presentQuestion, type PresentedQuestion } from "@/lib/presentedQuestion";
import { toggleBookmark, getBookmarks } from "@/lib/storage";

const BATCH_SIZE = 10;
type LearnState = "LOADING" | "IN_BATCH" | "FEEDBACK" | "BATCH_SUMMARY" | "SESSION_COMPLETE";

function LearnContent() {
  const searchParams = useSearchParams();
  const weakMode = searchParams.get("mode") === "weak";
  const [shuffle] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("alwaysShuffle") !== "false";
  });
  const [queue, setQueue] = useState<Question[]>([]);
  const [remainingQueue, setRemainingQueue] = useState<Question[]>([]);
  const [batchQuestions, setBatchQuestions] = useState<PresentedQuestion[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [missedInBatch, setMissedInBatch] = useState<Set<string>>(new Set());
  const [missedMap, setMissedMap] = useState<Map<string, PresentedQuestion>>(new Map());
  const [answeredCountThisBatch, setAnsweredCountThisBatch] = useState(0);
  const [correctCountThisBatch, setCorrectCountThisBatch] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [learnState, setLearnState] = useState<LearnState>("LOADING");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let builtQueue: Question[] = [];
      try {
        const questions = await fetchQuestions();
        if (cancelled) return;
        builtQueue = weakMode
          ? buildWeakAreasQueue(questions, shuffle)
          : buildLearnQueue(questions, shuffle);
        setQueue(builtQueue);
        setRemainingQueue(builtQueue);
      } finally {
        if (!cancelled) setLearnState(builtQueue.length ? "IN_BATCH" : "SESSION_COMPLETE");
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

  const startBatch = useCallback((sourceQueue: Question[]) => {
    const slice = sourceQueue.slice(0, BATCH_SIZE);
    const remaining = sourceQueue.slice(BATCH_SIZE);
    const presented = slice.map((q) => presentQuestion(q, { shuffleChoices: true }));
    setBatchQuestions(presented);
    setRemainingQueue(remaining);
    setBatchIndex(0);
    setMissedInBatch(new Set());
    setMissedMap(new Map());
    setAnsweredCountThisBatch(0);
    setCorrectCountThisBatch(0);
    setSelectedIndex(null);
    setWasCorrect(null);
    setLearnState(presented.length ? "IN_BATCH" : "SESSION_COMPLETE");
  }, []);

  useEffect(() => {
    if (learnState !== "IN_BATCH") return;
    if (!batchQuestions.length && remainingQueue.length) {
      startBatch(remainingQueue);
    }
    if (!batchQuestions.length && !remainingQueue.length) {
      setLearnState("SESSION_COMPLETE");
    }
  }, [batchQuestions.length, learnState, remainingQueue, startBatch]);

  const current = batchQuestions[batchIndex];

  const handleAnswer = useCallback(
    (selected: number) => {
      if (!current || learnState !== "IN_BATCH") return;
      const isCorrect = selected === current.presentedCorrectIndex;
      recordAnswer(
        current.id,
        current.presentedCorrectIndex,
        selected,
        weakMode ? "weak-area" : "learn",
        current.session,
        current.topic
      );
      setSelectedIndex(selected);
      setWasCorrect(isCorrect);
      setAnsweredCountThisBatch((prev) => prev + 1);
      setCorrectCountThisBatch((prev) => prev + (isCorrect ? 1 : 0));
      setCorrectStreak((prev) => (isCorrect ? prev + 1 : 0));
      if (!isCorrect) {
        setMissedInBatch((prev) => new Set(prev).add(current.id));
        setMissedMap((prev) => {
          const next = new Map(prev);
          next.set(current.id, current);
          return next;
        });
        if (batchQuestions.length > 1) {
          const offset = Math.random() < 0.5 ? 2 : 3;
          const insertIndex = Math.min(batchQuestions.length - 1, batchIndex + offset);
          if (insertIndex > batchIndex) {
            const updated = [...batchQuestions];
            updated.splice(insertIndex, 0, current);
            const removed = updated.splice(batchQuestions.length, 1)[0];
            setBatchQuestions(updated);
            if (removed && removed.originalQuestionId !== current.originalQuestionId) {
              const removedQuestion = queue.find((q) => q.id === removed.originalQuestionId);
              if (removedQuestion) {
                setRemainingQueue((prev) => [...prev, removedQuestion]);
              }
            }
          }
        }
      }
      setLearnState("FEEDBACK");
    },
    [batchIndex, batchQuestions, current, learnState, queue, weakMode]
  );

  const handleDontKnow = useCallback(() => {
    handleAnswer(-1);
  }, [handleAnswer]);

  const handleNext = useCallback(() => {
    setSelectedIndex(null);
    setWasCorrect(null);
    const nextIndex = batchIndex + 1;
    if (nextIndex >= batchQuestions.length) {
      setLearnState("BATCH_SUMMARY");
    } else {
      setBatchIndex(nextIndex);
      setLearnState("IN_BATCH");
    }
  }, [batchIndex, batchQuestions.length]);

  const handleBookmark = useCallback((questionId: string) => {
    const isNow = toggleBookmark(questionId);
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (isNow) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (learnState === "LOADING") return;
    const handler = (event: KeyboardEvent) => {
      if (!current) return;
      if (learnState === "IN_BATCH") {
        if (["1", "2", "3", "4"].includes(event.key)) {
          handleAnswer(Number(event.key) - 1);
        }
        if (event.key.toLowerCase() === "i") {
          handleDontKnow();
        }
      }
      if (learnState === "FEEDBACK") {
        if (event.key === "Enter" || event.key.toLowerCase() === "n") {
          handleNext();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, handleAnswer, handleDontKnow, handleNext, learnState]);

  if (learnState === "LOADING") {
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

  if (learnState === "SESSION_COMPLETE") {
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
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
          <span>{weakMode ? "Weak Areas" : "Learn"}</span>
          <span>Streak: 🔥{correctStreak}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <motion.div
            className="h-full bg-primary-500"
            initial={false}
            animate={{ width: `${batchQuestions.length ? ((batchIndex + (learnState === "FEEDBACK" ? 1 : 0)) / batchQuestions.length) * 100 : 0}%` }}
            transition={{ duration: reduceMotion ? 0.1 : 0.3 }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Question {Math.min(batchIndex + 1, batchQuestions.length)} of {batchQuestions.length || BATCH_SIZE}
        </div>
      </div>

      {learnState === "BATCH_SUMMARY" ? (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-semibold">Batch summary</h2>
          <p className="text-slate-600">
            Accuracy: {answeredCountThisBatch ? Math.round((correctCountThisBatch / answeredCountThisBatch) * 100) : 0}%
          </p>
          {missedInBatch.size > 0 ? (
            <div>
              <p className="font-medium text-slate-700 mb-2">Missed questions</p>
              <ul className="list-disc pl-5 text-slate-600 space-y-1">
                {Array.from(missedMap.values()).map((q) => (
                  <li key={q.id}>{q.prompt}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-slate-600">Great work! You got everything in this batch.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                const missed = Array.from(missedMap.values());
                if (!missed.length) return;
                setBatchQuestions(missed);
                setBatchIndex(0);
                setMissedInBatch(new Set());
                setMissedMap(new Map());
                setAnsweredCountThisBatch(0);
                setCorrectCountThisBatch(0);
                setSelectedIndex(null);
                setWasCorrect(null);
                setLearnState("IN_BATCH");
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
              disabled={missedInBatch.size === 0}
            >
              Retry missed now
            </button>
            <button
              onClick={() => startBatch(remainingQueue)}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              disabled={!remainingQueue.length}
            >
              Next batch
            </button>
          </div>
        </div>
      ) : current ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.25 }}
          >
            <LearnQuestionCard
              question={current}
              batchIndex={batchIndex}
              batchSize={batchQuestions.length || BATCH_SIZE}
              streak={correctStreak}
              answered={learnState === "FEEDBACK"}
              selectedIndex={selectedIndex}
              wasCorrect={wasCorrect}
              onSelect={handleAnswer}
              onDontKnow={handleDontKnow}
              onNext={handleNext}
              onBookmark={handleBookmark}
              isBookmarked={bookmarked.has(current.id)}
            />
          </motion.div>
        </AnimatePresence>
      ) : null}
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
