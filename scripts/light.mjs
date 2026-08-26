// Derives the light variant of an asset from its dark source by ordered colour
// substitution. Geometry is never touched, so the light and dark files are
// guaranteed to be pixel-identical in layout.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { LIGHT_MAP } from './palette.mjs';

export function toLight(svg) {
  let out = svg;
  for (const [from, to] of LIGHT_MAP) out = out.split(from).join(to);
  return out;
}

// Writes both variants and returns the byte size of the dark one.
export function emit(name, svg) {
  writeFileSync(`assets/${name}-dark.svg`, svg);
  writeFileSync(`assets/${name}-light.svg`, toLight(svg));
  return Buffer.byteLength(svg);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const n of process.argv.slice(2)) {
    writeFileSync(`assets/${n}-light.svg`, toLight(readFileSync(`assets/${n}-dark.svg`, 'utf8')));
    console.log(`light  ${n}-light.svg`);
  }
}
