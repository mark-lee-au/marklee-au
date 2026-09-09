# Execution Plan 006: Ascend

Status: Genesis prototype published as a prototype on 2026-09-09; later Genesis expansion has not started.

## Objective

Create a lightweight incremental browser game in the existing GAMES collection. The player begins with nothing, taps a primitive cell into existence, and gradually guides life through biological evolution, cognition, knowledge, awareness, transcendence and eventual ascension.

`ASCEND` is a working title and must remain easy to change. The proposed stable slug is `ascend`. Under the repository's existing project routing convention, the expected canonical route is `/projects/ascend/` rather than a category-specific route.

The first playable implementation will test one question only: **does the first 30–60 seconds of creating and adapting a living cell feel satisfying?**

## Placement and audience

Ascend belongs to the existing GAMES collection at every maturity level. During local review it should use `category: games`, `status: prototype`, and `featured: false`. Shared project metadata should generate its project route and its card on `/games/`; no parallel Games route, registry or listing system should be created.

The intended audience is a general portfolio visitor who should understand the opening interaction without prior incremental-game knowledge, a tutorial modal or extensive explanatory copy.

Formula Daily may be inspected during later stages to confirm shared routing, metadata, cards, navigation and layout conventions. Its internal game architecture is not a template for Ascend unless a piece is genuinely shared infrastructure.

## Approved permanent product principles

1. Manual tapping always remains possible. Players may interact as quickly or slowly as they choose throughout the game.
2. Automation gradually makes tapping optional. It adds to manual play rather than replacing or disabling it.
3. The interface begins extremely sparse and reveals counters, choices and systems only when they become meaningful.
4. Visible evolution of the central being is a major reward.
5. Each major era should introduce a new concept or mechanic rather than only larger numbers.
6. The long-term game may develop three interacting progression themes: biological evolution, knowledge/technology, and awareness/spirituality.
7. Those themes may eventually converge toward Ascension.
8. Ascension is expected to become the long-term prestige/reset mechanic.
9. Original minimalist pixel-outline SVG artwork is the intended visual language.
10. The game should avoid unnecessary frameworks and remain lightweight within the static Astro architecture for as long as practical.
11. Every substantial future development stage requires separate approval under the repository collaboration workflow.

## First playable vision: Genesis prototype

The Genesis prototype is a later lifecycle stage, not authorised by this plan. Its sole purpose is to test the feel of the opening 30–60 seconds. It is not the full Genesis era or a complete idle game.

### Opening interaction

- Begin with an almost empty screen and a small pixel-style `TAP` instruction.
- Show no organism, shop, dashboard, upgrade tree, large tutorial or unexplained currency.
- On the first pointer, touch or keyboard activation, reveal a tiny Primordial Cell, set Energy to 1, reveal the minimal Energy display, change the instruction to `TAP AGAIN`, and give immediate pulse/glow feedback.
- Each manual tap initially adds 1 Energy immediately. Rapid input must remain responsive even while feedback animation is active.
- Fade `TAP AGAIN` naturally over the following interactions without requiring dismissal.
- Keep manual interaction available throughout and after every milestone.

### First milestone and adaptation

At approximately 10 lifetime manually generated Energy, intensify the cell glow, play a short CSS/SVG energy burst, and reveal the first Adaptation choice. The player selects one prototype adaptation:

| Adaptation | Prototype effect | Play style |
| --- | --- | --- |
| Reinforced Membrane | Adds 1 Energy to manual tap power, making taps worth approximately 2 Energy. | Active tapping |
| Mitochondria | Generates approximately 0.25 Energy per second. | First automation |
| Replication | Adds an approximately 5 Energy bonus on every tenth manual tap. | Rhythmic active tapping |

These are configurable prototype values, not final balance decisions. The choice should apply immediately, collapse after selection, return focus to the organism, and never disable manual tapping.

### Second milestone and stopping point

