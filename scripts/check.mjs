// Checks the site before it ships: script syntax, the feed data, channel hours and the schedule itself.
// Runs on every push (.github/workflows/check.yml) and before the nightly and live refreshes commit, so a
// typo or a bad scrape never reaches viewers' screens. Exit 1 = something is broken; warnings don't fail.
// Usage: node scripts/check.mjs
import {readFileSync, readdirSync, existsSync} from "node:fs";
import {spawnSync, execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {splitFeeds} from "./split-feeds.mjs";

const ROOT = new URL("..", import.meta.url);
const read = p => readFileSync(new URL(p, ROOT), "utf8");
const errors = [], warnings = [];
const fail = m => errors.push(m), warn = m => warnings.push(m);

// 1. Every script parses
for (const f of readdirSync(new URL("js/", ROOT)).filter(f => f.endsWith(".js"))) {
  const r = spawnSync(process.execPath, ["--check", fileURLToPath(new URL("js/" + f, ROOT))], {encoding: "utf8"});
  if (r.status !== 0) fail(`js/${f} does not parse:\n${r.stderr.trim()}`);
}

// 2. Load the data and the scheduler as the page does (in this order, without the page itself)
let S;
try {
  S = new Function(["catalog", "feeds", "live", "festivals", "channels", "scheduler"].map(f => read(`js/${f}.js`)).join("\n")
    + ";return {CATALOG, CHANNELS, FESTIVALS, LIVE, CAT_LABEL, LANG_LABEL, slotAt, buildDay, istDayStart, HOUR, DAY, MIN, chSlug, coveredSong};")();
} catch (e) { fail("the site's scripts fail to load together: " + e.message); }

if (S) {
  const {CATALOG, CHANNELS, FESTIVALS, LIVE, CAT_LABEL, LANG_LABEL, slotAt, buildDay, istDayStart, HOUR, DAY, MIN, chSlug, coveredSong} = S;

  // 3. Every video is playable and displays properly
  const bad = (what, list) => list.length && fail(`${list.length} video(s) ${what}: ${list.slice(0, 5).map(v => v.id || JSON.stringify(v)).join(", ")}`);
  bad("with an invalid YouTube ID", CATALOG.filter(v => !/^[A-Za-z0-9_-]{11}$/.test(v.id)));
  bad("with no title", CATALOG.filter(v => !String(v.t || "").trim()));
  bad("with < or > in the title or source", CATALOG.filter(v => /[<>]/.test(v.t + v.src)));
  bad("with an unknown category", CATALOG.filter(v => !CAT_LABEL[v.cat] && !String(v.cat).startsWith("fest-")));
  bad("with an unknown language", CATALOG.filter(v => !LANG_LABEL[v.lang]));
  bad("with no length", CATALOG.filter(v => !(v.min > 0)));
  bad("with an audio-only track that is not a valid YouTube ID or length (scripts/find-audio.mjs)", CATALOG.filter(v => v.a !== undefined && (!/^[A-Za-z0-9_-]{11}$/.test(v.a) || !(v.am > 0))));
  for (const [group, list] of Object.entries(LIVE)) bad(`live in "${group}" without a valid ID`, list.filter(x => !/^[A-Za-z0-9_-]{11}$/.test(x.id)));
  if (JSON.stringify(JSON.parse(read("js/live.json"))) !== JSON.stringify(LIVE)) fail("js/live.json and js/live.js disagree (run node scripts/fetch-live.mjs)");

  // 4. A refresh that lost a large share of the videos is a broken scrape, not a quiet day
  try {
    const before = execFileSync("git", ["show", "HEAD:js/feeds.js"], {cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"]});
    const was = (before.match(/^\{"id":/gm) || []).length, now = (read("js/feeds.js").match(/^\{"id":/gm) || []).length;
    if (was && now < was * 0.7) fail(`js/feeds.js has ${now} videos, down from ${was} in the last commit (more than 30% gone)`);
  } catch { warn("no git history to compare the feed count with"); }

  // 5. Each channel's parts make sense. (The scheduler closes the hours between regular parts itself and lays
  // fixed-time shows over them, so whole-day coverage is checked by the schedule test below, not here.)
  for (const c of CHANNELS) {
    if (c.festival) continue;
    for (const p of c.parts) if (!(p.from >= 0 && p.from < p.to && p.to <= 24)) fail(`${c.name}: part "${p.label}" has hours ${p.from}–${p.to}`);
    if (!c.parts.some(p => !p.fixed)) fail(`${c.name}: has only fixed-time shows`);
    const fixed = c.parts.filter(p => p.fixed).sort((a, b) => a.from - b.from);
    fixed.forEach((p, i) => i && p.from < fixed[i - 1].to && fail(`${c.name}: fixed shows "${fixed[i - 1].label}" and "${p.label}" overlap`));
  }
  const nums = CHANNELS.map(c => c.n);
  if (new Set(nums).size !== nums.length) fail("two channels share a number");
  if (nums.some((n, i) => n !== i + 1)) fail("channel numbers should run 1, 2, 3… in the order js/channels.js lists them");
  const names = CHANNELS.flatMap(c => [chSlug(c), ...(c.oldSlugs || [])]); // ?ch=<name> links and /<name>/ pages
  if (new Set(names).size !== names.length) fail("two channels share an address name (or an old one): " + names.filter((n, i) => names.indexOf(n) !== i).join(", "));

  // 6. The schedule: every channel has a programme at every half hour for the next two days
  const start = istDayStart(Date.now());
  for (const c of CHANNELS) for (let t = start; t < start + 2 * DAY; t += 30 * MIN) {
    const s = slotAt(c, t);
    if (!s || !s.v || !(s.start <= t && t < s.end)) { fail(`${c.name}: no programme at ${new Date(t).toISOString()}`); break; }
    // a covered song never shows its picture: it plays as its audio-only track (heard, js/scheduler.js)
    if (!s.live && !s.v.heard && coveredSong(c, s.v) && s.v.a !== s.v.id) { fail(`${c.name}: plays the covered song "${s.v.t}" (${s.v.id}) with its picture`); break; }
  }

  // 6b. A channel with an age limit (strictDays: Newsroom, Magadh Times) has nothing older today; if it does, its newest
  // videos are older themselves (the scheduler then plays the newest there is): its fetch is worth a look
  for (const c of CHANNELS) { const lim = Math.max(0, ...(c.parts || []).filter(p => p.strictDays && p.days).map(p => p.days)); if (!lim) continue;
    const day = istDayStart(Date.now()), old = buildDay(c, day).filter(s => !s.v.pub || day + DAY - Date.parse(s.v.pub) > lim * DAY);
    if (old.length) warn(`${c.name}: ${old.length} of today's programmes are older than ${lim} days (nothing newer to play): is its fetch failing?`) }

  // 7. Festivals channel: the calendar needs next year's dates before it runs out
  const last = FESTIVALS.map(f => f.to).sort().at(-1), left = (Date.parse(last) - Date.now()) / DAY;
  if (left < 0) fail(`js/festivals.js ended on ${last}: add the coming festivals`);
  else if (left < 60) warn(`js/festivals.js ends on ${last} (${Math.floor(left)} days): add next year's festivals`);
}

// 10. The page's video files (js/c/ and js/feedmap.js: js/data.js fetches them a category at a time) are js/feeds.js's,
// split as scripts/build-pages.mjs splits it, and every page names the current ones
const feedSrc = read("js/feeds.js"), FEED = JSON.parse(feedSrc.slice(feedSrc.indexOf("["), feedSrc.lastIndexOf("]") + 1));
let split = null;
try { split = splitFeeds(FEED, JSON.parse((feedSrc.match(/const REFUSED = ("[^"]*")/) || [, '""'])[1])); } catch (e) { fail(e.message); }
if (split) {
  const disk = f => { try { return read(f).replace(/\r\n/g, "\n"); } catch { return null; } };
  const stale = [...split.files].filter(([f, text]) => disk(f) !== text).map(([f]) => f);
  if (stale.length) fail(`${stale.length} of the page's video files are out of step with js/feeds.js (run node scripts/build-pages.mjs): ${stale.slice(0, 5).join(", ")}`);
  const extra = (() => { try { return readdirSync(new URL("js/c/", ROOT)); } catch { return []; } })().filter(f => !split.files.has("js/c/" + f));
  if (extra.length) fail(`js/c/ has files for categories js/feeds.js no longer has (run node scripts/build-pages.mjs): ${extra.slice(0, 5).join(", ")}`);
  const pages = ["index.html", ...readdirSync(ROOT, {withFileTypes: true}).filter(e => e.isDirectory()).flatMap(e => [`${e.name}/index.html`,
    ...(e.name === "for" ? readdirSync(new URL("for/", ROOT)).map(n => `for/${n}/index.html`) : [])])].filter(p => existsSync(new URL(p, ROOT)));
  for (const p of pages) { const h = read(p); if (!h.includes("js/scheduler.js")) continue; // the TV's pages (not the legal ones, or a forward)
    if (/js\/feeds\.js\?v=/.test(h)) { fail(`${p} still loads js/feeds.js (run node scripts/build-pages.mjs)`); continue; }
    const maps = [...h.matchAll(/js\/feedmap\.js\?v=([^"']*)/g)].map(m => m[1]);
    if (!maps.length || maps.some(s => s !== split.mapStamp)) fail(`${p} names js/feedmap.js with a stamp other than its contents' (${maps.join(", ") || "none"}; run node scripts/build-pages.mjs)`);
    for (const [, c, s] of h.matchAll(/js\/c\/([\w-]+)\.js\?v=([^"']*)/g)) if (split.stamps.get(c) !== s) fail(`${p} preloads js/c/${c}.js with an old stamp (run node scripts/build-pages.mjs)`);
  }
}

// 11. Every channel's day comes out the same from its own categories alone: the page loads the categories one by one and
// a channel plays as soon as its own are in (chCats and chReady in js/scheduler.js). Checked for today and the days
// after it (--days=N, else 7), as a page on each of those days works out that day and the next
if (S && split) {
  const days = +((process.argv.find(a => a.startsWith("--days=")) || "").slice(7)) || 7;
  const T = new Function(["catalog", "feeds", "live", "festivals", "channels", "scheduler"].map(f => read(`js/${f}.js`)).join("\n")
    + ";return {CATALOG, FEED, CHANNELS, BAD, REFUSED, buildDay, chCats, chPool, istDayStart, DAY, HOUR, setCat(list){CATALOG.length=0; for(const v of list) CATALOG.push(v); byCat=null; cache.clear()},"
    + "watch(f){const o=inCats; inCats=c=>{f(c); return o(c)}}};")();
  T.REFUSED.split(" ").forEach(id => id && T.BAD.add(id)); // as js/app.js does
  const full = T.CATALOG.slice(), fromFeed = new Set(T.FEED), hand = new Set(full.filter(v => !fromFeed.has(v)));
  const sig = slots => slots.map(s => s.start + ":" + s.end + ":" + s.v.id).join(",");
  const today = T.istDayStart(Date.now()), wrong = [], outside = new Set();
  let asked = null; T.watch(c => asked && [].concat(c).forEach(x => asked.add(x))); // every category the scheduler looks in
  for (let d = 0; d < days; d++) {
    const day = today + d * T.DAY, date = new Date(day + 5.5 * 3600e3).toISOString().slice(0, 10);
    T.setCat(full); const want = T.CHANNELS.map(c => [sig(T.buildDay(c, day)), sig(T.buildDay(c, day + T.DAY))]);
    T.CHANNELS.forEach((c, i) => {
      const cats = new Set(T.chCats(c, day + 12 * T.HOUR)); T.setCat(full.filter(v => hand.has(v) || cats.has(v.cat)));
      asked = new Set(); const got = [sig(T.buildDay(c, day)), sig(T.buildDay(c, day + T.DAY))];
      for (const x of asked) if (!cats.has(x)) outside.add(`${c.name} looks in "${x}" (${date})`);
      asked = null;
      if (got[0] !== want[i][0] || got[1] !== want[i][1]) wrong.push(`${c.name} (${date})`);
    });
  }
  if (wrong.length) fail(`${wrong.length} channel-day(s) come out differently from the channel's own categories alone (chCats in js/scheduler.js): ${wrong.slice(0, 6).join(", ")}`);
  if (outside.size) fail(`the scheduler looks in categories a channel doesn't wait for (add them to chCats in js/scheduler.js): ${[...outside].slice(0, 6).join("; ")}`);
  // and every category a part names, its fallback's too, is one of them, whether or not it is needed today
  for (const c of T.CHANNELS) { const cats = new Set(T.chCats(c));
    for (const p of c.parts || []) for (const q of [p, p.weekend, p.otherDay]) if (q) for (const x of [].concat(q.cat, q.alt ?? [], q.boost?.cat ?? []))
      if (typeof x === "string" && !cats.has(x)) fail(`${c.name}: "${q.label}" names the category "${x}", which the channel doesn't wait for (chCats in js/scheduler.js)`); }
  // A song boosted by its ID is looked for in the channel's own categories only (and boost.cat's): one that isn't there
  // would quietly never play
  T.setCat(full);
  for (const c of T.CHANNELS) for (const p of c.parts || []) for (const q of [p, p.weekend, p.otherDay]) if (q && q.boost && q.boost.id && !T.chPool(c).some(v => v.id === q.boost.id))
    fail(`${c.name}: the boosted song ${q.boost.id} ("${q.label}") isn't in the channel's categories: name its category (boost.cat)`);
}

// 12. js/data.js puts the categories together, in whatever order they arrive, into the very catalogue js/feeds.js makes,
// and a channel is ready once its own are in (run here without a page: each file's put() is called directly)
if (S && split) {
  try {
    const page = "const document={createElement:()=>({setAttribute(){},remove(){}}),head:{appendChild(){}}}, events=[];"
      + "const addEventListener=()=>{}, dispatchEvent=e=>events.push(e), setTimeout=f=>{f(); return 0}, clearTimeout=()=>{};"
      + "class CustomEvent{constructor(type,o){this.type=type; this.detail=o.detail}}\n";
    const D = new Function(page + read("js/catalog.js") + "\n" + split.files.get("js/feedmap.js") + "\n"
      + ["live", "festivals", "channels", "scheduler", "data"].map(f => read(`js/${f}.js`)).join("\n") + ";return {CATALOG, CHANNELS, OGTV_DATA, chCats, events};")();
    if (!D.OGTV_DATA) throw new Error("it did not set up");
    const put = f => new Function("OGTV_DATA", split.files.get(f))(D.OGTV_DATA);
    const own = ch => D.chCats(ch).filter(c => split.files.has(`js/c/${c}.js`));
    const first = D.CHANNELS.find(c => c.key === "classics"), far = D.CHANNELS.find(c => c.key === "punjabi");
    if (D.OGTV_DATA.ready(first)) throw new Error("Cricket Classics counts as ready before its videos are in");
    own(first).forEach(c => put(`js/c/${c}.js`));
    if (!D.OGTV_DATA.ready(first)) throw new Error("Cricket Classics isn't ready once its videos are in");
    if (D.OGTV_DATA.ready(far)) throw new Error("Punjabi counts as ready before its videos are in");
    [...split.list].reverse().forEach(([c]) => put(`js/c/${c}.js`)); // the rest, last first
    if (JSON.stringify(D.CATALOG) !== JSON.stringify(S.CATALOG)) throw new Error("the catalogue it puts together differs from the one js/feeds.js makes");
    if (!D.OGTV_DATA.loaded() || !D.CHANNELS.every(ch => D.OGTV_DATA.ready(ch))) throw new Error("not every channel is ready once every category is in");
    if (!D.events.some(e => e.type === "ogtv-data" && e.detail.all)) throw new Error("no ogtv-data event says that all are in");
  } catch (e) { fail("js/data.js: " + e.message); }
}

// 8. HTML escaping in the player (titles from YouTube go through esc() into the page)
const escLine = read("js/app.js").match(/^const ESC=.*$/m);
if (!escLine) fail("js/app.js: the esc() helper is missing");
else try {
  const esc = new Function(escLine[0] + ";return esc")();
  if (esc(`<img src=x onerror="a('b')">&`) !== "&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;") fail("js/app.js: esc() no longer escapes HTML");
} catch (e) { fail("js/app.js: the esc() helper does not run: " + e.message); }

// 9. Programme descriptions for the guide (desc/<id>.json, from scripts/fetch-descriptions.mjs): valid, plain text
{
  const dir = new URL("desc/", ROOT), files = (() => { try { return readdirSync(dir).filter(f => f.endsWith(".json")); } catch { return []; } })();
  const broken = files.filter(f => { try { const j = JSON.parse(read("desc/" + f)); return typeof j.a !== "string" || typeof j.d !== "string" || /[<>]/.test(j.a + j.d); } catch { return true; } });
  if (broken.length) fail(`${broken.length} description file(s) in desc/ are broken: ${broken.slice(0, 5).join(", ")}`);
}

for (const w of warnings) console.log((process.env.GITHUB_ACTIONS ? "::warning::" : "warning: ") + w);
for (const e of errors) console.log((process.env.GITHUB_ACTIONS ? "::error::" : "error: ") + e);
console.log(errors.length ? `${errors.length} problem(s) found` : "All checks passed");
process.exit(errors.length ? 1 : 0);
