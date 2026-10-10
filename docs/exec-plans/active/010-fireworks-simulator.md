## 2026-10-11 Harbour Bridge structural overlap correction

The current 44,489-building Sydney browser bundle uses an authored open-truss Harbour Bridge over source-backed Overture buildings. Local-metre coordinates in the browser bundle revealed the authored bridge centre `(175, 356)` was about 131 m from the midpoint of four independently labelled Overture pylon parts (two south, two north) at approximately `(114, 239.5)`. The previously calibrated orientation (`-25.3°`) and 503 m arch span were consistent with the north/south pylon axis; only the centre was misplaced. Update the static browser structure and `structures()` in `prepare_sydney_city.py` so future exports agree.

Two further Overture *unnamed* part footprints are precisely colocated with the pylon ends (south ID `88d86b8e-0235-39e7-b118-6f71cb92961b`; north ID `2eeda083-a182-336a-a922-d99f7cac767f`, both direct-height 89 m). The existing visual exclusion caught the four *named* pylon parts but missed the unnamed geometry, leaving block-like duplicates. Update the shared landmark-exclusion function used by Canvas and WebGL to hide only the two audited IDs, with independent name/source/height/position safeguards; retain the records, raw Overture identity and building count in the bundle. Avoid blanket suppression of structures near the bridge.

The authored arch/deck/pylons remain schematic calibration geometry, not a detailed 3D model or a surveyed reconstruction. The downstream road deck remains approximated (flat 49 m) and may not match all observed bridge elements. Next visual gate: local SKYLINE from each side plus PLAN/Canvas fallback; do not expand to city-wide overlap repair based on this one landmark.

## 2026-10-10 Fireworks: Sydney sky prototype and advanced viewport disclosure

