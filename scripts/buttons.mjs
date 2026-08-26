// Link buttons. Custom SVG rather than shields.io so the palette matches the
// rest of the profile exactly and nothing depends on an external service.
//
// Each button is its own file because each one has to be its own anchor. Ids are
// local and short for that reason: an SVG referenced by <img> is a separate
// document, so there is nothing here for a sibling button to collide with.
import { P } from './palette.mjs';
import { emit } from './light.mjs';

const ICONS = {
  globe: '<circle cx="7" cy="7" r="6.1"/><ellipse cx="7" cy="7" rx="2.7" ry="6.1"/><path d="M1.1 7h11.8"/>',
  linkedin: '<rect x=".9" y=".9" width="12.2" height="12.2" rx="2.4"/><path d="M4.2 6.2v4.3"/><path d="M4.2 3.7v.1"/><path d="M7.1 10.5V7.6a1.7 1.7 0 013.4 0v2.9"/>',
  mail: '<rect x=".9" y="2.5" width="12.2" height="9" rx="1.7"/><path d="M1.6 3.4L7 7.7l5.4-4.3"/>',
  layers: '<path d="M7 1.3l5.8 3.2L7 7.7 1.2 4.5z"/><path d="M1.2 8.1L7 11.3l5.8-3.2"/>',
};

const BTNS = [
  { file: 'btn-portfolio', label: 'Portfolio', icon: 'globe', accent: true },
  { file: 'btn-linkedin', label: 'LinkedIn', icon: 'linkedin' },
  { file: 'btn-email', label: 'Email', icon: 'mail' },
  { file: 'btn-systems', label: 'The systems', icon: 'layers' },
];

const H = 34, FS = 11, CW = 6.3;
// Trailing transparent gutter, so the row of buttons spaces itself without
// relying on whitespace between the anchors, which GitHub collapses inconsistently.
const GUTTER = 11;

for (const [i, b] of BTNS.entries()) {
  const W = Math.round(16 + 14 + 9 + b.label.length * CW + 10 + 6 + 15);
  const border = b.accent ? P.accent : P.line;
  const label = b.accent ? P.text : P.dim;
  const icon = b.accent ? P.accent : P.dim;
  const chevX = W - 21;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W + GUTTER}" height="${H}" viewBox="0 0 ${W + GUTTER} ${H}" role="img" aria-label="${b.label}">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${P.chip1}"/><stop offset="100%" stop-color="${P.chip2}"/></linearGradient>
  <linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${P.spark}" stop-opacity="0"/><stop offset="50%" stop-color="${P.spark}" stop-opacity=".13"/><stop offset="100%" stop-color="${P.spark}" stop-opacity="0"/></linearGradient>
  <clipPath id="c"><rect width="${W}" height="${H}" rx="8"/></clipPath>
</defs>
<style>
  .mono{font-family:'JetBrains Mono','SF Mono',ui-monospace,Consolas,'DejaVu Sans Mono',monospace}
  .sh{animation:sh 4.4s ease-in-out infinite;animation-delay:${(i * 0.55).toFixed(2)}s}
  @keyframes sh{0%{transform:translateX(-${W}px)}55%,100%{transform:translateX(${W}px)}}
  .cv{animation:cv 2.6s ease-in-out infinite;animation-delay:${(i * 0.3).toFixed(2)}s}
  @keyframes cv{0%,100%{transform:translateX(0);opacity:.55}50%{transform:translateX(2.5px);opacity:1}}
</style>
<rect width="${W}" height="${H}" rx="8" fill="url(#g)" stroke="${border}" stroke-opacity="${b.accent ? '.75' : '1'}"/>
<g clip-path="url(#c)"><rect class="sh" width="${W}" height="${H}" fill="url(#s)"/></g>
<g transform="translate(15 10)" fill="none" stroke="${icon}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[b.icon]}</g>
<text class="mono" x="38" y="21.5" font-size="${FS}" fill="${label}">${b.label}</text>
<g class="cv" fill="none" stroke="${b.accent ? P.accent : P.dim}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M${chevX} 13.5l3.4 3.5-3.4 3.5"/></g>
</svg>
`;
  console.log(`button  ${b.file}  ${W}x${H}  ${emit(b.file, svg)}B`);
}
