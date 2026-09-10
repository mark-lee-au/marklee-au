# Execution Plan 005: Formula Daily

Status: Stage 2 interaction prototype published as a prototype on 2026-09-09; Stage 3 has not started.

## Objective

Create a small daily browser game at the stable proposed route `/projects/formula-daily/`. Each day, every player receives the same five increasingly difficult spreadsheet-logic questions and finishes with a score out of five plus a spoiler-free share result.

The central question is: **Can a five-minute game make spreadsheet logic feel like a tactile daily puzzle rather than a lesson?**

The primary audience is a general puzzle player who can recognise a grid and simple arithmetic. Spreadsheet users are a secondary audience. The portfolio value is visible interaction design, TypeScript logic, structured content, state management, accessibility, responsive design, and testing.

Formula Daily is a published GAMES prototype with ongoing review work kept local until separately approved. GAMES is a dedicated top-level collection; LAB remains for data projects, visualisations, experiments, and work in progress. The stable slug is `formula-daily`.

## Product direction

### Smallest sensible MVP

The MVP is one complete, local-reviewable daily run:

- exactly five questions in the fixed Easy, Easy, Medium, Medium, Hard sequence;
- three mechanics: build a formula, predict an output, and complete a formula;
- a small spreadsheet-style grid for each question;
- a structured formula builder for build-formula questions, operated by click/tap and keyboard; optional pointer dragging may enhance desktop later but is not required for MVP;
- cell references, rectangular ranges, numeric/text criteria, and the initial function allowlist `SUM`, `SUMIF`, `AVERAGE`, `COUNT`, and `COUNTIF`;
- deterministic answer evaluation without `eval()` and without requiring one exact formula string;
- immediate submitted-answer feedback, one point per question, one submission in the finished game, progress from 1 to 5, final score, and spoiler-free share text;
- deterministic daily selection from a small, hand-authored static puzzle pack;
- local persistence for the current day's progress and completed result;
- responsive, keyboard-accessible interaction with visible focus and no drag-only action.

The first prototype uses one representative question and allows five non-validating submissions so the construction flow can be tested. Daily rotation, reset behaviour, persistence, sharing, and a small release puzzle pack wait until after the framework and evaluator are approved.

### Proposed game flow

1. A compact introduction shows the game number, five-question promise, and start/continue action.
2. The player sees one question at a time: difficulty, prompt, grid, and the interaction appropriate to its type.
3. The player constructs or selects an answer, reviews it, and explicitly submits it.
4. The game reveals correct/incorrect status and a short explanation, then advances. A submitted answer is final.
5. After question five, the result view shows the score, five outcome marks, a copy/share action, and the next reset time.
6. A same-day return restores either progress or the completed result.

Keep explanations short and optional enough that the experience remains a puzzle, not an Excel course.

### Explicitly deferred

- `FIND MISSING INPUT` and additional puzzle formats;
- `IF`, `FILTER`, `XLOOKUP`, functions beyond the approved initial five, and broad Excel compatibility;
- nested formulas in the first prototype, while preserving a dynamic canvas architecture that can add them;
- mandatory dragging, free-text formula entry, spreadsheet editing, arbitrary cell selection, and an Excel clone;
- accounts, cross-device sync, streaks, leaderboards, rankings, XP, currencies, hints economy, or backend services;
- a large archive, practice mode, puzzle editor, automated puzzle generation, and large content-production pipelines;
- localisation, advanced sharing imagery, analytics, notifications, and offline/PWA packaging;
- a new top-level Games taxonomy until its site-wide implications are separately approved.

## Technical approach

Keep the project inside the existing static Astro architecture. Use an Astro component for semantic game markup and project-specific TypeScript and CSS under `src/visualisations/formula-daily/`. A static project route should mount the component through the existing project visual slot. Hand-authored puzzle definitions can be TypeScript or compact JSON loaded only on this route. No database, Worker logic, framework island, global library, or new dependency is justified for the MVP.

Use a small explicit state machine such as `intro -> question -> feedback -> result`. Keep serialisable session state separate from rendered DOM. Persistence is deferred until the daily loop is approved. Puzzle definitions must not contain a canonical answer formula: they contain only the starting grid, permitted pieces, and expected output already presented to the player.

There is currently no repository persistence convention and no automated test runner. Before implementation, approve either a minimal test dependency for pure game logic or a dependency-free Node test approach compatible with the TypeScript build. The release still requires the repository's normal Astro build and focused browser accessibility checks.

### Formula builder and evaluator

Represent formulas as a small typed expression tree, not as mutable formula text:

```text
Expression
  Cell(reference)
  Range(start, end)
  Literal(value)
  Binary(operator, left, right)
  Function(name, arguments[])
```

The playing canvas is the target cell inside the sample spreadsheet. A puzzle supplies a shuffled cluster of function-openers such as `SUMIF(`, references, ranges, values, operators, commas, and standalone parentheses, including plausible unused pieces. Clicking or dragging a piece appends its token to the selected cell; clicking a placed piece returns it to the cluster. The sequence is rendered as familiar formula text and will later be parsed into the typed tree for validation.

No function structure is prefilled. Supplying punctuation as pieces permits nesting without requiring the UI to understand nested slots. Click/tap and keyboard remain complete alternatives to dragging. The cluster should feel physical and childlike: chalk-coloured tiles repel each other, regroup gently, and visually disconnect when selected, with a stationary reduced-motion presentation.

Evaluate the tree with a recursive interpreter over an immutable puzzle grid and the function allowlist. Validate references, ranges, types, arity, and a shallow depth/node limit before evaluation. Return explicit values or typed errors. Never execute generated JavaScript and never use `eval()` or `Function()`.

For build-formula puzzles, correctness is behavioural rather than textual. The engine parses the submitted expression into the typed tree, evaluates it against the starting grid using the allowlisted spreadsheet semantics, and compares the calculated value with the expected output. No expected formula string or canonical answer is shipped. Permitted pieces should avoid exposing the target as a trivial literal; stronger anti-cheat measures can be assessed only if they become necessary. Predict-output and complete-formula puzzles can use the same evaluator where practical.

Brief alternatives considered:

- Formula-string parsing is familiar but makes safe parsing, editing, error recovery, and nesting harder at the outset.
- A third-party spreadsheet engine offers wider compatibility but adds weight and behaviour the game does not need.
- The recommended typed tree plus allowlisted interpreter is small, testable, accessible, and deliberately limited.

### Conceptual puzzle model

Each hand-authored puzzle should contain:

- stable `id`, puzzle `type`, difficulty, prompt, and concise explanation;
- a bounded grid with typed cell values and optional display labels;
- interaction configuration: available pieces or multiple-choice options;
- an answer contract: expected option ID or evaluator verification cases;
- optional target cell/value and formula fragments needed by the chosen puzzle type;
- schema version and authoring validation metadata.

A future daily set contains a stable sequence number and exactly five ordered puzzle IDs whose difficulties are validated as Easy, Easy, Medium, Medium, Hard. Daily selection and reset policy are deliberately deferred while the framework is tested.

## Reviewable delivery stages

| Stage | Purpose | Likely files or areas | Complexity | Usage | Local review before approval |
| --- | --- | --- | --- | --- | --- |
| 1. Brief and direction | Agree scope, architecture, category, and decisions. | This execution plan; feature branch only. | Low | Low | Review this proposal; no application route exists. |
| 2. GAMES structure and interaction prototype | Add the durable GAMES collection and Formula Daily route. Build one sample spreadsheet and a dynamic, non-validating formula canvas supporting click/tap, keyboard, and optional dragging, with five test submissions. | Category schema/navigation/listing/docs; Formula Daily project entry; `src/visualisations/formula-daily/` Astro, TypeScript, and CSS. | Medium | Medium | Assemble the sample `SUMIF` formula locally on desktop or mobile and assess the grid, snapping model, function switching, and overall game identity. |
| 3. Formula engine and puzzle contract | Define the puzzle schema and restricted spreadsheet grammar; parse and evaluate submitted formulas for the initial five functions; add focused automated tests and connect real feedback to the sample puzzle. | Formula Daily model/parser/evaluator modules, puzzle fixture, tests, and plan. | High | Medium–High | Submit correct and incorrect equivalent formulas against the sample grid and inspect deterministic results and error messages. |
| 4. Daily loop and review iteration | Apply agreed interaction revisions, add deterministic daily selection, resilient local persistence, spoiler-free sharing, and a small review puzzle pack. | Formula Daily modules and puzzle data; plan review log; tests. | Medium | Medium | Resume a partial game, complete it, reload the result, copy share text, and verify a controlled day change. |
| 5. Release candidate | Finish content, accessibility, error states, payload checks, responsive QA, project copy/preview, full build, and release checklists. | Formula Daily project files, preview asset, execution plan, project/release documentation. | High | Medium–High | Review the complete unpublished local candidate at required widths with QA evidence and final diff. |
| 6. Publication | Only after separate explicit approval: stage authorised files, commit/merge/push as agreed, verify external deployment, and update status. | Git and status documentation; no unplanned product work. | Low | Low | Verify the live route and deployment record. |

