import * as THREE from "three";
import { LANDMARK_TYPES } from "../data/creatures.js";
import { yFromDepth } from "./depth.js";

function coralCluster() {
  const g = new THREE.Group();
  const colours = [0xff6b6b, 0xffa06a, 0x6ad4a0, 0xe8a0c8, 0x50b0ff];
  for (let i = 0; i < 18; i++) {
    const h = 1.5 + Math.random() * 4;
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15 + Math.random() * 0.35, 0.3 + Math.random() * 0.5, h, 6),
      new THREE.MeshStandardMaterial({
        color: colours[i % colours.length],
        roughness: 0.7,
        flatShading: true,
      })
    );
    mesh.position.set((Math.random() - 0.5) * 12, h / 2, (Math.random() - 0.5) * 12);
    mesh.rotation.z = (Math.random() - 0.5) * 0.3;
    mesh.rotation.x = (Math.random() - 0.5) * 0.2;
    g.add(mesh);
    // branches
    if (Math.random() > 0.5) {
      const br = mesh.clone();
      br.scale.setScalar(0.5);
      br.position.y += h * 0.3;
      br.position.x += 0.4;
      br.rotation.z = 0.6;
      g.add(br);
    }
  }
  // seafloor plate
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 12, 0.6, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a5a48, roughness: 0.9, flatShading: true })
  );
  floor.position.y = -0.2;
  g.add(floor);
  return g;
}

function shipwreck() {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.85, metalness: 0.2, flatShading: true });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(18, 5, 6), hullMat);
  hull.position.y = 2.5;
  g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(3.2, 7, 4), hullMat);
  bow.rotation.z = -Math.PI / 2;
  bow.position.set(12, 2.5, 0);
  g.add(bow);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 12, 6),
    new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.9 })
  );
  mast.position.set(-2, 8, 0);
  mast.rotation.z = 0.15;
  g.add(mast);
  // hole
  const hole = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2.5, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 1 })
  );
  hole.position.set(2, 3, 3.1);
  g.add(hole);
  g.rotation.y = Math.random() * Math.PI;
  g.rotation.z = 0.1;
  return g;
}

function caveEntrance() {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.95, flatShading: true });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = 6 + (i % 3) * 1.2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2 + Math.random() * 2.5, 0), rockMat);
    rock.position.set(Math.cos(a) * r, Math.random() * 4, Math.sin(a) * r);
    rock.scale.y = 1.5 + Math.random();
    g.add(rock);
  }
  // dark mouth
  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0x010204 })
  );
  mouth.position.y = 2;
  g.add(mouth);
  // glow inside
  const glow = new THREE.PointLight(0x2060a0, 0.6, 20);
  glow.position.set(0, 2, -2);
  g.add(glow);
  return g;
}

function hydrothermalVent() {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x1a1814, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 5; i++) {
    const h = 4 + Math.random() * 10;
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4 + Math.random() * 0.5, 1.2 + Math.random(), h, 7),
      rockMat
    );
    chimney.position.set((Math.random() - 0.5) * 10, h / 2, (Math.random() - 0.5) * 10);
    g.add(chimney);
    const light = new THREE.PointLight(0xff6020, 1.2, 18);
    light.position.copy(chimney.position);
    light.position.y = h + 0.5;
    g.add(light);
    // plume particles as simple stacked translucent spheres
    for (let p = 0; p < 6; p++) {
      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 + p * 0.25, 6, 6),
        new THREE.MeshBasicMaterial({
          color: 0x221810,
          transparent: true,
          opacity: 0.25 - p * 0.03,
          depthWrite: false,
        })
      );
      smoke.position.copy(chimney.position);
      smoke.position.y = h + 1 + p * 1.4;
      smoke.userData.plume = true;
      smoke.userData.baseY = smoke.position.y;
      smoke.userData.phase = Math.random() * Math.PI * 2;
      g.add(smoke);
    }
  }
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(14, 16, 1, 10),
    new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 1, flatShading: true })
  );
  g.add(floor);
  return g;
}

function ancientRuins() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.85, flatShading: true });
  const glow = new THREE.MeshStandardMaterial({
    color: 0x80a0ff,
    emissive: 0x4060ff,
    emissiveIntensity: 0.35,
    roughness: 0.5,
  });

  // pillars
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 10, 6), stone);
    pillar.position.set(Math.cos(a) * 10, 5, Math.sin(a) * 10);
    pillar.rotation.z = (Math.random() - 0.5) * 0.15;
    g.add(pillar);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), glow);
    cap.position.set(pillar.position.x, 10.2, pillar.position.z);
    g.add(cap);
  }
  // arch
  const archL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 8, 1.5), stone);
  archL.position.set(-3, 4, 0);
  const archR = archL.clone();
  archR.position.x = 3;
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(9, 1.5, 1.5), stone);
  archTop.position.set(0, 8.5, 0);
  g.add(archL, archR, archTop);
  // floor mosaic glow
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.5, 12), glow);
  floor.position.y = 0.2;
  floor.material = glow.clone();
  floor.material.emissiveIntensity = 0.15;
  floor.material.color.setHex(0x304060);
  g.add(floor);

  const pl = new THREE.PointLight(0x6080ff, 1.5, 35);
  pl.position.set(0, 6, 0);
  g.add(pl);
  return g;
}

