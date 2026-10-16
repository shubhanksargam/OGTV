# OGTV

A 24×7 TV-style website for Indian viewers, in Hindi and English. YouTube videos are scheduled into channels by time-of-day rules, so every viewer sees the same programme at the same moment, like real TV.

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
| `scripts/fetch-feeds.mjs` | Rebuilds `js/feeds.js` (`node scripts/fetch-feeds.mjs`) |
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

**A creator feed** — add a line to `scripts/feeds.json` with the YouTube channel ID (starts with `UC`), category and language, then run `node scripts/fetch-feeds.mjs`. Only uploads that allow embedding, aren't live, are family-safe and fit `minMin`–`maxMin` (default 3–60 minutes) are kept, so Shorts drop out.

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
- **NEW** in the guide marks videos uploaded in the last 30 days.

## How the sync works

`scheduler.js` seeds a shuffle with the IST date + channel + time block, so everyone's browser builds the identical schedule without a server. The player loads the current video at `now − slot start` seconds. If a video ends early or can't be embedded, a "coming up next" card fills the slot.

## Known limits / next steps

- Video lengths in the catalog are estimates; a backend using the YouTube Data API (`videos.list` → `contentDetails.duration`, `status.embeddable`) should fill these in.
- Hand-picked video lengths in `catalog.js` are estimates; feed videos use their real length.
- If YouTube blocks the nightly job, each creator keeps its videos from the previous run.
- The language filter falls back to all languages when a block has no match.
