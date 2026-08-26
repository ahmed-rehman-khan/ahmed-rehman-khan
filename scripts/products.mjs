// The product wall. Eight projects, each with a visual built specifically for
// what that project does, laid out newest first.
//
// Two reasons this is one composite SVG instead of eight separate images.
// First, every image on a profile README is its own network request, and a
// random subset of them gets dropped; eight becomes one. Second, drawing the
// cards in a shared coordinate space is the only way to guarantee the visuals
// stay optically consistent with each other.
import { P } from './palette.mjs';
import { ids, defs, ANIM, frame, header, esc } from './kit.mjs';
import { emit } from './light.mjs';

const id = ids('pw');
const W = 900, M = 16, GAP = 12;
const CW = (W - M * 2 - GAP) / 2, CH = 116;
const TOP = 68;

// Local drawing space for every thumbnail: 104 wide, 80 tall.
const VW = 104, VH = 80;

// ---- per-project visuals ---------------------------------------------------
// Each one is literally about the project. A grid overlay for the agent that
// reads the screen, an oscilloscope trace for the energy meter, two shields for
// the guarded chat, an orbit for the satellite tracker, and so on.

const VIS = {
  // V.O.I.C.E: a screen under a numbered coordinate grid, one cell targeted,
  // with a voice waveform underneath.
  voice: (d) => {
    const cells = [[22, 20], [48, 20], [74, 20], [22, 38], [48, 38], [74, 38]];
    return `<rect x="8" y="6" width="88" height="50" rx="5" fill="none" stroke="${P.rule}"/>
<g stroke="${P.line}" stroke-width=".7">${[22, 48, 74].map((x) => `<path d="M${x + 13} 6V56"/>`).join('')}${[24, 42].map((y) => `<path d="M8 ${y + 4}H96"/>`).join('')}</g>
${cells.map((c, i) => `<rect class="cyc6" x="${c[0] - 12}" y="${c[1] - 10}" width="25" height="17" rx="3" fill="${P.accent}" fill-opacity=".3" stroke="${P.accent}" style="animation-delay:${(d + i * 0.6).toFixed(2)}s"/>`).join('')}
${cells.map((c, i) => `<text class="mono" x="${c[0]}" y="${c[1] + 2}" font-size="6" fill="${P.dimmer}" text-anchor="middle">${i + 1}</text>`).join('')}
<g class="cyc6" style="animation-delay:${d.toFixed(2)}s"><path d="M17 15l0 0" stroke="none"/><path d="M22 13v6M19 16h6" stroke="${P.spark}" stroke-width="1.1"/></g>
<g stroke="${P.spark}" stroke-width="1.6" stroke-linecap="round">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path class="wv" d="M${26 + i * 9} ${68 - (i % 3) * 3}v${6 + (i % 3) * 6}" style="animation-delay:${(i * 0.13).toFixed(2)}s"/>`).join('')}</g>
<circle cx="16" cy="70" r="3.4" fill="none" stroke="${P.accent}" stroke-width="1.1"/><circle class="puls" cx="16" cy="70" r="1.6" fill="${P.accent}"/>`;
  },

  // Vantage Hub: a reconstructed current waveform over five metered loads.
  vantage: () => {
    const wave = 'M6 30Q14 8 22 30T38 30T54 30T70 30T86 30T98 30';
    const loads = [30, 52, 20, 44, 36];
    return `<path d="M6 30H98" stroke="${P.line}" stroke-dasharray="2 4"/>
