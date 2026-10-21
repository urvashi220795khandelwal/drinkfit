import type { ActivityLevel, ExerciseType, Gender, Option } from '../lib/types';

export const GENDER_OPTIONS: Option<Gender>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other / batana nahi' },
];

export const ACTIVITY_OPTIONS: Option<ActivityLevel>[] = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Zyada time baithe rehte ho, exercise na ke barabar.' },
  { value: 'light', label: 'Light', hint: 'Hafte mein 1–3 din halki exercise.' },
  { value: 'moderate', label: 'Moderate', hint: 'Hafte mein 3–5 din exercise.' },
  { value: 'active', label: 'Active', hint: 'Hafte mein 6–7 din tough exercise.' },
];

export const EXERCISE_OPTIONS: Option<ExerciseType>[] = [
  { value: 'none', label: 'Koi nahi' },
  { value: 'walking', label: 'Walking' },
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'gym', label: 'Gym' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'other', label: 'Other' },
];
