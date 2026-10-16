/* ---------- UI ---------- */
const $=id=>document.getElementById(id);
let cur=0; try{const s=+localStorage.getItem("aangan-ch");if(s>=0&&s<CHANNELS.length)cur=s}catch(e){}

function renderChannels(){
  const now=Date.now();
  $("chlist").innerHTML=CHANNELS.map((c,i)=>{const s=slotAt(c,now);
    return `<button class="ch" id="ch-${c.key}" data-i="${i}" aria-current="${i===cur}">
      <span class="num">${c.n}</span>
      <span style="min-width:0"><span class="nm"><strong style="${c.telugu?'font-family:var(--telugu);font-weight:700':''}">${c.name}</strong><em>${c.en}</em></span>
      <span class="on">${s.v.t}</span></span></button>`}).join("");
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
      return `<button class="prog${on?' nowp':''}" data-i="${i}" style="left:${(x-a)/MIN*PX+1}px;width:${(y-x)/MIN*PX-3}px" title="${s.v.t}">
        <b>${s.v.t}</b><small>${fmt(s.start)}</small></button>`}).join("");
    rows+=`<div class="grow"><div class="glabel" style="${c.telugu?'font-family:var(--telugu);font-weight:700':''}">${c.n} ${c.name}</div><div class="glane" style="width:${W}px">${lane}</div></div>`;
  });
  rows+=`<div class="nowline" style="left:${18+120+(now-a)/MIN*PX}px"></div>`;
  $("grid").innerHTML=rows;
}
$("grid").addEventListener("click",e=>{const b=e.target.closest(".prog");if(b)tune(+b.dataset.i)});

