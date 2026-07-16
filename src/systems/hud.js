import { formatDepth } from "./depth.js";

export class HUD {
  constructor() {
    this.els = {
      depth: document.getElementById("hud-depth"),
      pressure: document.getElementById("hud-pressure"),
      temp: document.getElementById("hud-temp"),
      vis: document.getElementById("hud-vis"),
      surface: document.getElementById("hud-surface"),
      oxygen: document.getElementById("hud-oxygen"),
      battery: document.getElementById("hud-battery"),
      barPressure: document.getElementById("bar-pressure"),
      barTemp: document.getElementById("bar-temp"),
      barVis: document.getElementById("bar-vis"),
      barOxygen: document.getElementById("bar-oxygen"),
      barBattery: document.getElementById("bar-battery"),
      pillLights: document.getElementById("pill-lights"),
      pillSonar: document.getElementById("pill-sonar"),
      pillBoost: document.getElementById("pill-boost"),
      sonarDisplay: document.getElementById("sonar-display"),
      sonarStatus: document.getElementById("sonar-status"),
      sonarBlips: document.getElementById("sonar-blips"),
      nearbyList: document.getElementById("nearby-list"),
      toastStack: document.getElementById("toast-stack"),
      encounterBanner: document.getElementById("encounter-banner"),
      encounterText: document.getElementById("encounter-text"),
      scanReticule: document.getElementById("scan-reticule"),
      photoFlash: document.getElementById("photo-flash"),
      scanModal: document.getElementById("scan-modal"),
      scanModalBody: document.getElementById("scan-modal-body"),
      hud: document.getElementById("hud"),
    };

    document.getElementById("btn-close-scan")?.addEventListener("click", () => this.hideScanModal());
  }

  show() {
    this.els.hud?.classList.remove("hidden");
  }

  update(sub, env, nearbyCreatures = [], nearbyLandmarks = []) {
    const d = env.depth;
    this.els.depth.textContent = formatDepth(d);
    this.els.pressure.textContent = env.pressure < 10 ? env.pressure.toFixed(1) : Math.round(env.pressure).toString();
    this.els.temp.textContent = env.temperature.toFixed(1);
    this.els.vis.textContent = Math.round(env.visibility).toString();
    this.els.surface.textContent = formatDepth(d);
    this.els.oxygen.textContent = Math.round(sub.oxygen).toString();
    this.els.battery.textContent = Math.round(sub.battery).toString();

    // Bars
    this.els.barPressure.style.width = `${Math.min(100, (env.pressure / 500) * 100)}%`;
    this.els.barTemp.style.width = `${Math.min(100, (env.temperature / 24) * 100)}%`;
    this.els.barVis.style.width = `${Math.min(100, (env.visibility / 90) * 100)}%`;
    this.els.barOxygen.style.width = `${sub.oxygen}%`;
    this.els.barBattery.style.width = `${sub.battery}%`;

    this.els.barOxygen.style.background =
      sub.oxygen < 25
        ? "linear-gradient(90deg,#a03020,#ff6b4a)"
        : "linear-gradient(90deg,#2a8f6a,var(--ok))";
    this.els.barBattery.style.background =
      sub.battery < 20
        ? "linear-gradient(90deg,#a03020,#ff6b4a)"
        : "linear-gradient(90deg,#8a6a20,var(--sonar))";

    this.els.pillLights.dataset.on = String(sub.headlightsOn);
    this.els.pillSonar.dataset.on = String(sub.sonarOn);
    this.els.pillBoost.dataset.on = String(sub.boosting);

    // Sonar
    if (sub.sonarOn) {
      this.els.sonarDisplay.classList.add("active");
      this.els.sonarStatus.textContent = "ACTIVE";
      this._renderSonarBlips(sub, nearbyCreatures, nearbyLandmarks);
    } else {
      this.els.sonarDisplay.classList.remove("active");
      this.els.sonarStatus.textContent = "STANDBY";
      this.els.sonarBlips.innerHTML = "";
    }

    // Nearby list
    const contacts = [
      ...nearbyCreatures.slice(0, 5).map((c) => ({
        name: c.species.name,
        dist: c.distance,
      })),
      ...nearbyLandmarks.slice(0, 3).map((l) => ({
        name: l.def.name,
        dist: l.distance,
      })),
    ]
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6);

    this.els.nearbyList.innerHTML = contacts
      .map((c) => `<li><span>${escapeHtml(c.name)}</span><span class="dist">${Math.round(c.dist)}m</span></li>`)
      .join("");
  }

  _renderSonarBlips(sub, creatures, landmarks) {
    const range = 90;
    const blips = [];
    const yaw = sub.yaw;
    const forward = new THREEDummyForward(yaw);

    const add = (pos, kind) => {
      const dx = pos.x - sub.position.x;
      const dz = pos.z - sub.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > range) return;
      // rotate into sub space
      const localX = dx * Math.cos(yaw) + dz * Math.sin(yaw);
      const localZ = -dx * Math.sin(yaw) + dz * Math.cos(yaw);
      // map to circle: forward is up on display (-localZ)
      const nx = localX / range;
      const ny = -localZ / range;
      const r = Math.hypot(nx, ny);
      if (r > 1) return;
      blips.push({ x: 50 + nx * 46, y: 50 + ny * 46, kind });
    };

    for (const c of creatures.slice(0, 20)) add(c.entity.mesh.position, "c");
    for (const l of landmarks.slice(0, 10)) add(l.landmark.mesh.position, "l");

    this.els.sonarBlips.innerHTML = blips
      .map(
        (b) =>
          `<div class="sonar-blip" style="left:${b.x}%;top:${b.y}%;${b.kind === "l" ? "background:#80c0ff" : ""}"></div>`
      )
      .join("");
  }

  toast(message, type = "") {
    const el = document.createElement("div");
    el.className = `toast ${type}`.trim();
    el.textContent = message;
    this.els.toastStack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.4s";
      setTimeout(() => el.remove(), 400);
    }, 3200);
  }

  showEncounter(message) {
    this.els.encounterText.textContent = message;
    this.els.encounterBanner.classList.remove("hidden");
    clearTimeout(this._encounterTimer);
    this._encounterTimer = setTimeout(() => {
      this.els.encounterBanner.classList.add("hidden");
    }, 5500);
  }

  flashScanReticule() {
    const r = this.els.scanReticule;
    r.classList.remove("hidden");
    clearTimeout(this._retTimer);
    this._retTimer = setTimeout(() => r.classList.add("hidden"), 700);
  }

  photoFlash() {
    const f = this.els.photoFlash;
    f.classList.add("flash");
    requestAnimationFrame(() => {
      setTimeout(() => f.classList.remove("flash"), 80);
    });
  }

  showScanModal(html) {
    this.els.scanModalBody.innerHTML = html;
    this.els.scanModal.classList.remove("hidden");
  }

  hideScanModal() {
    this.els.scanModal.classList.add("hidden");
  }

  isModalOpen() {
    return !this.els.scanModal.classList.contains("hidden");
  }
}

function THREEDummyForward(yaw) {
  return yaw;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
