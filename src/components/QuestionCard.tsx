"use client";

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
