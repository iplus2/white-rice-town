const {chromium}=require('playwright-core');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs'),assert=require('assert');
fs.mkdirSync('.qa',{recursive:true});
const route=JSON.parse(fs.readFileSync('tests/route.json','utf8'));
function clockSetup(){
  const native=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),pending=new Map();let manual=false,t=0,seq=100000;
  window.requestAnimationFrame=cb=>{const id=++seq;const o={cb,handle:0};pending.set(id,o);if(!manual)o.handle=native(time=>{if(!pending.has(id))return;pending.delete(id);t=time;cb(time);});return id;};
  window.cancelAnimationFrame=id=>{const o=pending.get(id);if(o){if(o.handle)cancel(o.handle);pending.delete(id);}};
  window.qaClock={start(){manual=true;t=performance.now();pending.forEach(o=>{if(o.handle)cancel(o.handle);o.handle=0;});this.tick(.02);},tick(duration){let ms=duration*1000;while(ms>.0000001){const d=Math.min(ms,56);ms-=d;t+=d;const frame=[...pending.values()];pending.clear();frame.forEach(o=>o.cb(t));}},resume(){manual=false;const saved=[...pending.values()];pending.clear();saved.forEach(o=>window.requestAnimationFrame(o.cb));}};
}
(async()=>{
 const b=await chromium.launch({channel: 'chrome',headless:true,args:['--no-first-run','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 try{
 const ctx=await b.newContext({offline:true,viewport:{width:880,height:555},deviceScaleFactor:1});const p=await ctx.newPage(),errors=[],net=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,360));});p.on('request',r=>{if(/^https?:/.test(r.url()))net.push(r.url());});
 await p.addInitScript(clockSetup);
 const fileurl=pathToFileURL(path.resolve('白饭小镇.html')).href;await p.goto(fileurl);await p.waitForSelector('#cover:not([hidden])',{timeout:120000});await p.waitForSelector('#loading[hidden]',{state:'attached'});assert.equal(await p.title(),'白饭小镇 · White Rice Town');assert.equal(await p.evaluate(()=>typeof window.bellQA),'undefined');
 await p.click('#coverModel');await p.waitForSelector('#inspect:not([hidden])');assert.equal(await p.isVisible('#replay'),false);await p.click('[data-angle="-1.5708"]');await p.click('[data-angle="3.14159"]');await p.click('[data-angle="0"]');await p.click('#inspectX');await p.waitForSelector('#cover:not([hidden])');assert.equal(await p.locator('#count').textContent(),'0');assert.equal(await p.locator('#startText').textContent(),'进入小镇');
 await p.click('#gearButton');await p.click('[data-quality="low"]');await p.click('#settingsX');await p.click('#start');await p.waitForTimeout(100);await p.evaluate(()=>qaClock.start());
 const result=[];
 for(let k=0;k<route.length;k++){
   const r=await p.evaluate(({nodes,look,k:kind})=>{
     const state=()=>{window.dispatchEvent(new Event('pagehide'));return JSON.parse(localStorage.getItem('bellwater.original-town.1'));},press=(code,type)=>document.dispatchEvent(new KeyboardEvent(type,{bubbles:true,cancelable:true,code}));
     const hold=(code,seconds)=>{if(seconds<.00001)return;press(code,'keydown');qaClock.tick(seconds);press(code,'keyup');};
     function yaw(a){let curr=state().p.yaw;const diff=Math.atan2(Math.sin(a-curr),Math.cos(a-curr));hold(diff>0?'ArrowLeft':'ArrowRight',Math.abs(diff)/1.65);}
     function pitch(a){let curr=state().p.pitch;const d=a-curr;hold(d>0?'PageUp':'PageDown',Math.abs(d)/1.2);}
     let maxError=0;for(const [x,z] of nodes){let pl=state().p,dx=x-pl.x,dz=z-pl.z,dist=Math.hypot(dx,dz);if(dist<.004)continue;yaw(Math.atan2(-dx,-dz));hold('KeyW',dist/3.14);pl=state().p;let off=Math.hypot(x-pl.x,z-pl.z);maxError=Math.max(off,maxError);if(off>.14)throw Error('physical movement blocked at '+JSON.stringify({x,z,pl,off}));}
     yaw(look[0]);pitch(look[1]);qaClock.tick(.065);const verb=document.getElementById('verb').textContent,sub=document.getElementById('subverb').textContent,prompt=!document.getElementById('prompt').hidden;
     if(!prompt)throw Error('No prompt near '+kind+' '+JSON.stringify(state().p));press('KeyE','keydown');press('KeyE','keyup');qaClock.tick(.08);
     return {verb,sub,maxError,count:+document.getElementById('count').textContent,state:state(),cinema:!document.getElementById('cinema').hidden};
   },route[k]);
   if(route[k].k==='gift')assert(r.state.found.includes(route[k].i));else if(route[k].k==='ladder')assert.equal(r.state.p.upper,!route[k].upper);else if(k===0)assert(!r.state.summoned);
   result.push([route[k].k,route[k].i,r.count,+r.maxError.toFixed(3)]);console.log(JSON.stringify(result.at(-1)));
   if(k===8){await p.evaluate(()=>qaClock.resume());await p.reload();await p.waitForSelector('#loading[hidden]',{state:'attached',timeout:120000});await p.click('#start');await p.waitForTimeout(100);await p.evaluate(()=>qaClock.start());}
 }
 assert.equal(result.at(-1)[2],10);assert(await p.isVisible('#cinema'));await p.evaluate(()=>qaClock.tick(8.5));assert(await p.isVisible('#hud'));
 await p.evaluate(()=>qaClock.resume());await p.reload();await p.waitForSelector('#loading[hidden]',{state:'attached',timeout:120000});await p.click('#start');await p.waitForTimeout(200);assert.equal(await p.locator('#count').textContent(),'10');
 await p.keyboard.down('w');await p.waitForTimeout(920);await p.keyboard.up('w');await p.keyboard.press('e');await p.waitForSelector('#inspect:not([hidden])',{timeout:6000});await p.setViewportSize({width:1264,height:784});await p.waitForTimeout(440);await p.screenshot({path:'.qa/final-maiden-front.png'});await p.click('[data-angle="-1.5708"]');await p.waitForTimeout(490);await p.screenshot({path:'.qa/final-maiden-side.png'});await p.click('[data-angle="3.14159"]');await p.waitForTimeout(475);await p.screenshot({path:'.qa/final-maiden-back.png'});await p.click('[data-angle="0"]');await p.click('#closer');await p.click('#farther');await p.click('#replay');await p.waitForSelector('#cinema:not([hidden])');await p.keyboard.press('Space');await p.waitForSelector('#hud:not([hidden])');
 await p.keyboard.press('Tab');await p.click('#pauseSettings');await p.click('#resetSave');assert.equal(await p.locator('#count').textContent(),'10');await p.click('#resetSave');await p.waitForSelector('#cover:not([hidden])');assert.equal(await p.locator('#count').textContent(),'0');
 assert.equal(errors.length,0);assert.equal(net.length,0);console.log('Release desktop pass',JSON.stringify({result,errors,net}));
 await ctx.close();
 const phone=await b.newContext({offline:true,viewport:{width:804,height:393},deviceScaleFactor:1,hasTouch:true,isMobile:true});const m=await phone.newPage();m.on('pageerror',e=>errors.push(e.message));await m.goto(fileurl);await m.waitForSelector('#loading[hidden]',{state:'attached',timeout:120000});await m.tap('#start');assert(await m.locator('#touch').isVisible());
 const before=await m.evaluate(()=>JSON.parse(localStorage.getItem('bellwater.original-town.1')).p);const jb=await m.locator('#joystick').boundingBox();const cdp=await phone.newCDPSession(m);
 const touches=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 await touches('touchStart',[{x:jb.x+jb.width/2,y:jb.y+jb.height/2,id:1}]);await touches('touchMove',[{x:jb.x+jb.width/2+12,y:jb.y+jb.height/2-29,id:1}]);await m.waitForTimeout(520);await touches('touchEnd',[]);
 await m.tap('#touchPause');const after=await m.evaluate(()=>JSON.parse(localStorage.getItem('bellwater.original-town.1')).p);assert(Math.hypot(after.x-before.x,after.z-before.z)>.25);await m.tap('#pauseMap');await m.waitForSelector('#atlasPane:not([hidden])');await m.screenshot({path:'.qa/release-map-mobile.png'});await m.tap('#mapX');await m.tap('#resume');
 await m.setViewportSize({width:390,height:844});await m.tap('#hudMap');await m.waitForSelector('#atlasPane:not([hidden])');assert(await m.locator('#mapX').isVisible());assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth),390);
 await m.screenshot({path:'.qa/release-map-portrait.png'});console.log('Touch controls and map pass',before,after);
 assert.equal(errors.length,0);await phone.close();
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
