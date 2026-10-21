// Builds the pages search engines read: a landing page per channel (tv/<slug>/), the "All channels"
// directory on the home page, the home page's search tags, sitemap.xml and robots.txt.
// Run after changing channels or sources: node scripts/build-pages.mjs
import {readFile, writeFile, mkdir, rm} from "node:fs/promises";

const ROOT = new URL("..", import.meta.url);
const SITE = "https://ogtv.thebharat.si";
const read = p => readFile(new URL(p, ROOT), "utf8");
const CHANNELS = new Function((await read("js/channels.js")) + ";return CHANNELS")();
const feedSrc = await read("js/feeds.js");
const FEED = JSON.parse(feedSrc.slice(feedSrc.indexOf("["), feedSrc.lastIndexOf("]") + 1));
const today = new Date().toISOString().slice(0, 10);

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const slug = c => c.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The creators a channel actually plays, most videos first: the words people search for
function sources(c) {
  const cats = new Set(c.festival ? FEED.filter(v => v.cat.startsWith("fest-")).map(v => v.cat)
    : c.parts.flatMap(p => [].concat(p.cat, p.alt || [])));
  const n = {};
  for (const v of FEED) if (cats.has(v.cat) && !/playlist|songs \d|: /i.test(v.src)) n[v.src] = (n[v.src] || 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 8);
}
// The video a channel page tells search engines about: the channel's newest dated upload (changes daily)
function featured(c) {
  const cats = new Set(c.festival ? FEED.filter(v => v.cat.startsWith("fest-")).map(v => v.cat)
    : c.parts.flatMap(p => [].concat(p.cat, p.alt || [])));
  const vids = FEED.filter(v => cats.has(v.cat) && v.id && v.min > 0);
  return vids.filter(v => v.pub).sort((x, y) => Date.parse(y.pub) - Date.parse(x.pub))[0] || vids[0] || null;
}
const isoDate = v => new Date(v && v.pub && !isNaN(Date.parse(v.pub)) ? v.pub : today).toISOString();
const xml = t => String(t).replace(/[&<>"']/g, ch => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"}[ch]));
const rest = (names, text) => names.filter(n => !text.includes(n)); // sources the description has not named yet
const list = a => a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a.at(-1) : a.join("");
const LIVE = JSON.parse(await read("scripts/live.json")).groups;
// Channels whose sources don't tell their story get their own line
const WRITTEN = {
  aangan: "Aangan on OGTV: the family TV of an Indian home, in Hindi. Aarti, Doordarshan classics, kahaniyan, kavi sammelan, wildlife, Taarak Mehta, KBC and old songs.",
  festival: "Festivals on OGTV: each festival in its own tradition. Garba, Chhath geet, Gurbani, Braj Holi, qawwali, carols and bhajans, with the film favourites.",
};
function describe(c) {
  if (WRITTEN[c.key]) return WRITTEN[c.key];
  const names = c.live ? LIVE[c.live].map(x => x.src) : sources(c), what = c.live ? "Live streams from" : "Videos from";
  const en = /^(Olympics|Bollywood|DD|ISL|NPTEL|Coldplay|Punjabi|English|Hindi|Classic Hindi)\b/.test(c.en) ? c.en : c.en.charAt(0).toLowerCase() + c.en.slice(1); // names keep their capital
  const lead = `${c.name} on OGTV: ${en}, free and always on.`;
  for (let k = 4; k >= 0; k--) { // as many names as fit in a search snippet (~158 characters), never cut mid-word
    const d = k ? `${lead} ${what} ${list(names.slice(0, k))}.` : lead;
    if (d.length <= 158 || !k) return d;
  }
}