<path d="${wave}" fill="none" stroke="${P.rule}" stroke-width="1.6"/>
<path class="flow" d="${wave}" fill="none" stroke="${P.spark}" stroke-width="1.6"/>
<circle cx="6" cy="30" r="2.4" fill="${P.spark}"><animateMotion dur="3.4s" repeatCount="indefinite" path="M0,0Q8,-22 16,0T32,0T48,0T64,0T80,0T92,0"/></circle>
<path d="M6 58H98" stroke="${P.rule}"/>
${loads.map((h, i) => `<rect x="${10 + i * 18}" y="${74 - h * 0.28}" width="11" height="${(h * 0.28).toFixed(1)}" rx="2" fill="url(#${id.chip})" stroke="${P.line}"/>
<rect class="cyc5" x="${10 + i * 18}" y="${74 - h * 0.28}" width="11" height="${(h * 0.28).toFixed(1)}" rx="2" fill="${P.accent}" fill-opacity=".55" style="animation-delay:${(i * 0.5).toFixed(2)}s"/>`).join('')}
<text class="mono" x="6" y="20" font-size="6" letter-spacing=".5" fill="${P.dimmer}">V / A</text>`;
  },

  // LogicLoom: an input guardian and an output guardian with tokens between
  // them, and one token that gets stopped.
  logicloom: () => {
    const shield = 'M0-9l7.5 2.8v5.4C7.5 2.6 4.2 5.2 0 6.2-4.2 5.2-7.5 2.6-7.5-.8v-5.4z';
    return `<g transform="translate(13 30)"><path d="${shield}" fill="${P.accent}" fill-opacity=".14" stroke="${P.accent}" stroke-width="1.1"/><path d="M-3-1l2.4 2.4L3.6-3" fill="none" stroke="${P.accent}" stroke-width="1.2" stroke-linecap="round"/></g>
<g transform="translate(91 30)"><path d="${shield}" fill="${P.accent}" fill-opacity=".14" stroke="${P.accent}" stroke-width="1.1"/><path d="M-3-1l2.4 2.4L3.6-3" fill="none" stroke="${P.accent}" stroke-width="1.2" stroke-linecap="round"/></g>
<path d="M23 30H81" stroke="${P.rule}"/>
<path class="flow" d="M23 30H81" stroke="${P.spark}" stroke-width="1.3"/>
${[0, 1, 2, 3].map((i) => `<rect x="28" y="26" width="7" height="8" rx="2" fill="${P.spark}"><animateMotion dur="2.8s" begin="${(i * 0.7).toFixed(2)}s" repeatCount="indefinite" path="M0,0H46"/></rect>`).join('')}
<rect x="74" y="26" width="7" height="8" rx="2" fill="${P.warn}"/>
<path d="M78 20v-4" stroke="${P.warn}" stroke-width="1.1"/><text class="mono" x="78" y="14" font-size="6" fill="${P.warn}" text-anchor="middle">STOP</text>
<text class="mono" x="13" y="50" font-size="6" letter-spacing=".4" fill="${P.dimmer}" text-anchor="middle">IN</text>
<text class="mono" x="91" y="50" font-size="6" letter-spacing=".4" fill="${P.dimmer}" text-anchor="middle">OUT</text>
<g stroke="${P.line}">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M${24 + i * 7} 62v${4 + (i % 3) * 4}"/>`).join('')}</g>
<text class="mono" x="52" y="78" font-size="6" letter-spacing="1" fill="${P.dimmer}" text-anchor="middle">131K CONTEXT</text>`;
  },

  // ISS Overhead: the station on an orbit above a city, pinging on the pass.
  iss: () => `<path d="M6 72A46 46 0 0 1 98 72" fill="none" stroke="${P.rule}" stroke-width="1.4"/>
