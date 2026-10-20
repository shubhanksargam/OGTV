/* ---------- UI ---------- */
const $=id=>document.getElementById(id);
let cur=Math.max(0,CHANNELS.findIndex(c=>c.key==="classics")); // every visit opens on Cricket Classics
{const n=+new URLSearchParams(location.search).get("ch")||window.OGTV_CH, i=CHANNELS.findIndex(c=>c.n===n); if(i>=0)cur=i} // ?ch=8, or a /tv/<channel>/ page, opens that channel
const isNew=v=>v.pub&&Date.now()-Date.parse(v.pub)<30*DAY; // uploaded in the last 30 days
const NEW='<i class="new" title="Uploaded in the last 30 days">NEW</i>', LIVEDOT='<i class="livedot">LIVE</i>';
const badge=s=>s.live?LIVEDOT:isNew(s.v)?NEW:"";
const onAir=s=>s.live?s.v.src+": "+s.v.t:s.v.t;

function renderChannels(){
  const now=Date.now();
  $("chlist").innerHTML=CHANNELS.map((c,i)=>{const s=slotAt(c,now), head=c.group&&c.group!==(CHANNELS[i-1]||{}).group?`<h5 class="ch-group">${c.group}</h5>`:"";
    return `${head}<button class="ch" id="ch-${c.key}" data-i="${i}" aria-current="${i===cur}">
      <span class="num">${c.n}</span>
      <span style="min-width:0"><span class="nm"><strong>${c.name}</strong><em>${c.en}</em></span>
      <span class="on">${badge(s)}${onAir(s)}</span></span></button>`}).join("");
}
$("chlist").addEventListener("click",e=>{const b=e.target.closest(".ch");if(b)tune(+b.dataset.i)});

function renderGuide(){
  const now=Date.now(), a=Math.floor(now/(30*MIN))*30*MIN, b=a+3*HOUR, PX=6; // 6px per minute
  const W=(b-a)/MIN*PX;
  let ticks="";for(let t=a;t<=b;t+=30*MIN) ticks+=`<span class="tick" style="left:${(t-a)/MIN*PX}px">${fmt(t)}</span>`;
  let rows=`<div class="trow" style="width:${W}px">${ticks}</div>`;
  CHANNELS.forEach((c,i)=>{
    const lane=slotsBetween(c,a,b).map(s=>{const x=Math.max(s.start,a),y=Math.min(s.end,b);
      const on=now>=s.start&&now<s.end;
      return `<button class="prog${on?' nowp':''}" data-i="${i}" style="left:${(x-a)/MIN*PX+1}px;width:${(y-x)/MIN*PX-3}px" title="${onAir(s).replace(/"/g,"&quot;")}">
        <b>${badge(s)}${onAir(s)}</b><small>${fmt(s.start)}</small></button>`}).join("");
    rows+=`<div class="grow"><div class="glabel">${c.n} ${c.name}</div><div class="glane" style="width:${W}px">${lane}</div></div>`;
  });
  rows+=`<div class="nowline" style="left:${18+120+(now-a)/MIN*PX}px"></div>`;
  $("grid").innerHTML=rows;
}
$("grid").addEventListener("click",e=>{const b=e.target.closest(".prog");if(b)tune(+b.dataset.i)});

// A channel counts as watched after 10 s on it, so flicking past doesn't inflate it
let watchTimer=0;
function countChannel(){clearTimeout(watchTimer); const c=CHANNELS[cur];
  watchTimer=setTimeout(()=>track("ch-"+String(c.n).padStart(2,"0")+"-"+c.key,c.n+" · "+c.name),10e3)}
function tune(i){cur=(i+CHANNELS.length)%CHANNELS.length;
  countChannel(); browse=cur; clearDigits();
  try{history.replaceState(null,"","?ch="+CHANNELS[cur].n)}catch(e){}
  playingKey=null; renderChannels(); tick(); showBanner(); if($("screen").classList.contains("strip-on")) renderStrip(); knobs();}
let digits="", digitTimer=0;
function tuneNumber(n){const i=CHANNELS.findIndex(c=>c.n===n); if(i>=0)tune(i)}
addEventListener("keydown",e=>{
  if(e.target.closest&&e.target.closest("input,select,textarea"))return;
  if(!started)return; // the ident plays through (a key during it only lets the sound in)
  if(isFull()&&fsKey(e)) return;
  if(e.key==="ArrowUp"){e.preventDefault();tune(cur-1)}
  else if(e.key==="ArrowDown"){e.preventDefault();tune(cur+1)}
  else if(/^[0-9]$/.test(e.key)){ // "1" then "2" = channel 12; waits a moment for a second digit
    digits+=e.key; clearTimeout(digitTimer); showDigits();
    if(digits.length>=2||+digits*10>CHANNELS[CHANNELS.length-1].n){tuneNumber(+digits);digits=""}
    else digitTimer=setTimeout(()=>{tuneNumber(+digits);digits=""},900);
  }
  else if(e.key==="m"||e.key==="M") toggleSound();
  else if(e.key==="f"||e.key==="F") toggleFullscreen();
  else if(e.key==="r"||e.key==="R"){setRetro(!retro); if(retro) track("retro-on","Retro mode on")}
  else if(e.key==="c"||e.key==="C") setList(!listHidden);
  else if(e.key==="s"||e.key==="S") toggleSubs();
  else if(e.key==="Escape"&&$("room").classList.contains("pseudo-fs")) toggleFullscreen();
});