const HOME = {
  title: `OGTV: Free Indian TV App, ${CHANNELS.length} Live Channels Online`,
  description: `OGTV is a free Indian TV app: ${CHANNELS.length} always-on channels in Hindi & English. Live news, cricket, Olympics, Bollywood, bhajans, KBC and Taarak Mehta. No sign-up.`,
};
// Questions people search for, answered on the home page (and marked up for search results)
const FAQ = [
  ["What is OGTV?", `OGTV is a free TV-style app for India: ${CHANNELS.length} always-on channels built from official YouTube uploads, from live news, cricket and the Olympics to Bollywood, bhajans, KBC, Taarak Mehta and documentaries, in Hindi and English. Open it and something is already playing.`],
  ["Is OGTV free?", "Yes. There is no sign-up and no subscription. Videos play from YouTube, so they work on any phone, laptop or smart TV with a browser."],
  ["Is OGTV a YouTube alternative?", "It is a different way to watch YouTube. Instead of searching and scrolling, you flip through channels like on TV, and every channel runs to a schedule, so everyone tuned in sees the same moment."],
  ["How is OGTV different from OTT apps like Netflix, Hotstar or JioCinema?", "OTT apps ask you to pick from a library and usually charge a subscription. OGTV is free live-style TV: channels that are always on, like cable TV, with no account and nothing to choose before watching."],
  ["Is there an OGTV app for phone or TV?", "Yes. Open ogtv.thebharat.si and choose Install app (or Add to Home screen) in your browser. It then opens full screen like an app on Android, iPhone, laptops and smart TVs."],
  ["Which channels does OGTV have?", "News, Knowledge, Sports, Lifestyle, Music and Entertainment: Just News, Khabar, Cricket, Khel, International Sports, Bhakti, Festivals, Sehat, Bollywood Now, Deccan Chargers, Raag, Gym, Aangan, Comedy, Fiction, Classics and more."],
];
function faqHtml() {
  return '<!-- faq:start (generated by scripts/build-pages.mjs) -->\n  <section class="faq" aria-labelledby="faq-h">\n    <h2 id="faq-h">Questions</h2>\n'
    + FAQ.map(([q, a]) => `    <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>\n`).join("")
    + '  </section>\n  <!-- faq:end -->\n  ';
}

