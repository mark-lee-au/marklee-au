# Data preparation scripts

Add project-specific acquisition, cleaning, validation and export scripts under `<project-slug>/` once a real source and schema are established. No processing scripts or generic validation framework are needed for this empty foundation.

Read permitted downloads from `data/raw/<project-slug>/`, write intermediates to `data/processed/<project-slug>/`, and export only approved browser fields plus metadata to `public/data/<project-slug>/`.

Document exact commands, runtime/dependencies, inputs, output schemas, units, timezone, duplicate/null policies and validation in the project source note. Given the same pinned inputs and parameters, use stable sorting and reproducible data values; record generation time separately in metadata. Validate before replacing a published snapshot.

Acquisition is an explicit preparation step by default. `npm run dev`, `npm run build` and `npm run preview` must not ingest data or write production Cloudflare resources. Do not add remote bindings or scheduled ingestion without a documented project requirement.

See [the data project contract](../../docs/data-project-contract.md) and [release checklist](../../docs/checklists/data-release.md).
