/* Bitcoin Crusher · Oracle research slot and source-backed writer */
(function(global){
 "use strict";
 var $=function(id){return document.getElementById(id)};
 var SYMBOLS=[
  {icon:"₿",label:"BTC",value:3},{icon:"✦",label:"STAR",value:2},
  {icon:"◆",label:"CRYSTAL",value:4},{icon:"◈",label:"QUANT",value:7},
  {icon:"☀",label:"ENERGY",value:5},{icon:"⚛",label:"ATOM",value:4},
  {icon:"⬡",label:"NETWORK",value:6},{icon:"☄",label:"ASTEROID",value:8}
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
 function pickSymbol(){return SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];}
 function setReel(index,sym){
  var strip=$("strip"+index);if(!strip)return;
  strip.replaceChildren();
  var symbol=element("div","reel-symbol");
  symbol.append(element("span","",sym.icon),element("small","",sym.label));
  strip.appendChild(symbol);
 }
 function initReels(){for(var i=0;i<5;i++)setReel(i,SYMBOLS[i]);}
 function randomId(){
  if(global.crypto?.randomUUID)return "crusher_"+global.crypto.randomUUID().replace(/-/g,"");
  var bytes=new Uint8Array(16);global.crypto.getRandomValues(bytes);
  return "crusher_"+Array.from(bytes,function(v){return v.toString(16).padStart(2,"0")}).join("");
 }
 function evaluate(symbols){
  var counts=new Map();
  symbols.forEach(function(x){counts.set(x.label,(counts.get(x.label)||0)+1);});
  var max=Math.max.apply(null,[...counts.values()]);
  return {score:max===5?100:max===4?40:max===3?15:max===2?5:1,
          message:max>=4?"Rare connection!":max===3?"Three themes aligned":max===2?"Two themes connected":"New research path discovered"};
 }
 function animate(symbols){
  for(var i=0;i<5;i++)$("reel"+i).classList.add("spinning");
  return new Promise(function(resolve){
   var index=0;
   function settle(){
    setReel(index,symbols[index]);$("reel"+index).classList.remove("spinning");
    index++;
    if(index>=5){resolve();return}
    setTimeout(settle,110);
   }
   setTimeout(settle,300);
  });
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
  var terms=suggestions.fillFour();
  var notes=clean($("researchIdea").value).slice(0,600);
  if(terms.length!==4){labelReward("Select four different research terms first.");return}
  var query=suggestions.query(notes);
  var spinData={id:randomId(),sequence:++state.activeSpin,spinNumber:++state.spinCount,timestamp:new Date().toISOString(),terms:terms,researchTerms:terms,userResearchInput:query,notes:notes,symbolLabels:[],score:0};
  state.spinning=true;$("spinBtn").disabled=true;
  $("resultText").textContent="Connecting four research subjects…";
  $("researchIdeaStatus").textContent="Four terms selected; manual context preserved in the research token.";
  var symbols=Array.from({length:5},pickSymbol);
  spinData.symbolLabels=symbols.map(function(x){return x.label});
  try{
   await animate(symbols);
   var outcome=evaluate(symbols);
   state.score+=outcome.score;spinData.score=outcome.score;
   $("spinCounter").textContent=String(state.spinCount);
   $("scoreCounter").textContent=String(state.score);
   $("resultText").textContent=outcome.message+" · "+terms.join(" + ");
   // A unique spin event is emitted once after the animation, never on refresh.
   if(global.BitcoinCrusherWallet){
    global.BitcoinCrusherWallet.reward({id:spinData.id,query:query,terms:terms});
   }else labelReward("Wallet service unavailable · cannot confirm +0.1 credit yet.");
   var article=global.RESEARCH.generateResearchArticle(spinData);
   state.latestArticle=article;renderBrief(article);
   $("writerQuestion").value=$("writerQuestion").value.trim()||"Investigate connections, evidence and gaps between "+terms.join(", ")+(notes?". Context: "+notes:"");
   $("writerStatus").textContent="Retrieving source records for the four-term query…";
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
   "Four-term research field: "+(global.BitcoinCrusherSuggestions?.current()?.join(", ")||"not selected"),
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
  $("viewResearchBtn").addEventListener("click",openResearch);
  $("researchClose").addEventListener("click",function(){$("researchOverlay").hidden=true});
  $("researchOverlay").addEventListener("click",function(e){if(e.target===this)this.hidden=true});
  $("writeBtn").addEventListener("click",function(){void develop()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")$("researchOverlay").hidden=true;});
  global.addEventListener("quantaphi:star-coins-cloud",function(){global.ControlPhi?.refreshWallet?.()});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window);
