# 007 Home Gallery

## Stage

Stage 2 visual prototype under review.

## Purpose

Replace the conventional scrolling homepage with a single-viewport portfolio gallery that behaves like a photographic lightbox or turntable. The homepage should make the site sections feel like a curated body of work rather than a standard landing page.

## Current prototype

- The page itself does not scroll.
- Seven server-rendered sections cover Home, Data, Maps, Games, Lab, Photography and About.
- Deliberate horizontal trackpad/Shift+wheel input, horizontal pointer drag, touch drag and arrow keys move through the carousel. Ordinary vertical wheel input does not change sections.
- The carousel no longer uses a moving `backdrop-filter` surface. That approach produced visible flicker and colour banding during 3D transitions. Each carousel section is now a rounded dark card with a restrained internal gradient and compact box-shadow depth. The active card stays sharp while side cards keep their silhouette, retain low-contrast preview imagery, and recede through direct blur, muted colour, opacity and 3D depth.
- The top centre copy reads `BUILT IN ADELAIDE, AUSTRALIA`.
- A circular four-pane `Overview` control sits centred below the top rule. In Overview mode it inverts to a light selected state. The selected homepage mode is stored locally, so returning to Home restores the visitor's last carousel/Overview choice. Internal code retains the existing `list` mode key for compatibility.
- Overview uses a stable weighted treemap rather than a single row. Each section has a base weight, with Data, Games, Lab and Photography receiving more default area than About. The selected/hovered/focused section receives a temporary weight boost, so it becomes the largest region while the rest compress around it without changing their overall spatial order. Geometry rebalances through direct position/size transitions that stay isolated from the carousel transforms; hover selection changes only on real mouse movement over a card so moving boundaries do not recursively retrigger selection.
- The whole Overview card links to its section. Carousel preview panes show project identity but do not add nested project links; the large section card remains the single destination.
- Overview cards keep the same dark gradient surface, corner radius, shadow language and preview system as carousel cards. Larger treemap regions use balanced side-by-side copy/preview layouts, while smaller regions progressively reduce secondary copy and imagery so the section title stays visible instead of being squeezed behind preview chrome.
- On touch or pen input, the first tap on a non-selected Overview region expands/selects it and prevents navigation. Tapping that selected region again follows its native section link. Keyboard focus expands a region but Enter still follows the link normally.
- Entering Overview now preserves spatial continuity: the currently centred carousel card morphs into its own treemap region, while the remaining cards appear close to their final regions from a slightly recessed, transparent state. Initial treemap geometry transitions are suppressed during this entrance so cards do not sweep in from the carousel's shared centre point. Exiting Overview returns to the most recently hovered/focused card and animates that card into the centred carousel position.
- A centred bottom rail sits above the bottom rule. Its moving thumb is driven by the same fractional carousel position as the cards, so it travels continuously with wheel/arrow flicks, drag settling, held-edge auto-scrolling and endpoint wrap sweeps rather than jumping only after the active index changes. Fine-pointer hover selects the nearest section, each tick is a real button, and touch users can drag across the rail.
- Large previous/next arrow buttons now remain visible on every carousel position, including Home and About. They sit at 20% opacity until hovered or keyboard-focused, when they animate to 75% opacity. Moving beyond either end wraps to the opposite end without cloning a card: the finite sequence visibly sweeps back through its existing positions before settling on the other endpoint.
- Repeated explicit arrow input is buffered rather than dropped during motion. Rapid previous/next button clicks and repeated keyboard arrow presses are replayed in order after the current card settles. The first step keeps the normal weighted 560ms movement; queued one-card steps use a faster 300ms flick and queued endpoint wraps use a faster 760ms sweep. Opposite-direction inputs are preserved in the order entered. Keyboard auto-repeat is capped to a small look-ahead queue so holding a key stays continuous without building a long backlog after release.
- Desktop mouse drag now uses a direct no-transition tracking phase plus release momentum. Pointer capture keeps the drag attached outside the card bounds; recent high-resolution pointer samples estimate release velocity. A fast release throws one card in that direction with a damped spring continuation, while a slow drag settles according to distance. Touch drag keeps the existing non-inertial settle behaviour. Endpoint drag no longer hard-clamps at Home or About. Mouse and touch now push into an unbounded logarithmic soft wall: the endpoint keeps moving, but each extra amount of pointer travel yields progressively less card travel. A right-edge pressure glow grows while Home is pulled right, and a left-edge glow grows while About is pulled left. Release passes the exact resisted position into the existing wrap sweep when the pull or mouse throw crosses the endpoint threshold; smaller pulls settle back.
- Pointer/touch drag can start only inside the visible rounded active-card shape. Empty stage space, neighbouring cards and the gap outside the card are not draggable. Desktop fine-pointer edge-hover navigation uses a separate responsive viewport-edge zone positioned just inward of the large arrow controls. A clamped dead band is kept between the card and the edge zone so the grab gesture and hover-to-scroll gesture cannot compete. Edge-hover feedback is rendered from dedicated gallery-root layers so it spans the full viewport height through the header and bottom-control areas. A bright edge line falls off inward and a wider cursor-centred radial bulge follows the pointer; the previous particle/dust layer has been removed.
- On mouse/fine-pointer input only, moving toward the outer left or right side of the active card progressively loads the card with a small weighted tilt. The hover zone includes the visible previous/next arrow area rather than stopping at the arrow controls. With `Auto Swipe` enabled, holding beyond the card edge starts one 1.5-second lift-and-flick step. Another automatic step requires the pointer to retreat from the edge zone and re-enter, so parking the pointer cannot cycle continuously. `Auto Swipe` defaults off when no saved preference exists and persists explicit user choices; turning it off disables the edge-hover auto-flow plus its edge glow/reactive feedback while keeping explicit carousel controls available. The switch is shown only for fine hover-capable primary input.
- Active cards now use a two-part composition: section copy on the left and a larger visual group on the right. The first preview is featured at full height while the second and third previews stack beside it. Real project metadata drives Home, Games and Lab previews where available. Empty or under-filled sections use clearly section-level visual samples until real work exists. Titles are overlaid inside the preview windows; status/meta footers are omitted.
- The centred carousel card is a full click/tap target for its section and keeps a native focusable section link for keyboard users. Hover/focus adds a restrained surface/shadow emphasis and a small content lift. The preview imagery itself does not zoom or rotate on hover. Separate `OPEN ...` footer links and repeated bottom section labels are removed.
- Section headings, descriptions and links are present in the initial Astro HTML.
- Photography has a top-level route and remains in the permanent header/footer navigation.
- Internal section and project pages use a shared sticky name-only section strip across the top. Home, Data, Maps, Games, Lab, Photography and About are full-card native links; the strip scrolls horizontally on narrow screens and centres the current section on load.

