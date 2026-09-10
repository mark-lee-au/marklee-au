# Current Handoff

Snapshot date: 2026-09-10

## Repository state supplied to ChatGPT

- Latest supplied source snapshot branch: `main`.
- Base commit: `fc9c6962e333aaf23f02164d8bcdc92d967ad5f5`.
- The supplied working tree is recorded as clean.
- The snapshot contains the current Ascend Genesis expansion and the local archive/publication helpers.
- Cloudflare deployment state has not been independently verified from this ChatGPT session.

## Current product state

- South Australian Name Curve is published in LAB.
- Formula Daily is published as a GAMES prototype and remains in Stage 2 review work. Formula evaluation, the complete five-question loop, persistence and daily behaviour remain deferred.
- Ascend is present as a GAMES prototype with the expanded Genesis implementation in the current `main` snapshot.
- Pulse of Adelaide remains blocked on a suitable public fuel source with confirmed reuse terms.

## Formula Daily review change prepared in this package

- The chalkboard frame now uses layered CSS wood-grain bands, darker bevels and an inner frame groove instead of the previous flat brown border.
- The board surface is substantially blacker with restrained reflected highlights, vignette shading and fine chalkboard texture. The implementation uses CSS gradients only, so it adds no image asset or dependency.
- Four low-contrast teacher-style chalk notes are selected deterministically from a larger lesson pool each day. Their placement, angle and wording vary by the daily seed and remain behind the answer and movable labels.
- The chalkboard now has a stable base height. Answer wrapping no longer increases the board height during ordinary play.
- The loose-piece cluster is anchored independently of the answer row. When the answer grows into the cluster's occupied space, only the minimum clearance transform is applied to move the loose labels down.
- The board gains extra height only when that clearance would otherwise push the cluster past the usable bottom edge. It can shrink back to its base height when the extra space is no longer needed.
- The answer row no longer animates its height. Its wrapped formula block remains vertically centred with the same alignment on one or several lines, avoiding the previous wrap/un-wrap flicker.
- Existing bounded drag, edge sliding/fling behaviour, answer overlap insertion, grouped-function styling and hidden-state fixes remain unchanged.
- No formula evaluation, puzzle content, attempts, persistence, or daily-game progression logic changes are included.

## Local context archive utility

- `archive-project.bat` provides a double-click Windows launcher for project snapshots.
- `scripts/export-project-context.ps1` creates timestamped, branch/commit-labelled archives by default in `marklee-au-archives` beside the repository.
- Snapshots preserve relevant uncommitted files for ChatGPT review while excluding dependencies, Git metadata, generated output, secrets, local raw/intermediate data and prior archives.
- This workflow does not commit, push or publish anything.

## One-click publication helper

- `publish-project.bat` is the double-click Windows entry point and `scripts/publish-project.ps1` performs the guarded Git workflow.
- The helper shows current changes, asks for a commit message when needed, and asks for one explicit publication confirmation.
- It creates a project archive when the archive helper is installed, fetches `origin`, verifies branch ancestry, runs `npm run build`, stages non-ignored changes, checks staged whitespace, commits, fast-forwards local `main`, and pushes `origin/main`.
- The helper refuses divergent branch history and never force-pushes.
- A successful Git push does not independently prove that the externally configured Cloudflare deployment completed.

## Next action

1. Apply this cumulative Formula Daily review package to the repository root.
2. Run the site locally and compare the wood frame and darker board surface with the previous flat border.
3. Add and remove enough answer pieces to switch repeatedly between one and two lines. Confirm the answer content stays vertically centred and the board height does not pulse.
4. Keep adding pieces until the answer reaches the loose cluster. Confirm the cluster moves down only when needed and the board itself remains fixed until the cluster would otherwise hit the bottom edge.
5. Confirm the daily chalk lesson remains faint behind labels and does not compete with the playable pieces.
6. Recheck drag-to-edge, drag-to-answer, grouped functions, return-from-answer and reorder behaviour before expanding Formula Daily further.

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
