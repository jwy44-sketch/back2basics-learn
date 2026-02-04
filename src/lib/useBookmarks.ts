"use client";

import { useCallback, useEffect, useState } from "react";
import { getBookmarks, setBookmarks, toggleBookmark as toggleStoredBookmark } from "./storage";

export function useBookmarks() {
  const [bookmarks, setLocalBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalBookmarks(new Set(getBookmarks()));
    const sync = () => setLocalBookmarks(new Set(getBookmarks()));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const toggleBookmark = useCallback((questionId: string) => {
    const isNow = toggleStoredBookmark(questionId);
    setLocalBookmarks((prev) => {
      const next = new Set(prev);
      if (isNow) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    setLocalBookmarks(new Set());
  }, []);

  const isBookmarked = useCallback(
    (questionId: string) => bookmarks.has(questionId),
    [bookmarks]
  );

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    clearBookmarks,
  };
}