Each stage starts and ends with measured usage when available and stops for approval. If a stage approaches either repository ceiling, stop at the next safe review point and split the remainder.

## Decisions and risks requiring approval

1. **Resolved — site placement:** GAMES is a new top-level category. Games do not use LAB, regardless of maturity.
2. **Resolved — initial functions:** `SUM`, `SUMIF`, `AVERAGE`, `COUNT`, and `COUNTIF`.
3. **Resolved — daily boundary:** deferred until the framework and core play are established.
4. **Resolved for testing — attempts:** the Stage 2 prototype permits five submissions; the finished game targets one.
5. **Resolved — validation direction:** parse and evaluate the player's permitted expression against the puzzle grid and expected output; do not bundle one expected formula answer.
6. **Open — testing:** select a lightweight pure-logic test setup during Stage 3. Evaluator behaviour merits automated tests; the current repository has no runner.
7. **Open — content burden:** daily play requires a maintained puzzle supply. Release scope should set a modest pack and documented fallback before promising an indefinite new puzzle every day.
8. **Open — accessibility density:** structured slots can become visually and cognitively dense on phones. Review sequential slot filling and large controls before expanding drag behaviour.
9. **Open — spreadsheet semantics:** define a small game-specific rule set for coercion, errors, blank cells, ranges, and function behaviour rather than claiming complete Excel or Google Sheets compatibility.

## Likely implementation boundaries

- `src/content/projects/formula-daily.md`: local project entry with `category: games`, `status: prototype`, and `featured: false` during review.
- `src/pages/projects/[slug].astro`: minimal project-component mapping under the current routing pattern, unless a small registry is agreed first.
- `src/visualisations/formula-daily/`: project component, styles, state, expression model, evaluator, builder, puzzle schema/data, persistence, and share formatting, split into small modules.
- `src/assets/`: preview artwork only at release-candidate stage.
- `docs/exec-plans/active/005-formula-daily.md`: decisions, stage handoffs, usage, and review log.

Do not place this game's definitions under `public/data/` unless a later measured requirement favours separately fetched public JSON. A small route-only TypeScript/JSON bundle is simpler for MVP.

## Release boundary

Stage 2 authorises the local GAMES structure and non-validating Formula Daily interaction prototype. It does not authorise formula evaluation, a full five-question game, dependencies, commits, pushes, deployment, publication, or automatic progression to Stage 3.

## Stage 1 record

- Branch created: `codex/formula-daily` from the current working tree; pre-existing uncommitted user changes were preserved.
- Application code changed: none.
- Dependencies installed: none.
- Build or tests run: none, because this stage changes documentation only and explicitly excludes exhaustive validation.
- Starting usage: rolling five-hour 41% used; weekly 6% used.
- Ending usage: rolling five-hour 46% used; weekly 7% used.
- Measured Stage 1 change: +5 percentage points rolling five-hour; +1 percentage point weekly, below both stage ceilings.

## Stage 2 record

- Direction approved and revised: GAMES category, five initial functions, dynamic canvas, five prototype submissions, daily behaviour deferred, evaluator rather than stored formula answers.
- Starting usage: rolling five-hour 47% used; weekly 7% used.
- Ending usage: rolling five-hour 56% used; weekly 9% used.
- Measured Stage 2 change: +9 percentage points rolling five-hour; +2 percentage points weekly, below both stage ceilings.
- Local routes verified: `/`, `/games/`, `/lab/`, and `/projects/formula-daily/` returned HTTP 200.
- Validation: `npm run build` completed successfully with 11 static pages; `git diff --check` found no whitespace errors (line-ending notices only).
- Formula evaluation, answer feedback, persistence, daily selection, and a complete five-question run remain deferred.

### Stage 2 review iteration — spreadsheet canvas

- User direction: make the target spreadsheet cell the canvas; remove the separate structured builder and most surrounding game copy.
- Mixed formula pieces now include useful tokens, decoys, commas, standalone parentheses, and function-openers rather than prefilled function slots.
- Visual direction: irregular childlike chalk labels on a blackboard, with green functions, red ranges/references, blue values, and neutral punctuation.
- Interaction: select D2, then click or custom-drag pieces into it; placed pieces can be returned to the cluster. The cluster uses lightweight collision, attraction, and elastic-line effects and pauses when off-screen. Reduced-motion users receive a stationary arrangement.
- Formula checking remains deferred.
- Starting usage: rolling five-hour 1% used; weekly 9% used.
- Ending usage: rolling five-hour 10% used; weekly 11% used.
- Measured review change: +9 percentage points rolling five-hour; +2 percentage points weekly, below both stage ceilings.
- Validation: `npm run build` completed successfully with 11 static pages; the Formula Daily local route returned HTTP 200; `git diff --check` found no whitespace errors (line-ending notices only).

### Stage 2 review iteration — stable D2 preview

- Reported issue: replacing the empty-cell placeholder with the hover preview removed a line of content, allowing the table row and page to change height repeatedly.
- Revision: the placeholder is overlaid inside D2 and the formula/preview container has a fixed internal height, keeping empty, preview, and populated states geometrically identical.
- Starting usage: rolling five-hour 28% used; weekly 13% used.
- Ending usage: rolling five-hour 30% used; weekly 14% used.
- Measured review change: +2 percentage points rolling five-hour; +1 percentage point weekly, below both stage ceilings.
- Validation: `npm run build` completed successfully with 11 static pages; `git diff --check` found no whitespace errors (line-ending notices only).

### Stage 2 review iteration — drag and placement affordances

- Reported issue: drops could be lost after a pointer left the cluster because movement and release handling belonged to the cluster element and relied on hit-testing beneath the moving piece.
- Revision: pointer movement/release is tracked at document level and D2 accepts the piece when the release coordinates fall inside its bounds.
- Hover and keyboard focus preview the candidate as a grey outline in the next formula position without changing the formula.
- Available pieces lift and glow with a small `+`; placed pieces show a `−` and remain clickable to return them to the cluster.
- Starting usage: rolling five-hour 13% used; weekly 11% used.
- Ending usage: rolling five-hour 17% used; weekly 12% used.
- Measured review change: +4 percentage points rolling five-hour; +1 percentage point weekly, below both stage ceilings.
- Validation: `npm run build` completed successfully with 11 static pages; the Formula Daily local route returned HTTP 200; `git diff --check` found no whitespace errors (line-ending notices only).

## Prototype publication record

- The user reviewed the local prototype and explicitly approved saving and publishing it on 2026-09-09.
- Commit `60aeae3` was fast-forwarded to `main` and pushed to GitHub.
- The existing externally managed Cloudflare deployment served `/games/` and `/projects/formula-daily/` successfully; no Cloudflare, DNS, or email configuration was changed.
- The project remains labelled `prototype`. Formula evaluation, a complete five-question loop, persistence, and daily behaviour remain future stages requiring separate approval.
- Publication-stage usage: rolling five-hour 34% to 39%; weekly 14% to 15%, below both stage ceilings.

### Stage 2 review iteration — mobile spreadsheet and formula strip

