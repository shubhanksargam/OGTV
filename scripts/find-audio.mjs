// Covered songs, as audio only. A song whose picture OGTV never shows (by request: revealing, item-song or sexual
// visuals, or marked 18+; the nightly flag cover: 1, or a channel's cover rule in js/channels.js) plays as its official
// audio-only track instead, since YouTube's rules don't allow hiding its player's picture. This finds that track, once
// per song: YouTube Music's "songs" are the labels' own audio tracks (shown with the album's cover art), searched by the
// song's title and matched on its name, a singer or the film, and about the same length; the track must also play on
// other websites. A video that already is such a track (an "Artist - Topic" upload) stands for itself.
// Remembered in scripts/audio.json (a song with no track is looked up again after a week; songs no longer covered are
// dropped) and written onto the song's entries in js/feeds.js as a (the track's ID) and am (its length in minutes),
// which scripts/fetch-feeds.mjs keeps. A covered song with no track is left out (heard, js/scheduler.js).
// A track's cover art is the one picture it shows, so it is looked at by hand: an entry set to {"no": "<why>"} in
// scripts/audio.json is a song left out for good (Jism 2's poster is as revealing as its video), and is kept as it is.
// Also every song of a channel that plays only audio uploads (ch.audio: Vibe, by request, 23 Nov 2026), which leaves out a song
// looked up with none (an: 1 on its entries).
// Run after fetch-feeds (nightly, .github/workflows/refresh-feeds.yml): node scripts/find-audio.mjs
import {readFileSync} from "node:fs";
import {readFile, writeFile} from "node:fs/promises";

const ROOT = new URL("../", import.meta.url), read = f => readFileSync(new URL(f, ROOT), "utf8");
const FILE = new URL("scripts/audio.json", ROOT), FEEDS = new URL("js/feeds.js", ROOT);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const HEADERS = {"accept-language": "en-IN,en;q=0.9", cookie: "SOCS=CAI; CONSENT=YES+1", "user-agent": UA};
const RETRY_DAYS = 7, SONGS = "EgWKAQIIAWoKEAkQBRAKEAMQBA=="; // YouTube Music's "Songs" filter
const today = new Date().toISOString().slice(0, 10), sleep = ms => new Promise(r => setTimeout(r, ms));

// The site's own data and rules, loaded as the page loads them
const S = new Function(["catalog", "feeds", "live", "festivals", "channels", "scheduler"].map(f => read(`js/${f}.js`)).join("\n")
  + ";return {CATALOG, CHANNELS, coveredSong, FESTIVALS: typeof FESTIVALS === \"undefined\" ? [] : FESTIVALS};")();
const catsOf = ch => new Set((ch.parts || []).flatMap(p => [].concat(p.cat, typeof p.alt === "string" ? p.alt : [])));
const covered = new Map(); // id -> the song, as the catalogue has it
for (const v of S.CATALOG) if (!v.live && (v.cover === 1 || S.CHANNELS.some(ch => ch.cover && catsOf(ch).has(v.cat) && S.coveredSong(ch, v)))) covered.set(v.id, v);
// The songs a channel with ch.audio can play: its parts' categories, and for Vibe the festivals it celebrates and its party
// songs, less what it never plays (its festival rule's skip, exclude and excludeSrc)
for (const ch of S.CHANNELS.filter(c => c.audio)) {
  const f = typeof ch.festival === "object" ? ch.festival : null, rxi = s => s ? new RegExp(s, "i") : null, skip = rxi(f?.skip), exT = rxi(f?.exclude), exS = rxi(f?.excludeSrc);
  const cats = new Set([...catsOf(ch), ...(ch.festival ? [...S.FESTIVALS.map(x => x.cat).filter(c => !(skip && skip.test(c))), ...(f?.party || []), "fest-newyear"] : [])]);
  for (const v of S.CATALOG) if (!v.live && cats.has(v.cat) && !(exT && exT.test(v.t)) && !(exS && exS.test(v.src || "")) && !covered.has(v.id)) covered.set(v.id, v);
  // and what it mixes in from another category (Global Hits: Select's songs by foreign artists, home "foreign")
  for (const m of (ch.parts || []).flatMap(p => p.mix || []).filter(m => m.cat))
    for (const v of S.CATALOG) if (!v.live && [].concat(m.cat).includes(v.cat) && (!m.home || v.home === m.home) && !covered.has(v.id)) covered.set(v.id, v);
}

