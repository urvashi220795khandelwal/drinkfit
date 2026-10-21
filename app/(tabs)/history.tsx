import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Card, H1, H2, Muted, Screen } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../hooks/useAppData';
import { computeDaySummary, effectiveExerciseCalories } from '../../utils/calculator';
import { formatDateKey, lastNDays, shortDateKey } from '../../utils/date';

const BAR_HEIGHT = 120;

export default function History() {
  const { profile, logs, removeLog } = useApp();
  if (!profile) return <Redirect href="/onboarding" />;

  const exerciseOf = (l: (typeof logs)[number]) => effectiveExerciseCalories(l, l.weightKg ?? profile.currentWeight);
  const week = lastNDays(7).map((key) => ({ key, log: logs.find((l) => l.logDate === key) ?? null }));
  const logged = week.filter((w) => w.log !== null);
  const target = computeDaySummary(profile, null).target?.target ?? 0;
  const avgFood = logged.length
    ? Math.round(logged.reduce((s, w) => s + (w.log?.foodCalories ?? 0), 0) / logged.length)
    : 0;
  const weekExercise = logged.reduce((s, w) => s + (w.log ? exerciseOf(w.log) : 0), 0);
  const maxBar = Math.max(target, ...week.map((w) => w.log?.foodCalories ?? 0), 1);

  const weights = logs.filter((l) => l.weightKg !== null).sort((a, b) => a.logDate.localeCompare(b.logDate));
  const latest = weights.length ? weights[weights.length - 1].weightKg! : profile.currentWeight;
  const change = +(latest - profile.currentWeight).toFixed(1);
  const toGoal = +Math.abs(latest - profile.targetWeight).toFixed(1);

  const confirmDelete = (date: string) =>
    Alert.alert('Delete entry?', `The entry for ${formatDateKey(date)} will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeLog(date) },
    ]);

  return (
    <Screen>
      <H1>History & progress</H1>

      <Card>
        <H2>This week</H2>
        <Muted>
          {logged.length}/7 days logged • Avg food {avgFood} kcal • Exercise {weekExercise} kcal
        </Muted>
        <View style={st.chart}>
          {target > 0 && <View style={[st.targetLine, { bottom: (target / maxBar) * BAR_HEIGHT + 18 }]} />}
          {week.map((w) => {
            const food = w.log?.foodCalories ?? 0;
            const overTarget = target > 0 && food > target;
            return (
              <View key={w.key} style={st.barCol}>
                <View
                  style={[
                    st.bar,
                    { height: Math.max(3, (food / maxBar) * BAR_HEIGHT), backgroundColor: overTarget ? colors.danger : colors.lime },
                  ]}
                />
                <Text style={st.barLabel}>{shortDateKey(w.key)}</Text>
              </View>
            );
          })}
        </View>
        <Muted small>Dotted line = daily target ({target} kcal). Red bar = over target.</Muted>
      </Card>

      <Card>
        <H2>Weight progress</H2>
        <Muted>
          Start: {profile.currentWeight} kg • Latest: {latest} kg • Change: {change > 0 ? '+' : ''}
          {change} kg
        </Muted>
        <Muted>
          {toGoal} kg left to reach your goal ({profile.targetWeight} kg).
        </Muted>
      </Card>

      <H2>All entries</H2>
      {logs.length === 0 && <Muted>No entries yet. Add today's entry from the dashboard.</Muted>}
      {logs.map((l) => (
        <Card key={l.logDate}>
          <Text style={st.date}>{formatDateKey(l.logDate)}</Text>
          <Muted small>
            Food {l.foodCalories} kcal • Exercise {exerciseOf(l)} kcal • Steps {l.steps}
            {l.weightKg !== null ? ` • Weight ${l.weightKg} kg` : ''}
          </Muted>
          <View style={st.actions}>
            <Pressable
              style={st.action}
              onPress={() => router.push({ pathname: '/daily-input', params: { date: l.logDate } })}
            >
              <Text style={st.actionText}>Edit</Text>
            </Pressable>
            <Pressable style={st.action} onPress={() => confirmDelete(l.logDate)}>
              <Text style={[st.actionText, { color: colors.danger }]}>Delete</Text>
            </Pressable>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const st = StyleSheet.create({
  chart: { height: BAR_HEIGHT + 24, flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
  targetLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.muted },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '70%', borderRadius: 6 },
  barLabel: { color: colors.muted, fontSize: 11 },
  date: { color: colors.text, fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionText: { color: colors.text, fontWeight: '600' },
});
