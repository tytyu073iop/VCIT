# VCIT

A Deno web app that turns any prompt into an AI-generated HTML page. Enter a
prompt in the URL, and the server asks OpenRouter to generate a complete,
self-contained HTML page for it.

## How it works

1. Visit `http://localhost:8000/<prompt>`. The server starts an async AI render
   and immediately returns a polling page.
2. The polling page repeatedly calls `/isready/:id` until the render finishes.
3. Once ready, the browser is redirected to `/site/:id`, which serves the
   generated HTML.

Sites are stored in an in-memory `Map`, so all generated pages are lost on
restart.

## Requirements

- [Deno](https://deno.com) (or Docker)
- `OPENROUTER_API_KEY` environment variable (from
  [OpenRouter](https://openrouter.ai))

## Running

```sh
export OPENROUTER_API_KEY=...
deno task dev
```

Then open `http://localhost:8000/your prompt here`.

### Docker

Create a `secrets.env` file (gitignored) with:

```
OPENROUTER_API_KEY=...
```

Then:

```sh
docker compose up
```

The app is served on port 8000.

## Tests

```sh
deno task test
```

## Environment / permissions

- `OPENROUTER_API_KEY` is required and read via `Deno.env.get` in
  `secretsAdapter.ts`.
- The real run needs `--allow-env` and `--allow-read` in addition to
  `--allow-net` (see the Dockerfile CMD). The `dev` task only grants
  `--allow-net`, so under `deno task dev` the API key is not accessible.
- `@openrouter/sdk` has an allowed postinstall script (`allowScripts` in
  `deno.json`).
- `deno.lock` is committed and copied by the Dockerfile for reproducible
  installs.
