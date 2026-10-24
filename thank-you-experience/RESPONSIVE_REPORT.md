# Responsive and theme verification

The implementation pass recorded a 24-case browser sweep: 12 viewport shapes, each in light and dark mode. The cases below include the eight requested viewport sizes plus four rotated phone dimensions. Every case passed horizontal-overflow, title-fit, 44 px HUD/chapter target bounds, HUD collision, and letter nameplate/message intersection checks. The runtime letter assertion is exposed as `document.documentElement.dataset.letterOverlap` and must remain `false`.

| Viewport | Orientation | Light | Dark |
|---|---|---|---|
| 320 x 568 | Portrait | PASS | PASS |
| 360 x 640 | Portrait | PASS | PASS |
| 390 x 844 | Portrait | PASS | PASS |
| 412 x 915 | Portrait | PASS | PASS |
| 768 x 1024 | Portrait | PASS | PASS |
| 1024 x 768 | Landscape | PASS | PASS |
| 1440 x 900 | Landscape | PASS | PASS |
| 1920 x 1080 | Landscape | PASS | PASS |
| 568 x 320 | Landscape phone | PASS | PASS |
| 640 x 360 | Landscape phone | PASS | PASS |
| 844 x 390 | Landscape phone | PASS | PASS |
| 915 x 412 | Landscape phone | PASS | PASS |

At the current browser tab (390 x 844), the final runtime layout assertion reads `false`. A fresh 24-case rerun was unavailable because this browser session exposes DOM inspection but no viewport resize control. The app’s current screenshot/session also restores its previous scroll position, so the matrix above reflects the earlier recorded sweep, not a new run in this final build.

The previous sweep caught and fixed a selector collision between the `home-lantern` variant and lantern artwork, and a crowded narrow-screen HUD. Chapter and HUD controls now retain 44 px hit areas, and letter layout uses a runtime rect check with a development error on residual overlap. The wish-card inputs remain normal page controls and can be scrolled above the software keyboard; device keyboard emulation was not available in the browser tool.
