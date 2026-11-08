// Renders the TV app's intro clip and chime from the website's own intro (index.html markup, css/styles.css, the
// chime code in js/app.js), so the Android TV app can play them natively: smooth at 60 fps whatever the page is doing.
//   android/app/src/main/res/raw/ogtv_intro.mp4   OGTV forms out of blur and colour fringes, the play mark appears in
//                                                  the O, then the press flash and pulse (1920x1080, 60 fps, no audio)
//   android/app/src/main/res/raw/ogtv_chime.ogg   the intro chime, played by the app as its iris opens
// The app pauses the clip at INTRO_HOLD_MS (play mark showing) until the channel's picture is up, and opens its iris
// INTRO_IRIS_MS into the clip; keep those in MainActivity in step with the times printed at the end.
// Needs Chrome and ffmpeg. Usage: node scripts/render-tv-intro.mjs
import {createServer} from "node:http";
import {spawn, spawnSync} from "node:child_process";
import {readFileSync, writeFileSync, mkdirSync, rmSync, existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, extname} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "android/app/src/main/res/raw");
const FPS = 60;
const T_ASK = 2360;          // OGTV has formed (the V's animation ends): the play mark starts to appear (class .ask)
const T_GO = T_ASK + 1000;   // the play mark has settled: the press (class .go), where the app holds until the picture is up
const T_IRIS = T_GO + 350;   // the website opens its iris 350 ms after the press
const T_END = T_GO + 900;    // the flash and pulse are over
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const FFMPEG = process.env.FFMPEG || "ffmpeg";

// The intro alone: its SVG defs and markup from index.html, the site's stylesheet and fonts. No line of direction
// ("Press play to tune in"): the TV app needs no press.
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const defs = html.match(/<svg width="0" height="0"[\s\S]*?<\/svg>/)[0];
const start = html.split("\n").find(l => l.startsWith('<div class="start" id="start">'));
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/)[0];
const page = `<!doctype html><html><head><meta charset="utf-8">${fonts}<link rel="stylesheet" href="/css/styles.css">
<style>html,body{margin:0;background:#000;overflow:hidden}.ask-line{display:none!important}</style></head><body>${defs}${start}</body></html>`;

const types = {".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png"};
const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0]);
  if (path === "/") { res.writeHead(200, {"content-type": "text/html"}); return res.end(page); }
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, {"content-type": types[extname(file)] || "application/octet-stream"}); res.end(readFileSync(file));
}).listen(0);
const port = server.address().port;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const dbg = 9600 + Math.floor(Math.random() * 300);
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${dbg}`, `--user-data-dir=${join(tmpdir(), "ogtv-intro-" + dbg)}`,
  "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--no-first-run", "about:blank"], {stdio: "ignore"});
let targets; for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${dbg}/json`)).json(); break; } catch { await sleep(250); } }
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((ok, no) => { const i = ++id; pending.set(i, {ok, no}); ws.send(JSON.stringify({id: i, method: m, params: p})); });
ws.onmessage = e => { const m = JSON.parse(e.data); const p = m.id && pending.get(m.id); if (p) { pending.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } };
const evaluate = async expression => { const r = await send("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true});
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; };

// The TV page's layout: 960x540 CSS pixels at 2x, so OGTV has the size it has on the TV
await send("Emulation.setDeviceMetricsOverride", {width: 960, height: 540, deviceScaleFactor: 2, mobile: false});
await send("Page.enable");
await send("Page.navigate", {url: `http://127.0.0.1:${port}/`});
await sleep(1500);
await evaluate("document.fonts.ready.then(()=>true)");

// Every animation is paused and set to the exact time of each frame. Animations started by a class (.ask, .go)
// count from the moment that class goes on, as they do on the website.
await evaluate(`window.__seek=t=>{const s=document.getElementById("start");
  if(t>=${T_ASK}) s.classList.add("ask"); if(t>=${T_GO}) s.classList.add("go");
  const go=new Set(["pb-pulse","pb-flash","pb-out"]), ask=new Set(["pb-tri","pb-screen","standby","ask-text"]);
  for(const a of document.getAnimations()){const n=a.animationName||""; const t0=go.has(n)?${T_GO}:ask.has(n)?${T_ASK}:0;
    a.pause(); a.currentTime=Math.max(0,t-t0)}
  return document.getAnimations().length}`);

const frames = join(tmpdir(), "ogtv-intro-frames"); rmSync(frames, {recursive: true, force: true}); mkdirSync(frames);
const total = Math.round(T_END / 1000 * FPS);
for (let f = 0; f <= total; f++) {
  await evaluate(`__seek(${(f * 1000 / FPS).toFixed(3)})`);
  await evaluate("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(1))))");
  const {data} = await send("Page.captureScreenshot", {format: "png"});
  writeFileSync(join(frames, `f${String(f).padStart(4, "0")}.png`), Buffer.from(data, "base64"));
  if (f % 60 === 0) process.stdout.write(`frame ${f}/${total}\r`);
}

// The chime: the website's own bloom (identOut and bloomNotes from js/app.js) at the TV app's level, rendered offline
const app = readFileSync(join(ROOT, "js/app.js"), "utf8");
const fn = name => { const a = app.indexOf(`function ${name}(`); let d = 0, i = app.indexOf("{", a); for (; i < app.length; i++) { if (app[i] === "{") d++; else if (app[i] === "}" && --d === 0) break; } return app.slice(a, i + 1); };
const wav = await evaluate(`(async()=>{const TV_APP=true; ${fn("identOut")} ${fn("bloomNotes")}
  const sr=48000, off=new OfflineAudioContext(2,Math.round(sr*3.4),sr); bloomNotes(off,0.02); const b=await off.startRendering();
  const n=b.length, l=b.getChannelData(0), r=b.getChannelData(1), out=new Int16Array(n*2);
  for(let i=0;i<n;i++){out[i*2]=Math.max(-1,Math.min(1,l[i]))*32767; out[i*2+1]=Math.max(-1,Math.min(1,r[i]))*32767}
  let s=""; const u=new Uint8Array(out.buffer); for(let i=0;i<u.length;i+=32768) s+=String.fromCharCode.apply(null,u.subarray(i,i+32768)); return btoa(s)})()`);
const pcm = join(tmpdir(), "ogtv-chime.raw"); writeFileSync(pcm, Buffer.from(wav, "base64"));
ws.close(); chrome.kill(); server.close();

mkdirSync(OUT, {recursive: true});
const ff = args => { const r = spawnSync(FFMPEG, ["-v", "error", "-y", ...args], {stdio: "inherit"}); if (r.status) throw new Error("ffmpeg failed"); };
ff(["-framerate", String(FPS), "-i", join(frames, "f%04d.png"), "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
  "-profile:v", "high", "-level", "4.2", "-movflags", "+faststart", join(OUT, "ogtv_intro.mp4")]);
ff(["-f", "s16le", "-ar", "48000", "-ac", "2", "-i", pcm, "-c:a", "libvorbis", "-q:a", "6", join(OUT, "ogtv_chime.ogg")]);
console.log(`\nwrote ogtv_intro.mp4 (${total + 1} frames, ${(T_END / 1000).toFixed(2)} s) and ogtv_chime.ogg`);
console.log(`INTRO_HOLD_MS = ${T_GO}, INTRO_IRIS_MS = ${T_IRIS}, clip ends at ${T_END} ms`);
process.exit(0);
