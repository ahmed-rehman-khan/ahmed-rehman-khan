// Trophies. The one thing the brief asked for that no widget host can still
// provide: github-profile-trophy now answers HTTP 402 on every request, so the
// panel is generated here instead, from the same snapshot every other live panel
// reads.
//
// Two rules keep this from being decoration. First, a rank is a fixed threshold
// written into this file, not a curve fitted to whatever the numbers happen to
// be, so an S is earned and can be lost. Second, no tile repeats a figure the
// numbers panel already shows as a headline counter; each one is either a
// distinction or a personal best, which is what a trophy is supposed to mean.
import { P } from './palette.mjs';
import { ids, defs, ANIM, frame, header, esc } from './kit.mjs';
import { emit } from './light.mjs';
import { load } from './data.mjs';

const [d] = await load();
const id = ids('tr');
const W = 900, M = 16, INNER = W - M * 2;

// Same count the product wall and the numbers panel use, kept as one constant so
// the three can never disagree about how many things are actually reachable.
const LIVE = 5;
const kb = Math.round(d.langs.reduce((a, l) => a + l.b, 0) / 1024);

const ICONS = {
  globe: '<circle r="8"/><path d="M-8 0h16"/><ellipse rx="3.7" ry="8"/>',
  layers: '<path d="M0-7.5l8.2 3.5L0-.5l-8.2-3.5z"/><path d="M-8.2 0L0 3.5 8.2 0"/><path d="M-8.2 4L0 7.5 8.2 4"/>',
  rocket: '<path d="M0-8.5c2.9 2.8 4.4 6.2 4.4 9.5L0 5.5l-4.4-4.5C-4.4-2.3-2.9-5.7 0-8.5z"/><path d="M-4.4 2.5l-2.6 5.5 4.3-1.9M4.4 2.5l2.6 5.5-4.3-1.9"/><circle cy="-2.2" r="1.7"/>',
  grid: '<rect x="-8" y="-8" width="7" height="7" rx="1.6"/><rect x="1" y="-8" width="7" height="7" rx="1.6"/><rect x="-8" y="1" width="7" height="7" rx="1.6"/><rect x="1" y="1" width="7" height="7" rx="1.6"/>',
  bolt: '<path d="M2-8.5L-5.5 1.2h4.2L-2.8 8.5 5.5-1.4H1.2z"/>',
  hub: '<circle r="2.7"/><circle cx="0" cy="-7.6" r="1.8"/><circle cx="6.6" cy="-3.8" r="1.8"/><circle cx="6.6" cy="3.8" r="1.8"/><circle cx="0" cy="7.6" r="1.8"/><circle cx="-6.6" cy="3.8" r="1.8"/><circle cx="-6.6" cy="-3.8" r="1.8"/><path d="M0-2.7v-3.1M2.3-1.4l2.7-1.6M2.3 1.4l2.7 1.6M0 2.7v3.1M-2.3 1.4l-2.7 1.6M-2.3-1.4l-2.7-1.6"/>',
  cap: '<path d="M-9-1.8l9-4.2 9 4.2-9 4.2z"/><path d="M-5 .2v4.2c0 1.7 2.2 2.8 5 2.8s5-1.1 5-2.8V.2"/>',
  case: '<rect x="-8" y="-3.8" width="16" height="11" rx="2"/><path d="M-3-3.8v-2.6h6v2.6"/><path d="M-8 1.2h16"/>',
};

// Thresholds are [S, A, B]. Written down rather than derived, so the rank means
// the same thing next year as it does today, and set where the bar genuinely is
// rather than just below wherever the current figure sits. Most tiles read A on
// purpose: an S that every tile earns on the first render is a participation
// medal, and the panel would be claiming something it has not shown.
const TIERS = { S: P.spark, A: P.accent, B: P.r3, C: P.dim };
const rankOf = (v, [s, a, b]) => (v >= s ? 'S' : v >= a ? 'A' : v >= b ? 'B' : 'C');

const TROPHIES = [
  { icon: 'globe', t: 'POLYGLOT', v: String(d.languages), u: '', ev: 'LANGUAGES SHIPPED BY BYTE COUNT', n: d.languages, th: [12, 8, 5] },
  { icon: 'layers', t: 'VOLUME', v: kb.toLocaleString('en-US'), u: 'KB', ev: 'ACROSS EVERY PUBLIC REPOSITORY', n: kb, th: [750, 400, 200] },
  { icon: 'rocket', t: 'SHIPPER', v: String(LIVE), u: '', ev: 'LIVE DEPLOYMENTS, NOT DEMOS', n: LIVE, th: [8, 5, 3] },
  { icon: 'grid', t: 'PROLIFIC', v: String(d.repos), u: '', ev: 'PUBLIC REPOSITORIES', n: d.repos, th: [20, 10, 5] },
  { icon: 'bolt', t: 'BURST', v: String(d.peakDay.v), u: '', ev: 'CONTRIBUTIONS IN ONE DAY', n: d.peakDay.v, th: [50, 30, 15] },
  { icon: 'hub', t: 'ARCHITECT', v: '6', u: '', ev: 'SURFACES ON ONE BACKEND', n: 6, th: [6, 4, 2] },
  { icon: 'cap', t: 'SCHOLAR', v: '3.87', u: '', ev: 'CGPA · MERIT SCHOLARSHIP', n: 3.87, th: [3.9, 3.7, 3.3] },
  { icon: 'case', t: 'SIMULATED', v: '3', u: '', ev: 'FORTUNE 500 JOB SIMULATIONS', n: 3, th: [5, 4, 3] },
].map((x) => ({ ...x, r: rankOf(x.n, x.th) }));

