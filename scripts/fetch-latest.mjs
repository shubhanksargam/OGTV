// Builds js/latest.json for Latest Mix (channel 47, by request, 22 Nov 2026): the last two days' trending uploads of every
// YouTube channel OGTV draws on (the sources in scripts/feeds.json with a channel "id"; playlists are curated older
// videos and are left out), ranked by views per hour since posting, like a home page of what is taking off now.
// Each video meets the rules its channel's sources set (match/skip, length, the category's Bhojpuri and South rules,
// no trailers), plays in an embed, is public, not live, not age-restricted and not blocked in India; blocked uploaders
// and refused videos never appear, nor Shorts. The carousel has a section for each group (g: News, Knowledge, Sports,
// Lifestyle, Entertainment, Music), each with as many videos as the others (by request): the top 16 of each, or as many
// as the smallest group has; at most 3 from a channel, up to 6 in a group short of videos.
// Each channel's RSS feed (no API quota) lists its latest 15 uploads with their views; a feed that fails falls back to
// the uploads list through the Data API (YT_API_KEY, at most API_BUDGET calls a run), else last run's videos stay.
// Details come from the Data API (1 unit for 50 videos), else (no key, as on a computer) from each watch page.
// Runs hourly (.github/workflows/refresh-news.yml). Usage: node scripts/fetch-latest.mjs
import {readFile, writeFile} from "node:fs/promises";
import {readFileSync} from "node:fs";
import {roman} from "./roman.mjs";
import {BHOJPURI, BIHAR_FOLK, SOUTH_TITLE, SOUTH_AUTHOR} from "./feed-rules.mjs";

const ROOT = new URL("..", import.meta.url), OUT = new URL("js/latest.json", ROOT);
const KEY = process.env.YT_API_KEY, API_BUDGET = 150, WINDOW = 2 * 86400e3, PER_CHANNEL = 3, PER_GROUP = 16, SPARES = 6;
const HEADERS = {"accept-language": "en-IN,en;q=0.9", cookie: "SOCS=CAI; CONSENT=YES+1",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const {feeds, blockChannels = [], blockVideos = [], noSouthIn = [], noBhojpuriIn = [], strictNoBhojpuriIn = []} = JSON.parse(await readFile(new URL("scripts/feeds.json", ROOT), "utf8"));
const refused = await readFile(new URL("scripts/refused.json", ROOT), "utf8").then(JSON.parse).catch(() => ({}));
const BLOCKED = new Set(blockChannels.map(s => s.toLowerCase())), NO_VIDEO = new Set([...blockVideos, ...Object.keys(refused)]);
const NO_SOUTH = new Set(noSouthIn), NO_BHOJPURI = new Set(noBhojpuriIn), STRICT_BHOJPURI = new Set(strictNoBhojpuriIn);
const prev = await readFile(OUT, "utf8").then(JSON.parse).catch(() => ({items: []}));
const now = Date.now();
// A category's group: that of the channel playing it the most hours (js/channels.js); a fallback (alt) counts a little.
// Newsroom plays Paisa's videos too, but Paisa plays them all day, so they are Knowledge
const {CHANNELS} = new Function(readFileSync(new URL("js/channels.js", ROOT), "utf8") + ";return {CHANNELS}")();
const weight = new Map(), groupOf = new Map();
const add = (cat, g, w) => { if (typeof cat !== "string") return; const m = weight.get(cat) || new Map(); m.set(g, (m.get(g) || 0) + w); weight.set(cat, m) };
for (const c of CHANNELS) { if (c.menu) continue;
  if (c.festival) { for (const f of feeds) if (String(f.cat).startsWith("fest-")) add(f.cat, c.group, 24); continue }
  for (const p of c.parts || []) { const cats = [].concat(p.cat), h = p.to - p.from; cats.forEach(x => add(x, c.group, h / cats.length)); [].concat(p.alt || []).forEach(x => add(x, c.group, 0.1)) } }
for (const [cat, m] of weight) groupOf.set(cat, [...m].sort((a, b) => b[1] - a[1])[0][0]);
const GROUPS = [...new Set(CHANNELS.filter(c => !c.menu).map(c => c.group))];

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
  const top = [...fresh.values()].sort((a, b) => vph(b) - vph(a)).slice(0, +process.env.LATEST_PAGES || 250);
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
  picked.push({id: e.id, t, src: d.author || f.src.replace(/:.*$/, ""), g: groupOf.get(f.cat) || "Entertainment", cat: f.cat, lang: f.lang, min: Math.ceil(d.sec / 60), sec: d.sec, pub: new Date(Date.parse(d.pub || e.pub)).toISOString().slice(0, 19) + "Z", views: d.views, y: e.ch});
}
// a channel whose feed failed keeps last run's videos (still within the two days)
for (const v of prev.items || []) if (failed.includes(v.y) && now - Date.parse(v.pub) <= WINDOW && !picked.some(x => x.id === v.id)) picked.push(v);

