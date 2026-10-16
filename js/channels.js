/* ---------- Channels and their rules. A rule = hours (IST) + what to select ---------- */
const CHANNELS = [
  {key:"aangan",n:1,name:"आँगन",en:"Aangan · family mix",parts:[
    {from:0,to:5,  cat:"geet",  label:"Raat ke geet"},
    {from:5,to:7,  cat:"bhakti",label:"Subah ki aarti"},
    {from:7,to:9,  cat:"sehat", label:"Morning yoga"},
    {from:9,to:12, cat:"rasoi", label:"Rasoi hour"},
    {from:12,to:15,cat:"gyaan", label:"Gyaan dopahar"},
    {from:15,to:18,cat:"hasya", label:"Hasya break"},
    {from:18,to:19,cat:"rasoi", tag:"snack", label:"Chai-time snacks"},
    {from:19,to:20,cat:"bhakti",label:"Sandhya aarti"},
    {from:20,to:24,cat:"geet",  label:"Sadabahar raat"}]},
  {key:"bhakti",n:2,name:"भक्ति",en:"Bhakti",parts:[{from:0,to:24,cat:"bhakti",label:"Devotional, all day"}]},
  {key:"rasoi",n:3,name:"रसोई",en:"Rasoi",parts:[{from:0,to:24,cat:"rasoi",label:"Recipes, all day"}]},
  {key:"sehat",n:4,name:"सेहत",en:"Sehat",parts:[
    {from:0,to:17,cat:"sehat",maxMin:20,label:"Short sessions"},
    {from:17,to:24,cat:"sehat",label:"Full classes"}]},
  {key:"geet",n:5,name:"सदाबहार",en:"Sadabahar",parts:[{from:0,to:24,cat:"geet",label:"Evergreen, all day"}]},
  {key:"gyaan",n:6,name:"ज्ञान",en:"Gyaan",parts:[{from:0,to:24,cat:"gyaan",label:"Space, India & explainers"}]},
  {key:"hasya",n:7,name:"हास्य",en:"Hasya",parts:[{from:0,to:24,cat:"hasya",label:"Comedy, all day"}]},
  {key:"khel",n:8,name:"खेल",en:"Khel · Sports",parts:[{from:0,to:24,cat:"khel",label:"Highlights & stories"}]},
  {key:"vigyan",n:9,name:"विज्ञान",en:"Vigyan · Science",parts:[{from:0,to:24,cat:"vigyan",label:"Experiments & explainers"}]},
  {key:"tech",n:10,name:"टेक",en:"Tech",parts:[{from:0,to:24,cat:"tech",label:"Gadgets & reviews"}]},
  {key:"paisa",n:11,name:"पैसा",en:"Paisa · Money",parts:[{from:0,to:24,cat:"paisa",label:"Money & investing"}]},
  {key:"safar",n:12,name:"सफ़र",en:"Safar · Travel",parts:[{from:0,to:24,cat:"safar",label:"Travel India & beyond"}]},
  {key:"bachche",n:13,name:"बच्चे",en:"Bachche · Kids",parts:[
    {from:0,to:7,cat:"vigyan",alt:"bachche",maxMin:15,label:"Early science"},
    {from:7,to:21,cat:"bachche",alt:"vigyan",label:"Stories & rhymes"},
    {from:21,to:24,cat:"vigyan",alt:"bachche",maxMin:15,label:"Bedtime science"}]},
  {key:"baatcheet",n:14,name:"बातचीत",en:"Baatcheet · Podcasts",parts:[{from:0,to:24,cat:"baatcheet",label:"Long conversations"}]},
];
