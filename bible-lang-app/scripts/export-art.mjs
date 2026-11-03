// Saves every character and scene as an .svg file, plus a gallery page, in docs/art/.
// Run from bible-lang-app/:  node scripts/export-art.mjs
import { Buffer } from 'node:buffer';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', '..', 'docs', 'art');

// The art files use `export const`, which Node only loads as ES modules: import them as data URLs.
const load = async (file) => {
  const code = readFileSync(join(here, '..', 'src', 'art', file), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
};
const { CHARACTERS, CHARACTER_NAMES } = await load('characters.js');
const { SCENES, SCENE_NAMES } = await load('scenes.js');

mkdirSync(out, { recursive: true });
for (const [id, xml] of Object.entries(CHARACTERS)) writeFileSync(join(out, `character-${id}.svg`), xml);
for (const [id, xml] of Object.entries(SCENES)) writeFileSync(join(out, `scene-${id}.svg`), xml);

const tile = (file, name, wide) =>
  `<figure class="${wide ? 'wide' : ''}"><img src="${file}" alt="${name}"><figcaption>${name}</figcaption></figure>`;
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>BibleDuo art</title>
<style>
  body { font-family: system-ui, sans-serif; background: #EEF2F4; color: #16263A; margin: 0; padding: 24px 16px; }
  h1, h2 { max-width: 960px; margin: 0 auto 12px; } h2 { margin-top: 28px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; max-width: 960px; margin: 0 auto; }
  .grid.scenes { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
  figure { margin: 0; background: #fff; border-radius: 14px; padding: 12px; text-align: center; }
  figure.wide { padding: 0; overflow: hidden; } figure.wide img { aspect-ratio: 4 / 3; object-fit: cover; }
  img { width: 100%; display: block; } figcaption { font-weight: 700; padding: 8px 0 4px; }
</style>
<h1>BibleDuo art</h1>
<h2>Characters</h2><div class="grid">${Object.keys(CHARACTERS).map((id) => tile(`character-${id}.svg`, CHARACTER_NAMES[id])).join('')}</div>
<h2>Scenes</h2><div class="grid scenes">${Object.keys(SCENES).map((id) => tile(`scene-${id}.svg`, SCENE_NAMES[id], true)).join('')}</div>
`
);
console.log(`Wrote ${Object.keys(CHARACTERS).length} characters and ${Object.keys(SCENES).length} scenes to ${out}`);
