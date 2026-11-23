/* ---------- The channel record (by request) ----------
   Above the panel under the TV (what's on now) is a record, of which only the bottom segment shows: black vinyl with its grooves and
   a gold rim, and every channel round its rim, all 360 degrees of it, each a small disc with its own cover (its name in a
   script, black on ivory; no pictures, by request). The channel you're on sits at the bottom centre; its neighbours
   rise away along the rim on either side, smaller the further they are. Turning the record (drag or swipe across it, a trackpad's sideways scroll, or ← → once it has
   focus) browses the channels: the one at the centre shows what's on it, as the full-screen strip does, with Watch.
   A tap on a channel's disc watches it, and the record turns to it. Left alone for 15 s, it turns back to the channel
   you're on. It moves only while it turns, and only by transforms (kind to a phone's GPU). */
(()=>{
const dial=document.getElementById("dial"); if(!dial) return;
const ring=dial.querySelector(".dial-ring"), info=document.getElementById("dialInfo");
const N=CHANNELS.length, STEP=2*Math.PI/N, IDLE=15e3;
const still=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const wrapD=d=>((d%N)+N*1.5)%N-N/2;            // a distance round the record, -N/2 to N/2 channels
const at=p=>((Math.round(p)%N)+N)%N;            // the channel at a position
const LIFT=36; // room under the centre disc for its number, above the rim
let W=0, H=0, D=100, r=700, pos=cur, target=cur, raf=0, drag=null, dragged=false, idle=0, wheelT=0, shown=-1, busy=false, pending=null, changeT=0;
// The record itself is painted once onto a canvas the size of the panel (drawRecord), so nothing about it has to be
// painted again while the TV is busy tuning in; and the little spinning record for tuning in sits on its own layer
const cv=document.createElement("canvas"); cv.className="dial-record"; cv.setAttribute("aria-hidden","true");
dial.querySelector(".dial-record").replaceWith(cv);
// Each segment of channels has its own shade of vinyl (by request), on a second canvas over the grooves that turns with
// the record: News red, Knowledge teal, Sports green, Lifestyle amber, Entertainment blue, Music violet
const tc=document.createElement("canvas"); tc.className="dial-record dial-tint"; tc.setAttribute("aria-hidden","true"); cv.after(tc);
const TINT={Latest:"214,174,96",News:"229,72,58",Knowledge:"63,184,168",Sports:"70,180,90",Lifestyle:"242,160,61",Entertainment:"79,124,240",Music:"163,92,240"};
let geo=null, tintAt=null;
dial.insertAdjacentHTML("beforeend",`<div class="dial-load" aria-hidden="true"><span class="vinyl dial-spin"><i class="vinyl-grooves"></i><i class="vinyl-sweep"></i><i class="vinyl-label"></i><i class="dk-hole"></i></span><span>Tuning in</span></div>`);

const items=CHANNELS.map((c,i)=>{const b=document.createElement("button");
  b.type="button"; b.className="dk"; b.dataset.i=i; b.tabIndex=-1; b.setAttribute("aria-label",`Watch ${c.n} ${c.name}`);
  b.innerHTML=`<span class="dk-disc"><span class="dk-cover"></span><i class="dk-hole"></i></span>`
    +`<span class="dk-n">${c.n}</span>`; // no name under it (by request, 23 Nov 2026): its cover carries it
  b.style.visibility="hidden"; // hidden until placed (render): a disc first seen where it belongs, never moved into place
  ring.appendChild(b); return {b, cover:b.querySelector(".dk-cover"), vis:false}});
// Each disc's cover (by request, 23 Nov 2026): the channel's name in a script, white on black, on one line or broken between
// its words onto two or three, a little wider than the label, so the label's edge crops it a little at the sides (by
// request): each line up to OVER times the label's width where it sits (a circle: narrower away from the middle), all of
// it within TALL of the label's height; a layout cropped so is preferred to a bigger one that stops short of the edge.
// The spindle hole sits over it in the middle, cropping the letters it covers.
// Measured once, when the script has loaded; until then the labels are plain.
const OVER=1.04, TALL=.8, BIGGEST=.7, LH=1.05; // in discs; a line's height in its size
function letter(){const g=document.createElement("canvas").getContext("2d"); if(!g) return;
  g.font="100px "+getComputedStyle(items[0].cover).fontFamily; const em=t=>g.measureText(t).width/100, LABEL=.5-5/D; // the label's radius, in discs
  const size=ls=>{const n=ls.length, cap=Math.min(BIGGEST,TALL/(n*LH)); let lo=0, hi=cap; // the largest size at which every line keeps within OVER
    for(let k=0;k<14;k++){const fs=(lo+hi)/2, L=fs*LH, ok=ls.every((t,j)=>{const y=Math.abs(j-(n-1)/2)*L; return em(t)*fs<=OVER*2*Math.sqrt(LABEL*LABEL-y*y)});
      if(ok) lo=fs; else hi=fs}
    return {fs:lo, crop:lo<cap*.99}}; // crop: the label's width set its size
  items.forEach((it,i)=>{const w=CHANNELS[i].name.split(" "), ways=[[w.join(" ")]]; let best=null;
    for(let k=1;k<w.length;k++) ways.push([w.slice(0,k).join(" "),w.slice(k).join(" ")]);
    if(w.length>2) ways.push(w);
    for(const ls of ways){const s=size(ls); // cropped at the sides first; then fewer lines, unless more are clearly bigger
      if(!best||s.crop&&!best.crop||s.crop===best.crop&&s.fs>best.fs+.005) best={...s,ls}}
    it.cover.innerHTML=best.ls.map(esc).join("<br>"); it.cover.style.fontSize=`calc(var(--d) * ${best.fs.toFixed(3)})`})}

// Sizes: the discs' circle is wide enough that neighbours don't overlap; the record's rim is the panel's foot
function measure(){W=dial.clientWidth; H=dial.clientHeight; if(!W) return false;
  D=W<560?84:108; r=Math.max(W<560?520:720, W*.85);
  dial.style.setProperty("--d",D+"px"); drawRecord(r+D/2+LIFT-6, H-D/2-LIFT-r); return true}
// The bottom segment of the record: black vinyl, its grooves (only the rings that show), the smooth lead-in by the edge,
// the light lying on it either side of the centre, and the gold rim. At most 2 device pixels per pixel, to spare memory.
function drawRecord(R,cy){const dpr=Math.min(2,window.devicePixelRatio||1), g=cv.getContext("2d"), cx=W/2, TAU=Math.PI*2;
  cv.width=tc.width=Math.round(W*dpr); cv.height=tc.height=Math.round(H*dpr); geo={R,cy,dpr}; tintAt=null; if(!g) return;
  g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const ring=(rad,w,style)=>{g.lineWidth=w; g.strokeStyle=style; g.beginPath(); g.arc(cx,cy,rad,0,TAU); g.stroke()};
  g.save(); g.beginPath(); g.arc(cx,cy,R,0,TAU); g.clip();
  const base=g.createRadialGradient(cx,cy,0,cx,cy,R); base.addColorStop(0,"#17131c"); base.addColorStop(.62,"#17131c"); base.addColorStop(1,"#0b090e");
  g.fillStyle=base; g.fillRect(0,0,W,H);
  for(let rad=Math.max(1,Math.floor((-cy-4)/3)*3)+.5; rad<R-30; rad+=3) ring(rad,1,"rgba(255,255,255,.05)"); // grooves
  g.fillStyle="rgba(255,255,255,.06)"; g.beginPath(); g.arc(cx,cy,R-12,0,TAU); g.arc(cx,cy,R-29,0,TAU,true); g.fill(); // lead-in
  if(g.createConicGradient){const l=g.createConicGradient(-Math.PI/2,cx,cy), d=x=>x/360; // light that stays put as it turns
    [[0,"rgba(255,236,214,0)"],[d(146),"rgba(255,236,214,0)"],[d(158),"rgba(255,236,214,.09)"],[d(170),"rgba(255,236,214,0)"],
     [d(190),"rgba(255,236,214,0)"],[d(203),"rgba(255,236,214,.12)"],[d(216),"rgba(255,236,214,0)"],[1,"rgba(255,236,214,0)"]].forEach(([o,c])=>l.addColorStop(o,c));
    g.fillStyle=l; g.fillRect(0,0,W,H)}
  g.restore();
  ring(R+.5,1,"rgba(242,160,61,.55)"); ring(R+3.5,5,"#0c0a10"); ring(R+6.5,1,"rgba(242,160,61,.22)")} // the rim
// The segments' shades where the record now is: one sweep of colour round it (each channel its segment's colour, blending
// over a sliver where segments meet), strongest by the rim and fading towards the centre. Redrawn only when it turns.
function drawTint(){if(!geo||tintAt===pos) return; tintAt=pos;
  const g=tc.getContext("2d"); if(!g) return; const {R,cy,dpr}=geo, cx=W/2;
  g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H); if(!g.createConicGradient) return; // older browsers: plain black vinyl
  const half=.5/N, blend=.12/N, col=i=>TINT[CHANNELS[i].group]||TINT.Lifestyle, stops=[];
  for(let i=0;i<N;i++){const f=(pos-i)/N; for(const x of [f-half+blend,f+half-blend]) stops.push([((x%1)+1)%1,col(i)])} // 0 = bottom centre, going left
  stops.sort((a,b)=>a[0]-b[0]);
  const sweep=g.createConicGradient(Math.PI/2,cx,cy), edge=col(at(pos));
  sweep.addColorStop(0,`rgba(${edge},.2)`); stops.forEach(([f,c])=>sweep.addColorStop(f,`rgba(${c},.2)`)); sweep.addColorStop(1,`rgba(${edge},.2)`);
  g.save(); g.beginPath(); g.arc(cx,cy,R,0,Math.PI*2); g.clip(); g.fillStyle=sweep; g.fillRect(0,0,W,H);
  const fade=g.createRadialGradient(cx,cy,Math.max(0,-cy-10),cx,cy,R); fade.addColorStop(0,"rgba(0,0,0,.25)"); fade.addColorStop(1,"rgba(0,0,0,1)");
  g.globalCompositeOperation="destination-in"; g.fillStyle=fade; g.fillRect(0,0,W,H); g.restore()}
function render(){if(!W) return; // not measured yet (or out of sight): the observer places it all when it is laid out
  const cx=W/2, cy=H-D/2-LIFT-r, mid=at(pos);
  for(let i=0;i<N;i++){const it=items[i], d=wrapD(i-pos), a=d*STEP, ad=Math.abs(d), x=r*Math.sin(a);
    const vis=ad<5.5&&Math.abs(x)<W/2+D;
    if(vis!==it.vis){it.b.style.visibility=vis?"":"hidden"; it.vis=vis}
    if(!vis) continue;
    const s=Math.max(.5,1-.13*ad);
    it.b.style.transform=`translate3d(${(cx+x).toFixed(1)}px,${(cy+r*Math.cos(a)).toFixed(1)}px,0) scale(${s.toFixed(3)})`;
    it.b.style.opacity=ad<3.5?"":Math.max(0,(5.5-ad)/2).toFixed(2);
    it.b.style.zIndex=100-Math.round(ad*10);
    it.b.classList.toggle("mid",i===mid)}
  if(mid!==shown) showInfo(mid);
  drawTint()}
// What's on the channel at the centre, as the full-screen strip shows it
const infoKey=i=>{const s=onNow(i); return i+"|"+(s?s.v.id+s.start:"")+"|"+(i===cur)+"|"+!!soFor(i)};
function showInfo(i){shown=i; info._k=infoKey(i); const c=CHANNELS[i], now=chNow(i), s=onNow(i); if(!s) return;
  const pct=s.live?100:s.pending||s.menu?0:Math.max(0,Math.min(100,Math.round((now-s.start)/(s.end-s.start)*100)));
  info.innerHTML=`<span class="di-k">${c.n} · ${esc(c.group||"")}${i===cur?(soOn()?" · <b>From the start</b>":" · <b>Watching</b>"):soFor(i)?" · From the start":""}</span>`
    +`<span class="di-name">${esc(c.name)}</span><span class="di-title">${s.live?LIVEDOT:""}${esc(onAir(s))}</span>`
    +`<span class="di-meta"><span>${s.live?"Live":s.menu?(LATEST?latestItems().length+" trending":""):s.pending?"":fmt(s.start)+" – "+fmt(s.end)}</span><i class="di-bar"><i style="width:${pct}%"></i></i>`
    +(i===cur?"":`<button class="dial-watch" type="button" data-i="${i}">Watch</button>`)+`</span>`}

// Turning: the record glides to its target channel, easing in the last stretch
function glide(){if(!raf) raf=requestAnimationFrame(step)}
function step(){raf=0; const diff=target-pos;
  if(still()||Math.abs(diff)<.003){pos=target; render(); return}
  pos+=diff*.16; render(); raf=requestAnimationFrame(step)}
function turnTo(t){target=t; glide()}
function poke(){clearTimeout(idle); idle=setTimeout(()=>{if(!drag&&at(target)!==cur) dialTo(cur)},IDLE)}
function watch(i){poke(); if(i!==cur) tune(i); else dialTo(cur)} // tune() turns the record (dialTo)
// The record turns to a channel the shortest way round (tune() calls this for every channel change); while the channel
// is still tuning in, the turn waits for a steady picture (dialBusy)
function turnToChannel(i){const base=Math.round(target); items.forEach((it,k)=>it.b.classList.toggle("cur",k===cur)); shown=-1; turnTo(base+wrapD(i-base))}
window.dialTo=i=>{if(busy){pending=i; return} turnToChannel(i)};
// While a channel or programme tunes in (the static's glitch: hidePanel in app.js), the discs and the words step away and
// a small record spins at the centre; nothing on the record changes as YouTube works through what will play, and the
// record itself stays as painted. Once the picture is steady (revealPanel) it all comes back as things now are,
// already turned to the channel.
window.dialBusy=on=>{if(on===busy) return; busy=on;
  if(on){dial.classList.add("loading"); return}
  shown=-1;
  if(pending!==null){const i=pending, base=Math.round(target); pending=null; cancelAnimationFrame(raf); raf=0;
    items.forEach((it,k)=>it.b.classList.toggle("cur",k===cur)); pos=target=base+wrapD(i-base)} // no turn to watch: it was away
  render(); dial.classList.remove("loading"); warmThen()};

dial.addEventListener("pointerdown",e=>{if(e.button!==0||e.target.closest(".dial-watch")) return;
  cancelAnimationFrame(raf); raf=0; dragged=false;
  drag={x:e.clientX, y:e.clientY, p:pos, id:e.pointerId, on:false, pts:[[performance.now(),e.clientX]]}});
dial.addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id) return; const dx=e.clientX-drag.x;
  if(!drag.on){if(Math.abs(dx)<6) return;
    if(Math.abs(e.clientY-drag.y)>Math.abs(dx)){drag=null; glide(); return} // a scroll down the page, not a turn
    drag.on=true; dial.setPointerCapture(e.pointerId); dial.classList.add("turning")}
  pos=drag.p-dx/(r*STEP); drag.pts.push([performance.now(),e.clientX]); if(drag.pts.length>6) drag.pts.shift(); render(); poke()});
