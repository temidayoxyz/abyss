import * as THREE from "three";
import { createRenderer, createCamera, handleResize, OceanWorld } from "./systems/world.js";
import { Submarine } from "./systems/submarine.js";
import { getEnvironmentAtDepth } from "./systems/depth.js";
import { CreatureManager } from "./systems/creatures.js";
import { LandmarkManager } from "./systems/landmarks.js";
import { HUD } from "./systems/hud.js";
import { Journal, renderScanCard } from "./systems/journal.js";
import { OceanAudio } from "./systems/audio.js";
import { TouchControls } from "./systems/touch.js";
import { pickEncounter } from "./data/encounters.js";

const canvas = document.getElementById("ocean-canvas");
const titleScreen = document.getElementById("title-screen");
const btnStart = document.getElementById("btn-start");

const renderer = createRenderer(canvas);
const scene = new THREE.Scene();
const camera = createCamera();

const world = new OceanWorld(scene);
const sub = new Submarine(camera);
scene.add(sub.group);

const creatures = new CreatureManager(scene);
const landmarks = new LandmarkManager(scene);
const hud = new HUD();
const journal = new Journal();
const audio = new OceanAudio();

let running = false;
let last = performance.now();
let encounterClock = 25;
const encounterTimes = {};
let mysteriousShadow = null;
let shadowLife = 0;

// Initial fauna near surface
creatures.spawnAround(sub.position, 10, 16);

sub.bindInput(canvas);
const touch = new TouchControls(sub);

window.addEventListener("resize", () => handleResize(renderer, camera));

// Action bar + keys
function setupActions() {
  document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      doAction(btn.dataset.action);
    });
  });

  window.addEventListener("keydown", (e) => {
    if (!running) return;
    if (e.repeat) return;
    const code = e.code;
    if (code === "KeyL") doAction("lights");
    if (code === "KeyF") doAction("sonar");
    if (code === "KeyC") doAction("scan");
    if (code === "KeyX") doAction("sample");
    if (code === "KeyP") doAction("photo");
    if (code === "KeyJ") doAction("journal");
    if (code === "Escape") {
      journal.close();
      hud.hideScanModal();
    }
  });
}

function doAction(action) {
  if (!running) return;
  if (action === "journal") {
    journal.toggle();
    return;
  }
  if (journal.isOpen() || hud.isModalOpen()) {
    if (action === "scan" || action === "sample" || action === "photo") return;
  }

  switch (action) {
    case "lights": {
      if (sub.battery <= 0) {
        hud.toast("Battery depleted — systems offline", "warn");
        return;
      }
      const on = sub.toggleHeadlights();
      hud.toast(on ? "Headlights online" : "Headlights off");
      audio.blip();
      break;
    }
    case "sonar": {
      if (sub.battery <= 0) {
        hud.toast("Battery depleted — systems offline", "warn");
        return;
      }
      const on = sub.toggleSonar();
      hud.toast(on ? "Sonar active — mapping contacts" : "Sonar standby");
      if (on) audio.ping();
      else audio.blip();
      break;
    }
    case "scan":
      performScan();
      break;
    case "sample":
      performSample();
      break;
    case "photo":
      performPhoto();
      break;
  }
}

function performScan() {
  if (!sub.canScan()) {
    hud.toast("Scanner cooling down…");
    return;
  }
  hud.flashScanReticule();
  sub.markScan();
  audio.blip();

  const target = creatures.pickInView(sub.position, sub.forward, 50) || landmarks.pickInView(sub.position, sub.forward, 60);

  if (!target) {
    hud.toast("No biometric signature in view");
    return;
  }

  // Creature entity vs landmark
  if (target.species) {
    const entity = target;
    const { profile, isNew } = journal.discover(entity.species, { depth: sub.depth, kind: "scan" });
    entity.scanned = true;
    hud.showScanModal(renderScanCard(profile));
    hud.toast(isNew ? `New discovery: ${profile.name}` : `Rescanned: ${profile.name}`, isNew && profile.rarity !== "common" ? "rare" : "");
  } else {
    const lm = target;
    const { profile, isNew } = journal.discover(lm.def, { depth: sub.depth, kind: "scan" });
    lm.discovered = true;
    hud.showScanModal(renderScanCard(profile));
    hud.toast(isNew ? `Site logged: ${profile.name}` : `Site rescanned: ${profile.name}`, isNew ? "rare" : "");
  }
}

function performSample() {
  if (!sub.canSample()) {
    hud.toast("Sampler recharging…");
    return;
  }
  sub.markSample();
  audio.blip();

  const creature = creatures.pickInView(sub.position, sub.forward, 25, 0.88);
  const landmark = landmarks.pickInView(sub.position, sub.forward, 40, 0.7);
  const target = creature || landmark;

  if (!target) {
    hud.toast("Nothing in range to sample");
    return;
  }

  if (target.species) {
    const { profile, isNew } = journal.discover(target.species, { depth: sub.depth, kind: "sample" });
    hud.toast(isNew ? `Sample secured: ${profile.name}` : `Additional sample: ${profile.name}`);
  } else {
    const { profile, isNew } = journal.discover(target.def, { depth: sub.depth, kind: "sample" });
    target.sampled = true;
    hud.toast(isNew ? `Core sample: ${profile.name}` : `Extra sample: ${profile.name}`, "rare");
  }
}

