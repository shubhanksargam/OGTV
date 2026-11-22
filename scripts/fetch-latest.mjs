// Builds js/latest.json for Latest Mix (channel 45, by request, 22 Nov 2026): the last two days' trending uploads of every
// YouTube channel OGTV draws on (the sources in scripts/feeds.json with a channel "id"; playlists are curated older
// videos and are left out), ranked by views per hour since posting, like a home page of what is taking off now.
// Each video meets the rules its channel's sources set (match/skip, length, the category's Bhojpuri and South rules,
// no trailers), plays in an embed, is public, not live, not age-restricted and not blocked in India; blocked uploaders
// and refused videos never appear, nor Shorts. At most 3 a channel, 120 in all.
// Each channel's RSS feed (no API quota) lists its latest 15 uploads with their views; a feed that fails falls back to
// the uploads list through the Data API (YT_API_KEY, at most API_BUDGET calls a run), else last run's videos stay.
// Details come from the Data API (1 unit for 50 videos), else (no key, as on a computer) from each watch page.
// Runs hourly (.github/workflows/refresh-news.yml). Usage: node scripts/fetch-latest.mjs
import {readFile, writeFile} from "node:fs/promises";
import {roman} from "./roman.mjs";
import {BHOJPURI, BIHAR_FOLK, SOUTH_TITLE, SOUTH_AUTHOR} from "./feed-rules.mjs";