function trenchMouth() {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x12151a, roughness: 0.95, flatShading: true });
  // cliffs
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 8; i++) {
      const cliff = new THREE.Mesh(new THREE.BoxGeometry(8 + Math.random() * 6, 25 + Math.random() * 20, 6), rockMat);
      cliff.position.set(side * (12 + Math.random() * 8), -10 - Math.random() * 15, (i - 4) * 8);
      cliff.rotation.z = side * 0.2;
      g.add(cliff);
    }
  }
  const voidMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 80),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
  );
  voidMesh.rotation.x = Math.PI / 2;
  voidMesh.position.y = -30;
  g.add(voidMesh);
  // mysterious lights
  for (let i = 0; i < 5; i++) {
    const l = new THREE.PointLight(0xa080ff, 0.4, 25);
    l.position.set((Math.random() - 0.5) * 8, -15 - Math.random() * 20, (Math.random() - 0.5) * 30);
    l.userData.mystery = true;
    l.userData.phase = Math.random() * Math.PI * 2;
    g.add(l);
  }
  return g;
}

const BUILDERS = {
  coral_reef: coralCluster,
  shipwreck: shipwreck,
  cave: caveEntrance,
  vent: hydrothermalVent,
  ruins: ancientRuins,
  trench: trenchMouth,
};

export class LandmarkManager {
  constructor(scene) {
    this.scene = scene;
    this.landmarks = [];
    this._seedWorld();
  }

  _seedWorld() {
    const placements = [
      { id: "coral_reef", count: 6, spread: 90 },
      { id: "shipwreck", count: 4, range: 150 },
      { id: "cave", count: 4, range: 140 },
      { id: "vent", count: 3, range: 200 },
      { id: "ruins", count: 2, range: 220 },
      { id: "trench", count: 2, range: 280 },
    ];

    for (const p of placements) {
      const def = LANDMARK_TYPES.find((l) => l.id === p.id);
      if (!def) continue;
      for (let i = 0; i < p.count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * p.range;
        const depth = THREE.MathUtils.lerp(def.depthMin, def.depthMax, 0.2 + Math.random() * 0.6);
        const pos = new THREE.Vector3(Math.cos(ang) * dist, yFromDepth(depth), Math.sin(ang) * dist);
        // scatter further for variety
        pos.x += (Math.random() - 0.5) * 100;
        pos.z += (Math.random() - 0.5) * 100;
        this._place(def, pos);
      }
    }
  }

  _place(def, pos) {
    const builder = BUILDERS[def.id];
    if (!builder) return;
    const mesh = builder();
    mesh.position.copy(pos);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);
    this.landmarks.push({
      mesh,
      def,
      position: pos.clone(),
      discovered: false,
      sampled: false,
    });
  }

  update(dt) {
    const t = performance.now() * 0.001;
    for (const lm of this.landmarks) {
      lm.mesh.traverse((o) => {
        if (o.userData.plume) {
          o.position.y = o.userData.baseY + Math.sin(t * 1.5 + o.userData.phase) * 0.5;
          o.material.opacity = 0.15 + Math.sin(t * 2 + o.userData.phase) * 0.08;
        }
        if (o.userData.mystery) {
          o.intensity = 0.2 + Math.sin(t * 0.8 + o.userData.phase) * 0.25;
          o.position.x += Math.sin(t + o.userData.phase) * dt * 0.5;
        }
      });
    }
  }

  getNearby(subPos, maxDist = 100) {
    return this.landmarks
      .map((lm) => ({ landmark: lm, distance: lm.mesh.position.distanceTo(subPos), def: lm.def }))
      .filter((x) => x.distance <= maxDist)
      .sort((a, b) => a.distance - b.distance);
  }

  pickInView(origin, direction, maxDist = 55, coneDot = 0.75) {
    let best = null;
    let bestScore = -Infinity;
    for (const lm of this.landmarks) {
      const to = lm.mesh.position.clone().sub(origin);
      const dist = to.length();
      if (dist > maxDist) continue;
      to.normalize();
      const dot = to.dot(direction);
      if (dot < coneDot) continue;
      const score = dot * 2 - dist * 0.015;
      if (score > bestScore) {
        bestScore = score;
        best = lm;
      }
    }
    return best;
  }
}
