/* ---------- UI ---------- */
const $=id=>document.getElementById(id);
// Titles, creator names and labels come from YouTube and fan playlists: escape them wherever they go into HTML
const ESC={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}, esc=t=>String(t??"").replace(/[&<>"']/g,c=>ESC[c]);
// Inside the OGTV TV app (Android TV, Fire TV): the app passes ?app=tv and tags its user agent. Sound needs no tap
// there, the app is already full screen, and the remote reaches the page through window.ogtv (end of this file).
const TV_APP=/[?&]app=tv\b/.test(location.search)||/OGTV-AndroidTV/.test(navigator.userAgent);
if(TV_APP) document.documentElement.classList.add("tv-app");
let cur=Math.max(0,CHANNELS.findIndex(c=>c.key==="classics")); // every visit opens on Cricket Classics
{const m=document.querySelector('meta[name="ogtv-ch"]'), n=+new URLSearchParams(location.search).get("ch")||+(m&&m.content), i=CHANNELS.findIndex(c=>c.n===n); if(i>=0)cur=i} // ?ch=8, or a /tv/<channel>/ page, opens that channel
const isNew=v=>v.pub&&tvNow()-Date.parse(v.pub)<30*DAY; // uploaded in the last 30 days
const NEW='<i class="new" title="Uploaded in the last 30 days">NEW</i>', LIVEDOT='<i class="livedot">LIVE</i>';
const badge=s=>s.live?LIVEDOT:isNew(s.v)?NEW:"";
const onAir=s=>s.live?s.v.src+": "+s.v.t:s.v.t;

function renderChannels(){
  const now=tvNow();
  $("chlist").innerHTML=CHANNELS.map((c,i)=>{const s=slotAt(c,now), head=c.group&&c.group!==(CHANNELS[i-1]||{}).group?`<h5 class="ch-group">${esc(c.group)}</h5>`:"";
    return `${head}<button class="ch" id="ch-${c.key}" data-i="${i}" aria-current="${i===cur}">
      <span class="num">${c.n}</span>
      <span style="min-width:0"><span class="nm"><strong>${esc(c.name)}</strong><em>${esc(c.en)}</em></span>
      <span class="on">${badge(s)}${esc(onAir(s))}</span></span></button>`}).join("");
}
$("chlist").addEventListener("click",e=>{const b=e.target.closest(".ch");if(b)tune(+b.dataset.i)});

function renderGuide(){
  const now=tvNow(), a=Math.floor(now/(30*MIN))*30*MIN, b=a+3*HOUR, g=document.querySelector(".gscroll");
  const PX=Math.max(300,(g&&g.clientWidth||960)-36-120)/60; // one hour fills the visible guide; the rest of the 3 hours scrolls
  const W=(b-a)/MIN*PX;
  let ticks="";for(let t=a;t<=b;t+=30*MIN) ticks+=`<span class="tick" style="left:${(t-a)/MIN*PX}px">${fmt(t)}</span>`;
  let rows=`<div class="trow" style="width:${W}px">${ticks}</div>`;
  CHANNELS.forEach((c,i)=>{
    const lane=slotsBetween(c,a,b).map(s=>{const x=Math.max(s.start,a),y=Math.min(s.end,b);
      const on=now>=s.start&&now<s.end;
      return `<button class="prog${on?' nowp':''}" data-i="${i}" style="left:${(x-a)/MIN*PX+1}px;width:${(y-x)/MIN*PX-3}px" title="${esc(onAir(s))}">
        <b>${badge(s)}${esc(onAir(s))}</b><small>${fmt(s.start)}</small></button>`}).join("");
    rows+=`<div class="grow${i===cur?" gcur":""}"${i===cur?' aria-current="true"':""}><div class="glabel">${c.n} ${esc(c.name)}</div><div class="glane" style="width:${W}px">${lane}</div></div>`;
  });
  rows+=`<div class="nowline" style="left:${18+120+(now-a)/MIN*PX}px"></div>`;
  $("grid").innerHTML=rows;
}
// The guide marks the channel you're on; tuning moves the mark without redrawing the guide
function markGuide(){document.querySelectorAll("#grid .grow").forEach((r,k)=>{r.classList.toggle("gcur",k===cur); k===cur?r.setAttribute("aria-current","true"):r.removeAttribute("aria-current")})}
$("grid").addEventListener("click",e=>{const b=e.target.closest(".prog");if(b)tune(+b.dataset.i)});
let guideW=0, guideT=0; // keep one hour to a screen as the window changes
addEventListener("resize",()=>{clearTimeout(guideT); guideT=setTimeout(()=>{const g=document.querySelector(".gscroll"); if(g&&g.clientWidth!==guideW){guideW=g.clientWidth; renderGuide()}},150)});

// A channel counts as watched after 10 s on it, so flicking past doesn't inflate it
let watchTimer=0;
function countChannel(){clearTimeout(watchTimer); const c=CHANNELS[cur];
  watchTimer=setTimeout(()=>track("ch-"+String(c.n).padStart(2,"0")+"-"+c.key,c.n+" · "+c.name),10e3)}
function tune(i){cur=(i+CHANNELS.length)%CHANNELS.length;
  countChannel(); browse=cur; clearDigits(); markGuide();
  try{const q=new URLSearchParams(location.search); q.set("ch",CHANNELS[cur].n); history.replaceState(null,"","?"+q)}catch(e){}
  playingKey=null; renderChannels(); tick(); showBanner(); if($("screen").classList.contains("strip-on")) renderStrip(); knobs(); vfd();}
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
function showStatic(){staticSince=Date.now(); if(staticOn)return; staticOn=true; $("static").hidden=false; staticSound.start();
  const id=$("ident"); id.style.animation="none"; void id.offsetWidth; id.style.animation=""; drawNoise()}
function hideStatic(){ // keep it up at least 1.2s so the logo finishes resolving
  const wait=Math.max(0,1200-(Date.now()-staticSince));
  setTimeout(()=>{if(!staticOn||Date.now()-staticSince<1200)return; staticOn=false; cancelAnimationFrame(staticRAF); $("static").hidden=true; staticSound.stop()},wait)}

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
  const s=slotAt(CHANNELS[cur],tvNow()), firstKey=slotKey(CHANNELS[cur],s);
  player=new YT.Player("yt",{videoId:s.v.id,playerVars:{autoplay:1,mute:1,controls:0,rel:0,playsinline:1,disablekb:1,iv_load_policy:3,...(s.live?{}:{start:Math.floor((tvNow()-s.start)/1000)})},
    events:{onReady:()=>{MODE="yt"; if(muted&&primed&&!started){player.setVolume(0);player.unMute()} // sound allowed: open it silently, it fades up after the ident
              else {player.setVolume(vol);muted?player.mute():player.unMute()}
              player.playVideo();if(!muted)checkSound();$("sound").hidden=false;
              playingKey=firstKey;tick(); // reloads only if the programme changed while loading
              $("modeNote").innerHTML="Playing live from YouTube. Every viewer is on the same moment of the same programme."},
            onStateChange:e=>{const S=YT.PlayerState;
              clearTimeout(bufTimer); clearTimeout(stallTimer);
              if(e.data===S.PLAYING){hideStatic(); applySubs(); videoUp=true; openIris(); fadeCard(); keepAwake(true); skips=0; retries=0}
              else if(e.data===S.BUFFERING){if(started&&!handing) bufTimer=setTimeout(showStatic,800); // a brief stall shows no static; the ident covers loading
                stallTimer=setTimeout(()=>skip("stall"),25e3)} // stuck loading (a weak or dropped connection): try again
              else if(e.data===S.PAUSED) keepAwake(false);
              else if(e.data===S.ENDED){if(slotAt(CHANNELS[cur],tvNow()).live) skip(); else {ended=true;hideStatic();showCard();keepAwake(false)}}},
            onError:e=>skip(e.data)}});
};
// While a channel is playing the screen stays on (Screen Wake Lock), so a phone or laptop doesn't dim and lock
// mid-programme; it is let go when playback stops. Browsers drop the lock when the tab is hidden, so it is
// taken again on return. Browsers without Wake Lock simply behave as before.
let wakeLock=null, wantAwake=false;
async function keepAwake(on){wantAwake=on;
  try{if(on&&!wakeLock&&navigator.wakeLock&&document.visibilityState==="visible"){wakeLock=await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release",()=>{wakeLock=null})}
      else if(!on&&wakeLock){const l=wakeLock; wakeLock=null; await l.release()}}catch(e){wakeLock=null}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&wantAwake) keepAwake(true)});
