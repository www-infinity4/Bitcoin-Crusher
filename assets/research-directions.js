/* Bitcoin Crusher research Quant -> purple website directions -> Builder Reserve.
   Private per-wallet collection. No silent publication and no fake research evidence. */
(function (global) {
 "use strict";
 const API="https://quanta-phi-ledger.marvaseater.workers.dev/v1/quants/crusher-research";
 const PENDING="bitcoinCrusher:collectedResearchOutbox:v1";
 const CARD_TYPES=[
  ["Research Library","Source-backed searchable knowledge library","Organize the article, sources and related questions into an indexed library"],
  ["Business Opportunity","Market exploration and customer discovery","Test whether the research suggests an unmet customer need or useful service"],
  ["Interactive Learning","Guided course and explainer website","Teach the four subject connections with lessons, quizzes and source notes"],
  ["Data Explorer","Evidence and observation dashboard","Visualize source metadata, measurements where available and research gaps"],
  ["Technology Workshop","Engineering design and prototype notebook","Explore feasible components, prototypes, safety and limitations"],
  ["Research Magazine","Continuously expanding editorial publication","Turn each related Quant into another sourced section and feature story"],
  ["Comparison Lab","Alternatives and scenario comparator","Compare materials, techniques, histories or competing explanations"],
  ["Community Hub","Community-driven collaborative research","Collect user questions, source contributions and documented observations"],
  ["Business Directory","Research-linked business and service directory","Map vendors, specialist services and real opportunities for partnerships"],
  ["Digital Collection","Curated multimedia and artifact archive","Build cards for relevant videos, primary sources, imagery and collections"],
  ["Opportunity Tracker","Live ideas and validation pipeline","Track research hypotheses, validation steps, project readiness and updates"],
  ["Builder Studio","Modular website toolkit and storefront prototype","Turn researched ideas into reusable builder cards, tools and product showcases"]
 ];
 let current=null, directions=[], activeId="";
 const el=id=>document.getElementById(id);
 const clean=(x,max=1000)=>String(x??"").replace(/\s+/g," ").trim().slice(0,max);
 function read(){try{const value=JSON.parse(localStorage.getItem(PENDING)||"[]");return Array.isArray(value)?value:[]}catch{return[]}}
 function write(rows){try{localStorage.setItem(PENDING,JSON.stringify(rows.slice(-120)));return true}catch{return false}}
 function draw(article, spinData){
  const terms=spinData.terms.slice(0,4),sourceCount=(article.sources||[]).length;
  const topic=terms.join(" · "),sources=sourceCount?sourceCount+" indexed source records":"an exploratory research question without verified sources";
  return CARD_TYPES.map(([type,title,idea],i)=>({
   id:spinData.id+"-"+i,type,
   title:title+" — "+(terms[i%4]||"Research"),
   body:idea+". Based on "+topic+"; available evidence: "+sources+". This is a website proposal, not a scientific or commercial finding.",
   indexedWords:[...terms,type,title,"research","evidence"].join(" "),
   source:"Bitcoin Crusher research Quant",
   articleId:spinData.id
  }));
 }
 function button(text,onClick,cls){
  const b=document.createElement("button");b.type="button";b.textContent=text;b.className=cls||"";
  b.addEventListener("click",onClick);return b;
 }
 function buildURL(route,card){
  const path=route==="omni"?"/omni-phi/overview/":route==="quanta"?"/":"/infinity-phi/";
  const u=new URL(path,location.origin);
  u.searchParams.set("q",clean(card.indexedWords,700));
  u.searchParams.set("run","1");u.searchParams.set("build","1");
  u.searchParams.set("from","bitcoin-crusher");
  u.searchParams.set("research_quant",card.articleId);
  u.searchParams.set("website_type",card.type);
  return u.toString();
 }
 function render(){
  const root=el("directionCards"),area=el("websiteDirections");
  if(!root||!area||!current)return;
  area.hidden=false;root.replaceChildren();
  const summary=el("collectStatus");
  if(summary)summary.textContent="Research Quant "+current.spinData.id+" · "+directions.length+" website directions · Collect to save in Builder Reserve.";
  directions.forEach((d,i)=>{
   const card=document.createElement("article");card.className="direction-card";
   const eyebrow=document.createElement("small");eyebrow.textContent="PURPLE BUILDER CARD "+(i+1)+" · "+d.type;
   const title=document.createElement("h3");title.textContent=d.title;
   const desc=document.createElement("p");desc.textContent=d.body;
   const actions=document.createElement("div");actions.className="card-actions";
   ["infinity","omni","quanta"].forEach(route=>{
    const link=document.createElement("a");link.href=buildURL(route,d);
    link.textContent=route==="infinity"?"Build Infinity Phi":route==="omni"?"Build Omni Phi":"Build QuantaPhi";
    actions.appendChild(link);
   });
   actions.appendChild(button("Expand research",()=>{
    const writer=el("writerQuestion");if(writer)writer.value="Expand this research-backed website direction: "+d.title+". Explain audience, architecture, useful components, suggested content, research evidence, and what still needs testing. Four research terms: "+current.spinData.terms.join(", ");
    el("writerQuestion")?.scrollIntoView({behavior:"smooth",block:"center"});
    el("writeBtn")?.click();
   }));
   card.append(eyebrow,title,desc,actions);root.appendChild(card);
  });
 }
 function articlePacket(){
  if(!current)return null;
  const a=current.article,s=current.spinData,terms=s.terms.slice(0,4);
  return {
   article_id:s.id,
   article:{
    title:clean(a.title,250),question:clean(a.userInput||s.userResearchInput),terms,
    wordBankSize:global.BitcoinCrusherSuggestions?.current?.().length||terms.length,
    abstract:clean(a.abstract,4500),synthesis:clean(a.runtime?.synthesis?.text||a.discussion||"",9000),
    evidenceStatus:clean(a.evidenceStatus||"pending"),
    hash:clean(a.hash||""),
    sources:(a.sources||[]).slice(0,15).map(x=>({title:x.title,url:x.url,abstract:x.abstract,provider:x.provider}))
   },directions:directions.map(d=>({...d}))
  };
 }
 function queue(packet){
  if(!packet||!packet.article_id)return false;
  const rows=read(),index=rows.findIndex(x=>x.article_id===packet.article_id);
  if(index>=0)rows[index]=packet;else rows.push(packet);
  return write(rows);
 }
 let syncing=false;
 async function flush(){
  if(syncing)return false;
  if(!global.QuantaCloudConnection?.authenticatedFetch)return false;
  syncing=true;
  try{
   for(const packet of read()){
    const response=await global.QuantaCloudConnection.authenticatedFetch(API,{method:"POST",body:packet});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.ok)throw Error(payload.error||"Research Reserve sync failed");
    write(read().filter(x=>x.article_id!==packet.article_id));
    if(current?.spinData.id===packet.article_id)el("collectStatus").textContent="Collected! "+payload.directions+" purple website directions saved in your Builder Reserve. Open Reserve to build.";
   }
   return true;
  }catch(error){
   el("collectStatus").textContent="Research saved on this device; shared Reserve sync pending. Connect the same QuantaPhi wallet.";
   console.warn("Bitcoin Crusher Reserve sync deferred",error);
   return false;
  }finally{syncing=false}
 }
 function collect(){
  const packet=articlePacket();if(!packet){return}
  if(!queue(packet)){el("collectStatus").textContent="Device storage unavailable; research not collected.";return}
  el("collectStatus").textContent="Research Quant collected locally. Syncing article and directions to Builder Reserve…";
  void flush();
 }
 function set(article,spinData){
  if(!article||!spinData?.id||!Array.isArray(spinData.terms))return;
  current={article,spinData};activeId=spinData.id;
  directions=draw(article,spinData);render();
 }
 const collectButton=el("collectResearch");if(collectButton)collectButton.addEventListener("click",collect);
 ["focus","online"].forEach(event=>global.addEventListener(event,()=>void flush()));
 document.addEventListener("starquest:ledger-connected",()=>void flush());
 global.BitcoinCrusherResearchDirections={set,draw,collect,flush,get current(){return current},get directions(){return directions.slice()}};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>void flush(),{once:true});else void flush();
})(window);