- Reported issue: the sample spreadsheet retained a 690px minimum width because the wide interactive formula cell was embedded in column D, forcing horizontal scrolling on phones.
- Revision: the data grid now fits its container at narrow widths, while D1 is a separate full-width interactive formula strip beneath the spreadsheet with its clue alongside it on desktop and below it on mobile.
- Mobile chalk text uses a legible rounded sans-serif fallback while borders, colour, texture, and irregular shapes preserve the blackboard identity.
- Elastic clustering remains active, but its connector SVG is transparent so players see the pieces regroup without dashed lines.
- Starting usage: rolling five-hour 49% used; weekly 17% used.
- Ending usage: rolling five-hour 58% used; weekly 18% used.
- Measured review change: +9 percentage points rolling five-hour; +1 percentage point weekly, below both stage ceilings.
- Validation: `npm run build` completed successfully with 11 static pages; the local Formula Daily route returned HTTP 200; focused visual inspection at 360px confirmed the spreadsheet fits without horizontal scrolling and the label cluster has no visible connector lines; `git diff --check` found no whitespace errors (line-ending notices only).

### Stage 2 review iteration — bidirectional pointer interactions

- Reported issue: setting a cluster piece to ignore pointer events during pointer-down could prevent a normal tap from producing its later click event.
- Revision: pointer-up now distinguishes taps from drags directly. Click/tap and keyboard activation add available pieces; clicking placed pieces removes them; pieces can be dragged into the answer or dragged from the answer back into the cluster.
- The answer row now reads `Total units sold in East =` and no longer presents the prototype as a D1-specific answer type.
- Starting usage: rolling five-hour 60% used; weekly 18% used.
- Ending usage: rolling five-hour 67% used; weekly 20% used.
- Measured review change: +7 percentage points rolling five-hour; +2 percentage points weekly, below both stage ceilings.
- Validation: `npm run build` completed successfully with 11 static pages; the local route returned HTTP 200; focused browser checks passed for desktop click add/remove, desktop drag into the answer, drag from the answer back to the cluster, and 360px tap add/remove; `git diff --check` found no whitespace errors (line-ending notices only).

### Stage 2 review iteration — wrapping answer reordering

- Placed pieces can now be reordered inside the answer. A single grey insertion preview moves only when the pointer crosses a neighbouring token midpoint; dropping in the answer commits the order, dropping in the cluster removes the piece, and dropping elsewhere restores its original position.
- The answer canvas wraps and grows vertically instead of scrolling horizontally, including multi-row answers on narrow screens.
- Function-openers remain one draggable/clickable token but render as a grouped pair: a green function name and neutral opening parenthesis inside a subtle dashed group border. Standalone opening-parenthesis pieces remain unchanged and available for nesting.
- Starting usage: rolling five-hour 70% used; weekly 20% used.
- Ending usage: rolling five-hour 81% used; weekly 22% used.
- Measured review change: +11 percentage points rolling five-hour; +2 percentage points weekly, below both stage ceilings.
- Validation: `npm run build` completed successfully with 11 static pages; the local route returned HTTP 200; browser checks confirmed reorder from first to last, removal by dragging to the cluster, grouped function styling, and a 360px answer expanding to five rows with no horizontal overflow; `git diff --check` found no whitespace errors (line-ending notices only).

### Stage 2 review iteration — stable floating cluster clearance

- Reported issue: intrinsic answer wrapping moved the label cluster in normal document flow, making the page jump whenever the answer gained or lost a row.
- Revision: the answer grows independently over a fixed layout anchor. The label cluster remains at its original position until the answer reaches the topmost available label, then receives only the smooth clearance needed to preserve a 12px gap. Matching bottom space keeps the controls below the cluster correctly positioned.
- Reduced-motion users receive the same collision clearance without animation.
- Starting usage: rolling five-hour 85% used; weekly 22% used.
- Ending usage: rolling five-hour 92% used; weekly 23% used.
- Measured review change: +7 percentage points rolling five-hour; +1 percentage point weekly, below both stage ceilings.
- Validation: `npm run build` completed successfully with 11 static pages; the local route returned HTTP 200; a focused 360px browser check confirmed that the first wrap left the cluster anchored and later contact applied 12px of clearance while retaining approximately 12px between the answer and topmost label; `git diff --check` found no whitespace errors (line-ending notices only).

### Stage 2 review iteration — animated answer preview

- Reported issue: preview pieces of different widths could change the answer's wrapped height abruptly, and the preview disappeared when a hovered cluster piece became a drag.
- Revision: the answer now transitions between measured row heights and clips the preview during that short transition so the green cell boundary reveals or covers it cleanly. Reduced-motion users receive the final height immediately.
- A cluster piece now keeps its preview throughout pointer-down and dragging. Outside the answer it previews at the end; inside the answer it uses the same row and token-midpoint insertion logic as reordering a placed piece, and a successful drop inserts at that indicated position.
- Starting usage: rolling five-hour 95% used; weekly 24% used.
- Ending usage: rolling five-hour 98% used; weekly 24% used.
- Measured review change: +3 percentage points rolling five-hour; no measured weekly change, below both stage ceilings.
- Validation: `npm run build` completed successfully with 11 static pages; `git diff --check` found no whitespace errors (line-ending notices only).

### Stage 2 review iteration: bounded chalkboard canvas and edge play

- User direction: treat the answer and loose formula pieces as one physical chalkboard play area, with the frame acting as a real drag boundary rather than decoration only.
- The answer strip and floating cluster now share a `formula-canvas` frame. Source pieces and placed-token drag ghosts are clamped inside its inner edge while the pointer or finger may continue beyond it.
- Dragging preserves the point where the player grabbed a piece. When the pointer moves outside the canvas, the piece follows the nearest frame edge and gains a small edge-dependent tilt, so it slides around the perimeter instead of leaving the board.
- Normal-motion dragging uses a lightweight spring follow with a capped catch-up speed. A large pointer jump, including leaving the browser and re-entering on another side when the browser resumes pointer events, makes the piece travel quickly across the board rather than teleport directly. Existing collision forces displace loose pieces as the dragged piece crosses them; placed-token drag ghosts also push loose pieces while crossing the cluster.
- Drag acceptance now follows the physical piece rather than only the pointer coordinates. A dragged source piece shows the answer insertion preview only after the piece overlaps the answer area, and releasing it there uses the existing insertion logic. This supersedes the earlier review behaviour that kept a drag preview visible while the piece was elsewhere on the board. Hover and keyboard-focus preview behaviour remains unchanged.
- Pointer capture is used as a best-effort browser primitive for keeping an active drag connected after the pointer leaves the piece itself. Reduced-motion mode keeps the boundary and drop logic but moves pieces directly without spring/fling animation.
- Validation in the ChatGPT workspace: the project-specific TypeScript passed a strict DOM TypeScript compile; the Formula Daily CSS parsed with zero stylesheet errors; the emitted JavaScript passed `node --check`. A full Astro build was not run because the supplied context snapshot excludes dependencies and dependency installation did not complete in the sandbox.


### Stage 2 review iteration: wood-frame board and stable answer layout

- User direction: replace the flat brown chalkboard frame with a more convincing wooden frame, darken and lightly polish the board surface, add faint rotating teacher-style lesson notes, and stop answer wrapping from resizing the whole play board during normal use.
- The frame now uses layered CSS wood-grain gradients, darker bevels and an inner groove. The chalkboard surface uses near-black layered gradients, subtle reflected highlights, vignette shading and fine texture with no raster asset or dependency.
- A deterministic daily seed selects four notes from a larger classroom-note pool. Notes use faint chalk colouring, handwritten typography, irregular placement and rotation, and stay beneath the interactive labels.
- The canvas now has a fixed responsive base height. The loose cluster is absolutely anchored to the board instead of following the answer in normal document flow.
- Answer growth triggers only the existing clearance calculation. The cluster moves down when its highest available label would collide with the answer, while the board remains unchanged. The board receives temporary extra height only if the shifted cluster would exceed the usable bottom edge.
- The answer cell no longer transitions its height. The wrapped formula container keeps the same vertical centring and row alignment before and after line wraps, removing the visible wrap/un-wrap flicker.
- Existing edge-constrained dragging, spring/fling motion, overlap-based answer insertion, collision displacement and grouped-function behaviour are retained.
- Validation in the ChatGPT workspace: Formula Daily TypeScript passed strict DOM TypeScript compilation and the stylesheet parsed with zero CSS syntax errors. `npm run build` was attempted but could not run because the supplied sandbox dependency folder does not contain the Astro executable. Browser rendering was also attempted, but sandbox browser policy blocked local and `data:` preview navigation, so visual review remains a local-user check.

