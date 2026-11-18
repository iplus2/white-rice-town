/*! Bellwater: original mesh, painted textures and animation for the whale maiden.
    Character origin: 上善无形 (溟月); DeepSeek maid design: ZipZipPipe.
    Character adaptation: CC BY-NC-SA 4.0 — https://creativecommons.org/licenses/by-nc-sa/4.0/ */
function createWhaleMaiden() {
  const T=THREE, PI=Math.PI, TAU=PI*2, units=.009;
  const V=(x,y,z)=>new T.Vector3(x,y,z), C=c=>new T.Color(c);
  const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);
  const mix=(a,b,t)=>C(a).lerp(C(b),clamp(t));
  const sample=(stops,y)=>{
    if(y<=stops[0][0])return stops[0][1];
    for(let i=1;i<stops.length;i++)if(y<=stops[i][0]){
      const a=stops[i-1],b=stops[i];return lerp(a[1],b[1],(y-a[0])/(b[0]-a[0]));
    }
    return stops[stops.length-1][1];
  };
  let randomState=81817;
  const random=()=>((randomState=(Math.imul(randomState,1664525)+1013904223)>>>0)/4294967296);
  const root=new T.Group(), artwork=new T.Group(), skeleton=[];
  root.name='大肥鱼 · 鲸鱼女仆';artwork.scale.setScalar(units);root.add(artwork);
  function joint(parent,x,y,z,name) {
    const pivot=V(x,y,z),node=new T.Group();node.name=name;
    node.position.copy(pivot);if(parent)node.position.sub(parent.pivot);
    (parent?parent.node:artwork).add(node);
    const j={node,pivot,bins:new Map(),outlines:[]};skeleton.push(j);return j;
  }
  const body=joint(null,0,0,0,'身体'),head=joint(body,0,128,0,'头部'),
    serving=joint(body,0,119,2,'双手捧着大白饭'),dish=joint(serving,0,81.8,42.2,'青花米碗'),
    tail=joint(body,6,55,-24,'鲸尾');
  // View-space cel lighting keeps the face and hair colours legible at any hour.
  // There is a narrow, softened step at each shadow boundary.
  function toon(shading=1,map=null) {
    const material=new T.MeshBasicMaterial({color:0xffffff,vertexColors:true,map,side:T.DoubleSide,toneMapped:false});
    material.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 paintedNormal;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\npaintedNormal = normalize(normalMatrix * normal);');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 paintedNormal;')
        .replace('#include <opaque_fragment>',
          'vec3 pn=normalize(paintedNormal); if(!gl_FrontFacing)pn=-pn; float sun=dot(pn,normalize(vec3(-0.38,0.73,0.59))); float lit=0.53+0.26*smoothstep(-0.32,-0.25,sun)+0.21*smoothstep(0.15,0.23,sun); outgoingLight*=mix(vec3(1.0),vec3(lit*0.98,lit,0.945*lit+0.055),'+shading.toFixed(3)+');\n#include <opaque_fragment>');
    };
    material.customProgramCacheKey=()=>'bellwater-cel-'+shading;
    return material;
  }
  const silk=toon(.66),uniform=toon(.8),skin=toon(.10),paper=toon(.64),ink=toon(.05),china=toon(.5);
  const outline=new T.MeshBasicMaterial({color:'#242239',side:T.BackSide,toneMapped:false});
  function shapeGrid(nu,nv,f,flip=false) {
    const p=[],n=[],col=[],uv=[],ix=[];
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
      const u=i/nu,v=j/nv,q=f(u,v);
      p.push(q[0],q[1],q[2]);uv.push(u,v);
      if(q[3])col.push(q[3].r,q[3].g,q[3].b);
      if(q[4])n.push(q[4].x,q[4].y,q[4].z);
      if(i<nu&&j<nv){
        const a=j*(nu+1)+i,b=a+1,d=a+nu+1,c=d+1;
        if(flip)ix.push(a,d,b,b,d,c);else ix.push(a,b,d,b,c,d);
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(col.length)g.setAttribute('color',new T.Float32BufferAttribute(col,3));
    g.setIndex(ix);if(n.length)g.setAttribute('normal',new T.Float32BufferAttribute(n,3));else g.computeVertexNormals();
    return g;
  }
  function draw(j,g,m,tint='#ffffff',edge=0) {
    g.translate(-j.pivot.x,-j.pivot.y,-j.pivot.z);
    if(!g.attributes.color){
      const c=C(tint),a=new Float32Array(g.attributes.position.count*3);
      for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}
      g.setAttribute('color',new T.BufferAttribute(a,3));
    }
    if(edge>0){
      const o=g.clone(),p=o.attributes.position,n=o.attributes.normal;
      for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+edge*n.getX(i),p.getY(i)+edge*n.getY(i),p.getZ(i)+edge*n.getZ(i));
      j.outlines.push(o);
    }
    if(!j.bins.has(m))j.bins.set(m,[]);j.bins.get(m).push(g);
  }
  const orbCache=new Map();
  function orb(j,x,y,z,rx,ry,rz,tint,m=uniform,edge=0,rot=[0,0,0],segments=22) {
    if(!orbCache.has(segments))orbCache.set(segments,new T.SphereGeometry(1,segments,Math.ceil(segments*.66)));
    const g=orbCache.get(segments).clone();g.scale(rx,ry,rz);
    g.applyQuaternion(new T.Quaternion().setFromEuler(new T.Euler(...rot)));g.translate(x,y,z);draw(j,g,m,tint,edge);
  }
  function curve3(arr){return new T.CatmullRomCurve3(arr.map(p=>V(...p)),false,'centripetal');}
  function cord(j,arr,width,tint,m=ink,steps=24,section=6) {
    draw(j,new T.TubeGeometry(curve3(arr),steps,width,section,false),m,tint);
  }
  function tube(j,pts,width,depth,tint,material=uniform,edge=.45,steps=26,radial=18) {
    const c=curve3(pts),frames=[];
    for(let k=0;k<=steps;k++){
      const t=k/steps,d=c.getTangent(t),p=c.getPoint(t);
      let side=new T.Vector3().crossVectors(V(0,0,1),d);
      if(side.lengthSq()<.01)side.crossVectors(V(0,1,0),d);
      side.normalize();const n=new T.Vector3().crossVectors(d,side).normalize();
      frames.push([p,side,n]);
    }
    draw(j,shapeGrid(radial,steps,(u,v)=>{
      const [p,side,n]=frames[Math.round(v*steps)],a=u*TAU;
      const q=p.clone().addScaledVector(side,Math.cos(a)*width(v)).addScaledVector(n,Math.sin(a)*depth(v));
      const c=typeof tint==='function'?tint(v,a):C(tint);return[q.x,q.y,q.z,c];
    }),material,'#ffffff',edge);
  }
  function ellipseLathe(j,rows,material,tint,edge=.5,seg=56) {
    draw(j,shapeGrid(seg,rows.length-1,(u,v)=>{
      const [y,xr,zr,zc=0]=rows[Math.round(v*(rows.length-1))],a=(u-.5)*TAU;
      return[xr*Math.sin(a),y,zr*Math.cos(a)+zc,typeof tint==='function'?tint(a,v):C(tint)];
    }),material,'#ffffff',edge);
  }
  function texture(w,h,paint) {
    const can=document.createElement('canvas');can.width=w;can.height=h;
    paint(can.getContext('2d'));const t=new T.CanvasTexture(can);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
  }
  function brush(ctx,d,fill,line,thick=1) {
    const p=new Path2D(d);
    if(fill){ctx.fillStyle=fill;ctx.fill(p);}
    if(line){ctx.strokeStyle=line;ctx.lineWidth=thick;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(p);}
    return p;
  }
  // Closed Bezier paths use front-view design coordinates, x outward, y up.
  // Adaptive triangulation bends the drawn silhouettes over their actual solid volume.
  function contour(commands) {
    const sh=new T.Shape(),first=commands[0];sh.moveTo(first[0],first[1]);
    for(const row of commands.slice(1)){
      if(row.length===6)sh.bezierCurveTo(...row);
      else if(row.length===4)sh.quadraticCurveTo(...row);else sh.lineTo(...row);
    }
    sh.closePath();const pts=sh.getPoints(10);
    if(pts[0].distanceToSquared(pts[pts.length-1])<.00001)pts.pop();
    return pts;
  }
  function patch(j,commands,zAt,paint,m=silk,opts={}) {
    let border=contour(commands);
    if(T.ShapeUtils.isClockWise(border))border.reverse();
    const tri=T.ShapeUtils.triangulateShape(border,[]),p=[],n=[],col=[],ids=[],uv=[],lookup=new Map();
    const eps=.09,depth=opts.depth||0,step=opts.step||7;
    function vertex(q,back=false) {
      const key=Math.round(q.x*200)+','+Math.round(q.y*200)+','+(back?1:0),old=lookup.get(key);
      if(old!==undefined)return old;
      const i=p.length/3,z=zAt(q.x,q.y)-(back?depth:0);
      p.push(q.x,q.y,z);uv.push(0,0);
      const norm=V(-(zAt(q.x+eps,q.y)-zAt(q.x-eps,q.y))/(2*eps),-(zAt(q.x,q.y+eps)-zAt(q.x,q.y-eps))/(2*eps),1).normalize();
      if(back)norm.multiplyScalar(-1);n.push(norm.x,norm.y,norm.z);
      const co=(typeof paint==='function'?paint(q.x,q.y):C(paint));if(back)co.multiplyScalar(.69);
      col.push(co.r,co.g,co.b);lookup.set(key,i);return i;
    }
    function split(a,b,c,level) {
      const ab=a.distanceToSquared(b),bc=b.distanceToSquared(c),ca=c.distanceToSquared(a);
      if(level<7&&Math.max(ab,bc,ca)>step*step){
        if(ab>=bc&&ab>=ca){const q=a.clone().lerp(b,.5);split(a,q,c,level+1);split(q,b,c,level+1);}
        else if(bc>=ca){const q=b.clone().lerp(c,.5);split(a,b,q,level+1);split(a,q,c,level+1);}
        else{const q=c.clone().lerp(a,.5);split(a,b,q,level+1);split(q,b,c,level+1);}
      }else{
        const cross=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
        if(cross>=0){
          ids.push(vertex(a),vertex(b),vertex(c));
          if(depth>0)ids.push(vertex(c,true),vertex(b,true),vertex(a,true));
        }else{
          ids.push(vertex(a),vertex(c),vertex(b));
          if(depth>0)ids.push(vertex(b,true),vertex(c,true),vertex(a,true));
        }
      }
    }
    for(const t of tri)split(border[t[0]],border[t[1]],border[t[2]],0);
    if(depth>0){
      for(let i=0;i<border.length;i++){
        const a=border[i],b=border[(i+1)%border.length],af=vertex(a),bf=vertex(b),ab=vertex(a,true),bb=vertex(b,true);
        ids.push(af,ab,bf,bf,ab,bb);
      }
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(ids);draw(j,g,m,'#ffffff');
    if(opts.stroke){
      const coords=[...border,border[0]].map(q=>[q.x,q.y,zAt(q.x,q.y)+.11]);
      cord(j,coords,opts.stroke,opts.line||'#2d2e50',ink,Math.max(18,Math.min(115,border.length)),5);
    }
  }
  const mirror=(commands,s)=>commands.map(row=>row.map((v,i)=>i%2===0?s*v:v));
  const navy='#333451',deep='#262944',blue='#46579a',white='#fff8f2',pearl='#efe7ef',gold='#cfae79';
  // Head rings give the cheeks a wide, shallow curve and a flat, short chin.
  const headRows=[
    [126,1,16,-10],[127,14,25,-16],[128.5,23,32,-22],[130.5,31,37,-28],
    [133.5,38.5,42,-34],[137.5,45.1,47,-41],[144,53.5,50,-49],[151,60.2,50.8,-55],
    [158,65,50.4,-60],[172,67,49,-65],
    [191,68,47,-69],[211,65,44,-65],[230,55,36,-57],[246,36,22,-45],[253,1,-8,-12]
  ];
  const getHead=(y,ix)=>sample(headRows.map(r=>[r[0],r[ix]]),y);
  function faceZ(x,y) {
    const rx=Math.max(.1,getHead(y,1)),f=getHead(y,2),b=getHead(y,3),mid=(f+b)*.5;
    const turn=lerp(1.0,2.22,smooth(clamp((y-132)/16)));
    return mid+(f-mid)*Math.pow(Math.max(0,1-(x/rx)**2),turn)+1.95*Math.exp(-(x*x)/36-((y-148.5)**2)/22);
  }
  draw(head,shapeGrid(80,52,(u,v)=>{
    const a=(u-.5)*TAU,y=lerp(126,253,v),xr=getHead(y,1),fr=getHead(y,2),bk=getHead(y,3),x=xr*Math.sin(a),mid=(fr+bk)*.5;
    const z=Math.cos(a)>=0?faceZ(x,y):mid+(mid-bk)*Math.cos(a);
    const tint=mix('#f9e2d8','#fff0e4',.62+.38*Math.max(0,Math.cos(a)));
    return[x,y,z,tint];
  }),skin,'#ffffff',.68);
  // Inked expressions are independently painted on the curved face.
  function expression(blink,delighted) {
    return texture(960,584,c=>{
      c.scale(8,8);c.translate(-90,-148);
      for(const s of [-1,1]){
        const cheek=150+s*35;
        c.save();c.translate(cheek,202.3);c.scale(1,.58);
        const cg=c.createRadialGradient(0,0,0,0,0,10);
        cg.addColorStop(0,'rgba(240,143,149,.74)');cg.addColorStop(.6,'rgba(246,171,172,.38)');cg.addColorStop(1,'rgba(253,190,180,0)');
        c.fillStyle=cg;c.fillRect(-10,-10,20,20);c.restore();
        c.save();c.translate(150+s*26,189);c.scale(s,1);
        brush(c,'M -8.8 -22.1 Q 0.2 -25.3 9.3 -22.3 Q 1.8 -23.7 -8.0 -21.1 Z','#50475c');
        const e=1-blink;
        if(e>.14){
          c.save();c.translate(0,3*blink);c.scale(1,e);
          const line='M -12.45 -5.2 Q -11 -10.6 -5.0 -12.2 Q 3.9 -14.1 10.7 -7.6 Q 12.45 -1.2 9.45 7.6 Q 6.7 12.65 -.1 12.65 Q -7.35 13 -10.0 7.9 Q -12.8 2.7 -12.45 -5.2 Z';
          const eye=new Path2D(line);c.save();c.clip(eye);
          const w=c.createLinearGradient(0,-10,0,12);w.addColorStop(0,'#c4b6cd');w.addColorStop(.37,'#fff2ef');w.addColorStop(1,'#fff9ef');
          c.fillStyle=w;c.fillRect(-14,-15,30,30);
          c.save();c.translate(-.7,-.15);
          c.beginPath();c.ellipse(0,.28,8.95,11.95,0,0,TAU);
          const ir=c.createLinearGradient(0,-12,0,13);
          ir.addColorStop(0,'#253359');ir.addColorStop(.17,'#354b8c');ir.addColorStop(.45,'#496dc1');ir.addColorStop(.70,'#609bdb');ir.addColorStop(.88,'#87c5ed');ir.addColorStop(1,'#c4eafa');
          c.fillStyle=ir;c.fill();c.strokeStyle='#3b426f';c.lineWidth=.65;c.stroke();
          c.save();c.clip();
          c.fillStyle='#243e78';c.beginPath();c.ellipse(.22,-.75,3.23,3.95,0,0,TAU);c.fill();
          const gl=c.createRadialGradient(0,7.4,0,0,7.4,7.0);
          gl.addColorStop(0,'rgba(157,224,248,.75)');gl.addColorStop(1,'rgba(175,225,255,0)');
          c.fillStyle=gl;c.fillRect(-9,0,18,15);
          c.fillStyle='#fff9f0';c.beginPath();c.ellipse(-3.55*s,-5.7,2.42,2.60,-.3*s,0,TAU);c.fill();
          c.fillStyle='#bccfed';c.beginPath();c.ellipse(2.65*s,-6.05,.80,.92,0,0,TAU);c.fill();
          c.fillStyle='#dcf8f4';c.beginPath();c.ellipse(2.0*s,8.7,2.1,1.22,-.18*s,0,TAU);c.fill();
          c.restore();c.restore();c.restore();
          brush(c,'M -12.6 -4.9 Q -12.45 -10.6 -6.60 -13.0 Q 2.00 -16.5 10.3 -10.8 Q 12.3 -9.3 15.0 -9.2 L 12.4 -7.3 L 14.1 -6.9 L 10.5 -4.8 Q 5.8 -10.10 -.9 -10.25 Q -7.9 -10.75 -12.1 -3.5 Z','#292436');
          brush(c,'M 9.9 3.9 Q 9.8 8.4 7.2 10.5',null,'#846d74',.52);
          brush(c,'M 8.0 -11.5 Q 11.9 -11.4 12.2 -13.1 Q 12.7 -10.8 10.1 -9.6 Z','#332d41');
          c.restore();
        }else brush(c,'M -11.9 1.1 Q -2.1 -4.2 8.6 .35 Q 12.2 2.6 13.8 .5 Q 12.8 4.1 9.5 3.0 Q -1.4 -.9 -11.9 2.7 Z','#322c43');
        c.restore();
      }
      brush(c,'M 149.1 203.5 q 1.1 -.65 2.0 0',null,'rgba(214,160,157,.32)',.42);
      // The open smile is the default expression in all three game modes.
      c.save();c.translate(150,207.6);c.scale(delighted?1.037:1,delighted?1.08:1);
      brush(c,'M -17.8 -5.5 C -16.4 -6.6 -10.6 -3.0 -5.5 -2.25 C .7 -1.12 7.6 -1.88 13.8 -4.55 C 16.3 -5.75 18.0 -6.0 18.1 -4.4 C 17.2 -.5 14.0 3.4 9.75 5.2 C 5.3 7.2 -2.7 7.35 -7.8 5.8 C -12.6 4.5 -16.9 1.05 -18 -3.4 Q -18.3 -5.0 -17.8 -5.5 Z','#321b22','#4b272a',.68);
      brush(c,'M -10.6 3.98 Q -7.55 .4 -.45 .65 Q 6.8 .34 10.5 3.78 Q 8.5 5.8 3.9 6.25 Q -4.4 7.15 -10.6 3.98 Z','#e58b94');
      brush(c,'M -8.3 3.59 Q -4.5 1.57 -1.7 1.53',null,'#eda4a6',.51);
      c.restore();
    });
  }
  const expressions=[[0,.56,1].map(k=>expression(k,false)),[0,.56,1].map(k=>expression(k,true))];
  const faceMat=toon(.10,expressions[0][0]);faceMat.transparent=true;faceMat.depthWrite=false;
  draw(head,shapeGrid(54,31,(u,v)=>{
    const x=(u-.5)*120,y=346-(221-73*v);return[x,y,faceZ(x,y)+.37,C('#ffffff')];
  }),faceMat);
  // A single nape mantle makes the back read as a single broad sheet of hair.
  // Its five pointed waves at the hem are sculpted into the lower silhouette.
  const hairTone=(x,y)=>mix('#4b579c','#6c89c3',.85*smooth(clamp((156-y)/110)));
  function hemHair(a) {
    const ab=Math.abs(a),back=clamp((ab-1.11)/.63);
    const rear=49+5.8*Math.cos(7*a+.3)+3.2*Math.cos(11*a+.5);
    return lerp(216-56*smooth(clamp(ab/1.42)),rear,smooth(back));
  }
  function mantle(a,y,v) {
    const upper=Math.max(0,(y-178)/81),rounded=Math.sqrt(Math.max(.0002,1-upper*upper));
    const lower=clamp((178-y)/132),side=Math.sin(a),rear=-Math.cos(a);
    const wave=lower*lower*(5.7*Math.sin(a*8+lower*5)+3.8*Math.sin(a*4-lower*4.7));
    const rx=(76+5*lower+wave)*rounded,rz=(78+9*lower+wave*.61)*rounded;
    let x=rx*Math.sin(a),z=-13+rz*Math.cos(a);
    if(lower>0){
      x+=side*(1.8*Math.sin(lower*TAU-1)+5.6*Math.pow(lower,3));
      if(side>.36)x-=19.6*Math.pow(side,3)*smooth(clamp((107-y)/47));
      z-=3*lower*lower*Math.max(0,rear);
    }
    return V(x,y,z);
  }
  draw(head,shapeGrid(144,58,(u,v)=>{
    const a=(u-.5)*TAU,y=lerp(hemHair(a),258.96,v),p=mantle(a,y,v);
    const co=hairTone(p.x,y).lerp(C('#5364a5'),.11+.05*Math.cos(a*3));
    return[p.x,p.y,p.z,co];
  }),silk,'#fff',.76);
  function bangsZ(x,y) {
    const q=1-(x/77.5)**2-((y-177)/84.7)**2;
    return -13+79.3*Math.sqrt(Math.max(.018,q));
  }
  function frontPanel(data,lift,shade='#4e5da2',offset=0,stroke=.50) {
    const z=(x,y)=>bangsZ(x,y)+lift-offset*smooth(clamp((209-y)/49))*smooth(clamp((Math.abs(x)-18)/23));
    patch(head,data,z,(x,y)=>mix(shade,'#7589bd',.13*smooth(clamp((208-y)/52))),silk,
      {depth:1.6,stroke:0,step:4.9});
    return z;
  }
  // Two broad temple panels carry the outer face contour. Drawn seams are sparse.
  const cheeks=[
    [3,255],[23,257,43,247,55,231],[72,215,78,185,74,166],
    [73,153,68,141,58,133],[53,129,44,126,34,128],
    [41,132,46,138,47,144],[42,139,38,138,33,139],
    [42,145,44,155,43,166],[41,178,36,187,31,198],
    [22,217,13,241,3,255]
  ];
  const cheekDepth=34;
  for(const s of [-1,1])frontPanel(mirror(cheeks,s),2.1,'#4a599c',cheekDepth,.64);
  // Two draped side locks sit forward of the long hair and turn blue at their tips.
  const curl=[
    [64,177],[72,167,71,151,62,138],[55,128,54,123,59,116],
    [62,108,67,104,71,106],[67,99,56,98,51,103],[45,108,43,115,48,125],
    [50,130,51,134,50,140],[46,135,42,133,37,133],[49,143,56,160,64,177]
  ];
  function curlZ(x,y){return 4.1+.13*(68-Math.abs(x))+.035*(y-124);}
  for(const s of [-1,1]){
    patch(head,mirror(curl,s),curlZ,(x,y)=>mix('#495b9d','#73a2d1',smooth(clamp((141-y)/42))),silk,
      {depth:4,stroke:.56,line:'#343c6b',step:5});
  }
  // Separate lower tufts and a fine outer strand leave pockets of negative space.
  const outerLock=[
    [67,154],[78,139,84,123,91,108],[99,92,102,75,96,63],
    [92,56,95,52,101,56],[98,47,87,44,80,48],[81,43,85,41,90,42],
    [81,34,65,37,60,45],[50,55,49,67,58,83],[67,98,73,110,69,124],
    [65,136,65,140,67,154]
  ];
  const loose=[
    [69,148],[78,133,83,127,92,117],[107,100,106,85,101,79],
    [100,89,100,99,91,108],[82,117,74,124,69,148]
  ];
  function lowZ(x,y){
    const tucked=x>50?80*smooth(clamp((139-y)/72)):0;
    return -15+10*Math.cos(y*.044)+.16*(87-Math.abs(x))-tucked;
  }
  // The side curtain curves back in above the tail. The flukes occupy this
  // opening in silhouette, so a change of viewpoint never buries them again.
  function sideCurtain(outline,side) {
    if(side<0)return mirror(outline,side);
    return outline.map(row=>row.map((coord,i)=>{
      if(i%2)return coord;
      const y=row[i+1],low=smooth(clamp((130-y)/62)),outer=smooth(clamp((coord-49)/39));
      return coord-22.7*low*outer;
    }));
  }
  for(const s of [-1,1]){
    patch(head,sideCurtain(outerLock,s),lowZ,hairTone,silk,{depth:5,stroke:.77,line:'#303a68',step:6});
    patch(head,sideCurtain(loose,s),(x,y)=>lowZ(x,y)-5,hairTone,silk,{depth:2,stroke:.45,line:'#303963',step:6});
  }
  // Only three major fringe divisions. The center strand crosses the brow and
  // finishes with a second, very small point between the two large eyes.
  const leftFringe=[
    [-1,255],[-15,257,-32,248,-43,234],[-55,216,-55,193,-50,174],
    [-47,164,-44,154,-46,145],[-37,151,-33,158,-30,168],
    [-28,177,-26,185,-22,192],[-16,205,-7,232,-1,255]
  ];
  const rightFringe=[
    [3,255],[18,256,34,247,44,233],[51,223,58,201,53,185],
    [50,170,47,157,48,149],[41,155,35,164,30,174],
    [25,184,20,195,15,206],[10,222,4,240,3,255]
  ];
  const leftZ=frontPanel(leftFringe,3.35,'#4b599b',27,.44),rightZ=frontPanel(rightFringe,3.45,'#4c5a9e',27,.42);
  const centerFringe=[
    [-4,255],[4,256,13,246,16,234],[22,217,23,197,18,181],
    [16,174,12,167,9,164],[11,161,12,158,15,156],
    [8,156,4,157,1,159],[-1,157,-2,156,-4,155],
    [-3,158,-3,161,-4,163],[-10,164,-14,174,-17,184],
    [-22,201,-21,221,-16,236],[-14,245,-9,252,-4,255]
  ];
  const centerZ=frontPanel(centerFringe,5,'#4f5ea4',0,.48);
  function hairLine(points,zAt,shade,width,steps=26) {
    const arr=points.map(([x,y])=>[x,y,zAt(x,y)+.38]);
    tube(head,arr,t=>.055+width*Math.pow(Math.max(0,Math.sin(t*PI)),.57),t=>.09+width*.32*Math.sin(t*PI),shade,ink,0,steps,6);
  }
  // Lower seams end in a tapered stroke while the upper parts flow together.
  hairLine([[-17.8,216],[-18.8,199],[-16.8,184],[-10,170],[-4,163]],centerZ,'#374277',.64);
  hairLine([[18,212],[20,199],[17.6,181],[12,168],[9,164],[15,156]],centerZ,'#364273',.62);
  hairLine([[-4,163],[-3.7,159.3],[-4,155],[.8,158.5],[7.4,156.7],[14.7,156]],centerZ,'#35416f',.59);
  hairLine([[-5.5,252],[-11.7,251],[-18.5,248.2],[-22.5,244]],(x,y)=>bangsZ(x,y)+6.8,'#33396b',1.1);
  hairLine([[.9,252],[6.4,251.3],[11.2,248.8],[16.1,244]],(x,y)=>bangsZ(x,y)+6.8,'#33396b',1.1);
  for(const ss of [-1,1]){
    const z=(x,y)=>bangsZ(x,y)+2.1-cheekDepth*smooth(clamp((209-y)/49))*smooth(clamp((Math.abs(x)-18)/23));
    hairLine([[ss*67,204],[ss*71,186],[ss*68,158],[ss*61,140],[ss*51,132],[ss*35,128]],z,'#323b6b',.63);
  }
  // Tapered glints are drawn into the surface like painted anime highlights.
  const centerLight=[[-17.3,219],[-13.7,216.6,-13.0,213.2,-10.2,213.8],
    [-8.2,216.4,-7.3,211.3,-4.4,211.0],[-2,210.4,.0,208.1,2.4,209.1],
    [4.1,211.0,6.0,208.1,7.4,208.3],[11.2,208.4,14.7,211.0,18.1,214.4],
    [17.1,209.7,15.5,205.8,13.0,204.3],[11.1,205.3,8.8,204.8,6.1,202.8],
    [3.7,203.5,2.7,201.4,1.2,201.2],[-2.8,204.0,-5.4,204.0,-8.6,204.7],
    [-11.4,206.5,-13.8,207.3,-15.0,207.2],[-16.7,211,-17.4,215,-17.3,219]];
  patch(head,centerLight,(x,y)=>centerZ(x,y)+.55,(x,y)=>mix('#5263a5','#6c83bf',
    .27+.55*Math.sin(clamp((x+18)/36)*PI)+.13*clamp((y-203)/12)),ink,{step:3.0});
  const sweepingLight=[[30,223],[33.3,224.8,37.4,225.7,41.2,226.7],[42,224.9,46,223.7,48.7,225.8],
    [51.2,224.4,55,219.5,56,216.8],[53.2,218.2,51.2,216.5,49.1,215.2],
    [47.3,216.7,45.1,215,43,214],[40.2,215.6,36.4,215.7,33.2,214.0],
    [34,217.4,32,220.6,30,223]];
  for(const ss of [-1,1]){
    const shaped=sweepingLight.map(row=>row.map((v,k)=>k%2?v+.26*(row[k-1]-40)+(ss<0?-1.55:.8):ss*v));
    patch(head,shaped,(x,y)=>bangsZ(x,y)+4.45,(x,y)=>mix('#5263a5','#6d84bf',.27+.54*Math.sin(clamp((Math.abs(x)-29)/28)*PI)),ink,{step:3.1});
  }
  // Some highlights turn round the crown so they remain visible from behind.
  function backZ(x,y){return -13-78*Math.sqrt(Math.max(.01,1-(x/76)**2-((y-178)/81)**2))-.90;}
  for(const [s,off] of [[-1,1.6],[1,-1]]){
    const bg=mirror([[32,224+off],[36,228+off,41,228+off,43,225+off],[45,226+off,47,223+off,47.8,220+off],
      [45,220+off,43,219+off,41,219+off],[39.6,222+off,37.5,218.5+off,35.0,219.5+off],
      [34.6,221.5+off,32,221.2+off,32,224+off]],s);
    patch(head,bg,backZ,'#677cb6',ink,{step:3.1});
  }
  // Nape ink narrows to a point at either end. Curves follow the 3D curtain.
  function napeStroke(theta,y0,y1,bend,width) {
    const samples=[];
    for(let k=0;k<=21;k++){
      const t=k/21,y=lerp(y0,y1,t),a=theta+bend*Math.sin(t*PI*1.4);
      const p=mantle(a,y,0);p.x+=Math.sin(a)*.46;p.z+=Math.cos(a)*.46;samples.push(p.toArray());
    }
    tube(head,samples,t=>.10+width*Math.sin(t*PI),t=>.10+width*.34*Math.sin(t*PI),'#3c4c89',ink,0,25,5);
  }
  for(const r of [[3.00,184,104,.10,.55],[-2.93,134,90,-.05,.48],[2.64,119,64,.11,.53],[-2.57,124,61,-.16,.54],[2.15,103,55,.13,.43],[-2.09,106,54,-.16,.43],[1.83,153,94,-.11,.46],[-1.80,157,98,.10,.40]])napeStroke(...r);
  // A curved maid band crosses the crown, leaving a clean, domed occipital profile.
  function bandCenter(a,h=0,forward=0) {
    const si=Math.sin(a),co=Math.cos(a),ab=Math.abs(a);
    const centerZ=-14+19*co+17*smooth(clamp((ab-.90)/.55));
    const gather=.055+.945*smooth(clamp((1.46-ab)/.87)), z=centerZ+forward*gather;
    const seat=Math.sqrt(Math.max(.82,1-((z+13)/78)**2));
    const fan=h*(.21+.79*smooth(clamp((1.47-ab)/.27)))-.65;
    return V(si*(76*seat+fan),178+co*(81*seat+fan),z);
  }
  // The dark mounting ribbon is fitted to the scalp itself, including its ends.
  draw(head,shapeGrid(116,10,(u,v)=>{
    const a=(u-.5)*2.91,q=bandCenter(a,.12+1.1*Math.sin(v*PI),lerp(-24,4,v));
    return[q.x,q.y,q.z,mix('#383855','#575b81',.19+.26*Math.sin(v*PI))];
  }),silk,'#fff',.29);
  draw(head,shapeGrid(102,12,(u,v)=>{
    const a=(u-.5)*2.90,wave=.5+.5*Math.cos(u*TAU*12);
    const h=2+v*(5.6+5.0*Math.pow(wave,.48)), p=bandCenter(a,h,-3+v*(1.6+1.2*Math.sin(u*TAU*12)));
    return[p.x,p.y,p.z,mix('#e6dae5','#fff9ef',.46+.43*wave+.09*v)];
  }),paper,'#fff',.58);
  // The back flange and top make the lace band broad in a true side view.
  draw(head,shapeGrid(112,13,(u,v)=>{
    const a=(u-.5)*2.90,w=.5+.5*Math.cos(u*TAU*12),depth=lerp(-26.0,0.0,v);
    const scallop=2.2*Math.cos(u*TAU*12+.4)*Math.sin(v*PI);
    const h=6.3+5.0*Math.pow(w,.48)+1.1*Math.sin(v*PI)+.55*scallop;
    const q=bandCenter(a,h,depth-.77+(1-v)*3.7*Math.sin(u*TAU*12));
    return[q.x,q.y,q.z,mix('#d4c9d8','#fbf2ec',.46+.36*w+.14*v)];
  }),paper,'#fff',.38);
  draw(head,shapeGrid(112,7,(u,v)=>{
    const a=(u-.5)*2.90,w=.5+.5*Math.cos(u*TAU*12),h=1+v*(5.55+5*Math.pow(w,.48)),q=bandCenter(a,h,-26.6+3.7*Math.sin(u*TAU*12));
    return[q.x,q.y,q.z,mix('#d6cada','#fff8f0',.49+.44*w)];
  },true),paper,'#fff',.43);
  // A woven indigo ribbon separates the two flounces in profile.
  draw(head,shapeGrid(116,5,(u,v)=>{
    const a=(u-.5)*2.9,w=.5+.5*Math.cos(u*TAU*12);
    const q=bandCenter(a,8.55+4.94*Math.pow(w,.48),-9.0-3.3*v);
    return[q.x,q.y,q.z,mix('#363c61','#555e87',.18+.52*v)];
  }),silk);
  const bandInk=[],bandPiping=[],outerInk=[],rearEdge=[];
  for(let k=0;k<=100;k++){
    const u=k/100,a=(u-.5)*2.90,w=.5+.5*Math.cos(u*TAU*12);
    bandInk.push(bandCenter(a,1.2,3.0).toArray());
    bandPiping.push(bandCenter(a,2.5,3.05).toArray());
    outerInk.push(bandCenter(a,7.6+5*Math.pow(w,.48),-.7+Math.sin(u*TAU*12)).toArray());
    rearEdge.push(bandCenter(a,6.55+5*Math.pow(w,.48),-27+3.7*Math.sin(u*TAU*12)).toArray());
  }
  cord(head,bandInk,1.45,'#32385f',ink,104,7);cord(head,bandPiping,.48,'#596597',silk,104,6);
  cord(head,outerInk,.56,'#444052',ink,109,5);cord(head,rearEdge,.52,'#51485a',ink,112,5);
  for(let i=0;i<32;i++){
    const a=-1.35+2.7*i/31,p=bandCenter(a,4.15+(i%2)*1.1,.72);
    orb(head,p.x,p.y,p.z,1.0,.85,.74,'#d8cedb',paper,0,[0,0,-a],8);
  }
  // A thin, swept single ahoge, tapering at the free end.
  tube(head,[[1,251,12],[.2,264,13],[-6,277,20],[-16,284,29],[-28,284,37],[-39,278,45],[-45,266,49],[-46,263,50]],
    t=>Math.max(.12,1.20+1.7*Math.sin(PI*t)-1.13*t),t=>Math.max(.10,.80+.8*Math.sin(PI*t)-.73*t),
    (t,a)=>mix('#343d77','#657aad',.21+.39*Math.max(0,Math.sin(a))),silk,.38,35,12);
  // Whale head fins point horizontally; indigo upper membrane, ivory scalloped underside.
  for(const s of [-1,1]){
    const fin=[[64,173],[71,177,78,177,84,170],[91,165,100,162,108,160],
      [108,157,105,155,101,154],[97,154,97,151,93,151],[90,151,88,152,86,149],
      [81,148,78,149,76,151],[72,148,68,150,66,153],[62,156,61,167,64,173]];
    const membrane=[[64,172],[71,177,78,175,84,169],[92,163,101,161,107,160],
      [104,157,97,157,92,158],[86,157,82,158,78,160],[74,158,67,159,64,162],[63,167,64,172]];
    const z=(x,y)=>9.0-1.40*(Math.abs(x)-64)+.14*(y-160);
    patch(head,mirror(fin,s),z,'#ede9f0',paper,{depth:2.2,stroke:.66,line:'#323149',step:5});
    patch(head,mirror(membrane,s),(x,y)=>z(x,y)+.60,'#424976',silk,{step:5});
    patch(head,mirror(membrane,s),(x,y)=>z(x,y)-2.7,'#454d7f',silk,{step:5});
  }
  function ribbonBow(j,cx,cy,cz,size,tint,edgeShade) {
    for(const s of [-1,1]){
      const loop=[
        [0,0],[.30,.28,.81,.75,1.11,.63],[1.30,.43,1.24,-.37,1.05,-.59],
        [.85,-.67,.29,-.30,0,0]
      ];
      const transform=cmd=>cmd.map((r)=>r.map((v,i)=>i%2?cy+v*size:cx+s*v*size));
      const tilt=x=>j===head?-Math.sign(cx)*(Math.sign(cx)*(x-cx)<0?2.10:1.03)*(x-cx):0;
      const z=(x,y)=>cz+tilt(x)+1.3*Math.sin(clamp(Math.abs(x-cx)/(size*1.2))*PI)+.11*(y-cy);
      patch(j,transform(loop),z,(x,y)=>mix(tint,'#9ccbe2',.13+.16*clamp((y-cy)/size+.42)),silk,{depth:1.5,stroke:.49,line:edgeShade,step:3});
      const rib=[
        [.04,-.08],[.29,-.16,.58,-.39,.62,-.77],[.50,-.72],[.44,-.91],[.22,-.57,.13,-.37,.04,-.08]
      ];
      patch(j,transform(rib),(x,y)=>cz-.7+tilt(x),tint,silk,{depth:1,stroke:.36,line:edgeShade,step:3});
    }
    orb(j,cx,cy,cz+1.6,size*.23,size*.28,1.5,edgeShade,silk,.22,[],12);
    orb(j,cx-.24,cy+.52,cz+2.73,size*.15,size*.18,.8,'#d9c6a0',paper,0,[],10);
  }
  for(const ss of [-1,1]){
    const anchor=bandCenter(ss*1.448,.2,0);
    // This attachment is solid all the way from the band end to the knot; near
    // and far bows remain physically connected at every viewing angle.
    tube(head,[anchor.toArray(),[ss*73.6,187.7,8.0],[ss*73.8,188.4,14.5]],
      t=>2.9+1.18*Math.sin(t*PI),t=>2.2+1.6*Math.sin(t*PI),'#424e83',silk,.24,11,12);
    orb(head,ss*73.1,188.1,9.0,4.4,4.55,7.0,'#46558b',silk,.27,[],14);
    ribbonBow(head,ss*73.7,188.4,13,10.1,'#568dbf','#333e68');
  }
  // Short, white stockings barely show below the underskirt.
  for(const s of [-1,1]){
    const x=s*16;
    tube(body,[[x,29,2],[x,18,2.3],[x,8,2.5]],t=>8.0-.85*t,t=>8.8-.9*t,'#f7eceb',paper,.42,13,18);
    orb(body,x,4.6,5.8,11.3,4.1,14.1,'#302c46',uniform,.55);
    orb(body,x,7.35,7.55,11.2,5.8,14.1,'#373856',uniform,.56);
    orb(body,x,11.04,8.05,7.8,2.4,7.1,'#f5eef0',paper,.25);
    cord(body,[[x-8.0,9.0,9.0],[x-5.8,12.6,9.6],[x,13.25,9.8],[x+5.6,12.6,9.4],[x+8.2,9.2,9.0]],1.05,'#393a5b',uniform,15,7);
  }
  const skirtRadius=[[26,65],[32,64],[44,58],[60,48],[78,35],[93,28],[99,26.4]];
  function skirtQ(a,y,out=0) {
    const r=sample(skirtRadius,y),t=clamp((94-y)/68),f=(1.2+2.55*t)*Math.cos(12*a+.27*Math.sin(3*a)+.35*t);
    return V(Math.sin(a)*(r+f+out),y+.70*t*Math.cos(12*a+.2)+5.5*t*Math.sin(a)**2,5.0+Math.cos(a)*(r*.73+f*.67+out));
  }
  function skirtFace(x,y) {
    let a=Math.asin(clamp(x/(sample(skirtRadius,y)+2.1),-.91,.91));
    for(let i=0;i<3;i++){const p=skirtQ(a,y);a+=clamp((x-p.x)/(sample(skirtRadius,y)*Math.max(.38,Math.cos(a))),-.08,.08);}
    return skirtQ(a,y).z;
  }
  const skirtTex=texture(1536,320,c=>{
    c.fillStyle='#383852';c.fillRect(0,0,1536,320);
    const vg=c.createLinearGradient(0,0,0,320);vg.addColorStop(0,'rgba(73,74,117,.35)');vg.addColorStop(.70,'rgba(73,74,117,0)');vg.addColorStop(1,'rgba(30,26,46,.3)');
    c.fillStyle=vg;c.fillRect(0,0,1536,320);
    for(let i=0;i<18000;i++){c.fillStyle=i%2?'rgba(178,164,171,.025)':'rgba(24,25,47,.032)';c.fillRect(random()*1536,random()*320,1,1);}
    for(const [y,clr,w] of [[311,'#25283f',4.3],[303,'#a293a8',2.4],[297,'#5f5f86',3.8],[240,'#73728e',1.3],[245,'#c0a696',1.05]]){
      c.strokeStyle=clr;c.lineWidth=w;c.beginPath();c.moveTo(0,y);c.lineTo(1536,y);c.stroke();
    }
    for(let i=-1;i<=31;i++){
      c.save();c.translate(i*51.2,0);
      brush(c,'M -27 273 C -14 263 -10 280 0 280 C 13 281 12 260 26 269',null,'#b8a393',2.2);
      brush(c,'M -25 279 Q -14 271 -7 281 M 2 283 Q 10 276 18 275',null,'#8586a4',1.9);
      for(const sign of [-1,1]){
        c.save();c.scale(sign,1);
        brush(c,'M 8 276 Q 11 264 18 263 Q 20 269 8 276 Z','#b3a092');
        brush(c,'M 14 269 Q 15 258 19 255 Q 22 262 14 269 Z','#8b849e');
        c.restore();
      }
      c.fillStyle=i%3?'#b1a4af':'#caa98a';c.beginPath();c.ellipse(0,278,3.4,3.15,0,0,TAU);c.fill();
      c.restore();
    }
    for(let i=0;i<12;i++){
      c.save();c.translate(64+i*128,263);
      for(let j=0;j<5;j++){c.rotate(TAU/5);c.fillStyle=j%2?'#ceaa91':'#e1c1a3';c.beginPath();c.ellipse(0,-3.3,2.1,3.5,0,0,TAU);c.fill();}
      c.fillStyle='#e7cf97';c.beginPath();c.arc(0,0,2.3,0,TAU);c.fill();c.restore();
    }
  });
  const skirtMat=toon(.73,skirtTex);
  draw(body,shapeGrid(144,24,(u,v)=>{
    const a=(u-.5)*TAU,y=lerp(26,98,v),p=skirtQ(a,y),val=.91+.08*Math.cos(a*12+.3);
    return[p.x,p.y,p.z,C('#ffffff').multiplyScalar(val)];
  }),skirtMat,'#fff',.79);
  // Full, scalloped white petticoat flounce and its folded lace tips.
  draw(body,shapeGrid(204,9,(u,v)=>{
    const a=(u-.5)*TAU,n=.5+.5*Math.cos(28*a),fine=.5+.5*Math.cos(56*a+.7);
    const r=63.5+3.2*Math.cos(14*a+.2)+1.55*n+2.1*Math.sin(PI*v)-7.2*smooth(clamp((v-.37)/.63));
    const y=17.5+12.5*v+3.1*(1-n)*(1-v)+.46*fine+7.5*Math.sin(a)**2;
    return[Math.sin(a)*r,y,5+Math.cos(a)*(r*.74),mix('#d9cddc','#fff6ed',.39+.49*n+.10*v)];
  }),paper,'#fff',.67);
  for(const vv of [.15,.34]){
    const pts=[];
    for(let i=0;i<=168;i++){
      const a=-PI+i/168*TAU,n=.5+.5*Math.cos(28*a),fine=.5+.5*Math.cos(56*a+.7);
      const r=63.67+3.2*Math.cos(14*a+.2)+1.55*n+2.1*Math.sin(PI*vv)-7.2*smooth(clamp((vv-.37)/.63));
      const yy=17.5+12.5*vv+3.1*(1-n)*(1-vv)+.46*fine+7.5*Math.sin(a)**2;
      pts.push([Math.sin(a)*r,yy,5+Math.cos(a)*(r*.74)]);
    }
    cord(body,pts,.23,'#c0aec0',paper,169,5);
  }
  // A compact bodice keeps the shoulders narrow under the oversized hair.
  ellipseLathe(body,[[91,26,17,2],[99,25.5,17,2],[108,28,18.4,2],[117,31,18,1],[123,26,16,0],[127,14,12,0]],uniform,'#373953',.67);
  orb(body,0,126.6,1,9,6.7,7,'#ffecde',skin,.30);
  ellipseLathe(body,[[90,27.5,18.6,2],[91.5,28,19.0,2],[95,27.6,19,2],[96,26.5,18.5,2]],paper,'#e9e3e1',.36);
  const upperBib=[[-14,122],[-9,125,8,125,14,122],[13.5,111,13,101,13,96.5],[-13,96.5],[-13.7,108,-14,116,-14,122]];
  patch(body,upperBib,(x,y)=>21.0-.020*x*x,'#f7efea',paper,{depth:1,stroke:.37,line:'#5a4f65',step:4});
  patch(body,[[-15,104],[15,104],[14.5,96],[-14.4,96]],(x,y)=>21.85-.016*x*x,'#3a3a51',uniform,{step:4});
  for(let r=0;r<2;r++)for(let k=-2;k<=2;k++)orb(body,k*5.7,98.2+r*3.4,22.2-.016*(k*5.7)**2,.63,.71,.4,'#e7dce2',paper,0,[],8);
  for(const s of [-1,1]){
    const pts=[[s*17.4,94.3,16.5],[s*19.2,104.8,17.9],[s*21.3,116.0,15.6],[s*23,123.5,9.8],[s*22,124.6,2.7],[s*19,120.9,-9.6]];
    const cc=curve3(pts);
    draw(body,shapeGrid(5,42,(u,v)=>{
      const p=cc.getPoint(v),w=.6+.4*Math.cos(TAU*v*7),d=(u-.46)*(4.5+3.8*w);
      p.x+=s*d;p.y+=.8*w*u;p.z+=1.0*Math.sin(v*TAU*7)*u;
      return[p.x,p.y,p.z,mix('#daccaF','#fff8ef',.59+.34*w)];
    }),paper,'#fff',.37);
    const collar=[[0,126],[6,129,12,127,16,124],[17,121,12,118,8,116],[4,120,2,121,0,126]];
    patch(body,mirror(collar,s),(x,y)=>17.5+(126-y)*.35,'#f7eee9',paper,{depth:1,stroke:.38,line:'#61566b',step:3});
  }
  ribbonBow(body,0,120,22.1,10.0,'#353855','#2b2b43');
  orb(body,0,119.7,25.0,3.15,4.0,1.2,'#c3aa89',china,.40);
  orb(body,0,119.8,26.0,2.12,2.98,1.0,'#586c99',china,.22);
  for(let k=0;k<3;k++)orb(body,0,113-k*4.9,22.7,.97,1.00,.56,'#635968',china,0,[],10);
  // Rounded apron with a separate scalloped outer ruffle. Its small whale
  // embroidery, stitches and spray droplets are painted from fresh paths.
  const apronC=[[-25,92.0],[-15,94,14,94,25,92],[26,88,24,84,28,77],
    [33,68,33,60,29,54],[23,45,13,43,0,43],[-13,43,-24,46,-29,54],
    [-33,59,-33,69,-28,77],[-24,84,-26,88,-25,92]];
  const apBorder=contour(apronC),center2=new T.Vector2(0,69);
  const ruffles=[];
  for(let i=0;i<apBorder.length;i++){
    const p=apBorder[i],v=p.clone().sub(center2).normalize(),q=p.clone().addScaledVector(v,2.3+1.27*Math.cos(i/apBorder.length*TAU*18));
    ruffles.push([q.x,q.y]);
  }
  patch(body,ruffles,(x,y)=>skirtFace(x,y)+2.40,(x,y)=>mix('#e6dce4','#fff4eb',.64+.30*Math.cos(1.2*x+.5*y)),paper,
    {depth:1.24,stroke:.65,line:'#51465d',step:4.3});
  const apronInner=[[-23,91],[-10,92.4,11,92.4,23,91],[22.5,84,23,81.5,25.7,76],
    [29.9,67,29.7,59.5,25.8,54.5],[21,48,10.8,46.3,0,46.3],[-12,46.4,-21,48.7,-25.8,54.5],
    [-30.1,60,-30.2,67.7,-25.8,76.2],[-22.6,82,-22.6,85,-23,91]];
  patch(body,apronInner,(x,y)=>skirtFace(x,y)+3.15,'#fff6ee',paper,{depth:.43,stroke:.35,line:'#b4a8b6',step:3.9});
  const inBorder=contour(apronInner);
  for(let i=0;i<inBorder.length;i+=3){
    const p=inBorder[i],ir=p.clone().lerp(center2,.065);orb(body,ir.x,ir.y,skirtFace(ir.x,ir.y)+3.65,.43,.47,.22,'#c4b3c0',paper,0,[],6);
  }
  const stitchedZ=(x,y)=>skirtFace(x,y)+4.17;
  const whale=[[-11.8,63.8],[-11.3,70,-5.4,73.1,-1.1,71.4],[3.2,70.4,4.8,66.5,6.9,65.1],
    [9.4,63.8,12.2,64.4,14.0,67.0],[14.6,69.2,15.6,70.0,17.2,70.2],
    [17.3,68.1,17.1,66.7,16.1,65.2],[17.1,65.9,18.4,65.7,19.2,65.1],
    [17.8,62.7,15.8,61.9,14.1,62.0],[11.4,56.6,6.7,54.6,1.3,54.8],
    [-5.0,54.7,-10.0,57.6,-11.8,61.3],[-12.0,62.1,-12.0,63.0,-11.8,63.8]];
  patch(body,whale,stitchedZ,(x,y)=>mix('#4f77be','#7198d0',clamp((70-y)/17)),silk,{stroke:.27,line:'#57629a',step:3});
  patch(body,[[-10.8,61.6],[-7.7,58.3,-1.2,56.7,5.0,57.8],[2.3,54.3,-6.3,55.0,-9.9,59.7],[-10.4,60.4,-10.7,61,-10.8,61.6]],
    (x,y)=>stitchedZ(x,y)+.28,'#b9d7e3',paper,{step:2});
  orb(body,-7.7,66.2,stitchedZ(-7.7,66.2)+.50,.72,.77,.29,'#364b7b',paper,0,[],9);
  patch(body,[[-1.1,62.8],[1.0,63.0,3.7,61.9,5.2,60.9],[4.1,59.6,1.7,59.4,.2,60.8],[-.6,61.4,-.8,62.2,-1.1,62.8]],
    (x,y)=>stitchedZ(x,y)+.41,'#5379b3',paper,{step:2});
  for(const [x,y,rx,ry,a] of [[-4.9,76.1,1.15,1.7,-.40],[-1.4,77.8,1.15,1.9,.24],[-7.5,73.8,.75,1.08,-.56]]){
    orb(body,x,y,stitchedZ(x,y)+.19,rx,ry,.75,'#76a1c5',paper,0,[0,0,a],10);
  }
  for(const s of [-1,1]){
    const a=s*.73,y=35,p=skirtQ(a,y,1.0);
    ribbonBow(body,p.x,y+2,p.z+1.1,3.4,'#bd9971','#665365');
  }
  // Both arms share a serving pose. The fingers cradle the two sides of one
  // full porcelain bowl; its foot finishes above the embroidered apron whale.
  for(const s of [-1,1]){
    tube(serving,[[s*24.4,118.5,.2],[s*31.3,111.1,3.2],[s*38.9,99.5,8.7],[s*38.9,96.9,13.3]],
      t=>sample([[0,7.1],[.24,11.1],[.63,9.4],[1,9.3]],t),t=>sample([[0,6.9],[.27,10],[.68,8.6],[1,8.6]],t),
      (t,a)=>mix('#34344f','#454663',.22+.19*Math.sin(a)),uniform,.53,23,20);
    tube(serving,[[s*39.3,98.1,11.8],[s*38.4,94.7,21.2],[s*33.1,94.0,30.3],[s*28.7,94.2,35.0]],
      t=>sample([[0,9.1],[.32,9.5],[.70,8.1],[1,7.4]],t),t=>sample([[0,8.4],[.36,8.7],[1,7.0]],t),
      (t,a)=>mix('#353752','#454662',.20+.18*Math.cos(a)),uniform,.55,20,20);
    tube(serving,[[s*31.3,94.1,32.4],[s*29.0,94.3,35.2],[s*27.6,94.4,36.9]],
      t=>7.8-.42*t,t=>7.5-.46*t,'#303145',uniform,.38,9,20);
    tube(serving,[[s*30.05,94.2,33.7],[s*29.5,94.2,34.4]],t=>7.86,t=>7.43,'#9895ad',paper,0,7,20);
    tube(serving,[[s*28.4,94.4,35.7],[s*26.4,94.3,38.2],[s*25.5,94.4,39.6]],
      (t)=>7.95-.65*t,(t)=>7.3-.7*t,(t,a)=>mix('#e3d9e2','#fff5eb',.52+.4*Math.cos(9*a)),paper,.35,9,26);
    orb(serving,s*24.7,93.2,43.1,5.9,4.3,4.1,'#ffe7d9',skin,.43,[0,-s*.37,-s*.15],18);
    orb(serving,s*24.1,96.9,45.75,2.85,3.9,2.4,'#ffe9d9',skin,.38,[0,-s*.24,-s*.19],16);
    for(let i=0;i<3;i++){
      const x=s*(22.55-i*1.64),yy=90.2+i*.31,zz=46.5+i*.61;
      orb(serving,x,yy,zz,2.95,1.23,1.77,i===0?'#f5d8cc':'#ffe6d6',skin,.16,[0,-s*.39,-s*.19],12);
    }
  }
  const bx=0,by=81.8,bz=42.2;
  const bowlProfile=[[0,2.15],[8.2,2.15],[8.45,3.35],[8.35,4.1],[11.5,4.95],[15.3,6.9],[18.5,10.4],[20.9,14.7],
    [22.5,18.75],[22.55,20.25],[22.0,20.9],[21.1,20.3],[19.9,17.0],[16.1,11.3],[9.0,6.2],[0,5.2]];
  function vessel(points,tint) {
    const g=new T.LatheGeometry(points.map(p=>new T.Vector2(p[0],p[1])),50);g.translate(bx,by,bz);draw(dish,g,china,tint,.32);
  }
  vessel(bowlProfile,'#f4f4eb');
  function bowlBand(y,r,tint,w) {
    const g=new T.TorusGeometry(r,w,7,54);g.rotateX(-PI/2);g.translate(bx,by+y,bz);draw(dish,g,china,tint);
  }
  bowlBand(20.45,22.37,'#42648f',.55);bowlBand(18.75,22.53,'#789bb5',.21);bowlBand(3.13,8.49,'#6285a6',.33);
  for(let i=0;i<13;i++){
    const pts=[];
    for(let k=0;k<=13;k++){
      const q=k/13,a=(i+q*.87+.06)*TAU/13,yy=12.6+1.3*Math.sin(q*TAU)+1.16*Math.sin(q*PI);
      const rr=18.5+(yy-10.4)*(2.45/4.3)+.14;
      pts.push([bx+rr*Math.sin(a),by+yy,bz+rr*Math.cos(a)]);
    }
    cord(dish,pts,.32,'#5a82a7',china,15,5);
  }
  dish.node.scale.set(1.14,1.035,1.12);
  orb(dish,bx,by+19.50,bz,21.23,7.64,20.86,'#d9d3bd',paper,0,[],26);
  orb(dish,bx,by+19.91,bz,21.1,7.61,20.68,'#f6f2e2',paper,0,[],26);
  for(let k=0;k<111;k++){
    const a=k*2.399963229728653,r=Math.sqrt((k+.45)/111.3),x=20.65*r*Math.cos(a),z=20.11*r*Math.sin(a);
    const h=20.43+7.25*Math.sqrt(1-r*r)+.30*Math.sin(k*3.7);
    orb(dish,bx+x,by+h,bz+z,1.34+.23*random(),.51+.11*random(),.61+.09*random(),
      mix('#dbd4be','#fffbed',.38+.59*random()),paper,0,[.17*random(),random()*PI,.12*random()],8);
  }
  for(let k=0;k<2;k++){
    const off=k*1.66;
    tube(dish,[[-11.2-off,by+20.3,bz-8.1],[-15.8-off,by+28.0,bz-10.0],[-19.7-off,by+34.3,bz-12.3]],
      t=>.34+.21*t,t=>.34+.21*t,'#ac885c',paper,0,11,8);
  }
  // The peduncle leaves the lumbar region, curves below the nape and turns
  // slightly outwards. Both flukes fan into the opening in the long side curl.
  tube(tail,[[6,55,-23],[19,49,-51],[35,42,-75],[51,38,-89],[66,38,-95],[77,42,-96],[83,48,-96]],
    t=>sample([[0,7.8],[.28,8.4],[.64,7.7],[1,4.9]],t),t=>sample([[0,7.1],[.28,8.5],[.65,7.5],[1,4.8]],t),
    (t,a)=>mix('#3c4c80','#7392c5',.27+.48*(.5+.5*Math.sin(a))),silk,.64,34,20);
  const flukeUp=[[79.1,45.9],[75.6,54.5,75.9,62.3,79.1,70.6],[81.3,75.4,83.9,79.1,87.0,82.3],
    [87.6,78.0,92.8,74.6,94.1,67.9],[96.4,58.4,91.7,51.1,86.0,47.0],[83.8,45.3,81.5,45.0,79.1,45.9]];
  const flukeSide=[[81.0,44.5],[86.8,53.5,94.7,59.1,102.0,59.6],[105.7,59.5,111.4,56.6,115.8,58.5],
    [112.6,51.8,106.5,45.7,99.1,42.2],[92.0,39.0,85.8,39.7,81.0,44.5]];
  function flukeZ(x,y){return -96.3-.57*(x-83)+.23*(y-46)+1.48*Math.sin((x-75)*.062);}
  const flukeSurface=(x,y,i)=>flukeZ(x,y)+i*.53+1.08*Math.sin((y-40.7)*.076);
  for(const [i,cp] of [flukeUp,flukeSide].entries()){
    const surfaceZ=(x,y)=>flukeSurface(x,y,i);
    const shade=(x,y)=>clamp(.24+.57*Math.sin((y-38)*.058)+.10*Math.cos((x-83)*.09));
    patch(tail,cp,surfaceZ,(x,y)=>mix('#415783','#789dc9',shade(x,y)),silk,
      {depth:3.35,stroke:.71,line:'#30365e',step:3.7});
    // The reverse membrane has its own ink and blue, ribbed surface, matching
    // the front decoration across the edge instead of becoming a dark silhouette.
    patch(tail,cp,(x,y)=>surfaceZ(x,y)-3.78,(x,y)=>mix('#415d92','#81a7d0',shade(x,y)),silk,{step:3.7});
    const border=contour(cp),line=[...border,border[0]].map(p=>[p.x,p.y,surfaceZ(p.x,p.y)-4.0]);
    cord(tail,line,.54,'#37446e',ink,Math.min(86,line.length),6);
  }
  const finRibs=[
    [[82.4,47.5],[80.3,54.8],[80.7,61.8],[85.0,74.5]],
    [[83.4,47.6],[85.7,54.9],[88.0,61.4],[88.5,68.9]],
    [[84.7,47.2],[92.4,51.2],[102.0,54.6],[109.4,56.5]],
    [[87.4,44.1],[93.4,45.1],[98.9,47.1],[104.6,51.2]]
  ];
  for(const [k,rib] of finRibs.entries())for(const rear of [false,true]){
    const i=k<2?0:1,p=rib.map(([x,y])=>[x,y,flukeSurface(x,y,i)+(rear?-4.10:.48)]);
    tube(tail,p,t=>.09+.38*Math.sin(t*PI),t=>.08+.21*Math.sin(t*PI),rear?'#9cbdd8':'#93b4d4',silk,0,15,6);
  }
  // Combine rigid vertices by joint and material. The hand-drawn seams, curls,
  // trims, stitches and painted facial details remain true 3D meshes and decals.
  function merge(geos) {
    let count=0,indices=0;for(const g of geos){count+=g.attributes.position.count;indices+=g.index?g.index.count:g.attributes.position.count;}
    const pos=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2),color=new Float32Array(count*3),
      idx=count>65535?new Uint32Array(indices):new Uint16Array(indices);
    let start=0,ni=0;
    for(const g of geos){
      const a=g.attributes,n=a.position.count;
      pos.set(a.position.array,start*3);normal.set(a.normal.array,start*3);
      if(a.uv)uv.set(a.uv.array,start*2);if(a.color)color.set(a.color.array,start*3);
      if(g.index){for(const i of g.index.array)idx[ni++]=i+start;}else{for(let i=0;i<n;i++)idx[ni++]=i+start;}
      start+=n;g.dispose();
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(normal,3));
    g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('color',new T.BufferAttribute(color,3));
    g.setIndex(new T.BufferAttribute(idx,1));g.computeBoundingSphere();return g;
  }
  for(const j of skeleton){
    for(const [m,parts] of j.bins){
      const mesh=new T.Mesh(merge(parts),m);mesh.castShadow=m!==faceMat;mesh.receiveShadow=false;
      if(m===faceMat)mesh.renderOrder=2;j.node.add(mesh);
    }
    if(j.outlines.length){const m=new T.Mesh(merge(j.outlines),outline);m.castShadow=false;j.node.add(m);}
    j.bins.clear();j.outlines=[];
  }
  function update(time,excitement=0) {
    const e=clamp(excitement),t=time,b=Math.sin(1.65*t),s=Math.sin(1.27*t+.4);
    artwork.position.y=.004*(1+b)+.013*e*(1+Math.sin(t*3.0));
    body.node.rotation.z=.008*Math.sin(t*1.13)+e*.013*Math.sin(t*2.72);
    head.node.rotation.z=.014*Math.sin(t*.91)+.011*e*Math.sin(t*3.41);
    head.node.rotation.y=.025*Math.sin(t*.71);
    head.node.rotation.x=.015*Math.sin(t*.81)-.027*e*(.5+.5*Math.sin(t*2.48));
    serving.node.position.y=119+.40*b+1.75*e*(.64+.36*s);
    serving.node.rotation.x=-.013-.011*b-.045*e*(.66+.34*s);
    tail.node.rotation.y=.065*Math.sin(t*1.45)+.047*e*Math.sin(t*2.7);
    tail.node.rotation.z=.035*Math.sin(t*1.45-.4);
    const blinkPhase=((t+1.8)%4.82+4.82)%4.82,cl=blinkPhase<.19?Math.sin(PI*blinkPhase/.19):0;
    const face=expressions[e>.45?1:0][cl>.82?2:cl>.24?1:0];if(faceMat.map!==face)faceMat.map=face;
  }
  update(0,0);return {root,update};
}
