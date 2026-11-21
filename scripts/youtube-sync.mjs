// OGTV's YouTube channel (by request, 21 Nov 2026): one public playlist per flagship OGTV channel, each holding 20 of
// what that channel plays this week (official uploads only; a playlist of public videos is allowed, re-uploading is
// not), its description linking back to the channel on ogtv.co.in. Run daily by .github/workflows/youtube.yml; the
// week's picks change on Mondays (IST) and the playlists catch up within YouTube's free daily allowance.
// Credentials (repository secrets, see scripts/youtube-auth.mjs): YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN.
// Without them it only prints what it would do: node scripts/youtube-sync.mjs
import {readFileSync} from "node:fs";
const ROOT = new URL("..", import.meta.url), read = p => readFileSync(new URL(p, ROOT), "utf8");
const SITE = "https://ogtv.co.in";
const FLAGSHIP = ["select", "geet", "hits90", "hits2000", "hits2010", "bollywood", "punjabi", "deccan", "raag", "bhakti", "drive", "gym", "gyaan", "data", "southgems"];
const SIZE = 20, BUDGET = 180; // videos a playlist; writes a run (each costs 50 of the 10,000 daily units; reads cost 1)
const S = new Function(["catalog", "feeds", "live", "festivals", "channels", "scheduler"].map(f => read(`js/${f}.js`)).join("\n")
  + ";return {CHANNELS, buildDay, istDayStart, DAY, chSlug};")();
const IST = 5.5 * 3600e3;
const monday = (() => { const d0 = S.istDayStart(Date.now()), wd = (new Date(d0 + IST).getUTCDay() + 6) % 7; return d0 - wd * S.DAY })(); // this week's Monday, IST
function picks(c) { // SIZE of the videos the channel plays this week (Monday to Sunday), spread over the week
  const seen = new Set(), all = [];
  for (let d = 0; d < 7; d++) for (const s of S.buildDay(c, monday + d * S.DAY)) if (!s.live && !seen.has(s.v.id)) { seen.add(s.v.id); all.push(s.v) }
  const step = Math.max(1, all.length / SIZE); return Array.from({length: Math.min(SIZE, all.length)}, (_, i) => all[Math.floor(i * step)]);
}
const cut = (s, n) => s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
const plan = FLAGSHIP.map(k => S.CHANNELS.find(c => c.key === k)).filter(Boolean).map(c => ({c,
  title: cut(`OGTV ${c.n} · ${c.name}: ${c.en}`, 150),
  description: `${c.name} on OGTV: ${c.en}. This week's picks from the channel, refreshed every Monday.\n\nWatch ${c.name} non-stop, free, as an always-on channel: ${SITE}/${S.chSlug(c)}/\nAll ${S.CHANNELS.length} OGTV channels, from news and cricket to Bollywood and bhajans: ${SITE}/\n\nOGTV plays official uploads only; every video here belongs to its creator.`,
  videos: picks(c)}));

const {YT_CLIENT_ID: ID, YT_CLIENT_SECRET: SECRET, YT_REFRESH_TOKEN: REFRESH} = process.env;
if (!ID || !SECRET || !REFRESH) {
  console.log("No YouTube credentials: a dry run. The playlists it keeps:\n");
  for (const p of plan) console.log(`${p.title}\n  ${p.videos.length} videos, e.g. ${p.videos.slice(0, 3).map(v => v.t.slice(0, 40)).join(" | ")}\n`);
  process.exit(0);
}
const tok = await (await fetch("https://oauth2.googleapis.com/token", {method: "POST", headers: {"content-type": "application/x-www-form-urlencoded"},
  body: new URLSearchParams({client_id: ID, client_secret: SECRET, refresh_token: REFRESH, grant_type: "refresh_token"})})).json();
if (!tok.access_token) { console.error("Could not sign in to YouTube:", tok.error, tok.error_description); process.exit(1) }
let writes = 0;
async function api(method, path, body) {
  const r = await fetch("https://www.googleapis.com/youtube/v3/" + path, {method, headers: {authorization: "Bearer " + tok.access_token, ...(body ? {"content-type": "application/json"} : {})}, body: body && JSON.stringify(body)});
  if (r.status === 204) return {};
  const j = await r.json(); if (!r.ok) throw Object.assign(new Error(`${method} ${path.split("?")[0]}: ${r.status} ${j.error?.message || ""}`), {status: r.status, reason: j.error?.errors?.[0]?.reason});
  return j;
}
async function all(path) { let out = [], page = ""; do { const j = await api("GET", path + (page ? "&pageToken=" + page : "")); out = out.concat(j.items || []); page = j.nextPageToken } while (page); return out }
const mine = await all("playlists?part=snippet,status&mine=true&maxResults=50");
const wait = ms => new Promise(r => setTimeout(r, ms));
// A playlist YouTube has only just made isn't found for a few seconds (404 playlistNotFound): wait and try again
async function patient(fn, tries = 4) { for (let k = 1; ; k++) { try { return await fn() } catch (e) { if (e.reason !== "playlistNotFound" || k >= tries) throw e; await wait(4000 * k) } } }
for (const p of plan) {
  if (writes >= BUDGET) break;
  try { // one playlist's trouble never stops the others
    let pl = mine.find(x => x.snippet.title.startsWith(`OGTV ${p.c.n} · ${p.c.name}`) || x.snippet.title.startsWith(`OGTV · ${p.c.name}`)), fresh = false;
    if (!pl) { pl = await api("POST", "playlists?part=snippet,status", {snippet: {title: p.title, description: p.description, defaultLanguage: "en"}, status: {privacyStatus: "public"}}); writes++; fresh = true; console.log("created", p.title); await wait(5000) }
    else if (pl.snippet.title !== p.title || pl.snippet.description !== p.description) { await api("PUT", "playlists?part=snippet", {id: pl.id, snippet: {title: p.title, description: p.description, defaultLanguage: "en"}}); writes++ }
    const items = fresh ? [] : await patient(() => all(`playlistItems?part=snippet&playlistId=${pl.id}&maxResults=50`)); // just made: nothing in it yet
    const have = new Set(items.map(i => i.snippet.resourceId.videoId)), want = new Set(p.videos.map(v => v.id));
    let added = 0, removed = 0;
    for (const v of p.videos) { if (writes >= BUDGET) break; if (have.has(v.id)) continue; // this week's first, so a playlist is never empty
      try { await patient(() => api("POST", "playlistItems?part=snippet", {snippet: {playlistId: pl.id, resourceId: {kind: "youtube#video", videoId: v.id}}})); added++ }
      catch (e) { if (e.status === 403 && e.reason === "quotaExceeded") { writes = BUDGET; break } console.log("  skipped", v.id, e.message) } writes++ }
    for (const i of items) { if (writes >= BUDGET) break; if (want.has(i.snippet.resourceId.videoId)) continue;
      try { await api("DELETE", "playlistItems?id=" + i.id); removed++ } catch (e) { if (e.status === 403 && e.reason === "quotaExceeded") { writes = BUDGET; break } } writes++ }
    console.log(`${p.c.name}: +${added} −${removed}`);
  } catch (e) { console.log(`${p.c.name}: not this time (${e.message}); tomorrow's run tries again`) }
}
console.log(`done: ${writes} writes (${writes * 50} of 10,000 units)${writes >= BUDGET ? "; the rest tomorrow" : ""}`);
