# Current Handoff

Snapshot date: 2026-09-11

## Repository state supplied to ChatGPT

- Latest supplied source snapshot branch: `main`.
- Base commit: `b03044876f67df46cac05a160aeaf5854d64e828`.
- The supplied Project context snapshot records a clean working tree.
- This package layers only the current Formula Daily Options highlight refinement and UX/accessibility documentation update over that source and does not touch unrelated site projects or publication helpers.
- Cloudflare deployment state has not been independently verified from this ChatGPT session.

## Current product state

- South Australian Name Curve is published in LAB.
- Formula Daily is published as a GAMES prototype and remains in Stage 2 review work. Per-question Tips/score/display preferences now persist, while answer correctness, the complete five-question loop and daily puzzle behaviour remain deferred.
- Ascend is present as a GAMES prototype with the expanded Genesis implementation in the current `main` snapshot.
- Pulse of Adelaide remains blocked on a suitable public fuel source with confirmed reuse terms.

## Formula Daily review change prepared in this package

- Correct the Touch Mode deep-link highlight in Options so it no longer changes the row width. The temporary emphasis now targets only the `Touch Mode` text and switch track, with the normal switch-row geometry preserved.
- Add `docs/ux-accessibility-features.md`, a project-by-project UX/accessibility inventory intended to support future case-study/storyboard pages and ongoing review. The Formula Daily section consolidates the interaction and accessibility work recorded across the execution plan, current implementation and review history.
- Add the new document to `docs/index.md` and add a repository instruction requiring future material UX/accessibility changes to update the relevant project section.
- No Formula Daily TypeScript, scoring, touch behaviour, validation, puzzle content or physics logic changed in this package.

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

1. Apply this patch over `main` at `b03044876f67df46cac05a160aeaf5854d64e828` plus the reviewed Formula Daily patches already in the local working version.
2. Open the cluster Touch Mode troubleshooting link and confirm the Options panel keeps the same width as normal.
3. Confirm only the `Touch Mode` text and switch receive the temporary orange emphasis, with no orange box changing row geometry.
4. Close Options and confirm the highlight clears. Open Options normally and confirm no Touch Mode highlight appears.
5. Review `docs/ux-accessibility-features.md` as the new source inventory for the future Formula Daily project/case-study page.

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
