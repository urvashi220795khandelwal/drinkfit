import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { ProgressRing } from '../../components/ProgressRing';
import { Button, Card, H1, H2, Muted, Notice, Screen, Stat } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useApp } from '../../hooks/useAppData';
import { computeDaySummary, type AlcoholEquivalents, type TargetAdjustment } from '../../utils/calculator';
import { dateKey, formatDateKey } from '../../utils/date';

const ADJUST_MSG: Record<Exclude<TargetAdjustment, null>, string> = {
  deficit_capped:
    'Tumhara goal bahut fast tha, isliye deficit 1000 kcal/din tak limit kiya gaya. Target days badhana better hoga.',
  surplus_capped: 'Weight gain ke liye surplus 500 kcal/din tak limit kiya gaya.',
  min_floor:
    'Calorie target safe minimum se neeche ja raha tha, isliye minimum par set kiya. Doctor ya dietitian se baat karo.',
};

export default function Dashboard() {
  const { profile, logs, prefs } = useApp();
  if (!profile) return <Redirect href="/onboarding" />;

  const today = dateKey();
  const log = logs.find((l) => l.logDate === today) ?? null;
  const d = computeDaySummary(profile, log);

  if (d.bmr === null || d.tdee === null || d.target === null || d.remaining === null) {
    return (
      <Screen>
        <H1>Aaj ka calorie budget</H1>
        <Notice tone="danger" text="BMR available nahi hai. Profile mein apna estimated BMR daalo." />
        <Button title="Profile edit karo" onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })} />
      </Screen>
    );
  }

  const budget = d.target.target + d.exercise;
  const progress = budget > 0 ? d.food / budget : 1;
  const over = d.remaining < 0;
  const ringColor = over ? colors.danger : progress > 0.85 ? colors.warn : colors.lime;

  return (
    <Screen>
      <View>
        <Text style={st.brand}>DrinkFit</Text>
        <Muted>{formatDateKey(today)} • Tumhari daily progress</Muted>
      </View>

      <Card style={st.center}>
        <H2>Aaj ka calorie budget</H2>
        <ProgressRing
          progress={progress}
          color={ringColor}
          centerTop={String(Math.abs(d.remaining))}
          centerBottom={over ? 'kcal zyada ho gayi' : 'kcal baaki'}
        />
        <Muted small center>
          {d.food} kcal khaya • {budget} kcal total budget (target + exercise)
        </Muted>
      </Card>

      {!log && <Notice tone="info" text="Aaj ki entry abhi nahi hui. Food aur exercise add karo taaki budget sahi dikhe." />}
      <Button title={log ? 'Aaj ki entry edit karo' : '+ Aaj ki entry add karo'} onPress={() => router.push('/daily-input')} />
      {d.target.adjustment ? <Notice text={ADJUST_MSG[d.target.adjustment]} /> : null}

      <View style={st.grid}>
        <Stat label="BMR (aaram mein)" value={d.bmr} />
        <Stat label="TDEE (activity ke saath)" value={d.tdee} />
        <Stat label="Daily target (estimate)" value={d.target.target} />
        <Stat label="Food calories" value={d.food} />
        <Stat label="Exercise calories" value={d.exercise} color={colors.green} />
        <Stat label="Remaining budget" value={d.remaining} color={over ? colors.danger : colors.lime} />
      </View>
      <Muted small>
        Remaining = Target − Food + Exercise. Steps alag se add nahi hote, kyunki wo activity level mein already count
        hain.
      </Muted>

      {prefs.showAlcohol && <AlcoholCard remaining={d.remaining} alcohol={d.alcohol} />}
    </Screen>
  );
}

function AlcoholCard({ remaining, alcohol }: { remaining: number; alcohol: AlcoholEquivalents }) {
  const none = remaining <= 0;
  return (
    <Card>
      <H2>Alcohol calorie equivalents</H2>
      <Muted small>
        Ye sirf batata hai ki bachi hui calories kitne ml drink ke barabar hain. Ye safe drinking limit ya
        recommendation NAHI hai.
      </Muted>
      {none ? (
        <Notice tone="danger" text="Aaj calorie budget cross ho gaya — alcohol avoid karna better hai." />
      ) : (
        <Notice text="Alcohol calories tumhare weight-loss goal ko affect kar sakti hain." />
      )}
      <AlcoholRow label="Beer ki calories (5%)" sub="43 kcal / 100 ml" ml={alcohol.beerMl} />
      <AlcoholRow label="Whiskey/Vodka ki calories (40%)" sub="231 kcal / 100 ml" ml={alcohol.spiritsMl} />
      <AlcoholRow label="Wine ki calories (12%)" sub="83 kcal / 100 ml" ml={alcohol.wineMl} />
      <Text style={st.zero}>✓ 0 ml — Zero alcohol hamesha ek option hai, aur health ke liye sabse best.</Text>
      <Muted small>
        Alcohol ke health risks calories se kahin zyada hain. Pregnancy, medicines, driving ya kisi health condition mein
        alcohol bilkul na lo.
      </Muted>
    </Card>
  );
}

function AlcoholRow({ label, sub, ml }: { label: string; sub: string; ml: number }) {
  return (
    <View style={st.row}>
      <View style={{ flex: 1 }}>
        <Text style={st.rowLabel}>{label}</Text>
        <Muted small>{sub}</Muted>
      </View>
      <Text style={st.rowValue}>≈ {ml} ml</Text>
    </View>
  );
}

const st = StyleSheet.create({
  brand: { color: colors.lime, fontSize: 28, fontWeight: '900' },
  center: { alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  rowLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
  zero: { color: colors.green, fontSize: 14, fontWeight: '700' },
});
