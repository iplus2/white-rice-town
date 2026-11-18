function makeSurfaces(){
  const N=768;
  function sheet(n=N){let c=document.createElement('canvas');c.width=c.height=n;return c.getContext('2d',{willReadFrequently:true});}
  function tex(c,srgb=true){let t=new T.CanvasTexture(c.canvas);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=6;return t;}
  function normal(h,strength){
    const size=h.canvas.width,img=h.getImageData(0,0,size,size).data,out=sheet(size),d=out.createImageData(size,size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(x+y*size)*4,dx=(img[4*((x+1)%size+y*size)]-img[4*((x+size-1)%size+y*size)])/255*strength;
      const dy=(img[4*(x+((y+1)%size)*size)]-img[4*(x+((y+size-1)%size)*size)])/255*strength,l=Math.hypot(dx,dy,1);d.data[i]=127.5-127.5*dx/l;d.data[i+1]=127.5+127.5*dy/l;d.data[i+2]=127.5+127.5/l;d.data[i+3]=255;}
    out.putImageData(d,0,0);return tex(out,false);
  }
  function grain(c,seed,power,cloud){
    const r=rng32(seed),s=c.canvas.width,d=c.getImageData(0,0,s,s),scales=[6,21,75],fields=scales.map(n=>Float32Array.from({length:n*n},()=>r()-.5));
    for(let y=0;y<s;y++)for(let x=0;x<s;x++){let value=(r()-.5)*power;
      for(let j=0;j<3;j++){const n=scales[j],fx=x*n/s,fy=y*n/s,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,a=fields[j];value+=mix(mix(a[ix+iy*n],a[(ix+1)%n+iy*n],tx),mix(a[ix+((iy+1)%n)*n],a[(ix+1)%n+((iy+1)%n)*n],tx),ty)*cloud/(j*.5+1);}
      const i=4*(x+y*s);d.data[i]+=value;d.data[i+1]+=value*.99;d.data[i+2]+=value*.96;
    }c.putImageData(d,0,0);
  }
  function pattern(kind){
    const c=sheet(),h=sheet(),r=rng32(kind==='pave'?31:kind==='wall'?49:19),row=kind==='pave'?16:kind==='wall'?10:8,col=kind==='pave'?10:kind==='wall'?5:5,ww=N/col,hh=N/row;
    c.fillStyle=kind==='pave'?'#756f64':'#9a978b';c.fillRect(0,0,N,N);h.fillStyle='#383838';h.fillRect(0,0,N,N);
    for(let j=0;j<row;j++){
      const offset=(j%2)*ww/2,border=Array.from({length:col},(_,i)=>i*ww+(r()-.5)*ww*.29);
      for(let i=0;i<col;i++){
        const start=border[i]+offset,end=(i===col-1?border[0]+N:border[i+1])+offset;
        const dd=kind==='pave'?1.15:1.55,x=start+dd,y=j*hh+dd,w=end-start-2*dd,ht=hh-2*dd,cr=1.9+r()*(kind==='pave'?5.9:4.8),v=kind==='pave'?159+r()*30:kind==='wall'?207+r()*24:187+r()*27,stain=r()*6;
        const path=new Path2D();path.moveTo(x+cr,y+r()*1.5);path.lineTo(x+w-cr,y);path.lineTo(x+w,y+cr);path.lineTo(x+w-r()*1.5,y+ht-cr);path.lineTo(x+w-cr,y+ht);path.lineTo(x+cr*.6,y+ht+r());path.lineTo(x,y+ht-cr);path.lineTo(x-.8,y+cr);path.closePath();
        for(const shift of [0,-N,N]){
          c.save();h.save();c.translate(shift,0);h.translate(shift,0);
          c.fillStyle='rgb('+Math.round(v+5)+','+Math.round(v+1)+','+Math.round(v-5-stain)+')';c.fill(path);
          c.lineWidth=1.55;c.strokeStyle='rgba(75,66,57,.30)';c.stroke(path);c.save();c.clip(path);c.translate(1.2,1.4);c.strokeStyle='rgba(255,247,223,.35)';c.lineWidth=1.7;c.stroke(path);c.restore();
          h.fillStyle='#c5c5c5';h.fill(path);h.strokeStyle='#898989';h.lineWidth=1.8;h.stroke(path);
          const fleck=rng32(i*1973+j*907+102),tints=['rgba(111,116,101,.22)','rgba(231,224,203,.26)','rgba(99,94,87,.17)','rgba(211,206,191,.38)'];
          c.save();c.clip(path);for(let f=0;f<(kind==='pave'?24:15);f++){const fx=x+fleck()*w,fy=y+fleck()*ht,ss=.45+fleck()*1.75;c.fillStyle=tints[f%4];c.beginPath();c.ellipse(fx,fy,ss*(1+fleck()),ss*.62,fleck()*3,0,TAU);c.fill();}
          if(fleck()<.22){let xx=x+fleck()*w*.7,yy=y+fleck()*ht*.65;c.strokeStyle='rgba(77,79,70,.27)';c.lineWidth=.6+fleck()*.45;c.beginPath();c.moveTo(xx,yy);for(let f=0;f<5;f++){xx+=2+fleck()*3.4;yy+=(fleck()-.38)*5;c.lineTo(xx,yy);}c.stroke();}
          c.restore();c.restore();h.restore();
        }
      }
    }grain(c,7,20,27);grain(h,31,9,18);let m=std(0xffffff,{map:tex(c),normalMap:normal(h,kind==='pave'?1.5:1.45)});m.userData.meter=kind==='pave'?3.75:kind==='wall'?3.65:3.3;return m;
  }
  M.pave=pattern('pave');M.stone=pattern('wall');M.tile=pattern('tile');
  function plaster(){
    const c=sheet(512),h=sheet(512);c.fillStyle='#eee9dd';c.fillRect(0,0,512,512);h.fillStyle='#a3a3a3';h.fillRect(0,0,512,512);grain(c,83,14,18);grain(h,81,18,20);const m=std(0xffffff,{map:tex(c),normalMap:normal(h,1.3)});m.userData.meter=2.2;return m;
  }
  M.plaster=plaster();M.trim=M.plaster.clone();M.trim.userData.meter=.95;M.trim.normalScale.setScalar(.46);
  function wood(planks){
    const c=sheet(512),h=sheet(512),r=rng32(planks?72:63),size=512;
    c.fillStyle='#ddd2ba';c.fillRect(0,0,size,size);h.fillStyle='#aaa';h.fillRect(0,0,size,size);
    for(let i=0;i<1400;i++){
      const x=r()*size,y=r()*size,l=14+r()*225,phase=r()*TAU,curveAmp=.5+r()*3.6,w=.3+r()*.9;
      for(const ctx of [c,h]){ctx.strokeStyle=ctx===c?(i%4?'rgba(74,57,43,.13)':'rgba(252,240,211,.30)'):'rgba(80,80,80,.25)';ctx.lineWidth=w;
        for(const oy of [0,-size]){ctx.beginPath();ctx.moveTo(x,y+oy);for(let j=1;j<7;j++)ctx.lineTo(x+Math.sin(phase+j*.7)*curveAmp,y+oy+j*l/6);ctx.stroke();}
      }
    }if(planks)for(let x=0;x<512;x+=64){c.fillStyle='#8d7e69';c.fillRect(x,0,2.6,512);h.fillStyle='#555';h.fillRect(x,0,3,512);c.fillStyle='rgba(255,248,219,.55)';c.fillRect(x+3,0,1.6,512);}
    grain(c,196,9,17);const m=std(0xffffff,{map:tex(c),normalMap:normal(h,1.35)});m.userData.meter=planks?1.45:1.0;return m;
  }M.wood=wood(false);M.plank=wood(true);
  {
    const c=sheet(),h=sheet(),r=rng32(112),nx=10,ny=7,ww=N/nx,hh=N/ny;
    for(let j=-1;j<ny+1;j++)for(let i=-1;i<nx+1;i++){
      const x=i*ww,y=j*hh,base=Math.floor(207+r()*28);
      const make=(ctx,vals)=>{let gr=ctx.createLinearGradient(x,0,x+ww,0);[0,.09,.21,.36,.52,.67,.84,1].forEach((v,ix)=>gr.addColorStop(v,vals[ix]));ctx.fillStyle=gr;ctx.fillRect(x,y,ww+.5,hh+1);};
      const gv=v=>'rgb('+Math.min(255,base*v)+','+Math.min(255,base*v*.97)+','+Math.min(255,base*v*.94)+')';
      make(c,[.59,.82,1.05,1,.98,.90,.76,.62].map(gv));make(h,['#3d3d3d','#818181','#e4e4e4','#f1f1f1','#d3d3d3','#a1a1a1','#656565','#404040']);
      c.fillStyle='rgba(75,51,35,.47)';c.fillRect(x,y,ww,3.7);h.fillStyle='#6a6a6a';h.fillRect(x,y,ww,4);c.fillStyle='rgba(255,245,211,.47)';c.fillRect(x+ww*.12,y+hh-3,ww*.53,1.9);
    }grain(c,125,12,17);M.roof=std(0xffffff,{map:tex(c),normalMap:normal(h,2.7),roughness:.82});M.roof.userData.meter=2.75;
  }
  M.solid=std();M.book=M.solid;M.fabric=std(0xf8efdd,{roughness:1,side:T.DoubleSide});M.metal=std(0xf5f3ed,{metalness:.43,roughness:.39});
  M.brass=std(0xdfb766,{metalness:.46,roughness:.32});M.darkMetal=std(0x354341,{metalness:.40,roughness:.52});M.copper=std(0x65958a,{metalness:.30,roughness:.50});
  M.glass=std(0x354f55,{roughness:.23,metalness:.25,emissive:0x23353b,emissiveIntensity:.32});M.ceramic=std(0xfff9ee,{roughness:.24,metalness:.08});M.blue=std(0x215487,{roughness:.29});
  M.lamp=std(0xffe1a2,{roughness:.32,emissive:0xffcd75,emissiveIntensity:.68});M.lamp.userData.shadow=false;
  M.waterjet=std(0xadd8cd,{roughness:.22,metalness:.15,transparent:true,opacity:.51,depthWrite:false});M.waterjet.userData.shadow=false;
  const shadowTex=canvasTex(128,128,(c)=>{const gr=c.createRadialGradient(64,64,3,64,64,64);gr.addColorStop(0,'rgba(37,30,25,.9)');gr.addColorStop(.46,'rgba(45,39,32,.58)');gr.addColorStop(1,'rgba(51,42,32,0)');c.fillStyle=gr;c.fillRect(0,0,128,128);});
  M.ao=new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,opacity:.33,vertexColors:true,polygonOffset:true,polygonOffsetFactor:-1});M.ao.userData.shadow=false;M.ao.userData.receive=false;
}
const aoPlane=new T.PlaneGeometry(1,1);
function contact(x,y,z,w,d,angle=0){scope(x,y+.012,z,angle,()=>addGeo(aoPlane,M.ao,0,0,0,w,d,1,-PI/2));}
