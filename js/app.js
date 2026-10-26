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
  else if((e.key===" "||e.key==="k"||e.key==="K")&&!(e.target.closest&&e.target.closest("button,a"))){e.preventDefault(); togglePause()}
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
// The snow always moves: every frame, or ~8 frames a second under Reduce Motion (common on iPhones, where a single
// still frame looked frozen). Its contrast is in the pixels, not a CSS filter, which iOS Safari can fail to repaint.
let noiseAt=0;
function drawNoise(ts){
  if(staticOn) staticRAF=requestAnimationFrame(drawNoise);
  if(stillNoise&&ts&&ts-noiseAt<120) return; noiseAt=ts||0;
  const d=nimg.data; for(let i=0;i<d.length;i+=4){const v=50+Math.random()*200|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}
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
            onStateChange:e=>{const S=YT.PlayerState; dbg("video: "+({"-1":"unstarted",0:"ended",1:"playing",2:"paused",3:"buffering",5:"cued"}[e.data]||e.data));
              clearTimeout(bufTimer); clearTimeout(stallTimer);
              if(e.data===S.PLAYING){rejoin();remote.playing();$("set").classList.remove("idle");hideStatic(); if(subsFor!==playingId){subsFor=playingId; applySubs()} videoUp=true; openIris(); fadeCard(); keepAwake(true); skips=0; retries=0} // captions once per video, not on every resume
              else if(e.data===S.BUFFERING){if(started&&!handing&&Date.now()-resumedAt>6e3) bufTimer=setTimeout(showStatic,800); // no static while a resume catches up // a brief stall shows no static; the ident covers loading
                stallTimer=setTimeout(()=>skip("stall"),25e3)} // stuck loading (a weak or dropped connection): try again
              else if(e.data===S.PAUSED){keepAwake(false); pausedAt=Date.now(); remote.paused(); $("set").classList.add("idle")}
              else if(e.data===S.ENDED){if(slotAt(CHANNELS[cur],tvNow()).live) skip(); else {ended=true;hideStatic();showCard();keepAwake(false)}}},
            onError:e=>skip(e.data)}});
};
// While a channel is playing the screen stays on (Screen Wake Lock), so a phone or laptop doesn't dim and lock
// mid-programme; it is let go when playback stops. Browsers drop the lock when the tab is hidden, so it is
// taken again on return. Browsers without Wake Lock simply behave as before.
let wakeLock=null, wantAwake=false;
// Pause and play: from the page (Space or K), a TV remote, the phone's or a Bluetooth speaker's play/pause button or
// the lock screen, which all reach the video. Play is instant: it carries on exactly where it paused (seeking to the
// channel's moment made the video reload for a second or two); the channel catches up at the next programme change.
let pausedAt=0, resumedAt=0, subsFor=null;
function rejoin(){if(!pausedAt)return; pausedAt=0; resumedAt=Date.now()} // resumed: no static while it picks up
// Between programmes (Coming up next) pause hushes the jingle and play brings it back for the rest of the gap.
let gapHushed=false;
function tvPlaying(){try{if(MODE!=="yt"||!player)return false; if(ended)return !gapHushed;
  const st=player.getPlayerState(); return st===YT.PlayerState.PLAYING||st===YT.PlayerState.BUFFERING}catch(e){return false}}
function pauseNow(){if(MODE!=="yt"||!player)return; interlude.stop(); if(ended){gapHushed=true; remote.paused()} else {player.pauseVideo(); pausedAt=Date.now()}}
function playNow(){if(MODE!=="yt"||!player)return;
  if(ended){if(gapHushed){gapHushed=false; const s=slotAt(CHANNELS[cur],tvNow()); interlude.start((s.end-tvNow())/1000); remote.playing()} return}
  rejoin(); player.playVideo()}
