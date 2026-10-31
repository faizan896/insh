import * as THREE from "three";

type TerrainHeight = (x: number, z: number) => number;

function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const riverX = (z: number) => -4.5 + Math.sin(z * 0.58) * 0.75;
const pathX = (z: number) => 2.8 + Math.sin(z * 0.38) * 0.65;

/** Instanced scenery keeps the small world rich without thousands of draw calls. */
export function buildScenery(world: THREE.Group, heightAt: TerrainHeight) {
  const random = seeded(700361);
  const trees: { crown: THREE.Group; phase: number; amount: number }[] = [];
  const scenery = new THREE.Group();
  scenery.name = "Meadow trees, flowers and footbridge";
  world.add(scenery);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();

  const bark = new THREE.MeshStandardMaterial({ color: "#8a7954", roughness: 1 });
  const foliage = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95 });
  const leafShape = new THREE.SphereGeometry(1, 14, 10);
  const leafPositions = leafShape.getAttribute("position");
  for (let i = 0; i < leafPositions.count; i++) {
    const x = leafPositions.getX(i), y = leafPositions.getY(i), z = leafPositions.getZ(i);
    const unevenness = 1 + 0.045 * Math.sin(x * 11 + z * 6) * Math.cos(y * 8 - x * 2);
    leafPositions.setXYZ(i, x * unevenness, y * unevenness, z * unevenness);
  }
  leafShape.computeVertexNormals();
  const branchShape = new THREE.CylinderGeometry(0.075, 0.11, 1, 7);

  const placements: [number, number, number, boolean?][] = [
    [-8.1, -5.1, 1.08], [-7.6, 4.6, 1.13, true], [-1.3, -5.4, 0.91],
    [6.5, -5.3, 1.05], [8.1, 4.4, 1.2], [8.5, -1.1, 0.86],
    [-0.9, 5.6, 0.77], [-8.4, -0.3, 0.76], [0.2, -5.8, 0.66],
  ];

  for (const [x, z, scale, blush] of placements) {
    const tree = new THREE.Group();
    tree.position.set(x, heightAt(x, z), z);
    tree.scale.setScalar(scale);
    tree.rotation.y = random() * Math.PI * 2;
    scenery.add(tree);
    const trunk = new THREE.InstancedMesh(branchShape, bark, 4);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    dummy.position.set(0, 0.65, 0);
    dummy.rotation.set(0.03, 0, 0.05);
    dummy.scale.set(1, 1.3, 1);
    dummy.updateMatrix(); trunk.setMatrixAt(0, dummy.matrix);
    for (let i = 1; i < 4; i++) {
      const angle = i * 2.1;
      const direction = new THREE.Vector3(Math.cos(angle) * 0.36, 0.65, Math.sin(angle) * 0.36);
      dummy.position.set(direction.x * 0.5, 1.1 + direction.y * 0.5, direction.z * 0.5);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      dummy.scale.set(0.58, direction.length(), 0.58);
      dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix);
    }
    tree.add(trunk);

    const crown = new THREE.Group();
    crown.position.y = 1.1;
    tree.add(crown);
    const clumps = new THREE.InstancedMesh(leafShape, foliage, 17);
    clumps.castShadow = true;
    clumps.receiveShadow = true;
    const palette = blush ? ["#d4b0bd", "#c49caf", "#d9b7c5", "#b991aa", "#e2c1c9"] :
      ["#82b647", "#88bc4c", "#7aab40", "#91bd52", "#719f39", "#9cc75d"];
    for (let i = 0; i < 17; i++) {
      const ring = i < 9;
      const angle = i * 2.3999;
      const radius = ring ? 0.52 + random() * 0.15 : 0.37 + random() * 0.21;
      const size = 0.42 + random() * 0.18;
      dummy.position.set(Math.cos(angle) * radius, ring ? 0.1 + random() * 0.25 : 0.65 + random() * 0.2, Math.sin(angle) * radius);
      dummy.rotation.set(random(), random() * 5, random());
      dummy.scale.set(size * (0.9 + random() * 0.25), size * (0.9 + random() * 0.3), size);
      dummy.updateMatrix(); clumps.setMatrixAt(i, dummy.matrix);
      clumps.setColorAt(i, tint.set(palette[i % palette.length]));
    }
    crown.add(clumps);
    trees.push({ crown, phase: random() * 6.28, amount: 0.012 + random() * 0.007 });
  }

  // Fine, leaning blades catch light at a very different scale from the trees.
  const grassShape = new THREE.BufferGeometry();
  grassShape.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.014, 0, 0, 0.014, 0, 0, 0.029, 0.18, 0.006,
    0, 0, -0.014, 0, 0, 0.014, -0.014, 0.13, 0.02,
  ], 3));
  grassShape.computeVertexNormals();
  const grassMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, side: THREE.DoubleSide });
  const grass = new THREE.InstancedMesh(grassShape, grassMaterial, 13000);
  grass.receiveShadow = true;
  const grassColors = ["#92af58", "#a9c46e", "#b3ca72", "#8aaa50", "#c0ce81", "#88a952"];
  let grassCount = 0;
  for (let i = 0; i < 17000 && grassCount < 13000; i++) {
    const x = random() * 19 - 9.5, z = random() * 12.7 - 6.35;
    if (Math.abs(x - riverX(z)) < 0.88 || Math.abs(x - pathX(z)) < 0.52) continue;
    // Deliberately leave broad, grazed clearings between thicker tufts.
    if (Math.sin(x * 0.83) + Math.cos(z * 1.2) < -0.7 && random() < 0.65) continue;
    const edge = Math.min(9.65 - Math.abs(x), 6.5 - Math.abs(z));
    if (edge < 0.4 && random() > edge * 2) continue;
    dummy.position.set(x, heightAt(x, z) + 0.006, z);
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    const scale = 0.45 + random() * 0.85;
    dummy.scale.set(scale, scale * (0.6 + random() * 0.55), scale);
    dummy.updateMatrix(); grass.setMatrixAt(grassCount, dummy.matrix);
    grass.setColorAt(grassCount++, tint.set(grassColors[i % grassColors.length]));
  }
  grass.count = grassCount;
  scenery.add(grass);

  const flowerShape = new THREE.IcosahedronGeometry(1, 0);
  const flowerMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1 });
  const flowers = new THREE.InstancedMesh(flowerShape, flowerMaterial, 1800);
  flowers.receiveShadow = true;
  let flowerCount = 0;
  const flowerColors = ["#fff5d8", "#f4d77b", "#e8e6cb", "#d6c9e2", "#f6e9be", "#f3f0df"];
  for (let i = 0; i < 680; i++) {
    const x = random() * 18.7 - 9.35, z = random() * 12.3 - 6.15;
    if (Math.abs(x - riverX(z)) < 1.03 || Math.abs(x - pathX(z)) < 0.6) continue;
    const centerY = heightAt(x, z) + 0.08 + random() * 0.07;
    const headSize = 0.021 + random() * 0.017;
    for (let petal = 0; petal < 3 && flowerCount < 1800; petal++) {
      const angle = petal * 2.094;
      dummy.position.set(x + Math.cos(angle) * headSize * 0.7, centerY + random() * 0.008, z + Math.sin(angle) * headSize * 0.7);
      dummy.rotation.set(0, random() * Math.PI, 0);
      dummy.scale.set(headSize, headSize * 0.5, headSize);
      dummy.updateMatrix(); flowers.setMatrixAt(flowerCount, dummy.matrix);
      flowers.setColorAt(flowerCount++, tint.set(flowerColors[i % flowerColors.length]));
    }
  }
  flowers.count = flowerCount;
  scenery.add(flowers);

  // Rounded river stones and small reed clusters keep the water's edge tangible.
  const rockShape = new THREE.IcosahedronGeometry(1, 1);
  const rockMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.94 });
  const rocks = new THREE.InstancedMesh(rockShape, rockMaterial, 58);
  rocks.castShadow = true; rocks.receiveShadow = true;
  for (let i = 0; i < 58; i++) {
    const z = random() * 12.1 - 6.05;
    const x = riverX(z) + (i % 2 ? -1 : 1) * (0.83 + random() * 0.25);
    const size = 0.06 + random() * 0.16;
    dummy.position.set(x, heightAt(x, z) + size * 0.24, z);
    dummy.rotation.set(random(), random() * 6, random());
    dummy.scale.set(size * 1.3, size * 0.57, size);
    dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
    rocks.setColorAt(i, tint.setHSL(0.12 + random() * 0.04, 0.1, 0.55 + random() * 0.13));
  }
  scenery.add(rocks);

  const reedShape = new THREE.CylinderGeometry(0.009, 0.012, 1, 4);
  const reeds = new THREE.InstancedMesh(reedShape, new THREE.MeshStandardMaterial({ color: "#81934c", roughness: 1 }), 90);
  reeds.receiveShadow = true;
  for (let i = 0; i < 90; i++) {
    const z = random() * 11.6 - 5.8;
    const x = riverX(z) + (i % 2 ? -1 : 1) * (0.8 + random() * 0.17);
    const height = 0.14 + random() * 0.18;
    dummy.position.set(x, heightAt(x, z) + height * 0.5, z);
    dummy.rotation.set((random() - 0.5) * 0.3, random(), (random() - 0.5) * 0.3);
    dummy.scale.set(1, height, 1);
    dummy.updateMatrix(); reeds.setMatrixAt(i, dummy.matrix);
  }
  scenery.add(reeds);

  const bridge = new THREE.Group();
  const bridgeZ = 1.15;
  const bridgeX = riverX(bridgeZ);
  const bridgeY = Math.max(heightAt(bridgeX - 1.2, bridgeZ), heightAt(bridgeX + 1.2, bridgeZ)) + 0.1;
  bridge.position.set(bridgeX, bridgeY, bridgeZ);
  const woodMaterial = new THREE.MeshStandardMaterial({ color: "#c2a57b", roughness: 0.93 });
  const woodShape = new THREE.BoxGeometry(1, 1, 1);
  const boards = new THREE.InstancedMesh(woodShape, woodMaterial, 22);
  boards.castShadow = true; boards.receiveShadow = true;
  for (let i = 0; i < 14; i++) {
    const x = (i - 6.5) * 0.175;
    const arch = Math.max(0, 0.065 * (1 - (x / 1.25) ** 2));
    dummy.position.set(x, arch, (random() - 0.5) * 0.018);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(0.163, 0.065, 1.02);
    dummy.updateMatrix(); boards.setMatrixAt(i, dummy.matrix);
  }
  for (let i = 0; i < 4; i++) {
    dummy.position.set(i % 2 ? -1.13 : 1.13, 0.28, i < 2 ? -0.49 : 0.49);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(0.067, 0.6, 0.067);
    dummy.updateMatrix(); boards.setMatrixAt(14 + i, dummy.matrix);
  }
  for (let i = 0; i < 4; i++) {
    dummy.position.set(0, i < 2 ? 0.53 : 0.25, i % 2 ? -0.49 : 0.49);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(2.34, 0.045, 0.045);
    dummy.updateMatrix(); boards.setMatrixAt(18 + i, dummy.matrix);
  }
  bridge.add(boards);
  scenery.add(bridge);

  // A short fence suggests a tended field without turning the tribute into a town.
  const fence = new THREE.InstancedMesh(woodShape, new THREE.MeshStandardMaterial({ color: "#bba57a", roughness: 1 }), 13);
  fence.castShadow = true; fence.receiveShadow = true;
  for (let i = 0; i < 5; i++) {
    const x = 4.1 + i * 0.86, z = -4.65;
    dummy.position.set(x, heightAt(x, z) + 0.31, z);
    dummy.rotation.set(0, 0, (random() - 0.5) * 0.04);
    dummy.scale.set(0.075, 0.65, 0.08);
    dummy.updateMatrix(); fence.setMatrixAt(i, dummy.matrix);
  }
  for (let i = 0; i < 8; i++) {
    const x = 4.53 + Math.floor(i / 2) * 0.86, z = -4.65;
    dummy.position.set(x, heightAt(x, z) + (i % 2 ? 0.48 : 0.25), z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(0.91, 0.049, 0.045);
    dummy.updateMatrix(); fence.setMatrixAt(5 + i, dummy.matrix);
  }
  scenery.add(fence);

  return {
    animate(time: number, wind: number) {
      for (const tree of trees) {
        tree.crown.rotation.z = Math.sin(time * 0.55 + tree.phase) * tree.amount * wind;
        tree.crown.rotation.x = Math.cos(time * 0.38 + tree.phase) * tree.amount * 0.55 * wind;
      }
    },
  };
}
