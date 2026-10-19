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
test('Quanta embeds the slot first, compact music second, then evidence and directions',()=>{
 assert.match(html,/body\.crusher-embedded \.spinner-panel\{order:1\}/);
 assert.match(html,/body\.crusher-embedded \.hotstepper-panel\{order:2\}/);
 assert.match(html,/body\.crusher-embedded \.research-entry\{order:3\}/);
 assert.match(html,/body\.crusher-embedded #researchPanel\{order:4\}/);
 assert.match(html,/body\.crusher-embedded #websiteDirections\{order:5\}/);
 assert.match(html,/body\.crusher-embedded \[hidden\]\{display:none!important\}/);
 assert.doesNotMatch(html,/\.oracle-intro,\.hotstepper-panel,/);
 assert.match(html,/get\('embed'\)==='quanta'/);
 assert.match(html,/type:'quantaphi:crusher-embed-height'/);
 assert.match(html,/window\.parent\.postMessage/);
});
test('jukebox offers Hotstepper, TOOL and Bob Ross/Picasso with repeat choices',()=>{
 assert.match(html,/id="musicDeck"/);
 assert.match(html,/id="crusherMusicFrame"/);
 assert.match(html,/id="crusher-jukebox"/);
 for(const name of ['hotstepper','aenema','battle']) {
   assert.match(html,new RegExp('data-music-track="'+name+'"'));
 }
 for(const mode of ['songs','all','one']) {
   assert.match(html,new RegExp('data-music-mode="'+mode+'"'));
 }
 for(const id of ['15UffN8eilI','rHcmnowjfrQ','WGN5xaQkFk0']) {
   assert.ok(html.includes(id),'missing video '+id);
 }
 assert.match(html,/youtube-nocookie\.com\/embed/);
 assert.match(html,/loop=1&playlist=/);
});
