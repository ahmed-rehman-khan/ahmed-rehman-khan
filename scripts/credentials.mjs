// Credentials panel. Generated so the light variant can never drift, and so the
// degree, the CGPA, the certifications and the virtual experience programs read
// as one instrument panel rather than as three separate tables.
//
// Three bands, in descending order of weight: the degree, then the certifications
// that back it, then the industry job simulations. Everything on this panel is
// finished, so each card carries a completion mark and nothing carries a progress
// bar or a status caveat.
import { P } from './palette.mjs';
import { ids, defs, ANIM, frame, header } from './kit.mjs';
import { emit } from './light.mjs';

const id = ids('cr');

const ICONS = {
  // Institution: three columns under a pediment.
  campus: '<path d="M-9 6h18"/><path d="M-9-1l9-5 9 5"/><path d="M-6-1v7M0-1v7M6-1v7"/>',
  // Agentic AI: one node delegating to two.
  agent: '<circle cx="0" cy="-5" r="2.6"/><circle cx="-5.5" cy="5" r="2.4"/><circle cx="5.5" cy="5" r="2.4"/><path d="M-1.6-3.2l-2.6 5.9M1.6-3.2l2.6 5.9"/>',
  // Cybersecurity: shield with a check.
  shield: '<path d="M0-7l7 2.6v5.1C7 4.2 3.9 6.6 0 7.6-3.9 6.6-7 4.2-7 .7v-5.1z"/><path d="M-3 0l2.4 2.4L3.4-2.6"/>',
  // UX: an artboard with a cursor.
  board: '<rect x="-7" y="-6.4" width="14" height="12.8" rx="2"/><path d="M-7-2.6h14"/><path d="M-2 1l4.8 2.2-2 .5-.6 2z"/>',
  // Data analytics: three columns of differing height on a baseline.
  bars: '<path d="M-7 6V-1M0 6v-9M7 6V2"/><path d="M-9 7h18"/>',
  // Software engineering: a pair of braces.
  braces: '<path d="M-2.5-6C-5-6-4.5-2.5-6.5-2.5-4.5-2.5-5 1-2.5 1"/><path d="M2.5-6C5-6 4.5-2.5 6.5-2.5 4.5-2.5 5 1 2.5 1"/><path d="M-4 5.5h8"/>',
  // Software development: a terminal prompt.
  term: '<rect x="-7.5" y="-6" width="15" height="12" rx="2"/><path d="M-4.5-1.5l2.2 1.8-2.2 1.8"/><path d="M0 3.2h4"/>',
};

const CERTS = [
  { icon: 'agent', l1: 'Agentic AI Foundations', l2: 'Associate', issuer: 'ORACLE' },
  { icon: 'shield', l1: 'CS50 Introduction to', l2: 'Cybersecurity', issuer: 'HARVARDX' },
  { icon: 'board', l1: 'UX Design', l2: 'Certificate', issuer: 'GOOGLE · JUL 2025' },
];

// Industry job simulations. Kept as a separate band because a simulation is not a
// certification and should not be dressed up as one, but three of them from three
// different engineering organisations is worth its own row.
const PROGRAMS = [
  { icon: 'bars', org: 'DELOITTE', l1: 'Technology, Cyber and Data', l2: 'Analytics job simulations' },
  { icon: 'braces', org: 'WALMART USA', l1: 'Advanced Software', l2: 'Engineering experience' },
  { icon: 'term', org: 'CITI', l1: 'ICG Technology Software', l2: 'Development job simulation' },
];

const W = 900, M = 28, R = W - M, inner = R - M;
const EY = 68, EH = 80;                 // education card
const SY = EY + EH + 10;                // distribution spine junction
const CY = SY + 26, CH = 100;           // certification row, far enough below the
                                        // junction that the three drop legs are
                                        // legible rather than 6px stubs
const VRULE = CY + CH + 24;             // rule above the virtual experience band
const VY = VRULE + 24, VH = 84;         // virtual experience row
const GAP = 13;
const CDW = (inner - GAP * (CERTS.length - 1)) / CERTS.length;
const H = VY + VH + M;

const cx = (i) => M + i * (CDW + GAP) + CDW / 2;
const CGPA = 3.87, CGPA_MAX = 4;
const RI = R - 24;                      // right inset, so nothing bleeds into the border
const BAR_W = 148, BAR_X = RI - BAR_W;
const FILL = (BAR_W * CGPA / CGPA_MAX).toFixed(1);

