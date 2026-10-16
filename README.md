# Aangan TV

A 24×7 TV-style website for Indian viewers. YouTube videos are scheduled into channels by time-of-day rules, so every viewer sees the same programme at the same moment, like real TV.

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
| `js/catalog.js` | The video list: YouTube ID, title, category, language, length in minutes |
| `js/channels.js` | Channels and their rules (time blocks in IST and what each block plays) |
| `js/scheduler.js` | Builds each day's schedule deterministically from the rules |
| `js/app.js` | Player, channel list, programme guide, remote keys |

Scripts load in that order as plain `<script>` tags. No build step.

## Adding content

**A video** — add a line to `CATALOG` in `js/catalog.js`:

```js
{id:"VIDEO_ID", t:"Title", cat:"rasoi", lang:"te", min:12, src:"Channel name", tag:"snack"}
```

`cat` must be one of `bhakti, rasoi, sehat, geet, gyaan, hasya` (or add a new one to `CAT_LABEL`). `tag` is optional.

**A rule** — each channel in `js/channels.js` has `parts`. Each part is a block of hours in IST:

```js
{from:18, to:19, cat:"rasoi", tag:"snack", maxMin:15, label:"Chai-time snacks"}
```

- `cat` picks the category
- `tag` (optional) narrows to tagged videos
- `maxMin` (optional) skips videos longer than this
- Blocks for one channel should cover 0–24 without gaps

## How the sync works

`scheduler.js` seeds a shuffle with the IST date + channel + time block, so everyone's browser builds the identical schedule without a server. The player loads the current video at `now − slot start` seconds. If a video ends early or can't be embedded, a "coming up next" card fills the slot.

## Known limits / next steps

- Video lengths in the catalog are estimates; a backend using the YouTube Data API (`videos.list` → `contentDetails.duration`, `status.embeddable`) should fill these in.
- Catalog is hand-picked. Next step: a nightly job that pulls uploads from chosen YouTube channels and applies the same rules.
- Hasya has Telugu only and Bhakti has Hindi only; the language filter falls back to all languages when a block has no match.
