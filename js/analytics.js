/* ---------- Analytics: GoatCounter (no cookies, no personal data) ----------
   Set GC_CODE to your GoatCounter site code (the "ogtv" in ogtv.goatcounter.com). Empty = no tracking. */
const GC_CODE = "shubhank";

window.goatcounter = {no_onload: true}; // we count the visit ourselves, without the ?ch= query
function track(name, title){ // events show up as paths in the GoatCounter dashboard
  if(!GC_CODE) return;
  const send=()=>window.goatcounter.count({path:name, title:title||name, event:true});
  window.goatcounter.count ? send() : (window.__gcQueue=window.__gcQueue||[]).push(send);
}
if(GC_CODE){
  // a fixed version with its hash, so the browser refuses the script if the CDN ever serves anything else
  const s=document.createElement("script"); s.async=true; s.src="https://gc.zgo.at/count.v4.js";
  s.integrity="sha384-nRw6qfbWyJha9LhsOtSb2YJDyZdKvvCFh0fJYlkquSFjUxp9FVNugbfy8q1jdxI+"; s.crossOrigin="anonymous";
  s.dataset.goatcounter=`https://${GC_CODE}.goatcounter.com/count`;
  // the visit is counted by page: "/" or a /tv/<channel>/ landing page
  s.onload=()=>{window.goatcounter.count({path:location.pathname, title:document.title}); (window.__gcQueue||[]).forEach(f=>f()); window.__gcQueue=[]};
  document.head.appendChild(s);
}
