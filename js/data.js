/* ---------- The videos, a category at a time ----------
   All the channels together have about 20,000 videos (js/feeds.js), far too many to wait for before the first programme
   plays on a phone. So the page fetches them category by category, from js/c/ (scripts/build-pages.mjs writes one file
   per category and lists them, each with a stamp, in js/feedmap.js): first the categories of the channel it opens on,
   then the other channels', the nearest on the record first, in the background. A channel tuned to before its videos
   are in jumps the queue (need) and shows "Tuning in" until they come.
   CATALOG is always js/catalog.js's own videos, then the categories that have come, in js/feeds.js's own order, and a
   channel's day is worked out only once all of its categories are in (chReady in js/scheduler.js), so a channel always
   has exactly the day it has on every other screen (scripts/check.mjs proves it for every channel).
   New lists (the hourly news, the nightly music) come the same way: checkVersion (js/app.js) finds a new js/feedmap.js,
   stage() fetches only the categories that changed, and apply() swaps them in at the next change of programme.
   Without js/feedmap.js the page still plays, from js/catalog.js's videos alone (OGTV_DATA is then undefined). */
const OGTV_DATA=(()=>{try{
  const HAND=CATALOG.slice(), handKeys=new Set(HAND.map(v=>v.id+"|"+v.cat)); // js/catalog.js's own (the feeds' copies in its categories give way)
  let map=FEED_MAP, want=new Map(map.files.map(([c,s])=>[c,s])); // category -> stamp, in js/feeds.js's order
  const have=new Map(); // category -> {s: stamp, v: its videos}, as they arrive
  let inCat=new Set(), next=null, rebuildT=0, staleAsked=false, resolveAll, allDone=false, urgent=0; // urgent: the channel waited for
  const all=new Promise(r=>resolveAll=r);
  const isReady=ch=>chCats(ch).every(c=>inCat.has(c)||!want.has(c)); // a category with no file has only catalog.js's videos, or none
  const readyNow=()=>CHANNELS.map(isReady);
  let wasReady=readyNow();

  // Fetching: the wanted channel's files all at once; the rest four at a time, in the queue's order, once those are in and
  // the first programme is playing (go), so they don't hold up its picture on a slow connection. A failed file is tried
  // again after 2, 5, 15, then every 30 s, and at once when the connection comes back
  const LIMIT=4, BACKOFF=[2e3,5e3,15e3,30e3], queue=[], active=new Map(), waiting=new Map();
  let held=true;
  const wanted=j=>j.next?!!next&&next.need.has(j.c)&&next.want.get(j.c)===j.s:!have.has(j.c)&&want.get(j.c)===j.s;
  const jobKey=j=>(j.next?"n:":"")+j.c+"?"+j.s;
  function pump(){
    while(queue.length){const j=queue[0], k=jobKey(j);
      if(!wanted(j)||active.has(k)||waiting.has(k)){queue.shift(); continue}
      if(!j.hi&&(held||active.size>=LIMIT||[...active.values()].some(x=>x.hi))) break; // the wanted channel's first
      queue.shift(); active.set(k,j); const el=document.createElement("script"); el.src=`js/c/${encodeURIComponent(j.c)}.js?v=${encodeURIComponent(j.s)}`;
      el.setAttribute("fetchpriority",j.hi?"high":"low");
      const end=()=>{el.remove(); active.delete(k);
        if(wanted(j)){const t=j.tries=(j.tries||0)+1; waiting.set(k,{j,timer:setTimeout(()=>{waiting.delete(k); queue.unshift(j); pump()},BACKOFF[Math.min(t,BACKOFF.length)-1])})} // not in: try again
        pump()};
      el.onload=el.onerror=end;
      document.head.appendChild(el)}}
  addEventListener("online",()=>{for(const [k,w] of waiting){clearTimeout(w.timer); waiting.delete(k); queue.unshift(w.j)} pump()});
  const jobs=(i,hi)=>chCats(CHANNELS[(i%CHANNELS.length+CHANNELS.length)%CHANNELS.length]).filter(c=>want.has(c)&&!have.has(c)).map(c=>({c,s:want.get(c),hi}));
  const first=q=>{const keys=new Set(q.map(jobKey)); for(let i=queue.length-1;i>=0;i--) if(keys.has(jobKey(queue[i]))) queue.splice(i,1); queue.unshift(...q); pump()};
  const go=()=>{if(held){held=false; pump()}};

  // Every file in js/c/ calls this with its videos (a hand-picked copy stands in for the feed's, as js/feeds.js has it)
  function put(c,s,list){if(!Array.isArray(list)) return; const v=list.filter(x=>!handKeys.has(x.id+"|"+x.cat));
    if(next&&next.need.has(c)){next.got.set(c,{s,v}); next.need.delete(c); return} // part of a new list (stage)
    if(have.has(c)||!want.has(c)) return;
    have.set(c,{s,v});
    if(want.get(c)!==s&&!staleAsked){staleAsked=true; setTimeout(()=>{if(typeof checkVersion==="function") checkVersion()},1000)} // the site has changed since this page loaded
    if(typeof document.readyState==="string"&&document.readyState==="loading"){rebuild(); return} // the page's own channel's, run before js/app.js: in at once
    if(!rebuildT) rebuildT=setTimeout(rebuild,isReady(CHANNELS[urgent])?150:0)} // files arriving together go in together (at once while the first channel waits)
  function rebuild(){clearTimeout(rebuildT); rebuildT=0;
    CATALOG.length=0; for(const v of HAND) CATALOG.push(v);
    for(const [c] of map.files){const h=have.get(c); if(h) for(const v of h.v) CATALOG.push(v)}
    byCat=null; inCat=new Set(have.keys()); // the scheduler's index is made again on its next use
    const now=readyNow(), fresh=now.flatMap((r,i)=>r&&!wasReady[i]?[i]:[]); wasReady=now;
    const complete=map.files.every(([c])=>have.has(c));
    if(complete&&!allDone){allDone=true; resolveAll()}
    if(fresh.length||complete) dispatchEvent(new CustomEvent("ogtv-data",{detail:{ready:fresh,all:complete}}))}

  return {
    hand:HAND,
    ready:isReady,
    all,                       // resolves once every category is in
    loaded:()=>allDone,
    // The channel the page opens on, then the others by their distance from it round the record: those once the first
    // programme plays (go, from js/app.js), or after 6 s whatever happens
    start(i){urgent=i; const q=jobs(i,true); for(let d=1;d<=CHANNELS.length/2;d++) q.push(...jobs(i+d,false),...jobs(i-d,false));
      queue.push(...q.filter(j=>!j.hi)); first(q.filter(j=>j.hi)); setTimeout(go,6e3)},
    go,
    // A channel tuned to before its videos are in: its files first
    need(i){urgent=i; const q=jobs(i,true); if(q.length) first(q)},
    put,
    // A new list (js/feedmap.js, read by checkVersion): what changed, and any new category, fetched in the background
    stage(m){if(!m||!Array.isArray(m.files)) return;
      next={map:m, want:new Map(m.files.map(([c,s])=>[c,s])), need:new Set(), got:new Map()};
      for(const [c,s] of m.files){const h=have.get(c); if(h?h.s!==s:!want.has(c)) next.need.add(c)}
      queue.push(...[...next.need].map(c=>({c,s:next.want.get(c),hi:false,next:true}))); pump()},
    staged:()=>!!next&&next.need.size===0,
    // ...swapped in by js/app.js at a change of programme: CATALOG is made from it, and today's schedules are worked out again
    apply(){if(!next||next.need.size) return false; const n=next; next=null;
      for(const [c,h] of n.got) have.set(c,h);
      for(const c of [...have.keys()]) if(!n.want.has(c)) have.delete(c); // a category no longer listed
      map=n.map; want=n.want;
      if(typeof map.refused==="string") map.refused.split(" ").forEach(id=>id&&BAD.add(id)); // newly refused videos
      rebuild(); for(let i=0;i<CHANNELS.length;i++) queue.push(...jobs(i,false)); pump(); // anything not yet in
      return true}
  };
}catch(e){console.error("OGTV: the video lists could not be set up",e); return undefined}})();
