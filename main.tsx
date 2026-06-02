import express from "express";
import { renderToString } from "preact-render-to-string";
import * as texts from "./texts.ts";
import { SiteLifeCycle } from "./SiteLifeCycle.ts";
import { SiteRepositoryImpl } from "./SiteRepositoryImpl.ts";
import { AiChat } from "./renderSite.ts";
// @ts-types="npm:@types/express"

export const app = express();
export const siteLifeCycle = new SiteLifeCycle(new SiteRepositoryImpl());

const LoadingScreen = () => {
  return <div><div>Loading</div><div id="dots"></div></div>;
};

app.get("/", (_req, res) => {
  res.contentType("text/html");
  res.send(texts.instruction());
});

export const aiChat = new AiChat();

function startRenderSite(prompt: string, renderSiteF: (prompt: string) => Promise<string> = aiChat.renderSite): string {
  const id = siteLifeCycle.beginSiteCreation();
  
  renderSiteF(prompt).then(res => {console.log(`${id} is ready`); siteLifeCycle.setSiteContent(id, res); Deno.writeTextFile("./test.html", res);});
  
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
      switch (data) {
        case ("${texts.True()}"):
          window.location.href = "/site/${id}";
          return;
        case ("${texts.False()}"):
          break;
        case ("${texts.noSiteError()}"):
          document.body.setHTML("no site, refresh");
          return;
      }
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
  res.contentType('json');
  try {
    res.send(JSON.stringify(siteLifeCycle.isSiteReady(req.params.id) ? texts.True() : texts.False()));
  } catch(_error) {
    res.send(JSON.stringify(texts.noSiteError()));
  }
});

app.get("/site/:id", (req, res) => {
  const site = siteLifeCycle.getSite(req.params.id);
  if (site == null) {
    res.send(texts.noSiteError());
    return
  }
  
  res.send(site.getContent());
});

app.listen(8000);
console.log(`Server is running on http://localhost:8000`);