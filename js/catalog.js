/* ---------- Catalog: real YouTube uploads, tagged so rules can select them ---------- */
const CATALOG = [
  // Bhakti
  // Hanuman Chalisa, for Bhakti's morning slot (official uploads)
  {id:"AETFvQonfV8",t:"Hanuman Chalisa · Gulshan Kumar, Hariharan",cat:"bhakti",tag:"chalisa",lang:"hi",min:10,src:"T-Series Bhakti Sagar"},
  {id:"17ZHT4WbSfw",t:"Hanuman Chalisa · Hariharan",cat:"bhakti",tag:"chalisa",lang:"hi",min:10,src:"T-Series Bhakti Sagar"},
  {id:"jTNu-R9KA-4",t:"Hanuman Chalisa · Shankar Mahadevan",cat:"bhakti",tag:"chalisa",lang:"hi",min:10,src:"Tips Bhakti Prem"},
  {id:"BC6TNttdIZM",t:"Hanuman Chalisa · Shankar Mahadevan",cat:"bhakti",tag:"chalisa",lang:"hi",min:10,src:"Times Music Spiritual"},
  // Mahamrityunjay Mantra, Bhakti's 4 am hour (by request)
  {id:"_h4ViYdDwYI",t:"Mahamrityunjay Mantra · Anuradha Paudwal",cat:"bhakti",tag:"mrityunjay",lang:"hi",min:60,src:"T-Series Bhakti Sagar",pub:"2022-02-13"},
  // Sankatmochan Hanuman Ashtak, for Bhakti's morning slot (official uploads)
  {id:"HH_a6aRO1TE",t:"Sankatmochan Hanuman Ashtak · Hariharan",cat:"bhakti",tag:"ashtak",lang:"hi",min:7,src:"T-Series Bhakti Sagar"},
  {id:"MeaVRC453M0",t:"Hanuman Ashtak · Hariharan",cat:"bhakti",tag:"ashtak",lang:"hi",min:7,src:"T-Series Bhakti Sagar"},
  {id:"1zS2sgVEjvs",t:"Sankat Mochan Hanuman Ashtak · Hari Om Sharan",cat:"bhakti",tag:"ashtak",lang:"hi",min:8,src:"T-Series Bhakti Sagar"},
  {id:"5hKao7gACW4",t:"Mangalvar special: Sankatmochan Hanuman Ashtak",cat:"bhakti",tag:"ashtak",lang:"hi",min:7,src:"T-Series Bhakti Sagar"},
  {id:"Y2bvXiTQ1Ak",t:"Shri Hanuman Ashtak",cat:"bhakti",tag:"ashtak",lang:"hi",min:8,src:"Shemaroo Bhakti"},
  {id:"0PX4YuWBaXQ",t:"Sankat Mochan Hanuman Ashtak",cat:"bhakti",tag:"ashtak",lang:"hi",min:7,src:"Zee Music Devotional"},
  {id:"nh9pJNL79ps",t:"Hanuman Chalisa · Geeta Rabari",cat:"bhakti",tag:"chalisa",lang:"hi",min:8,src:"Geeta Rabari"},
  {id:"gLZO6O9v-IY",t:"Shree Hanuman Chalisa",cat:"bhakti",lang:"hi",min:11,src:"Bhakti"},
  {id:"kC8VzzPPY2A",t:"Hanuman Chalisa with lyrics",cat:"bhakti",lang:"hi",min:12,src:"Bhakti"},
  {id:"drC4vpQF4rM",t:"Shree Hanuman Chalisa · original video",cat:"bhakti",lang:"hi",min:5,src:"Bhakti"},
  // Rasoi
  {id:"_muhC_eL8Ec",t:"6 quick, healthy tiffins for kids",cat:"rasoi",lang:"hi",min:16,src:"Kabita's Kitchen"},
  {id:"HcV34Fe_Ph0",t:"Crispy nimki for evening hunger",cat:"rasoi",lang:"hi",min:5,src:"Kabita's Kitchen",tag:"snack"},
  {id:"yEMwra2ZjPE",t:"Healthy veg thali in two spoons of oil",cat:"rasoi",lang:"hi",min:10,src:"Kabita's Kitchen"},
  {id:"Exp3aP7Ojb0",t:"Special veg sandwich on the tawa",cat:"rasoi",lang:"hi",min:5,src:"Kabita's Kitchen",tag:"snack"},
  {id:"OCtjnPuxbxI",t:"One-teaspoon-oil breakfast",cat:"rasoi",lang:"hi",min:4,src:"Kabita's Kitchen"},
  // Sehat (yoga)
  {id:"VcUkvIVkVGs",t:"Warm-up yoga for beginners",cat:"sehat",lang:"hi",min:11,src:"Yoga",tag:"yoga"},
  {id:"Q3_0NZwBE7g",t:"20-minute daily yoga for beginners",cat:"sehat",lang:"hi",min:23,src:"Art of Living",tag:"yoga"},
  {id:"G8x2WscstH0",t:"15-minute daily yoga",cat:"sehat",lang:"hi",min:16,src:"Yoga",tag:"yoga"},
  {id:"0efkVn-I5gk",t:"Morning yoga for beginners",cat:"sehat",lang:"hi",min:32,src:"Yoga",tag:"yoga"},
  {id:"DbbsVGkZ1Ck",t:"How to start yoga, part 1",cat:"sehat",lang:"hi",min:7,src:"Yoga",tag:"yoga"},
  // Sadabahar (evergreen songs)
  // Gyaan (knowledge)
  {id:"oyw87aNY42E",t:"Passage to the Moon · Chandrayaan-1, part 2",cat:"gyaan",lang:"en",min:10,src:"ISRO"},
  {id:"K2YaqO6loyU",t:"The full story of Chandrayaan-2",cat:"gyaan",lang:"en",min:44,src:"Documentary"},
  {id:"G8r_abcjX6U",t:"The birth of ISRO",cat:"gyaan",lang:"en",min:4,src:"Documentary"},
  {id:"l61RMuMxBiA",t:"Chandrayaan-1 explained in 3 minutes",cat:"gyaan",lang:"en",min:4,src:"Explainer"},
  // Hasya (comedy)
  {id:"ZQOp12Yu3o0",t:"Lockdown ke side effects",cat:"hasya",lang:"hi",min:14,src:"Ashish Chanchlani"},
  {id:"WDiK14qI3pQ",t:"Restaurant sutiyapa",cat:"hasya",lang:"hi",min:13,src:"Ashish Chanchlani"},
  {id:"WsqnZvsBTQ0",t:"Cinemas: then vs now",cat:"hasya",lang:"hi",min:14,src:"Ashish Chanchlani"},
  {id:"JznTUVongfk",t:"Diwali har ghar ki",cat:"hasya",lang:"hi",min:11,src:"Ashish Chanchlani"},
  {id:"61xbuz0_Y6I",t:"Lockdown with parivar",cat:"hasya",lang:"hi",min:11,src:"Ashish Chanchlani"},
  {id:"vLs1v0GRR18",t:"Flat lime soda · sketch",cat:"hasya",lang:"en",min:7,src:"Kenny Sebastian & Kanan Gill"},
  {id:"G9eCM6F6jLk",t:"Audience interaction · family comedian",cat:"hasya",lang:"hi",min:16,src:"Rakesh Addlakha"},
  // Khel (sports)
  {id:"rW_fwcmyIfk",t:"Neeraj Chopra wins historic gold · Tokyo 2020",cat:"khel",lang:"en",min:4,src:"Olympics"},
  {id:"S3w6rysLXdQ",t:"The best of PV Sindhu at the Olympics",cat:"khel",lang:"en",min:9,src:"Olympics"},
  {id:"JP2jo285Q-s",t:"India men's hockey: top 10 goals",cat:"khel",lang:"en",min:6,src:"FIH Hockey"},
  {id:"HuqaOWc3wsc",t:"India vs Pakistan · hockey highlights",cat:"khel",lang:"hi",min:10,src:"FIH Hockey"},
  {id:"H7q7q1IwEY4",t:"India beat Pakistan to reach the final · 2011 World Cup",cat:"khel",lang:"hi",min:10,src:"ICC"},
  {id:"IXKu3w5-glc",t:"IND v AUS · 2016 T20 World Cup · Hindi highlights",cat:"khel",lang:"hi",min:8,src:"ICC"},
  // Vigyan (science)
  {id:"p9pPjASnnxw",t:"Quantum mechanics in simple words",cat:"vigyan",lang:"en",min:8,src:"Science ABC"},
  {id:"5-2NLHB4Gxg",t:"Work, force & energy · Dr. Binocs",cat:"vigyan",lang:"en",min:7,src:"Peekaboo Kidz"},
  {id:"suQDwZcnJdg",t:"Gravity · Dr. Binocs",cat:"vigyan",lang:"en",min:4,src:"Peekaboo Kidz"},
  {id:"6dj48zWlbGc",t:"Low-cost science experiments · matchbox models",cat:"vigyan",lang:"hi",min:26,src:"Arvind Gupta"},
  {id:"l83ZbSrbUnk",t:"How the organs of our body work",cat:"vigyan",lang:"hi",min:40,src:"Binocs Ki Duniya"},
  {id:"XzSxezvf_8g",t:"Electricity · experiments with a torch and circuits",cat:"vigyan",lang:"hi",min:9,src:"Bodhaguru"},
  {id:"esoQhorc1As",t:"3 easy science experiments with water",cat:"vigyan",lang:"hi",min:6,src:"Unacademy Live Laboratory"},
  {id:"vnfiSiR9cvI",t:"The human liver · Hindi",cat:"vigyan",lang:"hi",min:30,src:"Infinity Stream"},
  {id:"z4aOiALk2Fk",t:"The human brain · Hindi",cat:"vigyan",lang:"hi",min:34,src:"Infinity Stream"},
  // Purvaiya: Legends of Bihar (Nalanda, the Mauryas, Dinkar, Khan Sir), alongside the legends feeds
  {id:"XMDpjjNlL0I",t:"Nalanda University: a heritage for the world",cat:"biharlife",tag:"legends",lang:"hi",min:30,src:"Infinity Stream"},
  {id:"UlUsB-YskrE",t:"The complete story of Nalanda: from creation to destruction",cat:"biharlife",tag:"legends",lang:"hi",min:36,src:"kwy true tale"},
  {id:"FrvimejENnY",t:"Nalanda University: from shadows to the spotlight · History Hunter",cat:"biharlife",tag:"legends",lang:"hi",min:9,src:"Discovery Channel India"},
  {id:"EViwHo9a9ao",t:"The rise of Magadh · Khan Sir",cat:"biharlife",tag:"legends",lang:"hi",min:35,src:"KGS Bihar Exams"},
  {id:"rnDum-g8YYw",t:"The real story of UP & Bihar · Khan Sir",cat:"biharlife",tag:"legends",lang:"hi",min:24,src:"Khan Global Studies"},
  {id:"znUkgeisaNw",t:"Industry tour of Bihar · Khan Sir",cat:"biharlife",tag:"legends",lang:"hi",min:22,src:"Khan Global Studies"},
  {id:"K_BAYwjZjVs",t:"Mahakavi: Ramdhari Singh Dinkar · Kumar Vishwas",cat:"biharlife",tag:"legends",lang:"hi",min:38,src:"ABP News"},
  {id:"VThvLs0u2v8",t:"Virasat: Ramdhari Singh Dinkar",cat:"biharlife",tag:"legends",lang:"hi",min:59,src:"Sansad TV"},
  {id:"EVW4_gsZ070",t:"Ramdhari Singh 'Dinkar' · a film by Ritu Goel",cat:"biharlife",tag:"legends",lang:"hi",min:30,src:"Sahitya Akademi"},
  {id:"S2sNa405g8s",t:"The entire history of the Maurya Empire",cat:"biharlife",tag:"legends",lang:"hi",min:21,src:"Flashback Frenzy"},
  {id:"PDuLCOtzJZc",t:"Chandragupta Maurya: his remarkable rise to power",cat:"biharlife",tag:"legends",lang:"hi",min:16,src:"OnlyIAS Extended"},
  {id:"daff83ALIgo",t:"The true story of Chandragupta Maurya",cat:"biharlife",tag:"legends",lang:"hi",min:22,src:"Elevate beyond"},
  // Purvaiya: niche documentaries on Parasnath (Sammed Shikharji) and Giridih, on alternate days
  {id:"VYAaYrP6u9U",t:"Johar Giridih",cat:"biharlife",tag:"parasnath",lang:"hi",min:30,src:"DD Jharkhand"},
  {id:"X0NoM0nzSZA",t:"The history of Giridih",cat:"biharlife",tag:"parasnath",lang:"hi",min:13,src:"Usri Dhara"},
  {id:"kSEkYq9FMCM",t:"India: the dark side of mica mining",cat:"biharlife",tag:"parasnath",lang:"hi",min:43,src:"imineo Documentaires"},
  {id:"LMKKwfnOXd8",t:"Giridih: the holy land of Jharkhand",cat:"biharlife",tag:"parasnath",lang:"hi",min:5,src:"Nomadic Kunj"},
  {id:"wdNo1I0F6vY",t:"Parasnath: a 70 km solo journey to Jharkhand's highest peak",cat:"biharlife",tag:"parasnath",lang:"hi",min:9,src:"Sajid shah 33"},
  {id:"3-uIxwxr2OQ",t:"Parasnath Hill, Giridih: the 27 km trek",cat:"biharlife",tag:"parasnath",lang:"hi",min:25,src:"Aesthetic Nitish"},
  {id:"VGaf2zYqKis",t:"Parasnath Hill: Madhuban and the Jain temples",cat:"biharlife",tag:"parasnath",lang:"hi",min:18,src:"Amit Sharma Visuals"},
  {id:"25YSPWCaPic",t:"Parasnath Hill: Santhal tribals and the Jain community",cat:"biharlife",tag:"parasnath",lang:"hi",min:12,src:"Adivasi Stories"},
  {id:"mMq_zI4sQUQ",t:"The Parasnath Hill question, explained",cat:"biharlife",tag:"parasnath",lang:"hi",min:11,src:"Sanskriti IAS"},
  {id:"S0PY8BoGNgY",t:"Sammed Shikharji: the untold story",cat:"biharlife",tag:"parasnath",lang:"hi",min:5,src:"Dharmbhashi"},
  // Purvaiya: building Bihar & Jharkhand (Patna, Giridih, Deoghar, Nalanda district), alongside the infra feeds
  {id:"pIIzzDPPdY0",t:"Top 10 mega projects transforming Patna",cat:"biharlife",tag:"infra",lang:"hi",min:9,src:"All India Bihar"},
  {id:"3B9OOwhrffU",t:"Why India is building so many expressways in Bihar",cat:"biharlife",tag:"infra",lang:"hi",min:9,src:"All India Project"},
  {id:"LPp9xT12tYY",t:"Bihar's first expressway",cat:"biharlife",tag:"infra",lang:"hi",min:10,src:"All India Project"},
  {id:"XICBBtA6FPM",t:"Amas–Darbhanga Expressway",cat:"biharlife",tag:"infra",lang:"hi",min:3,src:"Megha Engineering"},
  {id:"dpKyxg6PbWk",t:"Patna Metro: the full update",cat:"biharlife",tag:"infra",lang:"hi",min:30,src:"RS Live"},
  {id:"GLze_Q-Bqrc",t:"Inside a Patna Metro station",cat:"biharlife",tag:"infra",lang:"hi",min:11,src:"Gauravwatch"},
  {id:"AOul0AkQsJE",t:"Giridih: the top 10 upcoming projects",cat:"biharlife",tag:"infra",lang:"hi",min:14,src:"Infraverse"},
  {id:"_YU_vcDuTCM",t:"Top 10 mega projects in Jharkhand",cat:"biharlife",tag:"infra",lang:"hi",min:10,src:"Scale of News"},
  {id:"2gpILfWojN0",t:"Jharkhand on the move: NHAI's highways",cat:"biharlife",tag:"infra",lang:"hi",min:6,src:"NHAI"},
  {id:"k2r1c8wJVKU",t:"Deoghar's new airport and ₹16,800 crore of projects",cat:"biharlife",tag:"infra",lang:"hi",min:9,src:"CNN-News18"},
  {id:"3AezKmLwiTo",t:"Nalanda in 2030: the top 10 projects",cat:"biharlife",tag:"infra",lang:"hi",min:8,src:"Chandradev Zone"},
  {id:"Uh622oIQx7k",t:"Rajgir's international cricket stadium from the air",cat:"biharlife",tag:"infra",lang:"hi",min:6,src:"Skyline Cinematics"},
  {id:"3BnItvPAtjE",t:"Bihar Sharif: the Bharaopar flyover",cat:"biharlife",tag:"infra",lang:"hi",min:7,src:"Local Info By TS"},
  {id:"l7FucqhBA0c",t:"West Patna from above: the metro and Gola Road",cat:"biharlife",tag:"infra",lang:"hi",min:5,src:"SoaringBK"},
  {id:"fWKSQErIpb0",t:"Patna Junction & Mithapur from above",cat:"biharlife",tag:"infra",lang:"hi",min:5,src:"SoaringBK"},
  // Purvaiya: niche Nalanda district (Rajgir, Pawapuri)
  {id:"jkmHX2VB2_E",t:"Rajgir Zoo Safari: the full tour",cat:"biharlife",tag:"vlogs",lang:"hi",min:20,src:"Vlogs With Sans"},
  {id:"OjAQt2vGurE",t:"Unexplored places of Rajgir",cat:"biharlife",tag:"vlogs",lang:"hi",min:8,src:"Shubron"},
  {id:"4Rw24_IphZY",t:"Son Bhandar caves, Maniyar Math & the glass bridge, Rajgir",cat:"biharlife",tag:"vlogs",lang:"hi",min:10,src:"Travel4Search"},
  {id:"4f4LX08Q7nM",t:"Pawapuri Jal Mandir: history and mystery",cat:"biharlife",tag:"vlogs",lang:"hi",min:5,src:"Tourister Boy"},
  {id:"A_Z5BXC65G4",t:"The story of Pavapuri",cat:"biharlife",tag:"vlogs",lang:"hi",min:4,src:"Hindu Rituals"},
  // Purvaiya: Bihar & Jharkhand festivals (Chhath, Shravani Mela, Sonepur Mela)
  {id:"040dAJcElxU",t:"Chhath: the full documentary",cat:"biharlife",tag:"festivals",lang:"hi",min:20,src:"Unseen Scenes"},
  {id:"z5C2HplvSMk",t:"At the world's biggest festival: Chhath Puja",cat:"biharlife",tag:"festivals",lang:"hi",min:21,src:"Unacademy"},
  {id:"pe8IZ2DlwNI",t:"Chhath Mahaparv",cat:"biharlife",tag:"festivals",lang:"hi",min:21,src:"The Screen Patti"},
  {id:"oZ4UK8G5_cQ",t:"Chhath par ghar lauta beta · TVF Diaries",cat:"biharlife",tag:"festivals",lang:"hi",min:20,src:"TVF"},
  {id:"ltPN3ZrAASI",t:"Witnessing Chhath Puja in Bihar · I Love My India",cat:"biharlife",tag:"festivals",lang:"hi",min:28,src:"Curly Tales"},
  {id:"Na0j1JIXMuE",t:"Sonpur Mela",cat:"biharlife",tag:"festivals",lang:"hi",min:52,src:"PSBT India"},
  {id:"0iZk5j1K_V0",t:"Fairs of India: Sonepur Mela",cat:"biharlife",tag:"festivals",lang:"hi",min:39,src:"Dhiraj Singh"},
  {id:"9ai8KbOTOHs",t:"Shravani Mela: the Kanwar walk to Deoghar",cat:"biharlife",tag:"festivals",lang:"hi",min:7,src:"WildFilmsIndia"},
  {id:"eUxNOmHjzdI",t:"Sultanganj to Baba Baidyanath Dham, Deoghar",cat:"biharlife",tag:"festivals",lang:"hi",min:14,src:"Bharat Darshan Vlog"},
  // Purvaiya: songs of Guide (1965), woven into the Nalanda hour
  {id:"dbZW8Dral8o",t:"Gaata Rahe Mera Dil · Guide (1965)",cat:"biharlife",tag:"guide",lang:"hi",min:5,src:"Guide (1965)"},
  {id:"lqBCgkBKlDc",t:"Aaj Phir Jeene Ki Tamanna Hai · Guide (1965)",cat:"biharlife",tag:"guide",lang:"hi",min:4,src:"Guide (1965)"},
  {id:"7cEpfhOYi7U",t:"Piya Tose Naina Laage Re · Guide (1965)",cat:"biharlife",tag:"guide",lang:"hi",min:14,src:"Guide (1965)"},
  {id:"42zACVzxsOg",t:"Tere Mere Sapne · Guide (1965)",cat:"biharlife",tag:"guide",lang:"hi",min:9,src:"Guide (1965)"},
  {id:"hu2khgJn7Vg",t:"Din Dhal Jaye · Guide (1965)",cat:"biharlife",tag:"guide",lang:"hi",min:5,src:"Guide (1965)"},
  {id:"nezFXDk4jYA",t:"Wahan Kaun Hai Tera · Guide (1965)",cat:"biharlife",tag:"guide",lang:"hi",min:5,src:"Guide (1965)"},
  // Purvaiya: Curly Tales in Bihar
  {id:"ltPN3ZrAASI",t:"Witnessing Chhath Puja in Bihar · I Love My India",cat:"biharlife",tag:"vlogs",lang:"hi",min:27,src:"Curly Tales"},
  {id:"bF1uSSUee2A",t:"Madhubani, Darbhanga & Saharsa · Dil Se Bihari E3",cat:"biharlife",tag:"vlogs",lang:"hi",min:25,src:"Curly Tales"},
  {id:"gPtxpqr4Ar8",t:"Amit Sial explores Gayaji, the city of moksha",cat:"biharlife",tag:"vlogs",lang:"hi",min:22,src:"Curly Tales"},
  {id:"vj9d3a5-s1o",t:"The three river islands of Kahalgaon · Dil Se Bihari E5",cat:"biharlife",tag:"vlogs",lang:"hi",min:27,src:"Curly Tales"},
  {id:"EIfn3LU0RVs",t:"Cooking a Bihari breakfast with Sanjay Mishra · Tere Gully Mein",cat:"biharlife",tag:"vlogs",lang:"hi",min:23,src:"Curly Tales"},
  {id:"K3lmpNR_Ig4",t:"Elli AvrRam explores Patna · India With Elli S2 E2",cat:"biharlife",tag:"vlogs",lang:"hi",min:22,src:"Curly Tales"},
  {id:"zGns2g0GfT8",t:"Childhood memories in Patna, 15 years on · Dil Se Bihari E1",cat:"biharlife",tag:"vlogs",lang:"hi",min:29,src:"Curly Tales"},
  {id:"TG1iFYzDMN8",t:"Patna's historical & spiritual sites · India With Elli S2 E3",cat:"biharlife",tag:"vlogs",lang:"hi",min:13,src:"Curly Tales"},
  // Purvaiya: the Bihar Museum and Patna Museum, with the legends
  {id:"Pr_nkj3O8JI",t:"The wonder that is the Bihar Museum",cat:"biharlife",tag:"legends",lang:"hi",min:30,src:"Manoj Grover"},
  {id:"hk1qNyiEiL4",t:"Bihar Museum, Patna: the full tour",cat:"biharlife",tag:"legends",lang:"hi",min:18,src:"Vlogster Rahul"},
  {id:"xZwela6wDbc",t:"Why the Bihar Museum is world famous: a full inside tour",cat:"biharlife",tag:"legends",lang:"hi",min:15,src:"Gaurang Vlogs"},
  {id:"rfC9IS5F3Ik",t:"Bihar Museum: full tour & guide",cat:"biharlife",tag:"legends",lang:"hi",min:19,src:"Vlogs With Sans"},
  {id:"vI26GX-4zYI",t:"Patna Museum: Bihar's treasure house",cat:"biharlife",tag:"legends",lang:"hi",min:19,src:"Vlogster Rahul"},
  // Purvaiya: Bihar's gurus, Anand Kumar (Super 30) and HC Verma
  {id:"mOCWmyKaDF8",t:"Anand Kumar: the story of Super 30's struggle",cat:"biharlife",tag:"gurus",lang:"hi",min:22,src:"Josh Talks"},
  {id:"y-HrWDZuySg",t:"Super 30: empowering through education · Anand Kumar",cat:"biharlife",tag:"gurus",lang:"hi",min:44,src:"Talks at Google"},
  {id:"XU2x1RXjMvg",t:"Super guru of Super 30 · Anand Kumar",cat:"biharlife",tag:"gurus",lang:"hi",min:39,src:"Richa Anirudh"},
  {id:"WILzD9WnLp4",t:"The reality of Super 30 · Anand Kumar",cat:"biharlife",tag:"gurus",lang:"hi",min:20,src:"The Lallantop"},
  {id:"pRp6_Ti0-T0",t:"Anand Kumar in conversation with Rajeev Masand",cat:"biharlife",tag:"gurus",lang:"hi",min:26,src:"CNN-News18"},
  {id:"oIcEwfvRrOs",t:"Anand Kumar in conversation with BBC Hindi",cat:"biharlife",tag:"gurus",lang:"hi",min:18,src:"BBC News Hindi"},
  {id:"o2mERiqlxZg",t:"A talk by HC Verma",cat:"biharlife",tag:"gurus",lang:"hi",min:72,src:"TEQIP IIT Kanpur"},
  {id:"VS6bvGw7Nro",t:"Unfiltered with HC Verma: his journey",cat:"biharlife",tag:"gurus",lang:"hi",min:73,src:"The Rocket Media"},
  // Punjabi: 52 Bars, which Punjabi and Gym bring round every few songs (their parts' boost)
  {id:"4DfVxVeqk2o",t:"52 Bars · Karan Aujla, Ikky",cat:"punjabi",lang:"hi",min:4,src:"Karan Aujla"},
  // Desi Pop: Diljit's Bollywood songs, which his hour brings round every few songs (its boost); official uploads only
  {id:"KPUqnTWKnO8",t:"Naina · Crew · Diljit Dosanjh, Badshah",cat:"desipop",tag:"diljitfilm",lang:"hi",min:3,src:"Tips Official",pub:"2025-06-17"},
  {id:"l-rcfNr1PiA",t:"Ishq Di Baajiyaan · Soorma · Diljit Dosanjh, Taapsee",cat:"desipop",tag:"diljitfilm",lang:"hi",min:5,src:"Sony Music India",pub:"2018-08-30"},
  {id:"i4KYUfX7iO8",t:"Naram Kaalja · Amar Singh Chamkila · Diljit, A.R. Rahman",cat:"desipop",tag:"diljitfilm",lang:"hi",min:5,src:"Saregama Music",pub:"2024-05-29"},
  // Modern classics: the rest of Dhurandhar's songs (Gehra Hua, Shararat and the sequel's come in from the charts)
  {id:"amdOdzmAbSk",t:"Ishq Jalakar - Karvaan · Dhurandhar · Ranveer Singh",cat:"modern",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2026-03-18"},
  {id:"JWux9POAQzU",t:"Naal Nachna · Dhurandhar · Ranveer Singh, Sara Arjun",cat:"modern",tag:"dhurandhar",lang:"hi",min:2,src:"Saregama Music",pub:"2026-03-06"},
  {id:"VWCBZpvjZfc",t:"Lutt Le Gaya · Dhurandhar · Ranveer Singh, Akshaye Khanna",cat:"modern",tag:"dhurandhar",lang:"hi",min:2,src:"Saregama Music",pub:"2026-01-03"},
  {id:"WzoSWtDDo1M",t:"Dhurandhar - Title Track · Shashwat Sachdev",cat:"modern",tag:"dhurandhar",lang:"hi",min:3,src:"Shashwat Sachdev",pub:"2025-12-01"},
  {id:"GX9x62kFsVU",t:"Gehra Hua",cat:"modern",tag:"dhurandhar",lang:"hi",min:4,src:"Modern classics: India's chart, film songs"},
  {id:"YyepU5ztLf4",t:"Shararat",cat:"modern",tag:"dhurandhar",lang:"hi",min:4,src:"Modern classics: India's chart, film songs"},
  {id:"F2m4HPLvj-4",t:"JAIYE SAJANA (Video): Dhurandhar The Revenge",cat:"modern",tag:"dhurandhar",lang:"hi",min:3,src:"Modern classics: India's chart, film songs"},
  {id:"dESIGVxSSCE",t:"Dhurandhar The Revenge - AARI AARI (Video)| Ranveer Singh",cat:"modern",tag:"dhurandhar",lang:"hi",min:3,src:"Modern classics: new Bollywood hits"},
  // Punjabi: Karan Aujla's chartbusters that his own sources miss (posted by other channels), in his hours too
  {id:"vsWxs1tuwDk",t:"Winning Speech (Music Video) Karan Aujla",cat:"punjabi",tag:"aujla",lang:"multi",min:4,src:"Karan Aujla: official music videos",pub:"2024-05-16"},
  {id:"CeFQO9MQNqs",t:"Badshah X Karan Aujla - Players",cat:"punjabi",tag:"aujla",lang:"hi",min:3,src:"Punjabi gym workout",pub:"2022-12-21"},
  {id:"N_n-02-0ae0",t:"Karan Aujla, Avvy Sra - White Brown Black (8K Video)",cat:"punjabi",tag:"aujla",lang:"hi",min:3,src:"Desi Melodies"},
  {id:"V23eW2KEIuU",t:"DAYTONA (MUSIC VIDEO) KARAN AUJLA| IKKY",cat:"punjabi",tag:"aujla",lang:"hi",min:4,src:"YouTube Music: Desi Hip Hop Workout",pub:"2025-10-07"},
  {id:"4DfVxVeqk2o",t:"52 Bars · Karan Aujla, Ikky",cat:"punjabi",tag:"aujla",lang:"hi",min:4,src:"Karan Aujla"},
  // Select, by request: Dhurandhar and Dhurandhar The Revenge (Saregama Music, T-Series), Saiyaara (YRF) and Diljit's film songs,
  // each checked on its watch page (official uploader, embeddable, family-safe). Diljit's own songs, Karan Aujla and Mirzapur
  // come from scripts/feeds.json
  {id:"1a5nyrMtRsk",t:"Dhurandhar Title Track · Hanumankind, Jasmine Sandlas",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2025-10-15"},
  {id:"YyepU5ztLf4",t:"Shararat · Dhurandhar · Jasmine Sandlas, Madhubanti Bagchi",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"Saregama Music",pub:"2025-12-09"},
  {id:"GX9x62kFsVU",t:"Gehra Hua · Dhurandhar · Arijit Singh",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"Saregama Music",pub:"2025-11-28"},
  {id:"8qCVXCFREkQ",t:"Ishq Jalakar - Karvaan · Dhurandhar",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2025-11-27"},
  {id:"NYmkY7d6PE8",t:"Ez-Ez · Dhurandhar · Diljit Dosanjh, Hanumankind",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2025-12-02"},
  {id:"aT4N7jn2Eww",t:"Run Down The City - Monica · Dhurandhar · Reble, Asha Bhosle",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2025-12-12"},
  {id:"TFTnJzWRTJ8",t:"Naal Nachna · Dhurandhar · Afsana Khan, Reble",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2025-12-31"},
  {id:"qIVjiKejeFA",t:"Teri Ni Kararan · Dhurandhar · Diljit Dosanjh",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2026-01-02"},
  {id:"VWCBZpvjZfc",t:"Lutt Le Gaya · Dhurandhar · Simran Choudhary",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2026-01-03"},
  {id:"v84ZYg0mDyg",t:"Ramba Ho · Dhurandhar · Madhubanti Bagchi",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2026-01-05"},
  {id:"RabtYMTE_2U",t:"Move - Yeh Ishq Ishq · Dhurandhar · Sonu Nigam, Reble",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"Saregama Music",pub:"2026-02-10"},
  {id:"dESIGVxSSCE",t:"Aari Aari · Dhurandhar The Revenge · Bombay Rockers",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"T-Series",pub:"2026-03-11"},
  {id:"JSTIDkxtO5c",t:"Main Aur Tu · Dhurandhar The Revenge · Jasmine Sandlas, Reble",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"T-Series",pub:"2026-03-17"},
  {id:"F2m4HPLvj-4",t:"Jaiye Sajana · Dhurandhar The Revenge · Satinder Sartaaj, Jasmine Sandlas",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"T-Series",pub:"2026-03-28"},
  {id:"Ans8Y59cvds",t:"Phir Se · Dhurandhar The Revenge · Arijit Singh",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"T-Series",pub:"2026-03-25"},
  {id:"Kr1ncWYhof8",t:"Aakhri Ishq · Dhurandhar The Revenge · Jubin Nautiyal",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"T-Series",pub:"2026-03-27"},
  {id:"hnEGQH4LP2c",t:"Didi (Sher-E-Baloch) · Dhurandhar The Revenge",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"T-Series",pub:"2026-03-31"},
  {id:"uFGreSkTMck",t:"Jaan Se Guzarte Hain · Dhurandhar The Revenge · Khan Saab",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"T-Series",pub:"2026-04-10"},
  {id:"sqSSKHKzvYY",t:"Destiny - Mann Atkeya · Dhurandhar The Revenge",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"T-Series",pub:"2026-04-11"},
  {id:"47ooG3yi6dQ",t:"Wild Ride · Dhurandhar The Revenge · Ellisar",cat:"select",tag:"dhurandhar",lang:"hi",min:3,src:"T-Series",pub:"2026-04-12"},
  {id:"GG1_DsScm6U",t:"Vaari Jaavan · Dhurandhar The Revenge · Jyoti Nooran, Jasmine Sandlas",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"T-Series",pub:"2026-04-16"},
  {id:"Zfk-FWkBkbY",t:"Tere Ishq Ne · Dhurandhar The Revenge · Jyoti Nooran",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"T-Series",pub:"2026-04-17"},
  {id:"PQHeOb0Q9oo",t:"Tamma Tamma · Dhurandhar The Revenge · Bappi Lahiri, Anuradha Paudwal",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"T-Series",pub:"2026-06-05"},
  {id:"ilw3MfjcRQY",t:"Rang De Lal (Oye Oye) · Dhurandhar The Revenge (audio)",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"T-Series",pub:"2026-03-19"}, // no video of these two
  {id:"OVHkruv-dg8",t:"Hum Pyaar Karne Wale · Dhurandhar The Revenge (audio)",cat:"select",tag:"dhurandhar",lang:"hi",min:4,src:"T-Series",pub:"2026-03-19"},
  {id:"BSJa1UytM8w",t:"Saiyaara Title Song · Faheem Abdullah, Arslan Nizami",cat:"select",tag:"saiyaara",lang:"hi",min:5,src:"YRF",pub:"2025-06-02"},
  {id:"0v5eHPfy5Lk",t:"Barbaad · Saiyaara · Jubin Nautiyal",cat:"select",tag:"saiyaara",lang:"hi",min:4,src:"YRF",pub:"2025-06-09"},
  {id:"rOUuGvJkBrQ",t:"Tum Ho Toh · Saiyaara · Vishal Mishra, Hansika Pareek",cat:"select",tag:"saiyaara",lang:"hi",min:4,src:"YRF",pub:"2025-06-16"},
  {id:"D9DiMnlpFK8",t:"Humsafar · Saiyaara · Sachet-Parampara",cat:"select",tag:"saiyaara",lang:"hi",min:4,src:"YRF",pub:"2025-06-23"},
  {id:"cUmUOb7j3dc",t:"Dhun · Saiyaara · Arijit Singh",cat:"select",tag:"saiyaara",lang:"hi",min:4,src:"YRF",pub:"2025-06-30"},
  {id:"asG7cwxi1sA",t:"Saiyaara Reprise (Female) · Shreya Ghoshal",cat:"select",tag:"saiyaara",lang:"hi",min:4,src:"YRF",pub:"2025-09-10"},
  {id:"3pYKz7Ex-28",t:"Barbaad Reprise (Female) · Saiyaara · Shilpa Rao",cat:"select",tag:"saiyaara",lang:"hi",min:2,src:"YRF",pub:"2025-09-08"},
  {id:"nNrBx1wS9NQ",t:"Barbaad (Rock Version) · Saiyaara · The Rish",cat:"select",tag:"saiyaara",lang:"hi",min:3,src:"YRF",pub:"2025-09-09"},
  {id:"urAWUGv731M",t:"Saath Tu Chal Humsafar · Saiyaara",cat:"select",tag:"saiyaara",lang:"hi",min:3,src:"YRF",pub:"2025-09-09"},
  {id:"ReIxyMeMz0k",t:"Saiyaara Title Song (Revisited) · Arslan Nizami",cat:"select",tag:"saiyaara",lang:"hi",min:7,src:"YRF",pub:"2026-07-17"},
  {id:"KPUqnTWKnO8",t:"Naina · Crew · Diljit Dosanjh, Badshah",cat:"select",tag:"diljit",lang:"hi",min:3,src:"Tips Official",pub:"2025-06-17"},
  {id:"l-rcfNr1PiA",t:"Ishq Di Baajiyaan · Soorma · Diljit Dosanjh",cat:"select",tag:"diljit",lang:"hi",min:5,src:"Sony Music India",pub:"2018-08-30"},
  {id:"i4KYUfX7iO8",t:"Naram Kaalja · Amar Singh Chamkila · Diljit, A.R. Rahman",cat:"select",tag:"diljit",lang:"hi",min:6,src:"Saregama Music",pub:"2024-05-29"},
  // Select's Big Dawgs set: the user's Spotify playlist "Big Dawgs" (2026-11-10), each song matched to an official upload
  // (artist, label or "- Topic" channel) and checked on its watch page; the number is the song's place in the playlist
{id:"sqw90xibWaE",t:"Big Dawgs · Hanumankind, Kalmi",cat:"select",tag:"spotify",lang:"en",min:4,src:"Hanumankind - Topic",pub:"2024-08-29"}, // 1
  {id:"a3Ue-LN5B9U",t:"Aasa Kooda · Sai Abhyankkar, Sai Smriti",cat:"select",tag:"spotify",lang:"ta",min:4,src:"Think Music India",pub:"2024-06-13"}, // 2
  {id:"jeQYEIQ6eHw",t:"Ranvijay's Entry Medley · A.R. Rahman, Threeory Band",cat:"select",tag:"spotify",lang:"hi",min:4,src:"T-Series",pub:"2023-12-14"}, // 3
  {id:"6vKucgAeF_Q",t:"Matargashti · Mohit Chauhan",cat:"select",tag:"spotify",lang:"hi",min:5,src:"T-Series",pub:"2015-12-08"}, // 4
  {id:"I5eSgUJ5jAw",t:"Kashmir · Manan Bhardwaj, Shreya Ghoshal",cat:"select",tag:"spotify",lang:"hi",min:4,src:"T-Series",pub:"2023-12-30"}, // 5
  {id:"PmdyY38g6Rg",t:"Abrar’s Entry | Jamal Kudu · Harshavardhan Rameshwar, Choir",cat:"select",tag:"spotify",lang:"hi",min:3,src:"T-Series",pub:"2023-12-13"}, // 6
  {id:"Etkd-07gnxM",t:"O Maahi · Pritam, Arijit Singh",cat:"select",tag:"spotify",lang:"hi",min:5,src:"T-Series",pub:"2024-02-04"}, // 7
  {id:"2U0ZuRURKoo",t:"Vaseegara And Zara Zara Mashup · Jonita Gandhi",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Saregama Tamil",pub:"2020-02-20"}, // 8
  {id:"0I647GU3Jsc",t:"Natural · Imagine Dragons",cat:"select",tag:"spotify",lang:"en",min:4,src:"ImagineDragonsVEVO",pub:"2018-08-24"}, // 9
  {id:"9RuCOqofMYo",t:"Dusk Till Dawn · ZAYN, Sia",cat:"select",tag:"spotify",lang:"en",min:4,src:"ZAYN - Topic",pub:"2018-06-23"}, // 10
  {id:"9GIgN1BFAjk",t:"For You. · Saurabh Trivedi",cat:"select",tag:"spotify",lang:"hi",min:3,src:"Saurabh Trivedi - Topic",pub:"2024-11-11"}, // 11
  {id:"7Kxaqu3mAYs",t:"Inaaya · Saurabh Trivedi, Suyash",cat:"select",tag:"spotify",lang:"hi",min:6,src:"Saurabh Trivedi - Topic",pub:"2021-11-11"}, // 12
  {id:"m5P1r2Q7Yns",t:"roblox girlfriend · luminism",cat:"select",tag:"spotify",lang:"en",min:3,src:"luminism - Topic",pub:"2019-06-20"}, // 13
  {id:"0pWsCiBvLOk",t:"One Love · Shubh",cat:"select",tag:"spotify",lang:"hi",min:3,src:"SHUBH",pub:"2023-08-18"}, // 14
  {id:"Ku1YmydCBUA",t:"More Saiyaan · Sadaat Shafqat Amanat, Utpal Udit",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Sadaat Shafqat Amanat",pub:"2023-11-05"}, // 15
  {id:"y2KbdFvUabA",t:"For the First Time · The Script",cat:"select",tag:"spotify",lang:"en",min:5,src:"TheScriptVEVO",pub:"2025-09-07"}, // 16
  {id:"gS9o1FAszdk",t:"The Man Who Can't Be Moved · The Script",cat:"select",tag:"spotify",lang:"en",min:4,src:"TheScriptVEVO",pub:"2009-10-24"}, // 17
  {id:"t7wSjy9Lv-o",t:"Khalasi | Coke Studio Bharat · Aditya Gadhvi, Achint",cat:"select",tag:"spotify",lang:"hi",min:5,src:"Coke Studio India",pub:"2023-07-04"}, // 18
  {id:"Gb_-rZB2Foc",t:"It Was A Good Day · Ice Cube",cat:"select",tag:"spotify",lang:"en",min:5,src:"Ice Cube - Topic",pub:"2017-03-02"}, // 19
  {id:"oecO66xIRGc",t:"Whistle (Prod. GroovyRoom) · GroovyRoom, Sik-K",cat:"select",tag:"spotify",lang:"intl",min:3,src:"GroovyRoom - Topic",pub:"2022-09-06"}, // 21
  {id:"DsjRNPrvq6U",t:"Hukum - Thalaivar Alappara · Anirudh Ravichander, Super Subu",cat:"select",tag:"spotify",lang:"ta",min:4,src:"Anirudh Ravichander - Topic",pub:"2023-07-17"}, // 22
  {id:"IZDbfXjZ0Bw",t:"Bijlee Bijlee · Harrdy Sandhu",cat:"select",tag:"spotify",lang:"hi",min:4,src:"DM - Desi Melodies",pub:"2026-11-04"}, // 23
  {id:"5Eqb_-j3FDA",t:"Pasoori · Ali Sethi, Shae Gill",cat:"select",tag:"spotify",lang:"hi",min:5,src:"Coke Studio Pakistan",pub:"2022-02-07"}, // 24
  {id:"7fhakgay9Eg",t:"Mann Bharryaa 2.0 · B Praak, Jaani",cat:"select",tag:"spotify",lang:"hi",min:5,src:"SonyMusicIndiaVEVO",pub:"2021-10-22"}, // 25
  {id:"ZJEdMXGHqMw",t:"Pani Da Rang · Ayushmann Khurrana, Rochak Kohli",cat:"select",tag:"spotify",lang:"hi",min:5,src:"Sony Music India",pub:"2012-04-07"}, // 26
  {id:"UbMgcdmYC70",t:"Malang Sajna · Sachet Tandon, Parampara Tandon",cat:"select",tag:"spotify",lang:"hi",min:3,src:"T-Series",pub:"2022-12-18"}, // 27
  {id:"GLGuLXKT9Ng",t:"Raataan Lambiyan · Tanishk Bagchi, Jubin Nautiyal",cat:"select",tag:"spotify",lang:"hi",min:4,src:"SonyMusicIndiaVEVO",pub:"2021-10-19"}, // 28
  {id:"xitd9mEZIHk",t:"Mast Magan · Arijit Singh, Chinmayi",cat:"select",tag:"spotify",lang:"hi",min:4,src:"T-Series",pub:"2014-05-15"}, // 29
  {id:"sK7riqg2mr4",t:"Agar Tum Saath Ho · Alka Yagnik, Arijit Singh",cat:"select",tag:"spotify",lang:"hi",min:6,src:"T-Series",pub:"2015-10-15"}, // 30
  {id:"VAdGW7QDJiU",t:"Chaleya · Anirudh Ravichander, Arijit Singh",cat:"select",tag:"spotify",lang:"hi",min:4,src:"T-Series",pub:"2023-08-13"}, // 31
  {id:"tC1L9qjOzXs",t:"Ranjha · Jasleen Royal, B Praak",cat:"select",tag:"spotify",lang:"hi",min:4,src:"SonyMusicIndiaVEVO",pub:"2021-10-20"}, // 32
  {id:"RLzC55ai0eo",t:"Heeriye · Jasleen Royal, Arijit Singh",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Jasleen Royal",pub:"2023-07-25"}, // 33
  {id:"rkYlZnIbe2E",t:"STAY · The Kid LAROI, Justin Bieber",cat:"select",tag:"spotify",lang:"en",min:3,src:"The Kid LAROI - Topic",pub:"2021-07-08"}, // 34
  {id:"FPrHuDvXEBw",t:"Boulevard of Broken Dreams · Green Day",cat:"select",tag:"spotify",lang:"en",min:5,src:"Green Day - Topic",pub:"2015-04-04"}, // 35
  {id:"dawrQnvwMTY",t:"Shinunoga E-Wa · Fujii Kaze",cat:"select",tag:"spotify",lang:"intl",min:4,src:"Fujii Kaze",pub:"2022-10-26"}, // 36
  {id:"aQpRNtZ00Ks",t:"Rang · Bombay the Artist",cat:"select",tag:"spotify",lang:"hi",min:3,src:"Sony Music India",pub:"2023-05-26"}, // 37
  {id:"rF2JVGItSD0",t:"Waqt Ki Baatein · Dream Note",cat:"select",tag:"spotify",lang:"hi",min:5,src:"Dream Note Official",pub:"2022-06-24"}, // 38
  {id:"A6eHr0spgqs",t:"Muskurahat · Mitraz",cat:"select",tag:"spotify",lang:"hi",min:5,src:"MITRAZ",pub:"2022-06-26"}, // 39
  {id:"9VwuzdBlByU",t:"Raabta · Abdul Hannan, Rovalio",cat:"select",tag:"spotify",lang:"hi",min:3,src:"Abdul Hannan",pub:"2023-02-12"}, // 40
  {id:"Fw-S8NCDsTY",t:"Khaare Raste · Raghav Kaushik, Yashika Sikka",cat:"select",tag:"spotify",lang:"hi",min:5,src:"Raghav Kaushik",pub:"2021-04-06"}, // 41
  {id:"U77d9912lrw",t:"Aaftaab · The Local Train",cat:"select",tag:"spotify",lang:"hi",min:4,src:"The Local Train",pub:"2017-11-14"}, // 42
  {id:"lmhKXQBgEQU",t:"Kho Gaye · Taaruk Raina, Mismatched - Cast",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Netflix India",pub:"2022-11-08"}, // 43
  {id:"d4PZ1cIvVXk",t:"4runner · Brenn!",cat:"select",tag:"spotify",lang:"en",min:5,src:"Brenn!",pub:"2023-04-27"}, // 44
  {id:"9UxU0qsfGPA",t:"Lamhey · Anubha Bajaj",cat:"select",tag:"spotify",lang:"hi",min:3,src:"Sony Music India",pub:"2023-05-25"}, // 45
  {id:"X7aF3nZOS98",t:"I KNOW ? · Travis Scott",cat:"select",tag:"spotify",lang:"en",min:4,src:"TravisScottVEVO",pub:"2024-01-23"}, // 46
  {id:"vNfgVjZF8_4",t:"Someday · OneRepublic",cat:"select",tag:"spotify",lang:"en",min:4,src:"OneRepublicVEVO",pub:"2021-08-27"}, // 47
  {id:"J3M_n6joby4",t:"NO BAD DAYS · Macklemore, Collett",cat:"select",tag:"spotify",lang:"en",min:3,src:"Macklemore - Topic",pub:"2023-03-02"}, // 48
  {id:"QPzOeESWG5o",t:"Arcade · Duncan Laurence",cat:"select",tag:"spotify",lang:"en",min:4,src:"Duncan Laurence - Topic",pub:"2020-11-26"}, // 49
  {id:"2vKMY75kvjI",t:"Aankhon Se Batana · Dikshant",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Sony Music India",pub:"2022-04-21"}, // 50
  {id:"L4s0gyT2oKA",t:"ORANGES · Jaron Steele",cat:"select",tag:"spotify",lang:"en",min:3,src:"Jaron Steele - Topic",pub:"2023-05-08"}, // 51
  {id:"FPMbS0xbolk",t:"Sci-Fi · EDEN",cat:"select",tag:"spotify",lang:"en",min:4,src:"EDEN",pub:"2022-08-11"}, // 52
  {id:"OJLRRMye4YI",t:"Walk With Me · Taba Chake",cat:"select",tag:"spotify",lang:"en",min:3,src:"Taba Chake",pub:"2019-02-13"}, // 53
  {id:"6vopR3ys8Kw",t:"Drop The Game · Flume, Chet Faker",cat:"select",tag:"spotify",lang:"en",min:5,src:"Future Classic",pub:"2013-11-18"}, // 54
  {id:"ocRqQcRapQQ",t:"Sunset Lover · Petit Biscuit",cat:"select",tag:"spotify",lang:"en",min:4,src:"Petit Biscuit - Topic",pub:"2015-06-23"}, // 55
  {id:"a0OHkWX7B-E",t:"Every Summertime · NIKI",cat:"select",tag:"spotify",lang:"en",min:4,src:"88rising",pub:"2021-12-10"}, // 56
  {id:"akCyi4VndXY",t:"Problems - Taska Black Remix · Petit Biscuit, Taska Black",cat:"select",tag:"spotify",lang:"en",min:4,src:"Petit Biscuit",pub:"2018-05-04"}, // 57
  {id:"V_A20lBsBMM",t:"Stoned at the Nail Salon · Lorde",cat:"select",tag:"spotify",lang:"en",min:5,src:"LordeVEVO",pub:"2021-07-21"}, // 59
  {id:"q-74HTjRbuY",t:"Musician · Porter Robinson",cat:"select",tag:"spotify",lang:"en",min:5,src:"Porter Robinson",pub:"2021-03-17"}, // 60
  {id:"Z6kNQEzQJpA",t:"Runner · Tennis",cat:"select",tag:"spotify",lang:"en",min:4,src:"Tennis",pub:"2019-11-08"}, // 61
  {id:"cyDOUPz0hpA",t:"Billie Jean · EDEN",cat:"select",tag:"spotify",lang:"en",min:4,src:"Koala Kontrol",pub:"2015-11-23"}, // 62
  {id:"k5wC88XlB50",t:"Big Love · Louis The Child, EARTHGANG",cat:"select",tag:"spotify",lang:"en",min:3,src:"LouistheChildVEVO",pub:"2020-08-20"}, // 64
  {id:"Qg2PM_tbs7w",t:"Better · Phil Good",cat:"select",tag:"spotify",lang:"en",min:4,src:"Phil Good",pub:"2019-09-11"}, // 65
  {id:"pLuQ0MGLBXU",t:"What If I Go? · Mura Masa, Bonzai",cat:"select",tag:"spotify",lang:"en",min:4,src:"MuraMasaVEVO",pub:"2016-04-07"}, // 66
  {id:"baj01imKCfA",t:"I CAN'T WAIT · DROELOE",cat:"select",tag:"spotify",lang:"en",min:3,src:"DROELOE",pub:"2020-04-07"}, // 67
  {id:"Pc-dxNilmBg",t:"Little Things · Louis The Child, Quinn XCII",cat:"select",tag:"spotify",lang:"en",min:4,src:"LouistheChildVEVO",pub:"2020-04-30"}, // 68
  {id:"pp4YQPykBMM",t:"Feel Something · ILLENIUM, Excision",cat:"select",tag:"spotify",lang:"en",min:4,src:"IlleniumVEVO",pub:"2020-04-02"}, // 69
  {id:"XiNDI0ky-uU",t:"good morning · EDEN",cat:"select",tag:"spotify",lang:"en",min:4,src:"EDEN",pub:"2020-02-13"}, // 70
  {id:"M3cbrXMXNUo",t:"In My Mind · Mura Masa",cat:"select",tag:"spotify",lang:"en",min:6,src:"Mura Masa",pub:"2020-01-17"}, // 71
  {id:"d0uBuSYCD4g",t:"projector · EDEN",cat:"select",tag:"spotify",lang:"en",min:4,src:"EDEN",pub:"2019-10-24"}, // 73
  {id:"jBVmcmrv_ik",t:"brighter days · San Holo, Bipolar Sunshine",cat:"select",tag:"spotify",lang:"en",min:4,src:"SAN HOLO",pub:"2018-09-28"}, // 74
  {id:"iWDxMpLvaUE",t:"Calling (Spider-Man: Across the Spider-Verse) · Metro Boomin, Swae Lee",cat:"select",tag:"spotify",lang:"en",min:4,src:"MetroBoominVEVO",pub:"2023-06-01"}, // 75
  {id:"WL9ahHAlPKU",t:"HiiiPower · Kendrick Lamar",cat:"select",tag:"spotify",lang:"en",min:5,src:"Kendrick Lamar - Topic",pub:"2019-07-31"}, // 76
  {id:"ECoIGvDT36Q",t:"What Are You Going to Do When You Are Not Saving the World? · Hans Zimmer",cat:"select",tag:"spotify",lang:"en",min:6,src:"WaterTower Music",pub:"2024-12-17"}, // 77
  {id:"d5_V3a_oRnA",t:"Mona Lisa (Spider-Man: Across the Spider-Verse) · Dominic Fike",cat:"select",tag:"spotify",lang:"en",min:4,src:"Dominic Fike",pub:"2023-06-01"}, // 78
  {id:"rtOvBOTyX00",t:"a thousand years · Christina Perri",cat:"select",tag:"spotify",lang:"en",min:5,src:"Christina Perri",pub:"2011-10-26"}, // 79
  {id:"9ACakK-spaU",t:"Don't Walk Away · Jade",cat:"select",tag:"spotify",lang:"en",min:5,src:"RHINO",pub:"2026-11-06"}, // 80
  {id:"PHULePbksEU",t:"Aaya Na Tu · Arjun Kanungo, Momina Mustehsan",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Universal Music India",pub:"2018-06-19"}, // 81
  {id:"FGaO0krcOE4",t:"Bulleya · Asim Azhar, Shae Gill",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Asim Azhar",pub:"2023-05-29"}, // 82
  {id:"6MbSP5yaJHs",t:"Defaulter · R Nait, Gurlez Akhtar",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Jass Records",pub:"2020-01-20"}, // 83
  {id:"dr0xFku8hDg",t:"Khudaya Khair · Imdad Hussain, RDRKSH",cat:"select",tag:"spotify",lang:"hi",min:2,src:"Imdad Hussain - Topic",pub:"2023-06-11"}, // 84
  {id:"SmaY7RfBgas",t:"Gul · Anuv Jain",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Anuv Jain",pub:"2021-07-15"}, // 85
  {id:"CV315UIeOZg",t:"Chaand Baaliyan · Aditya A",cat:"select",tag:"spotify",lang:"hi",min:2,src:"Sony Music India",pub:"2024-03-15"}, // 86
  {id:"jY8mAWdQFOA",t:"Rangi Saari · Kavita Seth, Kanishk Seth",cat:"select",tag:"spotify",lang:"hi",min:4,src:"Kavita Seth",pub:"2020-04-23"}, // 87
  {id:"_kUrW9SEaJc",t:"Sage · Ritviz",cat:"select",tag:"spotify",lang:"hi",min:5,src:"RITVIZ",pub:"2019-06-29"}, // 88
  {id:"ewCPQeAtICk",t:"Vtyurilas · Dora",cat:"select",tag:"spotify",lang:"intl",min:3,src:"Dora",pub:"2020-08-26"}, // 89
  {id:"072lEafKN7k",t:"Safari · Serena",cat:"select",tag:"spotify",lang:"en",min:4,src:"Serena",pub:"2020-12-29"}, // 91
  {id:"ZUJc1lycgwM",t:"Kolybelnaya · Rauf & Faik",cat:"select",tag:"spotify",lang:"intl",min:4,src:"Atlantic Records Russia",pub:"2019-12-05"}, // 92
  {id:"nqUN530Rgtw",t:"Summer High · AP Dhillon",cat:"select",tag:"spotify",lang:"hi",min:4,src:"APDHILLON",pub:"2022-08-04"}, // 93
  {id:"L1yVXl_Bwxs",t:"Jadi Buti · Major Lazer, Nucleya",cat:"select",tag:"spotify",lang:"hi",min:3,src:"Major Lazer Official",pub:"2020-10-23"}, // 94
  {id:"60ItHLz5WEA",t:"Faded · Alan Walker",cat:"select",tag:"spotify",lang:"en",min:4,src:"Alan Walker",pub:"2015-12-03"}, // 95
  {id:"31crA53Dgu0",t:"Cheap Thrills · Sia, Sean Paul",cat:"select",tag:"spotify",lang:"en",min:4,src:"SiaVEVO",pub:"2016-03-21"}, // 96
  {id:"nD1UqCcKutU",t:"Reaching 2 · EDEN",cat:"select",tag:"spotify",lang:"en",min:4,src:"EDEN",pub:"2022-09-08"}, // 97
  {id:"W0KMtmi2H3g",t:"Beach House · The Chainsmokers",cat:"select",tag:"spotify",lang:"en",min:4,src:"ChainsmokersVEVO",pub:"2018-11-16"}, // 98
  {id:"cU3IO6Am65o",t:"Saadi Galli Aaja · Rochak Kohli, Ayushmann Khurrana",cat:"select",tag:"spotify",lang:"hi",min:4,src:"T-Series",pub:"2013-04-23"}, // 99
  {id:"U3ASj1L6_sY",t:"Easy On Me · Adele",cat:"select",tag:"spotify",lang:"en",min:6,src:"AdeleVEVO",pub:"2021-10-14"}, // 100
];
const CAT_LABEL={select:"Select",magadh:"Bihar & Jharkhand news",firstsports:"First Sports",desipop:"Desi pop",modern:"Modern classics",global:"Global hits",deccan:"South Indian music",gym:"Gym music",biharlife:"Bihar & Jharkhand",world:"World sport",aangan:"Family TV",bhakti:"Devotional",rasoi:"Cooking",sehat:"Yoga & health",geet:"Evergreen songs",gyaan:"Space & India",hasya:"Comedy",
  khel:"Sports",vigyan:"Science",tech:"Tech",paisa:"Money",safar:"Travel",bachche:"Kids",baatcheet:"Podcasts",
  cricket:"Cricket",football:"Football",live:"Live",khabar:"Hindi news",news:"English news",bihar:"Bihar & Jharkhand news",punjabi:"Punjabi",
  hits2000:"2000s hits",hits2010:"2010s hits",bollywood:"Bollywood hits",english:"English songs",trailers:"Trailers",data:"India in data",classroom:"Lectures",curious:"Explainers",drive:"Road trip",anthems:"Pop & rock anthems",classics:"Cricket classics",raag:"Indian classical",niche:"Niche",fiction:"Fiction",retro:"Classic films",premium:"Classics",masters:"Indian masters"};
const catLabel=c=>Array.isArray(c)?c.map(catLabel).join(" & "):CAT_LABEL[c]||(c.startsWith("fest-")?"Festival songs":c);
const LANG_LABEL={hi:"Hindi",en:"English",te:"Telugu",ta:"Tamil",ml:"Malayalam",kn:"Kannada",intl:"Worldwide",multi:"Indian languages"};