document.querySelectorAll(".seg button").forEach(b=>b.addEventListener("click",()=>{
  LANG=b.dataset.lang; cache.clear(); try{localStorage.setItem("aangan-lang",LANG)}catch(e){}
  document.querySelectorAll(".seg button").forEach(x=>x.setAttribute("aria-pressed",x===b));
  playingKey=null; renderChannels(); renderGuide(); tick();
}));
document.querySelectorAll(".seg button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.lang===LANG));

function tune(i){cur=(i+CHANNELS.length)%CHANNELS.length;try{localStorage.setItem("aangan-ch",cur)}catch(e){}
  playingKey=null; renderChannels(); tick();}
addEventListener("keydown",e=>{
  if(e.target.closest&&e.target.closest("input,select,textarea"))return;
  if(e.key==="ArrowUp"){e.preventDefault();tune(cur-1)}
  else if(e.key==="ArrowDown"){e.preventDefault();tune(cur+1)}
  else if(/^[1-7]$/.test(e.key)) tune(+e.key-1);
  else if(e.key==="m"||e.key==="M") toggleSound();
});

/* ---------- TV static: covers the blank screen while a channel tunes in or buffers ---------- */
const noise=$("noise"), nctx=noise.getContext("2d"), nimg=nctx.createImageData(noise.width,noise.height);
const stillNoise=matchMedia("(prefers-reduced-motion: reduce)").matches;
let staticOn=false, staticSince=0, staticRAF=0;
function drawNoise(){const d=nimg.data;
  for(let i=0;i<d.length;i+=4){const v=Math.random()*255|0;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255}
  nctx.putImageData(nimg,0,0); if(staticOn&&!stillNoise) staticRAF=requestAnimationFrame(drawNoise)}
function showStatic(){staticSince=Date.now(); if(staticOn)return; staticOn=true; $("static").hidden=false; drawNoise()}
function hideStatic(){ // keep it up at least 450ms so a channel change reads like real TV
  const wait=Math.max(0,450-(Date.now()-staticSince));
  setTimeout(()=>{if(!staticOn||Date.now()-staticSince<450)return; staticOn=false; cancelAnimationFrame(staticRAF); $("static").hidden=true},wait)}

/* ---------- Player: YouTube IFrame API when hosted; link-out card when embedding is blocked ---------- */
let MODE="loading", player=null, playingKey=null, ended=false, muted=true;
function loadYT(){
  const s=document.createElement("script"); s.src="https://www.youtube.com/iframe_api";
  s.onerror=()=>fallback(); document.head.appendChild(s);
  setTimeout(()=>{if(MODE==="loading")fallback()},8000);
}
window.onYouTubeIframeAPIReady=()=>{
  // Also runs if the API arrives after the timeout: the player takes over from the link-out card
  const s=slotAt(CHANNELS[cur],Date.now());
  player=new YT.Player("yt",{videoId:s.v.id,playerVars:{autoplay:1,mute:1,controls:0,rel:0,playsinline:1,disablekb:1,iv_load_policy:3,start:Math.floor((Date.now()-s.start)/1000)},
    events:{onReady:()=>{MODE="yt";player.mute();player.playVideo();playingKey=null;tick();$("sound").hidden=false;
              $("modeNote").innerHTML="Playing live from YouTube. Every viewer is on the same moment of the same programme."},
            onStateChange:e=>{const S=YT.PlayerState;
              if(e.data===S.PLAYING) hideStatic(); else if(e.data===S.BUFFERING) showStatic();
              else if(e.data===S.ENDED){ended=true;hideStatic();showCard()}},
            onError:e=>{ended=true;hideStatic();showCard("This video can't be played here (YouTube error "+e.data+"). The channel moves on at the next slot.")}}});
};
function fallback(){
  MODE="fallback"; hideStatic(); playingKey=null; tick();
  $("modeNote").innerHTML="<strong>Preview mode.</strong> This viewer blocks embedded YouTube, so the screen shows what is on air with a link that opens YouTube at the exact live moment. Host this same file on your own site and the screen plays the video itself.";
}
function toggleSound(){if(MODE!=="yt"||!player)return;muted=!muted;muted?player.mute():player.unMute();
  $("sound").textContent=muted?"Turn sound on":"Mute"}
$("sound").addEventListener("click",toggleSound);

function showCard(msg){
  const now=Date.now(), ch=CHANNELS[cur], s=slotAt(ch,now), nx=slotAt(ch,s.end);
  const off=Math.floor((now-s.start)/1000);
  const card=$("card"); card.hidden=false;
  if(MODE==="yt"){ // interstitial between programmes
    card.innerHTML=`<span class="kicker">${msg?"Programme unavailable":"Coming up next"}</span>
      <h2>${nx.v.t}</h2><p>${msg||CAT_LABEL[nx.v.cat]+" · "+LANG_LABEL[nx.v.lang]+" · starts at "+fmt(nx.start)}</p>
      <span class="count" id="count"></span>`;
  }else{
    card.innerHTML=`<span class="kicker">On air now · ${CAT_LABEL[s.v.cat]} · ${LANG_LABEL[s.v.lang]}</span>
      <h2>${s.v.t}</h2><p>${s.v.src}. Started at ${fmt(s.start)}, ends at ${fmt(s.end)}.</p>
      <a class="watch" id="watch" href="https://www.youtube.com/watch?v=${s.v.id}&t=${off}s" target="_blank" rel="noopener">Watch from this moment on YouTube</a>`;
  }
}

function tick(){
  const now=Date.now(), ch=CHANNELS[cur], s=slotAt(ch,now), nx=slotAt(ch,s.end);
  const key=ch.key+s.start+s.v.id;
  $("clock").innerHTML=fmt(now)+"<small>IST</small>";
  $("chanbug").textContent=ch.n+" · "+ch.en.split(" · ")[0];
  if(key!==playingKey){
    playingKey=key; ended=false;
    const off=Math.floor((now-s.start)/1000);
    if(MODE==="yt"&&player){$("card").hidden=true;showStatic();player.loadVideoById({videoId:s.v.id,startSeconds:off});if(muted)player.mute()}
    else if(MODE==="fallback") showCard();
    $("nowTitle").textContent=s.v.t;
    const hh=h=>String(h%24).padStart(2,"0")+":00";
    $("why").innerHTML=`<span>On air because</span><span class="chip">${s.part.label}: ${hh(s.part.from)}–${hh(s.part.to)}</span>`
      +`<span class="chip">${CAT_LABEL[s.part.cat]}${s.part.tag?" · snacks only":""}${s.part.maxMin?" · under "+s.part.maxMin+" min":""}</span>`
      +(LANG!=="all"?`<span class="chip">${s.fallback?"No "+LANG_LABEL[LANG]+" yet, showing all":LANG_LABEL[LANG]+" only"}</span>`:"");
    $("next").innerHTML=`Next at <b>${fmt(nx.start)}</b>: ${nx.v.t}`;
    renderChannels();
  }
  $("nowTime").textContent=`${fmt(s.start)} – ${fmt(s.end)} · ${LANG_LABEL[s.v.lang]}`;
  $("nowBar").style.width=((now-s.start)/(s.end-s.start)*100).toFixed(1)+"%";
  if(MODE==="yt"&&ended){const c=$("count");if(c){const r=Math.ceil((s.end-now)/1000);c.textContent=Math.floor(r/60)+":"+String(r%60).padStart(2,"0")}}
  if(MODE==="fallback"){const w=$("watch");if(w)w.href=`https://www.youtube.com/watch?v=${s.v.id}&t=${Math.floor((now-s.start)/1000)}s`}
}

showStatic(); renderChannels(); renderGuide(); tick(); loadYT();
setInterval(tick,1000);
setInterval(renderGuide,60e3);
setTimeout(()=>{const g=document.querySelector(".gscroll");if(g)g.scrollLeft=0},0);