const ROOT = new URL("..", import.meta.url), OUT = new URL("js/latest.json", ROOT);
const KEY = process.env.YT_API_KEY, API_BUDGET = 150, WINDOW = 2 * 86400e3, PER_CHANNEL = 3, TOTAL = 120;
const HEADERS = {"accept-language": "en-IN,en;q=0.9", cookie: "SOCS=CAI; CONSENT=YES+1",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const {feeds, blockChannels = [], blockVideos = [], noSouthIn = [], noBhojpuriIn = [], strictNoBhojpuriIn = []} = JSON.parse(await readFile(new URL("scripts/feeds.json", ROOT), "utf8"));
const refused = await readFile(new URL("scripts/refused.json", ROOT), "utf8").then(JSON.parse).catch(() => ({}));
const BLOCKED = new Set(blockChannels.map(s => s.toLowerCase())), NO_VIDEO = new Set([...blockVideos, ...Object.keys(refused)]);
const NO_SOUTH = new Set(noSouthIn), NO_BHOJPURI = new Set(noBhojpuriIn), STRICT_BHOJPURI = new Set(strictNoBhojpuriIn);
const prev = await readFile(OUT, "utf8").then(JSON.parse).catch(() => ({items: []}));
const now = Date.now();

// The channels, each with the sources (and so the rules) it appears under
const channels = new Map();
for (const f of feeds) if (f.id && !f.route) { if (!channels.has(f.id)) channels.set(f.id, []); channels.get(f.id).push(f) }

async function get(url, tries = 2) {
  for (let i = 1; ; i++) {
    try { const r = await fetch(url, {headers: HEADERS}); if (r.ok) return r.text(); throw Object.assign(new Error("HTTP " + r.status), {status: r.status}) }
    catch (e) { if (i >= tries || e.status === 404) throw e; await sleep(800 * i) }
  }
}
const unxml = s => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
// The latest uploads of a channel: [{id, pub (ISO), views?, title?}], Shorts left out
async function rss(channelId) {
  const xml = await get("https://www.youtube.com/feeds/videos.xml?channel_id=" + channelId);
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1]).filter(e => !e.includes("/shorts/"))
    .map(e => ({id: (e.match(/<yt:videoId>([^<]+)/) || [])[1], pub: (e.match(/<published>([^<]+)/) || [])[1],
      views: +((e.match(/<media:statistics views="(\d+)"/) || [])[1] || 0), title: unxml((e.match(/<media:title>([^<]*)/) || [])[1] || "")})).filter(e => e.id && e.pub);
}
let budget = API_BUDGET;
async function viaApi(channelId) { // the uploads without Shorts ("UULF…"), when the feed fails
  if (!KEY || budget <= 0) throw new Error("no API budget");
  budget--;
  const j = JSON.parse(await get(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=20&playlistId=UULF${channelId.slice(2)}&key=${KEY}`, 1));
  return (j.items || []).map(it => ({id: it.contentDetails.videoId, pub: it.contentDetails.videoPublishedAt})).filter(e => e.pub);
}

// 1. Every channel's uploads of the last two days (a few at a time)
const fresh = new Map(), failed = [];
const ids = [...channels.keys()];
for (let i = 0; i < ids.length; i += 6) {
  await Promise.all(ids.slice(i, i + 6).map(async ch => {
    let list = null;
    try { list = await rss(ch) } catch { try { list = await viaApi(ch) } catch { failed.push(ch) } }
    if (list) for (const e of list) if (now - Date.parse(e.pub) <= WINDOW && !NO_VIDEO.has(e.id)) fresh.set(e.id, {...e, ch});
  }));
  await sleep(150);
}

// 2. Their details: length, whether they play here, views (the API's are current)
const iso = d => { const m = (d || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || []; return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0) };
const inIndia = rr => !rr || (rr.allowed ? rr.allowed.includes("IN") : !(rr.blocked || []).includes("IN"));
const info = new Map();
if (KEY) {
  const all = [...fresh.keys()];
  for (let i = 0; i < all.length; i += 50) {
    const j = JSON.parse(await get("https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status,statistics&key=" + KEY + "&id=" + all.slice(i, i + 50).join(",")));
    for (const it of j.items || []) info.set(it.id, {sec: iso(it.contentDetails.duration), title: it.snippet.title, author: it.snippet.channelTitle, pub: it.snippet.publishedAt,
      views: +(it.statistics?.viewCount || 0), text: (it.snippet.tags || []).join(", ") + " " + (it.snippet.description || ""),
      ok: it.status.embeddable && it.status.privacyStatus === "public" && it.snippet.liveBroadcastContent === "none" && !it.contentDetails.contentRating?.ytRating && inIndia(it.contentDetails.regionRestriction)});
  }
} else { // a computer without the key: the watch pages of the likeliest 250 (by the feed's own views per hour)
  const vph = e => e.views / Math.max(1, (now - Date.parse(e.pub)) / 3600e3);
  const top = [...fresh.values()].sort((a, b) => vph(b) - vph(a)).slice(0, 250);
  for (let i = 0; i < top.length; i += 4) await Promise.all(top.slice(i, i + 4).map(async e => {
    try {
      const html = await get("https://www.youtube.com/watch?v=" + e.id), m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var |<\/script>)/s);
      if (!m) return; const p = JSON.parse(m[1]), v = p.videoDetails || {}, ps = p.playabilityStatus || {}, mf = p.microformat?.playerMicroformatRenderer || {};
      info.set(e.id, {sec: +v.lengthSeconds || 0, title: v.title || e.title, author: v.author || "", pub: e.pub, views: +v.viewCount || e.views,
        text: (v.keywords || []).join(", ") + " " + (v.shortDescription || ""),
        ok: ps.status === "OK" && ps.playableInEmbed === true && !v.isLiveContent && !v.isUpcoming && mf.isFamilySafe !== false});
    } catch {}
  }));
}

// 3. The rules of the channel's sources (any one of them taking it is enough), as scripts/fetch-feeds.mjs applies them
const clean = t => roman(t).replace(/#\S+/g, "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
function takenBy(e, d) {
  if (!d || !d.ok || BLOCKED.has((d.author || "").toLowerCase())) return null;
  const min = Math.ceil(d.sec / 60);
  if (/\b(official )?(trailer|teaser)\b/i.test(d.title)) return null; // trailers play only on Trailers
  for (const f of channels.get(e.ch)) {
    if (min < (f.minMin ?? 3) || min > (f.maxMin ?? 60)) continue;
    if ((f.match && !new RegExp(f.match, "i").test(d.title)) || (f.skip && new RegExp(f.skip, "i").test(d.title))) continue;
    if (NO_SOUTH.has(f.cat) && (SOUTH_TITLE.test(d.title) || SOUTH_AUTHOR.test(d.author || ""))) continue;
    if (NO_BHOJPURI.has(f.cat) && BHOJPURI.test(d.title + " " + (d.author || ""))) continue;
    if (STRICT_BHOJPURI.has(f.cat) && (BIHAR_FOLK.test(d.title) || BHOJPURI.test(d.text) || BIHAR_FOLK.test(d.text))) continue;
    return f;
  }
  return null;
}
const picked = [];
for (const e of fresh.values()) {
  const d = info.get(e.id), f = takenBy(e, d); if (!f) continue;
  const t = clean(d.title); if (!t) continue;
  picked.push({id: e.id, t, src: d.author || f.src.replace(/:.*$/, ""), cat: f.cat, lang: f.lang, min: Math.ceil(d.sec / 60), sec: d.sec, pub: new Date(Date.parse(d.pub || e.pub)).toISOString().slice(0, 19) + "Z", views: d.views, y: e.ch});
}
// a channel whose feed failed keeps last run's videos (still within the two days)
for (const v of prev.items || []) if (failed.includes(v.y) && now - Date.parse(v.pub) <= WINDOW && !picked.some(x => x.id === v.id)) picked.push(v);

// 4. Trending: views per hour since posting; at most PER_CHANNEL from a channel
const vph = v => v.views / Math.max(1, (now - Date.parse(v.pub)) / 3600e3);
picked.sort((a, b) => vph(b) - vph(a) || a.id.localeCompare(b.id));
const per = new Map(), items = [];
for (const v of picked) { const n = per.get(v.y) || 0; if (n >= PER_CHANNEL) continue; per.set(v.y, n + 1); items.push(v); if (items.length >= TOTAL) break }

await writeFile(OUT, JSON.stringify({at: new Date(now).toISOString().slice(0, 19) + "Z", items}, null, 0).replace(/\},\{/g, "},\n{") + "\n");
console.log(`${channels.size} channels: ${fresh.size} uploads in the last two days, ${picked.length} fit, ${items.length} written to js/latest.json`
  + `${failed.length ? `; ${failed.length} feeds unread (kept last run's)` : ""}; API calls for failed feeds: ${API_BUDGET - budget}`);
if (items.length < 20) { console.log("Too few videos: something is wrong with the feeds"); process.exitCode = 1 }
