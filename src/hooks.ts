import { useEffect, useState, useSyncExternalStore } from 'react';
import { getSettings, subscribeSettings, type Settings } from './lib/settings';
import { getMasks, subscribeMasks, type Mask } from './masks';

export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}

let masksSnapshot: Mask[] = getMasks();
subscribeMasks(() => {
  masksSnapshot = getMasks();
});
export function useMasks(): Mask[] {
  return useSyncExternalStore(subscribeMasks, () => masksSnapshot, () => masksSnapshot);
}

/** Re-run an async read whenever `deps` or the DB tick changes. */
const dbListeners = new Set<() => void>();
export function touchDb(): void {
  dbListeners.forEach((l) => l());
}
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): T | undefined {
  const [v, setV] = useState<T>();
  useEffect(() => {
    let alive = true;
    const run = () => fn().then((r) => alive && setV(r));
    run();
    dbListeners.add(run);
    return () => {
      alive = false;
      dbListeners.delete(run);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}

export function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(q);
    const h = () => setM(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [q]);
  return m;
}
