// IndexNow: tells search engines (Bing, and through IndexNow also Yandex, Seznam and Naver) that the site's pages have
// changed, so they read them again within hours rather than weeks. Bing's index is what ChatGPT search and Copilot
// answer from. The key proves the site is ours: it is the file d0971dbe7e7d715dcc6dedabce59e0cc.txt at the site's root.
// Run after a deploy (the nightly refresh-feeds.yml does): node scripts/indexnow.mjs
import {readFileSync} from "node:fs";
const KEY = "d0971dbe7e7d715dcc6dedabce59e0cc", HOST = "ogtv.co.in";
const sitemap = readFileSync(new URL("../sitemap.xml", import.meta.url), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).concat([`https://${HOST}/llms.txt`, `https://${HOST}/llms-full.txt`]);
const r = await fetch("https://api.indexnow.org/indexnow", {method: "POST", headers: {"content-type": "application/json; charset=utf-8"},
  body: JSON.stringify({host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls})});
console.log(`IndexNow: ${r.status} ${r.statusText} for ${urls.length} addresses`); // 200 or 202: accepted
if (r.status >= 400) process.exitCode = 1;
