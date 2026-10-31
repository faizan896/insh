# Insha — The Brightest Star

A small, peaceful 3D world made in loving memory of Insha. Sheep graze beside a flowing river, the trees move gently, and a sunlit miniature meadow turns to night. One star shines a little brighter. The experience settles into a living memorial that can be left open.

## Run locally

Use Node.js 24 LTS (the version used for validation) and npm. No API keys, database, accounts, or environment variables are needed.

```bash
cd /workspace/insh
npm ci
npm run dev
```

Open the local address printed by Next.js in your browser (port 3000 by default). For a checkout elsewhere, replace `/workspace/insh` with its directory. If using nvm, run `nvm use` first.

For a production build:

```bash
npm run build
npm start
```

## Publish on GitHub Pages or Vercel

For GitHub Pages, `GITHUB_PAGES=true npm run build` exports the site to `out/` with the `/insh` base path. Publish the contents of `out/` to the `gh-pages` branch. In the repository's **Settings → Pages**, choose **Deploy from a branch**, branch **gh-pages**, folder **/(root)**, and save. GitHub will show the live website address after its deployment completes.

For Vercel, import `faizan896/insh`, keep the detected Next.js defaults, and deploy. Leave `GITHUB_PAGES` unset on Vercel so the website is served from the root URL.

## The experience

- The opening waits for you to **Enter the meadow**. Four chapters then unfold over approximately 31 seconds: The meadow, Nightfall, Your light, and Always. Text dissolves gently between them.
- **Pause story** preserves your place; **Continue** or the four discreet chapter markers let you move at your own pace. The landscape remains alive while the story is paused.
- Drag the meadow to look around; scroll to look closer. With the scene focused, `+` and `-` adjust the view, and `R` restores it. At the end, **Send a little prayer** carries a small light into the three-dimensional sky. Prayers are symbolic, private, and never stored or transmitted.
- **A moment of prayer** opens an optional spiritual dedication. The information button explains the memorial. Both dialogs support Escape, keyboard focus trapping, and focus restoration.
- Ambient sound starts **off**. The sound button creates a quiet original harmonic soundscape in the browser; it downloads no audio files. Use **Sound off** at any time to fade it out.
- **Experience again** returns to the opening. Nothing requires a particular pace.
- If the device requests reduced motion, the scene remains still and the chapters advance only when **Continue** is selected. The controls also work on touchscreens and with a keyboard.

## Personalize

Edit `lib/memorial.ts` for the name, subtitle, closing line, and prayer. The opening and chapter poetry are in `app/page.tsx`. The closing line uses the configurable copy. No dates, photos, or biographical details have been invented.

Color, atmosphere, timing, and responsive layout are in `app/globals.css` and `app/page.tsx`. The title and description are in `app/layout.tsx`. Search indexing is disabled by default for this personal tribute; adjust the metadata if you choose to make it public.

## Structure

```text
app/                     Next.js App Router, metadata, global art direction
components/LivingWorld  WebGL scene, camera, renderer lifecycle, and sky
components/AudioToggle  Optional procedural Web Audio ambience
components/QuietDialog  Native accessible remembrance and prayer dialogs
lib/world/terrain.ts     Sculpted pasture, footpath, and flowing water
lib/world/scenery.ts     Instanced trees, grass, flowers, and bridge
lib/world/animals.ts     Woolly sheep, walking, grazing, and terrain attachment
lib/world/lighting.ts    Independent daylight and moonlight rig
lib/world/types.ts       Shared environment conditions and animation-system API
lib/memorial.ts          Tribute content and chapter names
tests/                   Browser interaction and responsive checks
```

Next.js, React, TypeScript, Tailwind CSS 4, and Framer Motion power the interface. Three.js renders the original 3D landscape with real lighting and shadows, grazing sheep, instanced foliage, animated water, fireflies, and stars. Cormorant Garamond and DM Sans are bundled locally through Fontsource. After installation, the application does not need external images, models, fonts, audio, or paid services. A current browser with WebGL and hardware acceleration is required; the page explains this if WebGL cannot start.

## Scene architecture and future direction

The current world is a meadow. No town, houses, or real-time wall clock are implemented. Each environment module owns its meshes and animation; `LivingWorld` owns the renderer and camera and dispatches a shared `WorldFrame`. Environmental motion is independent of story playback. Instancing keeps the grass, flowers, wool, and foliage practical to render.

Lighting receives `EnvironmentConditions` rather than reading a clock. `chapterConditions` currently supplies the day-to-night sequence. A future time provider synchronized to `Asia/Karachi` can replace that provider and drive the same lighting rig. Roads, houses, windows, and additional inhabitants can be added as separate world systems. An epoch-based animation clock could then reconstruct their activity when a visitor returns. This keeps future town growth separate from the memorial's story and interface.

## Validation

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts a production server on port 3100 and exercises actual WebGL rendering and animation, camera exploration, the journey, pause/resume timing, prayer, replay, audio controls, dialog keyboard/focus behavior, reduced motion, and two phone sizes. It enables Chromium's software WebGL for GPU-free CI. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path instead of downloading Playwright's browser. In the cloud environment, this is `/usr/bin/chromium`.

The cloud sandbox requires approved network/process permissions for installation, local servers, the Next.js compiler, and browser checks. Keep the inherited proxy and certificate settings. Each cloud task is already isolated; use the existing checkout and do not create a Git worktree unless explicitly requested.