### Stage 2 review iteration — board-notes initializer fix

- Reported issue: after the chalkboard wood-frame revision, all loose pieces sat at the canvas origin and none could be clicked or dragged.
- Root cause: the revised script required a decorative `data-board-notes` element, but the shipped `FormulaDaily.astro` package did not include it, so the initializer exited before binding any interaction logic.
- Revision: restored the chalk-note layer in `FormulaDaily.astro` and made the script continue safely even if that optional decorative node is missing in a future partial patch.
- Validation: focused strict TypeScript compile passed; static selector/initializer checks passed. Full Astro build was not run because dependencies are not installed in the supplied snapshot and `npm ci` timed out in the sandbox.

### Stage 2 review iteration — token and chalk-note polish

- Removed the unintended internal dashed border from standard loose labels. The dashed border remains only as the outer grouping treatment for function-openers.
- Added a quieter hover/focus response to labels already placed in the answer, using a smaller glow and lift than the loose-piece hover state.
- Background lesson notes now use deterministic pastel chalk colours while keeping the existing subdued opacity so they remain secondary to the game pieces.
- Interaction and formula behaviour are unchanged.
- Validation: focused strict TypeScript compile passed and the Formula Daily stylesheet parsed with zero CSS syntax errors.

### Stage 2 review iteration — placed drag feedback and pastel chalk legibility

- Reported issue: the softer hover glow on answer tokens disappeared as soon as a placed token began dragging, and the daily lesson-note hues read too close to grey on the dark board.
- Revision: the placed-token drag ghost now carries the same low-key colour glow throughout the drag. Lesson notes retain their previous opacity hierarchy but use brighter pastel source colours, modest saturation/brightness, and a small same-colour halo to improve hue recognition without competing with playable labels.
- Formula and drag/drop behaviour are unchanged.
- Validation: focused strict TypeScript compile passed; CSS brace balance and ZIP integrity checked.


### Stage 2 review iteration — placed token size and release position

- Reported issue: a token dragged out of the answer stayed at the smaller answer-token size and, when released into the cluster, reappeared at its previous stored cluster coordinates with a bounce rather than where the player released it.
- Revision: placed-token drag ghosts now scale quickly between answer and loose-piece sizes according to their answer-boundary state. A small hysteresis band prevents size flicker when hovering around the boundary.
- Revision: loose-piece dimensions are measured from the hidden source element at drag start so the target size remains current after responsive changes.
- Revision: cluster drops now preserve the player's release position. If answer shrinkage moves the floating cluster, the fixed drag ghost holds its screen position through that transition before handing off to the real loose piece at the matching field-relative coordinates.
- Revision: returned pieces start with zero velocity instead of the previous upward return impulse; normal cluster physics then resume from the dropped location.
- Validation: focused strict TypeScript compile passed; CSS brace validation passed. Full Astro build not run because the supplied snapshot does not include an installed dependency tree.

### Stage 2 review iteration — suppress canvas text selection

- Reported issue: rapid label clicking and double-clicking could select chalkboard text, which made fast play feel like normal document interaction.
- Revision: the Formula Daily chalkboard canvas now disables user text selection while leaving text outside the game selectable. No drag, click, touch, or formula behaviour changed.
- Validation: CSS structure check and package ZIP integrity check.

### Stage 2 review prototype — Sample Data popout

- Request: remove the permanently visible sample spreadsheet and make it available from a chalk-style `Sample Data` control in the top-right of the board, with a phone-friendly popout for review.
- Prototype: the spreadsheet now lives in a native modal `<dialog>` with a chalkboard treatment, explicit close control, backdrop dismissal, Escape support, and focus return. The old inline sheet is removed.
- Layout: the answer row and loose cluster are shifted down to reserve a stable control area at the top of the board; the narrow-screen board receives a small base-height increase rather than allowing the new control to overlap game pieces.
- Responsive check: isolated Chromium rendering at 390px and 360px showed the dialog and spreadsheet fitting without horizontal overflow. Desktop was checked at 1280px.
- Interaction check: the cumulative Formula Daily script initialized without runtime errors in the isolated harness, click-to-place still worked, and the dialog opened/closed correctly.
- This remains a review prototype. No formula evaluation, puzzle content, attempt rules, persistence, or drag physics were changed.

### Stage 2 review prototype — persistent Sample Data reference sheet

- User feedback: the modal spreadsheet prevented the player from seeing the reference while constructing the formula, which worked against the intended classroom-test feel.
- Revision: Sample Data is now a non-modal disclosure sheet that opens inside the chalkboard and remains visible until explicitly closed. The rest of the game stays interactive while it is open.
- Layout: opening the reference reserves board space and shifts the answer plus loose-piece field down together instead of covering them. Desktop uses a compact right-aligned sheet; narrow screens use the board width with reduced table spacing.
- Interaction: the Sample Data button exposes `aria-expanded` and `aria-controls`; the closed sheet is inert and hidden from accessibility APIs. Escape and the internal close button close it. Outside interaction does not dismiss it accidentally.
- Validation: focused strict TypeScript compilation passed; CSS parsed without syntax errors; isolated Chromium checks at 1280px and 390px confirmed open/close state, no horizontal overflow, positive clearance between reference/answer/cluster, and click-to-place continuing while the sheet remained open.
- This is a review prototype only. No formula evaluation, question generation, scoring, persistence or daily puzzle logic changed.

### Stage 2 review prototype — teacher-written Sample Data disclosure

- User feedback: the persistent reference sheet solved the modal blocking problem, but still looked like a UI card placed over the blackboard rather than information a teacher had written for a classroom test.
- Revision: `Build the formula.` moved from the outer project header into the top-left of the wooden chalkboard. The attempt counter remains visible at the opposite side of the board header.
- Revision: the top-right `Sample Data` opener and separate `×` close control were replaced by one centred disclosure control. Its chalk label remains visible in both states and a small chevron points up while open and down while collapsed.
- Revision: Sample Data is open by default because it is required problem context. The script reads the initial `aria-expanded` state from markup instead of forcing the reference closed at startup. Escape still collapses it and returns focus to the disclosure control.
- Revision: the reference sheet no longer has a panel border, filled card background, header chrome or drop shadow. The table is written directly onto the board with the same chalk-family typography used by the game. Only internal row/column separators are drawn, using faint dashed chalk lines with slight opacity variation; there is no enclosing table border.
- Revision: row numbers and column letters use subdued pastel chalk colours to improve the handwritten spreadsheet feel without competing with the playable labels. Header cells remain legible but no longer use spreadsheet-style filled backgrounds.
- Layout: desktop reserves 214px while the reference is open; narrow screens reserve 186px. The answer and cluster continue to move as one content block below the disclosure. Closing the reference releases that space rather than leaving an empty gap.
- Accessibility: the disclosure uses `aria-expanded` and `aria-controls`; the collapsed table is `aria-hidden` and inert. The single control receives a dynamic accessible label (`Collapse sample data` / `Expand sample data`).
- Validation: focused strict TypeScript compilation passed. An isolated browser harness using the cumulative Formula Daily script reported no runtime errors at 1280px or 390px. Initial state was open, collapse/reopen state stayed synchronized across ARIA/data/inert attributes, horizontal overflow was zero, and a formula piece could still be placed while Sample Data was open.

### Stage 2 review prototype — compact responsive cluster and in-board actions

