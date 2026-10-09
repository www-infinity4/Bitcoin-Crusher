const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');

test('embedded Bitcoin Crusher preserves original interactive five reels and word bank',()=>{
 for(let i=0;i<5;i++)assert.match(html,new RegExp('id="reel'+i+'"'));
 assert.match(html,/id="spinBtn"/);assert.match(html,/id="researchIdea"/);
 assert.match(html,/id="suggestionButtons"/);
 assert.match(html,/id="researchPanel"[^>]*hidden/);
 assert.match(html,/id="websiteDirections"[^>]*hidden/);
 assert.match(html,/id="directionCards"/);
 assert.match(html,/assets\/app\.js/);
});
test('Quanta embeds slot, then input, then evidence, then purple directions',()=>{
 assert.match(html,/body\.crusher-embedded \.spinner-panel\{order:1\}/);
 assert.match(html,/body\.crusher-embedded \.research-entry\{order:2\}/);
 assert.match(html,/body\.crusher-embedded #researchPanel\{order:3\}/);
 assert.match(html,/body\.crusher-embedded #websiteDirections\{order:4\}/);
 assert.match(html,/body\.crusher-embedded \[hidden\]\{display:none!important\}/);
 assert.match(html,/get\('embed'\)==='quanta'/);
 assert.match(html,/type:'quantaphi:crusher-embed-height'/);
 assert.match(html,/window\.parent\.postMessage/);
});
