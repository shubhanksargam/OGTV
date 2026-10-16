// Daily traffic check against GoatCounter. Writes a report (markdown) and exits 2 when traffic fell sharply.
// Env: GOATCOUNTER_CODE (the "ogtv" in ogtv.goatcounter.com), GOATCOUNTER_TOKEN (API key with read access).
// Optional: DROP_RATIO (default 0.5 = alert when yesterday < half the previous 7-day average), MIN_BASELINE (default 20/day).
// Usage: node scripts/traffic-watch.mjs > report.md
const CODE = process.env.GOATCOUNTER_CODE, TOKEN = process.env.GOATCOUNTER_TOKEN;
const DROP = +(process.env.DROP_RATIO || 0.5), MIN_BASELINE = +(process.env.MIN_BASELINE || 20);
if (!CODE || !TOKEN) { console.log("GOATCOUNTER_CODE and GOATCOUNTER_TOKEN are not set; skipping."); process.exit(0); }

const DAY = 86400e3, iso = t => new Date(t).toISOString().slice(0, 13) + ":00:00Z"; // the API wants whole hours
const today = Date.parse(new Date().toISOString().slice(0, 10)); // 00:00 UTC today
const range = `start=${iso(today - 8 * DAY)}&end=${iso(today)}`;
async function api(path) {
  const r = await fetch(`https://${CODE}.goatcounter.com/api/v0/${path}`,
    {headers: {Authorization: "Bearer " + TOKEN, "Content-Type": "application/json"}});
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

const total = await api("stats/total?" + range);
const days = (total.stats || []).map(s => ({day: s.day, n: s.daily || 0})).slice(-8);
const yesterday = days[days.length - 1] || {day: "?", n: 0}, before = days.slice(0, -1);
const baseline = before.length ? before.reduce((a, d) => a + d.n, 0) / before.length : 0;
const fell = baseline >= MIN_BASELINE && yesterday.n < baseline * DROP;

const hits = await api("stats/hits?limit=100&" + `start=${iso(today - DAY)}&end=${iso(today)}`);
const events = (hits.hits || []).filter(h => h.event);
const channels = events.filter(h => h.path.startsWith("ch-")).slice(0, 10);
const errors = events.filter(h => h.path.startsWith("play-error") || h.path === "blocked");
const liveNone = events.filter(h => h.path.startsWith("live-none"));
const watch = Object.fromEntries(events.filter(h => h.path.startsWith("watch-")).map(h => [h.path.slice(6), h.count]));
const started = events.find(h => h.path === "start")?.count || 0;

const pct = baseline ? Math.round((yesterday.n / baseline - 1) * 100) : 0;
const out = [];
out.push(`# OGTV traffic, ${yesterday.day}`);
out.push(fell ? `**Traffic fell ${-pct}%**: ${yesterday.n} visitors vs a 7-day average of ${Math.round(baseline)}.`
  : `${yesterday.n} visitors (${pct >= 0 ? "+" : ""}${pct}% vs the 7-day average of ${Math.round(baseline)}).`);
out.push("", "| Day | Visitors |", "|---|---|", ...days.map(d => `| ${d.day} | ${d.n} |`));
out.push("", `**Pressed start:** ${started} · **Stayed 5 min:** ${watch["5m"] || 0} · **15 min:** ${watch["15m"] || 0} · **30 min:** ${watch["30m"] || 0} · **1 h:** ${watch["60m"] || 0}`);
if (channels.length) out.push("", "**Top channels yesterday**", "", "| Channel | Viewers |", "|---|---|", ...channels.map(h => `| ${h.title || h.path} | ${h.count} |`));
if (errors.length) out.push("", "**Playback problems**", "", ...errors.map(h => `- ${h.title || h.path}: ${h.count}`));
if (liveNone.length) out.push("", "**Live channels with nothing on air when someone tuned in**", "", ...liveNone.map(h => `- ${h.title || h.path}: ${h.count}`));
out.push("", `Dashboard: https://${CODE}.goatcounter.com`);
console.log(out.join("\n"));
process.exit(fell ? 2 : 0);
