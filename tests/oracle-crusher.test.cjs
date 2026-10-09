'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
function fixture(){
 const nodes=new Map(),pendingEvents={};
 function element(id){
  const e={id,style:{},dataset:{},children:[],value:'',textContent:'',events:{},
    replaceChildren(...children){this.children=children},appendChild(child){this.children.push(child)},
    append(...children){this.children.push(...children)},addEventListener(type,fn){this.events[type]=fn},
    setAttribute(){},removeAttribute(){},focus(){}};
  return e;
 }
 const lookup=id=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)};
 const doc={readyState:'loading',getElementById:lookup,createElement:tag=>element(tag),addEventListener:(name,fn)=>{pendingEvents[name]=fn}};
 const memory=new Map(),localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 const win={document:doc,localStorage,addEventListener(){},QuantaCloudConnection:{hasCredential:()=>false}};
 const load=name=>vm.runInNewContext(read(name),{window:win,document:doc,console,setTimeout,clearTimeout,Map,Set,Promise,Date,URL,Math,JSON});
 return{doc,win,lookup,load,pendingEvents};
}
test('the original spinner survives Oracle refinement, while the page is bright',()=>{
 const html=read('index.html'),css=read('assets/oracle-crusher.css'),app=read('assets/app.js');
 for(const id of ['lever','reel0','reel1','reel2','reel3','reel4','spinBtn','writerQuestion','directionCards','collectResearch','addWords'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/assets\/style\.css/);
 assert.match(css,/ORACLE DAYLIGHT/);
 assert.match(css,/background:#fbfaff/);
 assert.match(app,/function animateReel/);
 assert.match(app,/function pullLever/);
 assert.match(app,/function burstCoins/);
 assert.equal((app.match(/weight:\s*\d+/g)||[]).length,12);
});
test('unlimited words are collected, never autofilled; each spin draws only four',()=>{
 const f=fixture();f.load('assets/quant-suggestions.js');const suggestions=f.win.BitcoinCrusherSuggestions;
 assert.equal(suggestions.current().length,0);
 assert.equal(suggestions.drawFour().length,0);
 const before=suggestions.suggestions()[0];
 f.lookup('suggestionButtons').children[0].events.click();
 assert.equal(suggestions.current().length,1);
 assert.notEqual(suggestions.suggestions()[0],before);
 suggestions.addMany(Array.from({length:150},(_,i)=>'keyword'+i).join(' '));
 assert.equal(suggestions.current().length,151);
 const a=suggestions.drawFour(),b=suggestions.drawFour();
 assert.equal(a.length,4);assert.equal(b.length,4);
 assert.equal(new Set(a).size,4);
 assert.equal(suggestions.current().length,151);
 assert.ok(a.every(x=>suggestions.current().includes(x)));
 assert.ok(a.every(x=>suggestions.query('',a).includes(x)));
});
test('research article creates twelve purple website directions',()=>{
 const js=read('assets/research-directions.js');
 assert.match(js,/CARD_TYPES=\[/);assert.match(js,/\/v1\/quants\/crusher-research/);
 assert.match(js,/function collect\(/);assert.match(js,/generateSpecificDirections/);
 assert.match(js,/\/builder-reserve\//);
 assert.match(js,/Build Infinity Phi/);assert.match(js,/Build Omni Phi/);assert.match(js,/Build QuantaPhi/);
});
test('spin receipts use independent idempotent ledgers',()=>{
 const wallet=read('assets/crusher-wallet.js');
 assert.match(wallet,/\/v1\/crusher-spins/);assert.match(wallet,/\/v1\/quants\/crusher-spins/);
 assert.match(wallet,/starquestConfirmed/);assert.match(wallet,/quantaConfirmed/);
 assert.doesNotMatch(wallet,/saveShare|ensureShareCredit/);
});
