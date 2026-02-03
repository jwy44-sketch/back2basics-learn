"use client";

import { useState, useEffect } from "react";
import { resetProgress, getFlaggedQuestions, clearFlaggedQuestions } from "@/lib/storage";

export default function SettingsPage() {
  const [alwaysShuffle, setAlwaysShuffle] = useState(true);
  const [shuffleChoices, setShuffleChoices] = useState(true);
  const [resetDone, setResetDone] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [debugAnswers, setDebugAnswers] = useState(false);
  const [flaggedCount, setFlaggedCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAlwaysShuffle(localStorage.getItem("alwaysShuffle") !== "false");
      setShuffleChoices(localStorage.getItem("shuffleChoices") !== "false");
      setDebugAnswers(localStorage.getItem("debugAnswers") === "true");
    }
  }, []);

  useEffect(() => {
    setFlaggedCount(getFlaggedQuestions().length);
    const sync = () => setFlaggedCount(getFlaggedQuestions().length);
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const toggleShuffle = () => {
    const next = !alwaysShuffle;
    setAlwaysShuffle(next);
    localStorage.setItem("alwaysShuffle", String(next));
  };

  const toggleShuffleChoices = () => {
    const next = !shuffleChoices;
    setShuffleChoices(next);
    localStorage.setItem("shuffleChoices", String(next));
  };

  const handleResetProgress = () => {
    if (!confirm("Reset all progress? This will clear bookmarks, attempts, and proficiency. This cannot be undone.")) return;
    resetProgress();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
    window.location.href = "/";
  };

  const handleExport = () => {
    window.open("/questions.json", "_blank");
  };

  const handleToggleDebug = () => {
    const next = !debugAnswers;
    setDebugAnswers(next);
    localStorage.setItem("debugAnswers", String(next));
  };

  const handleExportFlagged = () => {
    const flagged = getFlaggedQuestions();
    const blob = new Blob([JSON.stringify(flagged, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flagged-questions.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFlagged = () => {
    if (!confirm("Clear all reported question flags?")) return;
    clearFlaggedQuestions();
    setFlaggedCount(0);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold">Shuffle</h2>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="shuffle"
            checked={alwaysShuffle}
            onChange={toggleShuffle}
          />
          <label htmlFor="shuffle">Always shuffle question order (default ON)</label>
        </div>
        <p className="text-sm text-slate-500">
          Shuffles question order in Learn, Review, Exam, and Topic quiz.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="shuffle-choices"
            checked={shuffleChoices}
            onChange={toggleShuffleChoices}
          />
          <label htmlFor="shuffle-choices">Shuffle answer choices (default ON)</label>
        </div>
        <p className="text-sm text-slate-500">
          Randomizes A/B/C/D per question without changing the stored correct answer.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold">Export Questions</h2>
        <p className="text-sm text-slate-500">
          Download the question bank as JSON.
        </p>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Export JSON
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold">Reset My Progress</h2>
        <p className="text-sm text-slate-500">
          Clear all progress, bookmarks, and attempt history. Your progress is stored in your browser only.
        </p>
        <button
          onClick={handleResetProgress}
          className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
        >
          Reset My Progress
        </button>
        {resetDone && <p className="text-sm text-green-600">Progress reset. Redirecting…</p>}
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold">Reported Questions</h2>
        <p className="text-sm text-slate-500">
          Export locally reported questions to improve the seed later.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportFlagged}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Export reported IDs ({flaggedCount})
          </button>
          <button
            onClick={handleClearFlagged}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Clear reports
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Advanced</h2>
          <button
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>
        </div>
        {showAdvanced && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="debug"
              checked={debugAnswers}
              onChange={handleToggleDebug}
            />
            <label htmlFor="debug">Show debug answer details</label>
          </div>
        )}
        <p className="text-sm text-slate-500">
          Toggle to reveal original vs. presented answer indices for QA.
        </p>
      </div>
    </div>
  );
}
