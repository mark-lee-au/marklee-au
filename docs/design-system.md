# Design System

## Direction

The permanent site interface should feel like a gallery around the work.

Use a restrained dark base and strong typography. Avoid adding decorative UI that competes with projects.

## Site shell

Default characteristics:

- dark background
- off-white primary text
- muted secondary text
- minimal borders
- limited global accent colour
- generous spacing around major visuals
- simple navigation

Projects may override accents and visual treatment inside their own content area.

## Typography

Use a clean sans-serif system or carefully selected web font.

Hierarchy should come from:

- size
- weight
- spacing
- alignment

Do not rely on many font families.

## Page hierarchy

Typical project page order:

1. project category and status
2. title
3. question or one-line summary
4. main visual
5. short explanation
6. findings or observations
7. data and methodology
8. source links and project metadata

## Cards

Project cards should prioritise:

- visual preview
- project title
- concise summary
- category or status

Avoid dense metadata on homepage cards.

## Interaction

All controls must have visible states.

Examples:

- play and pause
- timeline scrubber
- filter buttons
- map zoom
- reset view

Provide touch targets large enough for phones.

## Motion

Motion should represent data, state, or navigation.

Respect `prefers-reduced-motion`.

For reduced motion:

- stop looping decorative animation
- avoid automatic camera movement
- provide static or step-based alternatives for data animation where possible

## Responsive behaviour

Design breakpoints based on content rather than named devices.

At narrow widths:

- stack text and visuals where needed
- reduce label density
- simplify legends
- move secondary controls into compact layouts
- avoid tiny side-by-side charts
- keep important controls reachable without hover

## Project-specific colour

Use colour to encode meaning consistently within a project.

Do not select colours only for decoration if the same colour is also encoding data.

Provide legends when colour meaning is not obvious.