<path d="M6 72A46 46 0 0 1 98 72" fill="url(#${id.glow})" fill-opacity=".5" stroke="none"/>
<g stroke="${P.line}" stroke-width=".7">${[20, 36, 52, 68, 84].map((x) => `<path d="M${x} ${(72 - Math.sqrt(Math.max(0, 46 * 46 - (x - 52) * (x - 52))) * 0.42).toFixed(1)}V72"/>`).join('')}</g>
<ellipse cx="52" cy="42" rx="44" ry="21" fill="none" stroke="${P.line}" stroke-dasharray="3 4"/>
<ellipse class="orb" cx="52" cy="42" rx="44" ry="21" fill="none" stroke="${P.accent}" stroke-width="1.2"/>
<g><animateMotion dur="6s" repeatCount="indefinite" path="M44,-21A44,21 0 1 1 44,21A44,21 0 1 1 44,-21" /><g transform="translate(52 42)"><rect x="-3" y="-2.4" width="6" height="4.8" rx="1.4" fill="${P.spark}"/><path d="M-8-1h4M4-1h4" stroke="${P.spark}" stroke-width="1.4"/></g></g>
<circle class="halo" cx="52" cy="70" r="3" fill="none" stroke="${P.spark}" stroke-width="1.2" style="transform-origin:52px 70px"/>
<circle cx="52" cy="70" r="2.2" fill="${P.spark}"/>
<text class="mono" x="52" y="14" font-size="6" letter-spacing=".8" fill="${P.dimmer}" text-anchor="middle">POLL 5s</text>`,

  // Due Desk: prioritised deadlines against a countdown ring.
  duedesk: () => {
    const rows = [[P.warn, 62], [P.accent, 48], [P.dimmer, 40]];
    return `${rows.map((r, i) => `<rect x="6" y="${14 + i * 19}" width="${r[1]}" height="13" rx="3.5" fill="url(#${id.chip})" stroke="${P.line}"/>
<rect x="6" y="${14 + i * 19}" width="3" height="13" rx="1.5" fill="${r[0]}"/>
<rect class="cyc3" x="6" y="${14 + i * 19}" width="${r[1]}" height="13" rx="3.5" fill="none" stroke="${r[0]}" style="animation-delay:${(i * 1.1).toFixed(1)}s"/>
<g stroke="${P.rule}" stroke-width=".8">${[0, 1, 2].map((j) => `<path d="M${14 + j * 9} ${20.5 + i * 19}h6"/>`).join('')}</g>`).join('')}
<g transform="translate(84 40)">
  <circle r="14" fill="none" stroke="${P.rule}" stroke-width="2.4"/>
  <circle class="ring" r="14" fill="none" stroke="${P.accent}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="88" transform="rotate(-90)"/>
  <path class="hand" d="M0 0v-8" stroke="${P.spark}" stroke-width="1.3" stroke-linecap="round"/>
  <circle r="1.6" fill="${P.spark}"/>
</g>
<path d="M6 72h46" stroke="${P.line}"/>
<g transform="translate(12 76)"><path d="M-4-3h8v6h-8z" fill="none" stroke="${P.dimmer}" stroke-width="1"/><path d="M-4-3l4 3 4-3" fill="none" stroke="${P.dimmer}" stroke-width="1"/></g>
<text class="mono" x="22" y="79" font-size="6" letter-spacing=".6" fill="${P.dimmer}">REMINDER SENT</text>`;
  },

  // Smart Agent: a reply arriving token by token behind a blinking caret.
  smartagent: () => `<g><rect x="40" y="8" width="56" height="16" rx="6" fill="url(#${id.chip})" stroke="${P.line}"/>
<g stroke="${P.dimmer}" stroke-width="1">${[0, 1, 2, 3].map((i) => `<path d="M${48 + i * 11} 16h7"/>`).join('')}</g></g>
<rect x="6" y="30" width="72" height="30" rx="6" fill="${P.accent}" fill-opacity=".1" stroke="${P.accent}" stroke-opacity=".5"/>
<g>${[0, 1, 2, 3, 4].map((i) => `<rect class="tok" x="${13 + i * 11}" y="38" width="8" height="6" rx="2" fill="${P.spark}" style="animation-delay:${(i * 0.34).toFixed(2)}s"/>`).join('')}</g>
<g>${[0, 1, 2, 3].map((i) => `<rect class="tok" x="${13 + i * 11}" y="49" width="8" height="6" rx="2" fill="${P.spark}" fill-opacity=".6" style="animation-delay:${(1.7 + i * 0.34).toFixed(2)}s"/>`).join('')}</g>
<rect class="caret" x="58" y="48" width="2" height="8" fill="${P.accent}"/>
<circle cx="88" cy="45" r="7" fill="none" stroke="${P.rule}"/><path d="M85 45l2.2 2.2 4-4.6" fill="none" stroke="${P.accent}" stroke-width="1.3" stroke-linecap="round"/>
<text class="mono" x="6" y="76" font-size="6" letter-spacing=".8" fill="${P.dimmer}">FIRST DEPLOY · 2025</text>`,

  // Build My Week: a block being lifted across a seven day grid.
  buildmyweek: () => {
    const blocks = [[0, 22, 14], [1, 34, 20], [2, 18, 12], [4, 40, 16], [5, 26, 22], [6, 20, 14]];
    return `<g stroke="${P.line}" stroke-width=".8">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${6 + i * 13} 16V72"/>`).join('')}<path d="M6 16H97"/><path d="M6 72H97"/></g>
