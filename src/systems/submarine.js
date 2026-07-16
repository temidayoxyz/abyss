import * as THREE from "three";
import { depthFromY, yFromDepth, MAX_DEPTH, SURFACE_Y } from "./depth.js";

/**
 * First-person submarine controller with systems.
 */
export class Submarine {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.position.set(0, SURFACE_Y - 8, 0);

    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;

    this.baseSpeed = 12;
    this.boostMult = 2.1;
    this.maxPitch = Math.PI / 2.4;

    // Systems
    this.headlightsOn = false;
    this.sonarOn = false;
    this.boosting = false;

    this.oxygen = 100;
    this.battery = 100;
    this.maxOxygen = 100;
    this.maxBattery = 100;

    this.keys = Object.create(null);
    this.touch = { moveX: 0, moveY: 0, lookX: 0, lookY: 0, rise: 0, dive: 0 };

    this.scanCooldown = 0;
    this.sampleCooldown = 0;
    this.photoCooldown = 0;

    this._buildMesh();
    this._buildLights();

    this.camera.position.set(0, 0.3, 0.2);
    this.group.add(this.camera);
  }

  _buildMesh() {
    // Simple exterior hull visible in reflections / third-person hints — mostly first person
    const hull = new THREE.Group();
    hull.visible = false; // cockpit view
    this.hull = hull;
    this.group.add(hull);
  }

  _buildLights() {
    this.headlightL = new THREE.SpotLight(0xc8f0ff, 0, 90, Math.PI / 7, 0.45, 1.2);
    this.headlightR = new THREE.SpotLight(0xc8f0ff, 0, 90, Math.PI / 7, 0.45, 1.2);
    this.headlightL.position.set(-0.6, -0.1, -1.2);
    this.headlightR.position.set(0.6, -0.1, -1.2);
    this.headlightL.target.position.set(-0.4, -0.4, -20);
    this.headlightR.target.position.set(0.4, -0.4, -20);

    this.fillLight = new THREE.PointLight(0x40a0c0, 0.15, 12);
    this.fillLight.position.set(0, 0.2, 0.5);

    this.group.add(this.headlightL, this.headlightR, this.headlightL.target, this.headlightR.target, this.fillLight);
  }

  get position() {
    return this.group.position;
  }

  get depth() {
    return depthFromY(this.group.position.y);
  }

  get forward() {
    const e = new THREE.Euler(this.pitch, this.yaw, 0, "YXZ");
    return new THREE.Vector3(0, 0, -1).applyEuler(e);
  }

  setHeadlights(on) {
    this.headlightsOn = on;
    const intensity = on ? 2.8 : 0;
    this.headlightL.intensity = intensity;
    this.headlightR.intensity = intensity;
  }

  toggleHeadlights() {
    this.setHeadlights(!this.headlightsOn);
    return this.headlightsOn;
  }

  setSonar(on) {
    this.sonarOn = on;
  }

  toggleSonar() {
    this.sonarOn = !this.sonarOn;
    return this.sonarOn;
  }

  bindInput(dom) {
    const down = (e) => {
      this.keys[e.code] = true;
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    };
    const up = (e) => {
      this.keys[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    // Pointer look when pointer locked
    dom.addEventListener("click", () => {
      if (document.pointerLockElement !== dom) dom.requestPointerLock?.();
    });
    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== dom) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.002;
      this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
    });
  }

  update(dt, env) {
    this.scanCooldown = Math.max(0, this.scanCooldown - dt);
    this.sampleCooldown = Math.max(0, this.sampleCooldown - dt);
    this.photoCooldown = Math.max(0, this.photoCooldown - dt);

    const k = this.keys;

    // Touch look
    this.yaw -= this.touch.lookX * 1.8 * dt;
    this.pitch -= this.touch.lookY * 1.4 * dt;
    this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));

    this.boosting = !!(k["ShiftLeft"] || k["ShiftRight"]) && this.battery > 1;
    const speed = this.baseSpeed * (this.boosting ? this.boostMult : 1);

    const forward = this.forward;
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    if (right.lengthSq() < 0.01) {
      right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    }
    const up = new THREE.Vector3(0, 1, 0);

    const fb =
      (k["KeyW"] || k["ArrowUp"] ? 1 : 0) + (k["KeyS"] || k["ArrowDown"] ? -1 : 0) - this.touch.moveY;
    const strafe =
      (k["KeyD"] || k["ArrowRight"] ? 1 : 0) + (k["KeyA"] || k["ArrowLeft"] ? -1 : 0) + this.touch.moveX;
    const vert =
      (k["KeyQ"] || k["Space"] ? 1 : 0) +
      (k["KeyE"] || k["ControlLeft"] || k["ControlRight"] ? -1 : 0) +
      this.touch.rise -
      this.touch.dive;

    const wish = new THREE.Vector3();
    wish.addScaledVector(forward, fb);
    wish.addScaledVector(right, strafe);
    wish.addScaledVector(up, vert * 0.85);

    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);

    const accel = 3.2;
    this.velocity.lerp(wish, 1 - Math.exp(-accel * dt));
    if (wish.lengthSq() < 0.01) {
      this.velocity.multiplyScalar(Math.exp(-1.8 * dt));
    }

    this.group.position.addScaledVector(this.velocity, dt);

    // Clamp world bounds
    const p = this.group.position;
    p.y = Math.min(SURFACE_Y - 0.5, Math.max(yFromDepth(MAX_DEPTH), p.y));
    const bound = 420;
    p.x = Math.max(-bound, Math.min(bound, p.x));
    p.z = Math.max(-bound, Math.min(bound, p.z));

    // Orientation
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Systems drain / recharge
    this._updateSystems(dt, env);
  }

  _updateSystems(dt, env) {
    // Oxygen: gentle drain for atmosphere, recharges near surface (not punishing)
    if (env.depth < 20) {
      this.oxygen = Math.min(this.maxOxygen, this.oxygen + 5 * dt);
    } else {
      const drain = 0.04 + env.depth / 20000 + (this.boosting ? 0.05 : 0);
      this.oxygen = Math.max(0, this.oxygen - drain * dt);
    }

    // Battery: systems cost power; recharges in the shallows with systems idle
    let bDrain = 0.03;
    if (this.headlightsOn) bDrain += 0.22;
    if (this.sonarOn) bDrain += 0.28;
    if (this.boosting) bDrain += 0.4;
    if (env.depth < 25 && !this.headlightsOn && !this.sonarOn && !this.boosting) {
      this.battery = Math.min(this.maxBattery, this.battery + 3 * dt);
    } else {
      this.battery = Math.max(0, this.battery - bDrain * dt);
    }

    // Auto-dim systems if battery critical
    if (this.battery <= 0) {
      this.setHeadlights(false);
      this.sonarOn = false;
      this.boosting = false;
    }

    // Headlight intensity scales slightly with battery
    if (this.headlightsOn) {
      const f = 0.5 + 0.5 * (this.battery / 100);
      this.headlightL.intensity = 2.8 * f;
      this.headlightR.intensity = 2.8 * f;
    }

    // Ambient cockpit glow increases with depth darkness
    this.fillLight.intensity = 0.12 + (1 - Math.min(1, env.ambient * 2)) * 0.2;
  }

  canScan() {
    return this.scanCooldown <= 0 && this.battery > 2;
  }

  canSample() {
    return this.sampleCooldown <= 0 && this.battery > 3;
  }

  canPhoto() {
    return this.photoCooldown <= 0 && this.battery > 1;
  }

  markScan() {
    this.scanCooldown = 1.2;
    this.battery = Math.max(0, this.battery - 2);
  }

  markSample() {
    this.sampleCooldown = 1.5;
    this.battery = Math.max(0, this.battery - 3);
  }

  markPhoto() {
    this.photoCooldown = 0.8;
    this.battery = Math.max(0, this.battery - 1);
  }
}
