// Builds js/feeds.js from the creators in scripts/feeds.json.
// For each creator: read the public RSS feed (latest ~15 uploads), then keep videos that
// play in an embed, aren't live, are family-safe and fit the length limits.
// Uses the YouTube Data API when YT_API_KEY is set, otherwise reads each watch page.
// A creator that fails this run keeps its videos from the previous js/feeds.js.
// A source is a creator ("id": channel ID, latest ~15 uploads) or a playlist ("playlist": ID, first "take" videos).
// "match"/"skip" are case-insensitive regexes on the title, e.g. only trailers from a music label.
// "keepDays" keeps videos from earlier runs that are newer than that many days.
// "maxDays" keeps only videos uploaded in the last that many days (e.g. this week's match highlights).
// "authors": only videos uploaded by these channels (use fan-made playlists to find films, keep official uploads only).
// "list": "popular" reads the channel's most popular uploads instead of its latest (used for Blockbusters).
// Usage: node scripts/fetch-feeds.mjs            refresh every source
//        node scripts/fetch-feeds.mjs khel,geet  refresh only these categories, keep the rest as they are
import {readFile, writeFile} from "node:fs/promises";
import {roman} from "./roman.mjs";

const ROOT = new URL("..", import.meta.url);
const OUT = new URL("js/feeds.js", ROOT);
const {feeds, blockChannels = []} = JSON.parse(await readFile(new URL("scripts/feeds.json", ROOT), "utf8"));
const BLOCKED = new Set(blockChannels.map(s => s.toLowerCase())); // uploaders never used, whichever source lists them
const KEY = process.env.YT_API_KEY;
const HEADERS = {"accept-language": "en-IN,en;q=0.9", cookie: "SOCS=CAI; CONSENT=YES+1",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let i = 1; ; i++) {
    try { const r = await fetch(url, {headers: HEADERS}); if (r.ok) return r.text(); throw new Error("HTTP " + r.status); }
    catch (e) { if (i >= tries) throw e; await sleep(1500 * i); }
  }
}

async function rss(channelId) {
  const xml = await get("https://www.youtube.com/feeds/videos.xml?channel_id=" + channelId);
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1])
    .filter(e => !e.includes("/shorts/")) // the feed links Shorts as /shorts/ID
    .map(e => ({id: e.match(/<yt:videoId>([^<]+)/)[1], pub: (e.match(/<published>([^<]+)/) || [])[1]?.slice(0, 10)}));
}

