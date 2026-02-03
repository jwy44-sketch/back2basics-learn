"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { PresentedQuestion } from "@/lib/presentedQuestion";
import { buildContrastStatements, buildEnhancedExplanation } from "@/lib/explanations";
import { flagQuestion } from "@/lib/storage";

interface QuestionCardProps {
  question: PresentedQuestion;
  onAnswer: (questionId: string, selectedIndex: number) => Promise<void>;
  onNext: () => void;
  onBookmark?: (questionId: string) => void | Promise<void>;
  isBookmarked?: boolean;
  mode?: string;
  showBookmark?: boolean;
}

interface LearnQuestionCardProps {
  question: PresentedQuestion;
  batchIndex: number;
  batchSize: number;
  streak: number;
  answered: boolean;
  selectedIndex: number | null;
  wasCorrect: boolean | null;
  onSelect: (selectedIndex: number) => void;
  onDontKnow: () => void;
  onNext: () => void;
  onBookmark?: (questionId: string) => void;
  isBookmarked?: boolean;
}

function buildLearnFallbackExplanation(question: PresentedQuestion) {
  const correctAnswer = question.presentedChoices[question.presentedCorrectIndex];
  const promptSnippet = question.prompt.length > 120
    ? `${question.prompt.slice(0, 120)}…`
    : question.prompt;
  return {
    definition: `Definition: "${correctAnswer}" is the option that directly answers the prompt.`,
    keyIdea: `Key idea: Focus on the requirement or action described in "${promptSnippet}".`,
    example: `Example: If asked about "${question.topic}", pick the option that best matches the prompt’s stated focus.`,
  };
}

