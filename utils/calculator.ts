import type { ActivityLevel, DailyLog, ExerciseType, Gender, Profile } from '../lib/types';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};
export const KCAL_PER_KG = 7700;
export const MAX_DAILY_DEFICIT = 1000;
export const MAX_DAILY_SURPLUS = 500;
export const MIN_DAILY_CALORIES: Record<Gender, number> = { male: 1500, female: 1200, other: 1200 };
export const ALCOHOL_KCAL_PER_100ML = { beer: 43, spirits: 231, wine: 83 } as const;
export const EXERCISE_MET: Record<ExerciseType, number> = {
  none: 0, walking: 3.5, running: 9.8, cycling: 7.5, gym: 5, yoga: 2.5, other: 4,
};

/** Mifflin–St Jeor. Returns null when the formula doesn't apply (gender 'other'). */
export function calculateBmr(gender: Gender, weightKg: number, heightCm: number, age: number): number | null {
  if (gender === 'other') return null;
  if (!(weightKg > 0) || !(heightCm > 0) || !(age > 0)) throw new Error('Invalid BMR input');
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

export function resolveBmr(p: Profile): number | null {
  const formula = calculateBmr(p.gender, p.currentWeight, p.height, p.age);
  if (formula !== null) return formula;
  return p.manualBmr && p.manualBmr > 0 ? Math.round(p.manualBmr) : null;
}

export function calculateTdee(bmr: number, level: ActivityLevel): number {
  if (!(bmr > 0)) throw new Error('Invalid BMR');
  return Math.round(bmr * ACTIVITY_FACTORS[level]);
}

export type TargetAdjustment = 'deficit_capped' | 'surplus_capped' | 'min_floor' | null;
export interface TargetResult {
  target: number;
  rawTarget: number;
  dailyChange: number;
  adjustment: TargetAdjustment;
}

export function calculateDailyTarget(args: {
  tdee: number;
  currentWeight: number;
  targetWeight: number;
  targetDays: number;
  gender: Gender;
}): TargetResult {
  const { tdee, currentWeight, targetWeight, targetDays, gender } = args;
  if (!(targetDays > 0)) throw new Error('targetDays must be > 0');
  if (!(tdee > 0)) throw new Error('tdee must be > 0');

  const rawChange = ((currentWeight - targetWeight) * KCAL_PER_KG) / targetDays; // + = deficit
  let change = rawChange;
  let adjustment: TargetAdjustment = null;

  if (change > MAX_DAILY_DEFICIT) {
    change = MAX_DAILY_DEFICIT;
    adjustment = 'deficit_capped';
  } else if (change < -MAX_DAILY_SURPLUS) {
    change = -MAX_DAILY_SURPLUS;
    adjustment = 'surplus_capped';
  }

  let target = tdee - change;
  const floor = Math.min(MIN_DAILY_CALORIES[gender], tdee);
  if (target < floor) {
    target = floor;
    adjustment = 'min_floor';
  }

  return {
    target: Math.round(target),
    rawTarget: Math.round(tdee - rawChange),
    dailyChange: Math.round(tdee - target),
    adjustment,
  };
}

export function estimateExerciseCalories(type: ExerciseType, minutes: number, weightKg: number): number {
  if (!(minutes > 0) || !(weightKg > 0)) return 0;
  return Math.round((EXERCISE_MET[type] * weightKg * minutes) / 60);
}

/** Uses the user's own number if given, otherwise the estimate — never both. */
export function effectiveExerciseCalories(
  log: Pick<DailyLog, 'exerciseType' | 'exerciseMinutes' | 'exerciseCalories'>,
  weightKg: number,
): number {
  if (log.exerciseCalories !== null && log.exerciseCalories !== undefined) {
    return Math.max(0, Math.round(log.exerciseCalories));
  }
  return estimateExerciseCalories(log.exerciseType, log.exerciseMinutes, weightKg);
}

export function remainingCalories(target: number, food: number, exercise: number): number {
  return Math.round(target - food + exercise);
}

export interface AlcoholEquivalents {
  beerMl: number;
  spiritsMl: number;
  wineMl: number;
}

export function alcoholEquivalentMl(remaining: number, kcalPer100ml: number): number {
  if (!(remaining > 0) || !(kcalPer100ml > 0)) return 0;
  return Math.round((remaining / kcalPer100ml) * 100);
}

export function alcoholEquivalents(remaining: number): AlcoholEquivalents {
  return {
    beerMl: alcoholEquivalentMl(remaining, ALCOHOL_KCAL_PER_100ML.beer),
    spiritsMl: alcoholEquivalentMl(remaining, ALCOHOL_KCAL_PER_100ML.spirits),
    wineMl: alcoholEquivalentMl(remaining, ALCOHOL_KCAL_PER_100ML.wine),
  };
}

export interface DaySummary {
  bmr: number | null;
  tdee: number | null;
  target: TargetResult | null;
  food: number;
  exercise: number;
  remaining: number | null;
  alcohol: AlcoholEquivalents;
}

export function computeDaySummary(profile: Profile, log: DailyLog | null): DaySummary {
  const food = log?.foodCalories ?? 0;
  const exercise = log ? effectiveExerciseCalories(log, log.weightKg ?? profile.currentWeight) : 0;
  const bmr = resolveBmr(profile);
  if (bmr === null) {
    return { bmr: null, tdee: null, target: null, food, exercise, remaining: null, alcohol: alcoholEquivalents(0) };
  }
  const tdee = calculateTdee(bmr, profile.activityLevel);
  const target = calculateDailyTarget({
    tdee,
    currentWeight: profile.currentWeight,
    targetWeight: profile.targetWeight,
    targetDays: profile.targetDays,
    gender: profile.gender,
  });
  const remaining = remainingCalories(target.target, food, exercise);
  return { bmr, tdee, target, food, exercise, remaining, alcohol: alcoholEquivalents(remaining) };
}
