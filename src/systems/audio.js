/**
 * Procedural underwater ambience via Web Audio API.
 * Peaceful, muffled, depth-reactive — no combat stingers.
 */
export class OceanAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.depth = 0;
    this.sonarOn = false;
    this._started = false;
    this._sonarOsc = null;
  }

  async start() {
    if (this._started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.ctx.destination);

    // Low rumble
    this._drone = this._makeDrone(48, 0.12);
    // Mid water hiss
    this._hiss = this._makeNoise(0.04);
    // Occasional bubble filter sweep handled in update

    this._started = true;
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  _makeDrone(freq, gain) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = freq;
    f.type = "lowpass";
    f.frequency.value = 120;
    g.gain.value = gain;
    osc.connect(f);
    f.connect(g);
    g.connect(this.master);
    osc.start();
    return { osc, g, f };
  }

  _makeNoise(gain) {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 400;
    f.Q.value = 0.5;
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start();
    return { src, g, f };
  }

  update(env, sub) {
    if (!this._started || !this.ctx) return;
    this.depth = env.depth;
    // Deeper = lower drone, quieter hiss, more muffling
    const t = Math.min(1, env.depth / 3000);
    if (this._drone) {
      this._drone.osc.frequency.setTargetAtTime(42 - t * 18, this.ctx.currentTime, 0.5);
      this._drone.g.gain.setTargetAtTime(0.1 + t * 0.1, this.ctx.currentTime, 0.5);
      this._drone.f.frequency.setTargetAtTime(140 - t * 80, this.ctx.currentTime, 0.5);
    }
    if (this._hiss) {
      this._hiss.g.gain.setTargetAtTime(0.035 * (1 - t * 0.7) + (sub.boosting ? 0.02 : 0), this.ctx.currentTime, 0.3);
      this._hiss.f.frequency.setTargetAtTime(500 - t * 300, this.ctx.currentTime, 0.5);
    }
    this.master.gain.setTargetAtTime(0.18 + env.soundMuffle * 0.06, this.ctx.currentTime, 0.4);

    if (sub.sonarOn && !this._sonarInterval) {
      this._startSonarPing();
    } else if (!sub.sonarOn && this._sonarInterval) {
      clearInterval(this._sonarInterval);
      this._sonarInterval = null;
    }
  }

  _startSonarPing() {
    this._sonarInterval = setInterval(() => this.ping(), 2800);
    this.ping();
  }

  ping() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.4);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.55);
  }

  blip() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.value = 660;
    g.gain.setValueAtTime(0.06, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 0.16);
  }

  shutter() {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.value = 0.1;
    src.connect(g);
    g.connect(this.master);
    src.start();
  }
}
