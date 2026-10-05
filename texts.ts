/** Instruction shown on the root page. */
export const instruction = () => "enter prompt like this http://site/prompt";

/** Error message for an unknown site id. */
export const noSiteError = () => "no site";

/** Error message returned when a render could not be started at all. */
export const renderStartError = () => "could not start rendering site";

/** The literal string "true". */
export const True = () => "true";

/** The literal string "false". */
export const False = () => "false";

/** The OpenRouter model id used for rendering. */
export const openrouterModel = () => "openrouter/free";

/**
 * Escapes text so it can be embedded in HTML markup.
 *
 * @param text - The raw text.
 */
export const escapeHtml = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Builds the canned HTML page returned by the mock AI chat. */
export const mockSite = (prompt: string): string =>
  `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>mock: ${escapeHtml(prompt)}</title></head>
<body>
<h1>mock page</h1>
<p>This page was generated locally by the mock AI chat; no AI was called.</p>
<p>prompt: <code>${escapeHtml(prompt)}</code></p>
</body>
</html>`;

/**
 * Builds the system prompt that instructs the model to produce a complete,
 * self-contained HTML page for the user's request.
 *
 * @param prompt - The user's request.
 */
export const renderSitePrompt = (prompt: string): string =>
  `You are an expert frontend developer. Generate a complete, self-contained HTML page that fulfills the user's request.
Rules:
- Output ONLY the raw HTML (no markdown, no extra text, even \`\`\`html).
- The page must be fully functional, beautiful, and responsive.
- Use inline CSS or <style> tags. Use modern JavaScript (ES6+).
- If the user asks for interactive elements (forms, buttons, charts, etc.), implement them fully.
- IMPORTANT: To support "prompt links", any clickable link that should generate a new page MUST point to the same server, e.g. href="/new prompt here". The server will automatically replace spaces with %20. Example: <a href="/what is the capital of France">Click me</a>.
- Do include <html>, <head>, <body> wrappers
- You may include external libraries (e.g. Chart.js, Three.js) via CDN if needed.
- Make the page visually appealing, with a dark/light theme or modern design.
request: ${prompt}`;
