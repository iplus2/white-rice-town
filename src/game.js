const keys=new Set();let target=null,locked=false,drag=false,dxLast=0,dyLast=0,stickX=0,stickY=0,stickID=null,dragID=null;
let eyeY=1.69,footTravel=0,bob=0,stride=0,saveCountdown=0,aimElapsed=0,compassTimer=0,ambientTimer=0,horizonStep,architectureStep,cinemaStart=0,visualTime=0,engineReady=false,frameIndex=0,baseDpr=1,autoPixel=1.35,qualityFrames=0,qualityTime=0,wallCount=0,fadeTimer=0;
const eyeDir=new T.Vector3(),lookDir=new T.Vector3(),tempV=new T.Vector3();let lastTime=0,rafID=0;
function clearKeys(){keys.clear();stickX=stickY=0;drag=false;dragID=null;stickID=null;if($('stick'))$('stick').style.transform='';}
function feet(){return player.upper?12:localHeight(player.x,player.z);}
function district(){
  if(player.upper)return '钟楼眺台';if(dockArea(player.x,player.z)&&player.x<30.1)return '系舟浮码头';for(const h of interiors)if(Math.abs(player.x-h.x)<h.w/2-.07&&Math.abs(player.z-h.z)<h.d/2-.05)return h.name;
  if(player.x>=13.55&&player.x<=30.45&&Math.abs(player.z-bridgeZ)<2.45)return '白饭桥';
  if(player.x>30){if(player.z>12&&player.z<21&&player.x>38.7)return '东岸橘园';if(player.x<35&&player.z>8.5)return '系舟码头';return '水磨东街';}
  if(player.x<-20&&player.z>0&&player.z<13)return '染坊后院';if(player.x<-10&&player.z>-.4&&player.z<10)return '红帆食铺';if(player.x>9.9)return '西岸河堤';
  if(player.z<-20||player.x<-15)return '钟匠巷';if(player.z>14.7)return '南门街';return '中央泉庭';
}
function hitsRect(o,x,z,r){
  const ax=x-o.x,az=z-o.z,lx=ax*o.ca-az*o.sa,lz=ax*o.sa+az*o.ca;
  const qx=Math.max(0,Math.abs(lx)-o.hw),qz=Math.max(0,Math.abs(lz)-o.hd);return qx*qx+qz*qz<r*r;
}
function blocked(x,z){
  const r=.272,y=player.upper?12.12:.14;
  if(player.upper){if(x<-13.04||x>-8.15||z<-16.50||z>-11.09)return true;}
  else{
    if(x<-33.8||x>51.55||z<-36.45||z>32.45)return true;
    if(x>13.52&&x<30.48&&Math.abs(z-bridgeZ)>1.86&&!dockArea(x,z))return true;
    if(x>12.19&&x<31.79&&Math.abs(z-bridgeZ)>1.855&&Math.abs(z-bridgeZ)<2.78)return true;
  }
  for(const o of solids){if(y<o.y0||y>o.y1)continue;if(hitsRect(o,x,z,r))return true;}
  for(const o of rounds){if(y>=o.y0&&y<=o.y1&&(x-o.x)**2+(z-o.z)**2<(o.r+r)**2)return true;}return false;
}
function moveBy(dx,dz){
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));let moved=0;
  for(let j=0;j<n;j++){const a=player.x,b=player.z;if(!blocked(a+dx/n,b))player.x=a+dx/n;if(!blocked(player.x,b+dz/n))player.z=b+dz/n;moved+=Math.hypot(player.x-a,player.z-b);}return moved;
}
function viewPlayer(dt=1){
  const floor=feet(),base=floor+1.69;eyeY=mix(eyeY,base,1-Math.exp(-dt*19));
  camera.position.set(player.x,eyeY+bob,player.z);camera.rotation.order='YXZ';camera.rotation.set(player.pitch,player.yaw,0,'YXZ');
}
function sightBlocked(a,b){
  const dist=Math.hypot(b.x-a.x,b.z-a.z),n=Math.ceil(dist/.25);
  for(let i=1;i<n;i++){const t=i/n,x=mix(a.x,b.x,t),z=mix(a.z,b.z,t),y=mix(a.y,b.y,t);
    for(let k=0;k<wallCount;k++){const o=solids[k];if(y>=o.y0&&y<=o.y1&&hitsRect(o,x,z,.025))return true;}
  }return false;
}
function findTarget(){
  let best=null,score=-100;camera.getWorldDirection(eyeDir);const p=camera.position;
  function candidate(kind,id,x,y,z,max,label,hint='',los=false){
    tempV.set(x-p.x,y-p.y,z-p.z);const d=tempV.length(),hd=Math.hypot(tempV.x,tempV.z);if(d>max||(!hd&&d<.01))return;
    const dot=tempV.normalize().dot(eyeDir),hs=(-Math.sin(player.yaw)*(x-p.x)-Math.cos(player.yaw)*(z-p.z))/Math.max(.001,hd);
    const wide=kind==='gift'&&d<1.67&&hs>.11&&player.pitch<.24;
    if(dot<(kind==='fountain'?.48:.69)&&!wide)return;
    const value=(kind==='gift'?4:kind==='ladder'?2:0)+dot-d*.14;if(value<=score)return;
    if(los&&sightBlocked(p,{x,y,z}))return;score=value;best={kind,id,label,hint};
  }
  gifts.forEach((g,i)=>{if(collected.has(i)||Math.abs(g.y-feet())>2.1)return;candidate('gift',i,g.x,g.y+.24,g.z,2.42,'收起这碗大白饭',g.name,true);});
  if(Math.abs(player.x+10.6)<2.52&&Math.abs(player.z+13.8)<2.87)
    candidate('ladder',0,-12.25,feet()+1.49,-15.15,2.45,player.upper?'沿梯子下楼':'攀上钟楼眺台','守潮钟楼');
  if(!player.upper&&Math.hypot(player.x,player.z)<4.95){
    candidate('fountain',0,0,summoned?2.66:1.55,summoned?1.84:0,summoned?6.5:5.12,summoned?'端详大肥鱼':collected.size===10?'献上十碗白饭，召唤大肥鱼':'阅读泉铭',summoned?'中央泉庭':collected.size===10?'中央泉庭':'还需 '+(10-collected.size)+' 碗大白饭');
  }
  return best;
}
function updateTarget(){
  target=findTarget();$('prompt').hidden=!target;$('reticle').classList.toggle('active',!!target);if(target){$('verb').textContent=target.label;$('subverb').textContent=target.hint;}
}
function flash(alpha=.65,ms=240){clearTimeout(fadeTimer);$('fade').style.transition='none';$('fade').style.opacity=alpha;void $('fade').offsetHeight;$('fade').style.transition='opacity '+ms+'ms ease';$('fade').style.opacity='0';}
function interact(){
  if(mode!=='play')return;viewPlayer(.12);target=findTarget();if(!target)return;
  if(target.kind==='gift'){if(collected.has(target.id))return;collected.add(target.id);updateProgress();save();townSound.collect(collected.size);toast(collected.size===10?'十碗齐了 · 回中央喷泉召唤大肥鱼':'收到了大白饭　'+collected.size+' / 10',collected.size===10?4100:2100);}
  else if(target.kind==='ladder'){
    player.upper=!player.upper;player.x=-11.80;player.z=-14.12;player.yaw=player.upper?-1.0:-2.92;player.pitch=player.upper?-.05:0;eyeY=feet()+1.69;bob=0;viewPlayer();flash(.92,390);townSound.climb();toast(player.upper?'守潮钟楼 · 眺台':'守潮钟楼 · 一层',1600);save();
  }else if(summoned){inspectMaiden();}else if(collected.size===10){startCeremony();}else{toast('「以十碗白饭为约，泉钟响时，鲸娘赴宴。」',3200);}
  if(mode==='play')updateTarget();
}
function tryLock(){
  if(hasTouch||document.pointerLockElement||!canvas.requestPointerLock)return;
  try{const p=canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{if(mode==='play')$('walktip').textContent='拖动鼠标或用方向键环顾 · E 互动';});}catch{}
}
function enterPlay(){
  const from=mode;setMode('play');played=true;bob=0;eyeY=feet()+1.69;camera.fov=65;camera.updateProjectionMatrix();viewPlayer();resizeGame(false);tryLock();updateProgress();
  if(from==='title'){townSound.welcome();flash(.58,490);}else townSound.init();if(from==='title')save();$('walktip').textContent='WASD 移动 · Shift 快走 · Esc 暂停';
}
function pause(){if(mode!=='play')return;save();setMode('pause');}
function startCeremony(){
  summoned=true;save();townSound.summon();cinemaStart=visualTime;setMode('cinema');offering.visible=true;flash(.79,480);$('cinecaption').querySelector('span').textContent='泉钟，为你而鸣';$('skip').textContent=hasTouch?'跳过演出':'跳过演出 · 空格';
}
function endCeremony(){
  if(mode!=='cinema')return;
  player={x:1.64,z:7.35,yaw:.295,pitch:.125,upper:false};camera.fov=65;camera.updateProjectionMatrix();eyeY=1.69;bob=0;setMode('play');viewPlayer();save();flash(.48,360);toast('鲸鱼娘赴约了　·　可以继续漫游',3500);
}
function ceremonyCamera(s){
  const u=clamp(s/7.7,0,1),a=mix(.63,.27,u*u*(3-2*u)),r=mix(7.55,5.50,Math.min(u*1.35,1)),focus=mix(1.65,2.57,clamp((s-.65)/2.4,0,1));
  camera.position.set(Math.sin(a)*r,2.55+.29*Math.cos(u*PI),1.33+Math.cos(a)*r);camera.lookAt(.13,focus,1.72);camera.fov=48-3*u;camera.updateProjectionMatrix();
  $('cinecaption').querySelector('span').textContent=s<2.4?'泉钟，为你而鸣':s<5.6?'大肥鱼 · 鲸鱼娘':'“饭我收下啦。还有，我是鲸呀！”';
  if(s>=8.0)endCeremony();
}
function titleCamera(t=0){
  const u=t*.035;camera.fov=54;camera.position.set(26.35+.65*Math.sin(u),4.85+.18*Math.cos(u*.7),23.4+.35*Math.sin(u*.8));camera.lookAt(4.25,4.10,-8.35);camera.updateProjectionMatrix();
}
function outerTown(){
  for(const s of [-1,1]){
    const zz=s<0?-37.1:33.15;for(const [x,w] of [[-10.55,48.4],[41.15,22.3]]){box(x,.435,zz,w,.91,.44,M.stone,0xc8bc9e);box(x,.91,zz,w+.10,.12,.55,M.trim,0xddd2b6);for(let xx=x-w/2;xx<=x+w/2;xx+=5){box(xx,.55,zz,.58,1.11,.60,M.stone,0xcdbb99);box(xx,1.14,zz,.67,.12,.69,M.trim,0xe5d4b4);}}
  }for(const x of [-34.45,52.25]){box(x,.49,-2,.46,1.00,70.2,M.stone,0xbdaa8b);box(x,1.02,-2,.56,.12,70.3,M.trim,0xdaccaa);}
  for(const [x,z,w,d] of [[-75,-1,80,220],[91,-1,77,220],[-10,-72,48,69],[-10,69,48,71],[43,-74,24,73],[43,70,25,72]])box(x,-.021,z,w,.055,d,M.plaster,0x95a07c);
  for(const [x,z,w,d,y0,y1] of [[-2.21,-18.72,2.67,.54,-.1,3],[5.12,-18.72,2.56,.54,-.1,3],[-3.58,-14.75,.60,2.13,-.1,3],[-1.14,-14.75,1.45,1.03,-.1,1.6],[4.4,-17.1,1.9,.95,-.1,1],[-9.15,-15.45,1.67,.82,-.1,1],[-9.15,-14.95,1.18,.68,12,13],[32.47,-9.46,2,1.82,-.1,2.6],[32.05,-12.18,1.68,1.12,-.1,1.7],[37.4,-10.9,1.86,.91,-.1,1]])block(x,z,w,d,y0,y1);
}
function attachInput(){
  document.body.classList.toggle('touch',hasTouch);attachExhibit();
  $('start').onclick=enterPlay;$('resume').onclick=enterPlay;$('pauseX').onclick=enterPlay;$('coverModel').onclick=openCatalogue;$('hudMap').onclick=openMap;$('pauseMap').onclick=openMap;$('mapX').onclick=closeMap;
  $('gearButton').onclick=openSettings;$('pauseSettings').onclick=openSettings;$('settingsX').onclick=closeSettings;$('soundButton').onclick=()=>townSound.toggle();$('touchUse').onclick=interact;$('touchPause').onclick=pause;$('skip').onclick=endCeremony;
  $('toTitle').onclick=()=>{save();setMode('title');titleCamera(visualTime);updateProgress();};
  $('quality').onclick=e=>{let q=e.target.dataset.quality;if(!q)return;settings.quality=q;writePrefs();document.querySelectorAll('[data-quality]').forEach(b=>b.classList.toggle('on',b.dataset.quality===q));qualityTime=qualityFrames=0;resizeGame(true);};
  $('sens').oninput=e=>{settings.sensitivity=+e.target.value/100;writePrefs();};
  $('volume').oninput=e=>{settings.volume=+e.target.value/100;townSound.init();townSound.volume();};
  $('resetSave').onclick=()=>{if(!resetArmed){resetArmed=true;$('resetSave').textContent='确认清空十碗饭和召唤进度';return;}
    collected.clear();summoned=false;played=false;player={x:2.85,z:12.35,yaw:.232,pitch:.086,upper:false};offering.visible=false;updateProgress();save();setMode('title');titleCamera(visualTime);toast('新的漫游已经准备好');};
  document.addEventListener('pointerlockchange',()=>{const had=locked;locked=document.pointerLockElement===canvas;if(had&&!locked&&mode==='play')pause();});
  document.addEventListener('mousemove',e=>{if(locked&&mode==='play')look(e.movementX,e.movementY);});
  canvas.addEventListener('pointerdown',e=>{if(mode!=='play'||locked)return;if(e.pointerType==='touch'){hasTouch=true;document.body.classList.add('touch');$('touch').hidden=false;}
    drag=true;dragID=e.pointerId;dxLast=e.clientX;dyLast=e.clientY;try{canvas.setPointerCapture(e.pointerId);}catch{}if(e.pointerType==='mouse')tryLock();});
  canvas.addEventListener('pointermove',e=>{if(!drag||locked||mode!=='play'||e.pointerId!==dragID)return;look(e.clientX-dxLast,e.clientY-dyLast,e.pointerType==='touch'?1.8:1);dxLast=e.clientX;dyLast=e.clientY;});
  canvas.addEventListener('pointerup',()=>{drag=false;dragID=null;});canvas.addEventListener('pointercancel',()=>{drag=false;dragID=null;});
  const joy=$('joystick');function joymove(e){const b=joy.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/33,y=(e.clientY-b.top-b.height/2)/33,l=Math.max(1,Math.hypot(x,y));stickX=x/l;stickY=y/l;$('stick').style.transform='translate('+stickX*28+'px,'+stickY*28+'px)';}
  joy.onpointerdown=e=>{stickID=e.pointerId;joy.setPointerCapture(e.pointerId);joymove(e);};joy.onpointermove=e=>{if(e.pointerId===stickID)joymove(e);};joy.onpointerup=joy.onpointercancel=()=>{stickID=null;stickX=stickY=0;$('stick').style.transform='';};
  document.addEventListener('keydown',e=>{
    if(mode==='loading')return;const code=e.code;
    if(mode==='inspect'){if(['Escape','KeyE','Tab'].includes(code)&&!e.repeat){e.preventDefault();returnFromInspect();}else if(code==='ArrowLeft'||code==='ArrowRight'){e.preventDefault();portrait.yaw+=(code==='ArrowLeft'?-1:1)*.15;}return;}
    if(mode==='cinema'){if(['Space','Escape','KeyE'].includes(code)&&!e.repeat){e.preventDefault();endCeremony();}return;}
    if(mode==='play'){if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Space','Tab','KeyM','KeyE','Escape','ShiftLeft','ShiftRight','KeyQ'].includes(code))e.preventDefault();
      if(!e.repeat&&code==='KeyM'){openMap();return;}if(!e.repeat&&(code==='Escape'||code==='Tab')){pause();return;}if(!e.repeat&&code==='KeyE'){interact();return;}keys.add(code);
    }else if(mode==='map'&&['Escape','KeyM','Tab'].includes(code)){e.preventDefault();closeMap();}
    else if(mode==='pause'&&(code==='Escape'||code==='Tab')){e.preventDefault();enterPlay();}
    else if(mode==='settings'&&code==='Escape'){e.preventDefault();closeSettings();}
    else if(mode==='title'&&code==='KeyM')openMap();
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',()=>{if(mode==='play')pause();else clearKeys();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&engineReady){if(mode==='play')pause();save();}lastTime=0;});
  window.addEventListener('pagehide',()=>{if(engineReady)save();});window.addEventListener('resize',()=>{if(engineReady){resizeGame(false);if(mode==='map')drawAtlas();}});
}
function look(dx,dy,scale=1){player.yaw-=dx*.00215*settings.sensitivity*scale;player.yaw=Math.atan2(Math.sin(player.yaw),Math.cos(player.yaw));player.pitch=clamp(player.pitch-dy*.00205*settings.sensitivity*scale,-1.33,1.27);}
function resizeGame(forceShadow){
  const w=window.innerWidth,h=window.innerHeight,ratio=settings.quality==='low'?.75:settings.quality==='high'?Math.min(hasTouch?1.5:1.85,devicePixelRatio):Math.min(devicePixelRatio,autoPixel);
  baseDpr=ratio;renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);resizeOptics();camera.aspect=w/h;camera.updateProjectionMatrix();
  const rw=settings.quality==='high'?Math.min(960,Math.round(w*.66)):Math.min(680,Math.max(320,Math.round(w*.48)));reflectionTarget.setSize(rw,Math.max(180,Math.round(rw*h/w)));
  riverUniforms.useReflect.value=settings.quality==='low'?0:1;
  if(forceShadow){const sm=settings.quality==='low'?2048:Math.min(renderer.capabilities.maxTextureSize,hasTouch?3072:4096);
    if(sun.shadow.mapSize.x!==sm){sun.shadow.mapSize.set(sm,sm);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}renderer.shadowMap.needsUpdate=true;}
  mirrorTick=99;
}
function tickPlayer(dt){
  if(keys.has('ArrowLeft'))player.yaw+=dt*1.65*settings.sensitivity;if(keys.has('ArrowRight'))player.yaw-=dt*1.65*settings.sensitivity;
  if(keys.has('PageUp'))player.pitch=clamp(player.pitch+dt*1.2,-1.33,1.27);if(keys.has('PageDown'))player.pitch=clamp(player.pitch-dt*1.2,-1.33,1.27);
  let forward=+keys.has('KeyW')-+keys.has('KeyS')+ +keys.has('ArrowUp')- +keys.has('ArrowDown')-stickY,right=+keys.has('KeyD')-+keys.has('KeyA')+stickX,l=Math.max(1,Math.hypot(forward,right));
  forward/=l;right/=l;const fast=keys.has('ShiftLeft')||keys.has('ShiftRight'),sp=(fast?5.35:3.14)*dt;
  const sn=Math.sin(player.yaw),cs=Math.cos(player.yaw),mv=moveBy((right*cs-forward*sn)*sp,(-forward*cs-right*sn)*sp);footTravel+=mv;stride+=mv*(fast?2.9:3.6);
  if(footTravel>(fast?1.48:1.07)){townSound.step(player.upper||interiors.some(h=>Math.abs(player.x-h.x)<h.w/2&&Math.abs(player.z-h.z)<h.d/2),fast);footTravel=0;}
  bob=mix(bob,mv>.001?Math.sin(stride)*.025:0,1-Math.exp(-dt*13));viewPlayer(dt);
  aimElapsed+=dt;if(aimElapsed>.055){aimElapsed=0;updateTarget();const name=district();if(regionName!==name){regionName=name;$('region').textContent=name;}}
  compassTimer+=dt;if(compassTimer>.08){compassTimer=0;compassDraw();}
  if(performance.now()-startTime>13500)$('walktip').hidden=true;else $('walktip').hidden=false;
  saveCountdown+=dt;if(saveCountdown>2.8){saveCountdown=0;save();}
}
function tickWorld(t,dt){
  textWind.value=t;animatePigeons(t,dt);wheel.rotation.x=-t*.27;boats.forEach((b,i)=>{b.position.y=waterY+.14+Math.sin(t*.76+i*1.8)*.038;b.rotation.z=.015*Math.sin(t*.61+i);b.rotation.x=.010*Math.cos(t*.69+i);});
  birds.forEach(({root,l,r,i})=>{const a=t*(.085+.004*i)+i*.85;root.position.set(14+Math.cos(a)*(12+i*1.22),9+i*.70+Math.sin(a*2)*1.2,-7+Math.sin(a)*(15+i));root.rotation.y=-a;const flap=Math.max(.18,Math.sin(t*.37+i))*Math.sin(t*4.5+i);l.rotation.z=flap*.38;r.rotation.z=-flap*.38;});
  riverUniforms.time.value=t;fountainFlow(t);beacons(t);if(horizonStep)horizonStep(t);if(architectureStep)architectureStep(t);
  if(summoned){
    if(frameIndex%65===0&&settings.quality!=='low'&&Math.hypot(camera.position.x,camera.position.z)<18)renderer.shadowMap.needsUpdate=true;
    const s=mode==='cinema'?t-cinemaStart:99,u=clamp((s-.55)/1.65,0,1),ease=1-Math.pow(1-u,3);
    offering.visible=u>0;offering.position.set(0,.78+ease*.54+Math.sin(t*1.53)*.055,2.01);offering.scale.setScalar(.06+1.055*ease);
    const desired=mode==='cinema'?.28:Math.atan2(camera.position.x,camera.position.z-2.01),diff=Math.atan2(Math.sin(desired-offering.rotation.y),Math.cos(desired-offering.rotation.y));if(mode!=='inspect')offering.rotation.y+=diff*(1-Math.exp(-dt*2));
    maiden.update(t,mode==='cinema'?Math.max(0,Math.sin(clamp(s/7.8,0,1)*PI)):.14);arrivalGlow.uniforms.time.value=t;arrivalGlow.uniforms.show.value=mode==='cinema'?1:.42;arrivalGlow.uniforms.vheight.value=renderer.domElement.height;
  }
  ambientTimer+=dt;if(ambientTimer>.26){ambientTimer=0;townSound.tick(t);}
}
function frameLoop(now){
  rafID=requestAnimationFrame(frameLoop);if(document.hidden)return;if(['map','settings','pause'].includes(mode)&&lastTime&&now-lastTime<115)return;const raw=lastTime?Math.max(.0001,(now-lastTime)/1000):.016;lastTime=now;
  const dt=Math.min(raw,.075);visualTime+=Math.min(raw,.14);frameIndex++;
  if(mode==='title')titleCamera(visualTime);else if(mode==='play')tickPlayer(dt);else if(mode==='cinema')ceremonyCamera(visualTime-cinemaStart);else if(mode==='inspect')inspectView(dt);
  tickWorld(visualTime,dt);
  const reflective=['play','cinema','inspect','title'].includes(mode)&&settings.quality!=='low'&&!portrait.catalogue&&riverInView();
  if(reflective&&++mirrorTick>=(settings.quality==='high'?2:(Math.abs(camera.position.x-22)>27||player.upper?7:4))){mirrorTick=0;reflectRiver();}
  drawScene();
  if(mode==='play'&&settings.quality==='auto'&&raw<1&&performance.now()-startTime>1000){qualityTime+=raw;qualityFrames++;if((qualityTime>=2.5&&qualityFrames>=18)||qualityTime>=4){const fps=qualityFrames/qualityTime,old=autoPixel;
      if(fps<37)autoPixel=Math.max(.72,Math.min(autoPixel,devicePixelRatio)-(fps<24?.22:.13));else if(fps>54)autoPixel=Math.min(1.55,autoPixel+.08);qualityTime=qualityFrames=0;if(Math.abs(Math.min(devicePixelRatio,old)-Math.min(devicePixelRatio,autoPixel))>.04)resizeGame(false);}}
}
function lightScene(){
  scene.background=new T.Color(0xafc9c9);scene.fog=new T.FogExp2(0xc9d5ca,.0051);
  scene.add(new T.HemisphereLight(0xdceaf7,0xa8a99d,1.28));
  sun=new T.DirectionalLight(0xffe6c4,2.65);sun.position.set(-32,55,27);sun.target.position.set(4,0,-3);scene.add(sun,sun.target);sun.castShadow=true;sun.shadow.camera.left=-56;sun.shadow.camera.right=56;sun.shadow.camera.top=49;sun.shadow.camera.bottom=-49;sun.shadow.camera.near=.5;sun.shadow.camera.far=146;sun.shadow.bias=-.00012;sun.shadow.normalBias=.028;sun.shadow.radius=2.25;
  const bounce=new T.DirectionalLight(0xb9d9dc,.43);bounce.position.set(28,17,-35);scene.add(bounce);
}
function fallbackError(e){console.error(e);$('loading').style.opacity=1;$('loading').hidden=false;$('loadPct').style.width='100%';$('loadMsg').textContent='画面未能启动。请使用开启图形加速的 Chrome、Edge 或 Safari 重新打开。';}
const waitPaint=()=>new Promise(r=>setTimeout(r,18));
async function boot(){
  loadState();refreshIcons();canvas=$('stage');
  try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});if(!renderer.extensions.has('EXT_color_buffer_float'))settings.quality='low';renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.info.autoReset=true;
    scene=new T.Scene();camera=new T.PerspectiveCamera(58,innerWidth/innerHeight,.095,410);lightScene();$('loadPct').style.width='12%';await waitPaint();
    makeSurfaces();makeAwningCloth();glazeReflection();$('loadPct').style.width='28%';$('loadMsg').textContent='正在修整屋瓦与钟楼…';await waitPaint();
    ground();wallCount=solids.length;architectureStep=buildArchitecture();$('loadPct').style.width='49%';await waitPaint();
    horizonStep=buildHorizon(scene);finishPiazza();bridge();fountain();fountainDetail();outerTown();addWharfAndMarket();addRiverside();$('loadPct').style.width='70%';$('loadMsg').textContent='河水正在漫过桥墩…';await waitPaint();
    wheel=millWheel();boats=[makeBoat(26.48,17.65,.10,.86,0x3f8383),makeBoat(16.12,-15.1,-.12,.87,0xb4674b,true),makeBoat(25.6,-40.8,-.26,.91,0x568482,true),makeBoat(18.6,38.1,.25,.82,0x997353,true)];
    makeRiver();makeOptics();makeGifts();makeCeremony();makeBirds();plazaPigeons();$('loadPct').style.width='83%';await waitPaint();finishBatch(scene);prepareSceneColor();
    if(blocked(player.x,player.z)){player={x:2.85,z:12.35,yaw:.232,pitch:.086,upper:false};}
    if(summoned)offering.visible=true;attachInput();resizeGame(true);titleCamera();updateProgress();$('loadPct').style.width='95%';$('loadMsg').textContent='点亮小镇…';await waitPaint();
    renderer.render(scene,camera);if(settings.quality!=='low')reflectRiver();drawScene();engineReady=true;setMode('title');$('loadPct').style.width='100%';$('loading').style.opacity=0;setTimeout(()=>$('loading').hidden=true,420);rafID=requestAnimationFrame(frameLoop);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();save();cancelAnimationFrame(rafID);$('loading').hidden=false;$('loading').style.opacity=1;$('loadMsg').textContent='画面暂时中断，正在等候图形设备恢复…';});
    canvas.addEventListener('webglcontextrestored',()=>location.reload());
  }catch(e){fallbackError(e);}
}
boot();
