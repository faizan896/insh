import * as THREE from "three";
import { seededRandom } from "@/lib/memorial";

export const riverX = (z: number) => -4.5 + Math.sin(z * .58) * .75;
export const pathX = (z: number) => 2.8 + Math.sin(z * .38) * .65;
export const heightAt = (x: number, z: number) => .15 * Math.sin(x * .38) * Math.cos(z * .36) + .07 * Math.sin(x * .9 + z * .5);

function pastureTexture() {
  const random = seededRandom(8912);
  const canvas = document.createElement("canvas");
  canvas.width = 2048; canvas.height = 1536;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#69a038"; ctx.fillRect(0, 0, 2048, 1536);
  // Broad soft variation gives the grass the colour of a tended, sunlit pasture.
  for (let i = 0; i < 35; i++) {
    const x = random() * 2048, y = random() * 1536, radius = 150 + random() * 350;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, i % 3 ? "#568d3632" : "#d3cc702d"); gradient.addColorStop(1, "#99b85b00");
    ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const colors = ["#c4d685", "#7da34d", "#9fc467", "#d5d883", "#6e9b3f", "#abc878"];
  for (let i = 0; i < 85000; i++) {
    ctx.fillStyle = colors[i % colors.length]; ctx.globalAlpha = .15 + random() * .3;
    const x = random() * 2048, y = random() * 1536;
    ctx.fillRect(x, y, .7 + random() * 2.2, .5 + random() * 2);
  }
  ctx.globalAlpha = 1;
  // Narrow meadow divisions echo the hand-tended little fields in the reference.
  ctx.strokeStyle = "#698d3d40"; ctx.lineWidth = 12; ctx.lineCap = "round";
  const seams = [[60, 500, 700, 700, 1400, 1200], [700, 60, 650, 650, 450, 1450], [1580, 50, 1530, 800, 1950, 1350]];
  for (const [x, y, a, b, c, d] of seams) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(a, b, c, d); ctx.stroke(); }
  const mask = document.createElement("canvas"); mask.width = 2048; mask.height = 1536;
  const m = mask.getContext("2d")!;
  m.fillStyle = "white"; m.filter = "blur(7px)"; m.beginPath(); m.roundRect(35, 35, 1978, 1466, 110); m.fill();
  m.filter = "none";
  for (let i = 0; i < 10000; i++) {
    const side = i % 4, t = random(), spread = (random() - .5) * 44;
    const x = side < 2 ? 95 + t * 1858 : (side === 2 ? 38 : 2010) + spread;
    const y = side < 2 ? (side === 0 ? 38 : 1498) + spread : 95 + t * 1346;
    m.beginPath(); m.arc(x, y, .5 + random() * 3, 0, Math.PI * 2); m.fill();
  }
  ctx.globalCompositeOperation = "destination-in"; ctx.drawImage(mask, 0, 0);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}

function strip(center: (z: number) => number, width: number, elevation: number) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const segments = 180;
  for (let i = 0; i <= segments; i++) {
    const z = -6.78 + (i / segments) * 13.56;
    const w = width * (1 + Math.sin(z * 1.4) * .035);
    for (let side = 0; side < 2; side++) {
      const x = center(z) + (side ? 1 : -1) * w * .5;
      positions.push(x, heightAt(x, z) + elevation, z); uv.push(side, i / segments);
    }
    if (i < segments) { const n = i * 2; indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

export function buildTerrain(world: THREE.Group) {
  const groundGeometry = new THREE.PlaneGeometry(20, 14, 130, 90); groundGeometry.rotateX(-Math.PI / 2);
  const vertices = groundGeometry.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) vertices.setY(i, heightAt(vertices.getX(i), vertices.getZ(i)));
  groundGeometry.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeometry, new THREE.MeshStandardMaterial({ map: pastureTexture(), roughness: 1, alphaTest: .45, side: THREE.DoubleSide }));
  ground.name = "Living meadow terrain"; ground.receiveShadow = true; world.add(ground);

  const sandCanvas = document.createElement("canvas"); sandCanvas.width = 256; sandCanvas.height = 256;
  const sand = sandCanvas.getContext("2d")!, random = seededRandom(129);
  sand.fillStyle = "#e2c891"; sand.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) { sand.fillStyle = i % 2 ? "#b8a07533" : "#f9e4af77"; sand.fillRect(random() * 256, random() * 256, 1, 1); }
  const sandTexture = new THREE.CanvasTexture(sandCanvas); sandTexture.colorSpace = THREE.SRGBColorSpace; sandTexture.wrapS = sandTexture.wrapT = THREE.RepeatWrapping; sandTexture.repeat.set(1, 12);
  const earth = new THREE.MeshStandardMaterial({ map: sandTexture, roughness: 1 });
  const bank = new THREE.Mesh(strip(riverX, 1.78, .015), earth); bank.receiveShadow = true; world.add(bank);
  const path = new THREE.Mesh(strip(pathX, .93, .025), earth); path.name = "The winding path"; path.receiveShadow = true; world.add(path);

  const waterTime = { value: 0 };
  const waterMaterial = new THREE.MeshStandardMaterial({ color: "#3e94b9", roughness: .38, metalness: .04 });
  waterMaterial.onBeforeCompile = shader => {
    shader.uniforms.uWaterTime = waterTime;
    shader.vertexShader = "varying vec3 vMeadowWater;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvMeadowWater = position;");
    shader.fragmentShader = "uniform float uWaterTime;\nvarying vec3 vMeadowWater;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float flow = sin(vMeadowWater.z * 9.0 - uWaterTime * 1.8 + sin(vMeadowWater.x * 12.0) * 0.7);
      float glint = pow(max(0.0, flow), 18.0) * 0.045;
      diffuseColor.rgb += vec3(glint * 0.65, glint * 0.9, glint);
    `);
  };
  const water = new THREE.Mesh(strip(riverX, 1.32, .037), waterMaterial); water.name = "Flowing river"; water.receiveShadow = true; world.add(water);

  const streaks = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: "#d0f0e4", transparent: true, opacity: .28, depthWrite: false }), 52);
  const dummy = new THREE.Object3D();
  const streams = Array.from({ length: 52 }, () => ({ z: random() * 13.2 - 6.6, offset: (random() - .5) * .95, length: .07 + random() * .25, speed: .12 + random() * .15 }));
  world.add(streaks);
  return {
    animate(time: number) {
      waterTime.value = time;
      streams.forEach((s, i) => {
        const z = ((s.z + 6.6 + time * s.speed) % 13.2) - 6.6, x = riverX(z) + s.offset;
        dummy.position.set(x, heightAt(x, z) + .05, z); dummy.rotation.set(-Math.PI / 2, 0, .08 * Math.cos(z));
        dummy.scale.set(.025, s.length, 1); dummy.updateMatrix(); streaks.setMatrixAt(i, dummy.matrix);
      });
      streaks.instanceMatrix.needsUpdate = true;
    },
  };
}
