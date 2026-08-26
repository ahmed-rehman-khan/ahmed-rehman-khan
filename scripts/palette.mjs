// The single source of truth for colour. Every generator imports P from here,
// and LIGHT_MAP is the ordered dark -> light substitution used to derive the
// light variant of each asset, so the two can never drift apart.
//
// Indigo and violet on near-black. Indigo carries structure (rules, gates,
// active state). Violet carries movement (packets, highlights, traces). Amber
// is reserved for the one idea that has to read as a human stop: the kill
// switch and the fallback path. Nothing else is allowed to be warm.

export const P = {
  // surfaces
  bg: '#08090f',
  card1: '#12141f',
  card2: '#0b0d16',
  chip1: '#1a1d2e',
  chip2: '#131627',
  // strokes
  line: '#232739',
  rule: '#2f3450',
  // type
  text: '#e7e9f2',
  mid: '#c3c7db',
  dim: '#8b90a8',
  dimmer: '#5c6180',
  // accents
  accent: '#6366f1',
  spark: '#a78bfa',
  warn: '#f0a742',
  // extra steps used only by the language composition bar
  r1: '#818cf8',
  r2: '#c4b5fd',
  r3: '#a5b4fc',
};

// Ordered because a substitution must never produce a colour that a later
// substitution also matches. Verified collision-free by scripts/audit.mjs.
export const LIGHT_MAP = [
  ['#e7e9f2', '#1c1e2a'],
  ['#c3c7db', '#3a3f52'],
  ['#8b90a8', '#5f6478'],
  ['#5c6180', '#8489a0'],
  ['#12141f', '#f7f8fc'],
  ['#0b0d16', '#ffffff'],
  ['#08090f', '#ffffff'],
  ['#1a1d2e', '#eef0f7'],
  ['#131627', '#e4e8f2'],
  ['#232739', '#d5d9e6'],
  ['#2f3450', '#b4bacd'],
  ['#6366f1', '#4f46e5'],
  ['#a78bfa', '#7c3aed'],
  ['#818cf8', '#4338ca'],
  ['#c4b5fd', '#6d28d9'],
  ['#a5b4fc', '#3730a3'],
  ['#f0a742', '#b45309'],
];

export const FONTS = `
  .sans{font-family:'Segoe UI',Inter,system-ui,-apple-system,Helvetica,Arial,sans-serif}
  .mono{font-family:'JetBrains Mono','SF Mono',ui-monospace,Consolas,'DejaVu Sans Mono',monospace}`;
