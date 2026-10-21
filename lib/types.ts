export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type ExerciseType = 'none' | 'walking' | 'running' | 'cycling' | 'gym' | 'yoga' | 'other';

export interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export interface Profile {
  age: number;
  gender: Gender;
  currentWeight: number;
  height: number;
  targetWeight: number;
  targetDays: number;
  activityLevel: ActivityLevel;
  manualBmr: number | null;
  updatedAt: string;
}

export interface DailyLog {
  logDate: string; // YYYY-MM-DD
  steps: number;
  exerciseType: ExerciseType;
  exerciseMinutes: number;
  foodCalories: number;
  /** null = app estimates from type + minutes (never both) */
  exerciseCalories: number | null;
  weightKg: number | null;
  updatedAt: string;
}

export interface Prefs {
  showAlcohol: boolean;
}
export const DEFAULT_PREFS: Prefs = { showAlcohol: true };