At approximately 30 lifetime Energy, evolve the Primordial Cell visually into an Adapted Cell and show a restrained message such as `GENESIS HAS BEGUN`. Play remains available after the message. This is the stopping point of the first playable prototype; it must not continue into later Genesis content.

## Visual direction

Ascend should feel minimal, mysterious, organic, technical, quiet and progressively revealing. Negative space and the organism should dominate the opening. A restrained Energy glow and short, responsive feedback are appropriate.

Avoid cartoon characters, faces on organisms, imitation of Cookie Clicker, generic SaaS dashboards, large permanent opening panels, excessive gradients or glow, cyberpunk clichés, fake-terminal styling, tutorial modals and large blocks of explanatory text.

Motion should be purposeful, brief and compatible with `prefers-reduced-motion`. Mouse, touch and keyboard interaction must be first-class, with visible focus and semantic controls where practical.

## SVG art direction

Future artwork should be original repository-authored SVG: pixel-art inspired, outline based, minimal, mostly monochrome or near-monochrome, crisp-edged, scalable and simple to revise. Small integer grids or view boxes should be preferred where they support the look.

The first playable prototype is expected to need only:

- Primordial Cell;
- Adapted Cell;
- Reinforced Membrane icon;
- Mitochondria icon;
- Replication icon.

These assets are not part of Stage 1 and must not be created until the relevant implementation stage is approved.

## Speculative long-term direction

The following eras, names, resources and systems provide thematic direction only. They are not approved implementation scope or final design.

- **Genesis:** Energy, cell development, replication and basic biological processes.
- **Evolution:** possible Biomass, multicellular life, adaptation, movement, senses and nervous systems.
- **Cognition:** possible Thought, memory, language, reasoning and social behaviour.
- **Knowledge:** possible Knowledge, tools, writing, mathematics, science, medicine, electricity, computing and artificial intelligence.
- **Awareness:** possible Awareness, introspection, empathy, meditation, self-awareness, collective consciousness and ego dissolution.
- **Transcendence:** possible detachment from matter, perception beyond ordinary biological limits and increasingly abstract consciousness.
- **Ascension:** possible prestige/reset, a persistent Ascendancy, Essence or equivalent resource, permanent benefits and alternative evolutionary paths.

Later design may connect biological evolution, knowledge/technology and awareness/spirituality before convergence. Each era and mechanic requires its own review and approval; this plan does not attempt to design or balance them.

## Technical hypotheses for Stage 2

Stage 2 should validate, rather than assume, the following direction:

- retain the existing Astro static build with semantic HTML, project-scoped CSS, TypeScript or JavaScript, and inline or component SVG;
- integrate through shared project metadata, `/projects/ascend/`, the existing dynamic project route and automatic `/games/` collection listing;
- keep client state project-scoped, with likely fields for `energy`, `lifetimeEnergy`, `manualTapCount`, `clickPower`, `passiveEnergyPerSecond`, `selectedAdaptation`, `organismStage`, milestone state and `lastUpdateTime`;
- consider versioned `localStorage` for early prototype persistence;
- use CSS and SVG for idle, tap, burst and evolution animation;
- calculate passive generation from elapsed time rather than assuming timer precision;
- preserve semantic keyboard activation, visible focus, touch support, rapid input and reduced-motion behaviour;
- avoid new frameworks, animation libraries, Canvas, WebGL, workers, services or backend infrastructure unless Stage 2 finds a measured requirement.

These are validation targets, not proven architecture decisions. Stage 2 must remain a documentation and feasibility stage with no production implementation.

## Explicitly deferred

The first playable prototype excludes:

- the full Genesis era and multicellular life;
- Biomass and large upgrade trees;
- biological branching or multiple evolutionary routes;
- Cognition, Thought, Knowledge and technology progression;
- Awareness or spiritual progression;
- Transcendence and Ascension;
- prestige/reset implementation;
- offline earnings;
- achievements or statistics dashboards;
- accounts, cloud saves, backend systems or leaderboards;
- sound or music;
- large content libraries;
- advanced balancing;
- production analytics.

