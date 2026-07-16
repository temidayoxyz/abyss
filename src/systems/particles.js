import * as THREE from "three";

/**
 * Marine snow + floating motes that follow the submarine.
 */
export class MarineSnow {
  constructor(scene, count = 1800) {
    this.count = count;
    this.radius = 55;
    this.positions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this._respawn(i, true);
      this.speeds[i] = 0.15 + Math.random() * 0.55;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      color: 0xb8e0f0,
      size: 0.12,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);

    // Bioluminescent spark layer (deep only)
    this.bioCount = 400;
    this.bioPos = new Float32Array(this.bioCount * 3);
    this.bioPhase = new Float32Array(this.bioCount);
    for (let i = 0; i < this.bioCount; i++) {
      this._respawnBio(i, true);
      this.bioPhase[i] = Math.random() * Math.PI * 2;
    }
    const bgeo = new THREE.BufferGeometry();
    bgeo.setAttribute("position", new THREE.BufferAttribute(this.bioPos, 3));
    this.bioMat = new THREE.PointsMaterial({
      color: 0x40ffd0,
      size: 0.22,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.bioPoints = new THREE.Points(bgeo, this.bioMat);
    this.bioPoints.frustumCulled = false;
    scene.add(this.bioPoints);
  }

  _respawn(i, randomY = false) {
    const r = this.radius;
    this.positions[i * 3] = (Math.random() - 0.5) * r * 2;
    this.positions[i * 3 + 1] = randomY ? (Math.random() - 0.5) * r * 2 : r;
    this.positions[i * 3 + 2] = (Math.random() - 0.5) * r * 2;
  }

  _respawnBio(i, randomY = false) {
    const r = this.radius * 0.9;
    this.bioPos[i * 3] = (Math.random() - 0.5) * r * 2;
    this.bioPos[i * 3 + 1] = randomY ? (Math.random() - 0.5) * r * 2 : (Math.random() - 0.5) * r;
    this.bioPos[i * 3 + 2] = (Math.random() - 0.5) * r * 2;
  }

  update(dt, subPos, env) {
    const cx = subPos.x;
    const cy = subPos.y;
    const cz = subPos.z;
    const r = this.radius;
    const dens = env.marineSnow;

    this.material.opacity = 0.25 + dens * 0.45;
    this.material.size = 0.08 + dens * 0.08;
    // Tint particles with fog colour slightly
    this.material.color.setHex(0xc8e8f4);

    for (let i = 0; i < this.count; i++) {
      const ix = i * 3;
      // Local offset from sub
      let lx = this.positions[ix];
      let ly = this.positions[ix + 1];
      let lz = this.positions[ix + 2];

      ly -= this.speeds[i] * dt * (0.6 + dens);
      lx += Math.sin(ly * 0.1 + i) * dt * 0.15;

      // If far from origin (local), respawn
      if (ly < -r || Math.abs(lx) > r || Math.abs(lz) > r) {
        this._respawn(i, false);
        lx = this.positions[ix];
        ly = this.positions[ix + 1];
        lz = this.positions[ix + 2];
      } else {
        this.positions[ix] = lx;
        this.positions[ix + 1] = ly;
        this.positions[ix + 2] = lz;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.position.set(cx, cy, cz);

    // Bio sparks deepen with depth
    const bioOp = env.depth < 150 ? 0 : Math.min(0.85, (env.depth - 150) / 1200);
    this.bioMat.opacity = bioOp * 0.7;
    this.bioMat.size = 0.15 + Math.sin(performance.now() * 0.002) * 0.04;

    for (let i = 0; i < this.bioCount; i++) {
      const ix = i * 3;
      this.bioPhase[i] += dt * (1 + (i % 5) * 0.2);
      this.bioPos[ix + 1] += Math.sin(this.bioPhase[i]) * dt * 0.3;
      let lx = this.bioPos[ix];
      let ly = this.bioPos[ix + 1];
      let lz = this.bioPos[ix + 2];
      if (Math.abs(lx) > r || Math.abs(ly) > r || Math.abs(lz) > r) {
        this._respawnBio(i, true);
      }
    }
    this.bioPoints.geometry.attributes.position.needsUpdate = true;
    this.bioPoints.position.set(cx, cy, cz);
  }
}

/**
 * God rays / sunlight shafts near surface
 */
export class SunRays {
  constructor(scene) {
    this.group = new THREE.Group();
    this.rays = [];
    const mat = new THREE.MeshBasicMaterial({
      color: 0xa8e0ff,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 14; i++) {
      const w = 2 + Math.random() * 4;
      const h = 40 + Math.random() * 50;
      const geo = new THREE.PlaneGeometry(w, h);
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.set((Math.random() - 0.5) * 80, -h * 0.3, (Math.random() - 0.5) * 80);
      mesh.rotation.x = -0.15 + Math.random() * 0.1;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.userData.phase = Math.random() * Math.PI * 2;
      mesh.userData.baseOp = 0.03 + Math.random() * 0.05;
      this.group.add(mesh);
      this.rays.push(mesh);
    }
    scene.add(this.group);
  }

  update(dt, subPos, env) {
    const strength = env.caustics;
    this.group.visible = strength > 0.02;
    this.group.position.set(subPos.x, Math.min(subPos.y + 5, 35), subPos.z);
    const t = performance.now() * 0.001;
    for (const ray of this.rays) {
      ray.material.opacity = ray.userData.baseOp * strength * (0.7 + 0.3 * Math.sin(t + ray.userData.phase));
      ray.position.x += Math.sin(t * 0.2 + ray.userData.phase) * dt * 0.5;
    }
  }
}