function togglePause(){tvPlaying()?pauseNow():playNow()}
// ?debug: an on-screen log of the player and the media buttons, for tracking down device-specific trouble
const dbg=/[?&]debug\b/.test(location.search)?(()=>{const box=document.createElement("pre"), lines=[], t0=Date.now();
  box.style.cssText="position:fixed;left:6px;bottom:6px;z-index:999;max-width:94vw;margin:0;padding:6px 8px;border-radius:6px;background:rgba(0,0,0,.82);color:#7fffa0;font:11px/1.35 ui-monospace,monospace;white-space:pre-wrap;pointer-events:none;text-transform:none;letter-spacing:0";
  document.body.append(box); document.addEventListener("visibilitychange",()=>log("page "+document.visibilityState));
  function log(m){lines.push(((Date.now()-t0)/1000).toFixed(1)+"s "+m); if(lines.length>16) lines.shift(); box.textContent=lines.join("\n")}
  log(navigator.userAgent.replace(/^Mozilla\/5\.0 /,"").slice(0,90)); return log})():()=>{};
// The phone's media buttons (Bluetooth speakers and headphones, the media notification, the lock screen).
// On computers and iPhones they go to YouTube's own player, which sets its own play and pause handlers; that works.
// On Android, Chrome lets go of a paused video's media session after a few seconds, so a speaker's play then went
// nowhere. So on Android OGTV holds the session itself: a silent 30 s track keeps playing for as long as the TV is on,
// paused or not (a track that paused along with the video was dropped too), the page tells Android whether the channel
// is playing or paused, and the buttons are answered here. The track can only start after the viewer has touched the
// page (a touch on the video counts); after 15 minutes paused it stops, and the TV is off.
const remote=(()=>{
  const ms=navigator.mediaSession;
  if(!ms||TV_APP||!/Android/.test(navigator.userAgent)) return {playing(){},paused(){},meta(){}};
  const el=new Audio("/audio/silence.mp3?v=2"); el.loop=true; el.preload="auto"; el.setAttribute("playsinline","");
  let offTimer=0;
  function on(){clearTimeout(offTimer); if(el.paused) el.play().then(()=>dbg("track on")).catch(e=>dbg("track refused: "+e.name))}
  function state(st){ms.playbackState=st; dbg("session "+st);
    if(st==="paused") offTimer=setTimeout(()=>{el.pause(); dbg("track off: paused 15 min")},15*60e3)}
  const act=(k,fn)=>{try{ms.setActionHandler(k,fn)}catch(e){}};
  // While the track plays Chrome reports the session as playing even when the channel is paused, so a speaker's single
  // play/pause button can arrive as "pause" both ways: pause toggles, and play only ever plays.
  act("play",()=>{dbg("button: play (tv "+(tvPlaying()?"playing":"paused")+")"); on(); if(!tvPlaying()) playNow()});
  act("pause",()=>{dbg("button: pause (tv "+(tvPlaying()?"playing":"paused")+")"); on(); togglePause()});
  act("stop",()=>{dbg("button: stop"); clearTimeout(offTimer); ms.playbackState="paused"; el.pause(); pauseNow()});
  act("nexttrack",()=>{dbg("button: next"); tune(cur+1)}); act("previoustrack",()=>{dbg("button: previous"); tune(cur-1)});
  ["seekbackward","seekforward","seekto"].forEach(k=>act(k,null)); // live TV: no seeking
  ["touchend","click","keydown"].forEach(ev=>addEventListener(ev,on,true)); // the first touch lets the track start
  function meta(title,channel){try{ms.metadata=new MediaMetadata({title,artist:channel,album:"OGTV",
    artwork:[{src:"/img/apple-touch-icon.png",sizes:"180x180",type:"image/png"}]})}catch(e){}}
  return {playing(){on(); state("playing")},paused(){on(); state("paused")},meta}; // the track keeps playing either way
})();
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
function start(done){if(started)return; started=true; clearTimeout(introTimer); track("start","Opened"); setTimeout(guideLater,600);
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
  if(REDUCED){logoDone=capped=true; ask(); return}
  let formed=false; const formedNow=()=>{if(formed)return; formed=true; logoDone=true; ask(); openIris(); setTimeout(()=>{capped=true; openIris()},7250)};
  document.querySelector(".start .logo-word i:nth-child(3)").addEventListener("animationend",formedNow,{once:true});
  setTimeout(formedNow,6000)} // in case the animation never reports (a hidden tab)
