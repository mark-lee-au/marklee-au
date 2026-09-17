# 007 Home Gallery

## Stage

Stage 2 visual prototype under review.

## Purpose

Replace the conventional scrolling homepage with a single-viewport portfolio gallery that behaves like a photographic lightbox or turntable. The homepage should make the site sections feel like a curated body of work rather than a standard landing page.

## Current prototype

- The page behaves as a fixed-viewport gallery at normal heights. When browser zoom or landscape orientation reduces the effective viewport below 560px high, the gallery uses a taller scrollable canvas so cards and controls remain reachable.
- Seven server-rendered sections cover Home, Data, Maps, Games, Lab, Photography and About.
- Deliberate horizontal trackpad/Shift+wheel input, horizontal pointer drag, touch drag and arrow keys move through the carousel. Ordinary vertical wheel input does not change sections.
- The carousel no longer uses a moving `backdrop-filter` surface. That approach produced visible flicker and colour banding during 3D transitions. Each carousel section is now a rounded dark card with a restrained internal gradient and compact box-shadow depth. The active card stays sharp while side cards keep their silhouette, retain low-contrast preview imagery, and recede through direct blur, muted colour, opacity and 3D depth.
- The top centre copy reads `BUILT IN ADELAIDE, AUSTRALIA`.
- A circular four-pane `Overview` control sits centred below the top rule. In Overview mode it inverts to a light selected state. The selected homepage mode is stored locally, so returning to Home restores the visitor's last carousel/Overview choice. Internal code retains the existing `list` mode key for compatibility.
- Overview uses a stable weighted treemap rather than a single row. Each section has a base weight, with Data, Games, Lab and Photography receiving more default area than About. The selected/hovered section receives a temporary weight boost, so it becomes the largest region while the rest compress around it without changing their overall spatial order. Geometry rebalances through direct position/size transitions that stay isolated from the carousel transforms; hover selection changes only on real mouse movement over a card so moving boundaries do not recursively retrigger selection.
- The full section card links to its collection in both carousel and Overview. A real project preview is a separate native link to its own `/projects/<slug>/` page, with its image and caption inside the same target; abstract section-only previews have no invented detail page and still use the underlying section destination. The previews and section link are sibling links rather than invalid nested anchors.
- Overview cards keep the same dark gradient surface, corner radius, shadow language and preview system as carousel cards. Larger treemap regions use balanced side-by-side copy/preview layouts, while smaller regions progressively reduce secondary copy and imagery so the section title stays visible instead of being squeezed behind preview chrome.
- Touch and pen follow the full-card native Overview link on the first tap. Fine-pointer hover can still reweight a region, while keyboard focus highlights the card without changing treemap geometry.
- Entering Overview now preserves spatial continuity: the currently centred carousel card morphs into its own treemap region, while the remaining cards appear close to their final regions from a slightly recessed, transparent state. Initial treemap geometry transitions are suppressed during this entrance so cards do not sweep in from the carousel's shared centre point. Exiting Overview returns to the current selected/last mouse-hovered card and animates that card into the centred carousel position.
- A centred bottom rail sits above the bottom rule. Its moving thumb is driven by the same fractional carousel position as the cards, so it travels continuously with wheel/arrow flicks, drag settling, held-edge auto-scrolling and endpoint wrap sweeps rather than jumping only after the active index changes. Fine-pointer hover previews the nearest section tick without changing the active card. Click/tap selects a destination, and touch or pointer drag commits section changes across the rail.
- Large previous/next arrow buttons now remain visible on every carousel position, including Home and About. They sit at 45% opacity until hovered or keyboard-focused, when they animate to 75% opacity. Keyboard focus also receives a visible outline treatment. Moving beyond either end wraps to the opposite end without cloning a card: the finite sequence visibly sweeps back through its existing positions before settling on the other endpoint.
- Repeated explicit arrow input is buffered rather than dropped during motion. Rapid previous/next button clicks and repeated keyboard arrow presses are replayed in order after the current card settles. The first step keeps the normal weighted 560ms movement; queued one-card steps use a faster 300ms flick and queued endpoint wraps use a faster 760ms sweep. Opposite-direction inputs are preserved in the order entered. Keyboard auto-repeat is capped to a small look-ahead queue so holding a key stays continuous without building a long backlog after release.
- Desktop mouse drag now uses a direct no-transition tracking phase plus release momentum. Pointer capture keeps the drag attached outside the card bounds; recent high-resolution pointer samples estimate release velocity. A fast release throws one card in that direction with a damped spring continuation, while a slow drag settles according to distance. Touch drag keeps the existing non-inertial settle behaviour. Endpoint drag no longer hard-clamps at Home or About. Mouse and touch now push into an unbounded logarithmic soft wall: the endpoint keeps moving, but each extra amount of pointer travel yields progressively less card travel. A right-edge pressure glow grows while Home is pulled right, and a left-edge glow grows while About is pulled left. Release passes the exact resisted position into the existing wrap sweep when the pull or mouse throw crosses the endpoint threshold; smaller pulls settle back.
- Pointer/touch drag can start only inside the visible rounded active-card shape. Empty stage space, neighbouring cards and the gap outside the card are not draggable. Desktop fine-pointer edge-hover navigation uses a separate responsive viewport-edge zone positioned just inward of the large arrow controls. The visual influence zone now begins farther inward than the arrow itself while a clamped dead band still protects the active-card drag region. Edge-hover feedback is rendered from dedicated gallery-root layers so it spans the full viewport height through the header and bottom-control areas. The physical edge remains brightest, a spring-damped liquid pool follows the cursor with a short vertical ripple, and a low-density canvas particle field emits from the edge and curves toward the cursor as edge pressure increases. The particles are interaction-driven, not autonomous decoration.
- On mouse/fine-pointer input only, moving toward the outer left or right side of the active card progressively loads the card with a small weighted tilt. The hover zone includes the visible previous/next arrow area rather than stopping at the arrow controls. With `Auto Swipe` enabled, holding beyond the card edge starts one slower 1.5-second lift-and-flick step, then continues automatically with faster follow-up steps until it reaches a capped readable pace. `Auto Swipe` defaults off when no saved preference exists and persists explicit user choices; turning it off disables the edge-hover auto-flow plus its edge glow/reactive feedback while keeping explicit carousel controls available. The switch is shown only for fine hover-capable primary input.
- Active cards now use a two-part composition: section copy on the left and a larger visual group on the right. The first preview is featured at full height while the second and third previews stack beside it. Real project metadata drives Home, Games and Lab previews where available. Empty or under-filled sections use clearly section-level visual samples until real work exists. Titles are overlaid inside the preview windows; status/meta footers are omitted.
- The centred carousel card is a full click/tap target for its section and keeps a native focusable section link for keyboard users. Hover/focus adds a restrained surface/shadow emphasis and a small content lift. The preview imagery itself does not zoom or rotate on hover. Separate `OPEN ...` footer links and repeated bottom section labels are removed.
- Section headings, descriptions and links are present in the initial Astro HTML.
- Photography has a top-level route and remains in the permanent header/footer navigation.
- Internal section and project pages use a shared sticky name-only section strip across the top. Home, Data, Maps, Games, Lab, Photography and About are full-card native links; the strip scrolls horizontally on narrow screens and centres the current section on load.

