// Background scenes, one per kind of biblical setting, and which chapter happens where.
// Each scene is an SVG string (viewBox 400 x 300) that covers its box ("slice"), drawn with SvgXml.

const svg = (id, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">${body}</svg>`;

const sky = (id, top, bottom) => `
  <defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
  </linearGradient></defs>
  <rect width="400" height="300" fill="url(#${id}-sky)"/>`;

const cloud = (x, y, s = 1) => `
  <g fill="#FFFFFF" opacity="0.9" transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="22" ry="10"/><ellipse cx="16" cy="-6" rx="16" ry="11"/><ellipse cx="32" cy="0" rx="18" ry="9"/>
  </g>`;

// Sea of Galilee: fishing boat, nets, a jumping fish.
const sea = svg('sea', `${sky('sea', '#8FD3F4', '#E6F6FF')}
  <circle cx="330" cy="58" r="26" fill="#FFE07A"/>
  ${cloud(60, 50)}${cloud(230, 80, 0.8)}
  <path d="M0 150 Q60 112 120 138 T240 132 T400 138 V170 H0Z" fill="#9CC9A8"/>
  <rect y="160" width="400" height="140" fill="#3A9AD9"/>
  <path d="M0 176 Q25 168 50 176 T100 176 T150 176 T200 176 T250 176 T300 176 T350 176 T400 176 V300 H0Z" fill="#2E86C1"/>
  <path d="M30 212 q15 -8 30 0 M118 244 q15 -8 30 0 M262 222 q15 -8 30 0 M330 262 q15 -8 30 0" stroke="#BDE3F7" stroke-width="4" fill="none" stroke-linecap="round"/>
  <g transform="translate(150 148)">
    <rect x="52" y="-44" width="5" height="86" fill="#6B3A1E"/>
    <path d="M57 -42 L102 30 H57Z" fill="#FFF8E7"/>
    <path d="M52 -32 L18 30 H52Z" fill="#F3E3C3"/>
    <path d="M-4 38 H114 L98 66 H12Z" fill="#A0522D"/>
    <path d="M-4 38 H114 L110 46 H0Z" fill="#7A3E1D"/>
    <path d="M104 46 Q122 72 136 98 M110 46 Q132 66 150 86" stroke="#E8D9B5" stroke-width="2.5" fill="none"/>
  </g>
  <path d="M58 232 q12 -14 24 0 q-12 10 -24 0Z" fill="#F5B041"/><path d="M82 232 l9 -7 v14z" fill="#F5B041"/>`);

// Mountains: snowy peaks behind green hills (Sermon on the Mount, Transfiguration, Mount of Olives).
const mountain = svg('mountain', `${sky('mountain', '#A8D8F0', '#FFF6E5')}
  ${cloud(40, 60)}${cloud(280, 40, 1.1)}
  <path d="M-30 230 L90 76 L210 230Z" fill="#8E9CC8"/>
  <path d="M90 76 L68 104 L80 98 L91 110 L102 98 L113 104Z" fill="#FFFFFF"/>
  <path d="M120 236 L262 54 L410 236Z" fill="#7383B8"/>
  <path d="M262 54 L238 86 L252 80 L263 94 L276 80 L288 86Z" fill="#FFFFFF"/>
  <path d="M0 232 Q100 168 200 210 T400 196 V300 H0Z" fill="#7BC67E"/>
  <path d="M0 262 Q120 226 240 256 T400 248 V300 H0Z" fill="#58A55C"/>
  <g fill="#FFFFFF"><circle cx="70" cy="270" r="3"/><circle cx="160" cy="280" r="3"/><circle cx="300" cy="272" r="3"/></g>
  <g fill="#F7DC6F"><circle cx="70" cy="270" r="1.4"/><circle cx="160" cy="280" r="1.4"/><circle cx="300" cy="272" r="1.4"/></g>`);

// Desert: dunes, palms, a big sun (the Magi's journey, roads between towns).
const desert = svg('desert', `${sky('desert', '#F9C784', '#FFF1D6')}
  <circle cx="300" cy="90" r="42" fill="#FFE29A"/>
  <circle cx="300" cy="90" r="30" fill="#FFD166"/>
  <path d="M0 190 Q90 150 180 180 T400 170 V300 H0Z" fill="#E9B872"/>
  <path d="M0 230 Q110 190 220 222 T400 214 V300 H0Z" fill="#DDA15E"/>
  <path d="M0 268 Q140 240 270 262 T400 258 V300 H0Z" fill="#C98B48"/>
  <g transform="translate(70 150)">
    <path d="M10 70 Q14 30 8 0" stroke="#8B5A2B" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M8 0 Q-14 -6 -26 8 M8 0 Q-6 -18 -20 -20 M8 0 Q24 -20 38 -14 M8 0 Q30 -4 40 10 M8 0 Q10 -20 4 -28" stroke="#3E8E41" stroke-width="7" fill="none" stroke-linecap="round"/>
  </g>
  <g transform="translate(330 176) scale(0.7)">
    <path d="M10 70 Q14 30 8 0" stroke="#8B5A2B" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M8 0 Q-14 -6 -26 8 M8 0 Q-6 -18 -20 -20 M8 0 Q24 -20 38 -14 M8 0 Q30 -4 40 10" stroke="#3E8E41" stroke-width="7" fill="none" stroke-linecap="round"/>
  </g>`);

// Wilderness: rocky Judean cliffs and the Jordan river (John the Baptist, the temptation).
const wilderness = svg('wilderness', `${sky('wilderness', '#F6B78C', '#FDE8D0')}
  <circle cx="90" cy="80" r="24" fill="#FFF0C2"/>
  <path d="M0 170 L40 120 H120 L150 160 L190 110 H270 L300 150 L340 125 H400 V200 H0Z" fill="#B9835A"/>
  <path d="M40 132 H122 M190 122 H272 M10 158 H380" stroke="#A06B45" stroke-width="3"/>
  <path d="M0 200 Q100 180 200 196 T400 190 V300 H0Z" fill="#D4A373"/>
  <path d="M196 300 C206 270 248 262 254 236 C258 216 284 206 300 196 L312 198 C296 212 274 222 272 240 C266 268 238 280 236 300Z" fill="#5DADE2"/>
  <path d="M214 292 C226 274 252 266 260 244" stroke="#AED6F1" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g fill="#7D8F4E"><circle cx="60" cy="240" r="10"/><circle cx="74" cy="244" r="8"/><circle cx="160" cy="262" r="9"/><circle cx="350" cy="250" r="10"/></g>
  <g fill="#A3B15F"><circle cx="58" cy="236" r="5"/><circle cx="158" cy="258" r="4"/><circle cx="348" cy="246" r="5"/></g>`);

// Forest / olive grove: Gethsemane, the garden tomb, the vine and the fig tree.
const tree = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-4 60 Q-8 30 0 10 Q6 30 6 60Z" fill="#7B5B3A"/>
    <ellipse cx="0" cy="0" rx="34" ry="24" fill="#7F9C6B"/>
    <ellipse cx="-14" cy="-8" rx="18" ry="14" fill="#93B07D"/>
    <ellipse cx="14" cy="-12" rx="16" ry="12" fill="#A3BE8C"/>
  </g>`;
const forest = svg('forest', `${sky('forest', '#BFE3C0', '#F3FAEE')}
  ${cloud(250, 50, 0.9)}
  <path d="M0 160 Q100 130 200 150 T400 140 V300 H0Z" fill="#A9CF8F"/>
  ${tree(40, 150, 0.7)}${tree(130, 140, 0.6)}${tree(250, 145, 0.65)}${tree(350, 150, 0.7)}
  <path d="M0 210 Q100 186 200 204 T400 196 V300 H0Z" fill="#7DB862"/>
  ${tree(80, 200, 1)}${tree(300, 205, 1.05)}
  <path d="M170 300 Q190 250 200 220 Q210 250 236 300Z" fill="#E6D3A3"/>`);

// Town: Jerusalem's walls, flat-roofed houses and the Temple.
const town = svg('town', `${sky('town', '#9FD5F2', '#FDF6E8')}
  ${cloud(50, 50)}${cloud(300, 70, 0.8)}
  <path d="M0 170 Q100 140 200 160 T400 150 V300 H0Z" fill="#B8D8A0"/>
  <g fill="#E9D8B4">
    <rect x="150" y="96" width="100" height="64"/>
    <rect x="136" y="88" width="128" height="12"/>
  </g>
  <g fill="#D8C29A"><rect x="166" y="112" width="8" height="48"/><rect x="186" y="112" width="8" height="48"/><rect x="206" y="112" width="8" height="48"/><rect x="226" y="112" width="8" height="48"/></g>
  <rect x="190" y="76" width="20" height="12" fill="#F2C94C"/>
  <g fill="#F1E3C6">
    <rect x="30" y="150" width="50" height="40"/><rect x="90" y="140" width="40" height="50"/>
    <rect x="270" y="146" width="44" height="44"/><rect x="322" y="152" width="56" height="38"/>
  </g>
  <g fill="#C9A86A"><rect x="44" y="164" width="9" height="12"/><rect x="104" y="156" width="9" height="12"/><rect x="284" y="160" width="9" height="12"/><rect x="340" y="166" width="9" height="12"/></g>
  <rect y="186" width="400" height="44" fill="#D9C08C"/>
  <path d="M0 186 V174 H20 V186 H40 V174 H60 V186 H80 V174 H100 V186 H120 V174 H140 V186 H160 V174 H180 V186 H200 V174 H220 V186 H240 V174 H260 V186 H280 V174 H300 V186 H320 V174 H340 V186 H360 V174 H380 V186 H400" fill="#D9C08C"/>
  <path d="M182 230 V204 Q200 186 218 204 V230Z" fill="#8C6A3F"/>
  <path d="M0 220 H400" stroke="#C5A872" stroke-width="2"/>
  <path d="M0 230 Q200 214 400 230 V300 H0Z" fill="#9CC584"/>`);

// Field: rolling pasture, wheat and sheep (shepherds, the sower, the lost sheep).
const sheep = (x, y) => `
  <g transform="translate(${x} ${y})">
    <rect x="-8" y="6" width="3" height="8" fill="#4A4A52"/><rect x="5" y="6" width="3" height="8" fill="#4A4A52"/>
    <ellipse cx="0" cy="2" rx="13" ry="9" fill="#FFFFFF"/>
    <ellipse cx="-13" cy="-1" rx="5" ry="6" fill="#5D5D66"/>
  </g>`;
const field = svg('field', `${sky('field', '#A6DCF5', '#F7FBEA')}
  <circle cx="70" cy="60" r="22" fill="#FFE07A"/>
  ${cloud(210, 50)}${cloud(320, 90, 0.7)}
  <path d="M0 150 Q100 118 200 140 T400 128 V300 H0Z" fill="#9ED17B"/>
  <path d="M220 150 Q300 132 400 140 V200 Q300 186 220 196Z" fill="#F2C94C"/>
  <path d="M240 160 V186 M260 156 V188 M280 152 V186 M300 150 V186 M320 148 V188 M340 148 V188 M360 146 V190 M380 146 V190" stroke="#D4A82E" stroke-width="2"/>
  <path d="M0 200 Q120 176 240 198 T400 192 V300 H0Z" fill="#7CC05A"/>
  ${sheep(80, 220)}${sheep(130, 240)}${sheep(190, 226)}${sheep(110, 268)}
  <path d="M300 300 V230 M340 300 V236 M300 246 H340 M300 266 H340" stroke="#8B6B43" stroke-width="5" stroke-linecap="round"/>`);

// Map of the Holy Land in Jesus' time (stylised, not to scale).
const place = (x, y, name, dx = 7, dy = 4) => `
  <circle cx="${x}" cy="${y}" r="4" fill="#B03A2E"/><circle cx="${x}" cy="${y}" r="1.6" fill="#FFFFFF"/>
  <text x="${x + dx}" y="${y + dy}" font-family="Georgia, serif" font-size="11" fill="#4A3520">${name}</text>`;
const map = svg('map', `
  <rect width="400" height="300" fill="#F3E2BC"/>
  <path d="M0 0 H150 Q140 40 146 80 Q132 130 136 170 Q124 220 118 300 H0Z" fill="#8FC7E3"/>
  <path d="M150 0 Q140 40 146 80 Q132 130 136 170 Q124 220 118 300" stroke="#6FA8C8" stroke-width="3" fill="none"/>
  <text x="34" y="160" font-family="Georgia, serif" font-size="12" font-style="italic" fill="#2E6F95" transform="rotate(-80 50 160)">Mediterranean Sea</text>
  <ellipse cx="252" cy="82" rx="13" ry="19" fill="#5DADE2"/>
  <path d="M252 100 Q260 120 248 140 Q240 160 254 178 Q262 192 248 200" stroke="#5DADE2" stroke-width="3.5" fill="none"/>
  <ellipse cx="248" cy="236" rx="13" ry="38" fill="#5DADE2"/>
  <text x="270" y="86" font-family="Georgia, serif" font-size="10" font-style="italic" fill="#2E6F95">Sea of Galilee</text>
  <text x="266" y="148" font-family="Georgia, serif" font-size="10" font-style="italic" fill="#2E6F95">Jordan</text>
  <text x="266" y="246" font-family="Georgia, serif" font-size="10" font-style="italic" fill="#2E6F95">Dead Sea</text>
  <g font-family="Georgia, serif" font-size="13" font-weight="bold" letter-spacing="3" fill="#A0855B">
    <text x="162" y="120">GALILEE</text><text x="160" y="168">SAMARIA</text><text x="150" y="282">JUDEA</text>
  </g>
  ${place(214, 86, 'Nazareth', -58, 4)}${place(246, 62, 'Capernaum', -64, -2)}
  ${place(208, 214, 'Jerusalem', -60, 4)}${place(204, 240, 'Bethlehem', -62, 6)}${place(232, 206, 'Jericho', -38, -10)}
  <g transform="translate(360 44)">
    <circle r="18" fill="#FBF3DF" stroke="#A0855B" stroke-width="2"/>
    <path d="M0 -15 L5 0 L0 15 L-5 0Z" fill="#B03A2E"/><path d="M0 15 L5 0 L-5 0Z" fill="#4A3520"/>
    <text x="-4" y="-20" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#4A3520">N</text>
  </g>`);

export const SCENES = { sea, mountain, desert, wilderness, forest, town, field, map };

export const SCENE_NAMES = {
  sea: 'Sea of Galilee',
  mountain: 'Mountains',
  desert: 'Desert',
  wilderness: 'Wilderness and the Jordan',
  forest: 'Olive grove',
  town: 'Jerusalem',
  field: 'Fields and pasture',
  map: 'Map of the Holy Land',
};

// Where each Gospel chapter mostly happens. Index 0 is chapter 1. A chapter with several places
// gets the one it is best known for. Books without a list use the map.
const CHAPTER_SCENES = {
  Matthew: [
    'map', 'desert', 'wilderness', 'sea', 'mountain', 'mountain', 'mountain', 'sea', 'town', 'map',
    'town', 'field', 'sea', 'sea', 'field', 'map', 'mountain', 'town', 'map', 'field',
    'town', 'town', 'town', 'mountain', 'field', 'forest', 'town', 'mountain',
  ],
  Mark: [
    'wilderness', 'town', 'sea', 'sea', 'sea', 'sea', 'town', 'sea', 'mountain', 'map',
    'town', 'town', 'mountain', 'forest', 'town', 'forest',
  ],
  Luke: [
    'town', 'field', 'wilderness', 'wilderness', 'sea', 'mountain', 'town', 'sea', 'mountain', 'desert',
    'town', 'field', 'forest', 'town', 'field', 'town', 'map', 'desert', 'town', 'town',
    'town', 'forest', 'town', 'desert',
  ],
  John: [
    'wilderness', 'town', 'town', 'desert', 'town', 'sea', 'town', 'town', 'town', 'field',
    'town', 'town', 'town', 'town', 'forest', 'town', 'town', 'forest', 'town', 'forest',
    'sea',
  ],
};

// bookName is the English name the API uses ("John"), chapterNumber starts at 1.
export function sceneForChapter(bookName, chapterNumber) {
  return CHAPTER_SCENES[bookName]?.[chapterNumber - 1] ?? 'map';
}
