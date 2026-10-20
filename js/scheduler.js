/* ---------- Scheduler: deterministic per IST day, so every viewer sees the same thing ---------- */
const IST = 5.5*3600e3, MIN=60e3, HOUR=3600e3, DAY=86400e3;
const istDayStart = t => Math.floor((t+IST)/DAY)*DAY - IST;
const fmt = t => {const d=new Date(t+IST);return String(d.getUTCHours()).padStart(2,"0")+":"+String(d.getUTCMinutes()).padStart(2,"0")};
function seeded(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}
  return ()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296}}
function shuffle(arr,rnd){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

// Videos and streams that failed to play in this browser; schedules are rebuilt without them
const AI_RE=/\bai\b|a\.i\.|artificial intelligence|midjourney|deepfake/i; // "AI cover", "AI generated" etc. all contain the word AI; "suno" is Hindi for listen, so not matched
const BAD=new Set();
function markBad(id){BAD.add(id); cache.clear()}

function pick(part){
  const exc=part.langExcept&&new RegExp(part.langExcept,"i"); // named creators allowed whatever their language
  const ok=v=>!BAD.has(v.id)&&(!part.lang||v.lang===part.lang||(exc&&exc.test(v.src))); // part.lang: only that language, never a fallback to others
  const inCat=c=>Array.isArray(part.cat)?part.cat.includes(c):c===part.cat; // cat may list several categories
  const re=part.match&&(part._re||(part._re=new RegExp(part.match,"i"))); // part.match: title must match, e.g. snack recipes
  const srcOk=v=>(!part.src||new RegExp(part.src,"i").test(v.src))&&(!part.srcSkip||!new RegExp(part.srcSkip,"i").test(v.src)); // part.src / srcSkip: which creators
  let pool=CATALOG.filter(v=>ok(v)&&srcOk(v)&&inCat(v.cat)&&(!part.tag||v.tag===part.tag)&&(!re||re.test(v.t))&&(!part.maxMin||v.min<=part.maxMin));
  if(!pool.length) pool=CATALOG.filter(v=>ok(v)&&srcOk(v)&&inCat(v.cat));
  if(!pool.length) pool=CATALOG.filter(v=>ok(v)&&inCat(v.cat));
  if(!pool.length&&part.alt) pool=CATALOG.filter(v=>ok(v)&&v.cat===part.alt); // e.g. Kids falls back to science
  if(!pool.length&&part.tag) pool=CATALOG.filter(v=>ok(v)&&inCat(v.cat));
  if(!pool.length) pool=CATALOG.filter(ok); // never leave a channel empty
  // part.preferMin: play only long mixes when there are enough of them (fewer video loads = fewer YouTube ads)
  if(part.preferMin){const long=pool.filter(v=>v.min>=part.preferMin); if(long.length>=6) pool=long}
  // Festivals and the music channels: AI-made videos get less airtime. About two in three sit out, chosen the
  // same way for every viewer, as long as the pool has plenty of other videos
  if(part._lessAI||[].concat(part.cat).some(c=>String(c).startsWith("fest-"))){const isAI=v=>AI_RE.test(v.t)&&seeded(v.id)()<0.67, rest=pool.filter(v=>!isAI(v)); if(rest.length>=10) pool=rest}
  return pool.length?pool:CATALOG;
}
/* Festivals: the row covering this day, if any */
function festivalOn(dayStart){const d=new Date(dayStart+IST).toISOString().slice(0,10);
  return (typeof FESTIVALS==="undefined"?[]:FESTIVALS).find(x=>x.from<=d&&d<=x.to)||null}
// A part with festival:true plays that festival's songs while one is on (e.g. Aangan's evening slot)
const onFestival=(p,dayStart)=>{const f=p.festival&&festivalOn(dayStart);
  return f?{...p,cat:f.cat,match:undefined,src:undefined,srcSkip:undefined,alt:p.cat,label:`${f.name} songs`}:p};
/* Festivals channel: today's festival from js/festivals.js, else the next one */
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function festivalParts(dayStart){
  const d=new Date(dayStart+IST).toISOString().slice(0,10), days=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/DAY);
  const list=typeof FESTIVALS==="undefined"?[]:FESTIVALS;
  const f=list.find(x=>x.from<=d&&d<=x.to);
  if(f){const n=days(f.day,d), when=n===0?"today":n<0?`in ${-n} day${n===-1?"":"s"}`:`day ${n+1}`;
    return [{from:0,to:24,cat:f.cat,alt:"bhakti",label:`${f.name} · ${when}`}]}
  const nx=list.find(x=>x.from>d);
  if(nx){const [,m,dd]=nx.day.split("-"); return [{from:0,to:24,cat:nx.cat,alt:"bhakti",label:`Next up: ${nx.name}, ${+dd} ${MONTHS[m-1]}`}]}
  return [{from:0,to:24,cat:"bhakti",label:"Devotional songs"}];
}
const cache=new Map();
function buildDay(ch,dayStart){
  const k=ch.key+"|"+dayStart; if(cache.has(k)) return cache.get(k);
  const slots=[];
  (ch.festival?festivalParts(dayStart):ch.parts.map(p=>onFestival(p,dayStart))).forEach((p,pi)=>{
    const pool=pick(ch.festival||ch.group==="Music"||ch.key==="bhakti"?{...p,_lessAI:true}:p), rnd=seeded(k+"|"+pi);
    let order=shuffle(pool,rnd), i=0;
    let t=dayStart+p.from*HOUR; const end=dayStart+p.to*HOUR;
    while(t<end){
      if(i>=order.length){order=shuffle(pool,rnd);i=0}
      const v=order[i++]; const e=Math.min(t+v.min*MIN,end);
      slots.push({start:t,end:e,v,part:p,ch}); t=e;
    }
  });
  cache.set(k,slots); return slots;
}

/* Live channels play the first stream in js/live.js that is on air; otherwise their parts are the fallback */
const LIVE_PART={label:"Live now",cat:"live",from:0,to:24};
function liveStream(ch){
  if(!ch.live||typeof LIVE==="undefined") return null;
  return (LIVE[ch.live]||[]).find(x=>!BAD.has(x.id))||null;
}
function liveSlot(ch,L,t){const a=Math.floor(t/HOUR)*HOUR; // shown in the guide as hour-long blocks
  return {start:a,end:a+HOUR,live:true,part:LIVE_PART,ch,v:{id:L.id,t:L.t,src:L.src,lang:L.lang,cat:"live",min:60}}}

function slotAt(ch,t){const L=liveStream(ch); if(L) return liveSlot(ch,L,t);
  return buildDay(ch,istDayStart(t)).find(s=>t>=s.start&&t<s.end)}
function slotsBetween(ch,a,b){const out=[], L=liveStream(ch);
  if(L){for(let t=Math.floor(a/HOUR)*HOUR;t<b;t+=HOUR) out.push(liveSlot(ch,L,t)); return out}
  let d=istDayStart(a);while(d<b){for(const s of buildDay(ch,d)) if(s.end>a&&s.start<b) out.push(s); d+=DAY}return out}
