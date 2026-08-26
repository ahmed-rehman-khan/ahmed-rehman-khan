// Cadence. Two views of time: the real 53-week contribution calendar with a
// weekday breakdown, and a build timeline showing each repository's active
// window from creation to last push.
//
// This replaces the snake animation that used to sit here. The snake was a
// third-party action publishing to a separate branch, which is two failure
// points for a picture that says less than the calendar it was eating.
//
// The framing is deliberate. 53 active days out of 368 with a longest streak of
// four is a poor daily-streak story, but 297 contributions across those 53 days
// is 5.6 per active day and a 55-contribution peak. The honest description of
// that shape is concentrated bursts, so that is what the panel measures.
import { P } from './palette.mjs';
import { ids, defs, ANIM, frame, header, esc } from './kit.mjs';
import { emit } from './light.mjs';
import { load } from './data.mjs';

const [d] = await load();
const id = ids('cd');
const W = 900, M = 16, INNER = W - M * 2;

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// ---- band A: the calendar ---------------------------------------------------

const GX = 42, GY = 82, CELL = 13, VGAP = 3, STEP = (INNER - (GX - M)) / d.cal.length;
const GRID_H = 7 * (CELL + VGAP);

// Four filled buckets. Opacity steps on one accent rather than four new colours,
// so the light variant needs no extra palette entries.
const BUCKET = (v) => {
  if (v === 0) return { f: P.line, o: 0.55 };
  if (v <= 2) return { f: P.accent, o: 0.32 };
  if (v <= 7) return { f: P.accent, o: 0.58 };
  if (v <= 18) return { f: P.accent, o: 0.85 };
  return { f: P.spark, o: 1 };
};

const cells = d.cal.flatMap((col, ci) => col.map((v, ri) => {
  if (v === null) return '';
  const b = BUCKET(v);
  const x = GX + ci * STEP, y = GY + ri * (CELL + VGAP);
  const top = v > 18;
  return `<rect x="${x.toFixed(2)}" y="${y.toFixed(1)}" width="${CELL}" height="${CELL}" rx="3" fill="${b.f}" fill-opacity="${b.o}"/>${top ? `\n<rect class="hot" x="${x.toFixed(2)}" y="${y.toFixed(1)}" width="${CELL}" height="${CELL}" rx="3" fill="none" stroke="${P.spark}" style="animation-delay:${(ci * 0.06).toFixed(2)}s"/>` : ''}`;
})).join('\n');

// One label per month change, skipping the first column so it cannot clip.
let seenM = '';
const monthLabels = d.weekStarts.map((s, i) => {
  if (!s) return '';
  const m = s.slice(0, 7);
  if (m === seenM) return '';
  seenM = m;
  if (i === 0 || i > d.cal.length - 2) return '';
  return `<text x="${(GX + i * STEP).toFixed(1)}" y="76">${MON[Number(s.slice(5, 7)) - 1]}</text>`;
}).join('');

const dayLabels = [1, 3, 5].map((r) => `<text x="${GX - 7}" y="${(GY + r * (CELL + VGAP) + 9.5).toFixed(1)}" text-anchor="end">${DAYS[r]}</text>`).join('');

// Sweep: a column-wide highlight travelling left to right across the year.
const sweep = `<rect class="sweep" x="${GX}" y="${GY - 3}" width="${(STEP * 1.6).toFixed(1)}" height="${(GRID_H + 2).toFixed(1)}" rx="4" fill="${P.spark}" fill-opacity=".1"/>`;

// Weekday distribution.
const WY = GY + GRID_H + 34, WBH = 30;
const wdMax = Math.max(...d.weekday);
const wdW = 26, wdG = 6;
const weekdayBars = d.weekday.map((v, i) => {
  const x = GX + i * (wdW + wdG);
  const h = Math.max(2, (v / wdMax) * WBH);
  const peak = v === wdMax;
  // A label above a full-height bar collides with the band heading, so once a
  // bar is tall enough to hold its own number the number moves inside it.
  const tall = h >= 18;
  const vy = tall ? WY + WBH - h + 11 : WY + WBH - h - 4;
  const vf = tall ? (peak ? P.card2 : P.text) : (peak ? P.spark : P.dimmer);
  return `<rect x="${x}" y="${(WY + WBH - h).toFixed(1)}" width="${wdW}" height="${h.toFixed(1)}" rx="3" fill="${peak ? P.spark : P.accent}" fill-opacity="${peak ? 1 : 0.42}"/>
<rect class="wd" x="${x}" y="${(WY + WBH - h).toFixed(1)}" width="${wdW}" height="${h.toFixed(1)}" rx="3" fill="none" stroke="${peak ? P.spark : P.accent}" style="animation-delay:${(i * 0.42).toFixed(2)}s"/>
<text class="mono" x="${x + wdW / 2}" y="${WY + WBH + 11}" font-size="7.5" letter-spacing=".5" fill="${peak ? P.spark : P.dimmer}" text-anchor="middle">${DAYS[i].slice(0, 1)}</text>
<text class="mono" x="${x + wdW / 2}" y="${vy.toFixed(1)}" font-size="7.5" fill="${vf}" text-anchor="middle">${v}</text>`;
}).join('\n');

