# Insha's Little World

A full-screen illustrated miniature town, made in loving memory of Insha. Flower-covered cottages, connected paths, a riverside bridge, warm windows, and a living sky form one composed artwork. The town follows the actual time in Pakistan.

## Run locally

Use Node.js 24 LTS and npm. No accounts, API keys, database, or paid runtime services are required.

```bash
cd /workspace/insh
npm ci
npm run dev
```

Open the local address printed by Next.js, normally on port 3000. For a checkout elsewhere, use its directory instead. With nvm, run `nvm use` first.

```bash
npm run build
npm start
```

The artwork requires a current browser with WebGL and graphics acceleration. This is a fixed 2.5D illustrated composition, not a freely rotatable 3D model. Its responsive framing keeps the village immersive on desktop and mobile.

## A living town, in Pakistan's time

`getTownTime()` in `lib/town/clock.ts` reads the real instant through `Intl.DateTimeFormat` with the explicit `Asia/Karachi` timezone. A visitor's location does not change the town's time. The interface refreshes its clock every second and when the page becomes visible again.

Lighting uses smooth, artistic twilight bands: dawn from 05:00–07:00 PKT and dusk from 17:00–19:00 PKT. These are visual schedules, not location-specific astronomical sunrise calculations. There is no repeating demo cycle or production time override. Environmental animation uses an absolute world epoch, so it does not restart from the same pose whenever someone arrives.

Select Insha's star to reveal **“Insha”** and **“The brightest star in our sky.”** The quiet prayer interaction sends a small light toward the sky. Prayers are private visual gestures: nothing is stored, counted, or transmitted. Optional ambient sound starts muted. Reduced-motion preferences stop environmental movement while the clock continues to follow real Pakistan time.

## Artwork and rendering

The matched day and night illustrations were generated for this project using OpenAI image generation, then optimized into WebP assets in `public/art/` (approximately 1.2 MB combined). They are custom generated illustrations; they are not claimed to be human hand-painted artwork. No stock illustration collection or third-party model pack is used. Fontsource fonts and software dependencies retain their own upstream licenses.

Three.js composites the illustrated art through a WebGL shader. Art-space masks restrict flowing-water refraction and foliage movement to their intended regions. A separate Canvas 2D layer draws drifting atmosphere, anchored chimney smoke, occasional bird passages, fireflies, window light, and the prayer effect. Cormorant Garamond and DM Sans are bundled locally. No external art, font, model, or audio requests are needed after installation.

## Scene architecture

```text
app/                      Full-screen interface, metadata, and responsive styling
components/TownWorld.tsx   Artwork composition, renderer lifecycle, and animation
components/AudioToggle    Optional procedural Web Audio ambience
lib/town/clock.ts         Real Pakistan time and smooth lighting conditions
lib/town/scene.ts         Typed scene manifest, anchors, masks, and painted layers
lib/town/effects.ts       Continuous atmosphere and local environmental details
lib/memorial.ts           Tribute text
public/art/               Matched day/night illustrated assets
tests/                    Clock, rendering, interaction, and responsive checks
```

The scene manifest uses normalized art coordinates for buildings, windows, chimneys, lanterns, foliage, and river masks. Its painted-layer registry accepts separately illustrated transparent building or seasonal layers with matched day/night textures, bounds, and drawing order. The renderer already supports this registry. Additions can share the existing clock, atmosphere, and lighting without replacing the application. After changing the base composition, update its anchors and masks to keep animation attached to the artwork.

Edit tribute copy in `lib/memorial.ts` and `app/page.tsx`; metadata lives in `app/layout.tsx`. No personal dates or biographical details have been invented. Search indexing is disabled by default for this personal tribute.

## Validate

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The suite contains nine browser checks and four pure clock checks. It covers rendered artwork, continuous animation, real Pakistan lighting, the star dedication, prayer, sound, reduced motion, accessibility, and desktop/mobile framing. Browser tests use `page.clock.setFixedTime()` only inside the tests; production has no time-preview control. The pure clock checks cover UTC date rollover, twilight continuity, golden light, and independence from the visitor's timezone.

Playwright starts a production server on port 3100 and enables software WebGL for GPU-free CI. To use an installed Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its path; in the cloud environment this is `/usr/bin/chromium`.

## Publish

For GitHub Pages, run `GITHUB_PAGES=true npm run build`. Publish the contents of `out/`, including `.nojekyll`, to the existing `gh-pages` branch, preserving its Git history and any custom-domain `CNAME`. The export uses the `/insh` base path. Repository Pages settings must use **Deploy from a branch → gh-pages → /(root)**. A source push to `main` alone does not update those generated files.

For Vercel, import `faizan896/insh`, keep the Next.js defaults, and leave `GITHUB_PAGES` unset.

Each cloud task is already isolated: use the existing checkout and do not create a Git worktree unless explicitly requested. Preserve inherited proxy and TLS trust settings. Installation, local servers, compiler workers, and browser checks may need the execution tool's supported approved permissions in the cloud sandbox.
