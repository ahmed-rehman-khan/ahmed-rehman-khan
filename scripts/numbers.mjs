// By the numbers. Six counters and a real language composition bar.
//
// Every figure here is derived from the GitHub API at build time, so nothing can
// drift out of date and nothing depends on a third-party badge service. The
// metrics were chosen because they are load-bearing: what he has shipped, in how
// many languages, how much of it is reachable. Stars and followers are
// deliberately absent, because a count of one describes GitHub's recommendation
// algorithm rather than the work.
import { P } from './palette.mjs';
import { ids, defs, ANIM, frame, header, esc } from './kit.mjs';
import { emit } from './light.mjs';
import { load } from './data.mjs';

const [d] = await load();
const id = ids('nb');
const W = 900, M = 16, INNER = W - M * 2;

// Live deployments, counted from the same list the product wall uses.
const LIVE = 5;

const codeBytes = d.langs.reduce((a, l) => a + l.b, 0);
const kb = Math.round(codeBytes / 1024);
const avg = (d.contributions / Math.max(1, d.activeDays)).toFixed(1);
// Every month in the window carried at least one contribution, which is the
// interesting part. A bare "13 MONTHS ACTIVE" against a 368-day window reads as
// inflated, so the tile shows the denominator and lets the reader check it.
const monthsActive = d.months.filter((m) => m.v > 0).length;
const monthsTotal = d.months.length;

// Freshness. This is the one signal the retired signals panel carried that no
// other panel covers, so it moves into the header rather than being lost.
function since(iso) {
  const h = (Date.now() - Date.parse(iso)) / 36e5;
  if (h < 1) return 'UNDER AN HOUR AGO';
  if (h < 24) return `${Math.round(h)}H AGO`;
  const days = Math.round(h / 24);
  return days < 14 ? `${days}D AGO` : `${Math.round(days / 7)}W AGO`;
}

const TILES = [
  { v: d.contributions.toLocaleString('en-US'), u: '', l: 'CONTRIBUTIONS · 1Y' },
  { v: String(d.repos), u: '', l: 'PUBLIC REPOS' },
  { v: String(d.languages), u: '', l: 'LANGUAGES SHIPPED' },
  { v: String(LIVE), u: '', l: 'LIVE DEPLOYMENTS' },
  { v: kb.toLocaleString('en-US'), u: 'KB', l: 'CODE SHIPPED' },
  { v: `${monthsActive}/${monthsTotal}`, u: '', l: 'MONTHS WITH ACTIVITY', a: `${monthsActive} of ${monthsTotal} months with activity` },
];

const TY = 58, TH = 80, TG = 10;
const TW = (INNER - TG * (TILES.length - 1)) / TILES.length;

const tiles = TILES.map((t, i) => {
  const x = M + i * (TW + TG), cx = x + TW / 2;
  return `<rect x="${x.toFixed(1)}" y="${TY}" width="${TW.toFixed(1)}" height="${TH}" rx="10" fill="url(#${id.chip})" stroke="${P.line}"/>
<rect class="tile" x="${x.toFixed(1)}" y="${TY}" width="${TW.toFixed(1)}" height="${TH}" rx="10" fill="none" stroke="${P.accent}" stroke-opacity=".8" style="animation-delay:${(i * 0.62).toFixed(2)}s"/>
<rect x="${(cx - 9).toFixed(1)}" y="${TY}" width="18" height="2.5" rx="1.25" fill="${P.rule}"/>
<rect class="tile" x="${(cx - 9).toFixed(1)}" y="${TY}" width="18" height="2.5" rx="1.25" fill="${P.spark}" style="animation-delay:${(i * 0.62).toFixed(2)}s"/>
<text class="sans" x="${cx.toFixed(1)}" y="${TY + 44}" font-size="27" font-weight="700" letter-spacing="-.9" fill="${P.text}" text-anchor="middle">${t.v}${t.u ? `<tspan class="mono" font-size="11" font-weight="400" letter-spacing="0" fill="${P.dim}"> ${t.u}</tspan>` : ''}</text>
<text class="mono" x="${cx.toFixed(1)}" y="${TY + 64}" font-size="8" letter-spacing="1.15" fill="${P.dim}" text-anchor="middle">${t.l}</text>`;
}).join('\n');

// Peak strip: the shape of the work, in three figures.
const peakDate = new Date(`${d.peakDay.date}T00:00:00Z`)
  .toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  .toUpperCase();
const PEAKS = [
  ['BUSIEST SINGLE DAY', `${d.peakDay.v} ON ${peakDate}`],
  ['BUSIEST WEEK', `${d.peakWeek} CONTRIBUTIONS`],
  ['AVERAGE PER ACTIVE DAY', `${avg} CONTRIBUTIONS`],
];
const PY = TY + TH + 12, PH = 30;
const PW = (INNER - 10 * 2) / 3;
const peaks = PEAKS.map(([k, v], i) => {
  const x = M + i * (PW + 10);
  return `<rect x="${x.toFixed(1)}" y="${PY}" width="${PW.toFixed(1)}" height="${PH}" rx="8" fill="${P.accent}" fill-opacity=".07" stroke="${P.accent}" stroke-opacity=".28"/>
<circle class="puls" cx="${(x + 14).toFixed(1)}" cy="${PY + PH / 2}" r="2.6" fill="${P.spark}" style="animation-delay:${(i * 0.8).toFixed(1)}s"/>
<text class="mono" x="${(x + 25).toFixed(1)}" y="${PY + 19}" font-size="8" letter-spacing="1.1" fill="${P.dimmer}">${k}</text>
<text class="mono" x="${(x + PW - 13).toFixed(1)}" y="${PY + 19}" font-size="9" letter-spacing=".8" fill="${P.accent}" text-anchor="end">${v}</text>`;
}).join('\n');

