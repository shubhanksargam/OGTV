/* ---------- Channels and their rules. A rule = hours (IST) + what to select ---------- */
// live: a group in js/live.js. While one of its streams is on air the channel shows it; otherwise its parts play.
// group: the heading a channel sits under in the channel list
const CHANNELS = [
  {key:"aangan",n:1,name:"Aangan",en:"Family mix, in Hindi",parts:[  // strictly Hindi (named documentary channels excepted), family-safe, no cartoons, no cooking
    {from:0,to:5,  cat:"geet",    lang:"hi",preferMin:15,label:"Late-night sadabahar"},
    {from:5,to:6,  cat:"bhakti",  lang:"hi",match:"aarti|aarati|aartiyan|chalisa|vandana|stuti|bhajan",label:"Morning aarti"},
    {from:6,to:8,  cat:"sehat",   lang:"hi",tag:"yoga",preferMin:15,label:"Morning yoga"},
    {from:8,to:10, cat:"vigyan",lang:"hi",langExcept:"Discovery|National Geographic|Nat Geo",src:"Discovery|discovery\+|Animal Planet|National Geographic|Nat Geo",label:"Wildlife & nature"},
    {from:10,to:11,cat:"vigyan",lang:"hi",langExcept:"National Geographic|Nat Geo",srcSkip:"Binocs|Peekaboo|Bodhaguru|Unacademy",preferMin:15,label:"Documentary hour"},
    {from:11,to:12,cat:"data",lang:"hi",langExcept:"India in Pixels",label:"India in data"},
    {from:12,to:13,cat:"khabar",  lang:"hi",label:"Afternoon news"},
    {from:13,to:15,cat:"vigyan",lang:"hi",langExcept:"Discovery|National Geographic|Nat Geo",srcSkip:"Binocs|Peekaboo|Bodhaguru|Unacademy",preferMin:15,label:"Discovery afternoon"},
    {from:15,to:17,cat:"safar",   lang:"hi",preferMin:15,label:"Travel hour"},
    {from:17,to:18,cat:"hasya",   lang:"hi",src:"Kapil Sharma|Ashish Chanchlani|Rakesh Addlakha|Taarak Mehta",label:"Family comedy"},
    {from:18,to:19,cat:"vigyan",lang:"hi",langExcept:"Discovery|National Geographic|Nat Geo",src:"Discovery|discovery\+|Animal Planet|National Geographic|Nat Geo",label:"Wildlife at dusk"},
    {from:19,to:20,cat:"bhakti",  lang:"hi",match:"aarti|aarati|aartiyan|chalisa|vandana|stuti|bhajan",festival:true,label:"Evening aarti"},
    {from:20,to:21,cat:"khabar",  lang:"hi",label:"Prime-time news"},
    {from:21,to:23,cat:"hits2010",lang:"hi",alt:"bollywood",preferMin:15,label:"Bollywood nights"},
    {from:23,to:24,cat:"geet",    lang:"hi",preferMin:15,label:"Sadabahar"}]},
  // ---- Lifestyle ----
  {key:"bhakti",n:2,group:"Lifestyle",name:"Bhakti",en:"Devotional",parts:[{from:0,to:24,cat:"bhakti",preferMin:15,label:"Devotional, all day"}]},
  // festival: songs for today's festival from js/festivals.js, or the next one coming up
  {key:"festival",n:3,group:"Lifestyle",name:"Festivals",en:"Songs for the festival",festival:true,parts:[]},
  {key:"sehat",n:4,group:"Lifestyle",name:"Sehat",en:"Yoga & fitness",parts:[
    {from:0,to:5,  cat:"sehat",tag:"yoga",maxMin:25,label:"Late-night stretch"},
    {from:5,to:9,preferMin:15,  cat:"sehat",tag:"yoga",label:"Morning yoga"},
    {from:9,to:12,preferMin:15, cat:"sehat",tag:"walk",label:"Walk & move"},
    {from:12,to:17,cat:"sehat",tag:"workout",maxMin:30,label:"Quick workouts"},
    {from:17,to:20,preferMin:15,cat:"sehat",tag:"workout",label:"Evening workouts"},
    {from:20,to:22,cat:"sehat",tag:"learn",label:"Fitness explained"},
    {from:22,to:24,preferMin:15,cat:"sehat",tag:"yoga",maxMin:30,label:"Wind-down yoga"}]},
  {key:"rasoi",n:5,group:"Lifestyle",name:"Rasoi",en:"Cooking",parts:[{from:0,to:24,cat:"rasoi",label:"Recipes, all day"}]},
  {key:"safar",n:6,group:"Lifestyle",name:"Safar",en:"Travel",parts:[{from:0,to:24,preferMin:15,cat:"safar",label:"Travel India & beyond"}]},
  {key:"bachche",n:7,group:"Lifestyle",name:"Bachche",en:"Kids",parts:[
    {from:0,to:7,preferMin:15,cat:"vigyan",alt:"bachche",maxMin:15,label:"Early science"},
    {from:7,to:21,preferMin:15,cat:"bachche",alt:"vigyan",label:"Stories & rhymes"},
    {from:21,to:24,preferMin:15,cat:"vigyan",alt:"bachche",maxMin:15,label:"Bedtime science"}]},
  // ---- Knowledge ----
  {key:"gyaan",n:8,group:"Knowledge",name:"Gyaan",en:"Space, India & explainers",parts:[{from:0,to:24,preferMin:15,cat:"gyaan",label:"Explainers, all day"}]},
  {key:"vigyan",n:9,group:"Knowledge",name:"Vigyan",en:"Science",parts:[{from:0,to:24,preferMin:20,cat:"vigyan",label:"Experiments & explainers"}]},
  {key:"curious",n:10,group:"Knowledge",name:"Curious",en:"Science & maths explainers",parts:[{from:0,to:24,preferMin:15,cat:"curious",label:"Explainers"}]},
  {key:"data",n:11,group:"Knowledge",name:"India in Data",en:"Maps, charts & stories",parts:[{from:0,to:24,preferMin:15,cat:"data",label:"Data stories"}]},
  {key:"classroom",n:12,group:"Knowledge",name:"Classroom",en:"NPTEL & lectures",parts:[{from:0,to:24,preferMin:25,cat:"classroom",label:"Lectures"}]},
  {key:"tech",n:13,group:"Knowledge",name:"Tech",en:"Gadgets, explainers, cars & bikes",parts:[
    {from:0,to:7,  cat:"tech",tag:"deep",alt:"tech",preferMin:15,label:"Late-night deep dives"},
    {from:7,to:10, cat:"tech",tag:"news",maxMin:15,label:"Morning tech news"},
    {from:10,to:13,cat:"tech",tag:"review",label:"New gadgets"},
    {from:13,to:15,cat:"tech",tag:"explain",label:"How tech works"},
    {from:15,to:17,cat:"tech",tag:"auto",label:"Cars & bikes"},
    {from:17,to:19,cat:"tech",tag:"review",preferMin:12,label:"Prime-time gadgets"},
    {from:19,to:21,cat:"tech",tag:"auto",preferMin:12,label:"Machines & motors"},
    {from:21,to:24,cat:"tech",tag:"explain",preferMin:12,label:"Hi-tech explained"}]},
  {key:"paisa",n:14,group:"Knowledge",name:"Paisa",en:"Money",parts:[{from:0,to:24,preferMin:15,cat:"paisa",label:"Money & investing"}]},
  // ---- Sports ----
  {key:"cricket",n:15,group:"Sports",name:"Cricket",en:"Match highlights",parts:[{from:0,to:24,preferMin:15,cat:"cricket",alt:"classics",label:"Recent match highlights"}]},
  {key:"khel",n:16,group:"Sports",name:"Khel",en:"Sports",parts:[
    {from:0,to:6,preferMin:15,  cat:"cricket",alt:"khel",label:"Cricket replays"},
    {from:6,to:9,preferMin:15,  cat:"khel",alt:"cricket",label:"Morning sports"},
    {from:9,to:13,preferMin:15, cat:"cricket",alt:"khel",label:"Cricket"},
    {from:13,to:16,preferMin:15,cat:"khel",alt:"cricket",label:"Kabaddi, hockey & more"},
    {from:16,to:24,preferMin:15,cat:"cricket",alt:"khel",label:"Prime-time cricket"}]},
  {key:"football",n:17,group:"Sports",name:"Football",en:"ISL & world football",parts:[{from:0,to:24,preferMin:15,cat:"football",label:"Football, all day"}]},
  {key:"classics",n:18,group:"Sports",name:"Cricket Classics",en:"World Cups & great finishes",parts:[{from:0,to:24,preferMin:15,cat:"classics",alt:"cricket",label:"From the archive"}]},
  // ---- News ----
  {key:"livenews",n:19,group:"News",name:"Live News",en:"24x7 news",live:"news",parts:[{from:0,to:24,preferMin:15,cat:"khabar",alt:"news",label:"News reports"}]},
  {key:"khabar",n:20,group:"News",name:"Khabar",en:"Hindi news & analysis",parts:[{from:0,to:24,preferMin:15,cat:"khabar",label:"Reports & explainers"}]},
  {key:"news",n:21,group:"News",name:"Newsroom",en:"English news & analysis",parts:[{from:0,to:24,preferMin:15,cat:"news",label:"Reports & explainers"}]},
  {key:"bihar",n:22,group:"News",name:"Bihar Jharkhand",en:"Live regional news",live:"bihar",parts:[{from:0,to:24,preferMin:15,cat:"bihar",label:"Regional reports"}]},
  // ---- Music ----
  {key:"bollywood",n:23,group:"Music",name:"Bollywood Now",en:"Latest hits",parts:[{from:0,to:24,cat:"bollywood",preferMin:15,label:"New releases & hits"}]},
  {key:"hits2010",n:24,group:"Music",name:"2010s Hits",en:"Bollywood 2010-2019",parts:[{from:0,to:24,cat:"hits2010",preferMin:15,label:"2010s hits"}]},
  {key:"hits2000",n:25,group:"Music",name:"2000s Hits",en:"Bollywood 2000-2009",parts:[{from:0,to:24,cat:"hits2000",preferMin:15,label:"2000s hits"}]},
  {key:"geet",n:26,group:"Music",name:"Sadabahar",en:"Evergreen songs",parts:[{from:0,to:24,cat:"geet",preferMin:15,label:"Evergreen, all day"}]},
  {key:"punjabi",n:27,group:"Music",name:"Punjabi",en:"Punjabi bangers",parts:[{from:0,to:24,cat:"punjabi",preferMin:15,label:"Bangers, all day"}]},
  {key:"english",n:28,group:"Music",name:"English Songs",en:"Pop hits",parts:[{from:0,to:24,cat:"english",preferMin:15,label:"Pop hits"}]},
  {key:"anthems",n:29,group:"Music",name:"Anthems",en:"Coldplay & friends",parts:[{from:0,to:24,cat:"anthems",preferMin:15,label:"Big-chorus pop & rock"}]},
  {key:"drive",n:30,group:"Music",name:"Drive",en:"Road-trip songs",parts:[{from:0,to:24,cat:"drive",preferMin:15,label:"Road-trip playlist"}]},
  {key:"raag",n:31,group:"Music",name:"Raag",en:"Sitar & santoor",parts:[{from:0,to:24,preferMin:25,cat:"raag",label:"Sitar & santoor, all day"}]},
  // ---- Entertainment ----
  {key:"hasya",n:32,group:"Entertainment",name:"Comedy",en:"Stand-up, sketches & shows",parts:[{from:0,to:24,preferMin:15,cat:"hasya",label:"Hindi & English comedy"}]},
  {key:"trailers",n:33,group:"Entertainment",name:"Trailers",en:"Movies & shows",parts:[{from:0,to:24,cat:"trailers",label:"Trailers & teasers"}]},
  {key:"baatcheet",n:34,group:"Entertainment",name:"Baatcheet",en:"Podcasts",parts:[{from:0,to:24,preferMin:30,cat:"baatcheet",label:"Long conversations"}]},
];
