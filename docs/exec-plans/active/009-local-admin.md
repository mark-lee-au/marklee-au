# 009 Admin and publishing controls

## Stage and source

Stage 1: local editorial prototype, not a production admin service. Supplied snapshot: clean `main` at `d1efaea9c02f239b33b5f954ea5c02df524ee886`. The ZIP does not include private fuel data, credentials, a database, a Cloudflare deployment configuration or an active game statistics service. Keep the existing static Astro deployment intact.

## Goal

Provide a private `/mladmin` editing workflow covering homepage cards and examples, project section/maturity/visibility and local accounts. Later stages should manage Formula Daily content and publication dates, followed by measured visitor/game reports and an approved production backend.

## Implemented: local stage

- `npm run admin:reset` creates or resets the reserved `mark` account using a newly generated password displayed only in the local terminal. Salted scrypt password hashes and the other accounts live in ignored `data/processed/mladmin/users.json`; never commit, zip, or place this directory under `public/`. Stop the server before running a reset to avoid competing file writes.
- `npm run admin:dev` serves `http://127.0.0.1:4322/mladmin` from a separate loopback-only Node server, with no public site navigation link. The editor is **not** served at `https://marklee.au/mladmin` or at Astro's port 4321. Passwords, account records and session tokens are not embedded in the static Astro build. HTTP is suitable only on localhost. Do not port-forward or expose this server to the internet.
- The main admin can create accounts, select homepage/projects/games permissions, change permissions, delete accounts and issue fresh passwords. It cannot be deleted or demoted in the browser. Locally resetting `mark` invalidates existing sessions. Other users cannot access the accounts API. Games permission is reserved for the later game controls.
- Session cookies are HTTP-only and SameSite Strict; the server validates request origin, CSRF tokens and its loopback Host. Login attempts are limited and all routes return no-store and restrictive browser security headers. Sessions expire after eight hours and disappear on restart. This is **local prototype security only**, not a reviewed internet-facing authentication solution.
- A single committed `src/data/site-admin.json` holds **public editorial settings only**: section order, per-section example project slugs and project overrides for category, status, visibility, card order and an optional UPDATED badge. The original project Markdown is left untouched. Astro applies these settings at build time. Changes to this JSON must be reviewed and committed like code before any approved public build. The server rejects stale edits and invalid slugs/metadata; example entries move out of a previous section when a project's category changes.
- Visibility is separate from maturity. Hidden projects disappear from `getProjects()`, including their generated project route on a fresh build. Production `npm run build` now follows Astro with `scripts/build/prune-hidden-projects.mjs`, which also removes stale built routes and matching `dist/data/<slug>/` directories for explicitly hidden projects. This protects the static deployment from locally present ignored project datasets, but visibility is still not secret-management or access control for material already published elsewhere, cached externally or present in Git history.
- The editor shows the full project list in the supplied Markdown collection. It may move a project into any existing category when explicitly chosen by the owner; the site's normal taxonomy still places games in GAMES and unfinished data/map work in LAB. A status or UPDATED badge is editorial metadata, not permission to publish a data source.

## Usage on Windows PowerShell

Apply the ZIP at the repository root **only after comparing any changed files with the newer local tree**. The attached snapshot has no Git metadata, so no live upstream comparison was possible.

```powershell
npm run admin:reset
npm run admin:dev
```

Open `http://127.0.0.1:4322/mladmin`, sign in as `mark` with the one-time password printed by the reset command, and keep that terminal open. In another terminal, run `npm run dev` and open `http://localhost:4321/` to review the public homepage. The admin is a separate local port by design. When you save, `src/data/site-admin.json` changes. Refresh the public preview if hot reload has not already picked it up. Do not commit `data/processed/mladmin/` or share its contents. A later `npm run admin:reset` replaces the main admin password if you forget it.

## Deferred decisions, in order

1. **Production backend and identity.** Confirm the actual existing Cloudflare Worker source and deployment configuration. Design `/mladmin` and `/mladmin/api/*` routes protected by a Worker with D1 (or a justified alternative) for users, sessions, editorial drafts and audit records. Add production recovery via a separate controlled administrative workflow, never a public reset endpoint. Plan credential migration rather than copying local password hashes or local accounts into production. Do not add public routing or change Cloudflare bindings without explicit approval.
2. **Editorial publishing.** Separate drafts from approved public content, introduce revisions and audit history, and choose a reviewed publication path. Options include a Git-backed change request or a Worker-backed public content API. A static Astro build cannot instantly reflect edits saved in an online database; moving to real-time content would require a deliberate dynamic read strategy or triggering an approved rebuild.
3. **Formula Daily.** Replace the current hard-coded sample with versioned puzzle definitions, a validated authoring preview, a five-puzzle daily set, an Adelaide-local publication boundary and a scheduler. Validate permitted pieces and expected values without shipping a single canonical answer. Schedule and publish only reviewed puzzles; do not silently alter old daily sets after players have used them.
4. **Analytics.** Specify privacy-minded aggregate visit and play events, no raw formulas or identifying data unless separately agreed, opt-out and retention. Separate total visits from unique visitors, starts, completed games, per-question success, attempts and score distributions. Do not fabricate statistics or claim that this prototype collects them. Review rate limiting, abuse and consent before internet-facing collection.

## Local test coverage

`npm run admin:test` uses a temporary private account directory and temporary editorial JSON; it tests first-use login, failure paths, CSRF, project moves, saved examples, stale edit rejection, role restrictions, password reset, account deletion and main-account recovery. It never modifies the user's actual admin accounts or real site settings. Run `npm run build` separately with installed dependencies on the user's machine, and inspect the homepage, collection routes and local admin at desktop and mobile sizes. No live Cloudflare routing, worker/storage provisioning, browser visual QA or actual game metrics are part of this stage.
