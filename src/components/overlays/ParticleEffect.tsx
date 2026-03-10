import { useEffect, useRef } from "react";

interface ParticleEffectProps {
  color: string;
  count?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeDir: number;
}

const ParticleEffect = ({ color, count = 40 }: ParticleEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: -Math.random() * 0.8 - 0.2,
      opacity: Math.random() * 0.6 + 0.1,
      fadeDir: Math.random() > 0.5 ? 1 : -1,
    }));

    const animate = () => {
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      ctx.clearRect(0, 0, cw, ch);

      for (const p of particles.current) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.fadeDir * 0.005;
        if (p.opacity >= 0.7 || p.opacity <= 0.05) p.fadeDir *= -1;
        p.opacity = Math.max(0.05, Math.min(0.7, p.opacity));

        if (p.y < -10) { p.y = ch + 10; p.x = Math.random() * cw; }
        if (p.x < -10) p.x = cw + 10;
        if (p.x > cw + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(")", ` / ${p.opacity})`).replace("hsl(", "hsl(");
        ctx.shadowBlur = p.size * 4;
        ctx.shadowColor = color;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [color, count]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
};

export default ParticleEffect;
