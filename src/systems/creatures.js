import * as THREE from "three";
import { getSpeciesForDepth } from "../data/creatures.js";
import { yFromDepth } from "./depth.js";

function makeFishMesh(colour, scale) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.25 * scale, 1.1 * scale, 6),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.45, metalness: 0.15, flatShading: true })
  );
  body.rotation.z = -Math.PI / 2;
  g.add(body);
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.18 * scale, 0.4 * scale, 4),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.5, flatShading: true })
  );
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.55 * scale;
  g.add(tail);
  return g;
}

function makeJellyMesh(colour, scale) {
  const g = new THREE.Group();
  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(0.5 * scale, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.5),
    new THREE.MeshStandardMaterial({
      color: colour,
      roughness: 0.2,
      metalness: 0.05,
      transparent: true,
      opacity: 0.45,
      emissive: colour,
      emissiveIntensity: 0.15,
    })
  );
  g.add(bell);
  for (let i = 0; i < 6; i++) {
    const tent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02 * scale, 0.01 * scale, 1.4 * scale, 4),
      new THREE.MeshStandardMaterial({
        color: colour,
        transparent: true,
        opacity: 0.35,
        emissive: colour,
        emissiveIntensity: 0.1,
      })
    );
    const a = (i / 6) * Math.PI * 2;
    tent.position.set(Math.cos(a) * 0.25 * scale, -0.7 * scale, Math.sin(a) * 0.25 * scale);
    g.add(tent);
  }
  return g;
}

function makeSharkMesh(colour, scale) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.35 * scale, 2.2 * scale, 7),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.55, flatShading: true })
  );
  body.rotation.z = -Math.PI / 2;
  g.add(body);
  const fin = new THREE.Mesh(
    new THREE.ConeGeometry(0.25 * scale, 0.6 * scale, 4),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.55, flatShading: true })
  );
  fin.position.set(0, 0.4 * scale, 0);
  fin.rotation.z = Math.PI;
  g.add(fin);
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.3 * scale, 0.7 * scale, 4),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.55, flatShading: true })
  );
  tail.position.x = -1.1 * scale;
  tail.rotation.z = Math.PI / 2;
  g.add(tail);
  return g;
}

function makeSquidMesh(colour, scale) {
  const g = new THREE.Group();
  const mantle = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35 * scale, 1.4 * scale, 4, 8),
    new THREE.MeshStandardMaterial({
      color: colour,
      roughness: 0.4,
      emissive: colour,
      emissiveIntensity: 0.08,
    })
  );
  mantle.rotation.z = Math.PI / 2;
  g.add(mantle);
  for (let i = 0; i < 8; i++) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04 * scale, 0.015 * scale, 2.2 * scale, 5),
      new THREE.MeshStandardMaterial({ color: colour, roughness: 0.5 })
    );
    const a = (i / 8) * Math.PI * 2;
    arm.position.set(-0.9 * scale, Math.cos(a) * 0.15 * scale, Math.sin(a) * 0.15 * scale);
    arm.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    g.add(arm);
  }
  // Eye
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.12 * scale, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x102030, emissive: 0x204060, emissiveIntensity: 0.4 })
  );
  eye.position.set(0.2 * scale, 0.2 * scale, 0.25 * scale);
  g.add(eye);
  return g;
}

function makeBioMesh(colour, scale) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.2 * scale, 8, 8),
    new THREE.MeshStandardMaterial({
      color: colour,
      emissive: colour,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      transparent: true,
      opacity: 0.85,
    })
  );
  g.add(core);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.45 * scale, 8, 8),
    new THREE.MeshBasicMaterial({
      color: colour,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    })
  );
  g.add(glow);
  // Ribbon trail for siphonophore-like
  if (scale > 1) {
    for (let i = 0; i < 8; i++) {
      const seg = new THREE.Mesh(
        new THREE.SphereGeometry(0.12 * scale * (1 - i * 0.08), 6, 6),
        new THREE.MeshStandardMaterial({
          color: colour,
          emissive: colour,
          emissiveIntensity: 0.7,
          transparent: true,
          opacity: 0.7 - i * 0.06,
        })
      );
      seg.position.x = -i * 0.35 * scale;
      g.add(seg);
    }
  }
  return g;
}

function buildMesh(species) {
  const c = species.colour;
  const s = species.scale;
  switch (species.type) {
    case "jellyfish":
      return makeJellyMesh(c, s);
    case "shark":
      return makeSharkMesh(c, s);
    case "squid":
      return makeSquidMesh(c, s);
    case "bioluminescent":
      return makeBioMesh(c, s);
    default:
      return makeFishMesh(c, s);
  }
}

export class CreatureManager {
  constructor(scene) {
    this.scene = scene;
    this.entities = [];
    this.maxEntities = 120;
    this.spawnTimer = 0;
  }