function seoBlock({title, description, url, ch, video, chan}) {
  // name/alternateName/application-name: what Google shows as the site name (OGTV, not the domain thebharat.si)
  const site = {"@type": "WebSite", name: "OGTV", alternateName: ["OG TV", "OGTV India"], url: SITE + "/", description: HOME.description,
    inLanguage: ["hi", "en"], publisher: {"@type": "Organization", name: "OGTV", logo: SITE + "/img/og.png"}};
  const app = {"@type": "WebApplication", name: "OGTV", url: SITE + "/", applicationCategory: "EntertainmentApplication", operatingSystem: "Android, iOS, Windows, macOS, Smart TV browsers",
    offers: {"@type": "Offer", price: "0", priceCurrency: "INR"}, description: HOME.description, image: SITE + "/img/og.png"};
  const faq = {"@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({"@type": "Question", name: q, acceptedAnswer: {"@type": "Answer", text: a}}))};
  const vo = video && {"@type": "VideoObject", name: video.t, description: `${video.t}, now on ${chan.name}, a free always-on channel on OGTV.`,
    thumbnailUrl: [`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`], uploadDate: isoDate(video), duration: `PT${Math.max(1, Math.round(video.min))}M`,
    embedUrl: `https://www.youtube.com/embed/${video.id}`, inLanguage: video.lang || "hi"};
  const ld = ch ? (vo ? {"@context": "https://schema.org", "@graph": [site, vo]} : {"@context": "https://schema.org", ...site}) : {"@context": "https://schema.org", "@graph": [site, app, faq]};
  return `<!-- seo:start (generated by scripts/build-pages.mjs) -->
${ch ? '<base href="/">\n' : ""}<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="manifest" href="/manifest.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="OGTV">
<meta name="application-name" content="OGTV">
<meta name="apple-mobile-web-app-title" content="OGTV">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/img/og.png?v=3">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${ch ? `<script>window.OGTV_CH=${ch}</script>\n` : ""}<!-- seo:end -->`;
}

function directory() { // plain links grouped like the channel list
  let html = '<!-- channels:start (generated by scripts/build-pages.mjs) -->\n  <nav class="directory" aria-labelledby="dir-h">\n    <h2 id="dir-h">All channels</h2>\n    <div class="dir-grid">\n';
  const groups = [...new Set(CHANNELS.map(c => c.group || "OGTV"))];
  for (const g of groups) {
    html += `      <section><h3>${esc(g)}</h3><ul>\n`;
    for (const c of CHANNELS.filter(c => (c.group || "OGTV") === g))
      html += `        <li><a href="/tv/${slug(c)}/">${c.n} · ${esc(c.name)}</a> <span>${esc(c.en)}</span></li>\n`;
    html += "      </ul></section>\n";
  }
  return html + "    </div>\n  </nav>\n  <!-- channels:end -->";
}

const replaceBetween = (s, a, b, value) => {
  const i = s.indexOf(a), j = s.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error("markers missing: " + a);
  return s.slice(0, i) + value + s.slice(j + b.length);
};

let home = await read("index.html");
home = home.replace(/\s*<!-- faq:start[\s\S]*?<!-- faq:end -->\s*/g, "\n  "); // every old copy goes, whatever the line endings; channel pages never carry the questions
home = replaceBetween(home, "<!-- seo:start", "<!-- seo:end -->", seoBlock({...HOME, url: SITE + "/"}));
home = replaceBetween(home, "<!-- channels:start", "<!-- channels:end -->", directory());
home = home.replace(/<kbd>1<\/kbd>–<kbd>\d+<\/kbd>/, `<kbd>1</kbd>–<kbd>${CHANNELS.length}</kbd>`); // remote-keys hint
home = home.replace(/<span id="aboutChannels">\d+<\/span>/, `<span id="aboutChannels">${CHANNELS.length}</span>`);
const FEEDS = JSON.parse(await read("scripts/feeds.json")).feeds; // creators, channels and playlists, rounded down to the ten
home = home.replace(/<span id="aboutCreators">[^<]*<\/span>/, `<span id="aboutCreators">${Math.floor(new Set(FEEDS.map(f => f.id || f.playlist)).size / 10) * 10}+</span>`); // the real count in the page itself (search snippets read it)
await writeFile(new URL("index.html", ROOT), home.replace('<footer class="about"', faqHtml() + '<footer class="about"'));

await rm(new URL("tv/", ROOT), {recursive: true, force: true});
for (const c of CHANNELS) {
  const url = `${SITE}/tv/${slug(c)}/`, description = describe(c), s = c.live ? LIVE[c.live].map(x => x.src) : sources(c);
  let page = replaceBetween(home, "<!-- seo:start", "<!-- seo:end -->",
    seoBlock({title: `${c.name}: ${c.en} | OGTV free Indian TV`, description, url, ch: c.n, video: featured(c), chan: c}));
  // a short visible intro, unique to the page
  page = page.replace('<!-- channels:start', `<section class="seo-intro"><h2>${esc(c.name)} on OGTV</h2><p>${esc(description)}${rest(s, description).length ? ` Also on this channel: ${esc(list(rest(s, description)))}.` : ""}</p></section>\n\n  <!-- channels:start`);
  await mkdir(new URL(`tv/${slug(c)}/`, ROOT), {recursive: true});
  await writeFile(new URL(`tv/${slug(c)}/index.html`, ROOT), page);
  for (const old of c.oldSlugs || []) { // a renamed channel's old address forwards to the new one
    await mkdir(new URL(`tv/${old}/`, ROOT), {recursive: true});
    await writeFile(new URL(`tv/${old}/index.html`, ROOT), `<!doctype html><meta charset="utf-8"><title>${esc(c.name)} | OGTV</title>
<link rel="canonical" href="${url}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=/tv/${slug(c)}/">
<script>location.replace("/tv/${slug(c)}/"+location.search)</script><p>${esc(c.name)} has moved to <a href="/tv/${slug(c)}/">/tv/${slug(c)}/</a>.</p>
`);
  }
}

for (const gone of ["trailers"]) { // channels taken off air: their old pages forward to the home page
  await mkdir(new URL(`tv/${gone}/`, ROOT), {recursive: true});
  await writeFile(new URL(`tv/${gone}/index.html`, ROOT), `<!doctype html><meta charset="utf-8"><title>OGTV</title><link rel="canonical" href="${SITE}/"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=/"><script>location.replace("/")</script>\n`);
}
await writeFile(new URL("sitemap.xml", ROOT), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
${CHANNELS.map(c => { const v = featured(c); return `  <url><loc>${SITE}/tv/${slug(c)}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority>${v ? `
    <video:video><video:thumbnail_loc>https://i.ytimg.com/vi/${v.id}/hqdefault.jpg</video:thumbnail_loc><video:title>${xml(v.t)}</video:title>
      <video:description>${xml(`${v.t}, now on ${c.name}, a free always-on channel on OGTV.`)}</video:description>
      <video:player_loc>https://www.youtube.com/embed/${v.id}</video:player_loc><video:duration>${Math.round(v.min * 60)}</video:duration><video:publication_date>${isoDate(v)}</video:publication_date></video:video>` : ""}
  </url>`; }).join("\n")}
</urlset>
`);
await writeFile(new URL("robots.txt", ROOT), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`home + ${CHANNELS.length} channel pages, sitemap.xml, robots.txt written`);
