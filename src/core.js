import * as THREE from 'three';
const T=THREE, PI=Math.PI, TAU=PI*2, clamp=T.MathUtils.clamp, mix=T.MathUtils.lerp, DEG=PI/180;
const $=id=>document.getElementById(id);
function rng32(s){return ()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const random=rng32(19047);
const M={}; let scene,camera,renderer,sun,canvas,reflectionCamera,reflectionTarget;
function canvasTex(w,h,draw,repeat=false){
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
  if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
}
function std(color=0xffffff,opts={}){return new T.MeshStandardMaterial({color,roughness:.84,metalness:0,vertexColors:true,...opts});}
let buckets=new Map(),frame=new T.Matrix4(),spatialBatch=true;
const transform=new T.Matrix4(), worldMat=new T.Matrix4(), normMat=new T.Matrix3(),pv=new T.Vector3(),nv=new T.Vector3(),qv=new T.Quaternion(),sv=new T.Vector3(),ev=new T.Euler(),tintV=new T.Color();
const cubeG=new T.BoxGeometry(1,1,1), sphereG=new T.SphereGeometry(1,14,10), cylinderCache=new Map(), torusCache=new Map(), cc=new Map();
function colorVal(t){if(t&&t.isColor)return t;let v=cc.get(t);if(!v){v=new T.Color(t);cc.set(t,v);}return v;}
function scope(x,y,z,ry,fn){const prev=frame;frame=prev.clone().multiply(new T.Matrix4().makeRotationY(ry).setPosition(x,y,z));try{fn();}finally{frame=prev;}}
function addGeo(g,mat,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,tint=0xffffff){
  transform.compose(pv.set(x,y,z),qv.setFromEuler(ev.set(rx,ry,rz)),sv.set(sx,sy,sz));worldMat.multiplyMatrices(frame,transform);normMat.getNormalMatrix(worldMat);
  const key=mat.uuid+(spatialBatch?'|'+Math.floor((worldMat.elements[12]+5)/33)+','+Math.floor((worldMat.elements[14]+5)/33):'');
  let b=buckets.get(key);if(!b){b={p:[],n:[],u:[],c:[],i:[],m:mat};buckets.set(key,b);}
  const pos=g.getAttribute('position'),norm=g.getAttribute('normal'),uv=g.getAttribute('uv'),col=g.getAttribute('color'),ofs=b.p.length/3, tintC=colorVal(tint), meter=mat.userData.meter||0;
  for(let i=0;i<pos.count;i++){
    pv.fromBufferAttribute(pos,i).applyMatrix4(worldMat);b.p.push(pv.x,pv.y,pv.z);
    const nx=norm?.getX(i)??0,ny=norm?.getY(i)??1,nz=norm?.getZ(i)??0;
    nv.set(nx,ny,nz).applyNormalMatrix(normMat);b.n.push(nv.x,nv.y,nv.z);
    let u=uv?.getX(i)??0,v=uv?.getY(i)??0;
    if(meter && g===cubeG){const ax=Math.abs(nx)>.5,ay=Math.abs(ny)>.5;
      u*=Math.abs(ax?sz:sx)/meter;v*=Math.abs(ay?sz:sy)/meter;
    }else if(meter && g.userData.metric){u/=meter;v/=meter;}
    b.u.push(u,v);b.c.push(tintC.r*(col?col.getX(i):1),tintC.g*(col?col.getY(i):1),tintC.b*(col?col.getZ(i):1));
  }
  if(g.index){const inds=g.index.array;for(let i=0;i<inds.length;i++)b.i.push(inds[i]+ofs);}else for(let i=0;i<pos.count;i++)b.i.push(i+ofs);
}
function finishBatch(parent,dict=buckets){for(const b of dict.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.u,2));g.setAttribute('color',new T.Float32BufferAttribute(b.c,3));g.setIndex(b.i);g.computeBoundingSphere();const m=new T.Mesh(g,b.m);m.castShadow=b.m.userData.shadow!==false&&!b.m.transparent;m.receiveShadow=b.m.userData.receive!==false;parent.add(m);}dict.clear();}
function model(fn){const old=buckets,of=frame,oldsp=spatialBatch;buckets=new Map();frame=new T.Matrix4();spatialBatch=false;const out=new T.Group();try{fn();finishBatch(out);}finally{buckets=old;frame=of;spatialBatch=oldsp;}return out;}
function box(x,y,z,w,h,d,mat,tint=0xffffff,rx=0,ry=0,rz=0){addGeo(cubeG,mat,x,y,z,w,h,d,rx,ry,rz,tint);}
function cyl(x,y,z,rt,rb,h,mat,tint=0xffffff,n=16,rx=0,ry=0,rz=0){
  const r=Math.max(rt,rb,.0001),a=Math.round(rt/r*10000)/10000,b=Math.round(rb/r*10000)/10000,k=n+'|'+a+'|'+b;
  let g=cylinderCache.get(k);if(!g){g=new T.CylinderGeometry(a,b,1,n);cylinderCache.set(k,g);}addGeo(g,mat,x,y,z,r,h,r,rx,ry,rz,tint);
}
function ball(x,y,z,sx,sy,sz,mat,tint=0xffffff,rx=0,ry=0,rz=0){addGeo(sphereG,mat,x,y,z,sx,sy,sz,rx,ry,rz,tint);}
function between(a,b){const v=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),l=v.length();const e=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));return [(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,l,e.x,e.y,e.z];}
function beam(a,b,r,mat,tint=0xffffff,n=8){const [x,y,z,l,rx,ry,rz]=between(a,b);if(l>.0001)cyl(x,y,z,r,r,l,mat,tint,n,rx,ry,rz);}
function rodBox(a,b,w,d,mat,tint=0xffffff){const [x,y,z,l,rx,ry,rz]=between(a,b);if(l>.0001)box(x,y,z,w,l,d,mat,tint,rx,ry,rz);}
function poly(pts,mat,tint=0xffffff,uvs=null){
  if(pts.length<3)return;const p=pts.flat(),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));const i=[];for(let j=2;j<pts.length;j++)i.push(0,j-1,j);g.setIndex(i);g.computeVertexNormals();
  if(!uvs){const n=g.getAttribute('normal');const ax=Math.abs(n.getX(0)),ay=Math.abs(n.getY(0)),az=Math.abs(n.getZ(0));uvs=pts.map(([x,y,z])=>ay>ax&&ay>az?[x,-z]:ax>az?[z,y]:[x,y]);}
  g.setAttribute('uv',new T.Float32BufferAttribute(uvs.flat(),2));g.userData.metric=true;addGeo(g,mat,0,0,0,1,1,1,0,0,0,tint);
}
function lathe(x,y,z,profile,mat,tint=0xffffff,n=32){const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(p[0],p[1])),n);addGeo(g,mat,x,y,z,1,1,1,0,0,0,tint);}
function torus(x,y,z,r,tube,mat,tint=0xffffff,rx=0,ry=0,rz=0,n=32){const k=r+' '+tube+' '+n;let g=torusCache.get(k);if(!g){g=new T.TorusGeometry(r,tube,8,n);torusCache.set(k,g);}addGeo(g,mat,x,y,z,1,1,1,rx,ry,rz,tint);}
function curve(points,r,mat,tint=0xffffff,seg=14,n=6){const c=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));addGeo(new T.TubeGeometry(c,seg,r,n,false),mat,0,0,0,1,1,1,0,0,0,tint);}
function makeLabel(title,sub,w,h,opt={}){
  const tex=canvasTex(768,Math.round(768*h/w),(c,W,H)=>{c.fillStyle=opt.bg||'#193d3b';c.fillRect(0,0,W,H);
    c.strokeStyle=opt.ink||'#e7cb88';c.lineWidth=3;c.strokeRect(9,9,W-18,H-18);c.lineWidth=.8;c.strokeRect(16,16,W-32,H-32);
    c.textAlign='center';c.textBaseline='middle';c.fillStyle=opt.ink||'#f2db9f';c.font='600 '+Math.round(Math.min(H*.44,W/(title.length+1)))+'px "Songti SC","Noto Serif CJK SC",serif';c.fillText(title,W/2,H*(sub?.41:.50),W*.86);
    if(sub){c.font='500 '+Math.round(Math.min(H*.14,W/(sub.length*.64)))+'px Georgia,serif';c.fillText(sub,W*.5,H*.76,W*.83);}
  });const m=std(0xffffff,{map:tex,roughness:.65});return m;
}