function letGo(){if(!drag) return; const d=drag; drag=null; dial.classList.remove("turning");
  if(!d.on){glide(); return}
  dragged=true; setTimeout(()=>{dragged=false},0); // the click that ends a turn isn't a tap
  const [t0,x0]=d.pts[0], [t1,x1]=d.pts[d.pts.length-1], v=(x1-x0)/Math.max(16,t1-t0); // px per ms: a flick carries on
  turnTo(Math.round(pos-v*220/(r*STEP)))}
dial.addEventListener("pointerup",letGo); dial.addEventListener("pointercancel",letGo);
dial.addEventListener("click",e=>{if(dragged) return;
  const w=e.target.closest(".dial-watch"); if(w) return watch(+w.dataset.i);
  const b=e.target.closest(".dk"); if(b) watch(+b.dataset.i)});
dial.addEventListener("wheel",e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)) return; // only sideways: the page still scrolls
  e.preventDefault(); cancelAnimationFrame(raf); raf=0; pos+=e.deltaX/(r*STEP); target=Math.round(pos); render(); poke();
  clearTimeout(wheelT); wheelT=setTimeout(glide,140)},{passive:false});
dial.addEventListener("keydown",e=>{ // with the record in focus, ← → turn it (the page's own ← → change channel outright)
  if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault(); e.stopPropagation(); poke(); turnTo(Math.round(target)+(e.key==="ArrowRight"?1:-1))}
  else if((e.key==="Enter"||e.key===" ")&&e.target===dial){e.preventDefault(); e.stopPropagation(); watch(at(target))}});