// 4. Trending: views per hour since posting; at most PER_CHANNEL from a channel, the top PER_GROUP of each group
const views = v => v.views / Math.max(1, (now - Date.parse(v.pub)) / 3600e3);
// Sports: Indian cricket first (by request), then other cricket, then the rest, by weighted views per hour. Formula 1
// and LaLiga are left out: their embeds don't play in India (refused or stalled in viewers' browsers and in ours, 22 Nov)
const NO_EMBED_IN_INDIA = /^(formula 1|laliga)/i;
const CRICKET = /cricket|\bipl\b|\bt20i?\b|\bodi\b|test match|\bwpl\b|ranji|duleep|vijay hazare|mushtaq ali|wicket|century|innings|bowling|batting/i;
const INDIA = /\bindia|\bind\b|\bbcci\b|\bipl\b|\bwpl\b|ranji|duleep|vijay hazare|mushtaq ali|team india|kohli|virat|rohit|gill|bumrah|jadeja|pant|suryakumar|hardik|dhoni|shami|siraj|jaiswal|kl rahul|shreyas|ashwin|kuldeep|arshdeep|rinku|samson|abhishek sharma|tilak|smriti|harmanpreet|jemimah/i;
const INDIAN_CRICKET_SRC = /^(ipl|sony sports|star sports|fancode|bcci|jiostar|jiohotstar)/i;
const weightOf = v => { if (v.g !== "Sports") return 1; const s = v.t + " " + v.src, cricket = v.cat === "cricket" || CRICKET.test(s);
  return cricket && (INDIA.test(s) || INDIAN_CRICKET_SRC.test(v.src)) ? 5 : cricket ? 1.5 : 1 };
for (let i = picked.length - 1; i >= 0; i--) if (NO_EMBED_IN_INDIA.test(picked[i].src || "")) picked.splice(i, 1);
// The same video in several languages (Sony Sports' highlights: "| Hindi |", "| English |", "| Kannada |"): OGTV plays
// Hindi and English, and one of them is enough (the one with more views per hour, kept below). A language only when it
// labels the title ("| Tamil |", "(Tamil)"), never a place ("Tamil Nadu")
const LANG_LABEL = l => new RegExp(`(^|[|(\\[])\\s*(${l})\\s*(?=$|[|)\\]])`, "gi"), OTHER_LANG = LANG_LABEL("kannada|tamil|telugu|malayalam|bengali|marathi|gujarati|odia|bangla"), ANY_LANG = LANG_LABEL("hindi|english|kannada|tamil|telugu|malayalam|bengali|marathi|gujarati|odia|bangla");
for (let i = picked.length - 1; i >= 0; i--) if (new RegExp(OTHER_LANG.source, "i").test(picked[i].t)) picked.splice(i, 1);
const sameVideo = v => v.y + "|" + v.t.replace(ANY_LANG, "$1").toLowerCase().replace(/[^a-z0-9]/g, "");
for (const v of picked) if (!v.g) v.g = groupOf.get(v.cat) || "Entertainment";
const vph = v => views(v) * weightOf(v);
picked.sort((a, b) => vph(b) - vph(a) || a.id.localeCompare(b.id));
{ const seen = new Set(); for (let i = 0; i < picked.length; i++) { const k = sameVideo(picked[i]); if (seen.has(k)) picked.splice(i--, 1); else seen.add(k) } }
const byGroup = new Map();
for (const v of picked) { if (!v.g) v.g = groupOf.get(v.cat) || "Entertainment"; if (!byGroup.has(v.g)) byGroup.set(v.g, []); byGroup.get(v.g).push(v) } // in trending order
const upTo = (list, cap) => { const per = new Map(), out = []; for (const v of list) { const n = per.get(v.y) || 0; if (n < cap) { per.set(v.y, n + 1); out.push(v) } } return out };
const avail = new Map([...byGroup].map(([g, list]) => { const t = upTo(list, PER_CHANNEL); return [g, t.length >= PER_GROUP ? t : upTo(list, 6)] }));
const N = Math.min(PER_GROUP, ...[...avail.values()].map(l => l.length)), inGroup = new Map([...avail.keys()].map(g => [g, N]));
// and up to SPARES more of each group, marked spare: a browser that can't play one of the N plays the next instead, so
// every group keeps the same number (js/app.js, latestItems)
const items = [...avail.values()].flatMap(l => [...l.slice(0, N), ...l.slice(N, N + SPARES).map(v => ({...v, spare: 1}))]).sort((x, y) => vph(y) - vph(x) || x.id.localeCompare(y.id));

// too few (YouTube refusing this machine, feeds down): the last list stays rather than an empty one
if (items.filter(v => !v.spare).length < 20) { console.log(`Only ${items.length} videos fit: js/latest.json left as it was`); process.exit(1) }
await writeFile(OUT, JSON.stringify({at: new Date(now).toISOString().slice(0, 19) + "Z", n: N, items}, null, 0).replace(/\},\{/g, "},\n{") + "\n");
console.log(`${channels.size} channels: ${fresh.size} uploads in the last two days, ${picked.length} fit, ${items.length} written to js/latest.json (${GROUPS.map(g => g + " " + (inGroup.get(g) || 0)).join(", ")})`
  + `${failed.length ? `; ${failed.length} feeds unread (kept last run's)` : ""}; API calls for failed feeds: ${API_BUDGET - budget}`);