- User feedback: the chalkboard still reserved too much empty space around the loose pieces, the controls sat outside the answer/cluster relationship, the sample table did not follow text-versus-number alignment conventions, and answer growth needed to continue disturbing the loose labels.
- Revision: the loose-piece field now packs visible labels into measured rows using their actual rendered widths. The cluster height is derived from those packed positions instead of a fixed desktop/mobile height. Width changes trigger a repack, including narrow-screen layouts.
- Revision: each loose piece now has a responsive home position. Ambient physics attracts pieces back toward their packed or user-drop home rather than pulling everything toward the cluster centre. Collision and small wandering motion remain, and answer-height growth adds a brief disturbance impulse.
- Revision: the action row moved inside the board immediately below the answer and above the cluster. Because it is in normal flow, it follows answer wrapping without custom offset math.
- Revision: the answer uses a rounded green chalk border with a faint inner dashed trace. Sample Data text fields and headers align left, while numeric fields and numeric headers align right; spreadsheet coordinate markers remain centred.
- Responsive check: isolated Chromium at 390px reported no initial label overlaps and no horizontal page overflow. Desktop at 1280px also had no initial overlaps. Resizing a desktop viewport caused a full cluster repack, and adding enough answer tokens to wrap moved the actions and cluster downward while the remaining labels visibly changed position from the disturbance impulse.
- Validation: focused strict TypeScript compilation passed; CSS brace structure passed; isolated browser runtime reported no errors. Full Astro build was not available because dependencies are excluded from the supplied context snapshot.

### Stage 2 review iteration — animated wrapping and overlap-safe cluster

- User feedback: answer wrapping had regressed to an instantaneous height jump, causing visible flicker when rapidly previewing pieces of different widths. Loose pieces could also overlap after cluster movement or return interactions.
- Revision: the answer cell again transitions between measured pixel heights. The transition can be retargeted while already running, so rapid preview changes expand or contract from the current intermediate height rather than snapping between one and two rows.
- Revision: cluster disturbance is fired once from the answer-height target change. The answer `ResizeObserver` now handles layout follow-up only and does not repeatedly add impulses while the CSS height transition is progressing.
- Revision: the responsive pack uses 10px minimum horizontal spacing and 12px row spacing, which kept the layout compact in browser testing while preventing initial visual intersections from the labels' small rotations.
- Revision: settled loose-piece motion now rejects candidate positions that would intersect another settled label. The old pairwise velocity collision loop was removed because its collision buffer could amplify movement and create temporary piles on narrow screens. Drag-body push behaviour remains separate.
- Revision: return/drop settlement preserves the released token as an anchor, then moves only conflicting loose pieces to the nearest free board position. Search can extend downward, and cluster height is based on actual occupied positions, so extra rows create space instead of stacking labels.
- Validation: focused strict TypeScript compilation and JavaScript syntax check passed. Isolated Chromium tests at 1280px and 390px reported zero initial overlaps, zero overlaps after clearing/returning placed labels, successful desktop → mobile → desktop repacking, no horizontal overflow, and a measured answer transition from 66px toward 86px across intermediate frames before settling.

### Stage 2 review iteration — restore cluster life without overlaps

- Reported regression: the previous no-overlap implementation blocked candidate movements instead of resolving collisions, which removed the visible bumping and ambient movement from the loose pieces.
- Revision: restored pairwise collision impulses and added a post-movement separation pass. Pieces can now push and disturb each other while the resolver prevents them from finishing a frame overlapped. Vertical cluster space continues to expand from actual piece positions when collisions require another row.
- Answer wrapping now keeps the entire formula block vertically centred for one or multiple rows, with extra symmetrical breathing room inside the animated answer height.
- Validation: focused strict TypeScript compile passed; CSS structure check passed; ZIP integrity check passed. Full Astro build not run because installed dependencies are absent from the supplied snapshot.

### Stage 2 review iteration — hover pinning and bounded cluster homes

- User feedback: dragged loose pieces could establish distant permanent homes and grow the board downward, while preview-induced answer growth moved the currently hovered label away from the pointer and caused a repeating hover/unhover height flicker.
- Revision: loose pieces retain their responsive packed home after manual movement and return drops. They can still be released where the player places them, but spring back toward the cluster instead of remaining isolated.
- Revision: cluster physics now clamps on all four sides and cluster height is derived from packed home rows plus a small motion allowance, not transient physics positions. Only layout changes such as answer growth or responsive repacking can increase the board footprint.
- Revision: pointer-hovered loose pieces are pinned to their viewport position while the answer preview animates. The pinned piece is excluded from ambient motion and answer disturbance and acts as an immovable collision body, while surrounding pieces can still be bumped around it. Hover release restores normal attraction.
- Validation: focused strict TypeScript compile plus isolated Chromium checks. The hover preview remained active through answer-height animation, the hovered piece stayed effectively fixed in viewport space, cluster height stayed constant after a bottom-edge drag, and a displaced label returned toward its packed home. Full Astro build unavailable in the supplied dependency-free snapshot.

### Stage 2 review iteration — dynamic neighbour cluster physics

- User feedback: fixed per-piece home coordinates made returned labels force themselves back toward one original slot. When another label blocked that path, the two pieces could vibrate against each other. The user preferred the earlier local-neighbour feel and requested the neighbour strings be visible again while tuning.
- Revision: individual home-position attraction was removed from ambient movement. Every loose piece now recalculates its nearest active neighbour on each active animation frame and receives a damped spring pull only when the edge-to-edge gap exceeds the preferred cluster spacing.
- Revision: a weak collective gravity term compares the live cluster centroid with the centroid of the current responsive packed layout. This returns an isolated or displaced group toward the natural cluster area without assigning any individual label a fixed destination.
- Revision: sinusoidal perpetual wandering was removed. Damping, attraction dead zones, velocity sleep thresholds and conditional `requestAnimationFrame` continuation let the physics settle and stop until another interaction wakes it.
- Revision: collision bounds include each piece's small rotation, and collision resolution now keeps the animation alive until separation completes. This preserves visible bumping while preventing the residual sub-pixel overlaps seen on narrow screens.
- Debug view: nearest-neighbour SVG strings are temporarily visible at restrained chalk-green opacity. The lines are pointer-transparent and remain behind the labels.
- Validation: focused strict TypeScript compile passed. Isolated Chromium checks at 1280px and 390px reported zero label overlaps, zero horizontal overflow and no runtime errors. The desktop debug graph rendered 20 neighbour links on the initial 24-piece cluster.

### Stage 2 review iteration — stable hover activation boundary

- User feedback: resting the pointer on a loose label border could repeatedly enter and leave hover as the active visual treatment/layout compensation altered the live button hit boundary.
- Revision: hover activation now captures a fixed viewport hit rectangle when the piece becomes active, with 5px of invisible tolerance. The label can glow, be pinned, or compensate for answer-layout movement without changing that interaction boundary.
- Revision: loose-piece glow/plus styling is driven by the existing explicit `data-preview` state (plus keyboard focus), not raw CSS `:hover`. `pointerout` is ignored while the pointer remains inside the captured activation rectangle, and document pointer movement releases the preview after the pointer genuinely leaves it.
- Validation: focused strict TypeScript compilation passed; CSS structure passed. Isolated Chromium held the hover preview active for 40/40 samples during answer-height animation with zero state changes; 3px beyond the visual edge remained active while 8px beyond released as expected; no page errors occurred.

### Stage 2 review iteration — live-style loose-label physics reference

- User supplied the older live Formula Daily TypeScript and requested that only its movement feel be reintroduced into the current prototype.
- Reference behaviour retained from the live build: collision-driven velocity transfer, `.035` collision force and `.91` frame damping. The current prototype does not restore the live build's perpetual sinusoidal wander because the user specifically raised concern about motion continuing indefinitely.
- Current responsive packing is now only the starting arrangement. Individual pieces no longer seek stored packed coordinates after being moved.
- A displaced piece temporarily seeks cohesion using its nearest active neighbour recalculated every frame, blended with a small pull toward the live cluster centroid. This lets neighbour relationships change dynamically as pieces move.
- Collision participants and pieces pushed by answer-token movement can re-enter seeking state. Seeking ends once local spacing is restored, then velocity damping and the sleep threshold allow the system to stop.
- Physics integration is split into three short movement steps and a positional-only separation pass so collision bounce is retained without a second velocity impulse creating vibration.
- The initial idle cluster does not start physics merely because the page becomes visible. Debug neighbour connector lines remain visible during tuning.
- No non-movement Formula Daily behaviour was intentionally changed.
- Validation: focused strict TypeScript compile passed. Isolated Chromium at desktop and 390px mobile reported zero runtime errors, zero oriented-rectangle overlaps before and after a focused drag interaction, no horizontal overflow, 20 neighbour links and stable hover positioning. A drag through the cluster displaced multiple neighbours, confirming the live-style propagation effect.