/* ---------- Intro static: covers the blank screen while a channel tunes in or buffers ---------- */
const noise=$("noise"), nctx=noise.getContext("2d"), nimg=nctx.createImageData(noise.width,noise.height);
const stillNoise=matchMedia("(prefers-reduced-motion: reduce)").matches;
let staticOn=false, staticSince=0, staticRAF=0;
function drawNoise(){
  if(staticOn&&!stillNoise) staticRAF=requestAnimationFrame(drawNoise);
  const d=nimg.data; for(let i=0;i<d.length;i+=4){const v=60+Math.random()*195|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}
  nctx.putImageData(nimg,0,0);
}
function showStatic(){staticSince=Date.now(); if(staticOn)return; staticOn=true; $("static").hidden=false;
  const id=$("ident"); id.style.animation="none"; void id.offsetWidth; id.style.animation=""; drawNoise()}
function hideStatic(){ // keep it up at least 1.2s so the logo finishes resolving
  const wait=Math.max(0,1200-(Date.now()-staticSince));
  setTimeout(()=>{if(!staticOn||Date.now()-staticSince<1200)return; staticOn=false; cancelAnimationFrame(staticRAF); $("static").hidden=true},wait)}

/* ---------- Player: YouTube IFrame API when hosted; link-out card when embedding is blocked ---------- */
let MODE="loading", player=null, playingKey=null, playingId=null, ended=false, muted=true, skips=0, bufTimer=0;
const slotKey=(ch,s)=>s.live?ch.key+s.v.id:ch.key+s.start+s.v.id; // a live stream keeps playing across hour blocks
function loadYT(){
  const s=document.createElement("script"); s.src="https://www.youtube.com/iframe_api";
  s.onerror=()=>fallback(); document.head.appendChild(s);
  setTimeout(()=>{if(MODE==="loading")fallback()},8000);
}
window.onYouTubeIframeAPIReady=()=>{
  // Also runs if the API arrives after the timeout: the player takes over from the link-out card
  const s=slotAt(CHANNELS[cur],Date.now()), firstKey=slotKey(CHANNELS[cur],s);
  player=new YT.Player("yt",{videoId:s.v.id,playerVars:{autoplay:1,mute:1,controls:0,rel:0,playsinline:1,disablekb:1,iv_load_policy:3,...(s.live?{}:{start:Math.floor((Date.now()-s.start)/1000)})},
    events:{onReady:()=>{MODE="yt"; if(muted&&primed&&!started){player.setVolume(0);player.unMute()} // sound allowed: open it silently, it fades up after the ident
              else {player.setVolume(vol);muted?player.mute():player.unMute()}
              player.playVideo();if(!muted)checkSound();$("sound").hidden=false;
              playingKey=firstKey;tick(); // reloads only if the programme changed while loading
              $("modeNote").innerHTML="Playing live from YouTube. Every viewer is on the same moment of the same programme."},
            onStateChange:e=>{const S=YT.PlayerState;
              clearTimeout(bufTimer);
              if(e.data===S.PLAYING){hideStatic(); applySubs(); videoUp=true; openIris()}
              else if(e.data===S.BUFFERING&&started) bufTimer=setTimeout(showStatic,800); // a brief stall shows no static; the ident covers loading
              else if(e.data===S.ENDED){if(slotAt(CHANNELS[cur],Date.now()).live) skip(); else {ended=true;hideStatic();showCard()}}},
            onError:e=>skip(e.data)}});
};
// A video or stream that won't play is dropped from this browser's schedule and the next one starts.
// After many failures in one visit something bigger is wrong (blocker, network), so stop and say so.
function skip(code){
  track("play-error-"+(code||"ended"),"Video failed to play"+(code?" (YouTube "+code+")":""));
  if(++skips>15){track("blocked","Videos not playing at all");ended=true;hideStatic();showCard("Videos aren't playing here"+(code?" (YouTube error "+code+")":"")+". An ad blocker or privacy setting may be stopping YouTube.");return}
  if(playingId) markBad(playingId); playingKey=null; tick(); renderGuide();
}
function fallback(){
  MODE="fallback"; hideStatic(); playingKey=null; tick(); videoUp=true; openIris();
  $("modeNote").innerHTML="<strong>Preview mode.</strong> This viewer blocks embedded YouTube, so the screen shows what is on air with a link that opens YouTube at the exact live moment. Host this same file on your own site and the screen plays the video itself.";
}
function toggleSound(){if(MODE!=="yt"||!player)return;soundTapped=true;muted=!muted;muted?player.mute():player.unMute();
  $("sound").textContent=muted?"Turn sound on":"Mute"; knobs()}
/* Opening ident plays through by itself: OGTV forms, the bloom sounds as the iris opens, then the channel plays and
   its sound fades in. Browsers allow sound only once the visitor has done something (or has used the site before):
   a tap, click or key at any point in the ident lets it in, without skipping; with none the ident is silent and
   the channel starts muted until the first tap or key. */
