import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chips, Field, H1, Label, Muted, Notice, Screen } from '../components/ui';
import { ACTIVITY_OPTIONS, GENDER_OPTIONS } from '../constants/labels';
import { colors } from '../constants/theme';
import { useApp } from '../hooks/useAppData';
import type { Profile } from '../lib/types';
import { validateProfile, type Errors, type ProfileForm } from '../utils/validation';

const toForm = (p: Profile | null): ProfileForm => ({
  age: p ? String(p.age) : '',
  gender: p?.gender ?? 'male',
  currentWeight: p ? String(p.currentWeight) : '',
  height: p ? String(p.height) : '',
  targetWeight: p ? String(p.targetWeight) : '',
  targetDays: p ? String(p.targetDays) : '',
  activityLevel: p?.activityLevel ?? 'sedentary',
  manualBmr: p?.manualBmr ? String(p.manualBmr) : '',
});

export default function Onboarding() {
  const { profile, saveProfile } = useApp();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const isEdit = edit === '1';
  const [form, setForm] = useState<ProfileForm>(() => toForm(profile));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set =
    <K extends keyof ProfileForm>(key: K) =>
    (value: ProfileForm[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    const res = validateProfile(form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    await saveProfile(res.value);
    setSaving(false);
    if (isEdit && router.canGoBack()) router.back();
    else router.replace('/(tabs)/dashboard');
  };

  const activity = ACTIVITY_OPTIONS.find((a) => a.value === form.activityLevel);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Screen>
      {isEdit ? (
        <H1>Edit profile</H1>
      ) : (
        <View style={st.hero}>
          <Text style={st.brand}>DrinkFit</Text>
          <Text style={st.tagline}>Smart Drinking. Smarter Goals.</Text>
          <Muted>
            Fill in your details and we'll estimate your daily calorie budget. The app is completely free and your data
            is saved on your phone.
          </Muted>
        </View>
      )}

      <Card>
        <Field
          label="Age (years)"
          hint="Used to calculate your BMR. DrinkFit is for ages 18+ only."
          keyboardType="number-pad"
          value={form.age}
          onChangeText={set('age')}
          error={errors.age}
        />

        <Label>Gender</Label>
        <Muted small>The BMR formula is different for males and females.</Muted>
        <Chips options={GENDER_OPTIONS} value={form.gender} onChange={set('gender')} />
        {form.gender === 'other' && (
          <>
            <Notice text="The standard BMR formula only covers male and female, so we can't calculate yours exactly. Enter your estimated BMR (from a doctor, dietitian, or body-composition scale)." />
            <Field
              label="Estimated BMR (kcal/day)"
              hint="Usually between 1200 and 2000."
              keyboardType="number-pad"
              value={form.manualBmr}
              onChangeText={set('manualBmr')}
              error={errors.manualBmr}
            />
          </>
        )}

        <Field
          label="Current weight (kg)"
          hint="Your weight in the morning on an empty stomach is the most accurate."
          value={form.currentWeight}
          onChangeText={set('currentWeight')}
          error={errors.currentWeight}
        />
        <Field
          label="Height (cm)"
          hint="Example: 5 ft 7 in ≈ 170 cm."
          value={form.height}
          onChangeText={set('height')}
          error={errors.height}
        />
        <Field
          label="Target weight (kg)"
          hint="The weight you want to reach."
          value={form.targetWeight}
          onChangeText={set('targetWeight')}
          error={errors.targetWeight}
        />
        <Field
          label="Days to reach your target"
          hint="A realistic goal is 0.5–1 kg per week. Example: ~60 days for 5 kg."
          keyboardType="number-pad"
          value={form.targetDays}
          onChangeText={set('targetDays')}
          error={errors.targetDays}
        />

        <Label>Activity level</Label>
        <Chips options={ACTIVITY_OPTIONS} value={form.activityLevel} onChange={set('activityLevel')} />
        {activity?.hint ? <Muted small>{activity.hint}</Muted> : null}
      </Card>

      {hasErrors && <Notice tone="danger" text="Some fields need fixing. Check the red text above." />}
      <Button title={saving ? 'Saving...' : isEdit ? 'Save' : 'Get started'} onPress={onSave} disabled={saving} />
      {isEdit && <Button title="Cancel" variant="secondary" onPress={() => router.back()} />}
      <Muted small center>
        All results are estimates, not medical advice.
      </Muted>
    </Screen>
  );
}

const st = StyleSheet.create({
  hero: { gap: 6, marginBottom: 6 },
  brand: { color: colors.lime, fontSize: 36, fontWeight: '900' },
  tagline: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
