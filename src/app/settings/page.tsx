"use client";

import { useState, useEffect } from "react";
import { resetProgress } from "@/lib/storage";

export default function SettingsPage() {
  const [alwaysShuffle, setAlwaysShuffle] = useState(true);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAlwaysShuffle(localStorage.getItem("alwaysShuffle") !== "false");
    }
  }, []);

  const toggleShuffle = () => {
    const next = !alwaysShuffle;
    setAlwaysShuffle(next);
    localStorage.setItem("alwaysShuffle", String(next));
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
          <label htmlFor="shuffle">Always shuffle (default ON)</label>
        </div>
        <p className="text-sm text-slate-500">
          Shuffles question order in Learn, Review, Exam, and Topic quiz.
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
    </div>
  );
}
