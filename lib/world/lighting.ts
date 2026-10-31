import * as THREE from "three";
import type { EnvironmentConditions } from "./types";

export const DAY_PAPER = "#f1ede4";
export const NIGHT_PAPER = "#172b3b";

/** Receives conditions rather than reading the wall clock. A later town can
 * use the same lighting rig with a Pakistan-time environment provider. */
export function buildLighting(scene: THREE.Scene) {
  const ambient = new THREE.HemisphereLight("#fff8de", "#7f9b59", 1.45); scene.add(ambient);
  const sun = new THREE.DirectionalLight("#fff3d5", 2.35); sun.position.set(-7, 11, 8);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 50 });
  sun.shadow.normalBias = .035; sun.shadow.bias = -.0002; sun.shadow.radius = 4; scene.add(sun);
  const fill = new THREE.DirectionalLight("#f3eedb", .5); fill.position.set(6, 8, -8); scene.add(fill);
  const floorMaterial = new THREE.ShadowMaterial({ color: "#65774c", opacity: .17 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMaterial);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.23; floor.receiveShadow = true; scene.add(floor);
  const skyDay = new THREE.Color("#fff8de"), skyNight = new THREE.Color("#b7c9ee");
  const groundDay = new THREE.Color("#8baf67"), groundNight = new THREE.Color("#426873");
  const sunDay = new THREE.Color("#fff3d5"), sunNight = new THREE.Color("#c0d3ff");
  const shadowDay = new THREE.Color("#65774c"), shadowNight = new THREE.Color("#071622");
  // Transparent paper inherits the page's atmosphere, avoiding a canvas seam.
  scene.background = null;
  return {
    update(conditions: EnvironmentConditions) {
      const t = conditions.night;
      floorMaterial.color.copy(shadowDay).lerp(shadowNight, t);
      ambient.color.copy(skyDay).lerp(skyNight, t); ambient.groundColor.copy(groundDay).lerp(groundNight, t);
      ambient.intensity = THREE.MathUtils.lerp(1.45, .95, t);
      sun.color.copy(sunDay).lerp(sunNight, t); sun.intensity = THREE.MathUtils.lerp(2.35, .85, t);
      fill.intensity = THREE.MathUtils.lerp(.5, .28, t);
    },
  };
}
