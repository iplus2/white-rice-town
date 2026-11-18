let mode='loading',mapReturn='title',settingsReturn='title',chosenClue=-1,toastTimer=0,resetArmed=false,regionName='';
let hasTouch=matchMedia('(pointer: coarse)').matches,settings={quality:'auto',sensitivity:1,volume:.55};
let player={x:2.85,z:12.35,yaw:.232,pitch:.086,upper:false},collected=new Set(),summoned=false,played=false,startTime=0;
const saveKey='bellwater.original-town.1',prefKey='bellwater.preferences.1';
function readStore(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}}
function save(){try{localStorage.setItem(saveKey,JSON.stringify({found:[...collected],summoned,played,p:player}));}catch{}}
function writePrefs(){try{localStorage.setItem(prefKey,JSON.stringify(settings));}catch{}}
function loadState(){const s=readStore(saveKey),p=readStore(prefKey);
  if(p){if(['low','auto','high'].includes(p.quality))settings.quality=p.quality;if(Number.isFinite(p.volume))settings.volume=clamp(p.volume,0,1);if(Number.isFinite(p.sensitivity))settings.sensitivity=clamp(p.sensitivity,.45,1.8);}
  if(s){collected=new Set((Array.isArray(s.found)?s.found:[]).filter(i=>Number.isInteger(i)&&i>=0&&i<10));summoned=!!s.summoned&&collected.size===10;played=!!s.played;
    if(s.p&&['x','z','yaw','pitch'].every(k=>Number.isFinite(s.p[k]))&&s.p.x>=-34&&s.p.x<=52&&s.p.z>=-36.5&&s.p.z<=32.6)player={x:s.p.x,z:s.p.z,yaw:s.p.yaw,pitch:clamp(s.p.pitch,-1.28,1.28),upper:!!s.p.upper};
  }
}
function drawIcon(canvas,type){let d=144;canvas.width=canvas.height=d;let c=canvas.getContext('2d');c.scale(3,3);c.lineCap='round';c.lineJoin='round';c.strokeStyle='#e6cd94';c.fillStyle='#e6cd94';c.lineWidth=1.55;
  const line=(p)=>{c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.stroke();};
  const arc=(x,y,r,a,b)=>{c.beginPath();c.arc(x,y,r,a,b);c.stroke();};
  if(type==='crest'){
    c.lineWidth=.95;arc(24,24,19.1,-1.36,1.17);arc(24,24,19.1,1.96,4.48);arc(24,24,16,-1.19,.66);arc(24,24,16,2.53,4.29);
    for(let i=0;i<4;i++){c.save();c.translate(24,24);c.rotate(i*PI/2);line([[-1.7,-19.7],[0,-23],[1.7,-19.7]]);c.restore();}
    c.lineWidth=1.38;line([[11,28],[15,26],[19,28],[24,25.5],[29,28],[33,26],[37,28]]);line([[15.5,32],[19,33],[24,31],[29,33],[32.5,32]]);
    c.beginPath();c.moveTo(15,22.4);c.bezierCurveTo(17,17,23.5,15.7,27,17.5);c.bezierCurveTo(29.2,18.3,32,15.6,32.8,13.9);c.bezierCurveTo(34,17.1,33.4,20.4,30.7,21.8);c.bezierCurveTo(28.2,23.4,26.9,25,23.5,24.7);c.bezierCurveTo(18.3,24.3,17.5,23.0,15,22.4);c.closePath();c.stroke();arc(19.7,20.7,.65,0,TAU);line([[24.6,15.7],[24.2,12.8],[22.6,11.3]]);line([[25.2,15.5],[26.2,12.7],[28.3,11.9]]);
  }else if(type==='bowl'){c.lineWidth=1.9;c.beginPath();c.moveTo(6,23);c.quadraticCurveTo(8,37,23.8,37.8);c.quadraticCurveTo(39,37,42,23);c.closePath();c.stroke();line([[18,40],[30,40]]);c.beginPath();c.moveTo(9,22);c.quadraticCurveTo(11,15,16,16);c.quadraticCurveTo(18,9,24,13.2);c.quadraticCurveTo(30,10,33,16);c.quadraticCurveTo(37,15,39,21);c.stroke();line([[13,27],[16,28.6]]);line([[20,29],[24,30]]);line([[28,29.4],[33,28]]);}
  else if(type==='gear'){c.lineWidth=2.7;c.beginPath();for(let i=0;i<32;i++){let a=TAU*i/32,rr=i%4===0||i%4===3?17:13.6;let x=24+rr*Math.cos(a),y=24+rr*Math.sin(a);if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();c.stroke();arc(24,24,6.2,0,TAU);}
  else{c.lineWidth=2.4;line([[7,20],[14,20],[23,13],[23,35],[14,28],[7,28],[7,20]]);if(settings.volume>0){arc(23,24,9,-1.02,1.02);arc(23,24,15,-1.00,1.00);}else{line([[29,19],[39,29]]);line([[39,19],[29,29]]);}}
}
function refreshIcons(){document.querySelectorAll('[data-icon]').forEach(c=>drawIcon(c,c.dataset.icon));}
function toast(msg,ms=2300){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),ms);}
function updateProgress(){riceNodes.forEach((n,i)=>n.visible=!collected.has(i));$('count').textContent=collected.size;$('startText').textContent=played?'继续漫游':'进入小镇';$('mapProgress').textContent='大白饭　'+collected.size+' / 10';}
function setMode(next){
  mode=next;$('cover').hidden=next!=='title';$('corner').hidden=next!=='title';$('hud').hidden=next!=='play';$('cinema').hidden=next!=='cinema';$('inspect').hidden=next!=='inspect';
  $('modal').hidden=!['pause','map','settings'].includes(next);$('pausePane').hidden=next!=='pause';$('settingsPane').hidden=next!=='settings';$('atlasPane').hidden=next!=='map';
  if(next!=='play'){clearKeys();if(next!=='cinema'&&document.pointerLockElement===canvas)document.exitPointerLock();$('prompt').hidden=true;}
  if(next==='play'){$('touch').hidden=!hasTouch;startTime=performance.now();target=null;}
}
function openMap(){if(!['play','title','pause'].includes(mode))return;mapReturn=mode;setMode('map');chosenClue=-1;const wrap=$('clues');wrap.replaceChildren();
  gifts.forEach((g,i)=>{let d=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');if(collected.has(i))d.classList.add('done');summary.textContent=g.name;p.textContent=g.hint;d.append(summary,p);wrap.append(d);d.addEventListener('toggle',()=>{if(d.open){wrap.querySelectorAll('details').forEach(e=>{if(e!==d)e.open=false;});chosenClue=i;}else if(chosenClue===i)chosenClue=-1;drawAtlas();});});
  updateProgress();requestAnimationFrame(drawAtlas);
}
function closeMap(){if(mapReturn==='play')enterPlay();else setMode(mapReturn);}
function openSettings(){settingsReturn=mode;setMode('settings');resetArmed=false;$('resetSave').textContent='重新开始收集';$('sens').value=Math.round(settings.sensitivity*100);$('volume').value=Math.round(settings.volume*100);document.querySelectorAll('[data-quality]').forEach(b=>b.classList.toggle('on',b.dataset.quality===settings.quality));}
function closeSettings(){setMode(settingsReturn);}
function compassDraw(){
  const c=$('compass').getContext('2d');c.clearRect(0,0,580,72);const head=(((-player.yaw/DEG)%360)+360)%360;const steps=['北','NE','东','SE','南','SW','西','NW'];c.textAlign='center';c.lineWidth=1.5;
  for(let j=Math.floor((head-48)/5)*5;j<=head+48;j+=5){const x=290+(j-head)*6,deg=(j%360+360)%360,k=deg%45===0,cen=1-Math.pow(Math.abs(j-head)/52,2);c.globalAlpha=clamp(cen,.05,1);c.strokeStyle='#ffedc7';c.beginPath();c.moveTo(x,17);c.lineTo(x,k?29:deg%15===0?26:22);c.stroke();if(k){c.fillStyle='#fff2ce';c.font='600 18px "PingFang SC",sans-serif';c.fillText(steps[Math.round(deg/45)%8],x,50);}}
  c.globalAlpha=1;c.fillStyle='#f2d095';c.beginPath();c.moveTo(284,6);c.lineTo(296,6);c.lineTo(290,13);c.fill();
}
function drawAtlas(){
  if(mode!=='map')return;const canv=$('atlasCanvas'),b=canv.getBoundingClientRect(),W=b.width,H=b.height;if(W<10||H<10)return;let dx=Math.min(devicePixelRatio,2);canv.width=Math.round(W*dx);canv.height=Math.round(H*dx);let c=canv.getContext('2d');c.scale(dx,dx);
  const ox=8.5,oz=-2,k=Math.min((W-24)/99,(H-28)/83),px=x=>W/2+(x-ox)*k,pz=z=>H/2+(z-oz)*k;
  c.fillStyle='#eae1c9';c.fillRect(0,0,W,H);const rnd=rng32(736);for(let i=0;i<2100;i++){c.fillStyle=i%2?'#816e5020':'#fff8db3a';c.fillRect(rnd()*W,rnd()*H,1.3,.9);}
  function linepts(pts,ink,weight=1){c.strokeStyle=ink;c.lineWidth=weight;c.beginPath();pts.forEach(([x,z],i)=>{if(i)c.lineTo(px(x),pz(z));else c.moveTo(px(x),pz(z));});c.stroke();}
  function path(r,style,stroke=false){c.beginPath();r.forEach(([x,z],i)=>{if(i)c.lineTo(px(x),pz(z));else c.moveTo(px(x),pz(z));});c.closePath();if(stroke){c.strokeStyle=style;c.stroke();}else{c.fillStyle=style;c.fill();}}
  for(let i=0;i<5;i++){let y=i*15-35;linepts([[-42,y],[-30,y+4],[-23,y+3]],'#c4b89472',.8);linepts([[50,y],[56,y-3],[61,y-.6]],'#c4b89472',.8);}
  const ripx=[22,14,14,14,14,9],ripy=[-80,-39,-18,8,35,76],east=[26,30,30,30,30,24];let polypts=[];ripx.forEach((x,i)=>polypts.push([x,ripy[i]]));for(let i=ripx.length-1;i>=0;i--)polypts.push([east[i],ripy[i]]);path(polypts,'#94b4aa');
  linepts(ripx.map((x,i)=>[x,ripy[i]]),'#607e75',1);linepts(east.map((x,i)=>[x,ripy[i]]),'#607e75',1);
  for(let i=0;i<115;i++){const x=15+rnd()*13,z=rnd()*82-44;linepts([[x,z],[x+.08,z+1.3],[x-.06,z+2.8]],'#e0e8d188',.8);}
  for(const [x,z,a,b] of [[-12,0,26,0],[-7,-30,-7,25],[6,-35,7,31],[-23,-28,-23,24],[36,-30,36,27],[-31,17,12,17]])linepts([[x,z],[a,b]],'#f7efd9',Math.max(3,k*.8));
  c.strokeStyle='#9d92775c';c.lineWidth=.8;c.setLineDash([2,2]);for(const a of [[[-35,-37],[13,-37]],[[-35,-37],[-35,33]],[[-35,33],[13,33]],[[31,33],[52,33],[52,-37],[31,-37]]])linepts(a,'#9d92776e',.8);c.setLineDash([]);
  const drawRect=(x,z,w,d,a,fill,hip=true)=>{c.save();c.translate(px(x),pz(z));c.rotate(-a);const X=w*k/2,Z=d*k/2,ri=Math.min(X*.65,Z*.5);
    c.fillStyle='#6d604f36';c.fillRect(-X+1.8,-Z+2.2,w*k,d*k);c.fillStyle=fill;c.strokeStyle='#796c55';c.lineWidth=.8;c.fillRect(-X,-Z,w*k,d*k);c.strokeRect(-X,-Z,w*k,d*k);
    if(hip){c.fillStyle='#fff2c537';c.beginPath();c.moveTo(-X,-Z);c.lineTo(X,-Z);c.lineTo(X-ri,0);c.lineTo(-X+ri,0);c.closePath();c.fill();c.fillStyle='#755b4124';c.beginPath();c.moveTo(-X,Z);c.lineTo(X,Z);c.lineTo(X-ri,0);c.lineTo(-X+ri,0);c.fill();
      c.strokeStyle='#816e577d';c.lineWidth=.65;c.beginPath();c.moveTo(-X,-Z);c.lineTo(-X+ri,0);c.lineTo(-X,Z);c.moveTo(X,-Z);c.lineTo(X-ri,0);c.lineTo(X,Z);c.moveTo(-X+ri,0);c.lineTo(X-ri,0);c.stroke();
      c.strokeStyle='#eee2bb73';c.lineWidth=.5;c.beginPath();for(let u=-X+ri+2;u<X-ri-1;u+=Math.max(3,k*.75)){c.moveTo(u,-Z+1);c.lineTo(u,-1);}c.stroke();}
    c.restore();};
  HOUSELOTS.forEach(o=>drawRect(o.x,o.z,o.w,o.d,o.a,['#bd9d7b','#b19982','#a9ae94','#c6a384'][o.style%4]));
  const art=(x,z,fac,draw)=>{c.save();c.translate(px(x),pz(z));const s=clamp(k*.162,.6,1.38)*fac;c.scale(s,s);c.strokeStyle='#655d47';c.lineWidth=1.05;c.lineJoin='round';c.lineCap='round';draw();c.restore();};
  const silhouette=(pts,fill,stroke=true)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke)c.stroke();};
  treeList.forEach(([x,z,s,t])=>{art(x,z,s,()=>{if(t==='cypress'){silhouette([[-2.7,2.5],[-2.3,-1.2],[0,-7],[2,-2],[2.65,2],[.8,3.2]],'#899775');}else{c.fillStyle='#a5b18e';c.beginPath();c.moveTo(-4.9,.8);c.bezierCurveTo(-6,-1,-4.3,-3.4,-2.8,-3.4);c.bezierCurveTo(-2.5,-7,1,-7,2.8,-4.5);c.bezierCurveTo(6,-4.4,6.8,.9,3.6,2);c.quadraticCurveTo(0,4,-4.9,.8);c.fill();c.stroke();}c.beginPath();c.moveTo(0,1);c.lineTo(0,4);c.stroke();});});
  interiors.forEach(o=>drawRect(o.x,o.z,o.w,o.d,0,'#c9b394'));
  art(-10.6,-13.8,1.16,()=>{silhouette([[-5,6],[5,6],[4,-9],[-4,-9]],'#e3cd9d');silhouette([[-5.7,-8.4],[5.7,-8.4],[4.5,-10.1],[-4.6,-10.1]],'#a78f65');silhouette([[-3.8,-10.2],[3.8,-10.2],[3.6,-14.5],[-3.6,-14.5]],'#dec89c');c.fillStyle='#677f72';c.fillRect(-2.3,-14.0,4.6,3.7);silhouette([[-5,-14.7],[5,-14.7],[1.9,-18.8],[.2,-22],[-1.7,-18.8]],'#7e9885');c.fillStyle='#6a7059';c.beginPath();c.arc(0,-4.6,2.7,0,TAU);c.fill();c.strokeStyle='#f0d39c';c.lineWidth=.8;c.beginPath();c.moveTo(-1,-5.9);c.lineTo(0,-4.6);c.lineTo(1.4,-5.1);c.stroke();});
  art(1.5,-15,1.0,()=>{silhouette([[-15,4.6],[14,4.6],[14,-3.7],[-15,-3.7]],'#ddc6a0');silhouette([[-17,-4.4],[0,-12.4],[16,-4.4]],'#c6a579');c.fillStyle='#826f56';c.fillRect(-3.2,-3.2,6.4,7.6);for(const x of [-12,-7,7,12]){c.beginPath();c.moveTo(x,-3.2);c.lineTo(x,3.7);c.stroke();}c.fillStyle='#99a594';c.beginPath();c.arc(0,-7.5,1.55,0,TAU);c.fill();});
  art(35,-9,1.0,()=>{silhouette([[-9,4],[10,4],[10,-4],[2,-9],[-9,-4]],'#dfc49a');silhouette([[-11,-4],[1,-11],[12,-4],[9,-3],[1,-8.5],[-8,-3]],'#b88e66');c.fillStyle='#9e8563';c.beginPath();c.arc(-7,2,5.8,0,TAU);c.stroke();c.beginPath();c.arc(-7,2,4.8,0,TAU);c.stroke();for(let i=0;i<8;i++){const a=i*PI/4;c.beginPath();c.moveTo(-7,2);c.lineTo(-7+5.7*Math.cos(a),2+5.7*Math.sin(a));c.stroke();}});
  drawRect(22,3.8,19.3,4.7,0,'#d9c69e',false);for(let x=13.1;x<31.2;x+=1.15){linepts([[x,1.60],[x,2.25]],'#8b7855',.65);linepts([[x,5.40],[x,5.98]],'#8b7855',.65);}
  linepts([[28.1,14.7],[28.1,20.7]],'#a18767',Math.max(3,k*1.15));linepts([[28.1,15.4],[30.7,15.4]],'#ad9675',Math.max(2,k*.7));
  for(const [x,z] of [[26.4,17.7],[16.1,-15.1]])art(x,z,.7,()=>{silhouette([[0,-7],[2.4,-3],[2.8,1],[1.4,5.7],[0,7],[-2.2,4],[-2.8,-1],[-2,-4]],'#c19f75');c.beginPath();c.moveTo(-1.8,-2);c.lineTo(2,-2);c.moveTo(-2,2);c.lineTo(1.8,2);c.stroke();});
  c.strokeStyle='#918569';c.lineWidth=1;for(const r of [4.9,3.1,2.15]){c.beginPath();c.arc(px(0),pz(0),r*k,0,TAU);if(r===2.15){c.fillStyle='#a1b5a4';c.fill();}c.stroke();}
  art(0,0,1,()=>{silhouette([[-2.6,1.8],[2.6,1.8],[2,0],[.7,-.7],[.5,-4],[3,-5.1],[2.6,-5.8],[-2.6,-5.8],[-3,-5.1],[-.5,-4],[-.7,-.7],[-2,0]],'#cfbb88');});
  const label=(s,x,z,small=false)=>{c.save();c.textAlign='center';c.textBaseline='middle';c.lineWidth=3.6;c.strokeStyle='#eee6cfd9';c.fillStyle=small?'#5a6f65':'#314e42';c.font='600 '+clamp(k*(small?1.65:1.92),small?9:10,15)+'px "Songti SC","SimSun",serif';c.strokeText(s,px(x),pz(z));c.fillText(s,px(x),pz(z));c.restore();};
  label('守潮钟楼',-13.8,-21.5);label('潮汐档案馆',2.8,-23.1);label('中央泉庭',0,7.3);label('东岸水磨坊',36,-15.8);label('白饭桥',22,.05,true);label('红帆食铺',-16.6,11,true);label('染坊后院',-25,1,true);label('橘园',44,21,true);
  if(chosenClue>=0){const obj=gifts[chosenClue],x=px(Math.round(obj.x/3)*3),y=pz(Math.round(obj.z/3)*3);c.beginPath();c.arc(x,y,3*k,0,TAU);c.fillStyle='#ca914c46';c.fill();c.lineWidth=1.5;c.setLineDash([3,3]);c.strokeStyle='#aa7b36';c.stroke();c.setLineDash([]);}
  const x=px(player.x),z=pz(player.z);c.save();c.translate(x,z);c.rotate(-player.yaw);c.beginPath();c.moveTo(0,-7.6);c.lineTo(4.5,5);c.lineTo(0,3.1);c.lineTo(-4.5,5);c.closePath();c.fillStyle='#234f50';c.strokeStyle='#fff6d6';c.lineWidth=2.6;c.stroke();c.fill();c.restore();
  const cx=21,cy=27;c.fillStyle='#5c7166';c.font='10px Georgia';c.textAlign='center';c.fillText('N',cx,cy-10);c.beginPath();c.moveTo(cx,cy-6);c.lineTo(cx+4,cy+10);c.lineTo(cx,cy+6);c.lineTo(cx-4,cy+10);c.closePath();c.fill();
  c.textAlign='left';c.font='11px "PingFang SC",sans-serif';c.fillStyle='#476458';c.fillText('▲ 你的位置',13,H-12);
}