function performPhoto() {
  if (!sub.canPhoto()) {
    hud.toast("Camera buffer full — wait");
    return;
  }
  sub.markPhoto();
  hud.photoFlash();
  audio.shutter();

  const creature = creatures.pickInView(sub.position, sub.forward, 55);
  const landmark = landmarks.pickInView(sub.position, sub.forward, 70);
  const target = creature || landmark;

  if (target?.species) {
    const { profile, isNew } = journal.discover(target.species, { depth: sub.depth, kind: "photo" });
    hud.toast(isNew ? `Photograph filed: ${profile.name}` : `Photo of ${profile.name} saved`);
  } else if (target?.def) {
    const { profile, isNew } = journal.discover(target.def, { depth: sub.depth, kind: "photo" });
    hud.toast(isNew ? `Site photographed: ${profile.name}` : `Photo archived: ${profile.name}`);
  } else {
    hud.toast("Environmental photograph archived");
  }
}

function updateEncounters(dt, env) {
  encounterClock -= dt;
  if (encounterClock > 0) return;
  encounterClock = 18 + Math.random() * 35;

  const now = performance.now() / 1000;
  const enc = pickEncounter(env.depth, encounterTimes, now);
  if (!enc) return;
  encounterTimes[enc.id] = now;
  hud.showEncounter(enc.message);
  audio.blip();

  if (enc.type === "shadow" || enc.id === "vast_shadow") {
    spawnMysteriousShadow();
  }
  if (enc.type === "lights" || enc.id === "trench_lights") {
    spawnDistantLights();
  }
}

function spawnMysteriousShadow() {
  if (mysteriousShadow) {
    scene.remove(mysteriousShadow);
  }
  const geo = new THREE.SphereGeometry(18, 12, 10);
  geo.scale(2.5, 0.7, 1.2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  mysteriousShadow = new THREE.Mesh(geo, mat);
  const f = sub.forward;
  mysteriousShadow.position.copy(sub.position).addScaledVector(f, 60).add(new THREE.Vector3((Math.random() - 0.5) * 40, -10, (Math.random() - 0.5) * 40));
  mysteriousShadow.userData.vel = f.clone().multiplyScalar(8).add(new THREE.Vector3(5, 0, 3));
  scene.add(mysteriousShadow);
  shadowLife = 8;
}

function spawnDistantLights() {
  const group = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const l = new THREE.PointLight(0xa090ff, 0.8, 30);
    l.position.set(i * 4 - 10, Math.sin(i) * 2, -i * 2);
    group.add(l);
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xc0b0ff })
    );
    orb.position.copy(l.position);
    group.add(orb);
  }
  const f = sub.forward;
  group.position.copy(sub.position).addScaledVector(f, 45).add(new THREE.Vector3(20, -15, -10));
  scene.add(group);
  const start = performance.now();
  const anim = () => {
    const t = (performance.now() - start) / 1000;
    group.position.addScaledVector(f, 0.05);
    group.position.x += Math.sin(t) * 0.05;
    if (t < 10) requestAnimationFrame(anim);
    else scene.remove(group);
  };
  requestAnimationFrame(anim);
}

// Initial atmosphere at spawn depth
world.applyEnvironment(getEnvironmentAtDepth(sub.depth));

function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!running) {
    // Gentle idle motion on the title screen
    const env = getEnvironmentAtDepth(sub.depth);
    world.update(dt, sub.position, env);
    creatures.update(dt, sub.position, env.depth);
    landmarks.update(dt);
    sub.yaw += dt * 0.08;
    camera.rotation.order = "YXZ";
    camera.rotation.y = sub.yaw;
    camera.rotation.x = -0.12;
    renderer.render(scene, camera);
    return;
  }

  const env = getEnvironmentAtDepth(sub.depth);
  sub.update(dt, env);
  world.update(dt, sub.position, env);
  creatures.update(dt, sub.position, env.depth);
  landmarks.update(dt);

  const nearbyC = creatures.getNearby(sub.position, sub.sonarOn ? 100 : 55);
  const nearbyL = landmarks.getNearby(sub.position, sub.sonarOn ? 120 : 70);

  hud.update(sub, env, nearbyC, nearbyL);
  audio.update(env, sub);
  updateEncounters(dt, env);

  // Proximity discovery hints
  for (const n of nearbyL) {
    if (n.distance < 25 && !n.landmark._hinted) {
      n.landmark._hinted = true;
      hud.toast(`Uncharted feature nearby — ${n.def.name}`);
    }
  }

  if (mysteriousShadow && shadowLife > 0) {
    shadowLife -= dt;
    mysteriousShadow.position.addScaledVector(mysteriousShadow.userData.vel, dt);
    mysteriousShadow.material.opacity = Math.max(0, 0.55 * (shadowLife / 8));
    if (shadowLife <= 0) {
      scene.remove(mysteriousShadow);
      mysteriousShadow = null;
    }
  }

  // Low oxygen warning
  if (sub.oxygen < 20 && Math.floor(now / 3000) !== Math.floor((now - dt * 1000) / 3000)) {
    hud.toast("Oxygen low — ascend toward the surface", "warn");
  }

  renderer.render(scene, camera);
}

btnStart?.addEventListener("click", async () => {
  titleScreen.classList.add("hidden");
  hud.show();
  running = true;
  await audio.start();
  // Soft unlock pointer on desktop
  canvas.requestPointerLock?.();
  hud.toast("Aurora-7 systems nominal. Safe descent.");
  creatures.spawnAround(sub.position, sub.depth, 12);
});

setupActions();
requestAnimationFrame(tick);

// Expose for debug
window.__abyss = { sub, creatures, landmarks, journal, scene };