// Why a video failed decides what happens next. Removed or not embeddable (YouTube 100, 101, 150): it is dropped
// from this browser's schedule and the next one starts. Anything else (a stall, a player hiccup) usually passes, so
// the same programme is tried again at the current moment after 5 s, 15 s and 60 s before it counts as broken.
// Offline, nothing is dropped: the programme picks up again when the connection is back.
const GONE=[100,101,150], RETRY=[5e3,15e3,60e3];
let retries=0, retryTimer=0, stallTimer=0;
const replay=()=>{clearTimeout(retryTimer); playingKey=null; tick()};
function skip(code){
  clearTimeout(retryTimer); clearTimeout(stallTimer);
  if(!navigator.onLine){showStatic(); return} // the "online" listener below takes over
  track("play-error-"+(code||"ended"),"Video failed to play"+(code?" ("+code+")":""));
  if(code&&!GONE.includes(code)&&retries<RETRY.length){showStatic(); retryTimer=setTimeout(replay,RETRY[retries++]); return}
  retries=0;
  // Many failures in a row: something bigger is wrong (a blocker, the network). Say so, and keep trying every minute
  if(++skips>15){track("blocked","Videos not playing at all");ended=true;hideStatic();showCard("Videos aren't playing here"+(code?" (YouTube error "+code+")":"")+". An ad blocker or privacy setting may be stopping YouTube. Trying again every minute.");
    skips=12; retryTimer=setTimeout(replay,60e3); return}
  if(playingId) markBad(playingId); playingKey=null; tick(); renderGuide();
}
addEventListener("online",()=>{retries=0; if(MODE==="yt"&&player) replay()});
function fallback(){
  MODE="fallback"; hideStatic(); playingKey=null; tick(); videoUp=true; openIris();
  $("modeNote").innerHTML="<strong>Preview mode.</strong> This viewer blocks embedded YouTube, so the screen shows what is on air with a link that opens YouTube at the exact live moment. Host this same file on your own site and the screen plays the video itself.";
}
function toggleSound(){if(MODE!=="yt"||!player)return;soundTapped=true;muted=!muted;muted?player.mute():player.unMute();
  $("sound").textContent=muted?"Turn sound on":"Mute"; knobs(); if(muted){interlude.stop(); staticSound.stop()}}
/* Opening ident plays through by itself: OGTV forms, the bloom sounds as the iris opens, then the channel plays and
   its sound fades in. Browsers allow sound only once the visitor has done something (or has used the site before):
   a tap, click or key at any point in the ident lets it in, without skipping; with none the ident is silent and
   the channel starts muted until the first tap or key. */
