/**
 * Smoother: interpolates a displayed numeric value towards a target value over time.
 */

export type SmootherOptions = {
  initial?: number;
  speed?: number; // easing factor (0..1)
  tickMs?: number;
  onStep?: (value: number) => void;
};

export class Smoother {
  private target: number;
  private current: number;
  private speed: number;
  private tickMs: number;
  private timer: NodeJS.Timeout | null = null;
  private onStep?: (value: number) => void;

  constructor(opts: SmootherOptions = {}) {
    this.target = opts.initial ?? 0;
    this.current = opts.initial ?? 0;
    this.speed = opts.speed ?? 0.18;
    this.tickMs = opts.tickMs ?? 33;
    this.onStep = opts.onStep;
  }

  setTarget(v: number) {
    this.target = v;
    if (!this.timer) this.start();
  }

  getTarget() {
    return this.target;
  }

  getCurrent() {
    return this.current;
  }

  private tick = () => {
    const delta = this.target - this.current;
    if (Math.abs(delta) < 0.01) {
      this.current = this.target;
    } else {
      this.current = this.current + delta * this.speed;
    }
    this.onStep?.(this.current);
    if (this.current === this.target) {
      this.stop();
    }
  };

  start() {
    if (this.timer) return;
    this.timer = setInterval(this.tick, this.tickMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose() {
    this.stop();
    this.onStep = undefined;
  }
}