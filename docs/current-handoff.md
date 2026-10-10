## 2026-10-11 Fireworks: Sydney Harbour Bridge placement and duplicate-massing correction

- **Base:** main @ 4ebfcb2548bd02714355191ed7733b210c01e12b (clean supplied snapshot). No commits, pushes, deploys or regeneration of raw Sydney acquisition data.
- **Root cause confirmed in the checked-in Sydney scene:** authored Harbour Bridge centre `(175.0, 356.0)` disagreed with the midpoint of the four real Overture pylon footprints near `(114.0, 239.5)` in the EPSG:7856-derived local-metre coordinate system. The existing bridge angle `-25.3°`, 503 m arch span and schematic truss are retained. The authored bridge centre is now `(114.0, 239.5)` in both the static browser JSON and the reproducible preparation script.
- Two **unnamed Overture building-part volumes** with 89 m heights duplicated the authored bridge pylon masses: `88d86b8e-0235-39e7-b118-6f71cb92961b` (south) and `2eeda083-a182-336a-a922-d99f7cac767f` (north). They are still present in the source-backed bundle but no longer rendered. Shared `overlapsAuthoredLandmark()` now filters those exact IDs **only when** sourced geometry, 89 m height and proximity to the authored pylon position all agree. The four explicitly named pylon parts were already filtered. Other Overture buildings and city structures are not changed.
- **Files:** `public/data/fireworks-simulator/sydney-city.json`, `scripts/data/fireworks-simulator/{prepare_sydney_city.py,test_prepare_sydney_city.py}`, `src/visualisations/fireworks-simulator/{city-landmarks.ts,city-landmarks.test.mjs}`, `data/sources/fireworks-simulator-sydney-city.md`, this handoff, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/ux-accessibility-features.md`. **Deletions: none.**
- **Validation:** 75 Fireworks Node tests, 15 Sydney preparation Python tests and focused TypeScript compilation passed; projected pylon endpoints are within 9 m of the verified sourced centroids; root-ready ZIP integrity to be verified before delivery. **Not run:** full Astro build or actual browser/WebGL visual check. Next: inspect Harbour Bridge from north and south and verify no extra high blocks at its ends, including PLAN and WebGL fallback.

---

## 2026-10-11 Publish helper: safe whitespace repair

- **Base:** user-supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f`. This patch changes only publishing support, tests and documentation. The current Fireworks working tree is not rewritten by applying the patch; no commit, push or Cloudflare changes.
- The publish helper now stages changes, uses Git's staged-diff diagnostics to repair **only flagged trailing spaces/tabs and extra blank lines at EOF**, restages those files, then runs `git diff --cached --check` and `npm run build` before committing. It accepts CRLF as a valid line ending and preserves existing LF/CRLF and UTF-8, and stops safely on unsupported whitespace checks, encoding errors or build failures. LF-to-CRLF Git notices remain non-blocking warnings.
- Files: `scripts/publish-project.ps1`, new `scripts/fix-staged-whitespace.mjs`, new `scripts/fix-staged-whitespace.test.mjs`, `docs/git-workflow.md`, `docs/current-handoff.md`. Deletions: none.
- Validation: Node unit/integration tests in temporary Git repositories and patch ZIP integrity (see delivery). Not run: Windows PowerShell live publisher, full Astro build or actual GitHub/Cloudflare publication. **Next:** apply the patch to the matching working tree and rerun `publish-project.bat` after checking the staged file list, particularly temporary Python bytecode and local acquisition logs.

---

## 2026-10-10 Fireworks: Sydney sky prototype and advanced viewport disclosure

- **Base:** supplied dirty `main` at full commit `17a011695370cdf5985fbb76be725ea9d284849f`, with reviewed Fireworks patches through 10 m upward tilt applied. No commit, push, release or Cloudflare changes.
- Verified existing `FW-NAV:v4` defaults already exactly match the requested profile: mouse move LOW/HIGH 2.35/1.00, mouse pan 1.50/0.75, keyboard move 5.75/2.25, keyboard pan 5.75/2.25, curve 1.6, 10–2000 m. They remain reset-on-refresh; no alteration to speed values or navigation mechanics.
- Added **SHOW ADVANCED VIEWPORT SETTINGS** switch (initially off) inside Map/View Options. The full calibration sliders, plot and copyable FW-NAV output stay available but start hidden and inert.
- Added first-stage Sydney SKYLINE astronomy: local date/time, 1-minute time slider, calculated sunrise/sunset markers, default **today in Sydney one hour after sunset** (IANA Australia/Sydney with daylight saving). Top scene-controls readout shows chosen date/time. Actual star direction is projected into the same east/north/up camera basis as Sydney; the real 53 documented bright stars are drawn, and the prototype now supplements them with 420 deterministic faint background speckle stars so the sky reads fuller at night. Bright stars still use apparent-magnitude-based size/brightness; the supplemental speckle layer uses approximate faint magnitudes and subtle reduced-motion-aware twinkle. Follow-up prototype tweak: the skyline Moon is drawn larger for readability, and a new top-right orientation HUD reports heading/elevation with a small perspective compass. Moon has low-order estimated sky position/illumination, a draft phase texture and a settings preview, and appears in the scene only above the ideal horizon. Time-of-day atmosphere is restrained for city-wireframe readability. PLAN hides sky; WebGL and Canvas fallback remain separate from the sky layer.
- New source/provenance and limitations: `data/sources/fireworks-simulator-sky.md`, linked from `docs/index.md`. No external runtime fetch, new npm dependency, new site route or Sydney city data regenerated. **This is not a complete star atlas, a geographically accurate city-light-pollution model or a precision lunar ephemeris.**
- Included changes: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,bright-stars.ts,night-sky.ts,night-sky.test.mjs}`, `data/sources/fireworks-simulator-sky.md`, `docs/{index.md,current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. Deletions: none.
- Validation: focused Node regressions including Sydney daylight saving, solar events, star horizon, Moon phase, DOM wiring; scoped TypeScript compile with TS extensions; CSS syntax parse and ZIP integrity. **Not run:** full Astro build (dependencies not bundled), browser/WebGL visual and touch QA, precision comparison with reference astronomical software. **Next:** test 10 Oct near-new-Moon (the Moon may be invisible), then pick a full-Moon night; compare actual sky directions and test slider at narrow widths before considering a complete catalogue.

---

## 2026-10-10 Fireworks upward camera tilt at the 10 m floor

- **Source:** dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f` with all previously delivered Fireworks patches through the exact 50% projection-centre change. This package does not commit or deploy anything.
- **Behaviour:** right-drag up and Up Arrow may increase the upward camera pitch at exactly 10 m, with the same manual map-orbit path used at 11 m and higher. When the orbit would put the eye below 10 m, translate **both** the rotated eye and look target upward by the smallest required amount; do not clip the pitch or switch to the former eye-only look-up branch. The 10 m floor and world-up pitch limit still apply, and camera direction, left-drag, zoom and calibration remain unchanged.
- **Files:** `src/visualisations/fireworks-simulator/camera-map-rotation.ts`, its `.test.mjs`, this handoff, the active Fireworks plan and UX inventory. No deletion, city-data or renderer changes.
- **Validation:** focused rotation and Fireworks tests and narrowed TypeScript compilation (see delivery); full Astro build and physical Windows mouse feel remain for local review. Test upward tilt at 10 m, then just above 10 m, with both right-drag and Up Arrow; reverse direction and confirm height does not drop below 10 m.

---

## 2026-10-10 Fireworks exact viewport-centre projection

- **Base:** latest supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f`, with reviewed Fireworks patches through the centre-aimed zoom/crosshair overlaid. No commit, push or deployment.
- SKYLINE and PLAN camera projection origins are both exactly the **geometric viewport centre** (50% width, 50% height) at every breakpoint. Removed the legacy 57%/47% desktop SKYLINE, 50%/38% mobile SKYLINE, and offset PLAN origins. The same origin feeds Canvas geometry/labels, WebGL uniforms, screen-to-world pointer rays and the temporary zoom crosshair; resize and view changes recalculate it. Zoom direction remains the camera's optical axis, independent of OS cursor location.
- Files: `src/visualisations/fireworks-simulator/{fireworks-simulator.ts,camera-zoom-aim.ts,camera-zoom-aim.test.mjs}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No camera sensitivity, height limit, controls, data, renderer code, UI settings or deletions.
- **Validation:** 63/63 focused Fireworks tests pass, including screen-centre integration and desktop/mobile dimensions; scoped Fireworks TypeScript compile passes; ZIP integrity verified. No full Astro build or live browser visual test. **Next:** check centred target marker, city framing and landmark labels in SKYLINE and PLAN at desktop/mobile widths; verify Pointer Lock zoom and dragging stay aligned.

---

## 2026-10-10 Fireworks aim-centred zoom marker

- **Source:** latest available supplied dirty `main` snapshot `17a011695370cdf5985fbb76be725ea9d284849f`, with all previously delivered Fireworks patches through the calibrated default / keyboard-speed split applied. This focused patch changes only zoom input/feedback and instructions; no commit, push or deployment.
- Ordinary SKYLINE wheel zoom no longer follows the OS pointer ray, which is especially confusing while Pointer Lock hides the cursor. Instead, the camera moves along its **current view/aim direction**, matching existing +/- travel. Shift + left drag and two-finger pinch use the same centred ray, keeping their existing amount, gesture directions and floor protection. PLAN retains its established centred orthographic zoom.
- Added a small, non-interactive crosshair with a central dot at the scene's *actual projected aim* (the perspective projection is intentionally offset on desktop). It is visible for active wheel/pinch/Shift-drag/keyboard zoom and its easing, then fades after interaction ends. The old pointer cursor is suppressed while the aim marker is shown. Reduced-motion disables the fade. Screen-space positioning is updated on resize and SKYLINE/PLAN changes, and the ray uses the same projection aim source as the overlay.
- Files: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,camera-zoom-aim.ts,camera-zoom-aim.test.mjs}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No file deletions, renderer/shader, Sydney city asset, or calibration-profile changes.
- Validation: scoped Fireworks TypeScript compilation; focused Node regression suite including aim-screen geometry and actual wheel/pinch/Shift-drag call-site checks; CSS parsed with PostCSS. The full Astro build is unavailable (no project `node_modules` in the supplied snapshot). **Next review:** check pointer-locked wheel, mouse-centred versus visual-aim zoom at different cursor positions, pinch and Shift-drag, and crosshair visibility on the local browser.

---

## 2026-10-10 Fireworks confirmed navigation baseline and split keyboard tuning

- **Base:** supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the latest slower-height-controls patch applied. No commit, push or deployment.
- Promoted the owner's `FW-NAV:v3` settings to the single shared default profile: mouse move 2.35× low / 1.00× high, mouse right-rotate 1.50× / 0.75×, keyboard 5.75× / 2.25×, curve power 1.6, logarithmic altitude range 10–2,000 m. These replace the earlier trial defaults.
- Split keyboard calibration into **KEYBOARD MOVE** (WASD pan, Q/E height translation and +/- camera travel) and **KEYBOARD PAN/ROTATE** (arrow-key rotation). Both start at the owner's previous keyboard values, then can be tuned independently at low/high altitude. The chart and effective values now draw four separate curves; the copyable `FW-NAV:v4` output names `keyboard_move_low/high`, `keyboard_pan_low/high`, `effective_keyboard_move` and `effective_keyboard_pan`.
- Calibration is now **session-only**: adjusting sliders does not write persistent navigation settings, and reloading the page starts from the confirmed defaults regardless of any old v1/v2/v3 localStorage data. Other saved preferences (e.g., landmark orbit and navigation guide) are unaffected. Browser dimensions and live camera height in copied configurations are captured dynamically, not hard-coded from the provided example.
- Changed `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,navigation-calibration.ts,navigation-calibration.test.mjs}` and updated `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No files removed, no city data or renderer edits.
- Validation: 58 focused Node tests and narrowed Fireworks TypeScript compile passed; CSS syntax and ZIP structure checked. Full Astro build and real browser pointer/keyboard feel still require local testing. Next: tune separate keyboard move and rotation and copy the new `FW-NAV:v4` line for refinement.

---

## 2026-10-10 Fireworks direct camera-height sensitivity reduction

- **Base:** supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f` with the latest altitude-curve calibration ZIP applied. No commit, push or deployment.
- User testing found camera height adjustment too fast. Reduced direct **Q/E keyboard altitude translation** approximately 8–10× and **left-mouse-button + wheel immediate altitude translation** approximately 5×. A focused `camera-height-controls.ts` helper provides bounded conversion for each. Q/E retains the existing eased input, keyboard calibration multiplier and altitude curve. Left-button + wheel keeps normalised WheelEvent units; the right-button + wheel target-selector's 1/2/5/10 m step progression, ordinary zoom, pan, rotation and 10 m floor remain unchanged. No new UI controls.
- Files changed: `src/visualisations/fireworks-simulator/fireworks-simulator.ts`, new `camera-height-controls.ts` and `camera-height-controls.test.mjs`, plus `docs/current-handoff.md`, `docs/exec-plans/active/010-fireworks-simulator.md` and `docs/ux-accessibility-features.md`. No deletions, dataset or renderer changes.
- Validation: 56 focused Fireworks Node tests passed including before/after height scale ratios and finite caps; scoped Fireworks TypeScript compilation passed. Full Astro build and real mouse/keyboard feel testing not run. Next: verify holding Q/E and left-button + wheel at low and high altitude, then continue navigation calibration.

---

## 2026-10-10 Fireworks altitude-aware navigation calibration trial

- **Source:** supplied dirty `main` snapshot `17a011695370cdf5985fbb76be725ea9d284849f`, plus previously delivered Fireworks patches through the separate Move/Pan calibration controls. No commit, push or deployment.
- Existing MOVE (left mouse), PAN/ROTATE (right mouse) and KEYBOARD speeds now each have independent LOW (10 m) and HIGH (2,000 m) multipliers, range 0.25×–10×. A shared 0.4–3.0 curve-power slider interpolates all three using log-camera-height; higher power maintains low-altitude boost longer. Values are applied at the live SKYLINE pointer and keyboard handlers; PLAN uses the high-end values because it has no physical eye altitude. Mouse wheel and touch remain unchanged.
- The existing options disclosure shows an inline three-series SVG plot, live current-altitude markers, numerical effective multipliers and explanations. This plots the **calibration multiplier**, not physical metres per second. Version 3 local storage inherits v2/v1 speeds as HIGH and begins LOW at 1.6× HIGH (clamped), fully adjustable. The copyable `FW-NAV:v3` line includes six endpoints, curve power, altitude range, current effective multipliers and existing browser context.
- Updated `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,navigation-calibration.ts,navigation-calibration.test.mjs}`, this handoff, active Fireworks plan and UX inventory. No city data, renderer, rotation formula, mouse direction, 10 m camera floor or pointer-lock changes. No deletions.
- Validation: 53 focused Node tests, narrow Fireworks TypeScript check, and PostCSS parse passed. Full Astro build and real mouse/keyboard speed feel not tested. Next review: adjust low/high and curve in Map / View Options and send `FW-NAV:v3` calibration; verify feel at 10, 50, 150, 500 and 2,000 m before promoting defaults.

---

## 2026-10-10 Fireworks independent mouse calibration controls

- **Source:** supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f` with all previous Fireworks patches through the 10 m camera floor / reversed right-drag applied. No commit, push or deployment.
- Replaced the shared Mouse Drag slider with independent **MOVE · LEFT BUTTON** and **PAN · RIGHT BUTTON** sliders, keeping the separate KEYBOARD slider. Both mouse modes are independently scaled at the final SKYLINE and PLAN pointer-move branches; simultaneous left+right-button dragging uses both individual multipliers. Mouse and keyboard maximums increased from 4.00× to 10.00×; minimum remains 0.25×, step 0.05×. Existing direction mapping, physical pointer lock, 10 m camera floor, wheel zoom and touch are unchanged.
- Local calibration uses version 2 storage, with one-time read fallback from the previous version 1 `mouse` value to initialise *both* mouse sliders. Copy output is `FW-NAV:v2` and includes `mouse_move`, `mouse_pan`, `keyboard` and the existing environment context. Removed the requested explanatory paragraph below the copy button (and unused CSS rule).
- Files: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,navigation-calibration.ts,navigation-calibration.test.mjs}` and `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`; no deletions, city data, shader or renderer edits.
- Validation: focused Fireworks Node tests, narrowed TypeScript compilation and CSS parsing; full Astro build and physical mouse calibration still require local testing. Next: user adjusts three independent sliders and shares the copied `FW-NAV:v2` line.

---

## 2026-10-10 Fireworks right-drag direction trial and 10 m camera floor

- **Base:** latest available dirty `main` snapshot `17a011695370cdf5985fbb76be725ea9d284849f` with the prior 2026-10-10 navigation calibration/pointer-lock patch applied. No commit, push or deployment.
- Inverted **both mouse right-drag rotation axes** in SKYLINE and the applicable yaw axis in PLAN, including Ctrl+left and dual-button drags. Mouse right-drag now produces the same visible direction as corresponding arrow keys; WASD, keyboard arrows, left-drag pan, wheel travel, sensitivity multipliers and automatic landmark orbit are unchanged.
- Replaced the 0.25 m camera floor with **10 m** across free translation, direct height-wheel, height target, rotation, initial layout, and landmark flight/cinematic orbit. Manual map rotation now clips the orbit angle at the 10 m floor instead of switching to an in-place upward eye-tilt. This removes the old `groundPitchRad` state and its look-only rotation branch.
- Updated the in-page camera Method description and added projection-direction/10 m floor regression tests. Changes: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,camera-map-rotation.ts,camera-map-rotation.test.mjs}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. **Deletions:** none.
- **Validation:** 51 focused Fireworks Node tests passed; narrowed Fireworks TypeScript compile passed. Not run: full Astro build or physical Windows mouse/touch and camera QA. Local review: test right-drag both axes at multiple heights and at the 10 m floor, then tune the existing sensitivity sliders.

---

## 2026-10-10 Fireworks navigation calibration and unlimited mouse drag trial

- **Source:** dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f` with the delivered Fireworks patches through the unified manual map-rotation fix applied. No git commit/push/deploy.
- Added independent, persisted **Mouse Drag** (default 1.50×) and **Keyboard** (default 1.80×) multipliers in the existing Map / View Options panel, 0.25×–4.00× in 0.05 increments. They apply in the actual SKYLINE and PLAN handlers: mouse pan/rotation, keyboard WASD/arrow/Q-E/+− controls. Wheel zoom and touch gestures intentionally remain uncalibrated. Keyboard easing response increased slightly (20→28) to reduce perceived lag.
- Added a read-only, copyable `FW-NAV:v1` calibration line with the two multipliers, viewport/screen size, browser DPR, view mode, camera height and Pointer Lock API support. **Hardware mouse DPI is not accessible to browser JavaScript**; explicitly report `mouse_dpi=unknown` rather than infer it. Store speeds locally only, not in site files.
- Desktop mouse down in the camera viewport requests **Pointer Lock** so the camera can keep responding to movement after the pointer reaches a monitor/browser boundary. While locked, use PointerEvent `movementX/Y`; retain a clamped virtual pointer for ground-hit ray selection and custom cursor. Release on final mouse button up, blur, pagehide or Escape. Pointer capture remains the fallback when pointer lock is denied/unsupported. No lock for touch/pen or settings/UI elements. The automatic landmark orbit remains independent.
- Files: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,navigation-calibration.ts,navigation-calibration.test.mjs}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No data/renderer changes or deletions.
- Validation: 50 focused Node tests including multiplier range, cursor-edge fallback under pointer lock, and the copy line; scoped TypeScript compile and CSS structural check. Not run: full Astro build, physical multi-monitor mouse/OS pointer-lock browser testing. Ask for a screenshot or copied line after user tunes navigation; promote defaults only after field testing.

---

## 2026-10-10 Fireworks manual rotation and ground pan repair

- **Base:** Latest available supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f`, with previous Fireworks ZIP patches through 2026-10-10 pan sensitivity tuning applied. No commits, pushes or deployment.
- **Root cause:** Manual right-drag was orbiting `camera.target` (which can be a *floating 1.2 km direction-only point* after landmark inspection); at the floor it switched to a separate `groundLook` path. Near/far geometry around these inconsistent pivots could appear to reverse horizontal movement as altitude or zoom changed. This was independent of the left-drag pan scale.
- **Fix:** Single manual `rotateMap` path uses `manualMapPivot()` on the ground (short bounded reference when looking to the horizon) and `rotateManualMap()` to rotate the eye and look direction **together**. Manual right-drag, Ctrl+left-drag and keyboard arrows share the path, not the automatic cinematic landmark orbit. Floor contact preserves a smooth extra pitch/return state without switching yaw algorithms; world-up pitch remains capped before 90 degrees. Manual rotation is slower. Pointer gesture stores its map pivot until release; keyed rotation stores it while held. Selected building highlight and automatic-orbit preference are unchanged.
- **Pan:** The previous 60 m virtual-ground minimum and 0.05 m/input-pixel floor still made street-level scenery jump. `camera-pan.ts` now uses an 8 m minimum reference and 0.005 m/input-pixel lower bound, both height-continuous; existing response gain 0.45 and mouse factor 0.78 still apply at the actual handler. Pointer-ground anchoring is rejected if it points against the ordinary pan displacement. No speed slider.
- **Files:** `src/visualisations/fireworks-simulator/{fireworks-simulator.ts,camera-pan.ts,camera-pan.test.mjs,camera-map-rotation.ts,camera-map-rotation.test.mjs}`; `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No city JSON, geometry, WebGL, Astro route or design UI changed. Deletions: none.
- **Validation:** 45 focused Fireworks Node tests pass, including projection-level right-drag direction from 0.35 m through 2,400 m, changed zoom/range and target distance, ground pitch recovery and low-ground pan bounds. Fireworks-only `tsc --noEmit --target ES2022 --lib DOM,ES2022` passes. Not run: full Astro build or Windows pointer/GPU testing. Local visual review needed at street/50 m/300 m/2,000 m, after landmark selection and wheel zoom; all geometries around a true map pivot cannot translate in the same direction because rotation is circular.

---

## 2026-10-10 Fireworks screen-space pan sensitivity tuning

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the previously delivered screen-space pan ZIP overlaid. No commit, push or deployment.
- Local feedback: mouse/WASD movement remained too fast near ground and in elevated views. The previous 180 m virtual depth at pavement level and 2.4x cursor-anchor tolerance could exaggerate a short drag. Reduced the internal common mouse/touch/keyboard pan response to 45%, virtual and bounded-ground minimum depth to 60 m, minimum pan metres-per-pixel to 0.05 and maximum to 6; limited anchor-speed deviation to 1.35x before blending back to normal. No new slider or gestures.
- Changed only `src/visualisations/fireworks-simulator/{camera-pan.ts,camera-pan.test.mjs}` plus this handoff, the Fireworks plan and UX inventory. The scene controller, navigation direction mappings, landmark orbit, PLAN mode, zoom and data are unchanged; no deletions.
- Validation: 33 focused Fireworks tests pass, including new street-level, elevated and angle/anchor caps; scoped TypeScript compilation passes. Full Astro build and real-device feel require local review. Check mouse and WASD at 2, 50, 300 and 2,000 m, particularly after selecting a landmark and zooming.

---

## 2026-10-10 Fireworks projection-aware city pan trial

- Base: supplied dirty `main` snapshot `17a011695370cdf5985fbb76be725ea9d284849f` with approved Fireworks patches through shared side-tab bounds applied. No commit, push or deployment.
- Replaced SKYLINE pan's old `cameraDistance() * .00075` with a screen-space metre scale derived from the camera's **physical height**, screen projection and visible ground direction. It no longer changes merely because key-building focus adjusts `camera.target`. Mouse, touch, multi-touch movement and WASD share the model; keyboard retains existing acceleration and input directions.
- Pointer drags use actual ray/ground intersections when stable, with a bounded interpolated screen-space fallback for street-level, horizon and upward-looking views. Altitude stays unchanged during pan. PLAN, right-drag rotation, ordinary zoom, target-height wheel and landmark flight/orbit are not changed; no speed slider or new controls.
- Files: `src/visualisations/fireworks-simulator/{fireworks-simulator.ts,camera-pan.ts,camera-pan.test.mjs}`, this handoff, active Fireworks plan and UX inventory. No city data, GPU renderer or other projects changed; no deletions.
- Validation: 30 focused Fireworks Node tests passed, scoped TypeScript compilation passed. Full Astro build and local live mouse/keyboard/touch interaction have not run. Next: assess pan feel at 1 m, 50 m, 300 m and 2,000 m, especially close to horizon and after landmark selection + zoom; refine constants only if evidenced by user tests.

---

## 2026-10-10 Fireworks side tab vertical limit correction

- Base: supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f` with the reviewed shared-drawer patch applied. No commits, pushes or deployment.
- Fixed the shared side drawer clamp. The previous collapsed-state limit used the 60 px **tab height** even though the tab remained centred on the full-height hidden panel, letting the Fireworks and Key Buildings tabs disappear below the browser edge. Open and collapsed states now use the **drawer panel height**, keeping symmetric top/bottom limits with the tab at the panel midpoint.
- Both drawers recompute limits when the panel or viewport changes size. For very short browser windows, the limit uses the visible viewport height rather than relying solely on the simulator's 480 px minimum height.
- Changed `src/visualisations/fireworks-simulator/edge-drawer.ts`, added `edge-drawer.test.mjs`, and updated this handoff and active Fireworks plan. No changes to other drawer UI, camera, city data or renderer. No deletions.
- Validation: four boundary tests (top, bottom, same limits open/collapsed, resize) and scoped TypeScript compile. Full Astro build and browser mouse/touch drag QA not run; confirm visually at small and normal viewport heights.

---

## 2026-10-10 Fireworks landmark orbit, sorting and shared edge drawers

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`; layered the delivered 2026-10-09 blank-city-startup and expanded-Sydney-landmarks ZIPs onto that snapshot. No commits, pushes or deployments.
- Key-building selection in SKYLINE flies to the chosen building, then starts a slow automatic camera orbit around the landmark at about 0.065 rad/s (approximately 3.7 degrees/s). This is a deliberate cinematic *camera* orbit only during automatic inspection. The first direct viewport input (mouse/touch press, wheel or mapped keyboard navigation) cancels flight/orbit and changes the camera's rotation reference to a forward point at least 1,200 m away, maintaining the exact viewing bearing/pitch but removing close-up orbit scaling. Existing manual right-drag map rotation, movement and normal zoom paths remain intact; unrelated UI interactions do not stop the orbit. Reset and PLAN stop it; reduced motion disables the continuous orbit. An on/off switch under the key-building highlight in Map/View Options persists via localStorage.
- Key Buildings now sorts ABC or height (descending), with an independent TYPE on/off switch: on groups the current ICONS/TOWERS/HISTORY/CULTURE/SPORT categories, off sorts all names together. Each row displays height right-aligned in smaller grey text; unverified, estimated or fallback heights are prefixed `~`. These list modes do not alter the source dataset, label identities or selected building.
- Fireworks left drawer and Key Buildings right drawer now use one `setupEdgeDrawer()` module and matching 32×60 px tabs. Click/keyboard toggles; drag up/down with mouse, pen or touch repositions either edge tab, without accidentally toggling after a vertical drag. Collapsed contents stay inert. The current top position remains session-only. Both use the same CSS and reduced-motion transition handling.
- Included files: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,edge-drawer.ts,camera-landmark-orbit.ts,camera-landmark-orbit.test.mjs,landmark-list.ts,landmark-list.test.mjs}`, this handoff, the active Fireworks plan and the UX inventory. No public Sydney JSON, site navigation, data acquisition or WebGL renderer changes. No deletions.
- Focused validation: 17 Node tests passed (including camera direction preservation, orbit path, sorting and estimated height labels), scoped TypeScript compile and CSS parser passed. Full Astro build and physical mouse/touch browser QA were not run. Review automatic rotation comfort, release on mousewheel/key, narrow-screen drawer dragging and height-list sorting locally.

---

## 2026-10-09 Fireworks wider Sydney landmarks and persistent selection

- Base: dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, using the user-supplied 21:40 snapshot and restored missing height-helper export. No commit/push/deploy.
- Sydney landmark registry is now curated by icons/towers/history/culture/sport, with no numeric count cap. The current east-coast JSON yields **65** features: four icons (including a source-matched Crown Sydney), 31 towers, 17 historic places, 12 cultural places, and an SCG group derived only from seven named Overture stands. Only matched source footprints are shown; no artificial building geometry was added.
- The 27 landmarks with explicit Overture numeric heights or authored structure heights participate in height comparison. All silhouettes retain their full relative metre height; inactive figures fade but no longer shrink. The atlas spans the screen with buildings available to the right of the centre ruler and soft fades at each side. Features with fallback/floor-derived heights remain selectable on the map, but are withheld from height ranking.
- Clicking a label/list entry frames the selected landmark, opens the key-building drawer and scrolls its list to the entry. Selected gold styling persists through pan/zoom/reset/view switching; hover over another landmark remains independent. A separate keyboard-accessible X next to the selected map flag clears selection; its outlines fade by the existing GPU transition. SCG highlight expands to its source stand IDs.
- Changed Fireworks registry, controller, height helper, CSS and three focused tests; added `city-landmarks.test.mjs`. Updated this handoff, plan, UX inventory and Sydney source note. No city dataset, public API, camera controls or renderer buffers modified. No deletions.
- Validation: 14 focused tests, scoped TypeScript compile, CSS parser and source-backed 65-landmark audit. Not run: Astro build or full Windows/WebGL visual/gesture QA. Check Crown/SCG framing, scroll-to-selection, selected X and 100% height comparison.

---

## 2026-10-09 Fireworks clickable landmark labels and selection highlights

- Source: supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f`, plus successive reviewed Fireworks patches through the relative-height correction. No commit, push or deployment.
- Visible key-building flags are native buttons, reachable by click, Enter or Space, with pointer cursors and focus styles. Flags and the existing key-building drawer call the same `focusLandmark()` camera function.
- Hover highlights the label and its WebGL outline in pale yellow; selection uses a subdued darker gold and persists while other landmarks are hovered. Both colours transition smoothly; reduced-motion mode switches immediately. Selecting another landmark replaces the old selection. Manual scene pointer, wheel, keyboard, reset or view-mode interaction clears selection; the automatic focus-flight does not.
- Individual named Overture buildings and the three authored Harbour Bridge, Opera House and Sydney Tower models get tiny extra line buffers for hover/selected colour, reusing the existing depth-tested skyline pass. The large city meshes and source datasets stay untouched. Stable selections do not force continuous GPU redraws. In PLAN/Canvas fallback, the label/drawer state remains interactive, but selected edge colour is a SKYLINE WebGL enhancement.
- Changed the Fireworks Astro, controller, CSS, WebGL renderer, added a small landmark-highlight helper and test, and updated current handoff, active plan and UX inventory. No deletions, source acquisition or city regeneration.
- Validation: 10 focused Node tests, scoped Fireworks TypeScript compile and CSS parser check. Full Astro/browser interaction and GPU visuals remain for local review. Next: click a floating label, hover another, then pan to verify selection fades; repeat using the drawer, and inspect Opera House and Bridge depth behaviour.