const COLS = 4, TG = 10, RG = 10;
const TY = 58, TH = 124;
const TW = (INNER - TG * (COLS - 1)) / COLS;
const ROWS = Math.ceil(TROPHIES.length / COLS);
const H = TY + ROWS * TH + (ROWS - 1) * RG + 44;

const tally = ['S', 'A', 'B', 'C']
  .map((r) => [r, TROPHIES.filter((t) => t.r === r).length])
  .filter(([, n]) => n)
  .map(([r, n]) => `${n}×${r}`)
  .join(' · ');

const tiles = TROPHIES.map((t, i) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  const x = M + col * (TW + TG), y = TY + row * (TH + RG);
  const c = TIERS[t.r];
  const delay = (i * 0.68).toFixed(2);
  // How far this figure has run past the S threshold, capped at full. A tile that
  // has already earned S reads as a complete bar rather than an overflowing one.
  const prog = Math.min(1, t.n / t.th[0]);
  const bw = TW - 28;
  return `
<g transform="translate(${x.toFixed(1)} ${y})">
  <rect width="${TW.toFixed(1)}" height="${TH}" rx="11" fill="url(#${id.chip})" stroke="${P.line}"/>
  <rect class="tr" width="${TW.toFixed(1)}" height="${TH}" rx="11" fill="none" stroke="${c}" stroke-opacity=".9" style="animation-delay:${delay}s"/>

  <rect x="14" y="14" width="30" height="30" rx="9" fill="${c}" fill-opacity=".1" stroke="${c}" stroke-opacity=".3"/>
  <g transform="translate(29 29)" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICONS[t.icon]}</g>

  <circle cx="${(TW - 26).toFixed(1)}" cy="29" r="13" fill="${c}" fill-opacity=".13" stroke="${c}" stroke-opacity=".6"/>
  <circle class="halo" cx="${(TW - 26).toFixed(1)}" cy="29" r="13" fill="none" stroke="${c}" stroke-width="1.1" style="transform-origin:${(TW - 26).toFixed(1)}px 29px;animation-delay:${delay}s"/>
  <text class="sans" x="${(TW - 26).toFixed(1)}" y="34" font-size="14" font-weight="700" fill="${c}" text-anchor="middle">${t.r}</text>

  <text class="sans" x="14" y="80" font-size="25" font-weight="700" letter-spacing="-.8" fill="${P.text}">${t.v}${t.u ? `<tspan class="mono" font-size="10.5" font-weight="400" letter-spacing="0" fill="${P.dim}"> ${t.u}</tspan>` : ''}</text>
  <text class="mono" x="14" y="97" font-size="9" letter-spacing="1.3" font-weight="600" fill="${c}">${esc(t.t)}</text>
  <text class="mono" x="14" y="109" font-size="7.4" letter-spacing=".9" fill="${P.dimmer}">${esc(t.ev)}</text>

  <rect x="14" y="${TH - 8}" width="${bw.toFixed(1)}" height="3.5" rx="1.75" fill="${P.rule}"/>
  <rect x="14" y="${TH - 8}" width="${(bw * prog).toFixed(1)}" height="3.5" rx="1.75" fill="${c}"/>
</g>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Trophies, ranked against fixed thresholds rather than a curve. ${TROPHIES.map((t) => `${t.t}, rank ${t.r}: ${t.v}${t.u ? ` ${t.u}` : ''} ${t.ev.toLowerCase()}`).join('. ')}. Overall ${tally}.">
<defs>${defs(id, W, H)}</defs>
<style>${ANIM}
  .tr{opacity:0;animation:tr 6.4s ease-in-out infinite}
  @keyframes tr{0%{opacity:0}4%{opacity:1}15%{opacity:1}21%{opacity:0}100%{opacity:0}}
</style>
${frame(id, W, H)}
${header(M + 6, W - 6, 'EARNED AGAINST FIXED THRESHOLDS · NOT A CURVE', tally, 34)}
${tiles}
<path d="M${M} ${H - 30}h${INNER}" stroke="${P.line}"/>
<text class="mono" x="${M + 6}" y="${H - 13}" font-size="7.8" letter-spacing="1" fill="${P.dimmer}">THE BAR UNDER EACH TILE IS DISTANCE TO THE S THRESHOLD · A RANK CAN BE LOST, WHICH IS WHAT MAKES IT WORTH SHOWING</text>
<text class="mono" x="${W - M - 6}" y="${H - 13}" font-size="7.8" letter-spacing="1" fill="${P.dimmer}" text-anchor="end">SYNCED ${d.synced} UTC</text>
</svg>
`;

console.log(`trophies  ${W}x${H}  ${TROPHIES.length} tiles · ${tally}  ${emit('trophies', svg)}B`);
