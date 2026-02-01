"use client";

import { useState } from "react";

interface QuestionCardProps {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  session: string;
  topic: string;
  onAnswer: (questionId: string, selectedIndex: number) => Promise<void>;
  onNext: () => void;
  onBookmark?: (questionId: string) => void;
  isBookmarked?: boolean;
  mode?: string;
  showBookmark?: boolean;
}

export function QuestionCard({
  id,
  prompt,
  choices,
  correctIndex,
  explanation,
  session,
  topic,
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

  const handleSelect = async (idx: number) => {
    if (answered) return;
    setLoading(true);
    try {
      await onAnswer(id, idx);
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

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm text-slate-500">
          {session} • {topic}
        </span>
        {showBookmark && onBookmark && (
          <button
            onClick={() => onBookmark(id)}
            className="text-2xl hover:scale-110 transition"
          >
            {isBookmarked ? "⭐" : "☆"}
          </button>
        )}
      </div>
      <p className="text-lg font-medium mb-6">{prompt}</p>
      <div className="space-y-3">
        {choices.map((choice, idx) => {
          let bg = "bg-slate-50 hover:bg-slate-100";
          if (answered) {
            if (idx === correctIndex) bg = "bg-green-100 border-green-500";
            else if (idx === selected && selected !== correctIndex)
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
          <p className="font-medium text-slate-700 mb-2">Explanation:</p>
          <p className="text-slate-600">{explanation}</p>
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
