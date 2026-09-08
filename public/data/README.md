# Public browser data

Every file in this directory, including this README, is publicly accessible after deployment. Use `<project-slug>/` for compact, approved browser exports and their `metadata.json`. No project dataset has been published yet.

Only include fields required by the visualisation. Never include secrets, raw downloads, private or employer data, commercially sensitive data, or personal information. Keep local raw and intermediate files outside `public/`.

Files are served at `/data/<project-slug>/<filename>` during local development and copied into `dist/data/` for deployment. Directory placement does not validate provenance: review the data release checklist before publishing.