<g class="mono" font-size="5.5" fill="${P.dimmer}" text-anchor="middle">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => `<text x="${12.5 + i * 13}" y="12">${d}</text>`).join('')}</g>
${blocks.map((b) => `<rect x="${7.5 + b[0] * 13}" y="${b[1]}" width="10" height="${b[2]}" rx="2.5" fill="${P.accent}" fill-opacity=".28" stroke="${P.accent}" stroke-opacity=".6"/>`).join('')}
<g class="drag"><rect x="46.5" y="30" width="10" height="18" rx="2.5" fill="${P.spark}" fill-opacity=".4" stroke="${P.spark}"/></g>
<rect x="46.5" y="30" width="10" height="18" rx="2.5" fill="none" stroke="${P.rule}" stroke-dasharray="2 3"/>
<text class="mono" x="6" y="80" font-size="6" letter-spacing=".7" fill="${P.dimmer}">NO FRAMEWORK</text>`;
  },

  // Universal Sync: deltas reconciling between a phone and a desktop.
  universalsync: () => `<rect x="8" y="20" width="24" height="40" rx="4" fill="url(#${id.chip})" stroke="${P.line}"/>
<rect x="11" y="24" width="18" height="30" rx="2" fill="${P.accent}" fill-opacity=".14"/>
<circle cx="20" cy="57" r="1.4" fill="${P.dimmer}"/>
<rect x="66" y="22" width="30" height="24" rx="3" fill="url(#${id.chip})" stroke="${P.line}"/>
<rect x="69" y="25" width="24" height="18" rx="2" fill="${P.accent}" fill-opacity=".14"/>
<path d="M81 46v6M74 52h14" stroke="${P.line}" stroke-width="1.2"/>
<path d="M34 32Q52 20 64 30" fill="none" stroke="${P.rule}"/>
<path class="flow" d="M34 32Q52 20 64 30" fill="none" stroke="${P.spark}" stroke-width="1.2"/>
<circle r="2.4" fill="${P.spark}"><animateMotion dur="2.4s" repeatCount="indefinite" path="M34,32Q52,20 64,30"/></circle>
<path d="M64 44Q50 56 34 46" fill="none" stroke="${P.rule}"/>
<path class="flow" d="M64 44Q50 56 34 46" fill="none" stroke="${P.accent}" stroke-width="1.2"/>
<circle r="2.4" fill="${P.accent}"><animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite" path="M64,44Q50,56 34,46"/></circle>
<text class="mono" x="49" y="70" font-size="9" fill="${P.spark}" text-anchor="middle">&#916;</text>
<text class="mono" x="49" y="79" font-size="5.5" letter-spacing=".6" fill="${P.dimmer}" text-anchor="middle">DELTA ONLY</text>`,
};

// ---- projects, newest first ------------------------------------------------
// Dates are repository creation dates from the GitHub API. Universal Sync has
// no public repository, so it carries no date and sorts last.

const PROJECTS = [
  { n: '01', key: 'voice', name: 'V.O.I.C.E.', date: 'JUL 2026', desc: 'Desktop agent that reads the screen through a numbered coordinate grid and acts on a spoken command.', stack: 'Python · Gemini Vision · PyAutoGUI' },
  { n: '02', key: 'vantage', name: 'Vantage Hub', date: 'MAY 2026', desc: 'IoT energy system that reconstructs current and voltage waveforms per appliance and forecasts the bill.', stack: 'Flutter · ESP32-S3 · FreeRTOS · scikit-learn' },
  { n: '03', key: 'logicloom', name: 'LogicLoom', date: 'MAY 2026', desc: 'Chat platform with an input guardian for jailbreaks and an output guardian for prompt leaks.', stack: 'Flask · LangChain · Groq · MySQL', live: true },
  { n: '04', key: 'iss', name: 'ISS Overhead', date: 'APR 2026', desc: 'Tracks the space station every five seconds and emails you on a double opt-in when it passes over.', stack: 'Next.js · TypeScript · FastAPI · Supabase', live: true },
  { n: '05', key: 'duedesk', name: 'Due Desk', date: 'OCT 2025', desc: 'Deadline tracker with priority tagging and automated email reminders.', stack: 'Firebase · Firestore · Nodemailer', live: true },
  { n: '06', key: 'smartagent', name: 'Smart Agent', date: 'OCT 2025', desc: 'Token-streaming assistant. The first thing I deployed, and where the safety pattern started.', stack: 'JavaScript · LLM APIs', live: true },
  { n: '07', key: 'buildmyweek', name: 'Build My Week', date: 'AUG 2025', desc: 'Drag-and-drop weekly planner with image export, written without a framework.', stack: 'Vanilla JS · CSS', live: true },
  { n: '08', key: 'universalsync', name: 'Universal Sync', date: '', desc: 'Delta-based real-time sync across Android and desktop JVM from a single codebase.', stack: 'Kotlin Multiplatform · Compose · Supabase · Ktor' },
];

// ---- layout ----------------------------------------------------------------

function wrap(s, n) {
  const out = [];
  let line = '';
  for (const word of s.split(' ')) {
    if (line && (line + ' ' + word).length > n) { out.push(line); line = word; } else { line = line ? `${line} ${word}` : word; }
  }
  if (line) out.push(line);
  return out;
}

const TX = 12 + VW + 14;
const TW = CW - TX - 14;

const cards = PROJECTS.map((p, i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = M + col * (CW + GAP), y = TOP + row * (CH + GAP);
  const lines = wrap(p.desc, 52).slice(0, 3);
  const d = i * 0.42;
  return `
