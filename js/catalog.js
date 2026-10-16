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
  {id:"vbufjRJOvzk",t:"Mexican rice, one-pot",cat:"rasoi",lang:"te",min:10,src:"Vismai Food"},
  {id:"iijwkjNzjYU",t:"Nucchinunde, a healthy steamed snack",cat:"rasoi",lang:"te",min:10,src:"Vismai Food",tag:"snack"},
  {id:"RUuMs20nT0A",t:"Rayalaseema egg karam dosa",cat:"rasoi",lang:"te",min:10,src:"Vismai Food"},
  {id:"R7IBa-Lwnxg",t:"New Year special veg thali",cat:"rasoi",lang:"te",min:15,src:"Vismai Food"},
  {id:"7a2fXtR9nEQ",t:"Palak garlic mushroom",cat:"rasoi",lang:"te",min:9,src:"Vismai Food"},
  // Sehat (yoga)
  {id:"VcUkvIVkVGs",t:"Warm-up yoga for beginners",cat:"sehat",lang:"hi",min:15,src:"Yoga"},
  {id:"Q3_0NZwBE7g",t:"20-minute daily yoga for beginners",cat:"sehat",lang:"hi",min:20,src:"Art of Living"},
  {id:"G8x2WscstH0",t:"15-minute daily yoga",cat:"sehat",lang:"hi",min:15,src:"Yoga"},
  {id:"0efkVn-I5gk",t:"Morning yoga for beginners",cat:"sehat",lang:"hi",min:15,src:"Yoga"},
  {id:"DbbsVGkZ1Ck",t:"How to start yoga, part 1",cat:"sehat",lang:"hi",min:15,src:"Yoga"},
  {id:"cUnoXSVckhU",t:"45-minute yoga class, day 11",cat:"sehat",lang:"hi",min:45,src:"Onkar Yoga"},
  // Sadabahar (evergreen songs)
  {id:"oSkbkxlMurA",t:"Lata Mangeshkar & Kishore Kumar hits",cat:"geet",lang:"hi",min:30,src:"Jukebox"},
  {id:"O10nYq_DW7w",t:"Sukoon bhare sadabahar gaane",cat:"geet",lang:"hi",min:30,src:"Jukebox"},
  {id:"3OFpvKUbAwU",t:"Lata & Kishore duets",cat:"geet",lang:"hi",min:30,src:"Jukebox"},
  {id:"BWE-dVBj4J4",t:"80s Hindi songs",cat:"geet",lang:"hi",min:30,src:"Jukebox"},
  {id:"eggVq-nGS_I",t:"70s & 80s evergreen Bollywood",cat:"geet",lang:"hi",min:30,src:"Jukebox"},
  {id:"4K3KxssmufY",t:"70s, 80s ke evergreen gaane",cat:"geet",lang:"hi",min:30,src:"Jukebox"},
  {id:"frhfdIkbnPI",t:"Kishore & Lata superhits",cat:"geet",lang:"hi",min:30,src:"Jukebox"},
  // Gyaan (knowledge)
  {id:"oyw87aNY42E",t:"Passage to the Moon · Chandrayaan-1, part 2",cat:"gyaan",lang:"en",min:20,src:"ISRO"},
  {id:"K2YaqO6loyU",t:"The full story of Chandrayaan-2",cat:"gyaan",lang:"en",min:20,src:"Documentary"},
  {id:"CC4seGwPsDo",t:"Chandrayaan-3, from launch to landing",cat:"gyaan",lang:"hi",min:15,src:"News explainer"},
  {id:"BDPzly-QgFY",t:"Chandrayaan-3 documentary",cat:"gyaan",lang:"te",min:15,src:"Documentary"},
  {id:"G8r_abcjX6U",t:"The birth of ISRO",cat:"gyaan",lang:"en",min:15,src:"Documentary"},
  {id:"aEIUVfKCRic",t:"Wormhole kya hota hai?",cat:"gyaan",lang:"hi",min:15,src:"Explainer"},
  {id:"l61RMuMxBiA",t:"Chandrayaan-1 explained in 3 minutes",cat:"gyaan",lang:"en",min:4,src:"Explainer"},
  // Hasya (comedy)
  {id:"vVzwoHwclHA",t:"Bachelor Boys · short film",cat:"hasya",lang:"te",min:20,src:"Infinitum Media"},
  {id:"z6vc490rbkE",t:"Paradesi · short film",cat:"hasya",lang:"te",min:20,src:"Short film"},
  {id:"fQwxwQ93324",t:"H2O · comedy short",cat:"hasya",lang:"te",min:15,src:"Short film"},
  {id:"4bKX8HzOdJ4",t:"Buridi · comedy short",cat:"hasya",lang:"te",min:15,src:"Mahesh Vitta"},
  {id:"G1EKj-eX4_M",t:"Any Help Line Please",cat:"hasya",lang:"te",min:12,src:"Short film"},
  {id:"FBQQaFynmZ8",t:"Ulta Palta",cat:"hasya",lang:"te",min:10,src:"Short film"},
];
const CAT_LABEL={bhakti:"Devotional",rasoi:"Cooking",sehat:"Yoga & health",geet:"Evergreen songs",gyaan:"Science & India",hasya:"Comedy"};
const LANG_LABEL={hi:"Hindi",te:"Telugu",en:"English",gu:"Gujarati"};
