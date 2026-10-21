import React, { useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chips, Field, H1, Label, Muted, Notice, Screen } from '../components/ui';
import { EXERCISE_OPTIONS } from '../constants/labels';
import { useApp } from '../hooks/useAppData';
import type { DailyLog } from '../lib/types';
import { estimateExerciseCalories } from '../utils/calculator';
import { dateKey, formatDateKey } from '../utils/date';
import { parseNumber, validateDaily, type DailyForm, type Errors } from '../utils/validation';

const toForm = (l: DailyLog | null): DailyForm => ({
  steps: l && l.steps ? String(l.steps) : '',
  exerciseType: l?.exerciseType ?? 'none',
  exerciseMinutes: l && l.exerciseMinutes ? String(l.exerciseMinutes) : '',
  foodCalories: l && l.foodCalories ? String(l.foodCalories) : '',
  exerciseCalories: l && l.exerciseCalories !== null ? String(l.exerciseCalories) : '',
  weightKg: l && l.weightKg !== null ? String(l.weightKg) : '',
});

const safeNum = (raw: string) => {
  const n = parseNumber(raw);
  return n === null || Number.isNaN(n) ? null : n;
};

export default function DailyInput() {
  const { profile, logs, saveLog } = useApp();
  const params = useLocalSearchParams<{ date?: string }>();
  const logDate =
    typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : dateKey();
  const existing = logs.find((l) => l.logDate === logDate) ?? null;
  const [form, setForm] = useState<DailyForm>(() => toForm(existing));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  if (!profile) return <Redirect href="/onboarding" />;

  const set =
    <K extends keyof DailyForm>(key: K) =>
    (value: DailyForm[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const estimate = estimateExerciseCalories(
    form.exerciseType,
    safeNum(form.exerciseMinutes) ?? 0,
    safeNum(form.weightKg) ?? profile.currentWeight,
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'));

  const onSave = async () => {
    const res = validateDaily(form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setSaving(true);
    await saveLog({ ...res.value, logDate });
    setSaving(false);
    goBack();
  };

  return (
    <Screen>
      <H1>{existing ? 'Entry edit karo' : 'Aaj ki entry'}</H1>
      <Muted>{formatDateKey(logDate)}</Muted>

      <Card>
        <Field
          label="Food calories (kcal)"
          hint="Aaj jo bhi khaya-piya uski total calories."
          keyboardType="number-pad"
          value={form.foodCalories}
          onChangeText={set('foodCalories')}
          error={errors.foodCalories}
          placeholder="0"
        />
        <Field
          label="Daily steps"
          hint="Sirf tracking ke liye. Calories mein add nahi hote, kyunki ye activity level mein already count hain."
          keyboardType="number-pad"
          value={form.steps}
          onChangeText={set('steps')}
          error={errors.steps}
          placeholder="0"
        />
      </Card>

      <Card>
        <Label>Exercise type</Label>
        <Chips options={EXERCISE_OPTIONS} value={form.exerciseType} onChange={set('exerciseType')} />
        {form.exerciseType !== 'none' && (
          <>
            <Field
              label="Exercise kitne minute?"
              keyboardType="number-pad"
              value={form.exerciseMinutes}
              onChangeText={set('exerciseMinutes')}
              error={errors.exerciseMinutes}
            />
            <Field
              label="Exercise calories burned (optional)"
              hint={`Watch/app se pata ho to daalo. Khaali chhodo to app estimate karega: ~${estimate} kcal. Calories sirf ek hi baar count hongi.`}
              keyboardType="number-pad"
              value={form.exerciseCalories}
              onChangeText={set('exerciseCalories')}
              error={errors.exerciseCalories}
            />
          </>
        )}
      </Card>

      <Card>
        <Field
          label="Aaj ka weight (kg, optional)"
          hint="Progress track karne ke liye."
          value={form.weightKg}
          onChangeText={set('weightKg')}
          error={errors.weightKg}
        />
      </Card>

      {Object.keys(errors).length > 0 && <Notice tone="danger" text="Kuch fields theek karni hain — upar laal text dekho." />}
      <Button title={saving ? 'Save ho raha hai...' : 'Save karo'} onPress={onSave} disabled={saving} />
      <Button title="Cancel" variant="secondary" onPress={goBack} />
    </Screen>
  );
}
