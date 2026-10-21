import type { ActivityLevel, ExerciseType, Gender, Option } from '../lib/types';

export const GENDER_OPTIONS: Option<Gender>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other / prefer not to say' },
];

export const ACTIVITY_OPTIONS: Option<ActivityLevel>[] = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Mostly sitting, little to no exercise.' },
  { value: 'light', label: 'Light', hint: 'Light exercise 1–3 days a week.' },
  { value: 'moderate', label: 'Moderate', hint: 'Exercise 3–5 days a week.' },
  { value: 'active', label: 'Active', hint: 'Hard exercise 6–7 days a week.' },
];

export const EXERCISE_OPTIONS: Option<ExerciseType>[] = [
  { value: 'none', label: 'None' },
  { value: 'walking', label: 'Walking' },
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'gym', label: 'Gym' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'other', label: 'Other' },
];
