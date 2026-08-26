// Hero banner. The right-hand visual is the vertical slice itself, because that
// is the actual claim being made: one person who owns the surface, the API, the
// rules, the model and the schema. The three role chips step through the accent
// ramp rather than repeating one colour, so "full-stack", "app" and "AI" read as
// three distinct competencies rather than one hyphenated buzzword. Neighbouring
// chips are never the same lightness, which is why app sits between the other
// two: indigo, periwinkle, violet.
import { P } from './palette.mjs';
import { ids, defs, ANIM, frame } from './kit.mjs';
import { emit } from './light.mjs';

// Authored at 900 wide because that is roughly the width a profile README
// actually gives an image. A wider canvas gets scaled down by the browser,
// which shrinks every type size along with it, and that is exactly how small
// print becomes unreadable. Every other panel is 900 for the same reason.
const W = 900, H = 300, M = 44;
const id = ids('h');

const NAME = 'AHMED REHMAN';
const EYEBROW = 'KARACHI, PAKISTAN  ·  THIRD-YEAR BS COMPUTER SCIENCE, IOBM  ·  3.87 CGPA';
const TAGLINE = 'I build AI systems end to end, from the database schema to the kill switch.';

// Three roles across the indigo-to-violet ramp. Ordered so that no two adjacent
// chips share a lightness, which is the only reason app sits in the middle.
const ROLES = [
  { t: 'FULL-STACK DEVELOPER', c: P.accent },
  { t: 'APP DEVELOPER', c: P.r3 },
  { t: 'AI DEVELOPER', c: P.spark },
];

// The vertical slice, top surface down to storage. MODEL sits inside the same
// stack as API and DATA on purpose: the AI is a layer he owns, not a bolt-on.
const LAYERS = [
  { k: 'SURFACE', v: 'web · mobile · desktop · extension' },
  { k: 'API', v: 'contracts · auth · rate limits' },
  { k: 'LOGIC', v: 'permissions · fails closed' },
  { k: 'MODEL', v: 'trained · served · guarded' },
  { k: 'DATA', v: 'third normal form · AES-256' },
];

const CW10 = 6.05, LS = 1.3;
const chipW = (t) => Math.round(t.length * (CW10 + LS) + 26);

let cx = M;
const chips = ROLES.map((r, i) => {
  const w = chipW(r.t);
  const x = cx;
  cx += w + 10;
  return `<rect x="${x}" y="150" width="${w}" height="26" rx="7" fill="${r.c}" fill-opacity=".11" stroke="${r.c}" stroke-opacity=".55"/>
<rect class="puls" x="${x}" y="150" width="${w}" height="26" rx="7" fill="none" stroke="${r.c}" stroke-opacity=".9" style="animation-delay:${(i * 1.7).toFixed(1)}s"/>
<text class="mono" x="${x + 13}" y="167" font-size="10" letter-spacing="${LS}" fill="${r.c}">${r.t}</text>`;
}).join('\n');

// Right block: the slice.
const SX = 538, BX = SX + 18, BW = 300, BH = 27, BG = 11;
const TOP = 62;
const rowY = (i) => TOP + i * (BH + BG);
const spineA = rowY(0) + BH / 2;
const spineB = rowY(LAYERS.length - 1) + BH / 2;
const CYCLE = 6;

const bars = LAYERS.map((l, i) => {
  const y = rowY(i);
  const my = y + BH / 2;
  const d = (i * (CYCLE / LAYERS.length)).toFixed(2);
  return `<path d="M${SX} ${my}h18" stroke="${P.rule}"/>
<rect x="${BX}" y="${y}" width="${BW}" height="${BH}" rx="8" fill="url(#${id.chip})" stroke="${P.line}"/>
<rect class="step" x="${BX}" y="${y}" width="${BW}" height="${BH}" rx="8" fill="none" stroke="${P.accent}" stroke-opacity=".95" style="animation-delay:${d}s"/>
<rect x="${BX + 1}" y="${y + 6}" width="2.5" height="${BH - 12}" rx="1.25" fill="${P.rule}"/>
<rect class="step" x="${BX + 1}" y="${y + 6}" width="2.5" height="${BH - 12}" rx="1.25" fill="${P.spark}" style="animation-delay:${d}s"/>
<text class="mono" x="${BX + 15}" y="${my + 3.6}" font-size="9.5" letter-spacing="1.5" fill="${P.mid}">${l.k}</text>
<text class="mono" x="${BX + BW - 13}" y="${my + 3.4}" font-size="8.5" fill="${P.dim}" text-anchor="end">${l.v}</text>`;
}).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Ahmed Rehman. Full-stack developer, app developer and AI developer. Karachi, Pakistan. Third-year BS Computer Science at IoBM, 3.87 CGPA. I build AI systems end to end, from the database schema to the kill switch. The vertical slice he owns: surface, API, logic, model, data. Open to work.">
<defs>${defs(id, W, H, 16)}
  <linearGradient id="nm_h" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${P.text}"/><stop offset="62%" stop-color="${P.text}"/><stop offset="100%" stop-color="${P.spark}"/></linearGradient>
</defs>
<style>${ANIM}
  .step{opacity:0;animation:step ${CYCLE}s linear infinite}
  @keyframes step{0%{opacity:0}4%{opacity:1}16%{opacity:1}20%{opacity:0}100%{opacity:0}}
</style>
${frame(id, W, H, 16)}

<text class="mono" x="${M}" y="72" font-size="8.6" letter-spacing="1.35" fill="${P.dim}">${EYEBROW}</text>
<text class="sans" x="${M}" y="128" font-size="50" font-weight="700" letter-spacing="-1.4" fill="url(#nm_h)">${NAME}</text>
${chips}
<text class="sans" x="${M}" y="208" font-size="12.5" fill="${P.mid}">${TAGLINE}</text>

<rect x="${M}" y="240" width="150" height="27" rx="13.5" fill="${P.accent}" fill-opacity=".1" stroke="${P.accent}" stroke-opacity=".45"/>
<circle class="halo" cx="${M + 17}" cy="253.5" r="3.4" fill="none" stroke="${P.accent}" stroke-width="1.2" style="transform-origin:${M + 17}px 253.5px"/>
<circle class="puls" cx="${M + 17}" cy="253.5" r="3.4" fill="${P.accent}"/>
<text class="mono" x="${M + 29}" y="257" font-size="9.5" letter-spacing="1.6" fill="${P.accent}">OPEN TO WORK</text>

<text class="mono" x="${SX}" y="45" font-size="8.5" letter-spacing="1.9" fill="${P.dim}">THE VERTICAL SLICE I OWN</text>
<path d="M${SX} ${spineA}V${spineB}" stroke="${P.rule}"/>
<path class="march" d="M${SX} ${spineA}V${spineB}" stroke="${P.accent}" stroke-width="1.3" stroke-opacity=".8"/>
${bars}
<circle cx="${SX}" cy="${spineA}" r="3.2" fill="${P.spark}">
  <animateMotion dur="${CYCLE}s" repeatCount="indefinite" path="M0,0V${(spineB - spineA).toFixed(0)}"/>
</circle>
<text class="mono" x="${SX}" y="${spineB + 34}" font-size="8.5" letter-spacing="1.4" fill="${P.dim}">ONE PERSON · EVERY LAYER · NO HANDOFF</text>
</svg>
`;

console.log(`hero  ${W}x${H}  ${emit('hero', svg)}B`);