### Stage 2 review iteration - restore live-style centre gravity

- User feedback: the previous neighbour-seeking implementation did not match the older live build. Labels could stop returning toward the cluster too early, hover behaviour appeared inconsistent around overlaps, and physical overlaps could remain visible.
- Review of the user-supplied live TypeScript showed that its nearest-neighbour search is used for connector lines, not for movement attraction. The movement feel comes from weak centre gravity on every free label, small sinusoidal drift, collision impulses, `.91` damping, and boundary clamping.
- Revision: removed the added per-piece `seeking` state and nearest-neighbour return spring. The current prototype now uses the live force values for centre pull (`.0007`), organic drift (`.004`), collision impulse (`.035`) and damping (`.91`) while preserving the current drag boundaries and layout.
- Finite-motion adaptation: user or layout interaction supplies temporary cluster energy; it decays at `.982` per frame. Collision propagation does not refresh that energy. Once energy and residual velocity fall below the sleep threshold and no overlap remains, the animation loop stops. This keeps the live glide/bounce feel without perpetual domino motion.
- Collision padding is 10px and a positional-only separation pass prevents labels from remaining overlapped without adding another bounce impulse.
- No CSS or Astro files changed in this iteration. Existing hover locking, answer wrapping, Sample Data and formula interactions remain unchanged.
- Validation: focused strict TypeScript compilation passed; emitted JavaScript passed syntax checking; an abstract force simulation settled without overlap. Full Astro/browser validation was not available in the supplied dependency-free sandbox.

### Stage 2 review correction — direct live physics transplant

- User supplied the live Formula Daily `.ts`, `.css` and `.astro` files after the previous two physics recreations failed to match the live movement.
- The supplied live TypeScript was treated as the source of truth for loose-label movement. Its movement loop uses continuous weak centre gravity, small sinusoidal drift, pairwise collision velocity transfer, `.91` damping and simple boundary clamping. Its nearest-neighbour search drives connector lines rather than attraction.
- Revision: the current prototype now runs those same movement forces and collision equations directly for loose pieces. Removed active use of the added finite-energy gate, speed cap, sleep logic, substep positional separation and overlap resolver that changed the collision outcome. This restores the live behaviour where pieces can temporarily bunch while dragged, then slide/bounce around the moving piece rather than being snapped to a separated side.
- Current features outside loose-label movement remain in place. Hover pinning remains as a narrow exception so answer-wrap animation cannot move the currently hovered piece away from the pointer. The hover anchor itself was corrected so entering hover does not move a rotated label.
- No CSS or Astro file changed in this correction.
- Validation: focused strict TypeScript compile passed; generated JavaScript passed `node --check`. Local Chromium runtime validation was blocked by the sandbox navigation policy.

### Stage 2 review iteration — extra vertical breathing room

- Reported issue: with the restored live-style centre gravity, dragging a label through the middle can compress neighbours against the top/bottom bounds because the compact responsive cluster leaves little vertical escape room.
- Prototype response: keep the restored movement equations untouched and increase only the cluster field's vertical reserve. The packer now adds a symmetric breathing inset derived from available label count and row count, bounded to avoid excessive whitespace.
- The additional room is part of the cluster's normal responsive size, so centre seeking, collision impulses and damping still operate against the live field centre.
- Validation: focused strict TypeScript compile passed.

### Stage 2 review prototype - Test Answer structural check

- Added `Test Answer` immediately left of Submit as a subdued orange chalk control. It reaches full prominence on hover and keyboard focus, stays a native button, and respects the existing reduced-motion treatment.
- Test Answer is deliberately a pre-submit structural helper. It reads the current ordered answer-piece model and reports through the existing live status area without incrementing attempts or submitting.
- The prototype recognises the current function allowlist by argument count: `SUM`, `COUNT` and `AVERAGE` require at least one argument; `SUMIF` accepts two or three; `COUNTIF` requires exactly two.
- Structural checks cover missing or extra brackets, malformed nesting, empty/misplaced comma arguments, malformed operator placement, misplaced equals signs, adjacent expression pieces and incomplete formula endings. Only the first useful issue is reported.
- Correctness evaluation against sample data remains deferred to Stage 3. The future score reduction for using Test Answer is also deferred, and no scoring/tested-answer flag was introduced because the current prototype does not need it.
- The action-row change groups Test Answer and Submit inside the existing right-hand grid cell, preserving the established Clear/status/right-actions responsive structure.
- Loose-label physics, collision/bounce behaviour, drag boundaries, hover handling, answer-cell wrapping, placed-token reordering, grouped-function appearance and Sample Data behaviour were not changed.
- Validation: focused strict TypeScript compile passed; 18 representative token-structure cases passed; CSS brace validation and static Test Answer wiring checks passed. Full Astro build and browser/mobile runtime checks were not run because the dependency install timed out in this sandbox.

### Stage 2 review prototype - Test Answer value-type checks

- Extended Test Answer with a second validation pass after structural parsing. The first structural issue still wins; type checks run only when the formula shape is valid.
- The checker derives a small worksheet model from the existing Sample Data table instead of duplicating cell values in TypeScript. Cells are classified as number, text or blank. Numeric detection supports decimals as well as whole numbers.
- Excel behaviour note: a mixed cell range is not treated as one string value. Functions inspect the cell values according to their own rules. For example, `SUM` ignores text reached through references, while direct arithmetic on non-numeric text can return `#VALUE!`.
- `SUM`: rejects direct non-numeric text. A text-only reference such as `SUM(A2)` is reported as a likely mistake with accurate feedback that Excel would ignore the text and return 0. Mixed references remain allowed when numeric cells are present.
- `AVERAGE`: rejects direct non-numeric text and reports when referenced arguments contain no numeric values. Text inside a reference can be ignored when other numeric values remain.
- `COUNT`: reports a text-only reference that would count zero numeric values.
- Arithmetic operators `+`, `-`, `*` and `/`: require numeric-compatible operands. Direct text, a text cell, or a range containing text is reported. This catches `AVERAGE(A2,C2:C5)*("East")`.
- `SUMIF`: validates the criteria-range position, optional sum-range position, obvious criteria/data-type mismatches against the current sample data and a text-only effective sum range.
- `COUNTIF`: validates the range position and obvious criteria/data-type mismatches.
- `COUNTIFS`: validator support now recognises `criteria_range1, criteria1, [criteria_range2, criteria2], ...`, requires complete pairs, checks range positions and requires all criteria ranges to have the same dimensions. This does not add a `COUNTIFS` gameplay token yet.
- No answer-result calculation, target-answer comparison, scoring penalty or `hasTestedAnswer` state was added.
- Validation: focused strict TypeScript compile passed before and after the change; 26 representative structural/type cases passed. The package also confirms `FormulaDaily.astro` and `formula-daily.css` are byte-for-byte unchanged from the previous Test Answer prototype. Full Astro build was not run because `npm ci` timed out in this sandbox.

#### Test Answer validation checklist

- [x] Empty formula and structural syntax errors.
- [x] Required and maximum argument counts for the current function set.
- [x] `COUNTIFS` complete range/criteria pair structure.
- [x] Sample-cell classification as number, text or blank.
- [x] Decimal numeric values.
- [x] Direct text misuse in `SUM` and `AVERAGE`.
- [x] Text-only reference warnings for `SUM`, `AVERAGE` and `COUNT`.
- [x] Numeric operand checks for `+`, `-`, `*` and `/`.
- [x] `SUMIF`, `COUNTIF` and `COUNTIFS` range-argument positions.
- [x] Obvious criteria/data type mismatches for `SUMIF`, `COUNTIF` and `COUNTIFS`.
- [x] Equal criteria-range dimensions for `COUNTIFS`.
- [ ] Division by zero and other value-dependent runtime errors such as `#DIV/0!`.
- [ ] Invalid or unavailable references such as `#REF!`.
- [ ] Unsupported/misspelled function names such as `#NAME?`.
- [ ] Boolean, date and Excel error-value types.
- [ ] Full numeric-text coercion rules and locale-sensitive numeric formats.
- [ ] Rich criteria parsing including wildcards, escaped wildcards and concatenated criteria expressions.
- [ ] Additional function families such as `SUMIFS`, `AVERAGEIF` and `AVERAGEIFS` when gameplay needs them.
- [ ] Formula evaluation against the sample data and target-answer correctness.
- [ ] Test Answer score-reduction state and final scoring rules.