function openIris(){if(opened||started||!logoDone||!pressed||!(videoUp||capped))return; opened=true;
  $("start").classList.add("open"); bloomTimer=setTimeout(bloom,100); introTimer=setTimeout(()=>start(true),REDUCED?600:1700)}
// Once OGTV has formed the intro asks for a press of the play button (the TV app goes straight on). The press (the
// button, a tap or click anywhere on the intro, Enter or Space) is the viewer's go-ahead for sound on every device and
// browser: the intro plays out with its music and the channel's sound fades in after it.
let asked=false, pressed=false;
function ask(){if(asked||started)return; asked=true; if(TV_APP){pressPlay(); return} $("start").classList.add("ask")}
function pressPlay(e){if(!asked||pressed||started)return;
  if(e&&e.type==="keydown"){if(e.key!=="Enter"&&e.key!==" ")return; e.preventDefault()}
  pressed=true; primed=true; if(identAc) identAc.resume().catch(()=>{});
  if(MODE==="yt"&&player){player.setVolume(0); player.unMute()} // allowed now; fades up after the intro
  if(TV_APP){openIris(); return}
  track("play","Play pressed"); $("start").classList.add("go"); setTimeout(openIris,350)} // the pulse leaves the ring first
$("start").addEventListener("click",pressPlay); addEventListener("keydown",pressPlay);
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
  /* The OGTV Interlude: a recorded 90 s piece (audio/interlude.mp3: the intro bloom, a felt-piano theme with Hans Zimmer
     colours, a slow last crescendo and the closing bloom; 95.7 s with its reverb tail). Every gap plays it from the
     start; a gap longer than 90 s starts it again at 90 s while the first pass's tail rings on underneath; whatever the
     gap's length, it fades out over its last seconds as the next programme arrives. It is decoded once and played
     through Web Audio, not an <audio> element: a media element on the page takes over the phone's and Bluetooth
     speakers' play/pause buttons (and the lock screen) from the video. */
  const SRC="/audio/interlude.mp3?v=1", LOOP=90;
  let ctx=null, out=null, buf=null, loading=null, srcs=[], timer=0, run=0;
  function warm(){if(!AC)return; try{if(!ctx){ctx=new AC(); out=ctx.createGain(); out.gain.value=0; out.connect(ctx.destination)}
      if(ctx.state==="running"&&!srcs.length) ctx.suspend().catch(()=>{}); // nothing playing yet
      if(!buf&&!loading) loading=fetch(SRC).then(x=>x.arrayBuffer()).then(d=>new Promise((ok,no)=>ctx.decodeAudioData(d,ok,no))).then(b=>{buf=b}).catch(()=>{}).then(()=>{loading=null})}catch(e){ctx=null}}
  function start(sec){stop(true); if(!AC||muted||sec<6)return; warm(); if(!ctx)return; const me=++run;
    Promise.all([ctx.resume(),loading]).then(()=>{if(me!==run||ctx.state!=="running"||!buf)return;
      const now=ctx.currentTime+0.05, level=Math.max(0.05,vol/100), fade=Math.min(4,sec/3), g=out.gain;
      g.cancelScheduledValues(now); g.setValueAtTime(0,now); g.linearRampToValueAtTime(level,now+0.8); // in with the bloom
      g.setValueAtTime(level,now+Math.max(0.8,sec-fade)); g.linearRampToValueAtTime(0,now+sec); // out as the next programme arrives
      for(let k=0;k*LOOP<sec;k++){const src=ctx.createBufferSource(); src.buffer=buf; src.connect(out); // from the top again at 90 s
        src.start(now+k*LOOP); src.stop(now+Math.min(sec+0.2,k*LOOP+buf.duration)); srcs.push(src)}
      timer=setTimeout(()=>{if(me===run) stop(true)},(sec+0.5)*1000)}).catch(()=>{})}
  function stop(quiet){run++; clearTimeout(timer); if(!ctx)return; const now=ctx.currentTime, g=out.gain, old=srcs; srcs=[];
    if(!quiet){g.cancelScheduledValues(now); g.setValueAtTime(g.value,now); g.linearRampToValueAtTime(0,now+1.2)} // cut short: a quick fade
    old.forEach(x=>{try{x.stop(now+(quiet?0:1.3))}catch(e){}})
    const me=run; setTimeout(()=>{if(me===run&&ctx.state==="running") ctx.suspend().catch(()=>{})},quiet?50:1500)} // silent between gaps, so the phone's play/pause goes to the video
  return {start,stop:()=>stop(false),warm};
})();
/* The static's sound, in retro mode only: a soft, high "no signal". A steady hiss with a faint steady whistle under it, constant for as
   long as the static stays up; it fades out quickly as the picture returns. Quiet, silent when muted, follows the
   volume, and plays only where the browser allows sound. */
