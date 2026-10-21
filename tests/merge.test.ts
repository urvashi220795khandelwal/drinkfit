import type { DailyLog } from '../lib/types';
import { mergeLogs } from '../utils/merge';

const l = (logDate: string, updatedAt: string, food = 1000): DailyLog => ({
  logDate, steps: 0, exerciseType: 'none', exerciseMinutes: 0, foodCalories: food,
  exerciseCalories: null, weightKg: null, updatedAt,
});

test('newer local wins and is pushed', () => {
  const { merged, toPush } = mergeLogs(
    [l('2026-01-01', '2026-01-02T00:00:00Z', 2000)],
    [l('2026-01-01', '2026-01-01T00:00:00+00:00', 1000)],
    [],
  );
  expect(merged[0].foodCalories).toBe(2000);
  expect(toPush).toHaveLength(1);
});

test('newer remote wins, nothing pushed', () => {
  const { merged, toPush } = mergeLogs(
    [l('2026-01-01', '2026-01-01T00:00:00Z', 1000)],
    [l('2026-01-01', '2026-01-03T00:00:00+00:00', 3000)],
    [],
  );
  expect(merged[0].foodCalories).toBe(3000);
  expect(toPush).toHaveLength(0);
});

test('deleted dates are excluded', () => {
  const { merged } = mergeLogs([], [l('2026-01-01', '2026-01-01T00:00:00Z')], ['2026-01-01']);
  expect(merged).toHaveLength(0);
});