const legend = [0, 2, 7, 18, 30].map((v, i) => {
  const b = BUCKET(v);
  return `<rect x="${W - M - 118 + i * 17}" y="${WY + WBH - 10}" width="11" height="11" rx="3" fill="${b.f}" fill-opacity="${b.o}"/>`;
}).join('');

const heaviest = DAYS[d.weekday.indexOf(wdMax)];

// ---- band B: the build timeline ---------------------------------------------

const RULE = WY + WBH + 30;
const LY = RULE + 58, ROW = 15;
const NX = 132, AX = NX + 12, AW = W - M - AX;

const day = (s) => Math.floor(Date.parse(`${s}T00:00:00Z`) / 864e5);
const repos = [...d.repoList].sort((a, b) => (a.created < b.created ? 1 : -1));
const t0 = day(`${repos.at(-1).created.slice(0, 7)}-01`);
const lastPush = repos.reduce((a, r) => (r.pushed > a ? r.pushed : a), '');
const endM = Number(lastPush.slice(5, 7)) % 12 + 1;
const endY = Number(lastPush.slice(0, 4)) + (endM === 1 ? 1 : 0);
const t1 = day(`${endY}-${String(endM).padStart(2, '0')}-01`);
const span = t1 - t0;
const px = (s) => AX + ((day(s) - t0) / span) * AW;

// Month gridlines across the whole window.
const ticks = [];
for (let y = Number(repos.at(-1).created.slice(0, 4)), m = Number(repos.at(-1).created.slice(5, 7)); ;) {
  const iso = `${y}-${String(m).padStart(2, '0')}-01`;
  if (day(iso) > t1) break;
  if (day(iso) >= t0) ticks.push({ iso, m, y });
  m++; if (m > 12) { m = 1; y++; }
}

const gridlines = ticks.map((t) => `<path d="M${px(t.iso).toFixed(1)} ${LY - 14}V${(LY + repos.length * ROW).toFixed(1)}" stroke="${P.line}" stroke-opacity="${t.m === 1 ? '1' : '.55'}"/>`).join('\n');
const axisLabels = ticks.map((t) => `<text x="${px(t.iso).toFixed(1)}" y="${LY - 18}" font-size="7.2" letter-spacing=".6" fill="${t.m === 1 ? P.accent : P.dimmer}" text-anchor="middle">${t.m === 1 ? `${MON[t.m - 1]} ${t.y}` : MON[t.m - 1]}</text>`).join('');

const lanes = repos.map((r, i) => {
  const y = LY + i * ROW;
  const x1 = px(r.created), x2 = Math.max(px(r.pushed), x1 + 5);
  const w = x2 - x1;
  return `<path d="M${AX} ${y + 7.5}H${W - M}" stroke="${P.line}" stroke-opacity=".4"/>
<rect x="${x1.toFixed(1)}" y="${y + 3}" width="${w.toFixed(1)}" height="9" rx="4.5" fill="${P.accent}" fill-opacity=".28"/>
<rect class="lane" x="${x1.toFixed(1)}" y="${y + 3}" width="${w.toFixed(1)}" height="9" rx="4.5" fill="none" stroke="${P.accent}" style="animation-delay:${(i * 0.34).toFixed(2)}s"/>
<circle cx="${x1.toFixed(1)}" cy="${y + 7.5}" r="2.6" fill="${P.accent}"/>
<circle cx="${x2.toFixed(1)}" cy="${y + 7.5}" r="2.6" fill="${P.spark}"/>
<circle class="halo" cx="${x2.toFixed(1)}" cy="${y + 7.5}" r="2.6" fill="none" stroke="${P.spark}" stroke-width="1" style="transform-origin:${x2.toFixed(1)}px ${y + 7.5}px;animation-delay:${(i * 0.34).toFixed(2)}s"/>
<text class="mono" x="${NX}" y="${y + 11}" font-size="8.2" fill="${P.dim}" text-anchor="end">${esc(r.name)}</text>`;
}).join('\n');

