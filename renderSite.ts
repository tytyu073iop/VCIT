import { OpenRouter } from "@openrouter/sdk";
import { SECRET_OPENROUTER_API_KEY } from "./secretsAdapter.ts";

export class AiChat {
    openrouter: OpenRouter;

    constructor() {
        this.openrouter = new OpenRouter({
  apiKey: SECRET_OPENROUTER_API_KEY
});
    }

    renderSite = async (prompt: string): Promise<string> => {
  console.log("request sent");
  const responce = await this.openrouter.chat.send({
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
  return responce.choices[0].message.content;
}
}