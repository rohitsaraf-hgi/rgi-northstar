// Market Report snapshot store.
//
// Reports are snapshots — frozen at generation time (per JTBD answer #3).
// A "refresh" button recomputes and updates the snapshot in place, bumping
// lastRefreshedAt. Historical comparisons compare snapshot to snapshot.

import { generateReport } from './marketReport.js';

const STORAGE_KEY = 'rgi-market-reports';
const subscribers = new Set();
const notify = () => subscribers.forEach((cb) => { try { cb(); } catch { /* isolate */ } });

function readAll() {
  if (typeof window === 'undefined') return seedReports();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedReports();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seedReports();
  }
}

function writeAll(list) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  notify();
}

// Seed data — one saved report on first visit so the list isn't empty.
function seedReports() {
  const nowIso = new Date('2026-08-19').toISOString();
  const snapshot = generateReport(
    ['sp-cnapp-readiness', 'sp-displacement-fit', 'sp-budget-fit'],
    { name: 'FY26 GTM plays — market analysis' }
  );
  return [
    {
      id: 'rpt_seed_fy26',
      name: 'FY26 GTM plays — market analysis',
      scoringProfileIds: snapshot.scoringProfileIds,
      snapshot,
      createdAt: nowIso,
      lastRefreshedAt: nowIso,
      ownerId: 'priya',
      ownerName: 'Priya Sharma',
    },
  ];
}

// ─── Public ─────────────────────────────────────────────────────────
export function listReports() {
  return readAll().sort((a, b) => new Date(b.lastRefreshedAt) - new Date(a.lastRefreshedAt));
}

export function getReport(id) {
  return readAll().find((r) => r.id === id) || null;
}

export function saveReport({ name, scoringProfileIds }) {
  const snapshot = generateReport(scoringProfileIds, { name });
  const nowIso = new Date('2026-08-20').toISOString();
  const report = {
    id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name || snapshot.name,
    scoringProfileIds,
    snapshot,
    createdAt: nowIso,
    lastRefreshedAt: nowIso,
    ownerId: 'priya',
    ownerName: 'Priya Sharma',
  };
  writeAll([report, ...readAll()]);
  return report;
}

// Recompute snapshot in place, bump lastRefreshedAt.
export function refreshReport(id) {
  const list = readAll();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const existing = list[idx];
  const snapshot = generateReport(existing.scoringProfileIds, { name: existing.name });
  const nowIso = new Date('2026-08-20').toISOString();
  const next = { ...existing, snapshot, lastRefreshedAt: nowIso };
  const nextList = list.map((r, i) => (i === idx ? next : r));
  writeAll(nextList);
  return next;
}

export function renameReport(id, name) {
  const list = readAll();
  const nextList = list.map((r) => (r.id === id ? { ...r, name } : r));
  writeAll(nextList);
}

export function deleteReport(id) {
  writeAll(readAll().filter((r) => r.id !== id));
}

export function subscribeReports(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}
