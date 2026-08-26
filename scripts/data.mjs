// One fetch pass for every live panel. Writes assets/signals.json, which the
// signals, numbers and cadence generators then read. Doing it this way means a
// rebuild hits the GitHub API once rather than three times, and means a fetch
// failure degrades to the last good snapshot for all three panels together
// instead of leaving them inconsistent with each other.
//
//   node scripts/data.mjs
//
// GITHUB_TOKEN is optional and only raises the REST rate limit.

import { readFileSync, writeFileSync } from 'node:fs';

export const USER = 'ahmed-rehman-khan';
export const STATE = 'assets/signals.json';

const UA = { 'User-Agent': 'signals-generator', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) UA.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function json(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

// The contribution calendar at /users/<login>/contributions is public HTML with
// no auth. Each day cell carries its date plus a grid id of row-column, where
// row is the weekday and column is the week. The paired tool-tip carries the
// count, so the two together give a full day-level grid.
async function calendar() {
  const r = await fetch(`https://github.com/users/${USER}/contributions`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!r.ok) throw new Error(`calendar ${r.status}`);
  const html = await r.text();

  const counts = new Map();
  const tip = /for="contribution-day-component-(\d+)-(\d+)"[^>]*>([^<]*)</g;
  for (let m; (m = tip.exec(html)); ) {
    const n = /^(\d+)\s+contribution/.exec(m[3].trim());
    counts.set(`${m[1]}-${m[2]}`, n ? Number(n[1]) : 0);
  }

  const cells = [];
  const cell = /<td[^>]*data-date="(\d{4}-\d\d-\d\d)"[^>]*id="contribution-day-component-(\d+)-(\d+)"/g;
  for (let m; (m = cell.exec(html)); ) {
    cells.push({ date: m[1], row: Number(m[2]), col: Number(m[3]), v: counts.get(`${m[2]}-${m[3]}`) ?? 0 });
  }
  if (!cells.length) throw new Error('calendar parsed zero cells');
  return cells;
}

function derive(cells) {
  const cols = Math.max(...cells.map((c) => c.col)) + 1;
  // Column-major grid of 7 rows, null where the year does not cover the cell.
  const cal = Array.from({ length: cols }, () => Array(7).fill(null));
  for (const c of cells) cal[c.col][c.row] = c.v;

  const ordered = [...cells].sort((a, b) => (a.date < b.date ? -1 : 1));
  const total = ordered.reduce((a, c) => a + c.v, 0);
  const active = ordered.filter((c) => c.v > 0).length;

  let longest = 0, run = 0, current = 0;
  for (const c of ordered) {
    run = c.v > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  for (let i = ordered.length - 1; i >= 0 && ordered[i].v > 0; i--) current++;

  const weekday = Array(7).fill(0);
  for (const c of ordered) weekday[c.row] += c.v;

  const weeks = cal.map((col) => col.reduce((a, v) => a + (v ?? 0), 0));
  const weekStarts = cal.map((col, i) => (cells.find((c) => c.col === i)?.date ?? ''));

  const monthMap = new Map();
  for (const c of ordered) {
    const k = c.date.slice(0, 7);
    monthMap.set(k, (monthMap.get(k) ?? 0) + c.v);
  }

  const peakDay = ordered.reduce((a, c) => (c.v > a.v ? c : a), ordered[0]);

  return {
    cal, weeks, weekStarts, weekday,
    months: [...monthMap.entries()].map(([m, v]) => ({ m, v })),
    contributions: total,
    activeDays: active,
    totalDays: ordered.length,
    longestStreak: longest,
    currentStreak: current,
    peakWeek: Math.max(...weeks),
    peakDay: { date: peakDay.date, v: peakDay.v },
  };
}

export async function collect() {
  const repos = (await json(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`))
    .filter((r) => !r.fork);

  // Language bytes, with this profile repo excluded. It holds generated HTML for
  // the README itself, which would otherwise dominate the totals and describe
  // him as an HTML developer.
  const bytes = new Map();
  const seen = new Set();
  let failed = 0;
  for (const r of repos) {
    try {
      const langs = await json(r.languages_url);
      for (const [k, b] of Object.entries(langs)) {
        if (b <= 0) continue;
        seen.add(k);
        if (r.name === USER) continue;
        bytes.set(k, (bytes.get(k) ?? 0) + b);
      }
    } catch { failed++; }
  }

  // Fail closed. A partially fetched language map is worse than a stale one,
  // because it silently drops whole languages and then publishes a composition
  // bar that understates the work. This is not hypothetical: a rate-limited run
  // cut eight languages to six and lost 148 KB of code without any error.
  if (failed) throw new Error(`${failed} of ${repos.length} language fetches failed`);

  const cal = derive(await calendar());

  return {
    ...cal,
    repos: repos.length,
    languages: seen.size,
    pushed: repos.reduce((a, r) => (r.pushed_at > a ? r.pushed_at : a), ''),
    langs: [...bytes.entries()].sort((a, b) => b[1] - a[1]).map(([k, b]) => ({ k, b })),
    repoList: repos
      .map((r) => ({ name: r.name, created: r.created_at.slice(0, 10), pushed: r.pushed_at.slice(0, 10) }))
      .sort((a, b) => (a.created < b.created ? -1 : 1)),
    synced: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
}

export function snapshot() {
  return JSON.parse(readFileSync(STATE, 'utf8'));
}

// A snapshot written by an older version of this file will parse fine and then
// crash a panel halfway through drawing, or worse, render a panel with silently
// missing series. Check the shape before trusting it as a fallback.
const REQUIRED = ['cal', 'langs', 'repoList', 'weekday', 'months', 'contributions', 'peakDay'];

export function usable(d) {
  if (!d || REQUIRED.some((k) => d[k] === undefined || d[k] === null)) return false;
  return d.cal.length > 0 && d.langs.length > 0 && d.repoList.length > 0 && d.weekday.length === 7;
}

// Memoised, so that a build importing several panel generators makes exactly one
// fetch pass. Without this each panel would fetch for itself, which is three
// times the rate limit spent to draw the same numbers three ways.
let cached = null;

// Set by build.mjs when it is not refreshing. A local rebuild of the visuals
// should not spend rate limit or overwrite the snapshot.
const OFFLINE = process.env.SIGNALS_OFFLINE === '1';

// Fetch fresh, and fall back to the committed snapshot rather than publishing a
// broken panel. Returns [data, isFresh].
export async function load() {
  if (cached) return cached;
  let prev = null;
  try {
    const p = snapshot();
    if (usable(p)) prev = p;
    else console.error('snapshot on disk is stale or incomplete, ignoring it as a fallback');
  } catch { /* first run */ }

  if (OFFLINE) {
    if (!prev) throw new Error('offline build with no usable snapshot on disk');
    return (cached = [prev, false]);
  }

  try {
    const data = await collect();
    writeFileSync(STATE, `${JSON.stringify(data)}\n`);
    return (cached = [data, true]);
  } catch (e) {
    if (!prev) throw e;
    console.error(`fetch failed (${e.message}), reusing last snapshot from ${prev.synced}`);
    return (cached = [prev, false]);
  }
}