let started=false, soundTapped=false, primed=false, introTimer=0, bloomTimer=0;
const REDUCED=matchMedia("(prefers-reduced-motion: reduce)").matches;
function start(done){if(started)return; started=true; clearTimeout(introTimer); track("start","Opened");
  countChannel(); const el=$("start"); if(done===true) el.hidden=true; else {el.classList.add("out"); setTimeout(()=>el.hidden=true,400); bloom()}
  if(MODE==="yt"&&!videoUp) showStatic(); // still tuning in: static until the picture comes
  setTimeout(()=>(window.requestIdleCallback||setTimeout)(()=>interlude.warm()),3000); // the interlude's audio engine, made ahead of time
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
primed=TV_APP||!!identAc&&identAc.state==="running"; // sound allowed: the channel opens silently and fades up after the ident
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
/* ---------- Interlude: the OGTV jingle between programmes ----------
   While "Coming up next" is up, a 45 s piece grown from the intro bloom plays (the score below). It fades in, fades
   out when the next programme starts, keeps quiet when muted, follows the volume, comes round again after a short
   breath if the gap is long, and plays only where the browser allows sound. */
const interlude=(()=>{
  const hz=m=>440*Math.pow(2,(m-69)/12);
  /* OGTV Interlude, D major, 85⅓ BPM. A 16-bar score: bars 1–2 are the intro bloom; a felt-piano theme (A F# E D, the
     glint's notes walking home) over pads moving Dadd9 Bm11 Gmaj9 Asus2 | Dadd9 F#m7 Gmaj9 A6sus, an arpeggio bed,
     ping-pong echo and a sub. Hans Zimmer colours carry it: a low drone, a soft ticking clock, a low-string ostinato
     swelling into a riser, one deep braam with a boom at the lift and an organ glow; then it thins out and lands
     home on the bloom.
     It plays for exactly the length of the gap: the opening bloom first, the theme cycling as long as needed, and
     the settle and closing bloom placed so the music fades out as the next programme starts. A ~46 s gap plays the
     16 bars as written. Bars are scheduled a few seconds ahead, a few at a time, so nothing stalls the page. */
  const BEAT=60/(256/3), BAR=BEAT*4, SIX=BEAT/4;
  const CHORDS=[[0,2,[50,54,57,64,69],38],[2,2,[47,54,57,62,64],35],[4,2,[43,50,54,57,59],31],[6,2,[45,52,57,59,62],33],
    [8,2,[50,54,57,64,69],38],[10,2,[49,54,57,61,64],30],[12,2,[43,50,54,57,59],31],[14,1,[45,52,54,57,62],33],[15,1,[50,54,57,64,69],38]]; // [bar, bars, pad, bass]
  const THEME={2:[[0,69,.9],[1,66,.7],[2,64,.75],[4,62,.85],[8,66,.6],[10,64,.6],[11,62,.55],[12,59,.7]], // bar: [eighth, note, velocity]
    4:[[0,71,.85],[1,69,.65],[2,66,.7],[4,62,.8],[8,69,.6],[10,66,.6],[12,64,.65]],
    6:[[0,69,.85],[1,64,.6],[2,62,.65],[4,59,.75],[8,64,.6],[9,66,.6],[10,69,.7],[12,74,.8]],
    8:[[0,74,.9],[1,69,.7],[2,66,.7],[4,64,.75],[6,62,.6],[8,69,.65],[10,66,.6],[11,64,.55],[12,62,.7]],
    10:[[0,73,.85],[1,69,.65],[2,66,.65],[4,64,.75],[8,66,.6],[10,64,.55],[12,61,.65]],
    12:[[0,71,.75],[2,69,.6],[4,66,.6],[10,62,.55]], 14:[[0,69,.7],[2,66,.55],[4,64,.5]], 15:[[0,62,.7],[0,74,.35]]};
  const chordOf=b=>CHORDS.find(([s,n])=>b>=s&&b<s+n);
  const noiseBuf=ac=>{const b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b};
  // Which score bars to play, end to end, to fill sec seconds with the closing bloom starting about 4 s before the end
  function plan(sec){
    const L=Math.max(1,Math.floor((sec-4)/BAR)+1); if(L===1) return [0];
    const head=L>=3?[0,1]:[0], tail=L>=10?[12,13,14,15]:L>=4?[14,15]:[15], mid=[];
    while(head.length+mid.length+tail.length<L) mid.push(2+mid.length%10); // the theme cycles bars 3–12 of the score
    return [...head,...mid,...tail];
  }
  // One performance: builds the shared parts now and each bar on request. fadeEnd: fade to silence at the end of sec.
  function session(ac,t,sec,master,verb,fadeEnd,shared){
    const sr=ac.sampleRate, hum=()=>(Math.random()-.5)*0.016, vary=v=>v*(0.9+Math.random()*0.2), bars=plan(sec), END=t+sec;
    const noise=shared||noiseBuf(ac);
    const env=(g,at,peak,a,d)=>{g.gain.value=0.0001; g.gain.setValueAtTime(0.0001,at); g.gain.exponentialRampToValueAtTime(peak,at+a); g.gain.exponentialRampToValueAtTime(0.0001,at+a+d)};
    // ping-pong echo, dotted eighth, darkened each pass
    const echo=ac.createGain(), dl=ac.createDelay(), dr=ac.createDelay(), fb=ac.createGain(), tone=ac.createBiquadFilter(), pl=ac.createStereoPanner(), pr=ac.createStereoPanner();
    dl.delayTime.value=dr.delayTime.value=BEAT*0.75; fb.gain.value=0.32; tone.type="lowpass"; tone.frequency.value=2600; pl.pan.value=-0.6; pr.pan.value=0.6;
    echo.gain.value=0.28; echo.connect(dl); dl.connect(pl); pl.connect(master); dl.connect(dr); dr.connect(pr); pr.connect(master); dr.connect(tone); tone.connect(fb); fb.connect(dl);
    const verbSend=ac.createGain(); verbSend.gain.value=0.9; verbSend.connect(verb);
    const glint=(f,at,v)=>{const o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=f;
      g.gain.value=0.0001; g.gain.setValueAtTime(0.0001,at); g.gain.exponentialRampToValueAtTime(v,at+0.25); g.gain.exponentialRampToValueAtTime(0.0001,at+2.2);
      o.connect(g); g.connect(master); g.connect(verbSend); o.start(at); o.stop(at+2.4)};
    const bloomAt=(at,level)=>{ // the intro bloom
      const lp=ac.createBiquadFilter(), pad=ac.createGain(); lp.type="lowpass"; lp.Q.value=0.8;
      lp.frequency.setValueAtTime(250,at); lp.frequency.exponentialRampToValueAtTime(3200,at+0.6); lp.frequency.exponentialRampToValueAtTime(900,at+2.4);
      pad.gain.value=0.0001; pad.gain.setValueAtTime(0.0001,at); pad.gain.exponentialRampToValueAtTime(0.16*level,at+0.35); pad.gain.setTargetAtTime(0.0001,at+1.2,0.6);
      lp.connect(pad); pad.connect(master); pad.connect(verb);
      [146.83,185,220,329.63,440].forEach(f=>[-7,7].forEach(c=>{const o=ac.createOscillator(); o.type="sawtooth"; o.frequency.value=f; o.detune.value=c; o.connect(lp); o.start(at); o.stop(at+4)}));
      [1174.66,1760].forEach((f,i)=>glint(f,at+0.15+i*0.08,0.05*level))};
    const padAt=(notes,at,dur)=>{ // warm detuned-saw pad, breathing filter, long release into the next chord
      const lp=ac.createBiquadFilter(), g=ac.createGain(); lp.type="lowpass"; lp.Q.value=0.7;
      lp.frequency.setValueAtTime(450,at); lp.frequency.linearRampToValueAtTime(1500,at+dur*0.5); lp.frequency.linearRampToValueAtTime(850,at+dur);
      g.gain.value=0; g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(0.05,at+1.4); g.gain.setTargetAtTime(0,at+dur,0.6);
      lp.connect(g); g.connect(master); g.connect(verb);
      notes.forEach(m=>[-6,6].forEach(c=>{const o=ac.createOscillator(); o.type="sawtooth"; o.frequency.value=hz(m); o.detune.value=c; o.connect(lp); o.start(at); o.stop(at+dur+3)}))};
    const key=(m,at,vel,pan,send,bright)=>{ // felt piano: soft sine body, a little chorus, a brief felt attack and hammer
      const f=hz(m), g=ac.createGain(), lp=ac.createBiquadFilter(), p=ac.createStereoPanner(), dec=Math.max(1.4,3.4-(m-55)*0.08);
      lp.type="lowpass"; lp.frequency.value=Math.min(6000,f*4.5)*bright; p.pan.value=pan;
      g.gain.value=0.0001; g.gain.setValueAtTime(0.0001,at); g.gain.exponentialRampToValueAtTime(vel*0.2,at+0.006);
      g.gain.exponentialRampToValueAtTime(vel*0.07,at+0.3); g.gain.exponentialRampToValueAtTime(0.0001,at+dec);
      [[f,"sine",1,0],[f,"sine",0.5,5],[f*2,"triangle",0.12,0]].forEach(([fr,type,lev,det])=>{const o=ac.createOscillator(), og=ac.createGain();
        o.type=type; o.frequency.value=fr; o.detune.value=det; og.gain.value=lev; if(type==="triangle"){og.gain.setValueAtTime(lev,at); og.gain.exponentialRampToValueAtTime(0.001,at+0.18)}
        o.connect(og); og.connect(g); o.start(at); o.stop(at+dec+0.1)});
      const h=ac.createBufferSource(), hl=ac.createBiquadFilter(), hg=ac.createGain(); h.buffer=noise; hl.type="lowpass"; hl.frequency.value=1400;
      hg.gain.setValueAtTime(vel*0.02,at); hg.gain.exponentialRampToValueAtTime(0.0001,at+0.02); h.connect(hl); hl.connect(hg); hg.connect(g); h.start(at); h.stop(at+0.03);
      g.connect(lp); lp.connect(p); p.connect(master); p.connect(verbSend); if(send) p.connect(echo)};
    // Hans Zimmer colours
    const organAt=(notes,at,dur)=>{ // Interstellar-style organ glow: soft triangles, octave doubled, slow swell
      const g=ac.createGain(); g.gain.value=0; g.gain.setValueAtTime(0,at); g.gain.linearRampToValueAtTime(0.012,at+2); g.gain.setTargetAtTime(0,at+dur,0.8);
      g.connect(master); g.connect(verbSend);
      notes.forEach(m=>[0,12].forEach(o8=>{const o=ac.createOscillator(); o.type="triangle"; o.frequency.value=hz(m+o8); o.connect(g); o.start(at); o.stop(at+dur+4)}))};
    { const lp=ac.createBiquadFilter(), g=ac.createGain(); lp.type="lowpass"; lp.frequency.value=320; // the drone: D and A, low, all through
      g.gain.value=0; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.035,t+Math.min(4,sec/3)); g.gain.setValueAtTime(0.035,Math.max(t+Math.min(4,sec/3),END-2));
      g.gain.linearRampToValueAtTime(0,END); lp.connect(g); g.connect(master);
      [38,45].forEach(m=>[-5,5].forEach(c=>{const o=ac.createOscillator(); o.type="sawtooth"; o.frequency.value=hz(m); o.detune.value=c; o.connect(lp); o.start(t); o.stop(END+0.5)})) }
    const ost=ac.createBiquadFilter(); ost.type="lowpass"; ost.Q.value=1.2; ost.frequency.value=700; ost.connect(master); ost.connect(verb); // the low-string ostinato's body
    const string=(m,at,v)=>{const g=ac.createGain(); env(g,at,v,0.006,0.16); g.connect(ost);
      [m,m+12].forEach(n=>{const o=ac.createOscillator(); o.type="sawtooth"; o.frequency.value=hz(n); o.connect(g); o.start(at); o.stop(at+0.2)})};
    const tick=(at,hi)=>{const s=ac.createBufferSource(), bp=ac.createBiquadFilter(), g=ac.createGain(), p=ac.createStereoPanner(); // the clock, soft
      s.buffer=noise; bp.type="bandpass"; bp.frequency.value=hi?3600:2600; bp.Q.value=7; p.pan.value=hi?0.2:-0.2; env(g,at,0.09,0.002,0.03);
      s.connect(bp); bp.connect(g); g.connect(p); p.connect(master); s.start(at,Math.random()); s.stop(at+0.05)};
    const riser=(from,to)=>{const s=ac.createBufferSource(), bp=ac.createBiquadFilter(), g=ac.createGain(); s.buffer=noise; s.loop=true;
      bp.type="bandpass"; bp.Q.value=2; bp.frequency.setValueAtTime(300,from); bp.frequency.exponentialRampToValueAtTime(5000,to);
      g.gain.setValueAtTime(0.0001,from); g.gain.exponentialRampToValueAtTime(0.07,to-0.03); g.gain.linearRampToValueAtTime(0,to);
      s.connect(bp); bp.connect(g); g.connect(master); g.connect(verbSend); s.start(from); s.stop(to+0.05)};
    const braam=(at,level)=>{ // one deep brass-like hit: detuned saws, saturated, filter swelling open then closing
      const pre=ac.createGain(), ws=ac.createWaveShaper(), curve=new Float32Array(1024), lp=ac.createBiquadFilter(), g=ac.createGain();
      for(let i=0;i<1024;i++) curve[i]=Math.tanh(2.2*(i/1023*2-1)); ws.curve=curve; pre.gain.value=0.22; lp.type="lowpass"; lp.Q.value=2;
      lp.frequency.setValueAtTime(110,at); lp.frequency.exponentialRampToValueAtTime(850,at+0.9); lp.frequency.exponentialRampToValueAtTime(200,at+4.5);
      env(g,at,0.13*level,0.12,4.8); pre.connect(ws); ws.connect(lp); lp.connect(g); g.connect(master); g.connect(verb);
      [26,38,45,50].forEach(m=>[-12,12].forEach(c=>{const o=ac.createOscillator(); o.type="sawtooth"; o.frequency.value=hz(m); o.detune.value=c; o.connect(pre); o.start(at); o.stop(at+5.2)}))};
    const boom=(at,level)=>{const o=ac.createOscillator(), g=ac.createGain(); o.frequency.setValueAtTime(68,at); o.frequency.exponentialRampToValueAtTime(30,at+0.6);
      env(g,at,0.5*level,0.005,1.8); o.connect(g); g.connect(master); o.start(at); o.stop(at+2);
      const s=ac.createBufferSource(), lp=ac.createBiquadFilter(), ng=ac.createGain(); s.buffer=noise; lp.type="lowpass"; lp.frequency.value=220;
      env(ng,at,0.35*level,0.003,0.35); s.connect(lp); lp.connect(ng); ng.connect(master); ng.connect(verb); s.start(at); s.stop(at+0.4)};
    const sub=(m,at,dur)=>{const o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=hz(m);
      g.gain.setValueAtTime(0.0001,at); g.gain.exponentialRampToValueAtTime(0.11,at+0.08); g.gain.exponentialRampToValueAtTime(0.05,at+dur*0.8); g.gain.exponentialRampToValueAtTime(0.0001,at+dur+0.3);
      o.connect(g); g.connect(master); o.start(at); o.stop(at+dur+0.4)};
    if(fadeEnd){const g=master.gain; g.setValueAtTime(g.value,Math.max(t+0.7,END-1.5)); g.linearRampToValueAtTime(0,END)} // silent as the next programme starts
    let next=0;
    function bar(k){const b=bars[k], tb=t+k*BAR, c=chordOf(b), pad=c[2], bass=c[3];
      if(b===0) bloomAt(tb,1); if(b===15) bloomAt(tb,0.75); // the blooms: opening and home
      if(b===c[0]){const dur=BAR*(c[1]===2&&bars[k+1]===b+1?2:1); // a chord starts: its pad, sub, organ and glint
        if(b===0) padAt(pad,tb+0.6,dur-0.6); else if(b!==15) padAt(pad,tb,dur);
        if(b>=4&&b<=14) sub(bass,tb,dur);
        if(b>=8&&b<=12) organAt(pad,tb,dur);
        if(b===4||b===8||b===12) glint(hz(pad[4]+24),tb+0.05,0.03)}
      if(b>=4&&b<=11){ // the build: arpeggio bed, low-string ostinato (accents 3+3+2, opening up towards the lift), the clock
        ost.frequency.setTargetAtTime(b<8?700+(b-4)*100:b<10?1100+(b-8)*300:1700,tb,0.8);
        const tones=pad.slice(1).map(m=>m+12), pat=[0,2,1,3,2,1,3,2], lv=b<6?0.022:b<8?0.032:0.042;
        for(let e=0;e<8;e++) key(tones[pat[e]],tb+e*BEAT/2+hum(),vary(0.22),e%2?0.35:-0.35,false,0.55);
        for(let i=0;i<16;i++) string(bass+12,tb+i*SIX,[0,3,6,8,11,14].includes(i)?lv:lv*0.4);
        tick(tb,true); tick(tb+2*BEAT,false)}
      if(b===12) ost.frequency.setTargetAtTime(900,tb,0.8);
      if(b===6&&bars[k+1]===7&&bars[k+2]===8) riser(tb,tb+2*BAR);
      if(b===8){braam(tb,1); boom(tb,1)} if(b===12) boom(tb,0.45); // the lift, and the settle
      (THEME[b]||[]).forEach(([e,m,v])=>key(m,tb+e*BEAT/2+hum(),vary(v),(m-66)*0.04,true,1))}
    return {ahead(until){while(next<bars.length&&t+next*BAR<until) bar(next++); return next<bars.length}}; // schedule bars starting before 'until'
  }
  // One audio engine for every interlude, made with its reverb and noise in idle time soon after the ident (warm), so
  // starting an interlude costs next to nothing: making an AudioContext and its reverb took a visible ~0.2 s.
  let ctx=null, chain=null, noise=null, master=null, pump=0, run=0;
  function warm(){if(!AC||ctx)return; try{ctx=new AC(); chain=identOut(ctx,0.35); noise=noiseBuf(ctx)}catch(e){ctx=null}}
  // Crackle-free: synthesising dozens of voices live while the next video loads can outrun the audio thread, which
  // clicks. So ~40 s before a programme ends, the coming gap's music is rendered in the background (prep, from the
  // video's remaining time) and the gap just plays that clip. If it isn't ready, or the gap turns out more than 2 s
  // different, the music is made live as before.
  let ready=null, prepping=0;
  function prep(sec){if(!window.OfflineAudioContext||!AC||sec<6||prepping||ready&&Math.abs(ready.sec-sec)<1)return; warm(); if(!ctx)return;
    try{const sr=ctx.sampleRate, oac=new OfflineAudioContext(2,Math.ceil((sec+0.5)*sr),sr), {out,verb}=identOut(oac,0.35), m=oac.createGain(), p=prepping=sec;
      m.connect(out); session(oac,0.05,sec,m,verb,true).ahead(Infinity);
      oac.startRendering().then(buf=>{if(prepping===p) ready={sec,buf}}).catch(()=>{}).then(()=>{if(prepping===p) prepping=0})}catch(e){prepping=0}}
  function start(sec){stop(); if(!AC||muted||sec<6){ready=null; return} warm(); if(!ctx)return; const me=++run, a=ctx;
    const clip=ready&&Math.abs(ready.sec-sec)<=2?ready.buf:null; ready=null;
    a.resume().then(()=>{if(me!==run||a.state!=="running")return;
      const level=Math.max(0.05,vol/70), m=master=a.createGain(), t=a.currentTime+0.1;
      if(clip){const src=a.createBufferSource(); src.buffer=clip; m.gain.setValueAtTime(level,t); src.connect(m); m.connect(a.destination); src.start(t); // the rendered gap
        setTimeout(()=>{if(me===run) stop()},(sec+4)*1000); return}
      m.gain.setValueAtTime(0,t); m.gain.linearRampToValueAtTime(level,t+0.6); m.connect(chain.out); // fades in with the bloom
      const s=session(a,t,sec,m,chain.verb,true,noise);
      const go=()=>{if(me!==run)return; if(s.ahead(document.hidden?Infinity:a.currentTime+3)) pump=setTimeout(go,500)}; go(); // a few bars ahead; all at once in a hidden tab
      setTimeout(()=>{if(me===run) stop()},(sec+4)*1000)}).catch(()=>{})}
  function stop(){run++; clearTimeout(pump); const m=master; master=null; if(!m||!ctx)return; const a=ctx;
    try{m.gain.cancelScheduledValues(a.currentTime); m.gain.setValueAtTime(m.gain.value,a.currentTime); m.gain.setTargetAtTime(0,a.currentTime,0.35)}catch(e){}
    setTimeout(()=>{try{m.disconnect()}catch(e){}},2200)}
  // The standard piece, rendered offline with its natural ending (for an audio file)
  function render(sr=44100){const sec=4+15*BAR+0.5, oac=new OfflineAudioContext(2,Math.ceil((sec+4)*sr),sr), {out,verb}=identOut(oac,0.35), m=oac.createGain();
    m.connect(out); session(oac,0.05,sec,m,verb,false).ahead(Infinity); return oac.startRendering()}
  return {start,stop,warm,prep,render,plan};
})();
/* The static's sound, in retro mode only: a soft, high "no signal". A steady hiss with a faint steady whistle under it, constant for as
   long as the static stays up; it fades out quickly as the picture returns. Quiet, silent when muted, follows the
   volume, and plays only where the browser allows sound. */
