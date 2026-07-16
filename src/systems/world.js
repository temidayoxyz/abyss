import * as THREE from "three";
import { getEnvironmentAtDepth, SURFACE_Y } from "./depth.js";
import { MarineSnow, SunRays } from "./particles.js";

/**
 * Ocean scene: fog, lights, surface plane, seafloor hints, caustics feel.
 */
export class OceanWorld {
  constructor(scene) {
    this.scene = scene;
    this.ambient = new THREE.AmbientLight(0x4a90b0, 0.5);
    this.sun = new THREE.DirectionalLight(0xc8e8ff, 0.8);
    this.sun.position.set(30, 80, 20);
    this.hemi = new THREE.HemisphereLight(0x60b0d0, 0x0a2030, 0.35);

    scene.add(this.ambient, this.sun, this.hemi);

    // Surface plane (underside)
    const surfaceGeo = new THREE.PlaneGeometry(800, 800, 64, 64);
    this.surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x40a0c8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0x104060,
      emissiveIntensity: 0.2,
    });
    this.surface = new THREE.Mesh(surfaceGeo, this.surfaceMat);
    this.surface.rotation.x = Math.PI / 2;
    this.surface.position.y = SURFACE_Y;
    scene.add(this.surface);

    // Store base positions for wave
    this._surfaceBase = surfaceGeo.attributes.position.array.slice();

    // Distant seafloor gradient sphere (inverted large dome feel via fog only)
    // Subtle terrain patches near shallow
    this.terrain = new THREE.Group();
    scene.add(this.terrain);
    this._scatterTerrain();

    this.snow = new MarineSnow(scene);
    this.rays = new SunRays(scene);

    this.scene.fog = new THREE.FogExp2(0x0a4a6a, 0.012);
    this.scene.background = new THREE.Color(0x0a4a6a);

    this._lastFogHex = null;
  }

  _scatterTerrain() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a3040, roughness: 0.95, flatShading: true });
    for (let i = 0; i < 40; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(2 + Math.random() * 6, 0), mat);
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 300;
      const depth = 30 + Math.random() * 400;
      rock.position.set(Math.cos(ang) * dist, SURFACE_Y - depth, Math.sin(ang) * dist);
      rock.scale.set(1 + Math.random(), 0.5 + Math.random(), 1 + Math.random());
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      this.terrain.add(rock);
    }
    // Deep ridges
    for (let i = 0; i < 20; i++) {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(15 + Math.random() * 30, 8 + Math.random() * 20, 6),
        new THREE.MeshStandardMaterial({ color: 0x0c141c, roughness: 1, flatShading: true })
      );
      const ang = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 350;
      const depth = 800 + Math.random() * 3000;
      ridge.position.set(Math.cos(ang) * dist, SURFACE_Y - depth, Math.sin(ang) * dist);
      ridge.rotation.y = Math.random() * Math.PI;
      this.terrain.add(ridge);
    }
  }

  applyEnvironment(env) {
    const fogHex = env.fogColor;
    if (fogHex !== this._lastFogHex) {
      this._lastFogHex = fogHex;
      const c = new THREE.Color(fogHex);
      this.scene.background.copy(c);
      if (this.scene.fog) {
        this.scene.fog.color.copy(c);
      }
    }
    // Exp2 density from visibility
    const density = 1 / Math.max(8, env.visibility * 1.8);
    if (this.scene.fog) this.scene.fog.density = density * 0.85;

    this.ambient.intensity = env.ambient;
    this.ambient.color.set(env.depth < 200 ? 0x4a90b0 : env.depth < 1000 ? 0x204060 : 0x101828);
    this.sun.intensity = env.sun;
    this.hemi.intensity = env.ambient * 0.6;

    this.surfaceMat.opacity = Math.max(0.05, 0.4 * env.caustics);
    this.surfaceMat.emissiveIntensity = 0.15 * env.caustics;
    this.surface.visible = env.depth < 120;
  }

  update(dt, subPos, env) {
    this.applyEnvironment(env);
    this.snow.update(dt, subPos, env);
    this.rays.update(dt, subPos, env);

    // Gentle surface waves
    if (this.surface.visible) {
      const pos = this.surface.geometry.attributes.position;
      const base = this._surfaceBase;
      const t = performance.now() * 0.001;
      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3;
        const x = base[ix];
        const y = base[ix + 1];
        pos.array[ix + 2] = Math.sin(x * 0.05 + t) * 0.4 + Math.cos(y * 0.04 + t * 0.8) * 0.3;
      }
      pos.needsUpdate = true;
      this.surface.geometry.computeVertexNormals();
    }

    // Follow surface plane roughly under player for infinite feel
    this.surface.position.x = subPos.x;
    this.surface.position.z = subPos.z;
  }
}

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);
  return camera;
}

export function handleResize(renderer, camera) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
}
