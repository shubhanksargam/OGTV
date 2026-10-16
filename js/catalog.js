/* ---------- Catalog: real YouTube uploads, tagged so rules can select them ---------- */
const CATALOG = [
  // Bhakti
  {id:"LUx8wlA_dk8",t:"Shree Hanuman Chalisa · Hariharan",cat:"bhakti",lang:"hi",min:10,src:"T-Series Bhakti"},
  {id:"nh9pJNL79ps",t:"Hanuman Chalisa · Geeta Rabari",cat:"bhakti",lang:"hi",min:10,src:"Geeta Rabari"},
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
  {id:"VcUkvIVkVGs",t:"Warm-up yoga for beginners",cat:"sehat",lang:"hi",min:15,src:"Yoga"},
  {id:"Q3_0NZwBE7g",t:"20-minute daily yoga for beginners",cat:"sehat",lang:"hi",min:20,src:"Art of Living"},
  {id:"G8x2WscstH0",t:"15-minute daily yoga",cat:"sehat",lang:"hi",min:15,src:"Yoga"},
  {id:"0efkVn-I5gk",t:"Morning yoga for beginners",cat:"sehat",lang:"hi",min:15,src:"Yoga"},
  {id:"DbbsVGkZ1Ck",t:"How to start yoga, part 1",cat:"sehat",lang:"hi",min:15,src:"Yoga"},
  // Sadabahar (evergreen songs)
  {id:"oSkbkxlMurA",t:"Lata Mangeshkar & Kishore Kumar hits",cat:"geet",lang:"hi",min:30,src:"Jukebox"},
  {id:"3OFpvKUbAwU",t:"Lata & Kishore duets",cat:"geet",lang:"hi",min:30,src:"Jukebox"},
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
  {id:"HuqaOWc3wsc",t:"भारत बनाम पाकिस्तान · हॉकी हाइलाइट्स",cat:"khel",lang:"hi",min:10,src:"FIH Hockey"},
  {id:"H7q7q1IwEY4",t:"पाकिस्तान को हराकर भारत फाइनल में · 2011 विश्व कप",cat:"khel",lang:"hi",min:10,src:"ICC"},
  {id:"IXKu3w5-glc",t:"IND v AUS · 2016 T20 World Cup · Hindi highlights",cat:"khel",lang:"hi",min:8,src:"ICC"},
  // Vigyan (science)
  {id:"p9pPjASnnxw",t:"Quantum mechanics in simple words",cat:"vigyan",lang:"en",min:8,src:"Science ABC"},
  {id:"5-2NLHB4Gxg",t:"Work, force & energy · Dr. Binocs",cat:"vigyan",lang:"en",min:7,src:"Peekaboo Kidz"},
  {id:"suQDwZcnJdg",t:"Gravity · Dr. Binocs",cat:"vigyan",lang:"en",min:4,src:"Peekaboo Kidz"},
  {id:"6dj48zWlbGc",t:"कम लागत वाले विज्ञान प्रयोग · माचिस मॉडल",cat:"vigyan",lang:"hi",min:26,src:"Arvind Gupta"},
  {id:"l83ZbSrbUnk",t:"हमारे शरीर के अंग कैसे काम करते हैं",cat:"vigyan",lang:"hi",min:39,src:"Binocs Ki Duniya"},
  {id:"XzSxezvf_8g",t:"विद्युत · टॉर्च और सर्किट के साथ प्रयोग",cat:"vigyan",lang:"hi",min:9,src:"Bodhaguru"},
  {id:"esoQhorc1As",t:"पानी के 3 आसान विज्ञान प्रयोग",cat:"vigyan",lang:"hi",min:6,src:"Unacademy Live Laboratory"},
  {id:"vnfiSiR9cvI",t:"The human liver · Hindi",cat:"vigyan",lang:"hi",min:30,src:"Infinity Stream"},
  {id:"z4aOiALk2Fk",t:"The human brain · Hindi",cat:"vigyan",lang:"hi",min:34,src:"Infinity Stream"},
];
const CAT_LABEL={bhakti:"Devotional",rasoi:"Cooking",sehat:"Yoga & health",geet:"Evergreen songs",gyaan:"Space & India",hasya:"Comedy",
  khel:"Sports",vigyan:"Science",tech:"Tech",paisa:"Money",safar:"Travel",bachche:"Kids",baatcheet:"Podcasts"};
const LANG_LABEL={hi:"Hindi",en:"English"};