## Reviewable delivery stages

Each stage begins and ends with measured usage when available, stops at a usable local or documentary handoff, and requires explicit approval before the next stage.

| Lifecycle stage | Objective | Scope boundary | Expected review output | Complexity | Usage | Stop condition |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Brief and direction — current | Agree the product vision, Games placement, route direction, principles, Genesis prototype boundary and later review sequence. | Documentation only; no source code, assets, dependencies, feasibility proof or route. | This execution plan for direction review. | Low | Low | Stop when the plan is reviewable and wait for approval. |
| 2. Source and technical feasibility | Confirm that the proposed prototype is feasible within existing Games and static Astro conventions. | Inspect only relevant shared infrastructure and validate metadata/routing, state and persistence direction, SVG/CSS animation, elapsed-time passive generation, accessibility, reduced motion and mobile interaction. No production implementation or artwork. | Short feasibility record, confirmed boundaries, risks and a Stage 3 recommendation. | Low–Medium | Low | Stop after the feasibility report and wait for prototype approval. |
| 3. Genesis local visual prototype | Build only the approved 30–60 second Genesis interaction from first tap through the Adapted Cell milestone. | No later Genesis systems or future eras; no release-candidate polish, commit, push or publication. | Local `/projects/ascend/`, automatic `/games/` card, one representative desktop check, one phone-width check, focused accessibility/input checks and build results. | Medium | Medium | Stop when the acceptance path is locally playable and wait for gameplay/visual feedback. |
| 4. Genesis feedback and revision | Apply only agreed changes arising from review of pacing, artwork, interaction and feedback. | No automatic expansion of mechanics, eras or release scope. | Revised local prototype plus a short decision/review log and focused validation. | Low–Medium per iteration | Low–Medium | Stop after each agreed revision set and wait for further review. |
| 5. Genesis expansion | Extend Genesis only if the prototype quality and next mechanic are separately approved. | Scope must be defined in a new or revised approved stage before implementation; no implied Cognition or later-era work. | A separately specified local review milestone. | To be assessed | To be assessed | Stop at the approved expansion boundary. |
| Later release candidate | Prepare the approved product state for release only when explicitly requested. | Complete accessibility, responsive, content, payload, build and release checks without publishing. | Verified unpublished local candidate and final diff. | Medium–High | Medium–High | Stop for separate publication approval. |
| Publication | Commit, merge/push and verify the existing deployment only after explicit publication approval. | No unplanned product development or Cloudflare/DNS/email changes. | Verified live route and updated release record. | Low | Low | Stop after the authorised release is verified. |

Stages should be split further if projected or measured usage approaches the repository ceiling of 15 weekly percentage points or 40 rolling five-hour percentage points.

## Decisions and risks requiring review

Stage 1 proposes the following decisions for approval:

1. Keep `ASCEND` as a changeable working title while adopting the stable technical slug `ascend`.
2. Use `/projects/ascend/` as the canonical route and shared metadata for `/games/` discovery.
3. Treat the Genesis prototype's 10- and 30-Energy thresholds and adaptation values as configurable feel-testing values.
4. End the first prototype after the Adapted Cell transformation and `GENESIS HAS BEGUN` message while leaving tapping available.
5. Preserve the eleven permanent principles above independently of speculative era names and mechanics.

Stage 2 must report any conflict with existing shared Games infrastructure rather than refactor Games-wide conventions. Visual pacing, precise artwork, persistence details, fractional Energy presentation and milestone semantics remain intentionally unresolved until their relevant stage.

## Likely later implementation boundaries

Subject to Stage 2 confirmation, later work would likely touch:

