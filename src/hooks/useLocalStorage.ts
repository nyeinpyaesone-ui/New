import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
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