async function get(url) {
  for (let i = 1; ; i++) {
    try { const r = await fetch(url, {headers: HEADERS}); if (r.ok) return r.text(); throw new Error("HTTP " + r.status) }
    catch (e) { if (i >= 3) throw e; await sleep(1500 * i) }
  }
}
// A video's own details, from its watch page
async function watch(id) {
  const m = (await get("https://www.youtube.com/watch?v=" + id)).match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var |<\/script>)/s);
  if (!m) throw new Error("no player data");
  const p = JSON.parse(m[1]), d = p.videoDetails || {}, ps = p.playabilityStatus || {};
  return {id: d.videoId, title: d.title || "", author: d.author || "", desc: d.shortDescription || "", kw: d.keywords || [],
    sec: +d.lengthSeconds || 0, embeds: ps.status === "OK" && ps.playableInEmbed !== false && !d.isLiveContent};
}
const isTrack = w => / - Topic$/.test(w.author) || /^Provided to YouTube by /.test(w.desc);
// YouTube Music's songs for a search: [{id, title, meta: "Singer & Singer • Album • 4:49"}]
async function tracks(q) {
  const r = await fetch("https://music.youtube.com/youtubei/v1/search?prettyPrint=false", {method: "POST",
    headers: {"content-type": "application/json", origin: "https://music.youtube.com", "user-agent": UA},
    body: JSON.stringify({context: {client: {clientName: "WEB_REMIX", clientVersion: "1.20241111.01.00", hl: "en", gl: "IN"}}, query: q, params: SONGS})});
  if (!r.ok) throw new Error("YouTube Music: HTTP " + r.status);
  const out = [];
  JSON.stringify(await r.json(), (k, v) => {
    if (k === "musicResponsiveListItemRenderer") {
      const cols = (v.flexColumns || []).map(c => (c.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []).map(x => x.text).join(""));
      const id = v.playlistItemData?.videoId;
      if (id && JSON.stringify(v).includes("MUSIC_VIDEO_TYPE_ATV")) out.push({id, title: cols[0] || "", meta: cols[1] || ""});
    }
    return v;
  });
  return out;
}
const norm = s => s.normalize("NFKD").toLowerCase().replace(/\./g, "").replace(/[^a-z0-9]+/g, " ").trim(); // "K.K." -> "kk"
// The track is this song: its name is in the video's title, and a singer or the film is named in the video's details
function fits(t, song) {
  const name = norm(t.title.replace(/\s*[(\[].*$/, "")); // "Saanson Ko (From "Zid")" -> "saanson ko"
  if (name.length < 3 || !(" " + norm(song.title) + " ").includes(" " + name + " ")) return false;
  const [singers = "", album = ""] = t.meta.split(" • "), about = " " + norm([song.title, song.desc, song.kw.join(" ")].join(" ")) + " ";
  return [...singers.split(/\s*[&,|]\s*/), album.replace(/\(.*$/, "").replace(/original motion picture soundtrack/i, "")]
    .map(norm).filter(n => n.length >= 2).some(n => about.includes(" " + n + " "));
}
async function trackFor(id) {
  const song = await watch(id);
  if (isTrack(song)) return song.embeds ? {a: song.id, sec: song.sec, by: song.author} : null; // already audio only
  const words = song.title.split("|").slice(0, 2).join(" ").replace(/\b(full|official|hd|4k|8k|video|song|lyrical|lyrics|audio)\b/gi, " ").replace(/\b(ft|feat)\b\.?/gi, " ");
  for (const q of [...new Set([words, words.split(/\s+(?:ft|feat)\b/i)[0]].map(s => s.replace(/\s+/g, " ").trim()))]) {
    for (const t of (await tracks(q)).filter(t => fits(t, song)).slice(0, 3)) {
      const w = await watch(t.id).catch(() => null);
      if (w && w.embeds && isTrack(w) && Math.abs(w.sec - song.sec) <= Math.max(75, song.sec * 0.25)) return {a: w.id, sec: w.sec, by: w.author};
    }
    await sleep(400);
  }
  return null;
}

const saved = await readFile(FILE, "utf8").then(JSON.parse).catch(() => ({}));
const next = {};
// A time budget (AUDIO_MINUTES, 20 by default): the nightly job has 60 minutes for everything, and a few hundred new songs (an
// audio-only channel's whole list, 24 Nov 2026) take longer than that. Past it no new song is looked up; those are left for the
// next run (an audio-only channel plays them as they are meanwhile), and what was found is kept.
const BUDGET = (+process.env.AUDIO_MINUTES || 20) * 60e3, t0 = Date.now(); let later = 0;
for (const [id, v] of covered) {
  const old = saved[id];
  if (old?.a || old?.no || old?.none && (Date.parse(today) - Date.parse(old.none)) / 864e5 < RETRY_DAYS) { next[id] = old; continue }
  if (Date.now() - t0 > BUDGET) { if (old) next[id] = old; later++; continue } // the next run's
  try {
    const f = await trackFor(id);
    next[id] = f ? {...f, t: v.t, at: today} : {none: today, t: v.t};
    console.log(f ? `${v.t}: ${f.a} (${f.by}, ${f.sec} s)` : `${v.t}: no audio-only track; left out for now`);
  } catch (e) { if (old) next[id] = old; console.log(`${v.t}: not looked up (${e.message}); tried again next run`) }
  await sleep(500);
}
await writeFile(FILE, "{\n" + Object.keys(next).sort().map(id => JSON.stringify(id) + ": " + JSON.stringify(next[id])).join(",\n") + "\n}\n");

// Onto js/feeds.js: each entry of a covered song with a track carries it, and no other entry does
const text = await readFile(FEEDS, "utf8"), eol = text.includes("\r\n") ? "\r\n" : "\n";
let changed = 0;
const lines = text.split(eol).map(line => {
  const m = line.match(/^(\{"id":.*\})(,?)$/); if (!m) return line;
  const {a: _a, am: _am, an: _an, ...v} = JSON.parse(m[1]), f = next[v.id];
  const out = JSON.stringify(f?.a ? {...v, a: f.a, am: Math.ceil(f.sec / 60)} : f && (f.none || f.no) ? {...v, an: 1} : v) + m[2];
  if (out !== line) changed++;
  return out;
});
if (changed) await writeFile(FEEDS, lines.join(eol));
const n = Object.values(next);
console.log(`${covered.size} songs wanting an audio-only track (covered, or on an audio-only channel): ${n.filter(x => x.a).length} have one, ${n.filter(x => !x.a).length} left out (${n.filter(x => x.no).length} by hand); ${changed} feed entries updated${later ? `; ${later} left for the next run (time budget)` : ""}`);
