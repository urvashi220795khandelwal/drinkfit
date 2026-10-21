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
        <H1>Profile edit karo</H1>
      ) : (
        <View style={st.hero}>
          <Text style={st.brand}>DrinkFit</Text>
          <Text style={st.tagline}>Smart Drinking. Smarter Goals.</Text>
          <Muted>
            Apni details bharo — hum tumhara daily calorie budget estimate karenge. App poori tarah free hai aur data
            tumhare phone par save hota hai.
          </Muted>
        </View>
      )}

      <Card>
        <Field
          label="Umar (saal)"
          hint="BMR calculate karne ke liye. DrinkFit sirf 18+ ke liye hai."
          keyboardType="number-pad"
          value={form.age}
          onChangeText={set('age')}
          error={errors.age}
        />

        <Label>Gender</Label>
        <Muted small>BMR formula male aur female ke liye alag hota hai.</Muted>
        <Chips options={GENDER_OPTIONS} value={form.gender} onChange={set('gender')} />
        {form.gender === 'other' && (
          <>
            <Notice text="Standard BMR formula sirf male/female ke liye bana hai, isliye tumhare liye exact calculate nahi ho sakta. Apna estimated BMR daalo (doctor, dietitian ya body-composition scale se)." />
            <Field
              label="Estimated BMR (kcal/din)"
              hint="Aam taur par 1200–2000 ke beech hota hai."
              keyboardType="number-pad"
              value={form.manualBmr}
              onChangeText={set('manualBmr')}
              error={errors.manualBmr}
            />
          </>
        )}

        <Field
          label="Abhi ka weight (kg)"
          hint="Subah khaali pet ka weight sabse accurate hota hai."
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
          hint="Tum kis weight tak pahunchna chahte ho."
          value={form.targetWeight}
          onChangeText={set('targetWeight')}
          error={errors.targetWeight}
        />
        <Field
          label="Target kitne din mein?"
          hint="Realistic goal: hafte mein 0.5–1 kg. Example: 5 kg ke liye ~60 din."
          keyboardType="number-pad"
          value={form.targetDays}
          onChangeText={set('targetDays')}
          error={errors.targetDays}
        />

        <Label>Activity level</Label>
        <Chips options={ACTIVITY_OPTIONS} value={form.activityLevel} onChange={set('activityLevel')} />
        {activity?.hint ? <Muted small>{activity.hint}</Muted> : null}
      </Card>

      {hasErrors && <Notice tone="danger" text="Kuch fields theek karni hain — upar laal text dekho." />}
      <Button title={saving ? 'Save ho raha hai...' : isEdit ? 'Save karo' : 'Shuru karo'} onPress={onSave} disabled={saving} />
      {isEdit && <Button title="Cancel" variant="secondary" onPress={() => router.back()} />}
      <Muted small center>
        Saare results sirf estimate hain, medical advice nahi.
      </Muted>
    </Screen>
  );
}

const st = StyleSheet.create({
  hero: { gap: 6, marginBottom: 6 },
  brand: { color: colors.lime, fontSize: 36, fontWeight: '900' },
  tagline: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