const staticSound=(()=>{
  let ac=null, out=null;
  function start(){stop(); if(!AC||muted||!started||!retro||fxLevel>=4)return; // only the retro TV hisses, and not in its Quiet mode
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
let soundTapAt=0;
// (Sound controls and the M key are left to toggle it themselves; turning it on here as well switched it straight off)
const SOUND_CONTROLS="#sound,#keyMute,#knobVol";
["pointerdown","keydown"].forEach(ev=>addEventListener(ev,e=>{if(!started||soundTapped)return;
  if(e.key==="m"||e.key==="M"||(e.target.closest&&e.target.closest(SOUND_CONTROLS)))return;
  soundTapped=true; if(muted){soundTapAt=Date.now(); setSound(true)}},true));
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
// Swipe to surf on phones and tablets: across the picture, in full screen or in the page, or across the retro TV's tube.
// Left or up is the next channel, right or down the one before; short movements stay taps. In the page only sideways
// swipes surf, so scrolling the page never changes the channel.
function swipeSurf(el){if(!el)return; let x0=0,y0=0,t0=0;
  el.addEventListener("touchstart",e=>{const t=e.touches[0]; x0=t.clientX; y0=t.clientY; t0=Date.now()},{passive:true});
  el.addEventListener("touchend",e=>{const t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0;
    if(Date.now()-t0>800||Math.max(Math.abs(dx),Math.abs(dy))<45) return;
    if(!roomFull()&&!$("room").classList.contains("pseudo-fs")&&Math.abs(dy)>=Math.abs(dx)) return;
    e.preventDefault(); const next=Math.abs(dx)>Math.abs(dy)?dx<0:dy<0;
    tune(cur+(next?1:-1)); if(retro) osdChannel(cur); else showBanner()},{passive:false})}
swipeSurf($("fsCatch")); swipeSurf(document.querySelector(".crt-glass")); swipeSurf($("tapCatch"));
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
const CH_STEP=360*5/CHANNELS.length, chRot=i=>i*CH_STEP%360, VOL_DEG=2.7, VOL_MIN=-135; // all the channels take five turns of the knob; volume sweeps -135° (silent) to +135° (full)
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
function knobs(){$("keyMute").setAttribute("aria-pressed",muted); $("keyMute").textContent=muted?"Sound":"Mute"; $("knobCh").style.setProperty("--rot",chRot(cur)+"deg"); $("knobVol").style.setProperty("--rot",(VOL_MIN+(muted?0:vol)*VOL_DEG)+"deg")}
function setVol(v){vol=Math.max(0,Math.min(100,Math.round(v))); try{localStorage.setItem("ogtv-vol",vol)}catch(e){}
  if(MODE==="yt"&&player) player.setVolume(vol);
  if(vol===0&&!muted) setSound(false); else if(vol>0&&muted) setSound(true); else knobs();
  osdVolume()}
// Drag a knob round its centre; onTurn gets the total degrees turned so far, onDone when let go. A press without turning is a click:
// onClick gets 1 (up) or -1 (down). With the knob pointing between 0° and 180° the right half goes up and the left down;
// from 180° to 360° it flips, as if pushing the pointer round the dial.
function turnable(el,{onTurn,onDone,onClick}){
  let start=null;
  const ang=e=>{const r=el.getBoundingClientRect(); return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI};
  el.addEventListener("pointerdown",e=>{e.preventDefault(); el.setPointerCapture(e.pointerId); const r=el.getBoundingClientRect(), rot=((parseFloat(el.style.getPropertyValue("--rot"))||0)%360+360)%360;
    start={a:ang(e),last:ang(e),turned:0,x:e.clientX,y:e.clientY,moved:false,side:(e.clientX<r.left+r.width/2?-1:1)*(rot<180?1:-1)}; el.classList.add("turning")});
  el.addEventListener("pointermove",e=>{if(!start)return; const a=ang(e); let d=a-start.last; if(d>180)d-=360; if(d<-180)d+=360;
    start.last=a; start.turned+=d; if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>5) start.moved=true; if(start.moved) onTurn(start.turned)});
  const end=()=>{if(!start)return; const st=start; start=null; el.classList.remove("turning"); st.moved?onDone(st.turned):onClick(st.side)};
  el.addEventListener("pointerup",end); el.addEventListener("pointercancel",end);
}
let chPreview=0;
turnable($("knobCh"),{
  onTurn:d=>{$("knobCh").style.setProperty("--rot",(chRot(cur)+d)+"deg"); chPreview=(cur+Math.round(d/CH_STEP)+CHANNELS.length*10)%CHANNELS.length; osdChannel(chPreview)},
  onDone:()=>{chPreview!==cur?tune(chPreview):knobs()},
  onClick:side=>{if(!started) start(); tune(cur+side); osdChannel(cur)}});
let volAtStart=vol;
$("knobVol").addEventListener("pointerdown",()=>{volAtStart=muted?0:vol});
turnable($("knobVol"),{
  onTurn:d=>setVol(volAtStart+d/VOL_DEG),
  onDone:()=>{},
  onClick:side=>{if(!started) start(); if(side<0){if(!muted) setVol(vol-10); else osdVolume()} else if(muted){if(vol===0) setVol(50); else {toggleSound(); osdVolume()}} else setVol(vol+10)}});
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
function setSubs(on){subsFor=playingId; subs=on; $("cc").setAttribute("aria-pressed",on); $("keyCc").setAttribute("aria-pressed",on); $("cc").setAttribute("aria-label",on?"Subtitles on":"Subtitles off");
  applySubs()}
const toggleSubs=()=>{setSubs(!subs); try{localStorage.setItem("ogtv-cc",subs?"on":"off")}catch(e){} if(subs) track("subs-on","Subtitles on")};
$("cc").addEventListener("click",toggleSubs);
// The TV set's push keys: the same controls as the on-screen buttons, which step aside while the set is showing
$("keyCc").addEventListener("click",toggleSubs);
$("keyFs").addEventListener("click",toggleFullscreen);
$("home").addEventListener("click",()=>{if(!roomFull()) toggleFullscreen()}); // Home is full screen in the current look (retro by default)
/* Retro's mode knob, where Exit retro was. Each setting peels off one more effect: Full (all of it), Steady (no tracking
   band sweeping down), Tinted (the tape colour and contrast but no lines or grain), Clean (no VCR effects at all), Quiet
   (no static hiss on channel changes), Normal (retro off;
   in full screen that swaps to the plain full-screen look). Remembered for the tab, like retro itself. */
const FX_NAMES=["Full","Steady","Tinted","Clean","Quiet","Normal"], FX_DEG=[-75,-45,-15,15,45,75], FX_OFF=5;
let fxLevel=2; try{const v=sessionStorage.getItem("ogtv-fx"); if(v!==null) fxLevel=Math.min(FX_OFF-1,Math.max(0,+v||0))}catch(e){} // Tinted unless chosen otherwise
function showFx(n){$("knobMode").title="Mode: "+FX_NAMES[n]; $("knobMode").style.setProperty("--rot",FX_DEG[n]+"deg")}
function setFx(n,osdToo){n=Math.max(0,Math.min(FX_OFF,n)); if(osdToo) tvOsd(`<b>MODE</b> ${FX_NAMES[n].toUpperCase()}`);
  if(n===FX_OFF){fxLevel=2; try{sessionStorage.setItem("ogtv-fx","2")}catch(e){} showFx(2); setRetro(false); return} // back at Tinted next time
  fxLevel=n; try{sessionStorage.setItem("ogtv-fx",String(n))}catch(e){}
  const sc=$("screen"); sc.classList.toggle("fx-steady",n>=1); sc.classList.toggle("fx-nolines",n>=2); sc.classList.toggle("fx-clean",n>=3);
  if(n>=4) staticSound.stop(); showFx(n)}
let fxPreview=0;
turnable($("knobMode"),{
  onTurn:d=>{fxPreview=Math.max(0,Math.min(FX_OFF,fxLevel+Math.round(d/30))); $("knobMode").style.setProperty("--rot",FX_DEG[fxPreview]+"deg"); tvOsd(`<b>MODE</b> ${FX_NAMES[fxPreview].toUpperCase()}`)},
  onDone:()=>setFx(fxPreview,true),
  onClick:side=>setFx(fxLevel+side,true)});
$("knobMode").addEventListener("wheel",e=>{e.preventDefault(); setFx(fxLevel+(e.deltaY>0?1:-1),true)},{passive:false});
$("knobMode").addEventListener("keydown",e=>{const k=e.key; if(!/^Arrow/.test(k)) return; e.preventDefault(); e.stopPropagation();
  setFx(fxLevel+(k==="ArrowRight"||k==="ArrowUp"?1:-1),true)});
setFx(fxLevel);
$("keyMute").addEventListener("click",()=>{if(!started) start(); if(MODE==="yt"&&player){toggleSound(); osdVolume()}});
setSubs(subs);
$("showList").addEventListener("click",()=>setList(false));
setList(listHidden);
setRetro(retro); vfd();
// The site opens straight into full screen (the plain look, or the TV set if retro is on for this tab): it fills
// the window at once, and the first tap or key makes it true full screen (browsers only allow that after the
// visitor does something). Exit full screen leaves it.
function autoFull(){
  if(!TV_APP&&matchMedia("(pointer:coarse) and (hover:none)").matches) return; // phones and tablets open in the normal view; Maximize is a tap away
  if(roomFull()) return; const room=$("room"); room.classList.add("pseudo-fs"); onFullscreenChange();
  if(TV_APP) return; // the app is full screen already
  const up=e=>{removeEventListener("click",up,true); removeEventListener("keydown",up,true);
    if(!room.classList.contains("pseudo-fs")||(e.target.closest&&e.target.closest("#keyFs,#knobMode,#fs,#home"))||e.key==="Escape") return;
    const req=room.requestFullscreen||room.webkitRequestFullscreen; if(!req) return;
    if(!started){const w=setInterval(()=>{if(!started)return; clearInterval(w); // full screen sits above the intro, so it waits for the iris
      if(navigator.userActivation&&!navigator.userActivation.isActive){addEventListener("click",up,true); addEventListener("keydown",up,true); return} goFull()},100); return}
    goFull()};
  const goFull=()=>{if(!room.classList.contains("pseudo-fs"))return; fullAskedAt=Date.now(); const r=(room.requestFullscreen||room.webkitRequestFullscreen).call(room);
    if(r&&r.then) r.then(()=>{room.classList.remove("pseudo-fs"); if(screen.orientation&&screen.orientation.lock) screen.orientation.lock("landscape").catch(()=>{})}).catch(()=>{})};
  addEventListener("click",up,true); addEventListener("keydown",up,true);
}
autoFull();
// In the TV on the page a tap on the picture pauses or plays, as YouTube's own tap did; the picture itself no longer
// takes touches, so YouTube's double-tap skip (±10 s) is gone. No double tap does anything: a quick second tap is
// ignored, and the tap that turns the sound on doesn't also pause.
let lastTap=0, fullAskedAt=0;
$("tapCatch").addEventListener("click",()=>{const now=Date.now(); if(now-lastTap<400||now-soundTapAt<800) return; lastTap=now; togglePause()});
// Maximized: Pause/Play sits with the full-screen buttons, and in retro mode a tap on the tube pauses or plays (not the
// click that turned on true full screen). The button follows the channel, however it was paused or played.
const PAUSE_ICON='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg>', PLAY_ICON='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M8 5.2v13.6L19 12z"/></svg>';
function playIcon(on){const b=$("pauseFs"); b.innerHTML=on?PAUSE_ICON:PLAY_ICON; b.setAttribute("aria-label",on?"Pause":"Play"); b.title=on?"Pause (K)":"Play (K)"}
{const p0=remote.playing,p1=remote.paused; remote.playing=()=>{p0(); playIcon(true)}; remote.paused=()=>{p1(); playIcon(false)}}
$("pauseFs").addEventListener("click",()=>{togglePause(); wakeUI(false)});
document.querySelector(".crt-glass").addEventListener("click",()=>{if(!retro||Date.now()-fullAskedAt<600) return; const now=Date.now(); if(now-lastTap<400) return; lastTap=now; togglePause()});

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
    if(!msg){clearTimeout(bannerTimer); $("screen").classList.remove("banner-on"); $("set").classList.add("idle")} // the TV's red light is off between programmes // the channel banner never covers Coming up next
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

function tick(){
  const now=tvNow(), ch=CHANNELS[cur], s=slotAt(ch,now), nx=slotAt(ch,s.end);
  const key=slotKey(ch,s);
  $("clock").innerHTML=fmt(now)+"<small>IST</small>"; osd();
  $("chanbug").textContent=ch.n+" · "+ch.name;
  if(key!==playingKey){
    if(playingKey&&reloadNow()){location.reload(); return}
    const card=$("card"), handover=!!playingKey&&!card.hidden&&card.classList.contains("interlude"); // the programme follows Coming up next
    playingKey=key; playingId=s.v.id; ended=false; gapHushed=false; interlude.stop(); remote.meta(onAir(s),ch.n+" · "+ch.name); // next programme: the jingle fades out
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
renderChannels(); tick(); loadYT(); // the guide is built after the intro (guideLater), so the intro has the phone to itself
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
      case "playpause": togglePause(); break;
      case "cc": case "green": toggleSubs(); break;
      default: return false;
    }
    return true;
  },
  pause(){if(MODE==="yt"&&player) player.pauseVideo(); pausedAt=Date.now(); keepAwake(false)}, // the app went to the background
  resume(){playingKey=null; tick()}, // back in front: rejoin the programme at this moment
};
if(TV_APP) track("app-tv-start","TV app opened");
// The programme guide is built once the intro has handed over (or after 12 s if no one presses play), then scrolled to now
let guideBuilt=false;
function guideLater(){if(guideBuilt)return; guideBuilt=true; renderGuide(); requestAnimationFrame(()=>{const g=document.querySelector(".gscroll"); if(g) g.scrollLeft=0})}
setTimeout(guideLater,12000);