## Visual direction

Keep the treatment typographic and restrained. Avoid generic SaaS hero composition, ornamental grids and nested mini-card chrome. Strong shell glow or motion must communicate an interaction state rather than exist as autonomous decoration. Preview windows must represent actual work or an explicit section concept rather than generic stock illustration. Carousel and Overview cards share restrained 22-28px corners, a subtle dark surface gradient and compact ordinary shadows. Depth separation comes from perspective, scale, surface opacity and direct blur. Neighbouring preview imagery may use a muted sliced/offset treatment to suggest refraction, but must not reintroduce `backdrop-filter`. Overview expansion should feel like a weighted treemap rebalancing around the selected region rather than a menu accordion.

- Carousel rotation now uses asymmetric launch and landing zones. The outgoing card moves from flat to its travelling skew over a shorter 0.30-card launch, while the incoming card flattens over a longer landing and remains at `rotateY(0deg)` for the final 0.14-card centring travel. Visual focus follows the same timing, and repeated edge-auto steps do not inject a new first-frame tilt.
- Neighbouring-card visual depth is continuous across the full carousel distance. Surface opacity, shadow opacity, copy/preview opacity, blur, saturation, brightness, preview scale and refraction no longer switch from a near-card formula to a separate far-card formula at exactly one-card distance. Cards beyond the nearest neighbour also fade out through a continuous depth curve rather than popping at a visibility threshold.

## Accessibility and performance