// Measured and painted when the page lays the record out (the observer's first call, right after layout and before the
// first paint), not while this script runs: reading its size here made the browser lay out the whole page early, and the
// observer then painted the record a second time at the same size. After that, only a real change of size repaints it.
// Placing the discs fills in what's on at the centre, which can change the record's height: then it is measured and
// placed again at once, still before that paint, so nothing on it ever moves once seen
items[cur].b.classList.add("cur");
new ResizeObserver(()=>{if(W&&dial.clientWidth===W&&dial.clientHeight===H) return;
  for(let k=0;k<3&&measure();k++){render(); if(dial.clientWidth===W&&dial.clientHeight===H) break}}).observe(dial);
// Real time, as the programme guide: the covers and the centre change the moment a programme ends on any channel (the
// soonest end of all, looked up again after each change; tick() calls this too, so a skipped programme doesn't linger),
// and the centre's progress bar moves every second. Nothing changes while a channel tunes in.
window.dialRefresh=()=>{if(busy) return; const i=at(pos); if(!drag&&info._k!==infoKey(i)) showInfo(i)};
function nextChange(){clearTimeout(changeT); const now=tvNow(); let soon=now+60e3;
  for(const c of CHANNELS){const s=slotAt(c,now); if(s&&!s.live&&!s.pending&&!s.menu&&s.end>now&&s.end<soon) soon=s.end}
  changeT=setTimeout(()=>{dialRefresh(); warmThen()},soon-now+100)}
