/* ---------- Channels and their rules. A rule = hours (IST) + what to select ---------- */
// live: a group in js/live.js. While one of its streams is on air the channel shows it; otherwise its parts play.
// group: the heading a channel sits under in the channel list
// India in Data's day outside its two hours of the latest: Khan Sir and Life on Wheels a fixed share each, so they play
// every day (by request), the other six creators the rest; their latest and most popular videos alike
// Gyaan's mixed hours: history a fixed share (Tarikh, HISTORY TV18, world history), the PMO and the Army a little, explainers the rest
const GYAAN_MIX=[{src:"^Tarikh$",share:0.15},{src:"^HISTORY TV18$",share:0.12},{src:"^(Timeline|World History Encyclopedia|Epimetheus)$",share:0.15},
  {src:"^(PMO India|Indian Army)$",share:0.1},{src:"^(ISRO|Documentary|Explainer|Mohak Mangal|StudyIQ IAS)$"}];
const DATA_MIX=[{src:"^Khan Sir$",share:0.15},{src:"^Life On Wheels$",share:0.15},{src:"^(India in Pixels|Nitish Rajput|Infra Talks|Breakdown|Think School|Aevy TV)$"}];
const CHANNELS = [
  // ---- Latest ----
  // Latest Mix (by request, 22 Nov 2026): channel 1, OGTV's first (by request, 22 Nov 2026). No schedule (menu). It plays the last two days' trending uploads of OGTV's YouTube
  // channels (js/latest.json, scripts/fetch-latest.mjs, hourly; by views per hour), one after another, and a carousel of
  // them over the picture lets the viewer pick any (js/app.js, Latest Mix)
  {key:"latest",n:1,group:"Latest",name:"Latest Mix",en:"Trending now: the last two days' top videos from every OGTV channel, one after another",menu:true},
  // ---- News ----
  {key:"livenews",n:2,group:"News",name:"Just News",oldSlugs:["live-news"],en:"24x7 news",live:"news",
   liveAt:[[0,8,"DD News"],[8,10,"NDTV 24x7"],[10,12,"Aaj Tak"],[12,14,"India Today"],[14,16,"ABP News"],[16,18,"WION"],[18,20,"NDTV India"],[20,22,"Aaj Tak"],[22,24,"India Today"]],parts:[
    {from:0,to:6,  cat:"khabar",alt:"news",preferMin:15,label:"News reports"},
    {from:6,to:8,cat:"khabar",src:"BBC News Hindi",newest:true,label:"6 am: BBC News Hindi"},
    {from:8,to:10,cat:"news",src:"WION|Firstpost",newest:true,label:"8 am: WION & Firstpost"},
    {from:10,to:12,cat:"khabar",src:"The Lallantop",newest:true,label:"10 am: The Lallantop"},
    {from:12,to:14,cat:"news",src:"The Indian Express|The Hindu",newest:true,label:"Noon: The Indian Express & The Hindu"},
    {from:14,to:16,cat:"khabar",src:"Khabargaon|Newslaundry",newest:true,label:"2 pm: Khabargaon & Newslaundry"},
    {from:16,to:18,cat:"news",src:"WION",newest:true,label:"4 pm: WION"},
    {from:18,to:20,cat:"news",src:"ThePrint",newest:true,label:"6 pm: ThePrint"},
    {from:20,to:22,cat:"khabar",src:"The Lallantop|BBC News Hindi",newest:true,label:"8 pm: The Lallantop & BBC Hindi"},
    {from:22,to:24,cat:"news",src:"Firstpost|WION",newest:true,label:"10 pm: Firstpost & WION"}]},
  {key:"khabar",n:3,group:"News",name:"Khabar",en:"Hindi news & analysis",parts:[  // a fixed daily line-up, newest first
    {from:0,to:6,  cat:"khabar",preferMin:15,label:"Raat ki khabrein: reports & explainers"},
    {from:6,to:7,cat:"khabar",src:"BBC News Hindi",newest:true,label:"6 am: BBC News Hindi"},
    {from:7,to:8,cat:"khabar",src:"The Lallantop",newest:true,label:"7 am: The Lallantop"},
    {from:8,to:9,cat:"khabar",src:"Khabargaon",newest:true,label:"8 am: Khabargaon"},
    {from:9,to:10,cat:"khabar",src:"Newslaundry",newest:true,label:"9 am: Newslaundry Hindi"},
    {from:10,to:12,cat:"khabar",preferMin:15,label:"Reports & explainers"},
    {from:12,to:13,cat:"khabar",src:"BBC News Hindi",newest:true,label:"Noon: BBC News Hindi"},
    {from:13,to:14,cat:"khabar",src:"The Lallantop",newest:true,label:"1 pm: The Lallantop"},
    {from:14,to:16,cat:"khabar",preferMin:15,label:"Afternoon explainers"},
    {from:16,to:17,cat:"khabar",src:"Khabargaon",newest:true,label:"4 pm: Khabargaon"},
    {from:17,to:18,cat:"khabar",src:"Newslaundry",newest:true,label:"5 pm: Newslaundry Hindi"},
    {from:18,to:19,cat:"khabar",src:"BBC News Hindi",newest:true,label:"6 pm: BBC News Hindi"},
    {from:19,to:20,cat:"khabar",src:"Khabargaon",newest:true,label:"7 pm: Khabargaon"},
    {from:20,to:21,cat:"khabar",src:"The Lallantop",newest:true,label:"8 pm: The Lallantop"},
    {from:21,to:22,cat:"khabar",src:"The Lallantop",match:"LT Show|Duniyadari|Netanagri|Kitabwala|Tarikh",newest:true,label:"Prime time, 9 pm: The Lallantop"},
    {from:22,to:23,cat:"khabar",src:"BBC News Hindi",newest:true,label:"10 pm: BBC News Hindi"},
    {from:23,to:24,cat:"khabar",src:"Khabargaon|Newslaundry",newest:true,label:"11 pm: Khabargaon & Newslaundry"}]},
  // Bihar & Jharkhand news, by request: a fixed daily line-up, newest first, refreshed with the hourly news run. Doordarshan's
  // bulletins from Patna and Ranchi (tag bulletin), News18 Bihar Jharkhand's day's roundups (roundup), ETV Bharat's ground
  // reports (reports), the region's channels' latest (updates), analysis of the region's stories from Prabhat Khabar,
  // The Lallantop, BBC News Hindi, Khabargaon and Newslaundry (analysis), and their Bihar & Jharkhand series (deep).
  // days: posted in the last so many days
  // Nothing older than two days, ever (by request, 22 Nov 2026; as Newsroom): every part days:2 with strictDays, not even
  // to fill; the archive series (deep) and the weekends' week-long slots went with it. The night replays the last two days.
  {key:"magadh",n:4,group:"News",name:"Magadh Times",en:"Bihar & Jharkhand news: bulletins, the day's roundups, ground reports & analysis, only the last two days",parts:[
    {from:0,to:6,  cat:"magadh",days:2,strictDays:true,label:"Raat: the last two days' news again, roundups, ground reports & analysis"},
    {from:6,to:7,  cat:"magadh",tag:"updates",days:2,strictDays:true,newest:true,alt:"magadh",label:"6 am: Subah ki khabar, the latest from Bihar & Jharkhand"},
    {from:7,to:7.5,cat:"magadh",tag:"bulletin",src:"DD News Bihar",days:2,strictDays:true,newest:true,alt:"magadh",label:"7 am: DD News Bihar bulletin"},
    {from:7.5,to:8,cat:"magadh",tag:"bulletin",src:"Jharkhand DD News",days:2,strictDays:true,newest:true,alt:"magadh",label:"7:30 am: Jharkhand DD News, Pradeshik Samachar"},
    {from:8,to:9,  cat:"magadh",tag:"analysis",days:2,strictDays:true,newest:true,alt:"magadh",label:"8 am: Analysis, what's moving Bihar & Jharkhand"},
    {from:9,to:11, cat:"magadh",tag:"updates",days:2,strictDays:true,newest:true,alt:"magadh",label:"Latest updates, newest first"},
    {from:11,to:12,cat:"magadh",tag:"reports",days:2,strictDays:true,newest:true,alt:"magadh",label:"11 am: Ground reports, ETV Bharat Bihar & Jharkhand"},
    {from:12,to:13,cat:"magadh",tag:"roundup",days:2,strictDays:true,newest:true,alt:"magadh",label:"Noon: Aaj ki badi khabren, the big stories so far"},
    {from:13,to:14,cat:"magadh",tag:"bulletin",days:2,strictDays:true,newest:true,alt:"magadh",label:"1 pm: DD bulletins from Patna & Ranchi"},
    {from:14,to:16,cat:"magadh",tag:"updates",days:2,strictDays:true,newest:true,alt:"magadh",label:"Afternoon updates, newest first"},
    {from:16,to:17,cat:"magadh",tag:"reports",days:2,strictDays:true,newest:true,alt:"magadh",label:"4 pm: Ground reports"},
    {from:17,to:18,cat:"magadh",tag:"bulletin",days:2,strictDays:true,newest:true,alt:"magadh",label:"5 pm: Evening bulletins, DD News Bihar & Jharkhand DD News"},
    {from:18,to:19,cat:"magadh",tag:"updates",days:2,strictDays:true,newest:true,alt:"magadh",label:"6 pm: Latest updates"},
    {from:19,to:20,cat:"magadh",tag:"roundup",days:2,strictDays:true,newest:true,alt:"magadh",label:"Prime time, 7 pm: the day in Bihar & Jharkhand"},
    {from:20,to:21,cat:"magadh",tag:"analysis",days:2,strictDays:true,newest:true,alt:"magadh",label:"8 pm: Analysis"},
    {from:21,to:22,cat:"magadh",tag:"bulletin",days:2,strictDays:true,newest:true,alt:"magadh",label:"9 pm: The latest bulletins"},
    {from:22,to:24,cat:"magadh",tag:"roundup",days:2,strictDays:true,newest:true,alt:"magadh",label:"10 pm: Aaj ki badi khabren, the day's roundup"}]},
  // Newsroom (by request, 21 Nov): nothing older than two days, ever (days:2 with strictDays: not even to fill); Palki Sharma
  // the most (Vantage, IGR Live with Palki Sharma, Flashback, the Vantage Podcast: 45% of the day, share 0.45), then IGR,
  // Firstpost's shows, WION, Mint, Bloomberg and Zerodha (the Daily Brief, Markets by Zerodha) in turn; others in the category don't play.
  // And whenever one of IGR, Firstpost, WION, Mint, Bloomberg or Zerodha is live, that plays (live: "newsroom", scripts/live.json;
  // only broadcasts started in the last 8 hours, so WION's 24x7 stream never takes it over)
  {key:"news",n:5,group:"News",name:"Newsroom",en:"Vantage with Palki Sharma, IGR, Firstpost, WION, Mint, Bloomberg & Zerodha: only the last two days",live:"newsroom",parts:[
    {from:0,to:24,cat:["news","paisa"],days:2,strictDays:true,mix:[{src:"Palki|Vantage",share:0.45},{src:"IGR|India Global Review"},{src:"Firstpost|Blueprint|First Cut|Mind the Gap|Honest Truth"},{src:"^WION"},{src:"^Mint"},{src:"^Bloomberg"},{src:"Zerodha"}],label:"The last two days: Palki Sharma, IGR, Firstpost, WION, Mint, Bloomberg & Zerodha"}]},
  // ---- Knowledge ----
  // Gyaan (approved list, 21 Nov 2026): history a focus (by request), beside space and explainers; every creator's latest
  // and most popular videos; Tarikh's newest every evening, newest first
  {key:"gyaan",n:6,group:"Knowledge",name:"Gyaan",en:"History, space & explainers: Tarikh, HISTORY TV18, ISRO, Timeline",parts:[
    {from:0,to:6,  cat:"gyaan",label:"World history, after dark",mix:[{src:"^Timeline$",share:0.5},{src:"^(World History Encyclopedia|Epimetheus)$"}]},
    {from:6,to:7,  cat:"gyaan",src:"^(ISRO|Documentary|Explainer)$",alt:"gyaan",label:"Space: ISRO"},
    {from:7,to:8,  cat:"gyaan",src:"^(PMO India|Indian Army)$",alt:"gyaan",label:"From the PMO and the Indian Army"},
    {from:8,to:13, cat:"gyaan",label:"Explainers & history",mix:GYAAN_MIX},
    {from:13,to:14,cat:"gyaan",src:"^Tarikh$",alt:"gyaan",label:"Tarikh: Indian history"},
    {from:14,to:18,cat:"gyaan",label:"Explainers & history",mix:GYAAN_MIX},
    {from:18,to:19,cat:"gyaan",src:"^HISTORY TV18$",alt:"gyaan",label:"HISTORY TV18"},
    {from:19,to:20,cat:"gyaan",label:"Explainers & history",mix:GYAAN_MIX},
    {from:20,to:21,cat:"gyaan",src:"^Tarikh$",newest:true,alt:"gyaan",label:"Tarikh: the latest"},
    {from:21,to:24,cat:"gyaan",label:"World history",mix:[{src:"^Timeline$",share:0.5},{src:"^(World History Encyclopedia|Epimetheus)$"}]}]},
  {key:"vigyan",n:7,group:"Knowledge",name:"Discover",oldSlugs:["vigyan"],en:"Science",parts:[{from:0,to:24,preferMin:20,cat:"vigyan",label:"Experiments & explainers"}]},
  {key:"curious",n:8,group:"Knowledge",name:"Curious",en:"Science & maths explainers",parts:[{from:0,to:24,preferMin:15,cat:"curious",label:"Explainers"}]},
  // India in Data (approved list, 21 Nov 2026): every creator's latest and most popular videos; Khan Sir's and Life on
  // Wheels' newest every day in an hour of their own, newest first (by request), and a fixed share of the rest of the day
  {key:"data",n:9,group:"Knowledge",name:"India in Data",en:"Maps, data, infrastructure & explainers: Khan Sir, Life on Wheels, Think School",parts:[
    {from:0,to:7,  cat:"data",preferMin:8,label:"Data stories",mix:DATA_MIX},
    {from:7,to:8,  cat:"data",src:"^Khan Sir$",tag:"latest",newest:true,alt:"data",label:"Khan Sir: the latest"},
    {from:8,to:19, cat:"data",preferMin:8,label:"Data stories",mix:DATA_MIX},
    {from:19,to:20,cat:"data",src:"^Life On Wheels$",tag:"latest",newest:true,alt:"data",label:"Life on Wheels: the latest"},
    {from:20,to:24,cat:"data",preferMin:8,label:"Data stories",mix:DATA_MIX}]},
  {key:"classroom",n:10,group:"Knowledge",name:"Classroom",en:"Data & AI engineering, UPSC & lectures",parts:[  // niche courses back to back, by request
    {from:0,to:2,  cat:"classroom",src:"NPTEL|MIT|Stanford",preferMin:25,alt:"classroom",label:"Lectures: NPTEL, MIT & Stanford"},
    {from:2,to:4,  cat:"classroom",src:"Karpathy",inOrder:true,alt:"classroom",label:"AI engineering: Karpathy's Zero to Hero, back to back"},
    {from:4,to:6,  cat:"classroom",tag:"dehi",inOrder:true,alt:"classroom",label:"Data engineering in Hindi: Manish Kumar, Spark & Azure"},
    {from:6,to:7,  cat:"classroom",tag:"upsc",newest:true,alt:"classroom",label:"UPSC current affairs: The Hindu analysis"},
    {from:7,to:8,  cat:"classroom",tag:"upscx",alt:"classroom",label:"UPSC explainers: To The Point & Dr Vikas Divyakirti"},
    {from:8,to:10, cat:"classroom",src:"Darshil Parmar",inOrder:true,alt:"classroom",label:"Data engineering: Darshil Parmar's projects, back to back"},
    {from:10,to:12,cat:"classroom",src:"DataExpert",inOrder:true,alt:"classroom",label:"Data engineering: Zach Wilson's bootcamp, back to back"},
    {from:12,to:13,cat:"classroom",tag:"upsc",newest:true,alt:"classroom",label:"UPSC current affairs"},
    {from:13,to:15,cat:"classroom",src:"CampusX",inOrder:true,alt:"classroom",label:"AI in Hindi: CampusX's 100 days of deep learning"},
    {from:15,to:17,cat:"classroom",tag:"dehi",inOrder:true,alt:"classroom",label:"Data engineering in Hindi, back to back"},
    {from:17,to:19,cat:"classroom",src:"Darshil Parmar",inOrder:true,alt:"classroom",label:"Data engineering: Darshil Parmar, back to back"},
    {from:19,to:20,cat:"classroom",tag:"upscx",alt:"classroom",label:"UPSC explainers: Dr Vikas Divyakirti's Concept Talk"},
    {from:20,to:22,cat:"classroom",src:"Krish Naik",inOrder:true,alt:"classroom",label:"AI engineering: Krish Naik on generative AI, RAG & agents"},
    {from:22,to:24,cat:"classroom",src:"DataTalksClub",inOrder:true,alt:"classroom",label:"Data Engineering Zoomcamp, back to back"}]},
  // Digital System Design (by request, 22 Nov 2026): IIT Madras's course (its BS in Electronic Systems), the one playlist
  // on a loop that goes on and on: lecture after lecture, across midnight, the first again after the last (p.loop, js/scheduler.js).
  // The 62 lectures take about 25 hours, so each comes round a little later every day; lecture 1 first plays at 6 am on 23 Nov
  {key:"dsd",n:11,group:"Knowledge",name:"Digital System Design",en:"IIT Madras's course, lecture after lecture: Verilog, FPGAs, CPUs & SoCs",parts:[
    {from:0,to:24,cat:"dsd",loop:"2026-11-23T06:00",label:"IIT Madras: Digital System Design, lecture after lecture"}]},
  {key:"tech",n:12,group:"Knowledge",name:"Tech",en:"Gadgets, explainers, cars & bikes",parts:[
    {from:0,to:7,  cat:"tech",tag:"deep",alt:"tech",preferMin:15,label:"Late-night deep dives"},
    {from:7,to:10, cat:"tech",tag:"news",maxMin:15,label:"Morning tech news"},
    {from:10,to:13,cat:"tech",tag:"review",label:"New gadgets"},
    {from:13,to:15,cat:"tech",tag:"explain",label:"How tech works"},
    {from:15,to:17,cat:"tech",tag:"auto",label:"Cars & bikes"},
    {from:17,to:19,cat:"tech",tag:"review",preferMin:12,label:"Prime-time gadgets"},
    {from:19,to:21,cat:"tech",tag:"auto",preferMin:12,label:"Machines & motors"},
    {from:21,to:24,cat:"tech",tag:"explain",preferMin:12,label:"Hi-tech explained"}]},
  {key:"paisa",n:13,group:"Knowledge",name:"Paisa",en:"Money: The Daily Brief, Markets by Zerodha & investing",parts:[
    {from:0,to:0.5,cat:"paisa",tag:"dailybrief",newest:true,fixed:true,alt:"paisa",label:"12 am: The Daily Brief"},
    {from:0.5,to:3,cat:"paisa",tag:"dailybrief",alt:"paisa",label:"The Daily Brief: past episodes"},
    {from:3,to:6,  cat:"paisa",preferMin:15,label:"Money & investing"},
    {from:6,to:9,  cat:"paisa",tag:"zmarkets",alt:"paisa",label:"Morning markets: Markets by Zerodha"},
    {from:9,to:12, cat:"paisa",tag:"dailybrief",alt:"paisa",label:"The Daily Brief: past episodes"},
    {from:12,to:12.5,cat:"paisa",tag:"dailybrief",newest:true,fixed:true,alt:"paisa",label:"12 pm: The Daily Brief"},
    {from:12.5,to:15,cat:"paisa",tag:"zmarkets",alt:"paisa",label:"Markets by Zerodha"},
    {from:15,to:17,cat:"paisa",preferMin:15,label:"Money & investing"},
    {from:17,to:20,cat:"paisa",tag:"dailybrief",alt:"paisa",label:"The Daily Brief: past episodes"},
    {from:20,to:21,cat:"paisa",tag:"zmarkets",alt:"paisa",label:"Markets by Zerodha"},
    {from:21,to:24,cat:"paisa",tag:"dailybrief",alt:"paisa",label:"Prime time: The Daily Brief, back to back"}]},
  {key:"baatcheet",n:14,group:"Knowledge",name:"Baatcheet",en:"Podcasts & long interviews: Raj Shamani, Neelesh Misra's Slow Interview, Lallantop's GITN",parts:[ // Neelesh Misra's Slow Interview and the Lallantop's GITN added by request (22 Nov 2026), with shares of their own, so their long archives sit alongside the podcasts rather than crowd them out
    {from:0,to:24,preferMin:30,cat:"baatcheet",mix:[{src:"^(?!The Lallantop|Neelesh Misra)"},{src:"^The Lallantop",share:0.2},{src:"^Neelesh Misra",share:0.15}],label:"Long conversations"}]},
  {key:"niche",prime:20,n:15,group:"Knowledge",name:"Niche",en:"Rare, offbeat & curious",parts:[
    {from:0,to:9,  cat:"niche",label:"Offbeat world"},
    {from:9,to:13, cat:"niche",src:"Prasar Bharati|Films Division|Better India",label:"Rare India"},
    {from:13,to:20,cat:"niche",label:"Curious finds"},
    {from:20,to:24,cat:"niche",src:"Prasar Bharati|Films Division|Better India",label:"From the archives"}]},
  // ---- Sports ----
  {key:"cricket",n:16,group:"Sports",name:"Cricket",en:"Today's highlights from every major match, India & IPL first",parts:[  // "latest": the last 3 days' uploads from boards, leagues and broadcasters, refreshed hourly
    {from:0,to:3,  cat:"cricket",tag:"latest",preferMin:8,alt:"cricket",match:"india|\bind\b|indw|ipl|wpl|ranji|syed mushtaq|vijay hazare|duleep|irani|deodhar",label:"Repeat: India & IPL, latest highlights"},
    {from:3,to:7,  cat:"cricket",tag:"latest",preferMin:8,alt:"cricket",label:"Overnight: every major match, latest highlights"},
    {from:7,to:9,  cat:"cricket",tag:"latest",preferMin:8,alt:"cricket",match:"india|\bind\b|indw|ipl|wpl|ranji|syed mushtaq|vijay hazare|duleep|irani|deodhar",label:"Morning repeat: India & IPL"},
    {from:9,to:13, cat:"cricket",tag:"latest",preferMin:8,alt:"cricket",label:"World cricket & leagues: the latest highlights"},
    {from:13,to:15,cat:"cricket",preferMin:15,alt:"classics",label:"Recent series highlights"},
    {from:15,to:17,cat:"cricket",tag:"latest",preferMin:8,alt:"cricket",match:"india|\bind\b|indw|ipl|wpl|ranji|syed mushtaq|vijay hazare|duleep|irani|deodhar",label:"Afternoon repeat: India & IPL"},
    {from:17,to:20,cat:"cricket",tag:"latest",preferMin:8,alt:"cricket",label:"World cricket today"},
    {from:20,to:23,cat:"cricket",tag:"latest",preferMin:8,alt:"cricket",match:"india|\bind\b|indw|ipl|wpl|ranji|syed mushtaq|vijay hazare|duleep|irani|deodhar",label:"Prime time: India & IPL, latest match highlights"},
    {from:23,to:23.5,cat:"firstsports",newest:true,fixed:true,alt:"cricket",label:"11 pm: First Sports with Rupha Ramani, the day in cricket"},
    {from:23.5,to:24,cat:"cricket",tag:"latest",preferMin:8,alt:"cricket",label:"Around the world: today's matches"}]},
  {key:"khel",n:17,group:"Sports",name:"Khel",en:"Olympics, Asian Games & Indian sport",parts:[
    {from:0,to:6,  cat:"khel",tag:"olympic",alt:"khel",label:"Olympic moments"},
    {from:6,to:9,  cat:"khel",tag:"latest",alt:"khel",label:"Morning repeat: the latest in Indian sport"},
    {from:9,to:13, cat:"khel",tag:"olympic",alt:"khel",label:"Olympics, Asian Games & Commonwealth Games"},
    {from:13,to:16,cat:"khel",srcSkip:"Olympic|Asian Games|Commonwealth|Paralympic|World Athletics",alt:"khel",label:"Kabaddi, hockey, badminton & chess"},
    {from:16,to:20,cat:"khel",tag:"olympic",match:"india|indian|neeraj|sindhu|mirabai|bhaker|lovlina|bajrang|vinesh|sreejesh|chanu|nikhat|avani|antil|harmanpreet|sable|chopra|hockey|bharat|paris 2024",alt:"khel",label:"India at the Games"},
    {from:20,to:21,cat:"khel",tag:"latest",alt:"khel",label:"Prime time: the latest in Indian sport"},
    {from:21,to:21.5,cat:"khel",tag:"latest",src:"Kabaddi|PKL",alt:"khel",label:"Pro Kabaddi: the latest"},
    {from:21.5,to:22,cat:"khel",tag:"latest",src:"Hockey|FIH|badminton|BWF",alt:"khel",label:"Hockey & badminton: the latest"},
    {from:22,to:23,cat:"khel",tag:"prime",src:"ChessBase|Diamond League",alt:"khel",label:"Gukesh, Pragg & Neeraj"},
    {from:23,to:23.5,cat:"firstsports",newest:true,fixed:true,alt:"khel",label:"11 pm: First Sports with Rupha Ramani"},
    {from:23.5,to:24,cat:"khel",tag:"prime",alt:"khel",label:"India's big moments"}]},
  {key:"classics",n:18,group:"Sports",name:"Cricket Classics",en:"World Cups & great finishes",parts:[{from:0,to:24,preferMin:15,cat:"classics",alt:"cricket",label:"From the archive"}]},
  {key:"football",n:19,group:"Sports",name:"Football",en:"This week's matches: Premier League, LaLiga, UCL, ISL & more",parts:[  // "latest": the last 3 days' uploads, refreshed hourly
    {from:0,to:3,  cat:"football",tag:"latest",alt:"football",label:"Repeat: the latest match highlights"},
    {from:3,to:7,  cat:"football",preferMin:15,label:"Football through the night"},
    {from:7,to:9,  cat:"football",tag:"latest",alt:"football",label:"Morning repeat: the latest matches"},
    {from:9,to:13, cat:"football",preferMin:15,label:"ISL, LaLiga, Bundesliga & FIFA"},
    {from:13,to:15,cat:"football",tag:"latest",alt:"football",label:"Afternoon repeat: the latest matches"},
    {from:15,to:20,cat:"football",preferMin:15,label:"Football, all afternoon"},
    {from:20,to:24,cat:"football",tag:"latest",alt:"football",label:"Prime time: this week's match highlights"}]},
  {key:"worldsport",n:20,group:"Sports",name:"International Sports",en:"Olympics, F1, tennis, NBA & world sport",parts:[
    {from:0,to:4,  cat:"khel",tag:"olympic",label:"Olympic classics"},
    {from:4,to:7,  cat:"world",tag:"more",alt:"world",label:"Golf, cycling & swimming"},
    {from:7,to:10, cat:"world",tag:"tennis",alt:"world",label:"Tennis: ATP, WTA & the Grand Slams"},
    {from:10,to:13,cat:"world",tag:"latest",alt:"world",label:"Repeat: this week in world sport"},
    {from:13,to:16,cat:"world",tag:"f1",alt:"world",label:"F1 & MotoGP"},
    {from:16,to:19,cat:"khel",tag:"olympic",alt:"world",label:"Olympics & world athletics"},
    {from:19,to:21,cat:"world",tag:"latest",alt:"world",label:"Prime time: this week in world sport"},
    {from:21,to:22,cat:"world",tag:"latest",src:"Formula 1|MotoGP",alt:"world",label:"Race night: the latest from F1 & MotoGP"},
    {from:22,to:23,cat:"world",tag:"fixtures",alt:"world",label:"International fixtures: NBA, NHL, rugby & basketball"},
    {from:23,to:24,cat:"world",tag:"tennis",alt:"world",label:"Late-night tennis"}]},
  // ---- Lifestyle ----
  {key:"sehat",prime:20,n:21,group:"Lifestyle",name:"Sehat",en:"Sports fitness, army & Soviet-style training, yoga & FitTuber",parts:[
    {from:0,to:5,  cat:"sehat",tag:"yoga",maxMin:25,label:"Late-night stretch"},
    {from:5,to:7,preferMin:15,  cat:"sehat",tag:"yoga",label:"Morning yoga"},
    {from:7,to:9,  cat:"sehat",tag:"army",alt:"sehat",label:"Army training: morning PT"},
    {from:9,to:11, cat:"sehat",tag:"sports",label:"Sports fitness: train like an athlete"},
    {from:11,to:12,cat:"sehat",src:"^Fit Tuber",newest:true,alt:"sehat",label:"FitTuber: health & diet, the latest"}, // its newest every day (by request)
    {from:12,to:13,cat:"sehat",tag:"workout",maxMin:30,label:"Quick workouts"},
    {from:13,to:14,cat:"sehat",tag:"walk",label:"Walk & move"},
    {from:14,to:18,cat:"sehat",tag:"sports",label:"Sports fitness: speed, strength & mobility"},
    {from:18,to:19,cat:"sehat",tag:"army",alt:"sehat",label:"Army training: evening drills"},
    {from:19,to:20,preferMin:15,cat:"sehat",tag:"workout",label:"Evening workouts"},
    {from:20,to:21,cat:"sehat",label:"Fitness explained",mix:[{src:"^Fit Tuber",share:0.5},{tag:"learn"}]}, // FitTuber half of it (by request)
    {from:21,to:22,cat:"sehat",tag:"soviet",alt:"sehat",label:"Soviet-style training: kettlebells & weightlifting"},
    {from:22,to:24,preferMin:15,cat:"sehat",tag:"yoga",maxMin:30,label:"Wind-down yoga"}]},
  {key:"rasoi",n:22,group:"Lifestyle",name:"Rasoi",en:"Cooking",parts:[{from:0,to:24,cat:"rasoi",label:"Recipes, all day"}]},
  {key:"safar",prime:17,n:23,group:"Lifestyle",name:"Safar",en:"Travel, India & the world",parts:[
    {from:0,to:6,  cat:"safar",tag:"world",preferMin:20,label:"Long journeys"},
    {from:6,to:7,  cat:"safar",tag:"scenic",alt:"safar",label:"Scenic mornings"},
    {from:7,to:14, cat:"safar",tag:"india",preferMin:15,label:"Travel India"},
    {from:14,to:17,cat:"safar",tag:"world",label:"Around the world"},
    {from:17,to:21,cat:"safar",tag:"india",preferMin:15,label:"Indian road trips"},
    {from:21,to:24,cat:"safar",tag:"world",preferMin:20,label:"The world at night"}]},
  {key:"bachche",n:24,group:"Lifestyle",name:"Bachche",en:"Kids",parts:[
    {from:0,to:7,preferMin:15,cat:"vigyan",alt:"bachche",maxMin:15,label:"Early science"},
    {from:7,to:21,preferMin:15,cat:"bachche",alt:"vigyan",label:"Stories & rhymes"},
    {from:21,to:24,preferMin:15,cat:"vigyan",alt:"bachche",maxMin:15,label:"Bedtime science"}]},
  // ---- Entertainment ----
  {key:"aangan",n:25,group:"Entertainment",name:"Aangan",en:"Family TV: DD classics, Taarak Mehta & mushaira",parts:[  // the family TV of an Indian home: aarti, DD classics, kahaniyan, kavi sammelan, wildlife, sitcoms; no news, no Bollywood
    {from:0,to:1,  cat:"aangan",  tag:"talent",alt:"geet",label:"Repeat: MTV Hustle & I-Popstar"},
    {from:1,to:5,  cat:"geet",    lang:"hi",label:"Late-night sadabahar"},
    {from:5,to:6,  cat:"bhakti",  lang:"hi",match:"aarti|aarati|aartiyan|chalisa|vandana|stuti|bhajan",label:"Morning aarti"},
    {from:6,to:7,  cat:"aangan",  tag:"kahani",alt:"bhakti",label:"Subah ki kahani"},
    {from:7,to:9,  cat:"vigyan",lang:"hi",langExcept:"Discovery|National Geographic|Nat Geo",src:"Discovery|discovery\\+|Animal Planet|National Geographic|Nat Geo",label:"Wildlife & nature"},
    {from:9,to:11, cat:"aangan",  tag:"dd",label:"Doordarshan classics: Bharat Ek Khoj"},
    {from:11,to:13,cat:"aangan",  tag:"dd",label:"Doordarshan classics"},
    {from:14,to:15,cat:"aangan",  tag:"talent",alt:"geet",label:"Music talent: MTV Hustle & I-Popstar"},
    {from:13,to:14,cat:"vigyan",lang:"hi",langExcept:"Discovery|National Geographic|Nat Geo",srcSkip:"Binocs|Peekaboo|Bodhaguru|Unacademy",preferMin:15,label:"Discovery afternoon"},
    {from:15,to:16,cat:"aangan",  tag:"kahani",label:"Dopahar ki kahani"},
    {from:16,to:17,cat:"aangan",  tag:"kavi",label:"Kavi sammelan"},
    {from:17,to:18,cat:"hasya",   lang:"hi",src:"Kapil Sharma|Ashish Chanchlani|Rakesh Addlakha|Taarak Mehta",label:"Family comedy"},
    {from:18,to:19,cat:"vigyan",lang:"hi",langExcept:"Discovery|National Geographic|Nat Geo",src:"Discovery|discovery\\+|Animal Planet|National Geographic|Nat Geo",label:"Wildlife at dusk"},
    {from:19,to:20,cat:"bhakti",  lang:"hi",match:"aarti|aarati|aartiyan|chalisa|vandana|stuti|bhajan",festival:true,label:"Evening aarti"},
    {from:20,to:21,cat:"aangan",  tag:"sitcom",src:"Taarak Mehta",label:"Prime time: Taarak Mehta Ka Ooltah Chashmah"},
    {from:21,to:22,cat:"aangan",  tag:"sitcom",label:"Prime time: Taarak Mehta & family sitcoms"},
    {from:22,to:23,cat:"aangan",  tag:"sitcom",srcSkip:"Taarak Mehta",label:"Family sitcoms: Wagle Ki Duniya, Shrimaan Shrimati"},
    {from:23,to:24,cat:"aangan",  tag:"mushaira",alt:"aangan",label:"Mushaira & ghazal"}]},
  {key:"hasya",n:26,group:"Entertainment",name:"Comedy",en:"Stand-up, sketches & shows",parts:[{from:0,to:24,preferMin:15,cat:"hasya",label:"Hindi & English comedy"}]},
  {key:"bihar",n:27,group:"Entertainment",name:"Purvaiya",oldSlugs:["bihar-jharkhand"],en:"Regional news, legends, travel & vlogs",live:"bihar",liveHours:[[7,10],[13,14],[19,22]],parts:[
    {from:0,to:2,  cat:"biharlife",tag:"legends",alt:"biharlife",label:"After midnight: Legends of Bihar",weekend:{tag:"sharda",label:"Weekend: Sharda Sinha & Nadiya Ke Paar, back to back"}},
    {from:2,to:5,  cat:"biharlife",tag:"vlogs",alt:"biharlife",label:"Night vlogs: Curly Tales, village life & hidden Bihar and Jharkhand",otherDay:{tag:"infra",label:"Night watch: building Bihar & Jharkhand"}},
    {from:5,to:7,  cat:"biharlife",tag:"legends",alt:"biharlife",label:"Legends of Bihar: Dinkar, Chanakya, Chandragupta, Nalanda, Khan Sir & the Bihar Museum"},
    {from:7,to:10, cat:"bihar",preferMin:15,label:"Bihar & Jharkhand news"},
    {from:10,to:11,cat:"biharlife",tag:"tourism",alt:"biharlife",boost:{tag:"guide",every:2},label:"Ghoomo Bihar: Nalanda, Rajgir, Bodh Gaya, with the songs of Guide"},
    {from:11,to:12,cat:"biharlife",tag:"infra",alt:"biharlife",label:"Building Bihar & Jharkhand: Patna, Giridih, Deoghar & Nalanda"},
    {from:12,to:13,cat:"biharlife",tag:"food",alt:"biharlife",label:"Litti chokha & the Bihar plate"},
    {from:13,to:14,cat:"bihar",preferMin:15,label:"Afternoon news"},
    {from:14,to:15,cat:"biharlife",tag:"festivals",alt:"biharlife",label:"Festivals: Chhath, Shravani Mela & Sonepur Mela"},
    {from:15,to:16,cat:"biharlife",tag:"vlogs",alt:"biharlife",label:"Niche vlogs: Curly Tales, village life & hidden Bihar and Jharkhand",otherDay:{tag:"parasnath",label:"Parasnath & Giridih: niche documentaries"}},
    {from:16,to:17,cat:"biharlife",tag:"gurus",alt:"biharlife",label:"Bihar's gurus: Anand Kumar & HC Verma"},
    {from:17,to:19,cat:"biharlife",tag:"vlogs",alt:"biharlife",label:"Evening vlogs: Curly Tales & hidden Bihar and Jharkhand",weekend:{tag:"sharda",label:"Weekend: Sharda Sinha & Nadiya Ke Paar, back to back"}},
    {from:19,to:22,cat:"bihar",preferMin:15,label:"Prime-time regional news"},
    {from:22,to:23,cat:"biharlife",tag:"legends",alt:"biharlife",label:"Late night: Legends of Bihar, back to back"},
    {from:23,to:24,cat:"biharlife",tag:"gurus",alt:"biharlife",label:"Late night: Anand Kumar & HC Verma"}]},
  {key:"fiction",n:28,group:"Entertainment",name:"Fiction",en:"Web series, short films & DD classics",parts:[
    {from:0,to:2,  cat:"fiction",src:"ALTER|DUST",label:"Midnight thrillers"},
    {from:2,to:6,  cat:"fiction",src:"Omeleto|DUST",label:"World short films"},
    {from:6,to:10, cat:"fiction",tag:"mytho",label:"Doordarshan mornings: Ramayan, Chanakya, Upanishad Ganga"},
    {from:10,to:14,cat:"fiction",src:"TVF|Dice Media|Terribly Tiny|Royal Stag|FilterCopy|Pocket Films",label:"Indian web series & shorts"},
    {from:14,to:18,cat:"fiction",tag:"dd",label:"Old but gold: Byomkesh, Fauji, Malgudi Days"},
    {from:18,to:22,cat:"fiction",src:"TVF|Dice Media|Terribly Tiny|Royal Stag|FilterCopy|Pocket Films",label:"Prime-time stories"},
    {from:22,to:24,cat:"fiction",src:"Omeleto|DUST|ALTER",label:"Late-night shorts"}]},
  {key:"retro",n:29,group:"Entertainment",name:"Retro Movies",en:"Classic Hindi films",parts:[
    {from:0,to:6,  cat:"retro",label:"Late-night classics"},
    {from:6,to:12, cat:"retro",label:"Morning show"},
    {from:12,to:18,cat:"retro",label:"Matinee"},
    {from:18,to:24,cat:"retro",label:"Prime-time classics"}]},
  {key:"premium",n:30,group:"Entertainment",name:"Classics",en:"Great films from India & the world",parts:[
    {from:0,to:6,  cat:"premium",src:"Mosfilm",label:"World cinema after midnight"},
    {from:6,to:14, cat:"premium",srcSkip:"Mosfilm",label:"Bollywood hits"},
    {from:14,to:18,cat:"masters",alt:"premium",label:"Indian masters: Ray & art cinema"},
    {from:18,to:22,cat:"premium",srcSkip:"Mosfilm",label:"Prime-time blockbuster"},
    {from:22,to:24,cat:"premium",src:"Mosfilm",label:"World cinema classics"}]},
  // South Gems (by request, 21 Nov): critically acclaimed South Indian films only, dubbed in Hindi (js/catalog.js, "southgems")
  {key:"southgems",n:31,group:"Entertainment",name:"South Gems",en:"Critically acclaimed South Indian films, in Hindi",parts:[{from:0,to:24,cat:"southgems",label:"Acclaimed South films, in Hindi"}]},
  // ---- Music ----
  // Hand-picked, by request: only these songs (category "select": js/catalog.js and scripts/feeds.json), shuffled together.
  // mix: each set takes its turn, its songs in their own shuffled run, so none repeats before the rest of its set has played;
  // a set's share of the day is the square root of its size, so Aujla's sixty-odd videos don't drown Saiyaara's ten
  {key:"select",n:32,group:"Music",name:"Select",en:"Favourites",parts:[ // spotify: the user's Spotify songs (playlists Big Dawgs, No Idea, After Hours), each matched to an official upload; 12 h a day of them (share 0.5), mixed in with the rest, by request
    {from:0,to:24,cat:"select",mix:[{tag:"spotify",share:0.5},{tag:"dhurandhar"},{tag:"saiyaara"},{tag:"diljit"},{tag:"aujla"},{tag:"mirzapur"},{tag:"f1"},{tag:"soul"}],label:"Favourites"}]}, // soul: songs like Ruposh and Jhol (by request, 23 Nov 2026)
  {key:"bollywood",n:33,group:"Music",name:"Desi Pop",en:"Arijit, Shreya Ghoshal, this week's trending songs, trending on Reels & India's OG artists",oldSlugs:["bollywood-now"],
   // Songs whose picture is never shown, by request (revealing, item-song or sexual visuals, or marked 18+): each plays as
   // its official audio-only track, with the album's cover art, or not at all until it has one (heard in js/scheduler.js;
   // scripts/find-audio.mjs finds the tracks). Besides the chart songs the nightly fetch flags from their tags (cover: 1, scripts/home.mjs):
   // titles naming such a film or performer, and songs named one by one (ZiD's "Saanson Ko", which started it)
   cover:{match:String.raw`\b(zid|murder( [23])?|jism( 2)?|hate story|ragini mms|the dirty picture|khamoshiyan|wajah tum ho|mastizaade|grand masti|kyaa super kool|gandii baat|julie 2|ek paheli leela|one night stand|raaz (3|reboot)|sunny leone|mallika sherawat|poonam pandey|nora fatehi|rakhi sawant|claudia ciesla|item (song|number)|hot (songs?|scenes?|videos?)|bikini|bed ?scenes?|18 ?\+|uncensored|unrated|nude|naked|topless)\b`,
     ids:["fzDEaX1OY98","4F2jDMgioqk","0bAVd9jJE2Q","kPmAJPUVY8I"]}, // Saanson Ko (video, lyrical), Aashiq Banaya Aapne, Balma
   parts:[  // Indian languages but the South's (Deccan Chargers has those; the chart's songs with only foreign artists go to Global Hits); artist spotlights back to back, by request: India's YouTube chart 5 h, Shreya Ghoshal 4 h, Arijit 3 h, modern film classics (Dhurandhar, Ramayana...) 2.3 h, Diljit 0.5 h and Hanumankind 0.5 h a day, his songs dropped in through the morning, midday and prime time
    {from:0,to:2,  cat:"modern",alt:"desipop",boost:{tag:"dhurandhar",every:5},label:"Modern classics: Dhurandhar, Ramayana, Saiyaara & the new film hits"},
    {from:2,to:4,  cat:"desipop",tag:"voices",srcSkip:"Arijit|Shreya",alt:"desipop",label:"OG voices: Daler Mehndi, Atif Aslam & KK"}, // Arijit and Shreya have hours of their own
    {from:4,to:5,  cat:"desipop",tag:"diljit",alt:"desipop",boost:{tag:"diljitfilm",every:3},label:"Diljit Dosanjh: Naina, Naram Kaalja & the Punjabi hits"}, // his one hour a day, by request
    {from:5,to:7,  cat:"desipop",tag:"indie",srcSkip:"Hanumankind",alt:"desipop",boost:{src:"Hanumankind",every:7},label:"OG desi artists: DIVINE, Seedhe Maut, KR$NA, Hanumankind & Karan Aujla"}, // Hanumankind only by the boost, so his half hour stays half an hour
    {from:7,to:9,  cat:"desipop",src:"Shreya",alt:"desipop",label:"Shreya Ghoshal, back to back"},
    {from:9,to:10, cat:"desipop",tag:"amit",alt:"desipop",label:"Amit Trivedi, back to back"},
    {from:10,to:12,cat:"desipop",tag:"trending",alt:"desipop",boost:{src:"Hanumankind",every:12},label:"Trending now: India's top songs this week"},
    {from:12,to:13,cat:"raag",tag:"coke",alt:"desipop",label:"Coke Studio bests"},
    {from:13,to:14,cat:"desipop",tag:"wasseypur",alt:"desipop",label:"Gangs of Wasseypur & Sneha Khanwalkar"},
    {from:14,to:15,cat:"desipop",tag:"shubh",alt:"desipop",label:"Shubh, back to back"},
    {from:15,to:16,cat:"modern",alt:"desipop",boost:{tag:"dhurandhar",every:5},label:"Modern classics: Dhurandhar, Ramayana, Saiyaara & the new film hits"},
    {from:16,to:17,cat:"desipop",src:"Shreya",alt:"desipop",label:"Shreya Ghoshal, back to back"},
    {from:17,to:18,cat:"desipop",tag:"amit",alt:"desipop",label:"Amit Trivedi, back to back"},
    {from:18,to:21,cat:"desipop",tag:"trending",alt:"desipop",boost:{src:"Hanumankind",every:16},label:"Prime time: trending now, India's top songs this week"},
    {from:21,to:24,cat:"desipop",src:"Arijit",alt:"desipop",label:"Prime time: Arijit Singh, back to back"},
    // trending on Reels (by request, 22 Nov 2026; 1.5 hours a day since 23 Nov, by request): 11-11:45 am and 7-7:45 pm by the clock (fixed: prime time's
    // stretch leaves them there); YouTube's official charts of the songs India makes Shorts with, weekly and daily (feeds.json)
    {from:11,to:11.75,fixed:true,cat:"desipop",tag:"reels",alt:"desipop",label:"Trending on Reels: the songs India is making Reels and Shorts with"},
    {from:19,to:19.75,fixed:true,cat:"desipop",tag:"reels",alt:"desipop",label:"Evening: trending on Reels"}]},
  {key:"drive",n:34,group:"Music",name:"Drive",en:"Road-trip songs",parts:[{from:0,to:24,cat:"drive",label:"Road-trip playlist"}]},
  // festival: songs for today's festival from js/festivals.js, or the next one coming up (the Festivals channel, renamed by request).
  // No devotional songs, by request: bhajans, aartis, kirtans, shabads, qawwalis and carols play on Bhakti or not at all.
  // skip: festivals whose songs are all worship, passed over for the next one; exclude: titles, excludeSrc: sources never played
  {key:"festival",n:35,group:"Music",name:"Vibe",oldSlugs:["festivals"],en:"Festival party songs: Diwali, Holi, garba, Lohri, Eid, Christmas & New Year",festival:{
    skip:"^fest-(ram|chhath|shivratri|janmashtami|gurpurab)$",
    exclude:String.raw`bhajan|aarti|aarati|\barti\b|chalisa|stuti|vandana|vandna|mantra|stotra|stotr|ashtak|shatakam|shlok|\bpuja\b|pooja|pujan|bhakti|kirtan|shabad|gurbani|qawwal|qavval|kavvali|\bnaat\b|vrat katha|amritwani|maiya|\bmata\b|\bdevi\b|bhagwan|bhagvan|lakshmi|laxmi|ganesh|ganpati|ganapati|bappa|\bshiv\b|shiva|shankar|shambh|bhole|bhola|mahadev|mahakal|\bram\b|shri ram|siya ram|krishna|krishn\b|kanha|govind|gopal|shyam|radhe|hanuman|bajrang|durga|\bambe\b|jagdamba|mardini|aigiri|jhanki|chhath|carol|hymn|holy night|silent night|stille nacht|manger|allah|khwaja|khvaja|maula`,
    excludeSrc:"bhakti|bhajan|shabad|kirtan|qawwal|choir|sounds of isha|sanskrit channel|tilak|mayapur|barsana|lathmar|vrat katha|mardini",
    min:12, // festivals left with fewer songs than this are passed over too
    ahead:14, party:["fest-diwali","fest-newyear","fest-holi","fest-lohri"]},parts:[]}, // a festival's songs from two weeks before it; party songs in between
  {key:"hits2010",n:36,group:"Music",name:"2010s Hits",en:"Bollywood 2010-2019",parts:[{from:0,to:24,cat:"hits2010",label:"2010s hits"}]},
  {key:"hits2000",n:37,group:"Music",name:"2000s Hits",en:"Bollywood 2000-2009",parts:[{from:0,to:24,cat:"hits2000",label:"2000s hits"}]},
  {key:"hits90",n:38,group:"Music",name:"90s Hits",en:"Bollywood 1990-1999",parts:[{from:0,to:24,cat:"hits90",label:"90s hits", // audio-only uploads first (by request): most of the airtime,
    mix:[{tag:"audio",share:0.6,once:true},{notTag:"audio"}]}]}, // as long as none comes round twice a day. By request, 21 Nov: official 90s playlists, long uploads too
  {key:"deccan",n:39,group:"Music",name:"Deccan Chargers",en:"Anirudh, A. R. Rahman, Ilaiyaraaja, Keeravaani & South Indian bangers",parts:[  // the one channel outside Hindi & English, by request; composer spotlights back to back, by request: Anirudh 9 h, Ilaiyaraaja 4 h, A. R. Rahman 3 h, Keeravaani 2 h, Sai Abhyankkar 2 h a day
    {from:0,to:2,   cat:"deccan",src:"Ilaiyaraaja",alt:"deccan",label:"Midnight melodies: Ilaiyaraaja, back to back"},
    {from:2,to:3,   cat:"deccan",tag:"keeravani",alt:"deccan",label:"M. M. Keeravaani, back to back"},
    {from:3,to:5,   cat:"deccan",tag:"anirudh",alt:"deccan",label:"Anirudh, back to back"},
    {from:5,to:6,   cat:"deccan",tag:"rahman",alt:"deccan",label:"A. R. Rahman, back to back"},
    {from:6,to:7,   cat:"deccan",src:"Ilaiyaraaja",alt:"deccan",label:"Morning melodies: Ilaiyaraaja"},
    {from:7,to:8,   cat:"deccan",src:"Sai Abhyankkar",alt:"deccan",label:"Sai Abhyankkar, back to back"},
    {from:8,to:10,  cat:"deccan",tag:"anirudh",alt:"deccan",label:"Anirudh, back to back"},
    {from:10,to:11, cat:"deccan",tag:"rahman",alt:"deccan",label:"A. R. Rahman, back to back"},
    {from:11,to:12, cat:"deccan",tag:"malayalam",alt:"deccan",label:"Malayalam bangers"},
    {from:12,to:13, cat:"deccan",tag:"telugu",alt:"deccan",label:"Telugu mass"},
    {from:13,to:14, cat:"deccan",tag:"chart",alt:"deccan",label:"Trending now: the South's songs on India's YouTube chart"}, // sorted off Desi Pop's chart (scripts/home.mjs), by request
    {from:14,to:15, cat:"deccan",tag:"anirudh",alt:"deccan",label:"Anirudh, back to back"},
    {from:15,to:16, cat:"deccan",tag:"keeravani",alt:"deccan",label:"M. M. Keeravaani, back to back"},
    {from:16,to:17, cat:"deccan",src:"Anirudh|Sai Abhyankkar|Thaman",alt:"deccan",label:"Anirudh & co: Sai Abhyankkar, Thaman"},
    {from:17,to:18, cat:"deccan",src:"Sai Abhyankkar",alt:"deccan",label:"Sai Abhyankkar, back to back"},
    {from:18,to:19, cat:"deccan",tag:"tamil",alt:"deccan",label:"Prime time: Tamil kuthu & bangers"},
    {from:19,to:21, cat:"deccan",tag:"anirudh",alt:"deccan",label:"Prime time: Anirudh, back to back"},
    {from:21,to:22, cat:"deccan",tag:"rahman",alt:"deccan",label:"Prime time: A. R. Rahman, back to back"},
    {from:22,to:23, cat:"deccan",tag:"anirudh",alt:"deccan",label:"Late night: Anirudh, back to back"},
    {from:23,to:24, cat:"deccan",src:"Ilaiyaraaja",alt:"deccan",label:"Late night: Ilaiyaraaja, back to back"}]},
  {key:"anthems",n:40,group:"Music",name:"Anthems",en:"Coldplay & friends",parts:[{from:0,to:24,cat:"anthems",label:"Big-chorus pop & rock"}]},
  {key:"english",n:41,group:"Music",name:"Global Hits",en:"The world's top hits, every language, and an hour of Ed Sheeran",oldSlugs:["english-songs"],parts:[  // any language, by request. Select's songs by foreign artists mixed into the chart and all-time hours, a quarter of the time, and Ed Sheeran's hour, by request (22 Nov 2026)
    {from:0,to:3,  cat:"global",tag:"alltime",alt:"global",mix:[{},{cat:"select",home:"foreign",share:0.25}],label:"Billion-view classics & Select's favourites"},
    {from:3,to:6,  cat:"global",tag:"worldcharts",alt:"global",label:"World tour: Seoul, Tokyo & Johannesburg charts"},
    {from:6,to:9,  cat:"global",tag:"chart",alt:"global",mix:[{},{cat:"select",home:"foreign",share:0.25}],label:"Morning chart: this week's global top 100 & Select's favourites"},
    {from:9,to:12, cat:"global",tag:"worldcharts",alt:"global",label:"K-pop, J-pop & Amapiano: the world's charts"},
    {from:12,to:15,cat:"global",tag:"chart",alt:"global",mix:[{},{cat:"select",home:"foreign",share:0.25}],label:"Daily global chart & Select's favourites"},
    {from:15,to:18,cat:"global",tag:"alltime",alt:"global",mix:[{},{cat:"select",home:"foreign",share:0.25}],label:"All-time most viewed & Select's favourites"},
    {from:18,to:24,cat:"global",tag:"chart",alt:"global",mix:[{},{cat:"select",home:"foreign",share:0.25}],label:"Prime time: the global top 100, US & UK charts & Select's favourites"},
    // Ed Sheeran's hour (by request): 9 to 10 pm by the clock (fixed: prime time's stretch leaves it where it is), his official music videos (js/catalog.js)
    {from:21,to:22,fixed:true,cat:"edsheeran",alt:"global",label:"Ed Sheeran: an hour of his own"}]},
  {key:"gym",n:42,group:"Music",name:"Gym",en:"Punjabi, desi hip-hop, rap, rock & phonk bangers",parts:[
    {from:0,to:4,  cat:"gym",tag:"phonk",alt:"gym",label:"Phonk after dark"},
    {from:4,to:6,  cat:"gym",tag:"rock",alt:"gym",label:"Early riser: rock"},
    {from:6,to:9,  cat:"gym",tag:"punjabi",alt:"gym",boost:{id:"4DfVxVeqk2o",cat:"punjabi",every:5},label:"Morning set: Punjabi gym bangers"},
    {from:9,to:12, cat:"gym",tag:"rap",alt:"gym",label:"Power hour: rap"},
    {from:12,to:14,cat:"gym",tag:"dhh",alt:"gym",boost:{id:"4DfVxVeqk2o",cat:"punjabi",every:5},label:"Desi hip-hop"},
    {from:14,to:17,cat:"gym",tag:"punjabi",alt:"gym",boost:{id:"4DfVxVeqk2o",cat:"punjabi",every:5},label:"Punjabi heavyweights"},
    {from:17,to:19,cat:"gym",tag:"rock",alt:"gym",label:"Heavy set: rock & metal"},
    {from:19,to:21,cat:"gym",tag:"dhh",alt:"gym",boost:{id:"4DfVxVeqk2o",cat:"punjabi",every:5},label:"Prime-time desi hip-hop"},
    {from:21,to:24,cat:"gym",tag:"phonk",alt:"gym",label:"Late set: phonk & rap"}]},
  {key:"punjabi",n:43,group:"Music",name:"Punjabi",en:"Karan Aujla, Diljit, Shubh, Sidhu Moose Wala & Punjabi bangers",parts:[  // Karan Aujla, Diljit and Shubh back to back, 6 h each a day, and 52 Bars a lot, by request; Sidhu Moose Wala 2 h (23 Nov 2026, by request), and in the bangers
    {from:0,to:2,  cat:"punjabi",tag:"diljit",alt:"punjabi",label:"Diljit Dosanjh, back to back"},
    {from:2,to:4,  cat:"punjabi",srcSkip:"Aujla",boost:{id:"4DfVxVeqk2o",every:5},label:"Bangers"},
    {from:4,to:6,  cat:"punjabi",tag:"shubh",alt:"punjabi",label:"Shubh, back to back"},
    {from:6,to:8,  cat:"punjabi",tag:"aujla",alt:"punjabi",label:"Karan Aujla, back to back: Softly, Wavy, Tauba Tauba & the chartbusters"},
    {from:8,to:10, cat:"punjabi",tag:"sidhu",alt:"punjabi",label:"Sidhu Moose Wala, back to back: So High, 295, Legend & the classics"},
    {from:10,to:12,cat:"punjabi",tag:"shubh",alt:"punjabi",label:"Shubh, back to back"},
    {from:12,to:14,cat:"punjabi",tag:"diljit",alt:"punjabi",label:"Diljit Dosanjh, back to back"},
    {from:14,to:16,cat:"punjabi",tag:"aujla",alt:"punjabi",label:"Karan Aujla, back to back"},
    {from:16,to:18,cat:"punjabi",tag:"shubh",alt:"punjabi",label:"Shubh, back to back"},
    {from:18,to:20,cat:"punjabi",tag:"diljit",alt:"punjabi",label:"Prime time: Diljit Dosanjh, back to back"},
    {from:20,to:22,cat:"punjabi",tag:"aujla",alt:"punjabi",label:"Prime time: Karan Aujla, back to back"},
    {from:22,to:24,cat:"punjabi",srcSkip:"Aujla",boost:{id:"4DfVxVeqk2o",every:5},label:"Late night bangers"}]},
  {key:"raag",n:44,group:"Music",name:"Raag",en:"Sitar, santoor, classical voices & Coke Studio",parts:[
    {from:0,to:5,  cat:"raag",tag:"inst",label:"Late-night sitar & santoor"},
    {from:5,to:9,  cat:"raag",tag:"vocal",label:"Morning ragas: khayal, thumri & bhajan"},
    {from:9,to:13, cat:"raag",tag:"inst",label:"Sitar & santoor"},
    {from:13,to:17,cat:"raag",tag:"coke",label:"Coke Studio classics"},
    {from:17,to:20,cat:"raag",tag:"vocal",label:"Evening thumri & khayal"},
    {from:20,to:23,cat:"raag",tag:"coke",label:"Coke Studio prime time"},
    {from:23,to:24,cat:"raag",tag:"inst",label:"Night ragas"}]},
  // Sadabahar (by request, 21 Nov): the hits of the 60s, 70s and 80s mostly, Kishore Kumar, Lata Mangeshkar, Mohammed Rafi
  // and Mukesh the top singers (Kishore and Lata about 5.5 h a day each, Rafi and Mukesh about 3.5 h), very few songs from
  // before the 60s (the sources skip a title naming a 1930s-50s year; scripts/feeds.json). Each singer has hours of their own,
  // the decades theirs, and prime time and the night play two or four of them in turn (mix).
  {key:"geet",n:45,group:"Music",name:"Sadabahar",en:"Evergreen hits of the 60s, 70s & 80s: Kishore, Lata, Rafi & Mukesh",parts:[
    {from:0,to:2,   cat:"geet",tag:"kishore",alt:"geet",label:"Kishore Kumar, back to back"},
    {from:2,to:4,   cat:"geet",tag:"lata",alt:"geet",label:"Lata Mangeshkar, back to back"},
    {from:4,to:6,   cat:"geet",tag:"rafi",alt:"geet",label:"Mohammed Rafi, back to back"},
    {from:6,to:8,   cat:"geet",tag:"mukesh",alt:"geet",label:"Mukesh, back to back"},
    {from:8,to:10,  cat:"geet",tag:"60s",alt:"geet",label:"Hits of the 60s"},
    {from:10,to:12, cat:"geet",tag:"70s",alt:"geet",label:"Hits of the 70s"},
    {from:12,to:14, cat:"geet",tag:"kishore",alt:"geet",label:"Kishore Kumar, back to back"},
    {from:14,to:16, cat:"geet",tag:"lata",alt:"geet",label:"Lata Mangeshkar, back to back"},
    {from:16,to:18, cat:"geet",tag:"80s",alt:"geet",label:"Hits of the 80s"},
    {from:18,to:20, cat:"geet",mix:[{tag:"kishore"},{tag:"rafi"}],alt:"geet",label:"Prime time: Kishore & Rafi"},
    {from:20,to:22, cat:"geet",mix:[{tag:"lata"},{tag:"mukesh"}],alt:"geet",label:"Prime time: Lata & Mukesh"},
    {from:22,to:24, cat:"geet",mix:[{tag:"kishore"},{tag:"lata"},{tag:"rafi"},{tag:"mukesh"}],alt:"geet",label:"Late night: Kishore, Lata, Rafi & Mukesh"}]},
  {key:"bhakti",n:46,group:"Music",name:"Bhakti",en:"Devotional, today's trending bhajans, and the coming festival's bhajans",parts:[  // festivalNext: 8 h a day of the Hindu festival on now or within two weeks (its bhajans and aartis only), by request; plain devotional otherwise
    {from:0,to:4,  cat:"bhakti",label:"Devotional"},
    {from:4,to:5,  cat:"bhakti",tag:"mrityunjay",label:"4 am, Brahma muhurat: Mahamrityunjay Mantra · Anuradha Paudwal"}, // by request
    {from:5,to:6,  cat:"bhakti",festivalNext:true,label:"Devotional"},
    {from:6,to:6.5,cat:"bhakti",tag:"ashtak",label:"Subah: Sankatmochan Hanuman Ashtak"},
    {from:6.5,to:7,cat:"bhakti",tag:"chalisa",label:"Shree Hanuman Chalisa"},
    {from:7,to:8,  cat:"bhakti",src:"Hariharan",alt:"bhakti",label:"Hariharan bhajans"},
    {from:8,to:11, cat:"bhakti",festivalNext:true,label:"Devotional"},
    {from:11,to:17,cat:"bhakti",mix:[{tag:"trending",share:0.25},{notTag:"trending"}],label:"Devotional, with India's trending bhajans"}, // the charts' devotional songs (Desi Pop's sources send them here, by request): a quarter of these hours
    {from:17,to:21,cat:"bhakti",festivalNext:true,label:"Evening devotional"},
    {from:21,to:24,cat:"bhakti",label:"Devotional"}]},
  // ---- Latest ----
  // Sargam (by request, 22 Nov 2026): background scores without vocals. The day follows a mood: rain, zen and calm through
  // the night, santoor and flute in the morning and late afternoon, lofi and Hans Zimmer to focus by, the epic scores
  // (Hans Zimmer, Batman, Spider-Man, Marvel) in the evening, then the series' themes, and a calm hour before midnight
  {key:"sargam",n:47,group:"Music",name:"Sargam",en:"Background scores, no vocals: Hans Zimmer, themes, lofi, sitar, santoor, Indian flute, rain & zen",parts:[
    {from:0,to:2,  cat:"sargam",mix:[{tag:"bansuri",share:0.35},{tag:"calm"}],label:"Night: zen, Buddhist calm & Indian flute"},
    {from:2,to:5,  cat:"sargam",tag:"rain",alt:"sargam",label:"Rain for deep sleep"}, // rain recordings run for hours: a stretch of their own, not turns in a mix
    {from:5,to:8,  cat:"sargam",mix:[{tag:"sitar",share:0.25},{tag:"santoor",share:0.25},{tag:"flute",share:0.25},{tag:"bansuri"}],label:"Morning: sitar, santoor & Indian flute"},
    {from:8,to:12, cat:"sargam",mix:[{tag:"zimmer",share:0.35},{tag:"lofitop",share:0.25},{tag:"lofi"}],label:"Focus: lofi & Hans Zimmer"},
    {from:12,to:16,cat:"sargam",mix:[{tag:"lofi",share:0.3},{tag:"lofitop",share:0.15},{tag:"bansuri",share:0.25},{tag:"calm"}],label:"Lofi, calm & Indian flute"},
    {from:16,to:19,cat:"sargam",mix:[{tag:"sitar",share:0.25},{tag:"santoor",share:0.25},{tag:"flute",share:0.15},{tag:"bansuri",share:0.15},{tag:"calm"}],label:"Sitar, santoor, Indian flute & soothing music"},
    {from:19,to:22,cat:"sargam",mix:[{tag:"zimmer"},{tag:"batman"},{tag:"spiderman"},{tag:"marvel"}],label:"Epic scores: Hans Zimmer, Batman, Spider-Man & Marvel"},
    {from:22,to:23,cat:"sargam",mix:[{tag:"series"},{tag:"marvel"}],label:"Themes: Game of Thrones, Stranger Things & more"},
    {from:23,to:24,cat:"sargam",mix:[{tag:"bansuri",share:0.3},{tag:"rain",share:0.2},{tag:"calm"}],label:"Cortisol reset: calm & Indian flute before sleep"}]},
];
// A channel's name in addresses, for its /<name>/ page and ?ch=<name> links ("Desi Pop" -> desi-pop). Unlike its
// number it stays the same when channels are reordered, so shared links keep pointing at the same channel.
const chSlug=c=>c.name.toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
