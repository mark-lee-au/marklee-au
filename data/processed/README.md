# Intermediate data

Store reproducible cleaning and analytical outputs in `<project-slug>/`. Contents are ignored by Git except this README. These files are not browser assets and must not be copied wholesale into `public/`.

Use scripts under `scripts/data/<project-slug>/` to transform permitted raw inputs into these outputs, then export only fields required by the visual to `public/data/<project-slug>/`. Document transformations, validation, units and limitations in the project's source note.

See [data architecture](../../docs/data-architecture.md).
