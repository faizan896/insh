"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { artLayout, localAsset, townScene, type ArtLayout } from "@/lib/town/scene";
import { createTownEffects } from "@/lib/town/effects";
import type { TownTime } from "@/lib/town/clock";

type Props = { time: TownTime; reducedMotion: boolean; prayerPulse: number; onReady?: () => void; onError?: (message: string) => void };

const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uDay, uNight, uWater;
  uniform float uMix, uTime, uGolden, uMotion;
  uniform vec2 uCover, uCenter;
  uniform vec4 uRect;
  uniform vec4 uFoliage[6];
  void main(){
    vec2 uv=(vUv-.5)*uCover+uCenter;
    vec2 original=uv;
    float water=texture2D(uWater,uv).r;
    // A flow field refracts only the painted water. Soft masks protect bridge,
    // stone banks, and architecture from the moving surface underneath them.
    uv.x+=sin(uv.y*94.+uTime*.55)*.0009*water*uMotion;
    uv.y+=sin(uv.x*115.+uv.y*52.-uTime*.65)*.00065*water*uMotion;
    for(int i=0;i<6;i++){
      vec4 region=uFoliage[i];
      float d=length((original-region.xy)/region.zw);
      float canopy=1.-smoothstep(.25,1.,d);
      float phase=float(i)*1.73;
      uv.x+=sin(uTime*.42+phase)*.00085*canopy*uMotion;
      uv.y+=cos(uTime*.31+phase)*.00035*canopy*uMotion;
    }
    vec2 sampleUv=(uv-uRect.xy)/uRect.zw;
    if((uRect.z<.999||uRect.w<.999)&&(any(lessThan(sampleUv,vec2(0.)))||any(greaterThan(sampleUv,vec2(1.)))))discard;
    sampleUv=clamp(sampleUv,vec2(0.),vec2(1.));
    vec4 day=texture2D(uDay,sampleUv);
    vec4 night=texture2D(uNight,sampleUv);
    vec3 art=mix(day.rgb,night.rgb,uMix);
    art*=mix(vec3(1.),vec3(1.025,1.,.965),uGolden*(1.-uMix)*.45);
    gl_FragColor=vec4(art,mix(day.a,night.a,uMix));
    #include <colorspace_fragment>
  }
