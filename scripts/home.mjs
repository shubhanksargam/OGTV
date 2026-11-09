// Where a song from YouTube's India chart belongs, for fetch-feeds.mjs sources with "route":
//   "south te|ta|kn|ml|multi"  sung in Telugu, Tamil, Kannada or Malayalam: Deccan Chargers
//   "foreign"                  only artists from outside South Asia on it: Global Hits
//   "desi"                     everything else: Desi Pop
// Any desi artist on a song keeps it desi, by request: Daddy Yankee's "Pokito" has Diljit, KING's "Tu Mil Jaaye" has
// Arijit with Ed Sheeran. Pakistani and other South Asian artists are desi.
// Input: the watch page's (or the API's) title, uploader, tags, description, the language YouTube hears in it
// (its auto-captions) and the uploader's country.

// South Indian: named in the title, a South label or language channel ("T-Series Telugu"), or, when nothing says
// Hindi, the language YouTube hears, or the language, film industry or a South composer or star named anywhere.
// No place names: A. R. Rahman's Hindi songs credit his Chennai studio.
const SOUTH_TITLE = /[஀-ൿ]|\b(telugu|tamil|malayalam|kannada)\b/i;
export const SOUTH_LABEL = /telugu|tamil|malayalam|kannada|aditya music|lahari|think music|sony music south|sonymusicsouth|mango music|mangli|anirudh|anand audio|saregama south|divo|u1 records|sun ?tv|sun music/i;
const SOUTH_SAID = /[஀-ൿ]|\b(telugu|tamil|tamizh|kannad|malayal|tollywood|kollywood|sandalwood|mollywood|telangana|kuthu|madras ?gaa?na|chennai ?gaa?na|g\.? ?v\.? ?prakash|ilaiyaraaja|ilayaraja|yuvan|harris jayaraj|santhosh narayanan|sid sriram|thaman|devi sri prasad|sai abhyankkar|hiphop tamizha|sushin shyam|jakes bejoy|hesham abdul|rajinikanth|thalapathy|thalaivar|vijay sethupathi|mohanlal|mammootty|allu arjun|ram charan|jr\.? ?ntr|mahesh babu|chiranjeevi|pawan kalyan|sivakarthikeyan|kamal haasan|suriya)/i;
const SOUTH_HEARD = /^(te|ta|kn|ml)\b/;
// Desi languages and scripts other than the South's (Devanagari, Bengali, Gurmukhi, Gujarati, Odia)
const DESI_SAID = /[ऀ-୿]|\b(hindi|bollywood|punjabi|pollywood|haryanvi|bhojpuri|rajasthani|marathi|gujarati|bengali|urdu|magahi|maghi|maithili|garhwali|kumaoni|himachali|pahari|odia|assamese|bhajan|qawwal|ghazal|sufi)|\bdesi\b/i;
const DESI_HEARD = /^(hi|pa|ur|bn|mr|gu|or|as|ne|sd|bho|mai|raj)\b/;
// For uploaders outside South Asia (Karan Aujla's channel is in Canada, Daddy Yankee's in the US): a desi artist shows
// as a desi language, label or name anywhere on the video, the names being ones common only in South Asia
const DESI_LABEL = /t-?series|saregama|zee music|sony music (entertainment )?india|sonymusicindia|tips (official|music|industries)|\byrf\b|yash raj|universal music india|times music|speed records|white hill|desi melodies|geet mp3|jass records|shemaroo|venus (worldwide|records)|eros now|gully gang|coke studio (bharat|india|pakistan)|desi music factory|vyrl|humble music|brown town/i;
const DESI_NAME = new RegExp("\\b(" + [
  "singh", "kaur", "sidhu", "dhillon", "sandhu", "grewal", "brar", "aujla", "bajwa", "cheema", "randhawa", "dosanjh", "aulakh", "sandlas",
  "johal", "virk", "sekhon", "chahal", "hundal", "bhullar", "dhaliwal", "pannu", "atwal", "ghuman", "kahlon", "sahota", "thind", "sangha",
  "shergill", "deol", "bhatti", "mangat", "buttar", "jhajj", "sarao", "chatha", "talwi+nder", "diljit", "gurdas", "parmish", "nimrat", "afsana",
  "gurnam", "harrdy", "ikky", "sartaaj",
  "sharma", "verma", "gupta", "kumar", "yadav", "choudhary", "chaudhary", "chauhan", "rathore", "thakur", "mishra", "pandey", "tiwari", "dubey",
  "shukla", "trivedi", "joshi", "mehta", "saxena", "srivastava", "agarwal", "aggarwal", "bansal", "goyal", "rawat", "negi", "bisht", "tomar",
  "solanki", "panwar", "jangid", "dahiya", "kashyap", "bhardwaj", "upadhyay", "dwivedi", "nautiyal", "rajput", "kapoor", "khanna", "malhotra",
  "chopra", "arora", "bhatia", "sethi", "ahuja", "kohli", "oberoi", "mehra", "tandon", "bhatt", "patel", "desai", "kulkarni", "deshpande",
  "patil", "pawar", "jadhav", "shinde", "gaikwad", "chavan", "sawant", "banerjee", "chatterjee", "mukherjee", "ghosh", "dutta", "chakraborty",
  "bhattacharya", "ganguly", "majumdar", "reddy", "nair", "iyer", "menon", "pillai", "shetty", "hegde", "gowda", "naidu", "acharya", "khan",
  "arijit", "shreya", "ghoshal", "sunidhi", "jubin", "udit", "kishore", "mangeshkar", "badshah", "raftaar", "neha kakkar", "shah ?rukh",
  "ranveer", "ranbir", "deepika", "kareena", "akshay"].join("|") + ")\\b", "i");
