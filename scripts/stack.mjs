// The stack panel, grouped by what each tool is for rather than by popularity.
// Generated rather than hand-placed so every chip is sized from its own label
// width and rows wrap without overlapping at any label length.
//
// The highlight sweeps one chip at a time per row, and each row runs at its own
// cycle length because the rows hold different numbers of chips. A single shared
// cycle would make the short rows sit idle while the long rows caught up.
import { P } from './palette.mjs';
import { ids, defs, ANIM, frame, header, esc } from './kit.mjs';
import { emit } from './light.mjs';

const id = ids('st');

const ROWS = [
  { label: 'SYSTEMS', note: 'services, APIs, data', items: ['Node.js', 'Express', 'FastAPI', 'Flask', 'PostgreSQL', 'MySQL', 'SQL'] },
  { label: 'AI', note: 'trained and served', items: ['PyTorch', 'scikit-learn', 'LangChain', 'OpenRouter', 'Gemini', 'LoRA fine-tuning', 'retrieval'] },
  { label: 'SURFACES', note: 'web, mobile, desktop', items: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Flutter', 'Kotlin Multiplatform', 'Compose'] },
  { label: 'INFRASTRUCTURE', note: 'run it, then watch it', items: ['Docker', 'Oracle Cloud', 'Cloudflare Tunnel', 'Redpanda', 'GitHub Actions', 'Prometheus', 'Grafana', 'OpenTelemetry'] },
  { label: 'EMBEDDED', note: 'firmware and sensors', items: ['ESP32-S3', 'FreeRTOS', 'BLE', 'MQTT'] },
  { label: 'LANGUAGES', note: 'beneath the frameworks', items: ['Python', 'JavaScript', 'Java', 'C', 'C++', 'Dart', 'Kotlin', 'x86 Assembly'] },
];

const W = 900, M = 28, LABEL_W = 168, CH = 22, GAP = 7, PAD = 11, FS = 9.5, CW = 5.72;
const X0 = M + LABEL_W;
const XMAX = W - M;
const width = (s) => Math.round(s.length * CW + PAD * 2);

// Lay out every chip first, so the canvas height is exact rather than guessed.
let y = 76;
const rows = ROWS.map((row) => {
  let cx = X0, lines = 1;
  const chips = row.items.map((name) => {
    const w = width(name);
    if (cx + w > XMAX) { cx = X0; lines++; }
    const chip = { name, w, x: cx, y: y + (lines - 1) * (CH + GAP) };
    cx += w + GAP;
    return chip;
  });
  const h = lines * CH + (lines - 1) * GAP;
  const out = { ...row, chips, y, h };
  y += Math.max(h, 32) + 20;
  return out;
});
const H = y - 20 + M;

const cycles = [...new Set(rows.map((r) => r.chips.length))];

const body = rows.map((r, i) => {
  const n = r.chips.length;
  const unit = 0.62;
  const mid = r.y + r.h / 2;
  return `
<rect class="puls" x="${M}" y="${(mid - 11).toFixed(1)}" width="2.5" height="22" rx="1.25" fill="${P.accent}" style="animation-delay:${(i * 0.5).toFixed(1)}s"/>
<text class="mono" x="${M + 13}" y="${(mid - 3).toFixed(1)}" font-size="10" letter-spacing="1.4" fill="${P.mid}">${r.label}</text>
<text class="mono" x="${M + 13}" y="${(mid + 11).toFixed(1)}" font-size="8.5" fill="${P.dimmer}">${r.note}</text>
<g class="mono" font-size="${FS}" text-anchor="middle">
${r.chips.map((c) => `  <rect x="${c.x}" y="${c.y}" width="${c.w}" height="${CH}" rx="6" fill="url(#${id.chip})" stroke="${P.line}"/><text x="${(c.x + c.w / 2).toFixed(1)}" y="${c.y + 14.8}" fill="${P.dim}">${esc(c.name)}</text>`).join('\n')}
</g>
<g fill="none" stroke="${P.accent}" stroke-width="1.2">
${r.chips.map((c, j) => `  <rect class="lit${n}" x="${c.x}" y="${c.y}" width="${c.w}" height="${CH}" rx="6" style="animation-delay:${(j * unit).toFixed(2)}s"/>`).join('\n')}
</g>
<g class="mono" font-size="${FS}" text-anchor="middle" fill="${P.spark}">
${r.chips.map((c, j) => `  <text class="lit${n}" x="${(c.x + c.w / 2).toFixed(1)}" y="${c.y + 14.8}" style="animation-delay:${(j * unit).toFixed(2)}s">${esc(c.name)}</text>`).join('\n')}
</g>`;
}).join('\n');

const total = rows.reduce((a, r) => a + r.chips.length, 0);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Stack grouped by purpose. ${rows.map((r) => `${r.label}, ${r.note}: ${r.items.join(', ')}`).join('. ')}.">
<defs>${defs(id, W, H, 12)}</defs>
<style>${ANIM}
${cycles.map((n) => `  .lit${n}{opacity:0;animation:k${n} ${(n * 0.62).toFixed(2)}s linear infinite}
  @keyframes k${n}{0%{opacity:0}${(12 / n).toFixed(2)}%{opacity:1}${(88 / n).toFixed(2)}%{opacity:1}${(100 / n).toFixed(2)}%{opacity:0}100%{opacity:0}}`).join('\n')}
</style>
${frame(id, W, H, 12)}
${header(M, W, 'GROUPED BY WHAT IT BUILDS · NOT BY WHAT IS POPULAR', `${total} TOOLS · ${rows.length} DOMAINS`, 40)}
${body}
</svg>
`;

console.log(`stack  ${W}x${H} · ${total} chips · ${rows.length} rows  ${emit('stack', svg)}B`);