- **Base:** supplied dirty `main` at full commit `17a011695370cdf5985fbb76be725ea9d284849f`, with reviewed Fireworks patches through 10 m upward tilt applied. No commit, push, release or Cloudflare changes.
- Verified existing `FW-NAV:v4` defaults already exactly match the requested profile: mouse move LOW/HIGH 2.35/1.00, mouse pan 1.50/0.75, keyboard move 5.75/2.25, keyboard pan 5.75/2.25, curve 1.6, 10–2000 m. They remain reset-on-refresh; no alteration to speed values or navigation mechanics.
- Added **SHOW ADVANCED VIEWPORT SETTINGS** switch (initially off) inside Map/View Options. The full calibration sliders, plot and copyable FW-NAV output stay available but start hidden and inert.
- Added first-stage Sydney SKYLINE astronomy: local date/time, 1-minute time slider, calculated sunrise/sunset markers, default **today in Sydney one hour after sunset** (IANA Australia/Sydney with daylight saving). Top scene-controls readout shows chosen date/time. Actual star direction is projected into the same east/north/up camera basis as Sydney; only the 53 documented bright stars are drawn, with apparent-magnitude-based size/brightness and subtle reduced-motion-aware twinkle. Moon has low-order estimated sky position/illumination, a draft phase texture and a settings preview, and appears in the scene only above the ideal horizon. Time-of-day atmosphere is restrained for city-wireframe readability. PLAN hides sky; WebGL and Canvas fallback remain separate from the sky layer.
- New source/provenance and limitations: `data/sources/fireworks-simulator-sky.md`, linked from `docs/index.md`. No external runtime fetch, new npm dependency, new site route or Sydney city data regenerated. **This is not a complete star atlas, a geographically accurate city-light-pollution model or a precision lunar ephemeris.**
- Included changes: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,bright-stars.ts,night-sky.ts,night-sky.test.mjs}`, `data/sources/fireworks-simulator-sky.md`, `docs/{index.md,current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. Deletions: none.
- Validation: focused Node regressions including Sydney daylight saving, solar events, star horizon, Moon phase, DOM wiring; scoped TypeScript compile with TS extensions; CSS syntax parse and ZIP integrity. **Not run:** full Astro build (dependencies not bundled), browser/WebGL visual and touch QA, precision comparison with reference astronomical software. **Next:** test 10 Oct near-new-Moon (the Moon may be invisible), then pick a full-Moon night; compare actual sky directions and test slider at narrow widths before considering a complete catalogue.

---

## 2026-10-10 upward pitch at the 10 m camera floor

**UX issue:** manual map rotation used to binary-search a reduced orbit angle whenever the requested right-drag/Up Arrow pitch would lower the eye below the 10 m camera floor. At the exact floor a requested upward tilt was completely rejected, unlike at 11 m. The old camera-only alternate mode was deliberately removed, so reintroducing it would regress the consistent map rotation.

**Correction:** compute the same yaw and pitch orbit at all elevations. When its result drops the eye below the 10 m floor, raise both `eye.z` and `target.z` equally, retaining the orbit's horizontal eye displacement and view direction. This gives continuous upward tilt at the floor, no camera-only branch and no breach of the physical floor. Maintain the global ±0.485π pitch guard and shared keyboard/right-drag route. Regression tests cover both inputs, repeated upward/reverse input, continuity just above the floor and the previous skyline direction matrix.

**Files:** `camera-map-rotation.ts`, `camera-map-rotation.test.mjs`, handoff, plan, UX feature log. No source geometry, WebGL or navigation calibration changes. No commit/push/deploy. Physical local review remains needed for the look and feel near the floor.

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

## 2026-10-10: Confirmed default navigation profile, independent keyboard move / rotation

The user provided a preferred calibration from their Windows browser: mouse move LOW/HIGH 2.35/1.00, mouse pan LOW/HIGH 1.50/0.75, keyboard LOW/HIGH 5.75/2.25 and curve power 1.6. Install this exactly as the shared code/UI initial state. Keep 10–2,000 m logarithmic interpolation and existing camera controls. Break keyboard tuning into two groups while retaining the existing chart and 0.25–10× range: **MOVE** applies to WASD translation plus Q/E height and +/- travel; **PAN/ROTATE** applies only to arrow keys. Both keyboard groups initially use the supplied original keyboard profile, avoiding any immediate direction/speed change until separately tuned.

During calibration, slider changes are intentionally not persisted: each browser reload resets the controls to this baseline even if legacy stored v1-v3 settings exist. Only the speed calibration loses persistence; existing unrelated simulator preferences remain stored. `FW-NAV:v4` exports four independent low/high groups, their effective camera-altitude values, the curve, and current browser/display context. Physical mouse DPI is still unavailable from web APIs. Code paths: `FireworksSimulator.astro`, `fireworks-simulator.ts`, `fireworks-simulator.css`, `navigation-calibration.ts` and regression tests. No renderer or dataset changes. Validate focused tests and TS, then check slider behaviours and refresh at runtime before considering the defaults final.

---

## 2026-10-10 review: direct camera-height controls are too sensitive

- **Latest source:** supplied dirty `main` `17a011695370cdf5985fbb76be725ea9d284849f` plus the previously delivered 2026-10-10 altitude-navigation-curve calibration patch.
- Adjusted **direct camera height** only: Q/E input now travels about 8–10 times less vertically at the same camera-target distance and keyboard calibration; left-button + mouse-wheel travels about 5 times less per normalised wheel unit. These are bounded, separate calculations in `camera-height-controls.ts` shared with focused tests. The original Q/E conversion was `clamp(distance * .0015, .25, 8) * .75`; the original mouse left+wheel conversion was `clamp(distance * .00022, .1, .8)`. The new conversions use `clamp(distance * .0002, .025, 1) * .75` and `clamp(distance * .00004, .02, .16)` respectively.
- Deliberate exclusions: right-button + wheel target-height choice and weighted stepping, automatic travel to selected target, mouse/touch pan and rotation, ordinary zoom/dolly, landmark orbit, altitude navigation calibration values and 10 m floor. No settings slider introduced.
- Validation: 56 focused Node tests and scoped Fireworks TypeScript compile pass. No full Astro build or local camera-input visual QA. Obtain user feedback before changing these factors again.

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

## 2026-10-10 manual map rotation/pan regression repair

The earlier manual rotation target could be a point floating well above or in front of the skyline after a landmark view normalised its view distance; the separate ground-look code substituted a different orbit after floor contact. This induced a depth-related apparent direction reversal when high above the city, which earlier isolated `camera-pan.ts` testing missed. Replaced `rotateMap` with a uniform map-plane-anchor rigid-eye/look rotation helper (new `camera-map-rotation.ts`) plus independently tracked floor pitch excess. Right-button, Ctrl+left and keyboard arrow routes share the same helper. Slower manual yaw/pitch constants. The automatic landmark cinematic orbit is deliberately separate and stops on viewport input.

For ordinary pan, moving the existing gain alone did not solve near-ground parallax because `skylineMetresPerPixel` still referred to a 60 m virtual plane at eye altitude 0.25–5 m. Lowered virtual depth to `max(8,height*1.6)` and the minimum pixel scale to .005 m. Kept the existing mouse/touch/WASD handler calls and fallback/anchor rules, but rejected backwards ground-anchor results. Verified with pure projection regression tests over 0.35/2/60/400/2400 m, changed camera range/zoom and input speed. This is an UX tuning trial: user must inspect on actual local Sydney GPU scene; no live browser build run in the supplied environment.

## 2026-10-10 screen-space pan feedback: slower default, no extra UI

On-device feedback after the initial projection-aware pan patch reports excessive speed at street and city-overview elevations. Inspection found a street-level virtual pan plane fixed 180 m away, a large minimum sensitivity and a ground-anchor allowance up to 2.4x the normal move before fallback. In `camera-pan.ts`, keep the shared screen-space model but use an internal `PAN_RESPONSE = 0.45`, a 60 m minimum virtual-ground reference, a 0.05 to 6 m/input-pixel raw bound, and a 1.35x anchor safety cap. All changes are in the helper, so mouse, touch and WASD slow together without UI additions, camera code churn or changing right-rotate/zoom/height gestures. Include unit tests for near-horizon ground drags, high altitudes and anchor safety. This is a local feel trial, not a verified universal speed calibration.

## 2026-10-10 camera pan UX improvement: ground-aware screen space

**Stage decision:** Keep manual city movement about the *apparent movement of the map*, not fixed metres per input and not the mutable landmark look target. Replaced only SKYLINE horizontal pan calculations. Projection focal length and real eye altitude set a bounded metre/pixel reference: below the horizon use a safe ground intersection, near the horizon blend toward a virtual depth. Ordinary pointer drags use two ground rays to approximate grabbing the same map point, with a smooth screen-space fallback if either ray is unstable or the resulting step is too large. Keyboard WASD consumes the same scale through existing time-based velocity smoothing. No momentum added to pointer dragging; no extra UI or slider. The previous navigation directions, touch/dual-pointer behaviour, flight cancellation, rotation, zoom, height, PLAN and all WebGL work remain unchanged.

See the pure `camera-pan.ts` unit tests for target independence, street-level finite bounds, increase with height, anchored drag and horizon fallback. Tune from real visual use before adding terrain-aware picking; flat Sydney ground remains the only plane available to the helper.

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

## 2026-10-09 follow-up: landmarks by significance, not tallest 20

The exact-name shortlist favoured CBD office towers and omitted well-known places. The new curated registry includes historic, civic, cultural, sporting and tall landmarks, with **no fixed 20/50 cap**. A place appears only when the city bundle contains usable source footprints. Current east-coast data yields 65; there is no automatic quota or nearest-building invention. Categories appear as sections in the right drawer. Source height quality is independent of visual landmark significance: fallback 18 m and floor-derived heights do not participate in the height atlas because they misrank sites such as Quay Quarter Tower and heritage buildings. Twenty-seven current landmarks have source numeric heights or existing authored structure heights. Their full heights are compared without active/inactive rescaling, faded with colour/opacity only, across the full-width strip.

Two non-exact-name candidates require a narrow, source-audited bridge: Crown Sydney is tied to a 271 m Overture footprint ID and constrained by proximity to source-named Barangaroo Tower 1, 247 m; the label does not make new geometry or set a new height. The SCG is one landmark target from seven existing named stand footprints, with combined source bounds for camera fitting and member IDs for individual existing WebGL accent buffers; it is **not** a fabricated stadium mesh, and its fallback stand heights are excluded from the height atlas. Further physical accuracy (tower facade shapes, sporting ground, and unmeasured heights) needs a separate dataset/source stage before release.

Landmark selection now has one explicit lifecycle: click label or drawer entry to frame the feature, expand the drawer and scroll the selected row into view. Manual camera movement, reset and SKYLINE/PLAN switching do not clear it; only the selected on-map X or selecting another feature changes it. The selected flag is a wrapper containing two separate native buttons, avoiding nested interactive controls. The same existing hover/selected fading and WebGL depth-tested accent pass remain.

Validation: current Sydney JSON source-backed 65 landmark matches and 27 height-eligible, 14 focused Node tests, scoped TypeScript compile and CSS parse. No full Astro/browser/mobile test performed. No changed renderer or city dataset; no new network retrieval. Base dirty main commit `17a011695370cdf5985fbb76be725ea9d284849f`.

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

## 2026-10-09 target-height fine adjustment trial: 1 m steps

For local comparison against the prior 5 m step behaviour, right mouse + wheel now moves its target by 1 m per accumulated wheel step and snaps the initial eye value to the same 1 m grid. The 65-unit wheel threshold, one-step-per-event cap, direction and all other gestures remain as in the preceding patch. Follow up after actual device testing to decide if 1 m is too slow. Only height helper, interaction constant, tests and the related handoff/UX documentation change.

## 2026-10-09 height comparison: 5 m steps, scale recovery, numeric cue, scene emphasis

The atlas review revealed wheel distances skipping rooftops and a one-way scale bug: `heightScaleMaxM` only ever increased, so building silhouettes stayed compressed after 5,000 m was selected. For right mouse + wheel only, quantise target selection to 5 m increments, accumulating trackpad deltas and accepting at most one increment per event. Keep right release camera travel and left-wheel, ordinary wheel and keyboard gestures unchanged.

Recalculate the comparison ruler's maximum from the *selected target* each time rather than retaining a prior high value. After selecting 5,000 m and returning to 100 m, the comparison scale must return to 600 m and the active landmark should enlarge again, even if the physical eye is still high. Outside selection/travel the ruler resumes showing physical camera height. Add a metre readout beside the target arrows, and a pointer-transparent dark scrim over the viewport below the atlas/scale/cue stacking layers. Respect reduced-motion preferences.

Only UI and pure height helpers/tests change, no scene data or GPU buffers. Follow-up is local gesture/visual testing against the user's east-coast Sydney bundle, including wheel device variability.

## 2026-10-09 Skyline landmark and map/navigation follow-up

- Consolidated authored skyline structures (Harbour Bridge, Opera House, Tower) in WebGL's existing depth pipeline; replaced old Canvas-on-top bridge/Opera draw and fake near-plane vertex ejection with proper homogeneous clipping. Preserves Canvas structure drawing for PLAN/fallback.
- Avoid duplicate Opera/bridge structural representation by suppressing overlapping sourced Overture building parts only in both renderer input paths. Source file/JSON stays untouched. Source-backed exact-name Sydney landmark catalog adds up to 20 candidates to the three authored, found 19 total in the archived 26,156-building bundle; current 44,489-building source must be checked locally.
- Added collapsed right-edge name list, focus buttons and landmark-fit camera with deterministic blocked-sightline scoring. Labels are decluttered. Centred dropdown chevron. Firework Canvas behind GPU city to avoid painting on building silhouettes; true per-particle depth and separate road/land compositing may be follow-on improvements.
- Risk: schematic bridge/Opera geometry is not surveyed, camera obstruction scoring uses building bounding spheres, and skyline GPU layer compositing attenuates fireworks above translucent land as a compromise. Do not claim exact 3D occlusion. No city data acquisition or renderer duplication.

## 2026-10-09 map/view layer options prototype

- A compact native disclosure below SKYLINE / PLAN exposes highlight (three authored Sydney landmarks), per-layer on/off switches and transparency from 0% to 100% for key buildings, sourced buildings, roads/transport and land/coastline. The settings apply identically to GPU skyline and Canvas PLAN/fallback; no dataset changes, additional sourced city geometry or renderer replacement.
- Preserve the independent key-structure render layer. Sydney Tower is extracted from standard WebGL building triangles into its own draw buffer to allow key buildings to remain when standard building shapes are hidden. Harbour Bridge and Opera House remain authored Canvas renderings, never a second pass over the ordinary city.
- Dynamic roof-anchored name labels use the existing local-metre projection and only three DOM elements. Respect reduced motion, visibility and off-screen bounds. Procedural landmarks still use original approximate geometry; the labels are identifiers, not a claim of surveyed accuracy.
- No persistence for this initial review pass: initial transparency is 0% with all layers and highlight enabled. Review scope is local visual validation on large and small viewports and skyline/plan/fallback controls before deciding on further options or city-wide architecture changes.

## 2026-10-09 Sydney coastline diagnosis and correction candidate

The user confirmed the browser still loads `inner-sydney` (26,156 buildings,
10,279 roads) while the east-coast cache has 45,055 buildings, 1,103 parts,
13,888 NSW roads and 18,616 land records. A later local download added 3,305
water features to the same extent and pinned Overture release `2026-09-23.1`.
The wide mainland `class=land/subtype=land` polygon has no interior rings and
classifies the Sydney Harbour channel as land, causing the strict coastal
validation to reject publication. This is not a WebGL shader or camera defect.

Patch candidate: subtract the same-release Overture mapped bay/harbour/inland
water polygons from the real coastline-derived land before constrained
triangulation. Exclude swimming pools, drain networks and point labels. Retain
the existing 300 m Pacific ocean buffer and north/south/west fades, existing
renderer, existing local-metre CRS and landmark geometry. Fail closed on bad
water coverage, coastline truncation, classification, triangulation or cache
metadata mismatch. Use `--overture-release 2026-09-23.1` in normal NSW-only
acquisition mode to reuse the existing five-layer cache without Overpass or
STAC-current-release calls. Do not use `--reuse-local` until a valid promoted
manifest exists. No raw GIS or regenerated city JSON is delivered in ZIP.

Offline synthetic tests and the real 44,489-building/13,856-road preparation
were run. Real geometry triangulates when combined with the archived **old**
inner-city water extract, but this does not validate the new complete water
extract's eastward harbour coverage. Next review must run the pinned local
generator and inspect its resulting counts, geometry classification, shoreline,
browser GPU/FPS and output size before considering publication or Newcastle.

## 2026-10-09 Sydney review: stop doubled building pass and unblock east-coast without Overpass

Screenshots show more/brighter building outlines at rest than while dragging.
Root cause in current code: SKYLINE WebGL already draws the full city, but a
second delayed Canvas **occluder** cache repaints near-camera architecture on
top of the live city. During camera motion this cached layer becomes dirty and
is temporarily withheld; when idle it is drawn again, giving a brightness
flicker. Fix the presentation mismatch by skipping the redundant Canvas
architecture occluder pass whenever SKYLINE is WebGL-backed. Retain the pass
for Canvas fallback only. Trade-off: fireworks behind buildings do not yet
have precise WebGL-to-Canvas depth occlusion. A future GPU particle rendering
pass may address this; do not silently redraw city lines as a substitute.

The Pacific coastline is still absent because the active public JSON remains
`inner-sydney`. In the user's `sydney.7z` raw source cache, the east-coast bbox
`[151.18,-33.903,151.315,-33.829]` contains 45,055 Overture buildings, 1,103
parts and 13,888 NSW roads, with release `2026-09-23.1`. Overpass transport
failed recursively with HTTP 504 on one small tile and therefore blocked a
full accepted coastal export. Offline use of the cached Overture + NSW sources
without OSM successfully prepared 44,489 buildings and 13,856 roads, with
zero geometry-audit errors. Overture land still needs its live bounded download
and strict coastal mesh checks.

Add an explicit `--transport-source nsw-only` mode to acquire the first fully
sourced coastal scene without touching Overpass. Keep `nsw-osm` as the default;
mark OSM-enrichment absence in the browser profile, manifest and source note.
A later complete run can add OSM lanes/traffic details. Do not fall back
silently after an error; the user chooses the lower-detail profile.

**Preparation for Newcastle:** The renderer's local-metre city JSON schema is
already reusable. The acquisition source adapters, projection/origin, coastline
checks and landmark models remain Sydney-specific. A later small Newcastle
stage should introduce explicit city profiles for these inputs, default to
Overture for global buildings/land, use the NSW road source for Newcastle and
leave optional OSM enrichment separate. Do not make a second city data export
or broadly refactor the city renderer during this Sydney correction.

## 2026-10-09 east-coast download resilience

The first real east-coast run supplied a concrete upstream failure that could
not be seen during offline work: the Overture building query delivered 45,055
features, building parts 1,103, and NSW RoadSegment 13,888 before one full-scene
Overpass transport request returned HTTP 504. The intentionally atomic browser
update left `sceneExtent=inner-sydney`, so the missing coast is still explained
by an incomplete data acquisition, not CSS or browser caching.

Change the download sequence, not the renderer:

- Keep completed geojson/JSON source extracts inside a local staging cache,
  labeled by extent, exact bounding box, release and source type. Reject invalid,
  empty or mismatched cache entries. A new Overture release triggers re-fetching
  rather than silently mixing datasets.
- Request OpenStreetMap transport in four sequential bounded tiles rather than
  one huge query. Deduplicate shared OSM way/node IDs, prefer the fuller way
  geometry where necessary, save every completed tile and subdivide a tile
  further if the server returns 504. Bound retries and wait on temporary
  rate-limit/connection errors. Do not turn a single timeout into an unbounded
  barrage of requests.
- Build and validate the complete coastal geometry against staged inputs.
  Promote canonical raw files and browser JSON only after all data and geometry
  checks pass. Successful staged files survive partial failures.
- Preserve the old `--reuse-local` strict manifest check for *completed*
  acquisition. For incomplete runs, repeat the ordinary `--extent east-coast`
  command and it will reuse validated downloads automatically.

This is a narrow resilience patch. It does not invent or include missing
coastal buildings, roads or shoreline. The actual download and geographic
review still must run on the user's Windows machine.

## 2026-10-09 Pacific acquisition contract and fading the artificial land boundary

User review shows the earlier urban fade improved building edges, but the land
plane still ends as a visible rectangular shelf. The current inner-Sydney raw
sources end at longitude `151.238`, before the Pacific coastline. A cosmetic
extent edit cannot fill that missing source data.

**Stage change:** Add opt-in `--extent east-coast` with a bounded five-layer
source acquisition (Overture buildings, parts and coastline-derived land,
NSW RoadSegment, OSM transport). Preserve the north/south/west WGS84 limits;
the east download bound `151.315` is a search envelope only. Infer the final
right map boundary from the eastmost sourced class=land/subtype=land coastline
polygon within the actual north/south frame, plus 300 local metres. Reject
truncated/unclassified coastal data, incorrect CBD/harbour land tests and
triangulation errors rather than substituting a false shoreline. The full
browser JSON is generated atomically after all existing quality checks.

**Presentation:** Land fills the actual coastline surface and vanishes into
background opacity over the last 300 m at the three *artificial*
north/south/west edges. On the east, land stops at its sourced shoreline and
water is unpainted. Buildings and roads retain their 300 m edge fade.

**Pending:** No outbound network from this ChatGPT container; user must run the
acquisition locally and review actual counts, source provenance, data size,
rendering FPS and shoreline correctness. The supplied older raw GIS files
cannot be treated as new eastern coverage. Do not commit or publish until
source licence/attribution and geometry are reviewed.

## 2026-10-09 land-vs-city fade separation

The first geometry-based edge fade fixed the visible rectangular overlay, but local review showed the treatment was still too aggressive on the **land** itself. That made the coast look truncated, especially on the eastern side where the coastline should stay visible even though the current building/road extract does not yet fill the full coast.

Focused follow-up in this patch:

- darken the land fill so it supports the city rather than dominating it;
- separate fade behaviour so **land does not fade away at the edge**;
- keep the ~300 m fade only on buildings, roads and other sourced city geometry.

This keeps the current data extent honest: the city fabric still fades where sourced buildings/roads end, but the coastline/land context remains continuous and readable.


## 2026-10-09 correction: shader-based boundary dissolve

The first 300 m fade implementation composited four dark projected Canvas strips *on top* of the WebGL skyline. Review showed a visibly rectangular black band, severe corners, and buildings not actually dissolving. This was the wrong layer for the effect.

The correction uses fragment transparency based on interpolated real-world XY coordinates in the WebGL city shader. `smoothstep(0, 300 m, distanceToNearestBoundary)` attenuates land, buildings, roads, outlines and transport points consistently independent of pitch, viewport size and camera position. The renderer uses the sourced buildings/roads limits for feature fading, but retains the land envelope's east-coast extension for land fading. The fade is a *transparency* into the existing dark background, not a black painted mask.

For PLAN and no-WebGL Canvas, the projected strips now use `destination-out` compositing to remove existing scene pixels instead of adding black. This is an approximation because the strips live in screen space; the WebGL path is the definitive 3D implementation. The separate fireworks animation remains unaffected. No city source data or acquisition changes in this patch. Local GPU visuals/FPS still require user review.

## 2026-10-09 boundary-fade follow-up

Local review of the widened Sydney scene found that matching land strictly to the old padded scene bounds still left too much empty land on the west, south and north, while the east side was close enough to the coast that keeping the coastline felt preferable. A further presentation issue is that the city geometry ends abruptly, especially on large monitors, making the sourced extent look like a hard crop.

Focused follow-up in this patch:

- derive land/render bounds from sourced buildings+roads for west/south/north;
- preserve the east scene edge so the Pacific coast can remain visible;
- make the land plane more legible on dark monitors;
- keep the infinity/ground field constrained to those same bounds;
- add a dark inner edge fade of roughly 300 m so the map dissolves into the background instead of ending suddenly.

This remains a **presentation and bounds** pass. It does not fabricate additional building or road features beyond the sourced data. If later review still finds the eastern coastline too empty, the next step would be a true city-data reacquisition/extent revision rather than further stretching renderer-only bounds.


## 2026-10-09 decision: abandon painted water masks, source actual land

The enlarged Sydney scene exposed why repeatedly editing hand-authored harbour
polygons is the wrong data model. The preferred contract is **only land
geometry** beneath the city. The background represents water/empty space.

- Retire the five authored harbour water masks and full-rectangle land fill.
- Acquire OpenStreetMap `natural=coastline` ways for the current city extent
  using a local manual script, with raw response and date cached outside Git.
- Build land polygons from coastlines + the extraction boundary, using OSM's
  explicit land-left directional rule. Fail the export for gaps or inverted
  sample points instead of inventing shoreline geometry.
- Emit triangulated land only (`land.triangles`), including island/inner-ring
  treatment, as a compact static part of the same existing Sydney JSON.
- GPU skyline renders the mesh first with depth testing, then roads/buildings.
  PLAN/fallback Canvas draws the same triangles before roads/buildings. No
  full-grid lines should appear across open water.
- Keep the correct 26,156 building / 10,279 road geometry untouched. The
  authored Harbour Bridge/Opera House remain separate review items, not
  shoreline control points.

The ChatGPT container has no access to the Overpass download endpoint. The
source-specific browser bundle will be generated **locally by the user**, so
real-world shoreline quality and WebGL performance remain unverified until
that run. Existing exported city JSON is not included in this patch. A future
full rebuild must be followed by the coastline pass.

# Execution Plan 010: Fireworks Simulator

## 2026-10-09 review stage: target-height landmark atlas

- Scope: present a playful visual metre-based comparison during the existing SKYLINE right-click + mousewheel height-target gesture. No new navigation model, WebGL pass or dataset.
- Move the existing vertical ruler and arrow/level cue to the middle only during height selection and subsequent easing. A non-interactive height atlas beside it uses the already loaded `cityLandmarks()` registry and sorts ascending by recorded `heightM` (19 landmarks available in the archived Sydney source; actual loaded source determines the live count). On crossing a roof, the emphasis shifts horizontally to the next taller landmark; below its roof a gold outline and fill rises from ground to the chosen metres. Above tallest, profiles are grey and the scan line continues to the selected target. Responsive and reduced-motion rules are included.
- Profiles are *illustrative* 2D landmark silhouettes. Authored Bridge, Opera House and Tower get recognisable schematic outlines; other named buildings use simple width-informed profiles, not claims about surveyed facades. Heights and sequence are real city-data fields; never add fictitious landmarks or buildings. UI is decorative (`aria-hidden`), with the existing camera status/controls retained.
- Focused validation: TypeScript passed, source-backed Node assertions for source count/sorting/roof thresholds and above-tallest passed, CSS parse clean, desktop isolated Chromium layout screenshot reviewed. Full Astro build, actual gesture/input device behaviour, mobile layout, visual quality over real city and perf unverified until Windows local test. No publication action.


Status: Sydney skyline/camera correction implemented on the supplied clean `main` snapshot `17a011695370cdf5985fbb76be725ea9d284849f`, with the approved fireworks patch sequence layered on top. One local-metre city contract drives plan and skyline Canvas 2D cameras plus the 3D firework particle positions. The checked-in city bundle remains an explicitly labelled calibration fallback, now with a denser harbour-front tower anchor set; the real Overture Sydney acquisition/profile gate remains open because the execution environment could not reach the external geospatial distribution endpoints.

## 2026-10-09 inner-Sydney TopologyException repair

- The user's first inner-Sydney download completed Overture buildings/parts and NSW/OSM transport, then GEOS reported a local-metre `side location conflict` during bundle generation. The older code did a single city-wide `unary_union` of ground-road buffers, then intersected every building against it. Exact triggering feature remains unknown without the raw local GIS files and a traceback.
- Replace the global union with an `STRtree` of individual buffered ground roads and union only nearby candidates for each building. Repair invalid footprints only temporarily for spatial auditing. If an individual overlay is still invalid, flag the original building as `roadConflict` and `roadAuditError`, retain its original footprint, and exclude it from scene rendering. Report error count/sample IDs. Abort publication when the number of audit errors exceeds 0.5% of buildings, with a minimum allowance of 25 errors.
- Add `acquire_sydney.py --extent inner-sydney --reuse-local` to use all four canonical downloaded files without making network calls, while retaining the acquisition quality gates and atomic city JSON replacement. Save Overture release/date/extent manifests immediately after future downloads so even failed processing runs preserve provenance. The user's first download predates this manifest; do not guess its release ID or publish the regenerated data until provenance is verified.
- Source snapshot stays dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f` with previous reviewed Fireworks patches layered in sequence. Only Sydney acquisition, preprocessing, regression tests, data-source notes, script README, plan and handoff change. The browser scene JSON and city renderer are not part of this fix.
- Validation: 15 offline Python unit tests pass, including malformed-ring road overlay and network-free reuse/bounds checks; Python compile checks pass; synthetic audit of 4,000 buildings against 2,000 road segments completed in about 0.6 s without audit errors. The actual downloaded GIS files and Windows runtime are unavailable, so the full wider-city export still requires a local run.

## Objective

Create a fullscreen interactive fireworks simulator that reuses the restrained presentation principles of the disabled Pulse visual without reusing its fuel subject matter. Users will eventually be able to select realistic named firework presets, customise their visual parameters, construct a timed show, select a city and switch between a flat 2D view and a skyline perspective.

The project is a LAB visualisation/interactive simulation during development. It is not currently a game because there is no score, challenge, win state or game loop. If those are later introduced, move it to GAMES rather than keeping a game in LAB.

Proposed stable slug: `fireworks-simulator`.

## Central question

**Can a browser visual make professional firework effects feel recognisable and physically credible by combining researched real-world scale with a small reusable particle-physics vocabulary?**

## Stage 1 direction decision

The first useful project boundary is the firework itself, not the city or show editor.

Approved direction from the user's brief:

- LAB during development;
- fullscreen visual treatment influenced by the existing Pulse project;
- researched named firework types plus a custom editor;
- real-world metre-based scale for height and spread;
- Sydney as the first future city;
- future switch between 2D and skyline views;
- future worldwide city support;
- future show sequencing.

Explicitly excluded from Stage 2:

- implementing the renderer;
- creating a public content entry or route;
- Sydney/city geometry acquisition;
- cakes, mines, Roman candles or ground effects in the first renderer;
- audio;
- operational firing or construction information;
- show timeline/sequencer;
- Cloudflare or publication work.

## Research decision: compositional firework model

A named effect should not map to a single hard-coded animation. The project will represent each firework as:

```text
device scale + launch + break geometry + star motion + colour + trails + secondary effects + presentation
```

This is consistent with professional simulation practice where calibre, effect height, duration, prefire/lift time and visual effect description are separate fields.

Detailed domain research is in [`../../fireworks-simulator-research.md`](../../fireworks-simulator-research.md). Provenance is in [`../../../data/sources/fireworks-simulator.md`](../../../data/sources/fireworks-simulator.md).

## Data project contract

### 1. Question / experience

The first visual prototype should answer one question: **do a small set of research-calibrated shells look convincing at real-world scale before city geometry and show editing are added?**

The target first visual test is Peony, Chrysanthemum, Willow and Crossette across representative 75, 100, 125 and 150 mm shell scales.

### 2. Data source

This project uses a manually maintained research snapshot rather than a single upstream dataset.

Source hierarchy:

1. scientific measurement;
2. official government/regulatory technical reference;
3. manufacturer-declared product performance;
4. professional simulation terminology/conventions;
5. industry glossary corroboration;
6. clearly labelled rendering hypotheses.

Current authoritative anchors:

- Natural Resources Canada Display Fireworks Manual for scale approximations;
- Zrnić et al. 2020 for measured burst motion and observed ranges;
- American Pyrotechnics Association for common effect terminology;
- Finale 3D documentation for professional simulator fields and modern effect semantics;
- selected manufacturer declarations only to demonstrate product variation.

Update model: manual snapshot. No runtime API and no build-time fetch.

Reuse: the project stores factual observations, derived calculations and original rendering parameters. It does not republish source figures, videos, proprietary simulation assets or substantial glossary text. Source/reuse terms will be rechecked before public release.

### 3. Data shape

Current machine-readable research file:

```text
src/data/fireworks-simulator/firework-presets.json
```

Schema:

```text
src/data/fireworks-simulator/firework-presets.schema.json
```

The dataset contains:

- source-reference metadata;
- units and evidence classes;
- calibre/scale reference rows;
- empirical motion calibration;
- effect-family definitions;
- renderer motion profiles;
- renderer colour palette;
- provisional named presets;
- custom-editor parameter definitions.

No coordinates or timestamps are required for the fireworks library. Future city data will use a separate contract and local metre-based coordinates.

### 4. Transformation

Stage 2 transformations are deterministic and documentary:

- derive reference burst height from `calibreMm / 25 * 33`;
- derive reference maximum spread diameter from `calibreMm / 25 * 27`;
- retain the AMS velocity fit as a named empirical calibration rather than applying it universally;
- convert terminology research into reusable effect-family traits;
- map qualitative traits onto clearly labelled provisional renderer profiles.

No source scraping or automated acquisition script exists yet because the research set is small and manually curated.

### 5. Client contract

No browser/public data contract is released in Stage 2.

Likely Stage 3 implementation approach:

- import the small source JSON at build time or bundle only the fields required by the project component;
- keep research/provenance metadata out of the hot animation loop;
- use stable IDs for palette entries, effect families, physics profiles and presets;
- preserve `schemaVersion` so later parameter changes can be migrated deliberately.

A release candidate may export a compact public methodology file under `public/data/fireworks-simulator/`, but only if there is a user-facing reason. Static source code/data remains the default.

### 6. Storage choice

Static repository data. No D1, R2, KV, database, CMS or server process is justified.

### 7. Local development

Future visual work should remain inside the existing Astro static application and run with `npm run dev`. No production resource is required.

The renderer should start with project-scoped Astro, CSS and TypeScript plus Canvas 2D if sufficient. Add Three.js/WebGL only after the first measured prototype demonstrates a genuine requirement for 3D camera/scenery or higher particle throughput.

### 8. Failure and partial states

Stage 3 should define:

- missing/invalid preset data: show a readable unavailable state instead of running with unknown defaults;
- unsupported effect family: fall back only when the mapping is explicitly defined, otherwise reject the preset;
- reduced-motion preference: retain scale/shape but reduce continuous trails/secondary animation;
- low-performance device: reduce rendering particle density without changing metre-based geometry;
- future city failure: keep the fireworks scene usable against a neutral horizon/grid rather than blocking the simulator.

### 9. Attribution

A future project page should expose a short `Research & methodology` affordance with source links and a clear statement that the simulator uses measured/reference values plus visual approximations and is not a fireworks engineering or safety tool.

Detailed provenance remains in `data/sources/fireworks-simulator.md`.

### 10. Release checks

Before any LAB publication:

- recheck source URLs and reuse terms;
- validate the machine-readable research file;
- complete `docs/checklists/data-release.md` where applicable;
- complete `docs/checklists/project-release.md`;
- confirm no operational pyrotechnic instructions were added;
- measure initial JavaScript/data payload and animation frame performance;
- test keyboard/touch controls and `prefers-reduced-motion`;
- verify public attribution/methodology.

## Stage 2 findings

### Physical scale

Natural Resources Canada gives approximate aerial-shell relationships of 33 m burst height and 27 m maximum star-dispersion diameter per 25 mm nominal shell diameter. These give a useful metre-scale baseline, but manufacturer examples demonstrate that actual effect heights vary, so `calibreMm` and `burstHeightM` must remain independent fields.

### Motion

The 2020 AMS study provides a direct Peony calibration: about 190 m burst height, 100 m diameter, 121 visible stars, roughly 1 s illumination and an initial fitted radial velocity about 170 m/s followed by strong drag. Across the observed display, typical heights were 100-200 m, most diameters 100-150 m and visible duration 1-6 s.

The first renderer should therefore avoid constant-speed radial expansion.

### Effect structure

The first canonical family set is Peony, Chrysanthemum, Dahlia, Brocade, Willow, Crown, Palm, Coconut, Horsetail/Waterfall, Crossette, Ring, Sweeper Ghost and Falling Leaves. Pistil/Core and Strobing are represented as composable modifiers rather than base families. Multibreak/spawn effects remain in the schema but can be deferred from the first renderer.

### Colour

Colour, trail colour and colour transitions must be independent from effect geometry. Gold/silver/charcoal semantics often imply trails, so the model distinguishes tip and trail presentation.

### Evidence discipline

The machine-readable dataset distinguishes measured facts, official approximations, manufacturer declarations, professional simulator conventions, derived values and rendering hypotheses. Future UI copy must not present provisional renderer tuning as measured physics.

## 2026-10-09 scene-ground visual update

Local review of the expanded inner-Sydney skyline showed the city reading as a floating white wireframe over a largely black ground plane. The underlying cause is that the renderer filled only harbour polygons; non-water ground simply inherited the black page background.

Focused correction:

- draw a projected land-plane fill in both SKYLINE and PLAN before the grid and city overlays;
- keep the fill light grey and subtle so buildings remain the primary subject;
- redraw harbour polygons as near-black cut-outs above the land fill so the water reads as the void;
- preserve the existing roads/buildings/transport/landmark rendering order and data contract.

This is a presentation-layer correction only. It does not change the downloaded geometry, bounds, structure counts or WebGL building pipeline. If the expanded Sydney review still shows ambiguous coastlines after this patch, the next step is a more explicit land/harbour polygon treatment for islands and shoreline edges rather than further broad colour adjustments.

## 2026-10-09 harbour-mask and bridge realignment

Review of the expanded inner-Sydney scene identified two linked problems:

1. the renderer now had a light land plane and black water, but the underlying exported water geometry still consisted of one coarse Stage 5 harbour wedge, so open harbour areas such as western/eastern bays still read as land;
2. the authored Sydney Harbour Bridge used the original calibration anchor and heading, while the live NSW/OSM road geometry clearly placed the Bradfield Highway bridge corridor further north-east and on a steeper angle.

The fix in this patch is deliberately data-level, not just visual:

- replace the single water wedge with several authored harbour polygons that better cover the main harbour footprint visible in the current scene;
- keep that geometry explicitly marked as project-authored harbour masks rather than sourced hydrography;
- move and rotate the authored Harbour Bridge so it aligns to the current Bradfield Highway corridor while keeping the published bridge span/height figures and the existing renderer model.

This remains a calibrated prototype. If further review shows the harbour still reading incorrectly, the next milestone is not more colour tuning but a dedicated Sydney shoreline / hydro polygon acquisition path.

## 2026-10-09 OSM empty coastline response and Overture ocean correction

The user's first Overpass `natural=coastline` request returned a valid JSON
response containing `elements: []`. It provided no geometry. No coordinate
conversion fix could repair an empty upstream response. For the next focused
attempt, retain the land-only renderer and replace the acquisition source:

- Fetch bounded `base/water` features from Overture Maps through the existing
  Python API already used for the buildings.
- Select polygon features with `subtype=ocean`; ignore other water subtypes in
  this harbour/shoreline step. Overture derives these from QA'd OSM coastlines.
- Clip ocean to local-metre scene bounds and compute land as its complement;
  triangulate with Shapely 2.1+ constrained Delaunay so islands and holes are
  retained without dropping near-shore triangles.
- Before updating the user's `sydney-city.json`, verify the coverage ratio and
  land/water anchors, retain a local backup, and record the ocean release/date.
- Keep a separate cache (`overture-water.geojson`) so `--reuse-local` cannot
  accidentally use the earlier empty Overpass response.

No new city geometry ships in this patch. The actual dataset's ocean feature
count, triangulation cost, browser FPS and coastline visual accuracy require a
local connected Windows run and visual review. Do not infer the earlier
building source's release from the new ocean acquisition.

## Stage 3 visual prototype

Implemented for local review:

1. project-scoped `src/visualisations/fireworks-simulator/` Astro, CSS and TypeScript;
2. a fullscreen neutral scene with 50 m grid intervals, ground origin and metre-based firework coordinates;
3. Peony, Chrysanthemum, Willow and Crossette visual profiles;
4. preset, calibre, colour, burst-height and burst-spread controls;
5. the Stage 2 empirical Peony initial expansion value is read from the research dataset and used as the common radial calibration anchor;
6. strong-drag radial displacement rather than constant-speed expansion;
7. deterministic seeded particle layouts so identical settings replay the same geometry;
8. data-driven calibre changes reset height/spread to the NRCan reference rows while manual changes are labelled `CUSTOM SETTINGS`;
9. responsive particle budgets and high-DPI canvas scaling;
10. live FPS and rendered-particle telemetry for prototype review;
11. static reduced-motion rendering that preserves geometry without animated launch/trails;
12. a compact Method disclosure linking the principal scale and measurement sources;
13. automatic replay after the effect clears so the test scene does not remain empty during review.

The renderer intentionally uses a side-on 2D metre plane. It does not yet attempt a skyline camera, real city coordinates, wind, smoke, audio or multi-shell sequencing. The lift trajectory timing remains a labelled renderer hypothesis because Stage 2 did not establish research-backed calibre-specific lift times.

### Stage 3 renderer behaviour

- **Peony:** projected spherical star field with no persistent trail.
- **Chrysanthemum:** the same radial family with independent gold trail rendering.
- **Willow:** longer effect duration, long gold trails and stronger gravity/droop response.
- **Crossette:** parent trajectories split into four rendered child trajectories after the preset split point; the transition changes from blue to yellow in the current preset.
- Particle locations are generated from deterministic pseudo-random 3D directions and projected onto the 2D test plane so a spherical shell does not render as a simple ring.
- World geometry uses metres; canvas pixels are only a camera/display transform. This keeps the renderer compatible with a later city coordinate system.

### Stage 3 performance decision

A headless Chromium harness using the same TypeScript renderer and CSS reported 60 FPS at 1440 x 900 for all four current presets and 60 FPS at 390 x 844 for the mobile Peony test. Current rendered particle budgets were approximately 156 Peony particles on desktop, 138 Chrysanthemum, 103 Willow, 72 post-split Crossette child particles, and 97 Peony particles on the mobile-width quality tier. These figures are indicative development-environment results, not a hardware benchmark.

Canvas 2D remains the correct renderer for the next decision point. The current particle budget does not justify WebGL/Three.js. Revisit that decision only when Stage 5 city perspective, much larger concurrent shell counts, smoke, or measured frame-time pressure creates a requirement.

Sydney skyline/2D city research remains Stage 4 and is not included in the Stage 3 package.

## Stage 4 Sydney city feasibility

Stage 4 is complete as a source and architecture decision. Detailed research is in [`../../fireworks-simulator-sydney-city-research.md`](../../fireworks-simulator-sydney-city-research.md) and source provenance is in [`../../../data/sources/fireworks-simulator-sydney-city.md`](../../../data/sources/fireworks-simulator-sydney-city.md).

### Approved source stack

1. **Overture Maps Buildings** is the global building baseline. It supplies polygons/multipolygons plus optional metre heights, floor counts, building parts and roof attributes. The buildings theme is ODbL because it includes OpenStreetMap.
2. **NSW Elevation and Depth / ELVIS** is the conditional Sydney vertical-enrichment source. Stage 5 must inspect the exact selected tiles, capture date, licence and available classifications before writing a LiDAR rule. Raw point clouds stay local and out of Git/public assets.
3. **NSW foundation water data** is the preferred Sydney Harbour geometry source. Use water/hydro polygons rather than a coast-only line, and pin the exact resource licence/version at extraction.
4. **Official public landmark dimensions** may calibrate a small original procedural landmark layer for structures that ordinary building extrusion cannot represent well.

Rejected/blocked sources:

- NSW Spatial Digital Twin Geoscape building data is not suitable for this public portfolio because NSW Spatial Services describes its distribution as exclusive to NSW Government agencies under restricted terms.
- City of Sydney Floor Space and Employment Survey data remains blocked because the current public catalogue record lists its licence as `Not Specified`.
- City of Sydney planning-control building heights are not a substitute for measured current building heights.
- Third-party downloadable 3D landmark meshes are rejected by default because reuse rights and provenance vary and the geometry is unnecessary for the intended wireframe treatment.

### Shared city coordinate model

Sydney preprocessing should use **GDA2020 / MGA Zone 56, EPSG:7856**, which uses metre easting/northing coordinates. The browser should receive local coordinates only:

```text
x = projected easting - city origin easting
y = projected northing - city origin northing
z = elevation / height in metres
```

Browser axis convention is `x east`, `y north`, `z up`. Every later city should use this same local-metre contract even if its source CRS differs. This allows fireworks, buildings, water and procedural landmarks to occupy one coordinate system.

### Shared 2D and skyline model

The requested plan and skyline views will be camera projections over one city dataset, not separate scene assets.

- plan view: orthographic top-down camera over building footprints and water polygons;
- skyline view: oblique/perspective camera over the same footprints extruded by `z` height;
- firework launch points use the same `x/y` ground location and `z` burst altitude;
- each city bundle stores default camera presets.

No Three.js/WebGL dependency is added in Stage 4. Stage 5 should benchmark a compact wireframe city with the existing Canvas 2D renderer plus a simple 3D-to-2D projection. Move to Three.js only if depth handling, landmark geometry, camera movement or measured performance creates a clear requirement.

### Stage 5 gate and first scene

Stage 5 should begin with a compact Sydney Harbour/CBD test area that includes the Opera House, Harbour Bridge, Circular Quay, representative CBD massing and enough harbour water to place fireworks. The exact bounds must come from the real extract after feature-count and camera-composition review.

Before visual polish, Stage 5 must record:

- Overture feature count;
- direct-height coverage;
- floor-count-only coverage;
- building-part coverage;
- fallback-height count;
- LiDAR-enriched count if LiDAR is retained;
- vertices before/after simplification;
- water vertices;
- raw/compressed browser payload;
- parse/first-render time;
- combined city plus fireworks FPS.

The Stage 4 feasibility decision is **approved with conditions**. The source path is defensible, but no claim is made yet about actual Sydney height completeness or the value of LiDAR enrichment. Those are Stage 5 measurements.

## Stage 5 Sydney scene integration prototype

Stage 5 establishes the browser city contract and validates the shared camera/rendering architecture without pretending that provisional geometry is real Sydney building data.

### Implemented scene contract

- `public/data/fireworks-simulator/sydney-city.json` stores local metre coordinates with `x east`, `y north`, `z up`.
- The local origin is the Heritage NSW Sydney Harbour Bridge location used during Stage 4 research.
- Firework particles now live in the same 3D metre space as the city rather than being generated in a side-on screen plane.
- **SKYLINE** uses a small custom perspective projection over the shared city model.
- **PLAN** uses an orthographic top-down projection over the same geometry.
- Sydney Harbour Bridge, Sydney Opera House and Sydney Tower are lightweight original procedural wireframes calibrated from published scale/location references.
- Canvas 2D remains the renderer. No Three.js/WebGL dependency is introduced.

### Data preparation path

`scripts/data/fireworks-simulator/prepare_sydney_city.py` now provides two modes.

1. Default calibration mode writes the checked-in Stage 5 fixture. Ordinary CBD blocks and the harbour polygon are explicitly tagged rendering hypotheses.
2. `--overture` mode accepts a clipped Overture building GeoJSON, projects EPSG:4326 to EPSG:7856, subtracts the city origin, applies height fallbacks, simplifies footprints and writes the same browser contract. `--overture-release` is required in this mode so source provenance cannot silently drift.

The approved source bounding box for the first profile is `151.195,-33.882,151.222,-33.848`. Raw downloads belong under `data/raw/fireworks-simulator/sydney/` and remain outside Git.

The current Overture release at Stage 5 research time is `2026-09-23.1`. Overture's official Python client can download bounded `building` GeoJSON directly. Building parts remain a real-data follow-up because the current prototype has not yet profiled their Sydney coverage or vertical stacking behaviour.

### Calibration fixture metrics

These numbers describe only the checked-in integration fixture and must not be presented as Sydney/Ouverture data-quality measurements.

| Metric | Stage 5 fixture |
| --- | ---: |
| Procedural/calibration building prisms | 31 |
| Procedural landmark structures | 3 |
| Building footprint vertices | 124 |
| Harbour calibration vertices | 19 |
| Browser city JSON | 10,320 bytes raw / 2,602 bytes gzip |
| Desktop skyline harness | 60 FPS, 156 Peony particles |
| Desktop plan harness | 60 FPS, 156 Peony particles |
| Mobile skyline harness | 60 FPS, 97 Peony particles |

The headless browser runs used 1440 x 900 desktop and 390 x 844 mobile viewports. Treat FPS as an indicative development-environment check, not a hardware benchmark. The city loader also exposes city feature count plus load/first-draw timing in the prototype HUD.

### Stage 5 real-data gate still open

The execution environment could not retrieve Overture/NSW source files, so Stage 5 does **not** yet record real Sydney Overture feature count, direct-height coverage, floor-only coverage, building-part coverage, simplification ratio, real water vertices, LiDAR gain or final compressed payload. The preparation script and browser contract are ready for that replacement pass.

Do not expand to a larger Sydney extent or another city until the real-data profile replaces the calibration fixture and the user reviews the current city/firework composition.

## Stage 5 skyline visual review iteration (2026-10-07)

User feedback: the Bridge appeared implausibly sparse, buildings were see-through, and camera freedom is a future product requirement. This patch improves the existing city scene before any show-builder work.

### What changed

- **Geometry source has not changed:** The public city JSON still contains exactly 31 calibration CBD prisms, three procedural landmarks and 19 invented harbour vertices. It is NOT an acquired Overture extract. No extra Sydney buildings or surveyed roof shapes were invented.
- **Material treatment:** Nontransparent dark blue-graphite side and roof polygons replace translucent building outlines. Skyline drawing culls rear-facing side polygons and depth-sorts visible surfaces/buildings, so users no longer see rear outlines through the object. Fine perimeter lines preserve the wireframe aesthetic. Plan roofs also use opaque fills.
- **Camera correction:** The Stage 5 camera was approximately along the Bridge's north/south span. A new oblique harbour eye/target pair makes the arch readable in depth. The camera is expressed as `{eye: {x,y,z}, target: {x,y,z}}` in city metres and can later be controlled interactively. Separate desktop/mobile presets keep the landmark group in view.
- **Bridge:** Original procedural model has 28 panels along the arch, dark open steel-truss ribs, diagonals, cross braces, vertical hangers, an opaque deck and solid pylons. NSW Transport's conservation management plan independently confirms the historic reduction from 33 to 28 arch panels. The upper/lower curves and member spacing are visual approximations constrained by the published 503 m span, 134 m arch height and pylon height, NOT an engineering or survey model. Open gaps in steel trusses remain physically appropriate.
- **Opera House:** The three simple arcs are replaced by six original, subdivided schematic shell patches with visible rib seams and dark faces. Utzon's spherical-roof principle supports a curved surface model, but no precise surveyed rib/roof coordinates were sourced.
- **Sydney Tower:** Solid shaft/observation-pod massing replaces the single see-through stick/ring.
- **Performance:** The skyline background is painted into a device-pixel-ratio-aware cache and reused while fireworks animate. Resize, initial city load and skyline/plan switching invalidate the cache. The expensive city geometry no longer needs to be recomputed for every particle frame. Canvas 2D remains appropriate for the small fixture.

References: Transport for NSW, *Sydney Harbour Bridge Conservation Management Plan* (https://www.transport.nsw.gov.au/system/files/media/documents/2023/sydney-harbour-bridge-conservation-management-plan_0.pdf); Sydney Opera House, *The spherical solution* (https://www.sydneyoperahouse.com/our-story/the-spherical-solution).

### Camera freedom, held for a dedicated later iteration

The end state is a 6-degree-of-freedom camera, not a sequence of fixed 2D scenes. The local metre scene remains immutable; the view controller owns camera `x/y/z`, orientation (yaw/pitch/roll or quaternion), pivot point, field of view, near/far planes and plan orthographic scale.

- Pointer: primary drag orbit around the pivot; secondary/middle or Shift+primary drag pan; wheel/dolly changes camera distance; keyboard focus on the scene allows WASD movement, Q/E vertical movement, arrow-key look, modifier-assisted roll, and Reset camera. A separate 'free-fly' option may permit moving the eye independently of the pivot.
- Touch: one finger orbit, two-finger pan, pinch dolly, optional two-finger rotation for roll. Prevent default page gestures only when the scene receives an intentional camera gesture; preserve browser/system accessibility gestures. Provide visible camera help and a Reset control.
- Replay versus camera interaction: dragging must never launch a firework on pointer-up. The existing stage-wide click-to-launch must distinguish a short tap from a drag, and users must retain the native Launch button. Keyboard controls must not trap focus or interfere with active form fields.
- Projection: near-plane clipping and accurate depth handling need evaluation once free movement is implemented. Depth-correct foreground occlusion of a firework behind geometry also remains unresolved; future camera tests may justify a depth-buffer/WebGL renderer. Never claim full 3D occlusion based on the current painter-sort.

### Next skyline data gate

The visible CBD detail ceiling is **the current procedural fixture**, not an inherent limit of Overture. Bounded official Overture Buildings `building` and `building_part` records can provide complex polygons and some roof/heights. Until a real Sydney download runs, neither height completeness nor building-part coverage is known. The Stage 5 script is ready for a local Overture `building` extract; building-part stacking still needs a tested data contract. Acquire/profile data before adding more invented city geometry. Compare 1.25 m versus finer footprint simplification only with measured vertex count, compressed payload and frame cost.

### Validation boundary

Strict TypeScript check and inline-script Chromium desktop/mobile skyline+plan review were completed on the checked-in procedural fixture. The browser harness did not load the Astro shell. Full Astro build and real-city FPS benchmarks are not available in this environment. Stop for user visual review before camera controls or show sequencing.

## 2026-10-07 Sydney real geometry acquisition and camera interaction patch

**Scope accepted:** Replace fictional CBD prisms with Overture `building` / `building_part` geometry and enable a free city camera. This iteration supplies a reproducible real-data import path and the free camera. **Real building acquisition is still an unpassed gate**, because the patch-generation environment has no network route to Overture storage. The committed browser JSON therefore remains the Stage 5 calibration scene. It is not accurate to mark real Sydney geometry fully delivered until the user runs the import command on their connected machine and reviews its output.

### Source and output decisions

- New `scripts/data/fireworks-simulator/acquire_sydney.py` is the one-command manual fetch/rebuild workflow. It records the real current STAC release before/after using official Overture Python downloads. It fails without writing the public output on source errors, release drift or fewer than 20 usable local-metre building polygons.
- `prepare_sydney_city.py` now supports multi-polygons, WGS84 bbox clipping, metre simplification and `building_part` hierarchy with `min_height` / `min_floor` values. Parent polygons are omitted when valid parts are available to avoid drawing a complete parent tower over the stepped geometry. Parent footprints remain when no parts can be used. Profile fields record real export counts and source-dependent heights, not hypothetical source completeness.
- Default import tolerance is 1.0 m. Real Overture may contain missing heights/roof details: height provenance remains per shape (`overture-height`, `overture-floors-x-3.2m`, `renderer-fallback-18m`). The harbour water polygon and three skyline landmarks are still original procedural approximations. No City of Sydney FES/Geoscape source, proprietary 3D model or restricted material was added.
- Raw files are under ignored `data/raw/fireworks-simulator/sydney/`; the static client output goes under `public/data/fireworks-simulator/sydney-city.json`, already publicly reachable if published. The output is ODbL-derived; review attribution and share-alike responsibilities before release. No runtime third-party calls or API tokens.

### Free camera and interaction

- Skyline camera stores metre-based `eye` and `target/pivot`, deriving orthonormal right/up vectors for arbitrary orbit with perspective projection and clip-to-near handling. User input changes the camera, never the city geometry.
- Left mouse drag and one-finger drag now **pan**, matching the user's map-grab mental model. Pan is constrained to the city ground plane, so ordinary panning cannot raise/lower the viewpoint.
- Right mouse drag **orbits/rotates** around the current skyline pivot. Wheel, pinch and `+/-` use smoothly interpolated **lens zoom**. Zoom changes projection scale rather than camera altitude.
- Holding both mouse buttons and dragging vertically changes the skyline camera eye height, with a hard stop at the ground clearance. Two-finger twist and `Q/E` yaw around the pivot. `W/A/S/D` and arrow keys pan in matching screen directions. `R/Home` resets.
- Navigation keyboard listeners are global unless the event target is a form control, button or editable text, so users do not have to click/focus the viewport before using movement keys. The stage still receives focus after a handled navigation key and Space/Enter on the focused stage replays.
- Plan reuses left-drag pan, right-drag rotation, directional pan keys, `Q/E` rotation and `+/-`/wheel/pinch zoom. Chorded two-button height control is skyline-only because PLAN has no camera altitude.
- Skyline eye/pivot are clamped to the ground plane. Orbit uses a dynamic minimum elevation so the eye cannot pass below ground.
- A movement threshold prevents dragging from triggering a firework launch. A short left-click/tap replays. Reduced motion keeps static fireworks while permitting deliberate direct camera movement.
- Graphite opaque fills remain. After firework drawing, nearer architecture is redrawn using camera depth so buildings/landmarks mask trails. This is a Canvas painter-depth approximation, not a z-buffer. If real geometry exposes unacceptable per-particle ordering errors, WebGL becomes the preferred next renderer step.

### Validation and stop condition

- Strict TypeScript compile succeeded. Offline Python synthetic polygon, building-part, height-source, zero-feature rejection and GeoJSONSeq tests succeeded. Desktop 1440×900 and mobile 390×844 headless Chromium harness used real pointer mouse gestures and CDP touch drags with no JS page errors; camera moves, resets and view toggles passed. An 800-building synthetic rendering stress scenario was exercised but is **not** a measured Overture performance claim.
- **Not run:** full Astro build (no installed dependencies in supplied snapshot), actual GIS download, real Overture Sydney height/part profile, actual browser city parse/payload benchmark or physical touch-device QA.
- **Next gate:** user runs the one-command import, shares its console profile/screenshot or a fresh small context archive, and reviews a skyline view. Only then should we claim Sydney real-data delivery and consider depth-buffered WebGL for complex occlusion/camera load. Multi-firework show builder remains deferred.


## 2026-10-07 keyboard navigation correction

This review pass is intentionally limited to keyboard camera movement. Mouse/touch remapping, street data and skyline massing are deferred so the input correction can be reviewed independently.

- The previous implementation moved the camera once per `keydown` event, so holding a key inherited the operating system/browser repeat delay and repeat interval. This made movement visibly step rather than progress continuously.
- Navigation now records key state on `keydown`/`keyup` and applies movement inside the existing `requestAnimationFrame` loop using elapsed frame time. A short velocity response smooths start/stop behaviour and diagonal movement is normalised.
- Keyboard panning deliberately uses the inverse of pointer grab semantics. `A/Left` pans the viewport left, `D/Right` right, `W/Up` up and `S/Down` down in both SKYLINE and PLAN. Pointer behaviour is unchanged in this patch.
- `Q/E` rotation and `+/-` zoom use the same continuous frame-time path while held. `R/Home` remains an immediate reset. Shift increases movement rate while held.
- Global shortcuts still work before the user clicks the viewport. Inputs, selects, textareas and editable text retain native key behaviour. Window blur or hiding the page clears held-key state to prevent a stuck camera.

**Next scoped review:** mouse remapping is handled in the focused correction below. Street/network data and skyline massing should remain a separate data/rendering patch after camera input is accepted.

## 2026-10-07 mouse rotate and skyline-height correction

This pass changes only the requested mouse mapping. Keyboard behaviour from the preceding patch and all city/data geometry remain unchanged.

- Right mouse drag now calls the existing skyline orbit controller, so horizontal drag yaws and vertical drag tilts around the current pivot. In PLAN, right drag rotates the plan camera.
- Holding primary + secondary mouse buttons (`buttons === 3`) and dragging vertically changes the skyline camera eye altitude. Drag up raises the eye; drag down lowers it. The eye is clamped at the existing 2 m ground clearance and cannot pass through the ground plane. The target/pivot remains fixed, so this is a true viewpoint-height change rather than lens zoom.
- Wheel, pinch and `+/-` remain the zoom mechanisms. One-finger/left-drag pan, touch gestures and smooth keyboard navigation are otherwise unchanged. Chorded-button altitude is intentionally skyline-only because the orthographic PLAN view has no physical eye height.
- The stage accessible label, Method copy and compact interaction hint are updated to describe the accepted mapping.

**Next scoped review:** once this mouse mapping is accepted, address Sydney street/network data and coordinate integrity as a separate patch, then return to real-building skyline massing/overlap using the same city schema.

## 2026-10-07 skyline dolly correction

This focused follow-up supersedes the earlier SKYLINE lens-zoom references above without changing PLAN behaviour.

- In SKYLINE, wheel, pinch and `+/-` now perform **forward/backward camera translation along the current viewing direction**. The eye and target move together, so yaw/pitch, field of view and eye-target distance stay constant. This is a dolly movement rather than optical/projection zoom. MDN uses the same distinction: zoom changes focal length/FOV, while dollying physically moves the camera.
- Wheel and pinch accumulate a metre-distance request that eases through the animation loop. Held `+/-` uses the existing frame-time keyboard velocity path, so movement remains continuous rather than key-repeat stepped.
- Existing ground constraints remain authoritative. If a forward vector points downward near the ground, the eye cannot pass below the 2 m clearance and the target cannot move below ground.
- SKYLINE projection no longer multiplies focal length by a user zoom scalar, and its readout no longer reports a zoom multiplier. PLAN keeps orthographic zoom because a top-down 2D view has no meaningful forward-facing dolly equivalent in the current interaction model.
- Right-drag orbit, left-drag pan, both-buttons height control and `Q/E` rotation are unchanged.

## Future stages

| Stage | Scope | Stop condition |
| --- | --- | --- |
| 1. Brief and direction | LAB placement, product concept, firework-first boundary. | Complete. |
| 2. Source/data feasibility | Research, provenance, schema, preset structure and physics calibration. | Complete. |
| 3. Firework visual prototype | Four representative effect families and basic custom controls against neutral scale scene. | Complete for local visual review. |
| 4. Sydney city feasibility | Research licensed skyline/building/terrain/water geometry and define common metre-based city coordinate model. | Complete. Source/licence and geometry approach approved with Stage 5 data-quality conditions. |
| 5. Sydney scene prototype | Shared 3D metre scene, plan/skyline cameras, city data pipeline and combined benchmark. | Integration prototype complete; real Overture profile remains open before expansion. |
| 6. Show builder prototype | Multi-firework timing, launch positions, saved local show state. | User reviews sequencing UX. |
| 7. Expansion | More effects/cities only after core system works. | Scoped per approval. |
| 8. Release candidate | Attribution, methodology, accessibility, payload/performance, full QA. | Separate publication approval. |

## Files created in Stage 2

- `docs/fireworks-simulator-research.md`
- `data/sources/fireworks-simulator.md`
- `src/data/fireworks-simulator/firework-presets.json`
- `src/data/fireworks-simulator/firework-presets.schema.json`
- `docs/exec-plans/active/010-fireworks-simulator.md`

Index and current handoff are updated separately.

## Files created or changed in Stage 3

- `src/content/projects/fireworks-simulator.md`
- `src/pages/projects/[slug].astro`
- `src/visualisations/fireworks-simulator/FireworksSimulator.astro`
- `src/visualisations/fireworks-simulator/fireworks-simulator.css`
- `src/visualisations/fireworks-simulator/fireworks-simulator.ts`
- `docs/exec-plans/active/010-fireworks-simulator.md`
- `docs/ux-accessibility-features.md`
- `docs/current-handoff.md`

## Stage 3 decisions and Stage 4 gate

- Canvas 2D was selected and remains sufficient at the current measured particle budget.
- The prototype now has a normal `lab` content entry with `prototype` status and `fullscreen: true`; it is not marked published and is not added to the homepage example set.
- The Pulse relationship is limited to fullscreen restraint, sparse HUD treatment and visual-first presentation. No Pulse fuel data, fuel semantics or map code is reused.
- Stage 4 should begin only after the user reviews the shell motion, scale, control density and overall visual direction. Stage 4 is city-source feasibility, not immediate Sydney rendering.

## Files created or changed in Stage 4

- `docs/fireworks-simulator-sydney-city-research.md`
- `data/sources/fireworks-simulator-sydney-city.md`
- `docs/exec-plans/active/010-fireworks-simulator.md`
- `docs/index.md`
- `docs/current-handoff.md`

## Stage 4 decisions and Stage 5 gate

- Keep the project in LAB.
- Use Overture as the global building baseline so Sydney does not create a one-off city architecture.
- Use NSW open elevation and water sources only after pinning the exact Stage 5 resources and licences.
- Keep restricted Geoscape and unresolved-licence City of Sydney data out of the publishable pipeline.
- Keep raw GIS/LiDAR source files local and out of Git.
- Use local metre coordinates with `x east`, `y north`, `z up`.
- Keep both requested views as cameras over one city model.
- Keep Canvas 2D for the first city benchmark; add Three.js only if Stage 5 measurements justify it.
- Do not expand beyond the compact Sydney Harbour/CBD test extent until height coverage, payload and combined rendering performance have been measured.

## Files created or changed in Stage 5

- `scripts/data/fireworks-simulator/prepare_sydney_city.py`
- `scripts/data/fireworks-simulator/README.md`
- `public/data/fireworks-simulator/sydney-city.json`
- `src/visualisations/fireworks-simulator/FireworksSimulator.astro`
- `src/visualisations/fireworks-simulator/fireworks-simulator.css`
- `src/visualisations/fireworks-simulator/fireworks-simulator.ts`
- `docs/fireworks-simulator-sydney-city-research.md`
- `data/sources/fireworks-simulator-sydney-city.md`
- `docs/exec-plans/active/010-fireworks-simulator.md`
- `docs/ux-accessibility-features.md`
- `docs/current-handoff.md`

## Stage 5 decisions and Stage 6 gate

- Keep the project in LAB.
- Keep one metre-based 3D scene and project it into skyline or plan view rather than maintaining separate city assets.
- Keep Canvas 2D after the first combined benchmark.
- Treat the checked-in CBD massing and harbour outline as calibration-only geometry.
- Replace the calibration massing with a bounded Overture extract before claiming Sydney building completeness or expanding the city.
- Do not add show sequencing yet. The next decision is user review plus the real-data city profile, not Stage 6 feature work.


## 2026-10-07 skyline fidelity correction after user visual review

The user's reference images identified two model/data errors and one interaction mismatch.

1. **Fallback skyline composition was misleading.** The checked-in city was never a real building extract. It contained only five named tall towers plus generic block rows, so Barangaroo and the Circular Quay harbour edge were underrepresented. The calibration generator now adds One Sydney Harbour Tower 2, International Towers 1 to 3, Quay Quarter Tower and Governor Phillip Tower as secondary published-height/coordinate anchors. The fallback increases from 31 to 37 building prisms, but all anchor footprint sizes/rotations and 26 generic background blocks remain hypotheses. Do not describe this as real geometry.
2. **Opera House shell logic was internally wrong.** The prior renderer alternated a `reverse` flag across six tapered surfaces, directly causing neighbouring sails to point in opposite directions. Official Sydney Opera House material describes a common spherical solution with mirrored shell profiles, while UNESCO describes three interlocking vaulted shell groups. The renderer now uses three conceptual groups containing eight ribbed, opaque shell surfaces. They share a northward rise with modest group fanning, shorten horizontal run relative to height, and vary peaks/heights/lean. It remains original schematic geometry rather than a surveyed model.
3. **Navigation follows separate pan/rotate/height/zoom semantics.** Left drag/one-finger pan, right mouse drag orbits, both mouse buttons plus vertical drag change skyline camera height, wheel/pinch and +/- lens-zoom, two-finger twist plus Q/E rotate, WASD/arrows pan, and R/Home reset. Keyboard navigation works globally, including from non-entry button focus; data-entry/editable controls keep native key behaviour. Skyline camera height cannot cross below ground.

### Current renderer boundary

Buildings and solid landmark surfaces now occlude fireworks by redrawing architecture closer than the burst centre after the firework. This materially fixes x-ray trails but remains a painter approximation. The requirement for arbitrary camera movement plus reliable per-particle/building occlusion is now the strongest potential justification for a later WebGL depth-buffer pass once the real Overture extract is available.

### Validation for this correction

- standalone strict TypeScript passed;
- four Python preparation tests passed, including the required harbour-front fallback anchors and existing Overture part/height/failure cases;
- generated calibration JSON reports 37 buildings and 148 footprint vertices;
- inline headless Chromium desktop interaction checks completed with no page errors;
- global `W` worked before viewport click and moved focus to the stage; navigation also worked while Reset View and Launch buttons retained focus;
- left drag changed horizontal POV while holding `Z` constant;
- the earlier right-drag lens-zoom and both-button orbit checks are superseded by the focused mouse remap below;
- `Q` rotation worked;
- repeated orbit stress did not put the camera below the ground limit;
- CDP touch simulation at 390 x 844 verified one-finger pan and two-finger pan/pinch/twist while keeping camera height constant;
- the final eight-shell Opera House approximation was visually checked after shortening shell run-to-height proportions.

Not run: full Astro build, real Overture acquisition/profile, physical multi-touch device QA, and real-city occlusion/performance. The Overture gate remains the next data task rather than adding further invented buildings.

## 2026-10-07 Sydney streets and coordinate-integrity pass

Scope is limited to the transport layer. Firework physics and the approved camera mapping are unchanged.

- Add city-agnostic `roads` and `transportPoints` arrays to the browser bundle.
- Sydney RoadSegment is the primary centreline/name adapter. Its lane field is stored as a category because code `2` means `TwoOrMoreLanes`, not exactly two lanes.
- Bounded OSM enrichment supplies exact lane counts/width only when explicitly tagged and adds traffic-signal/crossing points. Three-or-more shared segment endpoints produce derived junction points.
- Overture Transportation is the future international network contract because its segments/connectors, names, road class, width, surfaces, speed and level concepts generalise beyond NSW.
- Roads render between water/grid and architecture. Names are retained but labels are deferred.
- Ground-road corridors and buildings use the same EPSG:7856/local-metre frame. Procedural calibration footprints may be adjusted because they are invented. Real Overture geometry is never silently clipped; material ground conflicts are flagged and withheld from rendering pending review.
- This execution environment cannot acquire the real bounded street data. The checked-in fixture carries zero roads; `acquire_sydney_transport.py` is the focused network command and `acquire_sydney.py` now includes streets in the full data acquisition.

Review gate: run the transport acquisition locally, inspect street alignment around Circular Quay/Barangaroo, review exact-lane coverage and conflict counts, then decide if the road styling and point density are suitable before adding labels or expanding Sydney.
## 2026-10-08 real Sydney acquisition and stale-cache correction

The Stage 5 real-data gate has now been exercised successfully on the user's connected Windows environment. The generated browser bundle uses Overture release `2026-09-23.1` retrieved 2026-10-08.

Measured local profile:

- 4,567 input Overture building features and 528 input building-part features;
- 4,692 exported building records and 529 exported building parts;
- 389 direct-height records (8.3%), 3,549 floor-derived heights (75.6%), 754 assumed heights (16.1%);
- 42,265 input footprint vertices simplified to 29,816 at 1 m tolerance;
- 2,737 usable NSW road segments from 2,755 bounded inputs;
- 1,938 named road segments, 926 with explicit exact lane counts and 2,601 with known NSW lane category;
- 9,083 road vertices, 1,409 derived junctions, 683 traffic-signal points and 1,520 crossing points;
- 559 material ground-road/building conflicts, all withheld under the existing non-destructive real-building policy;
- 2,877,881-byte browser JSON and about 452,312 bytes under the local gzip estimate.

The first browser review still displayed `CALIBRATION`, `CITY 34` and `STREETS 0`. This was not an acquisition or road-rendering failure. `loadCity()` used `fetch(..., { cache: 'force-cache' })`, allowing an older same-URL calibration response to be reused. Replace this with `cache: 'no-cache'` so the client revalidates `/data/fireworks-simulator/sydney-city.json` before reuse. This is especially important during local data iteration, where the derived file changes while its URL remains stable.

Do not package the old calibration `sydney-city.json` in the cache-fix patch. The locally generated real-data file is newer and must be preserved. After this correction, the immediate review is road visibility, city parse/render performance, the 559 withheld building conflicts and skyline fidelity using the actual Overture geometry.


## 2026-10-08 GPU city-rendering performance pass

The first real Sydney browser bundle changed the renderer decision. The city now contains 4,692 building records, 2,737 roads and several thousand transport markers. The source data should stay intact; reducing feature counts or simplifying away visible geometry is not the preferred performance strategy.

### Measured Canvas bottleneck

A synthetic browser fixture matching the real feature counts reproduced the user's wide-view slowdown. Before this pass the Canvas path spent substantial time on repeated camera-basis calculations, road segment strokes, building projection/sorting and a second nearer-architecture pass used to mask fireworks. Static rendering could also remain slow because that second architecture pass ran on every firework frame.

The low-risk Canvas corrections are retained as fallback improvements:

- camera basis and focal length are cached until camera/viewport state changes;
- building bounds/winding and road segments are prepared once after JSON load;
- offscreen buildings/road segments are culled before detailed projection;
- road segments are grouped into width/style buckets so thousands of source segments become a small number of Canvas paths;
- ordinary building faces are grouped into depth/style buckets instead of thousands of independent fill/stroke calls;
- the foreground architecture mask is cached on a transparent canvas and refreshed after camera input settles rather than rebuilt on every firework frame.

These changes preserve the source geometry, but Canvas-only camera movement still remains CPU-bound at the full Sydney count. That is now measured evidence for a GPU city pass rather than a speculative technology change.

### WebGL2 skyline city pass

SKYLINE now attempts a dependency-free WebGL2 renderer before falling back to Canvas 2D.

- Building source footprints and building parts are converted once into static GPU triangle and line buffers. Roofs use ear-clipping triangulation with a conservative fan fallback. Side walls preserve `minHeightM` and full source footprint coordinates.
- Footprint winding is normalised only in the GPU mesh copy so opaque building triangles can use back-face culling; source JSON is not changed.
- A depth buffer replaces the Canvas painter approximation for sourced building/building and building/road ordering. This also prevents internal faces from visually shining through stacked podium/tower parts.
- Road centreline segments are expanded into world-metre carriageway quads using the existing derived display width. Major/minor/tunnel groups, road edges and available multi-lane centre markings use separate static buffers.
- Junction, signal and crossing coordinates are uploaded as GPU points. No source records are dropped to meet a frame budget.
- Camera projection is calculated in the vertex shader using the same eye/target/roll, horizon offset, screen origin and perspective focal length as the existing Canvas projection. Camera movement therefore updates a small set of uniforms rather than rebuilding projected geometry.
- The procedural Harbour Bridge, Opera House and Sydney Tower remain on the lightweight Canvas overlay because those authored shapes currently use custom line/surface generators. Water/grid also remain lightweight Canvas overlays.
- Firework particles remain Canvas 2D in this pass. A cached foreground Canvas mask restores the existing firework/building occlusion approximation after camera movement settles. A future single-pass WebGL firework renderer remains optional, not required for this performance correction.
- PLAN deliberately remains on the existing Canvas renderer in this pass. The reported severe slowdown came from free SKYLINE camera movement. If PLAN later shows the same measured issue, the same static GPU buffers can gain an orthographic shader path without changing the data schema.

WebGL2 is treated as progressive enhancement. If `getContext('webgl2')` fails, the complete Canvas renderer remains active and telemetry reports `CANVAS 2D` instead of `WEBGL CITY + CANVAS FX`.

### Near-ground camera correction

The previous 2 m camera-eye clamp was safe but visually too high for street-level inspection. The mathematical hard stop is now 0.25 m above `z = 0`. Orbit, chorded-button altitude change and forward/backward dolly still run through the same ground constraint, so the user can approach the ground closely but cannot cross below it.

### Validation boundary

- strict standalone TypeScript passes for the main renderer and new WebGL module;
- the synthetic real-count fixture confirms that cached foreground masking restores 60 FPS after camera motion on the Canvas fallback and confirms that continuous Canvas city reprojection remains the bottleneck;
- this execution browser exposes no WebGL2 context, so the GPU path cannot be performance-measured here and must be reviewed on the user's local hardware with the generated real Sydney bundle;
- full Astro build is still unavailable in the supplied snapshot environment.

**Review gate:** user confirms the local renderer telemetry reports WebGL, tests wide-view continuous pan/orbit/dolly, and checks that opaque building/road depth ordering and the 0.25 m ground floor behave correctly. Do not remove buildings/streets or reduce source simplification merely to chase FPS before this GPU review.

## 2026-10-08 free-look ground constraint and pointer-anchored movement

Local WebGL review passed the performance gate: the user's real 4,692-building / 2,737-street Sydney scene reports `WEBGL CITY + CANVAS FX` at 60 FPS on their desktop hardware. The city/GPU architecture therefore stays unchanged in this correction.

The next review exposed a camera-model issue rather than a renderer issue. The previous SKYLINE camera still used an eye/target orbit sphere. `constrainSkylineGround()` also forced the look target to remain at or above ground. When the user moved forward while looking down, the target could reach `z = 0` before the physical camera eye did, making the camera appear to hit a high invisible floor. Vertical right-drag rotation was also coupled to the radius around that hidden pivot.

Corrections:

- Ground collision now applies to the physical camera eye only. The eye remains at least 0.25 m above `z = 0`; the look target may legitimately sit below ground when the user looks downward. A safety correction lifts eye and target together only if an operation somehow places the eye below the floor, preserving the viewing direction.
- Right-drag changes yaw/pitch in place. The eye's X/Y/Z does not move merely because the user looks around, eliminating the fixed-pivot rotation sphere from normal camera control. `Q/E` and two-finger twist use the same in-place viewing-direction model for yaw.
- Downward physical translation is clipped against the current eye height and movement direction. The camera can therefore approach the 0.25 m floor from any viewing angle without being stopped early by the target or pivot.
- SKYLINE wheel movement is pointer-centred. Client pointer coordinates are converted into the same perspective ray used by the skyline projection, and the queued physical translation follows that ray instead of the screen-centre forward vector. Repeated wheel input therefore moves toward/away from the location under the cursor while keeping lens/FOV unchanged.
- A two-finger SKYLINE pinch records a fixed world anchor from the midpoint where the second touch begins. Pinch expansion/contraction moves toward/away from that anchor; two-finger pan and twist remain available in the same gesture. This avoids pinch movement snapping toward the centre of the viewport.
- `+/-` remains centre-ray forward/backward movement because keyboard input has no pointer anchor. PLAN retains its existing orthographic zoom semantics.
- Wheel deltas are normalised across pixel, line and page `deltaMode` values before movement is queued.

No city geometry, streets, fireworks physics or WebGL buffers change in this pass. The next local review should test near-ground forward travel while looking down, right-drag free-look at 0.25 m eye height, wheel movement with the cursor near each corner/edge, and two-finger pinch on physical touch hardware.

## 2026-10-08 map-follow mouse-control experiment

Local review found that left drag has the desired mental model: the user grabs the city and the rendered map follows the pointer, even though the implementation achieves that by translating the camera in the opposite world direction. Right-drag free-look and eye-only altitude adjustment felt inconsistent because they acted on the viewpoint rather than preserving the same map-follow relationship.

This experiment keeps the current wheel/pinch pointer-anchored movement and WebGL city renderer unchanged, but remaps the two mouse gestures:

- right drag uses counter-rotated yaw/pitch so the rendered map follows horizontal and vertical pointer movement; the physical eye remains fixed;
- `Ctrl` + left drag is an exact alternate entry point to the same rotation path;
- left+right chorded vertical drag translates eye and target together so the city follows the pointer vertically while the view direction is preserved; the 0.25 m eye floor still applies;
- `Shift` + left drag uses the existing pointer ray and queued dolly path, with upward drag moving toward the pointer location and downward drag moving away;
- the mouse wheel is deliberately untouched so the user can compare the new drag shortcut against the accepted pointer-centred wheel behaviour;
- modifier/chorded drags suppress tap-to-launch; touch and keyboard mappings otherwise remain unchanged.

PLAN receives equivalent modifier affordances where they make sense (`Ctrl` + left rotates, `Shift` + left changes orthographic zoom), but the two-button height gesture remains reserved for SKYLINE because PLAN has no physical camera altitude.

**Review gate:** test the map-follow feel locally. If right rotation or chorded height is less intuitive, revert this experiment without changing the accepted WebGL, street-data or pointer-wheel architecture.

## 2026-10-08 map-pivot rotation correction

Local review clarified that the previous map-follow experiment still behaved like first-person free-look because it rotated the look direction around a fixed eye. The required interaction is a model/map manipulation gesture.

- Right mouse drag and `Ctrl` + left drag now keep the current map pivot (`camera.target`) fixed and orbit the viewpoint around that pivot. This is the same interaction model as grabbing a physical model rather than turning the viewer's head.
- Vertical semantics are explicit: dragging **down** reduces viewing elevation so the ground plane stands more upright/parallel to the monitor; dragging **up** increases viewing elevation so the world flattens toward top-down.
- Horizontal semantics remain map-follow: dragging right turns the rendered map right, implemented by orbiting the viewpoint in the opposite azimuth around the fixed pivot.
- The orbit radius is preserved. Its minimum elevation is derived from the 0.25 m physical eye clearance and the current pivot/radius rather than from a fixed hidden sphere, so the control can still reach near-ground viewpoints.
- Left pan, both-button height, Shift + left pointer movement, wheel movement, keyboard navigation, touch handling, WebGL city rendering and the real Sydney dataset are unchanged.

**Review gate:** confirm that a vertical right-drag now feels like tilting a physical Sydney model: down stands it up, up lays it flatter. If accepted, this replaces the earlier fixed-eye map-follow rotation experiment.


## 2026-10-08 input-speed calibration pass

Local review accepted the current interaction model but found the relative input rates mismatched: mouse pan was slightly too sensitive, map-pivot rotation was noticeably too sensitive, chorded height adjustment was a little too fast, while sustained keyboard navigation felt substantially slower than the pointer controls. Wheel/pointer-centred forward/back travel is accepted and remains unchanged.

This pass centralises those sensitivity decisions instead of continuing to tune each handler independently:

- mouse SKYLINE/PLAN pan uses 78% of the prior CSS-pixel travel; one-finger/two-finger touch pan keeps its existing scale;
- map-pivot yaw is reduced from `0.005` to `0.0032` radians per CSS pixel and vertical map-pivot tilt from `0.0025` to `0.0016` radians per CSS pixel;
- chorded two-button height travel keeps its distance-aware model but multiplies the previous metres-per-pixel response by `0.75`;
- keyboard pan targets 520 CSS-pixel-equivalent units/s normally and 900 with Shift, then runs through the same mouse pan factor. Its direction intentionally inverts pointer-drag input because keyboard arrows describe viewport movement: W/Up matches dragging down, A/Left matches dragging right, and the opposite keys mirror those pairs;
- keyboard `Q/E` no longer use the older fixed-eye yaw path. They drive the same map-pivot rotation used by right drag at 1.2 rad/s normally and 2.0 rad/s with Shift;
- keyboard `+/-` retains centre-ray physical movement but its metres-per-second rate now scales with camera distance, matching the distance-aware character of accepted wheel movement instead of using one fixed speed at every scale;
- keyboard easing remains frame-time based but response increases from 15 to 18 so the higher target rates are reached without returning to key-repeat stepping;
- PLAN keyboard zoom is also moderately faster so keyboard navigation no longer feels disproportionately slow relative to wheel input;
- mouse wheel and pointer-centred wheel-ray calculations are intentionally unchanged.

The implementation keeps mouse, keyboard and touch as separate input devices where they need different physical sensitivity. Mouse drag follows grab-the-map direction, while keyboard pan intentionally uses the inverse drag direction so arrow/WASD labels match the direction the viewport moves. The review gate is subjective local feel at ordinary and high-DPI mouse settings: pan should remain faster than the old keyboard pass without outrunning the cursor, rotation should feel controlled rather than disorienting, and keyboard controls should now be a practical alternative rather than a slow accessibility fallback.


## 2026-10-08 keyboard direction regression fix

The input-speed tuning pass accidentally reintroduced a previously fixed direction regression by feeding keyboard pan through the exact same drag deltas as mouse input. Keyboard controls represent viewport direction, while mouse input represents grabbing and dragging the map, so the two inputs must use opposite drag deltas.

- `W/Up` now produces the same viewport movement as a mouse drag downward.
- `S/Down` now produces the same viewport movement as a mouse drag upward.
- `A/Left` now produces the same viewport movement as a mouse drag right.
- `D/Right` now produces the same viewport movement as a mouse drag left.
- The speed tuning, Q/E rotation, +/- forward/back movement, mouse controls, touch controls and WebGL renderer are unchanged.

## 2026-10-08 keyboard gesture-group remap and speed increase

Local review clarified that the keyboard should not duplicate one generic navigation scheme. Each key group should correspond to one accepted mouse gesture family, with the established inverse-direction rule retained for drag-like actions.

- `W/A/S/D` now map only to the left-drag pan model. `W` synthesises the viewport result of mouse drag down, `S` drag up, `A` drag right and `D` drag left.
- Arrow keys now map to right-drag map-pivot rotation instead of panning. `Up` synthesises right-drag down and therefore stands the map more upright; `Down` synthesises right-drag up and flattens the map; `Left` synthesises right-drag right and `Right` synthesises right-drag left. This adds continuous keyboard pitch/tilt as well as yaw.
- `Q/E` now map to the two opposite directions of the chorded map-height action instead of rotation. The mouse chord remains vertical-drag based; keyboard Q/E simply invoke its positive/negative height directions without changing the mouse gesture.
- `+/-` remain the keyboard equivalent of wheel movement. `+` moves forward/in and `-` backward/out. SKYLINE remains physical centre-ray travel; PLAN remains orthographic zoom.
- Sustained keyboard targets are increased again: pan 760 px-equivalent/s, rotation 560 px-equivalent/s and height 460 px-equivalent/s in normal mode, with higher Shift rates. Centre-ray travel rises to roughly `0.78 * camera distance` m/s before clamping, with Shift at `1.2 * distance`. Frame-time easing remains, so the faster controls are still continuous rather than key-repeat stepped.
- Mouse, touch, wheel, WebGL city rendering and Sydney data are unchanged.

**Review gate:** confirm WASD feels like the keyboard analogue of left-drag, arrows feel like the inverse keyboard analogue of right-drag on both axes, Q/E give usable vertical map-height control, and +/- feels proportionate to the accepted wheel travel.

## 2026-10-08 mouse-only combined drag and wheel-height controls

The next interaction review separates drag composition from altitude control so the mouse can expose the full camera without turning the left+right chord into a dedicated third drag mode.

- Holding left and right mouse buttons while dragging now applies the existing left-drag pan and right-drag map-pivot rotation together. SKYLINE therefore pans and orbits from the same pointer delta; PLAN pans and applies its horizontal rotation from the same delta. The chord no longer changes camera height.
- Ordinary wheel input with no mouse button keeps the accepted pointer-centred SKYLINE forward/back movement and ordinary PLAN zoom.
- Left button + wheel is the direct SKYLINE height control. Wheel-up raises the eye and target together, wheel-down lowers them, and the 0.25 m ground clearance remains the lower hard stop. This gesture cancels any queued forward/back travel or deferred height transition before applying the direct height change.
- Right button + wheel is a deferred SKYLINE height selector. The scene remains still while wheel input moves a target node on the existing right-side vertical scale. The node is silver/grey during ordinary camera movement and uses the existing gold focus colour while a height target is being selected or settled.
- Releasing the right button eases eye and target vertically toward the selected absolute eye height. The view direction is preserved because only a shared `z` translation is applied. New direct camera input cancels that transition. Under `prefers-reduced-motion`, release applies the selected height immediately instead of animating.
- The right-side height scale now tracks the physical camera eye rather than acting as a fixed decorative 300 m marker. It starts with a 600 m range, expands upward in 100 m increments when needed, and keeps 0 m at the lower end. PLAN retains its 2 km scale treatment and hides the camera-height node.
- Existing keyboard groups remain unchanged: WASD pan, arrows rotate/tilt, Q/E change height, +/- move in/out, and R/Home reset. Existing touch pan/pinch/twist behaviour is unchanged.
- Mouse-button wheel routing uses the current `buttons` bit field rather than `button`, because wheel events are not button press/release events. Exact left-only and right-only wheel states are assigned the new height actions; a wheel while both buttons are held is deliberately ignored so the dual-button chord remains a drag composition gesture.

**Review gate:** test three transitions on a physical mouse: dual-button diagonal drag should visibly combine pan and rotation; left button + wheel should move height immediately without launching a firework on release; right button + wheel should move only the highlighted height node until the right button is released, then the scene should settle vertically to that point without a jump.

Validation in the patch environment: strict standalone TypeScript passes for `fireworks-simulator.ts` and `city-webgl.ts`; focused source assertions pass for the three wheel states, dual-button composition, release-to-target behaviour, reduced-motion fallback and height-node UI wiring. `npm run build` was attempted but cannot run from the supplied context archive because dependencies are not installed and `astro` is unavailable.


## 2026-10-08 ground orbit, near-overhead orientation and height targeting feedback

This review changes camera feedback and camera constraints without touching the Sydney building/street bundle, fireworks physics, WebGL geometry, zoom speed or existing input mappings.

- Right-button + wheel: the existing height marker changes from its normal 7 px dot to a 3x enlarged gold dot while selecting. Releasing right click animates the marker back to normal size immediately, while the existing camera-height transition remains gold until it finishes. A pointer-transparent three-state overlay beside the height ruler shows up/level/down relative to the live eye; up/down opacity increases with target separation (300 m ramp). Level highlights within 3 m of current height. The cue is hidden outside selection and in PLAN. Reduced motion disables CSS morphing.
- Camera ground bounce: orbit down around the existing pivot until the eye physically reaches 0.25 m clearance. Additional downward rotation progressively looks upward from that grounded eye instead of stalling at the pitch limit or crossing the ground. Returning toward the original drag direction removes the extra look-up before restoring the normal pivot orbit. The original pivot and radius remain stored through the look-up state, including yaw. Pan shifts the stored pivot; a vertical translation or separate fixed-eye twist exits the bounce state at its current view. Only reachable ground triggers the bounce; close high-altitude orbits retain the 89° angular clamp.
- Camera overhead flip: both Canvas 2D and WebGL rendering used to replace world-up Z with Y once `abs(forward.z) > .98`. That made the right/up frame jump when looking almost vertically downward. Both renderers now use uninterrupted world-up Z. The camera maintains the existing maximum 89° vertical elevation, so the reference never becomes parallel to the forward vector.
- Active UI feedback is kept outside the interactive stage and uses `aria-hidden` for decorative symbols; the existing camera status announces the start and selected height of right-wheel targeting. The stage's accessible instruction and Method text describe the floor response and targeting cues.

Validation in the patch environment: strict standalone TypeScript passed for the two camera/render modules; an isolated harness extracted the actual rotation and camera-basis code and exercised downward orbit, ground hit, look-up continuation, horizontal yaw while grounded, drag reversal, near-vertical orientation continuity and unit camera basis. Full Astro build and browser mouse testing remain pending because the context ZIP omits dependencies.

**Review gate:** test right-wheel marker growth and cue strength, right-drag and chorded ground bounce, smooth reversal, and overhead spin on the user's mouse. Confirm yaw while grounded remains predictable.

## 2026-10-08 Fireworks camera feedback and controls presentation

- Stage-scoped UI review. Reuses the current camera physics, city data and WebGL geometry. No new firework presets, assets or publication changes.
- Motion focus: camera movement dims the settings form to 3.5% opacity, restoring it after input settles; the drawer tab stays visible and usable. Scene crosshair is rendered in the DOM rather than through the OS cursor because CSS cannot fade a native cursor to transparency. It hides during movement, returning after movement stops. This keeps all other form inputs on standard cursors.
- Intro-to-compact identity: initial FIREWORKS heading is unchanged; at 5 seconds or first camera movement it shrinks to a roughly 1.65–2.55 rem white mark under the LAB kicker. This transition resets on each page load. Reduced-motion users receive the compact state without an animation.
- Right-wheel height: a grey camera-height ghost stays behind while the selected gold node travels; gold grows from 1x to 3x at 150 m separation from the ghost. At crossing it returns to 1x before growing again on the other side. Release keeps gold at target while the camera and ghost ease toward it and the gold shrinks; the grey regular node remains at arrival. Existing directional cue is unchanged. Live pointer-button state supplements wheel `buttons`, which may be zero in Chromium even while a button is held.
- Receding control drawer: left-edge button and horizontal pull gesture retract the entire form off-screen to the left, leaving a 36 px tab. The form becomes inert when hidden; tab remains keyboard operable and reports `aria-expanded`. No persistent preference yet.
- Browser menus: capture-phase `contextmenu` cancellation applies to the entire Fireworks page, including text/form elements. Native Firefox Shift + right-click context menu bypass cannot reliably be overridden. The cancellation is removed on pagehide and does not affect other projects.
- Check: strict TypeScript, PostCSS and desktop/mobile Chromium fixture pass. A compiled-source Chromium runtime test covers wheel-button fallback, growing/shrinking nodes, ghost travel, tab toggle and keyboard-focus state, and form context menu suppression. Full Astro and hardware testing remain for local review.

## 2026-10-08 live height-scale tracking and pointer response

This is a focused camera-feedback adjustment. SKYLINE right-drag and dual-button drag already changed physical eye height on every pointer delta, but the height node changed its layout `top`, with animation tied to main-thread repaint. Now node and ghost heights use pixel `translate3d()` CSS transforms with a short 90 ms linear follow transition, driven by each live camera update. The cached scale-track height is recalculated when viewport geometry changes; right-wheel ghost/target movement and reduced-motion overrides remain intact.

The in-scene cursor also avoids reading stage geometry on each mouse event: it uses cached viewport bounds and writes only a 3D translation, with a 65 ms opacity fade rather than 115 ms. No mouse or keyboard navigation directions, camera physics, height targeting semantics or city data change.

Validation: strict TypeScript passed, and compiled-source Chromium runtime tests verified marker movement *before release* for right and combined-button drag, pixel-transform cursor alignment, right-wheel ghost/target convergence and resize tracking. Astro build and real high-refresh/high-DPI mouse QA remain for local review.

## 2026-10-08 Sydney Tower co-located sources and depth pass

Visual inspection found two overlapping Overture parts at Sydney Tower alongside the separate authored Centrepoint model. Parts `176723e1-0a5a-37b0-8a56-9903cbc7fe60` (290 m) and `3e5f6979-40c8-3584-ab4e-e526f72b5ef5` (base 240 m, rise 270 m, top 510 m) are excluded from the source-derived browser building group. Westfield Sydney's 38.4 m retail part stays in place, along with every surrounding building/road record. The physical 309 m source-backed tower model remains anchored at the pre-existing coordinate; no unsupported relocation or change to Overture's general `height + min_height` handling is applied.

The preparation script now audits authored `observation-tower` positions against co-located **tall** Overture footprint centroids (20 m, at least 55% of the landmark height), reports suppressed IDs, and applies this operation on all future city bundle builds. Its `--repair-existing` mode applies the identical rule to the current checked-in real Sydney export when raw GIS acquisitions are not mounted. Browser city goes from 4692 to **4690 buildings**, with source-level IDs retained as audit metadata. The manually prepared correction does not assert a new Overture retrieval; `generatedAt` reflects only the browser bundle's correction. The original footprint-source vertex-before count remains a source-side processing metric; after-simplification counts and the browser payload size match the corrected export.

In SKYLINE WebGL mode the tower's solid shaft, cylindrical deck and spire are now included in the opaque building/depth and landmark-line passes, instead of being drawn again on the top-level Canvas city overlay. PLAN and Canvas-only fallback still draw the tower with the existing 2D projection. This fixes Centrepoint occlusion against the sourced WebGL buildings without expanding the scope to the complex Bridge and Opera House meshes, which remain Canvas overlays. Effects occlusion in the separate Canvas firework layer remains painter-based and is a future rendering consideration.

Validation: focused Python suite (10 tests, including two new landmark regression cases) and strict standalone TypeScript compilation passed. `npm run build` was attempted but unavailable without Astro dependencies. Next: desktop orbit test around Centrepoint, especially low angles and overhead, plus check the PLAN/Canvas fallback.

## 2026-10-08 optional inner-Sydney extent for review

- Scope: first bounded extension of the existing real Sydney scene, keeping a single static browser bundle. The current published-in-repo `sydney-city.json` is **not replaced** because this patch environment cannot access the additional Overture/NSW/OSM source geometry.
- New opt-in `acquire_sydney.py --extent inner-sydney` uses `[151.180,-33.903,151.238,-33.829]` for building, building-part, NSW road and OSM extract and clip. `--extent cbd` remains the default `[151.195,-33.882,151.222,-33.848]`. The same world-metre Harbour Bridge origin, roof-height fallbacks, source identifiers and landmark duplication audit apply across the wider area.
- The builder and transport-only refresher use the selected/stored bounding box rather than silently clipping to the old CBD. Expanded acquisition rejects accidental core-only data and backs up the previous CBD JSON in the ignored local raw folder before replacement. The SKYLINE grid can cover the wider bounds; camera defaults and all pointer/keyboard controls stay unchanged.
- Limitations: no extra source polygons can be embedded without acquisition on a connected machine. Wider initial JSON/mesh size, GPU throughput and load time remain unmeasured; no streaming/LOD yet. Harbour/water beyond the existing procedural polygon and vertical terrain enrichment are separate future work.
- Checks: offline data tests verify clipping and four-direction feature coverage; strict TypeScript check to be recorded with delivery. Next user action: apply ZIP, run acquisition command in Windows PowerShell and review FPS/visual coverage before increasing area again.

## 2026-10-09 adaptive camera-controls guide and scene UI focus

- Keep the existing `is-camera-moving` state as the single camera-motion signal for wheel smoothing, mouse/touch drag, keyboard and automated landmark camera flight. While active, fade only UI overlays to 0.23 opacity; exempt the height scale/height target/directional cue and scene canvases. Do not turn off depth testing or duplicate city rendering.
- Provide two reference cards at the bottom right, mouse/touch and keyboard. The most recent valid scene input expands its matching card, while the other remains identifiable at reduced size. Touch supplies its own gesture labels. Use grid-size transition instead of extra per-frame JS; disable morphs under `prefers-reduced-motion`.
- The Map / View Options menu has a native navigation-guide switch and the guide has a `Hide guide` button. Both synchronise through one visibility setter and a try/catch-protected localStorage preference. The guide is visible by default. The prior bottom-centre hint remains nonvisual to avoid two competing visible guides.
- Keep the camera control mapping and landmark framing unchanged. PLAN help hides unavailable height shortcuts. Pending user device review: desktop pointer/key switching, phone/tablet guide overlap with the firework drawer, accessibility focus, screenshot fit and fade strength.


## 2026-10-10 denser draft night sky follow-up

- Follow-up after first visual review: the 53-star prototype felt too sparse and the Moon may legitimately be absent near new-moon/default-night combinations.
- The draft sky now keeps the real named bright-star catalogue and adds **420 deterministic faint background speckle stars** to visually fill the sky. These background stars are stable pseudo-catalogue points in J2000 space, not audited named sources.
- This is an intentional prototype compromise: preserve correct overall sky orientation and the real bright-star anchors, while accepting an augmented faint background until a fuller audited catalogue (for example BSC5 or another licence-cleared source) is imported.

- Added a compact skyline orientation HUD in the top-right: heading/cardinal direction, elevation angle, and a perspective compass that tilts flatter as the camera looks upward. The Moon render is deliberately enlarged from true angular size so it remains legible in the fireworks-planning viewport.
