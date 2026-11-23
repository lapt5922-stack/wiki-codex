"use client";

import { useEffect, useState } from "react";

export function useDraftAutoSave<T>(storageKey: string, value: T, enabled = true) {
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { savedAt?: string };
        if (parsed && parsed.savedAt) {
          setHasSavedDraft(true);
          setSavedAt(parsed.savedAt);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey, enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      try {
        const now = new Date().toISOString();
        window.localStorage.setItem(storageKey, JSON.stringify({ savedAt: now, data: value }));
      } catch {
        // ignore quota errors
      }
    }, 1400);
    return () => window.clearTimeout(t);
  }, [storageKey, value, enabled]);

  function restoreDraft(): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { data?: T };
      setHasSavedDraft(false);
      return parsed.data ?? null;
    } catch {
      return null;
    }
  }

  function clearDraft() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(storageKey);
      setHasSavedDraft(false);
      setSavedAt(null);
    } catch {
      // ignore
    }
  }

  return { hasSavedDraft, savedAt, restoreDraft, clearDraft };
}
