"use client";

import { useEffect, useState } from "react";

export interface ReadingPreferences {
  fontSize: "sm" | "md" | "lg";
  density: "compact" | "comfortable";
  layoutWidth: "wide" | "focused";
}

const STORAGE_KEY = "aethel_reading_prefs_v1";

const DEFAULT_PREFS: ReadingPreferences = {
  fontSize: "md",
  density: "comfortable",
  layoutWidth: "wide"
};

export function useReadingPreferences() {
  const [prefs, setPrefs] = useState<ReadingPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ReadingPreferences>;
        const merged: ReadingPreferences = {
          fontSize: parsed.fontSize || "md",
          density: parsed.density || "comfortable",
          layoutWidth: parsed.layoutWidth || "wide"
        };
        setPrefs(merged);
        applyPrefsToDom(merged);
      } else {
        applyPrefsToDom(DEFAULT_PREFS);
      }
    } catch {
      applyPrefsToDom(DEFAULT_PREFS);
    }
  }, []);

  function updatePrefs(patch: Partial<ReadingPreferences>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      applyPrefsToDom(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return { prefs, updatePrefs };
}

function applyPrefsToDom(p: ReadingPreferences) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.fontSize = p.fontSize;
  document.documentElement.dataset.density = p.density;
  document.documentElement.dataset.layoutWidth = p.layoutWidth;
}