let started=false, soundTapped=false, primed=false, introTimer=0, bloomTimer=0;
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches;
function start(done){if(started)return; started=true; clearTimeout(introTimer); track("start","Opened");
  countChannel(); const el=$("start"); if(done===true) el.hidden=true; else {el.classList.add("out"); setTimeout(()=>el.hidden=true,400); bloom()}
  if(MODE==="yt"&&!videoUp) showStatic(); // still tuning in: static until the picture comes
  if(!soundTapped) soundIn()}
function soundIn(){if(!primed)return; // not allowed yet: unmuting would make the browser pause the video; the first tap turns it on
  if(MODE==="yt"&&player) player.setVolume(0); setSound(true); if(MODE!=="yt"||!player)return; let v=0; // fade up to the viewer's level
  const fade=setInterval(()=>{v=Math.min(vol,v+vol/10); player.setVolume(v); if(v>=vol)clearInterval(fade)},80)}
// The iris opens onto the channel already playing. Timing follows the animation itself (it can start before this
// script runs): 1.25 s after the V of OGTV settles the logo is complete; if the picture isn't up by then the ident
// holds there (rings still turning) until it is, up to 6 s more. Then the iris opens, the bloom sounds with it,
// and the ident hands over as it finishes.
let videoUp=false, logoDone=false, capped=false, opened=false;
function runIdent(){
  if(REDUCED){introTimer=setTimeout(()=>start(true),1900); bloomTimer=setTimeout(bloom,1300); return}
  let formed=false; const formedNow=()=>{if(formed)return; formed=true; setTimeout(()=>{logoDone=true; openIris()},1250); setTimeout(()=>{capped=true; openIris()},7250)};
  document.querySelector(".start .logo-word i:nth-child(3)").addEventListener("animationend",formedNow,{once:true});
  setTimeout(formedNow,6000)} // in case the animation never reports (a hidden tab)
function openIris(){if(opened||started||!logoDone||!(videoUp||capped))return; opened=true;
  $("start").classList.add("open"); bloomTimer=setTimeout(bloom,100); introTimer=setTimeout(()=>start(true),1700)}
/* Ident sound, made with Web Audio (no files): as the iris opens, a warm D major add-9 chord blooms with a high
   glint and a hall tail. A context made now tells us whether sound is allowed yet ("running"). */
const AC=window.AudioContext||window.webkitAudioContext;
let bloomed=false, identAc=null; try{identAc=AC?new AC():null}catch(e){}
primed=!!identAc&&identAc.state==="running"; // sound allowed: the channel opens silently and fades up after the ident
function unlock(){if(started||!identAc)return; primed=true; identAc.resume().catch(()=>{}); // a gesture during the ident
  if(MODE==="yt"&&player){player.setVolume(0); player.unMute()}} // allowed now; fades up after the ident
["pointerup","click","keydown"].forEach(ev=>addEventListener(ev,unlock,true)); // (taps count on release)
runIdent();
function identOut(ac,vol){ // a limiter so nothing clips, a level, and a hall send
  const sr=ac.sampleRate, lim=ac.createDynamicsCompressor(); lim.threshold.value=-10; lim.ratio.value=12; lim.attack.value=0.002; lim.release.value=0.2; lim.connect(ac.destination);
  const out=ac.createGain(); out.gain.value=vol; out.connect(lim);
  const verb=ac.createConvolver(), ir=ac.createBuffer(2,sr*2.2,sr); // decaying stereo noise as the impulse
  for(let c=0;c<2;c++){const d=ir.getChannelData(c); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,4)}
  verb.buffer=ir; const wet=ac.createGain(); wet.gain.value=0.3; verb.connect(wet); wet.connect(out); return {out,verb};
}
function bloom(){
  clearTimeout(bloomTimer); if(bloomed||!AC)return; bloomed=true;
  try{const ac=identAc&&identAc.state!=="closed"?identAc:new AC();
    const asked=performance.now(); // allowed only later (a tap after the iris) is too late for it
    ac.resume().then(()=>{if(ac.state!=="running"||performance.now()-asked>1500){ac.close();return} bloomNotes(ac,ac.currentTime+0.03); setTimeout(()=>ac.close(),5000)}).catch(()=>{})}catch(e){}
}
function bloomNotes(ac,t){
  const {out,verb}=identOut(ac,0.4), lp=ac.createBiquadFilter(), pad=ac.createGain(); lp.type="lowpass"; lp.Q.value=0.8;
  lp.frequency.setValueAtTime(250,t); lp.frequency.exponentialRampToValueAtTime(3200,t+0.6); lp.frequency.exponentialRampToValueAtTime(900,t+2.4);
  pad.gain.value=0.0001; pad.gain.setValueAtTime(0.0001,t); pad.gain.exponentialRampToValueAtTime(0.16,t+0.35); pad.gain.setTargetAtTime(0.0001,t+1.2,0.45);
  lp.connect(pad); pad.connect(out); pad.connect(verb);
  [146.83,185,220,329.63,440].forEach(f=>[-7,7].forEach(c=>{ // D3 F#3 A3 E4 A4, each as two detuned saws
    const o=ac.createOscillator(); o.type="sawtooth"; o.frequency.value=f; o.detune.value=c; o.connect(lp); o.start(t); o.stop(t+3)}));
  [1174.66,1760].forEach((f,i)=>{const o=ac.createOscillator(), g=ac.createGain(), at=t+0.15+i*0.08; o.frequency.value=f; // glint: D6, A6
    g.gain.value=0.0001; g.gain.setValueAtTime(0.0001,at); g.gain.exponentialRampToValueAtTime(0.05,at+0.25); g.gain.exponentialRampToValueAtTime(0.0001,at+1.85);
    o.connect(g); g.connect(out); g.connect(verb); o.start(t); o.stop(t+2.2)});
}
function setSound(on){muted=!on; $("sound").textContent=muted?"Turn sound on":"Mute"; knobs(); if(MODE!=="yt"||!player)return;
  if(muted){player.mute();return} player.unMute(); player.playVideo(); checkSound()}