---

## 2026-10-09 Fireworks inactive atlas height correction

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the latest weighted-scroll / morph patch applied. No commit, push or deployment.
- Corrected the landmark height-atlas rule so **inactive buildings shrink to 50% of their own scaled height**, not to a shared capped height based on the current active building. This preserves relative height differences across all inactive landmarks while keeping the active landmark at full scaled height.
- Touched `src/visualisations/fireworks-simulator/{fireworks-simulator.ts,height-comparison.ts,height-comparison.test.mjs}` and updated Fireworks handoff/plan/UX notes. No CSS, renderer, city data, routes or public URLs changed. No deletions.
- Validation: focused Node tests, including a new inactive-height proportionality check, plus narrowed Fireworks TypeScript compile. Not run: full Astro build or local end-to-end browser QA.

---

## 2026-10-09 Fireworks height atlas row morphing and weighted wheel trial

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the previously delivered 1 m height-target patch applied. No commit, push or deployment.
- Right mouse + wheel height selection now uses a **weighted streak**: the first 10 accepted wheel steps move 1 m each, the next 10 move 2 m each, the next 10 move 5 m each and later continuous steps move 10 m each. A pause of roughly half a second, cancelling selection or releasing the button resets the streak to 1 m steps. Wheel/trackpad accumulation threshold, target limits, release-to-travel and ordinary zoom remain unchanged.
- The height-atlas row no longer narrows inactive buildings. The active landmark remains at full scaled height; inactive neighbours morph down to about half the active landmark height while keeping their width and becoming more transparent. When the active building changes, the previous active shrinks down and the next grows up. The active outline still turns gold but does not thicken or widen.
- The atlas keeps more buildings visible to the right of the active landmark, with stronger fade-out towards the far right and softer fade on the far left. The row mask was widened to support this without overflowing the comparison lane.
- Changed `src/visualisations/fireworks-simulator/{fireworks-simulator.ts,fireworks-simulator.css,height-comparison.ts,height-comparison.test.mjs}` and Fireworks handoff/plan/UX notes. No city data, renderer geometry, Astro routes or public URLs changed. No deletions.
- Validation: five focused Node tests (step sizing, weighted streak thresholds, bounds, scale reset, active-index recovery) and a narrowed Fireworks-only TypeScript compile. Not run: full Astro build or live Windows wheel/trackpad feel. Next: local check that inactive landmarks keep width, re-grow correctly, and that sustained scrolling feels better than the 1 m flat behaviour.

---

## 2026-10-09 Fireworks target height: 1 m wheel increments trial

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, using the latest delivered 5 m height-target patch as the starting state. No commit, push or deployment.
- Changed right mouse + wheel height selection from **5 m to 1 m per accepted wheel step**. The initial eye-height snap uses the same shared 1 m constant. Existing wheel/trackpad accumulation threshold (65 normalised units), movement direction, one-step-per-event cap, target limits, release-to-travel, ordinary zoom and left-wheel height movement remain unchanged.
- Updated height-step regression tests and Fireworks plan/UX feature documentation. No CSS, city data, renderer or other camera-control changes. No deletions.
- Validation: focused Node height tests and TypeScript compile (see delivery report). Actual Windows wheel and high-resolution trackpad feel still require a local trial before settling the speed.

---

## 2026-10-09 Fireworks height target fine control and return-scale fix

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with all previously delivered Fireworks patches through the landmark height atlas applied. No commits, pushes or deployment.
- Right mouse + wheel now selects target altitude in exact **5 m steps**. Normalised wheel events accumulate small trackpad deltas and cap large spikes at one step per event; left-button height movement, plain wheel dolly and keyboard camera movement are untouched.
- The height ruler and comparison profiles now recalculate their upper scale from the **selected target** while comparing, rather than retaining the maximum altitude previously visited or using a much higher current camera elevation. Silhouettes grow back when descending from 5,000 m; outside comparison, the ruler still follows camera height.
- A numeric gold target-height badge follows the existing arrow/level cue. A non-interactive black viewport scrim dims the city and regular UI **only while** the height atlas is visible; the ruler, arrows, target badge and silhouettes remain above it. Transition respects reduced motion.
- Changed `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,height-comparison.ts,height-comparison.test.mjs}` and `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No city data, renderer, camera paths or public URLs changed. No deletions.
- Verified: focused TypeScript check, four Node regression tests (5 m step/direction, boundaries, scale down from max, landmark reactivation), CSS parser and isolated Chromium overlay layout at 1500 px / 390 px. Not run: full Astro build or actual right-click wheel in loaded Sydney scene. Next: local check at 100, 134, 309, 5000 and back to 100 m, including release-to-travel and PLAN.

---

## 2026-10-09 Fireworks target-height landmark comparison prototype

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the reviewed coastline, map/view, landmark-depth and adaptive-navigation patches layered in order. No commits, pushes or deployments.
- In SKYLINE, right mouse + wheel moves the existing height ruler towards the screen centre, places the up/level/down cue beside the marker, and reveals a left-side source-backed height atlas. The visual stays during eased camera travel and retracts when selection/travel ends. No other input or renderer behaviour changes.
- Height atlas derives profiles from `cityLandmarks()` once on city load, sorts by `heightM`, shows the active roof height with a gold fill/scan line at real ruler metres, and slides shorter/taller neighbours horizontally. At or above the tallest landmark all figures are neutral while the selected-height line continues upward. 2D silhouettes are explicitly schematic, not surveyed facade geometry; missing city landmarks remain absent. Default Sydney archived data has 19 matching key buildings.
- Touches only Fireworks Astro, TypeScript, CSS, new `height-comparison.ts`, this handoff, the Fireworks execution plan and UX feature log. No GPU changes, data exports or deletions.
- Validation: focused TypeScript compile, 19-source-landmark ordering/threshold tests, CSS parser and isolated desktop Chromium layout screenshot. Full Astro build, actual right-button/wheel input, mobile layout and full-scene visuals remain local review. Next: extract after the adaptive-navigation patch, run local server and test right+wheel at 0/65/134/309/5000 m, release to travel, reset and PLAN.

---

## 2026-10-09 Fireworks adaptive navigation guide and movement fade

- Base: user-supplied dirty `main` snapshot `17a011695370cdf5985fbb76be725ea9d284849f`, with the delivered Sydney coastline, map/view options and landmark navigation patches layered in order. No commit/push/deploy.
- During pointer, keyboard, touch, smoothed wheel or landmark camera travel, scene interface overlays (including map options, landmark drawer, controls and labels) fade to 23% opacity and recover after movement settles. The WebGL/Canvas scene, vertical height ruler and height-target cues stay at full opacity; underlying renderer/geometry is unchanged.
- A bottom-right, dual-card camera guide favours the last camera input: mouse/touch instructions expand after pointer use, keyboard instructions after navigation keys. Grid width morphing respects reduced motion, while mobile stacks active content above the compact alternative. The old centre-screen navigation hint becomes screen-reader-only, not a second visible guide.
- The guide defaults visible, can be hidden from its own native button or turned on/off via a native switch in Map / View Options. The two controls stay synchronised; visibility persists in `localStorage` when storage is available. Keyboard focus/form typing does not spuriously change the active device. PLAN-specific rows exclude unsupported SKYLINE height shortcuts.
- Changed files: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No datasets, WebGL renderer, city geometry or source acquisition changes; no deletions.
- Validation: focused TypeScript and static UI/CSS checks (see patch delivery). Full Astro build, real device gestures, responsive overlap and browser animations need local review. No data regeneration needed.

---

## 2026-10-09 Fireworks landmark navigation and shared skyline depth

- Base input: supplied dirty `main` snapshot `17a011695370cdf5985fbb76be725ea9d284849f`, with reviewed coastal-water-fix and map-view-controls patch sources layered. No repository commit/push/deploy.
- Root visual issue: Harbour Bridge and Opera House were drawn as a foreground Canvas overlay after WebGL buildings, so they appeared through foreground towers and near-camera shells produced moving horizon triangles. The skyline now renders authored bridge/Opera shell meshes into the existing WebGL depth buffer (Sydney Tower already used it), with proper GPU homogeneous near clipping. WebGL draws once only; Canvas keeps those authored forms for PLAN/fallback.
- Runtime-only source duplicate suppression hides Overture features directly overlapping authored Opera House schematic geometry and redundant Harbour Bridge pylons, preserving the original city JSON and provenance. Key building registry matches exact available Overture source names: 19 landmarks found in archived older Sydney bundle, including three authored structures and 16 named real footprints. Absent names are skipped.
- The SKYLINE WebGL city canvas is composited in front of the firework Canvas, so fireworks do not paint over city buildings. This is layer occlusion, not exact per-particle depth: land/roads are also in that upper city canvas. No second building Canvas render or GPU buffer duplication.
- Right-side collapsible key-building list uses source-backed names, clickable focus, fit based on landmark metres, and 12 camera angle candidates scored for obstruction by buildings. The closest clear sightline is chosen; user gestures and reset remain usable. On-screen name poles are decluttered, with the currently selected label taking priority.
- View-options disclosure arrow is now a centred SVG. New drawer controls use native buttons with focus and `inert` while collapsed; reduced motion disables camera travel and panel transitions.
- Changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,city-webgl.ts,city-landmarks.ts}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No browser city dataset replacement or deletion.
- Validation: focused TypeScript check, local city landmark discovery/overlap source audit; visual Skyline/PLAN, actual 44,489-building bundle performance, near-clipping/camera framing and Astro build require local browser review.
- Next: extract the patch only if these Fireworks files have not changed since map-view-controls patch; test Harbour/Opera views at horizon and very close, lower/raise camera, pan past a building while fireworks fire, select different key buildings and view from Skyline and PLAN; report screenshots and FPS.

---

## 2026-10-09 Fireworks map/view options for Sydney scene

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`; preceding coastal-water-fix documentation was used as the input so that reviewed coastline history is not lost. No commit, push or deployment.
- Added a native dropdown immediately below the SKYLINE / PLAN switch, with a highlight switch and four independent layer switches and transparency sliders (key buildings, buildings, roads, land/coastline). Off layers disable and dim their slider while retaining the prior transparency setting. A setting of 0% means default visible opacity, 100% means fully hidden.
- The three authored Sydney structures are key buildings: Harbour Bridge, Opera House and Sydney Tower. Highlight mode brightens their existing outline treatment and places small animated name flags at their projected roofs. Labels respect reduced motion and follow both camera modes. They are pointer-transparent.
- WebGL separates Sydney Tower triangles from sourced building triangles, so switching off buildings does not also remove the tower; no duplicate city draw pass is restored. Opacity applies to each GPU draw group without uploading new geometry. Canvas PLAN/fallback applies the same settings to cached city layers and authored geometry, and the existing firework Canvas is unaffected.
- Files changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,city-webgl.ts,fireworks-simulator.css}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No datasets, acquisition files or unrelated pages changed; no deletions.
- Validation: focused TypeScript compilation passes. Astro/browser rendering, actual FPS, visual/gesture review and mobile panel verification remain local follow-ups. The local browser scene data was not regenerated by this UI patch.
- Next: extract patch over the existing locally reviewed Fireworks files, run Astro locally, check layer visibility/transparency in SKYLINE and PLAN and confirm structure flags, then review appearance. Sydney acquisition/shoreline validation is a separate pending task.

---

## 2026-10-09 Fireworks coastline source correction pending local full-water test

- Source snapshot: dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`; preserve other staged changes. The active browser scene is still `inner-sydney`.
- Root cause: the downloaded east-coast Overture mainland polygon has no Harbour holes. The coastal geometry validator correctly rejected it; the user's new matching-extent Overture `water` cache has 3,305 records from pinned release `2026-09-23.1`.
- Focused code patch: the coastal processor subtracts mapped harbour/bay/inland water from Overture land, validates the Harbour/CBD, shoreline, mesh area and full water presence; the acquisition pipeline requires `water` alongside the four existing files, respects an explicitly pinned release, reuses checked cache metadata and leaves the previous public bundle intact on failure.
- Modified source: `scripts/data/fireworks-simulator/{acquire_sydney.py,sydney_coastal_land.py,test_acquire_sydney_resume.py,test_sydney_coastal_land.py,README.md}`, `data/sources/fireworks-simulator-sydney-city.md`; docs: `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md}`. No renderer/controls or public JSON changed, no deletions, no commit/push/deploy.
- Offline validation: 46 Python regressions passed; archived coastal source paired with the older inner-city water extract triangulated 10,368 land triangles after preparing 44,489 real buildings and 13,856 NSW roads with zero audit errors. New 3,305-feature water extract and browser/GPU not available in this snapshot, so final east-coast coverage remains unverified.
- Next on Windows, after applying patch: `py -u scripts/data/fireworks-simulator/acquire_sydney.py --extent east-coast --transport-source nsw-only --overture-release 2026-09-23.1`. Do not use `--fresh-download` or `--reuse-local`. Provide complete output; verify browser reads `east-coast` and inspect Pacific/Harbour before any more shader changes. Multi-city architecture remains deferred.

---

## 2026-10-09 Fireworks stationary/drag flicker and NSW-only east-coast route

- Base supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`; previous Fireworks source changes in the latest ZIP are kept. No commit, push or deployment.
- Latest screenshots show the WebGL city gaining doubled, brighter building outlines after movement ends. `drawFireworkOccluders()` was repainting nearer buildings in a delayed Canvas layer *above* the WebGL skyline. SKYLINE/WebGL now omits that extra city pass; Canvas-only fallback retains it. Trade-off: exact firework/building occlusion in WebGL remains unresolved.
- The browser still loads `inner-sydney` because east-coast acquisition is stuck in a recursive Overpass 504. User's `sydney.7z` includes an extent/release-valid cache: 45,055 Overture buildings, 1,103 building parts, 13,888 NSW road features at the wider east-coast bbox and Overture release `2026-09-23.1`. Offline NSW-only preparation of those raw files produced 44,489 usable buildings and 13,856 roads with zero audit errors; no coastal mesh was available to validate offline.
- Added explicit acquisition flag `--transport-source nsw-only` to bypass optional OSM lane/traffic enrichment while retaining NSW streets and coastline acquisition. Metadata marks partial enrichment, and validated city output remains atomic. Default `nsw-osm` behaviour and resumable tile cache are preserved.
- Files changed: `scripts/data/fireworks-simulator/{acquire_sydney.py,test_acquire_sydney_resume.py,test_prepare_sydney_city.py,README.md}`, `src/visualisations/fireworks-simulator/fireworks-simulator.ts`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No generated browser JSON, no local raw data, no deletions.
- Validation: 42 Python focused tests passed; focused TypeScript compile passed; the real cached east-coast NSW-only city-preparation smoke test passed. Full Astro/WebGL visual and live coastal Overture-land download not run in this environment.
- Next: apply ZIP, run `py -u scripts/data/fireworks-simulator/acquire_sydney.py --extent east-coast --transport-source nsw-only`, inspect success/error output, confirm generated JSON reports `east-coast`, then review skyline consistency and real coastline. Future Newcastle adapter should make city projection, source provider and authored landmarks configurable while retaining browser contract.

---

## 2026-10-09 Fireworks east-coast HTTP 504 and resumable acquisition

- Base snapshot: dirty `main` at full commit `17a011695370cdf5985fbb76be725ea9d284849f`, with the preceding Pacific-coast ZIP patch layered onto it. No commit, push or deployment performed.
- User's actual PowerShell acquisition output: Overture buildings 45,055, parts 1,103 and NSW RoadSegment 13,888 downloaded, followed by HTTP 504 at the full-area OpenStreetMap transport query. The old `inner-sydney` public bundle was correctly preserved. The previous download script deleted its incomplete temporary files, so a new run could not reuse the three successful downloads.
- Acquisition-only fix: `acquire_sydney.py` now caches each validated source file by extent, Overture release, data type and bounding box; keeps valid cached downloads after errors; processes the complete scene from those staged files; promotes raw source files only after geometry checks pass; and retains `--reuse-local` for *completed* same-bounds acquisitions only. New `--fresh-download` deliberately resets the staging cache.
- Transport fix: `acquire_sydney_transport.py` now requests the larger area in four sequential Overpass tiles, deduplicates features by OSM type/id, persists completed tile downloads and subdivides a tile into four smaller requests on HTTP 504 (bounded recursion). Transient 429/502/503 and connection failures are retried with delays.
- Changed only `scripts/data/fireworks-simulator/{acquire_sydney.py,acquire_sydney_transport.py,test_acquire_sydney_resume.py,README.md}`, `docs/current-handoff.md`, `docs/exec-plans/active/010-fireworks-simulator.md`. No deletions or generated browser JSON changes.
- Validation: 28 offline Python tests pass across acquisition resume, coastal land and existing Sydney preparation. No live Overpass/Ocean/NSW access or browser validation available here.
- Next: apply ZIP and run `py -u scripts/data/fireworks-simulator/acquire_sydney.py --extent east-coast`, without `--reuse-local`. Check for `Wrote real Sydney browser geometry` plus a new `sceneExtent` of `east-coast`, then review shoreline and FPS. Re-running after 504 should show `Reusing cached ...` messages.

---

## 2026-10-09 Fireworks Pacific coast acquisition and three-sided land fade

- Snapshot: dirty `main` at full base commit `17a011695370cdf5985fbb76be725ea9d284849f`, with previously approved Fireworks patch sequence layered over the source snapshot. No commit/push/deploy was performed.
- User's latest screenshot shows a visible artificial rectangular land edge. The supplied 26,606-building/10,304-NSW-road source files cover only the prior `inner-sydney` extract ending at `151.238°E`, short of the Pacific coastline.
- Added explicit `east-coast` source extent `[151.180, -33.903, 151.315, -33.829]` (WGS84). The one-command Sydney acquisition now downloads Overture building, building parts and coastline-derived land, NSW road segments and OSM transport for that same extent. A derived land step uses Overture `subtype=land`, `class=land` polygons; final east map limit is the actual eastmost sourced shoreline plus 300 m, while west/south/north stay at urban data bounds.
- The script refuses to replace the public JSON on missing/truncated land, failed harbour/CBD spot tests, failed triangulation or failed existing geometry audits. A matching manifest is required for east-coast `--reuse-local`, and any previous inner-Sydney browser JSON is backed up locally before replacement.
- The WebGL land layer now fades to zero opacity over 300 m only on the artificial west/south/north sides. The east coast remains a sourced shape against empty ocean; sourced roads/buildings keep their own geometry fade. Canvas fallback no longer fades the east via a rectangle.
- Changed: `scripts/data/fireworks-simulator/{acquire_sydney.py,prepare_sydney_city.py,sydney_coastal_land.py,test_sydney_coastal_land.py,README.md}`, `src/visualisations/fireworks-simulator/{city-webgl.ts,fireworks-simulator.ts}`, `data/sources/fireworks-simulator-sydney-city.md`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md}`. No files to delete. No raw GIS or regenerated public JSON in patch.
- Offline focused tests and TypeScript checks are recorded in the delivery; new coastal downloads and local GPU/FPS review remain pending. Next: apply patch, run `py scripts/data/fireworks-simulator/acquire_sydney.py --extent east-coast` on Windows with internet, inspect geometry and browser performance, then review.

---

## 2026-10-09 Fireworks land brightness and coastline continuity tune

- Base remains the supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f`, layered after the earlier Fireworks Sydney edge-fade iterations.
- User review of the new geometry fade showed two remaining issues: the land plane now reads too bright, and the coastline appears to stop short of the eastern edge because the land mesh was being faded like the buildings/roads.
- Renderer change only: the WebGL land fill is darker / less opaque, and the skyline edge fade no longer applies to the land mesh. Buildings and roads still fade over the final ~300 m of their sourced extent, but the coastline land remains continuous to the scene boundary so empty coast can still read correctly where there is no building data yet.
- Canvas fallback land fill was also darkened slightly to match the toned-down WebGL look more closely.
- Changed: `src/visualisations/fireworks-simulator/{city-webgl.ts,fireworks-simulator.ts}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md}`. No deletions and no data regeneration required.
- Validation completed here: focused TypeScript compile passes for the two modified Fireworks renderer files. Visual review is still required locally because no GPU-backed browser render is available in this environment.
- Next for local review: refresh FIREWORKS and inspect whether the empty eastern coastal land now reaches the coastline cleanly, while the urban edge still fades out softly without the land dominating the scene.

---

## 2026-10-09 Fireworks edge fade corrected to fade geometry, not draw bands

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, incorporating the preceding east-coast bounds / 300 m fade ZIP. Local screenshot showed a black rectangular band and square corners rather than a natural falloff.
- Root cause: four Canvas dark-gradient polygons were painted over a separately rendered WebGL city. Those polygons could not change the opacity of the buildings, roads or land underneath them, so they made visible dark strips.
- Fix: WebGL fragment shader now computes a smooth 300 m opacity falloff from local-metre XY, applied directly to all land, buildings, roads, street lines and transport points. The sourced city-feature bounds and extended east-coast land bounds are separate, so the city fades at the end of its *own* data while the land fades at the coastline layer's bounds. Discard fully faded fragments; no extra black geometry is drawn.
- PLAN/Canvas fallback and authored skyline overlays now remove their own pixels near the projected boundary using Canvas `destination-out` rather than painting black. The main fireworks animation is not erased. Camera controls, data processing and city JSON are unchanged.
- Files changed: `src/visualisations/fireworks-simulator/{city-webgl.ts,fireworks-simulator.ts}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No deletions or generated data files.
- Validation: focused strict TypeScript passes; a headless Chromium attempt could not initialise WebGL in this container. Check locally in SKYLINE and PLAN, especially at an oblique angle over the rectangular south/north/west edges and along the extended east side.

---

## 2026-10-09 Fireworks asymmetric land bounds, stronger land visibility and edge fade

- Base remains the supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f`, layered after the earlier Fireworks land/depth-field work.
- User review across multiple monitors showed three remaining issues: land still read too faintly, north/south/west land still extended beyond sourced city geometry, and buildings/roads ended too abruptly at the map edge.
- Data-side change: `acquire_sydney_coastline.py` now derives **content bounds** from the sourced buildings and roads, then uses those bounds for **west / south / north**, while preserving the existing **east** scene edge so the Pacific coastline can remain visible. The coastline pass also accepts the Overture Sydney harbour/ocean classifications actually present in the supplied export (`class=bay`, `class=water` with `subtype=water`, and `ocean`) and records the effective land bounds in profile metadata.
- Renderer-side change: land fill is brighter in both Canvas and WebGL, the skyline ground/depth field now aligns to the actual city bounds instead of re-expanding outward, and a new dark **~300 m inner edge fade** softens the map boundary so roads/buildings fade into black rather than stopping sharply.
- Changed: `scripts/data/fireworks-simulator/{acquire_sydney_coastline.py,test_acquire_sydney_coastline.py}`, `src/visualisations/fireworks-simulator/{city-webgl.ts,fireworks-simulator.ts}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md}`. No deletions and no generated browser JSON is included in the patch.
- Validation completed here: 12 Python regression tests pass, focused TypeScript compile passes for the two Fireworks renderer files, Python compile passes, and the supplied `/mnt/data/overture-water.geojson` validates successfully against the current Sydney bundle, producing bounds `minX -2769.4`, `maxX 3158.2`, `minY -5433.7`, `maxY 2864.9`, `84` accepted harbour/ocean features and `24,573` land triangles.
- Next for local review: apply the patch, rerun `py scripts/data/fireworks-simulator/acquire_sydney_coastline.py --reuse-local`, then inspect the east coast, the clipped south/west/north edges, and whether the new edge fade feels subtle enough or should be weakened/removed.

---

## 2026-10-09 Fireworks OSM coastline empty-result correction

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f` with prior Fireworks patches applied for review. User ran `acquire_sydney_coastline.py`; the Overpass JSON was downloaded but contained `"elements": []`. Thus no source coastline was returned and the browser city was correctly preserved. The issue is not a coordinate or clipping exception.
- Switch the local-only land acquisition to Overture **base/water**, `subtype=ocean` polygon geometry, which Overture derives from quality-checked OSM coastlines. Derive land by subtracting the ocean from the existing city frame, triangulate with Shapely 2.1+ constrained Delaunay to keep islands/holes, and preserve the original black-water rendering and city data until validation succeeds. No renderer files or public data are changed in this ZIP.
- Changed: `scripts/data/fireworks-simulator/{acquire_sydney_coastline.py,test_acquire_sydney_coastline.py,README.md}`, `data/sources/fireworks-simulator-sydney-city.md`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md}`. No deletions. New source/cache filenames: `overture-water.geojson` and `overture-water-meta.json` under ignored local `data/raw/`; the empty `osm-coastline.json` must not be used by `--reuse-local`.
- Offline validation: tests cover coastal divide, island/holes, adjoining ocean tiles, other water subtypes, absent features, safe bundle update, and bbox padding. Live Overture download, local renderer/FPS and real harbour coastline visual quality remain untested here. Previous expanded building acquisition's Overture release remains unverified.
- Next: apply patch, `py -m pip install --upgrade "shapely>=2.1" overturemaps pyproj`, then `py scripts/data/fireworks-simulator/acquire_sydney_coastline.py` without `--reuse-local`. Review the derived land/harbour edge and FPS before publication.

---

## 2026-10-09 Fireworks real coastline and land-only ground layer

- Base is the supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, after the previous five-polygon harbour and bridge review patch. No git commit, deployment, or local network acquisition was performed here.
- Latest instruction supersedes the hand-authored water masks: the viewer now renders **only sourced land** above an otherwise empty black water/background layer. GPU SKYLINE draws land triangles into the existing depth buffer before roads/buildings; PLAN/Canvas fallback fills those same triangles. The ground grid is suppressed once real land data is present. Existing `water.polygons` is ignored by the renderer.
- Added a manual `acquire_sydney_coastline.py` acquisition/processing step that queries OSM coastline, projects it to the existing local-metre CRS, creates validated land polygons with islands and holes, tessellates them for camera near-plane handling, and atomically adds the `land` mesh to the user's existing `sydney-city.json`. The underlying city has not been regenerated or replaced by a snapshot; no fabricated shoreline vertices ship in the patch. Raw response, acquisition metadata and backup stay in ignored local `data/raw/`.
- `prepare_sydney_city.py` now produces no invented water polygons; after any future full city rebuild, rerun the coastline pass for the matching extent. Provenance/UX/readme/plan record the new OSM ODbL source.
- Changed: `scripts/data/fireworks-simulator/{acquire_sydney_coastline.py,test_acquire_sydney_coastline.py,prepare_sydney_city.py,README.md}`, `src/visualisations/fireworks-simulator/{city-webgl.ts,fireworks-simulator.ts}`, `data/sources/fireworks-simulator-sydney-city.md`, `docs/{exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md,current-handoff.md}`. No deletions, no bundled browser city JSON.
- Tests: 20 local Python regression tests pass, including multi-way shoreline joining, strict focused TypeScript compile passes. Acquisition from live OSM, final geographic shoreline verification, and full Astro/browser/GPU performance tests are not available in this environment.
- Next: apply root-ready ZIP and run `py scripts/data/fireworks-simulator/acquire_sydney_coastline.py`, then refresh locally and inspect islands, shoreline, near-bridge alignment and FPS. Check source attribution and older unverified Overture release before publication.

---

## 2026-10-09 Fireworks Sydney harbour mask and bridge alignment correction

