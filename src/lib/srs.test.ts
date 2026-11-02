import { describe, expect, it } from 'vitest';
import { applyGrade, DAY_MS, newSrsState, previewIntervals, sortDue } from './srs';

const T0 = Date.UTC(2026, 0, 1);

describe('SM-2 scheduler', () => {
  it('starts new cards due now with ease 2.5', () => {
    const s = newSrsState(T0);
    expect(s).toMatchObject({ state: 'new', ease: 2.5, interval: 0, reps: 0, due: T0 });
  });

  it('Good on a new card graduates to 1 day', () => {
    const s = applyGrade(newSrsState(T0), 2, T0);
    expect(s.state).toBe('review');
    expect(s.interval).toBe(1);
    expect(s.due).toBe(T0 + DAY_MS);
  });

  it('Easy on a new card graduates to 4 days with a higher ease', () => {
    const s = applyGrade(newSrsState(T0), 3, T0);
    expect(s.interval).toBe(4);
    expect(s.ease).toBeGreaterThan(2.5);
  });

  it('Hard on first sight stays in learning for 10 minutes', () => {
    const s = applyGrade(newSrsState(T0), 1, T0);
    expect(s.state).toBe('learning');
    expect(s.due).toBe(T0 + 10 * 60_000);
  });

  it('Again lapses a review card, shrinks ease, floors at 1.3', () => {
    let s = applyGrade(newSrsState(T0), 2, T0);
    for (let i = 0; i < 10; i++) s = applyGrade(s, 0, T0);
    expect(s.state).toBe('learning');
    expect(s.lapses).toBe(1);
    expect(s.ease).toBe(1.3);
  });

  it('intervals grow geometrically with Good and cap at 365', () => {
    let s = applyGrade(newSrsState(T0), 2, T0);
    const seen = [s.interval];
    for (let i = 0; i < 12; i++) {
      s = applyGrade(s, 2, s.due);
      seen.push(s.interval);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
    expect(seen[seen.length - 1]).toBe(365);
  });

  it('previewIntervals produces human labels', () => {
    const p = previewIntervals(newSrsState(T0), T0);
    expect(p[0]).toBe('10m');
    expect(p[2]).toBe('1d');
    expect(p[3]).toBe('4d');
  });

  it('sortDue puts learning cards first', () => {
    const a = { ...newSrsState(T0), state: 'review' as const, due: T0 };
    const b = { ...newSrsState(T0), state: 'learning' as const, due: T0 + 1 };
    expect(sortDue([a, b])[0]).toBe(b);
  });
});