- Keep all meaningful content in server-rendered HTML.
- Use native links and buttons for section navigation.
- Non-active carousel panels are removed from the keyboard sequence with `inert`; Overview restores all panels.
- Support Left/Right arrow keys, Home and End in carousel mode. Up/Down retain normal browser behaviour.
- Previous/next button clicks and keyboard arrow presses are buffered during an active explicit navigation sequence instead of being ignored. Queued inputs are replayed sequentially with accelerated follow-up motion, while direct rail selection, wheel input, drag, mode changes and Home/End clear stale queued navigation. Keyboard auto-repeat keeps only a short look-ahead buffer so holding a key remains continuous without leaving a long backlog after release.
- Fine-pointer mouse drag is rendered without CSS transform/opacity catch-up transitions. Pointer movement is coalesced to animation frames, pointer capture preserves the gesture outside card bounds, and recent movement samples determine release velocity. Fast mouse releases continue through a damped spring throw into the neighbouring card; slow releases retain distance-based settling. Touch input does not receive release inertia. Endpoint overscroll is shared by mouse and touch: a resisted visual pull is allowed just beyond the first/last index, pointer capture keeps that pull attached to the gesture, and the released overscroll position is handed directly into the finite endpoint wrap animation rather than snapping back to the endpoint first.
- Use `(hover: hover) and (pointer: fine)` for hover-driven Overview weighting. Do not infer hover ability from viewport width alone. Keyboard focus highlights a card without changing treemap geometry, and touch/coarse-pointer devices keep the same stable layout with one-tap native navigation.
- Edge-hover auto navigation requires an actual mouse pointer event plus a fine hover-capable pointing device. It is disabled for touch input and when `prefers-reduced-motion` is active.
- Normal one-card moves, drag settling, edge-hover moves and endpoint wraps are rendered frame-by-frame from the live carousel position. The bottom rail thumb reads that same live position on every frame, with no independent `left` transition, so its timing/weight matches the cards exactly. Rotation is asymmetric: the outgoing active card ramps from flat to skew quickly through a short launch curve, while the incoming card uses the longer zero-slope landing curve and reaches `rotateY(0deg)` before its final centring travel. Surface darkness, shadow, blur, opacity, saturation, brightness, preview scale and refraction are derived continuously from the same position, including through and beyond the one-card neighbour boundary. Independent CSS transitions stay suspended during scripted motion so they cannot lag behind the frame renderer.
- Touch/pen Overview cards use their full-card native links directly, so the first tap opens the destination. Weighted enlargement remains a fine-pointer hover enhancement rather than a prerequisite for navigation.
- The stage and rail preserve browser pinch zoom with `touch-action: pan-y pinch-zoom`. At short effective viewport heights, including high browser zoom and landscape phones, the homepage switches from a locked viewport to a taller scrollable canvas so cards and controls are not clipped.
- A permanent visually hidden page `h1` provides heading structure; card titles are `h2`. A dedicated polite status region announces settled section/mode changes instead of applying `aria-live` to the animated stage.
- Safe-area insets protect the header, arrows, rail, Auto Swipe control and Overview stage on display-cutout devices. `prefers-contrast: more` strengthens muted labels, rails, card boundaries and idle controls without changing the default theme.
- Respect `prefers-reduced-motion` by suppressing long carousel/Overview transitions and the return animation.
- Keep the implementation dependency-free. Shared section navigation belongs in the site shell, while 3D carousel behaviour remains homepage-specific.

## Review questions

1. Does the one-featured-plus-two-stacked preview composition add enough project identity without turning the main section card into a dense dashboard?
2. Do the reduced-radius card surfaces and tighter shadows make the waiting sections read as cards without competing with the active section?
3. Do the always-visible left/right arrows, queued rapid-click/keyboard flicks and endpoint wrap sweep make the carousel feel continuous without implying duplicated cards?
4. Do the low-contrast refracted preview hints, surface darkness and shadows remain visually stable as cards cross the nearest-neighbour boundary during rapid continuous scrolling?
5. Does the name-only section strip feel like a reduced continuation of the homepage cards on collection and project pages?
6. Does the bottom rail thumb now feel physically coupled to the cards during slow first edge-flicks, faster repeats, drag settling and endpoint wrap sweeps?
7. Does the weighted treemap feel stable while still making the selected region clearly dominant, and are the base weights for Data, Games, Lab, Photography, Maps and About proportioned well?
8. Does the separated interaction geometry feel clear across laptop and desktop widths: grab only inside the rounded card, then a dead band, then the earlier-starting magnetic field near the arrow/screen edge? With Auto Swipe enabled, confirm the edge line stays brightest, the liquid fog pools toward the cursor, the ripple follows vertical cursor movement with a brief damped lag, and the field fades fully without a hard vertical segment. Confirm the first 1.5-second step still feels deliberate, then that held edge browsing speeds up to a capped readable pace without becoming too fast.
9. Does desktop click-drag now feel directly attached to the pointer, and does a fast mouse release carry enough momentum to feel like throwing one card without overshooting?
10. At Home and About, does the logarithmic soft-wall pull feel heavy without appearing capped, and does the growing edge glow communicate pressure without becoming decorative noise?
11. On a 390px touch device, does every Overview card open reliably on the first tap, and are compressed treemap labels still readable enough to target?
12. What photography work and imagery should replace the current introductory Photography page?

