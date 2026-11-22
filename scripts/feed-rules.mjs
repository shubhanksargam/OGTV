// The content rules both fetches apply (scripts/fetch-feeds.mjs nightly, scripts/fetch-latest.mjs hourly), by a source's
// category (scripts/feeds.json: noBhojpuriIn, strictNoBhojpuriIn, noSouthIn)
import {SOUTH_LABEL} from "./home.mjs";
// Purvaiya plays no modern Bhojpuri (nor Santhali or Khortha); classics such as Sharda Sinha and Nadiya Ke Paar stay
export const BHOJPURI = /[ঀ-৿]|bhojpuri|भोजपुरी|santh?ali|संथाली|सन्थाली|khortha|खोरठा|खोरथा|nagpuri|नागपुरी|pawan singh|khesari|nirahua|dinesh lal|shilpi raj|neelkamal|pramod premi|ritesh pandey|arvind akela|kallu|samar singh|antra singh|ankush raja|gunjan singh|akshara singh|aa?mrapali/i;
// Global Hits plays no Bhojpuri at all (not even Chhath geet): new songs are judged by their tags and description too
export const BIHAR_FOLK = /chhath|छठ|bhatar|भतार|maithili|मैथिली|magahi|maghi|मगही|angika|अंगिका/i;
// South Indian songs belong on Deccan Chargers
export const SOUTH_TITLE = /[஀-ൿ]|\b(telugu|tamil|malayalam|kannada)\b/i;
export const SOUTH_AUTHOR = new RegExp(SOUTH_LABEL.source + "|excel movies", "i"); // the India chart's sorting (home.mjs) leaves Excel Movies out: its chart songs are Hindi (Mirzapur)
