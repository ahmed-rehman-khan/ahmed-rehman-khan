// Shared panel furniture. Every panel is the same object: a rounded card, a
// slowly drifting dot field, a hairline border, and a header rule with a
// status line on the left and a count on the right. Defining it once keeps the
// eleven assets reading as one system rather than eleven separate pictures.
import { P, FONTS } from './palette.mjs';

// Unique per-file id suffix, because several of these SVGs end up on the same
// rendered page and duplicate ids would let one panel steal another's gradient.
export function ids(tag) {
  return {
    dots: `dots_${tag}`, card: `card_${tag}`, chip: `chip_${tag}`,
    clip: `clip_${tag}`, glow: `glow_${tag}`, sweep: `sweep_${tag}`,
  };
}

export function defs(id, W, H, r = 14) {
  return `
  <pattern id="${id.dots}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.1" cy="1.1" r="1" fill="${P.spark}" opacity="0.05"/></pattern>
  <linearGradient id="${id.card}" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0%" stop-color="${P.card1}"/><stop offset="100%" stop-color="${P.card2}"/></linearGradient>
  <linearGradient id="${id.chip}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${P.chip1}"/><stop offset="100%" stop-color="${P.chip2}"/></linearGradient>
  <linearGradient id="${id.sweep}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${P.spark}" stop-opacity="0"/><stop offset="50%" stop-color="${P.spark}" stop-opacity=".85"/><stop offset="100%" stop-color="${P.spark}" stop-opacity="0"/></linearGradient>
  <radialGradient id="${id.glow}" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="${P.accent}" stop-opacity=".30"/><stop offset="100%" stop-color="${P.accent}" stop-opacity="0"/></radialGradient>
  <clipPath id="${id.clip}"><rect width="${W}" height="${H}" rx="${r}"/></clipPath>`;
}

// Steady-state animations only. Nothing here starts from opacity 0 on a
// load-bearing element, so a frozen or animation-stripped render of any panel
// is still a correct picture.
export const ANIM = `${FONTS}
  .drift{animation:drift 26s linear infinite}
  @keyframes drift{to{transform:translate(22px,22px)}}
  .puls{animation:puls 3.4s ease-in-out infinite}
  @keyframes puls{0%,100%{opacity:.45}50%{opacity:1}}
  .halo{animation:halo 2.6s ease-out infinite}
  @keyframes halo{0%{opacity:.55;transform:scale(1)}100%{opacity:0;transform:scale(2.6)}}
  .march{stroke-dasharray:3 6;animation:march 1.5s linear infinite}
  @keyframes march{to{stroke-dashoffset:-9}}
  .flow{stroke-dasharray:5 9;animation:flow 1.9s linear infinite}
  @keyframes flow{to{stroke-dashoffset:-14}}`;

// The card body: gradient fill, drifting dot field clipped to the corner
// radius, corner glow, hairline border.
export function frame(id, W, H, r = 14) {
  return `<rect width="${W}" height="${H}" rx="${r}" fill="url(#${id.card})"/>
<g clip-path="url(#${id.clip})">
  <rect class="drift" x="-22" y="-22" width="${W + 44}" height="${H + 44}" fill="url(#${id.dots})"/>
  <ellipse cx="${(W * 0.82).toFixed(0)}" cy="-30" rx="${(W * 0.45).toFixed(0)}" ry="150" fill="url(#${id.glow})"/>
</g>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="${r - 0.75}" fill="none" stroke="${P.line}"/>`;
}

// Header: pulsing accent tick, status line, right-hand count, hairline rule.
export function header(M, W, left, right, y = 30) {
  return `<rect class="puls" x="${M}" y="${y - 10}" width="2.5" height="13" rx="1.25" fill="${P.accent}"/>
<text class="mono" x="${M + 13}" y="${y}" font-size="9.5" letter-spacing="1.5" fill="${P.mid}">${left}</text>
<text class="mono" x="${W - M}" y="${y}" font-size="9.5" letter-spacing="1.2" fill="${P.accent}" text-anchor="end">${right}</text>
<path d="M${M} ${y + 13}h${W - M * 2}" stroke="${P.line}"/>`;
}

export const esc = (s) => String(s)
  .split('&').join('&amp;')
  .split('<').join('&lt;')
  .split('>').join('&gt;');
