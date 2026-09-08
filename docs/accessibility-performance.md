# Accessibility and Performance

## Accessibility baseline

Every project must remain understandable without precise mouse control.

Requirements:

- semantic headings
- keyboard-reachable interactive controls
- visible focus states
- descriptive button labels
- sufficient text contrast
- no information available only through hover
- touch support for mobile interaction
- reduced-motion behaviour
- text explanation of the visual's purpose and important findings

## Charts and maps

Where practical:

- provide labels or summaries for key values
- do not use colour as the sole encoding for important categories
- use patterns, labels, shape, position, or text where needed
- provide a textual findings section even for highly interactive visuals

## Motion

If a project uses autoplay animation:

- include play and pause controls when the animation conveys data
- respect `prefers-reduced-motion`
- avoid rapid flashing
- make the final state or static state interpretable

## Performance targets

The site should remain comfortable on a modern mid-range phone.

General rules:

- static HTML first
- project-specific JavaScript only where needed
- do not load map or chart libraries on pages that do not use them
- compress large images
- avoid huge unprocessed datasets
- avoid unnecessary polling
- do not run expensive animation while the visual is off-screen if it can be paused

## Data payloads

Before shipping a large dataset to the browser, ask:

- Can the data be aggregated first?
- Can unused columns be removed?
- Can geometry be simplified?
- Can data be loaded only after the project is opened?
- Can a mobile-specific reduced representation preserve the story?

## Testing widths

At minimum, visually check:

- narrow phone around 360 px
- common phone around 390 to 430 px
- tablet width around 768 px
- desktop around 1280 px
- large desktop around 1600 px

These are test widths, not required CSS breakpoints.