const cards = CERTS.map((c, i) => {
  const x = M + i * (CDW + GAP);
  const delay = (i * 2.4).toFixed(1);
  return `
<g transform="translate(${x.toFixed(1)} ${CY})">
  <rect width="${CDW.toFixed(1)}" height="${CH}" rx="9" fill="url(#${id.chip})" stroke="${P.line}"/>
  <rect class="cl" width="${CDW.toFixed(1)}" height="${CH}" rx="9" fill="none" stroke="${P.accent}" stroke-width="1.2" style="animation-delay:${delay}s"/>
  <g transform="translate(25 30)" fill="none" stroke="${P.dim}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${ICONS[c.icon]}</g>
  <g class="cl" transform="translate(25 30)" fill="none" stroke="${P.spark}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:${delay}s">${ICONS[c.icon]}</g>
  <text class="sans" x="18" y="59" font-size="11.5" font-weight="600" fill="${P.text}">${c.l1}</text>
  <text class="sans" x="18" y="74" font-size="11.5" font-weight="600" fill="${P.text}">${c.l2}</text>
  <text class="mono" x="18" y="90" font-size="8.5" letter-spacing="1.1" fill="${P.dimmer}">${c.issuer}</text>
  <g transform="translate(${(CDW - 24).toFixed(1)} 28)">
    <circle r="6.5" fill="${P.accent}" fill-opacity=".16" stroke="${P.accent}" stroke-opacity=".75"/>
    <circle class="halo" r="6.5" fill="none" stroke="${P.accent}" stroke-width="1.1" style="transform-origin:0 0;animation-delay:${(i * 0.8).toFixed(1)}s"/>
    <path d="M-2.7 .2l2 2 3.4-4" fill="none" stroke="${P.spark}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text class="mono" x="${(CDW - 36).toFixed(1)}" y="31" font-size="7.5" letter-spacing="1" fill="${P.accent}" text-anchor="end">COMPLETE</text>
</g>`;
}).join('');

