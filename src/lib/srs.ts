/**
 * Generic SM-2 with a short learning phase.
 * Ported from Mandarin90's scheduler and made language-agnostic: the scheduler only
 * sees `SrsState`, never the card content. Pure functions, no dependencies.
 *
 * Grades: 0 Again · 1 Hard · 2 Good · 3 Easy
 */

export type Grade = 0 | 1 | 2 | 3;
export type CardState = 'new' | 'learning' | 'review';

export interface SrsState {
  state: CardState;
  /** Ease factor, min 1.3. */
  ease: number;
  /** Current interval in days (0 while learning). */
  interval: number;
  /** Successful repetitions in a row. */
  reps: number;
  /** Times a review-state card fell back to learning. */
  lapses: number;
  /** Epoch ms the card is next due. */
  due: number;
}

export const DAY_MS = 86_400_000;
const LEARNING_STEP_MS = 10 * 60_000;

export function newSrsState(now = Date.now()): SrsState {
  return { state: 'new', ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now };
}

/** End of today (local). Anything due before this counts as due today. */
export function endOfToday(now = Date.now()): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function applyGrade<T extends SrsState>(card: T, grade: Grade, now = Date.now()): T {
  const c = { ...card };

  if (grade === 0) {
    if (c.state === 'review') c.lapses += 1;
    c.state = 'learning';
    c.reps = 0;
    c.interval = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.due = now + LEARNING_STEP_MS;
    return c;
  }

  // Classic SM-2 ease update; our 1..3 maps onto SM-2's q = 3..5.
  const q = grade + 2;
  c.ease = Math.max(1.3, c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (c.state === 'new' || c.state === 'learning') {
    if (grade === 3) {
      c.state = 'review';
      c.interval = 4;
      c.reps = 1;
      c.due = now + c.interval * DAY_MS;
    } else if (c.reps === 0 && grade === 1) {
      c.state = 'learning';
      c.reps = 1;
      c.due = now + LEARNING_STEP_MS;
    } else {
      c.state = 'review';
      c.interval = 1;
      c.reps = 1;
      c.due = now + DAY_MS;
    }
    return c;
  }

  c.reps += 1;
  if (c.interval <= 1) c.interval = grade === 1 ? 1 : grade === 3 ? 4 : 3;
  else {
    const mult = grade === 1 ? 1.2 : grade === 3 ? c.ease * 1.3 : c.ease;
    c.interval = Math.min(365, Math.round(c.interval * mult));
  }
  c.interval = Math.max(1, c.interval);
  c.due = now + c.interval * DAY_MS;
  return c;
}

/** What the interval would become for each grade. Used for the review button labels. */
export function previewIntervals(card: SrsState, now = Date.now()): Record<Grade, string> {
  const fmt = (c: SrsState) => {
    const ms = c.due - now;
    if (ms < DAY_MS) return `${Math.max(1, Math.round(ms / 60_000))}m`;
    const d = Math.round(ms / DAY_MS);
    if (d < 30) return `${d}d`;
    return `${(d / 30).toFixed(1).replace(/\.0$/, '')}mo`;
  };
  return {
    0: fmt(applyGrade(card, 0, now)),
    1: fmt(applyGrade(card, 1, now)),
    2: fmt(applyGrade(card, 2, now)),
    3: fmt(applyGrade(card, 3, now)),
  };
}

/** Order a session: learning cards first (they cycle), then by due. */
export function sortDue<T extends SrsState>(cards: T[]): T[] {
  return [...cards].sort((a, b) =>
    a.state === b.state ? a.due - b.due : a.state === 'learning' ? -1 : 1,
  );
}

export function isMature(c: SrsState): boolean {
  return c.state === 'review' && c.interval >= 21;
}
