const {chromium}=require('playwright-core');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch({channel: 'chrome',headless:true,args:[]});
try{const p=await b.newPage({viewport:{width:800,height:500}});await p.goto(pathToFileURL(path.resolve('.qa/game.html')).href);await p.waitForFunction(()=>window.bellQA?.ready,{},{timeout:120000});await p.click('#start');const plan=await p.evaluate(()=>{
 const out=[];function pathTo(g,k,i=0,use=true){
   const a=bellQA.walkTo(g,k,i);if(!a.pass)throw Error(JSON.stringify(a));const raw=bellQA.lastPath,nodes=[];let dx,dz;for(let j=1;j<raw.length;j++){let nx=Math.sign(Math.round((raw[j][0]-raw[j-1][0])*100)),nz=Math.sign(Math.round((raw[j][1]-raw[j-1][1])*100));if(nx!==dx||nz!==dz){if(j>1)nodes.push(raw[j-1]);dx=nx;dz=nz;}}nodes.push(raw.at(-1));out.push({g,k,i,nodes,look:[a.p.yaw,a.p.pitch],upper:a.p.upper,length:a.length});if(use)bellQA.collect();
 }
 pathTo({x:0,y:1.55,z:0,range:4.1,min:3.4},'fountain');
 for(const i of [0,1,8,3,4,2,5,6,7,9]){if(i===4)pathTo({x:-12.25,y:1.49,z:-15.15,range:1.55,min:.35},'ladder');pathTo({...bellQA.gifts[i],range:1.48,min:.72},'gift',i);if(i===4)pathTo({x:-12.25,y:13.49,z:-15.15,range:1.55,min:.35},'ladder');}
 pathTo({x:0,y:1.55,z:0,range:4.1,min:3.4},'fountain',0,false);return out;
});fs.writeFileSync('tests/route.json',JSON.stringify(plan));console.log(plan.map(p=>[p.k,p.i,p.nodes.length]));}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
