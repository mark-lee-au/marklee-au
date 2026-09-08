# Execution Plan 001: Foundation Project System

Status: active

## Objective

Convert the starter from a handful of hard-coded project cards into a structure that can support many DATA, MAPS, and LAB projects without duplicating metadata.

Do not materially redesign the site during this task.

## Starting point

Existing routes:

```text
/
/data
/maps
/lab
/about
```

Existing components include project and category cards.

## Required result

A project should have one primary metadata definition that can be used by:

- homepage featured projects
- DATA listing
- MAPS listing
- LAB listing
- individual project route

## Proposed implementation

Use an Astro content collection for project entries.

Create a schema with fields suitable for:

- title
- slug
- summary
- question
- category
- status
- featured
- published date
- updated date
- tags
- optional preview image
- optional source information

Use category values:

```text
data
maps
lab
```

Use stable individual routes:

```text
/projects/<slug>/
```

## Work items

1. Inspect the current starter code before changing structure.
2. Add a project content collection using the current Astro content collection API.
3. Create project entries corresponding to existing homepage placeholders.
4. Create a reusable project layout.
5. Create a dynamic project route using the project slug.
6. Update DATA, MAPS, and LAB pages to query project metadata.
7. Update homepage featured project cards to query project metadata where practical.
8. Preserve current visual appearance as closely as practical.
9. Add a simple placeholder project detail page for each current project entry.
10. Confirm project category can later change without changing its canonical URL.
11. Run `npm run build`.
12. Manually inspect all main routes and at least one project route.
13. Update `docs/project-status.md` after completion.

## Do not do in this task

- do not add D3
- do not add MapLibre
- do not build the fuel visualisation
- do not add a database
- do not add a CMS
- do not add search
- do not redesign the navigation
- do not add elaborate page transitions

## Acceptance criteria

- site builds successfully
- existing main routes still work
- project metadata exists in one structured source
- category pages filter the same source
- homepage can surface featured projects from that source
- individual project URLs use `/projects/<slug>/`
- changing a project's category does not require changing the project URL
- mobile layout remains functional