const SOUTH_ASIA = /^(india|pakistan|bangladesh|nepal|sri lanka|bhutan|maldives|in|pk|bd|np|lk|bt|mv)$/i; // About-page names, API codes

const LANGS = [["te", /[ఀ-౿]|telugu/i], ["ta", /[஀-௿]|tamil|tamizh/i], ["kn", /[ಀ-೿]|kannad/i], ["ml", /[ഀ-ൿ]|malayal/i]];
function southLang({title, author, kw, desc, lang}) { // the title or uploader first, then what YouTube hears, then the earliest named
  for (const s of [title, author]) for (const [code, re] of LANGS) if (re.test(s)) return code;
  const heard = (SOUTH_HEARD.exec(lang) || [])[1]; if (heard) return heard;
  const text = kw.join(" ") + " " + desc; let best = "multi", at = Infinity;
  for (const [code, re] of LANGS) { const m = re.exec(text); if (m && m.index < at) [best, at] = [code, m.index] }
  return best;
}

// A video Desi Pop plays with its picture covered (the song plays on; OGTV shows its own card), by request: revealing,
// item-song or sexual visuals, or marked 18+. Read from the title and the uploader's own tags ("Bollywood Hot Scenes"
// on ZiD's "Saanson Ko"); a description only counts for an explicit marking, as descriptions carry lyrics ("bada hot
// hai weather"). Not violence or drinking, by request.
const COVER_TAGS = /\b(item ?(songs?|numbers?)|sexy|sexiest|hot (songs?|scenes?|videos?|item)|bold (scenes?|songs?)|seductive|sensual|steamy|raunchy|erotic|bikini|lingerie|bed ?scenes?|18 ?\+|adults? only|uncensored|unrated|nude|naked|topless)\b/i;
const COVER_DESC = /\b(item (song|number)|18 ?\+|adults? only|not (suitable|meant) for (minors|children|kids)|uncensored|nude|naked|topless)\b/i;
export const coverOf = ({title = "", kw = [], desc = ""}) => COVER_TAGS.test(title + "\n" + kw.join(", ")) || COVER_DESC.test(desc);

export function homeOf({title = "", author = "", kw = [], desc = "", lang = "", country = ""}) {
  const d = {title, author, kw, desc, lang}, text = [title, kw.join(", "), desc].join("\n"), desiSaid = DESI_SAID.test(text);
  if (SOUTH_TITLE.test(title) || SOUTH_LABEL.test(author)
      || (!desiSaid && (SOUTH_HEARD.test(lang) || (!DESI_HEARD.test(lang) && SOUTH_SAID.test(text + "\n" + author))))) return "south " + southLang(d);
  if (SOUTH_ASIA.test(country)) return "desi";
  return desiSaid || DESI_HEARD.test(lang) || DESI_LABEL.test(text + "\n" + author) || /\bindia\b/i.test(author) || DESI_NAME.test(text + "\n" + author) ? "desi" : "foreign";
}
