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
  syncing: 'Syncing...',
  ok: 'All synced ✓',
  error: "Sync failed. Check your internet connection. Your data is safe on your phone.",
};

export default function ProfileScreen() {
  const { profile, prefs, setPrefs, session, syncState, syncNow, resetLocal } = useApp();
  if (!profile) return <Redirect href="/onboarding" />;

  const gender = GENDER_OPTIONS.find((g) => g.value === profile.gender)?.label;
  const activity = ACTIVITY_OPTIONS.find((a) => a.value === profile.activityLevel)?.label;

  const confirmResetLocal = () =>
    Alert.alert(
      'Delete all data on this phone?',
      "Your profile and all entries will be removed from this phone. Your cloud account (if you have one) won't be affected.",
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
    Alert.alert('Logged out', 'Your data is still saved on this phone.');
  };

  const confirmDeleteAccount = () =>
    Alert.alert(
      'Delete account?',
      'Your account and all synced data will be permanently deleted from the cloud. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            if (!supabase) return;
            const { error } = await supabase.rpc('delete_my_account');
            if (error) {
              Alert.alert("Couldn't delete account", 'Check your internet connection and try again.');
              return;
            }
            await supabase.auth.signOut({ scope: 'local' });
            Alert.alert(
              'Account deleted',
              'Your data is still on this phone. To remove it as well, use "Delete phone data".',
            );
          },
        },
      ],
    );

  return (
    <Screen>
      <H1>Profile & settings</H1>

      <Card>
        <H2>Your profile</H2>
        <Muted>
          {profile.age} years • {gender} • {profile.height} cm
        </Muted>
        <Muted>
          Weight: {profile.currentWeight} kg → Goal: {profile.targetWeight} kg ({profile.targetDays} days)
        </Muted>
        <Muted>Activity: {activity}</Muted>
        <Button
          title="Edit goal / profile"
          variant="secondary"
          onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })}
        />
      </Card>

      <Card>
        <H2>Units & preferences</H2>
        <Muted small>Units: kg, cm, ml and kcal (metric).</Muted>
        <View style={st.switchRow}>
          <Text style={st.switchLabel}>Show alcohol calorie estimates</Text>
          <Switch
            value={prefs.showAlcohol}
            onValueChange={(v) => void setPrefs({ ...prefs, showAlcohol: v })}
            trackColor={{ true: colors.green, false: colors.cardBorder }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      <Card>
        <H2>Cloud sync (optional)</H2>
        {!cloudEnabled ? (
          <Muted small>Cloud sync isn't enabled in this build. The app works fully offline.</Muted>
        ) : session ? (
          <>
            <Muted>Logged in as: {session.user.email}</Muted>
            {SYNC_TEXT[syncState] ? (
              <Notice tone={syncState === 'error' ? 'danger' : 'info'} text={SYNC_TEXT[syncState]} />
            ) : null}
            <Button title="Sync now" variant="secondary" onPress={() => void syncNow()} />
            <Button title="Log out" variant="secondary" onPress={logout} />
            <Button title="Delete account" variant="danger" onPress={confirmDeleteAccount} />
          </>
        ) : (
          <AuthPanel />
        )}
      </Card>

      <Button title="Privacy policy" variant="secondary" onPress={() => router.push('/privacy')} />
      <Button title="Delete phone data" variant="danger" onPress={confirmResetLocal} />
      <Muted small center>
        DrinkFit is 100% free. No subscriptions, ads or payments.
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
      setMsg({ text: `Something went wrong. ${m}`.trim(), error: true });
    } finally {
      setBusy(false);
    }
  };

  const checkEmail = () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Please enter a valid email.');
  };
  const checkPassword = () => {
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  };

  const login = () =>
    run(async () => {
      checkEmail();
      checkPassword();
      const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('Incorrect email or password.');
      return 'Logged in ✓ Syncing your data.';
    });

  const signup = () =>
    run(async () => {
      checkEmail();
      checkPassword();
      const { data, error } = await supabase!.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      return data.session ? 'Account created ✓' : 'Account created! Confirm your email, then log in.';
    });

  const reset = () =>
    run(async () => {
      checkEmail();
      const { error } = await supabase!.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      return 'A password reset link has been sent to your email.';
    });

  return (
    <View style={{ gap: 10 }}>
      <Muted small>
        You only need an account if you want your data on another phone too. The app works fully without one.
      </Muted>
      <Field label="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Field label="Password" keyboardType="default" autoCapitalize="none" secureTextEntry value={password} onChangeText={setPassword} />
      {msg && <Notice tone={msg.error ? 'danger' : 'info'} text={msg.text} />}
      <Button title="Log in" onPress={login} disabled={busy} />
      <Button title="Create new account" variant="secondary" onPress={signup} disabled={busy} />
      <Button title="Forgot password?" variant="secondary" onPress={reset} disabled={busy} />
    </View>
  );
}

const st = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: colors.text, fontSize: 15, flex: 1 },
});
