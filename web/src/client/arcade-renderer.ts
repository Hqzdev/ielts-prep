import type { ArcadeState } from "@/domain/arcade";
export class ArcadeRenderer {
  private readonly colors: Record<string, string>;
  private readonly font: string;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const style = getComputedStyle(canvas);
    this.colors = Object.fromEntries(
      ["mist", "border", "muted", "violet", "heading", "reading"].map(
        (name) => [name, style.getPropertyValue(`--${name}`).trim()],
      ),
    );
    this.font = `13px ${style.fontFamily}`;
  }
  draw(state: ArcadeState, speaking: boolean) {
    const rect = this.canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;
    if (
      this.canvas.width !== Math.round(width * scale) ||
      this.canvas.height !== Math.round(height * scale)
    ) {
      this.canvas.width = Math.round(width * scale);
      this.canvas.height = Math.round(height * scale);
    }
    const context = this.canvas.getContext("2d");
    if (!context) return;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = this.colors.mist;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = this.colors.border;
    context.lineWidth = 1;
    context.setLineDash([5, 8]);
    context.beginPath();
    context.moveTo(0, height * 0.36);
    context.lineTo(width, height * 0.36);
    context.stroke();
    context.setLineDash([]);
    context.font = this.font;
    context.fillStyle = this.colors.muted;
    context.fillText(
      "Speak naturally. Volume does not affect your height.",
      24,
      30,
    );
    for (let x = 25; x < width; x += 58) {
      context.save();
      context.translate(x, height * 0.95);
      context.rotate(state.elapsed * 1.1);
      context.beginPath();
      for (let point = 0; point < 28; point++) {
        const angle = (point / 28) * Math.PI * 2;
        const radius = point % 2 ? 17 : 26;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (point === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.closePath();
      context.fillStyle = this.colors.violet;
      context.fill();
      context.beginPath();
      context.arc(0, 0, 5, 0, Math.PI * 2);
      context.fillStyle = this.colors.mist;
      context.fill();
      context.restore();
    }
    context.beginPath();
    context.arc(width / 2, height * state.ballY, 17, 0, Math.PI * 2);
    context.fillStyle = this.colors.heading;
    context.fill();
    context.beginPath();
    context.arc(
      width / 2,
      height * state.ballY,
      speaking ? 25 : 22,
      0,
      Math.PI * 2,
    );
    context.strokeStyle = speaking ? this.colors.reading : this.colors.border;
    context.stroke();
    context.textAlign = "center";
    context.fillStyle = this.colors.muted;
    context.fillText(
      speaking
        ? "Keep going, I'm listening"
        : state.pauseSeconds <= 2
          ? "A short pause is fine"
          : "Get back to your story",
      width / 2,
      height * 0.72,
    );
    context.textAlign = "left";
  }
}
