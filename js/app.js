/* ---------- UI ---------- */
const $=id=>document.getElementById(id);
let cur=0; try{const s=+localStorage.getItem("aangan-ch");if(s>=0&&s<CHANNELS.length)cur=s}catch(e){}
{const n=+new URLSearchParams(location.search).get("ch"), i=CHANNELS.findIndex(c=>c.n===n); if(i>=0)cur=i} // ?ch=8 opens Khel
const isNew=v=>v.pub&&Date.now()-Date.parse(v.pub)<30*DAY; // uploaded in the last 30 days
const NEW='<i class="new" title="Uploaded in the last 30 days">NEW</i>', LIVEDOT='<i class="livedot">LIVE</i>';
const badge=s=>s.live?LIVEDOT:isNew(s.v)?NEW:"";
const onAir=s=>s.live?s.v.src+": "+s.v.t:s.v.t;

function renderChannels(){
  const now=Date.now();
  $("chlist").innerHTML=CHANNELS.map((c,i)=>{const s=slotAt(c,now);
    return `<button class="ch" id="ch-${c.key}" data-i="${i}" aria-current="${i===cur}">
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

function tune(i){cur=(i+CHANNELS.length)%CHANNELS.length;try{localStorage.setItem("aangan-ch",cur)}catch(e){}
  try{history.replaceState(null,"","?ch="+CHANNELS[cur].n)}catch(e){}
  playingKey=null; renderChannels(); tick();}
let digits="", digitTimer=0;
function tuneNumber(n){const i=CHANNELS.findIndex(c=>c.n===n); if(i>=0)tune(i)}
addEventListener("keydown",e=>{
  if(e.target.closest&&e.target.closest("input,select,textarea"))return;
  if(!started){start();return}
  if(e.key==="ArrowUp"){e.preventDefault();tune(cur-1)}
  else if(e.key==="ArrowDown"){e.preventDefault();tune(cur+1)}
  else if(/^[0-9]$/.test(e.key)){ // "1" then "2" = channel 12; waits a moment for a second digit
    digits+=e.key; clearTimeout(digitTimer);
    if(digits.length>=2||+digits*10>CHANNELS.length){tuneNumber(+digits);digits=""}
    else digitTimer=setTimeout(()=>{tuneNumber(+digits);digits=""},900);
  }
  else if(e.key==="m"||e.key==="M") toggleSound();
  else if(e.key==="f"||e.key==="F") toggleFullscreen();
  else if(e.key==="r"||e.key==="R") setRetro(!retro);
  else if(e.key==="Escape"&&$("screen").classList.contains("pseudo-fs")) toggleFullscreen();
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
let MODE="loading", player=null, playingKey=null, playingId=null, ended=false, muted=true, skips=0;
function loadYT(){
  const s=document.createElement("script"); s.src="https://www.youtube.com/iframe_api";
  s.onerror=()=>fallback(); document.head.appendChild(s);
  setTimeout(()=>{if(MODE==="loading")fallback()},8000);
}
window.onYouTubeIframeAPIReady=()=>{
  // Also runs if the API arrives after the timeout: the player takes over from the link-out card
  const s=slotAt(CHANNELS[cur],Date.now());
  player=new YT.Player("yt",{videoId:s.v.id,playerVars:{autoplay:1,mute:1,controls:0,rel:0,playsinline:1,disablekb:1,iv_load_policy:3,...(s.live?{}:{start:Math.floor((Date.now()-s.start)/1000)})},
    events:{onReady:()=>{MODE="yt";muted?player.mute():player.unMute();player.playVideo();playingKey=null;tick();$("sound").hidden=false;
              $("modeNote").innerHTML="Playing live from YouTube. Every viewer is on the same moment of the same programme."},
            onStateChange:e=>{const S=YT.PlayerState;
              if(e.data===S.PLAYING) hideStatic(); else if(e.data===S.BUFFERING) showStatic();
              else if(e.data===S.ENDED){if(slotAt(CHANNELS[cur],Date.now()).live) skip(); else {ended=true;hideStatic();showCard()}}},
            onError:e=>skip(e.data)}});
};
// A video or stream that won't play is dropped from this browser's schedule and the next one starts.
// After many failures in one visit something bigger is wrong (blocker, network), so stop and say so.
function skip(code){
  if(++skips>15){ended=true;hideStatic();showCard("Videos aren't playing here"+(code?" (YouTube error "+code+")":"")+". An ad blocker or privacy setting may be stopping YouTube.");return}
  if(playingId) markBad(playingId); playingKey=null; tick(); renderGuide();
}
function fallback(){
  MODE="fallback"; hideStatic(); playingKey=null; tick();
  $("modeNote").innerHTML="<strong>Preview mode.</strong> This viewer blocks embedded YouTube, so the screen shows what is on air with a link that opens YouTube at the exact live moment. Host this same file on your own site and the screen plays the video itself.";
}
function toggleSound(){if(MODE!=="yt"||!player)return;muted=!muted;muted?player.mute():player.unMute();
  $("sound").textContent=muted?"Turn sound on":"Mute"}
/* Press to start: one tap gives the browser permission to play with sound */
let started=false;
function start(){if(started)return; started=true; $("start").hidden=true; muted=false;
  $("sound").textContent="Mute"; if(MODE==="yt"&&player){player.unMute();player.playVideo()}}
$("start").addEventListener("click",start);
$("sound").addEventListener("click",toggleSound);
/* Full screen the TV (with its overlays). iPhone Safari can't fullscreen an element, so the screen fills the window instead. */
function toggleFullscreen(){
  const el=$("screen"), fsEl=document.fullscreenElement||document.webkitFullscreenElement;
  if(fsEl){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
  const req=el.requestFullscreen||el.webkitRequestFullscreen;
  if(req&&!el.classList.contains("pseudo-fs")) req.call(el); else el.classList.toggle("pseudo-fs");
}
$("fs").addEventListener("click",toggleFullscreen);
/* Retro camcorder look, remembered per browser */
let retro=false; try{retro=localStorage.getItem("ogtv-retro")==="1"}catch(e){}
function setRetro(on){retro=on; $("screen").classList.toggle("retro",on); $("retro").setAttribute("aria-pressed",on);
  try{localStorage.setItem("ogtv-retro",on?"1":"0")}catch(e){} osd()}
function osd(){if(!retro)return; const d=new Date(Date.now()+IST), p=n=>String(n).padStart(2,"0");
  $("osdTime").textContent=`${MONTHS[d.getUTCMonth()].toUpperCase()} ${p(d.getUTCDate())} ${d.getUTCFullYear()}
${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`}
$("retro").addEventListener("click",()=>setRetro(!retro));
setRetro(retro);
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
  const key=s.live?ch.key+s.v.id:ch.key+s.start+s.v.id; // a live stream keeps playing across hour blocks
  $("clock").innerHTML=fmt(now)+"<small>IST</small>"; osd();
  $("chanbug").textContent=ch.n+" · "+ch.name;
  if(key!==playingKey){
    playingKey=key; playingId=s.v.id; ended=false;
    const off=Math.floor((now-s.start)/1000);
    if(MODE==="yt"&&player){$("card").hidden=true;showStatic();
      player.loadVideoById(s.live?{videoId:s.v.id}:{videoId:s.v.id,startSeconds:off});if(muted)player.mute()}
    else if(MODE==="fallback") showCard();
    $("nowTitle").textContent=onAir(s);
    const hh=h=>String(h%24).padStart(2,"0")+":00";
    const hours=s.part.from===0&&s.part.to===24?"":`: ${hh(s.part.from)}–${hh(s.part.to)}`; // all-day blocks need no hours
    $("why").innerHTML=`<span>On air because</span><span class="chip">${s.part.label}${hours}</span>`
      +(s.live?"":`<span class="chip">${catLabel(s.part.cat)}${s.part.tag?" · snacks only":""}${s.part.maxMin?" · under "+s.part.maxMin+" min":""}</span>`)
      +(ch.live&&!s.live?`<span class="chip">Nothing live right now</span>`:"");
    $("next").innerHTML=s.live?`Live from <b>${s.v.src}</b>`:`Next at <b>${fmt(nx.start)}</b>: ${onAir(nx)}`;
    renderChannels();
  }
  $("nowTime").textContent=s.live?`LIVE · ${LANG_LABEL[s.v.lang]}`:`${fmt(s.start)} – ${fmt(s.end)} · ${LANG_LABEL[s.v.lang]}`;
  $("nowBar").style.width=s.live?"100%":((now-s.start)/(s.end-s.start)*100).toFixed(1)+"%";
  if(MODE==="yt"&&ended){const c=$("count");if(c){const r=Math.ceil((s.end-now)/1000);c.textContent=Math.floor(r/60)+":"+String(r%60).padStart(2,"0")}}
  if(MODE==="fallback"){const w=$("watch");if(w)w.href=`https://www.youtube.com/watch?v=${s.v.id}&t=${Math.floor((now-s.start)/1000)}s`}
}

showStatic(); renderChannels(); renderGuide(); tick(); loadYT();
setInterval(tick,1000);
setInterval(renderGuide,60e3);
setTimeout(()=>{const g=document.querySelector(".gscroll");if(g)g.scrollLeft=0},0);
