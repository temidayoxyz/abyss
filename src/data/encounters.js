/** Occasional mysterious encounter definitions */

export const ENCOUNTERS = [
  {
    id: "vast_shadow",
    minDepth: 800,
    maxDepth: 5000,
    weight: 3,
    cooldown: 90,
    message: "An enormous shadow slides past at the edge of visibility… and is gone.",
    type: "shadow",
  },
  {
    id: "unknown_ping",
    minDepth: 400,
    maxDepth: 5000,
    weight: 4,
    cooldown: 70,
    message: "Unknown sonar return — structured, repeating, not in the catalogue.",
    type: "sonar",
  },
  {
    id: "trench_lights",
    minDepth: 1500,
    maxDepth: 5000,
    weight: 2,
    cooldown: 120,
    message: "Faint lights move in formation through an unexplored trench corridor.",
    type: "lights",
  },
  {
    id: "whale_song",
    minDepth: 100,
    maxDepth: 1200,
    weight: 3,
    cooldown: 100,
    message: "A low, rolling call vibrates through the hull — something vast and distant.",
    type: "sound",
  },
  {
    id: "metal_groan",
    minDepth: 200,
    maxDepth: 2000,
    weight: 2,
    cooldown: 110,
    message: "Hull sensors pick up a metallic groan from below. No wreck marked on charts.",
    type: "sound",
  },
  {
    id: "biolume_wave",
    minDepth: 300,
    maxDepth: 2500,
    weight: 3,
    cooldown: 80,
    message: "A wave of blue light races across the midwater and dissolves into marine snow.",
    type: "lights",
  },
  {
    id: "pressure_whisper",
    minDepth: 2000,
    maxDepth: 5000,
    weight: 2,
    cooldown: 130,
    message: "Pressure gauges flutter without cause. For a moment the abyss feels… attentive.",
    type: "pressure",
  },
  {
    id: "ruin_chime",
    minDepth: 700,
    maxDepth: 2000,
    weight: 1,
    cooldown: 150,
    message: "A soft harmonic tone — almost musical — emanates from somewhere near the ruins.",
    type: "sound",
  },
];

export function pickEncounter(depth, lastTimes = {}, now = performance.now() / 1000) {
  const eligible = ENCOUNTERS.filter((e) => {
    if (depth < e.minDepth || depth > e.maxDepth) return false;
    const last = lastTimes[e.id] ?? -Infinity;
    return now - last >= e.cooldown;
  });
  if (!eligible.length) return null;
  const total = eligible.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const e of eligible) {
    r -= e.weight;
    if (r <= 0) return e;
  }
  return eligible[eligible.length - 1];
}
