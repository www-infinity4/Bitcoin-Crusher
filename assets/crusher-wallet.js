/* Bitcoin Crusher · shared QuantaPhi StarCoin wallet bridge */
(function(global){
 "use strict";
 var API="https://quanta-phi-ledger.marvaseater.workers.dev";
 var QUEUE="bitcoinCrusher:pendingSpinCredits:v1";
 var status=global.document.getElementById("walletRewardStatus");
 var running=false;
 function read(){try{var a=JSON.parse(global.localStorage.getItem(QUEUE)||"[]");return Array.isArray(a)?a:[]}catch(_){return[]}}
 function save(items){try{global.localStorage.setItem(QUEUE,JSON.stringify(items));return true}catch(_){return false}}
 function note(text){if(status)status.textContent=text}
 function account(){try{return String(JSON.parse(global.localStorage.getItem("starquest_session")||"null")?.key||"").toLowerCase()}catch(_){return ""}}
 function connected(){return !!(global.QuantaCloudConnection?.authenticatedFetch && global.QuantaCloudConnection?.hasCredential?.())}
 async function request(path,options){
  if(!global.QuantaCloudConnection?.authenticatedFetch)throw Error("shared_wallet_unavailable");
  var response=await global.QuantaCloudConnection.authenticatedFetch(API+path,options);
  var data=await response.json().catch(function(){return{}});
  if(!response.ok)throw Error(data.error||"wallet HTTP "+response.status);
  return data;
 }
 function reconcile(data){
  if(!data||!Number.isFinite(Number(data.credits_tenths)))return;
  var balance=Number(data.credits_tenths)/10;
  global.ControlPhi?.importLegacyStarCoinBalance?.(balance,"quanta-crusher-cloud");
  global.ControlPhi?.refreshWallet?.();
  global.dispatchEvent(new CustomEvent("quantaphi:star-coins-cloud",{detail:data}));
 }
 async function state(){
  if(!connected()){note("Wallet not connected · spins remain pending until your shared wallet is available.");return null}
  var data=await request("/v1/quants/star-coins",{method:"GET",cache:"no-store"});
  reconcile(data);
  var pending=read().length;
  note("Shared wallet ★ "+(Number(data.credits_tenths)/10).toFixed(1)+(pending?" · "+pending+" spin credit(s) pending":" · cloud connected"));
  return data;
 }
 async function starQuestSpin(item) {
  var token=await global.QuantaCloudConnection?.resolveDeviceToken?.();
  if(!token)throw Error("ledger_not_connected");
  var response=await global.fetch("https://starquest-ledger.marvaseater.workers.dev/v1/crusher-spins",{
    method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
    cache:"no-store",body:JSON.stringify({spin_id:item.id,query:item.query,terms:item.terms})
  });
  var data=await response.json().catch(function(){return{}});
  if(!response.ok||data.ok===false)throw Error(data.error||"StarQuest wallet sync failed");
  return data;
 }
 async function flush(){
  if(running)return false;
  if(!connected()){note(read().length+" pending spin credit(s) · connect the shared wallet");return false}
  running=true;
  try{
    var user=account(),attempted=new Set();
    // Include new spins queued while a previous spin is awaiting Cloudflare.
    for(;;){
      var item=read().find(function(x){return !attempted.has(x.id)&&(!x.owner||(user&&x.owner===user));});
      if(!item)break;
      attempted.add(item.id);
      if(!item.quantaConfirmed){
        if(!item.articlePacket)throw Error("research_article_required");
        await request("/v1/quants/crusher-research",{method:"POST",body:item.articlePacket});
        var data=await request("/v1/quants/crusher-spins",{method:"POST",body:{spin_id:item.id,query:item.query,terms:item.terms,research_hash:item.researchHash}});
        reconcile(data);
        item.quantaConfirmed=true;
        save(read().map(function(x){return x.id===item.id?item:x}));
      }
      if(!item.starquestConfirmed){
        var credited=await starQuestSpin(item);
        if(credited.state){
          var starBalance=Number(credited.state.starCoins||0)+Number(credited.state.pendingShareCredits||0)/10;
          global.ControlPhi?.importLegacyStarCoinBalance?.(starBalance,"starquest-crusher-spin");
          void global.ControlPhi?.refreshCloudWallet?.();
        }
        item.starquestConfirmed=true;
        save(read().map(function(x){return x.id===item.id?item:x}));
      }
      if(item.quantaConfirmed&&item.starquestConfirmed){
        save(read().filter(function(x){return x.id!==item.id}));
        note("Confirmed +0.1 StarCoin in the unified wallet. Spin receipt synchronized to both ledgers.");
      }
    }
    if(!attempted.size)await state();
    return true;
  }catch(error){
    note("Spin saved · StarCoin credit pending Cloudflare wallet confirmation.");
    console.warn("Bitcoin Crusher StarCoin receipt will retry",error);
    return false;
  }finally{running=false}
 }
 function reward(item){
  var id=String(item.id||"");
  if(!/^[a-zA-Z0-9_-]{12,100}$/.test(id)||!Array.isArray(item.terms)||item.terms.length!==4)return false;
  var list=read();
  if(!list.some(function(x){return x.id===id;})){
    list.push({id,terms:item.terms.slice(0,4),query:String(item.query||"").slice(0,1000),researchHash:String(item.researchHash||""),articlePacket:item.articlePacket,owner:account(),createdAt:new Date().toISOString()});
    if(!save(list)){note("Wallet storage unavailable · could not queue spin credit.");return false}
  }
  note("Research spin completed · confirming +0.1 StarCoin with both cloud ledgers…");
  void flush();
  return true;
 }
 global.BitcoinCrusherWallet={reward,flush,state,pending:read,connected};
 var retry=function(){void flush();};
 global.addEventListener("online",retry);
 global.addEventListener("focus",retry);
 global.document.addEventListener("starquest:ledger-connected",retry);
 global.document.addEventListener("starquest:auth-changed",retry);
 if(global.document.readyState==="loading")global.document.addEventListener("DOMContentLoaded",retry,{once:true});else retry();
})(window);