const programs = PROGRAMS.map((p, i) => {
  const x = M + i * (CDW + GAP);
  const delay = (i * 2.4 + 1.2).toFixed(1);
  return `
<g transform="translate(${x.toFixed(1)} ${VY})">
  <rect width="${CDW.toFixed(1)}" height="${VH}" rx="9" fill="url(#${id.chip})" stroke="${P.line}"/>
  <rect class="cl" width="${CDW.toFixed(1)}" height="${VH}" rx="9" fill="none" stroke="${P.r3}" stroke-width="1.2" style="animation-delay:${delay}s"/>
  <g transform="translate(26 27)" fill="none" stroke="${P.dim}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${ICONS[p.icon]}</g>
  <g class="cl" transform="translate(26 27)" fill="none" stroke="${P.r3}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" style="animation-delay:${delay}s">${ICONS[p.icon]}</g>
  <text class="sans" x="44" y="31" font-size="12" font-weight="700" letter-spacing=".4" fill="${P.text}">${p.org}</text>
  <text class="mono" x="18" y="52" font-size="8" fill="${P.dim}">${p.l1}</text>
  <text class="mono" x="18" y="63" font-size="8" fill="${P.dim}">${p.l2}</text>
  <rect x="16" y="69" width="114" height="15" rx="5" fill="${P.r3}" fill-opacity=".12" stroke="${P.r3}" stroke-opacity=".4"/>
  <text class="mono" x="26" y="79.5" font-size="7.2" letter-spacing=".9" fill="${P.r3}">FORAGE · JUL 2025</text>
</g>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Credentials. BS Computer Science at Institute of Business Management, Karachi, 2024 to 2028, third year, cumulative GPA 3.87 of 4.00, President&apos;s Merit Scholarship. Certifications: Oracle Agentic AI Foundations Associate, HarvardX CS50 Introduction to Cybersecurity, Google UX Design Certificate. Industry job simulations completed through Forage in July 2025: Deloitte technology, cyber and data analytics, Walmart USA advanced software engineering, and Citi ICG technology software development.">
<defs>${defs(id, W, H, 12)}
  <linearGradient id="sw_cr" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${P.spark}" stop-opacity="0"/><stop offset="50%" stop-color="${P.spark}" stop-opacity=".9"/><stop offset="100%" stop-color="${P.spark}" stop-opacity="0"/></linearGradient>
  <clipPath id="cb_cr"><rect x="${BAR_X}" y="${EY + 56}" width="${FILL}" height="6" rx="3"/></clipPath>
</defs>
<style>${ANIM}
  .bsw{animation:bsw 3.6s ease-in-out infinite}
  @keyframes bsw{0%{transform:translateX(-72px)}62%,100%{transform:translateX(${BAR_W}px)}}
  .cl{opacity:0;animation:cl 7.2s linear infinite}
  @keyframes cl{0%{opacity:0}3%{opacity:1}30%{opacity:1}33%{opacity:0}100%{opacity:0}}
</style>
${frame(id, W, H, 12)}
${header(M, W, 'DEGREE · CERTIFICATIONS · INDUSTRY SIMULATIONS', `1 DEGREE · ${CERTS.length} CERTIFICATIONS · ${PROGRAMS.length} PROGRAMS`, 41)}

<rect x="${M}" y="${EY}" width="${inner}" height="${EH}" rx="9" fill="url(#${id.chip})" stroke="${P.line}"/>
<g transform="translate(52 ${EY + 40})" fill="none" stroke="${P.accent}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICONS.campus}</g>
<text class="sans" x="82" y="${EY + 29}" font-size="13" font-weight="700" letter-spacing="1.2" fill="${P.text}">BS COMPUTER SCIENCE · THIRD YEAR</text>
<text class="mono" x="82" y="${EY + 46}" font-size="9.5" fill="${P.dim}">Institute of Business Management, Karachi · 2024 to 2028</text>
<rect x="82" y="${EY + 54}" width="198" height="17" rx="5" fill="${P.accent}" fill-opacity=".1" stroke="${P.accent}" stroke-opacity=".45"/>
<text class="mono" x="92" y="${EY + 66}" font-size="8" letter-spacing=".9" fill="${P.accent}">PRESIDENT&apos;S MERIT SCHOLARSHIP</text>

<text class="mono" x="${RI}" y="${EY + 22}" font-size="8.5" letter-spacing="1.5" fill="${P.dimmer}" text-anchor="end">CUMULATIVE GPA</text>
<text class="sans" x="${RI}" y="${EY + 48}" font-size="24" font-weight="700" letter-spacing="-.6" fill="${P.text}" text-anchor="end">${CGPA.toFixed(2)}<tspan class="mono" font-size="10.5" font-weight="400" letter-spacing="0" fill="${P.dim}"> / ${CGPA_MAX.toFixed(2)}</tspan></text>
<rect x="${BAR_X}" y="${EY + 56}" width="${BAR_W}" height="6" rx="3" fill="${P.rule}"/>
<rect x="${BAR_X}" y="${EY + 56}" width="${FILL}" height="6" rx="3" fill="${P.accent}"/>
<g clip-path="url(#cb_cr)"><rect class="bsw" x="${BAR_X}" y="${EY + 56}" width="72" height="6" fill="url(#sw_cr)"/></g>

<g fill="none" stroke="${P.rule}">
  <path d="M${W / 2} ${EY + EH}v${SY + 4 - EY - EH}"/>
  <path d="M${cx(0).toFixed(1)} ${SY + 4}H${cx(2).toFixed(1)}"/>
${CERTS.map((_, i) => `  <path d="M${cx(i).toFixed(1)} ${SY + 4}v${CY - SY - 4}"/>`).join('\n')}
</g>
<path class="march" d="M${cx(0).toFixed(1)} ${SY + 4}H${cx(2).toFixed(1)}" fill="none" stroke="${P.accent}" stroke-width="1.1" stroke-opacity=".8"/>
${cards}

<path d="M${M} ${VRULE}h${inner}" stroke="${P.line}"/>
<text class="mono" x="${M}" y="${VRULE + 16}" font-size="8.5" letter-spacing="1.4" fill="${P.mid}">INDUSTRY JOB SIMULATIONS · ENGINEERING BRIEFS FROM REAL ORGANISATIONS</text>
<text class="mono" x="${R}" y="${VRULE + 16}" font-size="8.5" letter-spacing="1.1" fill="${P.r3}" text-anchor="end">VIRTUAL EXPERIENCE</text>
${programs}
</svg>
`;

console.log(`credentials  ${W}x${H} · 1 degree · ${CERTS.length} certifications · ${PROGRAMS.length} programs  ${emit('credentials', svg)}B`);