#### Candidate common player errors for later iterations

- Using a criteria function with range and criteria arguments in the wrong order.
- Supplying an odd number of `COUNTIFS` arguments or mismatched criteria-range sizes.
- Applying arithmetic directly to text labels or mixed text/number ranges.
- Dividing by a cell or expression that evaluates to zero.
- Using text criteria without required quotation marks once comparison/operator criteria pieces are introduced.
- Choosing `COUNT` when the player intends to count text values, which would need `COUNTA`, `COUNTIF` or another suitable function.
- Confusing `SUMIF(range, criteria, [sum_range])` with the different argument order used by `SUMIFS(sum_range, criteria_range1, criteria1, ...)`.


### Stage 2 review correction - Test Answer error-only feedback

- Tightened Test Answer so it behaves as an Excel error pre-check rather than a solution coach. A formula is no longer rejected merely because it is unlikely to match the intended sample data.
- Removed the previous criteria/data compatibility warning. Valid Excel formulas such as `COUNTIF(B2:B5, "East")` now pass the test even though the criteria will not match the current numeric data.
- Removed non-error warnings for accepted Excel behaviour. `SUM(A2)` and `COUNT(A2)` now pass when `A2` contains text because those functions accept the reference and ignore/count no text rather than returning a formula error. A text-only `SUMIF` sum range is likewise not rejected solely because it contributes zero.
- Retained checks where the current supported formula would fail to evaluate, including invalid structure/argument layouts, direct non-numeric text where the supported numeric functions reject it, arithmetic on non-numeric text, text-only `AVERAGE` inputs that leave no numeric values, and unequal `COUNTIFS` criteria-range dimensions.
- Error feedback is now intentionally terse. The status area shows `Test found:` plus one focusable error category: `Bracket error`, `Argument error`, `Syntax error`, `Operator error`, `#VALUE!`, or `#DIV/0!`.
- Each reported issue carries the piece IDs involved. Hovering or keyboard-focusing the error category shows one short category-level tooltip and temporarily recolours the implicated placed tokens red. Touch/click can pin and unpin the same tooltip/highlight. The tooltip describes the error class without naming the exact bad argument or giving a correction.
- Empty-answer testing remains a plain `Build a formula first.` message because there is no formula element to identify.
- No formula-piece physics, dragging, reordering, wrapping, Sample Data behaviour, Submit behaviour or scoring logic changed in this correction.

#### Current Test Answer validation checklist

- [x] Empty-formula guard.
- [x] Missing, extra and mismatched brackets.
- [x] Missing, extra and misplaced function arguments/commas for the current function signatures.
- [x] Malformed operator placement and incomplete expressions.
- [x] `COUNTIF(range, criteria)` argument structure.
- [x] `COUNTIFS(criteria_range1, criteria1, ...)` complete pair structure and equal criteria-range dimensions.
- [x] `SUMIF(range, criteria, [sum_range])` range-argument positions.
- [x] Direct non-numeric text errors in the currently supported `SUM`/`AVERAGE` cases.
- [x] Arithmetic `+`, `-`, `*`, `/` checks for non-numeric text operands.
- [x] `AVERAGE` with no available numeric values reports the current `#DIV/0!` class.
- [x] Valid-but-unhelpful criteria/data combinations are allowed rather than treated as errors.
- [x] Error category hover/focus/touch explanation with implicated-token highlighting.
- [ ] Evaluate denominator values so literal/reference/expression division by zero can report `#DIV/0!`.
- [ ] Invalid or unavailable references and `#REF!`.
- [ ] Unsupported or misspelled function names and `#NAME?`.
- [ ] Invalid numeric-domain cases that produce `#NUM!` once relevant functions exist.
- [ ] Excel error values inside referenced cells and propagation of `#VALUE!`, `#N/A`, `#REF!`, etc.
- [ ] Boolean/date/error cell types and deeper Excel coercion rules.
- [ ] Criteria parsing for quoted comparison expressions, wildcards and escaped wildcards when those puzzle pieces are introduced.
- [ ] Additional conditional families such as `SUMIFS`, `AVERAGEIF` and `AVERAGEIFS` when gameplay needs them.
- [ ] Dynamic-array/spill behaviour if formulas later allow whole ranges as arithmetic operands.
- [ ] Formula evaluation against the sample data and target-answer correctness.
- [ ] Test Answer score-reduction state and final scoring rules.

#### Candidate Excel/player errors for later iterations

- Division by zero from a literal, blank cell, zero-valued cell or expression.
- Invalid references after future puzzles introduce references outside the supplied sample data.
- Misspelled/unsupported function names if free-form function construction is introduced.
- Criteria text missing quotes once comparison/operator criteria can be assembled from separate pieces.
- `SUMIFS`/`COUNTIFS` range dimensions that do not align.
- Text used directly with arithmetic operators.
- Function-specific numeric-domain errors that map to `#NUM!`.
- Referenced cells that already contain Excel error values and propagate that error into the formula.

### Stage 2 review patch - Test Answer hazard highlighting and tooltip placement

- Changed only the visual treatment of the existing Test Answer error interaction. Validation rules and implicated-token selection are unchanged.
- Added a dedicated bright error red so Test Answer failures are visually distinct from the normal red chalk used for range pieces.
- Implicated answer tokens now receive a translucent diagonal hazard pattern while the error category is hovered, focused or touch-pinned. The pattern alternates bright red and black bands while preserving readable label text and the token's shape.
- The error category itself uses the brighter error red, with the existing hover/focus affordance retained.
- Moved the category tooltip below the `Test found:` line by changing its anchored position and reveal transform. This prevents the hint from obscuring the answer cell above.
- No change to TypeScript, validator coverage, formula assembly, token movement, hover targeting, drag/drop, answer wrapping, Sample Data or scoring.
- Validation: CSS brace balance and selector presence checks passed. Local browser review is still required for final stripe opacity and narrow-screen tooltip placement.

### Stage 2 review patch - collect all current Test Answer errors

- Test Answer no longer stops at the first supported validator finding. Structural and value/type checks now collect all detectable issues from the assembled formula, then sort them from left to right by the first implicated token.
- Exact duplicate findings for the same category and implicated token set are collapsed. Separate errors of the same category remain separate findings so each link can point to a different part of the formula.
- The status line renders every finding as its own existing red error link and joins the links with normal prose punctuation. Two findings use `A and B`; three or more use an Oxford comma, for example `A, B, and C`.
- Hovering or keyboard-focusing one error link highlights only that finding's implicated tokens. Touch/click can pin one finding at a time; hovering another finding temporarily previews that finding, then restores the pinned highlight.
- Type validation now continues after a function-level error where the remaining token stream can still be parsed. This allows a formula such as an invalid `COUNTIF(...)` followed by a separate invalid `AVERAGE(...)` to report each detectable issue in one test.
- Structural checks were changed from a fail-fast parser to independent bracket, argument, operator and adjacency checks so multiple structural findings can be surfaced in one result.
- A successful test now says `No test errors found. Ready to submit.` rather than describing only the formula structure.
- This does not mean Formula Daily now emulates every Excel error. The multi-error result covers the currently implemented validator classes only; deferred Excel errors in the checklist below remain deferred.
- No CSS, Astro markup, loose-label physics, drag/reorder behaviour, answer wrapping, Sample Data or scoring logic changed.
- Validation: focused strict TypeScript compilation and generated JavaScript syntax checks passed; the previous 22 validator regression cases passed; dedicated multi-error cases passed for mixed error categories, repeated categories with separate target sets, left-to-right ordering and Oxford-comma separator rules. Full Astro/browser QA remains a local test because installed project dependencies are absent from the supplied snapshot.

#### Multi-error Test Answer checklist