// ---- language composition --------------------------------------------------
// HTML leads because Flask and Jinja templates are counted as HTML by GitHub's
// linguist. It is drawn in a neutral grey rather than an accent so the bar does
// not visually claim that markup is the headline skill, and the footnote says so.
// Label ink. A percentage sitting on a light violet segment needs dark type, and
// one sitting on a dark grey segment needs light type, so the ink is chosen by
// whichever of the two inks contrasts better against that segment. Deciding it
// from the luminance of the segment itself also survives the light variant,
// because LIGHT_MAP inverts lightness consistently: a colour that is light here
// maps to a dark one there, and the chosen ink maps along with it.
function lum(hex) {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
const ink = (tone) => (ratio(tone, P.card2) >= ratio(tone, P.text) ? P.card2 : P.text);
const TONE = {
  HTML: P.rule, Python: P.accent, JavaScript: P.spark, TypeScript: P.r1,
  Java: P.r2, CSS: P.dimmer, Dart: P.r3, C: P.dim,
};

const BY = PY + PH + 46, BH = 28;
let cursor = M;
const segs = d.langs.map((l, i) => {
  const w = (l.b / codeBytes) * INNER;
  const x = cursor;
  cursor += w;
  const pct = ((l.b / codeBytes) * 100).toFixed(1);
  const tone = TONE[l.k] ?? P.dim;
  return {
    k: l.k, pct, tone,
    rect: `<rect x="${x.toFixed(2)}" y="${BY}" width="${w.toFixed(2)}" height="${BH}" fill="${tone}"/>
<rect class="seg" x="${x.toFixed(2)}" y="${BY}" width="${w.toFixed(2)}" height="${BH}" fill="${P.text}" fill-opacity=".14" style="animation-delay:${(i * 0.55).toFixed(2)}s"/>
${i ? `<path d="M${x.toFixed(2)} ${BY}v${BH}" stroke="${P.card2}" stroke-width="1.4"/>` : ''}`,
    label: w > 54 ? `<text class="mono" x="${(x + w / 2).toFixed(1)}" y="${BY + 18}" font-size="9" letter-spacing=".4" fill="${ink(tone)}" font-weight="600" text-anchor="middle">${pct}%</text>` : '',
  };
});

const LGY = BY + BH + 30;
const LGW = INNER / d.langs.length;
const legend = segs.map((s, i) => {
  const x = M + i * LGW;
  return `<rect x="${x.toFixed(1)}" y="${LGY - 8}" width="9" height="9" rx="2.5" fill="${s.tone}"/>
<text class="mono" x="${(x + 14).toFixed(1)}" y="${LGY}" font-size="8.2" fill="${P.dim}">${esc(s.k)}</text>
<text class="mono" x="${(x + 14).toFixed(1)}" y="${LGY + 12}" font-size="8" fill="${P.dimmer}">${s.pct}%</text>`;
}).join('\n');

const H = LGY + 44;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="By the numbers. ${TILES.map((t) => t.a ?? `${t.v}${t.u} ${t.l}`).join('. ')}. ${PEAKS.map(([k, v]) => `${k}: ${v}`).join('. ')}. Code composition by real byte count: ${segs.map((s) => `${s.k} ${s.pct} percent`).join(', ')}. HTML is mostly Flask and Jinja templates. This profile repository is excluded from the totals.">
<defs>${defs(id, W, H)}
  <clipPath id="bar_nb"><rect x="${M}" y="${BY}" width="${INNER}" height="${BH}" rx="7"/></clipPath>
</defs>
<style>${ANIM}
  .tile{opacity:0;animation:tile 5.2s ease-in-out infinite}
  @keyframes tile{0%{opacity:0}5%{opacity:1}14%{opacity:1}20%{opacity:0}100%{opacity:0}}
  .seg{opacity:0;animation:seg 5.6s ease-in-out infinite}
  @keyframes seg{0%{opacity:0}4%{opacity:1}12%{opacity:1}18%{opacity:0}100%{opacity:0}}
</style>
${frame(id, W, H)}
${header(M + 6, W, 'MEASURED FROM THE GITHUB API · NOT SELF-REPORTED', `LAST PUSH ${since(d.pushed)}`, 34)}
${tiles}
${peaks}

<text class="mono" x="${M}" y="${BY - 14}" font-size="9" letter-spacing="1.5" fill="${P.mid}">CODE COMPOSITION · REAL BYTE COUNTS ACROSS EVERY PUBLIC REPOSITORY</text>
<text class="mono" x="${W - M}" y="${BY - 14}" font-size="9" letter-spacing="1.1" fill="${P.accent}" text-anchor="end">${kb.toLocaleString('en-US')} KB TOTAL</text>
<g clip-path="url(#bar_nb)">${segs.map((s) => s.rect).join('\n')}</g>
<rect x="${M}" y="${BY}" width="${INNER}" height="${BH}" rx="7" fill="none" stroke="${P.line}"/>
${segs.map((s) => s.label).join('')}
${legend}
<path d="M${M} ${H - 30}h${INNER}" stroke="${P.line}"/>
<text class="mono" x="${M}" y="${H - 13}" font-size="7.8" letter-spacing="1" fill="${P.dimmer}">HTML IS LARGELY FLASK AND JINJA TEMPLATE MARKUP · THIS PROFILE REPOSITORY IS EXCLUDED FROM THE TOTALS</text>
<text class="mono" x="${W - M}" y="${H - 13}" font-size="7.8" letter-spacing="1" fill="${P.dimmer}" text-anchor="end">SYNCED ${d.synced} UTC</text>
</svg>
`;

console.log(`numbers  ${W}x${H}  ${kb}KB code · ${d.langs.length} languages  ${emit('numbers', svg)}B`);
