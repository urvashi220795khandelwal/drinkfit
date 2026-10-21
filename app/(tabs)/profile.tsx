import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Button, Card, Field, H1, H2, Muted, Notice, Screen } from '../../components/ui';
import { ACTIVITY_OPTIONS, GENDER_OPTIONS } from '../../constants/labels';
import { colors } from '../../constants/theme';
import { useApp, type SyncState } from '../../hooks/useAppData';
import { cloudEnabled, supabase } from '../../lib/supabase';

const SYNC_TEXT: Record<SyncState, string> = {
  idle: '',
  syncing: 'Sync ho raha hai...',
  ok: 'Sab synced ✓',
  error: 'Sync nahi hua — internet check karo. Data phone par safe hai.',
};

export default function ProfileScreen() {
  const { profile, prefs, setPrefs, session, syncState, syncNow, resetLocal } = useApp();
  if (!profile) return <Redirect href="/onboarding" />;

  const gender = GENDER_OPTIONS.find((g) => g.value === profile.gender)?.label;
  const activity = ACTIVITY_OPTIONS.find((a) => a.value === profile.activityLevel)?.label;

  const confirmResetLocal = () =>
    Alert.alert(
      'Phone ka saara data delete karein?',
      'Profile aur saari entries is phone se hat jayengi. Cloud account (agar hai) par asar nahi padega.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await resetLocal();
            router.replace('/onboarding');
          },
        },
      ],
    );

  const logout = async () => {
    await supabase?.auth.signOut({ scope: 'local' });
    Alert.alert('Logout ho gaya', 'Tumhara data phone par abhi bhi save hai.');
  };

  const confirmDeleteAccount = () =>
    Alert.alert(
      'Account delete karein?',
      'Cloud se tumhara account aur saara synced data permanently delete ho jayega. Ye undo nahi hoga.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            if (!supabase) return;
            const { error } = await supabase.rpc('delete_my_account');
            if (error) {
              Alert.alert('Delete nahi hua', 'Internet check karke dobara try karo.');
              return;
            }
            await supabase.auth.signOut({ scope: 'local' });
            Alert.alert(
              'Account delete ho gaya',
              'Phone par data abhi bhi hai. Use bhi hatana ho to "Phone ka data delete karo" use karo.',
            );
          },
        },
      ],
    );

  return (
    <Screen>
      <H1>Profile & settings</H1>

      <Card>
        <H2>Tumhari profile</H2>
        <Muted>
          {profile.age} saal • {gender} • {profile.height} cm
        </Muted>
        <Muted>
          Weight: {profile.currentWeight} kg → Goal: {profile.targetWeight} kg ({profile.targetDays} din)
        </Muted>
        <Muted>Activity: {activity}</Muted>
        <Button
          title="Goal / profile edit karo"
          variant="secondary"
          onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })}
        />
      </Card>

      <Card>
        <H2>Units & preferences</H2>
        <Muted small>Units: kg, cm, ml aur kcal (metric).</Muted>
        <View style={st.switchRow}>
          <Text style={st.switchLabel}>Alcohol calorie estimates dikhao</Text>
          <Switch
            value={prefs.showAlcohol}
            onValueChange={(v) => void setPrefs({ ...prefs, showAlcohol: v })}
            trackColor={{ true: colors.green, false: colors.input }}
            thumbColor={prefs.showAlcohol ? colors.lime : colors.muted}
          />
        </View>
      </Card>

      <Card>
        <H2>Cloud sync (optional)</H2>
        {!cloudEnabled ? (
          <Muted small>Is build mein cloud sync on nahi hai. App poori tarah offline kaam karti hai.</Muted>
        ) : session ? (
          <>
            <Muted>Logged in: {session.user.email}</Muted>
            {SYNC_TEXT[syncState] ? (
              <Notice tone={syncState === 'error' ? 'danger' : 'info'} text={SYNC_TEXT[syncState]} />
            ) : null}
            <Button title="Abhi sync karo" variant="secondary" onPress={() => void syncNow()} />
            <Button title="Logout" variant="secondary" onPress={logout} />
            <Button title="Account delete karo" variant="danger" onPress={confirmDeleteAccount} />
          </>
        ) : (
          <AuthPanel />
        )}
      </Card>

      <Button title="Privacy policy" variant="secondary" onPress={() => router.push('/privacy')} />
      <Button title="Phone ka data delete karo" variant="danger" onPress={confirmResetLocal} />
      <Muted small center>
        DrinkFit 100% free hai — koi subscription, ads ya payment nahi.
      </Muted>
    </Screen>
  );
}

function AuthPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ text: await fn(), error: false });
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : '';
      setMsg({ text: `Kuch gadbad hui. ${m}`.trim(), error: true });
    } finally {
      setBusy(false);
    }
  };

  const checkEmail = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Sahi email daalo.');
  };
  const checkPassword = () => {
    if (password.length < 6) throw new Error('Password kam se kam 6 characters ka ho.');
  };

  const login = () =>
    run(async () => {
      checkEmail();
      checkPassword();
      const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('Email ya password galat hai.');
      return 'Login ho gaya ✓ Data sync ho raha hai.';
    });

  const signup = () =>
    run(async () => {
      checkEmail();
      checkPassword();
      const { data, error } = await supabase!.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      return data.session ? 'Account ban gaya ✓' : 'Account ban gaya! Email confirm karo, phir login karo.';
    });

  const reset = () =>
    run(async () => {
      checkEmail();
      const { error } = await supabase!.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      return 'Password reset link tumhare email par bhej diya.';
    });

  return (
    <View style={{ gap: 10 }}>
      <Muted small>
        Account sirf tab chahiye jab data dusre phone par bhi chahiye. Bina account ke bhi app poori chalti hai.
      </Muted>
      <Field label="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Field label="Password" keyboardType="default" autoCapitalize="none" secureTextEntry value={password} onChangeText={setPassword} />
      {msg && <Notice tone={msg.error ? 'danger' : 'info'} text={msg.text} />}
      <Button title="Login" onPress={login} disabled={busy} />
      <Button title="Naya account banao" variant="secondary" onPress={signup} disabled={busy} />
      <Button title="Password bhool gaye?" variant="secondary" onPress={reset} disabled={busy} />
    </View>
  );
}

const st = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: colors.text, fontSize: 15, flex: 1 },
});
