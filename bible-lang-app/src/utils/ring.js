// Geometry for the three-part ring around each level circle.
// Angles are in degrees, 0 = straight up, going clockwise.

export function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// An SVG path for one arc of a circle.
export function arcPath(cx, cy, r, startDeg, endDeg) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// `count` equal arcs with a small gap between them.
export function ringSegments(count = 3, gapDeg = 22) {
  const span = 360 / count;
  return Array.from({ length: count }, (_, i) => ({
    start: i * span + gapDeg / 2,
    end: (i + 1) * span - gapDeg / 2,
  }));
}
