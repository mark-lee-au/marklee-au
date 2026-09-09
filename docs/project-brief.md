# Project Brief

## Working name

marklee.au Data Portfolio

## Purpose

Build a public web-based portfolio that turns interesting datasets and logical systems into visual stories, maps, animations, interactive games, experiments, and concise analytical pieces.

The site serves two purposes:

1. A professional portfolio showing data analysis, data engineering, visualisation, geographic analysis, and communication skills.
2. A personal place to publish interesting data ideas without requiring every idea to become a large formal project.

## Audience

Primary audiences:

- potential employers and hiring managers
- data and analytics professionals
- people interested in data visualisation
- people interested in geography, history, infrastructure, transport, energy, cities, and Australian data

Secondary audience:

- general visitors who arrive through a shared project link

## Core categories

### DATA

Finished visual stories where the main subject is data rather than geography.

Examples:

- electricity generation patterns
- fuel price cycles
- demographic change
- historical comparisons
- time series stories

### MAPS

Finished projects where place, movement, spatial relationships, or geography are central.

Examples:

- transport movement
- historical boundaries
- population change across space
- infrastructure networks
- geographic patterns

### GAMES

Interactive games and playful systems built around data, programming, logic, or exploratory interaction.

Games have their own collection rather than using LAB, including while they are prototypes. Their project status communicates maturity.

### LAB

Data experiments, visualisation prototypes, and smaller analytical ideas in progress.

LAB exists so the site can publish interesting work quickly without forcing every idea into a polished long-form project.

Examples:

- one-question visualisations
- data visualisation prototypes
- animation tests
- unusual map projections
- small historical datasets
- visual experiments

A successful LAB project can later be expanded and promoted into DATA or MAPS. Games remain in GAMES as they mature.

## Experience goal

The site should feel like a digital gallery or data publication.

The visual is the centrepiece. Supporting text should explain the question, what the viewer is seeing, important findings, the data source, and the method without overwhelming the visual.

## Initial technical scope

- Astro static site
- responsive on desktop, tablet, and mobile
- existing Cloudflare Worker hosting of the static build (see [deployment workflow](deployment-workflow.md))
- GitHub source control
- no database initially
- no CMS initially
- no login system
- no user accounts
- no comments
- no analytics dependency required for launch

## Success criteria

The site succeeds when:

- a visitor can understand what Mark does within a few seconds
- a project can be opened directly from a shared URL
- projects work on mobile devices
- new projects can be added without rebuilding the site structure each time
- each finished project documents its source and method
- interactive projects remain usable without specialist knowledge
- visual work demonstrates analytical thinking rather than only styling
- LAB makes it easy to publish smaller experiments

## Non-goals

Do not turn the site into:

- a generic BI dashboard collection
- a personal blog dominated by text
- a social network
- a data upload platform
- a commercial SaaS product
- a framework built for hypothetical future requirements
