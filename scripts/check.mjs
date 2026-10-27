// Checks the site before it ships: script syntax, the feed data, channel hours and the schedule itself.
// Runs on every push (.github/workflows/check.yml) and before the nightly and live refreshes commit, so a
// typo or a bad scrape never reaches viewers' screens. Exit 1 = something is broken; warnings don't fail.
// Usage: node scripts/check.mjs
import {readFileSync, readdirSync} from "node:fs";
import {spawnSync, execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

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
    + ";return {CATALOG, CHANNELS, FESTIVALS, LIVE, CAT_LABEL, LANG_LABEL, slotAt, istDayStart, HOUR, DAY, MIN};")();
} catch (e) { fail("the site's scripts fail to load together: " + e.message); }

if (S) {
  const {CATALOG, CHANNELS, FESTIVALS, LIVE, CAT_LABEL, LANG_LABEL, slotAt, istDayStart, HOUR, DAY, MIN} = S;

  // 3. Every video is playable and displays properly
  const bad = (what, list) => list.length && fail(`${list.length} video(s) ${what}: ${list.slice(0, 5).map(v => v.id || JSON.stringify(v)).join(", ")}`);
  bad("with an invalid YouTube ID", CATALOG.filter(v => !/^[A-Za-z0-9_-]{11}$/.test(v.id)));
  bad("with no title", CATALOG.filter(v => !String(v.t || "").trim()));
  bad("with < or > in the title or source", CATALOG.filter(v => /[<>]/.test(v.t + v.src)));
  bad("with an unknown category", CATALOG.filter(v => !CAT_LABEL[v.cat] && !String(v.cat).startsWith("fest-")));
  bad("with an unknown language", CATALOG.filter(v => !LANG_LABEL[v.lang]));
  bad("with no length", CATALOG.filter(v => !(v.min > 0)));
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

  // 6. The schedule: every channel has a programme at every half hour for the next two days
  const start = istDayStart(Date.now());
  for (const c of CHANNELS) for (let t = start; t < start + 2 * DAY; t += 30 * MIN) {
    const s = slotAt(c, t);
    if (!s || !s.v || !(s.start <= t && t < s.end)) { fail(`${c.name}: no programme at ${new Date(t).toISOString()}`); break; }
  }

  // 7. Festivals channel: the calendar needs next year's dates before it runs out
  const last = FESTIVALS.map(f => f.to).sort().at(-1), left = (Date.parse(last) - Date.now()) / DAY;
  if (left < 0) fail(`js/festivals.js ended on ${last}: add the coming festivals`);
  else if (left < 60) warn(`js/festivals.js ends on ${last} (${Math.floor(left)} days): add next year's festivals`);
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
