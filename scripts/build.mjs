// Builds every asset, then refuses to finish if any of them is broken.
//
//   node scripts/build.mjs          rebuild the visuals from the committed snapshot
//   node scripts/build.mjs --live   refresh the snapshot from the GitHub API first
//
// The validation pass at the end is not decoration. These SVGs are referenced by
// a README that nobody renders locally before pushing, so a dangling gradient id
// or a light variant whose geometry has drifted would only be discovered by a
// visitor seeing a blank panel. Everything cheap enough to check is checked here.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { P } from './palette.mjs';

const LIVE = process.argv.includes('--live');
if (!LIVE) process.env.SIGNALS_OFFLINE = '1';

// Order matters only in that the live panels come last, so a rate-limit failure
// still leaves a complete set of static assets behind.
const GENERATORS = [
  'buttons', 'hero', 'systems', 'products', 'stack', 'credentials',
  'numbers', 'trophies', 'cadence',
];

console.log(LIVE ? 'building with a live data refresh' : 'building from the committed snapshot');
console.log('');

for (const g of GENERATORS) {
  await import(`./${g}.mjs`);
}

// ---- validation -------------------------------------------------------------

const PALETTE = new Set(Object.values(P).map((c) => c.toLowerCase()));
const LIGHT_TARGETS = new Set(
  (await import('./palette.mjs')).LIGHT_MAP.map(([, to]) => to.toLowerCase()),
);

const problems = [];
const note = (file, msg) => problems.push(`${file}: ${msg}`);

const svgs = readdirSync('assets').filter((f) => f.endsWith('.svg')).sort();
const pairs = [...new Set(svgs.map((f) => f.replace(/-(dark|light)\.svg$/, '')))];

for (const base of pairs) {
  for (const variant of ['dark', 'light']) {
    const file = `assets/${base}-${variant}.svg`;
    if (!existsSync(file)) { note(file, 'missing'); continue; }
    const s = readFileSync(file, 'utf8');

    if (s.length < 400) note(file, `suspiciously small (${s.length}B)`);

    // Balanced root element.
    const opens = (s.match(/<svg[\s>]/g) || []).length;
    const closes = (s.match(/<\/svg>/g) || []).length;
    if (opens !== 1 || closes !== 1) note(file, `expected one svg element, found ${opens} open and ${closes} close`);

    // Declared size must agree with the viewBox, or the browser scales the panel.
    const w = /\bwidth="([\d.]+)"/.exec(s);
    const h = /\bheight="([\d.]+)"/.exec(s);
    const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(s);
    if (w && h && vb && (w[1] !== vb[1] || h[1] !== vb[2])) {
      note(file, `size ${w[1]}x${h[1]} disagrees with viewBox ${vb[1]}x${vb[2]}`);
    }

    // Every referenced id must resolve inside this same document, because an
    // unresolved url(#...) can make the element vanish entirely rather than
    // simply fall back to no fill.
    const declared = new Set([...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
    for (const m of s.matchAll(/url\(#([^)]+)\)/g)) {
      if (!declared.has(m[1])) note(file, `url(#${m[1]}) does not resolve`);
    }
    for (const m of s.matchAll(/\bclip-path="url\(#([^)]+)\)"/g)) {
      if (!declared.has(m[1])) note(file, `clip-path #${m[1]} does not resolve`);
    }

    // No animation may start from a hidden state on load-bearing content, so
    // fill-mode is banned outright: a frozen render must still be correct.
    if (s.includes('animation-fill-mode') || /animation:[^;"}]*\b(forwards|backwards|both)\b/.test(s)) {
      note(file, 'uses animation fill-mode, so a frozen render could be wrong');
    }

    // Dashes the brief rules out.
    if (s.includes('\u2014')) note(file, 'contains an em dash');
    if (s.includes('\u2013')) note(file, 'contains an en dash');

    // Every colour must come from the palette, in the right direction.
    const allowed = variant === 'dark' ? PALETTE : LIGHT_TARGETS;
    const stray = [...new Set([...s.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toLowerCase()))]
      .filter((c) => !allowed.has(c));
    if (stray.length) note(file, `off-palette colours: ${stray.join(', ')}`);
  }

  // Geometry parity: strip every colour and the two variants must be identical.
  const d = `assets/${base}-dark.svg`, l = `assets/${base}-light.svg`;
  if (existsSync(d) && existsSync(l)) {
    const strip = (f) => readFileSync(f, 'utf8').replace(/#[0-9a-fA-F]{6}\b/g, 'X');
    if (strip(d) !== strip(l)) note(base, 'dark and light geometry have drifted apart');
  }
}

// The README must reference every asset, and every asset must be referenced.
if (existsSync('README.md')) {
  const readme = readFileSync('README.md', 'utf8');
  const referenced = new Set([...readme.matchAll(/assets\/([A-Za-z0-9_-]+\.svg)/g)].map((m) => m[1]));
  for (const f of svgs) {
    if (!referenced.has(f)) note(`assets/${f}`, 'generated but never referenced by the README');
  }
  for (const f of referenced) {
    if (!svgs.includes(f)) note(`README`, `references assets/${f}, which does not exist`);
  }
  if (readme.includes('\u2014')) note('README.md', 'contains an em dash');
  if (readme.includes('\u2013')) note('README.md', 'contains an en dash');
}

console.log('');
const bytes = svgs.reduce((a, f) => a + readFileSync(`assets/${f}`).length, 0);
console.log(`${pairs.length} assets · ${svgs.length} files · ${(bytes / 1024).toFixed(0)} KB total`);

if (problems.length) {
  console.error('');
  console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log('all checks passed');