- `src/content/projects/ascend.md` for shared metadata with `category: games`, `status: prototype`, and `featured: false`;
- `src/pages/projects/[slug].astro` only if the established project-component mapping requires a small Ascend registration;
- `src/visualisations/ascend/` for project-scoped component, configuration, state, persistence, SVG and styles;
- this execution plan for feasibility, usage and review records.

No application files or asset directories are created in Stage 1.

## Approval gates

- **Gate 1 — brief and direction:** this document requires user review and approval before Stage 2.
- **Gate 2 — source and technical feasibility:** Stage 2 findings require separate approval before any playable implementation.
- **Gate 3 — Genesis visual prototype:** local implementation and subsequent revision sets each stop for user review.
- **Gate 4 — release candidate:** release preparation begins only on explicit request.
- **Gate 5 — publication:** commit, push and deployment verification require separate explicit approval.

Approval never rolls forward automatically from one gate to another.

## Stage 1 record

- Branch created: `codex/ascend` from `main`.
- Deliverable: this active execution plan and its documentation-index entry.
- Application code changed: none.
- SVG or other assets created: none.
- Dependencies installed: none.
- Build or tests run: none; repository validation does not require a production build for documentation-only planning.
- Starting usage: rolling five-hour 22% used; weekly 28% used.
- Ending usage: rolling five-hour 23% used; weekly 28% used.
- Measured Stage 1 change: +1 percentage point rolling five-hour; no measured weekly change, below both stage ceilings.
- Commit, push, deployment and publication: not authorised and not performed.

### Stage 1 approval

The user approved the working title, stable `ascend` slug, `/projects/ascend/` route, shared GAMES metadata integration, configurable prototype values, Adapted Cell stopping point and permanent principles. This approval authorised Stage 2 feasibility only.

## Stage 2 feasibility record

**Result: PASS.** The Genesis prototype can be implemented cleanly with the existing static Astro architecture, browser TypeScript, project-scoped CSS and inline SVG. No dependency, backend or parallel Games architecture is required.

### Confirmed integration and architecture

- Add `src/content/projects/ascend.md` with `slug: ascend`, `category: games`, `status: prototype`, `featured: false` and the normal card metadata. The content loader includes it automatically.
- `getProjects()` and `projectUrl()` generate `/projects/ascend/`; `ProjectListing category="games"` on `/games/` filters the same collection and renders the existing `ProjectCard` automatically.
- The interactive visual should follow the existing explicit project mapping in `src/pages/projects/[slug].astro`: import one project-scoped Ascend Astro component and mount it in the named `visual` slot when the slug is `ascend`. No change to the Games listing page is needed.
- Astro can statically render the shell and semantic markup while a route-scoped `<script>` initialises browser state and interaction. All prototype behaviour is local, so no server API, Worker binding or backend storage is needed.

### Confirmed state, persistence and timing

- Use one small project-local typed state object, not a generic engine. It should contain numeric `energy`, `lifetimeEnergy`, `manualTapCount`, `clickPower`, `passiveEnergyPerSecond`; nullable `selectedAdaptation`; finite `organismStage`; explicit milestone flags; and a runtime `lastUpdateTime`.
- Keep balance and milestone values in one immutable configuration object so 10/30 Energy thresholds and adaptation effects are not scattered through rendering code.
- Store a compact JSON save envelope such as `{ version: 1, state, savedAt }` under one Ascend-specific `localStorage` key. Validate basic types and ranges on load; ignore or reset malformed/unsupported saves. Save after meaningful transitions and with a small throttle rather than on every animation frame.
- Offline earnings remain excluded. `savedAt` records persistence timing but must not award elapsed Energy after reload. Passive generation can use a lightweight interval or animation-frame loop whose gain is `elapsedSeconds * passiveEnergyPerSecond`, based on a monotonic runtime timestamp. Reset or safely cap the runtime delta after long suspension so timer drift is corrected without creating an offline simulation.

### Confirmed SVG and animation pattern

