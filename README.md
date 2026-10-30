# Insha — The Brightest Star

A small, peaceful world made in loving memory of Insha. An illustrated meadow turns from dusk to night, and one star shines a little brighter. The experience settles into a living memorial that can be left open.

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
- Select the brightest star to look toward Insha's light. At the end, **Send a little prayer** carries a small sparkle into the sky. Prayers are symbolic, private, and never stored or transmitted.
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
components/MeadowScene   Original layered SVG landscape and flowers
components/AnimatedSky  Deterministic canvas stars and drifting fireflies
components/AudioToggle  Optional procedural Web Audio ambience
components/QuietDialog  Native accessible remembrance and prayer dialogs
lib/memorial.ts          Tribute content and chapter names
tests/                   Browser interaction and responsive checks
```

Next.js, React, TypeScript, Tailwind CSS 4, and Framer Motion power the experience. The landscape is original SVG, with canvas fireflies and stars, subtle grain, and pointer parallax. Cormorant Garamond and DM Sans are bundled locally through Fontsource. After installation, the application does not need external images, fonts, audio, or paid services.

## Validation

```bash
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts a production server on port 3100 and exercises the journey, pause/resume timing, prayer, replay, audio controls, dialog keyboard/focus behavior, reduced motion, and two phone sizes. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path instead of downloading Playwright's browser. In the cloud environment, this is `/usr/bin/chromium`.

The cloud sandbox requires approved network/process permissions for installation, local servers, the Next.js compiler, and browser checks. Keep the inherited proxy and certificate settings. Each cloud task is already isolated; use the existing checkout and do not create a Git worktree unless explicitly requested.
