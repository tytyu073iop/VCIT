import express from "express";
import { renderToString } from "preact-render-to-string";

const app = express();

interface siteObj {
  isready: boolean;
  site: string;
}

let siteMap: Map<string, siteObj> = new Map();

const LoadingScreen = () => {
  return <div><div>Loading</div><div id="dots"></div></div>;
};

// ✅ use res.send(), not return
app.get("/", (req, res) => {
  res.send("enter prompt like this http://site/prompt");
});

function startRenderSite(prompt) {
  const id = crypto.randomUUID();

  setTimeout(() => siteMap.set(id, {isready: true, site: `this is site for ${prompt}`}), 5000);

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