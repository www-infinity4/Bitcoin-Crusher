/* Bitcoin Crusher · Oracle research slot and source-backed writer */
(function(global){
 "use strict";
 var $=function(id){return document.getElementById(id)};
 var SYMBOLS = [
    { emoji: "₿",  label: "BTC",    value: 3,  weight: 8 },
    { emoji: "💎", label: "DIAM",   value: 5,  weight: 6 },
    { emoji: "∞",  label: "INF",    value: 8,  weight: 5 },
    { emoji: "🧱", label: "BLOCK",  value: 4,  weight: 7 },
    { emoji: "⭐", label: "STAR",   value: 2,  weight: 10 },
    { emoji: "🍄", label: "MARIO",  value: 6,  weight: 5 },
    { emoji: "👑", label: "CROWN",  value: 7,  weight: 4 },
    { emoji: "🚀", label: "PUMP",   value: 9,  weight: 3 },
    { emoji: "💰", label: "BAG",    value: 4,  weight: 7 },
    { emoji: "🔥", label: "FIRE",   value: 3,  weight: 9 },
    { emoji: "🥇", label: "GOLD",   value: 10, weight: 2 },
    { emoji: "🌕", label: "MOON",   value: 6,  weight: 5 },
  ];

 var state={spinCount:0,score:0,spinning:false,latestArticle:null,activeSpin:0};
 var pendingResearch=new Map();
 function clean(value){return String(value==null?"":value).replace(/\s+/g," ").trim();}
 function element(tag,cls,text){
  var e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=String(text);
  return e;
 }
 function pickSymbol(){
  const total=SYMBOLS.reduce((a,x)=>a+x.weight,0);let r=Math.random()*total;
  for(const sym of SYMBOLS){r-=sym.weight;if(r<=0)return sym}
  return SYMBOLS[SYMBOLS.length-1];
 }
 function buildSymbol(sym){
  const div=element("div","reel-symbol");div.append(element("span","",sym.emoji),element("span","sym-label",sym.label));return div;
 }
 function initReels(){
  for(let i=0;i<5;i++){
   const strip=$("strip"+i);strip.replaceChildren();
   for(let j=0;j<24;j++)strip.appendChild(buildSymbol(pickSymbol()));
   strip.style.transform="translateY(0)";
  }
 }
 function randomId(){
  if(global.crypto?.randomUUID)return "crusher_"+global.crypto.randomUUID().replace(/-/g,"");
  var bytes=new Uint8Array(16);global.crypto.getRandomValues(bytes);
  return "crusher_"+Array.from(bytes,function(v){return v.toString(16).padStart(2,"0")}).join("");
 }
 function evaluate(symbols){
  const counts={};
  symbols.forEach(sym=>{counts[sym.label]=(counts[sym.label]||0)+1});
  const max=Math.max(...Object.values(counts));
  const total=symbols.reduce((sum,sym)=>sum+sym.value,0);
  if(max===5)return {tier:"jackpot",score:total*50,message:"🎰 JACKPOT! All five match!"};
  if(max===4)return {tier:"win-big",score:total*12,message:"💎 MEGA WIN — four matched!"};
  if(max===3)return {tier:"win-medium",score:total*5,message:"⭐ BIG WIN — three matched!"};
  if(max===2)return {tier:"win-small",score:total*2,message:"Pair found!"};
  return {tier:"lose",score:0,message:"No symbol match. Research still created."};
 }
 function animateReel(reel,strip,finalSymbol,delay,duration){
  return new Promise(resolve=>{
   setTimeout(()=>{
    strip.replaceChildren();
    const count=20,height=reel.clientHeight||160;
    for(let i=0;i<count;i++)strip.appendChild(buildSymbol(i===count-1?finalSymbol:pickSymbol()));
    strip.querySelectorAll(".reel-symbol").forEach(div=>{div.style.height=height+"px";div.style.minHeight=height+"px"});
    const farY=(count-2)*height;
    strip.style.transition="none";strip.style.transform="translateY("+farY+"px)";
    void strip.offsetHeight;
    strip.style.transition="transform "+duration+"ms cubic-bezier(.17,.67,.35,1.05)";
    strip.style.transform="translateY("+(-(count-1)*height)+"px)";
    let settled=false;
    const done=()=>{
     if(settled)return;settled=true;
     strip.replaceChildren(buildSymbol(finalSymbol));
     strip.style.transition="none";strip.style.transform="translateY(0)";
     reel.classList.remove("spinning");resolve();
    };
    strip.addEventListener("transitionend",done,{once:true});
    setTimeout(done,duration+500);
   },delay);
  });
 }
 function animate(symbols){
  const promises=symbols.map((sym,i)=>{
   const reel=$("reel"+i);reel.classList.add("spinning");
   return animateReel(reel,$("strip"+i),sym,i*220,900+i*180);
  });
  return Promise.all(promises);
 }
 function pullLever(){
  const lever=$("lever");if(!lever)return;
  lever.classList.add("pulled");setTimeout(()=>lever.classList.remove("pulled"),520);
 }
 function burstCoins(count=6){
  const machine=$("machine");
  for(let i=0;i<count;i++)setTimeout(()=>{
   const coin=element("div","coin-burst",["💰","💎","₿","⭐","🥇","🪙"][i%6]);
   coin.style.left=(10+Math.random()*75)+"%";coin.style.top=(15+Math.random()*55)+"%";
   machine.appendChild(coin);setTimeout(()=>coin.remove(),800);
  },i*75);
 }
 function labelReward(msg){var e=$("walletRewardStatus");if(e)e.textContent=msg}
 function renderBrief(article){
  if(!article)return;
  var panel=$("researchPanel"),preview=$("researchPreview");if(!panel||!preview)return;
  panel.hidden=false;
  preview.replaceChildren();
  preview.appendChild(element("h3","",article.title||"Research in progress"));
  var sources=Array.isArray(article.sources)?article.sources:[];
  $("researchPanelMeta").textContent=(article.evidenceStatus||"pending")+" · "+sources.length+" indexed source(s) · "+(article.tokenId||"token pending");
  preview.appendChild(element("p","evidence-meta",clean(article.abstract||"Source discovery is pending.")));
  if(article.runtime?.synthesis?.text){
    preview.appendChild(element("h3","","AI evidence synthesis"));
    preview.appendChild(element("p","",article.runtime.synthesis.text));
  }
  if(sources.length){
   var list=element("ol","source-list");
   sources.slice(0,8).forEach(function(source){
    var li=element("li"),a=element("a","",source.title||source.url||"Indexed publication");
    a.href=source.url||"#";a.target="_blank";a.rel="noopener noreferrer";
    li.appendChild(a);list.appendChild(li);
   });
   preview.appendChild(list);
  }else preview.appendChild(element("p","evidence-meta","No indexed source records returned. Do not treat the selected connections as verified findings."));
 }
 function openResearch(){
  var article=state.latestArticle;if(!article)return;
  var body=$("researchModalBody");body.replaceChildren();
  body.appendChild(element("h3","",article.title||"Research brief"));
  var fields=[["Evidence status",article.evidenceStatus],["Research question",article.userInput],["Abstract",article.abstract],["Introduction",article.introduction],["Methods",article.methods],["Results",article.results],["Discussion",article.discussion],["Conclusion",article.conclusion]];
  fields.forEach(function(item){if(!clean(item[1]))return;body.append(element("h3","",item[0]),element("p","",item[1]));});
  if(article.runtime?.synthesis?.text)body.append(element("h3","","AI-assisted synthesis"),element("p","",article.runtime.synthesis.text));
  var sources=Array.isArray(article.sources)?article.sources:[];
  body.appendChild(element("h3","","Indexed evidence · "+sources.length+" source(s)"));
  if(sources.length){
   var list=element("ol","source-list");
   sources.forEach(function(source){
    var li=element("li"),link=element("a","",source.title||source.url||"Open record");
    link.href=source.url||"#";link.rel="noopener noreferrer";link.target="_blank";li.appendChild(link);
    li.appendChild(element("p","evidence-meta",(source.provider||"Publication index")+" · "+(source.doi||"No DOI provided")+" · "+(source.abstract?"Indexed abstract":"Metadata only")));
    list.appendChild(li);
   });body.appendChild(list);
  }else body.appendChild(element("p","","No sources available. Research notes are preliminary."));
  $("researchOverlay").hidden=false;
  $("researchClose").focus();
 }
 function renderWriterDraft(article){
  var out=$("writerOutput");
  if(!article||!out)return;
  if(article.runtime?.synthesis?.text)out.textContent=article.runtime.synthesis.text;
  else if((article.sources||[]).length)out.textContent="Evidence located: "+article.sources.length+" indexed records. Use Develop the research to construct a detailed synthesis with the writer.";
  else out.textContent="No indexed sources yet. You can continue refining the four-term query and spin again; unverified theories remain separate from published evidence.";
 }
 async function research(spinData,article){
  try{
   var enriched=await global.RESEARCH.enrichWithSearch(article);
   if(spinData.sequence!==state.activeSpin)return;
   state.latestArticle=enriched;renderBrief(enriched);renderWriterDraft(enriched);
   global.BitcoinCrusherResearchDirections?.set?.(enriched,spinData);
   $("writerStatus").textContent=(enriched.sources||[]).length+" indexed sources; full text not independently verified.";
  }catch(error){
   if(spinData.sequence!==state.activeSpin)return;
   $("writerStatus").textContent="Source lookup failed. The research token remains pending; try again.";
   console.warn("Crusher research retrieval deferred",error);
  }finally{pendingResearch.delete(spinData.id)}
 }
 async function spin(){
  if(state.spinning)return;
  var suggestions=global.BitcoinCrusherSuggestions;
  if(!suggestions){labelReward("Suggestions are still loading. Try again.");return}
  // Explicit user words join an unlimited collection. Do not silently generate missing terms.
  var typed=clean($("researchIdea").value);
  if(typed){suggestions.addMany(typed);$("researchIdea").value="";}
  var terms=suggestions.drawFour();
  if(terms.length!==4){labelReward("Add at least four of your own research terms before spinning. No words were autofilled.");return}
  var notes="";
  var query=suggestions.query("",terms);
  var spinData={id:randomId(),sequence:++state.activeSpin,spinNumber:++state.spinCount,timestamp:new Date().toISOString(),terms:terms,researchTerms:terms,userResearchInput:query,notes:notes,symbolLabels:[],score:0};
  state.spinning=true;$("spinBtn").disabled=true;
  $("resultText").textContent="Connecting four research subjects…";
  $("researchIdeaStatus").textContent="Four terms selected; manual context preserved in the research token.";
  pullLever();
  var symbols=Array.from({length:5},pickSymbol);
  spinData.symbolLabels=symbols.map(function(x){return x.label});
  try{
   await animate(symbols);
   var outcome=evaluate(symbols);
   state.score+=outcome.score;spinData.score=outcome.score;
   if(outcome.tier==="jackpot"){const flash=$("winOverlay");flash.textContent="🎰 JACKPOT! 🎰";flash.classList.add("show");burstCoins(14);setTimeout(()=>flash.classList.remove("show"),2700)}
   else if(outcome.tier==="win-big")burstCoins(8);
   $("spinCounter").textContent=String(state.spinCount);
   $("scoreCounter").textContent=String(state.score);
   $("resultText").textContent=outcome.message+" · "+terms.join(" + ");
   // A unique spin event is emitted once after the animation, never on refresh.
   if(global.BitcoinCrusherWallet){
    global.BitcoinCrusherWallet.reward({id:spinData.id,query:query,terms:terms});
   }else labelReward("Wallet service unavailable · cannot confirm +0.1 credit yet.");
   var article=global.RESEARCH.generateResearchArticle(spinData);
   state.latestArticle=article;renderBrief(article);
   global.BitcoinCrusherResearchDirections?.set?.(article,spinData);
   $("writerQuestion").value="Investigate connections, evidence and gaps between "+terms.join(", ");
   $("writerStatus").textContent="Retrieving source records for "+terms.join(", ")+"…";
   pendingResearch.set(spinData.id,article);
   void research(spinData,article);
  }catch(error){
   $("resultText").textContent="Spin failed before completion. No reward requested.";
   console.warn(error);
  }finally{state.spinning=false;$("spinBtn").disabled=false}
 }
 async function develop(){
  var question=clean($("writerQuestion").value||"");
  var output=$("writerOutput"),status=$("writerStatus"),button=$("writeBtn");
  var article=state.latestArticle;
  if(!question){status.textContent="Describe what you want the writer to investigate.";return}
  var readings=(article?.sources||[]).slice(0,8).map(function(source){
    return {title:source.title,url:source.url,provider:source.provider,abstract:clean(source.abstract).slice(0,1000)};
  });
  var prompt=[
   "Act as the Bitcoin Crusher source-aware Oracle research writer.",
   "Research question: "+question,
   "Selected research draw: "+(article?.keywords?.slice(0,4)?.join(", ")||"not selected"),
   "Indexed source records (may include only metadata and abstracts): "+JSON.stringify(readings),
   "Write a structured original explanatory research brief with sections: Question, Evidence, Possible Connections, Limitations, Next Research Steps.",
   "Separate hypotheses from sourced facts. Refer to source titles and URLs when evidence supports claims.",
   "Never invent citations, results, discoveries, market data, or full-text review. If no source records exist, explicitly label the response an exploratory unsourced outline."
  ].join("\n");
  button.disabled=true;output.setAttribute("aria-busy","true");status.textContent="Writing from available evidence…";
  try{
   var response=await fetch("https://infinity-rogers.marvaseater.workers.dev/v1/chat",{method:"POST",headers:{"content-type":"application/json","accept":"application/json"},body:JSON.stringify({input:prompt,context:{application:"QuantaPhi",task:"crusher-research-writer",requireCloudflare:true,verified_context:{query:question,sourceCount:readings.length}}}),signal:AbortSignal.timeout(28000)});
   var data=await response.json().catch(function(){return{}});
   if(!response.ok)throw Error(data.error||"Writer unavailable");
   var answer=clean(data.output_text||data.output||data.answer||data.response||"");
   if(!answer)throw Error("Writer returned no text");
   output.textContent=answer;
   status.textContent=readings.length+" indexed source(s) · draft prepared · verify claims against original publications.";
  }catch(error){
   status.textContent="Writer could not reach the AI service. The indexed research above remains available.";
   output.textContent="The research writer could not finish this request. Please try again; no invented article has been substituted.";
   console.warn("Crusher writer failed",error);
  }finally{output.removeAttribute("aria-busy");button.disabled=false}
 }
 function init(){
  initReels();
  $("spinBtn").addEventListener("click",function(){void spin()});
  $("lever")?.addEventListener("click",function(){void spin()});
  $("viewResearchBtn").addEventListener("click",openResearch);
  $("researchClose").addEventListener("click",function(){$("researchOverlay").hidden=true});
  $("researchOverlay").addEventListener("click",function(e){if(e.target===this)this.hidden=true});
  $("writeBtn").addEventListener("click",function(){void develop()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")$("researchOverlay").hidden=true;});
  global.addEventListener("quantaphi:star-coins-cloud",function(){global.ControlPhi?.refreshWallet?.()});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window);
