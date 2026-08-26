// IntelliQ and Edgix, authored at 440px so they can sit side by side in a table
// without being downscaled. Everything is drawn at final size: no band is
// narrower than 130px, no label smaller than 8.5px, and the two diagrams share
// an identical height so the table row stays square.
//
// The visual grammar is the same in both: producers on top, the rule that the
// whole system turns on in the middle, storage or stop at the bottom, and a
// marching spine to show direction of travel.
import { P } from './palette.mjs';
import { ids, defs, ANIM, frame, esc } from './kit.mjs';
import { emit } from './light.mjs';

const W = 440, M = 18, INNER = W - M * 2, H = 375;

// ---- band primitives -------------------------------------------------------

function arrow(x, y1, y2, delay = 0) {
  return `<path d="M${x} ${y1}V${y2 - 4}" stroke="${P.rule}"/>
<path class="march" d="M${x} ${y1}V${y2 - 4}" stroke="${P.accent}" stroke-width="1.2" stroke-opacity=".85" style="animation-delay:${delay}s"/>
<path d="M${x - 3.2} ${y2 - 4.5}L${x} ${y2}L${x + 3.2} ${y2 - 4.5}Z" fill="${P.accent}" fill-opacity=".8"/>`;
}

// Converging feed: several columns funnelling into one point.
function funnel(xs, y1, y2, xc) {
  const mid = (y1 + y2) / 2;
  return xs.map((x, i) => `<path d="M${x} ${y1}V${mid}Q${x} ${mid + 4} ${x + Math.sign(xc - x) * 3} ${mid + 4}H${xc}" fill="none" stroke="${P.rule}"/>
<path class="flow" d="M${x} ${y1}V${mid}Q${x} ${mid + 4} ${x + Math.sign(xc - x) * 3} ${mid + 4}H${xc}" fill="none" stroke="${P.spark}" stroke-width="1.1" stroke-opacity=".75" style="animation-delay:${(i * 0.22).toFixed(2)}s"/>`).join('\n')
    + `\n<path d="M${xc} ${mid + 4}V${y2 - 4}" stroke="${P.rule}"/>
<path class="march" d="M${xc} ${mid + 4}V${y2 - 4}" stroke="${P.accent}" stroke-width="1.2"/>
<path d="M${xc - 3.2} ${y2 - 4.5}L${xc} ${y2}L${xc + 3.2} ${y2 - 4.5}Z" fill="${P.accent}" fill-opacity=".8"/>`;
}

// Fan-out: one point feeding several columns.
function fan(xc, y1, xs, y2) {
  const mid = (y1 + y2) / 2;
  return `<path d="M${xc} ${y1}V${mid}" stroke="${P.rule}"/>
<path class="march" d="M${xc} ${y1}V${mid}" stroke="${P.accent}" stroke-width="1.2"/>
` + xs.map((x, i) => `<path d="M${xc} ${mid}H${x}V${y2 - 4}" fill="none" stroke="${P.rule}"/>
<path class="flow" d="M${xc} ${mid}H${x}V${y2 - 4}" fill="none" stroke="${P.spark}" stroke-width="1.1" stroke-opacity=".75" style="animation-delay:${(i * 0.24).toFixed(2)}s"/>
<path d="M${x - 3.2} ${y2 - 4.5}L${x} ${y2}L${x + 3.2} ${y2 - 4.5}Z" fill="${P.accent}" fill-opacity=".8"/>`).join('\n');
}

function chipRow(id, items, y, h, cols) {
  const gap = 7;
  const w = (INNER - gap * (cols - 1)) / cols;
  return items.map((t, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = M + col * (w + gap), yy = y + row * (h + gap);
    return `<rect x="${x.toFixed(1)}" y="${yy}" width="${w.toFixed(1)}" height="${h}" rx="7" fill="url(#${id.chip})" stroke="${P.line}"/>
<rect class="lit" x="${x.toFixed(1)}" y="${yy}" width="${w.toFixed(1)}" height="${h}" rx="7" fill="none" stroke="${P.spark}" stroke-opacity=".9" style="animation-delay:${(i * 0.5).toFixed(2)}s"/>
<text class="mono" x="${(x + w / 2).toFixed(1)}" y="${yy + h / 2 + 3.4}" font-size="9" letter-spacing=".6" fill="${P.mid}" text-anchor="middle">${esc(t)}</text>`;
  }).join('\n');
}

