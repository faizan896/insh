import * as THREE from "three";

type Sheep = {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  ears: THREE.Group[];
  legs: THREE.Group[];
  origin: THREE.Vector2;
  radius: THREE.Vector2;
  phase: number;
  scale: number;
};

function random(seed: number) {
  let value = seed | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/** An unhurried flock, built from shared meshes rather than downloaded models. */
export function buildAnimals(
  world: THREE.Group,
  heightAt: (x: number, z: number) => number,
): { animate: (time: number, motion: boolean) => void } {
  const flock = new THREE.Group();
  flock.name = "The meadow flock";
  world.add(flock);

  const round = new THREE.SphereGeometry(1, 12, 9);
  const woolGeometry = new THREE.IcosahedronGeometry(1, 2);
  const fleece = new THREE.MeshStandardMaterial({ color: "#f4efd9", roughness: .98 });
  const lambFleece = new THREE.MeshStandardMaterial({ color: "#fff6df", roughness: .98 });
  const face = new THREE.MeshStandardMaterial({ color: "#4b4940", roughness: .94 });
  const legMaterial = new THREE.MeshStandardMaterial({ color: "#555247", roughness: 1 });
  const hoofMaterial = new THREE.MeshStandardMaterial({ color: "#383a33", roughness: 1 });
  const earInner = new THREE.MeshStandardMaterial({ color: "#8e8070", roughness: 1 });
  const eyes = new THREE.MeshStandardMaterial({ color: "#151c18", roughness: .3 });
  const eyeGlint = new THREE.MeshBasicMaterial({ color: "#f8f2dd" });
  const matrix = new THREE.Object3D();

  function ellipsoid(
    parent: THREE.Object3D,
    material: THREE.Material,
    position: [number, number, number],
    scale: [number, number, number],
  ) {
    const mesh = new THREE.Mesh(round, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const placements: [number, number, number][] = [
    [-7.4, -3.1, 1], [-6.9, 2.2, .78], [-2, -3.7, .95],
    [.35, -2.15, .92], [-1.2, .9, 1.03], [-.1, 2.45, .68],
    [4.75, -3.7, .93], [6.6, -.75, 1], [5.6, 3.2, .79],
  ];
  const sheep: Sheep[] = [];

  placements.forEach(([x, z, scale], index) => {
    const root = new THREE.Group();
    root.name = `Sheep ${index + 1}`;
    root.scale.setScalar(scale);
    root.position.set(x, heightAt(x, z) + .015, z);
    flock.add(root);
    const body = new THREE.Group();
    root.add(body);
    const coat = scale < .8 ? lambFleece : fleece;

    // A solid soft core prevents gaps between the irregular tufts of fleece.
    ellipsoid(body, coat, [0, .64, 0], [.53, .29, .32]);
    const tuftCount = 32;
    const tufts = new THREE.InstancedMesh(woolGeometry, coat, tuftCount);
    tufts.castShadow = true;
    tufts.receiveShadow = true;
    body.add(tufts);
    for (let tuft = 0; tuft < tuftCount; tuft++) {
      const angle = tuft * 2.399963;
      const v = (tuft + .5) / tuftCount;
      const elevation = Math.acos(1 - 2 * v);
      const nx = Math.cos(angle) * Math.sin(elevation);
      const ny = Math.cos(elevation);
      const nz = Math.sin(angle) * Math.sin(elevation);
      const size = .145 + random(tuft + index * 41) * .065;
      matrix.position.set(nx * .45, .65 + ny * .245, nz * .27);
      matrix.rotation.set(random(tuft + 53), random(tuft + 91), random(tuft + 139));
      matrix.scale.set(size * 1.15, size, size * 1.04);
      matrix.updateMatrix();
      tufts.setMatrixAt(tuft, matrix.matrix);
    }
    tufts.instanceMatrix.needsUpdate = true;

    // The neck and head form a hinge, so grazing lowers the muzzle naturally.
    const head = new THREE.Group();
    head.position.set(.45, .63, 0);
    body.add(head);
    ellipsoid(head, coat, [-.015, .06, 0], [.2, .22, .23]);
    ellipsoid(head, face, [.19, -.015, 0], [.25, .165, .145]);
    ellipsoid(head, face, [.365, -.09, 0], [.13, .115, .13]);
    ellipsoid(head, hoofMaterial, [.466, -.086, .06], [.018, .017, .024]);
    ellipsoid(head, hoofMaterial, [.466, -.086, -.06], [.018, .017, .024]);

    const ears: THREE.Group[] = [];
    for (const side of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(.08, .085, side * .12);
      ear.rotation.x = side * .18;
      head.add(ear);
      ellipsoid(ear, face, [0, -.015, side * .12], [.075, .045, .155]);
      ellipsoid(ear, earInner, [.003, .017, side * .13], [.047, .012, .112]);
      ears.push(ear);
      ellipsoid(head, eyes, [.26, .045, side * .132], [.021, .025, .014]);
      ellipsoid(head, eyeGlint, [.269, .054, side * .143], [.005, .006, .004]);
    }

    const legs: THREE.Group[] = [];
    for (const front of [-1, 1]) {
      for (const side of [-1, 1]) {
        const leg = new THREE.Group();
        leg.position.set(front * .31, .4, side * .19);
        root.add(leg);
        ellipsoid(leg, legMaterial, [0, -.15, 0], [.047, .18, .049]);
        ellipsoid(leg, hoofMaterial, [.016, -.327, 0], [.066, .046, .06]);
        legs.push(leg);
      }
    }
    const tail = ellipsoid(body, coat, [-.57, .64, 0], [.14, .105, .12]);
    tail.rotation.z = -.2;

    sheep.push({
      root, body, head, ears, legs, origin: new THREE.Vector2(x, z),
      radius: new THREE.Vector2(.23 + random(index + 23) * .4, .23 + random(index + 91) * .36),
      phase: random(index + 13) * Math.PI * 2,
      scale,
    });
  });

  function animate(time: number, motion: boolean) {
    const t = motion ? time : 0;
    sheep.forEach((animal, index) => {
      // Monotone eased travel makes a few measured steps, then a grazing pause.
      // The angular progression almost stops at regular intervals without jumping.
      const cycle = t * .18 + animal.phase;
      const progression = cycle - .78 * Math.sin(cycle);
      const walking = .22 + .78 * (1 - Math.cos(cycle)) * .5;
      const walkAngle = progression + index * .7;
      const x = animal.origin.x + Math.cos(walkAngle) * animal.radius.x;
      const z = animal.origin.y + Math.sin(walkAngle) * animal.radius.y;
      animal.root.position.set(x, heightAt(x, z) + .02, z);
      const dx = -Math.sin(walkAngle) * animal.radius.x;
      const dz = Math.cos(walkAngle) * animal.radius.y;
      animal.root.rotation.y = Math.atan2(-dz, dx);
      animal.body.position.y = motion ? Math.sin(t * 3.2 + animal.phase) * .012 * walking : 0;
      const graze = (1 + Math.cos(cycle)) * .5;
      animal.head.rotation.z = -.12 - graze * .72 + Math.sin(t * 1.5 + animal.phase) * .035;
      animal.head.rotation.y = Math.sin(t * .4 + animal.phase) * .08;
      animal.legs.forEach((leg, legIndex) => {
        const opposite = legIndex === 0 || legIndex === 3 ? 0 : Math.PI;
        leg.rotation.z = motion ? Math.sin(t * 3.2 + animal.phase + opposite) * .22 * walking : 0;
      });
      animal.ears.forEach((ear, side) => {
        const twitch = Math.pow(Math.max(0, Math.sin(t * .63 + animal.phase + side * 2.4)), 15);
        ear.rotation.x = (side === 0 ? -.18 : .18) + twitch * .22;
      });
    });
  }

  animate(0, false);
  return { animate };
}
