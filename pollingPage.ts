import { noSiteError } from "./texts.ts";

/**
 * Returns the HTML for a page that polls `/isready/:id` until the site is
 * ready, then redirects to `/site/:id`.
 *
 * @param id - The id of the site to poll.
 */
export const pollingPage = (id: string): string =>
  `<!DOCTYPE html>
<div><div>Loading</div><div id="dots"></div></div>
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
      if (res.status === 404) {
        document.body.textContent = "${noSiteError()}";
        return;
      }
      const data = await res.json();
      if (data.ready) {
        window.location.href = "/site/${id}";
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  })();
</script>`;