- [x] Collect multiple currently supported findings in one Test Answer run.
- [x] Keep each finding's implicated token IDs separate for hover/focus/touch highlighting.
- [x] Sort findings by formula position rather than validator-pass order.
- [x] Collapse exact duplicate findings while retaining separate instances of the same category.
- [x] Format two-item and three-plus-item status lists with natural `and` / Oxford-comma punctuation.
- [x] Continue parseable type checking after an earlier function-level error.
- [ ] Review locally how long four-plus-error status lines wrap on narrow mobile widths.
- [ ] Add further Excel error classes only as their required formula pieces and evaluation rules are introduced.

## 2026-09-10 review correction - equals comparison operator

- Branch base: `main`; base commit: `094e8f7dc859a9f6b76dd30c5acd904bf1062187`, using the reviewed multi-error Test Answer package as the working baseline layered on that snapshot.
- Corrected the `=` formula piece from an invalid/misplaced syntax token to a supported comparison operator when it appears between two expressions. This matches Excel, where equality comparisons return `TRUE` or `FALSE`.
- An internal `=` now participates in the same missing-operand structure check as other operators, so a comparison with no expression on one side still reports `Operator error`. A leading `=` remains valid as Excel's formula marker.
- The semantic pre-check does not apply numeric-operand `#VALUE!` rules to equality comparisons. Text and numeric expressions can therefore be compared without a false type error.
- The validator distinguishes a leading `=` formula marker from an internal `=` comparison operator. This keeps the pre-check aligned with Excel syntax while allowing the game's equality piece to compare two assembled expressions.
- No other comparison operators were added in this patch. `<`, `>`, `<=`, `>=` and `<>` remain future validator/token work if they are introduced as puzzle pieces.
- No CSS, Astro markup, multi-error rendering, hover targeting, loose-label physics, drag/reorder behaviour, Sample Data or scoring logic changed.

## 2026-09-10 review correction - Excel error semantics for commas and text-range SUM

- Branch base: `main`; base commit: `094e8f7dc859a9f6b76dd30c5acd904bf1062187`, using the reviewed equals-comparison Test Answer package as the working baseline layered on that snapshot.
- Reaffirmed the Test Answer rule: report syntax/structure problems or Excel evaluation errors only. Do not reject a formula because it is a poor answer to the puzzle.
- A comma outside a function argument list now reports `Syntax error`, not `Argument error`. The generic hover help is `Part of the formula is not valid in this position.` and the implicated comma token remains the only highlighted piece.
- Commas that create a missing/empty argument inside a supported function remain `Argument error`, because the problem belongs to that function call's argument structure.
- `SUM(A2:A5)="East"` is accepted when `A2:A5` contains text. Excel permits the `SUM` reference, ignores text within referenced cells, then evaluates the equality comparison and returns a logical result rather than an error.
- `COUNTIF(B2:B5, "East")` remains accepted because a criteria/data mismatch that simply produces no matches is not an Excel error.
- General comma reference-union semantics are not added in this patch. The current game validator treats a loose comma outside a supported function as invalid for the currently available puzzle grammar.
- No CSS, Astro markup, error-link rendering, hazard highlighting, loose-label movement, drag/reorder behaviour, answer wrapping, Sample Data or scoring logic changed.
- Validation: focused strict TypeScript compile passed. Focused validator cases passed for text-range SUM equality, loose-comma syntax classification, empty in-function arguments remaining argument errors, and valid no-match COUNTIF criteria.



### Stage 2 review patch - Test Answer tooltip above loose labels

- Changed only Test Answer feedback stacking. The action/status layer now sits above the loose-label cluster so the tooltip is not visually covered by nearby formula pieces.
- The tooltip keeps its below-status placement and receives a higher local `z-index` within the action layer.
- No changes to validator semantics, error categories, implicated-token highlighting, loose-label movement, collision behaviour, drag/drop, answer wrapping, Sample Data or scoring.
- Validation: CSS brace/selector checks and package integrity check. Local browser review remains required for final desktop/mobile confirmation.

### Stage 2 review patch - hide neighbour strings and reduce routine status narration

- Hid the loose-label nearest-neighbour SVG strings in CSS while leaving the existing neighbour-link calculation, SVG element and `updateStrings()` logic unchanged. The physics system still uses the same neighbour relationships; only the dashed visual debugging aid is no longer rendered.
- Removed routine status narration for selecting the answer, adding/removing/rejoining pieces, reordering pieces, leaving a dragged answer piece in place, and clearing the answer.
- Formula mutations now clear any stale Test Answer feedback silently instead of replacing it with action narration. Moving an unused loose piece without changing the assembled formula does not clear the current test result.
- Kept status messages that carry gameplay or validation information: Test Answer results, the empty-formula prompt, and Submit/attempt feedback.
- The existing formula output live region remains in place, so the status area no longer duplicates every routine interaction announcement.
- No changes to neighbour physics, collision/bouncing, centre-seeking behaviour, cluster breathing room, drag boundaries, label return behaviour, hover handling, answer wrapping, Test Answer validation, error highlighting, Sample Data, or scoring.

### Stage 2 review patch - initial whiteboard notes on desktop

- Reported issue: the faint whiteboard lesson notes were missing on a fresh desktop load, but appeared after switching Chrome DevTools into a mobile viewport and then back to desktop.
- Root cause: `packCluster()` ran immediately after registering the `ResizeObserver` and set `lastFieldWidth`. When the observer's initial asynchronous callback arrived, the field width matched `lastFieldWidth`, so its early return prevented `populateBoardNotes()` from running. A later responsive width change triggered the population path.
- Revision: call `populateBoardNotes()` explicitly during Formula Daily initialization before the initial `packCluster()`. The existing resize observer is retained unchanged for genuine width changes.
- No note content, styling, responsive rules, label physics, formula assembly, Test Answer, Sample Data or scoring behaviour changed.
- Validation: focused TypeScript compilation and static initialization-order checks passed. Full Astro/browser QA remains a local test because installed project dependencies are not included in the supplied snapshot.

### Stage 2 review prototype - costed Function Help

- Added a `Help` control immediately left of `Test Answer`. It uses subdued white chalk styling by default and becomes fully prominent on hover/focus.
- The Help popup builds its function-link list from the current puzzle pieces rather than a separate hard-coded display list. The current puzzle therefore shows `COUNTIF`, `SUMIF`, `SUM`, `AVERAGE` and `COUNT`; validator-only `COUNTIFS` is not shown because no `COUNTIFS` piece exists in this puzzle.
- Added a single `HELP_SCORE_PENALTY_PERCENT` constant, currently `50`, so the cost can be tuned without changing the interaction code or copy in several places.
- Before purchase, hovering/focusing a function keeps the reference locked and shows `Tap to reveal (-50% points)`. The first function click/tap purchases Help once for the current question/session. It records `data-help-used="true"` and the configured penalty percentage on the Formula Daily root for later scoring integration.
- The current Stage 2 prototype does not yet calculate a final question score. This patch therefore records the Help score-cap penalty but does not redesign the existing attempt counter or future scoring loop.
- After Help is purchased, all function links in the current puzzle become available on hover/focus. Guides use concise Excel-style signatures and generic argument guidance only. They intentionally avoid naming the current puzzle's target columns, ranges or answer.
- Current guide structures are `COUNTIF(<range>, <criteria>)`, `SUMIF(<range>, <criteria>, [sum_range])`, `SUM(<number or range>, ...)`, `AVERAGE(<number or range>, ...)` and `COUNT(<value or range>, ...)`. Guidance follows the corresponding Microsoft Excel function definitions.
- Help purchase is independent of formula state. Clear removes assembled answer pieces/status as before but does not relock Help or remove the paid-help flag. The future multi-question loop should reset this state when the player advances to a new question.
- Pointer hover, keyboard focus and tap/click can open the Help popup. Click/tap can pin it, individual function links are keyboard-accessible buttons, and Escape closes the popup.
- No changes were made to Test Answer validation, Submit behaviour, formula evaluation, loose-label physics, collision/bouncing, drag boundaries, connector calculations, answer wrapping, Sample Data or board-note behaviour.
- Validation: focused strict TypeScript compilation passed. Full Astro build and browser/mobile visual QA remain local because the supplied context snapshot excludes installed dependencies; a headless Chromium interaction attempt timed out in the sandbox.