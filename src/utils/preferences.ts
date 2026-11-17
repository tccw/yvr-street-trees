import { useCallback, useState } from "react";

export type TreeSortOrder = "frequency" | "alphabetical";

export const PREFERENCES_STORAGE_KEY = "yvr_tree_preferences_v1";

/**
 * Single source of truth for persisted user preferences:
 * types, defaults, and runtime validation are all derived from this schema.
 */
export const PREFERENCES_SCHEMA = {
  treeSortOrder: {
    default: "frequency" as TreeSortOrder,
    validate: (v: unknown): v is TreeSortOrder =>
      v === "frequency" || v === "alphabetical",
  },
} as const;

export type UserPreferences = {
  [K in keyof typeof PREFERENCES_SCHEMA]: (typeof PREFERENCES_SCHEMA)[K]["default"];
};

export const DEFAULT_PREFERENCES: UserPreferences = Object.fromEntries(
  (Object.keys(PREFERENCES_SCHEMA) as (keyof UserPreferences)[]).map((key) => [
    key,
    PREFERENCES_SCHEMA[key].default,
  ])
) as UserPreferences;

export function loadPreferences(): UserPreferences {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { ...DEFAULT_PREFERENCES };
    }
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFERENCES };
    }
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_PREFERENCES };
    }

    const result = { ...DEFAULT_PREFERENCES };
    for (const key of Object.keys(PREFERENCES_SCHEMA) as (keyof UserPreferences)[]) {
      const candidate = parsed[key];
      if (PREFERENCES_SCHEMA[key].validate(candidate)) {
        result[key] = candidate;
      }
    }
    return result;
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors (e.g. private browsing / quota exceeded)
  }
}

export function usePreferences(): [
  UserPreferences,
  <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
] {
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences((prev) => {
        const next = { ...prev, [key]: value };
        savePreferences(next);
        return next;
      });
    },
    []
  );

  return [preferences, updatePreference];
}
