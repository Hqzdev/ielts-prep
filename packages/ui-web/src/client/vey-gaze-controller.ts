export class VeyGazeController {
  private target = { x: 0, y: 0 };
  private current = { x: 0, y: 0 };
  private active = false;
  private bounds: DOMRect | null = null;
  private dirty = true;

  constructor(private readonly element: HTMLElement) {}

  enable(active: boolean) {
    if (active === this.active) return;
    this.active = active;
    if (active) {
      window.addEventListener("pointermove", this.move, { passive: true });
      document.addEventListener("pointerleave", this.reset);
      window.addEventListener("blur", this.reset);
      window.addEventListener("resize", this.invalidate, { passive: true });
      window.addEventListener("scroll", this.invalidate, {
        passive: true,
        capture: true,
      });
      this.dirty = true;
    } else {
      window.removeEventListener("pointermove", this.move);
      document.removeEventListener("pointerleave", this.reset);
      window.removeEventListener("blur", this.reset);
      window.removeEventListener("resize", this.invalidate);
      window.removeEventListener("scroll", this.invalidate, true);
      this.reset();
    }
  }

  private invalidate = () => {
    this.dirty = true;
  };
  private reset = () => {
    this.target = { x: 0, y: 0 };
  };
  private move = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    if (this.dirty || !this.bounds) {
      this.bounds = this.element.getBoundingClientRect();
      this.dirty = false;
    }
    const rect = this.bounds;
    const dx = event.clientX - rect.left - rect.width * 0.49;
    const dy = event.clientY - rect.top - rect.height * 0.7;
    this.target = { x: Math.tanh(dx / 260) * 5, y: Math.tanh(dy / 220) * 3.5 };
  };

  sample(elapsed: number) {
    const blend = 1 - Math.exp(-Math.min(64, elapsed) / 120);
    this.current.x += (this.target.x - this.current.x) * blend;
    this.current.y += (this.target.y - this.current.y) * blend;
    return { ...this.current };
  }

  destroy() {
    this.enable(false);
  }
}
