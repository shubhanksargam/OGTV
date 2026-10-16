# OGTV

A 24×7 TV-style website for Indian viewers: 33 channels of Hindi and English YouTube, two of them live. All text on the site is in Latin script; Devanagari titles from YouTube are written in Roman letters (`scripts/roman.mjs`). YouTube videos are scheduled into channels by time-of-day rules, so every viewer sees the same programme at the same moment, like real TV.

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
| `scripts/fetch-feeds.mjs` | Rebuilds `js/feeds.js` (`node scripts/fetch-feeds.mjs`, or `... khel,geet` for some categories) |
| `js/live.js` | Generated: which channels in `scripts/live.json` are live right now |
| `js/festivals.js` | Festival calendar for the Festivals channel (add next year's dates before Oct 2027) |
| `scripts/fetch-live.mjs` | Rebuilds `js/live.js` (`node scripts/fetch-live.mjs`) |
| `js/channels.js` | Channels and their rules (time blocks in IST and what each block plays) |
| `js/scheduler.js` | Builds each day's schedule deterministically from the rules |
| `js/app.js` | Player, channel list, programme guide, remote keys |

Scripts load in that order as plain `<script>` tags. No build step.

## Adding content

**A video** — add a line to `CATALOG` in `js/catalog.js`:

```js
{id:"VIDEO_ID", t:"Title", cat:"rasoi", lang:"te", min:12, src:"Channel name", tag:"snack"}
```

`cat` must be a key of `CAT_LABEL` (`bhakti, rasoi, sehat, geet, gyaan, hasya, khel, vigyan, tech, paisa, safar, bachche, baatcheet`). `lang` is `hi` or `en`. `tag` is optional.

**A creator feed** — add a line to `scripts/feeds.json` with the YouTube channel ID (`"id"`, starts with `UC`) or a playlist ID (`"playlist"`, plus `"take"` for how many), category and language, then run `node scripts/fetch-feeds.mjs`. `"match"`/`"skip"` filter by title, e.g. only trailers. Only uploads that allow embedding, aren't live, are family-safe and fit `minMin`–`maxMin` (default 3–60 minutes) are kept, so Shorts drop out.

**Live channels** — a channel with `live:"news"` plays the first on-air stream from that group in `scripts/live.json`, and its `parts` when nothing is live. `.github/workflows/refresh-live.yml` rechecks every 30 minutes and commits `js/live.js` only when it changes. Only official channels' own streams are used.

**Festivals channel** — plays the `cat` of whichever row in `js/festivals.js` covers today (`from`–`to`), or the next festival coming up. Festival song playlists live in `scripts/feeds.json` under `fest-*` categories and are only refetched within 30 days of their festival.

**Nightly refresh** — `.github/workflows/refresh-feeds.yml` reruns the feed script at 03:00 IST and commits `js/feeds.js` when there are new videos. Run it by hand from the repo's Actions tab → Refresh feeds → Run workflow. For more reliable lookups, add a YouTube Data API key as a repository secret named `YT_API_KEY`.

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
- `?ch=8` in the address opens channel 8. Type two digits on the keyboard for channels 10 and up.
- Subtitles: the **CC** button on the screen or `S` turns YouTube's subtitles off (or back on) for every video. Remembered per browser.
- The channel list starts hidden (the TV fills the width); the **Channels** tab on the right edge or `C` opens it, and the choice is remembered.
- Full screen: the button on the screen, double-click, or `F`. In full screen a banner shows each channel change, moving the mouse to the bottom (or tapping, or `←`/`→`) opens a strip of all channels (`Enter` tunes), the OGTV mark and channel name sit in the corner, and controls fade when idle. On iPhone the screen fills the browser window instead.
- Retro mode: the **Retro** button (header, or on the screen in full screen) or `R` adds a camcorder look (VHS colour, scanlines, grain, PLAY readout). Remembered per browser.
- A video that won't play is skipped and the channel moves to the next one.
- **NEW** in the guide marks videos uploaded in the last 30 days.

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
