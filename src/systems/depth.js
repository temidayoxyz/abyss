/**
 * Depth-driven environmental model.
 * Depth is positive downward (meters). Surface y ≈ 0 in world; world Y decreases with depth.
 */

export const MAX_DEPTH = 5000;
export const SURFACE_Y = 40;
export const WORLD_SCALE = 1; // 1 world unit ≈ 1 meter vertically for depth feel

/** Convert world Y to depth meters */
export function depthFromY(y) {
  return Math.max(0, SURFACE_Y - y);
}

/** Convert depth meters to world Y */
export function yFromDepth(depth) {
  return SURFACE_Y - depth;
}

/**
 * Returns environmental state for a given depth (meters).
 */
export function getEnvironmentAtDepth(depth) {
  const d = Math.max(0, Math.min(MAX_DEPTH, depth));
  const t = d / MAX_DEPTH;

  // Zones
  let zone = "sunlit";
  if (d > 200) zone = "twilight";
  if (d > 1000) zone = "midnight";
  if (d > 2000) zone = "abyss";
  if (d > 3500) zone = "hadal";

  // Fog / visibility (meters)
  let visibility = 80;
  if (d < 50) visibility = 90 - d * 0.3;
  else if (d < 200) visibility = 75 - (d - 50) * 0.2;
  else if (d < 1000) visibility = 45 - (d - 200) * 0.025;
  else if (d < 2500) visibility = 25 - (d - 1000) * 0.008;
  else visibility = Math.max(6, 13 - (d - 2500) * 0.002);

  // Water colour (fog)
  const fogColor = waterColour(d);

  // Ambient light intensity
  let ambient = 0.55;
  if (d < 30) ambient = 0.7 - d * 0.005;
  else if (d < 200) ambient = 0.55 - (d - 30) * 0.002;
  else if (d < 1000) ambient = 0.21 - (d - 200) * 0.00015;
  else if (d < 2500) ambient = 0.09 - (d - 1000) * 0.00003;
  else ambient = Math.max(0.015, 0.045 - (d - 2500) * 0.00001);

  // Directional sun residual
  let sun = Math.max(0, 0.85 - d / 180);
  if (d > 200) sun = Math.max(0, 0.12 - (d - 200) / 2000);

  // Temperature °C
  let temperature = 24;
  if (d < 100) temperature = 24 - d * 0.08;
  else if (d < 1000) temperature = 16 - (d - 100) * 0.01;
  else if (d < 2500) temperature = 7 - (d - 1000) * 0.002;
  else temperature = Math.max(1.5, 4 - (d - 2500) * 0.0006);

  // Pressure atmospheres (approx 1 atm + 1 per 10m)
  const pressure = 1 + d / 10;

  // Particle density
  const marineSnow = 0.3 + Math.min(1, d / 800) * 0.7;
  const caustics = Math.max(0, 1 - d / 80);

  // Sound muffling / ambience pitch factor (for UI description)
  const soundMuffle = Math.min(1, d / 1500);

  return {
    depth: d,
    zone,
    visibility,
    fogColor,
    ambient,
    sun,
    temperature,
    pressure,
    marineSnow,
    caustics,
    soundMuffle,
    t,
  };
}

function waterColour(d) {
  // Surface cyan-blue → deep indigo → near-black violet
  if (d < 40) return lerpColor(0x3a9ec8, 0x1a6a9a, d / 40);
  if (d < 200) return lerpColor(0x1a6a9a, 0x0a3a5a, (d - 40) / 160);
  if (d < 1000) return lerpColor(0x0a3a5a, 0x051828, (d - 200) / 800);
  if (d < 2500) return lerpColor(0x051828, 0x020810, (d - 1000) / 1500);
  return lerpColor(0x020810, 0x010408, Math.min(1, (d - 2500) / 2500));
}

function lerpColor(a, b, t) {
  t = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

export function formatDepth(d) {
  if (d < 10) return d.toFixed(1);
  return Math.round(d).toString();
}