- Keep original inline SVG in `src/visualisations/ascend/`, alongside the Ascend Astro component, script and stylesheet. Small project-local Astro components may represent the two cell forms and a single adaptation-icon component with three variants; public bitmap assets are unnecessary.
- Inline SVG permits CSS classes and custom properties to control membrane, nucleus, glow and transition states while retaining accessible surrounding HTML. Decorative internal SVG should be hidden from assistive technology when the button already has a complete label.
- CSS transforms, opacity, filters and SVG stroke/fill changes are sufficient for restrained idle movement, tap pulse, glow, expanding ring, geometric mutation burst and the transition to the Adapted Cell. No animation package, Canvas or WebGL is justified.

### Confirmed input, accessibility and mobile approach

- Make the central interaction a real `<button type="button">`. Its `click` handler naturally covers mouse, touch, Enter and Space without separate input paths or double-counting. Update game state synchronously before starting visual feedback; CSS animation state must never gate or throttle valid clicks.
- Give the button a stable descriptive accessible name and visible focus. Use ordinary text for the visual Energy counter without announcing every increment. Reserve a polite status region for infrequent milestones or adaptation confirmation, and return focus to the cell after a choice.
- Render adaptation choices as three semantic buttons with visible names and effects. Do not rely on hover, colour or motion alone.
- Under `prefers-reduced-motion: reduce`, remove idle movement and burst travel while retaining immediate state, contrast and a restrained static change.
- A centred responsive container, fluid sizing with `clamp()`, generous button hit area and stacking adaptation choices at the existing mobile breakpoint are sufficient for phone-sized play. Stage 3 needs one representative phone-width check, not exhaustive viewport QA.

### Stage 2 boundary and usage

- Application code, routes, SVGs and dependencies changed: none.
- Validation: focused source inspection confirmed the content schema, project URL helper, Games category filter, shared card, named visual slot and existing responsive/reduced-motion conventions. `git diff --check` is the required documentation-level check; no production build is warranted for this stage.
- Starting usage: rolling five-hour 24% used; weekly 28% used.
- Ending usage: rolling five-hour 25% used; weekly 28% used.
- Measured Stage 2 change: +1 percentage point rolling five-hour; no measured weekly change, below both stage ceilings.
- Commit, push, deployment and publication: not authorised and not performed.

No technical blocker must be resolved before implementation. Stage 3 remains separately gated and has not begun.

### Stage 2 approval

The user approved the feasibility result and explicitly authorised Stage 3: Genesis Local Visual Prototype. No later stage was authorised.

## Stage 3 record

- Added Ascend to the shared content collection as an unfeatured GAMES prototype. The existing collection filter creates its `/games/` card and the shared project route creates `/projects/ascend/`.
- Built the complete approved opening loop: empty `TAP` state, first-tap Primordial Cell creation, immediate Energy, fading `TAP AGAIN`, responsive manual tapping, the 10-Energy mutation burst, one-of-three adaptation choice, and the 30-Energy Adapted Cell milestone with `GENESIS HAS BEGUN`.
- Reinforced Membrane changes configurable click power to 2; Mitochondria uses elapsed visible-runtime time at 0.25 Energy per second; Replication adds a configurable 5 Energy on every tenth manual tap. Manual tapping remains available for every path.
- Gameplay values live in a single immutable project configuration. Runtime state is one small typed object; no generic engine was introduced.
- Core progress uses a versioned, project-specific `localStorage` save. Unsupported or malformed saves fall back safely. Reload time does not produce offline earnings.
- Created original inline pixel-outline SVG for the Primordial Cell, Adapted Cell and three adaptation icons. CSS and SVG provide idle, tap, glow, ring, fragment and evolution feedback without dependencies.
- The central semantic button supports mouse, touch, Enter and Space through one click path. Energy changes are not live-announced; only adaptation and milestone messages use a polite status region. Reduced-motion styles remove nonessential travel and idle animation.
- Focused local browser review confirmed the shared `/games/` card, first tap, rapid tapping, mutation choices, keyboard selection, passive generation, keyboard tapping through the second milestone, continued play, persistence after refresh, and a stacked 390px-wide adaptation layout. Browser console errors: none.
- Validation: `npm run build` completed successfully with 12 static pages, including `/projects/ascend/`; `git diff --check` found no whitespace errors (line-ending notices only).
- Starting usage: rolling five-hour 27% used; weekly 29% used.
- Ending usage: rolling five-hour 38% used; weekly 30% used.
- Measured Stage 3 change: +11 percentage points rolling five-hour; +1 percentage point weekly, below both stage ceilings.
- Commit, push, deployment and publication: not authorised and not performed.