export function QuestionCard({
  question,
  onAnswer,
  onNext,
  onBookmark,
  isBookmarked,
  mode = "learn",
  showBookmark = true,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (typeof window === "undefined") return;
      setShowDebug(localStorage.getItem("debugAnswers") === "true");
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const enhanced = useMemo(
    () => buildEnhancedExplanation(question, question.explanation),
    [question]
  );
  const contrastStatements = useMemo(() => buildContrastStatements(question), [question]);

  const handleSelect = async (idx: number) => {
    if (answered) return;
    setLoading(true);
    try {
      await onAnswer(question.id, idx);
      setSelected(idx);
      setAnswered(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setAnswered(false);
    onNext();
  };

  const handleReport = (reason: string) => {
    flagQuestion(question.id, reason);
    setReportStatus("Reported. Thank you!");
    setReportOpen(false);
    setTimeout(() => setReportStatus(null), 2500);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm text-slate-500">
          {question.session} • {question.topic}
        </span>
        {showBookmark && onBookmark && (
          <button
            onClick={() => onBookmark(question.id)}
            className="text-2xl hover:scale-110 transition"
          >
            {isBookmarked ? "⭐" : "☆"}
          </button>
        )}
      </div>
      <p className="text-lg font-medium mb-6">{question.prompt}</p>
      <div className="space-y-3">
        {question.presentedChoices.map((choice, idx) => {
          let bg = "bg-slate-50 hover:bg-slate-100";
          if (answered) {
            if (idx === question.presentedCorrectIndex) bg = "bg-green-100 border-green-500";
            else if (idx === selected && selected !== question.presentedCorrectIndex)
              bg = "bg-red-100 border-red-500";
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={answered || loading}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${bg} ${
                answered || loading ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
              {choice}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="font-medium text-slate-700 mb-3">Explanation</p>
          <div className="space-y-3 text-slate-700">
            <div>
              <p className="text-sm font-semibold text-slate-600">Why it’s correct</p>
              <p>{enhanced.whyCorrect}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Key takeaway</p>
              <p>{enhanced.keyTakeaway}</p>
            </div>
            {enhanced.commonMistake && (
              <div>
                <p className="text-sm font-semibold text-slate-600">Common mistake</p>
                <p>{enhanced.commonMistake}</p>
              </div>
            )}
            {contrastStatements.length > 0 && (
              <details className="rounded border border-slate-200 bg-white px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-slate-600">
                  Show why others are wrong
                </summary>
                <ul className="mt-2 list-disc pl-5 text-slate-600 space-y-1">
                  {contrastStatements.map((statement, idx) => (
                    <li key={idx}>{statement}</li>
                  ))}
                </ul>
              </details>
            )}
            {showDebug && (
              <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <p className="font-semibold">Debug</p>
                <p>
                  Original index: {question.originalCorrectIndex} • Presented index: {question.presentedCorrectIndex}
                </p>
                <p>Original correct answer: {question.originalChoices[question.originalCorrectIndex]}</p>
                <p>Presented correct answer: {question.presentedChoices[question.presentedCorrectIndex]}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setReportOpen((prev) => !prev)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Report bad question / bad explanation
              </button>
              {reportStatus && <span className="text-sm text-green-600">{reportStatus}</span>}
            </div>
            {reportOpen && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleReport("Bad question")}
                  className="px-3 py-1 rounded border border-slate-200 bg-white text-sm hover:bg-slate-100"
                >
                  Bad question
                </button>
                <button
                  onClick={() => handleReport("Bad explanation")}
                  className="px-3 py-1 rounded border border-slate-200 bg-white text-sm hover:bg-slate-100"
                >
                  Bad explanation
                </button>
                <button
                  onClick={() => handleReport("Other issue")}
                  className="px-3 py-1 rounded border border-slate-200 bg-white text-sm hover:bg-slate-100"
                >
                  Other issue
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleNext}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export function LearnQuestionCard({
  question,
  batchIndex,
  batchSize,
  streak,
  answered,
  selectedIndex,
  wasCorrect,
  onSelect,
  onDontKnow,
  onNext,
  onBookmark,
  isBookmarked,
}: LearnQuestionCardProps) {
  const reduceMotion = useReducedMotion();
  const correctAnswer = question.presentedChoices[question.presentedCorrectIndex];
  const normalizedExplanation = question.explanation?.trim() ?? "";
  const explanationIsGeneric =
    !normalizedExplanation ||
    normalizedExplanation.length < 60 ||
    normalizedExplanation.toLowerCase() === correctAnswer.toLowerCase();
  const fallback = buildLearnFallbackExplanation(question);

  return (
    <motion.div
      layout
      className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto relative overflow-hidden"
      animate={
        answered
          ? wasCorrect
            ? {
                scale: reduceMotion ? 1 : 1.02,
                boxShadow: "0 0 0 3px rgba(34,197,94,0.3)",
              }
            : {
                x: reduceMotion ? 0 : [0, -6, 6, -4, 4, 0],
                boxShadow: "0 0 0 3px rgba(239,68,68,0.3)",
              }
          : { scale: 1, x: 0, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
      }
      transition={{ duration: reduceMotion ? 0.1 : 0.28 }}
    >
      <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
        <span>
          Question {batchIndex + 1} of {batchSize}
        </span>
        <div className="flex items-center gap-3">
          <span>Streak: 🔥{streak}</span>
          {onBookmark && (
            <button
              onClick={() => onBookmark(question.id)}
              className="text-lg hover:scale-110 transition"
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {isBookmarked ? "⭐" : "☆"}
            </button>
          )}
        </div>
      </div>
      <p className="text-lg font-medium mb-6">{question.prompt}</p>
      <div className="space-y-3">
        {question.presentedChoices.map((choice, idx) => {
          let bg = "bg-slate-50 hover:bg-slate-100";
          if (answered) {
            if (idx === question.presentedCorrectIndex) bg = "bg-green-100 border-green-500";
            else if (idx === selectedIndex && selectedIndex !== question.presentedCorrectIndex)
              bg = "bg-red-100 border-red-500";
          }
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              disabled={answered}
              className={`w-full text-left p-4 rounded-lg border-2 transition ${bg} ${
                answered ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
              {choice}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onDontKnow}
          disabled={answered}
          className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-60"
        >
          I don’t know
        </button>
        <span className="text-xs text-slate-400">Shortcuts: 1-4, I, Enter, N</span>
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.28 }}
            className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 sticky bottom-0"
          >
            <p className="font-semibold text-slate-700 mb-2">
              {wasCorrect ? "✅ Correct" : "❌ Incorrect"}
            </p>
            <p className="text-sm text-slate-600 mb-3">
              Correct answer: <span className="font-medium text-slate-700">{correctAnswer}</span>
            </p>
            <div className="text-sm text-slate-600 space-y-2">
              {explanationIsGeneric ? (
                <>
                  <p>{fallback.definition}</p>
                  <p>{fallback.keyIdea}</p>
                  <p>{fallback.example}</p>
                </>
              ) : (
                <p>{normalizedExplanation}</p>
              )}
            </div>
            <button
              onClick={onNext}
              className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Next
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
