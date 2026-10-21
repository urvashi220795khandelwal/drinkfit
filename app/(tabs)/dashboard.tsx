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
    'Your goal was very aggressive, so your deficit was capped at 1000 kcal/day. Consider increasing your target days.',
  surplus_capped: 'For weight gain, your surplus was capped at 500 kcal/day.',
  min_floor:
    'Your calorie target was below the safe minimum, so it was set to the minimum. Please talk to a doctor or dietitian.',
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
        <H1>Today's calorie budget</H1>
        <Notice tone="danger" text="BMR is not available. Add your estimated BMR in your profile." />
        <Button title="Edit profile" onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })} />
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
        <Muted>{formatDateKey(today)} • Your daily progress</Muted>
      </View>

      <Card style={st.center}>
        <H2>Today's calorie budget</H2>
        <ProgressRing
          progress={progress}
          color={ringColor}
          centerTop={String(Math.abs(d.remaining))}
          centerBottom={over ? 'kcal over' : 'kcal left'}
        />
        <Muted small center>
          {d.food} kcal eaten • {budget} kcal total budget (target + exercise)
        </Muted>
      </Card>

      {!log && <Notice tone="info" text="You haven't logged today yet. Add your food and exercise so your budget is accurate." />}
      <Button title={log ? "Edit today's entry" : "+ Add today's entry"} onPress={() => router.push('/daily-input')} />
      {d.target.adjustment ? <Notice text={ADJUST_MSG[d.target.adjustment]} /> : null}

      <View style={st.grid}>
        <Stat label="BMR (at rest)" value={d.bmr} />
        <Stat label="TDEE (with activity)" value={d.tdee} />
        <Stat label="Daily target (estimate)" value={d.target.target} />
        <Stat label="Food calories" value={d.food} />
        <Stat label="Exercise calories" value={d.exercise} color={colors.green} />
        <Stat label="Remaining budget" value={d.remaining} color={over ? colors.danger : colors.lime} />
      </View>
      <Muted small>
        Remaining = Target − Food + Exercise. Steps aren't added separately because they're already counted in your
        activity level.
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
        This only shows how many ml of a drink your remaining calories equal. It is NOT a safe drinking limit or a
        recommendation.
      </Muted>
      {none ? (
        <Notice tone="danger" text="You've gone over today's calorie budget. It's best to avoid alcohol." />
      ) : (
        <Notice text="Alcohol calories can affect your weight-loss goal." />
      )}
      <AlcoholRow label="Beer calories (5%)" sub="43 kcal / 100 ml" ml={alcohol.beerMl} />
      <AlcoholRow label="Whiskey/Vodka calories (40%)" sub="231 kcal / 100 ml" ml={alcohol.spiritsMl} />
      <AlcoholRow label="Wine calories (12%)" sub="83 kcal / 100 ml" ml={alcohol.wineMl} />
      <Text style={st.zero}>✓ 0 ml — Zero alcohol is always an option, and the best one for your health.</Text>
      <Muted small>
        The health risks of alcohol go far beyond calories. Never drink alcohol if you're pregnant, taking medication,
        driving, or have a health condition.
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
