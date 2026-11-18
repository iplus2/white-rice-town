const portrait={yaw:0,angle:0,dist:5.35,look:1.39,pointer:null,x:0,y:0,catalogue:false,room:null,pivot:null};
function inspectMaiden(){
  if(!summoned)return;portrait.catalogue=false;$('replay').hidden=false;$('inspectX').textContent='回到小镇';setMode('inspect');portrait.yaw=.03;portrait.angle=.03;portrait.dist=5.35;portrait.look=1.39;offering.rotation.y=portrait.angle;flash(.48,300);
}
function openCatalogue(){
  if(mode!=='title')return;
  if(!portrait.room){
    const room=new T.Scene(),pivot=new T.Group();room.add(pivot);
    const page=canvasTex(256,256,(c,w,h)=>{const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#f4efdf');g.addColorStop(.49,'#e9e7d7');g.addColorStop(1,'#d4dcca');c.fillStyle=g;c.fillRect(0,0,w,h);const r=rng32(6382);for(let i=0;i<9000;i++){c.fillStyle=i%2?'rgba(124,108,78,.027)':'rgba(255,254,231,.12)';c.fillRect(r()*w,r()*h,1,1);}});
    room.background=page;
    const shade=canvasTex(128,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,3,w/2,h/2,w/2);g.addColorStop(0,'rgba(77,78,69,.47)');g.addColorStop(.46,'rgba(105,103,80,.21)');g.addColorStop(1,'rgba(104,101,80,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
    const sm=new T.Mesh(new T.PlaneGeometry(2.30,1.95),new T.MeshBasicMaterial({map:shade,transparent:true,depthWrite:false,toneMapped:false}));sm.rotation.x=-PI/2;sm.position.y=.045;room.add(sm);portrait.room=room;portrait.pivot=pivot;
  }
  portrait.catalogue=true;portrait.yaw=portrait.angle=0;portrait.dist=5.05;portrait.look=1.36;portrait.pivot.add(maiden.root);portrait.pivot.rotation.y=0;document.body.classList.add('catalogue');$('inspectX').textContent='回到标题';$('replay').hidden=true;setMode('inspect');inspectView(1);flash(.18,250);
}
function returnFromInspect(){
  if(mode!=='inspect')return;
  if(portrait.catalogue){portrait.catalogue=false;offering.add(maiden.root);document.body.classList.remove('catalogue');$('replay').hidden=false;$('inspectX').textContent='回到小镇';setMode('title');titleCamera(visualTime);}
  else enterPlay();flash(.35,300);
}
function inspectView(dt){
  const targetX=portrait.catalogue?0:.10,targetY=(portrait.catalogue?0:offering.position.y)+portrait.look,targetZ=portrait.catalogue?0:2.01;
  camera.fov=38;camera.updateProjectionMatrix();
  const dist=Math.max(portrait.dist,portrait.dist*.72/camera.aspect);camera.position.set(targetX,targetY+.08,targetZ+dist);camera.lookAt(targetX,targetY,targetZ);
  portrait.angle+=Math.atan2(Math.sin(portrait.yaw-portrait.angle),Math.cos(portrait.yaw-portrait.angle))*(1-Math.exp(-dt*14));
  if(portrait.catalogue){portrait.pivot.rotation.y=portrait.angle;maiden.update(visualTime,.08);}else offering.rotation.y=portrait.angle;
}
function attachExhibit(){
  $('inspectX').onclick=returnFromInspect;$('replay').onclick=startCeremony;
  $('viewAngles').onclick=e=>{if(e.target.dataset.angle!==undefined)portrait.yaw=+e.target.dataset.angle;};
  function down(e){if(mode!=='inspect')return;portrait.pointer=e.pointerId;portrait.x=e.clientX;portrait.y=e.clientY;try{canvas.setPointerCapture(e.pointerId);}catch{}}
  function move(e){if(mode!=='inspect'||portrait.pointer!==e.pointerId)return;portrait.yaw+=(e.clientX-portrait.x)*.009;portrait.look=clamp(portrait.look+(e.clientY-portrait.y)*.006,.96,1.94);portrait.x=e.clientX;portrait.y=e.clientY;}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',()=>portrait.pointer=null);canvas.addEventListener('pointercancel',()=>portrait.pointer=null);
  canvas.addEventListener('wheel',e=>{if(mode!=='inspect')return;e.preventDefault();portrait.dist=clamp(portrait.dist+e.deltaY*.004,3.3,6.6);},{passive:false});
  $('closer').onclick=()=>portrait.dist=clamp(portrait.dist-.64,3.3,6.6);$('farther').onclick=()=>portrait.dist=clamp(portrait.dist+.64,3.3,6.6);
}
