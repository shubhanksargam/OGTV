/* ---------- Catalog: real YouTube uploads, tagged so rules can select them ---------- */
const CATALOG = [
  // Bhakti
  // Hanuman Chalisa, for Bhakti's morning slot (official uploads)
  {id:"AETFvQonfV8",t:"Hanuman Chalisa · Gulshan Kumar, Hariharan",cat:"bhakti",tag:"chalisa",lang:"hi",min:10,src:"T-Series Bhakti Sagar"},
  {id:"17ZHT4WbSfw",t:"Hanuman Chalisa · Hariharan",cat:"bhakti",tag:"chalisa",lang:"hi",min:10,src:"T-Series Bhakti Sagar"},
  {id:"jTNu-R9KA-4",t:"Hanuman Chalisa · Shankar Mahadevan",cat:"bhakti",tag:"chalisa",lang:"hi",min:9,src:"Tips Bhakti Prem"},
  {id:"BC6TNttdIZM",t:"Hanuman Chalisa · Shankar Mahadevan",cat:"bhakti",tag:"chalisa",lang:"hi",min:9,src:"Times Music Spiritual"},
  // Sankatmochan Hanuman Ashtak, for Bhakti's morning slot (official uploads)
  {id:"HH_a6aRO1TE",t:"Sankatmochan Hanuman Ashtak · Hariharan",cat:"bhakti",tag:"ashtak",lang:"hi",min:6,src:"T-Series Bhakti Sagar"},
  {id:"MeaVRC453M0",t:"Hanuman Ashtak · Hariharan",cat:"bhakti",tag:"ashtak",lang:"hi",min:6,src:"T-Series Bhakti Sagar"},
  {id:"1zS2sgVEjvs",t:"Sankat Mochan Hanuman Ashtak · Hari Om Sharan",cat:"bhakti",tag:"ashtak",lang:"hi",min:7,src:"T-Series Bhakti Sagar"},
  {id:"5hKao7gACW4",t:"Mangalvar special: Sankatmochan Hanuman Ashtak",cat:"bhakti",tag:"ashtak",lang:"hi",min:6,src:"T-Series Bhakti Sagar"},
  {id:"Y2bvXiTQ1Ak",t:"Shri Hanuman Ashtak",cat:"bhakti",tag:"ashtak",lang:"hi",min:7,src:"Shemaroo Bhakti"},
  {id:"0PX4YuWBaXQ",t:"Sankat Mochan Hanuman Ashtak",cat:"bhakti",tag:"ashtak",lang:"hi",min:6,src:"Zee Music Devotional"},
  {id:"LUx8wlA_dk8",t:"Shree Hanuman Chalisa · Hariharan",cat:"bhakti",tag:"chalisa",lang:"hi",min:10,src:"T-Series Bhakti"},
  {id:"nh9pJNL79ps",t:"Hanuman Chalisa · Geeta Rabari",cat:"bhakti",tag:"chalisa",lang:"hi",min:10,src:"Geeta Rabari"},
  {id:"gLZO6O9v-IY",t:"Shree Hanuman Chalisa",cat:"bhakti",lang:"hi",min:10,src:"Bhakti"},
  {id:"kC8VzzPPY2A",t:"Hanuman Chalisa with lyrics",cat:"bhakti",lang:"hi",min:10,src:"Bhakti"},
  {id:"drC4vpQF4rM",t:"Shree Hanuman Chalisa · original video",cat:"bhakti",lang:"hi",min:10,src:"Bhakti"},
  // Rasoi
  {id:"_muhC_eL8Ec",t:"6 quick, healthy tiffins for kids",cat:"rasoi",lang:"hi",min:12,src:"Kabita's Kitchen"},
  {id:"HcV34Fe_Ph0",t:"Crispy nimki for evening hunger",cat:"rasoi",lang:"hi",min:10,src:"Kabita's Kitchen",tag:"snack"},
  {id:"yEMwra2ZjPE",t:"Healthy veg thali in two spoons of oil",cat:"rasoi",lang:"hi",min:14,src:"Kabita's Kitchen"},
  {id:"Exp3aP7Ojb0",t:"Special veg sandwich on the tawa",cat:"rasoi",lang:"hi",min:9,src:"Kabita's Kitchen",tag:"snack"},
  {id:"OCtjnPuxbxI",t:"One-teaspoon-oil breakfast",cat:"rasoi",lang:"hi",min:10,src:"Kabita's Kitchen"},
  // Sehat (yoga)
  {id:"VcUkvIVkVGs",t:"Warm-up yoga for beginners",cat:"sehat",lang:"hi",min:15,src:"Yoga",tag:"yoga"},
  {id:"Q3_0NZwBE7g",t:"20-minute daily yoga for beginners",cat:"sehat",lang:"hi",min:20,src:"Art of Living",tag:"yoga"},
  {id:"G8x2WscstH0",t:"15-minute daily yoga",cat:"sehat",lang:"hi",min:15,src:"Yoga",tag:"yoga"},
  {id:"0efkVn-I5gk",t:"Morning yoga for beginners",cat:"sehat",lang:"hi",min:15,src:"Yoga",tag:"yoga"},
  {id:"DbbsVGkZ1Ck",t:"How to start yoga, part 1",cat:"sehat",lang:"hi",min:15,src:"Yoga",tag:"yoga"},
  // Sadabahar (evergreen songs)
  // Gyaan (knowledge)
  {id:"oyw87aNY42E",t:"Passage to the Moon · Chandrayaan-1, part 2",cat:"gyaan",lang:"en",min:20,src:"ISRO"},
  {id:"K2YaqO6loyU",t:"The full story of Chandrayaan-2",cat:"gyaan",lang:"en",min:20,src:"Documentary"},
  {id:"CC4seGwPsDo",t:"Chandrayaan-3, from launch to landing",cat:"gyaan",lang:"hi",min:15,src:"News explainer"},
  {id:"G8r_abcjX6U",t:"The birth of ISRO",cat:"gyaan",lang:"en",min:15,src:"Documentary"},
  {id:"aEIUVfKCRic",t:"Wormhole kya hota hai?",cat:"gyaan",lang:"hi",min:15,src:"Explainer"},
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
  {id:"l83ZbSrbUnk",t:"How the organs of our body work",cat:"vigyan",lang:"hi",min:39,src:"Binocs Ki Duniya"},
  {id:"XzSxezvf_8g",t:"Electricity · experiments with a torch and circuits",cat:"vigyan",lang:"hi",min:9,src:"Bodhaguru"},
  {id:"esoQhorc1As",t:"3 easy science experiments with water",cat:"vigyan",lang:"hi",min:6,src:"Unacademy Live Laboratory"},
  {id:"vnfiSiR9cvI",t:"The human liver · Hindi",cat:"vigyan",lang:"hi",min:30,src:"Infinity Stream"},
  {id:"z4aOiALk2Fk",t:"The human brain · Hindi",cat:"vigyan",lang:"hi",min:34,src:"Infinity Stream"},
  // Purvaiya: Legends of Bihar (Nalanda, the Mauryas, Dinkar, Khan Sir), alongside the legends feeds
  {id:"XMDpjjNlL0I",t:"Nalanda University: a heritage for the world",cat:"biharlife",tag:"legends",lang:"hi",min:29,src:"Infinity Stream"},
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
  // Classic Films: Nadiya Ke Paar (1982)
  {id:"D4dsSqRuQsg",t:"Nadiya Ke Paar (1982) · Sachin, Sadhana Singh",cat:"retro",lang:"hi",min:150,src:"Rajshri"},
  // Punjabi: 52 Bars, which Punjabi and Gym bring round every few songs (their parts' boost)
  {id:"4DfVxVeqk2o",t:"52 Bars · Karan Aujla, Ikky",cat:"punjabi",lang:"hi",min:4,src:"Karan Aujla"},
];
const CAT_LABEL={firstsports:"First Sports",desipop:"Desi pop",global:"Global hits",deccan:"South Indian music",gym:"Gym music",biharlife:"Bihar & Jharkhand",world:"World sport",aangan:"Family TV",bhakti:"Devotional",rasoi:"Cooking",sehat:"Yoga & health",geet:"Evergreen songs",gyaan:"Space & India",hasya:"Comedy",
  khel:"Sports",vigyan:"Science",tech:"Tech",paisa:"Money",safar:"Travel",bachche:"Kids",baatcheet:"Podcasts",
  cricket:"Cricket",football:"Football",live:"Live",khabar:"Hindi news",news:"English news",bihar:"Bihar & Jharkhand news",punjabi:"Punjabi",
  hits2000:"2000s hits",hits2010:"2010s hits",bollywood:"Bollywood hits",english:"English songs",trailers:"Trailers",data:"India in data",classroom:"Lectures",curious:"Explainers",drive:"Road trip",anthems:"Pop & rock anthems",classics:"Cricket classics",raag:"Indian classical",niche:"Niche",fiction:"Fiction",retro:"Classic films",premium:"Classics",masters:"Indian masters"};
const catLabel=c=>Array.isArray(c)?c.map(catLabel).join(" & "):CAT_LABEL[c]||(c.startsWith("fest-")?"Festival songs":c);
const LANG_LABEL={hi:"Hindi",en:"English",te:"Telugu",ta:"Tamil",ml:"Malayalam",kn:"Kannada",intl:"Worldwide",multi:"Indian languages"};
