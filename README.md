# OGTV

**Watch OGTV: [https://ogtv.co.in](https://ogtv.co.in)**

Free, with no sign-up. It works in any browser on phones, laptops and smart TVs. Each channel also has its own page, such as [ogtv.co.in/tv/cricket](https://ogtv.co.in/tv/cricket/). The old address, ogtv.thebharat.si, now redirects here.

A 24×7 TV-style website for Indian viewers: 40 channels of Hindi and English YouTube, two of them live. All text on the site is in Latin script; Devanagari titles from YouTube are written in Roman letters (`scripts/roman.mjs`). YouTube videos are scheduled into channels by time-of-day rules, so every viewer sees the same programme at the same moment, like real TV.

## Run it

YouTube embeds don't play from a double-clicked file, so serve the folder:

- **Windows:** double-click `start.bat`, then open http://localhost:8000
- **Any OS:** in this folder run `python -m http.server 8000`
- **VS Code:** the "Live Server" extension works too

## Project layout

| File | What it holds |
|---|---|
| `index.html` | Page structure |
| `css/styles.css` | Colours, fonts and layout (tokens at the top in `:root`) |
| `js/catalog.js` | Hand-picked videos: YouTube ID, title, category, language, length in minutes |
| `js/feeds.js` | Generated: latest uploads from the creators in `scripts/feeds.json` |
| `scripts/fetch-feeds.mjs` | Rebuilds `js/feeds.js` (`node scripts/fetch-feeds.mjs`, or `... khel,geet` for some categories); which source each video came from goes to `scripts/feeds-state.json` |
| `scripts/fetch-descriptions.mjs` | Writes `desc/<id>.json`, each video's YouTube channel and cleaned-up description for the programme guide (`node scripts/fetch-descriptions.mjs [max]`); the videos on air soonest first, skipping ones already done |
| `desc/` | Generated: one small file per video, fetched by the guide only when it shows that video |
| `scripts/check.mjs` | Checks script syntax, feed data, channel hours, the schedule and the description files (`node scripts/check.mjs`); runs on every push and before every automatic refresh commits |
| `js/live.js`, `js/live.json` | Generated: which channels in `scripts/live.json` are live right now (open pages re-read the JSON every 10 minutes) |
| `js/festivals.js` | Festival calendar for the Vibe channel (add next year's dates before Oct 2027) |
| `scripts/fetch-live.mjs` | Rebuilds `js/live.js` (`node scripts/fetch-live.mjs`) |
| `js/channels.js` | Channels and their rules (time blocks in IST and what each block plays) |
| `js/scheduler.js` | Builds each day's schedule deterministically from the rules |
| `js/app.js` | Player, programme guide (which is also the channel list), help, remote keys |

Scripts load in that order as plain `<script>` tags. No build step.

**Security:** every page carries a Content-Security-Policy (set in `scripts/build-pages.mjs`), so the site runs no inline scripts: anything new goes in a `.js` file. Titles and names from YouTube go through `esc()` in `js/app.js` wherever they are put into HTML.

## Adding content

**A video** — add a line to `CATALOG` in `js/catalog.js`:

```js
{id:"VIDEO_ID", t:"Title", cat:"rasoi", lang:"te", min:12, src:"Channel name", tag:"snack"}
```

`cat` must be a key of `CAT_LABEL` (`bhakti, rasoi, sehat, geet, gyaan, hasya, khel, vigyan, tech, paisa, safar, bachche, baatcheet`). `lang` is `hi` or `en`. `tag` is optional.

**A creator feed** — add a line to `scripts/feeds.json` with the YouTube channel ID (`"id"`, starts with `UC`) or a playlist ID (`"playlist"`, plus `"take"` for how many), category and language, then run `node scripts/fetch-feeds.mjs`. `"match"`/`"skip"` filter by title, e.g. only trailers. Only uploads that allow embedding, aren't live, are family-safe and fit `minMin`–`maxMin` (default 3–60 minutes) are kept, so Shorts drop out.

**YouTube's India chart** — its sources have `"route"`: each song is sorted once by `scripts/home.mjs` (remembered in `scripts/homes.json`). Songs in Telugu, Tamil, Kannada or Malayalam go to Deccan Chargers' trending hour, songs with only foreign artists on them go to Global Hits, and everything else stays on Desi Pop (any desi artist on a song keeps it there). Desi Pop also covers the picture of songs with revealing, item-song or sexual visuals, or marked 18+: the song plays on behind OGTV's own card. Those songs are flagged by their tags (`cover: 1`) or by the channel's `cover` rule in `js/channels.js`.

**Live channels** — a channel with `live:"news"` plays the first on-air stream from that group in `scripts/live.json`, and its `parts` when nothing is live. `.github/workflows/refresh-live.yml` rechecks every 30 minutes and commits `js/live.js` only when it changes. Only official channels' own streams are used.

**Vibe (the festivals channel)** — plays the `cat` of whichever row in `js/festivals.js` covers today (`from`–`to`), or the next festival when its songs start within two weeks, and party songs (Diwali, New Year, Holi, Lohri) in between. It never plays devotional songs: the channel's `festival` rule in `js/channels.js` lists the titles and sources it leaves out (bhajans, aartis, kirtans, shabads, qawwalis, carols) and the festivals it passes over because their songs are all worship (Dussehra and Ram Navami, Chhath, Shivratri, Janmashtami, Guru Nanak Jayanti); those play on Bhakti. Festival song playlists live in `scripts/feeds.json` under `fest-*` categories and are only refetched within 30 days of their festival.

**Magadh Times** — Bihar & Jharkhand news, channel 3. Category `magadh`, refreshed by the hourly news run (`refresh-news.yml`): Doordarshan's regional bulletins from Patna and Ranchi (`bulletin`), News18 Bihar Jharkhand's day's roundups (`roundup`), ETV Bharat's ground reports (`reports`), the region's channels' latest, filtered to Bihar and Jharkhand stories (`updates`), analysis from Prabhat Khabar, The Lallantop, BBC News Hindi, Khabargaon and Newslaundry (`analysis`), and their Bihar & Jharkhand series (`deep`). A part's `days` keeps it to videos posted in the last so many days (the day's roundup; the weekend's week in review).

**Addresses** — every channel has one address, `/tv/<channel>/`, the page the channel list links to; tuning writes it into the address bar (other parameters such as `app=tv` stay), and an old `?ch=<channel>` link still tunes and is tidied the same way.

**Select** — a hand-picked channel: only the songs in category `select` (Dhurandhar, Saiyaara and Diljit's film songs in `js/catalog.js`; Diljit, Karan Aujla and Mirzapur from `scripts/feeds.json`). Its `mix` plays each set in turn, a set's share being the square root of its size, so a big set doesn't drown a small one. To add songs, give them `cat:"select"` and a tag, and add the tag to the `mix`.

**Nightly refresh** — `.github/workflows/refresh-feeds.yml` reruns the feed script at 03:00 IST, then the description script, and commits `js/feeds.js` and `desc/` when there is anything new. Run it by hand from the repo's Actions tab → Refresh feeds → Run workflow. For more reliable lookups, add a YouTube Data API key as a repository secret named `YT_API_KEY`. Descriptions in particular need it: without a key they come from watch pages, which YouTube stops serving (HTTP 429) after a couple of hundred in a few minutes, so the ~15,000 videos would fill in over weeks; with a key, one run does them all.

**A rule** — each channel in `js/channels.js` has `parts`. Each part is a block of hours in IST:

```js
{from:18, to:19, cat:"rasoi", tag:"snack", maxMin:15, label:"Chai-time snacks"}
```

- `cat` picks the category
- `tag` (optional) narrows to tagged videos
- `maxMin` (optional) skips videos longer than this
- `alt` (optional) a category to use when `cat` has no videos
- Blocks for one channel should cover 0–24 without gaps

## Watching

- The first tap ("Press to start") lets the browser play with sound.
- `?ch=desi-pop` in the address opens Desi Pop: the address always names the channel you're watching (the same name as its `/tv/desi-pop/` page), so a copied link keeps working when channels are reordered. Numbers (`?ch=29`) and renamed channels' old names still work. `←`/`→` change channel and `↑`/`↓` set the volume (in retro mode both show the set’s green readout, as its knobs do); type two digits on the keyboard for channels 10 and up. Channels are numbered 1–40 in the order the guide lists them (`scripts/check.mjs` insists on it).
- Subtitles are off, always: YouTube's captions are cleared as each video starts (the CC button is gone for now).
- A click or tap on the picture pauses or plays, in the page and in full screen. Paused, the picture dims under a flat dark wash.
- **Help** (beside **Retro mode** in the header; in full screen beside the on-screen Retro mode button and as a key on the retro TV set; or `H`) explains every part of the site.
- Full screen: the button on the screen, double-click, or `F`. In full screen a banner shows each channel change, moving the mouse to the bottom opens a strip of all channels (`←`/`→` move along it, `Enter` tunes), the OGTV mark and channel name sit in the corner, and controls fade when idle. On iPhone the screen fills the browser window instead.
- VHS mode: the **VHS mode** button (header, or on the screen in full screen) or `R` adds a camcorder look (VHS colour, scanlines, grain, PLAY readout). Remembered per browser.
- A video that won't play is skipped and the channel moves to the next one.
- The programme guide, under the TV, is also the channel list (`C` jumps there). It covers the rest of today (at least the next 3 hours) in IST, channel by channel. Each card shows the programme on at the chosen hour (**Now**, or an hour button), the YouTube channel it comes from, its YouTube description (two lines, **More** for the rest), and what follows. **Rest of today** opens the channel's whole day, and **Watch** or the channel's name tunes in.
- **NEW** in the guide marks videos uploaded in the last 30 days.

## TV app (Fire TV and Android TV)

`android/` is a small Kotlin app: one full-screen WebView on `https://ogtv.co.in/?app=tv`, so the schedule, feeds and look all come from the site and nightly refreshes need no app update. No libraries and no Google Play services, so one APK runs on Fire TV (Fire OS 5 and up) and Android TV.

- **TV mode** (`?app=tv`, or the app's `OGTV-AndroidTV` user agent): sound with no tap, always full screen, no cursor or click-only buttons. Try it in a browser at `http://localhost:8000/?app=tv` and call `ogtv.remote("up")` in the console.
- **Remote:** the app sends each key to `ogtv.remote(name)` in [js/app.js](js/app.js). It works like a TV remote: ←/→, the channel keys and ⏩/⏪ change channel; ↑/↓ set the volume (the TV's own volume where the TV allows it, otherwise OGTV's); OK opens the channel list in the plain look (←/→ browse, OK tunes) and shows the channel in the retro set; Info shows what's on; the last-channel key goes back; play/pause pauses; Menu turns the Mode knob (from Normal: Clean, Quiet, Full, Steady, Tinted, back to Normal; the set opens at Clean in the app) and red swaps retro and plain; digits tune; Back closes the list, then Back twice leaves the app. Leaving the app pauses it; coming back rejoins the programme live.
- **Build:** `cd android` then `./gradlew assembleDebug` (needs the Android SDK and JDK 17+; Android Studio's `jbr` works as `JAVA_HOME`). The APK is `android/app/build/outputs/apk/debug/app-debug.apk`.
- **Put it on a Fire TV Stick:** on the stick turn on Settings → My Fire TV → Developer options → ADB debugging (tap About → the device name 7 times if Developer options is hidden), note its IP under About → Network, then `adb connect <ip>:5555` and `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`. OGTV appears under Your Apps.
- **Release signing:** set `OGTV_KEYSTORE`, `OGTV_KEYSTORE_PASS` (and optionally `OGTV_KEY_ALIAS`, `OGTV_KEY_PASS`) as environment variables or in `android/keystore.properties` (not committed), then `./gradlew assembleRelease`.

## Traffic monitoring

- `js/analytics.js` sends visits and events to GoatCounter once `GC_CODE` is set (no cookies). Events: `start`, `ch-NN-key` (10 s on a channel), `watch-5m/15m/30m/60m/2h`, `live-none-<group>`, `play-error-<code>`, `blocked`, `retro-on`, `fullscreen`.
- Dashboard: `https://<code>.goatcounter.com`.
- `.github/workflows/traffic-watch.yml` runs `scripts/traffic-watch.mjs` daily at 06:00 IST: a report on the run page, and a `traffic-alert` issue (GitHub emails you) when yesterday's visitors fell below half the 7-day average. Needs secrets `GOATCOUNTER_CODE` and `GOATCOUNTER_TOKEN`.

## How the sync works

`scheduler.js` seeds a shuffle with the IST date + channel + time block, so everyone's browser builds the identical schedule without a server. The player loads the current video at `now − slot start` seconds. If a video ends early or can't be embedded, a "coming up next" card fills the slot.

## Known limits / next steps

- Video lengths in the catalog are estimates; a backend using the YouTube Data API (`videos.list` → `contentDetails.duration`, `status.embeddable`) should fill these in.
- Hand-picked video lengths in `catalog.js` are estimates; feed videos use their real length.
- If YouTube blocks the nightly job, each creator keeps its videos from the previous run.
- The language filter falls back to all languages when a block has no match.