- Base remains supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, now using the user's expanded `inner-sydney` browser bundle for local review. After the land/harbour shading pass, review showed the remaining issue was not fill styling alone: the city still had only one stylised harbour polygon, so several obvious water basins read as land, and the authored Sydney Harbour Bridge no longer aligned with the sourced Bradfield Highway corridor.
- Updated the authored Sydney hydro mask from one coarse wedge to five separate harbour polygons covering the main harbour basin plus key western/eastern bays used by the current view. These remain clearly labelled original project geometry, not licensed hydrography.
- Re-anchored the authored Sydney Harbour Bridge structure to the current road geometry: moved the bridge from the old `(0, 0)` calibration origin to `(175, 356)`, rotated it from `-7` degrees to `-25.3` degrees, and relabelled its source class as official dimensions plus road-alignment calibration. This is intended to bring the bridge arch and deck closer to the live Bradfield Highway corridor in the expanded scene.
- Updated files: `scripts/data/fireworks-simulator/prepare_sydney_city.py`, `public/data/fireworks-simulator/sydney-city.json`, `docs/current-handoff.md`, `docs/exec-plans/active/010-fireworks-simulator.md`. No deletions.
- Validation: logic review completed; local browser review is still required to judge harbour silhouette quality and whether the bridge now feels correctly placed and scaled from multiple camera angles.
- Next: if the user still finds the harbour silhouette too approximate, the proper follow-up is to acquire or author a more explicit land/water polygon dataset for Sydney rather than continue stretching the single-scene heuristic.

---

## 2026-10-09 Fireworks Sydney land and harbour visual separation

- Base remains supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the reviewed Fireworks ZIPs layered on top and the user's local `inner-sydney` JSON now present for browser review. The next visual cleanup is the ground plane: land currently reads as the black page background because only harbour polygons are filled.
- SKYLINE and PLAN now draw a projected land plane first using a light-grey fill, then paint harbour polygons back over it as near-black cut-outs with a subtle shoreline stroke. Roads, buildings, transport points and landmarks continue to render above those base fills. The existing wireframe aesthetic, city counts and data files are unchanged.
- Files changed: `src/visualisations/fireworks-simulator/fireworks-simulator.ts`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/current-handoff.md`. No deletions, no data regeneration.
- Validation: focused TypeScript compilation still required in this environment after the renderer edit; local browser review should confirm that Sydney Harbour now reads clearly against the land mass from both skyline and plan views.
- Next: user reviews the land/harbour separation locally, then decide whether coast edges, water masks and island outlines need a more accurate polygon treatment for the expanded Sydney extent.

---

## 2026-10-09 Fireworks wider-Sydney GIS topology correction

- Base remains supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with reviewed Fireworks ZIPs layered on top. User's `--extent inner-sydney` download received 26,606 Overture buildings, 949 parts, 10,304 NSW roads and 36,968 OSM elements, but GEOS stopped preprocessing with `TopologyException: side location conflict` and the existing 4,690-building CBD browser JSON was preserved.
- Remove the single city-wide road-buffer `unary_union`; index each road buffer using `STRtree` and perform local overlay per building. Repair invalid polygons for *auditing only*; retain actual Overture coordinates. Flag individual unrecoverable overlays for review/renderer exclusion and reject exports with widespread audit failures. Add `--reuse-local` so the four already-downloaded raw files can be reprocessed without redownloading; future downloads retain source release/date/bounds in an ignored local manifest. The first download has no such manifest and its exact release remains unverified.
- Files changed: `scripts/data/fireworks-simulator/{acquire_sydney.py,prepare_sydney_city.py,test_prepare_sydney_city.py,README.md}`, `data/sources/fireworks-simulator-sydney-city.md`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/current-handoff.md`. No deletions, no changes to `public/data/` or renderer.
- Validation: 15 offline unit tests pass, including malformed geometry and reprocessing without network; Python compile checks pass; synthetic 4,000-building/2,000-road audit completed in about 0.6 s with no errors. Real wide-city export is still untested here because raw data lives on the user's Windows machine.
- Next: apply ZIP, run `py scripts/data/fireworks-simulator/acquire_sydney.py --extent inner-sydney --reuse-local`, review generated feature counts/errors/size and FPS. Verify Overture release provenance before publishing or committing generated data.

---

## 2026-10-08 optional wider inner-Sydney Fireworks data extent

- Base remains supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f` with previous Fireworks reviewed ZIPs layered on top. The **current** `public/data/fireworks-simulator/sydney-city.json` remains the corrected 4690-building CBD scene; no unavailable source features have been invented or appended.
- Opt-in `py scripts/data/fireworks-simulator/acquire_sydney.py --extent inner-sydney` now requests `[151.180,-33.903,151.238,-33.829]` to cover North Sydney and further west, south and east. `--extent cbd` remains the default. The exact chosen bounds flow through Overture buildings, building parts, NSW RoadSegment, OSM enrichment, local-metre clipping and metadata. Refreshed transport reads the scene's existing bounds, not the old CBD constant.
- Expanded output is accepted only after network acquisitions succeed, existing count quality gates pass and real additional building coverage is present beyond **all four** old CBD edges. The existing CBD file is locally backed up to ignored raw storage before expanded replacement. SKYLINE ground grid follows the larger bounds; default camera and existing renderer modes stay as-is.
- Source and caveat: Overture/NSW/OSM cannot be downloaded in this ZIP-generation environment. The larger JSON, loading time and FPS are **not validated** here. Water/harbour geometry is still procedural and smaller than the new bounds. Streaming/LOD is deferred until measured local performance warrants it.
- Changed files: `scripts/data/fireworks-simulator/{acquire_sydney.py,acquire_sydney_transport.py,prepare_sydney_city.py,test_prepare_sydney_city.py,README.md}`, `src/visualisations/fireworks-simulator/fireworks-simulator.ts`, `data/sources/fireworks-simulator-sydney-city.md`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`. No deletions. Next: user applies ZIP, runs expanded acquisition on the connected Windows machine, and reviews coverage/performance before wider scaling.

---

## 2026-10-08 Sydney Tower overlap and depth correction

- Base: `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, supplied dirty snapshot with the previous Fireworks camera/UI review ZIPs applied in order.
- The Overture Sydney export duplicated the authored 309 m Centrepoint tower. Two Overture building parts sit around 8 m from the source-backed tower anchor. One has an exported top of 510 m (`min_height` 240 m plus `height` 270 m). The 38.4 m `Westfield Sydney` part below the tower is separate and must remain.
- The local-metre preprocessing pipeline now audits authored `observation-tower` landmarks for tall Overture polygons with centroids within 20 m and roof height at least 55% of the authored tower. It excludes only those overlapping tall parts, records their source IDs in the profile, and leaves retail podiums and other buildings untouched. The existing checked-in bundle is corrected using the same function (`--repair-existing`), without regenerating or replacing the sourced street/building inputs. `buildingCount` becomes 4690 from 4692. This rule is intentionally narrow to avoid suppressing other city features.
- SKYLINE renders the procedural tower's shaft, 16-sided observation deck and spire in the **same WebGL depth buffer as Overture buildings**, rather than compositing it unconditionally over the city Canvas. PLAN and non-WebGL fallback retain the original Canvas model. Bridge/Opera House still render in the Canvas overlay and have not been given true WebGL occlusion as part of this focused fix.
- Source height parsing for ordinary Overture parts remains unchanged. The invalid 510 m tower part is removed from this prototype export, not silently clamped or rewritten. The existing tower calibration remains 309 m at the published anchor; the two geometry-centroid offsets alone do not establish an incorrect landmark anchor.
- Validation: data audit tests cover spatial/height thresholds, the preserved Westfield podium, distant tower retention, idempotence, and checked-in bundle counts. Strict TypeScript compilation passed. Full Astro build blocked because the provided snapshot has no `node_modules`/Astro executable; physical GPU/browser review is still required.
- Changed paths: `scripts/data/fireworks-simulator/prepare_sydney_city.py`, `scripts/data/fireworks-simulator/test_prepare_sydney_city.py`, `scripts/data/fireworks-simulator/README.md`, `public/data/fireworks-simulator/sydney-city.json`, `src/visualisations/fireworks-simulator/city-webgl.ts`, `src/visualisations/fireworks-simulator/fireworks-simulator.ts`, `data/sources/fireworks-simulator-sydney-city.md`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/ux-accessibility-features.md`, and `docs/current-handoff.md`.
- Next review: rotate around Centrepoint from skyline and overhead, confirm one deck/shaft and no floating double-spire, verify Westfield remains and nearby buildings occlude the observation tower correctly in WebGL. Also confirm PLAN and WebGL-unavailable fallback remain intact.

## 2026-10-08 Fireworks live height-marker tracking and lighter cursor

- Base: supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f`, with the reviewed camera, height-ghost and controller patches present. No Sydney geometry, firework settings, WebGL renderer or camera sensitivity changes.
- The SKYLINE height-scale node now follows changes in the actual camera eye continuously during right-drag and dual-button drag. Both normal and ghost/target markers use short, compositor-friendly 90 ms `transform` transitions instead of updating/transitioning CSS `top`. Marker travel remains visible while the mouse buttons are still held and continues through deferred right-wheel height movement. The scale track's pixel height is cached and refreshed on viewport resize. Reduced-motion mode still disables marker transitions.
- The custom scene crosshair now updates directly by `translate3d()` with no positional tween or per-pointer-event `getBoundingClientRect()` layout measurement. Its fade duration is reduced from 115 ms to 65 ms. Native cursors over form controls and the existing movement-triggered transparency remain unchanged.
- Files changed: `src/visualisations/fireworks-simulator/{fireworks-simulator.ts,fireworks-simulator.css}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. Files to delete: none.
- Validation: strict TypeScript compilation passed. Chromium runtime with the compiled Fireworks controller passed: right-drag and dual-drag marker position changes before button release, compositor cursor positioning, right-wheel target/ghost separation and settling, and responsive height-track recalculation. Full Astro build and physical high-DPI mouse QA not run.
- Next: local review on the actual mouse/monitor for height-marker travel and cursor responsiveness while the full city is loaded.

---

## 2026-10-08 Fireworks camera-mode UI, ghost-height selection and retractable controller

- Base: `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, from the supplied dirty working snapshot with both reviewed 2026-10-08 height/camera patches included. No city geometry, dataset or WebGL renderer changes.
- While camera input, keyboard navigation or eased height/forward movement is active, the firework settings form fades to about 3.5% opacity and quickly returns after the movement stops. The drawer handle stays available. Stage pointer feedback uses a small in-page crosshair so it can fade fully transparent during movement; native cursors cannot animate opacity. Controls outside the scene use normal OS cursors.
- Fireworks title starts at the existing large size for every fresh page load. After five seconds or the first camera gesture it animates into a compact white heading directly under `LAB / SYDNEY SCENE PROTOTYPE`, leaving the effect name beneath.
- Right-button height selection now shows a neutral ghost node at the actual camera position and a gold target marker. Gold marker diameter scales continuously from 1x at the ghost to 3x at 150 m separation, shrinking when it crosses the ghost and growing again farther away. After release the ghost follows the existing camera easing toward the fixed gold target; the gold marker contracts and clears when they meet. The arrow/level cue remains during active selection. Reduced-motion users retain immediate height application.
- Right-button gestures now use tracked pointer-button state as a fallback for wheel events that report `buttons=0`. Context menus are suppressed in capture phase across the Fireworks page, including form fields, while it is mounted; other portfolio routes are unchanged. Firefox's Shift + right-click system bypass remains browser-controlled.
- The controller slides off the left viewport edge with a 36 px tab. A native button toggles it by click or keyboard, and horizontal pulling is supported. Its form is `inert` while collapsed. Responsive layout, reduced-motion transitions and previously accepted camera gestures are retained.
- Files changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.css,fireworks-simulator.ts}`; `docs/{exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md,current-handoff.md}`. Files to delete: none.
- Validation: strict standalone TypeScript passed; PostCSS parsed successfully; headless Chromium desktop (1792x860) and mobile (390x844) layout passed. A real compiled-script Chromium harness passed right-button wheel selection even when the native wheel `buttons` field was zero, ghost follow-and-settle, gold marker growth/contraction, drawer click/open and inert state, and form context-menu suppression. Full Astro build and hardware-mouse QA remain unrun because Astro dependencies are absent from the supplied context archive.
- Next local review: check the 3x growth distance, 36 px drawer tab, title animation and controller fading on the user's real mouse and monitor.

---

## 2026-10-08 Fireworks height cue, ground bounce and overhead camera fix

- Base: `main`, commit `17a011695370cdf5985fbb76be725ea9d284849f`, from the supplied dirty context snapshot plus the preceding mouse-height patch. No city data or public assets changed.
- Right-button + wheel now enlarges the gold height-selection node to 3x while selecting, reducing it to the normal diameter on release. A small pointer-through three-state cue alongside the scale indicates above, aligned or below current camera height; the relevant arrow turns gold and grows more opaque with distance. The middle line turns gold when within 3 m. Cue is hidden after selection or in PLAN; reduced-motion users see state changes without UI morph transitions. The selected target still animates the camera to height on release, except under reduced motion.
- Right-drag, Ctrl+left drag, combined left+right drag and keyboard arrow tilt use a ground-aware pivot orbit. At 0.25 m eye clearance, further downward tilt keeps the eye grounded and rotates the view upward. Reversing tilt first returns the view to its pre-contact direction then resumes orbiting. Ground state survives horizontal pan and yaw, resets on vertical translation and view reset. Orbit radii that cannot reach the floor avoid false bouncing.
- Removed the near-vertical discontinuity in both the Canvas and WebGL camera basis. Previously switching from world-up Z to Y when forward approached vertical caused the near-overhead scene flip. Both use one world-up axis and retain the safe 89-degree maximum view elevation.
- Changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.css,fireworks-simulator.ts,city-webgl.ts}`, `docs/{current-handoff.md,ux-accessibility-features.md,exec-plans/active/010-fireworks-simulator.md}`. Files to delete: none.
- Validation: strict TypeScript passed. Focused runtime harness passed orbit-down, floor contact, upward look continuation, grounded yaw, reverse-to-orbit and near-overhead basis continuity. Full Astro build and physical mouse/browser QA not run in this snapshot environment (no installed Astro dependencies). Next: review right-wheel cue feel, ground pivot return and overhead rotation on a real mouse.

---

## 2026-10-08 Fireworks mouse-only combined drag and wheel-height controls

- Base remains `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, using the supplied dirty Fireworks snapshot as the current reviewed working tree. Sydney building/street data and WebGL geometry are unchanged.
- Holding both mouse buttons while dragging now combines the existing left-drag pan and right-drag map-pivot rotation. It no longer controls height. PLAN receives the equivalent pan + horizontal rotation combination.
- SKYLINE wheel routing is now button-specific: wheel alone keeps pointer-centred forward/back travel; left button + wheel changes camera height directly; right button + wheel moves a deferred height target without moving the scene. A wheel while both buttons are held is ignored so the dual-button chord remains a drag-only combination.
- The existing right-side vertical scale now includes a persistent camera-height node. It is silver/grey during ordinary movement and gold while right-button height targeting or settling is active. The scale begins at 0-600 m and expands upward in 100 m increments when required. PLAN hides the height node and retains its 2 km scale label.
- Releasing the right button after wheel targeting smoothly translates eye and target together to the selected eye height. Direct camera input cancels the transition. `prefers-reduced-motion` applies the selected height immediately instead of easing. The 0.25 m eye floor remains.
- Keyboard mappings remain WASD pan, arrows rotate/tilt, Q/E height, +/- forward/back, R/Home reset. Touch controls are unchanged.
- Files changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.css,fireworks-simulator.ts}`, `src/content/projects/fireworks-simulator.md`, `docs/ux-accessibility-features.md`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/current-handoff.md`. No deletions.
- Validation: strict standalone TypeScript passes for the Fireworks renderer and WebGL module. Focused source assertions pass for dual-button pan+rotate, left-wheel direct height, right-wheel deferred height targeting/release, plain-wheel dolly, reduced-motion height application and height-node markup/styles. `npm run build` was attempted but cannot run in the supplied snapshot because the Astro executable is not installed (`astro: not found`). Local physical-mouse review remains required for wheel-button feel, target-node sensitivity and dual-button composition.

---

## 2026-10-08 Fireworks keyboard gesture-group remap

- Base remains `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks patches through the keyboard-direction regression fix layered on top. This patch changes keyboard routing/speed only; mouse, touch, wheel, WebGL city rendering and Sydney data are unchanged.
- `W/A/S/D` now exclusively mirror left-drag pan with inverse drag directions: W = drag down, S = drag up, A = drag right, D = drag left.
- Arrow keys now exclusively mirror right-drag map-pivot rotation/tilt with inverse drag directions: Up = right-drag down, Down = right-drag up, Left = right-drag right, Right = right-drag left. Arrow Up/Down therefore add continuous keyboard vertical tilt that was missing.
- `Q/E` now invoke the two directions of the chorded map-height control rather than rotation. `+/-` remain forward/in and backward/out, matching the mouse-wheel action family.
- Keyboard target speeds increase to 760 px-equivalent/s pan, 560 px-equivalent/s rotation and 460 px-equivalent/s height in normal mode, with faster Shift targets; centre-ray travel scales at 0.78× camera distance/s before clamping. Frame-time easing remains.
- Files changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts}`, `docs/ux-accessibility-features.md`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/current-handoff.md`. No deletions.
- Validation: strict standalone TypeScript passes. Focused source checks confirm WASD, arrows, Q/E and +/- route to separate gesture families and preserve inverse drag semantics where requested. Full Astro/browser QA remains local review in this supplied snapshot environment.

---

## 2026-10-08 Fireworks keyboard direction regression fix

- Corrected a regression from the input-speed tuning pass. Keyboard pan must not reuse raw mouse-drag directions because the two inputs describe different things: pointer drag grabs the map, while W/A/S/D and arrows describe the direction the viewport should move.
- `W/Up` now matches the viewport result of dragging the mouse down; `S/Down` matches dragging up; `A/Left` matches dragging right; `D/Right` matches dragging left.
- Existing tuned keyboard speeds remain unchanged. Q/E map-pivot rotation, +/- forward/back movement, mouse gestures, touch gestures, wheel movement and WebGL rendering are unchanged.
- Validation: strict standalone TypeScript passes. Focused direction assertions confirm the four keyboard directions now invert the corresponding mouse-drag deltas.

# Current Handoff

## 2026-10-08 Fireworks input-speed calibration

- Base remains `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks patches through the map-pivot rotation correction layered on top. No Sydney geometry, street data, WebGL buffers or wheel behaviour change in this patch.
- User review accepts the current gesture model but found the rates mismatched. Mouse pan is now 22% slower than the previous pass, right/Ctrl-left map rotation uses reduced yaw and pitch sensitivity, and the dual-button height gesture is 25% slower. Touch pan keeps its previous direct scale.
- Keyboard controls are recalibrated upward instead of slowing mouse to the old keyboard rate. `W/A/S/D` and arrows use the same mouse-pan scale but intentionally invert raw pointer-drag direction so keyboard labels match viewport movement: W/Up matches dragging down, A/Left matches dragging right, and the opposite keys mirror those pairs. `Q/E` drive the same map-pivot rotation model as right drag rather than the older fixed-eye yaw path. Shift remains the faster keyboard modifier.
- Keyboard `+/-` keeps centre-ray forward/back movement but now scales its speed with camera distance so it better matches the accepted wheel behaviour. Mouse wheel and pointer-centred wheel-ray logic are unchanged. Frame-time easing remains in place, with a slightly faster response so held keys reach the new speeds smoothly rather than stepping.
- Files changed: `src/visualisations/fireworks-simulator/fireworks-simulator.ts`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`. No deletions are required.
- Validation: strict standalone TypeScript passes for the main renderer and WebGL module. Focused input checks confirm the new sensitivity constants, intentionally inverted keyboard-versus-pointer pan directions, Q/E routing through map-pivot rotation, and byte-level wheel movement formulas remain unchanged. At a representative 1,000 m camera distance, normal keyboard pan rises from 300 to about 406 effective pointer-equivalent px/s after the mouse-pan factor, rotation rises from about 44.7 to 68.8 degrees/s, and centre-ray travel rises from 420 to 550 m/s. Full Astro/browser QA remains local review because the supplied snapshot has no installed Astro dependencies.
- Next review: compare ordinary/high-DPI mouse pan and rotation against held keyboard movement at the same camera distance. Wheel travel should feel exactly as before.

---

## 2026-10-08 Fireworks map-pivot rotation correction

- Base remains `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks patches through the map-follow mouse experiment layered on top. No Sydney data, street data or WebGL city geometry changes are included.
- User review clarified the intended right-drag mental model: it should feel like grabbing and tilting the map/model, not like turning the viewer's head. The previous fixed-eye counter-rotation still felt like first-person camera movement.
- Right mouse drag and `Ctrl` + left drag now orbit around the **fixed current map pivot**. Dragging down reduces viewing elevation so the world stands more upright/parallel to the monitor; dragging up raises the viewpoint around the pivot so the world flattens toward a top-down presentation. Horizontal dragging turns the map in the drag direction.
- Orbit radius is preserved. The lowest permitted orbit angle is calculated from the current pivot, radius and 0.25 m eye clearance instead of using an arbitrary fixed pitch limit, so near-ground inspection remains possible.
- Plain left pan, both-button height adjustment, Shift + left movement, pointer-centred wheel movement, touch controls, keyboard navigation and WebGL city rendering are unchanged.
- Files changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts}`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`. No deletions are required.
- Validation: strict TypeScript compilation passes. Focused math checks verify that drag-down decreases orbit elevation, drag-up increases it, horizontal drag follows the map direction, orbit distance remains constant, and the derived minimum orbit elevation keeps the physical eye at or above 0.25 m. Full Astro/browser QA remains local review.
- Next review: test vertical right drag over a wide skyline and a near-ground view. The expected feel is `drag down = stand Sydney up`, `drag up = lay Sydney flatter`.

---

## 2026-10-08 Fireworks map-follow mouse experiment

- Base remains `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with approved Fireworks patches through the pointer-anchored camera correction layered on top. Preserve the user-generated real `public/data/fireworks-simulator/sydney-city.json`; this patch does not replace city data or WebGL buffers.
- User review distinguishes the desired interaction feel from the internal camera transform: plain left drag already feels correct because the rendered map follows the pointer. This experiment applies that same **map-follow** feel to rotation and height while keeping the current wheel movement unchanged.
- Right mouse drag now counter-rotates the view so Sydney follows the pointer on both axes. `Ctrl` + left drag uses the same rotation path. This keeps the camera eye fixed during rotation but reverses the former first-person-look direction.
- Holding both mouse buttons and dragging vertically now translates eye and target together, opposite the camera movement needed to make the rendered city follow the pointer. View angle is preserved, and the existing 0.25 m camera-eye ground clearance still prevents movement through the ground.
- `Shift` + left drag is added as a pointer-anchored forward/back shortcut using the same screen ray and queued physical movement as the existing mouse wheel. Drag up moves toward the point under the pointer; drag down moves away. Mouse-wheel behaviour itself is unchanged.
- Modifier/chorded pointer gestures suppress tap-to-launch. PLAN receives matching `Ctrl` + left rotation and `Shift` + left orthographic zoom, while the two-button height gesture remains SKYLINE-only. Touch controls and keyboard controls are otherwise unchanged.
- Files changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts}`, `src/content/projects/fireworks-simulator.md`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`. No deletions are required.
- Validation: strict standalone TypeScript passes for the main renderer and WebGL module. Focused assertions verify right-drag/Ctrl+left routing, Shift+left routing, modifier gestures suppress tap-to-launch, positive pointer deltas move the previous map centre in the same screen direction after rotation, chorded height translates eye and target together, the 0.25 m ground clamp remains present, and the mouse-wheel handler is byte-for-byte unchanged from the accepted pointer-camera patch. `npm run build` was attempted but cannot run in this snapshot because the Astro executable is not installed (`astro: not found`). This remains an explicit review experiment and can be reverted if the map-follow rotation/height feel is worse in local use.
- Next review: compare right drag with `Ctrl` + left drag, compare two-button vertical movement with plain left pan, and test `Shift` + left drag against the unchanged mouse-wheel movement. If accepted, return to city/skyline fidelity rather than adding more camera modes.

---

## 2026-10-08 Fireworks pointer-anchored camera correction

- Base remains `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks patches through the WebGL performance correction layered on top. Preserve the user-generated real `public/data/fireworks-simulator/sydney-city.json`; this patch does not replace any city data.
- Local user review confirms the GPU architecture is working as intended: the real 4,692-building / 2,737-street scene reports `WEBGL CITY + CANVAS FX` at 60 FPS. No city geometry or WebGL performance code is changed in this correction.
- The apparent high minimum altitude came from the remaining fixed eye/target orbit model. The look target was forced above `z = 0`, so forward movement could stop when the target reached the floor even though the physical camera eye was still high. Ground collision now applies to the eye only, with the existing 0.25 m clearance. The look target may pass below ground when the user looks down.
- Right mouse drag is now free-look yaw/pitch: it changes where the camera faces without moving the camera eye around a hidden pivot sphere. `Q/E` and two-finger twist use the corresponding in-place yaw model. This lets a near-ground camera look down without trying to move its physical position through the floor.
- SKYLINE mouse-wheel movement now follows the perspective ray through the cursor rather than always following the centre view ray. Two-finger pinch records a world anchor from the initial two-finger midpoint and moves toward/away from that anchor. `+/-` remains centre-ray movement because keyboard input has no pointer position. PLAN keeps conventional orthographic zoom. Wheel `deltaMode` is normalised before movement.
- Files changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts}`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`. No data files are replaced and no deletions are required.
- Validation: strict standalone TypeScript passes for the main renderer and WebGL module. Focused source/math checks verify free-look leaves eye coordinates unchanged, centre-screen ray equals camera forward, off-centre rays diverge toward the pointer, and downward translation clips at the 0.25 m eye floor without constraining the target. Headless Chromium interaction QA is unavailable in this execution environment because Chromium does not complete page startup reliably; physical touch pinch remains a local-device review item.
- Next review: test wheel movement with the cursor over different parts of the skyline, pinch around a deliberately chosen building/street location, and near-ground right-drag pitch. If those controls feel correct, return to skyline/data fidelity rather than further camera architecture.

---

## 2026-10-08 Fireworks Sydney rendering-performance correction

