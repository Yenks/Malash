# SETUP PROMPT: "Thank You" 3D Experience for the Bride and Groom

Paste everything below the line into a coding agent (Claude Code or similar) in an empty folder.
Place `content.json`, `credits.json` and `config.json` from this kit next to this file first.

---

## ROLE

You are a senior creative developer. Build a polished, mobile-first, cinematic 3D "thank you" web experience that an association (GMSA-KNUST) will send to a newly married couple as a link. It is not an invitation and has no RSVP. It is a thank-you message, a collection of wishes from the community, and a blessing for their marriage.

## STEP 1: PROJECT SETUP

Run these commands, then confirm that `npm run dev` starts without errors.

```bash
npm create vite@latest thank-you-experience -- --template vanilla
cd thank-you-experience

# runtime dependencies
npm install three gsap howler lenis lottie-web
npm install @fontsource/cormorant-garamond @fontsource/amiri @fontsource/inter

# dev dependencies (3D asset compression + tooling)
npm install -D @gltf-transform/cli vite-plugin-compression2
```

Requirements: Node 18 or newer. Do not add any other framework. Use plain JavaScript modules (no React).

Copy `content.json`, `credits.json` and `config.json` into `src/data/`. Do not hard-code any user-facing text anywhere else.

## STEP 2: PROJECT STRUCTURE

```
thank-you-experience/
├── index.html
├── vite.config.js
├── src/
│   ├── main.js                  # boot: loader, tap-to-start, wire everything
│   ├── styles/main.css
│   ├── core/
│   │   ├── Renderer.js          # WebGLRenderer, resize, DPR cap, low-end detection
│   │   ├── Camera.js            # camera paths per act
│   │   ├── Theme.js             # day/night, auto by local time, URL override, smooth transition
│   │   ├── Audio.js             # Howler: ambient, effects, mute, crossfade day/night
│   │   ├── Timeline.js          # GSAP master timeline, act switching, skip, replay
│   │   ├── Assets.js            # loaders (GLTF with Draco/Meshopt, textures, video, Lottie), progress
│   │   └── Performance.js       # device tier, FPS watcher, low-data mode
│   ├── scenes/
│   │   ├── Arrival.js
│   │   ├── Letter.js            # 3D envelope, wax seal, unfolding letter
│   │   ├── Wishes.js            # lanterns (night) / kites + petals (day), tappable
│   │   ├── Memories.js          # framed photos drifting in 3D
│   │   ├── Names.js             # particle names + geometric frame + dua
│   │   └── Credits.js           # farewell, keepsake, share, credits footer
│   ├── ui/
│   │   ├── Hud.js               # skip, mute, theme toggle, progress dots
│   │   ├── TextReveal.js        # line-by-line message animation
│   │   ├── WishModal.js
│   │   ├── CreditsFooter.js     # IT & Media team from credits.json
│   │   ├── Keepsake.js          # canvas -> PNG download
│   │   └── Fallback.js          # plain text + CSS version when WebGL fails
│   ├── utils/ (math, device, url, i18n)
│   └── data/ (content.json, credits.json, config.json)
└── public/
    ├── models/    ├── textures/    ├── images/
    ├── audio/     ├── video/       ├── lottie/    └── fonts/
```

## STEP 3: THE EXPERIENCE (about 3 to 4 minutes)

Visitors can skip any act and replay at the end.

1. **Arrival.** Loading screen with a small animated lantern and a real progress bar. Then "Tap to begin". The first tap unlocks audio and starts the experience. If `?to=Name` is in the URL, greet the guest by name.
2. **The Letter.** A 3D envelope floats in the sky. The visitor taps the wax seal; it cracks (particles plus Lottie `sealBurst`), the envelope opens, the letter rises and unfolds, and the message from `content.json` appears line by line with a soft paper sound.
3. **Sky of Wishes.** The camera lifts. At night, glowing lanterns rise around the visitor; by day, kites and petals do. Each object carries one wish from `content.json`. Tapping one opens `WishModal`. Objects are instanced for performance. If `wishesSubmission` is on, a text box adds a new lantern (backend optional, see below).
4. **Moments We Remember.** Photos from `content.json` appear as framed pictures drifting in 3D space with gentle parallax.
5. **Names in Light.** Thousands of particles swirl, then form the couple's names in English and Arabic. Create the shapes by drawing text to an offscreen canvas and sampling its pixels, so Arabic joins correctly (do not use TextGeometry for Arabic). Then the particles settle into a rotating Islamic geometric star pattern around the dua (Arabic, transliteration, translation).
6. **Credits and Farewell.** The scene calms. Show the closing line, "Keep this card" (PNG download), Share (Web Share API with copy-link fallback), Replay, and the **credits footer** from `credits.json`: IT Team and Media Team with names and roles, association logo, special thanks and asset credits.

