// The five lesson helpers, drawn as SVG (flat shapes, big eyes, no outlines). Each is a string so
// the app draws it with SvgXml and `scripts/export-art.mjs` can save it as an .svg file.
// viewBox is 120 x 120 for all of them. Who they are and when they appear: docs/CHARACTERS.md.

const EYE = (x, y, r = 5) => `
  <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r + 1}" fill="#FFFFFF"/>
  <circle cx="${x + 0.8}" cy="${y + 1}" r="${r * 0.6}" fill="#2B2B33"/>
  <circle cx="${x + 2}" cy="${y - 0.6}" r="${r * 0.24}" fill="#FFFFFF"/>`;

const SHADOW = '<ellipse cx="60" cy="113" rx="32" ry="5" fill="#000000" opacity="0.1"/>';

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${SHADOW}${body}</svg>`;

// Paul: the letter-writing teacher. Bald on top, grey beard, a scroll in hand.
const paul = svg(`
  <path d="M28 112 Q26 72 60 66 Q94 72 92 112Z" fill="#8E3B46"/>
  <path d="M28 112 Q32 82 52 70 L58 112Z" fill="#702C36"/>
  <path d="M33 54 Q30 32 40 30 L80 30 Q90 32 87 54Z" fill="#9A8C82"/>
  <circle cx="60" cy="46" r="24" fill="#DDA56C"/>
  <path d="M36 52 Q34 38 40 33 Q38 44 42 52Z" fill="#9A8C82"/>
  <path d="M84 52 Q86 38 80 33 Q82 44 78 52Z" fill="#9A8C82"/>
  <circle cx="36" cy="50" r="4.5" fill="#D29A62"/>
  <circle cx="84" cy="50" r="4.5" fill="#D29A62"/>
  <ellipse cx="52" cy="29" rx="7" ry="3.5" fill="#FFFFFF" opacity="0.35"/>
  <path d="M37 50 Q39 86 60 88 Q81 86 83 50 Q75 63 60 63 Q45 63 37 50Z" fill="#9A8C82"/>
  <path d="M49 59 Q60 54 71 59 Q60 63 49 59Z" fill="#7D7068"/>
  <path d="M55 66 Q60 70 65 66Z" fill="#6B2A22"/>
  <path d="M45 37 Q51 33 57 37" stroke="#7D7068" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M63 37 Q69 33 75 37" stroke="#7D7068" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  ${EYE(51, 45)}${EYE(69, 45)}
  <ellipse cx="60" cy="53" rx="3.5" ry="3" fill="#C98A55"/>
  <g transform="rotate(-14 80 90)">
    <rect x="62" y="82" width="34" height="17" rx="2" fill="#F6E7C6"/>
    <rect x="60" y="80" width="6" height="21" rx="3" fill="#E3CB98"/>
    <rect x="92" y="80" width="6" height="21" rx="3" fill="#E3CB98"/>
    <path d="M70 87 H88 M70 91 H86 M70 95 H84" stroke="#B9A37A" stroke-width="1.6" stroke-linecap="round"/>
  </g>
  <circle cx="60" cy="96" r="6" fill="#DDA56C"/>
  <circle cx="98" cy="84" r="6" fill="#DDA56C"/>`);

// Jesus: a gentle, welcoming figure with open arms. He never speaks invented lines in the app.
const jesus = svg(`
  <circle cx="60" cy="40" r="31" fill="none" stroke="#FFD966" stroke-width="3" opacity="0.8"/>
  <path d="M38 82 L14 64" stroke="#F4F1EA" stroke-width="13" stroke-linecap="round"/>
  <path d="M82 82 L106 64" stroke="#F4F1EA" stroke-width="13" stroke-linecap="round"/>
  <circle cx="12" cy="62" r="6.5" fill="#C68E5E"/>
  <circle cx="108" cy="62" r="6.5" fill="#C68E5E"/>
  <path d="M28 112 Q26 72 60 66 Q94 72 92 112Z" fill="#F4F1EA"/>
  <path d="M42 70 L86 112 L73 112 L34 78Z" fill="#2E6FB5"/>
  <path d="M34 46 Q34 17 60 17 Q86 17 86 46 L88 72 Q80 77 75 66 L45 66 Q40 77 32 72Z" fill="#5C3A21"/>
  <circle cx="60" cy="44" r="21" fill="#C68E5E"/>
  <path d="M39 41 Q42 21 60 21 Q78 21 81 41 Q73 30 61 31 L60 28 L59 31 Q47 30 39 41Z" fill="#5C3A21"/>
  <path d="M41 50 Q43 74 60 76 Q77 74 79 50 Q71 61 60 61 Q49 61 41 50Z" fill="#5C3A21"/>
  <path d="M53 58 Q60 65 67 58Z" fill="#8A3B2B"/>
  ${EYE(52, 43, 4.5)}${EYE(68, 43, 4.5)}
  <ellipse cx="60" cy="51" rx="3" ry="2.5" fill="#B57C4E"/>`);

// The camel: patient and steady, shows up when you need to wait or keep going.
const camel = svg(`
  <path d="M26 72 Q14 78 18 90" stroke="#B88A4E" stroke-width="4" fill="none" stroke-linecap="round"/>
  <rect x="32" y="80" width="9" height="30" rx="4" fill="#C99A5B"/>
  <rect x="46" y="82" width="9" height="28" rx="4" fill="#B88A4E"/>
  <rect x="70" y="80" width="9" height="30" rx="4" fill="#C99A5B"/>
  <rect x="83" y="82" width="9" height="28" rx="4" fill="#B88A4E"/>
  <ellipse cx="60" cy="74" rx="35" ry="18" fill="#DCB070"/>
  <path d="M34 68 Q50 30 74 62Z" fill="#DCB070"/>
  <path d="M38 64 Q52 42 70 62 L72 80 L36 80Z" fill="#C0392B"/>
  <path d="M38 70 H71 M37 76 H72" stroke="#F1C40F" stroke-width="2.5"/>
  <path d="M84 72 Q98 62 93 40 L105 37 Q110 64 92 82Z" fill="#DCB070"/>
  <ellipse cx="105" cy="33" rx="14" ry="10" fill="#DCB070"/>
  <ellipse cx="113" cy="37" rx="6.5" ry="6" fill="#EBC993"/>
  <circle cx="115" cy="35" r="1.2" fill="#7A5A30"/>
  <ellipse cx="96" cy="23" rx="3" ry="5" fill="#C99A5B"/>
  ${EYE(102, 30, 4.5)}
  <path d="M97 24 L95 21 M101 23 L101 20 M105 24 L107 21" stroke="#5A4128" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M108 42 Q112 45 116 42" stroke="#7A5A30" stroke-width="2" fill="none" stroke-linecap="round"/>`);