- Base remains `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks patches through the city cache fix layered on top. Preserve the user-generated real `public/data/fireworks-simulator/sydney-city.json`; this patch does not replace it.
- The real Sydney bundle exposed the Canvas 2D renderer ceiling: 4,692 building records plus 2,737 roads can remain smooth while static because the city is cached, but arbitrary camera movement forces thousands of projections, sort operations and draw calls. A synthetic scene matching those object counts reproduced the problem in headless Chromium: the pre-fix Canvas path was about 18-20 FPS static and roughly 4-7 FPS during sustained movement.
- SKYLINE now prefers a dedicated WebGL2 city pass. Opaque sourced building faces, roof/vertical wire edges, road carriageway quads, road edges/centre markings and transport points are uploaded to GPU buffers once when the city bundle loads. Camera movement updates shader uniforms and reuses those buffers instead of reprojecting every source polygon on the CPU. The dense sourced city therefore keeps its full feature/vertex counts. PLAN and WebGL-unavailable browsers retain the Canvas renderer.
- WebGL building faces use a depth buffer and back-face culling. This improves true building/building and building/road occlusion, including stacked building parts, without changing the underlying Overture geometry. The procedural Bridge, Opera House and Sydney Tower remain on the small Canvas overlay for now.
- Firework rendering stays Canvas 2D. The existing foreground architecture mask is now cached and regenerated only after camera input settles, rather than reprojecting nearer buildings on every animation frame. This preserves the current firework-behind-building approximation without duplicating the full city pass during navigation.
- Canvas fallback also receives lower-risk optimisations: cached camera basis/focal calculations, prepared building/road bounds, screen culling, batched road strokes and depth-bucketed building surface paths. These retain visible source geometry rather than reducing building/road counts.
- The skyline ground clearance is reduced from 2 m to 0.25 m. Camera orbit, altitude drag and dolly still cannot cross below the ground plane, but the user can inspect streets/podiums from much closer to ground level.
- Files changed: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.css,fireworks-simulator.ts,city-webgl.ts}`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`. No data files are replaced and no deletions are required.
- Validation: strict TypeScript passes for the Canvas/WebGL modules. A synthetic 4,692-building / 2,737-road / 3,612-transport-point browser benchmark validates the Canvas fallback changes: static animation returns to 60 FPS after the cached foreground mask, while sustained Canvas-only camera movement remains the measured bottleneck, supporting the GPU decision. The execution browser does not expose WebGL2, so the new GPU path still requires local hardware validation against the user's real Sydney bundle. Full Astro build is not available in this snapshot environment.
- Next review: apply this patch without overwriting the locally generated Sydney JSON, confirm the telemetry reads `WEBGL CITY + CANVAS FX`, then compare FPS while continuously panning/orbiting at the wide view shown in the user's screenshot. If local WebGL2 is unavailable, telemetry will show `CANVAS 2D` and the fallback remains functional.

---

## 2026-10-08 Fireworks Sydney city cache correction and real-data profile

- Base remains `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks patches through the Sydney streets layer applied. This focused correction does **not** replace `public/data/fireworks-simulator/sydney-city.json`; preserve the locally generated real Sydney bundle.
- Local acquisition is now confirmed working. The user generated Overture release `2026-09-23.1` on 2026-10-08: 4,567 input buildings, 528 input building parts, 4,692 browser building records, 529 building parts, 2,737 NSW/OSM-enriched road segments, 1,938 named roads, 926 roads with explicit exact lane counts, 1,409 derived junctions, 683 traffic-signal points and 1,520 crossing points. Direct building height coverage is 8.3%, floor-derived fallback 75.6%, assumed height 16.1%. The derived browser bundle is about 2.88 MB raw and 452 KB gzip.
- The screenshot still reported `CITY 34 / STREETS 0 / CALIBRATION`, proving the browser was not reading the regenerated bundle. Root cause: the city loader used Fetch `cache: 'force-cache'`, which may return a matching cached response even when stale. The city request now uses `cache: 'no-cache'`, forcing revalidation before reuse while still allowing normal HTTP caching.
- The full acquisition reported 559 building/ground-road conflicts. Those buildings are intentionally withheld by the existing conflict policy and need visual/data review before any automatic geometry correction is relaxed.
- Changed files: `src/visualisations/fireworks-simulator/fireworks-simulator.ts`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/current-handoff.md`. No deletions. Do not overwrite the user's regenerated city JSON with the older calibration fixture.
- Validation: standalone TypeScript compile/syntax checks and focused source assertions for `no-cache`; ZIP integrity. Full Astro/browser QA is deferred to the user's current local dev server because only that environment contains the generated 2.88 MB Sydney bundle.


## 2026-10-07 Fireworks Sydney streets and coordinate-integrity layer

- Base remains clean `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks patches through the skyline camera-dolly change layered on top. This patch is limited to street/transport data, rendering and coordinate QA; the approved camera mappings and firework physics are unchanged.
- The browser city contract is now schema `0.3.0` with optional city-agnostic `roads` and `transportPoints`. Road records retain names for later labels, local-metre centreline points, source hierarchy/on-type, separate categorical versus exact lane fields, display width with provenance, and source class. Transport points support derived junctions plus explicit traffic-signal and street-crossing nodes.
- Sydney's primary road adapter is NSW Spatial Services `RoadSegment`. Important correction: its `lanecount` values are coded categories (`0 unknown`, `1 one lane`, `2 two or more lanes`), so code `2` is never treated as exactly two lanes. Bounded OpenStreetMap enrichment can add explicit numeric `lanes=*`, `width=*`, `highway=traffic_signals` and `highway=crossing` data when present. Overture Transportation is documented as the common segment/connector contract for future cities.
- Roads render as dark opaque carriageway bands with restrained edges before buildings. Exact multi-lane roads can show a subtle centre marking. Signals, crossings and derived junctions render as small non-interactive ground markers; names are stored but street labels are deferred. Telemetry/status reports the sourced street count.
- Coordinate integrity is now an explicit pipeline rule. Buildings and roads pass through the same EPSG:7856 to local-metre transform. Only ground-road corridors participate in conflicts; bridge/tunnel segments and building parts starting 4.5 m or more above ground are excluded. Procedural calibration footprints may be clipped because they are invented. Real Overture buildings are never silently altered: material ground-road conflicts are flagged and withheld from rendering for review. Conflict counts are exported in the profile.
- `scripts/data/fireworks-simulator/acquire_sydney_transport.py` is the focused local command for acquiring/merging streets without re-downloading buildings. The full `acquire_sydney.py` now downloads buildings plus the transport sources. Raw network files remain under ignored `data/raw/fireworks-simulator/sydney/`.
- This execution environment cannot resolve the NSW GIS/Overpass hosts, so the checked-in browser fixture deliberately contains zero sourced roads/transport points rather than invented Sydney streets. Run the acquisition command on a networked local machine to populate them.
- Changed files: `scripts/data/fireworks-simulator/{acquire_sydney.py,acquire_sydney_transport.py,prepare_sydney_city.py,test_prepare_sydney_city.py,README.md}`, `public/data/fireworks-simulator/sydney-city.json`, `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts}`, `src/content/projects/fireworks-simulator.md`, `docs/{fireworks-simulator-sydney-city-research.md,ux-accessibility-features.md,current-handoff.md}`, `data/sources/fireworks-simulator-sydney-city.md`, and `docs/exec-plans/active/010-fireworks-simulator.md`. No deletions.
- Validation: eight deterministic Python preparation tests cover building ingestion plus lane-category semantics, OSM exact-lane enrichment, signals/crossings, derived junctions and real-building road conflicts; strict standalone TypeScript passes. Real NSW/OSM acquisition, road alignment review and real-city browser performance remain local review gates.
- Next review: run the street acquisition locally, inspect Circular Quay/Barangaroo road alignment and conflict counts, then tune street visual hierarchy before adding labels or extending the network to another city.

---
## 2026-10-07 Fireworks skyline dolly correction

- Base remains clean `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks patches through the mouse rotate/height correction layered on top. This patch changes only the former SKYLINE zoom behaviour and its documentation.
- SKYLINE no longer changes lens/projection scale. Mouse wheel, two-finger pinch and `+/-` now physically move the camera eye and target forward/backward together along the current viewing direction, preserving field of view, orientation and eye-target distance. This is a camera dolly, not optical zoom.
- Wheel/pinch movement is queued and smoothed in the animation loop. Held `+/-` uses the existing frame-time keyboard easing. Ground constraints still apply if forward motion has a downward component.
- PLAN remains unchanged and retains orthographic zoom for wheel, pinch and `+/-`. The SKYLINE camera readout no longer shows a zoom multiplier.
- Changed files: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts}`, `docs/ux-accessibility-features.md`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/current-handoff.md`. No deletions.

---

## 2026-10-07 Fireworks mouse rotate and height correction

- Base remains clean `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks patches through the keyboard-navigation correction layered on top. This patch is mouse-mapping only; Sydney geometry, streets, touch gestures and keyboard navigation are unchanged.
- Right mouse drag now rotates/orbits the SKYLINE camera around its current pivot. In PLAN, right drag rotates the plan view.
- Holding both primary and secondary mouse buttons and dragging vertically changes the SKYLINE camera eye height. Dragging up raises the eye; dragging down lowers it. The eye is clamped to the existing 2 m ground clearance, so the viewpoint cannot pass through the ground. This is separate from zoom: wheel, pinch and `+/-` retain lens/projection zoom. PLAN has no chorded-button height action because it has no physical eye altitude.
- Stage accessibility text, Method copy and the compact interaction hint now describe the revised mapping.
- Changed files: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts}`, `docs/ux-accessibility-features.md`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/current-handoff.md`. No deletions.
- Validation: focused TypeScript/source checks and mouse-state assertions completed for right-button rotation, chorded-button altitude and the 2 m floor. Full Astro/browser QA remains outside this small correction unless otherwise noted in the delivery response.
- Suggested next patch: streets/network schema and Sydney street rendering with lane/name/intersection metadata where supported, using one city-agnostic coordinate contract before returning to the real-building skyline/overlap pass.

---

## 2026-10-07 Fireworks keyboard navigation correction

- Base remains clean `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks Stage 2 through Stage 5 and the approved skyline/free-camera/correction patches layered on top. The supplied context has no live `.git` history; compare overlapping local files before applying.
- Scope is intentionally keyboard-only. Mouse and touch mappings, skyline massing, overlap cleanup and street/network data are unchanged in this patch.
- Camera movement no longer depends on repeated `keydown` events. `keydown`/`keyup` maintain held-key state and the existing animation loop applies movement from frame elapsed time with short acceleration/deceleration easing. This removes operating-system keyboard-repeat stepping and keeps movement rate consistent across refresh rates.
- Keyboard directions are corrected independently from pointer grab semantics: `A/Left` pans the viewport left, `D/Right` right, `W/Up` up and `S/Down` down in both SKYLINE and PLAN. Diagonal panning is normalised. `Q/E` and `+/-` are continuous while held; `R/Home` remains immediate reset; Shift accelerates held navigation.
- Global navigation still works without clicking the viewport first and yields to text-entry/form controls. Blur or page hiding clears pressed-key state and residual keyboard velocity so navigation cannot remain stuck after focus leaves the tab.
- Changed files: `src/visualisations/fireworks-simulator/fireworks-simulator.ts`, `docs/ux-accessibility-features.md`, `docs/exec-plans/active/010-fireworks-simulator.md`, `docs/current-handoff.md`. No deletions.
- Validation: standalone strict TypeScript completed; compiled JavaScript syntax checked; focused source assertions confirm keydown/keyup state tracking, frame-loop movement, inverse pointer/keyboard pan semantics, diagonal normalisation and stuck-key cleanup; a deterministic frame-time simulation showed the same one-second held-key movement within about 0.5% at 60 Hz and 144 Hz. Chromium could not be used for this patch because the container GPU process fails to initialise, so browser interaction and full Astro build remain unrun in this supplied environment.
- The requested mouse remap is completed by the newer handoff entry above. After input controls are accepted, tackle streets plus real-city skyline/overlap data as a separate patch.

---

## 2026-10-07 Fireworks Sydney skyline fidelity and camera correction

- Base remains clean `main` at `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved Fireworks Stage 2 through Stage 5, skyline-review and free-camera/import patches layered on top. No live `.git` history is present in the supplied context. Reconcile any newer overlapping local edits before applying.
- Historical note for this correction: its right-drag zoom / both-button orbit mapping was superseded by the newer mouse-mapping entry above. Left drag and one-finger drag pan on the horizontal city plane; keyboard and touch behaviour from this correction otherwise remain the basis for the current implementation.
- Skyline ground constraints keep the eye above the ground plane and the pivot at or above ground. Pan and zoom do not modify camera `z`.
- Buildings and solid landmarks use opaque dark faces and painter ordering. Camera-nearer architecture is redrawn after fireworks so buildings/solid structures mask firework particles and trails. This is a Canvas painter-depth approximation, not a per-pixel z-buffer; arbitrary-view overlap with dense real geometry remains a WebGL decision gate.
- The prior Opera House model failed for two reasons: alternating `reverse` geometry made neighbouring shells point in opposing directions, and the shell horizontal run was too long relative to height, making the replacement read as shallow canopies. The current schematic uses three conceptual shell groups containing eight nested ribbed opaque surfaces, a common longitudinal rise with modest group fanning, a mirrored transverse arch, shorter run-to-height proportions and a tapered Bennelong Point podium. This follows the official spherical-solution design principle but is still original approximation geometry, not a surveyed mesh.
- The skyline mismatch was also data-driven. The fallback previously had 26 generic block prisms plus only five named high-rise anchors. Calibration mode now has 11 named height/coordinate anchors, including One Barangaroo/Crown Sydney, both One Sydney Harbour towers, International Towers 1 to 3, Quay Quarter Tower, Governor Phillip Tower, Salesforce Tower, Chifley Tower and Deutsche Bank Place. The generated fallback has 37 building prisms and 148 footprint vertices. Anchor footprint dimensions/rotations and all 26 generic blocks remain hypotheses. Zero real Overture features are claimed.
- Real-data status remains open. Overture supports footprints, heights/floors and building parts, and the committed acquisition/import workflow is still the permanent path, but this execution environment cannot retrieve the Sydney extract. Do not describe the improved fallback as real Sydney geometry.
- Validation completed: strict standalone TypeScript; four Python preparation tests including fallback tower-cluster assertions and Overture part/height/failure cases; generated calibration JSON; headless Chromium 1440x900 pointer/keyboard tests with no page errors; global navigation from Reset/Launch button focus; left-drag pan with constant `Z`; right-drag smooth lens zoom with constant eye coordinates; both-button orbit; Q/E and +/- keys; repeated low-orbit stress remaining above ground; and 390x844 CDP touch tests for one-finger pan plus two-finger pan/pinch/twist with constant camera height. The final Opera House procedural model was visually checked in the harness. Full Astro build, actual Overture acquisition/profile, physical-device touch QA and real-city depth/performance remain unrun.
- Changed files for this correction: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts}`, `src/content/projects/fireworks-simulator.md`, `scripts/data/fireworks-simulator/{prepare_sydney_city.py,test_prepare_sydney_city.py,README.md}`, `public/data/fireworks-simulator/sydney-city.json`, `docs/{fireworks-simulator-sydney-city-research.md,ux-accessibility-features.md,current-handoff.md}`, `data/sources/fireworks-simulator-sydney-city.md`, and `docs/exec-plans/active/010-fireworks-simulator.md`. No deletions.
- Next data gate: run the existing Overture acquisition on a networked machine, profile the real `building`/`building_part` output, then review skyline composition, building height coverage, landmark relationship and occlusion before expanding city scope or show-building features.

---

## 2026-09-25 Pulse temporarily unpublished for safe production build

- Source snapshot: dirty `main` at full commit `d1efaea9c02f239b33b5f954ea5c02df524ee886`, captured 15:33 Adelaide time. Existing uncommitted local-admin work is preserved.
- `src/data/site-admin.json` now sets `pulse-of-adelaide.visible` to `false` and removes Pulse from the LAB homepage examples. The existing `getProjects()` visibility filter therefore removes Pulse from public listings and from Astro `getStaticPaths()`, so a fresh build does not generate `/projects/pulse-of-adelaide/`.
- `npm run build` now runs `scripts/build/prune-hidden-projects.mjs` after Astro. For every project explicitly hidden by the committed admin settings, the script removes any stale `dist/projects/<slug>/` route and `dist/data/<slug>/` directory. This prevents locally present ignored Pulse event files under `public/data/pulse-of-adelaide/` from being included in the production output while Pulse is hidden. Source Markdown, visualisation code, processing scripts and local Pulse data remain in the repository/worktree for later republication.
- The local admin remains loopback-only. Publishing this static build does not expose `/mladmin`; no Cloudflare backend, credentials or account state are included.
- Changed for this decision: `src/data/site-admin.json`, `package.json`, `scripts/build/prune-hidden-projects.mjs`, `docs/current-handoff.md`, and Plans 002/009. No source/data deletions.
- Validation completed: `node --check scripts/build/prune-hidden-projects.mjs`; `npm run admin:test`; current `site-admin.json` through the admin validator; and an isolated synthetic `dist/` test confirming the prune step removes the Pulse route/data while preserving an unrelated project. Full Astro build was not run because this context archive has no `node_modules` and `npm ci --ignore-scripts` timed out in the execution environment. Run `npm ci` if needed and `npm run build` locally before publishing, then confirm `dist/projects/pulse-of-adelaide/` and `dist/data/pulse-of-adelaide/` do not exist.

---

## 2026-09-19 local admin Stage 1 (review patch)

- Snapshot: clean `main` at full commit `d1efaea9c02f239b33b5f954ea5c02df524ee886` captured 09:04 Adelaide time. Source archive has no `.git` history. No remote comparison; check the user's latest local overlapping files before applying.
- A separate loopback-only `http://127.0.0.1:4322/mladmin` Node editor now manages homepage section/exemplar order, per-project category/status/visibility/UPDATED badge/card order and restricted local accounts. The reserved `mark` account is created or reset by `npm run admin:reset`, generating a new one-time password locally. Account data stays ignored in `data/processed/mladmin/`; no credentials in the ZIP. Astro continues building static pages from new committed `src/data/site-admin.json`. Editing locally never publishes to Cloudflare. No link to the editor is added to the public site.
- Implemented: homepage and project readers use editorial overrides; hidden projects are not generated on a fresh build; home preview choices read editorial settings. Local Node editor has salted scrypt hashes, loopback/Host/Origin checks, HTTP-only SameSite session cookie, CSRF, rate-limited sign-in, permissions and root-only account controls. Games controls and statistics are clearly marked unavailable; Formula Daily still uses its existing hard-coded sample. Public `/mladmin` and a Cloudflare Worker/D1 backend are NOT implemented.
- Files: `package.json`, `src/data/site-admin.json`, `src/lib/{site-admin.ts,projects.ts}`, `src/pages/index.astro`, `src/components/ProjectCard.astro`, `scripts/admin/{store.mjs,server.mjs,reset-admin.mjs,admin.html,admin.css,admin.js,admin.test.mjs}`, `docs/{current-handoff.md,index.md}`, `docs/exec-plans/active/009-local-admin.md`. No separate deletions. No live deployment, commit, push, DNS or Cloudflare changes.
- Validation: local API integration tests passed for authentication, editorial changes, role isolation and recovery. JS syntax passed. A full Astro build and browser layout review require local dependencies and have not run here. Next: apply and locally review; decide how the existing Cloudflare Worker can support a secure production admin before adding game scheduling and analytics. Detailed boundaries and commands: Plan 009.

---

## 2026-09-18 Pulse full-history month-range prototype (review patch)

- Source baseline: the supplied dirty `main` snapshot at `79770434464b4450ef55b00357464fdc82ccc29d`, with title Patch 1, timeline Patch 2 and drag-only Patch 3 layered over it. The user subsequently reported publishing a February-only data commit `c6a7067` and producing a complete local archive through September 2026. No fresh checkout, complete new commit hash, current working-tree comparison or actual full event files were supplied; compare the overlapping local files before applying this ZIP. Do not overwrite newer local changes.
- New compact per-fuel archive summary generator reads the user's existing exported monthly JSON once, emits hourly mean/coverage for the full archive, and cumulative station-state checkpoints. The client displays all available months by default without loading all raw observations into browser memory. A small upper-right History panel chooses a contiguous From/To month by native selects or two labelled month sliders; View period zooms the chart and resets A/B to that span, while the existing 2-hour drag rule and drag-only progress timestamp remain unchanged. Monthly event files load on demand across the timeline; up to three files are cached. Missing whole months appear as chart gaps; continuous months carry valid last reported prices through their boundaries.
- Changed: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `scripts/data/pulse-of-adelaide/{build_archive_summary.mjs,README.md}`, `docs/{current-handoff.md,ux-accessibility-features.md}` and `docs/exec-plans/active/002-pulse-of-adelaide.md`. No generated fuel data or geographic assets in the ZIP. After copying the complete export into `public/data/pulse-of-adelaide/events/`, run `node scripts/data/pulse-of-adelaide/build_archive_summary.mjs` before `npm run dev`.
- Validation: focused strict TypeScript and Node syntax passed; synthetic three-partition export checked cumulative checkpoints, hourly mean and a missing-month chart gap; CSS parsed without errors. Actual full-history payload sizing, Astro build, browser/device rendering and month-boundary network playback remain untested. The isolated browser harness was blocked from opening local URLs by the execution environment. Review local load time, gap rendering, controls at narrow widths and full history playback before publication.

---


## 2026-09-17 Pulse click-versus-drag A/B fix (after Patch 2)

- Base: supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d`, with the delivered title Patch 1 and timeline Patch 2 layered on top. No live Git checkout or comparison with newer local work; check overlapping files before extraction.
- Plot clicks now leave the existing A/B playback interval and playing state alone. Pointer-down does not create A, chart hover never updates B, and a new interval is previewed only after deliberate movement exceeding 6 CSS pixels **and** at least 2 snapped Adelaide-local hours. Dragging either direction works. Only a valid pointer-up locks the range; an invalid release or pointer cancellation restores the prior selection and cursor. Existing A/B endpoint drags and keyboard interval edits observe a 2-hour minimum; the separate bracket scrub remains click/drag accessible.
- Changed: `src/visualisations/pulse-of-adelaide/{pulse.ts,PulseOfAdelaide.astro}`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`. No changes to title, CSS, roads, geography, data, or other projects. Focused strict TypeScript and a 10-scenario isolated selection-handler harness passed; full Astro build and visual/browser testing remain pending. Next: review single clicks, short drags, reverse drags and endpoint editing in the local Pulse page.

---

## 2026-09-17 Pulse timeline controls (Patch 2, after title handover)

- Base: supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d` with Patch 1's all-or-nothing title source and documentation layered on top. No live Git comparison; check overlapping local files before applying.
- The native playback slider and chart-bracket scrub show their floating timestamp **only during an active pointer drag**, including touch. It disappears on release, cancellation, blur or hidden tab. Ordinary Play, Pause and keyboard playback do not display it. The chart hover timestamp is suppressed during a scrub; the drag timestamp stays above the grip, while A/B dates and their separate reset buttons sit below it. Nearby A/B labels use separate rows.
- The price series remains gold/grey. The playback bracket, progress grip and vertical endpoint ticks use cool blue-green so they read separately from the series; endpoint ticks match the progress stroke width at rest and thicken with it on hover/drag. Existing native slider labels, keyboard controls, playback timing and Patch 1 title behaviour remain unchanged.
- Changed: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`. No deletions. Focused compilation and structure checks are recorded in the patch handoff; local browser visual verification and full Astro build remain pending. Next: review timeline placement during slider drag, short A/B intervals and touch use.

---

## 2026-09-17 Pulse title all-or-nothing land handover (title-only patch)