// A channel's latest uploads. YouTube's RSS feeds return 404 for many channels at random, so:
// with an API key, the channel's uploads playlist through the API (no RSS at all);
// without one, RSS first, then the uploads playlist page ("UU" + the channel ID after "UC").
// "UULF…" is the same uploads list without Shorts (podcasts post dozens of clips between episodes); "UU…" is the fallback.
async function uploads(channelId, popular) {
  const lists = popular ? ["UULP" + channelId.slice(2)] : ["UULF" + channelId.slice(2), "UU" + channelId.slice(2)]; // UULP: most popular, for "the best of" a channel
  for (const list of lists) {
    try {
      if (KEY) {
        const j = JSON.parse(await get(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=30&playlistId=${list}&key=${KEY}`, 1));
        const items = (j.items || []).map(it => ({id: it.contentDetails.videoId, pub: it.contentDetails.videoPublishedAt?.slice(0, 10)}));
        if (items.length) return items;
      } else {
        const items = await playlist(list, 30);
        if (items.length) return items;
      }
    } catch {}
  }
  if (KEY) throw new Error("no uploads list");
  return rss(channelId); // last resort
}

async function playlist(listId, take) {
  const html = await get("https://www.youtube.com/playlist?list=" + listId);
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error("no playlist data");
  // The playlist page already lists each video's title and length, so playlists skip the (rate-limited) watch pages
  const out = [], seen = new Set();
  JSON.stringify(JSON.parse(m[1]), (k, v) => {
    if (k === "lockupViewModel" && v.contentType === "LOCKUP_CONTENT_TYPE_VIDEO" && !seen.has(v.contentId)) {
      seen.add(v.contentId);
      const len = (JSON.stringify(v.contentImage || {}).match(/"text":"(\d+:\d{2}(?::\d{2})?)"/) || [])[1];
      out.push({id: v.contentId, title: v.metadata?.lockupMetadataViewModel?.title?.content,
        sec: len ? len.split(":").reduce((a, b) => a * 60 + +b, 0) : 0});
    }
    if (k === "playlistVideoRenderer" && v.videoId && !seen.has(v.videoId)) { seen.add(v.videoId); out.push({id: v.videoId, title: v.title?.runs?.[0]?.text, sec: +v.lengthSeconds || 0}); }
    return v;
  });
  return out.slice(0, take);
}

// Light check for playlist videos: oEmbed answers 200 only for public videos that allow embedding
async function detailsFromPlaylist(e) {
  const r = await fetch("https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=" + e.id, {headers: HEADERS});
  if (r.status === 429 || r.status >= 500) throw new Error("oEmbed " + r.status);
  const author = r.status === 200 ? (await r.json()).author_name : "";
  return {sec: e.sec, title: e.title || "", author, ok: r.status === 200 && e.sec > 0};
}

// -> {sec, title, ok} where ok means embeddable, not live/upcoming, family-safe
async function detailsFromPage(id) {
  const html = await get("https://www.youtube.com/watch?v=" + id);
  const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var |<\/script>)/s);
  if (!m) throw new Error("no player data for " + id);
  const p = JSON.parse(m[1]), v = p.videoDetails || {}, ps = p.playabilityStatus || {};
  const mf = (p.microformat || {}).playerMicroformatRenderer || {};
  return {sec: +v.lengthSeconds || 0, title: v.title || "", author: v.author || "", pub: mf.publishDate?.slice(0, 10),
    ok: ps.status === "OK" && ps.playableInEmbed === true && !v.isLiveContent && !v.isUpcoming && mf.isFamilySafe !== false};
}

async function detailsFromApi(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const url = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status,snippet&key=" + KEY + "&id=" + ids.slice(i, i + 50).join(",");
    for (const it of JSON.parse(await get(url)).items || []) {
      const d = it.contentDetails.duration.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || [];
      const sec = (+d[1] || 0) * 86400 + (+d[2] || 0) * 3600 + (+d[3] || 0) * 60 + (+d[4] || 0);
      out[it.id] = {sec, title: it.snippet.title, author: it.snippet.channelTitle,
        ok: it.status.embeddable && it.status.privacyStatus === "public" && it.snippet.liveBroadcastContent === "none" && !it.contentDetails.contentRating?.ytRating};
    }
  }
  return out;
}

// "Main title | #tags | Channel" -> "Main title"
function cleanTitle(t) {
  t = t.replace(/#\S+/g, "").replace(/[\[(](?:hindi|english|full video|official video|4k|hd)[\])]/gi, "").replace(/\s+/g, " ").trim();
  // "Coke Studio | Season 14 | Pasoori | Ali Sethi x Shae Gill" → "Pasoori · Ali Sethi x Shae Gill": the show's name isn't the title
  const segs = t.split(/\s*[|｜]\s*/).filter(Boolean), song = segs.filter(x => !/^(coke studio\b.*|season \d+)$/i.test(x));
  const first = t.split(/\s[|｜]\s/)[0].trim();
  if (song.length && segs.some(x => /^coke studio/i.test(x)) && song.length < segs.length) t = song.slice(0, 2).join(" · ");
  else if (first.length >= 8) t = first;
  return t.length > 90 ? t.slice(0, 87).trimEnd() + "…" : t;
}

async function previous() {
  try {
    const src = await readFile(OUT, "utf8");
    return JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1));
  } catch { return []; }
}

const sinceDays = n => new Date(Date.now() + 5.5 * 3600e3 - n * 86400e3).toISOString().slice(0, 10);
const keyOf = f => (f.id || f.playlist) + "|" + f.cat + (f.tag ? "|" + f.tag : "") + (f.match ? "|m" : ""); // a filtered source is distinct from the same channel unfiltered // one source can feed several categories (Star Sports: cricket, football, khel)
async function fetchFeed(f, old) {
  try {
    const entries = f.playlist ? await playlist(f.playlist, f.take ?? 50) : await uploads(f.id, f.list === "popular");
    const match = f.match && new RegExp(f.match, "i"), skip = f.skip && new RegExp(f.skip, "i");
    const info = KEY ? await detailsFromApi(entries.map(e => e.id)) : {};
    if (f.maxDays && !KEY && f.id) { // the uploads page has no dates; the RSS feed has them for the latest 15
      const pubs = new Map((await rss(f.id).catch(() => [])).map(x => [x.id, x.pub]));
      for (const e of entries) e.pub ||= pubs.get(e.id);
    }
    const items = []; let unread = 0;
    for (const e of entries) {
      const d = KEY ? info[e.id] : await (e.title && e.sec ? detailsFromPlaylist(e) : detailsFromPage(e.id)).catch(() => (unread++, null)); // listed with title + length: no watch page needed
      if (!KEY) await sleep(300);
      if (!d || !d.ok || BLOCKED.has((d.author || "").toLowerCase())) continue;
      if (f.authors && !f.authors.includes(d.author)) continue; // fan playlists: only official uploaders
      const min = Math.ceil(d.sec / 60);
      if (min < (f.minMin ?? 3) || min > (f.maxMin ?? 60)) continue; // drops Shorts and very long uploads
      if ((match && !match.test(d.title)) || (skip && skip.test(d.title))) continue;
      if (f.maxDays && !((e.pub || d.pub || "") >= sinceDays(f.maxDays))) continue;
      items.push({id: e.id, t: cleanTitle(d.title), cat: f.cat, lang: f.lang, ...(f.tag && {tag: f.tag}), min, src: f.src, pub: e.pub || d.pub, feed: keyOf(f)});
    }
    // Rate-limited (HTTP 429): half or more unread means this run tells us little, so keep last run's list.
    // A few unread: keep their previous entries rather than silently dropping them.
    if (entries.length && unread * 2 >= entries.length) throw new Error(`YouTube blocked ${unread} of ${entries.length} video pages`);
    if (unread) items.push(...old.filter(v => v.feed === keyOf(f) && !items.some(x => x.id === v.id)));
    console.log(`${String(items.length).padStart(2)} / ${entries.length}  ${f.src}${unread ? ` (${unread} blocked, kept earlier)` : ""}`);
    return items;
  } catch (err) {
    const kept = old.filter(v => v.feed === keyOf(f));
    console.log(`FAILED ${f.src} (${err.message}); kept ${kept.length} from last run`);
    return kept;
  }
}

// Festival songs are refreshed only in the 30 days before a festival (and during it); otherwise last run's are kept
const festSrc = await readFile(new URL("js/festivals.js", ROOT), "utf8");
const FESTIVALS = JSON.parse(festSrc.slice(festSrc.indexOf("["), festSrc.lastIndexOf("]") + 1));
const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10), DAY = 86400e3;
const inSeason = cat => FESTIVALS.some(x => x.cat === cat && today <= x.to && Date.parse(x.from) - Date.parse(today) <= 30 * DAY);

// A few sources at a time keeps it quick without hammering YouTube
const ONLY = process.argv[2]?.split(",");
const old = await previous(), results = new Array(feeds.length);
let next = 0;
await Promise.all(Array.from({length: 6}, async () => {
  while (next < feeds.length) {
    const i = next++, f = feeds[i];
    const kept = old.filter(v => v.feed === keyOf(f));
    const skipNow = (ONLY && !ONLY.includes(f.cat)) || (f.cat.startsWith("fest-") && !inSeason(f.cat) && kept.length);
    results[i] = skipNow ? kept : await fetchFeed(f, old);
    if (!skipNow && f.keepDays) { // e.g. trailers: keep earlier finds for a while so the channel builds up
      const since = new Date(Date.now() - f.keepDays * DAY).toISOString().slice(0, 10);
      const m = f.match && new RegExp(f.match, "i"), k = f.skip && new RegExp(f.skip, "i"); // earlier finds still have to pass today's filters
      results[i].push(...kept.filter(v => (v.pub || "") >= since && !results[i].some(x => x.id === v.id) && (!m || m.test(v.t)) && !(k && k.test(v.t))));
    }
  }
}));
// Final check: every video, however it got here (fresh, kept from a blocked run, kept for keepDays), passes its source's current filters
const bySource = new Map(feeds.map(f => [keyOf(f), f]));
const passes = v => { const f = bySource.get(v.feed); if (!f) return true;
  return (!f.match || new RegExp(f.match, "i").test(v.t)) && !(f.skip && new RegExp(f.skip, "i").test(v.t))
    && !(f.maxDays && !((v.pub || "") >= sinceDays(f.maxDays))); };
// Movie channels: the same film from two studios (e.g. HD and 4K uploads) plays once; the earlier source wins
const filmKey = v => v.t.toLowerCase().replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, "").split(/full|hindi|movie|film|\||-|4k|hd|comedy|action|horror|drama|romantic|thriller|superhit|blockbuster/)[0].replace(/[^a-z0-9]/g, "");
const seen = new Set(), items = results.flat().filter(passes).filter(v => {
  const k = ["premium", "retro", "masters"].includes(v.cat) && filmKey(v).length > 3 ? "film:" + v.cat + filmKey(v) : v.id + v.cat; // a song may be on two channels
  return !seen.has(k) && seen.add(k);
})
  .map(v => ({...v, t: roman(v.t)})); // titles in Latin script only

const body = "/* Generated by scripts/fetch-feeds.mjs from scripts/feeds.json. Do not edit by hand. */\n"
  + "const FEED = [\n" + items.map(v => JSON.stringify(v)).join(",\n") + "\n];\n"
  + "CATALOG.push(...FEED.filter(f => !CATALOG.some(c => c.id === f.id)));\n";
await writeFile(OUT, body);
console.log(`${items.length} videos written to js/feeds.js`);
