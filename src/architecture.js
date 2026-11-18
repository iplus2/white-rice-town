// Architectural kit for White Rice Town. The front of each building is local +Z.
function buildArchitecture() {
  const P = Math.PI, TAU = 2 * P, pale = 0xe9d7b2, bright = 0xffeccb;
  const shadowStone = 0xae9d82, walnut = 0x67462d, oak = 0xa4784c, iron = 0x393d3c;
  const plane = new THREE.PlaneGeometry(1,1);
  const circle = new THREE.CircleGeometry(1,64);
  const assets = new Map(), cardSheets=new Map(), motions=[];
  function movingPart(x,y,z,ry,build,update) {
    const anchor=new THREE.Group(), part=model(build);
    anchor.matrixAutoUpdate=false;
    anchor.matrix.multiplyMatrices(frame,new THREE.Matrix4().makeRotationY(ry).setPosition(x,y,z));
    anchor.add(part);scene.add(anchor);motions.push(t=>update(part,t));
    return part;
  }
  function randomSeed(initial) {
    let seed = initial >>> 0;
    return () => {seed = (Math.imul(1664525,seed)+1013904223)>>>0; return seed/4294967296;};
  }
  function painted(key,w,h,draw,opt={}) {
    if (assets.has(key)) return assets.get(key);
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    const g=c.getContext('2d'); draw(g,w,h,randomSeed(Array.from(key).reduce((n,s)=>((n*31+s.charCodeAt(0))>>>0),1793)));
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4;
    const m=new THREE.MeshStandardMaterial({map:t,color:0xffffff,roughness:.8,metalness:0,side:THREE.DoubleSide,...opt});
    m.name='White Rice Town / '+key;
    const family=key.startsWith('window-lit-')?'glass':key.startsWith('lime-wear-')?'lime':key.startsWith('garden-')?'flowers':
      /^(?:shutter-|door-|bookspine-|civic-tile-|sign-)/.test(key)?'joinery':null;
    if(family)m.userData.card=packDetail(family,c,m);
    assets.set(key,m); return m;
  }
  function packDetail(family,source,example) {
    const sizes={joinery:[2048,2048],glass:[1024,512],lime:[2048,512],flowers:[1024,256]};
    let sheet=cardSheets.get(family);
    if(!sheet) {
      const canvas=document.createElement('canvas');[canvas.width,canvas.height]=sizes[family];
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
      const material=example.clone();material.map=texture;material.name='White Rice Town / '+family+' sheet';
      // A shutter already has a solid backing. Shadow polygons are reserved for its casing.
      material.userData.shadow=false;sheet={g:canvas.getContext('2d'),texture,material,x:0,y:0,line:0};cardSheets.set(family,sheet);
    }
    const {g,texture,material}=sheet,W=g.canvas.width,H=g.canvas.height,w=source.width,h=source.height,pad=5;
    if(sheet.x+w+2*pad>W){sheet.x=0;sheet.y+=sheet.line;sheet.line=0;}
    if(sheet.y+h+2*pad>H)return null;
    const x=sheet.x+pad,y=sheet.y+pad;
    g.drawImage(source,x,y); // Extend border texels into the mipmap apron.
    g.drawImage(source,0,0,w,1,x,y-pad,w,pad);g.drawImage(source,0,h-1,w,1,x,y+h,w,pad);
    g.drawImage(source,0,0,1,h,x-pad,y,pad,h);g.drawImage(source,w-1,0,1,h,x+w,y,pad,h);
    for(const sx of [0,1])for(const sy of [0,1])g.drawImage(source,sx*(w-1),sy*(h-1),1,1,sx?x+w:x-pad,sy?y+h:y-pad,pad,pad);
    const geo=plane.clone(),uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(x+.5+uv.getX(i)*(w-1))/W,1-(y+.5+(1-uv.getY(i))*(h-1))/H);
    texture.needsUpdate=true;sheet.x+=w+pad*2;sheet.line=Math.max(sheet.line,h+pad*2);
    return {geo,material};
  }
  function plate(x,y,z,w,h,mat) {
    const tile=mat.userData.card;
    addGeo(tile?tile.geo:plane,tile?tile.material:mat,x,y,z,w,h,1);
  }
  function disc(x,y,z,r,mat) { addGeo(circle,mat,x,y,z,r,r,1); }
  function marbleTone(base,k) {
    const c = new THREE.Color(base);
    // Vary individual pieces without losing their common stone color.
    c.multiplyScalar(.91+.16*k); return c.getHex();
  }
  function xyPrism(points,z,depth,mat,color) {
    let area=0;
    for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a[0]*b[1]-b[0]*a[1];}
    if(area<0) points=points.slice().reverse();
    const front=points.map(p=>[p[0],p[1],z+depth/2]),back=points.map(p=>[p[0],p[1],z-depth/2]);
    poly(front,mat,color); poly(back.slice().reverse(),mat,color);
    for(let i=0;i<points.length;i++){const j=(i+1)%points.length;poly([back[i],back[j],front[j],front[i]],mat,color);}
  }
  function archBand(x,y,z,r,thick,depth,count,mat=M.trim,base=pale,keystone=true) {
    for(let i=0;i<count;i++) {
      const a=P*i/count+.002, b=P*(i+1)/count-.002;
      const key=keystone && i===Math.floor(count/2), rr=r+thick+(key?.07:0);
      xyPrism([[x+r*Math.cos(a),y+r*Math.sin(a)],[x+rr*Math.cos(a),y+rr*Math.sin(a)],
        [x+rr*Math.cos(b),y+rr*Math.sin(b)],[x+r*Math.cos(b),y+r*Math.sin(b)]],
        z+(key?.017:0),depth+(key?.034:0),mat,marbleTone(base,((i*7)%13)/12));
    }
  }
  function openingWall(w,h,z,thick,door,spring,mat,color) {
    const r=door/2, flank=(w-door)/2;
    for(const s of [-1,1])box(s*(r+flank/2),h/2,z,flank,h,thick,mat,color);
    const top=spring+r;
    box(0,top+(h-top)/2,z,door,h-top,thick,mat,color);
    // Each stone-faced spandrel follows the curve on both faces of the wall.
    for(let i=0;i<14;i++){
      const a=P*i/14,b=P*(i+1)/14, xa=r*Math.cos(a),xb=r*Math.cos(b),ya=spring+r*Math.sin(a),yb=spring+r*Math.sin(b);
      const points=[[xa,ya],[xa,top+.002],[xb,top+.002],[xb,yb]];
      xyPrism(points,z,thick,mat,color);
    }
  }
  function casing(x,z,door,spring,fill=pale,width=.22) {
    const radius=door/2, levels=Math.ceil(spring/.47);
    for(const s of [-1,1]) {
      for(let j=0;j<levels;j++)box(x+s*(radius+width/2),(j+.5)*spring/levels,z,width+(j===0?.08:0),spring/levels-.008,.24,M.trim,marbleTone(fill,((j*3+6)%7)/6));
      box(x+s*(radius+width/2),spring-.035,z+.014,width+.13,.14,.32,M.trim,bright);
      box(x+s*(radius+width/2),.15,z+.005,width+.12,.30,.29,M.trim,fill);
    }
    archBand(x,spring,z,radius,width,.25,15,M.trim,fill);
  }
  function grain(g,w,h,r,n,alpha=.045) {
    for(let k=0;k<n;k++){g.fillStyle=r()>.47?'rgba(255,245,212,'+alpha+')':'rgba(24,28,34,'+alpha+')';g.fillRect(r()*w,r()*h,r()*3+.4,r()*2+.5);}
  }
  function limeWear(variant) {
    return painted('lime-wear-'+variant,576,180,(g,w,h,r)=>{
      const wash=g.createLinearGradient(0,h*.10,0,h);wash.addColorStop(0,'rgba(111,92,66,0)');wash.addColorStop(.64,'rgba(119,108,75,.045)');wash.addColorStop(1,'rgba(90,87,62,.24)');g.fillStyle=wash;g.fillRect(0,0,w,h);
      for(let i=0;i<105;i++){
        const x=w*r(),y=h*(.54+.62*r()),sz=5+r()**2*36;
        const grad=g.createRadialGradient(x,y,0,x,y,sz);grad.addColorStop(0,i%3?'rgba(120,113,77,.13)':'rgba(234,218,177,.19)');grad.addColorStop(1,'rgba(130,117,79,0)');
        g.fillStyle=grad;g.fillRect(x-sz,y-sz,sz*2,sz*2);
      }
      for(let j=0;j<4;j++){
        const xo=w*(.10+.78*r()),yo=h*(.67+.25*r()),rx=(12+r()*30)*(j===0?1.3:.70),ry=rx*(.30+.3*r());
        const p=new Path2D();for(let i=0;i<50;i++){const a=i*TAU/50,len=.61+.33*r()+.18*Math.sin(3*a+xo);const x=xo+Math.cos(a)*rx*len,y=yo+Math.sin(a)*ry*len;if(!i)p.moveTo(x,y);else p.lineTo(x,y);}p.closePath();
        g.fillStyle='rgba(158,123,90,.48)';g.fill(p);g.strokeStyle='rgba(238,223,191,.55)';g.lineWidth=2;g.stroke(p);
        g.save();g.clip(p);g.fillStyle='rgba(120,106,85,.72)';for(let k=0;k<4;k++){const y=yo-13+k*8;g.fillRect(xo-rx,y,rx*2,.95);for(let j=-3;j<3;j++)g.fillRect(xo+j*14+(k%2)*6,y,.9,8);}
        g.restore();
      }
      for(let j=0;j<3;j++){
        let x=w*(.09+.82*r()),y=h*(.50+.45*r());const p=new Path2D();p.moveTo(x,y);
        for(let k=0;k<13;k++){x+=(r()-.48)*6.8;y-=r()*3.8;p.lineTo(x,y);if(k===6){p.lineTo(x+5,y-2);p.lineTo(x+9,y-6);p.moveTo(x,y);}}
        g.strokeStyle='rgba(105,94,76,.44)';g.lineWidth=.7;g.stroke(p);
      }
      for(let i=0;i<2500;i++){const x=w*r(),y=h*(1-r()**2*.82);g.fillStyle=i%3?'rgba(207,197,161,.17)':'rgba(95,94,70,.18)';g.fillRect(x,y,.4+1.7*r(),.4+1.0*r());}
      const edge=g.createLinearGradient(0,0,w,0);edge.addColorStop(0,'transparent');edge.addColorStop(.07,'black');edge.addColorStop(.93,'black');edge.addColorStop(1,'transparent');g.globalCompositeOperation='destination-in';g.fillStyle=edge;g.fillRect(0,0,w,h);
    },{transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  }
  function numberTile(num) {
    return painted('civic-tile-'+num,144,112,(g,w,h,r)=>{
      g.fillStyle='#d7d0af';g.fillRect(0,0,w,h);g.strokeStyle='#687980';g.lineWidth=4;g.strokeRect(6,6,w-12,h-12);g.lineWidth=1.5;g.strokeRect(10,10,w-20,h-20);
      g.fillStyle='#3e5a69';g.font='italic 63px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(num),w*.50,h*.54,w*.71);
      for(const x of [15,w-15])for(const y of [15,h-15]){g.fillStyle='#667778';g.beginPath();g.arc(x,y,2.2,0,TAU);g.fill();}
      grain(g,w,h,r,500,.12);
    },{roughness:.42});
  }
  function dripGlass(i) {
    return painted('window-lit-'+i,160,248,(g,w,h,r)=>{
      const sky=g.createLinearGradient(0,0,w*.36,h);sky.addColorStop(0,['#809a9c','#899e9c','#92a8a8','#7c9198','#7b8f8f','#879794'][i]);sky.addColorStop(.45,'#607b80');sky.addColorStop(1,'#405151');g.fillStyle=sky;g.fillRect(0,0,w,h);
      // The glass catches shutters and the uneven skyline of the opposite street.
      g.beginPath();g.moveTo(-5,h*.63);let xx=-5;
      for(let j=0;j<8;j++){const roof=h*(.30+.25*r()),ww=15+r()*34;g.lineTo(xx,roof+10);g.lineTo(xx+ww*.42,roof);g.lineTo(xx+ww*.61,roof+2);g.lineTo(xx+ww,roof+10);xx+=ww;}g.lineTo(w,h);g.lineTo(0,h);g.closePath();
      g.fillStyle='rgba(38,53,57,.47)';g.fill();g.strokeStyle='rgba(206,193,150,.26)';g.lineWidth=1.7;g.stroke();
      for(let k=0;k<7;k++){const x=r()*w,y=h*(.53+r()*.31);g.fillStyle='rgba(209,191,140,.17)';g.fillRect(x,y,2.5+r()*3,5+r()*8);}
      // Some homes hang a single linen curtain, others have two, a blind or plain glass.
      const sides=i===2||i===5?[]:i===0||i===3?[-1]:[-1,1];
      const warm=i===3?'183,145,104':i===4?'139,164,145':'219,204,166';
      for(const side of sides){
        g.save();if(side===1){g.translate(w,0);g.scale(-1,1);}
        const cx=w*(i===0?.34:.26),wid=w*(i===3?.49:.30),ty=h*(.44+.14*r());
        const drape=new Path2D();drape.moveTo(0,0);drape.lineTo(wid,0);drape.bezierCurveTo(wid*1.08,ty*.36,cx*.70,ty*.78,cx*.50,ty);
        drape.bezierCurveTo(cx*.40,ty*1.23,cx*.84,h*.87,cx*.78,h);drape.lineTo(0,h);drape.closePath();
        g.fillStyle='rgba('+warm+',.48)';g.fill(drape);g.clip(drape);
        for(let k=0;k<18;k++){
          const x=k*wid/16,offset=(r()-.5)*3;g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x*1.06,ty*.29,x*.80+offset,ty*.73,x*.54,ty);g.quadraticCurveTo(x*.58,h*.74,x*.81,h);
          g.strokeStyle=k%2?'rgba(52,63,59,.22)':'rgba(247,228,186,.45)';g.lineWidth=k%2?1.8:1.35;g.stroke();
        }
        for(let k=0;k<40;k++){const y=k*h/39;g.fillStyle='rgba(234,216,169,.075)';g.fillRect(0,y,w,1);}
        g.restore();
      }
      if(i===5){
        const bound=h*.28;g.fillStyle='rgba(190,174,133,.83)';g.fillRect(0,0,w,bound);for(let j=4;j<bound;j+=7){g.fillStyle='rgba(76,80,67,.27)';g.fillRect(0,j,w,2);g.fillStyle='rgba(225,214,176,.27)';g.fillRect(0,j-2,w,1);}
        g.strokeStyle='#9a997e';g.lineWidth=1.3;g.beginPath();g.moveTo(w*.88,bound);g.lineTo(w*.88,h*.54);g.stroke();
      }
      if(i===2||i===4){const cy=h*.96,xx=w*(i===2?.27:.71);g.fillStyle='rgba(58,62,46,.55)';g.beginPath();g.moveTo(xx-11,cy-12);g.lineTo(xx+11,cy-12);g.lineTo(xx+8,cy);g.lineTo(xx-8,cy);g.fill();
        for(let j=0;j<11;j++){const px=xx+(r()-.5)*19,py=cy-14-r()*23;g.strokeStyle='rgba(62,77,57,.58)';g.beginPath();g.moveTo(xx,cy-11);g.lineTo(px,py);g.stroke();g.fillStyle='rgba(73,93,65,.70)';g.beginPath();g.ellipse(px,py,5,2.6,r()*2,0,TAU);g.fill();}}
      const sheen=g.createLinearGradient(0,h,w*.85,0);sheen.addColorStop(0,'rgba(183,207,202,0)');sheen.addColorStop(.52,'rgba(195,218,216,.04)');sheen.addColorStop(.62,'rgba(228,234,217,.17)');sheen.addColorStop(.66,'rgba(208,227,218,.025)');sheen.addColorStop(1,'rgba(205,226,220,.105)');g.fillStyle=sheen;g.fillRect(0,0,w,h);
      for(const [u,v,ww,hh] of [[.48,0,.033,1],[0,.38,1,.015],[0,.70,1,.015]]){
        g.fillStyle='#4c5650';g.fillRect(u*w,v*h,ww*w,hh*h);g.fillStyle='#a9ad92';g.fillRect(u*w,v*h,ww*w,1.2);g.fillRect(u*w,v*h,1,hh*h);
      }
      g.lineWidth=9;g.strokeStyle='#4d5046';g.strokeRect(0,0,w,h);g.strokeStyle='#b1aa8f';g.lineWidth=1.8;g.strokeRect(4,4,w-8,h-8);
      grain(g,w,h,r,600,.07);
    },{roughness:.52,metalness:.03,emissive:0x171d1e,emissiveIntensity:.24});
  }
  function rugCanvas() {
    return painted('archive-runner',640,416,(g,w,h,r)=>{
      g.fillStyle='#9c6953';g.fillRect(0,0,w,h);
      const border=(off,line,col)=>{g.lineWidth=line;g.strokeStyle=col;g.strokeRect(off,off,w-2*off,h-2*off);};
      border(4,7,'#645c51');border(11,3,'#c8aa78');border(23,16,'#626e65');border(35,4,'#d0ac78');border(40,3,'#685c52');
      const motif=(x,y,size,cl)=>{g.save();g.translate(x,y);g.rotate(P/4);g.strokeStyle=cl;g.lineWidth=2.5;g.strokeRect(-size/2,-size/2,size,size);g.restore();};
      for(let x=26;x<w-15;x+=20){motif(x,24,6,'#c3a277');motif(x,h-24,6,'#c3a277');}
      for(let y=43;y<h-30;y+=20){motif(24,y,6,'#c3a277');motif(w-24,y,6,'#c3a277');}
      for(let yy=70;yy<h-45;yy+=29)for(let xx=67;xx<w-43;xx+=28){g.fillStyle='rgba(219,182,133,.42)';g.fillRect(xx+(yy%2)*6,yy,2.6,3);}
      for(const xp of [.26,.5,.74]){
        const x=w*xp,y=h*.5,s=xp===.5?79:56;motif(x,y,s*1.33,'#bd9f6f');motif(x,y,s,'#596d67');
        for(let i=0;i<8;i++){g.save();g.translate(x,y);g.rotate(i*TAU/8);g.fillStyle=i%2?'#c8b180':'#7f8b72';g.beginPath();g.moveTo(0,-s*.49);g.lineTo(s*.09,-s*.13);g.lineTo(0,0);g.closePath();g.fill();g.restore();}
        motif(x,y,s*.24,'#c4a377');
      }
      for(let y=0;y<h;y+=2){g.fillStyle=y%4?'rgba(38,37,32,.13)':'rgba(206,175,130,.10)';g.fillRect(0,y,w,.8);}
      for(let x=0;x<w;x+=3){g.fillStyle='rgba(63,62,48,.075)';g.fillRect(x,0,1,h);}
      grain(g,w,h,r,3200,.16);
    },{roughness:.97});
  }
  function millRock() {
    return painted('granite-millstone',512,384,(g,w,h,r)=>{
      const id=g.createImageData(w,h),d=id.data;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const b=196+6*Math.sin(x/13+y/21)+5*Math.sin(x/38-y/17)+(r()-.5)*42+(r()>.964?-42:0),i=4*(x+y*w);
        d[i]=b+6;d[i+1]=b+3;d[i+2]=b-3;d[i+3]=255;
      }g.putImageData(id,0,0);
      for(let i=0;i<w*h/9;i++){const x=r()*w,y=r()*h;g.strokeStyle=i%5?'rgba(232,231,207,.35)':'rgba(70,79,74,.48)';g.lineWidth=.6+r()*1.4;g.beginPath();g.moveTo(x,y);g.lineTo(x+r()*3-.4,y-r()*2);g.stroke();}
    },{vertexColors:true,roughness:.98});
  }
  function glaze(variant=0) {return dripGlass(((variant%6)+6)%6);}
  const shutterColors = [['#3c655b','#90a48a','#294c45'],['#627c72','#abb2a0','#475c52'],['#5e7569','#a8aa8b','#394c41'],
    ['#5b777e','#a0ab9a','#344e57'],['#976f4b','#c4a480','#6d4c35'],['#667764','#a3a78b','#405a48']];
  function shutterMat(variant=0) {
    variant=((variant%6)+6)%6;
    return painted('shutter-'+variant,100,240,(g,w,h,r)=>{
      const [base,lit,dark]=shutterColors[variant];g.fillStyle=base;g.fillRect(0,0,w,h);
      for(let j=12;j<h-9;j+=12){g.fillStyle=dark;g.fillRect(9,j,w-18,10);const grad=g.createLinearGradient(0,j,0,j+8);
        grad.addColorStop(0,lit);grad.addColorStop(.22,base);grad.addColorStop(1,dark);g.fillStyle=grad;g.fillRect(9,j+1,w-18,7);}
      for(const [x,y,ww,hh] of [[0,0,9,h],[w-9,0,9,h],[0,0,w,11],[0,h*.49,w,9],[0,h-10,w,10]]){
        g.fillStyle=base;g.fillRect(x,y,ww,hh);g.fillStyle=lit;g.fillRect(x,y,ww,1.4);g.fillRect(x,y,1.2,hh);g.fillStyle=dark;g.fillRect(x+ww-1,y,1,hh);}
      for(let i=0;i<95;i++){g.strokeStyle=i%2?'rgba(220,196,150,.23)':'rgba(29,47,36,.25)';const x=r()*w,y=r()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+r()*5+.3,y+r()*1.2);g.stroke();}
      grain(g,w,h,r,640);
    });
  }
  function fernBox(variant) {
    return painted('garden-'+(variant%3),256,128,(g,w,h,r)=>{
      const flower=['#c7463b','#e8b774','#9b88ad'][variant%3], high=['#f28970','#ffe4ac','#d7bddf'][variant%3];
      for(let i=0;i<82;i++){
        const x=w*(.02+.96*r()),baseY=h*(.88+.08*r()),tipX=x+(r()-.5)*42,tipY=h*(.17+.56*r());
        g.strokeStyle=r()>.5?'#405640':'#617346';g.lineWidth=.7+r()*1.5;g.beginPath();g.moveTo(x,baseY);g.quadraticCurveTo(x+(r()-.5)*14,baseY-25,tipX,tipY);g.stroke();
        for(let j=0;j<5;j++){const t=(j+1)/6,xx=x*(1-t)+tipX*t,yy=baseY*(1-t)+tipY*t;g.fillStyle=['#425b40','#677745','#819558','#496b4a'][i%4];
          g.beginPath();g.ellipse(xx+(j%2?1:-1)*3,yy,6+r()*5,2.1+r()*2,(j%2?.70:-.68),0,TAU);g.fill();}
        if(r()<.41){for(let m=0;m<6;m++){g.fillStyle=m%3?flower:high;g.beginPath();g.ellipse(tipX+(r()-.5)*11,tipY+(r()-.5)*8,2+r()*2,1.4+r()*1.7,r()*P,0,TAU);g.fill();}}
      }
    },{alphaTest:.38,side:THREE.DoubleSide,roughness:.95});
  }
  function shutters(x,y,z,w,h,variant,options={}) {
    const open=options.open!==false, caseColor=options.frame||pale;
    box(x,y,z+.016,w+.19,h+.18,.13,M.trim,caseColor);
    box(x,y,z+.085,w+.04,h+.055,.075,M.wood,0x544a3c);
    plate(x,y,z+.131,w,h,glaze(variant));
    if(open)for(const s of [-1,1]){
      const leaf=w*(.43+(variant%2)*.025),hinge=x+s*(w*.5+.11),ry=s*((variant%3===0?.22:.12)+(s===1?.05:0));
      scope(hinge,y,z+.115,ry,()=>{
        box(s*leaf/2,0,0,leaf,h+.03,.08,M.wood,0x596e5c);
        plate(s*leaf/2,0,.048,leaf,h+.02,shutterMat(variant));
      });
    }
    box(x,y-h/2-.10,z+.105,w+.34,.13,.34,M.trim,caseColor);
    if(options.lintel) box(x,y+h/2+.13,z+.07,w+.37,.13,.26,M.trim,caseColor);
    if(options.flowers){
      const ww=w*.91;
      box(x,y-h/2+.001,z+.27,ww,.19,.24,M.plaster,variant%2?0xa56344:0x876541);
      box(x,y-h/2+.080,z+.27,ww+.06,.062,.28,M.trim,0xba7950);
      plate(x,y-h/2+.20,z+.30,ww+.18,.48,fernBox(variant));
      plate(x+.07,y-h/2+.20,z+.215,ww+.17,.40,fernBox(variant+1));
    }
  }
  function gableFaces(w,d,h,rise,mat,color,interior=false) {
    const x=w/2,z=d/2;
    for(const sx of [-1,1]) {
      const pts=sx<0?[[-x,h,-z],[-x,h,z],[-x,h+rise,0]]:[[x,h,z],[x,h,-z],[x,h+rise,0]];
      poly(pts,mat,color);
      if(interior)poly(pts.slice().reverse().map(p=>[p[0]-sx*.09,p[1],p[2]]),mat,color);
    }
  }
  function roof(w,d,h,rise,hip,clay,wall,opts={}) {
    const X=w/2+.35,Z=d/2+.33,R=Math.max(.23,X-hip),y=h+.04,yy=h+rise;
    const slope=Math.hypot(Z,yy-y)/Z;
    // Tile ribs follow the direction of runoff on each pitched face.
    const roofFace=(p,alongZ)=>{
      const uv=p.map(v=>alongZ?[v[0],(v[1]-y)*Math.hypot(Z,yy-y)/(yy-y)]:[v[2],(v[1]-y)*Math.hypot(Math.max(.47,hip),yy-y)/(yy-y)]);
      poly(p,M.roof,clay,uv);
      if(opts.hollow) poly(p.slice().reverse().map(v=>[v[0],v[1]-.085,v[2]]),M.plank,0x94724f);
    };
    roofFace([[-X,y,Z],[X,y,Z],[R,yy,0],[-R,yy,0]],true);
    roofFace([[X,y,-Z],[-X,y,-Z],[-R,yy,0],[R,yy,0]],true);
    if(hip>.015){
      roofFace([[X,y,Z],[X,y,-Z],[R,yy,0]],false);
      roofFace([[-X,y,-Z],[-X,y,Z],[-R,yy,0]],false);
      for(const s of [-1,1])for(const t of [-1,1])beam([s*R,yy+.03,0],[s*X,y+.025,t*Z],.070,M.trim,marbleTone(clay,.75),8);
    }else{
      gableFaces(w,d,h,rise,M.plaster,wall,opts.hollow);
      for(const s of [-1,1])for(const t of [-1,1])rodBox([s*X,y-.045,t*Z],[s*X,yy-.055,0],.10,.14,M.wood,opts.paintedEaves?pale:walnut);
    }
    if(opts.hollow){
      for(const s of [-1,1]){box(s*(w/2+.12),y-.09,0,.42,.16,d+.48,M.wood,opts.paintedEaves?pale:0x816447);box(0,y-.09,s*(d/2+.12),w+.52,.16,.42,M.wood,opts.paintedEaves?pale:0x816447);}
    }else box(0,y-.09,0,w+.52,.16,d+.48,M.wood,opts.paintedEaves?pale:0x816447);
    for(const t of [-1,1]){
      box(0,y-.02,t*Z,w+.72,.11,.095,M.trim,marbleTone(clay,.20));
      if(opts.rafters){const n=Math.max(5,Math.floor(w/.73));
        for(let i=0;i<n;i++)box((i+.5)*w/n-w/2,h-.18,t*(d/2+.095),.12,.17,.47,M.wood,opts.paintedEaves?pale:0x705039);}
    }
    beam([-R-.04,yy+.025,0],[R+.04,yy+.025,0],.115,M.trim,marbleTone(clay,.77),10);
    if(opts.ridgeDetail!==false){
      const n=Math.min(20,Math.max(3,Math.floor((2*R)/.53)));
      for(let i=0;i<=n;i++){
        const x=-R+i*(2*R)/n;
        beam([x-.027,yy+.029,0],[x+.027,yy+.029,0],.125,M.trim,marbleTone(clay,.35+.40*((i*7)%9)/8),10);
      }
    }
    return slope;
  }
  function chimney(x,y,z,s,variant=0) {
    scope(x,y,z,0,()=>{
      box(0,.60*s,0,.50*s,1.20*s,.49*s,M.stone,variant%2?0xd3b99a:0xb98d73);
      box(0,1.16*s,0,.61*s,.15*s,.60*s,M.trim,shadowStone);
      for(const off of [-.15,.15]) {
        cyl(off*s,1.38*s,0,.11*s,.085*s,.36*s,M.trim,variant%2?0xa56946:0xc1815e,10);
        cyl(off*s,1.58*s,0,.13*s,.13*s,.07*s,M.trim,0xcd9168,10);
        cyl(off*s,1.621*s,0,.09*s,.09*s,.008*s,M.solid,0x38312b,10);
      }
    });
  }
  function quoins(w,d,y0,y1,color,step=.54,all=true) {
    const rows=Math.max(1,Math.round((y1-y0)/step));
    for(const sx of [-1,1])for(const sz of (all?[-1,1]:[1]))for(let i=0;i<rows;i++){
      const wy=(y1-y0)/rows;
      box(sx*(w/2-(i%2?.14:.055)),y0+(i+.5)*wy,sz*(d/2-(i%2?.035:.12)),i%2?.44:.29,wy-.022,i%2?.24:.43,M.trim,marbleTone(color,((i*7+3)%11)/10));
    }
  }
  function doorArt(variant) {
    return painted('door-'+(variant%4),160,264,(g,w,h,r)=>{
      const bases=['#70523e','#58675a','#875e3f','#546b69'],dark=['#412e25','#36453b','#583b2c','#344c4b'];
      const base=bases[variant%4],deep=dark[variant%4];g.fillStyle=base;g.fillRect(0,0,w,h);
      for(let i=0;i<800;i++){g.fillStyle=i%3?'rgba(235,190,138,.095)':'rgba(24,29,23,.18)';g.fillRect(r()*w,r()*h,.5+r()*1.3,2+r()*34);}
      g.strokeStyle=deep;g.lineWidth=3;
      for(const x of [0,w/2])for(const [y,hh] of [[7,120],[138,108]]){
        g.strokeRect(x+7,y,w/2-14,hh);g.strokeStyle='rgba(225,192,143,.45)';g.strokeRect(x+10,y+3,w/2-20,hh-7);g.strokeStyle=deep;
        g.strokeRect(x+15,y+8,w/2-30,hh-17);}
      g.lineWidth=4;g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.stroke();
      for(const y of [70,197])for(const x of [5,w-5]){g.fillStyle='#373c36';g.fillRect(x<10?x:x-14,y,14,3);}
      for(const x of [w*.41,w*.59]){g.fillStyle='#c7a96c';g.beginPath();g.arc(x,h*.55,2.5,0,TAU);g.fill();}
      grain(g,w,h,r,600);
    });
  }
  function closedDoor(x,z,w,h,variant) {
    box(x,h/2+.04,z+.025,w+.25,h+.15,.17,M.trim,pale);
    box(x,h/2+.035,z+.11,w+.07,h+.04,.075,M.wood,0x483d31);
    plate(x,h/2+.041,z+.153,w,h,doorArt(variant));
    box(x,h+.145,z+.09,w+.34,.15,.27,M.trim,bright);
    box(x,.08,z+.18,w+.25,.14,.50,M.trim,shadowStone);
  }
  function balcony(x,y,z,w,depth=.56) {
    box(x,y-.02,z+depth*.46,w+.15,.16,depth+.12,M.trim,pale);
    for(const s of [-1,1]) {
      box(x+s*(w*.36),y-.19,z+.10,.16,.31,.28,M.trim,shadowStone);
      rodBox([x+s*w*.36,y-.35,z+.035],[x+s*w*.36,y-.10,z+depth*.65],.11,.12,M.trim,pale);
      beam([x+s*w*.49,y+.64,z+.015],[x+s*w*.49,y+.64,z+depth],.028,M.darkMetal,0xffffff,8);
    }
    const n=Math.max(4,Math.round(w/.27));
    for(let k=0;k<=n;k++){
      const a=x+w*(k/n-.5);
      rodBox([a,y+.08,z+depth],[a,y+.64,z+depth],.032,.040,M.darkMetal,0xffffff);
      if(k%2===0)box(a,y+.32,z+depth,.067,.067,.05,M.metal,0x62645a,0,0,.785);
    }
    for(const yy of [.16,.66])box(x,y+yy,z+depth,w+.045,.043,.045,M.darkMetal);
  }
  function awning(x,y,z,w,tint,depth=1.09) {
    const count=Math.max(7,Math.round(w/.38)|1),band=w/count,front=y-.35;
    for(let i=0;i<count;i++){
      const x0=x-w/2+i*band,x1=x0+band,c=i%2?0xf9e9ca:tint;
      const a=[x0,y,z],b=[x1,y,z],c0=[x0,y-.21,z+depth*.57],c1=[x1,y-.21,z+depth*.57], d0=[x0,front,z+depth],d1=[x1,front,z+depth];
      poly([d0,d1,c1,c0],M.fabric,c);poly([c0,c1,b,a],M.fabric,c);
      const pts=[[x0,front],[x0,front-.13],[x0+band*.17,front-.20],[x0+band*.5,front-.23],[x0+band*.83,front-.20],[x1,front-.13],[x1,front]];
      poly(pts.map(p=>[p[0],p[1],z+depth+.002]),M.fabric,c);
    }
    for(const s of [-1,1])beam([x+s*(w/2-.06),y-.85,z],[x+s*(w/2-.06),front-.02,z+depth],.029,M.darkMetal,0xffffff,8);
    beam([x-w*.51,front-.028,z+depth],[x+w*.51,front-.028,z+depth],.035,M.wood,walnut,8);
  }
  function signArt(title,sub,kind='navy') {
    return painted('sign-'+kind+'-'+title,768,192,(g,w,h,r)=>{
      const palettes={navy:['#253f45','#d5bb7c','#f9edc7'],red:['#844b3d','#dbb982','#f7e5bc'],paper:['#d7c9a3','#8e7757','#484c43'],green:['#526852','#c6ba88','#f3e8c3']};
      const [base,line,ink]=palettes[kind]||palettes.navy;g.fillStyle=base;g.fillRect(0,0,w,h);
      const shade=g.createLinearGradient(0,0,w,h);shade.addColorStop(0,'rgba(255,230,190,.13)');shade.addColorStop(1,'rgba(20,25,25,.19)');g.fillStyle=shade;g.fillRect(0,0,w,h);
      grain(g,w,h,r,4000,.09);g.lineWidth=3;g.strokeStyle=line;g.strokeRect(8,9,w-16,h-18);g.lineWidth=1.2;g.strokeRect(15,15,w-30,h-30);
      for(const sx of [-1,1])for(const sy of [-1,1]){const x=w/2+sx*(w/2-25),y=h/2+sy*(h/2-24);g.fillStyle=line;g.beginPath();g.arc(x,y,3,0,TAU);g.fill();}
      g.fillStyle=ink;g.textAlign='center';g.textBaseline='middle';g.font='600 '+(sub?66:76)+'px Georgia,"Songti SC","STSong",serif';g.fillText(title,w/2,sub?h*.44:h*.52,w*.88);
      if(sub){g.font='bold 22px Georgia,"Songti SC",serif';g.fillStyle=line;g.fillText(sub,w/2,h*.77,w*.8);}
    });
  }
  function plaque(x,y,z,w,h,title,sub,kind='navy') {
    box(x,y,z,w+.075,h+.07,.078,M.wood,0x63503a);
    plate(x,y,z+.043,w,h,signArt(title,sub,kind));
  }
  const shopSigns=[['OLEIFICIO','OLIO DI OLIVA'],['FORNO','PANE A LIEVITO MADRE'],['TELE E FILATI','BOTTEGA DEL PORTO'],['OSTERIA','VINO DELLE COLLINE'],['LA VELA','CASA DEI PESCATORI'],['ORTO','ERBE E FIORI']];
  function wallLight(x,y,z,side=1) {
    beam([x,y+.38,z],[x,y+.38,z+.36],.026,M.darkMetal,0xffffff,8);
    beam([x,y+.15,z],[x,y+.37,z+.26],.023,M.darkMetal,0xffffff,8);
    beam([x,y+.37,z+.31],[x,y+.23,z+.31],.019,M.darkMetal,0xffffff,8);
    cyl(x,y+.15,z+.31,.04,.17,.15,M.darkMetal,0xffffff,4,0,P/4,0);
    cyl(x,y-.03,z+.31,.15,.106,.22,M.lamp,0xffe8c2,4,0,P/4,0);
    cyl(x,y-.18,z+.31,.12,.035,.085,M.darkMetal,0xffffff,4,0,P/4,0);
    for(let k=0;k<4;k++){const a=P/4+k*P/2;beam([x+.146*Math.cos(a),y+.08,z+.31+.146*Math.sin(a)],[x+.11*Math.cos(a),y-.14,z+.31+.11*Math.sin(a)],.012,M.darkMetal,0xffffff,5);}
  }
  function dormer(x,y,z,w,clay,variant,wall) {
    const h=.91,d=1.05;box(x,y+.22,z,w,h,d,M.plaster,wall);
    scope(x,y+.67,z,P/2,()=>roof(d,w,0,.40,0,clay,wall,{ridgeDetail:false}));
    box(x,y+.30,z+d*.5+.018,w*.66,.62,.082,M.wood,0x5e513c);
    plate(x,y+.30,z+d*.5+.064,w*.56,.54,shutterMat(variant));
  }
  function house(l,number) {
    const {w,d,h,c,roof:clay}=l;
    const st=Math.abs(Math.round(l.style||0)), type=(st+number)%8, v=(number*3+st)%6;
    const floors=h>8.05?3:2, groundH=Math.min(2.9,h*.48);
    const topY=h-1.27,secondY=floors===3?(groundH+(h-groundH)*.28):topY;
    const n=Math.max(1,Math.min(4,Math.round((w-.3)/2.55))), dx=w/n;
    const doorCol=n===2?(number%2):Math.floor(n/2),doorX=(doorCol+.5)*dx-w/2;
    scope(l.x,0,l.z,l.a||0,()=>{
      box(0,h/2,0,w,h,d,M.plaster,c);
      box(0,.32,0,w+.075,.64,d+.075,M.stone,number%3?0xc6b69e:0xcfbba0);
      box(0,.68,0,w+.09,.095,d+.09,M.trim,marbleTone(c,.8));
      if(type===2||type===6) box(0,groundH+.16,0,w+.10,.11,d+.10,M.trim,pale);
      box(0,h-.19,0,w+.18,.13,d+.18,M.trim,type%2?marbleTone(c,.91):pale);
      plate(0,1.105,d/2+.003,w-.1,.80,limeWear(number%4));
      for(const sx of [-1,1])scope(sx*(w/2+.004),1.08,0,sx*P/2,()=>plate(0,0,0,d-.12,.79,limeWear((number+1)%4)));
      const showCorners=type===0||type===5;
      if(showCorners)quoins(w,d,.73,h-.24,0xd4c4a7,.72,false);
      const paneW=Math.min(1.05,dx*.43), paneH=Math.min(1.55,Math.max(1.06,(h-groundH)/(floors-1)*.61));
      const windowLine=(yy,upper)=>{
        for(let i=0;i<n;i++){
          const x=(i+.5)*dx-w/2;
          shutters(x,yy,d/2,paneW,paneH,v+(i===0?1:0),{lintel:type%3===0,flowers:upper&&((i+number)%5===0)});
        }
      };
      windowLine(topY,true);if(floors===3)windowLine(secondY,false);
      for(let i=0;i<n;i++){
        const x=(i+.5)*dx-w/2;
        if(i===doorCol){closedDoor(x,d/2,Math.min(1.4,dx*.53),2.17,v);continue;}
        shutters(x,1.58,d/2,Math.min(1.2,paneW*1.02),Math.min(1.4,groundH*.43),v,{open:type%3!==1,flowers:type===1||type===4});
      }
      const addressX=doorX+(doorCol===n-1?-1:1)*Math.min(.99,dx*.37);
      box(addressX,1.78,d/2+.04,.27,.20,.065,M.trim,pale);
      plate(addressX,1.78,d/2+.077,.25,.19,numberTile([7,12,18,23,31,36][number%6]));
      if(type===1||type===4||type===7){
        balcony((Math.min(n-1,(number+1)%n)+.5)*dx-w/2,(floors===3?secondY:topY)-paneH*.5-.15,d/2,Math.min(1.73,dx*.82),.49);
      }
      if((type===0||type===3||type===6)&&w>3.85) {
        const idx=(number+st)%shopSigns.length, spl=shopSigns[idx],ww=Math.min(3.18,w*.70),xx=Math.min(w/2-ww/2-.24,Math.max(-w/2+ww/2+.24,doorX));
        plaque(xx,2.71,d/2+.09,Math.min(2.02,ww-.15),.42,spl[0],null,type===3?'red':'green');
        awning(xx,3.03,d/2+.08,ww,[0xad684d,0x75866a,0xbda16a][(number+1)%3],1.05);
      }
      if(number%4===1 && Math.abs(doorX)<w/2-1.15) wallLight(doorX-1.03,2.14,d/2+.05);
      // Side and service elevations retain proper frames, glass and drains.
      for(const s of [-1,1])scope(s*w/2,0,0,s*P/2,()=>{
        const m=Math.min(3,Math.max(1,Math.round(d/3.1)));
        for(let j=0;j<m;j++){
          const xx=(j+.5)*d/m-d/2;
          shutters(xx,topY,0,.80,Math.min(paneH,1.29),v+j+1,{open:(j+number+s)%3===0});
          if((j+type)%3===0)shutters(xx,1.68,0,.70,1.07,v+j+3,{open:false});
        }
      });
      scope(0,0,-d/2,P,()=>{
        for(let j=0;j<n;j++)if(j%2===0||n<3)shutters((j+.5)*dx-w/2,topY,0,.82,1.22,v+2,{open:(j+type)%2===0});
        if(n>1)closedDoor(doorX,0,.97,1.90,v+2);
      });
      const pipeX=-(w/2-.23);
      beam([pipeX,.26,d/2+.10],[pipeX,h-.15,d/2+.10],.040,M.metal,0x748077,8);
      for(let k=1;k<=2;k++)box(pipeX,.49+k*(h-.76)/3,d/2+.11,.115,.045,.11,M.darkMetal);
      const cross=type===2||type===7, dw=cross?w:d;
      const rise=Math.min(2.93,Math.max(1.0,dw*(type===4?.235:.29)));
      const hip=(type===0||type===3||type===4||type===6)?Math.min(w*.23,d*.30):0;
      scope(0,0,0,cross?P/2:0,()=>roof(cross?d:w,cross?w:d,h,rise,hip,clay,c,{rafters:type%3===0}));
      const cZ=-d*(type%2?.19:.11),cX=w*(number%2?.23:-.22);
      const chAt=h+rise*(1-Math.min(.93,Math.abs(cross?cX:cZ)/((cross?w:d)/2+.32)))-.20;
      chimney(cX,chAt,cZ,.82+.15*(number%3),number);
      if(type===5&&w>4.3) dormer(-w*.19,h+rise*.27,d*.26,1.0,clay,v,c);
    });
  }
  function table(x,z,top,w,d,matColor=oak) {
    contact(x,.045,z,w+.55,d+.55);
    box(x,top-.062,z,w,.124,d,M.plank,matColor);
    box(x,top-.195,z,w-.10,.17,d-.15,M.wood,marbleTone(matColor,.20));
    const thick=.09,tall=top-.18;
    for(const sx of [-1,1])for(const sz of [-1,1]){
      const xx=x+sx*(w/2-.13),zz=z+sz*(d/2-.12);
      box(xx,tall*.5,zz,thick,tall,thick,M.wood,matColor);
      box(xx,.12,zz,thick+.033,.14,thick+.033,M.wood,matColor);
    }
  }
  function stool(x,z,c=oak) {
    contact(x,.045,z,.75,.75);
    cyl(x,.48,z,.245,.245,.10,M.wood,c,12);
    for(let i=0;i<3;i++){const a=i*TAU/3;rodBox([x+Math.cos(a)*.20,.03,z+Math.sin(a)*.20],[x+Math.cos(a)*.13,.44,z+Math.sin(a)*.13],.064,.064,M.wood,c);}
  }
  function beamTrusses(w,d,h,rise,n,c) {
    const X=w/2-.09;
    for(let i=0;i<n;i++){
      const z=-d/2+(i+.55)*d/n;
      box(0,h-.25,z,w-.1,.18,.15,M.wood,c);
      for(const s of [-1,1]){
        rodBox([s*X,h-.15,z],[0,h+rise-.16,z],.13,.17,M.wood,c);
        rodBox([s*X*.45,h-.2,z],[0,h+rise*.63,z],.085,.10,M.wood,c);
      }
      rodBox([0,h-.17,z],[0,h+rise-.15,z],.105,.12,M.wood,c);
    }
  }
  function openLeaves(z,w,high,c) {
    for(const s of [-1,1]){
      const xx=s*(w/2+.045),dw=w*.455;
      scope(xx,0,z,s*P/2,()=>{
        const cx=s*dw/2;
        box(cx,high/2,0,dw,high,.083,M.plank,c);
        for(const y of [.24,high*.50,high-.20])box(cx,y,.064,dw*.9,.082,.045,M.wood,marbleTone(c,.32));
        for(const y of [high*.25,high*.74])box(cx,y,.09,dw*.68,.035,.03,M.darkMetal);
      });
    }
  }
  function column(x,z,y0,y1,r,color=pale) {
    const h=y1-y0;
    box(x,y0+.068,z,r*2.65,.136,r*2.65,M.trim,color);
    cyl(x,y0+.18,z,r*1.12,r*1.35,.12,M.trim,color,16);
    cyl(x,y0+.29,z,r*.99,r*1.11,.10,M.trim,bright,16);
    cyl(x,y0+h/2,z,r*.78,r*.97,h-.58,M.trim,color,16);
    cyl(x,y1-.24,z,r*.94,r*.78,.14,M.trim,bright,16);
    cyl(x,y1-.13,z,r*1.26,r*.91,.14,M.trim,color,16);
    box(x,y1-.046,z,r*2.65,.10,r*2.65,M.trim,color);
  }
  function glassRose() {
    return painted('rose-window',512,512,(g,w,h,r)=>{
      const cx=w/2,cy=h/2,rr=w*.475;
      g.fillStyle='#293d40';g.fillRect(0,0,w,h);
      g.translate(cx,cy);
      const c=['#5d8684','#9bb1a0','#bd9f5e','#78969a','#d7b976','#4c6a78'];
      for(let i=0;i<24;i++){
        const a=TAU*i/24,b=TAU*(i+1)/24;
        for(let j=0;j<3;j++){
          const rad=rr*(j+1)/3,r0=rr*j/3;g.beginPath();g.arc(0,0,rad,a,b);g.arc(0,0,r0,b,a,true);g.closePath();g.fillStyle=c[(i*3+j*5+(i%2))%6];g.fill();g.strokeStyle='#455253';g.lineWidth=2.8;g.stroke();
        }
      }
      for(let j=0;j<8;j++){
        g.save();g.rotate(j*TAU/8);
        g.strokeStyle='#e4d1a0';g.lineWidth=4.0;g.beginPath();g.moveTo(0,-rr*.87);g.quadraticCurveTo(rr*.26,-rr*.57,0,-rr*.26);g.quadraticCurveTo(-rr*.26,-rr*.57,0,-rr*.87);g.stroke();g.restore();
      }
      for(const a of [.18,.26,.87,.98]){g.beginPath();g.arc(0,0,rr*a,0,TAU);g.lineWidth=a===.98?10:5;g.strokeStyle=a>.8?'#ad955c':'#dfc88e';g.stroke();}
      for(let i=0;i<8;i++){g.rotate(P/4);g.fillStyle=i%2?'#dec994':'#eadaac';g.beginPath();g.moveTo(0,-rr*.18);g.lineTo(rr*.035,-rr*.045);g.lineTo(0,0);g.closePath();g.fill();}
      g.resetTransform();grain(g,w,h,r,4400,.11);
    },{roughness:.46,emissive:0x262b22,emissiveIntensity:.32});
  }
  function mapPainting() {
    return painted('survey-map',896,576,(g,w,h,r)=>{
      const base=g.createLinearGradient(0,0,w,h);base.addColorStop(0,'#e0cf9f');base.addColorStop(.63,'#eadbb2');base.addColorStop(1,'#c7b48a');g.fillStyle=base;g.fillRect(0,0,w,h);
      g.strokeStyle='#897756';g.lineWidth=3;g.strokeRect(12,12,w-24,h-24);g.lineWidth=1;g.strokeRect(20,20,w-40,h-40);
      g.save();g.beginPath();g.rect(29,29,w-58,h-58);g.clip();
      const coast=[];
      for(let i=0;i<85;i++){const y=i*h/84,x=w*(.55+Math.sin(y*.013)*.14+Math.sin(y*.028+1.5)*.07+Math.sin(y*.068)*.025+(r()-.5)*.038);coast.push([x,y]);}
      g.beginPath();g.moveTo(w,0);for(const p of coast)g.lineTo(p[0],p[1]);g.lineTo(w,h);g.closePath();g.fillStyle='#93aaa0';g.fill();
      for(let j=0;j<7;j++){g.beginPath();for(let i=0;i<coast.length;i++){const [x,y]=coast[i],xx=x+j*(4+.9*Math.sin(i*.16));if(i===0)g.moveTo(xx,y);else g.lineTo(xx,y);}g.lineWidth=j===0?2.5:1;g.strokeStyle=j===0?'#6f7965':'rgba(216,218,183,.62)';g.stroke();}
      g.strokeStyle='rgba(105,105,77,.32)';g.lineWidth=1;
      for(let k=0;k<32;k++){const a=k*TAU/32;g.beginPath();g.moveTo(w*.77,h*.34);g.lineTo(w*.77+Math.cos(a)*w*1.1,h*.34+Math.sin(a)*w*1.1);g.stroke();}
      g.strokeStyle='#978660';g.lineWidth=1.2;
      for(let k=0;k<112;k++){const x=w*(.045+.34*r()),y=h*(.19+.73*r()),s=3+7*r();g.beginPath();g.moveTo(x-s,y+s*.48);g.lineTo(x,y-s);g.lineTo(x+s,y+s*.42);g.moveTo(x,y-s);g.lineTo(x+s*.19,y+s*.12);g.stroke();}
      const compass=(xx,yy,size)=>{g.save();g.translate(xx,yy);g.strokeStyle='#716e52';g.lineWidth=1.5;for(const f of [.58,.76,1]){g.beginPath();g.arc(0,0,size*f,0,TAU);g.stroke();}
        for(let i=0;i<8;i++){const len=size*(i%2?.66:1.10);g.fillStyle=i%2?'#a57e45':'#5e716a';g.beginPath();g.moveTo(0,-len);g.lineTo(size*.14,-size*.12);g.lineTo(0,0);g.fill();g.rotate(P/4);}g.restore();};
      compass(w*.77,h*.34,49);g.fillStyle='#566453';g.font='italic 20px Georgia,serif';g.fillText('Estuario del Riso',w*.59,h*.69);
      g.fillStyle='#776247';g.font='italic 15px Georgia,serif';for(const [xx,yy,s] of [[.38,.40,'Porto'],[.32,.67,'Valle'],[.55,.18,'Capo Est']])g.fillText(s,w*xx,h*yy);
      g.restore();g.fillStyle='#594e38';g.font='bold 25px Georgia,serif';g.fillText('CARTA DELLE MAREE',37,62);g.font='italic 15px Georgia,serif';g.fillText('White Rice Town  ·  Rilievo costiero',39,87);
      grain(g,w,h,r,6000,.12);
    });
  }
  function displayMap(x,y,z,w,h) {
    box(x,y,z,w+.12,h+.12,.13,M.wood,0x6e5033);
    box(x,y,z+.073,w+.03,h+.03,.034,M.trim,0xc7a66b);
    plate(x,y,z+.097,w,h,mapPainting());
  }
  function leadedGlass(variant=0) {
    return painted('leaded-'+variant,152,232,(g,w,h,r)=>{
      const palette=variant===1?['#9bb8b2','#c1c9ac','#c3ae78']:['#93aba1','#b7b89b','#c4b392'];
      g.clearRect(0,0,w,h);
      const dx=w/3,dy=h/7;
      for(let j=-1;j<9;j++)for(let i=-1;i<4;i++){
        const xx=i*dx+(j%2)*dx/2,yy=j*dy;g.fillStyle=palette[(i+j+6)%3];g.globalAlpha=.15+r()*.14;
        g.beginPath();g.moveTo(xx,yy-dy);g.lineTo(xx+dx/2,yy);g.lineTo(xx,yy+dy);g.lineTo(xx-dx/2,yy);g.closePath();g.fill();
        g.globalAlpha=.64;g.strokeStyle='#69766a';g.lineWidth=1.7;g.stroke();
      }
      g.globalAlpha=1;
    },{transparent:true,depthWrite:false,roughness:.30,metalness:.04});
  }
  function sideWindowWall(span,height,z,thick,slots,wall,mat=M.plaster,variant=0) {
    let edge=-span/2;
    const part=(left,right,bottom,top)=>{if(right-left>.002&&top-bottom>.002)box((right+left)/2,(top+bottom)/2,z,right-left,top-bottom,thick,mat,wall);};
    for(const [x,y,w,h] of slots){
      const l=x-w/2,r=x+w/2;part(edge,l,0,height);part(l,r,0,y-h/2);part(l,r,y+h/2,height);edge=r;
      for(const s of [-1,1]){
        box(x+s*(w/2+.035),y,z,.10,h+.15,thick+.09,M.trim,pale);
        box(x+s*w*.485,y,z+.018,.045,h,.10,M.wood,walnut);
      }
      for(const s of [-1,1])box(x,y+s*(h/2+.04),z,w+.22,s===-1?.15:.10,thick+(s===-1?.24:.13),M.trim,pale);
      box(x,y,z,w,.047,.07,M.wood,oak);
      box(x,y,z,.047,h,.07,M.wood,oak);
      plate(x,y,z+.041,w-.035,h-.035,leadedGlass(variant));
    }
    part(edge,span/2,0,height);
  }
  const bookColors=[0x854c3e,0x476366,0x80633b,0x4e5d4e,0x5f5267,0xa28450,0x6c473a,0x455468];
  function spine(i) {
    const colors=['#854d3f','#466264','#8a6b3f','#53634f','#675568','#aa8957','#694839','#4c5a6c'];
    i=(i+8)%8;
    return painted('bookspine-'+i,64,208,(g,w,h,r)=>{
      g.fillStyle=colors[i];g.fillRect(0,0,w,h);
      const grad=g.createLinearGradient(0,0,w,0);grad.addColorStop(0,'rgba(25,22,21,.42)');grad.addColorStop(.2,'rgba(255,225,177,.18)');grad.addColorStop(.79,'rgba(255,225,177,0)');grad.addColorStop(1,'rgba(28,26,20,.23)');g.fillStyle=grad;g.fillRect(0,0,w,h);
      g.strokeStyle='#c0a270';g.lineWidth=3;
      for(const yy of [.11,.16,.73,.80,.88]){g.beginPath();g.moveTo(3,yy*h);g.lineTo(w-3,yy*h);g.stroke();}
      g.lineWidth=1.5;g.strokeRect(7,h*.25,w-14,h*.29);g.fillStyle='#e0c794';g.textAlign='center';g.font='bold 14px Georgia,serif';g.fillText(['I','IX','III','X','V','II','IV','XI'][i],w/2,h*.43);
      grain(g,w,h,r,400,.12);
    });
  }
  function bookcase(x,z,a,w,h,levels,seed) {
    const rng=randomSeed(seed), d=.50;
    contact(x,.045,z,w+.20,d+.42,a);
    scope(x,0,z,a,()=>{
      box(0,h/2,-d*.36,w,h,.10,M.wood,0x70503a);
      for(const s of [-1,1]){box(s*(w/2-.06),h/2,0,.115,h,d+.07,M.wood,walnut);
        box(s*(w/2-.055),h/2,d/2,.105,h,.075,M.wood,oak);}
      const sep=(h-.17)/levels;
      for(let j=0;j<levels;j++){
        const sy=.12+j*sep;box(0,sy,0,w+.035,.08,d+.08,M.plank,oak);
        let at=-w/2+.12;
        for(let i=0;i<20 && at<w/2-.20;i++){
          const bw=Math.min(w/2-.105-at,.084+rng()*.124);if(bw<.05)break;
          const bh=sep*(.56+rng()*.32),bd=.255+rng()*.10,zz=.035+rng()*.055;
          const k=Math.floor(rng()*8),bx=at+bw/2;
          box(bx,sy+.044+bh/2,zz,bw,bh,bd,M.wood,bookColors[k]);
          plate(bx,sy+.044+bh/2,zz+bd/2+.002,bw*.98,bh*.997,spine(k));
          at+=bw+.007+rng()*.020;
        }
      }
      box(0,h+.015,0,w+.15,.13,d+.14,M.wood,oak);
      box(0,h+.105,0,w+.22,.073,d+.19,M.wood,walnut);
    });
  }
  function flatBook(x,y,z,w,d,c,angle=0) {
    scope(x,y,z,angle,()=>{
      box(0,.044,0,w,.061,d,M.trim,0xd8c7a0);
      for(const sy of [.005,.083])box(0,sy,0,w+.018,.015,d+.023,M.wood,c);
      box(-w*.496,.044,0,.023,.084,d+.02,M.wood,c);
      for(const dz of [-.31,.32])box(-w*.476,.092,dz*d,.014,.008,.037,M.trim,0xb99b5e);
    });
  }
  function rolledChart(x,y,z,w,ang=0) {
    scope(x,y,z,ang,()=>{
      cyl(0,.045,0,.055,.055,w,M.trim,0xe3cd9b,12,0,0,P/2);
      for(const s of [-1,1])cyl(s*(w*.5+.005),.045,0,.035,.035,.010,M.wood,0x9b7950,10,0,0,P/2);
      cyl(0,.045,0,.060,.060,.035,M.wood,0x9d744d,10,0,0,P/2);
    });
  }
  function hangingLamp(x,y,z,drop,s=1) {
    beam([x,y,z],[x,y-drop,z],.013*s,M.darkMetal,0xffffff,6);
    cyl(x,y-drop-.036*s,z,.065*s,.12*s,.12*s,M.brass,0xffffff,12);
    cyl(x,y-drop-.15*s,z,.17*s,.23*s,.16*s,M.brass,0xffffff,12);
    ball(x,y-drop-.22*s,z,.19*s,.175*s,.19*s,M.lamp,0xffe9cd);
    cyl(x,y-drop-.36*s,z,.10*s,.05*s,.07*s,M.brass,0xffffff,10);
  }
  function globe(x,y,z,s=1) {
    const globeMat=painted('globe',512,256,(g,w,h,r)=>{
      g.fillStyle='#718e8a';g.fillRect(0,0,w,h);
      for(const [cx,cy,rx,ry] of [[.15,.35,.18,.19],[.27,.60,.08,.22],[.50,.30,.13,.10],[.56,.53,.10,.19],[.72,.32,.23,.16],[.85,.71,.09,.10],[.09,.13,.04,.05]]){
        const pp=[];for(let i=0;i<72;i++){const a=i*TAU/72,rr=.72+.15*Math.sin(a*3+.3)+r()*.22;pp.push([w*(cx+Math.cos(a)*rx*rr),h*(cy+Math.sin(a)*ry*rr)]);}
        g.fillStyle='#bfae77';g.strokeStyle='#788364';g.lineWidth=1.4;g.beginPath();pp.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fill();g.stroke();
      }
      g.strokeStyle='rgba(230,214,160,.56)';g.lineWidth=1;
      for(let i=0;i<16;i++){g.beginPath();g.moveTo(w*i/16,0);g.lineTo(w*i/16,h);g.stroke();}
      for(let j=1;j<8;j++){g.beginPath();g.moveTo(0,h*j/8);g.lineTo(w,h*j/8);g.stroke();}
      grain(g,w,h,r,2300,.12);
    });
    cyl(x,y+.048*s,z,.33*s,.38*s,.096*s,M.wood,walnut,20);
    lathe(x,y+.09*s,z,[[.22*s,0],[.16*s,.07*s],[.10*s,.27*s],[.17*s,.36*s]],M.brass,0xffffff,16);
    const cy=y+.86*s;
    addGeo(new THREE.SphereGeometry(1,32,20),globeMat,x,cy,z,.46*s,.46*s,.46*s,.05,.2,-.19);
    torus(x,cy,z,.50*s,.027*s,M.brass,0xffffff,0,.44,0,48);
    torus(x,cy,z,.48*s,.012*s,M.brass,0xffffff,P/2+.19,.15,0,44);
    cyl(x,cy+.52*s,z,.04*s,.055*s,.08*s,M.brass,0xffffff,10);
  }
  function archivio() {
    const w=11,d=8.5,h=5.37,z=d/2,wall=0xe5cfaa;
    scope(1.5,0,-15,0,()=>{
      box(0,.014,0,w-.24,.074,d-.24,M.tile,0xe5d5b4);
      openingWall(w,h,z-.14,.28,2.70,2.52,M.plaster,wall);
      box(0,h/2,-z+.14,w,h,.28,M.plaster,wall);
      for(const s of [-1,1]){
        scope(s*(w/2-.14),0,0,s*P/2,()=>sideWindowWall(d-.45,h,0,.28,[[-1.72,2.77,1.07,1.68],[1.64,2.77,1.07,1.68]],wall));
        box(s*(w/2-.055),.27,0,.21,.46,d+.04,M.stone,shadowStone);
        box(s*(w/2-.055),.55,0,.24,.11,d+.07,M.trim,pale);
        const flank=(w-3.23)/2;
        box(s*(w/2-flank/2),.25,z+.014,flank,.43,.26,M.stone,0xb7ab90);
        box(s*(w/2-flank/2),.51,z+.055,flank,.10,.28,M.trim,pale);
      }
      quoins(w,d,.56,h-.24,0xd5c4a5,.70);
      casing(0,z+.05,2.70,2.52,bright,.25);openLeaves(z-.18,2.70,2.37,0x6c5842);
      // The entrance composition sits under a complete, stone-framed tympanum.
      for(const sx of [-1,1]){
        const xx=sx*3.66;
        box(xx,2.28,z+.03,1.53,2.10,.17,M.stone,0xcabb9a);
        box(xx,2.29,z+.12,1.25,1.90,.07,M.trim,0x8c8c74);
        plate(xx,2.26,z+.164,1.13,1.78,glaze(sx<0?1:3));
        const cy=3.17,rr=.565;
        const halfpts=[[xx-rr,cy],[xx+rr,cy]];
        for(let i=1;i<18;i++){const a=i*P/17;halfpts.push([xx+rr*Math.cos(a),cy+rr*Math.sin(a)]);}
        xyPrism(halfpts,z+.13,.075,M.glass,0xa1b2a2);
        archBand(xx,cy,z+.13,rr,.16,.21,9,M.trim,pale);
        for(const a of [.25,.5,.75])beam([xx,cy,z+.19],[xx+Math.cos(a*P)*rr,cy+Math.sin(a*P)*rr,z+.19],.018,M.wood,walnut,6);
        box(xx,1.31,z+.15,1.63,.16,.36,M.trim,bright);
        column(sx*1.89,z+.38,.025,4.28,.207);
        box(sx*1.89,.076,z+.38,.65,.15,.65,M.stone,pale);
        box(sx*5.13,2.76,z+.13,.34,4.34,.21,M.trim,0xd9c7a6);
      }
      box(0,4.33,z+.27,4.44,.22,.73,M.trim,pale);
      plaque(0,4.66,z+.10,3.55,.52,'潮 汐 档 案 馆','ARCHIVIO DELLE MAREE','navy');
      box(0,5.03,0,w+.38,.21,d+.33,M.trim,pale);
      box(0,5.24,0,w+.57,.13,d+.47,M.trim,bright);
      for(let i=0;i<21;i++)box((i-10)*.505,5.13,z+.175,.145,.16,.17,M.trim,bright);
      scope(0,0,0,P/2,()=>roof(d,w,h,2.34,0,0xae6447,wall,{rafters:false,paintedEaves:true,hollow:true}));
      for(const sx of [-1,1])rodBox([sx*(w/2+.25),h+.015,z+.235],[0,h+2.35,z+.235],.15,.29,M.trim,bright);
      box(0,h+.045,z+.22,w+.36,.14,.23,M.trim,pale);
      disc(0,6.37,z+.113,.67,glassRose());
      torus(0,6.37,z+.143,.69,.084,M.trim,pale,0,0,0,48);
      torus(0,6.37,z+.208,.636,.022,M.brass,0xffffff,0,0,0,40);
      for(const s of [-1,1]){box(s*1.67,6.01,z+.08,.76,.047,.11,M.trim,pale);box(s*1.67,5.86,z+.06,.56,.041,.10,M.trim,pale);}
      beamTrusses(w-.20,d-.38,h,2.34,4,0x806651);
      bookcase(-3.71,-3.72,0,2.67,2.86,4,47);
      bookcase(3.62,-3.72,0,2.56,2.64,4,83);
      bookcase(-5.08,.25,P/2,2.13,2.19,3,129);
      displayMap(.0,2.28,-z+.30,3.45,2.15);
      plaque(0,1.025,-z+.306,1.12,.19,'白饭小镇水文图','WHITE RICE TOWN','paper');
      addGeo(plane,rugCanvas(),.48,.056,.69,3.65,2.47,1,-P/2);
      for(const side of [-1,1])scope(side*(w*.5-.30),0,0,-side*P/2,()=>{
        box(0,.38,0,d-.68,.64,.06,M.plank,0xa48a64);
        box(0,.735,.025,d-.66,.09,.095,M.wood,0x9c7952);
      });
      table(2.90,-2.10,.94,1.90,.95,0x9c7650);
      flatBook(2.31,.941,-2.17,.35,.39,0x57706a,.13);
      rolledChart(3.48,.946,-2.27,.47,.12);
      stool(3.90,-1.26);
      table(-2.64,.25,.84,1.45,1.03,0x93714c);globe(-2.67,.841,.22,.78);
      flatBook(-2.12,.845,.48,.26,.30,0x8c5941,.13);
      // Folding chart easel and two sea charts occupy the quieter alcove.
      scope(4.86,0,.87,-P/2,()=>{
        for(const sx of [-1,1])rodBox([sx*.46,.06,.19],[sx*.36,1.64,0],.073,.083,M.wood,oak);
        displayMap(0,1.52,0,1.15,.86);
      });
      for(const sx of [-1,1])hangingLamp(sx*2.8,4.97,1.77,.90,.96);
      for(const sx of [-1,1])wallLight(sx*2.61,2.30,z+.19);
    });
  }
  function clockFace() {
    return painted('astronomical-clock',768,768,(g,w,h,r)=>{
      const q=w/2;g.translate(q,q);
      const radial=g.createRadialGradient(-q*.17,-q*.21,14,0,0,q);radial.addColorStop(0,'#476778');radial.addColorStop(.5,'#314d60');radial.addColorStop(.82,'#253c50');radial.addColorStop(1,'#253d47');g.fillStyle=radial;g.fillRect(-q,-q,w,h);
      for(let i=0;i<48;i++){g.save();g.rotate(i*TAU/48);g.fillStyle=i%2?'rgba(172,174,134,.04)':'rgba(8,29,49,.07)';g.beginPath();g.moveTo(0,0);g.arc(0,0,q,.01,TAU/48-.01);g.closePath();g.fill();g.restore();}
      for(const [rr,weight,col] of [[.972,5,'#dcc28d'],[.930,2,'#a68b55'],[.888,3,'#c5a768'],[.655,4,'#c2a76d'],[.637,1.6,'#e3c691'],[.464,1.4,'#9c9e83'],[.30,1,'#b19569']]){
        g.beginPath();g.arc(0,0,q*rr,0,TAU);g.lineWidth=weight;g.strokeStyle=col;g.stroke();}
      for(let i=0;i<60;i++){const a=TAU*i/60;g.save();g.rotate(a);g.fillStyle=i%5?'#c4af7e':'#f0d7a2';g.fillRect(i%5?-1.5:-3,-q*.94,i%5?3:6,i%5?8:14);g.restore();}
      const roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
      for(let i=0;i<12;i++){const a=i*TAU/12;g.save();g.translate(Math.sin(a)*q*.768,-Math.cos(a)*q*.768);g.rotate(i>3&&i<9?a-P:a);g.fillStyle='#f4dfab';g.textAlign='center';g.textBaseline='middle';g.font='600 43px Georgia,serif';g.fillText(roman[i],0,0);g.restore();}
      // Gilded wind rose, painted dots and ornamental wave scrolls.
      for(let i=0;i<16;i++){g.save();g.rotate(i*TAU/16);const len=q*(i%2?.31:.45);
        g.beginPath();g.moveTo(0,-len);g.lineTo(q*.052,-q*.073);g.lineTo(0,0);g.fillStyle='#b49d6d';g.fill();
        g.beginPath();g.moveTo(0,-len);g.lineTo(-q*.052,-q*.073);g.lineTo(0,0);g.fillStyle='#82958c';g.fill();
        g.beginPath();g.arc(0,-q*.56,i%2?2.1:3.4,0,TAU);g.fillStyle='#e8c88d';g.fill();g.restore();}
      g.textAlign='center';g.fillStyle='#e3ce99';g.font='italic 15px Georgia,serif';g.fillText('Porto del Riso',0,q*.49);
      g.resetTransform();grain(g,w,h,r,8000,.085);
    },{roughness:.56,metalness:.035,emissive:0x151b1b,emissiveIntensity:.24});
  }
  function ornateHand(x,y,z,len,a,w) {
    const shape=[[0,-len*.19],[-w*.55,-len*.06],[-w*.36,len*.19],[-w*.34,len*.52],[-w*.78,len*.60],
      [-w*.36,len*.69],[0,len],[w*.36,len*.69],[w*.78,len*.60],[w*.34,len*.52],[w*.36,len*.19],[w*.55,-len*.06]];
    const points=shape.map(([xx,yy])=>[x+xx*Math.cos(a)-yy*Math.sin(a),y+xx*Math.sin(a)+yy*Math.cos(a)]);
    xyPrism(points,z,.034,M.brass,0xffe6ad);
    beam([x,y,z+.021],[x-Math.sin(a)*len*.75,y+Math.cos(a)*len*.75,z+.021],w*.15,M.trim,0xffefc3,6);
  }
  function gear(x,y,z,r,teeth,color=0xffffff) {
    // Open spokes and individually fitted teeth separate a cog from a solid disc.
    torus(x,y,z,r*.87,r*.119,M.metal,color,0,0,0,32);
    cyl(x,y,z,r*.24,r*.24,.10,M.metal,color,16,P/2);
    for(let i=0;i<5;i++){const a=TAU*i/5;rodBox([x,y,z],[x+Math.cos(a)*r*.88,y+Math.sin(a)*r*.88,z],r*.13,.075,M.metal,color);}
    for(let i=0;i<teeth;i++){const a=TAU*i/teeth;box(x+r*Math.cos(a),y+r*Math.sin(a),z,r*.18,r*.21,.11,M.metal,color,0,0,a);}
  }
  function tideTower() {
    const w=5.6,d=6.2,z=d/2,h=7.36,wall=0xdac39c;
    scope(-10.6,0,-13.8,0,()=>{
      box(0,.011,0,w-.26,.075,d-.26,M.tile,0xd1c3a9);
      openingWall(w,h,z-.15,.30,2.46,2.38,M.stone,wall);
      for(const s of [-1,1])scope(s*(w/2-.15),0,0,s*P/2,()=>sideWindowWall(d-.40,h,0,.30,[[-.94,3.80,.62,1.83],[1.32,4.41,.48,1.48]],wall,M.stone));
      box(0,h/2,-z+.15,w,h,.30,M.stone,wall);
      for(const s of [-1,1]){box(s*(w/2-.15),.34,0,.42,.63,d+.15,M.stone,0xc1ae89);box(s*(w/2-.12),.72,0,.40,.13,d+.18,M.trim,pale);}
      const flank=(w-2.94)/2;for(const s of [-1,1]){box(s*(w/2-flank/2),.34,z,flank,.63,.37,M.stone,0xc1ae89);box(s*(w/2-flank/2),.72,z,flank,.13,.40,M.trim,pale);}
      quoins(w,d,.75,7.22,pale,.65);casing(0,z+.035,2.46,2.38,bright,.25);openLeaves(z-.23,2.46,2.19,0x68583d);
      plaque(0,4.35,z+.08,2.20,.44,'守 潮 钟 楼','TORRE DELLE ORE','green');
      for(const s of [-1,1]){box(s*1.06,5.72,z+.055,.31,1.14,.11,M.trim,pale);box(s*1.06,5.75,z+.118,.095,.76,.045,M.glass);}
      for(const [yy,ww,dd,hh,stone] of [[7.34,w+.21,d+.21,.24,pale],[7.53,w+.36,d+.34,.13,bright]]){
        for(const sx of [-1,1])box(sx*(ww/2-.15),yy,0,.30,hh,dd,M.trim,stone);
        for(const sz of [-1,1])box(0,yy,sz*(dd/2-.15),ww,hh,.30,M.trim,stone);
      }
      // The hollow clock stage lets the climber see the working shaft from below.
      const wh=4.27;
      for(const s of [-1,1]){
        box(s*(w/2-.19),7.57+wh/2,0,.33,wh,d-.12,M.plaster,0xe0c397);
        box(0,7.57+wh/2,s*(d/2-.19),w-.13,wh,.33,M.plaster,0xe0c397);
      }
      for(const [span,depth,a] of [[w,d,0],[w,d,P],[d,w,P/2],[d,w,-P/2]])scope(0,0,0,a,()=>{
        const zz=depth/2-.010,yy=9.62,rr=1.43;
        for(const s of [-1,1])box(s*(span/2-.27),9.67,zz,.22,3.89,.20,M.trim,pale);
        disc(0,yy,zz+.095,rr,clockFace());
        torus(0,yy,zz+.055,rr+.13,.109,M.trim,bright,0,0,0,60);
        torus(0,yy,zz+.131,rr+.033,.054,M.brass,0xffffff,0,0,0,52);
        ornateHand(0,yy,zz+.160,rr*.67,P*.345,.083);
        ornateHand(0,yy,zz+.20,rr*.85,-P*.32,.059);
        movingPart(0,yy,zz+.226,0,()=>{
          rodBox([0,-.25,0],[0,rr*.91,0],.015,.016,M.metal,0xc58053);
          ball(0,-.23,0,.043,.063,.020,M.brass);
        },(part,t)=>{const f=t%1;part.rotation.z=-(Math.floor(t)+(f<.13?1-Math.exp(-f*34):1))*TAU/60-.60;});
        ball(0,yy,zz+.254,.093,.093,.052,M.brass);
        for(const s of [-1,1])for(const t of [-1,1]){
          const xx=s*(span*.362),cy=yy+t*1.64;
          box(xx,cy,zz+.052,.16,.16,.10,M.trim,pale,0,0,P/4);
        }
      });
      for(const [yy,ww,dd,hh,c] of [[11.70,w+.17,d+.17,.18,pale],[11.85,w+.47,d+.47,.13,bright]]) {
        for(const sx of [-1,1])box(sx*(ww/2-.16),yy,0,.32,hh,dd,M.trim,c);
        for(const sz of [-1,1])box(0,yy,sz*(dd/2-.16),ww,hh,.32,M.trim,c);
      }
      const floorBottom=11.88,floorTop=12.0,floorY=(floorBottom+floorTop)/2;
      function deck(x0,x1,z0,z1){if(x1>x0&&z1>z0)box((x1+x0)/2,floorY,(z1+z0)/2,x1-x0,floorTop-floorBottom,z1-z0,M.tile,0xd4c49f);}
      // A physical well in the upper deck aligns with the fixed ladder.
      const W=w/2-.03,D=d/2-.03;
      deck(-W,-2.13,-D,D);deck(-1.10,W,-D,D);deck(-2.13,-1.10,-D,-1.83);deck(-2.13,-1.10,-.79,D);
      for(const side of [-1,1]) {
        beam([-1.65+side*.285,.14,-1.35],[-1.65+side*.285,12.65,-1.35],.045,M.wood,0x926b45,8);
        beam([-1.65+side*.285,11.96,-1.35],[-1.65+side*.285,12.65,-1.35],.045,M.metal,0x948568,8);
      }
      for(let i=0;i<38;i++){const yy=.27+i*.325;beam([-1.95,yy,-1.35],[-1.35,yy,-1.35],.034,M.wood,oak,8);}
      // The bells clear the viewing deck and its small work shelf.
      const tierTop=15.68;
      for(const sx of [-1,1])for(const sz of [-1,1]){
        const x=sx*(w/2-.36),zz=sz*(d/2-.40);
        box(x,13.48,zz,.62,3.00,.68,M.plaster,0xdac59c);
        column(x+sx*.12,zz+sz*.13,12.02,14.53,.194,pale);
        box(x,14.51,zz,.80,.18,.83,M.trim,bright);
        box(x,12.21,zz,.77,.38,.80,M.trim,pale);
      }
      for(const [span,depth,a] of [[w,d,0],[w,d,P],[d,w,P/2],[d,w,-P/2]])scope(0,0,0,a,()=>{
        const zz=depth/2-.34,rr=(span-.95)/2, spring=14.08,outer=.23;
        // Segmental belfry arches use ellipse voussoirs. The center stays open.
        const rise=1.34,top=15.65;
        for(let k=0;k<17;k++){
          const aa=P*k/17,bb=P*(k+1)/17,p=(t,ox,oy)=>[(rr+ox)*Math.cos(t),spring+(rise+oy)*Math.sin(t)];
          const a0=p(aa,0,0),b0=p(bb,0,0),a1=p(aa,outer,.22),b1=p(bb,outer,.22);
          xyPrism([a0,a1,b1,b0],zz,.47,M.trim,k===8?bright:marbleTone(pale,((k*2)%9)/8));
          if((a1[1]+b1[1])/2<top-.025)xyPrism([a1,[a1[0],top],[b1[0],top],b1],zz-.05,.29,M.plaster,wall);
        }
        box(0,12.205,zz,span-.35,.30,.29,M.stone,0xc0ac85);
        box(0,12.88,zz,span-.35,.13,.32,M.trim,bright);
        const bal=Math.max(8,Math.round((span-.99)/.42));
        for(let i=0;i<bal;i++){
          const xx=(i+.5)*(span-1.25)/bal-(span-1.25)/2;
          cyl(xx,12.57,zz,.066,.080,.46,M.trim,pale,8);
          cyl(xx,12.59,zz,.087,.087,.13,M.trim,pale,8);
        }
      });
      for(const [yy,ww,dd,hh] of [[15.70,w+.19,d+.15,.19],[15.89,w+.52,d+.48,.13],[16.03,w+.68,d+.63,.12]])box(0,yy,0,ww,hh,dd,M.trim,pale);
      box(0,15.48,0,w-.54,.20,.29,M.wood,walnut);
      beam([0,15.42,0],[0,15.07,0],.083,M.darkMetal);
      movingPart(0,15.10,0,0,()=>{
        lathe(0,-1.10,0,[[.91,.0],[.94,.07],[.90,.14],[.81,.19],[.72,.31],[.61,.54],[.52,.85],[.43,1.01],[.28,1.10],[.20,1.14],
          [.095,1.14],[.14,1.05],[.34,.96],[.43,.81],[.53,.52],[.64,.28],[.76,.14],[.85,.062],[.87,0],[.91,0]],M.metal,0xa8874f,40);
        for(const [yy,rr] of [[-1.015,.92],[-.88,.787],[-.18,.48]])torus(0,yy,0,rr,.026,M.brass,0xe1b475,P/2,0,0,40);
        cyl(0,-.97,0,.048,.048,.49,M.darkMetal,0xffffff,8);ball(0,-1.25,0,.15,.17,.15,M.darkMetal);
      },(part,t)=>{const phase=t%60;part.rotation.z=phase<7?Math.sin(phase*3.7)*Math.sin(P*phase/7)*.095:0;});
      // Hammered, eight-panel lantern roof with raised standing seams.
      const prof=[[2.89,16.08],[3.04,16.25],[2.91,16.39],[2.65,16.51],[2.55,16.72],[2.57,16.97],[2.48,17.34],[2.23,17.78],[1.84,18.23],[1.46,18.60],[1.21,18.91],[1.04,19.22],[1.02,19.38]];
      for(const sx of [-1,1])for(const sz of [-1,1]){
        const xx=sx*2.46,zz=sz*2.72;
        box(xx,16.23,zz,.44,.25,.46,M.trim,pale);
        lathe(xx,16.35,zz,[[.18,0],[.19,.07],[.12,.12],[.105,.23],[.17,.33],[.15,.43],[.08,.52],[.03,.61]],M.copper,0xffffff,12);
        ball(xx,17.01,zz,.058,.088,.058,M.brass);
      }
      const panels=8,ring=(r,y,i)=>[Math.cos(i*TAU/panels+P/8)*r,y,Math.sin(i*TAU/panels+P/8)*r*1.047];
      for(let j=0;j<prof.length-1;j++)for(let i=0;i<panels;i++){
        const [ra,ya]=prof[j],[rb,yb]=prof[j+1],p0=ring(ra,ya,i),p1=ring(ra,ya,i+1),p2=ring(rb,yb,i+1),p3=ring(rb,yb,i);
        poly([p1,p0,p3,p2],M.copper,i%3===0?0xdedfd0:0xffffff);
        if(j>1)beam(p0,p3,.031,M.copper,0xd6d4b6,6);
      }
      scope(0,1.12,0,0,()=>{
      cyl(0,18.29,0,1.04,1.12,.15,M.copper,0xffffff,8,0,P/8);
      for(let i=0;i<8;i++){const a=i*TAU/8+P/8,x=.66*Math.cos(a),zz=.66*Math.sin(a);
        cyl(x,18.65,zz,.074,.08,.69,M.trim,pale,10);cyl(x,18.98,zz,.12,.109,.09,M.brass,0xffffff,8);}
      cyl(0,19.02,0,.87,.90,.12,M.copper,0xffffff,8,0,P/8);
      cyl(0,19.34,0,.31,.92,.58,M.copper,0xffffff,8,0,P/8);
      cyl(0,19.72,0,.065,.30,.39,M.copper,0xffffff,8,0,P/8);
      ball(0,19.96,0,.15,.16,.15,M.brass);beam([0,19.99,0],[0,20.96,0],.027,M.brass,0xffffff,8);
      scope(0,20.46,0,.38,()=>{
        beam([-.53,0,0],[.67,0,0],.025,M.brass,0xffffff,6);
        xyPrism([[-.55,.0],[-.85,.22],[-.73,-.03],[-.85,-.18]],0,.044,M.brass,0xffdf96);
        xyPrism([[-.60,-.03],[-.28,.16],[.07,.13],[.30,.025],[.08,-.10],[-.22,-.15]],0,.052,M.brass,0xffe3a1);
        xyPrism([[.52,.11],[.81,0],[.52,-.11]],0,.043,M.brass,0xffdf96);
      });
      });
      table(1.45,-1.65,.94,1.67,.82,0x95704d);flatBook(1.97,.942,-1.82,.30,.32,0x607564,-.09);
      box(.31,2.10,-z+.266,2.25,1.62,.13,M.plank,0x85694d);
      for(const [xx,yy,zz,rad,n,c,speed,angle] of [[-.10,2.26,-z+.46,.52,17,0xc49e60,.092,0],[.68,2.08,-z+.48,.32,13,0xb59a67,-.1203,.10],[.49,2.61,-z+.44,.22,10,0xbb8851,.1564,.08]]){
        movingPart(xx,yy,zz,0,()=>gear(0,0,0,rad,n,c),(part,t)=>part.rotation.z=angle+t*speed);
      }
      for(const s of [-1,1]){
        const xx=s*.34+.10,yy=1.11+(s===1?.23:0);beam([xx,2.03,-z+.56],[xx,yy+.16,-z+.56],.013,M.darkMetal,0xffffff,6);
        cyl(xx,yy,-z+.56,.063,.068,.25,M.brass,0xffffff,10);
      }
      scope(1.45,12,-1.15,0,()=>{table(0,0,.81,1.18,.68,0x987b52);rolledChart(.36,.812,-.09,.32,-.04);});
      wallLight(1.91,2.27,z+.07);
    });
  }
  function seedSack(x,y,z,s,angle,variant) {
    const c=[0xd6be8f,0xc6b185,0xd6c59f,0xba9d72][variant%4];
    scope(x,y,z,angle,()=>{
      lathe(0,0,0,[[.18*s,0],[.31*s,.045*s],[.36*s,.20*s],[.365*s,.34*s],[.315*s,.47*s],[.22*s,.55*s],[.105*s,.61*s],[.075*s,.65*s],[.128*s,.70*s],[.11*s,.74*s]],M.fabric,c,15);
      torus(0,.64*s,0,.088*s,.020*s,M.wood,0x9a7d53,P/2,0,0,14);
      for(const side of [-1,1])beam([side*.06*s,.65*s,.05*s],[side*.15*s,.56*s,.12*s],.015*s,M.wood,oak,5);
      // A small hand-stamped wheat ear is printed directly on the burlap.
      beam([-.028*s,.18*s,.349*s],[.025*s,.40*s,.339*s],.011*s,M.wood,0x877149,5);
      for(let i=0;i<3;i++)for(const side of [-1,1]){
        const xx=(-.020+i*.013)*s,yy=(.23+i*.043)*s;
        beam([xx,yy,.353*s],[xx+side*.038*s,yy+.035*s,.346*s],.010*s,M.wood,0x877149,5);
      }
    });
  }
  function grainBarrel(x,z,s,variant) {
    const c=variant%2?0xab8053:0x947550;
    lathe(x,0,z,[[.39*s,0],[.42*s,.06*s],[.465*s,.26*s],[.49*s,.54*s],[.46*s,.82*s],[.41*s,1.00*s],[.40*s,1.045*s]],M.plank,c,16);
    for(const [y,r] of [[.10,.431],[.30,.477],[.77,.475],[.96,.428]])cyl(x,y*s,z,r*s,r*s,.046*s,M.metal,0x75756a,16);
    cyl(x,1.020*s,z,.397*s,.397*s,.044*s,M.wood,c,16);
    if(variant%2===0){
      const grd=new THREE.SphereGeometry(1,12,6,0,TAU,0,P*.50);
      addGeo(grd,M.fabric,x,1.04*s,z,.375*s,.095*s,.375*s,0,0,0,0xdac69c);
    }
  }
  function millstone(x,y,z,r,h,c) {
    lathe(x,y,z,[[r*.18,.003],[r*.96,0],[r,.05],[r,h-.055],[r*.974,h],[r*.21,h],[r*.16,h-.037],[r*.16,.04]],millRock(),c,36);
    const rr=r*.90;
    for(let j=0;j<12;j++){
      const a=j*TAU/12,pt=(u,v,yy)=>[x+r*(Math.cos(a)*u-Math.sin(a)*v),yy+y,z+r*(Math.sin(a)*u+Math.cos(a)*v)];
      rodBox(pt(.22,.016,h+.003),pt(.61,.13,h+.003),.017,.012,M.wood,0xa39578);
      rodBox(pt(.61,.13,h+.003),pt(.88,.32,h+.003),.017,.012,M.wood,0xa39578);
    }
  }
  function millingMachine() {
    const x=-2.53,z=-.46,r=.83;
    contact(x,.044,z,2.72,2.35);
    cyl(x,.18,z,1.02,1.12,.33,millRock(),0xc4b79a,22);
    millstone(x,.34,z,r,.25,0xada58e);
    movingPart(x,.61,z,0,()=>millstone(0,0,0,r,.25,0xc6bca0),(part,t)=>part.rotation.y=t*.39);
    for(const s of [-1,1])for(const t of [-1,1]){
      box(x+s*.92,1.02,z+t*.64,.113,1.98,.12,M.wood,walnut);
      box(x+s*.92,.18,z+t*.64,.18,.28,.18,M.stone,shadowStone);
    }
    for(const s of [-1,1]){
      box(x+s*.92,1.95,z,.14,.16,1.48,M.wood,walnut);
      box(x,1.95,z+s*.64,1.99,.16,.13,M.wood,oak);
      rodBox([x+s*.91,.98,z+.64],[x+s*.48,1.90,z+.64],.095,.10,M.wood,walnut);
    }
    // The hopper is genuinely open. Its four plank sides taper to the feed shoe.
    const top=2.17,low=1.25,r1=.60,r2=.155;
    for(let k=0;k<4;k++)scope(x,0,z,k*P/2,()=>{
      const p=[[-r2,low,r2],[r2,low,r2],[r1,top,r1],[-r1,top,r1]];
      poly(p,M.plank,0xab8251);poly(p.slice().reverse().map(q=>[q[0],q[1],q[2]-.025]),M.plank,0x8d6e45);
      box(0,top,r1,1.22,.073,.073,M.wood,walnut);
    });
    cyl(x,1.65,z,.42,.42,.07,M.fabric,0xdac288,4,0,P/4);
    rodBox([x,1.24,z],[x+.09,.89,z+.19],.12,.13,M.wood,oak);
    beam([-4.61,.43,-.40],[-2.50,.43,-.40],.16,M.wood,0x775937,12);
    movingPart(-3.65,.43,-.4,P/2,()=>gear(0,0,0,.55,16,0x92734e),(part,t)=>part.rotation.z=-t*.32);
    for(const xx of [-4.11,-3.37]){
      box(xx,.19,-.40,.28,.35,.62,M.stone,shadowStone);
      box(xx,.37,-.40,.27,.10,.49,M.metal,0x8d8671);
    }
  }
  function mill() {
    const w=9.2,d=8.6,z=d/2,h=4.78,wall=0xe1c69f,wood=0x78563b;
    scope(35,0,-9,0,()=>{
      box(0,.010,0,w-.26,.075,d-.26,M.tile,0xd5c2a4);
      openingWall(w,h,z-.14,.28,2.90,2.39,M.plaster,wall);
      for(const sx of [-1,1]){
        scope(sx*(w/2-.14),0,0,sx*P/2,()=>sideWindowWall(d-.44,h,0,.28,[[-2.02,2.64,1.09,1.34],[1.83,2.63,1.12,1.36]],wall,M.plaster,1));
        box(sx*(w/2-.09),.51,0,.37,.94,d+.02,M.stone,0xc9b292);
        box(sx*(w/2-.07),1.025,0,.36,.12,d+.05,M.trim,0xc9b796);
      }
      box(0,h/2,-z+.14,w,h,.28,M.stone,0xd1b996);
      const flank=(w-3.41)/2;
      for(const s of [-1,1]){
        box(s*(w/2-flank/2),.49,z,flank,.94,.33,M.stone,0xc9b292);
        box(s*(w/2-flank/2),1.03,z+.018,flank,.10,.37,M.trim,0xc9b796);
      }
      casing(0,z+.035,2.90,2.39,0xd8c39d,.205);openLeaves(z-.15,2.90,2.50,0x7e6343);
      quoins(w,d,1.09,h-.17,0xcbbb9c,.63);
      for(const sx of [-1,1]){
        shutters(sx*3.08,2.38,z,1.02,1.36,sx>0?2:4,{flowers:sx>0,lintel:true});
        box(sx*2.0,2.84,z+.08,.16,3.52,.17,M.wood,wood);
      }
      box(0,4.44,z+.12,w-.21,.17,.18,M.wood,wood);
      for(const sx of [-1,1]){
        rodBox([sx*2.06,3.50,z+.14],[sx*(w/2-.21),4.40,z+.14],.135,.14,M.wood,wood);
      }
      scope(0,0,0,P/2,()=>roof(d,w,h,2.31,0,0xa65339,wall,{rafters:true,hollow:true}));
      beamTrusses(w-.16,d-.36,h,2.31,4,0x76583e);
      for(const s of [-1,1]){
        rodBox([s*(w/2-.070),h+.01,z+.13],[0,h+2.25,z+.13],.21,.18,M.wood,wood);
        box(s*2.05,5.34,z+.11,.13,1.00,.14,M.wood,wood);
        rodBox([s*3.89,4.83,z+.14],[s*2.08,5.77,z+.14],.10,.14,M.wood,wood);
        rodBox([s*2.04,4.83,z+.13],[s*.69,6.56,z+.13],.10,.14,M.wood,wood);
      }
      box(0,5.29,z+.10,w*.71,.125,.16,M.wood,wood);
      box(0,5.78,z+.135,1.15,1.25,.15,M.trim,pale);
      box(0,5.77,z+.23,.98,1.11,.09,M.plank,0x826747);
      for(const s of [-1,1])box(s*.24,5.76,z+.29,.40,.053,.04,M.darkMetal);
      box(0,5.77,z+.29,.035,1.10,.035,M.wood,0x534633);
      box(0,6.56,z+.48,.18,.19,1.27,M.wood,wood);
      rodBox([0,5.98,z+.16],[0,6.51,z+1.01],.095,.11,M.wood,wood);
      torus(0,6.36,z+1.02,.13,.034,M.darkMetal,0xffffff,0,P/2,0,20);
      beam([-.015,6.39,z+1.14],[-.015,4.09,z+1.14],.016,M.wood,0x97815c,6);
      torus(-.012,4.06,z+1.14,.066,.014,M.darkMetal,0xffffff,0,0,0,18);
      plaque(0,4.12,z+.09,2.88,.46,'东 岸 水 磨 坊','MULINO DELLA RIVA','red');
      chimney(2.69,5.47,-1.94,1.0,0);
      for(const s of [-1,1])scope(s*(w/2+.002),0,0,s*P/2,()=>{
        for(const k of [-1,0,1])box(k*2.82,2.84,0,.10,3.52,.13,M.wood,wood);
        box(0,3.69,0,d-.17,.13,.15,M.wood,wood);
      });
      scope(-w/2-.095,.43,-.40,-P/2,()=>{
        cyl(0,0,0,.38,.38,.10,M.stone,0xab9e86,18,P/2);
        torus(0,0,.09,.25,.05,M.metal,0x857966,0,0,0,18);
      });
      millingMachine();
      table(2.40,-1.90,.91,1.86,.91,0xa27b4f);
      // Beam scale, with a brass pan, an empty tray and a free center for the bowl.
      const bx=2.98,by=.911,bz=-2.03;
      cyl(bx,by+.035,bz,.14,.17,.07,M.metal,0x877a5b,12);
      beam([bx,by+.05,bz],[bx,by+.48,bz],.025,M.brass,0xffffff,8);
      beam([bx-.19,by+.47,bz],[bx+.19,by+.50,bz],.021,M.brass,0xffffff,8);
      for(const s of [-1,1]){
        const xx=bx+s*.17;
        for(const zz of [-.065,.065])beam([xx,by+.47+s*.02,bz],[xx,by+.26,bz+zz],.007,M.darkMetal,0xffffff,5);
        cyl(xx,by+.25,bz,.105,.055,.052,M.brass,0xffffff,12);
      }
      stool(3.69,-1.81,0xa17a55);
      const sacks=[[-2.93,0,-3.26,1.09,.19,1],[-2.24,0,-3.34,1.04,-.14,0],[-3.56,0,-3.21,.98,.29,2],[-3.0,.57,-3.29,.90,-.24,2],[-2.59,0,-2.79,.97,-.12,3],[-2.48,.56,-3.19,.85,.27,1]];
      for(const arr of sacks)seedSack(...arr);
      grainBarrel(.93,-3.49,.76,1);grainBarrel(1.61,-3.51,.67,0);
      wallLight(-2.06,2.73,z+.07);
      hangingLamp(1.47,4.52,.91,.76,1.12);
    });
  }
  for(let i=0;i<HOUSELOTS.length;i++)house(HOUSELOTS[i],i);
  archivio();tideTower();mill();
  return t=>{for(const update of motions)update(t);};
}