## Deferred

- Final photography gallery and image assets.
- Final project/photo thumbnail assets to replace any remaining section-level sample panes.
- Full cross-browser release QA.
- Publishing or deployment.

## 2026-09-15 Apple Design Skill refinement

- Base: `main` at `8114ceac2b51609ea846cc57d79c899076de7177`, clean supplied snapshot.
- Visitor-facing `List` terminology changed to `Overview`; the control now uses a four-pane grid glyph. Existing storage/data-mode values remain unchanged to protect the reviewed transition implementation.
- Auto Swipe defaults off, respects saved explicit choices, and performs at most one automatic card step per edge-zone entry.
- Carousel wheel handling accepts horizontal intent only. Vertical wheel movement no longer changes cards.
- Edge feedback keeps the full-height line and pointer-following bulge, then adds back a low-density particle field only as interaction feedback: particles originate at the physical edge, curve toward the cursor and fade when edge pressure is released.
- Raised small-text floors and rail contrast, including dynamic overview typography, and expanded the mobile Overview hit region to 44px while retaining its 38px visual circle.
- Validation for this package is recorded in `docs/current-handoff.md`.

## 2026-09-15 Apple Design Skill accessibility and interaction pass

- Base: `main` at `7302dabaf342344d1e222bbf97b6e01b8f380c0d`, clean supplied snapshot.
- Restored browser pinch zoom on the carousel and rail with `touch-action: pan-y pinch-zoom`; short effective viewport heights now use a scrollable 600-620px gallery canvas instead of clipping fixed-height cards and controls.
- Raised idle previous/next arrow visibility to 45% and added an explicit focus outline.
- Rail hover now previews the nearest tick only. Section changes require click/tap or an intentional rail drag, and live-region announcements wait until a drag settles.
- Overview touch/pen links open on the first tap. Keyboard focus no longer changes the weighted treemap layout; mouse hover remains the only ambient weighting interaction.
- Added a permanent hidden page `h1`, changed all section card titles to `h2`, and replaced stage-wide `aria-live` with a dedicated polite status region for settled section/mode changes.
- Removed Up/Down carousel keyboard handling; Left/Right, Home and End remain.
- Raised remaining meaningful utility/caption type floors to about 12px and expanded the Auto Swipe switch hit region to 42x28px while keeping the visible track at 34x18px.
- Added `viewport-fit=cover`, safe-area offsets and `prefers-contrast: more` styling for the fixed homepage shell.
- Validation is recorded in `docs/current-handoff.md`.
## 2026-09-15 Auto Swipe activation feedback refinement

- Base remains `main` at `7302dabaf342344d1e222bbf97b6e01b8f380c0d`, with the reviewed Apple Design accessibility patch layered on top.
- Enabling Auto Swipe through the visible switch now triggers two brief pulses across both existing full-height edge magnets. The cue lasts about 0.8 seconds and then hands opacity back to the normal cursor-reactive edge system. It does not replay merely because a stored `on` preference is restored.
- Reduced-motion mode suppresses the activation pulse. Disabling Auto Swipe clears any pulse timer and edge glow immediately.
- Control prominence is stateful: off uses 25% opacity, on uses 75% opacity, and pointer hover uses 100% opacity. The later magnetic-edge refinement removes full-opacity `focus-within` behaviour so mouse focus cannot keep the control bright after the pointer leaves; keyboard `focus-visible` retains its outline.
- No carousel navigation timing, edge dwell timing, storage keys, Overview behaviour, safe-area handling or accessibility structure changed.

## 2026-09-15 magnetic edge feedback refinement

