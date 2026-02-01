"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [alwaysShuffle, setAlwaysShuffle] = useState(true);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

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

  const handleExport = () => {
    window.open("/api/export", "_blank");
  };

  const handleImport = async () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append("file", importFile);
    const res = await fetch("/api/import", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      setImportResult(`Imported ${data.imported} of ${data.total} questions.`);
      setImportFile(null);
    } else {
      setImportResult(`Error: ${data.error}`);
    }
  };

  const handleResetProgress = async () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    // We would need an API for this - for now show a message
    alert("Reset progress: delete prisma/dev.db and run db:setup to reset.");
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
        <h2 className="font-semibold">Import / Export</h2>
        <p className="text-sm text-slate-500">
          Export questions as JSON. Import to add more questions to the bank.
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Export JSON
          </button>
          <div className="flex-1">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            <button
              onClick={handleImport}
              disabled={!importFile}
              className="ml-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"
            >
              Import JSON
            </button>
          </div>
        </div>
        {importResult && (
          <p className="text-sm text-slate-600">{importResult}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold">Reset Progress</h2>
        <p className="text-sm text-slate-500">
          Delete the database and re-seed to start over.
        </p>
        <button
          onClick={handleResetProgress}
          className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
        >
          Reset Progress
        </button>
      </div>
    </div>
  );
}
