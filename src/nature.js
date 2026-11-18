/* Botanical studies and landscape, made specifically for Bellwater. */
const bellNature=(()=>{
  const circle=Math.PI*2;
  const up=new THREE.Vector3(0,1,0);
  const v=(x,y,z)=>new THREE.Vector3(x,y,z);
  const co=(s)=>new THREE.Color(s);
  const mixN=(a,b,t)=>a+(b-a)*t;
  const satN=x=>Math.max(0,Math.min(1,x));
  const smoothN=(a,b,x)=>{const t=satN((x-a)/(b-a));return t*t*(3-2*t);};
  const makeRandom=(s)=>{let q=(s|0)>>>0;return ()=>{q=(Math.imul(q,1664525)+1013904223)>>>0;return q/4294967296;};};
  const wind={value:0};
  const treeCache=new Map(), bedCache=new Map(), materials={};
  function data(){return {p:[],n:[],c:[],u:[],i:[]};}
  function pt(d,p,col,uv=[0,0],n=up){d.p.push(p.x,p.y,p.z);d.n.push(n.x,n.y,n.z);d.c.push(col.r,col.g,col.b);d.u.push(uv[0],uv[1]);return d.p.length/3-1;}
  function geo(d,calc=false){
    const g=new THREE.BufferGeometry();for(const [name,a,count] of [['position',d.p,3],['normal',d.n,3],['uv',d.u,2],['color',d.c,3]])g.setAttribute(name,new THREE.Float32BufferAttribute(a,count));
    g.setIndex(d.i);if(calc)g.computeVertexNormals();g.computeBoundingSphere();return g;
  }
  function tex(w,h,drawer,repeat=false){
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    drawer(canvas.getContext('2d'),w,h);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
    if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;
  }
  const hsl=(h,s,l)=>'hsl('+h+' '+s+'% '+l+'%)';
  function leafShape(c,r,kind,len,angle,x,y){
    c.save();c.translate(x,y);c.rotate(angle);c.scale(len,len);
    const isPlane=kind==='plane', hue=isPlane?74+r()*17:103+r()*18, light=isPlane?34+r()*18:26+r()*18, sat=isPlane?31+r()*16:33+r()*16;
    const g=c.createLinearGradient(-.53,-.3,.47,-.60);
    g.addColorStop(0,hsl(hue+3,sat+2,light*.72));g.addColorStop(.46,hsl(hue,sat,light*.94));g.addColorStop(.50,hsl(hue-2,sat+1,light*1.11));g.addColorStop(1,hsl(hue+1,sat-2,light*.88));
    c.fillStyle=g;c.beginPath();c.moveTo(0,0);
    if(isPlane){
      const contour=[[-.12,-.10],[-.26,-.13],[-.25,-.22],[-.48,-.23],[-.42,-.31],[-.65,-.47],[-.42,-.48],[-.47,-.56],[-.26,-.49],[-.33,-.67],[-.24,-.62],[-.29,-.84],[-.15,-.74],[-.03,-1],[.09,-.77],[.19,-.85],[.18,-.67],[.33,-.75],[.28,-.54],[.53,-.62],[.43,-.50],[.61,-.55],[.47,-.38],[.55,-.39],[.34,-.23],[.17,-.22],[.18,-.12]];
      for(const [a,b] of contour)c.lineTo(a*rngLeaf(r),b*rngLeaf(r));
    }else{c.bezierCurveTo(-.35,-.18,-.32,-.63,.01,-1);c.bezierCurveTo(.24,-.69,.32,-.18,0,0);}
    c.closePath();c.fill();
    c.strokeStyle=hsl(hue-9,sat*.8,Math.min(77,light+16));c.lineWidth=.014;c.beginPath();c.moveTo(0,-.03);c.quadraticCurveTo(-.01,-.43,0,-.90);c.stroke();
    c.strokeStyle='rgba(214,221,139,.36)';c.lineWidth=.011;
    for(let j=0;j<3;j++)for(const side of [-1,1]){const yy=-.13-.19*j;c.beginPath();c.moveTo(0,yy);c.quadraticCurveTo(.10*side,yy-.10,(isPlane?.37:.20)*side,yy-.17);c.stroke();}
    c.restore();
  }
  function rngLeaf(r){return .94+r()*.12;}
  function broadSpray(c,r,kind){
    const stemCol=kind==='orange'?'#69804b':'#8a8352';
    const ox=127+r()*14-7,lean=(r()-.5)*56;
    const stemAt=t=>[ox+lean*t+13*Math.sin(t*2.8),244-220*t];
    function twig(x,y,angle,len,count){
      const dx=Math.sin(angle),dy=-Math.cos(angle);const tip=[x+dx*len,y+dy*len];
      c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+dx*len*.45-2,y+dy*len*.50+2,...tip);c.lineWidth=1.8;c.strokeStyle=stemCol;c.stroke();
      for(let j=0;j<count;j++){
        const t=(j+.20)/count;const side=j%2?1:-1;leafShape(c,r,kind,(18+10*r())*(1-.15*t),angle+side*(.60+r()*.49),x+dx*len*t,y+dy*len*t);
      }leafShape(c,r,kind,25+r()*11,angle-.12+r()*.24,...tip);
    }
    for(let i=0;i<7;i++){
      const t=.10+i*.097+(r()-.5)*.025,[x,y]=stemAt(t),side=i%2?-1:1,ang=side*(.84+r()*.30);
      twig(x,y,ang,(58+r()*24)*(1-.18*t),kind==='plane'?4:6);
    }
    c.strokeStyle=stemCol;c.lineCap='round';c.lineWidth=2.8;c.beginPath();let p=stemAt(0);c.moveTo(...p);for(let j=1;j<=14;j++){p=stemAt(j/14);c.lineTo(...p);}c.stroke();
    for(let i=0;i<11;i++){const t=.11+i*.083;const [x,y]=stemAt(t);leafShape(c,r,kind,26+r()*13,((i%2)?1:-1)*(.59+r()*.33),x,y);}
    p=stemAt(.93);leafShape(c,r,kind,22,-.13,...p);
  }
  function fineSpray(c,r,kind){
    const pine=kind==='pine';c.lineCap='round';
    function sprig(x,y,angle,length,level){
      const dx=Math.sin(angle),dy=-Math.cos(angle),bx=(r()-.5)*.13,by=(r()-.5)*.09;
      function along(t){return [x+(dx+bx*t)*length*t,y+(dy+by*t)*length*t];}
      c.strokeStyle=level===0?'#626442':level===1?'#697b49':'#71854f';
      c.lineWidth=level===0?3.2:level===1?2.15:1.25;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(...along(.5),...along(1));c.stroke();
      const n=level===2?(pine?16:14):(level===0?10:6);
      for(let j=0;j<n;j++){
        const t=(j+.5)/n,side=j%2?-1:1,[ax,ay]=along(t);
        if(level<2){const a=angle+side*((pine?.53:.46)+r()*.30),l=length*(level===0?.32:.41)*(1-.29*t)*(.9+r()*.29);sprig(ax,ay,a,l,level+1);}
        if(level===2||pine){
          const ls=level===2?(pine?(9+r()*13):(5+r()*8)):(pine?(9+r()*11):7);
          const a=angle+side*(.49+r()*.35),cc=level===2?(pine?105:125):(pine?97:118),lum=(pine?27:24)+r()*20;
          c.strokeStyle=hsl(cc+r()*15, pine?25+r()*15:15+r()*17,lum);
          c.lineWidth=level===2?(pine?1.4:2.5):1.35;
          c.beginPath();c.moveTo(ax,ay);c.quadraticCurveTo(ax+Math.sin(a)*ls*.55,ay-Math.cos(a)*ls*.4,ax+Math.sin(a)*ls,ay-Math.cos(a)*ls);c.stroke();
        }
      }
    }
    if(pine){sprig(128,238,-.21-r()*.08,174,0);sprig(129,238,.23+r()*.10,155,0);}
    else{sprig(123,242,-.19,174,0);sprig(130,245,.24,164,0);sprig(122,241,.01,202,0);}
  }
  function barkMap(kind){
    return tex(384,512,(c,W,H)=>{
      const r=makeRandom(kind==='plane'?3737:kind==='pine'?9821:1792);
      const plane=kind==='plane',pine=kind==='pine',base=plane?'#aaa384':pine?'#82694b':'#827c5f';
      c.fillStyle=base;c.fillRect(0,0,W,H);
      // A looping mosaic of flaking plates and shallow vertical fissures.
      for(let level=0;level<3;level++){
        const count=plane?[175,320,400][level]:[195,300,440][level];
        for(let j=0;j<count;j++){
          const x=r()*W,y=r()*H,rx=(2+r()*22)/(level+.85),ry=(7+r()*(plane?24:68))/(level+.7);
          const palette=plane?['#c4bc93','#ded1a7','#93947a','#828269','#aca180','#cdc19c']:pine?['#614b36','#927555','#a57e50','#6e553d','#877054']:['#695f4a','#968c69','#8f8569','#786d51'];
          c.fillStyle=palette[Math.floor(r()*palette.length)];const a=.1+r()*.26;c.globalAlpha=a;
          const pattern=[];for(let k=0;k<11;k++){const a=circle*k/11,t=.65+r()*.42;pattern.push([Math.cos(a)*rx*t,Math.sin(a)*ry*t]);}
          for(const ox of [-W,0,W])for(const oy of [-H,0,H]){
            if(x+ox+rx<0||x+ox-rx>W||y+oy+ry<0||y+oy-ry>H)continue;
            c.beginPath();pattern.forEach(([xx,yy],i)=>i?c.lineTo(x+ox+xx,y+oy+yy):c.moveTo(x+ox+xx,y+oy+yy));c.closePath();c.fill();
          }
        }
      }
      for(let j=0;j<540;j++){
        let x=r()*W,y=r()*H,l=(5+r()*39)*(pine?1.25:.75);c.strokeStyle=r()>.42?'rgba(54,48,34,.36)':'rgba(219,195,147,.37)';c.globalAlpha=.6;
        for(const oy of [0,-H]){c.lineWidth=.5+r()*1.5;c.beginPath();c.moveTo(x,y+oy);c.bezierCurveTo(x+2,y+oy+l*.35,x-3,y+oy+l*.72,x+1.5,y+oy+l);c.stroke();}
      }c.globalAlpha=1;
    },true);
  }
  function willowSpray(c,r){
    for(let s=0;s<4;s++){
      const rootX=124+(s-1.5)*10,tipX=125+(s-1.5)*43+(r()-.5)*27,tipY=16+r()*28;
      const path=t=>[mixN(rootX,tipX,t)+9*Math.sin(t*3.2+s)*t,244-(244-tipY)*t];
      c.beginPath();c.moveTo(rootX,244);for(let j=1;j<=16;j++)c.lineTo(...path(j/16));
      c.strokeStyle='#8c8d60';c.lineWidth=1.9;c.stroke();
      for(let j=0;j<22;j++){const at=(j+.3)/23,[x,y]=path(at),side=j%2?1:-1;const an=(s-1)*.15+side*(.38+r()*.37),l=25+r()*18,wi=4.2+r()*3,hue=85+r()*21,lu=30+r()*18;
        c.save();c.translate(x,y);c.rotate(an);c.fillStyle=hsl(hue,22+r()*16,lu);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-wi,-l*.29,0,-l);c.quadraticCurveTo(wi*1.13,-l*.55,0,0);c.fill();
        if(j%3===0){c.strokeStyle='rgba(210,220,158,.52)';c.lineWidth=.65;c.beginPath();c.moveTo(0,-3);c.lineTo(0,-l*.90);c.stroke();}c.restore();
      }
    }
  }
  function buildWillow(){
    const r=makeRandom(310725),st=data(),leaves=data(),upperLeaves=data(),trunkBase=v(0,-.07,0),trunkK=v(-.14,.95,.10),knot=v(.17,2.20,.14),trunkTip=v(.07,3.52,.23);
    pipe(st,[trunkBase,trunkK,knot,trunkTip],[.36,.26,.22,.055],10,r,'willow');
    for(let j=0;j<9;j++){
      const a=j*2.39996+.31+(r()-.5)*.28,dist=1.52+r()*.55,origin=trunkK.clone().lerp(knot,.28+.66*r());
      const knee=v(Math.cos(a)*dist*.47,3.5+r()*.56,Math.sin(a)*dist*.49),top=v(Math.cos(a)*dist,4.0+r()*.53,Math.sin(a)*dist);
      pipe(st,[origin,knee,top],[.15-r()*.04,.075,.025],7,r,'willow');
      for(let k=0;k<28;k++){
        const aa=r()*circle,rad=.22+.77*r(),p=top.clone().add(v(Math.cos(aa)*rad,(r()-.4)*.75,Math.sin(aa)*rad));
        const no=v(.31*Math.cos(aa)+p.x*.18,.73,.31*Math.sin(aa)+p.z*.18).normalize();
        sprayCard(leaves,p,aa,p.y>top.y?.3+r()*.60:-.65+r()*.56,1.12+r()*.35,1.05+r()*.37,'willow',r,no,.77+.22*r());
        if(k%2===0){const q=p.clone().add(v((r()-.5)*.34,.19+r()*.13,(r()-.5)*.35));sprayCard(upperLeaves,q,aa+.53,.15+r()*.74,1.18,1.38,'plane',r,no,.69+r()*.20);}
      }
      for(let k=0;k<9;k++){
        const aa=a+(r()-.5)*1.42,reach=.25+.79*r(),dx=Math.cos(aa),dz=Math.sin(aa);
        const tip=top.clone().add(v(dx*reach,-.22-r()*.49,dz*reach)),end=tip.clone().add(v(dx*(.25+r()*.31),-1.06-r()*1.42,dz*.32));
        const shoulder=top.clone().lerp(tip,.47).addScaledVector(up,.15+r()*.15);pipe(st,[top,shoulder,tip,end],[.028,.018,.013,.004],4,r,'willow');
        const no=v(dx,.38,dz).normalize(),len=tip.distanceTo(end);
        for(let b=0;b<3;b++){const loc=tip.clone().lerp(end,(b+.38)/3);sprayCard(leaves,loc,aa+(r()-.5)*.58,-1.13-r()*.33,.63+r()*.35,len*.67,'willow',r,no,.79+r()*.21);}
      }
    }
    return [[geo(st),getMat('willow','bark')],[geo(leaves),getMat('willow','spray')],[geo(upperLeaves),getMat('plane','spray')]];
  }

  function getMat(kind,slot){
    const k=kind+':'+slot;if(materials[k])return materials[k];
    let m;
    if(slot==='bark'){
      m=new THREE.MeshStandardMaterial({map:barkMap(kind),roughness:.96,vertexColors:true});
    }else if(slot==='spray'){
      const atlas=tex(512,512,c=>{for(let i=0;i<4;i++){c.save();c.translate((i%2)*256,Math.floor(i/2)*256);c.beginPath();c.rect(2,2,252,252);c.clip();const r=makeRandom(2117+i*4931+kind.charCodeAt(0)*23);if(kind==='willow')willowSpray(c,r);else if(kind==='plane'||kind==='orange')broadSpray(c,r,kind);else fineSpray(c,r,kind);c.restore();}});
      m=new THREE.MeshStandardMaterial({map:atlas,alphaTest:kind==='willow'?.15:kind==='pine'?.23:.33,vertexColors:true,side:THREE.DoubleSide,roughness:.90,emissive:0x101a0b,emissiveIntensity:.26});
      m.alphaToCoverage=true;
      m.onBeforeCompile=s=>{
        s.uniforms.botanicalTime=wind;
        s.vertexShader='uniform float botanicalTime;\n'+s.vertexShader;
        s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat sway=sin(position.x*.93+position.z*.65+botanicalTime*1.10)+.45*sin(position.z*1.76-botanicalTime*1.79); transformed.x+=sway*.016*(.4+uv.y); transformed.z+=sway*.011;');
        s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nif(!gl_FrontFacing) normal=-normal;');
      };
      m.customProgramCacheKey=()=> 'bellwater-botanical-wrap-1';
    }else if(slot==='core'){
      const map=tex(192,256,(c,w,h)=>{const r=makeRandom(2947);c.fillStyle='#526b50';c.fillRect(0,0,w,h);for(let j=0;j<7000;j++){const x=r()*w,y=r()*h,len=1+r()*7;c.strokeStyle=hsl(110+r()*38,12+r()*20,19+r()*23);c.lineWidth=.7+r()*1.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+(r()-.5)*4,y-len);c.stroke();}},true);
      m=new THREE.MeshStandardMaterial({map,roughness:1,vertexColors:true});
    }else if(slot==='fruit'){
      m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.66,vertexColors:true});
    }else{
      const surface=tex(256,256,c=>{const r=makeRandom(707);c.fillStyle='#f8f8ef';c.fillRect(0,0,256,256);
        const cx=138;c.lineCap='round';
        for(let j=0;j<15;j++)for(const side of [-1,1]){const yy=232-j*13,nn=Math.sin(j/15*Math.PI)*58+15;c.strokeStyle='rgba(122,139,98,.22)';c.lineWidth=.7+r()*1.0;c.beginPath();c.moveTo(cx,yy);c.quadraticCurveTo(cx+side*nn*.45,yy-10,cx+side*nn,yy-20-r()*13);c.stroke();}
        c.lineWidth=1.4;c.strokeStyle='rgba(174,188,138,.62)';c.beginPath();c.moveTo(cx,242);c.lineTo(cx,14);c.stroke();});
      m=new THREE.MeshStandardMaterial({map:surface,color:0xffffff,roughness:.88,vertexColors:true,side:THREE.DoubleSide});
      m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nif(!gl_FrontFacing) normal=-normal;');};
      m.customProgramCacheKey=()=> 'bellwater-bed-wrap';
    }
    materials[k]=m;return m;
  }
  function pipe(d,pts,radii,nseg,r,kind){
    let oldX;const old=co(0xffffff),baseU=r()*.25;let len=0,start=d.p.length/3;
    for(let l=0;l<pts.length;l++){
      const tang=pts[Math.min(l+1,pts.length-1)].clone().sub(pts[Math.max(0,l-1)]).normalize();
      let ux;if(oldX){ux=oldX.clone().addScaledVector(tang,-oldX.dot(tang)).normalize();}
      else ux=(Math.abs(tang.x)<.82?v(1,0,0):v(0,0,1)).cross(tang).normalize();
      const uz=tang.clone().cross(ux).normalize();oldX=ux;
      if(l>0)len+=pts[l].distanceTo(pts[l-1]);
      for(let j=0;j<=nseg;j++){
        const a=j/nseg*circle,no=ux.clone().multiplyScalar(Math.cos(a)).addScaledVector(uz,Math.sin(a)).normalize();
        const ridge=1+.055*Math.sin(a*3+.51*l)+.035*Math.cos(a*5+l*.38);const pos=pts[l].clone().addScaledVector(no,radii[l]*ridge);
        const tint=old.clone().multiplyScalar((kind==='pine'?.92:.96)*(.91+.09*Math.cos(a-1))*(.90+.10*satN(pos.y*.65)));
        pt(d,pos,tint,[j/nseg*Math.max(.29,Math.min(2.9,(radii[0]+radii[1])*2.45))+baseU,len*(kind==='pine'?.69:.56)],no);
        if(l&&j){const q=start+l*(nseg+1)+j;d.i.push(q-nseg-2,q-nseg-1,q-1,q-nseg-1,q,q-1);}
      }
    }
  }
  function sprayCard(d,center,heading,pitch,width,height,kind,r,normal,bri){
    const side=v(-Math.sin(heading),(.5-r())*.33,Math.cos(heading)).normalize();
    const stem=v(Math.cos(heading)*Math.cos(pitch),Math.sin(pitch),Math.sin(heading)*Math.cos(pitch)).normalize();
    side.addScaledVector(stem,-side.dot(stem)).normalize();
    const off=side.clone().cross(stem).normalize();if(off.y<0)off.negate();
    const id=(r()*4)|0, u=(id%2)*.5, vv=(1-Math.floor(id/2))*.5;
    const tc=co(0xffffff).multiplyScalar(bri),first=d.p.length/3;
    const corners=[[-.5,-.5,.011,.011],[.5,-.5,.489,.011],[.5,.5,.489,.489],[-.5,.5,.011,.489],[0,.01,.25,.25]];
    for(let j=0;j<5;j++){
      const [a,b,uu,vv2]=corners[j],p=center.clone().addScaledVector(side,a*width).addScaledVector(stem,b*height);
      if(j===4)p.addScaledVector(off,height*.07);
      const no=normal.clone().addScaledVector(side,a*.34).addScaledVector(stem,b*.24).normalize();
      const t=tc.clone().multiplyScalar(j<2?.92:j===4?1.03:1.04);
      pt(d,p,t,[u+uu,vv+vv2],no);
    }
    d.i.push(first,first+1,first+4,first+1,first+2,first+4,first+2,first+3,first+4,first+3,first,first+4);
  }
  function tinySphere(d,center,rad,color,radY=1){
    const start=d.p.length/3,seg=9,rings=6;
    for(let k=0;k<=rings;k++){
      const el=k/rings*Math.PI-Math.PI/2,rr=Math.cos(el),yy=Math.sin(el);
      for(let j=0;j<=seg;j++){
        const a=circle*j/seg,no=v(Math.cos(a)*rr,yy,Math.sin(a)*rr);const p=center.clone().add(v(no.x*rad,no.y*rad*radY,no.z*rad));
        const tint=color.clone().multiplyScalar(.85+.15*(yy+1)*.5);pt(d,p,tint,[j/seg,k/rings],no);
        if(j&&k){const i=start+k*(seg+1)+j;d.i.push(i-seg-2,i-1,i-seg-1,i-1,i,i-seg-1);}
      }
    }
  }
  function buildTree(kind,variant){
    const r=makeRandom(75169+3471*variant+kind.charCodeAt(0)*119);
    const trunk=data(),foliage=data(),fruit=data(),core=data();
    const pine=kind==='pine',orange=kind==='orange',cypress=kind==='cypress';
    const height=(cypress?7.2:pine?7.0:orange?4.9:6.0)*(.94+.13*r()), spread=(cypress?.82:pine?3.15:orange?2.03:2.62)*(.94+.12*r());
    const trunkTop=cypress?.94:pine?.72:.78,trunkR=(cypress?.19:pine?.32:orange?.23:.33)*(.92+r()*.14);
    const trunkLine=[];
    for(let j=0;j<6;j++){const t=j/5;trunkLine.push(v((.2*Math.sin(t*4.1+variant*.4)+.14*t)*t,height*trunkTop*t,(.28*Math.sin(t*4.4+variant*.57)+.14*t)*t));}
    pipe(trunk,trunkLine,[trunkR*1.28,trunkR*.91,trunkR*.78,trunkR*.62,trunkR*.38,trunkR*.08],10,r,kind);
    for(let j=0;j<6;j++){
      const a=j/6*circle+r()*.55,rad=trunkR*(1.1+r()*1.15),dx=Math.cos(a),dz=Math.sin(a);
      pipe(trunk,[v(dx*trunkR*.15,trunkR*2.25,dz*trunkR*.15),v(dx*trunkR*.66,trunkR*.71,dz*trunkR*.66),v(dx*rad,.025,dz*rad),v(dx*rad*1.23,-.025,dz*rad*1.23)],[trunkR*.46,trunkR*.4,trunkR*.23,.026],6,r,kind);
    }
    function lobe(c,sx,sy,sz,count){
      const phase=r()*circle;
      for(let j=0;j<count;j++){
        const yy=1-2*(j+.5)/count, rr=Math.sqrt(Math.max(0,1-yy*yy)),a=j*2.39996+phase+(r()-.5)*.50;
        const inner=.58+.42*Math.sqrt(r()),out=v(Math.cos(a)*rr,yy,Math.sin(a)*rr),p=c.clone().add(v(out.x*sx*inner,out.y*sy*inner,out.z*sz*inner));
        const radiation=Math.atan2((p.z-c.z)*.75+p.z*.3,(p.x-c.x)*.75+p.x*.3)+(r()-.5)*1.8;
        const normal=v(out.x*.53+p.x/spread*.46,.54+out.y*.34+(p.y/height-.62)*.7,out.z*.53+p.z/spread*.46).normalize();
        const b=(.73+.18*satN((p.y/height-.42)*2.1)+.13*satN(Math.hypot(p.x,p.z)/spread))*(.92+.15*r());
        let pitch=(pine?-.05:.1)+r()*(pine?.68:1.10)+out.y*.18;
        const ww=(pine?1.11:orange?.83:1.00)*(.77+.42*r()), hh=(pine?1.1:orange?.90:1.12)*(.8+.40*r());
        sprayCard(foliage,p,radiation,pitch,ww,hh,kind,r,normal,b);
      }
    }
    if(cypress){
      const widthAt=t=>spread*(.13+.94*Math.pow(Math.max(0,Math.sin(Math.PI*Math.pow(t,.70))),.69))*(1-.14*t);
      const rows=20,segs=16,start=core.p.length/3;
      for(let j=0;j<=rows;j++){const t=j/rows,y=height*(.075+.923*t),wr=widthAt(t)*(.69+.035*Math.cos(t*24)),dx=.12*t*Math.sin(t*4),dz=.10*t*Math.cos(t*5);
        for(let k=0;k<=segs;k++){const a=circle*k/segs,rad=wr*(1+.12*Math.sin(a*4+t*11.2)+.045*Math.cos(a*7-t*29)),n=v(Math.cos(a),.13+.28*t,Math.sin(a)).normalize();
          pt(core,v(dx+rad*Math.cos(a),y,dz+rad*Math.sin(a)),co(0xffffff).multiplyScalar(.71+.18*t+.07*Math.cos(a*3+t*11)),[k/segs*2.2,t*5],n);
          if(j&&k){const i=start+j*(segs+1)+k;core.i.push(i-segs-2,i-1,i-segs-1,i-1,i,i-segs-1);}
        }
      }
      for(let j=0;j<252;j++){
        const t=(j+.4)/252,a=j*2.39996+r()*.90,y=height*(.085+.905*t),rad=widthAt(t)*(.60+.29*r());
        const p=v(Math.cos(a)*rad+.10*t*Math.sin(t*4),y,Math.sin(a)*rad+.10*t*Math.cos(t*5));
        const normal=v(Math.cos(a),.38+.46*t,Math.sin(a)).normalize(),size=Math.min(1,(1.06-t)*4.1);
        sprayCard(foliage,p,a+(r()-.5)*.58,.77+r()*.51,(.52+.32*r())*size,(.82+.39*r())*size,kind,r,normal,.77+.20*t+.09*r());
      }
    }else{
      const groups=pine?8:orange?8:9,offset=r()*circle;
      for(let j=0;j<groups;j++){
        const a=j*2.39996+offset+(r()-.5)*.53,rad=(.46+.35*r())*spread;
        const lo=(pine?.40:.27)+j/groups*(pine?.26:.34)+r()*.06;const ti=lo/trunkTop*5,ix=Math.min(4,Math.floor(ti));
        const start=trunkLine[ix].clone().lerp(trunkLine[ix+1],ti-ix);
        const end=v(Math.cos(a)*rad,height*((pine?.74:.69)+.19*r()),Math.sin(a)*rad);
        const bend=start.clone().lerp(end,.43).add(v(.11*Math.sin(a),-.25,-.13*Math.cos(a)));
        const bend2=start.clone().lerp(end,.72).add(v((r()-.5)*.19,.12,(r()-.5)*.19));
        const branchR=trunkR*(.64-.28*j/groups);
        pipe(trunk,[start,bend,bend2,end],[branchR,branchR*.68,branchR*.46,.038],7,r,kind);
        for(let k=0;k<3;k++){
          const side=k===0?-1:k===1?1:r()>.5?1:-1,aa=a+side*(.36+.77*r());
          const len=spread*(k===2?.27:.39)*(.85+.31*r());
          const base=k===2?bend.clone().lerp(bend2,.30):bend2.clone().lerp(end,.18+.43*r());
          const tip=end.clone().add(v(Math.cos(aa)*len,(pine?.14:.2)+r()*(pine?.45:.78),Math.sin(aa)*len));
          if(k===2)tip.multiplyScalar(.84).y=end.y+.35+r()*.50;
          const kn=base.clone().lerp(tip,.48).add(v((r()-.5)*.13,-.02-r()*.15,(r()-.5)*.13));
          pipe(trunk,[base,kn,tip],[branchR*.34,.045,.014],5,r,kind);
          const scale=(.82+.33*r())*(orange?.85:1);
          lobe(tip,scale*(pine?.98:.85),scale*(pine?.36:.62),scale*(pine?.98:.83),pine?19:orange?19:21);
          if(orange&&k!==2){
            for(let j=0;j<2+(r()>.45?1:0);j++){
              const af=aa+(r()-.5)*2.35,rc=.22+.33*r(),off=v(Math.cos(af)*rc,-.11-.35*r(),Math.sin(af)*rc);
              const f=tip.clone().add(off),size=.065+r()*.029;
              const twig=tip.clone().add(v(off.x*.73,.034+r()*.07,off.z*.70)),stem=f.clone().add(v(0,size*.88,0));
              pipe(trunk,[tip,twig,stem],[.014,.009,.004],4,r,kind);
              tinySphere(fruit,f,size,co(r()>.43?0xdc8427:0xe69a33),.97);
            }
          }
        }
      }
      for(let j=0;j<4;j++){
        const a=offset+j*1.53,cc=v(Math.cos(a)*(.35+r()*.32),height*(.91+.085*r()),Math.sin(a)*(.35+r()*.32));
        pipe(trunk,[trunkLine[3],trunkLine[4],cc],[trunkR*.32,.074,.015],6,r,kind);
        lobe(cc,pine?1.06:.88,pine?.36:.64,pine?1.06:.85,21);
      }
    }
    const parts=[[geo(trunk),getMat(kind,'bark')],[geo(foliage),getMat(kind,'spray')]];
    if(core.i.length)parts.push([geo(core),getMat(kind,'core')]);if(fruit.i.length)parts.push([geo(fruit),getMat(kind,'fruit')]);return parts;
  }
  function smallLeaf(d,base,angle,rise,length,width,color,r){
    const along=v(Math.cos(angle),0,Math.sin(angle)),perp=v(-Math.sin(angle),0,Math.cos(angle)),first=d.p.length/3;
    const mainNormal=v(-along.x*rise,length*1.13,-along.z*rise).normalize(),asym=.90+r()*.18,twist=(r()-.5)*.24;
    const verts=[[0,0],[.23,-.64],[.23,0],[.23,.62],[.54,-1],[.54,0],[.54,asym],[.79,-.62],[.79,0],[.79,.58],[1,0]];
    for(const [t,s] of verts){
      const curl=Math.sin(t*Math.PI),yy=rise*t+Math.min(length*.24,.031)*curl-Math.abs(s)*width*.17;
      const pos=base.clone().addScaledVector(along,length*t).addScaledVector(up,yy).addScaledVector(perp,width*s+twist*width*t*t);
      const no=mainNormal.clone().addScaledVector(along,(t-.5)*.24).addScaledVector(perp,s*.20).normalize();
      const shade=.75+.24*t+.09*curl+.075*satN(1-Math.abs(s));
      pt(d,pos,color.clone().multiplyScalar(shade),[.54+s*.40,.05+.90*t],no);
    }
    const ix=[0,1,2,0,2,3,1,4,5,1,5,2,2,5,6,2,6,3,4,7,8,4,8,5,5,8,9,5,9,6,7,10,8,8,10,9];
    for(const j of ix)d.i.push(first+j);
  }
  function blossom(d,center,count,rad,corolla,eye,r){
    const st=d.p.length/3,phase=r()*circle;
    for(let k=0;k<count;k++){
      const a=k/count*circle+phase,sz=(.86+r()*.24)*rad,unit=v(Math.cos(a),.15+r()*.28,Math.sin(a)),side=v(-Math.sin(a),0,Math.cos(a)),w=sz*(count>7?.17:.37);
      const first=d.p.length/3,p0=center.clone().addScaledVector(unit,sz*.10),p1=center.clone().addScaledVector(unit,sz*.65).addScaledVector(side,w),
        p2=center.clone().addScaledVector(unit,sz).addScaledVector(side,w*.45),p3=center.clone().addScaledVector(unit,sz*1.01).addScaledVector(side,-w*.45),p4=center.clone().addScaledVector(unit,sz*.64).addScaledVector(side,-w);
      pt(d,p0,corolla.clone().multiplyScalar(.79));pt(d,p1,corolla);pt(d,p2,corolla.clone().multiplyScalar(1.08));pt(d,p3,corolla.clone().multiplyScalar(1.12));pt(d,p4,corolla);
      d.i.push(first,first+1,first+2,first,first+2,first+3,first,first+3,first+4);
    }
    const origin=d.p.length/3;pt(d,center.clone().addScaledVector(up,rad*.15),eye);
    for(let i=0;i<7;i++){const a=i/7*circle;pt(d,center.clone().add(v(Math.cos(a)*rad*.24,rad*.04,Math.sin(a)*rad*.24)),eye.clone().multiplyScalar(.88));}
    for(let i=0;i<7;i++)d.i.push(origin,origin+1+i,origin+1+(i+1)%7);
  }
  function buildBed(seed,small=false){
    const r=makeRandom(182661+seed*1907),mode=seed%4,d=data(),herb=[0x526b3c,0x728044,0x5c754d,0x708353,0x4b7952,0x849459].map(co);
    for(let j=0;j<(small?11:26);j++){
      const rr=Math.sqrt(r())*.57,a=r()*circle,p=v(rr*Math.cos(a),.014+.035*r(),rr*Math.sin(a)),amount=6+(r()*3|0),phase=r()*circle;
      const clr=herb[r()*herb.length|0];
      for(let k=0;k<amount;k++){const dir=phase+k/amount*circle,ht=.07+r()*.14,ln=.10+r()*.10;
        smallLeaf(d,p,dir,ht,ln,(mode===1?.019:.036)+r()*.028,clr,r);
      }
    }
    const stemGreen=co(0x688551),flowerCount=small?(mode===1?17:13):(mode===1?33:mode===2?24:21);
    const col=mode===0?[0xbe493c,0xe16b51,0xd65b4d]:mode===1?[0x8c7fa7,0xaa91ba,0x9b8bb1]:mode===2?[0xffe9bc,0xfff4dc,0xe8e0cc]:[0xbd477a,0xe88199,0xce567c];
    for(let j=0;j<flowerCount;j++){
      const a=circle*r(),rad=.50*Math.sqrt(r()),x=Math.cos(a)*rad,z=Math.sin(a)*rad,base=v(x,.045,z),dir=r()*circle;
      const h=(mode===1?.36:.24)+.125*r()+.058*(1-rad/.55),head=v(x+.045*Math.cos(dir),h,z+.045*Math.sin(dir)),perp=v(-Math.sin(dir),0,Math.cos(dir));
      const st=d.p.length/3;
      pt(d,base.clone().addScaledVector(perp,-.006),stemGreen);pt(d,base.clone().addScaledVector(perp,.006),stemGreen);
      pt(d,head.clone().addScaledVector(perp,.0035),stemGreen);pt(d,head.clone().addScaledVector(perp,-.0035),stemGreen);d.i.push(st,st+1,st+2,st,st+2,st+3);
      smallLeaf(d,base.clone().lerp(head,.53),dir+.4,.052,.065,.018,herb[(j+1)%herb.length],r);
      const petal=co(col[r()*3|0]);
      if(mode===1){
        for(let q=0;q<8;q++){
          const t=q/8,at=head.clone().add(v(0,(t-.73)*.151,0)),wid=(.034-.02*t)*(.94+r()*.12);
          for(let k=0;k<3;k++){
            const aa=dir+k/3*circle+q*.93,no=v(Math.cos(aa),.6,Math.sin(aa)),tip=at.clone().addScaledVector(no,wid);
            const si=v(-Math.sin(aa),0,Math.cos(aa)),ix=d.p.length/3;
            pt(d,at,petal.clone().multiplyScalar(.70));pt(d,tip.clone().addScaledVector(si,wid*.30),petal);pt(d,tip.clone().addScaledVector(up,wid*.53),petal.clone().multiplyScalar(1.14));pt(d,tip.clone().addScaledVector(si,-wid*.31),petal);
            d.i.push(ix,ix+1,ix+2,ix,ix+2,ix+3);
          }
        }
      }else if(mode===2)blossom(d,head,9,.044+r()*.020,petal,co(0xe8b74f),r);
      else{
        for(let q=0;q<(small?3:5);q++){const aa=q*2.3999+dir,of=q===0?0:.039+r()*.017;const p=head.clone().add(v(Math.cos(aa)*of,(q===0?.028:0)+r()*.013,Math.sin(aa)*of));blossom(d,p,5,.031+r()*.014,petal,co(mode===0?0xf7ac64:0xedc489),r);}
      }
    }
    return geo(d);
  }
  function plant(x,z,size=1,kind='plane',seed=1){
    if(!['plane','orange','pine','cypress'].includes(kind))kind='plane';
    const s=Math.abs((seed||1)|0),variant=s%4,k=kind+variant;
    if(!treeCache.has(k))treeCache.set(k,buildTree(kind,variant));
    const angle=((s*1337)%6283)*.001;
    for(const [g,m] of treeCache.get(k))addGeo(g,m,x,0,z,size,size,size,0,angle,0);
  }
  function bed(x,y,z,radius=.65,seed=1){
    if(radius<=0)return;const s=Math.abs((seed||1)|0),variant=s%8;
    const small=radius<.34,cacheKey=variant+(small?8:0);
    if(!bedCache.has(cacheKey))bedCache.set(cacheKey,buildBed(variant,small));const sc=radius/.65;
    addGeo(bedCache.get(cacheKey),getMat('bed','herb'),x,y,z,sc,sc,sc,0,(s*.887)%circle,0);
  }

  function valueNoise(x,y){
    const ix=Math.floor(x),iy=Math.floor(y);
    function sample(a,b){let h=(Math.imul(a,3866017)^Math.imul(b,8335073))|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
    let ax=x-ix,ay=y-iy;ax=ax*ax*(3-2*ax);ay=ay*ay*(3-2*ay);
    return mixN(mixN(sample(ix,iy),sample(ix+1,iy),ax),mixN(sample(ix,iy+1),sample(ix+1,iy+1),ax),ay);
  }
  const bandSettings=[[62,71],[104,106],[162,142]];
  function bandPos(layer,a,t){const cc=bandSettings[layer];const rr=cc[0]+cc[1]*t;return [12+Math.cos(a)*rr,Math.sin(a)*rr];}
  function ga(a,center,w){const d=Math.atan2(Math.sin(a-center),Math.cos(a-center));return Math.exp(-d*d/(w*w));}
  function hillHeight(x,z,layer){
    const dx=x-12,r=Math.hypot(dx,z),a=Math.atan2(z,dx),s=bandSettings[layer],t=(r-s[0])/s[1];
    if(t<=0||t>=1)return -4.8;
    const ca=Math.cos(a),sa=Math.sin(a),mod=valueNoise(ca*5.4+1.7*layer+4.2,sa*5.4+9.7);
    const ridge=.50+.095*Math.sin(a*4.0+layer*.87)+.105*(mod-.50);
    const shape=t<ridge?t/ridge:(1-t)/(1-ridge),upper=1-Math.pow(1-satN(shape),.84);
    const river=smoothN(layer===2?0:6,layer===2?60:51,Math.abs(x-22+.045*z));
    const massif=Math.max(ga(a,-2.05,.31),ga(a,-.87,.22)*.76,ga(a,1.38,.37)*.61);
    const crags=valueNoise(ca*(layer===0?16:28)+layer*3.27,sa*(layer===0?16:28)+.24);
    const skylineNoise=.77+(.21+.19*massif)*valueNoise(ca*(layer===0?4.0:6.2)+layer*7.4,sa*(layer===0?4.0:6.2)+1.27)+(.029+.048*massif)*crags;
    let h;
    if(layer===0)h=(10+13*ga(a,-2.65,.99)+7*ga(a,-.23,.85)+5*ga(a,2,.67))*skylineNoise*(.03+.97*river);
    else if(layer===1)h=(12+15*ga(a,-2.55,.87)+13*ga(a,-.62,.85)+11*ga(a,1.0,.85)+13*ga(a,2.91,.72))*skylineNoise*(.34+.66*river);
    else {
      const peak=(c,l,r)=>{const d=Math.atan2(Math.sin(a-c),Math.cos(a-c));return Math.exp(-Math.pow(Math.abs(d)/(d<0?l:r),1.34));};
      h=(21+44*peak(-2.025,.195,.255)+20*ga(a,-2.26,.47)+31*peak(-.85,.18,.125)+12*ga(a,-.64,.52)+9*ga(a,.13,.72)+23*ga(a,1.55,.49)+15*ga(a,2.72,.63))*skylineNoise*(.68+.32*river);
    }
    const wx=x+11*valueNoise(x*.037+5,z*.037),wz=z+13*valueNoise(x*.035,z*.035+4);
    const ravine=Math.abs(valueNoise(wx*.084+3,wz*.067+layer*3.1)-.46),rock=valueNoise(x*.24+layer*2,z*.18);
    const twist=.10*t*Math.sin(a*4.0+layer*.73)+.048*t*Math.sin(a*9.0+2.2);
    const az=a+twist;
    const fold=Math.abs(2*valueNoise(Math.cos(az)*23.0+t*1.4+layer*5.,Math.sin(az)*23.0-t*2.3)-1);
    const gully=Math.pow(1-fold,4.3);
    const spur=Math.abs(2*valueNoise(Math.cos(az)*38.2+t*3.3+2.59,Math.sin(az)*38.2+t*2.4)-1);
    return -4.8+h*(upper*.83+.17*shape*shape)+Math.sin(t*Math.PI)*river*(1-.70*smoothN(.77,.985,shape))*((ravine-.21)*(layer+1)*7.95+(rock-.52)*(layer+1)*1.42+(Math.max(0,spur-.33)*2.-gully)*(.30+layer*(.63+massif*1.42))*Math.min(1,shape*2.2));
  }
  function sectorMeshes(scene,whole,material,label,count,receive=false){
    // The horizon encircles the camera. Each wedge can be culled independently.
    const positions=whole.getAttribute('position'),ix=whole.index.array,parts=Array.from({length:count},()=>({indexes:[],box:new THREE.Box3()}));
    const boxPoint=v(0,0,0);
    for(let i=0;i<ix.length;i+=3){
      let xx=0,zz=0;
      for(let k=0;k<3;k++){xx+=positions.getX(ix[i+k]);zz+=positions.getZ(ix[i+k]);}
      const angle=Math.atan2(zz,xx-36),sector=Math.min(count-1,Math.floor((angle+Math.PI)/circle*count));
      const part=parts[sector];
      for(let k=0;k<3;k++){const index=ix[i+k];part.indexes.push(index);boxPoint.fromBufferAttribute(positions,index);part.box.expandByPoint(boxPoint);}
    }
    for(const p of parts){
      if(!p.indexes.length)continue;
      const g=new THREE.BufferGeometry();for(const [key,value] of Object.entries(whole.attributes))g.setAttribute(key,value);
      g.setIndex(p.indexes);g.boundingBox=p.box;g.boundingSphere=p.box.getBoundingSphere(new THREE.Sphere());const chunk=new THREE.Mesh(g,material);chunk.name=label;chunk.receiveShadow=receive;scene.add(chunk);
    }
  }

  function riverCountry(scene){
    const r=makeRandom(562907),green=data(),bank=data(),reed=data(),cover=data();
    function outside(x,z){return Math.max(-34.8-x,x-52.6,-37.6-z,z-33.6);}
    function fieldHeight(x,z){
      const d=outside(x,z),fade=smoothN(0,6,d),banking=smoothN(0,22,Math.abs(x-22)-8);
      const rise=.23+(valueNoise(x*.038+5,z*.043+7)*2.35+valueNoise(x*.083-4,z*.076)*.71)*banking;
      return -.19+fade*(rise+.26)+.22*banking*fade*Math.sin(.11*x+.15*z);
    }
    const grassPigment=tex(256,256,(c,w,h)=>{
      const rnd=makeRandom(9906),im=c.createImageData(w,h);
      for(let i=0;i<w*h;i++){const nn=(rnd()-.46)*31,j=i*4;im.data[j]=224+nn;im.data[j+1]=228+nn;im.data[j+2]=201+nn;im.data[j+3]=255;}c.putImageData(im,0,0);
      for(let i=0;i<5030;i++){const x=rnd()*w,y=rnd()*h;c.strokeStyle=rnd()>.39?'rgba(102,119,71,.25)':'rgba(245,239,197,.30)';c.lineWidth=.5+rnd()*.95;c.beginPath();c.moveTo(x,y);c.lineTo(x+.4+rnd()*2.7,y-rnd()*4.7);c.stroke();}
    },true);
    const meadowMat=new THREE.MeshStandardMaterial({map:grassPigment,roughness:1,vertexColors:true,side:THREE.DoubleSide});
    for(const [x0,x1] of [[-124,14.0],[30,128]]){
      const nx=Math.ceil((x1-x0)/2.33),nz=112,st=green.p.length/3;
      for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
        const x=mixN(x0,x1,i/nx),z=mixN(-122,122,j/nz),y=fieldHeight(x,z),n=valueNoise(x*.081,z*.066);
        const shade=co(0x77905c).lerp(co(0xa8a269),n*.79+.12*valueNoise(x*.24,z*.21));
        pt(green,v(x,y,z),shade,[x*.17,z*.17]);
        if(i&&j){const ix=st+j*(nx+1)+i;
          if(Math.max(outside(x,z),outside(x-(x1-x0)/nx,z),outside(x,z-244/nz))>=-.6)green.i.push(ix-nx-2,ix-1,ix-nx-1,ix-1,ix,ix-nx-1);
        }
      }
    }
    sectorMeshes(scene,geo(green,true),meadowMat,'Bellwater • olive meadows',8,true);
    function bankSection(z,west){
      const north=z<0,q=north?-z-38.3:z-34.3,startFade=smoothN(0,9,q),side=west?1:-1,wall=west?14:30;
      const hump=(p,w)=>Math.exp(-Math.pow((q-p)/w,2));
      const projection=north?(west?.60+9.4*hump(26,13.5)+5.2*hump(60,15.2)+5.5*hump(89,15.7):.70+3.4*hump(13,9.2)+4.7*hump(45,13.0)+2.7*hump(78,12)):(west?.58+4*hump(15,11)+7.9*hump(45,15)+3.7*hump(83,16):.72+7.2*hump(29,14)+5.4*hump(69,15));
      const extent=.14+startFade*(projection+.28*Math.sin(q*.52+(west?1:3))+.17*Math.sin(q*.91));
      const top=.018+.22*startFade+.19*startFade*Math.sin(q*.19+side);
      return [[wall-side*2.5,fieldHeight(wall-side*2.5,z)+.022],[wall-side*.18,top],[wall+side*extent*.39,top+.23*startFade],[wall+side*extent*.70,-.48+.34*startFade*Math.sin(q*.16+.4)],[wall+side*extent*.91,-1.14+.12*Math.sin(q*.26)],[wall+side*(extent+.10),-2.15],[wall+side*(extent+.75),-2.66]];
    }
    function bankPlace(z,west,station){
      const pos=bankSection(z,west),k=Math.max(0,Math.min(5,Math.floor(station))),w=station-k;
      return v(mixN(pos[k][0],pos[k+1][0],w),mixN(pos[k][1],pos[k+1][1],w),z);
    }
    const marginColors=[0x8b9b68,0x7c8d57,0x7d8e58,0x7d855a,0x9c926e,0xb8a27c,0x837f65];
    for(const west of [false,true])for(const north of [false,true]){
      const st=bank.p.length/3,n=105;
      for(let j=0;j<=n;j++){
        const z=north?mixN(-38.3,-120,j/n):mixN(34.3,120,j/n),section=bankSection(z,west);
        for(let k=0;k<section.length;k++){const [x,y]=section[k],cl=co(marginColors[k]).multiplyScalar(.89+.19*valueNoise(z*.35,x*.45));pt(bank,v(x,y,z),cl,[x*.33,z*.33]);
          if(j&&k){const ix=st+j*7+k;if(west===north)bank.i.push(ix-8,ix-1,ix-7,ix-1,ix,ix-7);else bank.i.push(ix-8,ix-7,ix-1,ix-7,ix,ix-1);}
        }
      }
    }
    // A wooded gravel island hides the farther meander.
    const island=v(25.25,0,-89.5),irx=3.45,irz=8.65;
    function islandP(a,t){const edge=1+.095*Math.sin(a*3+.9)+.057*Math.cos(a*5-1.1);return v(island.x+Math.cos(a)*irx*t*edge+.34*Math.sin(a)*t,.68-3.17*Math.pow(t,2.35),island.z+Math.sin(a)*irz*t*edge);}
    {
      const first=bank.p.length/3,ss=46,rings=7;
      for(let j=0;j<=rings;j++)for(let k=0;k<=ss;k++){const t=j/rings,p=islandP(k/ss*circle,t),cl=co(0x748c57).lerp(co(0xb2a17c),smoothN(.58,1,t));
        pt(bank,p,cl,[p.x*.3,p.z*.3]);if(j&&k){const ix=first+j*(ss+1)+k;bank.i.push(ix-ss-2,ix-ss-1,ix-1,ix-ss-1,ix,ix-1);}}
    }
    const stonework=data(),rockRnd=makeRandom(17941);
    function gravelRock(center,rx,ry,rz,bearing){
      const first=stonework.p.length/3,faces=8,ring=[[.21,-.53],[.83,-.31],[1,.09],[.69,.47],[.15,.62]];
      const stoneCol=co([0x9b9984,0xa5a18b,0x949384,0xb3ac96,0x9e9680][rockRnd()*5|0]);
      for(let j=0;j<ring.length;j++)for(let k=0;k<faces;k++){
        const a=k/faces*circle,sc=ring[j][0]*(.84+rockRnd()*.24),xx=rx*Math.cos(a)*sc,zz=rz*Math.sin(a)*sc,yy=ry*(ring[j][1]+(rockRnd()-.5)*.12);
        const pos=v(center.x+Math.cos(bearing)*xx+Math.sin(bearing)*zz,center.y+yy,center.z-Math.sin(bearing)*xx+Math.cos(bearing)*zz);
        const cl=stoneCol.clone().lerp(co(0x7b825f),j>2?.13+.15*rockRnd():.07).multiplyScalar(.78+.06*j+.065*rockRnd());pt(stonework,pos,cl,[xx,zz]);
      }
      for(let j=0;j<ring.length-1;j++)for(let k=0;k<faces;k++){
        const k2=(k+1)%faces,aa=first+j*faces+k,bb=first+j*faces+k2,cc=first+(j+1)*faces+k2,dd=first+(j+1)*faces+k;
        stonework.i.push(aa,dd,bb,bb,dd,cc);
      }
    }
    for(const north of [true,false])for(const west of [true,false])for(let j=0;j<13;j++){
      const cz=(north?-1:1)*((north?41.0:37.5)+rockRnd()*72);
      for(let k=0;k<3+Math.floor(rockRnd()*3);k++){const z=cz+(rockRnd()-.5)*2.8,sta=3.1+rockRnd()*2.15,p=bankPlace(z,west,sta);const sz=.34+rockRnd()*.63;
        p.y-=sz*.17;gravelRock(p,sz*(.77+rockRnd()*.4),sz*(.38+rockRnd()*.37),sz*(.80+rockRnd()*.39),rockRnd()*circle);}
    }
    const stoneShore=new THREE.Mesh(geo(stonework,true),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.97,side:THREE.DoubleSide}));stoneShore.receiveShadow=true;stoneShore.name='Bellwater • weathered river stone';scene.add(stoneShore);
    const willows=buildWillow();
    for(const [z,west,station,scale,angle] of [[-59.6,true,2.00,1.12,.34],[-76.8,false,1.84,.88,2.0],[51.3,false,1.86,.98,.91],[69.2,true,1.61,.77,2.18]]){
      const p=bankPlace(z,west,station);for(const [g,m] of willows)addGeo(g,m,p.x,p.y,p.z,scale,scale,scale,0,angle,0);
    }
    const soil=new THREE.Mesh(geo(bank,true),meadowMat);soil.receiveShadow=true;soil.name='Bellwater • estuary and shoal';scene.add(soil);
    // Hand-painted tree impostors keep the countryside dense at a negligible draw cost.
    const atlasSize=1024,slots=4;
    const atlas=tex(atlasSize,384,c=>{
      function drawTree(kind,seed){
        const rng=makeRandom(seed),w=256,h=384,branches=[],clumps=[];
        const cyp=kind===0,pine=kind===1,brush=kind===3,baseY=367,bx=124+rng()*9,gh=cyp?342:pine?299:brush?204:297;
        const shade=kind===0?[102,25,25]:kind===1?[105,24,27]:brush?[91,30,30]:[91,24,32];
        const stroke=(pts,width,col)=>{c.strokeStyle=col;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.stroke();};
        if(cyp){
          stroke([[bx,baseY],[bx-2,baseY-gh*.5],[bx+3,baseY-gh*.92]],5.2,'#676a4e');
          for(let i=0;i<177;i++){const t=(i+.5)/177,a=rng()*circle,rad=Math.pow(Math.sin(t*Math.PI),.54)*(1-t*.44),x=bx+Math.cos(a)*(24+4*rng())*rad,y=baseY-gh*(.09+.89*t);
            clumps.push({x,y,rx:(9+rng()*10)*(.23+.77*rad),ry:(13+rng()*14)*(.25+.75*rad),depth:Math.sin(a),t,shade:0});}
        }else if(brush){
          for(let j=0;j<32;j++){const a=j*2.39996,rad=Math.sqrt(rng()),dx=Math.cos(a)*95*rad,dep=Math.sin(a)*rad;
            const xx=bx+dx,yy=baseY-16-(1-rad)*66-Math.sin(a)*21-rng()*19;
            clumps.push({x:xx,y:yy,rx:20+rng()*12,ry:15+rng()*15,depth:dep,t:.5+(1-rad)*.45,shade:0});}
        }else{
          const count=12,half=105;
          stroke([[bx,baseY],[bx+(pine?4:-5),baseY-gh*.28],[bx-1,baseY-gh*.68]],brush?6:9,'#726e55');
          stroke([[bx-2,baseY],[bx-3,baseY-gh*.28],[bx-6,baseY-gh*.64]],brush?1.8:2.4,'#aea181');
          for(let j=0;j<count;j++){const a=j*2.39996+rng()*.45,rr=(.42+.55*rng()),dx=Math.cos(a)*half*.83*rr,dy=(pine?.71:.58)+rng()*(pine?.14:.30),x=bx+dx,y=baseY-gh*dy;
            const sy=baseY-gh*(.24+rng()*.17);stroke([[bx,sy],[bx+dx*.49,sy-(sy-y)*.42],[x,y]],brush?3.3:4.3,'#747452');
            const rx=(pine?25:22)+rng()*15,ry=(pine?12:22)+rng()*(pine?11:22);
            clumps.push({x,y,rx,ry,depth:Math.sin(a),t:dy,shade:0});
          }
          clumps.push({x:bx+4,y:baseY-gh*(pine?.86:.91),rx:pine?39:29,ry:pine?19:33,depth:.10,t:.91,shade:0});
        }
        clumps.sort((a,b)=>a.depth-b.depth);
        for(const l of clumps){
          const {x,y,rx,ry,depth,t}=l,baseL=shade[2]+depth*2.9+(t-.48)*4.9;
          c.fillStyle=hsl(shade[0]+4,shade[1]-1,baseL-4);c.beginPath();
          for(let j=0;j<21;j++){const a=j/21*circle,sc=.73+.15*rng(),px=x+Math.cos(a)*rx*sc,py=y+Math.sin(a)*ry*sc;j?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();c.fill();
          const count=cyp?23:127;
          for(let i=0;i<count;i++){
            const a=rng()*circle,rr=Math.sqrt(rng()),u=Math.cos(a)*rr,vv=Math.sin(a)*rr;
            const xx=x+rx*u,yy=y+ry*vv;const light=Math.sqrt(1-rr*rr)*.52-u*.19-vv*.48;
            const lum=baseL-5+light*13+rng()*6.5;const rrC=cyp?.95+rng()*1.85:1.13+rng()*2.85;
            c.fillStyle=hsl(shade[0]-4*light+rng()*5,shade[1]+rng()*8,lum);c.beginPath();
            c.ellipse(xx,yy,rrC*(pine?1.46:1.05),rrC*(cyp?1.65:pine?.63:.95),-.34+rng()*.63,0,circle);c.fill();
          }
        }
      }
      for(let k=0;k<slots;k++){c.save();c.translate(k*256,0);c.beginPath();c.rect(1,0,254,383);c.clip();drawTree(k,48361+k*203);c.restore();}
    });
    const instances=[],phases=[];
    function grove(x,y,z,height,kind,width=1){
      instances.push(x,y-.06,z);phases.push(height,(kind===0?.80:kind===3?1.44:1.06)*width,(kind+.0),.83+.23*r());
      if(height>1.75&&outside(x,z)<72&&Math.abs(x-22)>7.9){
        const a=height*(kind===0?.15:.38),b=a*.75,xx=x+a*.11,zz=z-b*.19,first=cover.p.length/3;
        const col=co(0x4b6041),n=9;
        pt(cover,v(xx,y+.023,zz),col,[.5,.5]);
        for(let j=0;j<n;j++){const angle=j/n*circle,tar=v(xx+a*Math.cos(angle),y+.029,zz+b*Math.sin(angle));pt(cover,tar,col,[.5+.49*Math.cos(angle),.5+.49*Math.sin(angle)]);}
        for(let j=0;j<n;j++)cover.i.push(first,first+1+(j+1)%n,first+1+j);
      }
    }
    function plantField(x,z,height,kind,width=1){if(outside(x,z)>.65)grove(x,Math.max(.012,fieldHeight(x,z)),z,height,kind,width);}
    // Cypress windbreaks follow tracks to the orchards.
    const alleys=[[[10.5,-41],[4.5,-74],12],[[33.25,-45.5],[43,-85],12],[[-5,-43],[-24,-62],9],[[43,37],[56,66],10],[[5.6,39],[.5,74],11],[[-39,-24],[-57,5],9],[[56,9],[72,-13],7]];
    for(const [a,b,n] of alleys)for(let i=0;i<n;i++){const t=(i+.22)/n;plantField(mixN(a[0],b[0],t)+(r()-.5)*1.05,mixN(a[1],b[1],t)+(r()-.5)*1.1,4.1+r()*2.8,0,.81+r()*.31);}
    for(let j=0;j<92;j++){
      const x=-94+r()*204,z=-109+r()*218;if(outside(x,z)<6||Math.abs(x-22)<13.4)continue;
      const orchard=x<-26&&z<-35||x>42&&z>38,kind=r()>.54?2:1,n=3+(r()*7|0);
      for(let k=0;k<n;k++){const xx=x+(r()-.5)*12,zz=z+(r()-.5)*11;if(outside(xx,zz)<3||Math.abs(xx-22)<10)continue;
        plantField(xx,zz,(orchard?3.0:3.4)+r()*(orchard?1.9:3.7),r()>.25?kind:3,.87+r()*.29);
      }
    }
    // A row of small-scale 3D trees provides parallax before the distant groves.
    for(const [x,z,sc,kind,n] of [[11.0,-42.7,.82,'cypress',43],[6.2,-45.0,.76,'pine',22],[31.9,-43.4,.90,'cypress',39],[35.1,-45.6,.69,'plane',82],[46.6,-41.5,.74,'cypress',98],[-12.6,-43.4,.79,'plane',105],[10.8,39.6,.78,'pine',18],[31.9,38.3,.83,'cypress',72],[-40.4,5.3,.63,'pine',27],[57.0,15.3,.75,'orange',35]]){
      scope(0,Math.max(.015,fieldHeight(x,z)),0,0,()=>plant(x,z,sc,kind,n));
    }
    // Bushes and reeds break the horizon of the two river bends.
    function reedClump(p,scale,seed){
      const ran=makeRandom(seed),n=11+(ran()*9|0),base=co(0x73834f),tip=co(0xb0a46f);
      for(let q=0;q<n;q++){const aa=ran()*circle,rr=ran()*.28*scale,x=p.x+Math.cos(aa)*rr,z=p.z+Math.sin(aa)*rr,h=(.54+ran()*.80)*scale,w=(.018+ran()*.026)*scale,lean=(.16+ran()*.60)*scale,side=v(-Math.sin(aa)*w,0,Math.cos(aa)*w),o=v(x,p.y,z),mid=v(x+Math.cos(aa)*lean*.34,p.y+h*.67,z+Math.sin(aa)*lean*.34),end=v(x+Math.cos(aa)*lean,p.y+h,z+Math.sin(aa)*lean);
        const ix=reed.p.length/3;pt(reed,o.clone().sub(side),base);pt(reed,o.clone().add(side),base);pt(reed,mid.clone().addScaledVector(side,.8),base.clone().lerp(tip,.35));pt(reed,mid.clone().addScaledVector(side,-.8),base.clone().lerp(tip,.4));pt(reed,end,tip);
        reed.i.push(ix,ix+1,ix+2,ix,ix+2,ix+3,ix+3,ix+2,ix+4);
      }
    }
    for(const north of [true,false])for(const west of [true,false]){
      for(let j=0;j<61;j++){
        const z=(north?-1:1)*((north?40.7:37.7)+r()*73),p=bankPlace(z,west,.81+r()*2.17);
        if(r()<.54)grove(p.x,p.y,p.z,1.06+r()*1.53,3,1.1+r()*.62);
        if(j%4===0){const q=bankPlace(z,west,1.31+r()*.72);grove(q.x,q.y,q.z,2.15+r()*3.0,r()<.71?2:0,.86+r()*.48);}
        if(j%2===0){const q=bankPlace(z,west,3.88+r()*.96);reedClump(q,.65+r()*.44,1684+j+(north?101:0)+(west?47:0));}
      }
    }
    for(let j=0;j<12;j++){const a=r()*circle,t=r()*.60,q=islandP(a,t);grove(q.x,q.y,q.z,j<4?3.2+r()*1.54:1.0+r()*.88,j<4?2:3);}
    const groveG=new THREE.InstancedBufferGeometry();
    groveG.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,.5,0,0,.5,1,0,-.5,1,0],3));groveG.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));groveG.setIndex([0,1,2,0,2,3]);
    groveG.setAttribute('basePoint',new THREE.InstancedBufferAttribute(new Float32Array(instances),3));groveG.setAttribute('plantInfo',new THREE.InstancedBufferAttribute(new Float32Array(phases),4));groveG.instanceCount=instances.length/3;
    const spriteMat=new THREE.ShaderMaterial({uniforms:{portrait:{value:atlas}},side:THREE.DoubleSide,toneMapped:false,depthTest:true,depthWrite:true,
      vertexShader:'attribute vec3 basePoint;attribute vec4 plantInfo; varying vec2 plantUV;varying float leafBrightness;varying float depthAway;void main(){vec2 n=normalize(cameraPosition.xz-basePoint.xz);vec2 right=vec2(n.y,-n.x);vec3 wp=basePoint+vec3(right.x*position.x*plantInfo.x*plantInfo.y*.667,position.y*plantInfo.x,right.y*position.x*plantInfo.x*plantInfo.y*.667);vec4 mv=viewMatrix*vec4(wp,1.);gl_Position=projectionMatrix*mv;depthAway=-mv.z;plantUV=vec2((plantInfo.z+mix(.012,.988,uv.x))/4.,mix(.005,.995,uv.y));leafBrightness=plantInfo.w*(.82+.18*uv.y);}',
      fragmentShader:'uniform sampler2D portrait;varying vec2 plantUV;varying float leafBrightness;varying float depthAway;void main(){vec4 c=texture2D(portrait,plantUV);if(c.a<.36)discard;float mist=1.-exp(-depthAway*depthAway*.000010);vec3 rgb=mix(c.rgb*leafBrightness,vec3(.51,.61,.58),mist);gl_FragColor=vec4(rgb,c.a);\n#include <colorspace_fragment>\n}'
    });spriteMat.alphaToCoverage=true;
    const groveMesh=new THREE.Mesh(groveG,spriteMat);groveMesh.frustumCulled=false;groveMesh.name='Bellwater • cypress lanes and olive groves';scene.add(groveMesh);
    const shadeTexture=tex(96,96,(c,w,h)=>{const gr=c.createRadialGradient(w/2,h/2,2,w/2,h/2,w*.49);gr.addColorStop(0,'rgba(255,255,255,.68)');gr.addColorStop(.45,'rgba(255,255,255,.48)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);});
    const shadows=new THREE.Mesh(geo(cover),new THREE.MeshBasicMaterial({map:shadeTexture,vertexColors:true,transparent:true,opacity:.53,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));shadows.name='Bellwater • grove shade';scene.add(shadows);
    const reedsMesh=new THREE.Mesh(geo(reed),new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}));reedsMesh.name='Bellwater • river reeds';scene.add(reedsMesh);
    function cottage(x,z,w,d,h,yaw,walls,roofcol,style=0){
      if(!M.plaster||!M.roof)return;
      const base=fieldHeight(x,z)-.13;
      scope(x,base,z,yaw,()=>{
        const front=d*.5,wide=w*.5,trimColor=0xcebd94,woodColor=0x625a45;
        box(0,.32,0,w+.13,.7,d+.13,M.stone,0xb8a88b);box(0,h*.5+.25,0,w,h-.10,d,M.plaster,walls);
        const e=h+.24,peak=e+d*(style===1?.32:.24),ww=wide+.27,dd=front+.30;
        for(const s of [-1,1]){const z0=s*dd,p=[[-ww,e,z0],[ww,e,z0],[ww,peak,0],[-ww,peak,0]];if(s<0)p.reverse();poly(p,M.roof,roofcol);
          box(0,e-.06,z0,w+.5,.15,.14,M.wood,woodColor);
          const g=[[s*wide,e,-front],[s*wide,e,front],[s*wide,peak,0]];poly(s===1?g.reverse():g,M.plaster,walls);
        }
        const n=w>5?3:2;
        for(let i=0;i<n;i++){
          const px=(i/(n-1)-.5)*w*.64;
          for(const side of [-1,1]){
            box(px,h*.65,side*(front+.023),.57,.85,.07,M.wood,0x475c53);
            for(const ss of [-1,1])box(px+ss*.39,h*.65,side*(front+.036),.20,.87,.065,M.plank,style===1?0x82735a:0x718674);
            box(px,h*.65-.45,side*(front+.07),.74,.095,.18,M.trim,trimColor);}
        }
        box(0,.89,front+.052,.81,1.72,.08,M.plank,woodColor);
        box(w*.24,peak+.14,d*.07,.40,1.08,.42,M.stone,0xcdad8a);box(w*.24,peak+.73,d*.07,.55,.17,.56,M.roof,roofcol);
      });
    }
    cottage(5.2,-51.8,5.4,3.85,3.31,.24,0xd8b38c,0xa6573c);cottage(-1.35,-54.6,5.1,4.55,4.12,-.25,0xd9c397,0x96543d,1);cottage(6.5,-59.1,4.0,3.6,3.17,-.25,0xc7a383,0xa76041);
    cottage(37.8,-53.6,6.1,4.3,3.85,-.28,0xd7b38c,0xab6948,1);cottage(44.2,-60.6,5.4,4.7,4.55,.13,0xc6b597,0xa85b41);
    cottage(-46.5,-12.4,5.4,4.3,3.4,.34,0xd2bc8d,0x9e6146);cottage(7.2,48.5,4.9,3.8,3.48,-.30,0xd3b28d,0xa46243);
    cottage(39.2,55.3,5.4,4.6,4.1,.41,0xc7b293,0xb56a46);
    if(typeof makeBoat==='function'&&M.wood){makeBoat(26.4,-63.3,.13,.70,0x8b6948,true);}
  }

  function mountainDetail(){
    const t=tex(512,512,(c,w,h)=>{
      const r=makeRandom(721985),im=c.createImageData(w,h);
      // A tileable field for mineral banding, scrub clearings, and forest grain.
      function tileNoise(x,y,n,seed){
        const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy;
        function hash(q,s){let m=Math.imul((q%n)+seed,1830761)^Math.imul((s%n)+seed*3,1637219);m=Math.imul(m^(m>>>15),1199540897);return ((m^(m>>>13))>>>0)/4294967295;}
        const u=a*a*(3-2*a),v=b*b*(3-2*b);
        return mixN(mixN(hash(ix,iy),hash(ix+1,iy),u),mixN(hash(ix,iy+1),hash(ix+1,iy+1),u),v);
      }
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const xx=x/w,yy=y/h,grain=r(),off=(y*w+x)*4;
        let macro=0,med=0;for(const [n,weight] of [[3,.47],[7,.33],[16,.20]]){macro+=tileNoise(xx*n,yy*n,n,94+n)*weight;med+=tileNoise(xx*n*3,yy*n*3,n*3,31+n)*weight;}
        const fine=tileNoise(xx*60,yy*60,60,167)*.59+tileNoise(xx*142,yy*142,142,813)*.23+grain*.18;
        im.data[off]=Math.round(macro*255);im.data[off+1]=Math.round(med*255);im.data[off+2]=Math.round(fine*255);im.data[off+3]=255;
      }c.putImageData(im,0,0);
    },true);
    t.colorSpace=THREE.NoColorSpace;return t;
  }
  function rockMaterial(layer,detail){
    const m=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false,fog:false});
    m.onBeforeCompile=s=>{
      s.uniforms.mountainInk={value:detail};s.uniforms.hillOrder={value:layer};
      s.vertexShader='varying vec3 ridgePosition; varying vec3 ridgeNormal;\n'+s.vertexShader;
      s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nridgePosition=position; ridgeNormal=normal;');
      s.fragmentShader='uniform sampler2D mountainInk; uniform float hillOrder; varying vec3 ridgePosition; varying vec3 ridgeNormal;\n'+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',[
        '#include <color_fragment>',
        'vec3 pp=ridgePosition; vec3 sn=normalize(ridgeNormal);',
        'vec2 land=pp.xz*.025+vec2(pp.y*.0015,-pp.y*.003);',
        'vec3 a=texture2D(mountainInk,land).rgb;',
        'vec3 b=texture2D(mountainInk,vec2(pp.x*.014+pp.z*.010,pp.y*.033+pp.z*.007)).rgb;',
        'vec3 c=texture2D(mountainInk,land*2.91+vec2(.37,-.41)).rgb;',
        'float exposed=smoothstep(.075,.30,1.-sn.y+(a.r-.5)*.33+hillOrder*.013);',
        'float fissure=1.-smoothstep(.01,.15,abs(fract(pp.y*.29+pp.x*.038-pp.z*.034+b.r*1.39+b.g*.59+sin(pp.z*.038+pp.x*.017)*1.17)-.52));',
        'fissure*=smoothstep(.33,.66,c.r*.48+b.g*.52)*exposed;',
        'float forest=(a.b-.5)*.32+(a.g-.5)*.24+(c.b-.5)*.12;',
        'float rockGrain=(b.g-.5)*.36+(c.g-.5)*.21+(c.b-.5)*.15-fissure*.125;',
        'float textureStrength=1.-.22*hillOrder;',
        'diffuseColor.rgb*=1.+textureStrength*mix(forest,rockGrain,exposed);',
        'float meadowPatch=smoothstep(.51,.72,a.r*.76+a.g*.24)*(1.-exposed);',
        'diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.14,1.05,.81),meadowPatch*textureStrength*.70);'
      ].join('\n'));
    };
    m.customProgramCacheKey=()=> 'bellwater-ridge-detail';return m;
  }

  function horizon(scene){
    const uniforms={clouds:{value:null},ready:{value:0}};
    const skyMat=new THREE.ShaderMaterial({
      side:THREE.BackSide,depthTest:false,depthWrite:false,fog:false,toneMapped:false,uniforms,
      vertexShader:'varying vec3 worldRay; void main(){worldRay=position; vec4 p=projectionMatrix*vec4(mat3(viewMatrix)*position,1.0); gl_Position=p.xyww;}',
      fragmentShader:'varying vec3 worldRay; uniform sampler2D clouds; uniform float ready; void main(){vec3 ray=normalize(worldRay); vec2 uv=vec2(atan(ray.z,ray.x)/6.28318530718+.5,(asin(clamp(ray.y,-1.,1.))+.055)/1.6257963268); vec3 fallback=mix(vec3(.62,.72,.73),vec3(.11,.40,.64),pow(max(ray.y,0.),.48)); vec3 sky=mix(fallback,texture2D(clouds,vec2(uv.x,clamp(uv.y,0.001,.999))).rgb,ready); gl_FragColor=vec4(sky,1.);\n#include <colorspace_fragment>\n}'
    });
    const sky=new THREE.Mesh(new THREE.SphereGeometry(1,42,22),skyMat);sky.frustumCulled=false;sky.renderOrder=-10000;sky.name='Bellwater • afternoon sky';scene.add(sky);
    const photo=new Image();const skyTexture=new THREE.Texture(photo);skyTexture.colorSpace=THREE.SRGBColorSpace;skyTexture.wrapS=THREE.RepeatWrapping;skyTexture.generateMipmaps=true;skyTexture.minFilter=THREE.LinearMipmapLinearFilter;uniforms.clouds.value=skyTexture;
    photo.onload=()=>{skyTexture.needsUpdate=true;uniforms.ready.value=1;};photo.src='data:image/webp;base64,__BELL_SKY__';
    const relief=mountainDetail();const sunDir=v(-32,55,27).normalize(),landMat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false,fog:false});
    const dry=[0x959a69,0x929e80,0xa4b4ad].map(co),fir=[0x425f4d,0x526f67,0x708c99].map(co),stone=[0xb3a585,0xb2b5a3,0xc8cdc8].map(co);
    const cool=[0x465f58,0x577580,0x7c95a2].map(co),air=[0xa3b7ae,0xa9bec0,0xadc4cb].map(co);
    for(let layer=0;layer<3;layer++){
      const seg=[305,390,482][layer],rows=[40,49,54][layer],d=data(),verts=[];
      for(let j=0;j<=rows;j++){
        const row=[];for(let k=0;k<=seg;k++){
          const a=circle*k/seg,t=j/rows,[x,z]=bandPos(layer,a,t),y=hillHeight(x,z,layer);
          row.push(v(x,y,z));
        }verts.push(row);
      }
      for(let j=0;j<=rows;j++)for(let k=0;k<=seg;k++){
        const p=verts[j][k],a=circle*k/seg,t=j/rows;
        const along=verts[j][(k+1)%seg].clone().sub(verts[j][(k-1+seg)%seg]),slopeV=verts[Math.min(rows,j+1)][k].clone().sub(verts[Math.max(0,j-1)][k]);
        const no=along.cross(slopeV).normalize();if(no.y<0)no.negate();
        const slope=1-no.y,fractal=.61*valueNoise(p.x*.062+3,p.z*.074+layer)+.27*valueNoise(p.x*.125,p.z*.169)+.12*valueNoise(p.x*.41,p.z*.33);
        const grass=smoothN(.29,.79,fractal+(p.y/(layer*31+28)-.27)*.24),rock=smoothN(.075,.34,slope+(p.y/(layer*24+25)-.41)*.16+(fractal-.53)*.24);
        const band=Math.sin(p.y*(layer===0?1.29:.86)+p.x*.121-p.z*.11+valueNoise(p.x*.08,p.z*.08)*2.9);
        const exaggerated=v(no.x*1.43,no.y*.90,no.z*1.43).normalize();const shadow=satN(.65-exaggerated.dot(sunDir)*.86+Math.max(0,.57-no.y)*.40);
        const col=fir[layer].clone().lerp(dry[layer],grass).lerp(stone[layer],rock).multiplyScalar(1+.08*(fractal-.5)+rock*.036*band);
        col.lerp(cool[layer],shadow*(layer===2?.79:.67)).lerp(air[layer],[.13,.22,.30][layer]);
        pt(d,p,col,[0,0],no);
        if(j&&k){const ix=j*(seg+1)+k;d.i.push(ix-seg-2,ix-1,ix-seg-1,ix-1,ix,ix-seg-1);}
      }
      sectorMeshes(scene,geo(d),rockMaterial(layer,relief),'Bellwater • terrain '+layer,12);
    }
    const hills=data(),r=makeRandom(22448);
    function facet(a,b,c,color){
      const start=hills.p.length/3;pt(hills,a,color);pt(hills,b,color);pt(hills,c,color);hills.i.push(start,start+1,start+2);
    }
    function hillTree(x,z,y,scale,pin=false){
      const h=scale*(pin?(1.00+r()*.40):(1.6+r()*.65)),rad=pin?(scale*(.43+r()*.14)):(h*(.112+r()*.049));
      const n=pin?7:6,offset=r()*circle,ca=co(pin?0x60735c:0x536e60).lerp(air[0],.27+r()*.16);
      const rings=pin?[[0,.10],[.53,.13],[.59,.56],[.70,1],[.84,.84],[1,.10]]:[[0,.19],[.14,.64],[.32,1],[.68,.65],[.89,.35],[1,.018]];
      const cross=[];
      for(const [frac,wr] of rings){const rr=[];for(let i=0;i<n;i++){const a=offset+i/n*circle;rr.push(v(x+Math.cos(a)*rad*wr,y+frac*h,z+Math.sin(a)*rad*wr));}cross.push(rr);}
      for(let j=1;j<cross.length;j++)for(let i=0;i<n;i++){
        const a=offset+(i+.5)/n*circle,lit=Math.max(0,Math.cos(a)*sunDir.x+Math.sin(a)*sunDir.z);
        const col=ca.clone().multiplyScalar(.88+.15*lit+.10*j/cross.length);
        const k=(i+1)%n;facet(cross[j-1][i],cross[j][i],cross[j-1][k],col);facet(cross[j][i],cross[j][k],cross[j-1][k],col);
      }
    }
    for(let cluster=0;cluster<61;cluster++){
      const ca=r()*circle,ct=.26+r()*.49,n=5+(r()*16|0);
      for(let j=0;j<n;j++){
        const a=ca+(r()-.5)*.14,t=ct+(r()-.5)*.18,[x,z]=bandPos(0,a,t),y=hillHeight(x,z,0)-.15;
        if(y>1.3&&Math.abs(x-22)>.21*Math.abs(z)+13)hillTree(x,z,y,.72+r()*1.11,r()<.44);
      }
    }
    function hamlet(a,t,s,n){
      for(let j=0;j<n;j++){
        const [x,z]=bandPos(0,a+(r()-.5)*.164,t+(r()-.5)*.105),y=hillHeight(x,z,0);
        if(y<.85)continue;
        const w=s*(1.46+r()*1.1),h=s*(2.6+r()*2.15),d=s*(1.34+r()*.72),yaw=r()*1.28-.64;
        const p=(xx,yy,zz)=>v(x+xx*Math.cos(yaw)+zz*Math.sin(yaw),y+yy,z-xx*Math.sin(yaw)+zz*Math.cos(yaw));
        const walls=co([0xb1ad96,0xc3b99c,0xbfb5a1][j%3]).lerp(air[0],.20),roof=co(0xa37f66).lerp(air[0],.24);
        for(let k=0;k<4;k++){
          const corners=[[-w,-d],[w,-d],[w,d],[-w,d]],c1=corners[k],c2=corners[(k+1)%4];
          const col=walls.clone().multiplyScalar([.79,.87,1.04,.97][k]);
          facet(p(c1[0],-.77,c1[1]),p(c2[0],-.77,c2[1]),p(c2[0],h,c2[1]),col);
          facet(p(c1[0],-.77,c1[1]),p(c2[0],h,c2[1]),p(c1[0],h,c1[1]),col);
        }
        for(const side of [-1,1]){const z0=side*d*1.09,rr=roof.clone().multiplyScalar(side<0?.84:1.05);
          facet(p(-w*1.07,h,z0),p(w*1.07,h,z0),p(w*1.07,h+d*.53,0),rr);
          facet(p(-w*1.07,h,z0),p(w*1.07,h+d*.53,0),p(-w*1.07,h+d*.53,0),rr);
          facet(p(side*w,h,-d),p(side*w,h,d),p(side*w,h+d*.53,0),walls);
        }
        for(let k=0;k<4;k++){const aa=a+(r()-.5)*.17,t2=t+(r()-.5)*.12,pt=bandPos(0,aa,t2),hy=hillHeight(pt[0],pt[1],0);if(hy>.8)hillTree(pt[0],pt[1],hy-.10,1.06+r()*.69);}
      }
    }
    hamlet(-2.30,.46,.80,6);hamlet(-.59,.46,.70,4);hamlet(1.04,.53,.83,5);hamlet(2.85,.37,.70,4);
    sectorMeshes(scene,geo(hills),landMat,'Bellwater • upland farms and cypresses',10);
    riverCountry(scene);return time=>{wind.value=time;};
  }
  return {plant,bed,horizon};
})();
function buildHorizon(scene){return bellNature.horizon(scene);}
function plantTree(x,z,size=1,type='plane',seed=1){bellNature.plant(x,z,size,type,seed);}
function flowerBed(x,y,z,radius=.65,seed=1){bellNature.bed(x,y,z,radius,seed);}
