import type { DailyLog } from '../lib/types';

const ts = (s: string) => {
  const n = Date.parse(s);
  return Number.isNaN(n) ? 0 : n;
};

/** Newest updatedAt wins per date. Returns merged list and local logs that must be pushed. */
export function mergeLogs(local: DailyLog[], remote: DailyLog[], deleted: string[]) {
  const del = new Set(deleted);
  const byDate = new Map<string, DailyLog>();
  for (const r of remote) if (!del.has(r.logDate)) byDate.set(r.logDate, r);

  const toPush: DailyLog[] = [];
  for (const l of local) {
    if (del.has(l.logDate)) continue;
    const r = byDate.get(l.logDate);
    if (!r || ts(l.updatedAt) > ts(r.updatedAt)) {
      byDate.set(l.logDate, l);
      toPush.push(l);
    }
  }
  const merged = [...byDate.values()].sort((a, b) => b.logDate.localeCompare(a.logDate));
  return { merged, toPush };
}