### Stage 3 review boundary

Review should focus on the opening pacing, whether the cell and mutation burst feel rewarding, whether the three choices read clearly, and whether the visual restraint leaves too much or the right amount of negative space. Later Genesis systems, balance expansion, release-candidate QA and publication remain deferred. Stage 4 feedback work requires explicit approval.

### Stage 3 review iteration — configurable Energy reset

- Added a small prototype control with an editable non-negative integer Energy target and a button whose label updates to `Reset to N`.
- Reset reconstructs a clean run rather than editing only the displayed counter: it clears the selected adaptation, click/passive upgrades, milestone flags, animation state and prior progression before saving the new state.
- Reset to 0 returns to the empty `TAP` opening; 1–9 returns to the Primordial Cell with that Energy; 10 or more reopens the three adaptation choices; choosing an adaptation at 30 or more immediately satisfies the existing Adapted Cell milestone.
- Reset values are capped by a project configuration value and persist through the existing versioned save. The control remains keyboard accessible and announces the result once through the existing polite status region.
- Validation: `npm run build` completed successfully with 12 static pages; focused browser checks passed for the changing button label, reset targets 0, 1 and 10, cleared adaptation state, restored focus and an empty browser error log. The local Astro server was stopped and restarted at `http://127.0.0.1:4321`, and the prototype was left open at the clean 0-Energy state.
- Starting usage: rolling five-hour 77% used; weekly 36% used.
- Ending usage: rolling five-hour 93% used; weekly 39% used.
- Measured review change: +16 percentage points rolling five-hour; +3 percentage points weekly, below the repository's per-stage ceilings but higher than the intended small-review target because live browser verification and its required skill guidance were included.
- Commit, push, deployment and publication: not authorised and not performed.

## Genesis prototype release candidate

- The user reviewed the current local prototype and explicitly requested that this version be committed and published on 2026-09-09.
- The project remains labelled `prototype`; this release does not imply completion of Genesis or authorise later eras.
- Release validation: `npm run build` completed successfully with 12 static pages; `/`, `/games/` and `/projects/ascend/` returned HTTP 200 locally; `/games/` contains the shared Ascend prototype card; the generated project page has the expected canonical URL; and `git diff --check` found no whitespace errors (line-ending notices only).
- Focused browser review covered mouse/touch-sized interaction, keyboard controls, persistence, reduced-motion code paths, and layouts at 360px, 410px, 768px, 1280px and 1600px. No browser errors were reported.
- No dataset, source attribution, backend, large image or external project library is part of this release. Data-specific checklist items are not applicable.
- Publication is limited to the existing GitHub `main` workflow and externally managed Cloudflare Worker deployment. No Cloudflare, DNS or email configuration change is authorised.

## Genesis prototype publication record

- Release commit `5962005` (`Build Ascend Genesis prototype`) was fast-forwarded to `main` and pushed to GitHub on 2026-09-09.
- The existing externally managed Cloudflare deployment served `/games/` with the Ascend prototype card and `/projects/ascend/` with HTTP 200 after the normal deployment delay.
- The live project response contained the Ascend title, canonical URL and configurable reset control. No Cloudflare, DNS or email configuration was changed.
- Ascend remains labelled `prototype`. Later Genesis mechanics, later eras and further review iterations require separate approval.
