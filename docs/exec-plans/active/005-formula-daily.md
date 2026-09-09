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
