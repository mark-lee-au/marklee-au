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
- Collision work focused on allowing labels to bump and transfer movement without permanent overlap at rest.
- The cluster gained extra vertical breathing room so labels have space to escape when a dragged piece compresses the centre.
- Hovered labels are pinned so board movement and answer resizing do not move the active label away from the pointer.
- Hover activation uses a stable captured hit boundary so the glow does not flicker at label edges.
- The visible nearest-neighbour connector lines used during tuning were removed while the underlying relationship logic remained available.
- Text selection is suppressed inside the canvas so repeated dragging does not select page text.
- Labels remain bounded to the board during drag and return behaviour.
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
