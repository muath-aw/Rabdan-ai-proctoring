/**
 * Tiny typed localStorage wrapper used by v1 settings handlers.
 * When the real backend lands, replace call sites with `httpClient.*` — this file goes away.
 */
export function createLocalStorageStore<TItem>(key: string) {
  const read = (): TItem[] => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as TItem[]) : [];
    } catch {
      return [];
    }
  };

  const write = (items: TItem[]) => {
    window.localStorage.setItem(key, JSON.stringify(items));
  };

  return { read, write };
}

/** Simulates a small network round-trip so React Query loading states are visible. */
export function simulateLatency<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
