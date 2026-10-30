"use client";

import { useEffect, useRef } from "react";
import { seededRandom } from "@/lib/memorial";

export default function AnimatedSky({ night, reducedMotion }: { night: boolean; reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastDraw = 0;
    const random = seededRandom(703);
    const stars = Array.from({ length: 105 }, () => ({
      x: random(), y: random() * .66, radius: .4 + random() * 1.1,
      phase: random() * Math.PI * 2, speed: .12 + random() * .25,
    }));
    const fireflies = Array.from({ length: 24 }, () => ({
      x: random(), y: .61 + random() * .29, phase: random() * Math.PI * 2,
      speed: .15 + random() * .3, radius: .9 + random() * 1.4,
    }));

    function resize() {
      if (!canvas || !context) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(0);
    }
    function draw(time: number) {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      const t = reducedMotion ? 1 : time / 1000;
      for (const star of stars) {
        const opacity = (.3 + (Math.sin(t * star.speed + star.phase) + 1) * .27) * (night ? .85 : .4);
        context.beginPath();
        context.fillStyle = `rgba(240,233,205,${opacity})`;
        context.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
        context.fill();
        if (star.radius > 1.25) {
          context.fillStyle = `rgba(240,233,205,${opacity * .12})`;
          context.beginPath();
          context.arc(star.x * width, star.y * height, star.radius * 3, 0, Math.PI * 2);
          context.fill();
        }
      }
      for (const fly of fireflies) {
        const x = fly.x * width + Math.sin(t * fly.speed + fly.phase) * 16;
        const y = fly.y * height + Math.cos(t * fly.speed * .8 + fly.phase) * 13;
        const opacity = .2 + (1 + Math.sin(t * .8 + fly.phase)) * .23;
        const glow = context.createRadialGradient(x, y, 0, x, y, 12);
        glow.addColorStop(0, `rgba(238,227,158,${opacity})`);
        glow.addColorStop(.2, `rgba(219,221,155,${opacity * .25})`);
        glow.addColorStop(1, "rgba(219,221,155,0)");
        context.fillStyle = glow;
        context.fillRect(x - 12, y - 12, 24, 24);
        context.fillStyle = `rgba(245,235,181,${opacity})`;
        context.beginPath();
        context.arc(x, y, fly.radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    function animate(time: number) {
      if (!document.hidden && time - lastDraw > 33) {
        draw(time);
        lastDraw = time;
      }
      frame = requestAnimationFrame(animate);
    }
    resize();
    if (!reducedMotion) frame = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [night, reducedMotion]);

  return <canvas ref={canvasRef} className="animated-sky" aria-hidden="true" />;
}
