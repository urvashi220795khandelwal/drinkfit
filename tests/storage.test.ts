jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as store from '../lib/storage';
import type { DailyLog, Profile } from '../lib/types';

const log = (logDate: string, food = 1800): DailyLog => ({
  logDate, steps: 0, exerciseType: 'none', exerciseMinutes: 0, foodCalories: food,
  exerciseCalories: null, weightKg: null, updatedAt: new Date().toISOString(),
});
const profile: Profile = {
  age: 30, gender: 'male', currentWeight: 80, height: 175, targetWeight: 75, targetDays: 50,
  activityLevel: 'moderate', manualBmr: null, updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('profile persists', async () => {
  await store.saveProfile(profile);
  expect(await store.loadProfile()).toEqual(profile);
});

test('upsert replaces same date and sorts newest first', async () => {
  await store.upsertLog(log('2026-01-01'));
  await store.upsertLog(log('2026-01-02'));
  const logs = await store.upsertLog(log('2026-01-01', 2200));
  expect(logs.map((l) => l.logDate)).toEqual(['2026-01-02', '2026-01-01']);
  expect(logs[1].foodCalories).toBe(2200);
});

test('delete leaves a tombstone; re-adding clears it', async () => {
  await store.upsertLog(log('2026-01-01'));
  await store.deleteLog('2026-01-01');
  expect(await store.loadLogs()).toHaveLength(0);
  expect(await store.loadDeleted()).toEqual(['2026-01-01']);
  await store.upsertLog(log('2026-01-01'));
  expect(await store.loadDeleted()).toEqual([]);
});

test('corrupt data does not crash', async () => {
  await AsyncStorage.setItem(store.KEYS.logs, '{broken');
  expect(await store.loadLogs()).toEqual([]);
});

test('clearAll removes everything', async () => {
  await store.saveProfile(profile);
  await store.clearAll();
  expect(await store.loadProfile()).toBeNull();
});