const staticSound=(()=>{
  let ac=null, out=null;
  function start(){stop(); if(!AC||muted||!started||!retro)return; // only the retro TV hisses
    try{const a=ac=new AC(); a.resume().then(()=>{if(a!==ac)return; if(a.state!=="running"){a.close(); ac=null; return}
      const sr=a.sampleRate, t=a.currentTime+0.02, noise=a.createBuffer(1,sr*2,sr), d=noise.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      const o=out=a.createGain(); o.gain.value=0.6*Math.max(0.05,vol/70); o.connect(a.destination);
      const hiss=a.createBufferSource(), hp=a.createBiquadFilter(), lp=a.createBiquadFilter(), g=a.createGain();
      hiss.buffer=noise; hiss.loop=true; hp.type="highpass"; hp.frequency.value=1200;
      lp.type="lowpass"; lp.frequency.value=7000;
      g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.06,t+0.03); // in at once, then steady
      hiss.connect(hp); hp.connect(lp); lp.connect(g); g.connect(o); hiss.start(t);
      const w=a.createOscillator(), wg=a.createGain(); w.frequency.value=2600; // the whistle, steady under the hiss
      wg.gain.setValueAtTime(0.0001,t); wg.gain.exponentialRampToValueAtTime(0.008,t+0.04);
      w.connect(wg); wg.connect(o); w.start(t)}).catch(()=>{})}catch(e){}}
  function stop(){const a=ac, o=out; ac=out=null; if(!a)return;
    try{if(o){o.gain.cancelScheduledValues(a.currentTime); o.gain.setValueAtTime(o.gain.value,a.currentTime); o.gain.setTargetAtTime(0,a.currentTime,0.12)}}catch(e){}
    setTimeout(()=>a.close().catch(()=>{}),800)}
  return {start,stop};
})();
function setSound(on){muted=!on; $("sound").textContent=muted?"Turn sound on":"Mute"; knobs(); if(MODE!=="yt"||!player)return;
  if(muted){player.mute(); interlude.stop(); staticSound.stop(); return} player.unMute(); player.playVideo(); checkSound()}
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
  const now=tvNow(), strip=$("strip"), mid=stripMid(), w=copyWidth();
  const row=copy=>CHANNELS.map((c,i)=>{const s=slotAt(c,now), pct=s.live?100:Math.round((now-s.start)/(s.end-s.start)*100);
    const head=c.group&&c.group!==(CHANNELS[i-1]||{}).group?`<span class="sc-group" aria-hidden="true">${esc(c.group)}</span>`:"";
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
  const c=CHANNELS[cur], now=tvNow(), s=slotAt(c,now), nx=s.live?null:slotAt(c,s.end);
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
// Swipe to surf on phones and tablets: across the picture in plain full screen, or the tube of the retro TV.
// Left or up is the next channel, right or down the one before; short movements stay taps.
function swipeSurf(el){if(!el)return; let x0=0,y0=0,t0=0;
  el.addEventListener("touchstart",e=>{const t=e.touches[0]; x0=t.clientX; y0=t.clientY; t0=Date.now()},{passive:true});
  el.addEventListener("touchend",e=>{const t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0;
    if(Date.now()-t0>800||Math.max(Math.abs(dx),Math.abs(dy))<45) return;
    e.preventDefault(); const next=Math.abs(dx)>Math.abs(dy)?dx<0:dy<0;
    tune(cur+(next?1:-1)); if(retro) osdChannel(cur); else showBanner()},{passive:false})}
swipeSurf($("fsCatch")); swipeSurf(document.querySelector(".crt-glass"));
// iPhone Safari can't put a page in true full screen; once per visit, say how: add OGTV to the Home Screen
if(/iPhone|iPod/.test(navigator.userAgent)&&!(navigator.standalone||matchMedia("(display-mode: standalone)").matches)){
  let shown=false; try{shown=sessionStorage.getItem("ogtv-ios-tip")==="1"}catch(e){}
  if(!shown) setTimeout(()=>{const tip=document.createElement("button"); tip.className="ios-tip"; tip.type="button";
    tip.innerHTML="For true full screen, tap <b>Share</b> then <b>Add to Home Screen</b>. Swipe to change channel.";
    tip.addEventListener("click",()=>tip.remove()); document.body.appendChild(tip); setTimeout(()=>tip.remove(),9000);
    try{sessionStorage.setItem("ogtv-ios-tip","1")}catch(e){}},6500)}
function onFullscreenChange(){const sc=$("screen"); $("keyFs").textContent=roomFull()?"Exit full screen":"Full screen";
  sc.classList.toggle("pseudo-fs",roomFull()&&!retro); // plain look: the bare screen fills the room
  if(!roomFull()) try{screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock()}catch(e){}
  if(isFull()){browse=cur; showBanner(); wakeUI(false)}
  else {clearTimeout(uiTimer); clearTimeout(bannerTimer); sc.classList.remove("strip-on","banner-on","fs-idle","digits-on")}} // back to normal view: controls stay put
document.addEventListener("fullscreenchange",onFullscreenChange);
document.addEventListener("webkitfullscreenchange",onFullscreenChange);
/* Retro camcorder look, remembered per browser */
let retro=true; try{localStorage.removeItem("ogtv-retro"); retro=sessionStorage.getItem("ogtv-retro")!=="0"}catch(e){} // every visit and channel page opens in retro; turning it off lasts for this tab only
function setRetro(on){retro=on; if(!on) staticSound.stop(); $("main-tv").classList.toggle("retro-on",on); $("screen").classList.toggle("retro",on); $("set").classList.toggle("on",on); knobs(); $("retro").setAttribute("aria-pressed",on); $("retroFs").setAttribute("aria-pressed",on);
  try{sessionStorage.setItem("ogtv-retro",on?"1":"0")}catch(e){} osd();
  if(roomFull()) onFullscreenChange()} // already full screen: stay full screen, in the other look
function osd(){if(!retro)return; const d=new Date(tvNow()+IST), p=n=>String(n).padStart(2,"0");
  $("osdTime").textContent=`${MONTHS[d.getUTCMonth()].toUpperCase()} ${p(d.getUTCDate())} ${d.getUTCFullYear()}
${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`}
// The TV set's knobs turn like real ones: drag round, scroll, or arrow keys when focused. Channel steps
// through the dial and tunes where you let go (a plain click is the next channel); volume sets the level
// 0–100 as you turn (a plain click is sound on or off). A green on-screen readout shows where you are.
const TAG_NAMES={coke:"Coke Studio",inst:"instrumental",vocal:"vocal",dd:"Doordarshan",mytho:"mythology",auto:"cars & bikes",explain:"explainers",
  india:"India",world:"world",deep:"deep dives",learn:"learning",review:"reviews",scenic:"scenic",walk:"walks",sports:"sports fitness",army:"army training",soviet:"Soviet-style training",kahani:"kahaniyan",kavi:"kavi sammelan",mushaira:"mushaira",sitcom:"family sitcoms",olympic:"the Games",kbc:"KBC",dailybrief:"The Daily Brief",zmarkets:"Markets by Zerodha",firstsports:"First Sports",latest:"latest highlights",talent:"Hustle & I-Popstar",vantagenew:"Vantage, latest",vantage:"Vantage",palki:"Palki Sharma",fpshows:"Firstpost shows",igr:"IGR",trending:"trending",voices:"voices",stars:"stars",indie:"indie",chart:"charts",worldcharts:"world charts",alltime:"all-time hits",telugu:"Telugu",tamil:"Tamil",malayalam:"Malayalam",kannada:"Kannada",classic:"classics",ashtak:"Hanuman Ashtak",chalisa:"Hanuman Chalisa",punjabi:"Punjabi",dhh:"desi hip-hop",rap:"rap",rock:"rock",phonk:"phonk",tourism:"tourism",heritage:"heritage",food:"food",folk:"folk",prime:"India's big moments",f1:"F1 & MotoGP",tennis:"tennis",fixtures:"international fixtures",more:"golf, cycling & swimming",workout:"workouts",yoga:"yoga",news:"news"}; // how a part's tag reads in "On air because"
let vol=70; try{const v=+localStorage.getItem("ogtv-vol"); if(v>0&&v<=100) vol=v}catch(e){}
const CH_STEP=360/CHANNELS.length, VOL_DEG=2.7, VOL_MIN=-135; // volume sweeps -135° (silent) to +135° (full)
let osdTimer=0;
function tvOsd(html){const o=$("tvOsd"); o.innerHTML=html; o.classList.add("on"); clearTimeout(osdTimer); osdTimer=setTimeout(()=>o.classList.remove("on"),1600)}
const osdChannel=i=>tvOsd(`<b>CH ${String(CHANNELS[i].n).padStart(2,"0")}</b> ${esc(CHANNELS[i].name.toUpperCase())}`);
const osdVolume=()=>tvOsd(`<b>VOLUME</b> <span class="vbars">${"<i></i>".repeat(Math.round((muted?0:vol)/5))}</span> ${muted?"MUTE":vol}`);
// The panel's display: channel number in big digits, name in the pixel font; long names scroll
function vfd(){const c=CHANNELS[cur], name=$("vfdName"), box=name.parentElement;
  $("vfdN").textContent=String(c.n).padStart(2,"0"); name.textContent=c.name.toUpperCase();
  box.classList.remove("scroll"); name.style.removeProperty("--dist");
  requestAnimationFrame(()=>{const over=name.scrollWidth-box.clientWidth;
    if(over>2){name.style.setProperty("--dist",-(over+8)+"px"); name.style.setProperty("--dur",Math.max(4,over/14)+"s"); box.classList.add("scroll")}})}
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
$("home").addEventListener("click",()=>{if(!roomFull()) toggleFullscreen()}); // Home is full screen in the current look (retro by default)
$("keyRetro").addEventListener("click",()=>setRetro(false)); // in full screen this swaps to the plain full-screen look
$("keyMute").addEventListener("click",()=>{if(!started) start(); if(MODE==="yt"&&player){toggleSound(); osdVolume()}});
setSubs(subs);
$("showList").addEventListener("click",()=>setList(false));
setList(listHidden);
setRetro(retro); vfd();
// The site opens straight into full screen (the plain look, or the TV set if retro is on for this tab): it fills
// the window at once, and the first tap or key makes it true full screen (browsers only allow that after the
// visitor does something). Exit full screen leaves it.
function autoFull(){
  if(roomFull()) return; const room=$("room"); room.classList.add("pseudo-fs"); onFullscreenChange();
  if(TV_APP) return; // the app is full screen already
  const up=e=>{removeEventListener("click",up,true); removeEventListener("keydown",up,true);
    if(!room.classList.contains("pseudo-fs")||(e.target.closest&&e.target.closest("#keyFs,#keyRetro,#fs,#home"))||e.key==="Escape") return;
    const req=room.requestFullscreen||room.webkitRequestFullscreen; if(!req) return;
    const r=req.call(room);
    if(r&&r.then) r.then(()=>{room.classList.remove("pseudo-fs"); if(screen.orientation&&screen.orientation.lock) screen.orientation.lock("landscape").catch(()=>{})}).catch(()=>{})};
  addEventListener("click",up,true); addEventListener("keydown",up,true);
}
autoFull();
$("screen").addEventListener("dblclick",toggleFullscreen);

const ytLink=(id,sec)=>"https://www.youtube.com/watch?v="+encodeURIComponent(id)+"&t="+sec+"s";
// After Coming up next the new programme isn't announced with static: the card stays up while it loads, then fades
// away once the picture is playing (or after 8 s at most), so the programme appears from behind it.
let handing=false, handTimer=0;
function handOver(){handing=true; clearTimeout(handTimer); handTimer=setTimeout(fadeCard,8000)}
function fadeCard(){if(!handing)return; handing=false; clearTimeout(handTimer); const c=$("card"); c.classList.add("fading");
  setTimeout(()=>{if(!c.classList.contains("fading"))return; c.hidden=true; c.classList.remove("fading")},850)}
function showCard(msg){
  const now=tvNow(), ch=CHANNELS[cur], s=slotAt(ch,now), nx=slotAt(ch,s.end);
  const off=Math.floor((now-s.start)/1000);
  handing=false; const card=$("card"); card.hidden=false; card.classList.remove("fading");
  card.classList.toggle("interlude",MODE==="yt"&&!msg); // fades up with the jingle's bloom
  if(MODE==="yt"){ // interstitial between programmes
    if(!msg) interlude.start((s.end-now)/1000); // the jingle fills the gap
    card.innerHTML=`<span class="kicker">${msg?"Programme unavailable":"Coming up next"}</span>
      <h2>${esc(onAir(nx))}</h2><p>${esc(msg||catLabel(nx.v.cat)+" · "+LANG_LABEL[nx.v.lang]+" · starts at "+fmt(nx.start))}</p>
      <span class="count" id="count"></span>`;
  }else{
    card.innerHTML=`<span class="kicker">On air now · ${esc(catLabel(s.v.cat))} · ${esc(LANG_LABEL[s.v.lang])}</span>
      <h2>${esc(s.v.t)}</h2><p>${esc(s.v.src)}. Started at ${fmt(s.start)}, ends at ${fmt(s.end)}.</p>
      <a class="watch" id="watch" href="${ytLink(s.v.id,off)}" target="_blank" rel="noopener">Watch from this moment on YouTube</a>`;
  }
}

let prepKey=null; // the programme whose closing gap's music has been prepared
function tick(){
  const now=tvNow(), ch=CHANNELS[cur], s=slotAt(ch,now), nx=slotAt(ch,s.end);
  const key=slotKey(ch,s);
  if(MODE==="yt"&&player&&!ended&&!s.live&&prepKey!==key&&!muted) try{const d=player.getDuration(), c=player.getCurrentTime(); // 40 s from the end:
    if(d>0&&d-c<40&&d-c>8){prepKey=key; interlude.prep((s.end-now)/1000-(d-c))}}catch(e){} // render the coming gap's music
  $("clock").innerHTML=fmt(now)+"<small>IST</small>"; osd();
  $("chanbug").textContent=ch.n+" · "+ch.name;
  if(key!==playingKey){
    if(playingKey&&reloadNow()){location.reload(); return}
    const card=$("card"), handover=!!playingKey&&!card.hidden&&card.classList.contains("interlude"); // the programme follows Coming up next
    playingKey=key; playingId=s.v.id; ended=false; interlude.stop(); // next programme: the jingle fades out
    const off=Math.floor((now-s.start)/1000);
    if(MODE==="yt"&&player){if(handover) handOver(); else {handing=false;card.hidden=true;if(started)showStatic()} // the ident covers the first tune-in
      player.loadVideoById(s.live?{videoId:s.v.id}:{videoId:s.v.id,startSeconds:off});if(muted)player.mute()}
    else if(MODE==="fallback") showCard();
    $("nowTitle").textContent=onAir(s);
    const hh=h=>String(Math.floor(h)%24).padStart(2,"0")+":"+String(Math.round(h%1*60)).padStart(2,"0"); // 6.5 → 06:30
    const hours=s.part.from===0&&s.part.to===24?"":`: ${hh(s.part.from)}–${hh(s.part.to)}`; // all-day blocks need no hours
    $("why").innerHTML=`<span>On air because</span><span class="chip">${esc(s.part.label)}${hours}</span>`
      +(s.live?"":`<span class="chip">${esc(catLabel(s.part.cat))}${s.part.tag?" · "+esc(TAG_NAMES[s.part.tag]||s.part.tag):""}${s.part.maxMin?" · under "+s.part.maxMin+" min":""}</span>`)
      +(ch.live&&!s.live&&liveNow(ch,now)?`<span class="chip">Nothing live right now</span>`:"");
    if(ch.live&&!s.live&&liveNow(ch,now)&&started) track("live-none-"+ch.live,ch.name+": nothing live");
    $("next").innerHTML=s.live?`Live from <b>${esc(s.v.src)}</b>`:`Next at <b>${fmt(nx.start)}</b>: ${esc(onAir(nx))}`;
    renderChannels();
  }
  $("nowTime").textContent=s.live?`LIVE · ${LANG_LABEL[s.v.lang]}`:`${fmt(s.start)} – ${fmt(s.end)} · ${LANG_LABEL[s.v.lang]}`;
  $("nowBar").style.width=s.live?"100%":((now-s.start)/(s.end-s.start)*100).toFixed(1)+"%";
  if(MODE==="yt"&&ended){const c=$("count");if(c){const r=Math.ceil((s.end-now)/1000);c.textContent=Math.floor(r/60)+":"+String(r%60).padStart(2,"0")}}
  if(MODE==="fallback"){const w=$("watch");if(w)w.href=ytLink(s.v.id,Math.floor((now-s.start)/1000))}
}

// About section numbers come from the data, so they stay right as channels and creators change
$("aboutChannels").textContent=CHANNELS.length;
$("aboutCreators").textContent=new Set(CATALOG.map(v=>v.src)).size;
// The clock and the guide run for days on a TV: an error in one tick is reported and the next tick carries on
const guarded=(f,name)=>()=>{try{f()}catch(e){reportError(name,e&&e.message)}};
renderChannels(); renderGuide(); tick(); loadYT();
setInterval(guarded(tick,"tick"),1000);
// Watch-time milestones while the page is visible: how long people stay
let watchedSec=0; const MILESTONES={300:"5m",900:"15m",1800:"30m",3600:"60m",7200:"2h"};
setInterval(()=>{if(!started||document.hidden)return; watchedSec+=15; const m=MILESTONES[watchedSec]; if(m) track("watch-"+m,"Watched "+m)},15e3);
setInterval(guarded(renderGuide,"guide"),60e3);

// Live streams start and stop all day. The live list is re-read every 10 minutes, so a set left on picks up a
// stream that went on air after it was switched on (a channel whose stream changed retunes on the next tick)
async function refreshLive(){
  try{const r=await fetch("js/live.json?t="+Date.now(),{cache:"no-store"}); if(!r.ok) return; const j=await r.json();
    if(!j||typeof j!=="object"||JSON.stringify(j)===JSON.stringify(LIVE)) return;
    for(const k of Object.keys(LIVE)) delete LIVE[k]; Object.assign(LIVE,j); renderChannels(); renderGuide()}catch(e){}}
setInterval(refreshLive,10*MIN);
// A new version of the site (code, or the nightly feeds) loads itself at the next change of programme, so the
// viewer only sees a normal programme change. In a browser that waits until nobody has touched it for 30 minutes.
const stamp=(html,f)=>(html.match(new RegExp(f.replace(/\./g,"\\.")+"\\?v=([^\"']+)"))||[])[1];
const loadedStamp=f=>{const el=document.querySelector(`script[src^="${f}?"]`); return el?stamp(el.outerHTML,f):""};
let newVersion=false, lastTouch=Date.now();
["pointerdown","keydown"].forEach(ev=>addEventListener(ev,()=>{lastTouch=Date.now()},true));
async function checkVersion(){
  try{const html=await (await fetch("index.html?t="+Date.now(),{cache:"no-store"})).text();
    newVersion=["js/app.js","js/feeds.js"].some(f=>{const v=stamp(html,f); return v&&v!==loadedStamp(f)})}catch(e){}}
setInterval(checkVersion,HOUR);
const reloadNow=()=>newVersion&&(TV_APP||Date.now()-lastTouch>30*MIN);
// The server's clock (the Date header) is the reference: a device more than 3 s off plays on the corrected clock
async function syncClock(){
  try{const t0=Date.now(), r=await fetch("robots.txt?t="+t0,{method:"HEAD",cache:"no-store"}), t1=Date.now(), d=Date.parse(r.headers.get("date"));
    if(!d) return; const off=d+500-(t0+t1)/2, was=clockSkew; // the header has whole seconds: +500 ms is its middle
    clockSkew=Math.abs(off)>3e3?Math.round(off):0;
    if(Math.abs(clockSkew-was)>5e3){track("clock-skew","Device clock off by "+Math.round(off/1000)+" s"); if(MODE==="yt"&&player) replay(); renderChannels(); renderGuide()}}catch(e){}}
syncClock(); setInterval(syncClock,HOUR);

/* ---------- TV app remote ----------
   The app turns each remote key into ogtv.remote(name). Up/down and the channel keys change channel (up is the
   next number, as on a TV); in the plain look left/right browse the strip and OK tunes, in the retro set they
   change channel too. Menu swaps retro and plain, play/pause is sound, digits tune as on the keyboard.
   remote("back") returns false when there is nothing to close, and the app then offers to exit. */
const stripOn=()=>$("screen").classList.contains("strip-on");
const press=key=>document.body.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true,cancelable:true}));
function step(d){tune(cur+d); if(retro) osdChannel(cur)}
window.ogtv={
  remote(k){
    if(k==="back"){if(stripOn()){closeStrip(); return true} return false}
    if(!started) return true; // the ident plays through
    if(/^[0-9]$/.test(k)){press(k); return true}
    if(isFull()&&(k==="left"||k==="right"||(k==="ok"&&stripOn()))){press({left:"ArrowLeft",right:"ArrowRight",ok:"Enter"}[k]); return true}
    switch(k){
      case "up": case "chup": case "ff": case "right": step(1); break;
      case "down": case "chdown": case "rew": case "left": step(-1); break;
      case "ok": if(retro) osdChannel(cur); else {showBanner(); wakeUI(false)} break;
      case "menu": case "red": setRetro(!retro); if(retro) track("retro-on","Retro mode on"); break;
      case "playpause": toggleSound(); if(retro) osdVolume(); break;
      case "cc": case "green": toggleSubs(); break;
      default: return false;
    }
    return true;
  },
  pause(){if(MODE==="yt"&&player) player.pauseVideo(); keepAwake(false)}, // the app went to the background
  resume(){playingKey=null; tick()}, // back in front: rejoin the programme at this moment
};
if(TV_APP) track("app-tv-start","TV app opened");
setTimeout(()=>{const g=document.querySelector(".gscroll");if(g)g.scrollLeft=0},0);
