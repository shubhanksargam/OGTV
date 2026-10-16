// Devanagari -> Roman (Hinglish-style) so every title on the site is in Latin script.
// "भारत बनाम पाकिस्तान" -> "Bharat banam pakistan". Approximate on purpose: it follows how
// people type Hindi in Roman letters, not a scholarly transliteration.
const CONS = {"क":"k","ख":"kh","ग":"g","घ":"gh","ङ":"n","च":"ch","छ":"chh","ज":"j","झ":"jh","ञ":"n",
  "ट":"t","ठ":"th","ड":"d","ढ":"dh","ण":"n","त":"t","थ":"th","द":"d","ध":"dh","न":"n",
  "प":"p","फ":"ph","ब":"b","भ":"bh","म":"m","य":"y","र":"r","ल":"l","व":"v","श":"sh","ष":"sh","स":"s","ह":"h",
  "क़":"q","ख़":"kh","ग़":"g","ज़":"z","ड़":"r","ढ़":"rh","फ़":"f","य़":"y"};
const NUKTA = {"क":"क़","ख":"ख़","ग":"ग़","ज":"ज़","ड":"ड़","ढ":"ढ़","फ":"फ़","य":"य़"};
const VOWEL = {"अ":"a","आ":"aa","इ":"i","ई":"ee","उ":"u","ऊ":"oo","ऋ":"ri","ए":"e","ऐ":"ai","ओ":"o","औ":"au","ऑ":"o","ॲ":"e"};
const MATRA = {"ा":"a","ि":"i","ी":"i","ु":"u","ू":"u","ृ":"ri","े":"e","ै":"ai","ो":"o","ौ":"au","ॉ":"o","ॅ":"e"};
const DIGIT = "०१२३४५६७८९";
const VIRAMA = "्", NUK = "़";

function word(w) {
  // Split into syllables: {c: consonant, v: vowel, inh: vowel is the inherent "a"}
  const syl = []; let out = "";
  const chars = [...w.normalize("NFC").replace(/ज्ञ/g, "ग्य")]; // gyan, vigyan
  for (let i = 0; i < chars.length; i++) {
    let ch = chars[i];
    if (chars[i + 1] === NUK && NUKTA[ch]) { ch = NUKTA[ch]; i++; }
    if (CONS[ch] !== undefined) { syl.push({c: CONS[ch], v: "a", inh: true}); continue; }
    const last = syl[syl.length - 1];
    if (MATRA[ch] !== undefined && last) { last.v = MATRA[ch]; last.inh = false; continue; }
    if (ch === VIRAMA && last) { last.v = ""; last.inh = false; continue; }
    if ((ch === "ं" || ch === "ँ") && last) { last.nasal = true; continue; }
    if (ch === "ः" && last) { last.v += "h"; continue; }
    if (VOWEL[ch] !== undefined) { syl.push({c: "", v: VOWEL[ch], inh: false}); continue; }
    const d = DIGIT.indexOf(ch);
    syl.push({c: d >= 0 ? String(d) : ch, v: "", inh: false, raw: true});
  }
  // Schwa deletion: drop a word-final inherent "a", then any inherent "a" between V-C and C-V
  const n = syl.length;
  if (n > 1 && syl[n - 1].inh && !syl[n - 1].nasal) syl[n - 1].v = "";
  for (let i = n - 2; i >= 1; i--) {
    const s = syl[i], p = syl[i - 1], q = syl[i + 1];
    if (s.inh && !s.nasal && s.c && p.v && q.c && !q.raw && q.v) s.v = "";
  }
  for (const s of syl) out += s.c + s.v + (s.nasal ? "n" : "");
  return out;
}

export function roman(text) {
  if (!/[ऀ-ॿ]/.test(text)) return text;
  const r = text.replace(/ॐ/g, "Om").replace(/[ऀ-ॿ]+/g, word).replace(/[।॥]/g, ".").replace(/\s+/g, " ").trim();
  return r.charAt(0).toUpperCase() + r.slice(1);
}