## Visual direction

Keep the treatment typographic and restrained. Avoid generic SaaS hero composition, decorative glows, ornamental grids and nested mini-card chrome. Preview windows must represent actual work or an explicit section concept rather than generic stock illustration. Carousel and Overview cards share restrained 22-28px corners, a subtle dark surface gradient and compact ordinary shadows. Depth separation comes from perspective, scale, surface opacity and direct blur. Neighbouring preview imagery may use a muted sliced/offset treatment to suggest refraction, but must not reintroduce `backdrop-filter`. Overview expansion should feel like a weighted treemap rebalancing around the selected region rather than a menu accordion.

- Carousel rotation now uses asymmetric launch and landing zones. The outgoing card moves from flat to its travelling skew over a shorter 0.30-card launch, while the incoming card flattens over a longer landing and remains at `rotateY(0deg)` for the final 0.14-card centring travel. Visual focus follows the same timing, and repeated edge-auto steps do not inject a new first-frame tilt.
- Neighbouring-card visual depth is continuous across the full carousel distance. Surface opacity, shadow opacity, copy/preview opacity, blur, saturation, brightness, preview scale and refraction no longer switch from a near-card formula to a separate far-card formula at exactly one-card distance. Cards beyond the nearest neighbour also fade out through a continuous depth curve rather than popping at a visibility threshold.

## Accessibility and performance