`;

function riverMask() {
  const canvas = document.createElement("canvas"); canvas.width = 1536; canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "black"; ctx.fillRect(0, 0, 1536, 1024);
  ctx.filter = "blur(4px)"; ctx.fillStyle = "white";
  for (const polygon of townScene.river) {
    ctx.beginPath(); polygon.forEach(([x, y], i) => { if (!i) ctx.moveTo(x * 1536, y * 1024); else ctx.lineTo(x * 1536, y * 1024); }); ctx.closePath(); ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

/** One composited artwork, not a disconnected prop collection. The manifest,
 * clock, painted assets, surface motion, and atmosphere remain independent. */
export default function TownWorld(props: Props) {
  const host = useRef<HTMLDivElement>(null), current = useRef(props); current.current = props;
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "low-power" }); }
    catch { current.current.onError?.("This artwork needs WebGL. Please use a current browser with graphics acceleration enabled."); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.setAttribute("role", "img"); renderer.domElement.setAttribute("aria-label", "A painted miniature village with flower-covered cottages, a flowing river, a wooden bridge, drifting chimney smoke, and a living sky. Its light follows the real time in Pakistan.");
    element.appendChild(renderer.domElement);
    const overlay = document.createElement("canvas"); overlay.className = "town-effects"; overlay.setAttribute("aria-hidden", "true"); element.appendChild(overlay);
    const ctx = overlay.getContext("2d");
    if (!ctx) { renderer.dispose(); current.current.onError?.("The scene could not start in this browser."); return; }
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2); camera.position.z = 1;
    const mask = riverMask();
    const uniforms = {
      uDay: { value: null as THREE.Texture | null }, uNight: { value: null as THREE.Texture | null }, uWater: { value: mask },
      uMix: { value: current.current.time.night }, uTime: { value: 0 }, uGolden: { value: 0 }, uMotion: { value: 1 },
      uCover: { value: new THREE.Vector2(1, 1) }, uCenter: { value: new THREE.Vector2(.5, .5) },
      uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uFoliage: { value: townScene.foliage.map(f => new THREE.Vector4(f.center[0], 1 - f.center[1], f.radius[0], f.radius[1])) },
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthWrite: false, depthTest: false, toneMapped: false });
    const geometry = new THREE.PlaneGeometry(2, 2); scene.add(new THREE.Mesh(geometry, material));
    const layerMaterials: THREE.ShaderMaterial[] = [];
    const effects = createTownEffects(), loader = new THREE.TextureLoader();
    let disposed = false, animation = 0, lastFrame = 0, loaded = false, layout: ArtLayout;
    let width = 1, height = 1, lastPrayer = current.current.prayerPulse, prayerStarted = -100;
    const epoch = Date.now() / 1000, start = performance.now();
    const textures: THREE.Texture[] = [];
    function resize() {
      if (!element) return;
      width = element.clientWidth; height = element.clientHeight;
      renderer.setSize(width, height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      overlay.width = width * dpr; overlay.height = height * dpr; overlay.style.width = `${width}px`; overlay.style.height = `${height}px`; ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout = artLayout(width, height, 1536, 1024);
      uniforms.uCover.value.set(width / (layout.imageWidth * layout.scale), height / (layout.imageHeight * layout.scale));
      uniforms.uCenter.value.set((width / 2 - layout.x) / (layout.imageWidth * layout.scale), .5);
    }
    const observer = new ResizeObserver(resize); observer.observe(element); resize();

    async function loadPair(day: string, night: string) {
      const images = await Promise.all([day, night].map(path => loader.loadAsync(localAsset(path))));
      images.forEach(image => { image.colorSpace = THREE.SRGBColorSpace; image.minFilter = THREE.LinearFilter; image.magFilter = THREE.LinearFilter; });
      return images;
    }
    loadPair(townScene.assets.day, townScene.assets.night).then(async images => {
      if (disposed) { images.forEach(image => image.dispose()); return; }
      textures.push(...images); uniforms.uDay.value = images[0]; uniforms.uNight.value = images[1];
      await Promise.all(townScene.layers.map(async layer => {
        const pair = await loadPair(layer.day, layer.night);
        if (disposed) { pair.forEach(texture => texture.dispose()); return; }
        textures.push(...pair);
        const layerMaterial = material.clone();
        // Conditions and camera mapping are shared; each building owns its art.
        layerMaterial.uniforms = { ...uniforms, uDay: { value: pair[0] }, uNight: { value: pair[1] }, uRect: { value: new THREE.Vector4(layer.bounds[0], 1 - layer.bounds[1] - layer.bounds[3], layer.bounds[2], layer.bounds[3]) } };
        layerMaterial.transparent = true;
        const painted = new THREE.Mesh(geometry, layerMaterial); painted.name = layer.id; painted.renderOrder = layer.order + 1;
        scene.add(painted); layerMaterials.push(layerMaterial);
      }));
      if (disposed) return;
      loaded = true;
      renderer.render(scene, camera); element.dataset.worldReady = "true"; current.current.onReady?.();
    }).catch(() => { if (!disposed) current.current.onError?.("The village artwork could not load. Please refresh to try again."); });

    function draw(now: number) {
      if (disposed) return;
      animation = requestAnimationFrame(draw);
      if (!loaded || document.hidden || now - lastFrame < 33) return;
      lastFrame = now;
      const p = current.current, relative = (now - start) / 1000, worldTime = epoch + relative;
      uniforms.uMix.value = p.time.night; uniforms.uGolden.value = p.time.golden;
      uniforms.uTime.value = p.reducedMotion ? 0 : worldTime % 4096; uniforms.uMotion.value = p.reducedMotion ? 0 : 1;
      if (p.prayerPulse !== lastPrayer) { prayerStarted = relative; lastPrayer = p.prayerPulse; }
      renderer.render(scene, camera);
      effects.draw(ctx!, layout, { time: worldTime, environment: p.time, motion: !p.reducedMotion, prayer: relative - prayerStarted });
    }
    animation = requestAnimationFrame(draw);
    return () => {
      disposed = true; cancelAnimationFrame(animation); observer.disconnect(); textures.forEach(texture => texture.dispose()); mask.dispose(); material.dispose(); layerMaterials.forEach(layer => layer.dispose()); geometry.dispose(); renderer.dispose(); renderer.domElement.remove(); overlay.remove();
    };
  }, []);
  return <div className="town-world" ref={host} data-world-ready="false" />;
}
