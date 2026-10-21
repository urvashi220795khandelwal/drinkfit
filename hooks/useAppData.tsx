import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as store from '../lib/storage';
import { supabase } from '../lib/supabase';
import { syncAll } from '../services/sync';
import { DEFAULT_PREFS, type DailyLog, type Prefs, type Profile } from '../lib/types';

export type SyncState = 'idle' | 'syncing' | 'ok' | 'error';

interface AppData {
  ready: boolean;
  profile: Profile | null;
  logs: DailyLog[];
  prefs: Prefs;
  session: Session | null;
  syncState: SyncState;
  saveProfile: (p: Omit<Profile, 'updatedAt'>) => Promise<void>;
  saveLog: (l: Omit<DailyLog, 'updatedAt'>) => Promise<void>;
  removeLog: (date: string) => Promise<void>;
  setPrefs: (p: Prefs) => Promise<void>;
  syncNow: () => Promise<void>;
  resetLocal: () => Promise<void>;
}

const Ctx = createContext<AppData | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [session, setSession] = useState<Session | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const syncing = useRef(false);

  useEffect(() => {
    (async () => {
      const [p, l, pr] = await Promise.all([store.loadProfile(), store.loadLogs(), store.loadPrefs()]);
      setProfile(p);
      setLogs(l);
      setPrefsState(pr);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const syncNow = useCallback(async () => {
    if (!supabase || !session || syncing.current) return;
    syncing.current = true;
    setSyncState('syncing');
    try {
      const [p, l, d] = await Promise.all([store.loadProfile(), store.loadLogs(), store.loadDeleted()]);
      const res = await syncAll(session.user, p, l, d);
      if (res.profile) {
        await store.saveProfile(res.profile);
        setProfile(res.profile);
      }
      setLogs(await store.replaceLogs(res.logs));
      await store.forgetDeleted(d);
      setSyncState('ok');
    } catch (e) {
      console.warn('Sync failed', e);
      setSyncState('error'); // local data stays untouched
    } finally {
      syncing.current = false;
    }
  }, [session]);

  useEffect(() => {
    if (ready && session) void syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session?.user.id]);

  const saveProfile = useCallback(
    async (p: Omit<Profile, 'updatedAt'>) => {
      const full: Profile = { ...p, updatedAt: new Date().toISOString() };
      await store.saveProfile(full);
      setProfile(full);
      if (session) void syncNow();
    },
    [session, syncNow],
  );

  const saveLog = useCallback(
    async (l: Omit<DailyLog, 'updatedAt'>) => {
      setLogs(await store.upsertLog({ ...l, updatedAt: new Date().toISOString() }));
      if (session) void syncNow();
    },
    [session, syncNow],
  );

  const removeLog = useCallback(
    async (date: string) => {
      setLogs(await store.deleteLog(date));
      if (session) void syncNow();
    },
    [session, syncNow],
  );

  const setPrefs = useCallback(async (p: Prefs) => {
    await store.savePrefs(p);
    setPrefsState(p);
  }, []);

  const resetLocal = useCallback(async () => {
    await store.clearAll();
    setProfile(null);
    setLogs([]);
    setPrefsState(DEFAULT_PREFS);
  }, []);

  return (
    <Ctx.Provider
      value={{ ready, profile, logs, prefs, session, syncState, saveProfile, saveLog, removeLog, setPrefs, syncNow, resetLocal }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppData {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}
