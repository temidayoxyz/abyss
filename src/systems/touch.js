/**
 * Virtual joysticks + rise/dive for mobile.
 */
export class TouchControls {
  constructor(sub) {
    this.sub = sub;
    this.root = document.getElementById("touch-controls");
    this.moveZone = document.getElementById("stick-move");
    this.lookZone = document.getElementById("stick-look");
    this.moveKnob = document.getElementById("stick-move-knob");
    this.lookKnob = document.getElementById("stick-look-knob");
    this.btnRise = document.getElementById("btn-rise");
    this.btnDive = document.getElementById("btn-dive");

    this._active = new Map();
    this._bindStick(this.moveZone, this.moveKnob, "move");
    this._bindStick(this.lookZone, this.lookKnob, "look");

    const setVert = (rise, dive) => {
      this.sub.touch.rise = rise;
      this.sub.touch.dive = dive;
    };

    const press = (el, fn) => {
      el?.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        fn(true);
      });
      el?.addEventListener("pointerup", () => fn(false));
      el?.addEventListener("pointercancel", () => fn(false));
    };

    press(this.btnRise, (on) => setVert(on ? 1 : 0, this.sub.touch.dive));
    press(this.btnDive, (on) => setVert(this.sub.touch.rise, on ? 1 : 0));

    this._detect();
    window.addEventListener("resize", () => this._detect());
  }

  _detect() {
    const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches || window.innerWidth < 800;
    if (coarse) this.root?.classList.add("visible");
    else this.root?.classList.remove("visible");
  }

  _bindStick(zone, knob, mode) {
    if (!zone || !knob) return;
    const max = 36;

    const onDown = (e) => {
      e.preventDefault();
      zone.setPointerCapture(e.pointerId);
      this._active.set(e.pointerId, { mode, zone, knob });
      this._moveStick(e, zone, knob, mode, max);
    };
    const onMove = (e) => {
      const a = this._active.get(e.pointerId);
      if (!a) return;
      this._moveStick(e, a.zone, a.knob, a.mode, max);
    };
    const onUp = (e) => {
      const a = this._active.get(e.pointerId);
      if (!a) return;
      this._active.delete(e.pointerId);
      a.knob.style.transform = "translate(0px, 0px)";
      if (a.mode === "move") {
        this.sub.touch.moveX = 0;
        this.sub.touch.moveY = 0;
      } else {
        this.sub.touch.lookX = 0;
        this.sub.touch.lookY = 0;
      }
    };

    zone.addEventListener("pointerdown", onDown);
    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerup", onUp);
    zone.addEventListener("pointercancel", onUp);
  }

  _moveStick(e, zone, knob, mode, max) {
    const rect = zone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const nx = dx / max;
    const ny = dy / max;
    if (mode === "move") {
      this.sub.touch.moveX = nx;
      this.sub.touch.moveY = ny;
    } else {
      this.sub.touch.lookX = nx;
      this.sub.touch.lookY = ny;
    }
  }
}
