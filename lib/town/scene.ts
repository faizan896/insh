/** Art-space coordinates are normalized from the top-left of the illustration.
 * Buildings and animation regions are authored together, rather than scattered.
 * New streets, seasons, or painted building layers can register in this manifest. */
export type ArtPoint = readonly [number, number];
export type Building = { id: string; chimney?: ArtPoint; windows: ArtPoint[] };
export type FoliageRegion = { center: ArtPoint; radius: ArtPoint; phase: number };
export type PaintedLayer = { id: string; day: string; golden?: string; night: string; bounds: readonly [number, number, number, number]; order: number };

export const townScene = {
  assets: { day: "art/town-day.webp", golden: "art/town-golden.webp", night: "art/town-night.webp" },
  // Transparent, separately painted buildings or seasonal details can join the
  // scene through this registry; the renderer handles their light and placement.
  layers: [] as PaintedLayer[],
  buildings: [
    { id: "rose-cottage", chimney: [.202, .163], windows: [[.335, .277], [.196, .394], [.393, .527], [.378, .4], [.124, .503]] },
    { id: "hillside-cottage", chimney: [.536, .282], windows: [[.48, .355], [.504, .351]] },
    { id: "riverside-cottage", chimney: [.922, .31], windows: [[.887, .421], [.96, .522]] },
    { id: "garden-cottage", windows: [[.047, .798]] },
  ] satisfies Building[],
  lanterns: [[.217, .617], [.296, .523], [.549, .56], [.936, .5]] as ArtPoint[],
  foliage: [
    { center: [.052, .395], radius: [.112, .14], phase: 0 },
    { center: [.054, .23], radius: [.095, .09], phase: 2 },
    { center: [.284, .17], radius: [.067, .055], phase: 4 },
    { center: [.589, .509], radius: [.087, .11], phase: 3 },
    { center: [.82, .324], radius: [.085, .095], phase: 1 },
    { center: [.51, .79], radius: [.11, .065], phase: 5 },
  ] satisfies FoliageRegion[],
  river: [
    [[.756,.417],[.771,.422],[.762,.461],[.735,.481],[.741,.495],[.72,.514],[.729,.529],[.715,.55],[.714,.576],[.73,.593],[.716,.615],[.685,.612],[.678,.59],[.687,.56],[.684,.54],[.701,.515],[.697,.498],[.717,.473],[.735,.458],[.742,.437]],
    [[.718,.711],[.746,.714],[.758,.751],[.785,.777],[.786,.817],[.782,.84],[.816,.88],[.846,.92],[.909,.969],[.935,1],[.637,1],[.635,.97],[.657,.944],[.656,.906],[.675,.878],[.666,.856],[.674,.822],[.65,.791],[.68,.751]],
  ] as ArtPoint[][],
  gardens: [[.25,.66],[.46,.72],[.61,.63],[.8,.88],[.17,.85],[.88,.59]] as ArtPoint[],
};

export type ArtLayout = { width: number; height: number; scale: number; x: number; y: number; imageWidth: number; imageHeight: number };

export function artLayout(width: number, height: number, imageWidth: number, imageHeight: number): ArtLayout {
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const focus = width / height < .8 ? .49 : .5;
  return { width, height, scale, x: width / 2 - imageWidth * scale * focus, y: (height - imageHeight * scale) / 2, imageWidth, imageHeight };
}

export function mapPoint(layout: ArtLayout, point: ArtPoint): [number, number] {
  return [layout.x + point[0] * layout.imageWidth * layout.scale, layout.y + point[1] * layout.imageHeight * layout.scale];
}

export function localAsset(path: string) {
  // The same exported files work at / on Vercel and /insh/ on GitHub Pages.
  const route = window.location.pathname.replace(/\/?$/, "/");
  return new URL(path, window.location.origin + route).href;
}