<g transform="translate(${x.toFixed(1)} ${y})">
  <rect width="${CW.toFixed(1)}" height="${CH}" rx="11" fill="url(#${id.chip})" stroke="${P.line}"/>
  <rect class="edge" width="${CW.toFixed(1)}" height="${CH}" rx="11" fill="none" stroke="${P.accent}" stroke-opacity=".7" style="animation-delay:${d.toFixed(2)}s"/>
  <rect x="0" y="14" width="2.5" height="${CH - 28}" rx="1.25" fill="${P.rule}"/>
  <rect class="edge" x="0" y="14" width="2.5" height="${CH - 28}" rx="1.25" fill="${P.spark}" style="animation-delay:${d.toFixed(2)}s"/>
  <rect x="12" y="18" width="${VW}" height="${VH}" rx="8" fill="${P.card2}" fill-opacity=".55" stroke="${P.line}"/>
  <g transform="translate(12 18)" clip-path="url(#vclip_pw)">${VIS[p.key](d)}</g>
  <text class="sans" x="${TX}" y="36" font-size="13.5" font-weight="700" letter-spacing="-.1" fill="${P.text}">${esc(p.name)}</text>
  ${p.date ? `<text class="mono" x="${CW - 14}" y="35" font-size="8.5" letter-spacing="1.1" fill="${P.accent}" text-anchor="end">${p.date}</text>` : `<text class="mono" x="${CW - 14}" y="35" font-size="8" letter-spacing="1" fill="${P.dimmer}" text-anchor="end">NO PUBLIC REPO</text>`}
${lines.map((l, j) => `  <text class="mono" x="${TX}" y="${54 + j * 12}" font-size="8.4" fill="${P.dim}">${esc(l)}</text>`).join('\n')}
  <text class="mono" x="${TX}" y="${CH - 14}" font-size="7.8" letter-spacing=".5" fill="${P.dimmer}">${esc(p.stack)}</text>
  <text class="mono" x="14" y="${CH - 6}" font-size="7" letter-spacing="1" fill="${P.dimmer}">${p.n}</text>
  ${p.live ? `<rect x="${CW - 52}" y="${CH - 26}" width="38" height="15" rx="5" fill="${P.accent}" fill-opacity=".16" stroke="${P.accent}" stroke-opacity=".5"/>
  <circle class="puls" cx="${CW - 44}" cy="${CH - 18.5}" r="2" fill="${P.accent}" style="animation-delay:${d.toFixed(2)}s"/>
  <text class="mono" x="${CW - 37}" y="${CH - 15}" font-size="7" letter-spacing=".8" fill="${P.accent}">LIVE</text>` : ''}