## STEP 4: DAY AND NIGHT MODE

- Default is "auto": night from 18:00 to 05:59 local time, day otherwise. A sun/moon toggle (always visible) overrides it, and `?theme=day|night` in the URL overrides both.
- The switch animates over about 2.4 seconds: sky gradient, sun or moon position, light intensity, fog, particle type (stars/fireflies vs petals/clouds), and the ambient music crossfade all change together.
- Text and UI colours must keep a contrast ratio of at least 4.5:1 in both modes.

## STEP 5: SOUND

- Use Howler.js. Audio starts only after the first tap. Keep a visible mute button. Remember the mute choice in localStorage inside try/catch.
- Ambient loop per theme, one main theme, and sound effects for tap, seal break, paper unfold, wish open, theme switch, and names forming. File paths are in `config.json`.
- If `audio.allowInstruments` is false, use only the vocal/duff tracks supplied.
- If narration is enabled, show captions.
- Missing audio files must fail silently, not crash the page.

## STEP 6: SHORT ANIMATED VIDEOS

Slots are defined in `config.json > videos`. Rules:
- Use `<video playsinline muted preload="metadata">` with webm and mp4 sources and a poster. Start playback only after the first tap.
- A clip can play fullscreen, be mapped as a texture on the 3D letter (`VideoTexture`), be blended as an overlay, or loop as a background.
- If a file is missing, the connection is slow, or low-data mode is on, skip the clip and run the in-engine animation instead. The experience must never depend on a video.
- Small decorative animations use Lottie (`lottie-web`) from `public/lottie/`.
- Use clear placeholder clips (a gradient with the text "VIDEO SLOT: introClip") until real files exist.

## STEP 7: EXTRA FEATURES (all driven by `config.json > features`)

Personalised guest name from the URL, voice note, memories gallery, keepsake card download, share button, skip and replay, optional wish submission, and an optional explore mode after the ending (off by default).

Wish submission backend: build the UI and a thin `submitWish()` function that is a no-op when `wishesBackend` is "none". Leave clear comments on where to plug in Supabase, Firebase or a Google Apps Script endpoint. Do not add keys or secrets to the repository.

## STEP 8: PERFORMANCE AND ROBUSTNESS (many guests will be on phones and mobile data)

- First load under 3 MB (excluding lazy-loaded acts). Total assets under 25 MB. Load each act's assets just before it starts.
- Compress models with `gltf-transform` (Draco or Meshopt, WebP textures). Use instancing for lanterns, kites and petals.
- Cap pixel ratio at 2 (1.25 on low-end devices). Detect low-end devices and drop to the "low" particle count; watch FPS and degrade automatically.
- Show an offer for the lighter version on slow connections.
- Respect `prefers-reduced-motion`: replace camera moves with fades and cut particle motion.
- If WebGL is unavailable or crashes, show `Fallback.js`: the full message, wishes, dua, and credits as a styled static page.
- Handle tab visibility (pause audio and rendering when hidden), orientation changes, and iOS Safari quirks (100dvh, audio unlock).
- Keyboard support for every action, visible focus states, and alt text for images.
- Add Open Graph tags from `config.json > share` so the link previews nicely on WhatsApp.

## STEP 9: PLACEHOLDERS AND WHAT TO DELIVER

- Everything in `content.json` and `credits.json` marked DUMMY or `{{PLACEHOLDER}}` must render visibly but be easy to find and replace. Generate temporary 3D shapes, colours and silence-safe audio stubs so the project runs end to end with no external assets.
- Provide `README.md` with: how to run, how to replace content, how to add real audio/video/models, how to compress models, how to build (`npm run build`), and how to deploy to Netlify, Vercel or GitHub Pages.
- Provide a `CHECKLIST.md` of all assets still needed (audio files, video clips, photos, logo, models).

## ACCEPTANCE CRITERIA

1. `npm install && npm run dev` works with no errors on a fresh clone.
2. All acts play in order on a phone-sized viewport at a steady frame rate, and can be skipped and replayed.
3. Day and night switch smoothly at any point, and the auto default follows local time.
4. Sound starts only after tap, mute works, and missing files never break the page.
5. Changing text in `content.json` or `credits.json` updates the page with no code edits.
6. The credits footer lists the IT and Media teams from `credits.json`.
7. The fallback page works with WebGL disabled.
8. `npm run build` produces a deployable `dist/` folder.
