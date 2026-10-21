import type { ActivityLevel, DailyLog, ExerciseType, Gender, Profile } from '../lib/types';

export interface ProfileForm {
  age: string;
  gender: Gender;
  currentWeight: string;
  height: string;
  targetWeight: string;
  targetDays: string;
  activityLevel: ActivityLevel;
  manualBmr: string;
}

export interface DailyForm {
  steps: string;
  exerciseType: ExerciseType;
  exerciseMinutes: string;
  foodCalories: string;
  exerciseCalories: string;
  weightKg: string;
}

export type Errors = Partial<Record<string, string>>;
export type Result<T> = { ok: true; value: T } | { ok: false; errors: Errors };

/** null = empty, NaN = not a number */
export function parseNumber(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function check(
  errors: Errors,
  key: string,
  raw: string,
  min: number,
  max: number,
  opts: { required?: boolean; integer?: boolean; tooLow?: string } = {},
): number | null {
  const n = parseNumber(raw);
  if (n === null) {
    if (opts.required !== false) errors[key] = 'Ye field zaroori hai.';
    return null;
  }
  if (Number.isNaN(n)) {
    errors[key] = 'Sirf number daalo.';
    return null;
  }
  if (opts.integer && !Number.isInteger(n)) {
    errors[key] = 'Poora number daalo (decimal nahi).';
    return null;
  }
  if (n < min && opts.tooLow) {
    errors[key] = opts.tooLow;
    return null;
  }
  if (n < min || n > max) {
    errors[key] = `${min} se ${max} ke beech hona chahiye.`;
    return null;
  }
  return n;
}

export function validateProfile(f: ProfileForm): Result<Omit<Profile, 'updatedAt'>> {
  const e: Errors = {};
  const age = check(e, 'age', f.age, 18, 100, { integer: true, tooLow: 'DrinkFit sirf 18+ users ke liye hai.' });
  const currentWeight = check(e, 'currentWeight', f.currentWeight, 30, 300);
  const height = check(e, 'height', f.height, 120, 230);
  const targetWeight = check(e, 'targetWeight', f.targetWeight, 30, 300);
  const targetDays = check(e, 'targetDays', f.targetDays, 7, 730, { integer: true });
  const manualBmr =
    f.gender === 'other' ? check(e, 'manualBmr', f.manualBmr, 800, 4000, { integer: true }) : null;

  if (Object.keys(e).length > 0) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      age: age!,
      gender: f.gender,
      currentWeight: currentWeight!,
      height: height!,
      targetWeight: targetWeight!,
      targetDays: targetDays!,
      activityLevel: f.activityLevel,
      manualBmr,
    },
  };
}

export function validateDaily(f: DailyForm): Result<Omit<DailyLog, 'logDate' | 'updatedAt'>> {
  const e: Errors = {};
  const steps = check(e, 'steps', f.steps, 0, 100000, { required: false, integer: true });
  const food = check(e, 'foodCalories', f.foodCalories, 0, 15000, { required: false, integer: true });
  const weight = check(e, 'weightKg', f.weightKg, 30, 300, { required: false });

  let minutes: number | null = 0;
  let exerciseCalories: number | null = null;
  if (f.exerciseType !== 'none') {
    minutes = check(e, 'exerciseMinutes', f.exerciseMinutes, 1, 600, { integer: true });
    exerciseCalories = check(e, 'exerciseCalories', f.exerciseCalories, 0, 5000, { required: false, integer: true });
  }

  if (Object.keys(e).length > 0) return { ok: false, errors: e };
  return {
    ok: true,
    value: {
      steps: steps ?? 0,
      exerciseType: f.exerciseType,
      exerciseMinutes: minutes ?? 0,
      foodCalories: food ?? 0,
      exerciseCalories,
      weightKg: weight,
    },
  };
}
