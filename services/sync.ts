import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { DailyLog, Profile } from '../lib/types';
import { mergeLogs } from '../utils/merge';

type Row = Record<string, any>;

const toProfileRow = (id: string, email: string | null, p: Profile) => ({
  id,
  email,
  age: p.age,
  gender: p.gender,
  current_weight: p.currentWeight,
  height: p.height,
  target_weight: p.targetWeight,
  target_days: p.targetDays,
  activity_level: p.activityLevel,
  manual_bmr: p.manualBmr,
  updated_at: p.updatedAt,
});

function fromProfileRow(r: Row): Profile | null {
  if (r.age == null || r.gender == null || r.current_weight == null || r.height == null) return null;
  return {
    age: r.age,
    gender: r.gender,
    currentWeight: Number(r.current_weight),
    height: Number(r.height),
    targetWeight: Number(r.target_weight),
    targetDays: r.target_days,
    activityLevel: r.activity_level,
    manualBmr: r.manual_bmr ?? null,
    updatedAt: r.updated_at,
  };
}

const toLogRow = (userId: string, l: DailyLog) => ({
  user_id: userId,
  log_date: l.logDate,
  steps: l.steps,
  exercise_type: l.exerciseType,
  exercise_minutes: l.exerciseMinutes,
  food_calories: l.foodCalories,
  exercise_calories: l.exerciseCalories,
  weight_kg: l.weightKg,
  updated_at: l.updatedAt,
});

const fromLogRow = (r: Row): DailyLog => ({
  logDate: r.log_date,
  steps: r.steps,
  exerciseType: r.exercise_type,
  exerciseMinutes: r.exercise_minutes,
  foodCalories: r.food_calories,
  exerciseCalories: r.exercise_calories ?? null,
  weightKg: r.weight_kg === null ? null : Number(r.weight_kg),
  updatedAt: r.updated_at,
});

export async function syncAll(
  user: User,
  localProfile: Profile | null,
  localLogs: DailyLog[],
  deleted: string[],
): Promise<{ profile: Profile | null; logs: DailyLog[] }> {
  if (!supabase) throw new Error('Cloud sync disabled');

  // Profile: newest wins
  const { data: rp, error: pe } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (pe) throw pe;
  const remoteProfile = rp ? fromProfileRow(rp) : null;
  let profile = localProfile;
  if (remoteProfile && (!localProfile || Date.parse(remoteProfile.updatedAt) > Date.parse(localProfile.updatedAt))) {
    profile = remoteProfile;
  } else if (localProfile) {
    const { error } = await supabase.from('profiles').upsert(toProfileRow(user.id, user.email ?? null, localProfile));
    if (error) throw error;
  }

  // Deletions made offline
  if (deleted.length > 0) {
    const { error } = await supabase.from('daily_logs').delete().eq('user_id', user.id).in('log_date', deleted);
    if (error) throw error;
  }

  // Logs
  const { data: rl, error: le } = await supabase.from('daily_logs').select('*').eq('user_id', user.id);
  if (le) throw le;
  const { merged, toPush } = mergeLogs(localLogs, (rl ?? []).map(fromLogRow), deleted);
  if (toPush.length > 0) {
    const { error } = await supabase
      .from('daily_logs')
      .upsert(toPush.map((l) => toLogRow(user.id, l)), { onConflict: 'user_id,log_date' });
    if (error) throw error;
  }
  return { profile, logs: merged };
}
