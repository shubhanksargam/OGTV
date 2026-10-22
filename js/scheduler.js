/* ---------- Scheduler: deterministic per IST day, so every viewer sees the same thing ---------- */
const IST = 5.5*3600e3, MIN=60e3, HOUR=3600e3, DAY=86400e3;
const istDayStart = t => Math.floor((t+IST)/DAY)*DAY - IST;
// TV time: the device clock corrected by the server's (app.js sets clockSkew), so a set whose clock is minutes
// off still shows the same moment as everyone else
let clockSkew=0; const tvNow=()=>Date.now()+clockSkew;
const fmt = t => {const d=new Date(t+IST);return String(d.getUTCHours()).padStart(2,"0")+":"+String(d.getUTCMinutes()).padStart(2,"0")};
function seeded(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}
  return ()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296}}
function shuffle(arr,rnd){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

// Videos and streams that failed to play in this browser; schedules are rebuilt without them
const AI_RE=/\bai\b|a\.i\.|artificial intelligence|midjourney|deepfake/i; // "AI cover", "AI generated" etc. all contain the word AI; "suno" is Hindi for listen, so not matched
const BAD=new Set();
function markBad(id){BAD.add(id); cache.clear()}

// Built once, so a day's schedule scans only the videos a part can play (the full catalogue is ~13,000 videos):
// the catalogue by category, kept in catalogue order so every viewer's shuffle stays the same, and each pattern compiled once
let byCat=null; const RX=new Map();
const rx=s=>s&&(RX.get(s)||RX.set(s,new RegExp(s,"i")).get(s));
function inCats(cats){
  if(!byCat){byCat=new Map(); CATALOG.forEach((v,i)=>{if(!byCat.has(v.cat)) byCat.set(v.cat,[]); byCat.get(v.cat).push(i)})}
  const list=[...new Set([].concat(cats))], idx=list.flatMap(c=>byCat.get(c)||[]);
  if(list.length>1) idx.sort((a,b)=>a-b);
  return idx.map(i=>CATALOG[i]);
}
function pick(part){
  const exc=rx(part.langExcept); // named creators allowed whatever their language
  const ok=v=>!BAD.has(v.id)&&(!part.lang||v.lang===part.lang||(exc&&exc.test(v.src))); // part.lang: only that language, never a fallback to others
  const inCat=inCats(part.cat); // cat may list several categories
  const re=rx(part.match); // part.match: title must match, e.g. snack recipes
  const srcRe=rx(part.src), skipRe=rx(part.srcSkip), srcOk=v=>(!srcRe||srcRe.test(v.src))&&(!skipRe||!skipRe.test(v.src)); // part.src / srcSkip: which creators
  let pool=inCat.filter(v=>ok(v)&&srcOk(v)&&(!part.tag||v.tag===part.tag)&&(!re||re.test(v.t))&&(!part.maxMin||v.min<=part.maxMin));
  if(!pool.length&&re&&part.tag) pool=inCat.filter(v=>ok(v)&&srcOk(v)&&v.tag===part.tag); // e.g. no India match this week: the rest of the latest
  if(!pool.length) pool=inCat.filter(v=>ok(v)&&srcOk(v));
  if(!pool.length) pool=inCat.filter(ok);
  if(!pool.length&&typeof part.alt==="string") pool=inCats(part.alt).filter(ok); // e.g. Kids falls back to science
  if(!pool.length&&part.tag) pool=inCat.filter(ok);
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
const cutOut=(spans,holes)=>holes.reduce((acc,[a,b])=>acc.flatMap(([x,y])=>y<=a||x>=b?[[x,y]]:[...(x<a?[[x,a]]:[]),...(y>b?[[b,y]]:[])]),spans);
/* Prime time is 9 pm to 3 am on weekdays and 7 pm to 4 am on weekends (Friday and Saturday evenings), IST.
   A channel's prime block runs from its first "prime" part to midnight as written in js/channels.js (or from ch.prime).
   That block is stretched over tonight's prime window, and its overflow past midnight fills this morning's early hours,
   which belong to last night's prime time. 6 am stays fixed; the hours either side of it are fitted proportionally. */
const weekendEve=d=>{const w=new Date(d+IST).getUTCDay(); return w===5||w===6};
const primeFrom=ch=>ch.prime!=null?ch.prime:(ch.parts.find(p=>/prime/i.test(p.label))||{}).from;
function primeWarp(ch,dayStart){const P=ch.festival||ch.group==="News"?null:primeFrom(ch); // news keeps its fixed bulletin times
  if(P==null||P<=0||P>=24) return null;
  const start=weekendEve(dayStart)?19:21, tail=weekendEve(dayStart-DAY)?4:3, len=24-start+tail;
  const M=P>6?6:0; // 6 am stays put, so mornings and daytime keep their times; only the night and evening move
  return h=>h>=P?start+(h-P)*len/(24-P):h>=M?M+(h-M)*(start-M)/(P-M):tail+h*(M-tail)/M}
// The hours (in day-relative IST hours) a part occupies today; a stretch past midnight wraps to the morning
function partSpans(warp,p){if(!warp) return [[p.from,p.to]];
  const a=warp(p.from), b=warp(p.to);
  return b<=24?[[a,b]]:a>=24?[[a-24,b-24]]:[[a,24],[0,b-24]]}
// part.fixed: a show at a set clock time every day (e.g. Firstsports at 11 pm); the prime-time stretch never moves it.
// The parts around it close the gap before stretching, then the fixed show is laid over the result.
function layout(parts,warp){
  const flex=parts.filter(p=>!p.fixed).sort((x,y)=>x.from-y.from).map((p,i,a)=>({p,from:i?p.from:0,to:i<a.length-1?a[i+1].from:24}));
  return [...flex.map(x=>({p:x.p,spans:partSpans(warp,{from:x.from,to:x.to}),flex:true})),
          ...parts.filter(p=>p.fixed).map(p=>({p,spans:[[p.from,p.to]]}))]}
// part.newest: the latest episode first, then the one before (a daily show), instead of a shuffle
const newestFirst=pool=>pool.map((v,i)=>[v,i]).sort((a,b)=>(b[0].pub||"").localeCompare(a[0].pub||"")||a[1]-b[1]).map(x=>x[0]);
function buildDay(ch,dayStart){
  const k=ch.key+"|"+dayStart; if(cache.has(k)) return cache.get(k);
  // a set left on for weeks keeps only yesterday onwards
  if(cache.size>CHANNELS.length*4){const keep=istDayStart(tvNow())-DAY; for(const key of cache.keys()) if(+key.split("|")[1]<keep) cache.delete(key)}
  const slots=[], warp=primeWarp(ch,dayStart);
  const parts=ch.festival?festivalParts(dayStart):ch.parts.map(p=>onFestival(p,dayStart));
  const fixed=parts.filter(p=>p.fixed).map(p=>[dayStart+p.from*HOUR,dayStart+p.to*HOUR]);
  layout(parts,warp).forEach(({p,spans,flex})=>{const pi=parts.indexOf(p);
    const pool=pick(ch.festival||ch.group==="Music"||ch.key==="bhakti"?{...p,_lessAI:true}:p), rnd=seeded(k+"|"+pi);
    const fresh=()=>p.newest?newestFirst(pool):shuffle(pool,rnd);
    let order=fresh(), i=0;
    for(const [from,to] of spans){
      let t=dayStart+from*HOUR; const end=dayStart+to*HOUR;
      while(t<end){
        if(i>=order.length){order=fresh();i=0}
        const v=order[i++]; const e=Math.min(t+v.min*MIN,end);
        if(!flex) slots.push({start:t,end:e,v,part:p,ch});
        else for(const [a,b] of cutOut([[t,e]],fixed)) slots.push({start:a,end:b,v,part:p,ch}); // around the fixed shows
        t=e;
      }
    }
  });
  slots.sort((x,y)=>x.start-y.start);
  cache.set(k,slots); return slots;
}

/* Live channels play the first stream in js/live.js that is on air; otherwise their parts are the fallback */
const LIVE_PART={label:"Live now",cat:"live",from:0,to:24};
function liveStream(ch,t){
  if(!ch.live||typeof LIVE==="undefined") return null;
  const on=(LIVE[ch.live]||[]).filter(x=>!BAD.has(x.id));
  // ch.liveAt [[from,to,"Source"],…]: the same news channel at the same hour every day, when it is live
  const h=t==null?null:new Date(t+IST).getUTCHours(), want=ch.liveAt&&h!=null&&ch.liveAt.find(([a,b])=>h>=a&&h<b);
  return (want&&on.find(x=>x.src===want[2]))||on[0]||null;
}
function liveSlot(ch,L,t){const a=Math.floor(t/HOUR)*HOUR; // shown in the guide as hour-long blocks
  return {start:a,end:a+HOUR,live:true,part:LIVE_PART,ch,v:{id:L.id,t:L.t,src:L.src,lang:L.lang,cat:"live",min:60}}}

// ch.liveHours ([[from,to],…] in IST hours): live only then; the rest of the day plays the channel's parts
const liveNow=(ch,t)=>!ch.liveHours||ch.liveHours.some(([a,b])=>{const h=new Date(t+IST).getUTCHours(); return h>=a&&h<b});
function slotAt(ch,t){const L=liveStream(ch,t); if(L&&liveNow(ch,t)) return liveSlot(ch,L,t);
  return buildDay(ch,istDayStart(t)).find(s=>t>=s.start&&t<s.end)||gapSlot(ch,t)}
// Only if a channel's parts leave an hour uncovered (a slip in channels.js): play something rather than break the page
function gapSlot(ch,t){const a=Math.floor(t/HOUR)*HOUR, pool=CATALOG.filter(v=>!BAD.has(v.id)), v=pool[seeded(ch.key+a)()*pool.length|0]||CATALOG[0];
  return {start:a,end:a+HOUR,v,part:{label:ch.en||ch.name,cat:v.cat,from:0,to:24},ch}}
function slotsBetween(ch,a,b){const out=[], L=liveStream(ch);
  if(L&&!ch.liveHours){for(let t=Math.floor(a/HOUR)*HOUR;t<b;t+=HOUR) out.push(liveSlot(ch,liveStream(ch,t)||L,t)); return out}
  let d=istDayStart(a);while(d<b){for(const s of buildDay(ch,d)) if(s.end>a&&s.start<b&&!(L&&liveNow(ch,s.start))) out.push(s); d+=DAY}
  if(L) for(let t=Math.floor(a/HOUR)*HOUR;t<b;t+=HOUR) if(liveNow(ch,t)) out.push(liveSlot(ch,liveStream(ch,t)||L,t));
  return out.sort((x,y)=>x.start-y.start)}