  spawnAround(subPos, depth, count = 8) {
    const pool = getSpeciesForDepth(depth);
    if (!pool.length) return;

    for (let n = 0; n < count; n++) {
      if (this.entities.length >= this.maxEntities) break;
      const species = pool[Math.floor(Math.random() * pool.length)];
      // Weight rarity
      if (species.rarity === "legendary" && Math.random() > 0.08) continue;
      if (species.rarity === "epic" && Math.random() > 0.2) continue;
      if (species.rarity === "rare" && Math.random() > 0.45) continue;

      const [minS, maxS] = species.schoolSize || [1, 1];
      const school = minS + Math.floor(Math.random() * (maxS - minS + 1));
      const base = this._randomOffset(subPos, depth, species);

      for (let i = 0; i < school; i++) {
        if (this.entities.length >= this.maxEntities) break;
        const mesh = buildMesh(species);
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 8
        );
        mesh.position.copy(base).add(offset);
        mesh.rotation.y = Math.random() * Math.PI * 2;

        const entity = {
          mesh,
          species,
          phase: Math.random() * Math.PI * 2,
          speed: 0.8 + Math.random() * 2.5,
          radius: 6 + Math.random() * 20,
          center: base.clone(),
          verticalBob: 0.3 + Math.random() * 0.8,
          scanned: false,
        };
        this.scene.add(mesh);
        this.entities.push(entity);
      }
    }
  }

  _randomOffset(subPos, depth, species) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 70;
    const y = yFromDepth(THREE.MathUtils.clamp(depth + (Math.random() - 0.5) * 40, species.depthMin, species.depthMax));
    return new THREE.Vector3(subPos.x + Math.cos(ang) * dist, y + (Math.random() - 0.5) * 8, subPos.z + Math.sin(ang) * dist);
  }

  update(dt, subPos, depth) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 3.5 + Math.random() * 4;
      // cull far
      this.entities = this.entities.filter((e) => {
        const d = e.mesh.position.distanceTo(subPos);
        if (d > 160) {
          this.scene.remove(e.mesh);
          e.mesh.traverse((o) => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) {
              if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
              else o.material.dispose();
            }
          });
          return false;
        }
        return true;
      });
      this.spawnAround(subPos, depth, 4 + Math.floor(Math.random() * 5));
    }

    const t = performance.now() * 0.001;
    for (const e of this.entities) {
      e.phase += dt * e.speed * 0.4;
      const type = e.species.type;

      if (type === "jellyfish") {
        e.mesh.position.y += Math.sin(t * 0.8 + e.phase) * dt * e.verticalBob;
        e.mesh.rotation.y += dt * 0.15;
        e.mesh.scale.setScalar(1 + Math.sin(t * 2 + e.phase) * 0.05);
      } else if (type === "bioluminescent") {
        e.mesh.position.x = e.center.x + Math.sin(e.phase) * e.radius * 0.3;
        e.mesh.position.z = e.center.z + Math.cos(e.phase * 0.7) * e.radius * 0.3;
        e.mesh.position.y += Math.sin(t + e.phase) * dt * 0.4;
        e.mesh.traverse((o) => {
          if (o.material?.emissiveIntensity !== undefined) {
            o.material.emissiveIntensity = 0.5 + Math.sin(t * 3 + e.phase) * 0.4;
          }
        });
      } else if (type === "squid") {
        e.mesh.position.x = e.center.x + Math.sin(e.phase * 0.25) * e.radius;
        e.mesh.position.z = e.center.z + Math.cos(e.phase * 0.25) * e.radius;
        e.mesh.position.y = e.center.y + Math.sin(e.phase * 0.5) * 3;
        e.mesh.lookAt(e.mesh.position.x + Math.cos(e.phase * 0.25), e.mesh.position.y, e.mesh.position.z - Math.sin(e.phase * 0.25));
      } else if (type === "shark") {
        e.mesh.position.x = e.center.x + Math.sin(e.phase * 0.35) * e.radius;
        e.mesh.position.z = e.center.z + Math.cos(e.phase * 0.35) * e.radius;
        e.mesh.position.y = e.center.y + Math.sin(e.phase * 0.2) * 1.5;
        const next = new THREE.Vector3(
          e.center.x + Math.sin(e.phase * 0.35 + 0.1) * e.radius,
          e.mesh.position.y,
          e.center.z + Math.cos(e.phase * 0.35 + 0.1) * e.radius
        );
        e.mesh.lookAt(next);
      } else {
        // fish school swim
        e.mesh.position.x = e.center.x + Math.sin(e.phase + e.mesh.id) * e.radius * 0.5;
        e.mesh.position.z = e.center.z + Math.cos(e.phase * 1.1 + e.mesh.id) * e.radius * 0.5;
        e.mesh.position.y = e.center.y + Math.sin(e.phase * 2) * e.verticalBob;
        const hx = Math.cos(e.phase + e.mesh.id);
        const hz = -Math.sin(e.phase * 1.1 + e.mesh.id);
        e.mesh.lookAt(e.mesh.position.x + hx, e.mesh.position.y, e.mesh.position.z + hz);
      }
    }
  }

  getNearby(subPos, maxDist = 80) {
    const list = [];
    for (const e of this.entities) {
      const d = e.mesh.position.distanceTo(subPos);
      if (d <= maxDist) {
        list.push({ entity: e, distance: d, species: e.species });
      }
    }
    list.sort((a, b) => a.distance - b.distance);
    return list;
  }

  /** Raycast-ish: find closest creature in forward cone */
  pickInView(origin, direction, maxDist = 45, coneDot = 0.82) {
    let best = null;
    let bestScore = -Infinity;
    for (const e of this.entities) {
      const to = e.mesh.position.clone().sub(origin);
      const dist = to.length();
      if (dist > maxDist || dist < 0.5) continue;
      to.normalize();
      const dot = to.dot(direction);
      if (dot < coneDot) continue;
      const score = dot * 2 - dist * 0.02;
      if (score > bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }
}
