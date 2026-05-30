import express from "express";
import { renderToString } from "preact-render-to-string";
import { OpenRouter } from "@openrouter/sdk";
import { SECRET_OPENROUTER_API_KEY } from "./secretsAdapter.ts";
import * as texts from "./texts.ts";
// @ts-types="npm:@types/express"

const openrouterApiKey = SECRET_OPENROUTER_API_KEY

export const app = express();

interface siteObj {
  isready: boolean;
  site: string;
}

const openrouter = new OpenRouter({
  apiKey: openrouterApiKey
});

async function renderSite(prompt: string) {
  console.log("request sent");
  const responce = await openrouter.chat.send({
    chatRequest: {
    model: "openrouter/free",
    messages: [
      {
        role: "user",
        content: `You are an expert frontend developer. Generate a complete, self-contained HTML page that fulfills the user's request.
Rules:
- Output ONLY the raw HTML (no markdown, no extra text, even \`\`\`html).
- The page must be fully functional, beautiful, and responsive.
- Use inline CSS or <style> tags. Use modern JavaScript (ES6+).
- If the user asks for interactive elements (forms, buttons, charts, etc.), implement them fully.
- IMPORTANT: To support "prompt links", any clickable link that should generate a new page MUST point to the same server, e.g. href="/new prompt here". The server will automatically replace spaces with %20. Example: <a href="/what is the capital of France">Click me</a>.
- Do include <html>, <head>, <body> wrappers
- You may include external libraries (e.g. Chart.js, Three.js) via CDN if needed.
- Make the page visually appealing, with a dark/light theme or modern design.
request: ${prompt}`
      }
    ],
    stream: false
}});
  console.log("request done");  
  return responce;
}

const siteMap: Map<string, siteObj> = new Map();

const LoadingScreen = () => {
  return <div><div>Loading</div><div id="dots"></div></div>;
};

app.get("/", (_req, res) => {
  res.contentType("text/html");
  res.send(texts.instruction());
});

function startRenderSite(prompt: string) {
  const id = crypto.randomUUID();
  
  renderSite(prompt).then(res => {console.log(JSON.stringify(res)); siteMap.set(id, {isready: true, site: res.choices[0].message.content}); Deno.writeTextFile("./test.html", res.choices[0].message.content);});
  
  return id;
}

app.get("/:prompt", (req, res) => {
  const prompt = req.params.prompt;
  const id = startRenderSite(prompt);
  
  const html = `<!DOCTYPE html>
  ${renderToString(<LoadingScreen />)}
<script>
  let dots = document.getElementById("dots");
  let count = 3;
  setInterval(() => {
    count = (count + 1) % 4;
    if (dots) dots.textContent = ".".repeat(count);
  }, 400);
  
  (async () => {
    while (true) {
      const res = await fetch("/isready/${id}");
      const data = await res.json();
      if (data.isready) {
        window.location.href = "/site/${id}";
        break;
      }
      console.log("site not ready");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  })();
</script>`;
  res.send(html);
});

app.get("/isready/:id", (req, res) => {
  const entry = siteMap.get(req.params.id);
  res.json(entry || { isready: false, site: "" });
});

app.get("/site/:id", (req, res) => {
  res.send(siteMap.get(req.params.id)?.site);
});

app.listen(8000);
console.log(`Server is running on http://localhost:8000`);