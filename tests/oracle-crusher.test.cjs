'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=(name)=>fs.readFileSync(require('node:path').join(__dirname,'..',name),'utf8');
function fixture(){
 const elements=new Map();
 const make=(id)=>({
  id,dataset:{},textContent:'',value:'',style:{},children:[],events:{},
  replaceChildren(...next){this.children=next},
  appendChild(child){this.children.push(child)},
  append(...items){this.children.push(...items)},
  setAttribute(){},removeAttribute(){},focus(){},
  addEventListener(type,fn){this.events[type]=fn}
 });
 const lookup=id=>{if(!elements.has(id))elements.set(id,make(id));return elements.get(id)};
 const doc={readyState:'loading',getElementById:lookup,createElement:()=>make('dynamic'),addEventListener(){}};
 const storage=new Map(),localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 const win={document:doc,localStorage,addEventListener(){},QuantaCloudConnection:{hasCredential:()=>false}};
 const load=(filename)=>vm.runInNewContext(read(filename),{window:win,document:doc,console,setTimeout,clearTimeout,Map,Set,Promise,Date,URL,JSON});
 return{doc,win,load,lookup};
}
test('Oracle UI retains spin and research writer while removing old bottom tools',()=>{
 const html=read('index.html');
 assert.match(html,/id="spinBtn"/);
 assert.match(html,/id="writerQuestion"/);
 assert.match(html,/id="suggestionButtons"/);
 assert.match(html,/data-control-phi-wallet-host/);
 assert.doesNotMatch(html,/Infinity Console|Device Identity|Admin — Repo Config/);
});
test('four distinct suggestions, rotating buttons, and optional user words',()=>{
 const f=fixture();f.load('assets/quant-suggestions.js');
 const api=f.win.BitcoinCrusherSuggestions;
 const initial=api.suggestions();
 assert.equal(initial.length,8);
 const before=initial[0];f.lookup('suggestionButtons').children[0].events.click();
 assert.equal(api.current()[0],before);
 assert.notEqual(api.suggestions()[0],before);
 const terms=api.fillFour();
 assert.equal(terms.length,4);
 assert.equal(new Set(terms.map(t=>t.toLowerCase())).size,4);
 assert.ok(api.query('custom theory').includes('custom theory'));
 for(const term of terms)assert.ok(api.query('custom theory').includes(term));
});
test('same spin ID is queued once while disconnected; no fake confirmed credit',()=>{
 const f=fixture();f.load('assets/crusher-wallet.js');
 const terms=['Hydrogen','Bitcoin','Copper','Silver'];
 const id='crusher_'+'a'.repeat(32);
 assert.equal(f.win.BitcoinCrusherWallet.reward({id,terms,query:terms.join(' ')}),true);
 assert.equal(f.win.BitcoinCrusherWallet.reward({id,terms,query:terms.join(' ')}),true);
 assert.equal(f.win.BitcoinCrusherWallet.pending().length,1);
 assert.match(f.lookup('walletRewardStatus').textContent,/pending|syncing|connect|completed/i);
});
test('integrations use separate idempotent Crusher receipts without masquerading as Share',()=>{
 const wallet=read('assets/crusher-wallet.js');
 assert.match(wallet,/\/v1\/quants\/crusher-spins/);
 assert.match(wallet,/starquest-ledger.*\/v1\/crusher-spins/);
 assert.match(wallet,/quantaConfirmed/);
 assert.match(wallet,/starquestConfirmed/);
 const source=read('assets/research.js');
 assert.match(source,/spinData\.researchTerms/);
 const app=read('assets/app.js');
 assert.match(app,/researchTerms:terms/);
});