// The lamb: soft and curious, introduces new words.
const lamb = svg(`
  <rect x="40" y="84" width="7" height="24" rx="3" fill="#4A4A52"/>
  <rect x="53" y="86" width="7" height="22" rx="3" fill="#3B3B42"/>
  <rect x="68" y="84" width="7" height="24" rx="3" fill="#4A4A52"/>
  <rect x="80" y="86" width="7" height="22" rx="3" fill="#3B3B42"/>
  <g fill="#DCE3E9">
    <circle cx="44" cy="76" r="14"/><circle cx="60" cy="68" r="16"/><circle cx="78" cy="70" r="15"/>
    <circle cx="90" cy="80" r="12"/><circle cx="64" cy="86" r="16"/><circle cx="46" cy="88" r="12"/><circle cx="82" cy="90" r="12"/>
  </g>
  <g fill="#FFFFFF">
    <circle cx="44" cy="73" r="13"/><circle cx="60" cy="65" r="15"/><circle cx="78" cy="67" r="14"/>
    <circle cx="89" cy="77" r="11"/><circle cx="64" cy="82" r="15"/><circle cx="46" cy="85" r="11"/><circle cx="82" cy="87" r="11"/>
  </g>
  <ellipse cx="20" cy="54" rx="9" ry="4.5" fill="#5D5D66" transform="rotate(-25 20 54)"/>
  <ellipse cx="20" cy="54" rx="5" ry="2.2" fill="#F5A9B8" transform="rotate(-25 20 54)"/>
  <ellipse cx="44" cy="52" rx="9" ry="4.5" fill="#5D5D66" transform="rotate(25 44 52)"/>
  <ellipse cx="32" cy="62" rx="13" ry="15" fill="#5D5D66"/>
  <circle cx="26" cy="47" r="6" fill="#FFFFFF"/><circle cx="34" cy="45" r="6.5" fill="#FFFFFF"/><circle cx="40" cy="49" r="5" fill="#FFFFFF"/>
  ${EYE(27, 60, 4)}${EYE(37, 60, 4)}
  <circle cx="23" cy="68" r="2.5" fill="#F5A9B8" opacity="0.8"/>
  <circle cx="41" cy="68" r="2.5" fill="#F5A9B8" opacity="0.8"/>
  <path d="M29 70 Q32 73 35 70" stroke="#2B2B33" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);

// The fish: quick and cheerful, points things out "in this chapter" (Galilee's fishermen).
const fish = svg(`
  <circle cx="14" cy="42" r="4" fill="none" stroke="#9DDCF0" stroke-width="2"/>
  <circle cx="20" cy="30" r="3" fill="none" stroke="#9DDCF0" stroke-width="2"/>
  <circle cx="12" cy="20" r="2" fill="none" stroke="#9DDCF0" stroke-width="2"/>
  <path d="M86 60 L110 40 Q103 62 110 84Z" fill="#1B8FB0"/>
  <path d="M44 42 Q57 24 72 40Z" fill="#1B8FB0"/>
  <path d="M20 62 Q50 24 90 60 Q50 98 20 62Z" fill="#2EAFD0"/>
  <path d="M28 67 Q52 90 86 62 Q52 78 28 67Z" fill="#A7E3F0"/>
  <path d="M60 48 Q64 55 60 62 M70 50 Q74 57 70 64 M80 54 Q83 60 80 66" stroke="#57C3DD" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M52 66 Q60 78 68 64Z" fill="#1B8FB0"/>
  <circle cx="38" cy="56" r="9" fill="#FFFFFF"/>
  <circle cx="36.5" cy="57" r="5.2" fill="#2B2B33"/>
  <circle cx="39" cy="54" r="1.8" fill="#FFFFFF"/>
  <path d="M24 69 Q29 73 33 69" stroke="#145E73" stroke-width="2" fill="none" stroke-linecap="round"/>`);

export const CHARACTERS = { paul, jesus, camel, lamb, fish };

export const CHARACTER_NAMES = {
  paul: 'Paul',
  jesus: 'Jesus',
  camel: 'Camel',
  lamb: 'Lamb',
  fish: 'Fish',
};
