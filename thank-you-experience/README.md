# MALASH'26 Thank You Experience

A mobile-first thank-you letter and marriage blessing from GMSA-KNUST for Machele and Salash. This is a static Vite site. The visual experience uses Three.js particles and procedural geometry, with HTML content for accessible text and interaction.

## Run locally

Node.js 18 or newer is recommended.

```sh
npm install
npm run dev
```

The project root is `thank-you-experience/`. At the repository root, the same npm commands are forwarded to the Vite project. Create a production build with `npm run build`; Vite writes deployable files to `thank-you-experience/dist/`.

## Update content

Edit `src/data/content.json` for the couple details, letter, wishes, dates, verse, dua, and button labels. Edit `src/data/credits.json` for footer copy, asset attributions, and logo paths. Theme, audio, feature, and performance settings are in `src/data/config.json`.

The twelve wishes and narration text are marked DUMMY in the supplied content and should be replaced with approved submissions and a confirmed transcript before public sharing. The dua is displayed exactly as supplied. Please ask an imam to confirm the Arabic text and its dual wording before sending.

## Add assets

Place the GMSA logo at `public/images/gmsa-logo.png` and the IT & Media Committee wordmark at `public/images/it-media-logo.png`. Text placeholders appear when either logo is missing. Add a 1200 by 630 social preview at `public/images/og-card.png` and update the Open Graph image if its path changes.

Optional ambient loops and short effects use the paths in `src/data/config.json`, under `public/audio/`. The experience starts audio only after the first tap; the Sound control is off by default. To add narration, place the recorded voice at `public/audio/narration.mp3`, update `voice.transcript` and `voice.narratorLabel`, then enable the narration control in the UI. Missing audio files fail silently. No music or instrumental sounds are included.

Optional clips belong under `public/video/`; the in-engine scene works without them. Optional Lottie animation files go under `public/lottie/`. To add a GLB model under `public/models/`, optimize it with:

```sh
npx @gltf-transform/cli optimize input.glb public/models/output.glb --texture-compress webp --compress draco
```

## Build and deploy

Run `npm run build` from this repository. Deploy `thank-you-experience/dist/` as a static site. For Vercel, import the repository and set the root directory to `thank-you-experience`, framework to Vite, build command to `npm run build`, and output directory to `dist`. Netlify and Cloudflare Pages can use the same root, build command, and output directory. Vercel CLI is also available with `npx vercel` from the project directory.

## Scope for this delivery

The first shippable experience includes arrival, letter, community wishes, three event arches, names, verse and dua, credits, theme switching, skip and replay, share, keepsake export, responsive layout, and procedural 3D decoration. Optional video clips, real audio, and Lottie polish are not included. Wish submission is disabled. Narration playback stays hidden until a recording is supplied.