const H = LY + repos.length * ROW + 44;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cadence. Contribution calendar across ${d.totalDays} days: ${d.contributions} contributions on ${d.activeDays} active days, averaging ${(d.contributions / d.activeDays).toFixed(1)} per active day, with a busiest single day of ${d.peakDay.v}. Heaviest weekday is ${heaviest} with ${wdMax} contributions. Build timeline showing the active window of all ${repos.length} public repositories from creation to last push, newest first: ${repos.map((r) => `${r.name} ${r.created} to ${r.pushed}`).join(', ')}.">
<defs>${defs(id, W, H)}</defs>
<style>${ANIM}
  .hot{opacity:0;animation:hot 4.4s ease-in-out infinite}
  @keyframes hot{0%{opacity:0}10%{opacity:1}30%{opacity:1}42%{opacity:0}100%{opacity:0}}
  .sweep{animation:sw 14s linear infinite}
  @keyframes sw{0%{transform:translateX(0)}100%{transform:translateX(${(INNER - (GX - M) - STEP * 1.6).toFixed(0)}px)}}
  .wd{opacity:0;animation:wd 4.6s ease-in-out infinite}
  @keyframes wd{0%{opacity:0}8%{opacity:1}24%{opacity:1}34%{opacity:0}100%{opacity:0}}
  .lane{opacity:0;animation:lane 6.4s ease-in-out infinite}
  @keyframes lane{0%{opacity:0}6%{opacity:1}18%{opacity:1}26%{opacity:0}100%{opacity:0}}
</style>
${frame(id, W, H)}
${header(M + 6, W, 'CONCENTRATED BURSTS · NOT A DAILY STREAK', `${d.contributions} IN ${d.activeDays} ACTIVE DAYS · ${(d.contributions / d.activeDays).toFixed(1)} PER DAY`, 34)}

<text class="mono" x="${M + 6}" y="62" font-size="9" letter-spacing="1.5" fill="${P.mid}">CONTRIBUTION CALENDAR · LAST ${d.totalDays} DAYS</text>
<text class="mono" x="${W - M - 6}" y="62" font-size="9" letter-spacing="1.1" fill="${P.accent}" text-anchor="end">BUSIEST DAY ${d.peakDay.v} · BUSIEST WEEK ${d.peakWeek}</text>
<g class="mono" font-size="7.6" letter-spacing=".9" fill="${P.dimmer}">${monthLabels}${dayLabels}</g>
${cells}
${sweep}

<text class="mono" x="${M + 6}" y="${WY - 8}" font-size="8.5" letter-spacing="1.4" fill="${P.dimmer}">BY WEEKDAY · ${heaviest} CARRIES ${Math.round((wdMax / d.contributions) * 100)}% OF THE YEAR</text>
${weekdayBars}
<text class="mono" x="${W - M - 124}" y="${WY + WBH}" font-size="7.5" letter-spacing=".9" fill="${P.dimmer}" text-anchor="end">LESS</text>
${legend}
<text class="mono" x="${W - M}" y="${WY + WBH}" font-size="7.5" letter-spacing=".9" fill="${P.dimmer}" text-anchor="end">MORE</text>

<path d="M${M} ${RULE}h${INNER}" stroke="${P.line}"/>
<text class="mono" x="${M + 6}" y="${RULE + 20}" font-size="9" letter-spacing="1.5" fill="${P.mid}">BUILD TIMELINE · EVERY REPOSITORY FROM CREATION TO LAST PUSH</text>
<text class="mono" x="${W - M - 6}" y="${RULE + 20}" font-size="9" letter-spacing="1.1" fill="${P.accent}" text-anchor="end">${repos.length} REPOSITORIES · NEWEST FIRST</text>
<g class="mono">${axisLabels}</g>
${gridlines}
${lanes}
<path d="M${AX} ${LY + repos.length * ROW}H${W - M}" stroke="${P.rule}"/>
<text class="mono" x="${M + 6}" y="${H - 13}" font-size="7.8" letter-spacing="1" fill="${P.dimmer}">SOLID DOT IS CREATION · GLOWING DOT IS LAST PUSH · A LONG BAR MEANS A REPOSITORY STILL BEING MAINTAINED</text>
<text class="mono" x="${W - M - 6}" y="${H - 13}" font-size="7.8" letter-spacing="1" fill="${P.dimmer}" text-anchor="end">SYNCED ${d.synced} UTC</text>
</svg>
`;

console.log(`cadence  ${W}x${H}  ${d.cal.length}w calendar · ${repos.length} lanes  ${emit('cadence', svg)}B`);