- Branch base: `main`; base commit `7302dabaf342344d1e222bbf97b6e01b8f380c0d`, with the previously delivered Apple accessibility and Auto Swipe activation-feedback patches layered on top.
- Auto Swipe edge feedback now begins farther inward from the physical screen edge while preserving the protected dead band around the active card. The existing full-height edge line remains the brightest point and continues to fall off inward.
- The cursor-centred glow now behaves like a damped liquid edge: its pool stretches farther inward as edge pressure grows, follows vertical cursor movement with spring lag, and produces a short two-lobe ripple based on vertical velocity rather than an autonomous looping animation.
- Each edge magnet contains a lightweight canvas particle layer. Fine luminous particles spawn at the physical edge and are gravitationally attracted toward the cursor, with density, trail brightness and attraction strength driven by the same edge-pressure value as Auto Swipe. Particle work runs only while the field is active or decaying, is capped at 72 particles per side, and uses a device-pixel-ratio cap of 2.
- Overview, Auto Swipe off and reduced-motion states suppress the particle field. Reduced motion keeps explicit carousel controls and does not run the gravity/ripple animation.
- Auto Swipe switch opacity is no longer tied to `focus-within`, so a mouse click cannot leave the control fully opaque after the pointer leaves. Off remains 75% transparent, on remains 25% transparent and pointer hover is fully opaque. Keyboard `focus-visible` retains a clear switch outline.



## 2026-09-15 magnetic edge fog follow-up

- Base remains `main` at `7302dabaf342344d1e222bbf97b6e01b8f380c0d`, using the previously delivered homepage Apple accessibility and Auto Swipe refinements as the working baseline.
- Replaced the separate canvas gravity-particle layer with a continuous full-height glow and fog system. The full edge remains brightest, the field begins farther inward, and the fog now pools toward the cursor with damped vertical lag and ripple inside the glow itself.
- Smoothed the field gradients so they fade fully to transparency without leaving a visible interior segment or clipped-looking boundary.
- Auto Swipe edge hold now continues advancing after the first move. The first step still takes about 1.5 seconds, then subsequent steps accelerate toward a capped faster duration instead of requiring pointer retreat and re-entry.
- The field is recomputed after each automatic move so the edge glow does not collapse between held steps.
- Auto Swipe switch opacity is now hover-only at full prominence; keyboard focus keeps only the explicit focus outline.

## 2026-09-15 magnetic edge fog tuning

- Base remains `main` at `7302dabaf342344d1e222bbf97b6e01b8f380c0d`, using the magnetic edge follow-up as the working baseline.
- Reduced the visual noise in the fine-pointer Auto Swipe field by replacing the broader dusty look with a cleaner bright-edge gradient plus a constrained fog trail.
- The attracted trail is now bounded between the physical edge and the cursor position, so it cannot overshoot past the cursor into the gallery.
- Added horizontal spring smoothing to the trail geometry so cursor movement changes the trail like a liquid pull rather than a static band.
- Review focus: confirm the edge remains clearly readable from farther inboard, the trail never extends beyond the cursor, and the continuing Auto Swipe hold pace still feels clear without the field dominating the card content.

## 2026-09-15 edge fog cleanup

- Simplified the edge-field gradients after local review showed a visible inner segment and a dustier look than intended.
- The bright edge remains the primary cue, the inward fog now fades more cleanly, and the suction trail is shortened so it terminates near the cursor rather than overshooting it.


## 2026-09-16 section and project link routing

- Base: supplied `main` snapshot at `79770434464b4450ef55b00357464fdc82ccc29d`, containing six existing uncommitted homepage/documentation changes. The patch is built on the supplied working-tree files, not on an older committed gallery.
- Server-rendered project preview anchors use the existing `projectUrl()` helper. Their entire tiles, including images and captions, link to the actual project pages for Home, Games and Lab. Generic Data, Maps, Photography and About samples have no individual pages in the snapshot, so they retain the underlying section link instead of presenting false destinations.
- The section anchor now handles native clicks on the active carousel card and every Overview card. Project anchors sit above it without nesting. Decorative copy and gutters pass pointer input through to the section anchor, while keyboard users can focus the section and project links separately.
- The drag gesture captures its actual originating link rather than the stage, then cancels any follow-up link click when the card was dragged or carousel motion is underway. Existing side-card selection, drag physics, Overview layout and Auto Swipe calculations are unchanged.
- Review focus: test section-body clicks and project image/caption clicks with mouse, touch and keyboard in both modes; confirm dragging from a preview does not navigate, and placeholder tiles open only their section.
