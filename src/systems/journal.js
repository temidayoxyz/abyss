import { createProfile, RARITY } from "../data/creatures.js";

/**
 * Discovery journal state + DOM binding.
 */
export class Journal {
  constructor() {
    this.entries = new Map(); // id -> profile
    this.selectedId = null;

    this.panel = document.getElementById("journal");
    this.nav = document.getElementById("journal-nav");
    this.entryEl = document.getElementById("journal-entry");
    this.countEl = document.getElementById("discovery-count");
    this.chipsEl = document.getElementById("discovery-chips");

    document.getElementById("btn-close-journal")?.addEventListener("click", () => this.close());
  }

  get size() {
    return this.entries.size;
  }

  open() {
    this.panel.classList.remove("hidden");
    this.render();
  }

  close() {
    this.panel.classList.add("hidden");
  }

  toggle() {
    if (this.panel.classList.contains("hidden")) this.open();
    else this.close();
  }

  isOpen() {
    return !this.panel.classList.contains("hidden");
  }

  /**
   * Register a scan/sample/photo of a species or landmark def.
   * @returns {{ profile, isNew: boolean }}
   */
  discover(speciesOrDef, { depth, kind = "scan" } = {}) {
    const existing = this.entries.get(speciesOrDef.id);
    if (existing) {
      if (kind === "photo") existing.photoCount = (existing.photoCount || 0) + 1;
      if (kind === "sample") existing.sampleCount = (existing.sampleCount || 0) + 1;
      this._updateHud();
      return { profile: existing, isNew: false };
    }
    const profile = createProfile(speciesOrDef, {
      depthWhenFound: depth,
      photoCount: kind === "photo" ? 1 : 0,
      sampleCount: kind === "sample" ? 1 : 0,
    });
    this.entries.set(profile.id, profile);
    this.selectedId = profile.id;
    this._updateHud();
    if (this.isOpen()) this.render();
    return { profile, isNew: true };
  }

  _updateHud() {
    if (this.countEl) this.countEl.textContent = String(this.entries.size);
    if (this.chipsEl) {
      const recent = [...this.entries.values()].slice(-4).reverse();
      this.chipsEl.innerHTML = recent.map((e) => `<span class="strip-chip">${escapeHtml(e.name)}</span>`).join("");
    }
  }

  render() {
    const list = [...this.entries.values()].sort((a, b) => {
      const ra = RARITY[a.rarity]?.weight || 0;
      const rb = RARITY[b.rarity]?.weight || 0;
      if (rb !== ra) return rb - ra;
      return a.name.localeCompare(b.name);
    });

    if (!list.length) {
      this.nav.innerHTML = "";
      this.entryEl.innerHTML = `<p class="journal-empty">Scan creatures or sample sites to fill this log.</p>`;
      return;
    }

    if (!this.selectedId || !this.entries.has(this.selectedId)) {
      this.selectedId = list[0].id;
    }

    this.nav.innerHTML = list
      .map(
        (e) => `
      <button type="button" data-id="${e.id}" class="${e.id === this.selectedId ? "active" : ""}">
        ${escapeHtml(e.name)}
        <span class="rarity">${escapeHtml(e.rarityLabel)}${e.isLandmark ? " · site" : ""}</span>
      </button>`
      )
      .join("");

    this.nav.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.selectedId = btn.dataset.id;
        this.render();
      });
    });

    const e = this.entries.get(this.selectedId);
    if (!e) return;

    const rarityClass = ["rare", "epic", "legendary"].includes(e.rarity) ? e.rarity : "";
    const facts = (e.facts || []).map((f) => `<p>${escapeHtml(f)}</p>`).join("");

    this.entryEl.innerHTML = `
      <h3 class="entry-name">${escapeHtml(e.name)}</h3>
      <div class="entry-meta">
        <span class="entry-tag ${rarityClass}">${escapeHtml(e.rarityLabel)}</span>
        <span class="entry-tag">${escapeHtml(e.type)}</span>
        <span class="entry-tag">${escapeHtml(e.depthRange)}</span>
        ${e.depthWhenFound != null ? `<span class="entry-tag">Found @ ${Math.round(e.depthWhenFound)} m</span>` : ""}
        ${e.photoCount ? `<span class="entry-tag">${e.photoCount} photo${e.photoCount > 1 ? "s" : ""}</span>` : ""}
        ${e.sampleCount ? `<span class="entry-tag">${e.sampleCount} sample${e.sampleCount > 1 ? "s" : ""}</span>` : ""}
      </div>
      <div class="entry-section">
        <h4>BEHAVIOUR</h4>
        <p>${escapeHtml(e.behaviour)}</p>
      </div>
      <div class="entry-section">
        <h4>FIELD NOTES</h4>
        ${facts || "<p>No additional notes recorded.</p>"}
      </div>
    `;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderScanCard(profile) {
  const rarityClass = ["rare", "epic", "legendary"].includes(profile.rarity) ? profile.rarity : "";
  return `
    <h3 class="entry-name">${escapeHtml(profile.name)}</h3>
    <div class="entry-meta">
      <span class="entry-tag ${rarityClass}">${escapeHtml(profile.rarityLabel)}</span>
      <span class="entry-tag">${escapeHtml(profile.depthRange)}</span>
    </div>
    <div class="entry-section">
      <h4>BEHAVIOUR</h4>
      <p>${escapeHtml(profile.behaviour)}</p>
    </div>
    <div class="entry-section">
      <h4>NOTE</h4>
      <p>${escapeHtml((profile.facts && profile.facts[0]) || "Profile logged to journal.")}</p>
    </div>
  `;
}