function checkSound(){ // refused (muted again or paused by the browser): carry on muted, picture first
  setTimeout(()=>{if(MODE!=="yt"||!player||muted)return; const st=player.getPlayerState();
    if(player.isMuted()||st===YT.PlayerState.PAUSED||st===YT.PlayerState.UNSTARTED){muted=true; player.mute(); player.playVideo(); $("sound").textContent="Turn sound on"; knobs()}},900)}
// Sound refused after the ident: the first tap or key turns it on (during the ident, the ident handles it)
["pointerdown","keydown"].forEach(ev=>addEventListener(ev,()=>{if(!started||soundTapped)return; soundTapped=true; if(muted) setSound(true)},true));
$("sound").addEventListener("click",toggleSound);
/* Full screen the TV (with its overlays). iPhone Safari can't fullscreen an element, so the screen fills the window instead. */
// In retro mode full screen shows the whole TV set, which works just as it does in the page; otherwise the screen alone
// Full screen always takes the whole TV area ("room"). In retro mode it shows the TV set; otherwise the bare
// screen fills it (as .pseudo-fs) with the channel strip and banner. Turning retro on or off while full
// screen just swaps the two looks. Without element full screen (iPhone) the room fills the window instead.
function toggleFullscreen(){
  const room=$("room"), fsEl=document.fullscreenElement||document.webkitFullscreenElement;
  if(fsEl){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
  if(room.classList.contains("pseudo-fs")){room.classList.remove("pseudo-fs"); onFullscreenChange(); return}
  const req=room.requestFullscreen||room.webkitRequestFullscreen;
  if(req){const r=req.call(room);
    if(r&&r.then) r.then(()=>screen.orientation&&screen.orientation.lock&&screen.orientation.lock("landscape").catch(()=>{})).catch(()=>{})} // phones: turn to landscape where allowed
  else {room.classList.add("pseudo-fs"); onFullscreenChange()}
  track("fullscreen","Full screen");
}
$("fs").addEventListener("click",toggleFullscreen);
$("maximize").addEventListener("click",toggleFullscreen);

/* ---------- Full-screen TV mode ----------
   Banner on every channel change; a strip of all channels (mouse near the bottom, tap, or left/right; Enter tunes);
   controls and cursor fade after a few idle seconds. */
const isFull=()=>$("screen").classList.contains("pseudo-fs"); // the plain full-screen look (strip, banner, digits)
const roomFull=()=>(document.fullscreenElement||document.webkitFullscreenElement)===$("room")||$("room").classList.contains("pseudo-fs"); // full screen in either look
const ESC={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}, esc=t=>String(t).replace(/[&<>"]/g,c=>ESC[c]);
let browse=cur, uiTimer=0, bannerTimer=0, digitsTimer=0;
function wakeUI(strip){
  if(!isFull())return; const sc=$("screen");
  sc.classList.remove("fs-idle"); if(strip&&!sc.classList.contains("strip-on")){sc.classList.add("strip-on"); renderStrip(false)}
  clearTimeout(uiTimer);
  uiTimer=setTimeout(()=>{sc.classList.remove("strip-on"); if(isFull()) sc.classList.add("fs-idle"); browse=cur},sc.classList.contains("strip-on")?7000:3000);
}
// The strip is an endless loop: three copies of the channel row side by side. The focused card is always
// the copy nearest the middle of the view, so moving past the last channel carries on into the next copy's channel 1 in
// the same direction (and left of 1 into the last). Once the strip is still, the view jumps by one copy to keep
// its middle inside the middle copy (same picture), so there is always more strip on both sides.
let settleTimer=0, stripMoving=false; // stripMoving: the strip is gliding to a card; the loop handler waits
const stripCard=(copy,i)=>$("strip").querySelector(`.sc[data-copy="${copy}"][data-i="${i}"]`);
const copyWidth=()=>{const a=stripCard(0,0), b=stripCard(1,0); return a&&b?b.offsetLeft-a.offsetLeft:0};
const stripMid=()=>{const st=$("strip"), a=stripCard(0,0); // middle of the view, measured from copy 0's first card
  return a?st.scrollLeft+st.clientWidth/2-(a.getBoundingClientRect().left-st.getBoundingClientRect().left+st.scrollLeft):0};
function renderStrip(smooth=true){
  const now=Date.now(), strip=$("strip"), mid=stripMid(), w=copyWidth();
  const row=copy=>CHANNELS.map((c,i)=>{const s=slotAt(c,now), pct=s.live?100:Math.round((now-s.start)/(s.end-s.start)*100);
    const head=c.group&&c.group!==(CHANNELS[i-1]||{}).group?`<span class="sc-group" aria-hidden="true">${c.group}</span>`:"";
    return `${head}<button class="sc${i===cur?" on":""}${i===browse?" focus":""}" role="listitem" data-copy="${copy}" data-i="${i}" aria-label="${c.n} ${esc(c.name)}: ${esc(onAir(s))}"${copy!==1?' tabindex="-1" aria-hidden="true"':""}>
      <span class="sc-n">${c.n}</span><span class="sc-name">${esc(c.name)}</span><span class="sc-now">${s.live?LIVEDOT:""}${esc(s.v.t)}</span>
      <span class="sc-bar"><i style="width:${pct}%"></i></span></button>`}).join("");
  strip.innerHTML=row(0)+row(1)+row(2);
  // the copy of the focused channel closest to where the view is now
  let copy=1; if(w){const x=stripCard(1,browse).offsetLeft-stripCard(0,0).offsetLeft;
    copy=[0,1,2].reduce((b,k)=>Math.abs(x+(k-1)*w-mid)<Math.abs(x+(b-1)*w-mid)?k:b,1)}
  const f=stripCard(copy,browse); stripMoving=true;
  if(f) f.scrollIntoView({inline:"center",block:"nearest",behavior:smooth?"smooth":"auto"});
  clearTimeout(settleTimer); settleTimer=setTimeout(()=>{stripMoving=false; settleStrip()},smooth?700:30);
}
function settleStrip(){ // keep the middle of the view inside the middle copy, without any visible change
  const strip=$("strip"), w=copyWidth(), mid=stripMid(); if(!w)return;
  if(mid<w) strip.scrollLeft+=w; else if(mid>=2*w) strip.scrollLeft-=w;
}
function showBanner(){
  if(!isFull())return;
  const c=CHANNELS[cur], now=Date.now(), s=slotAt(c,now), nx=s.live?null:slotAt(c,s.end);
  $("banner").innerHTML=`<span class="bn-n">${c.n}</span><div class="bn-body"><span class="bn-name">${esc(c.name)}<em>${esc(c.en)}</em></span>
    <span class="bn-title">${s.live?LIVEDOT:""}${esc(onAir(s))}</span>
    <span class="bn-meta">${s.live?"Live now":fmt(s.start)+" – "+fmt(s.end)}${nx?" · Next: "+esc(nx.v.t):""}</span></div>`;
  const sc=$("screen"); sc.classList.add("banner-on"); clearTimeout(bannerTimer);
  bannerTimer=setTimeout(()=>sc.classList.remove("banner-on"),4500);
}
function showDigits(){if(!isFull())return; const last=CHANNELS[CHANNELS.length-1].n;
  $("digits").textContent=digits+(digits.length<2&&+digits*10<=last?"_":""); $("screen").classList.add("digits-on");
  clearTimeout(digitsTimer); digitsTimer=setTimeout(clearDigits,1500)}
function clearDigits(){$("screen").classList.remove("digits-on")}
function fsKey(e){ // keys that only mean something in full screen
  const sc=$("screen");
  if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault(); const right=e.key==="ArrowRight";
    browse=(browse+(right?1:-1)+CHANNELS.length)%CHANNELS.length; wakeUI(true); renderStrip(); return true}
  if(e.key==="Enter"&&sc.classList.contains("strip-on")){e.preventDefault(); tune(browse); wakeUI(true); return true}
  wakeUI(false); return false;
}
$("strip").addEventListener("click",e=>{const b=e.target.closest(".sc"); if(b){tune(+b.dataset.i); wakeUI(true)}});
// Swiping or scrolling: when the view nears either end, shift it by one copy so the row never runs out
$("strip").addEventListener("scroll",()=>{if(!stripMoving) settleStrip()},{passive:true}); // same picture, one copy over
// Any sliding through the strip (scroll, swipe, wheel, touch, hover) keeps it open until 7 s after it stops
["mousemove","scroll","wheel","touchstart","touchmove","pointerdown"].forEach(ev=>$("strip").addEventListener(ev,()=>wakeUI(true),{passive:true}));
// Hover opens the strip only on moving INTO the bottom area, so a click that closed it isn't undone by the next jiggle
let inBottom=false;
$("fsCatch").addEventListener("mousemove",e=>{const r=$("screen").getBoundingClientRect(), now=e.clientY>r.top+r.height*.8;
  wakeUI(now&&!inBottom); inBottom=now});
function closeStrip(){const sc=$("screen"); sc.classList.remove("strip-on"); browse=cur; inBottom=true; wakeUI(false)}
$("fsCatch").addEventListener("click",()=>$("screen").classList.contains("strip-on")?closeStrip():wakeUI(true)); // tap the video: open, or close the strip
function onFullscreenChange(){const sc=$("screen"); $("keyFs").textContent=roomFull()?"Exit full screen":"Full screen";
  sc.classList.toggle("pseudo-fs",roomFull()&&!retro); // plain look: the bare screen fills the room
  if(!roomFull()) try{screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock()}catch(e){}
  if(isFull()){browse=cur; showBanner(); wakeUI(false)}
  else {clearTimeout(uiTimer); clearTimeout(bannerTimer); sc.classList.remove("strip-on","banner-on","fs-idle","digits-on")}} // back to normal view: controls stay put
document.addEventListener("fullscreenchange",onFullscreenChange);
document.addEventListener("webkitfullscreenchange",onFullscreenChange);
/* Retro camcorder look, remembered per browser */
let retro=false; try{localStorage.removeItem("ogtv-retro"); retro=sessionStorage.getItem("ogtv-retro")==="1"}catch(e){} // visits open in the plain look; retro on lasts for this tab only
function setRetro(on){retro=on; $("main-tv").classList.toggle("retro-on",on); $("screen").classList.toggle("retro",on); $("set").classList.toggle("on",on); knobs(); $("retro").setAttribute("aria-pressed",on); $("retroFs").setAttribute("aria-pressed",on);
  try{sessionStorage.setItem("ogtv-retro",on?"1":"0")}catch(e){} osd();
  if(roomFull()) onFullscreenChange()} // already full screen: stay full screen, in the other look
function osd(){if(!retro)return; const d=new Date(Date.now()+IST), p=n=>String(n).padStart(2,"0");
  $("osdTime").textContent=`${MONTHS[d.getUTCMonth()].toUpperCase()} ${p(d.getUTCDate())} ${d.getUTCFullYear()}
${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`}
// The TV set's knobs turn like real ones: drag round, scroll, or arrow keys when focused. Channel steps
// through the dial and tunes where you let go (a plain click is the next channel); volume sets the level
// 0–100 as you turn (a plain click is sound on or off). A green on-screen readout shows where you are.
const TAG_NAMES={coke:"Coke Studio",inst:"instrumental",vocal:"vocal",dd:"Doordarshan",mytho:"mythology",auto:"cars & bikes",explain:"explainers",
  india:"India",world:"world",deep:"deep dives",learn:"learning",review:"reviews",scenic:"scenic",walk:"walks",sports:"sports fitness",army:"army training",soviet:"Soviet-style training",kahani:"kahaniyan",kavi:"kavi sammelan",mushaira:"mushaira",sitcom:"family sitcoms",olympic:"the Games",kbc:"KBC",prime:"India's big moments",f1:"F1 & MotoGP",tennis:"tennis",fixtures:"international fixtures",more:"golf, cycling & swimming",workout:"workouts",yoga:"yoga",news:"news"}; // how a part's tag reads in "On air because"
let vol=70; try{const v=+localStorage.getItem("ogtv-vol"); if(v>0&&v<=100) vol=v}catch(e){}
const CH_STEP=360/CHANNELS.length, VOL_DEG=2.7, VOL_MIN=-135; // volume sweeps -135° (silent) to +135° (full)
let osdTimer=0;
function tvOsd(html){const o=$("tvOsd"); o.innerHTML=html; o.classList.add("on"); clearTimeout(osdTimer); osdTimer=setTimeout(()=>o.classList.remove("on"),1600)}
const osdChannel=i=>tvOsd(`<b>CH ${String(CHANNELS[i].n).padStart(2,"0")}</b> ${esc(CHANNELS[i].name.toUpperCase())}`);
const osdVolume=()=>tvOsd(`<b>VOLUME</b> <span class="vbars">${"<i></i>".repeat(Math.round((muted?0:vol)/5))}</span> ${muted?"MUTE":vol}`);
function knobs(){$("keyMute").setAttribute("aria-pressed",muted); $("keyMute").textContent=muted?"Sound":"Mute"; $("knobCh").style.setProperty("--rot",(cur*CH_STEP)+"deg"); $("knobVol").style.setProperty("--rot",(VOL_MIN+(muted?0:vol)*VOL_DEG)+"deg")}
function setVol(v){vol=Math.max(0,Math.min(100,Math.round(v))); try{localStorage.setItem("ogtv-vol",vol)}catch(e){}
  if(MODE==="yt"&&player) player.setVolume(vol);
  if(vol===0&&!muted) setSound(false); else if(vol>0&&muted) setSound(true); else knobs();
  osdVolume()}
// Drag a knob round its centre; onTurn gets the total degrees turned so far, onDone when let go. A press without turning is a click.
function turnable(el,{onTurn,onDone,onClick}){
  let start=null;
  const ang=e=>{const r=el.getBoundingClientRect(); return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI};
  el.addEventListener("pointerdown",e=>{e.preventDefault(); el.setPointerCapture(e.pointerId); start={a:ang(e),last:ang(e),turned:0,x:e.clientX,y:e.clientY,moved:false}; el.classList.add("turning")});
  el.addEventListener("pointermove",e=>{if(!start)return; const a=ang(e); let d=a-start.last; if(d>180)d-=360; if(d<-180)d+=360;
    start.last=a; start.turned+=d; if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>5) start.moved=true; if(start.moved) onTurn(start.turned)});
  const end=()=>{if(!start)return; const st=start; start=null; el.classList.remove("turning"); st.moved?onDone(st.turned):onClick()};
  el.addEventListener("pointerup",end); el.addEventListener("pointercancel",end);
}
let chPreview=0;
turnable($("knobCh"),{
  onTurn:d=>{$("knobCh").style.setProperty("--rot",(cur*CH_STEP+d)+"deg"); chPreview=(cur+Math.round(d/CH_STEP)+CHANNELS.length*10)%CHANNELS.length; osdChannel(chPreview)},
  onDone:()=>{chPreview!==cur?tune(chPreview):knobs()},
  onClick:()=>{if(!started) start(); tune(cur+1); osdChannel(cur)}});
let volAtStart=vol;
$("knobVol").addEventListener("pointerdown",()=>{volAtStart=muted?0:vol});
turnable($("knobVol"),{
  onTurn:d=>setVol(volAtStart+d/VOL_DEG),
  onDone:()=>{},
  onClick:()=>{if(!started) start(); if(muted&&vol===0) setVol(50); else {toggleSound(); osdVolume()}}});
$("knobCh").addEventListener("wheel",e=>{e.preventDefault(); tune(cur+(e.deltaY>0?1:-1)); osdChannel(cur)},{passive:false});
$("knobVol").addEventListener("wheel",e=>{e.preventDefault(); setVol((muted?0:vol)+(e.deltaY>0?-5:5))},{passive:false});
$("knobCh").addEventListener("keydown",e=>{const k=e.key; if(!/^Arrow/.test(k)) return; e.preventDefault(); e.stopPropagation();
  tune(cur+(k==="ArrowRight"||k==="ArrowUp"?1:-1)); osdChannel(cur)});
$("knobVol").addEventListener("keydown",e=>{const k=e.key; if(!/^Arrow/.test(k)) return; e.preventDefault(); e.stopPropagation();
  setVol((muted?0:vol)+(k==="ArrowRight"||k==="ArrowUp"?5:-5))});
$("retro").addEventListener("click",()=>{setRetro(!retro); if(retro) track("retro-on","Retro mode on")});
$("retroFs").addEventListener("click",()=>{setRetro(!retro); if(retro) track("retro-on","Retro mode on"); wakeUI(false)});
/* Hide the channel list on the right; the TV then takes the full width */
let listHidden=true; try{listHidden=localStorage.getItem("ogtv-list")!=="shown"}catch(e){} // hidden unless the viewer opened it
function setList(hide){listHidden=hide; $("remote").hidden=hide; $("showList").hidden=!hide;
  document.querySelector(".main").classList.toggle("list-hidden",hide);
  try{localStorage.setItem("ogtv-list",hide?"hidden":"shown")}catch(e){}}
$("hideList").addEventListener("click",()=>setList(true));
/* Subtitles: off unless the viewer turns them on (remembered); reapplied as each video starts */
let subs=false; try{localStorage.removeItem("ogtv-subs"); subs=localStorage.getItem("ogtv-cc")==="on"}catch(e){} // old key saved "on" for everyone
function applySubs(){if(MODE!=="yt"||!player)return;
  try{subs?player.loadModule("captions"):(player.setOption("captions","track",{}),player.unloadModule("captions"))}catch(e){}}
function setSubs(on){subs=on; $("cc").setAttribute("aria-pressed",on); $("keyCc").setAttribute("aria-pressed",on); $("cc").setAttribute("aria-label",on?"Subtitles on":"Subtitles off");
  applySubs()}
const toggleSubs=()=>{setSubs(!subs); try{localStorage.setItem("ogtv-cc",subs?"on":"off")}catch(e){} if(subs) track("subs-on","Subtitles on")};
$("cc").addEventListener("click",toggleSubs);
// The TV set's push keys: the same controls as the on-screen buttons, which step aside while the set is showing
$("keyCc").addEventListener("click",toggleSubs);
$("keyFs").addEventListener("click",toggleFullscreen);
$("home").addEventListener("click",()=>{if(retro) setRetro(false); if(!roomFull()) toggleFullscreen()}); // Home is the plain full screen (no TV set)
$("keyRetro").addEventListener("click",()=>setRetro(false)); // in full screen this swaps to the plain full-screen look
$("keyMute").addEventListener("click",()=>{if(!started) start(); if(MODE==="yt"&&player){toggleSound(); osdVolume()}});
setSubs(subs);
$("showList").addEventListener("click",()=>setList(false));
setList(listHidden);
setRetro(retro);
// The site opens straight into full screen (the plain look, or the TV set if retro is on for this tab): it fills
// the window at once, and the first tap or key makes it true full screen (browsers only allow that after the
// visitor does something). Exit full screen leaves it.
function autoFull(){
  if(roomFull()) return; const room=$("room"); room.classList.add("pseudo-fs"); onFullscreenChange();
  const up=e=>{removeEventListener("click",up,true); removeEventListener("keydown",up,true);
    if(!room.classList.contains("pseudo-fs")||(e.target.closest&&e.target.closest("#keyFs,#keyRetro,#fs,#home"))||e.key==="Escape") return;
    const req=room.requestFullscreen||room.webkitRequestFullscreen; if(!req) return;
    const r=req.call(room);
    if(r&&r.then) r.then(()=>{room.classList.remove("pseudo-fs"); if(screen.orientation&&screen.orientation.lock) screen.orientation.lock("landscape").catch(()=>{})}).catch(()=>{})};
  addEventListener("click",up,true); addEventListener("keydown",up,true);
}
autoFull();
$("screen").addEventListener("dblclick",toggleFullscreen);

function showCard(msg){
  const now=Date.now(), ch=CHANNELS[cur], s=slotAt(ch,now), nx=slotAt(ch,s.end);
  const off=Math.floor((now-s.start)/1000);
  const card=$("card"); card.hidden=false;
  if(MODE==="yt"){ // interstitial between programmes
    card.innerHTML=`<span class="kicker">${msg?"Programme unavailable":"Coming up next"}</span>
      <h2>${onAir(nx)}</h2><p>${msg||catLabel(nx.v.cat)+" · "+LANG_LABEL[nx.v.lang]+" · starts at "+fmt(nx.start)}</p>
      <span class="count" id="count"></span>`;
  }else{
    card.innerHTML=`<span class="kicker">On air now · ${catLabel(s.v.cat)} · ${LANG_LABEL[s.v.lang]}</span>
      <h2>${s.v.t}</h2><p>${s.v.src}. Started at ${fmt(s.start)}, ends at ${fmt(s.end)}.</p>
      <a class="watch" id="watch" href="https://www.youtube.com/watch?v=${s.v.id}&t=${off}s" target="_blank" rel="noopener">Watch from this moment on YouTube</a>`;
  }
}

function tick(){
  const now=Date.now(), ch=CHANNELS[cur], s=slotAt(ch,now), nx=slotAt(ch,s.end);
  const key=slotKey(ch,s);
  $("clock").innerHTML=fmt(now)+"<small>IST</small>"; osd();
  $("chanbug").textContent=ch.n+" · "+ch.name;
  if(key!==playingKey){
    playingKey=key; playingId=s.v.id; ended=false;
    const off=Math.floor((now-s.start)/1000);
    if(MODE==="yt"&&player){$("card").hidden=true;if(started)showStatic(); // the ident covers the first tune-in
      player.loadVideoById(s.live?{videoId:s.v.id}:{videoId:s.v.id,startSeconds:off});if(muted)player.mute()}
    else if(MODE==="fallback") showCard();
    $("nowTitle").textContent=onAir(s);
    const hh=h=>String(h%24).padStart(2,"0")+":00";
    const hours=s.part.from===0&&s.part.to===24?"":`: ${hh(s.part.from)}–${hh(s.part.to)}`; // all-day blocks need no hours
    $("why").innerHTML=`<span>On air because</span><span class="chip">${s.part.label}${hours}</span>`
      +(s.live?"":`<span class="chip">${catLabel(s.part.cat)}${s.part.tag?" · "+(TAG_NAMES[s.part.tag]||s.part.tag):""}${s.part.maxMin?" · under "+s.part.maxMin+" min":""}</span>`)
      +(ch.live&&!s.live?`<span class="chip">Nothing live right now</span>`:"");
    if(ch.live&&!s.live&&started) track("live-none-"+ch.live,ch.name+": nothing live");
    $("next").innerHTML=s.live?`Live from <b>${s.v.src}</b>`:`Next at <b>${fmt(nx.start)}</b>: ${onAir(nx)}`;
    renderChannels();
  }
  $("nowTime").textContent=s.live?`LIVE · ${LANG_LABEL[s.v.lang]}`:`${fmt(s.start)} – ${fmt(s.end)} · ${LANG_LABEL[s.v.lang]}`;
  $("nowBar").style.width=s.live?"100%":((now-s.start)/(s.end-s.start)*100).toFixed(1)+"%";
  if(MODE==="yt"&&ended){const c=$("count");if(c){const r=Math.ceil((s.end-now)/1000);c.textContent=Math.floor(r/60)+":"+String(r%60).padStart(2,"0")}}
  if(MODE==="fallback"){const w=$("watch");if(w)w.href=`https://www.youtube.com/watch?v=${s.v.id}&t=${Math.floor((now-s.start)/1000)}s`}
}

// About section numbers come from the data, so they stay right as channels and creators change
$("aboutChannels").textContent=CHANNELS.length;
$("aboutCreators").textContent=new Set(CATALOG.map(v=>v.src)).size;
renderChannels(); renderGuide(); tick(); loadYT();
setInterval(tick,1000);
// Watch-time milestones while the page is visible: how long people stay
let watchedSec=0; const MILESTONES={300:"5m",900:"15m",1800:"30m",3600:"60m",7200:"2h"};
setInterval(()=>{if(!started||document.hidden)return; watchedSec+=15; const m=MILESTONES[watchedSec]; if(m) track("watch-"+m,"Watched "+m)},15e3);
setInterval(renderGuide,60e3);
setTimeout(()=>{const g=document.querySelector(".gscroll");if(g)g.scrollLeft=0},0);
