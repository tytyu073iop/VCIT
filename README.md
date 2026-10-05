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

### Running without an AI

`deno task dev` sets `USE_MOCK_AI=true`, so it serves a canned page and needs no
API key or network access. To run against OpenRouter instead:

```sh
deno task dev:real
```

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
  `secretsAdapter.ts` (not needed when `USE_MOCK_AI` is on).
- `USE_MOCK_AI=true` (or `1`) selects `MockAiChat` via `createAiChat` in
  `aiChatFactory.ts`; any other value keeps the OpenRouter chat.
- The real run needs `--allow-env` and `--allow-read` in addition to
  `--allow-net` (see the Dockerfile CMD). The `dev` task grants
  `--allow-net --allow-env`.
- `@openrouter/sdk` has an allowed postinstall script (`allowScripts` in
  `deno.json`).
- `deno.lock` is committed and copied by the Dockerfile for reproducible
  installs.
