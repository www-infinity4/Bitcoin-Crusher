/* Bitcoin Crusher · Quanta-backed four-term Oracle suggestions */
(function (global) {
  "use strict";
  var API = "https://quanta-phi-ledger.marvaseater.workers.dev";
  var STOP = new Set(("about after again against also among another because being between build built could different during every from have having into itself more most much only other over research search should since some that their there these this those through using very what when where which while will with would your").split(" "));
  var SEED = ["Hydrogen","Bitcoin","Copper","Silver","Resonance","Energy","Venus","Lithium","Magnetism","Robotics","Electricity","Asteroids","Geology","Quantum","Water","History","Metallurgy","Radiation","Plasma","Piano","Atmosphere","Chemistry","Biology","Gravity","Semiconductors","Fusion","Space","Materials","Electrons","Frequency","Research","Crystals"];
  var pool = SEED.slice(), terms = [], buttonWords = [], sourceCount = 0, served = new Set();
  var chooser = global.document.getElementById("suggestionButtons");
  var selected = global.document.getElementById("selectedTerms");
  var info = global.document.getElementById("quantSource");
  function clean(x) { return String(x == null ? "" : x).trim().replace(/\s+/g," "); }
  function normalized(x) { return clean(x).toLowerCase(); }
  function fragments(value) {
    var raw = clean(value).replace(/https?:\/\/\S+/g," ");
    var parts = raw.match(/[\p{L}\p{N}][\p{L}\p{N}-]{2,38}/gu) || [];
    return parts.map(function(x) {return x.toLowerCase();}).filter(function(x) {return !STOP.has(x) && !/^\d+$/.test(x);});
  }
  function extract(history, interactions) {
    var weight = new Map(), queries = [], seen = new Set();
    function addQuery(value, multiplier) {
      var v=clean(value); if(!v) return;
      queries.push(v);
      var pieces=[...new Set(fragments(v))];
      pieces.forEach(function(word) { weight.set(word,(weight.get(word)||0)+multiplier); });
    }
    (history.searches||[]).forEach(function(item){ addQuery(item.query_text,3); if(item.search_id)seen.add(item.search_id); });
    (history.tokens||[]).forEach(function(item){
      try { var data = JSON.parse(item.data_json||"{}"); addQuery(data.query||data.search_query||"",1); }catch(_){}
    });
    (interactions.events||[]).forEach(function(item){
      addQuery(item.index_terms,3); addQuery(item.query_text,1); addQuery(item.title,1);
    });
    var sorted=[...weight.entries()].sort(function(a,b){return b[1]-a[1];}).map(function(entry){return entry[0][0].toUpperCase()+entry[0].slice(1);});
    var all=sorted.concat(SEED); var unique=new Set();
    pool=all.filter(function(word){var k=normalized(word);if(!k||unique.has(k))return false;unique.add(k);return true;});
    served.clear();
    sourceCount=seen.size;
  }
  function pick(skip) {
    var forbidden=new Set((skip||[]).map(normalized));
    var eligible=pool.filter(function(x){return !forbidden.has(normalized(x))&&!served.has(normalized(x));});
    if(!eligible.length){served.clear();eligible=pool.filter(function(x){return !forbidden.has(normalized(x));});}
    if(!eligible.length)return "";
    var word=eligible[Math.floor(Math.random()*eligible.length)];
    served.add(normalized(word));return word;
  }
  function fillSuggestions() {
    buttonWords=[];
    for(var i=0;i<8;i++)buttonWords.push(pick(buttonWords.concat(terms)));
    renderSuggestions();
  }
  function renderSuggestions() {
    if(!chooser)return;
    chooser.replaceChildren();
    buttonWords.forEach(function(word,i){
      var button=document.createElement("button");button.type="button";button.className="suggestion-button";
      button.textContent="+ "+word;button.setAttribute("aria-label","Add "+word+" to four-term research");
      button.addEventListener("click",function(){
        addTerm(word);
        buttonWords[i]=pick(buttonWords.filter(function(_v,j){return j!==i;}).concat(terms));
        renderSuggestions();
      });
      chooser.appendChild(button);
    });
  }
  const BANK_KEY="bitcoinCrusher:researchWordBank:v2";
  const USED_KEY="bitcoinCrusher:researchDraws:v2";
  function loadBank(){try{const x=JSON.parse(global.localStorage.getItem(BANK_KEY)||"[]");return Array.isArray(x)?x.map(clean).filter(Boolean):[]}catch(_){return []}}
  function persistBank(){try{global.localStorage.setItem(BANK_KEY,JSON.stringify(terms))}catch(_){}}
  function normalizeBankWord(value){return clean(value).slice(0,90)}
  function renderSelected() {
    if(!selected)return;
    selected.replaceChildren();
    if(!terms.length){const note=document.createElement("p");note.textContent="Your research word bank is empty. Add as many suggestions or your own words as you like.";selected.appendChild(note)}
    terms.forEach(function(term,index){
      const chip=document.createElement("span");chip.className="bank-chip";
      const word=document.createElement("strong");word.textContent=term;chip.appendChild(word);
      const remove=document.createElement("button");remove.type="button";remove.textContent="×";remove.setAttribute("aria-label","Remove "+term);
      remove.addEventListener("click",function(){terms.splice(index,1);persistBank();renderSelected()});
      chip.appendChild(remove);selected.appendChild(chip);
    });
    const count=document.getElementById("wordCount");if(count)count.textContent=terms.length+" collected research terms";
  }
  function addTerm(word){
    word=normalizeBankWord(word);
    if(!word||terms.some(function(t){return normalized(t)===normalized(word)}))return terms.slice();
    terms.push(word);persistBank();renderSelected();return terms.slice();
  }
  function addMany(raw){
    // Commas and new lines are explicit phrases; plain spaces enter every word.
    const groups=String(raw||"").split(/[,;\n]+/).flatMap(function(chunk){
      const v=clean(chunk);return v?v.split(/\s+/):[];
    });
    groups.forEach(addTerm);return terms.slice();
  }
  function drawFour(){
    if(terms.length<4)return [];
    const list=terms.slice(),selectedFour=[];
    // Sample without replacement; the user's word bank is not depleted.
    for(let i=0;i<4;i++){const j=Math.floor(Math.random()*list.length);selectedFour.push(list.splice(j,1)[0]);}
    try{global.localStorage.setItem(USED_KEY,JSON.stringify({four:selectedFour,at:new Date().toISOString()}))}catch(_){}
    return selectedFour;
  }
  function clear(){terms=[];persistBank();renderSelected();}
  function query(extra,four){
    const chosen=Array.isArray(four)?four:terms;
    const appended=clean(extra);return (chosen.join(" ")+(appended?" "+appended:"")).slice(0,1000);
  }
  async function getJSON(path) {
    if(!global.QuantaCloudConnection?.authenticatedFetch)throw new Error("Cloud wallet unavailable");
    var response=await global.QuantaCloudConnection.authenticatedFetch(API+path,{method:"GET",cache:"no-store"});
    if(!response.ok)throw new Error("Quant history request "+response.status);
    return response.json();
  }
  async function load(){
    terms=loadBank();renderSelected();fillSuggestions();
    try{
      await global.QuantaCloudConnection?.ready;
      var results=await Promise.allSettled([getJSON("/v1/quants/history"),getJSON("/v1/quants/card-interactions")]);
      if(results[0].status!=="fulfilled")throw Error("Quant history unavailable");
      var history=results[0].value,interactions=results[1].status==="fulfilled"?results[1].value:{events:[]};
      extract(history,interactions);fillSuggestions();
      if(info)info.textContent=(sourceCount?sourceCount+" indexed searches scanned":"Saved Quant history")+" · "+(interactions.events||[]).length+" card interactions";
    }catch(_){
      // Only the on-device history is used if the user has no verified cloud identity.
      var local=[];
      try{local=JSON.parse(global.localStorage.getItem("quantaPhiBuildHistoryV1")||"[]")||[];}catch(_){}
      if(Array.isArray(local)&&local.length){
        extract({searches:local.map(function(x){return {search_id:x.search_id||x.id,query_text:x.query||x.title};}),tokens:[]},{events:[]});
        fillSuggestions();if(info)info.textContent=local.length+" locally saved Quants · cloud history not connected";
      }else if(info)info.textContent="Starter ideas · connect the shared wallet to use your Quants";
    }
  }
  var clearBtn=global.document.getElementById("clearTerms");if(clearBtn)clearBtn.addEventListener("click",clear);
  var addButton=global.document.getElementById("addWords");if(addButton)addButton.addEventListener("click",function(){
    const box=document.getElementById("researchIdea");if(!box)return;
    addMany(box.value);box.value="";document.getElementById("researchIdeaStatus").textContent="Added words to your collection; spin will choose four of your words.";
  });
  var api={load,addTerm,addMany,drawFour,fillFour:drawFour,clear,query,current:function(){return terms.slice();},suggestions:function(){return buttonWords.slice();},sourceCount:function(){return sourceCount;}};
  global.BitcoinCrusherSuggestions=api;
  if(global.document.readyState==="loading")global.document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})(window);
