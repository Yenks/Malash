# HANDOFF & FINAL LAUNCH CHECKLIST

This checklist summarizes the final manual steps required by the GMSA-KNUST committee before sharing the live experience with Ahmed Alhassan Machele and Yussif Salamatu Salash.

---

## 1. Secrets & Hidden Messages for the Couple
* **Tell the bride and groom to explore the page**: There are **seven hidden secrets** tucked into the experience for them to discover at their own pace:
  1. *Constellation*: Three faint stars in the Wishes act that connect to form "MALASH'26".
  2. *Heart Tagline*: Pressing and holding the glass heart on the homepage for 500ms reveals *"Hearts Once Apart, Now Closely Aligned"*.
  3. *Beyond the End*: Scrolling past the credits reveals a quiet *"Barakallahu lakuma"* tail blessing.
  4. *Dawn Crescent*: A subtle crescent near the horizon in Names in Light that reveals a special blessing.
  5. *Egg Shards*: After cracking the egg, tapping the fallen shards makes them glow and release rising light.
  6. *EC Office Note*: A seal at the footer opens a private personal note from the Executive Council.
  7. *IT & Media Note*: A star seal next to the committee logo opens a note from the IT & Media team.

---

## 2. Content Customization
* [ ] **Replace Dummy EC Office Note**:
  Edit `src/data/content.json` -> `surprises.ecNote` with the actual message and signature from the Executive Council.
* [ ] **Replace Dummy IT & Media Note**:
  Edit `src/data/content.json` -> `surprises.itMediaNote` with the committee's note.
* [ ] **Collect and Paste Real Wishes**:
  Replace the dummy entries in `src/data/content.json` -> `wishes.items` with the heartfelt messages collected from GMSA-KNUST members and alumni.
* [ ] **Confirm Final Site URL**:
  Set the production URL in `src/data/config.json` (`share.url`) and update `index.html` `og:url` and `og:image` if not using the default domain.

---

## 3. Media, Audio & Brand Assets
* [ ] **Record Narration**:
  Place the voice recording at `public/audio/narration.mp3` and update the narrator label and transcript in `src/data/content.json` -> `voice`.
* [ ] **Licensed Ambient Sounds**:
  Provide authentic licensed audio effects for paper rustle, soft crack, airy whoosh, and soft glass tick. Ensure no music, singing, or melodic instruments are introduced.
* [ ] **Official Logos**:
  Replace placeholder SVGs in `public/images/` with the official vector assets for:
  - Ghana Muslim Students' Association (GMSA-KNUST)
  - IT & Media Committee Crest

---

## 4. Religious Verification
* [ ] **Imam Confirmation of Arabic Texts**:
  Have the KNUST GMSA Imam or a scholar review all Arabic strings across the experience to confirm authenticity and vows suitability:
  - The Quranic verse: Surah Ar-Rum (30:21)
  - The Hadith dua: Tirmidhi 1091 (*Barakallahu lakuma...*)
  - The Three Prayers (*Sakinah*, *Mawaddah*, *Rahmah*)
  - The closing blessings in the Wish Card Maker
  - The dawn crescent secret dua

---

## 5. Physical Device & WhatsApp Testing
* [ ] **Android Phone**: Test the site in Google Chrome on an Android device with portrait and landscape scrolling.
* [ ] **Apple iPhone**: Test in Safari on iOS, verifying that the card preview is sticky, virtual keyboards do not obscure inputs, and "Save card" operates as intended.
* [ ] **WhatsApp In-App Browser**: Send the preview link in a test WhatsApp chat:
  - Verify that the Open Graph card preview renders `og-card-v1.png` with the title *"A letter is waiting for you"* and *"From the GMSA-KNUST family"* without disclosing names.
  - Open the link directly inside WhatsApp's built-in webview and confirm smooth 60fps vertical scrolling.