- Base: supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d`, including its existing Pulse title/land implementation. No live Git comparison was available; compare overlapping files with local edits before application.
- The top title stays fully visible above the land while a cumulative land intersection records which letter pixels have entered water. Once every rendered letter pixel has crossed water, the entire top copy hides at once; the existing base title then remains under land. The handover is permanent until refresh. Empty spacing around and between words does not count toward completion.
- Only title logic and documentation changed. Timeline labels, scrub styling, roads, geography, fuel data and the chart remain untouched. Focused strict TypeScript passed; full Astro build and real MapLibre/browser visual check were not run. Next: review the title transition locally, then tackle the timeline controls separately.

---

## 2026-09-17 Pulse harbour alignment and chart-label review (latest patch)

- Base: supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d`, with the previously delivered static-geography, fullscreen-navigation, solid-land and smart-title patches layered in that order. No Git checkout or comparison with newer local edits was available.
- Diagnosis: road and fuel-station coordinates use one MapLibre projection. The land/shoreline comes from coarser GSHHG intermediate geometry, which marks part of the OSM Port River water polygon as land; a blanket X/Y shift would break correctly positioned roads and stations. Rebuilt `land.geojson` by subtracting 117 sourced `water`/`riverbank` features from the user's 2026-09-16 Geofabrik shapefile ZIP. Added a static `harbour-water.geojson` with higher-detail OSM harbour-water boundaries. The renderer suppresses only the coarse GSHHG harbour section and draws major OSM harbour-water outlines there; the GSHHG coastline and WA/VIC cues remain elsewhere. Bridges and causeways can legitimately cross water. Exact open-coast matching still requires a complete high-resolution coastal polygon, which this free extract does not provide.
- Title: correct the initial 300×150 transparent canvas bug and initialise its permanent land/ocean mask *before* the first drag. The visible base copy remains on ocean; top-copy pixels that enter ocean become permanently subject to land occlusion and are reset on refresh. The title text is still semantic.
- Timeline/nav: the fullscreen pin/chevron slot roll now lasts 1.3 seconds. The chart dates moved below the bracket. A separate datetime follows the draggable grip on that lower line, with an opaque black backing that covers axis dates instead of overlapping them. A/B date labels remain below the bracket. The grip now uses one consistent SVG three-line icon.
- Changed files: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `src/styles/global.css`, `public/data/pulse-of-adelaide/geography/{land.geojson,harbour-water.geojson,metadata.json}`, `scripts/data/pulse-of-adelaide/{build_land_overlay.py,README.md}`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`, `data/sources/pulse-of-adelaide.md`.
- Still outstanding: full Astro and real MapLibre/browser test against the user's February data, review of harbour/coast after local application, publication rights for fuel data and source timestamp interpretation. No history exports, road coordinates or R scripts changed.

---

## 2026-09-17 Pulse title occlusion and coast / scrub correction (latest patch)

- Base: supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d`, plus the immediately preceding `pulse-adelaide-hover-nav-solid-land-patch.zip`. No Git checkout or user working-tree comparison was available; preserve newer local changes.
- Replaced the SVG polygon closed far inland, which drew large false edges, with a bounded static GeoJSON polygon derived and checked against the **same GSHHG shoreline** as the coast. MapLibre now fills that polygon and draws the OSM road lines above it. `land.geojson` and `build_land_overlay.py` are included; the renderer does not invent a road-aligned coast. GSHHG intermediate shoreline and OSM differ around small harbours and causeways, so full local road/coast alignment requires a verified higher-resolution polygon.
- The two-line title starts completely visible on every page load, using a top copy over the map and a base copy below the land. Once a map drag or zoom starts, an alpha mask permanently removes each pixel of the top copy that has passed over ocean. The lower copy remains visible over water and gets covered by the moving land. This state is deliberately in-memory only and resets on refresh. Motion preference does not prevent the static masking.
- Added a small rewind button to the upper-left of play/pause that returns to the current playback-range start and resumes if it was playing. Slowed the shared fullscreen chevron/pin roll from 280 to 680 ms, retaining reduced-motion handling.
- A/B timestamps now appear below the bracket during selection as well as once locked; the temporary end label has no reset button until locked. The bracket line is thicker, with a separate gold HTML grip carrying three horizontal lines and stronger hover/drag treatment. The native range input retains its keyboard and touch semantics.
- Changed files: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `src/styles/global.css`, `public/data/pulse-of-adelaide/geography/{land.geojson,metadata.json}`, `scripts/data/pulse-of-adelaide/{build_land_overlay.py,README.md}`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`, `data/sources/pulse-of-adelaide.md`. Historical observations, exporter, road partitions, coastline lines and other site sections remain untouched.
- Validation: focused strict TypeScript, derived-land geometry checks, and isolated desktop/mobile browser checks of title masking, rewind, range labels and grip. Full Astro build, live MapLibre with the user's local fuel export, and detailed harbour accuracy remain untested. Historical fuel redistribution rights and timezone labeling are still unresolved.

## 2026-09-17 fullscreen hover tab and land occlusion review (latest patch)

- Base: supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d`, with `pulse-adelaide-fullscreen-nav-road-controls-coast-fade-patch.zip` applied as the immediate file baseline. No current Git checkout was accessible; compare overlapping files with your local tree before extraction.
- Shared fullscreen header now uses one 48 px centred tab. Pointer hover or first tap opens its section strip as an overlay; leaving the tab/strip closes an unpinned strip. The same tab displays a pin while open using a downward rolling icon animation. Clicking the pin persists the pinned choice across fullscreen projects, and unpinning collapses the strip and rolls the chevron back. Keyboard focus, Escape and reduced-motion handling remain. Other pages retain their normal header.
- Pulse now renders a separate opaque land SVG between the static ocean/title and the MapLibre road canvas. It derives its coastline edge from the longest connected mainland line in the bundled GSHHG GeoJSON; polygon closure runs far inland and is not shown as another shoreline or state border. The map and coast still move together; coastal shadow provides the restrained raised edge. Roads stay in their masked WebGL layer above the land, with station bursts and reference labels above roads. A failure to load the static coastline leaves no fabricated land fill.
- The fullscreen visualisation now uses the available dynamic viewport height when unpinned, and subtracts the 59 px pinned header only when pinned. No changes to fuel reports, geographic assets, R exporter or road-source selection.
- Validation: focused strict Pulse TypeScript passed. Isolated Chromium checks at 1440×900 and 390×780 passed narrow-tab hover/exit, pin/unpin, preference state, accessible state and touch tap flow. A separate projected SVG check confirmed the land mask separates Gulf St Vincent from mainland and the land is layered above the title. Full Astro build and the actual MapLibre/fuel-data browser remain untested.
- Changed files: `src/components/SiteHeader.astro`, `src/styles/global.css`, `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `docs/{current-handoff.md,design-system.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`. No new file deletions; the previously retired `src/visualisations/pulse-of-adelaide/adelaide-coastline.json` may still need deleting if present.

## 2026-09-17 Pulse shoreline/road control and shared fullscreen shell (latest patch)

- Base: supplied dirty `main` context at `79770434464b4450ef55b00357464fdc82ccc29d` plus `pulse-adelaide-static-sa-roads-coastline-patch.zip`. Git history and newer local changes are not available inside the snapshot. Apply only after comparing overlapping files.
- Shared fullscreen mode is now an opt-in project frontmatter field (`fullscreen: true` on Pulse). The standard section strip remains on other pages. In fullscreen mode a centre-top tab opens an overlay nav without moving content. Its secondary pin control reserves 59 px for a persistent strip; the preference is shared across fullscreen projects through localStorage, default unpinned. Escape closes the unpinned overlay; hidden navigation is inert; touch can access the unpin control.
- Static geography: `coast.geojson` now retains all SA coastline between 129 and 141 E but clips the WA extension to 128.45 E and VIC extension to 141.65 E; the two coastal meridian cues are shortened to 0.085 degrees. The neighbouring shoreline and cues fade to transparent using projected SVG gradients. The reproducible `trim_coast.py` utility is called by the existing geography generator. No invented filled land polygon or additional source data.
- Roads: the statewide overview stays loaded through all zooms so the detail tiles no longer replace it at zoom 8.25. Detail tiles load above zoom 10.2 and remain cached nearby; distant tiles are evicted only above a 36-tile cap. Flat line caps remove bead-like clipped endpoints. Base line opacity is 0.13 for the overview and 0.075 for detail; the map layer fades toward 0 at each state meridian. A road-icon button beneath the Rise/Fall legend cycles show, dim and off, saved for Pulse locally. Roads remain vector-only and use the existing public static assets, no service requests or new private data.
- Changed files: shared header, global CSS, project layout and content schema, Pulse project frontmatter/component/CSS/TypeScript, coastline GeoJSON and geographic metadata, static geography generator and trim utility, current handoff, active Pulse plan, design system, UX log and geography source notes. No deletions introduced. Previous obsolete `src/visualisations/pulse-of-adelaide/adelaide-coastline.json` still needs separate removal if present.
- Validation: focused strict TypeScript and Python coastline/manifest checks completed. Full Astro build blocked by unavailable cached dependencies and Node 22.16.0 being below one dependency requirement; browser QA against the user's local fuel export and actual MapLibre remains open. Historical fuel data publication rights and timestamp interpretation remain unresolved. Do not deploy private local event exports.

## 2026-09-17 Pulse static statewide vector geography (latest patch)

- Base: `main` at `79770434464b4450ef55b00357464fdc82ccc29d`, using the supplied dirty context plus the previously delivered `pulse-adelaide-road-export-fallback-patch.zip` as the immediate file baseline. `.git` is absent from the context; compare overlapping files against any newer local working tree before extraction.
- Replaced **all runtime Location SA map/export/GeoJSON road and coastline requests** with bundled, separately licensed static geography. The supplied Geofabrik 2026-09-16 South Australia shapefile contains 31,284 motorway, trunk, primary, secondary and tertiary road records including links. A reproducible Python conversion exports 305 adaptive WGS84 GeoJSON detail partitions plus a simplified state overview. MapLibre's native WebGL line layers use solid, antialiased blue-grey strokes at 25% opacity. Visible detail partitions load on demand when zoomed in; an overview serves statewide zoom levels. The formerly hidden MapLibre canvas is now composited with `screen` so roads render without covering the black artwork.
- Bundled GSHHG intermediate-resolution level-1 shoreline paths cover the full SA coast and extend into WA and Victoria (125.5 to 144.5 E, -39.3 to -30.2 S). Two short, deliberately schematic north-pointing vertical marks indicate the WA/SA and SA/VIC coastal border meridians (129 E and approximately 141 E). These are **not surveyed boundary lines**. No inferred filled land polygon is drawn; the coast remains distinct from roads.
- Changed `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `.gitignore`, `scripts/data/pulse-of-adelaide/{build_static_geography.py,README.md}`, `public/data/pulse-of-adelaide/geography/{metadata.json,coast.geojson,roads/index.json,roads/overview.geojson,roads/*.geojson}`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`, and `data/sources/pulse-of-adelaide.md`. The `.gitignore` exception allows **only** public geography, not private historical event exports, to be committed. The 141 MB original shapefile ZIP and GSHHG binaries are not packaged.
- Manual deletion if still present: `src/visualisations/pulse-of-adelaide/adelaide-coastline.json` (obsolete). Do not delete local raw Parquet, station lookup, R models or generated private event exports. Validation: focused strict TypeScript passed, geographic asset audit reconciled 31,284 source road records to 305 partitions and 32,594 clipped vector segments with 68 shoreline paths and two border cues; a mock MapLibre desktop/mobile browser harness passed static tile loading, overview switching and coastline rendering with no JavaScript errors. The actual MapLibre rendering, full Astro build and real-fuel-data browser review remain untested. Fuel history reuse rights and original timezone interpretation remain unresolved; do not publish local event exports.

## 2026-09-17 Pulse major-road image fallback (latest patch)

- Base: supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d`, with the previously delivered Pulse patches layered in sequence through `pulse-adelaide-major-roads-contrast-patch.zip`; Git metadata and any subsequent local changes are unavailable. Compare overlapping files before applying.
- The reported map still has no visible roads. Code review found that all earlier road rendering depended on successful browser GeoJSON fetches from an external map service; earlier tests supplied mocked responses and did not validate live CORS, server responses or geographic coverage. The exact failure on the user's machine remains unknown.
- Road loading now tries a transparent ArcGIS MapServer `export` image first. The request uses officially published layer 118, a FREE/HWY/ART class filter, separate cool-coloured strokes, a scale override, and WGS84-derived Web Mercator bounds. Ordinary image loading avoids the JavaScript cross-origin requirement. The transparent image stays aligned when the map pans and refreshes after movement. If both public hosts fail, the existing GeoJSON road renderer remains the fallback. A small visible status and console warning appear only if both methods fail.
- No geographic routes are manually drawn and no browser fuel export, R pipeline, backend, secrets or unrelated pages were changed. The source service, export operation and dynamic-layer support were verified from published documentation; a real Adelaide image response was not available in this environment.
- Files: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `docs/current-handoff.md`, `docs/exec-plans/active/002-pulse-of-adelaide.md`, `data/sources/pulse-of-adelaide.md`. No new deletions. The earlier retired `adelaide-coastline.json` remains a separate local cleanup if it exists.
- Validation: focused strict TypeScript and isolated Chromium tests passed for projected image URL and class styling, image failure to GeoJSON fallback and no JavaScript errors. The full Astro build, live Location SA service and user's actual-data browser view were not tested. If roads remain absent, capture the `/MapServer/export` and `/MapServer/query` requests in browser Network tools before further geographic changes.

## 2026-09-17 Pulse major-road overlay correction (latest patch)

- Base: dirty `main` snapshot at `79770434464b4450ef55b00357464fdc82ccc29d`, with the latest `pulse-adelaide-smooth-playback-coastline-fix.zip` and its existing place-reference file as the working baseline. No Git history is available in the snapshot; preserve newer local Pulse edits.
- Repaired the existing optional roads feature rather than adding an invented route layer. It now requests Location SA's published, region-scale roads layer 118 from `maps.sa.gov.au` first, with layers 103/42 and the alternative host available if the first query fails. FREE/HWY and ART classes remain geographically sourced; invalid and empty responses do not silently count as successful loads.
- Major roads now render as muted cool-blue dashed lines: FREE/HWY use a more visible fine line and faint underlay, while ART uses a thinner dashed line. The coastline remains a continuous warm-neutral line, and the glowing price events still carry the visual focus. The projection and fade move with the map; no causal station links or pricing data are introduced.
- Focused strict TypeScript and a synthetic Chromium geography test passed for typed source parsing, separate road classes, road/coast colour and line-style distinction, and loading from layer 118. The live ArcGIS payload, browser CORS, actual history and full Astro build remain unverified in this environment. No fuel data or private export is bundled.
- Changed files: `src/visualisations/pulse-of-adelaide/{pulse.ts,pulse.css}`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`, `data/sources/pulse-of-adelaide.md`. No new deletions. The previously retired `adelaide-coastline.json` still needs removal separately if present.

---

## 2026-09-17 Pulse smooth playback and coastline correction (latest local patch)

- Base: supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d` plus the previous `pulse-adelaide-landform-labels-speed-patch.zip`. Git history and the user's newer working tree are not available in the archive. Compare overlapping Pulse files before extraction.
- Replaced the old whole-hour *playback jumps* with frame-time-based, continuously advancing visual time. The chart cursor and price-cloud ages now update each animation frame; the clock refreshes when its displayed minute changes. Source observations remain event-driven at their original timestamps, and manual A/B endpoints and bracket scrubbing still snap to whole Adelaide hours.
- Rebalanced the displayed speed modes to 3.55, 4.8, 6.1 and 7.5 historical hours per real second for 1×, 2×, 5× and 10×. These are deliberately compressed relative presets, not literal 2/5/10-fold multipliers. This keeps the new 1× near the previous 5× pace and limits the excessive 10× jump. Transient pulses and lingering glows have short fade-ins for smoother starts; source station prices are untouched.
- Removed the incorrect grey land polygon: Location SA layer 44 returns *open coastline line strings*, which must not be filled as a land polygon. Only an unfilled coastline outline and shadow remain. This patch does not manufacture land geometry or change the optional Location SA road requests. The static ocean wave treatment remains.
- Enlarged `THE PULSE OF` / `ADELAIDE` into a two-line, left-aligned dark-grey background heading with the first line distributed to match the second line's width. No page-wide redesign, exporter, private data, commit, push or deployment.
- Changed: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`, `data/sources/pulse-of-adelaide.md`. No files to delete for this follow-up. Focused strict TypeScript and isolated animation/coastline logic checks passed. Chromium did not finish starting, so full Astro build, real network coastline and actual-data browser review remain outstanding.

---

## 2026-09-17 Pulse polish follow-up: labels, landform, wave field, and faster hourly playback (latest patch)

- Base: the immediate file baseline was the supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d` with the previously delivered hourly A/B bracket and roads patch layered over it. `.git` is still unavailable inside the archive, so compare against any newer local files before applying.
- Chart: kept the thinner time-series area, reduced the guide-label size, shifted price labels away from the line, lengthened the `|_________|` uprights, and moved locked A/B datetime labels beneath the bracket so they sit over the map rather than reserving layout space. Resetting A or B back to the archive bounds now hides that reset label again.
- Map: moved `THE PULSE OF ADELAIDE` into the map itself at the upper-left, below a new static ocean-wave field and below the rendered land overlay. The coast overlay now builds a filled land mass with a faint highlight and coastal shadow so the coastline reads as a subtle 3D shelf over the ocean. Major roads remain client-fetched from Location SA.
- Places: Adelaide CBD remains permanent and Seaford plus Elizabeth now do too, using the same always-visible 50% idle state and stronger hover state. Initial map framing is pulled slightly farther out and south so Seaford is present on load.
- Playback and pulses: default playback still autostarts after load. Glow lifetimes and transient pulse durations were extended again. Playback 1× now runs at the prior 5× feel, with 2×, 5× and 10× scaled up from that new baseline while still stepping in exact whole-hour increments.
- Files changed in this follow-up: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts,adelaide-places.json}`, `docs/current-handoff.md`, `docs/exec-plans/active/002-pulse-of-adelaide.md`, `data/sources/pulse-of-adelaide.md`. Full Astro build and real browser verification against the user's local export still need to be run on the user's machine.

## 2026-09-17 Pulse hourly playback and geographic network review (latest patch)

- Base: supplied dirty `main` snapshot `79770434464b4450ef55b00357464fdc82ccc29d` with `pulse-adelaide-overlay-flags-glow-patch.zip` as the immediate working baseline; no `.git` or direct access to the user's current working tree. Preserve any newer local changes before extracting.
- Changes: roughly halved the chart height; moved the only playback scrubber onto the chart's lower bracket, with a visible progress ball. Pointer interaction in the plot selects a whole-hour A/B interval by two clicks or a drag, while the lower bracket scrubs. Hover shows `DD MMM HH:MM`; selected endpoints retain compact date/time labels and independent reset buttons. The chosen interval is snapped to Adelaide-local whole hours. The line is highlighted only during selection.
- Playback starts automatically after the local event file and map load, except for `prefers-reduced-motion` users. Speeds now accumulate whole-hour steps, so the timer and A/B selection never display unintended minutes. Prices and original observation times remain unchanged; hourly visual sampling still applies every intrahour source event in order.
- Visuals: station glows now last roughly `min(60, 4 + 0.9 × |change in c/L|)` historical hours, fading to zero at expiry. The timer and mean price are larger and lighter; mean label reads `MEAN PRICE (CPL)` without a repeated unit. Bottom-centre play/pause and speed are unboxed, and Adelaide CBD's square and flag remain visible at 50% opacity even outside map hover, rising to 90% on hover.
- Added a separate, faint major-road network overlay from Location SA's publicly described `StreetMapCased_wmas/MapServer/42` class codes FREE, HWY and ART. Requests fetch paginated GeoJSON on the client and draw with the same MapLibre projection and elliptical fade as the existing high-detail coastline. If the public server or browser CORS fails, roads are omitted rather than approximated. No street basemap, imported private records or local generated exports added.
- Files: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `data/sources/pulse-of-adelaide.md`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`. The previously retired `src/visualisations/pulse-of-adelaide/adelaide-coastline.json` still needs deleting separately if present.
- Validation: focused strict TypeScript passed, and an isolated synthetic browser harness passed desktop 1440×900 and mobile-width 390×780 checks of autoplay, aligned hours, A/B selection and reset, bracket scrub, road geometry rendering, 2× playback and no JS exceptions/vertical overflow. Full Astro build, live Location SA road service/CORS, real touch and actual R export remain untested. Source timestamp interpretation and fuel data publication permission remain unresolved. Next: review this patch locally and provide an updated snapshot before the full-archive stage.

---

## 2026-09-17 Pulse hover transport and flag nodes (latest patch)