// The load-bearing band: a wide rule with a title, a subtitle and a corner tag.
function bar(id, { y, h, k, v, tag, tone = P.accent, pips = 0, flow = false }) {
  const tw = tag ? Math.round(tag.length * 5.5 + 16) : 0;
  return `<rect x="${M}" y="${y}" width="${INNER}" height="${h}" rx="9" fill="url(#${id.chip})" stroke="${tone}" stroke-opacity=".5"/>
<rect x="${M}" y="${y}" width="3" height="${h}" rx="1.5" fill="${tone}"/>
<rect class="puls" x="${M}" y="${y}" width="${INNER}" height="${h}" rx="9" fill="none" stroke="${tone}" stroke-opacity=".85"/>
<text class="mono" x="${M + 14}" y="${y + 19}" font-size="10" letter-spacing="1.2" font-weight="600" fill="${tone}">${esc(k)}</text>
<text class="mono" x="${M + 14}" y="${y + 33}" font-size="8.5" fill="${P.dim}">${esc(v)}</text>
${tag ? `<rect x="${W - M - tw - 10}" y="${y + 9}" width="${tw}" height="16" rx="5" fill="${tone}" fill-opacity=".16" stroke="${tone}" stroke-opacity=".5"/>
<text class="mono" x="${W - M - tw / 2 - 10}" y="${y + 20.5}" font-size="7.5" letter-spacing=".9" fill="${tone}" text-anchor="middle">${esc(tag)}</text>` : ''}
${pips ? Array.from({ length: pips }, (_, i) => `<rect class="lit" x="${W - M - 16 - (pips - 1 - i) * 11}" y="${y + h - 14}" width="7" height="5" rx="2.5" fill="${tone}" style="animation-delay:${(i * 0.55).toFixed(2)}s"/><rect x="${W - M - 16 - (pips - 1 - i) * 11}" y="${y + h - 14}" width="7" height="5" rx="2.5" fill="${P.rule}"/>`).join('\n') : ''}
${flow ? `<path class="flow" d="M${M + 150} ${y + h / 2}H${W - M - 90}" stroke="${P.spark}" stroke-width="1.3" stroke-opacity=".8"/>
<circle cx="${M + 150}" cy="${y + h / 2}" r="2.6" fill="${P.spark}"><animateMotion dur="3.2s" repeatCount="indefinite" path="M0,0H${INNER - 240}"/></circle>
<circle cx="${M + 150}" cy="${y + h / 2}" r="2.6" fill="${P.spark}" opacity=".6"><animateMotion dur="3.2s" begin="1.6s" repeatCount="indefinite" path="M0,0H${INNER - 240}"/></circle>` : ''}`;
}

function split(id, { y, h, boxes }) {
  const gap = 8, w = (INNER - gap) / 2;
  return boxes.map((b, i) => {
    const x = M + i * (w + gap);
    return `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="8" fill="url(#${id.chip})" stroke="${P.line}"/>
<rect class="lit" x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="8" fill="none" stroke="${P.accent}" stroke-opacity=".8" style="animation-delay:${(i * 1.6).toFixed(1)}s"/>
<text class="mono" x="${(x + 12).toFixed(1)}" y="${y + 18}" font-size="9.5" letter-spacing=".9" font-weight="600" fill="${P.text}">${esc(b.k)}</text>
<text class="mono" x="${(x + 12).toFixed(1)}" y="${y + 32}" font-size="8" fill="${P.dim}">${esc(b.v1)}</text>
<text class="mono" x="${(x + 12).toFixed(1)}" y="${y + 44}" font-size="8" fill="${P.dimmer}">${esc(b.v2)}</text>`;
  }).join('\n');
}

