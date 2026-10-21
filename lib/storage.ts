import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PREFS, type DailyLog, type Prefs, type Profile } from './types';

export const KEYS = {
  profile: 'drinkfit:profile',
  logs: 'drinkfit:logs',
  deleted: 'drinkfit:deleted',
  prefs: 'drinkfit:prefs',
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const writeJson = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value));
const sortLogs = (logs: DailyLog[]) => [...logs].sort((a, b) => b.logDate.localeCompare(a.logDate));

export const loadProfile = () => readJson<Profile | null>(KEYS.profile, null);
export const saveProfile = (p: Profile) => writeJson(KEYS.profile, p);

export async function loadLogs(): Promise<DailyLog[]> {
  const logs = await readJson<DailyLog[]>(KEYS.logs, []);
  return Array.isArray(logs) ? sortLogs(logs) : [];
}

export async function replaceLogs(logs: DailyLog[]): Promise<DailyLog[]> {
  const sorted = sortLogs(logs);
  await writeJson(KEYS.logs, sorted);
  return sorted;
}

export async function loadDeleted(): Promise<string[]> {
  const d = await readJson<string[]>(KEYS.deleted, []);
  return Array.isArray(d) ? d : [];
}

export async function forgetDeleted(dates: string[]): Promise<void> {
  const d = await loadDeleted();
  await writeJson(KEYS.deleted, d.filter((x) => !dates.includes(x)));
}

export async function upsertLog(log: DailyLog): Promise<DailyLog[]> {
  const logs = await loadLogs();
  const deleted = await loadDeleted();
  if (deleted.includes(log.logDate)) await writeJson(KEYS.deleted, deleted.filter((d) => d !== log.logDate));
  return replaceLogs([log, ...logs.filter((l) => l.logDate !== log.logDate)]);
}

export async function deleteLog(date: string): Promise<DailyLog[]> {
  const logs = await loadLogs();
  const deleted = await loadDeleted();
  if (!deleted.includes(date)) await writeJson(KEYS.deleted, [...deleted, date]);
  return replaceLogs(logs.filter((l) => l.logDate !== date));
}

export async function loadPrefs(): Promise<Prefs> {
  return { ...DEFAULT_PREFS, ...(await readJson<Partial<Prefs>>(KEYS.prefs, {})) };
}
export const savePrefs = (p: Prefs) => writeJson(KEYS.prefs, p);

export const clearAll = () => AsyncStorage.multiRemove(Object.values(KEYS));