- Base: supplied dirty `main` snapshot at `79770434464b4450ef55b00357464fdc82ccc29d` with the immediately preceding `pulse-adelaide-mean-suburbs-coastline-patch.zip` layered over it. `.git` and the user's current local working tree are unavailable, so compare files before applying and preserve newer changes.
- The map now uses the space previously reserved for the transport row. The progress control runs along the map's bottom edge and thickens on hover. A central play/pause circle and a smaller upper-right speed circle rise from the lower edge on map hover at 20% opacity, becoming 75% opacity when hovered or focused. Touch users see the controls continuously at higher opacity; all controls remain keyboard accessible.
- The date/time and superscript-tenths mean price are substantially larger. The value and unit remain text, and the existing material-change mean-price glow retains its thresholds and reduced-motion handling.
- Station-price **glows**, not reported station prices, now expire after roughly 1 to 24 historical hours according to change magnitude. Small changes fade sooner, larger changes last longer. Source observations, station price states and rapid reversals are unchanged. Transient pulse duration also scales by magnitude.
- Suburb squares stay invisible when the pointer is outside the map, appear at half opacity on entering, and reveal their individual labels on hover/focus/touch selection. Labels extend from a short diagonal pole with an interruptible stepped reveal; leaving reverses the transition. The other names remain hidden until their individual nodes are engaged. Touch maintains visible reference squares and tap-to-select labels. A mouse-selected flag clears when the pointer leaves the map.
- Removed the local intermediate-resolution coastline import. The only rendered line now comes from the existing higher-detail Location SA coastline request. Until it succeeds, the coast remains blank instead of appearing coarse and jumping to a detailed outline. **Delete `src/visualisations/pulse-of-adelaide/adelaide-coastline.json` separately:** root-ready ZIP extraction cannot remove it. The live coastline request's browser CORS/network availability still requires a check on the user's machine.
- Files in patch: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `data/sources/pulse-of-adelaide.md`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`. No data exporter, station reference or private historical data changed.
- Validation: strict focused TypeScript passed. A synthetic Chromium harness with a stub MapLibre projection and delayed coastline response checked desktop 1440 × 900 and mobile-width 390 × 780: no coarse coast before the detailed response, controls' 0%/20%/75% opacity states, node 0%/50% states, a reversible flag reveal, speed cycling, range dragging, progress line aligned to the map bottom, no page errors or vertical overflow. Real-device touch input, real map service/MapLibre, the user's actual R export and the full Astro build have not been tested.
- Next: review real data locally, especially visual size, hover-to-flag behavior on the real map, and Location SA availability. The full archive/checkpoint work remains a separate stage; do not publish browser fuel exports until redistribution rights are resolved.

---

## 2026-09-17 Pulse hover/average/suburb review (latest patch)

- Base: supplied dirty `main` snapshot at `79770434464b4450ef55b00357464fdc82ccc29d` with the immediately preceding `pulse-adelaide-verified-coastline-minimal-ui-patch.zip` layered over it. `.git` is absent from the archive; no remote comparison or commit was performed. Preserve newer user changes rather than overwriting them.
- Chart now has a neutral underlay for line depth on black. A temporary glow highlights the selected line segment only while dragging; the minimalist lower bracket persists afterwards. Chart and map remain one viewport with no filled map rectangle.
- Added a larger translucent date/time, bottom-right mean reported price in cents per litre with superscript tenths (no visible decimal point), and throttled direction/magnitude-based price glow. Displayed mean continues to update on every event. The effect only runs for meaningful movements during forward playback and respects reduced-motion settings.
- Added 12 researched geographic place-centre squares with hover/keyboard/touch labels. The local GSHHG coastline remains a fallback; the browser requests more detailed real coastline geometry from Location SA's public map service. The current runtime's lack of external network access prevented verification of that service's response and CORS; verify from the user's network. No private observations or other projects were changed.
- Files: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts,adelaide-places.json}`, `data/sources/pulse-of-adelaide.md`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`. No deletions required. The previous `adelaide-coastline.json` remains unchanged and is required as fallback.
- Focused strict TypeScript compilation and isolated Chromium checks with synthetic data and a stub projection passed at 1440 × 900 and 390 × 780: drag highlight clears on release, place labels reach 50% opacity, mean-price glow ignores a 0.25 c/L movement and responds to an 8.5 c/L increase, official-geometry response and fallback paths work, and there are no page errors or vertical overflow. A complete Astro build, the external coastline fetch, and playback against the real R export were not run. Fuel data rights and source timestamps remain unresolved. Next: review these changes locally before continuing the full archive design.

---

## 2026-09-17 Pulse coastline and minimalist controls (latest patch)

- Base: supplied dirty `main` at `79770434464b4450ef55b00357464fdc82ccc29d`, with the preceding Pulse minimalist coastline-brush ZIP as the immediate file baseline. The ZIP has no Git metadata, so current local branch state must be checked before applying. No other projects changed.
- Corrected the previous, inaccurate hand-drawn coast by using real GSHHG intermediate shoreline geometry (59 vertices across three clipped paths), documented in `data/sources/pulse-of-adelaide.md`. Projection and SVG dimensions now match the station coordinates and canvas. The coastline, stations and no-fill map have an elliptical transparency fade. The site-wide background glow is suppressed only on Pulse pages.
- Chart selection is now a thin bottom bracket rather than a gold filled panel. Price line is thicker with a light shadow. Chart guide labels are HTML overlay text, not stretched SVG text. No visible tagline, map container/card borders or date/time badge. Filters, translucent time and rise/fall legend occupy a single upper-right cluster. Speed cycles through 1×, 2×, 5×, 10× on an unboxed button. The scrubber is a thin track.
- Only the Pulse component, CSS, TypeScript, geographic asset, Pulse source note, plan and handoff/UX log change. No private observations or local RDS exports are packaged, and no deletions are required. Historical publication rights, exact timestamp timezone and full-history state checkpoints remain unresolved.
- Focused strict TypeScript and GeoJSON validation passed. An isolated, in-memory Chromium harness with synthetic events and a MapLibre projection stub passed at 1440 × 900 and 390 × 780: three coastline paths, correct SVG dimensions, zero runtime errors, no map fill, no page scroll, 5× speed after two clicks, and draggable selection. The local browser blocked HTTP/file navigation, so the harness used injected HTML; this is not a full Astro build or a test of real MapLibre and the local R export. Review those locally before release.

---

## 2026-09-17 Pulse minimalist visual refinement (latest patch)

- Base: supplied dirty `main` snapshot at `79770434464b4450ef55b00357464fdc82ccc29d`, plus the local event playback prototype already described below. This patch only touches the Pulse visualisation files and documentation.
- Removed visible chart clutter from the Pulse UI. The mean-price chart is now shorter and quieter, uses the same type language as the rest of the scene, hides axis/grid labels by default, and reveals lightweight internal guides only while hovered, focused or dragged. The old visible average/count/status copy and footer note were removed from the interface.
- Reworked playback selection into a brushed range instead of literal A/B labels. Users can drag directly on the chart to define a playback window, then play only that selected span. The selection is shown as a subtle gold band with thin handle lines; the chart uses an `ew-resize` hover cursor and the bottom scrubber now follows only the chosen range.
- Simplified the transport bar to an icon-only play/pause button, scrubber and speed control. Added a compact timer chip inside the map so the active archive date and time remain visible without extra headings.
- Replaced the raster basemap with a minimal projection scene and added a faint coastline overlay so the city geography reads as background context rather than a boxed map tile. The current coastline is a lightweight embedded prototype trace for visual orientation only and should be replaced later with an official Adelaide-region coastline/boundary asset before any public release.
- Tightened the glow rendering so price changes read as brighter, more defined bursts with a clearer core plus halo, while still fading softly into the background. No station links, interpolation or causal pathing were added.
- Validation: focused TypeScript compilation for `src/visualisations/pulse-of-adelaide/pulse.ts` passed via `tsc ... --target es2022 --lib dom,es2022 --module es2022 --noEmit`. Full Astro build remains unavailable in this archive because dependencies are not installed. Browser QA against the user’s local data export is still required.
- Changed files: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `docs/{current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`. No deletions in the ZIP. Next: review the new feel locally, then decide the archive-wide loading strategy and replace the provisional coastline with sourced geometry.

---

## 2026-09-17 Pulse local event playback (latest patch)

- Base: supplied dirty `main` snapshot at `79770434464b4450ef55b00357464fdc82ccc29d`; `.git` unavailable in the archive. Preserve unrelated dirty files, especially homepage edits. This entry supersedes the stale 40-SA/nine-Adelaide coverage figures below.
- Corrected user lookup: 1,219 SA sites, 757 exact historical matches, 311 Adelaide-region matches. February 2024 ULP model: 295 reporting sites and 2,569 observed transitions. G records retained, including large, fast reversals.
- Replaced Pulse's daily browser map with an intraday event player and hourly average-price chart. Soft red/green glowing station clouds pulse on reported changes, with magnitude-based size/brightness; gold/grey progress line and cursor, hourly slider, play/pause, 1×/2×/5×/10× speed, month/fuel selectors. Full historical span can be locally exported per month and fuel using the new R script. Existing unrelated work and SA Government API project untouched.
- Local data is NOT in the ZIP. To view real observations, apply patch and run `Rscript scripts/data/pulse-of-adelaide/build_event_playback.R --model 'C:\Users\Rush\Documents\pulse_feb2024_model.rds'` from repository root, then `npm run dev`. For all source months and grades use `--parquet <path> --stations <corrected-CSV> --all`; see the script README. No source data, fake fixtures, secrets or public-ready exports were packaged.
- Source `TRANSACTIONDATE` was suffixed with `Z` without timezone conversion; labels stay unchanged for now, with source timezone still unverified. Source ownership, public data reuse and deployment approval remain outstanding. Files under ignored `public/data/pulse-of-adelaide/events/` still enter Astro builds and must not be deployed inadvertently.
- Validation: focused TypeScript compilation passed. R exporter and real-map browser validation require the user's local R and historical files; complete Astro build and visual/device QA not yet run. Next: review actual February playback before further visual modes or longer cross-month playback.
- Patch paths: `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.css,pulse.ts}`, `src/content/projects/pulse-of-adelaide.md`, `scripts/data/pulse-of-adelaide/{build_event_playback.R,README.md}`, `docs/{current-handoff.md,pulse-of-adelaide-data-addendum.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`, `data/sources/pulse-of-adelaide.md`. No deletions required for the patch. Optional local cleanup: legacy ignored `public/data/pulse-of-adelaide/history/` and `history-preview.json` before any unrelated deployment.

---

## 2026-09-16 Pulse complete local-history browser (latest patch)

- Base: supplied `main` working-tree snapshot at `79770434464b4450ef55b00357464fdc82ccc29d` captured 19:38 Adelaide time; previous historical-only Pulse ZIP layered on top. The user's newer local archive and `public/` preview are not available here. Preserve unrelated homepage changes and reconcile this handoff if local documentation has advanced.
- User confirmed corrected private archive: 40 SA stations, 9 matching Adelaide stations, 77,589 historical price records, 246 monthly/grade partitions; June 2026 ULP contains only two Adelaide stations. The earlier importer was intentionally limited to one month and grade, which explains the screenshot, not a map failure.
- Added `build_history_browser.py` to process the **entire available corrected private archive** into small static daily files by Adelaide-local calendar month and fuel, with a single index. Browser selects any available month/grade and Adelaide or all SA, fetches one partition at a time, and keeps daily no-carry-forward and source timestamps. The original 77,589 observations remain in ignored private `data/processed/`; the browser exports use only daily last observations and are ignored locally under `public/data/pulse-of-adelaide/history/`.
- No current-price API, token, or government-specific notices were added. The historical provider and publication rights remain unconfirmed; public directory files still enter Astro builds, so do not deploy them yet. Actual full private archive was not available to run here. Focused TypeScript and Python syntax checks and synthetic importer tests passed; full Astro build and actual local browser validation were not run.
- ZIP includes only Pulse importer, test, page, component, styles and related documentation. Delete obsolete local `public/data/pulse-of-adelaide/history-preview.json` separately; do not delete the private source archive. Next action: apply the ZIP, run the complete importer against `SA-CORRECTED-20260916-114529`, run `npm run dev` and review the month/grade selectors. The missing 454 SA source stations cannot be recovered by this importer.

---

## 2026-09-16 historical-only Pulse reset (latest supplied snapshot)

- Supplied snapshot: branch `main`, full base commit `79770434464b4450ef55b00357464fdc82ccc29d`, captured 2026-09-16 19:38 Adelaide time. Dirty working tree preserved, including unrelated homepage work. Git history and live Cloudflare state unavailable from ZIP.
- Pulse now has a historical-only page and local importer; no government API request, government credit/complaint footer or 30-minute current-price rule in the Pulse client. Former government ingestion, publisher terms and source notes are parked under independent `sa-fuel-pricing` paths with private-only outputs. See Plan 002 and Plan 008.
- Historical upload fails essential data checks: 2,367 NSW stations, only 40 SA stations, zero matching SA records in sample 2026-09 LPG partition, and a manifest observation later than generation. No historical data is bundled or published. Importer rejects this input; a corrected SA-only export and timestamp validation are next.
- The root-ready ZIP does NOT delete files; user must separately delete old `scripts/data/pulse-of-adelaide/refresh.py` and `docs/pulse-of-adelaide-publisher-terms.md`, and local `public/data/pulse-of-adelaide/{snapshot.json,metadata.json}`. If government assets were ever deployed, separately remove them from the origin and caches. Do not deploy local `history-preview.json` until historical reuse rights are verified.
- Scope: one month's one grade timeline with play/pause, dated station prices and map. No full 368-partition import, live API, automatic schedule, Git commit or deployment. Python syntax and focused TypeScript checks passed, a synthetic SA fixture passed, and the uploaded broken archive was correctly rejected. Full Astro build was unavailable: offline dependency installation lacks cached packages and the container Node version is below one dependency requirement. Browser/production checks and real Adelaide-data review remain pending.

---

## Previous handoff (historical context; superseded for Pulse)

Snapshot date: 2026-09-16

## Repository state supplied to ChatGPT

- Latest supplied source archive: `main` at `79770434464b4450ef55b00357464fdc82ccc29d`, captured 2026-09-16 17:13 Adelaide time.
- The supplied working tree had six uncommitted homepage gallery and documentation changes. This fuel patch intentionally does not replace the homepage gallery files or its plan; it appends this section to the supplied handoff and preserves its existing history.
- The repository archive has no `.git` directory, so upstream Git state and Cloudflare deployment were not checked in this environment.
- If the handoff has changed since the supplied archive or the previous homepage ZIP was applied, merge this handoff entry rather than overwriting the newer file.

## 2026-09-16 Pulse map-loading repair (local review)

- Source base: supplied `main` archive at `79770434464b4450ef55b00357464fdc82ccc29d`, with the previous Pulse publisher-terms package layered on top. This archive contains no Git history and cannot confirm whether the user's local branch has moved.
- User reports successful API authentication and a local snapshot containing 298 priced Adelaide stations and 8 fuel types. These are user-reported results; no production data or token is included in this patch.
- Root cause of the screenshot's generic map failure: `pulse.ts` tried to load the removed `maplibre-gl.js` UMD bundle from MapLibre v6.9.1. The module-only v6 distribution uses `maplibre-gl.mjs`; load its namespace and use it for station popups.
- The UI now distinguishes a map-load failure from an expired snapshot, provides a specific CDN troubleshooting message and discards a partly created map before retry.
- Changed files: `src/visualisations/pulse-of-adelaide/pulse.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/002-pulse-of-adelaide.md`. No files to delete. Local output files remain ignored and excluded.
- Focused TypeScript check passed with isolated ambient type roots. Browser testing on the user's network and a full Astro build remain open. Local snapshots still expire after 30 minutes; run `--refresh` again before preview if needed. Existing publication blocks (reliable refresh/deployment and usage reporting) remain.

## 2026-09-16 Pulse of Adelaide: publisher-terms and access follow-up

- Base: supplied `main` snapshot at `79770434464b4450ef55b00357464fdc82ccc29d`, with the previously supplied Pulse map ZIP layered on top. Six pre-existing homepage changes are untouched. `.git` is absent from the archive.
- Accepted February 2021 publisher terms now reviewed. Free redistribution is conditional (2.3–2.4). The UI provides clause 3.1 credit verbatim below the map, source separation and direct State contact for stale prices (3.2–3.3), with no State endorsement/branding (3.5). Browser exports include credit. See `docs/pulse-of-adelaide-publisher-terms.md` for all clauses and operational obligations.
- Added `--check-access`, `--refresh` and `--retire` modes, private token via environment, attempt-based 65-second price request limit and atomic export writes. Browser hides prices older than 30 minutes from latest retrieval, and checks again on open tabs. This is an intentionally conservative snapshot-age rule, not an expiry for unchanged station prices.
- **Not live yet:** the supplied API hostname cannot resolve from this environment, so token activation and real records remain unverified. The repo has no production analytics for required monthly active/new/returning SA and regional audience reports (3.6–3.7), and no recurring production refresh/deployment. No account, GitHub, Cloudflare or DNS changes made. Publishing actual data requires those operational checks, deployment approval and subsequent public-link validation.
- Modified: `.gitignore`, `scripts/data/pulse-of-adelaide/{refresh.py,README.md}`, `src/visualisations/pulse-of-adelaide/{PulseOfAdelaide.astro,pulse.ts,pulse.css}`, `src/content/projects/pulse-of-adelaide.md`, `public/data/pulse-of-adelaide/README.md`, `data/sources/pulse-of-adelaide.md`, `docs/{pulse-of-adelaide-publisher-terms.md,pulse-of-adelaide-data-addendum.md,index.md,current-handoff.md,ux-accessibility-features.md}`, `docs/exec-plans/active/002-pulse-of-adelaide.md`.

## 2026-09-16 Pulse of Adelaide: local price map prototype

- First-stage local-only map: a time-stamped snapshot, selectable source fuel grades, price-coloured dots and soft station glows, selectable station details, unweighted station median, observed range and coverage count. Missing data is an explicit empty state, not fabricated values. No timeline or automated refresh yet.
- Source now identified: SA Fuel Pricing Information Scheme Direct API (OUT), developer guide v1.2. Direct API calls remain server-to-server. Subscriber token goes only into a local process environment variable and was not added to the package.
- The manually run Python script resolves Adelaide from the API region catalogue, fetches site details and prices, converts tenths of a cent to cents/litre, omits unavailable 9999 and saves private raw responses plus ignored local browser-preview files. The API token was reported to require overnight activation. Actual live response shapes and data counts remain untested.
- **Publication blocked:** the user's accepted Data Publisher Terms and Conditions were not supplied for verification. The generated browser files under `public/data/pulse-of-adelaide/` are deliberately gitignored; do not deploy them until redistribution, storage and attribution rights are confirmed. A local build can still copy those ignored files to `dist/`, so remove them before unrelated deployments.
- Changed files in this package: `.gitignore`, `src/content/projects/pulse-of-adelaide.md`, `src/pages/projects/[slug].astro`, three files under `src/visualisations/pulse-of-adelaide/`, `scripts/data/pulse-of-adelaide/refresh.py`, its README, `public/data/pulse-of-adelaide/README.md`, `data/sources/pulse-of-adelaide.md`, `docs/exec-plans/active/002-pulse-of-adelaide.md`, `docs/ux-accessibility-features.md`, `docs/index.md`, `docs/pulse-of-adelaide-data-addendum.md` and this handoff.
- Validation: Python syntax and TypeScript strict checks passed; a fixture-only ingestion test passed parser, unit conversion, unavailable-price and cache checks. The full Astro build and live authenticated API were not run. Chromium browser navigation was blocked by this sandbox, so visual and mobile QA remain open. Need the accepted licence clauses, a real authenticated sample after activation, measured payload/coverage and a publication decision.

## Current product state

- The homepage remains a fixed-viewport 3D portfolio gallery at normal heights. At effective viewport heights of 560px or less, it switches to a taller scrollable canvas so browser zoom and landscape phones do not clip cards or controls.
- Home, Data, Maps, Games, Lab, Photography and About remain semantic server-rendered sections.
- Carousel controls support deliberate horizontal trackpad/shift-wheel input, horizontal pointer/touch drag, Left/Right arrow keys and a centred bottom rail with seven interactive section ticks. Ordinary vertical wheel movement no longer changes sections.
- The carousel no longer uses `backdrop-filter`. Each section is a rounded dark card with a subtle internal gradient and normal box-shadow depth. The active card now uses one large featured preview plus two stacked secondary previews on the right, while waiting cards retain their silhouettes and recede through blur, opacity, muted preview imagery and 3D depth.
- The alternate homepage mode is presented to visitors as `Overview`, with a four-pane grid icon centred beneath the top rule. Its selected state still inverts to a light button. Internal implementation names retain `list` for compatibility.
- Overview uses the existing stable weighted treemap. Each section has a base weight, with Data, Games, Lab and Photography larger by default than About. The selected/hovered region receives a temporary weight boost, becoming the largest region while the other cards compress around it.
- Overview cards reuse the carousel card language: dark gradient surface, 22-28px corner treatment, ordinary shadow depth and the same preview artwork. Density-aware internal layouts keep inactive titles visible, scale typography to the available card size, and move medium/large preview content into a more balanced side-by-side composition instead of pinning everything near the top edge.
- Overview touch/pen cards now follow their full-card native link on the first tap. Mouse hover can still reweight the treemap, while keyboard focus highlights its card without reshaping the layout.
- Returning from Overview restores the carousel on the current selected/last mouse-hovered overview card and animates that card toward the centred carousel position. Keyboard focus no longer changes the return target.
- Photography remains a top-level section with `/photography/`. Internal pages now use a shared name-only horizontal section strip for Home, Data, Maps, Games, Lab, Photography and About; each strip card is a full native link and the current section is highlighted.
- South Australian Name Curve remains published in LAB.
- Formula Daily remains published as a GAMES prototype and in Stage 2 review.
- Ascend remains present as a GAMES prototype.
- Pulse of Adelaide has a reviewed conditional publishing licence and a working local map prototype; public release awaits a real API snapshot, recurring publication and audience reporting.


## 2026-09-15 magnetic Auto Swipe edge refinement

- Branch base: `main`; base commit `7302dabaf342344d1e222bbf97b6e01b8f380c0d`, with the previously delivered second Apple accessibility/interaction pass and Auto Swipe activation-feedback refinement layered on top.
- The Auto Swipe influence zone begins farther inward from each screen edge, but the protected dead band around the rounded active card remains intact so card dragging and edge navigation do not compete.
- Full-height left/right edge magnets keep the existing bright physical edge and progressive inward fade. Their cursor pool now follows vertical movement through a spring-damped liquid response, stretches farther inward as pressure increases and creates a short ripple from cursor velocity.
- Each magnet now contains an aria-hidden canvas particle layer. Fine luminous dust originates at the physical edge and curves toward the cursor under a gravity-like attraction model. Particle density, attraction and trail brightness scale with edge pressure; the loop runs only while the field is active/decaying and caps each side at 72 particles.
- Overview, Auto Swipe off and `prefers-reduced-motion: reduce` suppress the particle/ripple field. Existing explicit carousel controls remain unchanged.
- Auto Swipe control transparency is now hover-driven rather than focus-within-driven: off remains 75% transparent, on remains 25% transparent, and pointer hover is fully opaque. A mouse click can therefore leave focus on the switch without leaving the whole control fully opaque; keyboard `focus-visible` still receives the switch outline.
- Files changed: `src/pages/index.astro`, `src/visualisations/home-gallery/home-gallery.ts`, `src/visualisations/home-gallery/home-gallery.css`, `docs/current-handoff.md`, `docs/exec-plans/active/007-home-gallery.md`, `docs/ux-accessibility-features.md`.
- Validation: focused strict TypeScript compile passed; CSS brace/feature assertions passed. Full Astro production build and browser/device visual QA were not run in this sandbox.


## 2026-09-15 Auto Swipe activation feedback refinement

- Branch base: `main`; base commit `7302dabaf342344d1e222bbf97b6e01b8f380c0d`, with the previously delivered second Apple Design Skill accessibility/interaction patch layered on top.
- Turning `Auto Swipe` on from the bottom-right switch now pulses both full-height white edge magnets twice for about 0.8 seconds, then returns them to their normal pointer-reactive state. The pulse is a confirmation cue only and does not run when a stored `on` preference is restored on page load.
- The confirmation pulse is skipped when `prefers-reduced-motion: reduce` is active. Turning Auto Swipe off immediately clears any in-progress pulse and the existing edge intent/glow state.
- Auto Swipe control prominence remains stateful: off is 75% transparent, on is 25% transparent and pointer hover is fully opaque. The later magnetic-edge refinement supersedes the original `focus-within` opacity rule so mouse click focus no longer leaves the whole control fully opaque; keyboard `focus-visible` still has a clear outline. The existing 42x28px interaction area and switch track geometry are unchanged.
- Files changed: `src/visualisations/home-gallery/home-gallery.ts`, `src/visualisations/home-gallery/home-gallery.css`, `docs/exec-plans/active/007-home-gallery.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`.
- Validation: focused strict TypeScript compilation and CSS/static assertions passed. Browser review remains for the two-pulse timing and perceived switch prominence.

## 2026-09-15 second Apple Design Skill accessibility and interaction pass

- Branch base: `main`; base commit `7302dabaf342344d1e222bbf97b6e01b8f380c0d`; supplied snapshot recorded a clean working tree.
- Browser pinch zoom is restored across the carousel/rail with `touch-action: pan-y pinch-zoom`. At effective viewport heights of 560px or less, the homepage uses a taller 600-620px canvas with vertical document scrolling so browser zoom and landscape phones do not clip cards or controls.
- Previous/next arrows now rest at 45% opacity and receive a distinct keyboard focus outline.
- Bottom-rail mouse hover previews the nearest tick without changing sections. Click/tap commits a destination; pointer/touch dragging commits while scrubbing and announces the final section after release.
- Overview touch/pen cards open on the first tap. Keyboard focus no longer reweights the treemap; it keeps a stable geometry and uses the existing focus treatment.
- Added a permanent visually hidden `Mark Lee portfolio` page heading. All card headings are now `h2`, the animated stage no longer carries `aria-live`, and a dedicated polite status node announces settled section/mode changes.
- Up/Down keys no longer control the horizontal carousel. Left/Right, Home and End remain available.
- Raised remaining small meaningful captions and utility labels to about 12px or larger where space allows. The Auto Swipe control now has a 42x28px interaction area around its unchanged 34x18px visual track.
- Added `viewport-fit=cover`, safe-area-aware positioning for fixed controls and `prefers-contrast: more` styling.
- Files changed: `src/pages/index.astro`, `src/visualisations/home-gallery/home-gallery.ts`, `src/visualisations/home-gallery/home-gallery.css`, `docs/exec-plans/active/007-home-gallery.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`.
- Validation: focused strict TypeScript compilation passed for `home-gallery.ts`; CSS structure/static assertions passed. Full Astro build was not completed because dependency installation exceeded the sandbox transport window. Browser QA remains for local review of pinch zoom, short-height scrolling, rail preview/drag, first-tap Overview links, safe areas and increased-contrast mode.

## 2026-09-15 Apple Design Skill refinement pass

- Branch base: `main`; base commit `8114ceac2b51609ea846cc57d79c899076de7177`; supplied snapshot recorded a clean working tree.
- Renamed the visitor-facing `List` concept to `Overview` and replaced the list glyph with a four-pane overview icon. Stored mode values and internal `data-mode='list'` selectors remain unchanged to avoid destabilising the existing transition code.
- `Auto Swipe` now defaults off when no saved preference exists. A saved explicit `on` or `off` preference is still respected. One edge entry can trigger only one 1.5-second auto step; the pointer must leave the edge zone and re-enter before another auto step can begin.
- Wheel navigation now responds only to deliberate horizontal input, including horizontal trackpad movement or Shift+wheel. Ordinary vertical wheel movement does not change sections.
- Removed the masked luminous particle/dust layer from the edge effect while retaining the bright edge line and cursor-following radial bulge.
- Raised small interface type floors: rail labels, Auto Swipe text, mobile header/location text, preview captions, overview summaries/counts and dynamically sized overview eyebrow/summary text. The inactive rail colour moved from `#686c68` to `#777b77` for stronger small-text contrast.
- The mobile Overview toggle now has a 44px interactive box while preserving the previous 38px visible circle through an inset visual layer.
- Files changed: `src/pages/index.astro`, `src/visualisations/home-gallery/home-gallery.ts`, `src/visualisations/home-gallery/home-gallery.css`, `docs/exec-plans/active/007-home-gallery.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`.
- Validation: focused strict TypeScript compilation passed for `home-gallery.ts`; CSS brace/structure checks passed; static assertions confirmed the Overview labels/icon, Auto Swipe default-off logic, one-step edge gate, horizontal-only wheel branch, 44px mobile target and removed particle layer. Full Astro build was not completed because two `npm ci` attempts exceeded the sandbox command window and left no usable local Astro executable. Browser QA remains for local review.

## 2026-09-15 review patch: weighted treemap List view

- Branch base: `main`; base commit `62207946f645463cf3a7d54b659b3426dc6a9432`; supplied snapshot recorded a clean working tree.
- Replaced the equal single-row List layout with a fixed-topology weighted treemap. Section weights are stored with the homepage slide data, and the active List region receives a 2.8x temporary weight boost while split ratios retain minimum space for compressed neighbours.
- The treemap preserves section positions while it rebalances, avoiding a hover state that reshuffles cards under the pointer. Card geometry animates through `left`, `top`, `width` and `height`; reduced-motion preferences suppress the long transition through the existing rule.
- List cards now keep the carousel dark surface, radius, shadow and preview treatment. The active region uses all three previews when space allows. Passive large/medium cards keep one featured preview, while compact/sliver cards progressively remove secondary content so narrow regions remain targetable.
- Added touch/pen two-step List navigation: first tap selects/expands a different region, second tap follows its section link. Mouse click, keyboard focus and keyboard activation retain direct native-link behaviour.
- Validation: standalone strict TypeScript compilation passed for `home-gallery.ts`; CSS brace-balance check passed; a focused treemap invariant check confirmed the selected region remains the largest and every full-card pointer target stays above 24px in its smallest dimension at representative 1700x700 desktop and 374x650 mobile stage sizes. Full Astro build and browser QA were not completed because the supplied snapshot excludes the installed dependency tree.


## 2026-09-15 follow-up patch: List entry transition

- Branch base: `main`; base commit `62207946f645463cf3a7d54b659b3426dc6a9432`; this patch is layered on the corrected List stability package from the same base.
- Replaced the generic List entrance with a source-aware transition. The currently centred carousel card is measured before mode change, then visually translates and scales into its own final treemap rectangle after the List layout is applied.
- Non-active List cards no longer travel upward from the carousel card position. They are placed immediately at their own final treemap rectangles, start slightly smaller and transparent, then fade forward from the background with a small stagger.
- Initial treemap geometry transitions are temporarily suppressed during this entrance so `left`, `top`, `width` and `height` do not animate from the carousel's 50%/50% positioning. Hover-driven treemap resizing is locked until the entrance settles, then the normal 640ms treemap rebalance resumes.
- The entrance uses the individual `translate` and `scale` properties rather than animating the card's existing `transform`, avoiding the transform collision that caused the earlier carousel/List regression. Reduced-motion users receive the final List layout immediately without the morph/fade sequence.
- Validation: focused strict TypeScript compilation passed for `home-gallery.ts`; CSS brace-balance check passed. Full Astro/browser QA was not run in this sandbox.

## 2026-09-15 follow-up patch: treemap polish

- Branch base: `main`; base commit `62207946f645463cf3a7d54b659b3426dc6a9432`; supplied snapshot recorded a clean working tree.
- Refined inactive treemap cards so their titles remain readable more often. Density thresholds now collapse narrow or tall cards into title-first compact states sooner, instead of forcing a preview tile into spaces that were too cramped.
- Added per-card type scaling in List mode. Title, summary, eyebrow and padding now scale from each card's actual rectangle, so focused regions still feel bold while compressed cards avoid oversized or undersized headings.
- Reworked medium and large passive cards into balanced side-by-side compositions. Copy and the retained sample preview now share the horizontal space, instead of stacking near the top and leaving dead space below.
- The attempted FLIP-style List animation was reverted after browser review exposed transform conflicts with the carousel. List rebalancing now uses the stable `left`/`top`/`width`/`height` geometry model with a slower 640ms easing curve, while hover selection is driven by real mouse movement rather than `pointerenter` events generated as cards move under a stationary cursor.
- Validation: standalone strict TypeScript compilation passed for `home-gallery.ts`; CSS brace-balance check passed. Full Astro build and browser QA were not completed because the supplied snapshot excludes the installed dependency tree.


## 2026-09-15 regression fix: stable List/carousel switching

- Corrected the previous List polish regression. The FLIP animation had removed the List-mode `transform: none !important` isolation and left Web Animations transform state competing with the carousel's own inline transforms. This caused malformed first-load treemap positions and could leave the carousel displaced after leaving List view.
- Restored List-mode transform isolation and the stable direct geometry transition. Treemap cards now rebalance over 640ms with a softer easing curve.
- Hover-driven selection now responds to actual mouse `pointermove` over a card rather than `pointerenter`. This prevents moving treemap boundaries from recursively selecting newly passing cards and reduces hover oscillation.
- Kept the density-aware typography and side-by-side medium/large card composition from the previous polish pass. Title sizing now also accounts for title length and the text column width, reducing clipping for long names such as Photography.
- Validation: focused strict TypeScript compile passed for `home-gallery.ts`; CSS brace-balance check passed. Full Astro/browser QA remains for local review.


## 2026-09-15 follow-up patch: persistent view mode and Auto Swipe

- Branch base: `main`; base commit `62207946f645463cf3a7d54b659b3426dc6a9432`; this patch is layered on the stable List-entry-morph package from the same base.
- Home now stores the last selected homepage mode in `localStorage`. Returning to `/` restores either carousel or List mode instead of always resetting to carousel. The saved value is read defensively so blocked browser storage falls back to normal in-page behaviour.
- Historical note: this patch originally introduced `Auto Swipe` as default-on. The Apple Design Skill refinement above supersedes that default; it now defaults off unless the visitor has an explicit saved `on` preference.
- Turning Auto Swipe off stops desktop edge-hover loading, edge auto-flick/flow, cursor-reactive edge magnet glow, and endpoint pressure glow. Manual horizontal trackpad/Shift+wheel input, drag, arrow buttons, keyboard controls, rail navigation, and Overview remain available.
- Validation: focused strict TypeScript compilation passed for `home-gallery.ts`; CSS brace-balance check passed. Full Astro/browser QA was not run in this sandbox.

## Homepage gallery prototype

- Edge-hover feedback uses full-height root-level light layers. The Apple Design Skill refinement above keeps the bright edge line and cursor-centred bulge but removes the earlier masked particle/dust layer.

- Header centre copy now reads `BUILT IN ADELAIDE, AUSTRALIA`.
- The moving semi-transparent backdrop layer remains removed. It produced compositor flicker and a dark/purple band on some carousel transitions. Inactive card contents are directly blurred instead of filtering the transformed card container.
- Carousel sections now use a tighter 22-28px corner radius and shorter ordinary box shadows so the waiting sections still read as physical cards without looking like a second stacked rectangle. The surface, copy and preview imagery fade separately with distance.
- Active carousel cards now split into text plus an asymmetric visual group: one large featured preview and two stacked secondary previews. Home uses South Australian Name Curve, Formula Daily and Ascend; Games and Lab use their current project metadata; sections without enough current projects use section-specific visual samples rather than fake project links. Preview titles sit inside the imagery rather than in separate mini-card footers, and status labels have been removed from this overview.
- The centred carousel card remains a complete click/tap target for its section. The same full-card link remains keyboard focusable, while horizontal drag continues to control carousel movement. Hover/focus slightly brightens the card without changing its shadow geometry or zooming individual preview images. The former `OPEN ...` footer link and repeated bottom section label have been removed.
- The visible `WHEEL / DRAG / ARROW KEYS` helper remains removed. Carousel direction arrows stay visible on every card at 20% opacity and animate to 75% opacity on hover or keyboard focus. Home-left wraps to About and About-right wraps to Home by sweeping through the existing finite sequence rather than inserting duplicate cards.
- Rapid explicit navigation is now buffered: repeated on-screen previous/next clicks and repeated keyboard arrow presses are remembered while the current explicit move is running and replayed in order. The first step keeps the normal 560ms weighted move; queued one-card steps run at 300ms and queued endpoint sweeps at 760ms. Direct rail selection, wheel/drag input, mode changes and Home/End clear stale queued requests. Keyboard auto-repeat keeps only a small look-ahead buffer so a held key does not leave a long animation backlog after release.
- Carousel grab and edge-hover zones are now intentionally separate. Pointer/touch drag can begin only inside the visible rounded bounds of the settled active card. Empty stage space and neighbouring cards are not grab handles. On fine-pointer desktop input, edge-hover loading now begins in a viewport-relative zone near the screen edge, aligned just inward of the large direction arrows, with a guaranteed dead band between the card and the edge zone. The zone uses clamped responsive measurements so laptops and wide desktop monitors keep the same interaction separation.
- Desktop mouse click-drag is now a direct physical gesture rather than a transition-smoothed scrub. Dragging suspends carousel CSS transitions, pointer capture keeps the gesture attached outside the card bounds, and pointer movement is rendered at animation-frame cadence. Recent mouse samples provide release velocity: a fast release throws one neighbouring card with a damped spring continuation, while a slower release uses the existing distance settle. Touch drag keeps the previous non-inertial release behaviour. At the Home/About endpoints, mouse and touch drag now use an unbounded logarithmic soft-wall response instead of a fixed overscroll cap: Home can be pulled right and About left, but each additional amount of pointer travel produces progressively less card travel. A matching screen-edge pressure glow builds on the right for Home and on the left for About as raw pull increases. Release still hands the exact resisted position into the existing endpoint wrap sweep, while sub-threshold pulls settle back.
- Desktop mouse users get an edge-hover navigation enhancement: entering the dedicated viewport-edge zone progressively loads a small weighted tilt, and the hit area continues through the visible arrow region. A narrow low-intensity white edge wash now grows with that hover pressure on both sides. It stays close to the viewport edge, while a tall diffuse radial bulge follows the cursor vertically so the feedback reads as a natural swelling of edge light rather than a focused hotspot. Holding the edge starts a deliberate 1.5-second first lift-and-flick; keeping the pointer there repeats subsequent cards at 0.75 seconds each. Moving back into the dead zone cancels the pending edge step and fades the hover glow. Touch input and reduced-motion mode do not use this auto-flick behaviour.
- Carousel launch and arrival states now use separate rotation zones. The outgoing card leaves `rotateY(0deg)` through a short 0.30-card launch zone, while the incoming card uses the slower landing curve and is fully flat for the final 0.14-card centring travel. Visual focus follows the same asymmetric timing, so repeated edge scrolling no longer starts each new card with an instant skew/reset.
- Neighbour-card darkness, shadow, copy opacity, preview opacity, blur, saturation, brightness, refraction and preview scale now use one continuous depth curve. The previous near/far branch changed values abruptly at exactly one-card distance, which could flicker during continuous browsing. Scripted carousel motion also disables the card container's own opacity transition so every visual depth value follows the same animation frame.
- The bottom control is centred above the bottom rule. Its moving thumb now follows the live fractional carousel position on every rendered frame, so it moves with the cards during weighted flicks, drag settling and endpoint wrap sweeps instead of waiting for the final active index. The thumb no longer has its own `left` transition. Moving a fine pointer across the rail previews the nearest section; each labelled tick can also be clicked, tapped or keyboard-focused to select a section. Touch users can drag across the rail.
- List view reuses the same server-rendered card content. It adds a full-card section link rather than creating a second content set.
- Hover-dependent list expansion is restricted to devices reporting a fine pointer with convenient hover support; narrow layouts use a fixed two-column list grid.
- Non-active carousel panels remain `inert` and hidden from assistive technology while List view restores all cards to the normal interaction order.
- Reduced-motion users receive near-instant state changes and no list reveal or return animation.
- Project names now sit inside the visual panes rather than below them. The section itself remains the single full-card destination, and all section headings/descriptions/links remain present in the server-rendered HTML. Waiting cards keep their preview imagery at low contrast with stronger direct blur and a subtle refracted slice/offset treatment, while their copy becomes effectively unreadable.
- `docs/exec-plans/active/007-home-gallery.md` records the current prototype decisions and remaining review questions.
- On non-home pages, the former text-link header has been replaced by a sticky, horizontally scrollable name-only section strip. The current section scrolls into view on load, and project pages mark their parent category as current.

## Validation for this package

- `src/visualisations/home-gallery/home-gallery.ts` passes a focused strict TypeScript compile with DOM/ES2022 libraries; emitted JavaScript passes `node --check`.
- Focused TypeScript and state checks now also cover Review 22 interaction-zone separation plus the Review 21 endpoint soft-wall drag/glow, Review 20 endpoint drag wrap handoff and Review 19 desktop mouse drag inertia. Drag initiation is gated to the rounded active-card geometry, endpoint pulls use resisted overscroll before wrap, drag mode disables independent card transitions, pointer capture is retained, recent pointer samples determine release velocity, and a fast mouse release continues with a damped one-card spring throw while touch remains non-inertial. Review 18 explicit-navigation buffering remains intact, Review 17 couples the rail thumb to the live fractional carousel position, and Review 16 keeps the asymmetric launch/landing and continuous neighbour-depth interpolation.
- Edge-hover auto navigation is restricted to mouse pointer events with a fine hover-capable pointing device. Its zone is calculated from viewport width and the responsive arrow geometry, with a guaranteed dead band outside the active card. Focused geometry checks at 1024, 1280, 1366, 1440, 1920 and 2560px confirmed the edge zone does not overlap the card grab region. The current interaction keeps the 1.5-second single step, requires retreat and re-entry before another automatic step, and is disabled when reduced motion is requested.
- Static checks confirm the Home/Games/Lab preview selections are backed by current project metadata and the South Australian Name Curve uses its existing preview asset.
- The homepage CSS still contains no `backdrop-filter`.
- Full `npm run build` was not run for this review because the supplied context snapshot does not contain the installed dependency tree or local Astro executable.

## Next action

1. Apply this package over the previously supplied homepage gallery prototype based on `main` at `f67f8d6159cc08aef1f6fcdb50d6ef612a214044`.
2. Review the featured-plus-stacked preview composition on Home, Games and Lab and decide if it gives the work enough visual weight without competing with the section heading.
3. Review the refracted/blurred preview presence on neighbouring cards and check that it suggests content without becoming readable or distracting.
4. Review the generic Data, Maps, Photography and About samples and replace them with real project/photo assets later as those sections gain content.
5. Check the active-card hover/focus highlight and full-card click behaviour alongside wheel/drag navigation.
6. Review continuous horizontal trackpad/Shift+wheel, arrow, drag and edge-hover browsing from both directions and confirm neighbouring cards no longer darken, sharpen or change shadow abruptly as they cross the one-card depth boundary. Confirm the bottom rail thumb now travels continuously with the same weighted card motion.
7. On desktop with a mouse, test slow click-drag, fast short throws and release outside the card bounds. Confirm the card follows the pointer without lag and a fast release carries into exactly one neighbouring card without a dead pause.
8. Review endpoint drag on mouse and touch: pull Home right and About left, confirm the card continues moving with strong logarithmic resistance rather than hitting a visible cap, and confirm the matching screen-edge glow builds with pressure. Release beyond the existing threshold should still enter the wrap sweep; short pulls should settle back.
9. Review 390px touch behaviour, especially the compressed preview strip and drag-vs-tap behaviour on the active card.
10. Review the always-visible left/right arrows, including rapid three-plus click/key sequences and the Home-to-About / About-to-Home wrap sweep.
11. Review desktop interaction separation at laptop and wide-monitor sizes: the cursor should only show grab over the rounded active card, empty space should be neutral, and edge-hover loading should begin near the large arrow with a clear dead zone in between. Confirm one 1.5-second step occurs per edge entry and another requires retreat plus re-entry.
12. Review the compact section strip on internal pages and the List-view transition.

## 2026-09-12 review patch - same-label heart interactions

- Branch base: `main`
- Base commit: `b9f4ae9a8c41e11eaaeebf37f80c05be0e71bfee`
- Working baseline for this patch is the previously prepared mass-and-release-inertia package layered after the answer-cell drag-ceiling and silent-wall-collision updates.
- Added a lightweight heart overlay to the loose-label cluster. When two active labels with the same value and kind touch, one can send a small pixel-art heart to the other.
- Matching-pair cooldown is stored per pair for about 10 seconds, so one pair cannot spam the effect while other matching pairs remain eligible.
- The heart fades in, travels in a small arc, then fades back out. Reduced-motion users receive the same feedback with shorter and simpler movement.
- No scoring, validation, Tips, Touch Mode settings, drag boundaries, or mass/inertia tuning changed.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `src/visualisations/formula-daily/formula-daily.css`, `docs/exec-plans/active/005-formula-daily.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`.
- Validation: focused strict TypeScript compile passed with `tsc --target es2022 --module esnext --lib dom,es2022 --strict --noEmit src/visualisations/formula-daily/formula-daily.ts`; emitted JavaScript passed `node --check`; ZIP integrity passed. Full Astro build was not run because the supplied snapshot does not include dependencies.


## 2026-09-10 review prototype - Formula Daily Test Answer type checks

- Branch base: `main`; base commit: `094e8f7dc859a9f6b76dd30c5acd904bf1062187`.
- Working baseline for this patch is the previously prepared Test Answer structural-validation package layered on that clean snapshot.
- Added a worksheet model derived from the existing Sample Data table. Each referenced cell is classified as number, text or blank; decimal values are numeric.
- Added a second semantic validation pass after the existing structural parser. It propagates basic number/text/reference types through grouped expressions, supported functions and arithmetic operators.
- `SUM`, `AVERAGE` and `COUNT` now report likely type misuse while preserving Excel's distinction between direct text arguments and text contained in references. `SUM(A2)` with text in A2 is flagged as a game-help issue because Excel would ignore that text and return 0 rather than raise `#VALUE!`.
- `COUNTIF` and `SUMIF` now validate range positions and obvious criteria/data type mismatches against the current sample data. `SUMIF` also checks that the effective sum range has numeric cells.
- Added future-facing `COUNTIFS` validator support for complete range/criteria pairs, criteria-range positions and equal criteria-range dimensions. No `COUNTIFS` piece was added to the current puzzle.
- Arithmetic operators now require numeric-compatible operands and flag direct text, text references and mixed ranges containing text.
- No Astro/CSS changes were required. No movement, collision, hover, drag/drop, wrapping, token reordering, Sample Data disclosure or Submit behaviour changed.
- Validation: focused strict TypeScript compile passed; 26 representative structural/type validator cases passed; the current Astro and CSS files are unchanged from the previous Test Answer package. Full Astro build was not run because `npm ci` timed out in this sandbox.

## 2026-09-10 review patch — Formula Daily board-notes regression

- Branch base: `main`
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`
- Scope: restore Formula Daily interaction after the wood-board revision.
- Root cause: the board revision TypeScript required a `[data-board-notes]` node, but the packaged `FormulaDaily.astro` did not include that node. The initializer returned early, so no formula interactions bound and every label stayed at its default top-left position.
- Fix: add the chalk-note layer back into `FormulaDaily.astro` and make `formula-daily.ts` tolerant if that decorative node is absent again in future.
- Files changed: `src/visualisations/formula-daily/FormulaDaily.astro`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile passed; static selector/initializer checks passed. Full Astro build was not run because dependencies are not installed in the supplied snapshot and `npm ci` timed out in the sandbox.
- Next: verify locally that labels drag, click-add, drag-drop, and answer insertion all work with the wood-frame chalkboard styling intact.

## 2026-09-10 review patch — Formula Daily token polish

- Branch base: `main`
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`
- Scope: visual-only refinement of Formula Daily labels and background chalk notes.
- Removed the generic inner dashed pseudo-border from loose non-function labels. Grouped function pieces keep their intentional dashed outer group border and solid inner function/parenthesis borders.
- Placed answer tokens now use a restrained hover/focus lift and glow derived from the loose-piece affordance, with lower brightness and a smaller shadow so answer interaction is visible without competing with the loose cluster.
- Daily board notes now cycle through a deterministic pastel chalk palette (mint, blue, rose, lilac and warm cream) while retaining the existing low opacity values.
- No drag, collision, placement, answer insertion or formula logic changed.
- Files changed: `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile passed; Formula Daily stylesheet parsed with zero CSS syntax errors. Full Astro build not run because dependencies are absent from the supplied snapshot and prior sandbox installs timed out.

## 2026-09-10 review patch — placed drag highlight and chalk colour

- Branch base: `main`
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`
- Scope: Formula Daily visual feedback only.
- Placed answer tokens now retain the softer answer-token glow while their drag ghost is active, so hover-to-drag feedback stays continuous.
- Background lesson notes keep their existing low opacity but use brighter pastel chalk values plus modest saturation/brightness and a soft same-colour chalk halo so hue reads more clearly against the near-black board.
- No formula, placement, collision, answer insertion, or loose-label physics logic changed.
- Files changed: `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile passed; CSS brace balance and ZIP integrity checked. Full Astro build was not available in the sandbox because dependencies are not installed.


## 2026-09-10 review patch — placed-token size and drop continuity

- Branch base: `main`
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`
- Scope: refine dragging a placed Formula Daily token from the answer back into the loose-piece cluster.
- Placed-token drag ghosts now transition between answer-token scale and the measured loose-piece scale as they cross the answer boundary, with hysteresis to avoid rapid size flicker at the edge.
- The loose-piece dimensions are remeasured safely even while the source button is hidden, so the expansion target stays accurate after responsive layout changes.
- Dropping a placed token into the cluster now anchors the returned loose piece to the actual pointer release position instead of reusing its old cluster coordinates.
- If removing the answer token causes the floating cluster to animate because answer clearance changes, the fixed-position drag ghost remains at the release point until the cluster finishes moving, then hands off to the real loose piece at the same visual location.
- Existing cluster collision and attraction physics resume after the handoff. The returned piece starts with zero velocity rather than the old upward bounce impulse.
- Reduced-motion users receive the same state changes without animated scaling.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `src/visualisations/formula-daily/formula-daily.css`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile passed; CSS brace validation passed. Full Astro build was not run in the supplied dependency-free snapshot.

## 2026-09-10 review patch — Formula Daily canvas text selection

- Branch base: `main`
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`
- Scope: prevent rapid clicking/double-clicking inside the Formula Daily chalkboard from selecting page text.
- Revision: added `user-select: none` and the Safari-prefixed equivalent to `.formula-canvas` only. Text outside the game remains selectable and button/pointer interactions are unchanged.
- Files changed: `src/visualisations/formula-daily/formula-daily.css`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: CSS structure check and package ZIP integrity check. Full Astro build not run in the sandbox because dependencies are unavailable.

## 2026-09-10 review prototype — Sample Data dialog

- Branch base: `main`
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`
- Scope: relocate the Formula Daily sample spreadsheet from the permanent page layout into a mobile-compatible chalkboard reference dialog for user review.
- The inline sample spreadsheet above the game has been removed. A chalk-style `Sample Data` button now sits in the upper-right of the board canvas.
- Activating the button opens a native modal `<dialog>` containing the same sample spreadsheet. It includes an explicit close button, Escape support from the native dialog, backdrop-click dismissal, focus transfer to the close control, and focus return to the opener.
- The dialog is responsive down to narrow phone widths. The table retains the spreadsheet column/row structure and fits at 360px in the focused browser test without horizontal overflow.
- The answer row and loose-piece cluster are moved down within the board to reserve the upper-right control area. The mobile board base height is increased modestly so the existing cluster still has usable space. Existing drag, answer, collision and return-piece logic is unchanged.
- Files changed: `src/visualisations/formula-daily/FormulaDaily.astro`, `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile passed; CSS structure check passed; isolated Chromium checks passed at 1280px, 390px and 360px for dialog open/close, table fit, focus return and existing click-to-place initialization. Full Astro build not run because dependencies are not installed in the supplied snapshot.
- Next: review the button placement, modal size, backdrop strength and spreadsheet presentation locally before deciding if this becomes the permanent reference-data pattern.

## 2026-09-10 review prototype — persistent Sample Data reference sheet

- Branch base: `main`.
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Replaced the modal Sample Data dialog with a non-modal disclosure-style reference sheet inside the Formula Daily chalkboard.
- The sheet stays open while the player clicks, drags and builds the formula. There is no backdrop, focus trap or outside-click dismissal.
- Opening the sheet reserves vertical space inside the board and shifts the answer and loose-piece cluster down by the same amount, so the reference does not cover playable elements. Closing it returns the layout to its compact state.
- Desktop uses a right-aligned reference card beneath the Sample Data control. At narrow widths the same card becomes full-width within the board and keeps the answer visible below it.
- The toggle uses `aria-expanded`/`aria-controls`; the closed sheet is `inert` and `aria-hidden`. Escape and the internal close button close it, while ordinary game controls remain active when it is open.
- Files changed: `src/visualisations/formula-daily/FormulaDaily.astro`, `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile passed; stylesheet parsed with zero CSS syntax errors; isolated Chromium runtime checks passed at 1280px and 390px with no horizontal overflow, correct open/close accessibility state, and click-to-place remaining active while the reference sheet was open. Full Astro build not run because the supplied context snapshot does not contain installed dependencies.
- Next decision: review the reference-sheet size, board growth and classroom-test feel locally before adding further Formula Daily game logic.

## 2026-09-10 review prototype — teacher-written Sample Data

- Formula Daily now places `Build the formula.` inside the chalkboard at the top-left, with the attempt counter retained at the top-right.
- Sample Data is a centred disclosure on the board and is open by default. One `Sample Data` control with an up/down chevron replaces the separate open button and close `×` control.
- The sample spreadsheet is rendered directly on the blackboard rather than inside a card: chalk typography, faint dashed internal grid lines, no enclosing table/sheet border, and restrained pastel chalk accents for row/column headings.
- Collapsing the sample reference releases its reserved board space and shifts the answer plus loose-label cluster upward together. Opening it restores the reference space without blocking formula interaction.
- Narrow-screen styling keeps the disclosure centred, compresses the chalk grid, and preserves zero horizontal page overflow in the isolated 390px test.
- Files changed: `src/visualisations/formula-daily/FormulaDaily.astro`, `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: strict focused TypeScript compilation passed; CSS brace structure passed; isolated Chromium runtime checks at 1280px and 390px confirmed open-by-default state, disclosure collapse/reopen, no page errors, no horizontal overflow, and formula-piece click placement while Sample Data remained open. Full Astro build was not run because the supplied snapshot excludes installed dependencies.

## 2026-09-10 review prototype — compact responsive cluster and in-board actions

- Branch base: `main`
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`
- Scope: reduce Formula Daily chalkboard whitespace and make the loose-label area responsive to its actual contents.
- The loose cluster now uses a measured row-packing layout based on each visible label's width. Initial labels fill the available row width, the cluster height follows the number and arrangement of available labels, and the layout repacks when the board width changes.
- Loose pieces now retain responsive home positions rather than being attracted to one common centre. They still wander, collide and react to disturbances, but return toward their packed/drop positions so narrow layouts do not collapse into a pile.
- When answer wrapping increases the answer-cell height, the Clear/Submit/status row moves down in normal flow and the cluster follows. Available labels receive a small velocity impulse so the cluster visibly wiggles as if bumped. Reduced-motion users do not receive the impulse.
- Clear, status and Submit moved inside the board directly below the answer row and above the loose-piece cluster.
- The answer cell now uses a rounded green chalk-style border with a subtle inner dashed chalk trace instead of the square spreadsheet-selection frame.
- Sample Data uses left alignment for text fields and right alignment for numeric fields, including the matching text/numeric headers. Column letters and row numbers remain centred reference markers.
- Mobile cluster width now uses the full available board content width. The responsive pack was checked at 390px with no initial label overlaps or horizontal page overflow.
- Files changed: `src/visualisations/formula-daily/FormulaDaily.astro`, `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compilation passed; CSS brace structure passed; isolated Chromium checks passed at 1280px and 390px for initial packing, answer-wrap movement, responsive repacking, table alignment, rounded answer border, zero horizontal overflow and no runtime errors. Full Astro build was not run because the supplied snapshot does not include installed dependencies.
- Next review: judge the compact row density and mobile board height locally, then tune label spacing only if needed before changing gameplay rules.

## 2026-09-10 review patch — animated answer wrapping and overlap-safe cluster

- Branch base: `main`; base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Restored a measured pixel-height transition on the answer cell. Preview/add/remove changes now retarget a 165ms height animation instead of snapping when wrapping adds or removes a row. The answer remains clipped during the transition and vertically centred at either size.
- Answer growth still applies one disturbance impulse to the loose labels, while the resize observer no longer repeats that impulse on every intermediate animation frame.
- The responsive cluster keeps a compact initial pack, but uses a small visual safety gap and collision-safe movement so ambient wiggle cannot move settled labels into each other.
- Returning a placed token keeps the dropped token anchored at its release position and immediately relocates only conflicting loose pieces to the nearest free position. Cluster height is recalculated from actual occupied positions and grows when more room is required.
- Responsive repacking still runs when the available board width changes.
- Files changed: `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compilation passed; generated JavaScript passed `node --check`; isolated Chromium checks at 1280px and 390px confirmed smooth 66px → 86px wrap animation, smooth shrink, zero initial/post-clear label overlaps, responsive desktop/mobile repacking and no horizontal overflow. Full Astro build was not run because the supplied snapshot excludes installed dependencies.

## 2026-09-10 review patch — Formula Daily cluster motion and answer alignment

- Branch base: `main`.
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Scope: restore the loose-label physical interaction lost in the overlap-prevention pass and keep wrapped answer rows vertically aligned consistently.
- Cluster motion: restored pairwise collision impulses so dragging or disturbing one label can push neighbouring labels again. A separate positional collision resolver now runs after movement so labels can bump and move without settling on top of each other. The cluster height continues to grow from the actual moving label bounds when extra space is required.
- Answer alignment: wrapped answer content remains vertically centred by preserving symmetrical vertical space around the formula block. Answer height still transitions rather than snapping.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `src/visualisations/formula-daily/formula-daily.css`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile passed; CSS structure check and ZIP integrity check completed. Full Astro build was not run because the supplied snapshot does not include the installed dependency tree.

## 2026-09-10 review patch — hover-stable answer preview and bounded cluster return

- Branch base: `main`; base commit `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Loose labels no longer adopt arbitrary drag/drop coordinates as permanent homes. They can be moved or returned at the release point, then the spring attraction pulls them back toward their responsive packed cluster home.
- Physics is bounded vertically as well as horizontally. Ambient movement and collision separation clamp to the existing cluster field, so moving a label down cannot enlarge the board. Cluster height comes from packed home rows plus a small motion allowance. Answer growth and responsive repacking remain the mechanisms that can increase board height.
- Hovered loose labels are now temporarily pinned in viewport space while their answer preview changes the answer height. The answer/actions/other labels can shift down, but the hovered label stays under the pointer and is treated as an immovable collision body, preventing the hover/preview/height flicker loop.
- Other nearby labels still receive the answer-growth disturbance and collision impulses, so they bump around the pinned hover piece. Releasing hover returns that piece to normal floating/home attraction.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Focused browser validation confirmed the hovered preview remained active while the answer height changed, the hovered piece stayed effectively fixed in viewport space, cluster height did not grow after a bottom-edge drag, and a displaced piece floated back to its packed home.

## 2026-09-10 review patch — dynamic neighbour cluster physics

- Branch base: `main`.
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Scope: replace the per-piece fixed-home return force that caused dragged labels to fight their way back through the same neighbours and vibrate when blocked.
- Loose pieces now recalculate their nearest active neighbour continuously. A spring-like pull acts only when that neighbour is beyond a comfortable edge gap; collision separation preserves padding when pieces meet.
- The cluster also uses a weak collective gravity force toward the centroid of the current responsive packed layout. This recentres the group without making individual pieces snap back to fixed coordinates.
- Removed the permanent sinusoidal wander from the ambient physics. Velocity damping, dead zones and a sleep threshold allow the animation loop to stop once the cluster settles, avoiding endless micro-movement. User interaction, answer disturbance and return/drop events wake the physics again.
- Collision calculations now account for the small chalk-piece rotation when estimating occupied width/height, and the resolver continues across frames until separation is complete. Focused desktop and 390px tests finished with zero label overlaps.
- The SVG neighbour strings are visible again as a temporary debugging aid. Each visible link represents the current nearest-neighbour relationship used by the cluster cohesion logic; the SVG remains pointer-transparent.
- Existing hover pinning, answer-wrap animation, drag boundaries, return-drop continuity and formula behaviour are retained.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `src/visualisations/formula-daily/formula-daily.css`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile passed; emitted JavaScript syntax/runtime checks passed; isolated Chromium checks passed at 1280px and 390px with zero initial overlaps, no horizontal overflow and no runtime errors. A displaced piece settled without residual movement in the focused test. Full Astro build was not run because installed dependencies are absent from the supplied snapshot.
- Next: review the visible neighbour network locally and tune attraction/damping only if the cluster feels too loose or too eager before hiding the debug strings again.

## 2026-09-10 review patch — stable loose-label hover hit area

- Branch base: `main`; base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Fixed loose-label hover flicker at label borders. Hover activation now owns a small fixed viewport hit rectangle captured when the piece is activated instead of depending on the moving/transformed button boundary for deactivation.
- The hovered piece remains visually pinned as before, but a 5px non-visual hit tolerance stays at the original pointer target. Layout compensation or the glow/lift treatment therefore cannot immediately push the hover target away from a pointer resting on the border.
- `pointerout` only releases the preview after the pointer leaves that stable hit rectangle. A document-level pointer check also releases the state cleanly once the pointer genuinely moves away.
- Loose-label visual activation now follows the explicit `data-preview` state rather than raw CSS `:hover`, so browser hover hit-testing cannot independently flash the glow on/off. Keyboard focus styling remains unchanged.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `src/visualisations/formula-daily/formula-daily.css`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile passed; CSS brace structure passed. Isolated Chromium test held the preview active for 40/40 samples while the answer animated, with zero preview-state toggles. A boundary test kept activation 3px outside the original visual border and released it at 8px, confirming the fixed tolerance behaves independently of the visual piece. No runtime errors were reported. Full Astro build was not run because installed dependencies are absent from the supplied snapshot.

## 2026-09-10 review patch — restore live-style loose-label physics

- Branch base: `main`; base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Scope is movement behaviour only. Formula rules, Sample Data, answer wrapping, drag/drop semantics, hover hit-area behaviour and visual styling are unchanged.
- The older live `formula-daily.ts` supplied by the user was used as the movement reference. Its useful characteristics are collision-led movement, `.035` collision force and `.91` damping, with no permanent per-piece snap-back destination.
- Responsive packed coordinates now define initial layout and cluster height only. A moved piece does not try to recover its old slot.
- Displaced pieces enter a temporary `seeking` state. While seeking, each piece recalculates its nearest active neighbour every frame and pulls mostly toward that neighbour with a smaller pull toward the live cluster centroid. Once it rejoins the local cluster spacing, seeking turns off.
- Dragging, answer disturbance and moving answer-token returns can wake nearby pieces. Pairwise collision impulses transfer motion through the cluster, while a positional-only collision pass prevents the overlap resolver from adding a second competing impulse.
- Movement uses three short integration substeps per frame to reduce pieces tunnelling through each other at speed. Existing bounds remain unchanged.
- Idle freshly packed labels no longer run ambient physics merely because the page is visible. Damping and the existing sleep threshold stop motion after interaction settles, avoiding perpetual micro-movement.
- Debug nearest-neighbour connector lines remain visible for the current review stage.
- Cluster hover styling was not changed in this patch; loose labels continue to use the current glow/shadow treatment without a hover translation transform.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compilation passed. Isolated Chromium checks at 1280px and 390px reported no runtime errors, no horizontal overflow, no oriented-rectangle overlaps in the initial cluster or after the focused drag test, 20 visible neighbour links, and zero hovered-piece positional drift after activation. Dragging `COUNTIF(` through the cluster moved multiple neighbouring pieces, confirming collision propagation remains active. Full Astro build was not run because the supplied snapshot does not include installed dependencies.

## 2026-09-10 review patch - Formula Daily live-physics correction

- Branch base: `main`.
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Scope is limited to loose-label movement physics. No Astro markup, CSS, Sample Data, answer layout, formula rules, or placement behaviour changes are included.
- Correction to the previous package: the ZIP did contain the TypeScript described in its handoff, but that TypeScript was not faithful enough to the supplied live build. It introduced a `seeking` state and nearest-neighbour return rule that do not exist in the live reference and could stop centre attraction too early.
- The revised movement loop now follows the supplied live implementation directly: weak per-piece pull toward the cluster-field centre (`.0007`), small organic drift while motion is active (`.004`), collision impulse (`.035`), and frame damping (`.91`).
- The permanent `seeking` and fixed-return behaviour has been removed. Labels do not own a movement destination after the initial responsive pack.
- To avoid the live build's perpetual animation, direct interaction supplies temporary cluster energy. That energy decays at `.982` per frame and collisions do not replenish it, so cascades wind down instead of restarting themselves indefinitely.
- Collision padding is 10px. A positional-only separation pass runs alongside the velocity impulse so labels cannot remain physically overlapped after the motion settles. The separation pass adds no velocity.
- Existing hover pinning remains intact so answer-preview resizing cannot move the active hovered label out from under the pointer. No hover translation or scale was added.
- Existing nearest-neighbour connector lines remain visible as a temporary physics-debug aid.
- Validation: focused strict TypeScript compile passed and emitted JavaScript passed `node --check`. A representative numeric simulation of the same force/damping rules settled with no overlaps. Full Astro/browser validation was not available in this sandbox.

## 2026-09-10 review correction — restore live loose-label physics directly

- Branch base: `main`; base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Supersedes the previous neighbour-seeking and finite-energy physics attempts. Those implementations did not reproduce the supplied live build closely enough.
- The user supplied the live Formula Daily TypeScript, CSS and Astro files and requested that only loose-label movement behaviour be restored from that reference.
- Loose-label movement now follows the live TypeScript loop directly: every free piece receives a weak centre pull (`.0007`) plus the original small sinusoidal drift (`.004`), pairwise overlap applies the original `.035` velocity impulse, velocities damp by `.91`, and positions clamp to the current cluster field bounds.
- Removed the current physics loop's energy gating, maximum-speed limiter, sleep threshold, multi-step integration and positional overlap resolver from active movement. In particular, pieces are no longer snapped apart after collision, which was causing the visible jump above a dragged piece.
- Current responsive packing remains only the initial/responsive arrangement. Packed `homeX/homeY` values are not used as movement destinations. Nearest-neighbour calculations remain for the visible debug connector lines only, matching the role they had in the supplied live TypeScript.
- Current constrained board dragging, answer insertion/reordering, placed-token size transition, Sample Data, animated answer wrapping and board layout are retained. Hover pinning is retained only to prevent the previously fixed wrap-hover feedback loop.
- Hover activation no longer shifts a rotated loose label on entry: the hover pin stores the piece transform anchor rather than the rotated `getBoundingClientRect()` top-left. Visual hover remains glow/shadow only; no loose-label hover transform was added.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compilation passed and emitted JavaScript passed `node --check`. Direct browser execution could not be completed because this sandbox blocks local/file preview navigation.
- Next review: compare the loose-label movement locally against the live site. Keep the visible connector lines until the movement feel is approved.

## 2026-09-10 review prototype — extra vertical cluster breathing room

- Branch base: `main`; base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- Scope is limited to cluster sizing. The restored live-style movement equations, collision force, damping, hover behaviour, drag/drop semantics, Sample Data and answer layout are unchanged.
- The cluster now reserves symmetric vertical breathing room above and below its packed rows. The reserve is calculated from the current number of available labels and packed row count, with a bounded 28px to 52px inset per side.
- This gives collision-driven labels somewhere to slide north/south when a dragged piece enters the middle, instead of immediately pinning surrounding pieces against the field edges.
- The extra room is established by the responsive packing/sizing pass, not by moving labels during physics. Centre gravity therefore still targets the live cluster-field centre exactly as in the restored live movement model.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused strict TypeScript compile and ZIP integrity check. Full Astro build not run because installed dependencies are absent from the supplied snapshot.
- Next review: test middle-of-cluster drags locally. If labels still stack under sustained pressure, adjust collision escape behaviour separately rather than changing the restored live movement equations.
## 2026-09-10 review prototype - Formula Daily Test Answer

- Branch base: `main`; base commit: `094e8f7dc859a9f6b76dd30c5acd904bf1062187`.
- Added a native `Test Answer` button immediately left of Submit, grouped with Submit so the existing three-column action layout remains intact.
- The control uses muted orange chalk styling at reduced opacity and becomes fully prominent on hover or keyboard focus. Reduced-motion mode removes its visual transition.
- Added token-aware structural validation using the existing ordered `placedIds` and piece `kind`/`value` model. It does not evaluate spreadsheet data or compare the answer with a target result.
- Checks cover empty answers, bracket matching/nesting, empty or misplaced comma arguments, malformed operators, misplaced equals signs, adjacent expression pieces, incomplete endings and function argument counts.
- Current function signatures recognised by the prototype: `SUM`/`COUNT`/`AVERAGE` require at least one argument, `SUMIF` accepts two or three, and `COUNTIF` requires two.
- Feedback is sent through the existing `role="status"` / `aria-live="polite"` message area. Test Answer does not increment the five prototype submissions.
- No future scoring penalty or `hasTestedAnswer` state was added because the current prototype has no scoring architecture that needs it yet.
- Regression scope excludes loose-label movement, collision behaviour, drag boundaries, hover locking, answer wrapping, token reordering, grouped function appearance and Sample Data behaviour.
- Validation: focused strict TypeScript compile passed; 18 representative validator cases passed; CSS brace validation and static Test Answer wiring checks passed. Full Astro build and browser/mobile runtime checks were not run because `npm ci` timed out and did not install the project dependencies in this sandbox.


## 2026-09-10 review correction - Formula Daily Test Answer error feedback

- Branch base: `main`; base commit: `094e8f7dc859a9f6b76dd30c5acd904bf1062187`, using the reviewed Test Answer type-check package as the working baseline layered on that snapshot.
- Test Answer now flags supported syntax/structure problems and Excel-style evaluation errors only. It no longer warns about formulas that Excel accepts but that are likely to return zero/no match for the current sample data.
- `COUNTIF(B2:B5, "East")`, `COUNTIF(A2:A5, 12)`, `SUM(A2)`, `COUNT(A2)` and a text-only `SUMIF` sum range are allowed by the pre-check.
- Current terse issue categories are `Bracket error`, `Argument error`, `Syntax error`, `Operator error`, `#VALUE!` and `#DIV/0!`. The status area does not reveal the exact correction.
- Each issue now stores implicated placed-piece IDs. Hover/focus on the error category shows a short generic tooltip and highlights those placed tokens red; touch/click can toggle the same hint/highlight. Empty formula remains a direct build-first message.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `src/visualisations/formula-daily/formula-daily.css`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.
- No Astro markup, loose-label movement, collision behaviour, drag/reorder behaviour, answer wrapping, Sample Data or scoring logic changed.
- Validation: focused strict TypeScript compile and generated-JavaScript syntax check passed. Focused validator cases cover accepted no-match formulas, `#VALUE!`, `#DIV/0!`, argument errors, bracket errors, operator errors, syntax errors and implicated token IDs. Full Astro/browser QA remains to be run locally.
- Next review: test the amount of information exposed by the error categories/tooltips, the red target highlighting, and touch behaviour before adding further Excel error classes.

## 2026-09-10 review patch - Test Answer hazard highlighting and tooltip placement

- Branch base: `main`; base commit: `094e8f7dc859a9f6b76dd30c5acd904bf1062187`, using the reviewed Test Answer error-feedback package as the working baseline layered on that snapshot.
- Error feedback now uses a separate bright error red rather than the softer red assigned to normal range pieces.
- When an error category is hovered, keyboard-focused or touch-pinned, implicated answer tokens retain their existing targeting behaviour but now show translucent diagonal hazard bands alternating bright red and black, plus a brighter border/text treatment. The bands remain transparent enough to keep token text readable.
- The short error explanation tooltip now opens below the `Test found:` line instead of above it, so it no longer covers the answer cell.
- No validator rules, TypeScript logic, Astro markup, formula interaction, loose-label physics, answer behaviour, Sample Data or scoring logic changed.
- Files changed: `src/visualisations/formula-daily/formula-daily.css`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.
- Validation: CSS brace balance and focused selector checks passed. Full Astro/browser QA remains a local visual check because installed dependencies are absent from the supplied snapshot.
- Next review: check stripe strength/readability on range, value, syntax and grouped-function tokens at desktop and mobile widths.

## 2026-09-10 review patch - multi-error Test Answer reporting

- Branch base: `main`; base commit: `094e8f7dc859a9f6b76dd30c5acd904bf1062187`, using the reviewed Test Answer hazard-tooltip package as the working baseline layered on that snapshot.
- Test Answer now reports all currently detectable validator findings instead of returning only the first issue.
- Findings are de-duplicated by category plus implicated token set, sorted left to right, and rendered as separate red interactive links after `Test found:`. Two links use `and`; three or more use Oxford-comma punctuation.
- Each link retains its own implicated token IDs. Hover/focus highlights only that error's tokens. Touch/click pins one error at a time and switching links updates the hazard highlight to the selected finding.
- Structural validation now collects bracket, argument, operator and adjacency issues independently. Type/function validation can continue after a recoverable earlier function-level issue, allowing multiple categories in the same formula to be reported together.
- Successful Test Answer copy is now `No test errors found. Ready to submit.`
- No CSS or Astro changes were required. Formula interaction, loose-label movement, collision behaviour, drag/reorder behaviour, answer wrapping, Sample Data and scoring remain unchanged.
- Validation: focused strict TypeScript compile passed, emitted JavaScript passed `node --check`, 22 prior regression validator cases passed, and dedicated multi-error/Oxford-comma tests passed. Full Astro/browser QA remains to be run locally because dependencies are not present in the supplied snapshot.
- Next review: test formulas containing two to four independent failures, especially repeated categories, and check status-line wrapping on mobile before expanding the Excel error checklist.


## 2026-09-10 review patch - Test Answer tooltip stacking

- Branch base: `main`; base commit: `094e8f7dc859a9f6b76dd30c5acd904bf1062187`, using the latest reviewed Test Answer error-semantics package as the working baseline layered on that snapshot.
- Raised the Formula Daily action/status stacking layer above the loose-label cluster so an open Test Answer error tooltip paints over loose formula pieces rather than being obscured by them.
- Raised the tooltip's local `z-index` within that action layer for an explicit internal ordering.
- Tooltip placement remains below `Test found:`. Error targeting, hover/focus/touch behaviour, hazard highlighting, validation rules, label movement, collision physics, drag/drop, answer layout and scoring are unchanged.
- Files changed: `src/visualisations/formula-daily/formula-daily.css`, `docs/current-handoff.md`, `docs/exec-plans/active/005-formula-daily.md`.
- Validation: focused CSS structure/stacking checks and ZIP integrity check. Full Astro/browser QA remains for local review because installed dependencies are absent from the supplied snapshot.
- Next review: confirm locally that tooltips remain readable above loose labels at desktop and narrow mobile widths.

## 2026-09-10 review patch - hidden neighbour strings and quieter status feedback

- Branch base: `main`; base commit: `094e8f7dc859a9f6b76dd30c5acd904bf1062187`, with the latest reviewed Formula Daily Test Answer patches layered on that snapshot.
- The dashed nearest-neighbour connector SVG is now visually hidden in CSS. Its SVG generation and neighbour/physics logic are unchanged.
- Routine status narration was removed for answer selection, piece add/remove/rejoin/reorder actions and Clear. Formula changes silently clear stale Test Answer feedback instead.
- Test Answer results, the build-a-formula prompt, and Submit/attempt feedback remain in the status live region.
- Files changed: `src/visualisations/formula-daily/FormulaDaily.astro`, `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.
- Validation: focused strict TypeScript compile, CSS structure/static selector checks, routine-status string checks and package integrity. Full Astro/browser QA remains local because the supplied context snapshot excludes installed dependencies.

## Formula Daily current review state - permanent equals marker

- Base remains `main` at `d4dd2985834e5d184a50b0c17d66c713c684d72b`; this review patch layers on the explicit Function Help pin-state patch.
- Function Help now uses a grey/red pushpin icon beside the reveal-cost text instead of textual pin/unpin links.
- The question copy is `Total units sold in East`; a permanent white `=` now occupies the left edge of the answer cell. All user tokens and wrapped continuation rows are laid out to its right.
- The loose `=` cluster piece remains available as a comparison/red-herring token. It is no longer treated as a leading formula marker by Test Answer because the permanent marker supplies that role.
- Attempting to manipulate the permanent marker produces a temporary red/black hazard warning and a short `Formulas always begin with =` tooltip. The warning timer is controlled by `FORMULA_MARKER_WARNING_MS` (2200 ms).
- Local browser review should check answer wrapping on desktop/mobile, permanent-marker warning placement, and Help pin icon clarity.

## Formula Daily current review state - compact answer row

- Base remains `main` at `d4dd2985834e5d184a50b0c17d66c713c684d72b`, with the reviewed permanent `=` and Help pin-icon work layered on top.
- The permanent-marker warning no longer names Excel; it reads `Formulas always begin with =. This first sign stays in place.`
- The answer cell now targets a 44px single-row height and grows only from actual wrapped formula rows. The height synchroniser measures the formula flex box instead of `scrollHeight`, so the hidden marker tooltip cannot inflate the cell.
- The permanent `=` gutter, wrapped-row alignment and existing interaction logic are unchanged.
- Local review should confirm single-row compactness plus two-row wrapping on desktop and mobile.

### 2026-09-11 Formula Daily review patch - answer layout hierarchy

- Base remains `main` at `d4dd2985834e5d184a50b0c17d66c713c684d72b`, with reviewed Formula Daily patches layered on top.
- Problem statement now sits above the answer cell with larger chalk text.
- Answer entry now spans the available inner board width instead of the previous 820px cap.
- Answer cell uses 10px padding on all sides and a 58px single-row minimum, while existing flex wrapping and permanent `=` gutter continue to control multi-row growth.
- Changed files: `src/visualisations/formula-daily/formula-daily.css`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.

## 2026-09-11 review patch - centred prompt and aligned answer actions

- Branch base: `main`; base commit: `d4dd2985834e5d184a50b0c17d66c713c684d72b`, with the reviewed full-width answer patch as the working baseline.
- Centred the problem statement above the answer cell, increased its chalk text size slightly, and increased the vertical gap before the answer field.
- Made the action footer full width instead of retaining the old 820px cap, so Clear aligns with the answer cell's left edge and the Help/Test Answer/Submit group aligns with its right edge.
- Changed the answer cell's outer green border from solid to a thicker 3px dashed chalk line. The former faint inner dashed line is now a subtle solid inset so the border treatment does not become visually double-dashed.
- No Astro or TypeScript changes were required. Permanent `=` behaviour, answer wrapping, Help/Test/Submit logic, loose-label physics and scoring state are unchanged.
- Validation: CSS parse/selector checks, whitespace checks and ZIP integrity. Full Astro/browser QA remains for local review because installed dependencies are absent from the supplied snapshot.

## 2026-09-11 review patch - pinned Help cluster avoidance

- Base remains `main` at `d4dd2985834e5d184a50b0c17d66c713c684d72b`, with the reviewed Formula Daily patches layered on top.
- Function Help now opens below Help and is clamped into the right side of the loose-label cluster.
- Only pinned Help affects label movement: loose pieces receive a leftward nudge/soft-obstacle force and drift into the free area left of the panel. Unpinned hover/focus previews leave the cluster untouched.
- Explicit unpin from Help or the panel pushpin closes immediately. A never-pinned hover preview keeps the existing delayed close behaviour.
- Changed files: `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.
- Local review should focus on pinned-panel avoidance on desktop and touch/mobile widths, plus the natural return of pieces after unpinning.

## 2026-09-11 Formula Daily current review state - explicit Help purchase

- Base is `main` at `d4dd2985834e5d184a50b0c17d66c713c684d72b`, with reviewed Formula Daily patches layered on top.
- Before purchase, Function Help links are grey but remain keyboard/touch actionable. Activating one flashes the current purchase prompt rather than buying Help or revealing its guide.
- The purchase area is centred in the Help panel. It shows the five-second first-use explanation initially, then `Reveal Help? (-50% points)`, with a larger red underlined `Buy` control beneath it.
- Only `Buy` purchases Help. After purchase, function links return to green and work as guide selectors. The configured percentage still comes from `HELP_SCORE_PENALTY_PERCENT`.
- Changed files: `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.
- Validation: focused strict TypeScript compilation passed, emitted JavaScript passed `node --check`, CSS parsed with zero syntax errors, focused locked-link/purchase/flash assertions passed. Full Astro build was not run because installed dependencies are absent from the supplied snapshot.

## 2026-09-11 Formula Daily current review state - Help Buy click fix

- Base is `main` at `d4dd2985834e5d184a50b0c17d66c713c684d72b`, with reviewed Formula Daily patches layered on top.
- `Buy` now binds directly to the existing Help purchase action when the button is rendered. The delegated purchase listener on the Help detail container was removed.
- No visual, scoring, Help pinning, panel positioning, cluster physics or Test Answer behaviour changed.
- Validation: strict TypeScript compile and emitted JavaScript syntax check passed. Local desktop/mobile click confirmation remains the next review step.
## 2026-09-11 review patch - Help Buy focus/rerender fix and score allowance

- Base remains `main` at `d4dd2985834e5d184a50b0c17d66c713c684d72b`, with the reviewed explicit Help purchase and responsive Help patches layered on top.
- Root cause of the non-working `Buy` control: focusing the dynamically rendered Buy button bubbled `focusin` to the Help panel. The panel's `focusin` handler called `openHelpPanel()`, which rerendered `helpDetail` and replaced the focused Buy element before the subsequent click/tap activation could complete.
- `openHelpPanel()` no longer rerenders Help detail. Entering or focusing within an already-open Help panel now only cancels the close timer. State-changing actions such as the first-use prompt, function selection and purchase remain responsible for explicit rerenders.
- The direct native Buy click listener remains. With the focus-triggered rerender removed, mouse, touch and keyboard activation all reach `purchaseHelp()`.
- Help purchase now applies the configured penalty to a real per-question maximum-score allowance. The question starts at 100% maximum score; buying Help once subtracts `HELP_SCORE_PENALTY_PERCENT` and records the result on `data-max-score-percent` in addition to the existing Help-use/penalty attributes. With the current 50% setting the allowance becomes 50%.
- The `helpPurchased` guard prevents duplicate deductions, and Clear does not restore the spent Help allowance. The prototype still does not award a final numeric score, so future scoring should consume this maximum-score percentage rather than reapply the Help penalty.
- Browser regression harness using the emitted current script reproduced the old failure and verified the fix: before the patch, activating Buy left Help locked; after the patch, desktop click and mobile tap set Help used, store a 50% penalty, reduce maximum score to 50%, remove Buy and render the active Help state.

## 2026-09-11 Formula Daily current review state - persistent Help purchase

- Base is `main` at `d4dd2985834e5d184a50b0c17d66c713c684d72b`; the supplied context records the Formula Daily working tree as dirty and the unrelated local-server scripts remain untouched.
- Current question ID is `total-units-sold-east-v1`. Function Help purchase is stored per question in `localStorage`, including the penalty paid and resulting maximum-score percentage, so refresh no longer refunds Help for this question.
- Help function selectors are rounded buttons with larger text and mobile touch targets. Buy is also a rounded red button.
- Purchased Help shows a small grey Reset control in the panel bottom-right. Reset clears only this question's persisted Help state, restores 100% maximum score and relocks Help for prototype testing.
- Clear still clears only the formula answer and does not refund Help. Future questions must receive their own stable `data-question-id` so their Help state remains independent.
- Validation completed: strict TypeScript compile, emitted JavaScript syntax, CSS/static selector checks, per-question storage-key assertions, Reset-state assertions, whitespace/EOF checks and package integrity. A full Astro build and real browser refresh cycle were not completed in this environment.

## 2026-09-11 Formula Daily points prototype

- Current Formula Daily working tree now shows `Points 100 / 100` above Attempt and uses a hidden exact 100-point pool per question.
- Non-empty Submit still does not check answer correctness. For this prototype it consumes a failed attempt and deducts exact points by dividing the remaining pool across the remaining attempts, guaranteeing zero after attempt five.
- Help purchases deduct the configured percentage from the current point pool. Help, attempts and exact points persist per stable question ID across refreshes.
- Empty Submit is blocked with no point/attempt loss and briefly flashes the placeholder plus Submit using the error/hazard treatment.
- Files changed in this patch: `src/visualisations/formula-daily/FormulaDaily.astro`, `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.
- Base branch/commit: `main` / `d4dd2985834e5d184a50b0c17d66c713c684d72b`.
- Next review: local visual test of the new score line and empty-submit flash, then tune scoring only after the interaction feels right.
## 2026-09-11 Formula Daily - full question Reset

- Branch/base: `main` at `d4dd2985834e5d184a50b0c17d66c713c684d72b`; current Formula Daily work remains reviewed but uncommitted in the supplied snapshot.
- Formula Daily starts at 100 points when no per-question storage exists. A restored 50 / 100 state is expected after a previously purchased 50% Help unlock because score and Help are persisted for this question.
- The Help popup `Reset` now clears this question's Help and score storage and restores first-load state: 100 / 100 points, Attempt 0 / 5, Help locked, empty answer, cleared transient warnings/status, and the loose labels repacked to their initial cluster.
- Reset no longer preserves attempts and no longer recomputes a partial no-Help score. It removes the stored state entirely so refresh after Reset also starts from 100 / 100.
- Files changed: `src/visualisations/formula-daily/FormulaDaily.astro`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.
- Unrelated `scripts/start-local-server.ps1` and `start-local-server.bat` in the supplied dirty snapshot remain untouched.

## 2026-09-11 Formula Daily scroll/drag input fix

- Base: `main` at `b03044876f67df46cac05a160aeaf5854d64e828`; supplied snapshot was clean.
- Loose labels no longer stay viewport-pinned when desktop wheel/page scrolling starts. Scroll releases the hover lock/preview, and non-primary mouse buttons cannot start a label drag.
- Mobile loose-label/cluster surfaces now allow native vertical page panning with `touch-action: pan-y`. Touch label dragging waits for a clear horizontal-leading gesture before pointer capture/preventDefault; vertical-leading gestures remain page scrolls and cannot accidentally place the label.
- Existing cluster physics and game systems are unchanged.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `src/visualisations/formula-daily/formula-daily.css`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.
- Validation: strict standalone TypeScript compilation passed for both baseline and patch; focused static/CSS checks passed. Full Astro build not run because dependency installation timed out in this environment.
- Next local check: desktop wheel scrolling with the pointer resting on a loose label; mobile vertical swipe beginning directly on a loose label; deliberate mobile label drag beginning with a sideways movement.

## 2026-09-11 review patch - mobile touch drag tuning and active-drag highlight

- Base remains `main` at `b03044876f67df46cac05a160aeaf5854d64e828`, with the reviewed cluster scroll-versus-drag patch layered on top.
- Mobile loose-label drag activation is slightly more eager: the touch drag threshold is reduced from 10px to 8px. Native vertical scrolling still claims clear vertical gestures from 6px, but now requires a modest 1.2x vertical-over-horizontal bias before the game locks the gesture as scroll intent.
- This keeps ordinary vertical swipes available while making short sideways/diagonal label gestures enter drag mode sooner.
- The existing desktop hover glow is now also applied while a loose label is actively dragging. Because `data-dragging` is set only after touch arbitration has committed to a label drag, a normal touch scroll does not show the label highlight.
- No answer placement, collision, centre-seeking, Help, scoring, validator, Sample Data or Chalk behaviour changed.
- Local review should focus on repeated mobile gestures: vertical swipes over labels should scroll without glow, while short intentional label moves should activate sooner and show the glow as soon as drag mode begins.

## 2026-09-11 Formula Daily - mobile drag-ready feedback

- Base: `main` at `b03044876f67df46cac05a160aeaf5854d64e828`, with the reviewed scroll/drag fixes layered on top.
- Mobile loose labels now show a pre-drag glow at a small horizontal-leading movement threshold before the label itself begins moving. Vertical page-scroll gestures remain unhighlighted.
- Drag-ready threshold is 4px; actual touch drag begins at 7px; clear vertical scroll intent still starts from 6px.
- No scroll-lock fallback UI was added.
- Changed files: `src/visualisations/formula-daily/formula-daily.ts`, `src/visualisations/formula-daily/formula-daily.css`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.
- Next review: real-device feel of the ready threshold and false-positive rate while scrolling.

## 2026-09-11 Formula Daily current review state - live mobile scroll thumb

- Base remains `main` at `b03044876f67df46cac05a160aeaf5854d64e828`, with the reviewed direct mobile drag and temporary page-scroll thumb patch layered on top.
- Root cause of the laggy custom thumb was the site-wide `html { scroll-behavior: smooth; }`. The thumb used `window.scrollTo(..., behavior: 'auto')`, so each pointer movement inherited smooth scrolling and the viewport chased the finger instead of tracking it immediately.
- Thumb dragging now uses `behavior: 'instant'`, so each pointer movement maps directly to the corresponding page position without starting a smooth-scroll animation.
- While the thumb is actively dragged, its pointer position is authoritative. The normal `scrollY` synchroniser no longer repositions the thumb mid-drag, preventing feedback/jitter between pointer movement and scroll events.
- On release, the thumb performs one final sync from the actual page position, then keeps the existing roughly three-second visibility timeout.
- Left-handed placement, direct loose-label dragging, desktop wheel-scroll handling, scoring, Help, Test Answer and cluster physics are unchanged.

## 2026-09-11 Formula Daily - touch capability, Options and Tips patch

- Base branch/commit: `main` at `b03044876f67df46cac05a160aeaf5854d64e828` with the reviewed live touch-scroll-thumb patch layered on top.
- Touch-specific controls now use detected touch capability/input rather than the 720px viewport breakpoint. Automatic detection uses `navigator.maxTouchPoints`, `(any-pointer: coarse)`, and observed touch pointer input. Width remains responsible only for responsive layout decisions.
- Added a persistent Touch Mode override. Default state follows automatic detection; forcing it on keeps touch controls active at wide viewport sizes; forcing it off suppresses touch-only controls. Reset clears the override and returns to automatic detection.
- Added an Options popup above Points/Attempt containing Chalk, Left, Touch Mode and an always-visible full-question Reset. Left and Chalk persistence remain unchanged.
- Player-facing Help terminology is now Tips / Function Tips / Tips active. Existing Help storage keys remain in place so previous purchases continue to restore correctly.
- Reset moved from the Tips panel into Options and still resets the full current question, now including Touch Mode override.
- Intended changed files: `FormulaDaily.astro`, `formula-daily.css`, `formula-daily.ts`, this handoff and `005-formula-daily.md`.
- Local review focus: wide touch emulation should retain the custom scroll thumb and direct touch drag; non-touch wide desktop should keep Touch Mode off by default; Options should fit inside the board at narrow widths; Tips purchase persistence should survive the terminology change.
## 2026-09-11 Formula Daily - touch tip and global scroll-thumb availability

- Base branch/commit: `main` at `b03044876f67df46cac05a160aeaf5854d64e828`, using the reviewed Touch Mode / Options / Tips patch as the working baseline.
- Added a low-emphasis touch troubleshooting tip in the cluster. Its Options link scrolls to and opens Options, then highlights Touch Mode. That highlight is cleared whenever Options closes and is not shown when Options is opened normally.
- The touch scroll thumb now appears for any touch interaction on the page when Touch Mode is active, not only touches that start in the cluster.
- Scroll-thumb opacity is now stateful: 50% idle, 100% while dragged, then a gradual return to 50% across the existing three-second cooldown before hide.
- No scoring, Tips purchase, answer validation, label physics or page-scroll ratio logic changed.
- Files changed: `FormulaDaily.astro`, `formula-daily.css`, `formula-daily.ts`, this handoff and `005-formula-daily.md`.
- Local review focus: tap around the page at wide and narrow touch viewports, verify the thumb appears consistently, verify the fade after thumb use, and verify only the cluster-tip Options link highlights Touch Mode.

## 2026-09-11 review patch - touch tip visibility and scroll-thumb states

- Base remains `main` at `b03044876f67df46cac05a160aeaf5854d64e828`, with the reviewed Touch Mode / Options and global touch-scroll-thumb patches layered on top.
- The cluster troubleshooting tip is now shown only while effective Touch Mode is off. Automatic touch detection or a player-forced Touch Mode setting hides it; forcing Touch Mode off makes it available again.
- Added visible spacing before the inline `Options` link so the tip reads naturally.
- Touch scroll thumb idle opacity is now 30%. Hover, keyboard focus, or active dragging transitions it to 100% over 500ms.
- The thumb now uses a solid pastel-orange fill at full prominence rather than a transparent dark fill. Its grip SVG is explicitly centred with grid layout and block SVG rendering.
- After hover/use ends, the existing three-second cooldown fades the thumb from 100% toward 30% before hiding. Hovering it cancels the pending hide; leaving it restarts the cooldown when no touch/drag remains.
- Reduced-motion mode disables the new thumb transitions. Scroll mapping, Left mode, Touch Mode detection and label-drag behaviour are unchanged.

## 2026-09-11 Formula Daily - Options preferences and scroll-thumb fade fix

- Base remains `main` at `b03044876f67df46cac05a160aeaf5854d64e828`, with the reviewed Touch Mode / Options / Tips and touch-scroll patches layered on top.
- Options labels are now `Chalk Font` and `Left Handed Mode`. Added persistent `Disable Touch Mode Tip` and `Clean Background` switches, both defaulting off. Full question Reset clears both preferences back to off.
- `Disable Touch Mode Tip` suppresses the cluster troubleshooting tip even when Touch Mode is off. The tip remains automatically hidden whenever effective Touch Mode is on.
- `Clean Background` hides the faint board-note tips and removes the inner chalkboard texture/glare so the board surface is plain black while retaining the wooden frame.
- Reset now sits below the switch list, and the Options panel/switch rows were widened/aligned for the longer labels.
- Touch scroll thumb width is reduced from 46px to 35px. Idle opacity is 30%; active hover/focus/drag reaches 100% over 500ms with a lighter pastel-orange fill. The three-second cooldown fades back to 30% before hide.
- Removed sticky touch-hover as an active-state source. Non-touch hover is tracked explicitly in JavaScript, and touch release clears focus, fixing the state where the thumb could remain at 100% for the rest of the session.
- Any page scroll while Touch Mode is active wakes a hidden thumb at its idle 30% state and restarts the existing dismissal timing.
- Files changed: `src/visualisations/formula-daily/FormulaDaily.astro`, `src/visualisations/formula-daily/formula-daily.css`, `src/visualisations/formula-daily/formula-daily.ts`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.

## 2026-09-11 Formula Daily - dependent Touch Mode tip option

- Base: `main` at `b03044876f67df46cac05a160aeaf5854d64e828`, with the reviewed Formula Daily touch/Options patches layered on top.
- `Disable Touch Mode Tip` is now enabled only when effective Touch Mode is off. While Touch Mode is active, the switch is forced off, disabled and greyed out.
- If Touch Mode turns on while the tip-disable preference is stored as on, the preference is cleared from local storage. Turning Touch Mode off makes the option usable again in its off state.
- Automatic Touch Mode activation from real touch input now uses the same rendering path as capability detection and manual override so dependent Options remain synchronized.
- Files changed: `src/visualisations/formula-daily/formula-daily.ts`, `src/visualisations/formula-daily/formula-daily.css`, `docs/ux-accessibility-features.md`, `docs/exec-plans/active/005-formula-daily.md`, `docs/current-handoff.md`.

## 2026-09-11 Formula Daily - Touch option nesting and Tips layout safeguards

- Base remains `main` at `b03044876f67df46cac05a160aeaf5854d64e828`, with the reviewed Formula Daily Options/touch patches layered on top.
- Options now orders Touch Mode before its dependent controls. Left Handed Mode and Disable Touch Mode Tip are indented beneath it; Chalk Font and Clean Background remain top-level.
- Left Handed Mode is enabled only while Touch Mode is active. Turning Touch Mode off forces Left Handed Mode off, disables/greys it and clears the persisted left-side preference. Turning Touch Mode back on leaves Left Handed Mode off until the player enables it again.
- Stacked/vertical pinned Tips now expands the loose-label canvas vertically so labels retain their normal cluster room below the panel.
- Horizontal pinned Tips now lets the cluster use the wider board area and caps the Tips width when necessary so loose labels retain at least half of the available canvas width.
- Changed files: `FormulaDaily.astro`, `formula-daily.css`, `formula-daily.ts`, `docs/ux-accessibility-features.md`, `005-formula-daily.md`, and this handoff.
- Local review focus: toggle Touch Mode on/off with Left Handed Mode enabled; pin Tips around the 720px layout boundary; verify stacked mode gains vertical canvas space and horizontal mode never leaves the loose cluster narrower than roughly half the available width.

## 2026-09-11 Formula Daily - progress HUD and answer-token removal fix

- Base: `main` at `b03044876f67df46cac05a160aeaf5854d64e828`, with the reviewed Touch Mode/Tips layout patch layered on top.
- Sample Data now starts lower in the board, leaving a dedicated header gutter for Options and progress so the spreadsheet no longer overlaps the top-right controls.
- Progress is consolidated into one line: `Question 1 / 5 | Attempt 0 / 5 | Points 100 / 100`, with the changing values in bright chalk. The current question value is wired as explicit state but remains 1 until the five-question loop is implemented.
- Placed-token pointer removal now suppresses the browser's immediate follow-up click regardless of which newly rendered token ends up under the pointer. This prevents one click, especially on a leading function token, from cascading into removal of additional answer pieces.
- Files changed: `FormulaDaily.astro`, `formula-daily.css`, `formula-daily.ts`, `docs/ux-accessibility-features.md`, `005-formula-daily.md`, and `docs/current-handoff.md`.


## 2026-09-12 Formula Daily - mass and release inertia review patch

- Base branch/commit remains `main` at `b9f4ae9a8c41e11eaaeebf37f80c05be0e71bfee`, with the approved answer-cell drag ceiling and silent wall visuals layered on top in this ChatGPT workstream.
- Loose labels now keep release momentum after a drag instead of resetting velocity to zero. Pointer movement is sampled and smoothed during the drag, then transferred to the released loose label with a capped throw speed.
- Rendered label width controls bounded mass. Wider labels react less to attraction, Help displacement and collision forces, while mass-aware damping lets them retain motion longer.
- Label collisions now transfer momentum with mass-weighted response. Loose labels also rebound softly from cluster walls, with heavier labels bouncing less. Wall contact remains visually silent.
- A placed token dragged back into the cluster receives the same inertia model after it returns to loose-label size. Answer placement and answer reordering do not add inertial movement.
- Reduced-motion behaviour remains direct and functional without post-release glide.
- Changed files: `src/visualisations/formula-daily/formula-daily.ts`, `docs/exec-plans/active/005-formula-daily.md`, `docs/ux-accessibility-features.md`, `docs/current-handoff.md`.
- Validation: focused strict DOM TypeScript compilation passes, emitted JavaScript passes `node --check`, and static tuning checks confirm width increases mass and damping while reducing throw transfer and wall rebound. `npm run build` was attempted but Astro is unavailable because the supplied context snapshot excludes installed dependencies. Final package still needs local browser feel testing for mouse and Touch Mode, especially throw distance, heavy-versus-light feel, chain collisions and wall rebound.
- Next review decision: tune the four physics feel controls only if needed after play-testing. Do not add spin or new visual effects until this translational physics pass is accepted.

## 2026-09-15 Auto Swipe magnetic fog follow-up

- Base remains `main` at `7302dabaf342344d1e222bbf97b6e01b8f380c0d`, using the previously delivered homepage Apple accessibility and Auto Swipe refinements as the working baseline.
- Reworked the fine-pointer Auto Swipe edge field from a separate particle-canvas treatment into one continuous full-height glow and fog system. The edge line still stays brightest, but the field now begins farther inward, fades fully to transparent without a hard segment, and behaves like a liquid fog bank that pools toward the cursor and ripples with damped vertical lag.
- Removed the standalone gravity-particle canvas layer. The attracted material is now expressed inside the glow itself through layered fog gradients, which avoids visible dots and keeps the feedback closer to a luminous field than a particle effect.
- Auto Swipe no longer requires pointer retreat and re-entry after each step. Holding at the edge now continues advancing the carousel, with the first step remaining slow and later steps accelerating to a capped faster pace so sections remain readable.
- The edge field now recomputes after each automatic move instead of clearing completely, so the glow remains active while the pointer stays in the edge zone.
- Auto Swipe switch full opacity is now hover-only. Keyboard focus still shows an outline, but clicking the switch no longer leaves it visually stuck at full prominence after the pointer leaves.
- Files changed: `src/pages/index.astro`, `src/visualisations/home-gallery/home-gallery.css`, `src/visualisations/home-gallery/home-gallery.ts`, `docs/ux-accessibility-features.md`, `docs/exec-plans/active/007-home-gallery.md`, `docs/current-handoff.md`.
- Validation: focused strict TypeScript compilation passed, CSS syntax/structure passed, and static assertions confirmed earlier edge activation, continuous accelerating Auto Swipe hold behaviour, hover-only full-opacity control state, and removal of the canvas particle layer. Full Astro build remains pending in a local environment with installed dependencies.

## 2026-09-15 Auto Swipe magnetic fog tuning

- Base remains `main` at `7302dabaf342344d1e222bbf97b6e01b8f380c0d`, with the previously delivered magnetic-fog follow-up layered on top.
- Tuned the Auto Swipe edge field to be less dusty and less distracting. The bright line at the physical edge remains the strongest cue, while the inner field now reads as a cleaner radiating fog rather than a broad speckled haze.
- Constrained the suction trail so it ends at the cursor zone instead of extending beyond it. The cursor now behaves more like a magnet or vacuum pulling the fog inward from the edge.
- Added horizontal spring smoothing to the trail geometry as well as the existing vertical lag, so the trail shifts more like liquid when the cursor moves.
- Reduced overall edge-field opacity while preserving earlier activation, so the interaction remains obvious without overpowering the gallery cards.
- Files changed: `src/visualisations/home-gallery/home-gallery.css`, `src/visualisations/home-gallery/home-gallery.ts`, `docs/ux-accessibility-features.md`, `docs/exec-plans/active/007-home-gallery.md`, `docs/current-handoff.md`.
- Validation: focused strict TypeScript compilation passed for `home-gallery.ts`, emitted JavaScript passed `node --check`, and CSS syntax/structure checks passed. Full Astro build remains pending in a local environment with installed dependencies.

## 2026-09-15 Auto Swipe edge fog cleanup

- Follow-up tuning on the homepage magnetic Auto Swipe edge field.
- Removed the remaining dusty appearance by simplifying the fog gradients and lowering the field opacity.
- Smoothed the radiating edge gradient so it fades cleanly to transparency without the visible inner band seen in local review.
- Tightened the suction trail so it stays between the physical edge and the cursor, with a slightly shortened reach to prevent the glow from extending beyond the cursor position.
- Kept the continuing Auto Swipe hold sequence, earlier field activation, and hover-only full-opacity switch behaviour unchanged.
- Files changed: `src/visualisations/home-gallery/home-gallery.css`, `src/visualisations/home-gallery/home-gallery.ts`, `docs/ux-accessibility-features.md`, `docs/exec-plans/active/007-home-gallery.md`, `docs/current-handoff.md`.
