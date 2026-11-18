window.bellQA={get ready(){return engineReady},get mode(){return mode},get world(){return{player:{...player},found:[...collected],summoned,district:district(),target:findTarget(),calls:renderer.info.render.calls,tri:renderer.info.render.triangles,geos:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawWidth:renderer.domElement.width};},gifts,blocked,moveBy,
  point(x,y,z){player.yaw=Math.atan2(player.x-x,player.z-z);player.pitch=Math.atan2(y-(feet()+1.69),Math.hypot(x-player.x,z-player.z));viewPlayer(1);updateTarget();},
  place(x,z,upper=false){player.x=x;player.z=z;player.upper=upper;eyeY=feet()+1.69;viewPlayer(1);},
  view(pos,target,fov=57){setMode('pause');$('modal').hidden=true;camera.position.fromArray(pos);camera.lookAt(...target);camera.fov=fov;camera.updateProjectionMatrix();if(settings.quality!=='low')reflectRiver();drawScene();},
  reveal(){if(summoned)return;for(let i=0;i<10;i++)collected.add(i);updateProgress();summoned=true;},
  collect:interact,
  get dims(){return solids.map(o=>[o.x,o.z,o.hw,o.hd,o.y0,o.y1,o.a]);},
  get rounds(){return rounds},
  get cast(){let ms=0,tr=0;scene.traverse(o=>{if(o.geometry&&o.visible){ms++;tr+=(o.geometry.index?.count||o.geometry.getAttribute('position').count)/3;}});return{ms,tr};},
  get character(){return {v:offering.visible,p:offering.position.toArray(),scale:offering.scale.toArray()};},
  begin:enterPlay,render(){drawScene();},end:endCeremony
};
window.bellQA.walkTo=(g,kind,id)=>{
  const gx=g.x,gz=g.z,gy=g.y+(kind==='gift'?.22:0),step=.37,sx=player.x,sz=player.z;
  const idx=(a,b)=>(a+260)*600+b+260,queue=[[0,0]],parent=new Map([[idx(0,0),null]]);let goal;
  const win=(x,z)=>{
    const d=Math.hypot(x-gx,z-gz);if(d>g.range||d<(g.min||0))return false;
    if(kind==='ladder'&&(Math.abs(x+10.6)>2.50||Math.abs(z+13.8)>2.86))return false;
    const gap=kind==='fountain'?4.95:2.32;if(Math.hypot(d,gy-(player.upper?13.69:1.69+(Math.abs(z-bridgeZ)<2.48?bridgeH(x):0)))>gap)return false;
    return !sightBlocked({x,y:feet()+1.69,z},{x:gx,y:gy,z:gz});
  };
  for(let t=0;t<queue.length;t++){
    const [a,b]=queue[t],x=sx+a*step,z=sz+b*step;if(win(x,z)){goal=[a,b];break;}
    for(const [u,v] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const h=a+u,k=b+v,kk=idx(h,k);if(parent.has(kk))continue;const nx=sx+h*step,nz=sz+k*step;if(blocked(nx,nz)||(u&&v&&(blocked(nx,z)||blocked(x,nz))))continue;parent.set(kk,[a,b]);queue.push([h,k]);}
  }if(!goal)return{pass:false,why:'no reachable approach',explored:queue.length,upper:player.upper};
  const path=[];let cur=goal;while(cur){path.push([sx+cur[0]*step,sz+cur[1]*step]);cur=parent.get(idx(...cur));}path.reverse();window.bellQA.lastPath=path;
  let length=0;for(const [x,z] of path){const ex=x-player.x,ez=z-player.z,l=Math.hypot(ex,ez);if(l<.001)continue;length+=l;player.yaw=Math.atan2(-ex,-ez);keys.add('KeyW');tickPlayer(l/3.14);keys.delete('KeyW');if(Math.hypot(player.x-x,player.z-z)>.009)return{pass:false,why:'blocked in transit',x,z,p:{...player}};}
  eyeY=feet()+1.69;window.bellQA.point(gx,gy,gz);return{pass:target?.kind===kind&&(kind!=='gift'||target.id===id),target,p:{...player},length};
};