</g>`;
}).join('');

const live = PROJECTS.filter((p) => p.live).length;
const H = TOP + 4 * CH + 3 * GAP + 42;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Eight projects, newest first. ${PROJECTS.map((p) => `${p.name}${p.date ? `, ${p.date}` : ''}: ${p.desc} Built with ${p.stack}.${p.live ? ' Live and reachable.' : ''}`).join(' ')}">
<defs>${defs(id, W, H)}
  <clipPath id="vclip_pw"><rect width="${VW}" height="${VH}" rx="8"/></clipPath>
</defs>
<style>${ANIM}
  .edge{opacity:0;animation:edge 6.8s ease-in-out infinite}
  @keyframes edge{0%{opacity:0}5%{opacity:1}15%{opacity:1}22%{opacity:0}100%{opacity:0}}
  .cyc6{opacity:0;animation:cyc6 4.2s linear infinite}
  @keyframes cyc6{0%{opacity:0}4%{opacity:1}13%{opacity:1}17%{opacity:0}100%{opacity:0}}
  .cyc5{opacity:0;animation:cyc5 3s linear infinite}
  @keyframes cyc5{0%{opacity:0}6%{opacity:1}18%{opacity:1}24%{opacity:0}100%{opacity:0}}
  .cyc3{opacity:0;animation:cyc3 3.3s linear infinite}
  @keyframes cyc3{0%{opacity:0}8%{opacity:1}28%{opacity:1}36%{opacity:0}100%{opacity:0}}
  .wv{animation:wv 1.1s ease-in-out infinite}
  @keyframes wv{0%,100%{opacity:.35}50%{opacity:1}}
  .tok{opacity:.25;animation:tok 3.4s linear infinite}
  @keyframes tok{0%{opacity:.25}10%{opacity:1}70%{opacity:1}80%{opacity:.25}100%{opacity:.25}}
  .caret{animation:caret 1s step-end infinite}
  @keyframes caret{0%,50%{opacity:1}51%,100%{opacity:0}}
  .ring{animation:ring 6s linear infinite}
  @keyframes ring{0%{stroke-dashoffset:0}100%{stroke-dashoffset:88}}
  .hand{animation:hand 6s linear infinite;transform-origin:0 0}
  @keyframes hand{to{transform:rotate(360deg)}}
  .drag{animation:drag 5s ease-in-out infinite}
  @keyframes drag{0%,100%{transform:translate(0,0)}45%,55%{transform:translate(26px,-8px)}}
  .orb{stroke-dasharray:14 200;animation:orb 6s linear infinite}
  @keyframes orb{to{stroke-dashoffset:-214}}
</style>
${frame(id, W, H)}
${header(M + 6, W, 'NEWEST FIRST · EVERY VISUAL BUILT FOR ITS OWN PROJECT', `${PROJECTS.length} PROJECTS · ${live} LIVE`, 34)}
${cards}
<path d="M${M + 6} ${H - 28}h${W - (M + 6) * 2}" stroke="${P.line}"/>
<text class="mono" x="${M + 6}" y="${H - 12}" font-size="8" letter-spacing="1.1" fill="${P.dimmer}">DATES ARE REPOSITORY CREATION DATES FROM THE GITHUB API</text>
<text class="mono" x="${W - M - 6}" y="${H - 12}" font-size="8" letter-spacing="1.1" fill="${P.dimmer}" text-anchor="end">LINKS BELOW, SAME ORDER</text>
</svg>
`;

console.log(`products  ${W}x${H}  ${PROJECTS.length} cards · ${live} live  ${emit('products', svg)}B`);