// Every channel's day is worked out a channel or two at a time while the page is idle (each takes a few milliseconds on
// a phone; all 44 at once held the page up for most of a second), then the covers come round and the next change is
// looked up: at start-up, as more channels' videos come in (js/data.js), after a tune-in and at each change
const whenIdle=window.requestIdleCallback?f=>requestIdleCallback(f,{timeout:3000}):f=>setTimeout(()=>{const end=performance.now()+12; f({timeRemaining:()=>Math.max(0,end-performance.now())})},60);
let warming=false, again=false;
function warmThen(){if(warming){again=true; return} warming=true; again=false; let i=0; const now=tvNow();
  const step=dl=>{do slotAt(CHANNELS[i++],now); while(i<N&&dl.timeRemaining()>8);
    if(i<N) return whenIdle(step);
    warming=false; if(again) return warmThen();
    if(!busy){render(); dialRefresh()} nextChange()};
  whenIdle(step)}
warmThen();
addEventListener("ogtv-data",warmThen);
whenIdle(()=>{const f=document.fonts; (f?f.load("100px "+getComputedStyle(items[0].cover).fontFamily).catch(()=>{}):Promise.resolve()).then(letter)});
setInterval(()=>{if(busy||document.hidden) return; const i=at(pos), s=onNow(i), now=chNow(i), b=info.querySelector(".di-bar i");
  if(b&&s&&!s.live&&!s.pending&&!s.menu) b.style.width=Math.max(0,Math.min(100,(now-s.start)/(s.end-s.start)*100)).toFixed(1)+"%"},1000);
})();
