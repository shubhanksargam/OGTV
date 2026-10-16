/* ---------- Scheduler: deterministic per IST day, so every viewer sees the same thing ---------- */
const IST = 5.5*3600e3, MIN=60e3, HOUR=3600e3, DAY=86400e3;
const istDayStart = t => Math.floor((t+IST)/DAY)*DAY - IST;
const fmt = t => {const d=new Date(t+IST);return String(d.getUTCHours()).padStart(2,"0")+":"+String(d.getUTCMinutes()).padStart(2,"0")};
function seeded(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}
  return ()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return (h>>>0)/4294967296}}
function shuffle(arr,rnd){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

let LANG="all";
try{const s=localStorage.getItem("aangan-lang");if(s)LANG=s}catch(e){}

function pick(part){
  let pool=CATALOG.filter(v=>v.cat===part.cat && (!part.tag||v.tag===part.tag) && (!part.maxMin||v.min<=part.maxMin));
  if(!pool.length) pool=CATALOG.filter(v=>v.cat===part.cat);
  if(LANG!=="all"){const f=pool.filter(v=>v.lang===LANG); if(f.length) return {pool:f,fallback:false}; return {pool,fallback:true}}
  return {pool,fallback:false};
}
const cache=new Map();
function buildDay(ch,dayStart){
  const k=ch.key+"|"+dayStart+"|"+LANG; if(cache.has(k)) return cache.get(k);
  const slots=[];
  ch.parts.forEach((p,pi)=>{
    const {pool,fallback}=pick(p);
    const rnd=seeded(k+"|"+pi);
    let order=shuffle(pool,rnd), i=0;
    let t=dayStart+p.from*HOUR; const end=dayStart+p.to*HOUR;
    while(t<end){
      if(i>=order.length){order=shuffle(pool,rnd);i=0}
      const v=order[i++]; const e=Math.min(t+v.min*MIN,end);
      slots.push({start:t,end:e,v,part:p,fallback,ch}); t=e;
    }
  });
  cache.set(k,slots); return slots;
}
function slotAt(ch,t){return buildDay(ch,istDayStart(t)).find(s=>t>=s.start&&t<s.end)}
function slotsBetween(ch,a,b){const out=[];let d=istDayStart(a);while(d<b){for(const s of buildDay(ch,d)) if(s.end>a&&s.start<b) out.push(s); d+=DAY}return out}
