## 2026-10-10 Fireworks: Sydney sky prototype and advanced viewport disclosure

- **Base:** supplied dirty `main` at full commit `17a011695370cdf5985fbb76be725ea9d284849f`, with reviewed Fireworks patches through 10 m upward tilt applied. No commit, push, release or Cloudflare changes.
- Verified existing `FW-NAV:v4` defaults already exactly match the requested profile: mouse move LOW/HIGH 2.35/1.00, mouse pan 1.50/0.75, keyboard move 5.75/2.25, keyboard pan 5.75/2.25, curve 1.6, 10–2000 m. They remain reset-on-refresh; no alteration to speed values or navigation mechanics.
- Added **SHOW ADVANCED VIEWPORT SETTINGS** switch (initially off) inside Map/View Options. The full calibration sliders, plot and copyable FW-NAV output stay available but start hidden and inert.
- Added first-stage Sydney SKYLINE astronomy: local date/time, 1-minute time slider, calculated sunrise/sunset markers, default **today in Sydney one hour after sunset** (IANA Australia/Sydney with daylight saving). Top scene-controls readout shows chosen date/time. Actual star direction is projected into the same east/north/up camera basis as Sydney; only the 53 documented bright stars are drawn, with apparent-magnitude-based size/brightness and subtle reduced-motion-aware twinkle. Moon has low-order estimated sky position/illumination, a draft phase texture and a settings preview, and appears in the scene only above the ideal horizon. Time-of-day atmosphere is restrained for city-wireframe readability. PLAN hides sky; WebGL and Canvas fallback remain separate from the sky layer.
- New source/provenance and limitations: `data/sources/fireworks-simulator-sky.md`, linked from `docs/index.md`. No external runtime fetch, new npm dependency, new site route or Sydney city data regenerated. **This is not a complete star atlas, a geographically accurate city-light-pollution model or a precision lunar ephemeris.**
- Included changes: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,bright-stars.ts,night-sky.ts,night-sky.test.mjs}`, `data/sources/fireworks-simulator-sky.md`, `docs/{index.md,current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. Deletions: none.
- Validation: focused Node regressions including Sydney daylight saving, solar events, star horizon, Moon phase, DOM wiring; scoped TypeScript compile with TS extensions; CSS syntax parse and ZIP integrity. **Not run:** full Astro build (dependencies not bundled), browser/WebGL visual and touch QA, precision comparison with reference astronomical software. **Next:** test 10 Oct near-new-Moon (the Moon may be invisible), then pick a full-Moon night; compare actual sky directions and test slider at narrow widths before considering a complete catalogue.

---

## 2026-10-10 Fireworks: upward rotation at minimum height

Manual SKYLINE right-drag and Up Arrow no longer lose upward pitch at the 10 m minimum. The same map-orbit rotation is used at every height; if an upward orbit would move the camera below 10 m, the rotated eye and look target are lifted together just enough to respect the floor. This avoids a hard-stop in upward looking without reinstating the former camera-only ground-tilt mode. Mouse/keyboard directions, pitch safety limit and navigation calibration remain unchanged. Tested at and immediately above the floor; real-device visual feel still needs review.

---

## 2026-10-10 Fireworks exact viewport-centre projection

- **Base:** latest supplied dirty `main` snapshot at `17a011695370cdf5985fbb76be725ea9d284849f`, with reviewed Fireworks patches through the centre-aimed zoom/crosshair overlaid. No commit, push or deployment.
- SKYLINE and PLAN camera projection origins are both exactly the **geometric viewport centre** (50% width, 50% height) at every breakpoint. Removed the legacy 57%/47% desktop SKYLINE, 50%/38% mobile SKYLINE, and offset PLAN origins. The same origin feeds Canvas geometry/labels, WebGL uniforms, screen-to-world pointer rays and the temporary zoom crosshair; resize and view changes recalculate it. Zoom direction remains the camera's optical axis, independent of OS cursor location.
- Files: `src/visualisations/fireworks-simulator/{fireworks-simulator.ts,camera-zoom-aim.ts,camera-zoom-aim.test.mjs}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. No camera sensitivity, height limit, controls, data, renderer code, UI settings or deletions.
- **Validation:** 63/63 focused Fireworks tests pass, including screen-centre integration and desktop/mobile dimensions; scoped Fireworks TypeScript compile passes; ZIP integrity verified. No full Astro build or live browser visual test. **Next:** check centred target marker, city framing and landmark labels in SKYLINE and PLAN at desktop/mobile widths; verify Pointer Lock zoom and dragging stay aligned.

---

## 2026-10-10 Fireworks zoom aim feedback

- Ordinary SKYLINE zoom through wheel, Shift + left-drag, two-finger pinch and keyboard +/- follows the current camera aim rather than an invisible pointer position. A small crosshair with a centre dot briefly marks the actual scene projection's aim point, including its desktop composition offset; PLAN retains centred orthographic zoom.
- The reticle is decorative (`aria-hidden`), never intercepts interaction, fades after zooming ends and honours reduced-motion preferences. The existing cursor does not overlap the zoom marker. The controller's accessible camera instructions and Method description now explain the centred aiming behaviour.

---

## 2026-10-10 Fireworks direct height-control speed tuning

- Keyboard Q/E vertical travel reduced about 8–10×; left-button + wheel immediate vertical travel reduced about 5× at the same view distance. Both remain bounded and retain their established direction and minimum 10 m camera clearance. The right-button + wheel discrete target-height comparison is unchanged, as are the existing navigation calibration sliders and plot. No new UI is required.
- Tests: dedicated height-control helper regression checks plus existing Fireworks tests (56 pass); scoped TypeScript passes. Await local feedback for mouse/key feel.

---

## 2026-10-10 Fireworks right-drag direction trial and 10 m camera floor

- **Base:** latest available dirty `main` snapshot `17a011695370cdf5985fbb76be725ea9d284849f` with the prior 2026-10-10 navigation calibration/pointer-lock patch applied. No commit, push or deployment.
- Inverted **both mouse right-drag rotation axes** in SKYLINE and the applicable yaw axis in PLAN, including Ctrl+left and dual-button drags. Mouse right-drag now produces the same visible direction as corresponding arrow keys; WASD, keyboard arrows, left-drag pan, wheel travel, sensitivity multipliers and automatic landmark orbit are unchanged.
- Replaced the 0.25 m camera floor with **10 m** across free translation, direct height-wheel, height target, rotation, initial layout, and landmark flight/cinematic orbit. Manual map rotation now clips the orbit angle at the 10 m floor instead of switching to an in-place upward eye-tilt. This removes the old `groundPitchRad` state and its look-only rotation branch.
- Updated the in-page camera Method description and added projection-direction/10 m floor regression tests. Changes: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,camera-map-rotation.ts,camera-map-rotation.test.mjs}`, `docs/{current-handoff.md,exec-plans/active/010-fireworks-simulator.md,ux-accessibility-features.md}`. **Deletions:** none.
- **Validation:** 51 focused Fireworks Node tests passed; narrowed Fireworks TypeScript compile passed. Not run: full Astro build or physical Windows mouse/touch and camera QA. Local review: test right-drag both axes at multiple heights and at the 10 m floor, then tune the existing sensitivity sliders.

---

## 2026-10-10 Fireworks landmark orbit, sorting and shared edge drawers

- Base: supplied dirty `main` at `17a011695370cdf5985fbb76be725ea9d284849f`; layered the delivered 2026-10-09 blank-city-startup and expanded-Sydney-landmarks ZIPs onto that snapshot. No commits, pushes or deployments.
- Key-building selection in SKYLINE flies to the chosen building, then starts a slow automatic camera orbit around the landmark at about 0.065 rad/s (approximately 3.7 degrees/s). This is a deliberate cinematic *camera* orbit only during automatic inspection. The first direct viewport input (mouse/touch press, wheel or mapped keyboard navigation) cancels flight/orbit and changes the camera's rotation reference to a forward point at least 1,200 m away, maintaining the exact viewing bearing/pitch but removing close-up orbit scaling. Existing manual right-drag map rotation, movement and normal zoom paths remain intact; unrelated UI interactions do not stop the orbit. Reset and PLAN stop it; reduced motion disables the continuous orbit. An on/off switch under the key-building highlight in Map/View Options persists via localStorage.
- Key Buildings now sorts ABC or height (descending), with an independent TYPE on/off switch: on groups the current ICONS/TOWERS/HISTORY/CULTURE/SPORT categories, off sorts all names together. Each row displays height right-aligned in smaller grey text; unverified, estimated or fallback heights are prefixed `~`. These list modes do not alter the source dataset, label identities or selected building.
- Fireworks left drawer and Key Buildings right drawer now use one `setupEdgeDrawer()` module and matching 32×60 px tabs. Click/keyboard toggles; drag up/down with mouse, pen or touch repositions either edge tab, without accidentally toggling after a vertical drag. Collapsed contents stay inert. The current top position remains session-only. Both use the same CSS and reduced-motion transition handling.
- Included files: `src/visualisations/fireworks-simulator/{FireworksSimulator.astro,fireworks-simulator.ts,fireworks-simulator.css,edge-drawer.ts,camera-landmark-orbit.ts,camera-landmark-orbit.test.mjs,landmark-list.ts,landmark-list.test.mjs}`, this handoff, the active Fireworks plan and the UX inventory. No public Sydney JSON, site navigation, data acquisition or WebGL renderer changes. No deletions.
- Focused validation: 17 Node tests passed (including camera direction preservation, orbit path, sorting and estimated height labels), scoped TypeScript compile and CSS parser passed. Full Astro build and physical mouse/touch browser QA were not run. Review automatic rotation comfort, release on mousewheel/key, narrow-screen drawer dragging and height-list sorting locally.

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

# UX and Accessibility Feature Log

This document records deliberate UX and accessibility work across `marklee.au` projects. Each project gets its own section. Update the relevant section whenever a project gains, removes, or materially changes a user-facing interaction, accessibility option, responsive behaviour, feedback pattern, or input method.

Use this as source material for project case studies and storyboard pages. It should explain the user problem, the design response, and the result. It is not a substitute for the active execution plan, which keeps the implementation history and technical detail.

## Formula Daily

Formula Daily has been developed through repeated play-testing rather than a single interface pass. The main product story is the shift from a simple formula builder into a tactile puzzle that supports mouse, keyboard, touch, readable alternatives, optional assistance, persistent scoring, and player-controlled presentation.

### Storyboard-ready highlights

| Theme | User problem | Design response | Portfolio story |
| --- | --- | --- | --- |
| Physical formula pieces | A standard form builder felt too mechanical for a game. | Formula tokens behave like loose chalk labels that can be clicked, tapped, dragged, reordered, returned, bumped, and regrouped. | Interaction design and custom pointer physics used to turn spreadsheet syntax into a tactile puzzle. |
| Responsive answer construction | Long formulas can exceed one row, especially on phones. | The answer cell wraps and grows vertically, preserves token order, animates height changes, and keeps the permanent leading `=` aligned. | Responsive interaction without horizontal formula scrolling. |
| Multiple input methods | Drag-only play would exclude keyboard users and frustrate some touch players. | Native buttons, click/tap placement, keyboard focus, and drag interactions share the same formula model. | One game mechanic exposed through several input methods. |
| Touch Mode | Screen width was a poor proxy for touch capability. | Touch features use touch capability and pointer input, with a player override in Options. | Feature detection instead of device-width assumptions. |
| Touch page-scroll thumb | Direct label dragging competes with page scrolling on touch screens. | A temporary viewport-edge scroll thumb gives the player a dedicated page-scroll control while labels remain direct-manipulation objects. | A custom solution to the conflict between draggable game objects and page scrolling. |
| Left-handed support | A fixed right-edge touch control is less comfortable for some players. | Left Handed Mode moves the custom scroll thumb to the left, is available only while Touch Mode is active, and remembers the preference while relevant. | Small ergonomic option added from real interaction testing. |
| Test Answer | Players need syntax guidance without being shown the solution. | Test Answer checks Excel-like syntax and error states without submitting or judging puzzle correctness. | Assistance designed to preserve puzzle difficulty. |
| Error targeting | Generic error text did not show which part of a formula needed review. | Error categories are interactive and temporarily mark implicated tokens with bright red hazard stripes. | Contextual feedback without revealing the correction. |
| Function Tips | Players may know the puzzle idea but not remember a spreadsheet function signature. | Paid Function Tips provide concise function syntax and argument guidance for functions actually present in the puzzle. | Optional learning support tied directly to scoring trade-offs. |
| Points and attempts | Assistance and failed submissions need a fair shared cost model. | Each question starts at 100 points. Tips deduct from current points and failed attempts divide the remaining exact score across attempts left. | A scoring model that adapts after optional assistance purchases. |
| Persistent consequences | Refreshing could otherwise refund a Tips purchase or failed attempts. | Per-question state persists across refreshes and sessions. | State management prevents simple score-reset exploits. |
| Player display options | Chalk styling and board texture can reduce readability for some players. | Chalk Font, Clean Background, Touch Mode, Left Handed Mode, and tip visibility are player options. | Accessibility and comfort controls are part of the game UI, not hidden browser assumptions. |
| Reduced motion | The loose-label system uses substantial movement. | Reduced-motion rules suppress or simplify transitions and decorative motion while preserving the playable state. | Motion preference respected without removing the game mechanic. |
| Quiet status feedback | Announcing every token movement created noise. | Routine status narration was removed while important validation, submission, and error messages remain. | Live feedback was reduced to information that affects decisions. |

### 1. Interaction baseline and semantic controls

- Formula pieces use native button elements rather than generic clickable containers.
- Available pieces can be added by click, tap, keyboard activation, or pointer drag.
- Placed pieces remain interactive and can be removed or reordered.
- The answer area is keyboard reachable and formula controls have visible focus treatment.
- Focus states use a visible blue outline rather than relying on colour changes alone.
- The sample spreadsheet uses semantic table markup with a caption, column headers, and row headers.
- Controls use action-oriented accessible names, including formula pieces, Tips pinning, Reset, switches, and the permanent formula marker.
- Hover is treated as an enhancement. Important controls also work through focus, click, tap, or explicit buttons.
- The game keeps `prefers-reduced-motion` handling for transitions, pulses, token movement presentation, and decorative feedback.

### 2. Chalkboard identity and readability

- The game moved from a standard spreadsheet-style interface to a bounded chalkboard with a wooden frame.
- Function pieces use green chalk, references and ranges use coral/red, literal values use blue, and syntax remains neutral.
- Function opener pieces render as a grouped function name plus opening parenthesis so they read as one logical token while retaining the visual structure of a formula.
- Background teaching notes use low-opacity pastel chalk and are decorative only.
- Desktop and mobile font behaviour was reviewed after mobile fell back to a non-chalk face.
- Chalk Font now uses a broader mobile-friendly chalk-style font stack.
- Chalk Font can be turned off. The full game then uses a clear sans-serif stack across labels, sample data, headings, buttons, links, status text, Tips, and options.
- Clean Background removes the decorative board notes and texture/glare layer, leaving a plain black board surface while keeping the frame and gameplay controls.
- Chalk Font and Clean Background preferences persist across refreshes.
- Full Reset restores Chalk Font on and Clean Background off.

### 3. Sample Data presentation

- Sample Data was separated from the answer strip so the spreadsheet could fit narrow phone widths without horizontal scrolling.
- The spreadsheet became a collapsible reference area rather than permanently consuming the main play space.
- Sample Data disclosure controls use explicit open/closed state and keyboard-accessible controls.
- The data table remains readable when the answer, cluster, or Tips panel changes size.
- The sample sheet was kept visually subordinate to the formula puzzle while remaining available as a reference.
- A dedicated top control gutter keeps Options and the one-line question/attempt/points HUD clear of the Sample Data heading and spreadsheet at desktop and narrow widths.

### 4. Problem statement and answer cell

- The problem statement moved above the answer area and was centred and enlarged to strengthen task hierarchy.
- The answer cell expands across the available board width.
- The answer border uses a thicker dashed chalk treatment to make the drop target clear.
- A permanent white `=` token sits at the start of the answer because formulas begin with the marker in this game model.
- The loose `=` piece remains available as a comparison operator and decoy.
- Trying to remove or drag the permanent marker triggers bright hazard feedback and a short explanation rather than silently failing.
- Placed pieces always begin to the right of the permanent marker.
- Wrapped continuation rows preserve the marker gutter and formula alignment.
- The answer cell grows only when wrapping requires extra rows.
- Height measurement was changed to use the actual laid-out flex rows so overlay tooltips do not incorrectly increase answer height.
- The empty answer retains `Drop formula here` guidance.
- Submitting an empty answer does not consume an attempt. The placeholder and Submit button flash with red/hazard feedback instead.

### 5. Answer token ordering and placement

- Placed formula pieces can be reordered by dragging within the answer.
- A single insertion preview shows where the dragged piece will land.
- Reordering changes only after crossing a neighbouring token midpoint, reducing jitter.
- Dropping a placed token back into the cluster returns it to the loose pool.
- Dropping outside valid targets restores its original answer position.
- Answer wrapping is animated but avoids layout flicker.
- Cluster clearance responds to answer growth so wrapped formulas do not cover loose labels.
- Reduced-motion users receive the same clearance without the animated transition.
- Clicking a placed token removes exactly that token. Pointer removal now suppresses the browser's follow-up synthetic click so DOM rerendering cannot accidentally retarget and remove a neighbouring token.

### 6. Loose-label physical behaviour

- The loose cluster was deliberately tuned to feel physical rather than like a static list of buttons.
- Labels respond to weak centre gravity, collision impulses, damping, board boundaries, and direct dragging.
- Drag release now carries smoothed pointer momentum into a short glide. Rendered label width acts as bounded mass, so wider labels resist forces and collisions more strongly, retain motion longer, and rebound less from walls than small syntax labels. Label-to-label impacts transfer momentum using the same mass model.
- Collision work focused on allowing labels to bump and transfer movement without permanent overlap at rest.
- The cluster gained extra vertical breathing room so labels have space to escape when a dragged piece compresses the centre.
- Hovered labels are pinned so board movement and answer resizing do not move the active label away from the pointer.
- Hover activation uses a stable captured hit boundary so the glow does not flicker at label edges.
- The visible nearest-neighbour connector lines used during tuning were removed while the underlying relationship logic remained available.
- Text selection is suppressed inside the canvas so repeated dragging does not select page text.
- Loose labels remain bounded by the board on the left, right, and bottom. The drag ceiling follows the live top edge of the answer cell, so labels can enter the answer but cannot be dragged into the question, Sample Data, Options, or progress area above it. Drag walls are visually silent: labels collide and clamp without a board-border highlight or an edge-contact highlight on the label.
- Matching loose labels also have a playful ambient interaction: when two active labels of the same type touch, one can send a small pixel-art heart to the other. Each pair has its own cooldown, so the effect stays occasional instead of constant.
- Cluster movement continues to pause when the relevant area is off-screen where practical.

### 7. Desktop pointer and wheel behaviour

- Mouse drag uses primary-button input only.
- A desktop wheel-scroll regression was fixed so merely resting the pointer over a loose label while scrolling no longer grabs the label.
- Scroll activity releases transient hover/preview state rather than letting a label follow the viewport.
- Desktop hover remains a visual affordance, not a required way to play.

### 8. Touch Mode and touch capability

- Early mobile behaviour used viewport width as a proxy for touch input. This was replaced because wide touch devices and Chrome touch emulation lost touch features above the breakpoint.
- Automatic Touch Mode now uses touch capability signals such as `navigator.maxTouchPoints`, coarse-pointer capability, and actual touch pointer events.
- Layout width and input capability are separate concepts. Width still controls responsive composition, while Touch Mode controls touch interaction features.
- The player can force Touch Mode on or off in Options.
- The Touch Mode override persists across refreshes.
- Full Reset clears the override and returns Touch Mode to automatic detection.
- Touch-dependent Options are nested beneath Touch Mode so their relationship is visible. Left Handed Mode is enabled only while Touch Mode is active. If Touch Mode turns off, Left Handed Mode is forced off and its stored preference is cleared.
- The cluster troubleshooting tip appears only when effective Touch Mode is off. `Disable Touch Mode Tip` is available only in that state.
- The inline Options link in that tip scrolls to Options, opens the popup, and temporarily highlights the Touch Mode text and switch.

### 9. Direct touch dragging and page scrolling

- Several prototypes tested delayed touch intent, distance thresholds, and drag-ready highlighting.
- Those threshold systems were removed after play-testing showed they were inconsistent for different player gestures.
- Current touch design gives loose labels immediate direct-manipulation behaviour when Touch Mode is active.
- Empty cluster space can still participate in native page scrolling where the browser owns the gesture.
- A temporary custom page-scroll thumb was added as the reliable alternative when the player is manipulating labels.
- The scroll thumb maps its vertical track to the document scroll ratio.
- Dragging the thumb updates page scroll live rather than waiting for release.
- Thumb-driven scrolling uses instant page movement so the site's global smooth-scroll rule does not make the page lag behind the finger.
- While the thumb is actively dragged, its pointer position is authoritative so page scroll events do not fight the control position.
- Any touch interaction can wake the scroll thumb while Touch Mode is active.
- Normal page scrolling can also wake it.
- The control can move to the left edge through Left Handed Mode.
- Left Handed Mode persists across refreshes while Touch Mode remains active. If Touch Mode turns off, Left Handed Mode is automatically disabled, reset to off, and visually muted.
- The scroll thumb uses a narrow vertical form with a centred three-line grip icon.
- It sits at low opacity when available, becomes fully prominent during active use, then fades during its dismissal period before hiding.
- Reduced-motion settings remove unnecessary visual transition effects from the control.

### 10. Touch troubleshooting and player control

- A low-emphasis tip at the bottom of the cluster helps players when touch controls are not active.
- The message links directly to Options rather than requiring the player to find the setting manually.
- The deep-link highlight is intentionally limited to that one path. Normal Options use does not highlight Touch Mode. The highlight targets the `Touch Mode` text and switch only, so the option row keeps its normal width and spacing.
- Disable Touch Mode Tip lets players hide the troubleshooting copy when Touch Mode is off.
- When Touch Mode becomes active through detection or player override, that switch is forced off, disabled, and visually muted because the troubleshooting tip is already irrelevant. Turning Touch Mode off makes the switch available again.
- The preference persists only while applicable, and Reset restores it to off.

### 11. Options and personalisation

Current Options include:

- Chalk Font
- Touch Mode
  - Left Handed Mode
  - Disable Touch Mode Tip
- Clean Background
- Reset

Design choices:

- Options sits with question progress rather than taking space from the main puzzle controls.
- The popup opens beside the button and uses native switches.
- Labels and switches use visible focus states.
- Context-dependent options expose their availability directly. Left Handed Mode and Disable Touch Mode Tip are visually nested under Touch Mode. Left Handed Mode is available only while Touch Mode is active; Disable Touch Mode Tip is available only while Touch Mode is off. Switching Touch Mode automatically clears whichever dependent preference is no longer relevant.
- Reset sits under the switches rather than occupying spare space beside them.
- Preferences are stored independently where appropriate so a visual preference can persist without changing question score state.
- Full Reset restores the current question and its gameplay-related preferences to first-load defaults.

### 12. Test Answer assistance

- Test Answer sits beside Submit but is visually quieter and orange rather than green.
- It checks the assembled formula without submitting it or consuming an attempt.
- The validator started with bracket and function structure checks, then grew into a restricted Excel-like pre-check.
- The rule is now: flag syntax or evaluation errors that Excel-like semantics would reject, not formulas that simply make little sense for the current puzzle.
- Valid but unhelpful formulas such as a criteria that matches nothing are allowed through Test Answer.
- Equality `=` is treated as a comparison operator inside the formula rather than incorrectly reported as syntax failure.
- A comma outside a supported function reports a syntax error, while a comma that creates a missing function argument reports an argument error.
- Supported function structures include SUM, AVERAGE, COUNT, COUNTIF, COUNTIFS, SUMIF, and SUMIFS for the current puzzle set.
- Test Answer can collect multiple issues in one pass rather than stopping at the first problem.
- Error links are joined using normal prose and Oxford comma formatting.
- Each error link targets its own implicated tokens.
- Hover, focus, or touch activation of an error link applies bright red and black diagonal hazard treatment to the affected tokens.
- Error explanations are intentionally short so the helper does not reveal the correction.
- Tooltips were moved below the status line and layered above loose labels so they do not cover the answer cell or disappear behind the cluster.

### 13. Function Tips and optional assistance

- The original Help feature was renamed to Tips to better match its role.
- The panel heading is Function Tips and the purchase state uses Tips terminology.
- The function list is generated from functions actually present in the puzzle, so the panel stays relevant as puzzle pieces change.
- COUNTIFS and SUMIFS were restored to the puzzle and added to Tips with their different argument structures.
- Function buttons use larger rounded targets to work better on touch screens.
- Before purchase, function buttons are visually locked/grey but remain focusable and tappable.
- Selecting a locked function directs attention to the purchase prompt rather than buying assistance accidentally.
- A dedicated Buy button makes the score trade-off explicit.
- Tips cost is controlled by one configurable percentage constant.
- Purchase deducts from the current question points rather than from a separate abstract cap.
- Purchased Tips persist for the question across refreshes and browser sessions so a player cannot read a guide, refresh, and recover points.
- Function guide copy gives signatures and generic argument guidance without naming the current puzzle's answer.
- Tips can open by pointer hover, keyboard focus, or touch/click.
- An unpinned desktop preview can auto-close.
- Pinned Tips stay open until explicitly unpinned or closed.
- The pin is an explicit button with visual state rather than hidden behaviour.
- Pin colour was separated from penalty/error red so pinned state uses orange.
- On desktop, pinned Tips occupy the right side of the board and labels move away from that obstacle.
- On narrow layouts, Tips spans the board and cluster avoidance moves labels down rather than compressing them left.
- When Tips unpins, labels receive a short recovery phase with stronger centre pull and vertical movement so the cluster returns naturally.
- Extra overlap settling runs during compressed and recovery states to reduce avoidable label overlaps when room exists.

### 14. Points, attempts, purchases, and persistence

- The compact progress HUD is presented on one line as `Question 1 / 5 | Attempt 0 / 5 | Points 100 / 100`; the changing question, attempt, and point values use the brighter chalk treatment.
- Each question starts at `Points 100 / 100` and `Attempt 0 / 5`.
- The changing point value is visually distinguished from the fixed 100-point maximum.
- Tips purchase deducts its configured percentage from the current exact point pool.
- Failed submissions deduct a share of the points remaining across the attempts still available.
- The game keeps a hidden exact score value so rounding the display never prevents the final available attempt from reaching zero.
- Example: 100 -> 80 -> 60, buy 50% Tips -> 30, then three remaining attempts -> 20 -> 10 -> 0.
- Submit does not yet judge answer correctness. A non-empty prototype submission currently counts as a failed attempt for score-model testing.
- Empty Submit does not spend an attempt or points.
- Points, attempts, and Tips purchase state are stored per question ID.
- Reloading cannot refund assistance or failed attempts.
- Full Reset clears the per-question stored state and returns the prototype to 100 points, zero attempts, empty answer, unpurchased Tips, and default options.

### 15. Feedback, status, and cognitive load

- The game originally announced routine actions such as adding, returning, and reordering pieces.
- Those low-value status messages were removed after review because they created noise.
- Important feedback remains, including Test Answer results, empty-answer prompts, scoring/submission results, and validation messages.
- The formula output/live status mechanisms remain available for meaningful updates.
- Error copy is short and category-based rather than instructional enough to solve the puzzle.
- Visual feedback is paired with text so red hazard styling is not the sole carrier of meaning.

### 16. Motion and reduced-motion behaviour

- The cluster uses animated physical movement as part of the game identity.
- Reduced-motion support disables or simplifies nonessential transitions and pulses.
- Decorative neighbour strings are hidden.
- Reduced-motion users keep collision clearance, readable state changes, and functional controls without requiring animated movement to understand the interface.
- Temporary highlight states keep a static visible state when animation is suppressed.

### 17. Responsive layout work

- The spreadsheet was redesigned to avoid horizontal page scrolling on phones.
- The answer cell wraps instead of horizontally scrolling long formulas.
- Button groups reflow at narrow widths.
- Problem text and answer layout were repeatedly tuned for phone and desktop proportions.
- Tips changes orientation based on available layout width, independently from Touch Mode.
- Function Tip buttons wrap across rows on narrow screens.
- Cost text and pin controls remain inside panel bounds.
- The Options popup is sized to remain inside narrow viewports.
- Touch targets were increased where mobile use exposed small controls.

### 18. Current project-page story angles

Good sections for the future Formula Daily case-study page:

1. **Turning spreadsheet syntax into physical puzzle pieces**
   - Show the chalk-label cluster, drag behaviour, collisions, and answer construction.
2. **Designing one mechanic for mouse, keyboard, and touch**
   - Show native buttons, direct drag, focus states, Touch Mode, and the custom page-scroll thumb.
3. **Responsive formulas instead of responsive compromise**
   - Show answer wrapping, the permanent `=`, mobile spreadsheet changes, and Tips panel reflow.
4. **Assistance without giving away the answer**
   - Compare Test Answer error feedback with paid Function Tips.
5. **Accessibility as player choice**
   - Show Chalk Font, Clean Background, Left Handed Mode, Touch Mode, reduced motion, and troubleshooting controls.
6. **A score system that remembers consequences**
   - Explain exact hidden points, attempts, Tips purchases, persistence, and Reset.
7. **Iteration from observed interaction problems**
   - Use examples such as hover flicker, answer-height jumps, mobile scroll conflicts, Help/Tips cluster compression, tooltip stacking, and overlapping labels.

### 19. Known deferred UX work

- Real answer correctness and equivalent-formula evaluation remain future work.
- The complete five-question loop, result screen, daily sequence, and share output remain future stages.
- Final scoring rules for a completed daily run remain open beyond the current per-question point prototype.
- Real-device touch QA remains important because pointer and font behaviour varies across operating systems and browsers.
- The future project page should use this document as a feature inventory, then select only the strongest examples for the public story.

## Other projects

Add a separate `## <Project name>` section here when another marklee.au project receives deliberate UX or accessibility work. Keep project-specific decisions under that project's section. Put truly shared site-shell changes in a clearly labelled `## Site-wide` section rather than mixing them into a game or visualisation entry.

## Fireworks Simulator

### 2026-10-10: Confirmed navigation baseline and independently tunable keyboard movement / rotation

- Owner-calibrated startup speeds are mouse MOVE 2.35×/1.00×, mouse PAN 1.50×/0.75×, keyboard MOVE 5.75×/2.25× and keyboard PAN/ROTATE 5.75×/2.25× (LOW/HIGH), shared curve power 1.6 from 10 to 2,000 m. Both keyboard controls start equal but adjust independently: WASD/Q-E/+− versus arrow keys.
- The SVG plot, effective readout and `FW-NAV:v4` copy line distinguish all four calibrated actions. Speed experiments reset to the shared baseline on refresh; unrelated stored UI preferences remain unaffected. Controls use labelled native range inputs and four visually distinguishable line styles. No additional main-canvas controls.


### 2026-10-10: Per-altitude navigation speed curve (test controls)

- Navigation calibration now permits different LOW (10 m) and HIGH (2,000 m) speeds for left-drag MOVE, right-drag PAN/ROTATE and KEYBOARD, without requiring a new always-visible control. A shared curve-power slider controls how quickly the low-end boost fades with logarithmic camera altitude. PLAN uses the high-end response. This only changes input gain, retaining existing camera geometry/direction, pointer lock, altitude floor and fireworks focus.
- A lightweight SVG plot draws all three curves with distinct strokes, a current-height indicator and effective-value readout. Sliders are labelled and keyboard accessible, and all visible numbers are also provided as text. User calibration values persist in local storage. `FW-NAV:v3` exports each low/high endpoint, curve power and effective values for later default selection. Old v2/v1 settings initialise the high-altitude values; low values start modestly boosted. Actual on-device feel is pending review.


### 2026-10-10: Separate move, pan and keyboard calibration

- The test settings now offer three independent sliders: left-button MOVE, right-button PAN and KEYBOARD, each 0.25×–10.00×. Combined-button gestures respect both mouse multipliers independently in SKYLINE and PLAN.
- Existing single-mouse calibration carries forward to both new controls. The copyable `FW-NAV:v2` line names `mouse_move`, `mouse_pan` and `keyboard`; the explanatory note below the copy button was removed to reduce visual clutter.
- The test UI remains in the existing Map / View Options disclosure; no permanent control surface has been added to the canvas.


### 2026-10-10: Temporary navigation calibration and continuous mouse dragging

- City exploration needs minimal friction when designing fireworks; users reported controls too sluggish after the prior map-rotation/pan correction. Two persisted **calibration-only** sliders in existing view options multiply desktop mouse drag and keyboard navigation separately, instead of adding permanent complexity to the main canvas.
- The panel shows a selectable/copyable `FW-NAV:v1` settings line with display and altitude context; screenshots work too. The browser cannot read a mouse's physical DPI, so it is not guessed.
- Mouse drags request Pointer Lock so movementX/Y continues beyond the physical display edge. A bounded virtual cursor still supports perspective-map anchoring, falling back to unbounded screen-space movement at its edge. Escape and button release restore normal pointer control; touch/pen and UI controls retain normal interactions. Browser permission/gesture fallbacks require local QA.
- Keyboard easing was made slightly more responsive; calibrated values are trial settings to help determine the later product defaults, not a recommendation to expose all tuning settings permanently.


### 10 October 2026: Height-consistent manual map controls (local trial)

Right-drag map rotation now anchors in the ground map rather than a changing look-target distance; it rotates the camera pose as a unit, retains map orientation when close to the ground, and has a slower response. Right mouse, Ctrl+left mouse and arrow keys use the same rotation function. The near-ground left-drag/touch/WASD pan reference is substantially closer than previously, addressing excessive apparent speed from nearby buildings. Manual controls remain separate from the optional cinematic key-building orbit. No additional player settings or speed slider. On-device mouse and GPU review is pending.


### 2026-10-10: Natural city navigation scale

SKYLINE now pans by apparent screen-space movement rather than distance to the current camera look target, so selecting and zooming around a landmark does not silently change pan sensitivity. Pointer/touch dragging uses damped geographic anchoring where the ground ray is reliable; near the horizon and near the ground a bounded, smoothly blended fallback avoids jumps. After user feedback that the initial model was still too fast, the common response was reduced and the ground-level virtual depth and anchor overspeed allowance were tightened. WASD uses the same scale with its existing frame-rate-independent smoothing. Existing directions, mouse gestures, height controls and keyboard shortcuts remain available. No player-facing speed setting is introduced. Physical device feel requires renewed local review.


- **Expanded Sydney landmarks and retained selection (9 October 2026):** A source-backed registry now covers icons, tall buildings, heritage, culture and sport instead of a fixed CBD tower shortlist. Selecting any label or list entry opens the landmark drawer and scrolls to the selected entry; navigation no longer cancels a selection. A separate accessible X beside the selected on-map label clears it. Hover and selected colours retain eased fades. The height comparison keeps active and inactive silhouettes on the same vertical metre scale and extends across the whole screen; only sourced numeric heights or authored structure heights are ranked, excluding fallback/floor approximations. The current sample contains 65 landmarks, with 27 ranked for height.


- **Clickable landmark flags and retained focus (9 October 2026):** City key-building flags are native keyboard-accessible buttons that frame the building using the same action as the right-side list. Pale-yellow hover and darker-gold selected styles ease in/out on flags and GPU geometry; moving onto a different landmark does not discard the existing selection. Clicking another replaces the selection. Manual map gestures clear it, while automatic camera framing retains it. Pointer cursor and visible focus ring signal interaction. Reduced-motion users receive immediate colour changes. The GPU draws only the highlighted landmark outline, never a second city pass; Canvas/PLAN uses the flag and list state as the selection cue.

- Right-button wheel height inspection now advances in 1 m increments (trial, previously 5 m), including normalised high-resolution wheel events. The numeric target height appears next to the arrow/level cue and updates as the target moves. The landmark profile scale shrinks **and recovers** as you ascend and descend across the tallest roof and 5,000 m ceiling.
- While comparison is active, a pointer-transparent dark scrim visually subordinates the actual city, fireworks and regular overlays. The height atlas, ruler, target node, direction arrows and live target value remain clear above it. The scrim fades in/out, or switches immediately for reduced-motion users, and does not interfere with camera gestures.

- During SKYLINE right-click + wheel target-height selection and the smooth release travel, a non-interactive height atlas temporarily centres the existing ruler and direction cue. Source-backed Sydney key buildings are ordered by their recorded heights; the active building expands horizontally, fills gold up to the chosen metres, and yields to the next taller building as the marker crosses its roof. Above the tallest, neutral silhouettes shrink while the horizontal scan continues. No invented city heights or second rendering pass.
- Illustrated roof/bridge silhouettes are simplified visual guides rather than precise architectural elevation drawings. The metre ruler remains the numeric authority, the status messaging and underlying gestures remain available, and all added animations respect `prefers-reduced-motion`. The atlas is visual-only and does not insert new keyboard focus targets.

- Camera motion now dims scene UI overlays (map settings, landmark selector/flags, firework controls and readouts) while leaving the scene and height ruler/target cues at full prominence. One existing camera-motion state drives the fade across mouse, keyboard, touch and animated landmark framing. Reduced-motion settings remove the fade animation, not its immediate feedback.
- A bottom-right dual-card navigation guide uses compact mouse/keyboard diagrams and task-specific labels. The last actual input expands its instructions and shrinks the alternative; touch presents one-finger/pinch/twist guidance. PLAN hides SKYLINE-only height shortcuts. On narrow screens, the selected card stacks above the alternate.
- Users can dismiss the guide from an explicit `Hide guide` button or toggle it in Map / View Options via a labelled native switch. Both remain in sync and remember visibility locally where permitted. Neither pointer hovering nor typing in forms changes the selected guide.

- Landmark navigation: a collapsible right-side list of source-backed Sydney buildings provides text alternatives to map interaction. Each native button frames the chosen building using metre dimensions and candidate camera positions; `aria-current` identifies the selection. Collapsed content is not keyboard focusable. Focus controls work in SKYLINE and PLAN.
- Landmark flags are visually decluttered on-screen, with the selected building prioritised. Animation is disabled with reduced motion. The map/view disclosure uses a centered SVG chevron instead of a font glyph for consistent alignment.
- SKYLINE authored Harbour Bridge and Opera House share WebGL clipping and depth with surrounding sourced structures to avoid near-horizon polygon blocks and Canvas-overdraw. Spark effects render behind city geometry as a first-stage occlusion approximation; real 3D particle depth is pending.


- SKYLINE/WebGL no longer composites a second delayed Canvas building-occluder layer over the city. This prevents brighter doubled outlines when idle and dimmer geometry during pan/rotation. Canvas fallback retains its approximate particle occlusion. True WebGL-to-Canvas firework depth occlusion remains a later refinement.

- The full-screen Sydney map boundary now dissolves via a metre-based 300 m fragment-opacity fade in WebGL instead of black rectangles covering the city. Land and urban features fade using their respective data extents; PLAN/Canvas uses a matching alpha-removal approximation. Fireworks and camera controls remain unchanged.

- Coastline-driven, land-only ground geometry now uses the same preprocessed triangles in SKYLINE (WebGL depth test) and PLAN/no-WebGL (Canvas). Harbour is empty background with no grid or guessed polygon overlay; camera gestures and other accessible controls are unchanged.

- The Sydney city source has an optional larger bounding rectangle selectable only in the offline acquisition script. SKYLINE's background grid grows with the actual sourced scene extent. Pointer, keyboard, panel and reset interactions are unchanged; PLAN frames the entire expanded area when loaded. A live streaming/LOD system is not yet implemented, so larger scene performance requires local review.

Stage 3 introduces the first deliberate interaction and accessibility layer for the LAB fireworks prototype.

- The canvas is visual output only and is hidden from assistive technology; named controls and a polite status region expose the actionable state in text.
- Preset, calibre and colour use native selects. Burst height and spread use native range inputs with visible metre outputs. A separate native Launch button is the keyboard-accessible replay action. Clicking/tapping the sky is a pointer convenience and is removed from the tab order.
- Colour is not the only representation of the selected firework. The effect name plus calibre, height, spread and duration remain available as text on desktop, with the core numeric values repeated in controls on narrow screens.
- `prefers-reduced-motion` switches the animated launch/effect into a static representative burst while preserving the selected geometry and scale.
- Narrow layouts reduce particle density and cap canvas pixel density before changing physical metre geometry. Controls become a compact scrollable panel rather than forcing horizontal page scrolling.
- Deterministic seeded particles make visual comparisons repeatable across replays and control changes.
- A Method disclosure links the principal scale and measured-motion sources and states that unmeasured numeric tuning is a visual hypothesis.
- Live FPS and particle telemetry are exposed during prototype review so renderer decisions can be based on observed performance. The real Sydney feature count later provided measured justification for a WebGL2 SKYLINE city pass; telemetry now states `WEBGL CITY + CANVAS FX` when that progressive-enhancement path is active and falls back to `CANVAS 2D` when WebGL2 is unavailable.


Stage 5 adds the Sydney view switch and city failure state:

- **SKYLINE** and **PLAN** are native buttons inside a labelled group, expose `aria-pressed`, and remain keyboard operable.
- Changing view updates the polite status text with the selected camera mode.
- City geometry is decorative canvas content; the selected firework parameters and controls remain available as text rather than requiring visual interpretation of the skyline.
- If the static city JSON fails to load, the firework controls continue to work and an accessible status message reports the city-data failure.
- `prefers-reduced-motion` still renders a static representative firework while retaining the city scene and view controls.

Fireworks map/view options iteration:

- The SKYLINE / PLAN group has a native expandable map-options control with a focusable summary and a compact, scrollable menu on smaller screens. Four labelled native switches control key buildings, sourced buildings, roads/transport, and land/coastline. Each has a keyboard-accessible 0% to 100% transparency slider and percentage output; off switches disable and visually dim their associated sliders, preserving the previous value for the next activation.
- A separate highlight switch controls brighter treatment and pointer-transparent, roof-anchored animated labels for the three authored Sydney structures. The labels follow camera movement but do not add new geometry or block stage gestures. Reduced-motion users get static labels and poles.
- The existing standalone Launch button and full camera keyboard/gesture controls are preserved. A single WebGL city drawing path remains in SKYLINE, while PLAN and the WebGL-unavailable fallback apply layer options to Canvas city rendering. Both modes preserve the authored landmark scene when ordinary buildings are switched off.

Stage 5 skyline visual revision:

- City buildings now have opaque dark faces and visible perimeter outlines instead of x-ray outlines. This improves form recognition without relying on white-filled buildings or colour-only differentiation. The real geometry is still clearly described as a calibration placeholder in Method.
- A side-on harbour camera gives users a more legible view of the Bridge's arch and the Opera House's schematic shells. Desktop/mobile cameras are distinct, with view switching retaining native button and screen-reader status behaviour.
- The decorative city raster is cached so animation can focus the frame budget on fireworks. Free camera gesture support is implemented in the subsequent Sydney camera iteration using an explicit drag-versus-tap interaction threshold.


Camera and Overture-import iteration, updated after skyline interaction review:

- A focusable stage region exposes the scene's camera operations through an accessible name. The canvas itself remains decorative and hidden from screen readers.
- Left mouse drag and one-finger drag pan using grab-the-map semantics. Mouse pan is deliberately damped to 78% of the earlier pointer travel so high-DPI mice do not make the scene outrun the cursor; touch keeps its prior direct scale. Right mouse drag behaves like grabbing and rotating the map around its current pivot rather than turning a first-person camera, with reduced yaw/pitch sensitivity. `Ctrl` + left drag invokes the same rotation. Holding both mouse buttons and dragging now applies the left-drag pan and right-drag rotation together instead of acting as a third height gesture, so a mouse-only user can combine the two drag camera operations without a keyboard modifier. `Shift` + left drag retains the pointer-centred forward/back shortcut. Modifier/chorded pointer gestures suppress tap-to-launch, while a native Launch button remains available.
- Keyboard controls are grouped by the mouse gesture they mirror, while drag-like directions stay intentionally inverted: `W/A/S/D` mirror left-drag pan (`W` = mouse drag down, `A` = mouse drag right, and the opposite keys mirror those pairs); the arrow keys mirror right-drag map rotation/tilt (`Up` = right-drag down, `Left` = right-drag right, with `Down/Right` opposite); `Q/E` provide the two directions of direct skyline height translation; `+/-` mirror mouse-wheel forward/back movement with `+` moving in and `-` moving out; `R/Home` resets. Arrow Up/Down therefore provide the keyboard equivalent of the vertical right-drag tilt that was previously missing. Held navigation keys are sampled on every animation frame using elapsed time rather than browser key-repeat events, with short acceleration/deceleration easing so movement is continuous across display refresh rates. The sustained keyboard rates are deliberately faster than the previous pass while remaining below abrupt high-DPI pointer motion. Shift remains the faster keyboard modifier. Navigation works without first clicking the viewport, but is ignored when the event target is an input, select, textarea or editable text so form controls keep native keyboard behaviour. Handled global navigation moves focus to the labelled stage. PLAN uses WASD pan, horizontal arrow rotation, and ordinary orthographic zoom for wheel/`+/-`; its vertical arrow and Q/E altitude actions are intentionally inactive because PLAN has no camera pitch/height.
- SKYLINE no longer uses projection/lens zoom. Wheel with no mouse button, pinch, `Shift` + left drag and `+/-` physically translate through the scene while preserving field of view. Pointer/touch movement uses screen-space rays so travel is spatially anchored instead of always collapsing toward screen centre. Left button + wheel is the direct mouse-height control and translates eye plus target vertically while preserving the viewing angle. Right button + wheel is a deferred height selector: it moves a persistent right-side height node without moving the scene, highlights that node in the existing gold focus colour, then eases the camera vertically to the chosen height when the right button is released. The node is neutral silver/grey during ordinary camera movement and follows the live eye height. Only the physical camera eye is constrained by `z = 0`; the look target may sit below ground when the user looks down. The minimum eye height remains 0.25 m. The skyline readout exposes metre-based POV coordinates only; PLAN still exposes its orthographic zoom factor and hides the height node.
- The initial SKYLINE right-wheel iteration enlarged the side marker to three times its ordinary diameter while the right button was held; the later ghost/continuous scaling refinement is described below. A separate pointer-transparent direction indicator shows up arrow, centred line or down arrow based on target height relative to the current eye. Only the matching symbol turns gold; its opacity rises with absolute vertical separation. The cue disappears and the node shrinks when the right button is released; the node retains the existing gold transition state until the view finishes settling. The symbol gives an additional height-direction cue without relying on colour alone. Reduced-motion preference disables marker/cue transitions.
- Right mouse drag, Ctrl+left drag, both-button drag and keyboard arrow tilt share a floor-aware orbit. The camera orbits about its map pivot until its eye reaches the 0.25 m physical clearance. Further downward dragging keeps the eye at that limit and pitches its sight upward; dragging back removes that extra pitch before resuming the original orbit. Yaw still works during ground contact; horizontal pan shifts the stored orbit centre with the view. Orbit radii too small to physically reach ground do not trigger a false bounce. The Canvas and WebGL camera bases now use the same uninterrupted world-up reference through their maximum 89° viewing elevation, removing the old near-overhead camera orientation jump.
- Buildings and solid landmark surfaces are visually opaque. SKYLINE now uses WebGL2 depth testing for sourced buildings/roads when available, while the procedural Sydney Tower shares the WebGL building depth pass and Bridge, Opera House and fireworks stay in the Canvas overlay. The firework masking layer is cached and refreshed after camera input settles instead of reprojecting the dense city on every animation frame. Browsers without WebGL2 keep the Canvas painter-depth fallback rather than losing access to the scene.
- RESET VIEW remains a separate keyboard-operable native button. Scene mode and reset actions announce through the existing polite status region.
- `prefers-reduced-motion` still freezes the fireworks and leaves direct camera gestures user-controlled. The right-button height selector applies its chosen height immediately on release under reduced motion rather than running the new easing transition.
- During camera movement the firework controller dims to 3.5% and returns when motion settles, leaving the independent pull tab visible. An in-page crosshair fades entirely during stage camera input because native OS cursors cannot fade. The title begins at full size after each reload and becomes a smaller white mark beneath the LAB kicker after five seconds or a camera interaction; reduced-motion preferences remove its transition animation.
- Right-wheel height now presents a separate grey node at current eye height and a gold target that grows from the normal size at the ghost position to three times that size at 150 m separation. Crossing the grey ghost contracts and then regrows the gold node. Releasing the button animates the grey marker with the camera toward gold until the two converge; under reduced motion it moves directly. The original up/level/down cue remains available, and the normal grey node is the settled state.
- The firework settings form can retract to the left to leave a 36 px tab. The labelled native toggle supports keyboard activation and pointer click/drag, announces expanded state with `aria-expanded`, and sets the hidden form `inert` to remove off-screen tab stops. Browser context menus are suppressed on the Fireworks page, even on editable fields, while the Fireworks scene is mounted. Firefox Shift + right-click bypass remains outside app control. Right-wheel input also supplements `WheelEvent.buttons` with actual tracked pointer state for device compatibility.
- Sydney Tower now shares the skyline WebGL city depth buffer with surrounding sourced buildings, avoiding a foreground-only overlay at the landmark. The original Canvas tower stays available in PLAN and non-WebGL browsers; no new controls or keyboard interactions are introduced by this geometry fix.
- The height-scale marker now visibly follows actual eye-height changes as the user holds right drag or both mouse buttons, instead of appearing to snap after an expensive render. Its short transform-based movement preserves the right-wheel ghost/target animation and respects reduced motion. The in-scene cursor also tracks mouse position through a direct compositor transform without reading layout for each move; a shorter fade keeps transparency feedback while reducing the delayed feel.
- The Method disclosure differentiates still-unacquired Overture geometry from the current calibration scene and links ODbL attribution. Real-data performance, screen-reader understanding of a spatial scene and physical-device gesture testing remain a separate review gate.

Street-network iteration:

- Streets, junctions, traffic signals and crossings remain decorative canvas geometry. Their presence is summarised in telemetry/status text rather than adding hundreds of focusable map objects.
- Street names are retained in the data model for later labelling, but this pass deliberately adds no small text labels that would become unreadable under free camera motion.
- The Method disclosure explains that NSW lane count is categorical and that inferred road widths are rendering estimates. This prevents visual width or the NSW `TwoOrMoreLanes` code from being mistaken for exact engineering measurements.
- Real building/road conflicts are withheld from rendering rather than silently moving source geometry; this data-quality state is recorded in the bundle profile for later review.

## Homepage Gallery

The homepage review prototype treats top-level site sections as a single-viewport portfolio gallery instead of a conventional scrolling landing page.

### Storyboard-ready highlights

| Theme | User problem | Design response | Portfolio story |
| --- | --- | --- | --- |
| Turntable navigation | A standard card grid did not match the intended gallery character of the portfolio. | Top-level sections use restrained rounded dark surfaces in a perspective carousel. The active card stays sharp while neighbouring cards keep a visible silhouette and low-contrast preview imagery, then recede through 3D perspective, direct blur, muted colour and opacity. A moving backdrop-filter layer was removed after it caused compositor flicker and colour banding. | Navigation is the visual concept rather than decoration added around a standard homepage. |
| Project preview panes | Section names alone did not show enough of the work behind each destination. | Active cards pair their copy with one large featured preview and two stacked secondary previews. Real project metadata supplies Home, Games and Lab examples; empty sections use section-level samples until real assets exist. Titles sit inside the visuals rather than in separate mini-card footers. Neighbouring cards retain blurred, muted preview hints with a subtle sliced offset so they feel populated while remaining unreadable. | Gives each destination a project-specific visual identity without loading a separate screenshot system or turning the card into a nested dashboard. |
| Full-card section target | Small footer links made the large carousel card feel less interactive than it looked. | The active card can be clicked or tapped anywhere to open its section, while its full-card native link stays keyboard focusable. Horizontal drag still controls the carousel, and side cards remain navigation context rather than additional tab stops. | The visual object and the navigation target now match. |
| Restrained hover feedback | A clickable full card needs confirmation without turning every preview into an animated tile. | Hover/focus applies a small interpolated tonal brightening to the settled active surface. It does not move the card body, change shadow geometry or zoom individual previews. | Feedback communicates selection without creating a second movement after carousel landing. |
| Persistent direction controls | Wheel and drag navigation can be missed or inconvenient for visitors who prefer explicit controls. | Large native-button arrows remain visible on every carousel position at 45% opacity, rising to 75% opacity on hover or keyboard focus. Keyboard focus also receives a distinct outline. At either end, the relevant arrow wraps to the opposite endpoint by sweeping through the existing finite sequence rather than cloning a card. Rapid arrow clicks are buffered and replayed in order, with queued follow-up steps accelerated after the first weighted move. | Keeps previous/next navigation explicit without letting the arrows dominate the cards, and prevents deliberate repeated input from being lost while a card is still moving. |
| Mouse edge lift and auto-flick | A visitor exploring with a mouse may understand that the cards rotate but still need a more physical way to browse without explicit controls. | On mouse/fine-pointer input, moving toward either outer edge progressively tilts and lifts the active card. With Auto Swipe enabled, holding at the edge starts one weighted 1.5-second flick to the neighbouring section, then continues automatically with faster follow-up steps until it reaches a capped readable pace. Leaving the zone stops the sequence. | Makes the edge feel like an intentional browsing mode while keeping the initial discovery step slower and clearer than the later flow state. |
| Separated pointer zones | Letting the stage act as one large drag target caused the grab gesture and edge-hover navigation to overlap in empty space around the card. | Pointer/touch drag begins only inside the visible rounded active-card shape. Desktop edge-hover loading starts in a separate viewport-relative zone near the large direction arrow, with a responsive dead band between the card and edge zone. The visual field begins farther inward to advertise the edge before the cursor reaches the strongest zone. Pointer-transparent full-height root layers keep the physical edge brightest, while a spring-damped fog trail stays bounded between the edge and cursor so it looks pulled inward like liquid rather than sprayed across the screen. | Distinct hit regions make the physical interaction model predictable, while the reactive field explains the optional Auto Swipe behaviour instead of acting as unrelated decoration. |
| Synchronized carousel launch, landing and depth | A centred card could start or finish movement abruptly, while neighbouring cards could also flash darker as they crossed a near/far styling threshold. | Frame-by-frame carousel rendering uses a short 0.30-card flat-to-skew launch and a longer landing that reaches `rotateY(0deg)` before the final 0.14-card centring travel. Surface, shadow, blur, opacity, saturation, brightness, preview scale and refraction now interpolate continuously through the one-card neighbour boundary, with independent CSS catch-up transitions disabled during scripted motion. | Rotation and visual depth now come from one continuous position model instead of separate state handoffs. |
| Multiple input methods | A custom carousel still needs familiar input behaviour across mouse, trackpad, touch and keyboard. | Deliberate horizontal trackpad movement, Shift+wheel, horizontal pointer/touch drag, Left/Right arrow keys, persistent previous/next controls and the bottom section rail control the same active-section state. Ordinary vertical wheel movement does not change sections. Repeated keyboard arrow presses remain buffered through the explicit-navigation queue. The mouse edge auto-flick is optional and is not used for touch input. | Multiple navigation paths remain available without repurposing ordinary vertical scrolling as horizontal navigation. |
| Mouse throw gesture | Direct mouse dragging felt laggy when CSS transitions continued to interpolate transforms after each pointer move, and release had no sense of momentum. | Fine-pointer drag now suspends carousel transitions while held, follows the pointer through captured events, samples recent movement velocity and uses a damped one-card spring throw after a fast release. Slow mouse drags still settle by distance, and touch retains its existing non-inertial release. | Desktop drag behaves like a weighted physical object instead of a scrubber with delayed transforms. |
| Endpoint drag affordance | At the first and last card, finite-index clamping made a drag toward the wrapped direction look frozen even though release could still wrap to the opposite endpoint. | Home can be pulled right and About left on mouse or touch through a logarithmic soft-wall response that never visibly hard-stops but becomes progressively heavier. With Auto Swipe enabled, a right-edge or left-edge pressure glow grows from the raw pull distance; turning Auto Swipe off suppresses that glow. Sufficient pull or mouse throw still hands the exact resisted position into the existing wrap sweep. Pointer capture keeps the gesture continuous outside the card bounds. | The endpoint feels weighted and responsive before release, communicating resistance and wrap direction without requiring decorative feedback. |
| Direct rail navigation | A conventional range thumb made named destinations harder to target. | The bottom rail has one native button per section. Fine-pointer movement previews the nearest tick without changing the active card, clicks/taps select an exact tick, and an intentional pointer/touch drag scrubs across the same rail. The moving thumb is tied to the live fractional carousel position, so it travels with the same easing and weighted timing as the cards instead of updating only after a section settles. | Fast browsing without hiding section destinations inside an unlabeled continuous control, while the indicator visibly explains carousel progress. |
| Weighted treemap overview | A carousel makes comparison and direct scanning slower, while the former equal-row layout gave every section the same visual priority and left the selected card visually disconnected from the carousel design. Passive treemap cards also risked losing their titles or bunching copy and previews along the top edge. | The centred four-pane Overview control opens all seven server-rendered section cards as a stable weighted treemap. Base section weights give larger portfolio areas more room than About, and the hovered/selected region receives a temporary weight boost so it becomes the largest card while the surrounding regions compress. Treemap cards reuse the carousel surface, radius, shadow and preview language, scale their type from the space available, collapse cramped shapes into title-first states sooner, and rebalance with transform-isolated position/size transitions. | A second spatial mode communicates portfolio hierarchy while remaining visually continuous with the carousel. |
| Touch treemap navigation | The previous preview-before-open treatment made touch navigation require an extra tap. | Touch and pen use the full-card native link directly, so the first tap opens the section. Weighted enlargement remains a fine-pointer hover enhancement, while keyboard focus adds a visible focus treatment without resizing the treemap. | Touch and keyboard users get predictable link behaviour without layout shifts. |
| Carousel/Overview spatial continuity | A hard mode switch or generic card entrance makes the overview feel detached from the carousel and can make every card appear to explode from one origin. | When Overview opens, the currently centred carousel card moves and scales into its own treemap region. The other cards are laid out at their final regions first, then fade forward from a slightly recessed scale with small staggered timing. Hover-driven treemap resizing waits until that entrance finishes. Returning to carousel uses the current selected/last mouse-hovered Overview region as the source card; keyboard focus no longer changes that geometry. Reduced-motion preference skips the entrance motion. | Mode switching keeps a clear spatial relationship between the selected section and the overview without making the other sections travel across the screen unnecessarily. |
| Persistent homepage mode | Returning from another portfolio page previously reset Home to the default presentation even if the visitor had chosen Overview. | The carousel/Overview choice is stored in origin-local browser storage and restored when Home loads again. If storage is unavailable, the homepage still works with its normal default. | Visitors return to the spatial mode they were already using rather than having to reselect it. |
| Auto Swipe control | Desktop edge-hover auto-flick and luminous edge feedback can help exploratory browsing but can also feel too active, and the switch should communicate its state without becoming permanent visual chrome. | Fine-pointer users get a bottom-right `Auto Swipe` switch that defaults off for visitors without a saved preference and persists explicit choices locally. Off is 75% transparent, on is 25% transparent, and pointer hover is fully opaque; clicking it no longer leaves the control stuck at full opacity after the pointer departs, while keyboard `focus-visible` keeps a clear outline. Turning it on pulses both full-height edge magnets twice as a brief confirmation, except under reduced motion. Once enabled, the edge field begins farther inward, uses the same pressure value to drive a liquid cursor pull and vertical ripple, and continues stepping through sections while the cursor stays in the edge zone. The first step remains slow and later steps accelerate to a capped pace. The visible fog trail is constrained between the physical edge and the cursor so the cursor reads like it is pulling the glow inward, with the reach shortened slightly so the trail does not overshoot the cursor. Turning it off disables edge-hover loading, auto-flick, cursor-reactive field feedback and endpoint pressure glow, while deliberate horizontal trackpad/Shift+wheel input, drag, arrow buttons, keyboard navigation and the section rail remain available. | Ambient automation is opt-in, and the edge itself teaches what Auto Swipe will do through proportional, input-driven feedback. |
| Small-text readability and control targets | Utility labels and compact overview copy were visually subordinate but some sizes fell below a comfortable reading floor, and the mobile mode control was smaller than the preferred touch target. | Rail labels, Auto Swipe text, mobile location/brand text, preview captions, overview counts/summaries and dynamic overview eyebrow text use roughly 12px or larger minimums where space allows. The inactive rail label colour is lighter. The mobile Overview button keeps a 38px visible circle inside a 44px interactive box, and the Auto Swipe switch keeps its 34x18px visible track inside a 42x28px hit region. | Accessibility improvements keep the restrained hierarchy without making the interface visually heavy. |
| Search indexing | A highly interactive homepage can hide meaningful content behind client rendering. | Panel headings, descriptions and links are rendered by Astro in the initial HTML, using the same content visitors interact with. | Interaction layered over static-first content rather than replacing it. |
| Focus management | Off-axis carousel panels can contain links that are visually difficult to reach, and focus-triggered treemap resizing can move the target under a keyboard user. | Non-active carousel panels use `inert` and `aria-hidden`; Overview restores all panels and its full-card links to the normal interaction order. Overview focus highlights a card without changing treemap geometry. | Keyboard sequence and spatial layout remain stable. |
| Reduced motion | Perspective and fluid mode transitions can be uncomfortable for motion-sensitive visitors. | `prefers-reduced-motion` reduces carousel/Overview transitions to near-instant changes, suppresses the return animation and disables the mouse edge auto-flick. Explicit controls remain available. | Motion preference changes presentation while preserving navigation. |
| Fixed viewport with zoom fallback | The homepage should behave like a lightbox at normal sizes without clipping controls when browser zoom or landscape orientation makes the effective viewport too short. | The homepage uses dynamic viewport height and suppresses document scrolling at normal sizes. Below a short effective-height threshold it switches to a taller 600-620px gallery canvas and allows vertical document scrolling. The stage and rail use `touch-action: pan-y pinch-zoom` so browser pinch zoom remains available. | Preserves the application-like presentation while keeping zoomed and short-viewport layouts usable. |
| Screen-reader structure and announcements | Stage-wide live regions can over-announce animated content, while hiding the Home card can temporarily remove the only page `h1`. | A permanent visually hidden `h1` names the portfolio, every section card uses an `h2`, and a dedicated polite status element announces only settled carousel/mode changes. | Heading structure stays stable and announcements stay focused on navigation state. |
| Safe areas and increased contrast | Fixed edge controls can collide with display cutouts, and muted chrome needs a stronger option for people requesting more contrast. | The homepage opts into `viewport-fit=cover`, offsets header/arrows/bottom controls/Overview geometry using safe-area insets, and strengthens muted labels, rails, card boundaries and arrows under `prefers-contrast: more`. | The shell adapts to device cutouts and user contrast preferences without changing its default visual identity. |

## Site-wide

### Compact section navigation

- Internal collection and project pages now use a sticky name-only section strip rather than the previous brand-plus-text-link header.
- Home, Data, Maps, Games, Lab, Photography and About are each rendered as full native-link cards, so the complete visible target is clickable and keyboard reachable.
- The strip scrolls horizontally on narrow screens with scroll snapping instead of wrapping into multiple navigation rows.
- The current section receives the selected treatment. Project pages pass their parent category to the shared header so a Games project still marks Games as current, for example.
- On load, the current card is centred in the horizontal viewport when the strip overflows, keeping the active destination visible on phones.
- Hover is only a visual enhancement; navigation does not depend on hover.


- Carousel card movement uses asymmetric launch and landing phases. The outgoing card leaves `rotateY(0deg)` smoothly through a shorter launch zone, while the incoming card reaches flat orientation before the exact centre index is committed. Neighbouring surface, shadow, blur, opacity and preview-depth values interpolate continuously from the same carousel position, including through the one-card depth boundary, so continuous browsing does not trigger a separate darkening/shadow state.

## The Pulse of Adelaide (historical-only prototype)

### Full-history month-range selector, 2026-09-18

The default trend and playback interval span all available historical months for the chosen grade. A compact, keyboard-operable History control opens a panel with native From/To month selects, separate labelled month sliders and a selected-span rail. Selecting an end before the start moves the other endpoint with it, so the month range cannot contain an accidental isolated gap. Applying a period zooms the trend and restores A/B to that period; an All months action stages the entire archive. The time chart continues to accept only a deliberate A/B drag of at least two hours, and the playback timestamp still appears only while the visitor drags the scrubber. The chart summary represents the full history without downloading every raw event into the browser; monthly event files load only when visited, and cumulative checkpoints keep prices from older valid reports when crossing a month boundary. Missing source months are marked as reporting gaps, not interpolated price events. Test mobile sizing, the panel's scroll behaviour and network stalls with the real full export before release.


### Timeline drag clarity, 2026-09-17

A single click on the price plot no longer creates A or lets hover move B. Mouse, pen and touch now establish a new A/B interval only with a deliberate drag longer than 6 CSS pixels and spanning at least 2 whole Adelaide-local hours; shorter or cancelled gestures preserve the previous range. Reverse drags work. Existing A/B handles and keyboard edits observe the same minimum duration, while the separate native playback scrubber still responds immediately and the chart remains keyboard accessible.

The mean-price series stays gold/grey, while the progress bracket and three-line grip now use cool blue-green. The vertical bracket ends match the progress line's weight and respond to hover/drag with it. The playback timestamp appears above the grip only while the visitor actively drags it, not while playback runs or is paused. A/B dates and their reset buttons occupy a separate lane below the grip, and close endpoints stack on separate rows. The chart's own hover time is hidden during a scrub to avoid competing labels. The native range input and its accessible value, keyboard navigation, separate reset controls and reduced-motion playback remain in place.

The title now stays wholly above the land until all rendered letter pixels have passed over water at least once. At that point, the entire upper copy hides and the existing semantic title remains beneath the moving land. The transition stays complete until refresh; whitespace between letters is excluded from its completion test.

The latest geographic review uses the supplied September 2026 OSM harbour-water polygons to correct places where the older GSHHG mainland would otherwise cover the Port River. It does not change road or station coordinates; the coastline remains a visual reference. The title still resets on refresh, but its initial land/ocean mask is now prepared before map dragging. The chart's date ticks sit below the selection bracket, with a readable progress timestamp on the draggable handle that covers nearby ticks. The three-bar grip is a single SVG; the native keyboard/touch slider remains available. The fullscreen pin/chevron animation is slower and remains static under reduced-motion settings.

The latest Pulse patch adds a visual rewind button that returns to the selected interval's start, a clear three-line progress grip over the native range input, and A/B datetime previews directly beneath the timeline bracket during selection. The title starts fully visible and then gradually passes under the moving land only where the area has previously been ocean. The title's geographic mask resets on refresh; the underlying heading remains semantic text. The new solid land uses the same static GSHHG shoreline as the outline rather than filling an open projected path, while OSM road geometry remains unchanged. The shared fullscreen chevron/pin slot animation is slower, and reduced-motion users still get a static state change.


The geographic reference now uses entirely local, static GeoJSON. Coastline includes the full South Australian shoreline plus neighbouring WA/VIC segments and two short, clearly schematic coastal state-border ticks. Major roads from the supplied Geofabrik extract render as solid antialiased MapLibre line layers at 25% opacity, separate from the warmer coastline. Only nearby detailed road partitions load while zoomed in; a simplified statewide road overview appears when zoomed out. Source links identify OSM/ODbL and NOAA GSHHG/LGPL. No runtime geographic service or image fallback is required. Map pan/zoom and keyboard-accessible playback still work without suggesting road-based fuel-price causality.

The major-road reference layer now distinguishes geographic roads from coastline and price events without adding a basemap: fine dashed blue-grey lines represent freeways/highways and more subdued arterials, while the coastline remains continuous and warm-neutral. Roads follow map pan and zoom, cannot intercept pointer interactions, and remain optional when the public geography service is unreachable. Their presence does not imply price-change causality.

The latest playback refinement separates continuous **display time** from source event times: the chart cursor and map glows animate smoothly each frame, while the clock shows the current displayed minute and the source events remain unmodified. A/B selection and manual scrubbing still land on whole hours. Speed labels cycle 1×, 2×, 5× and 10× using restrained relative playback rates; play/pause and keyboard controls remain available, and reduced-motion mode does not autoplay. The large two-line city title is a semantic heading. The invalid filled land polygon was removed because the geographic service supplies open coastline lines only. The remaining edge and ocean effects are purely visual, not inferred price paths or land geometry.

September 17 latest review: the series chart is about half as tall, with the only playback scrubber now on its bottom bracket. A small ball marks progress and a chart hover label reports the whole-hour time; direct plot clicks or a drag set the start/end. Locked endpoints retain date/time labels and individually keyboard-accessible reset controls, while native range input and arrow-key editing provide non-drag alternatives. Playback auto-starts only after local history has loaded, except under reduced-motion settings. The timer uses Adelaide-local whole hours at every speed; source observations retain original timestamps. Translucent date/time and mean price are larger, transport controls are borderless, the Adelaide CBD landmark is always displayed, and geographic roads use optional verified-class Location SA geometry with no implied price causation. Magnitude-dependent pulse *visuals* last longer; reported station states do not expire.

**Latest interaction review, 17 September 2026:** The map now takes the full remaining viewport height. A slim progress input lies against its bottom edge, while icon-only play/pause and speed controls rise from the bottom centre on mouse hover. They become clearer when directly hovered or keyboard-focused and stay visible for touch users. Enlarged date/time and mean-price readouts remain text, not decorative imagery. Station glow lifetime now depends on observed change size without expiring station price state. Suburb reference squares appear on map hover, with each name unfolding from a short diagonal flag through an interruptible stepped reveal. Labels also work through keyboard focus and tap. The coarse coastline has been removed; the map waits for the detailed Location SA response and otherwise shows no outline.


The latest visual review adds transient chart-line highlighting only during drag, keeps the selected-time bracket after release, and uses a faint line underlay without adding a card or filled chart. Mean price is shown bottom-right as a superscript-tenth cents-per-litre value; a thresholded, cooldown-limited red/green pulse is decorative and suppressed under reduced-motion settings. The date/time is larger but still secondary to the map. Twelve geographically sourced suburb reference squares provide optional orientation: desktop map hover exposes labels at half opacity; hover, keyboard focus or touch selection exposes a chosen place at full opacity. Source attribution identifies the coastline in use, and a higher-detail public Location SA coastline request falls back to bundled GSHHG when unavailable. Reference places do not represent stations or their historical prices.

September 17 visual review: the range brush now has a slim, persistent bracket beneath the chart rather than a filled gold region. Chart guides use HTML text in the page's system sans-serif font, so hover labels no longer stretch when the SVG changes aspect ratio. Mouse and touch can drag to select a period, the range has endpoint dragging, and a focused chart supports arrow keys for playback plus Alt/Shift with arrows for changing range limits. The map uses sourced GSHHG shoreline paths instead of the previous approximate trace; projection and SVG dimensions match the station layer. The coastline and pulses fade away through an elliptical alpha mask with no filled map panel. Fuel/month selectors, unobtrusive date/time and rise/fall legend share the upper-right corner, and a text-only speed button cycles 1×, 2×, 5×, 10×. The playback slider and icon-only play/pause control retain accessible labels and visible focus outlines.

The 2026-09-17 event prototype replaces daily point playback with hourly time selection and original intraday event sequencing. The current refinement makes the scene more minimal: the chart is thinner and quieter, visible tick labels stay hidden until hover, focus or drag, and the playback window is brushed directly on the chart instead of shown with literal A/B labels. A soft red/green cloud at each station represents the direction of its latest recorded movement; a brighter core plus halo improves legibility without adding causal link lines or interpolation. The map now uses a faint coastline trace and a blank projection so the geography fades into the background rather than reading as a boxed basemap. Month/fuel selects one static partition at a time. Play/pause, speed selection and a scrubber scoped to the selected range remain native keyboard/touch controls. A compact timer chip and selectable station detail provide text alternatives. Reduced-motion preference suppresses bursts and advances in discrete hourly steps. Generated data is local-only pending rights review.

The complete local-history pass adds labelled fuel, month and Adelaide/all-SA selectors. Each change loads only one historical daily partition; playback is deliberate and remains paused on selections. Numeric coverage reports the selected day's reporting sites against the relevant stations with history. The slider and station list remain keyboard accessible; the map camera frames the chosen area and respects reduced motion. The June ULP sample represents just two Adelaide sites, not city-wide coverage.

| Feature | User need | Implementation | Follow-up |
| --- | --- | --- | --- |
| Daily historical timeline | Explore real past observations without a misleading live status. | Day slider with readable Adelaide date and an explicit play/pause button; no autoplay. Each frame uses the last observed station price on that calendar day, with missing values omitted. | Review with a corrected SA-only archive and test range of available days. |
| Station map and text equivalent | Colour is not enough to read a price. | Price-coloured points, optional soft glow, numeric legend, station selector, observation timestamp, unweighted median and count. | Test phone, keyboard and map CDN availability using a valid export. |
| Reduced motion and missing data | Keep the page usable when animation or data is unavailable. | Reduced-motion camera jumps and slower optional playback; clear no-data state if there is no validated historical export. | Conduct local visual and accessibility review. |


### Pulse fullscreen navigation and road presentation, 2026-09-17

The Pulse project now opts into a shared fullscreen page shell with a compact top navigation tab. The strip opens over the visual and provides a persistent pin action that stores the choice across other fullscreen projects. Its closed links are inert, its controls have visible focus treatment and accessible labels, Escape closes the unpinned overlay, and touch users can reach the unpin action without hover. A road icon below Rise/Fall cycles full, dimmed and hidden vector roads with an updated accessible label. The road baseline remains visible through zoom transitions; the understated line styling uses flat caps to avoid bright endpoint dots. Short neighbouring coast segments and border markers fade out independently of the Adelaide pulse data.

### Pulse fullscreen hover and geographic layering, 2026-09-17

The narrow shared fullscreen tab opens on hover or tap, then exposes the pin action in the same button. Leaving an unpinned navigation area closes it; pinned state persists between fullscreen projects. The icon rolls down on transitions unless reduced motion is requested. Keyboard users can activate the button and close the overlay with Escape. The map's static coastline now defines the opaque land edge, with the ocean and large title beneath it and the existing anti-aliased road vectors and fuel pulses above it. The land edge follows zoom and pan; it is derived from the mainland shoreline and does not invent fuel prices or change observation order.



### Fireworks night sky prototype

- The skyline sky layer currently combines real bright-star anchors with a denser deterministic faint-speckle background so the night sky feels populated during fireworks planning.
- Reduced-motion users still get a static star field; only subtle twinkle is suppressed.

- Skyline mode now includes a compact heading/elevation readout and a small perspective compass in the top-right. It is informational only, does not intercept input, and fades with the other overlays during active camera motion.
