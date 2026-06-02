FROM denoland/deno:latest

WORKDIR /app

# Copy manifests first so the dependency install layer caches across
# source-only edits
COPY deno.json deno.lock package.json* ./
RUN deno ci --prod --skip-types

# Then copy the rest of the source
COPY . .

EXPOSE 8000

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "main.tsx"]
