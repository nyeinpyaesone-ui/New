import { useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initial: T | (() => T),
  /** optional validator — anything stored on disk passes through this on load */
  sanitize?: (raw: unknown) => T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        const parsed = JSON.parse(raw) as unknown;
        return sanitize ? sanitize(parsed) : (parsed as T);
      }
    } catch {
      /* corrupted or unavailable storage — fall through to defaults */
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode / quota — state still works in memory */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export function eraseKeys(keys: string[]) {
  try {
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}
