"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildAnimals } from "@/lib/world/animals";
import { buildScenery } from "@/lib/world/scenery";
import { buildTerrain, heightAt } from "@/lib/world/terrain";
import { buildLighting } from "@/lib/world/lighting";
import { chapterConditions, type WorldFrame, type WorldSystem } from "@/lib/world/types";
import { seededRandom } from "@/lib/memorial";

type Props = { chapter: number; reducedMotion: boolean; prayerPulse: number; onReady?: () => void; onError?: (message: string) => void };

function lightTexture() {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!, gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "#fffbdc"); gradient.addColorStop(.1, "#fff4c6e0"); gradient.addColorStop(.25, "#f3d68b55"); gradient.addColorStop(1, "#f3d68b00");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(canvas);
}

export default function LivingWorld(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props); current.current = props;
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch {
      setFailed(true); current.current.onError?.("This little world needs WebGL. Please open it in a current browser with hardware acceleration enabled."); return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
    renderer.domElement.setAttribute("aria-label", "A three-dimensional meadow with grazing sheep, swaying trees, a little bridge, and a flowing river. Drag to look around; scroll to move closer.");
    renderer.domElement.setAttribute("role", "img"); renderer.domElement.tabIndex = 0;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), world = new THREE.Group(); scene.add(world);
    const camera = new THREE.OrthographicCamera(-16, 16, 11, -11, .1, 150); camera.position.set(10, 25, 22);
    const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, .2, 0); controls.enableDamping = true; controls.dampingFactor = .065;
    controls.enablePan = false; controls.minZoom = .78; controls.maxZoom = 1.6;
    controls.minPolarAngle = .35; controls.maxPolarAngle = .95;
    controls.minAzimuthAngle = -.35; controls.maxAzimuthAngle = .75;
    controls.zoomSpeed = .5; controls.rotateSpeed = .4; controls.update(); controls.saveState();
    const lighting = buildLighting(scene), terrain = buildTerrain(world), scenery = buildScenery(world, heightAt), animals = buildAnimals(world, heightAt);
    const systems: WorldSystem[] = [
      { update: frame => terrain.animate(frame.elapsed) },
      { update: frame => scenery.animate(frame.elapsed, frame.environment.wind) },
      { update: frame => animals.animate(frame.elapsed, frame.motion) },
    ];

    const glow = lightTexture(), random = seededRandom(303);
    const fireflies = new THREE.Group(); world.add(fireflies);
    const flies = Array.from({ length: 24 }, () => {
      const material = new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending });
      const sprite = new THREE.Sprite(material); sprite.scale.setScalar(.15); fireflies.add(sprite);
      return { sprite, origin: new THREE.Vector3((random() - .5) * 17, .4 + random() * .65, (random() - .5) * 11), phase: random() * 6.28 };
    });
    const heavens = new THREE.Group(); heavens.name = "Insha's sky"; world.add(heavens);
    const stars = Array.from({ length: 36 }, () => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#faf1cf", transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending }));
      sprite.position.set((random() - .5) * 19, 4 + random() * 4, (random() - .5) * 11 - 2);
      sprite.scale.setScalar(.045 + random() * .06); heavens.add(sprite); return { sprite, phase: random() * 6.28 };
    });
    const star = new THREE.Group(); star.position.set(.15, 7, -4.2); heavens.add(star);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: "#fff1b8", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); halo.scale.setScalar(2); star.add(halo);
    const starShape = new THREE.Shape();
    for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4, r = i % 2 ? .065 : (i % 4 === 0 ? .38 : .25); const x = Math.sin(angle) * r, y = Math.cos(angle) * r; if (!i) starShape.moveTo(x, y); else starShape.lineTo(x, y); }
    starShape.closePath();
    const starMaterial = new THREE.MeshBasicMaterial({ color: "#fff4cf", transparent: true, opacity: 0, side: THREE.DoubleSide });
    const starCore = new THREE.Mesh(new THREE.ShapeGeometry(starShape), starMaterial); star.add(starCore);
    const starLight = new THREE.PointLight("#ffe8a1", 0, 13, 2); starLight.position.copy(star.position); world.add(starLight);

    const prayer = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending })); prayer.scale.setScalar(.5); world.add(prayer);
    let prayerStarted = -100, lastPrayer = current.current.prayerPulse;
    let elapsed = 0, previous = 0, animation = 0, night = 0, lastRender = 0, lastShadow = 0;
    let disposed = false;
    const conditions = { night: 0, wind: .7 };

    function resize() {
      if (!element) return;
      const width = element.clientWidth, height = element.clientHeight;
      renderer.setSize(width, height);
      const aspect = width / Math.max(1, height);
      const vertical = Math.max(17.5, 27 / aspect);
      camera.left = -vertical * aspect / 2; camera.right = vertical * aspect / 2;
      camera.top = vertical / 2; camera.bottom = -vertical / 2; camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element); resize();
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "r") controls.reset();
      if (event.key === "+" || event.key === "=") { camera.zoom = Math.min(1.6, camera.zoom + .1); camera.updateProjectionMatrix(); event.preventDefault(); }
      if (event.key === "-") { camera.zoom = Math.max(.78, camera.zoom - .1); camera.updateProjectionMatrix(); event.preventDefault(); }
    }
    renderer.domElement.addEventListener("keydown", onKey);
    const clockStart = performance.now();
    function animate(now: number) {
      if (disposed) return;
      animation = requestAnimationFrame(animate);
      const delta = Math.min((now - previous) / 1000 || .016, .06); previous = now;
      if (document.hidden || now - lastRender < 30) return;
      const actualDelta = lastRender ? (now - lastRender) / 1000 : .033; lastRender = now;
      const p = current.current, motion = !p.reducedMotion;
      if (motion) elapsed = (now - clockStart) / 1000;
      const target = chapterConditions(p.chapter);
      night = p.reducedMotion ? target.night : THREE.MathUtils.damp(night, target.night, .28, actualDelta);
      conditions.night = night; conditions.wind = motion ? target.wind : 0;
      lighting.update(conditions);
      const frame: WorldFrame = { elapsed, delta, motion, environment: conditions };
      systems.forEach(system => system.update(frame));
      flies.forEach(({ sprite, origin, phase }) => {
        sprite.position.copy(origin); sprite.position.y += Math.sin(elapsed * .55 + phase) * .13; sprite.position.x += Math.cos(elapsed * .3 + phase) * .2;
        sprite.material.opacity = night * (.4 + Math.sin(elapsed + phase) * .25);
      });
      stars.forEach(({ sprite, phase }) => { sprite.material.opacity = night * (.5 + Math.sin(elapsed * .45 + phase) * .2); });
      star.quaternion.copy(camera.quaternion);
      starMaterial.opacity = night;
      halo.material.opacity = night * (.65 + Math.sin(elapsed * .75) * .1);
      starLight.intensity = night * 5;
      if (p.prayerPulse > lastPrayer) prayerStarted = (now - clockStart) / 1000;
      lastPrayer = p.prayerPulse;
      const prayerT = Math.min(1, ((now - clockStart) / 1000 - prayerStarted) / 3.8);
      if (prayerT < 1) {
        prayer.position.set(1.1 + (star.position.x - 1.1) * prayerT, .4 + (star.position.y - .4) * prayerT, 2 + (star.position.z - 2) * prayerT);
        prayer.material.opacity = Math.sin(prayerT * Math.PI) * .9;
        halo.scale.setScalar(2 + Math.sin(prayerT * Math.PI) * 1.1);
      } else { prayer.material.opacity = 0; halo.scale.setScalar(2); }
      if (now - lastShadow > 450) { renderer.shadowMap.needsUpdate = true; lastShadow = now; }
      controls.enableDamping = motion; controls.update(); renderer.render(scene, camera);
    }
    // Compile shaders and draw the first frame before dismissing the quiet loader.
    lighting.update(conditions); systems.forEach(system => system.update({ elapsed: 0, delta: 0, motion: false, environment: conditions }));
    renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); setReady(true); current.current.onReady?.(); animation = requestAnimationFrame(animate);
    return () => {
      disposed = true; cancelAnimationFrame(animation); resizeObserver.disconnect(); controls.dispose(); renderer.domElement.removeEventListener("keydown", onKey);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
      scene.traverse(object => {
        const drawable = object as THREE.Mesh;
        if (drawable.geometry) geometries.add(drawable.geometry);
        if (drawable.material) (Array.isArray(drawable.material) ? drawable.material : [drawable.material]).forEach(material => materials.add(material));
      });
      materials.forEach(material => { for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value); material.dispose(); });
      geometries.forEach(geometry => geometry.dispose()); textures.forEach(texture => texture.dispose());
      sunShadowCleanup(scene); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <div className="living-world" ref={host} data-world-ready={ready}>
    {!ready && !failed && <p className="world-loading" role="status">A little world is waking up<span>…</span></p>}
    {failed && <p className="world-error" role="alert">This little world needs WebGL.<br /><span>Please use a current browser with hardware acceleration enabled.</span></p>}
  </div>;
}

function sunShadowCleanup(scene: THREE.Scene) {
  scene.traverse(object => { if (object instanceof THREE.DirectionalLight) object.shadow.map?.dispose(); });
}
