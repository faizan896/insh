import { seededRandom } from "@/lib/memorial";
import { mapPoint, townScene, type ArtLayout, type ArtPoint } from "./scene";
import type { TownTime } from "./clock";

type Frame = { time: number; environment: TownTime; motion: boolean; prayer: number };

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, strength: number, color = "255,211,137") {
  if (strength < .001) return;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color},${strength})`); gradient.addColorStop(.18, `rgba(${color},${strength * .45})`); gradient.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/** Independent, art-anchored animation layers share an absolute world time. */
export function createTownEffects() {
  const random = seededRandom(87291);
  const stars = Array.from({ length: 58 }, () => ({ x: random(), y: .015 + random() * .22, size: .35 + random() * .65, phase: random() * 6.28 }));
  const flies = Array.from({ length: 16 }, (_, i) => ({ garden: townScene.gardens[i % townScene.gardens.length], x: (random() - .5) * .08, y: (random() - .5) * .065, phase: random() * 6.28 }));
  const cloud = document.createElement("canvas"); cloud.width = 512; cloud.height = 160;
  const c = cloud.getContext("2d")!;
  for (let i = 0; i < 22; i++) {
    const x = 70 + random() * 370, y = 68 + (random() - .5) * 26, r = 25 + random() * 43;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(238,232,226,.13)"); g.addColorStop(1, "rgba(238,232,226,0)"); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return {
    draw(ctx: CanvasRenderingContext2D, layout: ArtLayout, frame: Frame) {
      const { width, height, scale } = layout, { environment, motion } = frame;
      const t = motion ? frame.time : 0, night = environment.night;
      ctx.clearRect(0, 0, width, height);

      // Thin wandering clouds occupy the distant sky, never the buildings.
      for (let i = 0; i < 3; i++) {
        const w = width * (.2 + i * .045), h = w * .25;
        const x = ((t * (1 + i * .2) + i * width * .4) % (width + w * 2)) - w;
        ctx.globalAlpha = (1 - night * .55) * .32;
        ctx.drawImage(cloud, x, height * (.035 + i * .052), w, h);
      }
      ctx.globalAlpha = 1;

      // Stars share the same sky as the interactive star at 74% / 16%.
      for (const s of stars) {
        if (Math.hypot(s.x - .74, s.y - .16) < .055) continue;
        const opacity = night * (.24 + (.5 + Math.sin(t * .28 + s.phase) * .5) * .45);
        ctx.fillStyle = `rgba(245,235,208,${opacity})`; ctx.beginPath(); ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2); ctx.fill();
        if (s.size > .8) glow(ctx, s.x * width, s.y * height, 4, opacity * .13);
      }

      // Smoke grows out of actual painted chimney openings; it never appears at
      // arbitrary coordinates. Puffs thin and separate as they rise into the air.
      townScene.buildings.forEach((building, index) => {
        if (!("chimney" in building) || !building.chimney) return;
        const [x, y] = mapPoint(layout, building.chimney as ArtPoint);
        const cycle = 9 + index;
        for (let i = 0; i < 6; i++) {
          const age = ((t + i * cycle / 6 + index * 2) % cycle) / cycle;
          const radius = (3 + age * 17) * Math.min(scale, 1.2);
          const px = x + Math.sin(t * .16 + age * 3 + index) * age * 17 * scale + age * 12 * scale;
          const py = y - age * (70 + index * 8) * scale;
          const alpha = Math.sin(age * Math.PI) * (night > .5 ? .12 : .14);
          glow(ctx, px, py, radius, alpha, night > .5 ? "180,193,208" : "161,169,174");
        }
      });

      // Warm pools belong to the authored windows and lamps. Tiny variation is
      // intentionally slower and subtler than a candle flicker.
      ctx.globalCompositeOperation = "screen";
      townScene.buildings.forEach((building, i) => building.windows.forEach(point => {
        const [x, y] = mapPoint(layout, point as ArtPoint);
        glow(ctx, x, y, 24 * scale, night * .12 * (.97 + Math.sin(t * .22 + i) * .03));
      }));
      townScene.lanterns.forEach((point, i) => {
        const [x, y] = mapPoint(layout, point);
        glow(ctx, x, y, 32 * scale, night * .21 * (.98 + Math.sin(t * .19 + i) * .02));
      });
      ctx.globalCompositeOperation = "source-over";

      for (const fly of flies) {
        const point: ArtPoint = [fly.garden[0] + fly.x + Math.sin(t * .18 + fly.phase) * .009, fly.garden[1] + fly.y + Math.cos(t * .24 + fly.phase) * .008];
        const [x, y] = mapPoint(layout, point);
        const opacity = night * (.22 + Math.max(0, Math.sin(t * .65 + fly.phase)) * .36);
        glow(ctx, x, y, 7, opacity * .32, "245,226,152");
        ctx.fillStyle = `rgba(250,235,174,${opacity})`; ctx.beginPath(); ctx.arc(x, y, .75, 0, Math.PI * 2); ctx.fill();
      }

      // A short passage of birds, followed by a long quiet interval. The epoch
      // clock means a returning visitor finds them at their current positions.
      const birdPass = (t + 19) % 84;
      if (birdPass < 15 && night < .6) {
        for (let i = 0; i < 3; i++) {
          const x = width * (birdPass / 15 * 1.2 - .1) - i * 17, y = height * .13 + Math.sin(birdPass * .2) * 12 + i * 5;
          const flap = Math.sin(t * 5 + i) * 2.1;
          ctx.strokeStyle = `rgba(60,78,91,${.4 * (1 - night)})`; ctx.lineWidth = .85;
          ctx.beginPath(); ctx.moveTo(x - 4, y - flap); ctx.quadraticCurveTo(x - 2, y - 2, x, y); ctx.quadraticCurveTo(x + 2, y - 2, x + 4, y - flap); ctx.stroke();
        }
      }

      // The prayer rises from a garden towards the star, remaining a brief,
      // private gesture instead of a score or accumulated counter.
      if (frame.prayer >= 0 && frame.prayer < 4.5) {
        const p = frame.prayer / 4.5;
        const ease = p * p * (3 - 2 * p);
        const x = width * (.58 + (.74 - .58) * ease), y = height * (.76 + (.16 - .76) * ease);
        const opacity = Math.sin(p * Math.PI) * .7;
        if (motion) {
          glow(ctx, x, y, 15, opacity * .7);
          ctx.fillStyle = `rgba(255,243,197,${opacity})`; ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill();
        }
        glow(ctx, width * .74, height * .16, 60, opacity * .11);
      }
    },
  };
}
