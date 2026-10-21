import type { DailyLog, Profile } from '../lib/types';
import {
  alcoholEquivalents, calculateBmr, calculateDailyTarget, calculateTdee, computeDaySummary,
  effectiveExerciseCalories, estimateExerciseCalories, remainingCalories, resolveBmr,
} from '../utils/calculator';

const profile: Profile = {
  age: 30, gender: 'male', currentWeight: 80, height: 175, targetWeight: 75, targetDays: 50,
  activityLevel: 'moderate', manualBmr: null, updatedAt: '2026-01-01T00:00:00Z',
};

describe('BMR', () => {
  it('male formula', () => expect(calculateBmr('male', 80, 175, 30)).toBe(1749));
  it('female formula', () => expect(calculateBmr('female', 60, 165, 25)).toBe(1345));
  it('other returns null, manual BMR used', () => {
    expect(calculateBmr('other', 70, 170, 30)).toBeNull();
    expect(resolveBmr({ ...profile, gender: 'other', manualBmr: 1500 })).toBe(1500);
    expect(resolveBmr({ ...profile, gender: 'other', manualBmr: null })).toBeNull();
  });
  it('rejects invalid input', () => expect(() => calculateBmr('male', 0, 175, 30)).toThrow());
});

describe('TDEE', () => {
  it('applies activity factor', () => {
    expect(calculateTdee(1749, 'moderate')).toBe(2711);
    expect(calculateTdee(1749, 'sedentary')).toBe(2099);
  });
});

describe('Daily target', () => {
  it('normal deficit', () => {
    const r = calculateDailyTarget({ tdee: 2711, currentWeight: 80, targetWeight: 75, targetDays: 50, gender: 'male' });
    expect(r.target).toBe(1941);
    expect(r.adjustment).toBeNull();
  });
  it('caps aggressive deficit at 1000/day', () => {
    const r = calculateDailyTarget({ tdee: 2711, currentWeight: 80, targetWeight: 70, targetDays: 30, gender: 'male' });
    expect(r.target).toBe(1711);
    expect(r.adjustment).toBe('deficit_capped');
  });
  it('never goes below safe minimum', () => {
    const r = calculateDailyTarget({ tdee: 1600, currentWeight: 60, targetWeight: 55, targetDays: 30, gender: 'female' });
    expect(r.target).toBe(1200);
    expect(r.adjustment).toBe('min_floor');
  });
  it('caps surplus for weight gain', () => {
    const r = calculateDailyTarget({ tdee: 2000, currentWeight: 60, targetWeight: 70, targetDays: 100, gender: 'male' });
    expect(r.target).toBe(2500);
    expect(r.adjustment).toBe('surplus_capped');
  });
  it('rejects zero days', () => {
    expect(() => calculateDailyTarget({ tdee: 2000, currentWeight: 80, targetWeight: 75, targetDays: 0, gender: 'male' })).toThrow();
  });
});

describe('Remaining & alcohol', () => {
  it('remaining = target - food + exercise', () => {
    expect(remainingCalories(1941, 1500, 300)).toBe(741);
    expect(remainingCalories(1941, 2500, 0)).toBe(-559);
  });
  it('alcohol equivalents', () => {
    expect(alcoholEquivalents(430)).toEqual({ beerMl: 1000, spiritsMl: 186, wineMl: 518 });
  });
  it('zero or negative budget gives zero', () => {
    const zero = { beerMl: 0, spiritsMl: 0, wineMl: 0 };
    expect(alcoholEquivalents(0)).toEqual(zero);
    expect(alcoholEquivalents(-100)).toEqual(zero);
  });
});

describe('Exercise (no double counting)', () => {
  it('estimates from MET', () => expect(estimateExerciseCalories('running', 30, 80)).toBe(392));
  it('manual value replaces estimate', () => {
    expect(effectiveExerciseCalories({ exerciseType: 'running', exerciseMinutes: 30, exerciseCalories: 250 }, 80)).toBe(250);
  });
  it('none = 0', () => {
    expect(effectiveExerciseCalories({ exerciseType: 'none', exerciseMinutes: 0, exerciseCalories: null }, 80)).toBe(0);
  });
});

describe('Day summary', () => {
  const log: DailyLog = {
    logDate: '2026-01-01', steps: 9000, exerciseType: 'running', exerciseMinutes: 30,
    foodCalories: 1500, exerciseCalories: 200, weightKg: null, updatedAt: '2026-01-01T10:00:00Z',
  };
  it('combines everything, steps not added', () => {
    const d = computeDaySummary(profile, log);
    expect(d.remaining).toBe(641);
    expect(d.alcohol.beerMl).toBe(1491);
  });
  it('works with no log', () => expect(computeDaySummary(profile, null).remaining).toBe(1941));
});
