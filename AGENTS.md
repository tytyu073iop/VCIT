# AGENTS.md

Deno web app (not Node): an Express server that turns any prompt into an
AI-generated HTML page (OpenRouter). All source is in the repo root; there is no
`src/` tree.

## Commands

- `deno task dev` — start/watch server (`deno run --watch --allow-net main.ts`)
- `deno test` — run tests (integration-style, see below)
- `docker compose up` — build + run on port 8000

## Environment / permissions

- `OPENROUTER_API_KEY` env var is required (`secretsAdapter.ts` reads it via
  `Deno.env.get`). For local runs provide it; `compose.yml` loads it from
  `secrets.env` (gitignored, not committed).
- The real run needs `--allow-env` and `--allow-read` in addition to
  `--allow-net` (see `Dockerfile` CMD). The `dev` task only grants
  `--allow-net`, so under `deno task dev` the API key is NOT accessible.
- `deno.lock` is committed; `Dockerfile` does `COPY deno.json deno.lock ...`
  for reproducible installs. Regenerate it (`deno install` / `deno ci`) after
  changing dependencies.

## Architecture

- `main.ts` — entrypoint. Exports `app`, `siteLifeCycle`, `aiChat` (exported
  only so tests can import them).
- Routes: `/` instruction; `/:prompt` kicks off an async AI render and returns a
  polling page; `/isready/:id` readiness poll; `/site/:id` rendered HTML.
- `renderSite.ts` — `AiChat` wrapper around `@openrouter/sdk`.
- `SiteLifeCycle.ts` + `SiteRepositoryImpl.ts` — creation/readiness; storage is
  an in-memory `Map`, so sites are lost on restart.
- `@openrouter/sdk` has an allowed postinstall script (`allowScripts` in
  `deno.json`).

## Testing quirks

- Tests import `app` from `main.ts`, which runs `app.listen(8000)` and
  constructs `aiChat` at module load (side effects on import).
- Tests use `supertest` against the exported `app` and monkeypatch methods on
  `siteLifeCycle` / `aiChat`; they must restore the original (`original`) after
  each test.