function shell(id, { title, badge, pitch, body, stack, label }) {
  const bw = Math.round(badge.length * 5.4 + 18);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<defs>${defs(id, W, H)}</defs>
<style>${ANIM}
  .lit{opacity:0;animation:lit 3.4s ease-in-out infinite}
  @keyframes lit{0%{opacity:0}12%{opacity:1}34%{opacity:1}46%{opacity:0}100%{opacity:0}}
</style>
${frame(id, W, H)}
<text class="sans" x="${M}" y="30" font-size="17" font-weight="700" letter-spacing="-.2" fill="${P.text}">${esc(title)}</text>
<rect x="${W - M - bw}" y="18" width="${bw}" height="16" rx="5" fill="${P.spark}" fill-opacity=".14" stroke="${P.spark}" stroke-opacity=".45"/>
<text class="mono" x="${W - M - bw / 2}" y="29.5" font-size="7.5" letter-spacing=".9" fill="${P.spark}" text-anchor="middle">${esc(badge)}</text>
<text class="mono" x="${M}" y="47" font-size="9" fill="${P.accent}">${esc(pitch)}</text>
<path d="M${M} 58h${INNER}" stroke="${P.line}"/>
${body}
<path d="M${M} ${H - 34}h${INNER}" stroke="${P.line}"/>
<text class="mono" x="${M}" y="${H - 18}" font-size="8" letter-spacing=".7" fill="${P.dimmer}">${esc(stack)}</text>
</svg>
`;
}

// ---- IntelliQ --------------------------------------------------------------

const iq = ids('iq');
const XC = W / 2;
const iqCols = [M + 65, XC, W - M - 65];

const intelliq = shell(iq, {
  title: 'IntelliQ',
  badge: 'PERSONALIZED AI ECOSYSTEM',
  pitch: 'a personalized AI ecosystem: one API, six client surfaces',
  stack: 'Node.js · Express · PostgreSQL · Docker · Oracle Cloud',
  label: 'IntelliQ, a personalized AI ecosystem. Six thin clients (web widget, browser extension, Android, desktop, VS Code, dashboard) funnel into a four-tier permission gate that fails closed. Behind it, a modular monolith where one repository file per module owns its SQL, and a hand-written multi-provider failover router. Storage is third-normal-form PostgreSQL with AES-256-GCM applied in the application layer above the database.',
  body: `<text class="mono" x="${M}" y="73" font-size="8" letter-spacing="1.6" fill="${P.dimmer}">CLIENTS · NO LOGIC, NO DB CONNECTION</text>
${chipRow(iq, ['WEB WIDGET', 'EXTENSION', 'ANDROID', 'DESKTOP', 'VS CODE', 'DASHBOARD'], 78, 28, 3)}
${funnel(iqCols, 141, 161, XC)}
${bar(iq, { y: 161, h: 42, k: 'PERMISSION GATE', v: 'four tiers · error inside a check counts as denial', tag: 'FAILS CLOSED', pips: 4 })}
${arrow(XC, 203, 219)}
${split(iq, {
    y: 219, h: 56, boxes: [
      { k: 'MODULAR MONOLITH', v1: 'one repo file', v2: 'owns each table' },
      { k: 'FAILOVER ROUTER', v1: 'model chain', v2: 'no LangChain' },
    ],
  })}
${arrow(XC, 275, 291)}
${bar(iq, { y: 291, h: 46, k: 'POSTGRESQL · THIRD NORMAL FORM', v: 'AES-256-GCM applied above the database, key never beside ciphertext', tone: P.spark })}`,
});

// ---- Edgix -----------------------------------------------------------------

const ed = ids('ed');
const edCols = [M + 65, XC, W - M - 65];

const edgix = shell(ed, {
  title: 'Edgix',
  badge: 'AUTOMATED AI TRADING BOT',
  pitch: 'an automated, pipelined trading bot with a human kill switch',
  stack: 'Python · Redpanda · PyTorch · Prometheus · Grafana',
  label: 'Edgix, an automated and pipelined AI trading bot. A sentiment engine, a network-isolated listing scanner and a feature builder publish onto an at-least-once Redpanda event bus with a schema registry. Risk guardrails, idempotent execution and outcome logging consume from it, and no service ever calls another directly. The risk service can veto any decision and the veto is not overridable at runtime. A manual, logged kill switch is the single write path a human reaches for.',
  body: `<text class="mono" x="${M}" y="73" font-size="8" letter-spacing="1.6" fill="${P.dimmer}">PRODUCERS · PUBLISH ONLY</text>
${chipRow(ed, ['SENTIMENT', 'LISTINGS', 'FEATURES'], 78, 28, 3)}
${funnel(edCols, 106, 122, XC)}
${bar(ed, { y: 122, h: 42, k: 'EVENT BUS · REDPANDA', v: 'at-least-once · schema registry · no direct calls', flow: true })}
${fan(XC, 164, edCols, 180)}
${chipRow(ed, ['RISK', 'EXECUTION', 'OUTCOME LOG'], 180, 28, 3)}
${arrow(XC, 208, 224)}
${bar(ed, { y: 224, h: 46, k: 'RISK CAN VETO ANY DECISION', v: 'size is a function of which source produced the signal', tag: 'NOT OVERRIDABLE', tone: P.spark })}
${arrow(XC, 270, 286)}
${bar(ed, { y: 286, h: 51, k: 'MANUAL KILL SWITCH', v: 'the single write path a human reaches for, every use recorded', tag: 'HUMAN ONLY', tone: P.warn })}`,
});

console.log(`intelliq  ${W}x${H}  ${emit('intelliq', intelliq)}B`);
console.log(`edgix     ${W}x${H}  ${emit('edgix', edgix)}B`);