- Keep all meaningful content in server-rendered HTML.
- Use native links and buttons for section navigation.
- Non-active carousel panels are removed from the keyboard sequence with `inert`; List view restores all panels.
- Support arrow keys, Home and End in carousel mode.
- Previous/next button clicks and keyboard arrow presses are buffered during an active explicit navigation sequence instead of being ignored. Queued inputs are replayed sequentially with accelerated follow-up motion, while direct rail selection, wheel input, drag, mode changes and Home/End clear stale queued navigation. Keyboard auto-repeat keeps only a short look-ahead buffer so holding a key remains continuous without leaving a long backlog after release.
- Fine-pointer mouse drag is rendered without CSS transform/opacity catch-up transitions. Pointer movement is coalesced to animation frames, pointer capture preserves the gesture outside card bounds, and recent movement samples determine release velocity. Fast mouse releases continue through a damped spring throw into the neighbouring card; slow releases retain distance-based settling. Touch input does not receive release inertia. Endpoint overscroll is shared by mouse and touch: a resisted visual pull is allowed just beyond the first/last index, pointer capture keeps that pull attached to the gesture, and the released overscroll position is handed directly into the finite endpoint wrap animation rather than snapping back to the endpoint first.
- Use `(hover: hover) and (pointer: fine)` for hover-driven List selection. Do not infer hover ability from viewport width alone. The treemap layout itself remains available on touch/coarse-pointer devices.
- Edge-hover auto navigation requires an actual mouse pointer event plus a fine hover-capable pointing device. It is disabled for touch input and when `prefers-reduced-motion` is active.
- Normal one-card moves, drag settling, edge-hover moves and endpoint wraps are rendered frame-by-frame from the live carousel position. The bottom rail thumb reads that same live position on every frame, with no independent `left` transition, so its timing/weight matches the cards exactly. Rotation is asymmetric: the outgoing active card ramps from flat to skew quickly through a short launch curve, while the incoming card uses the longer zero-slope landing curve and reaches `rotateY(0deg)` before its final centring travel. Surface darkness, shadow, blur, opacity, saturation, brightness, preview scale and refraction are derived continuously from the same position, including through and beyond the one-card neighbour boundary. Independent CSS transitions stay suspended during scripted motion so they cannot lag behind the frame renderer.
- Touch/pen List cards use a two-step interaction: first tap selects and expands a new region, second tap on the selected region navigates. Full-card native links remain in the DOM, keyboard activation is not converted into a two-step interaction, and all regions remain large pointer targets.
- Respect `prefers-reduced-motion` by suppressing long carousel/list transitions and the return animation.
- Keep the implementation dependency-free. Shared section navigation belongs in the site shell, while 3D carousel behaviour remains homepage-specific.

## Review questions

1. Does the one-featured-plus-two-stacked preview composition add enough project identity without turning the main section card into a dense dashboard?
2. Do the reduced-radius card surfaces and tighter shadows make the waiting sections read as cards without competing with the active section?
3. Do the always-visible left/right arrows, queued rapid-click/keyboard flicks and endpoint wrap sweep make the carousel feel continuous without implying duplicated cards?
4. Do the low-contrast refracted preview hints, surface darkness and shadows remain visually stable as cards cross the nearest-neighbour boundary during rapid continuous scrolling?
5. Does the name-only section strip feel like a reduced continuation of the homepage cards on collection and project pages?
6. Does the bottom rail thumb now feel physically coupled to the cards during slow first edge-flicks, faster repeats, drag settling and endpoint wrap sweeps?
7. Does the weighted treemap feel stable while still making the selected region clearly dominant, and are the base weights for Data, Games, Lab, Photography, Maps and About proportioned well?
8. Does the separated interaction geometry feel clear across laptop and desktop widths: grab only inside the rounded card, then a dead band, then edge-hover loading near the arrow/screen edge? Does the full-height line plus cursor-centred bulge read clearly without the old dust particles? With Auto Swipe enabled, does one 1.5-second step per edge entry feel deliberate, and is retreat plus re-entry obvious enough for another step?
9. Does desktop click-drag now feel directly attached to the pointer, and does a fast mouse release carry enough momentum to feel like throwing one card without overshooting?
10. At Home and About, does the logarithmic soft-wall pull feel heavy without appearing capped, and does the growing edge glow communicate pressure without becoming decorative noise?
11. On a 390px touch device, does the first-tap-expand / second-tap-open interaction feel obvious, and are compressed treemap labels still readable enough to target?
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
- Edge feedback retains the full-height line and pointer-following bulge but removes the particle field.
- Raised small-text floors and rail contrast, including dynamic overview typography, and expanded the mobile Overview hit region to 44px while retaining its 38px visual circle.
- Validation for this package is recorded in `docs/current-handoff.md`.
