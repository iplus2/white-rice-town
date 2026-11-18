function finishPiazza(){
  // This radial pavement is built stone by stone. It wraps the fountain and meets the running bond at the perimeter.
  const r=rng32(6954),shades=[0xc5bdab,0xb8b5ab,0xc9beab,0xc4b9a7,0xc8c4b5,0xbbb9a9,0xc6bba9,0xbeb29e];
  cyl(0,.0024,0,9.25,9.25,.004,M.trim,0x9e9b8e,100);
  for(let row=0;row<19;row++){
    const ri=5.075+row*.218,ro=ri+.211,num=Math.round(TAU*(ro+ri)*.5/(.35+((row%3)*.010))),rot=(row%2)*.46+r()*.15,sp=[];
    for(let i=0;i<num;i++)sp.push((i+rot+(r()-.5)*.25)*TAU/num);
    for(let i=0;i<num;i++){const a=sp[i]+.00045,b=(i+1===num?sp[0]+TAU:sp[i+1])-.00045;
      const pt=(ang,rad)=>[Math.sin(ang)*rad,.0074,Math.cos(ang)*rad];poly([pt(a,ri),pt(a,ro),pt(b,ro),pt(b,ri)],M.trim,shades[Math.floor(r()*shades.length)]);}
  }
  for(const [r,y,mat,cl] of [[9.24,.007,M.trim,0xaeaa95],[9.17,.009,M.trim,0xbbb3a1]])torus(0,y,0,r,.024,mat,cl,PI/2,0,0,140);
  // Worn linear drains follow the quay, stopping at tree wells and doorways.
  for(const [x,z] of [[11.13,-7],[11.13,7.85],[11.13,16.95],[-10.4,12.6],[33.12,7.8],[34.45,-2.1]]){
    box(x,.012,z,.24,.04,.81,M.trim,0x8f8778);for(let i=0;i<9;i++)box(x,.034,z+(i-4)*.077,.175,.012,.025,M.darkMetal,0x969484);
  }
}
const climbingLeaf=new T.BufferGeometry();
climbingLeaf.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.34,.30,.03,-.41,.64,.01,0,1,.07,.40,.64,.015,.29,.30,.02,0,.52,.15],3));
climbingLeaf.setAttribute('uv',new T.Float32BufferAttribute([.5,0,.16,.3,.09,.64,.5,1,.9,.64,.79,.3,.5,.52],2));climbingLeaf.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);climbingLeaf.computeVertexNormals();
function ivy(x,y,z,yaw,width,height,seed,flower){
  const r=rng32(seed),lm=ivy.leaf||(ivy.leaf=std(0xffffff,{side:T.DoubleSide,roughness:.92})),fm=ivy.petal||(ivy.petal=std(0xffffff,{side:T.DoubleSide,roughness:.88}));
  const greens=[0x526e40,0x657e42,0x778e49,0x4f7146,0x8f9c53,0x506f48],blooms=flower===2?[0x9975a3,0xac93bc,0x87639a,0xc0a7ca]:[0xc75d78,0xde7193,0xa84860,0xd77d93,0xca5368];
  scope(x,y,z,yaw,()=>{
    const side=seed%2?1:-1;
    for(let b=0;b<6;b++){
      const bx=(r()-.5)*.25,ex=side*width*(.13+.86*b/5),endy=height*(.72+.23*r());
      const p=t=>[bx+ex*(.08*t+.92*Math.pow(t,1.8))+Math.sin(t*8+b)*.16*t,endy*t+.18*Math.sin(t*4+b)*t,.09+.075*Math.sin(t*6+b)+.12*t];
      curve([p(0),p(.22),p(.44),p(.68),p(1)],b<2?.031:.015,M.wood,0x765f45,16,5);
      for(let j=0;j<14;j++){
        const t=.20+.80*j/14,at=p(t),s=(j%2?1:-1),ln=(.14+r()*.38)*(.6+t),tip=[at[0]+s*ln,at[1]+.21+r()*.21,at[2]+.04+r()*.07];beam(at,tip,.006,M.wood,0x788251,5);
        for(let q=0;q<7;q++){const u=q/6,xx=mix(at[0],tip[0],u),yy=mix(at[1],tip[1],u),zz=mix(at[2],tip[2],u),sz=.12+.10*r();
          addGeo(climbingLeaf,lm,xx,yy,zz,sz*.84,sz,sz,r()*.81-.24,r()*.9-.4,(q%2?1:-1)*(.55+r()*.95),greens[Math.floor(r()*greens.length)]);
        }
        if(flower&&t>.46&&r()>.40){
          for(let f=0;f<3+Math.floor(r()*4);f++){const fx=tip[0]+(r()-.5)*.19,fy=tip[1]+(r()-.5)*.18,fz=tip[2]+r()*.08,cc=blooms[Math.floor(r()*blooms.length)];
            for(let k=0;k<3;k++)addGeo(climbingLeaf,fm,fx,fy,fz,.072,.070,.05,-.3+r()*.55,-.4+r()*.75,k*TAU/3+f,cc);
          }
        }
      }
    }
  });
}
function addRiverside(){
  ivy(-13.83,.08,7.7,PI/2,3.8,5.24,39,1);ivy(-13.96,.06,-5.77,PI/2,2.55,4.56,81,0);
  ivy(-3.64,.05,-10.62,0,2.45,4.68,93,2);ivy(10.69,.05,-14.91,0,2.68,5.47,90,1);
  ivy(38.52,.04,-4.56,0,2.0,3.8,12,0);ivy(-4.5,.04,20.0,PI,2.95,4.38,32,2);
  const wetMap=canvasTex(512,256,(c,w,h)=>{const r=rng32(879),gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(89,103,70,0)');gr.addColorStop(.38,'rgba(78,86,65,.08)');gr.addColorStop(.62,'rgba(84,88,62,.34)');gr.addColorStop(.79,'rgba(62,76,51,.57)');gr.addColorStop(1,'rgba(54,71,49,.78)');c.fillStyle=gr;c.fillRect(0,0,w,h);
    for(let i=0;i<1800;i++){const x=r()*w,y=r()*h,f=Math.pow(y/h,1.9);c.fillStyle='rgba(74,89,52,'+(f*(.14+r()*.28))+')';c.beginPath();c.ellipse(x,y,1+r()*8,1+r()*3,r()*.9,0,TAU);c.fill();}
  },true);
  const algae=new T.MeshBasicMaterial({map:wetMap,transparent:true,opacity:.88,depthWrite:false,vertexColors:true,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});algae.userData.shadow=false;algae.userData.receive=false;
  for(const x of [14.105,29.895]){
    for(let z=-44;z<43;z+=2.7){
      if(x>20&&z<16.1&&z+2.7>14.65)continue;
      const h=.58+.22*(.5+.5*Math.sin(z*1.34));poly([[x,waterY-.12,z],[x,waterY-.12,z+2.7],[x,waterY+h,z+2.7],[x,waterY+h,z]],algae,0xffffff,[[0,.03],[1,.03],[1,.98],[0,.98]]);
    }
    for(const z of [-21.5,-14.2,-4.7,10.2,19.9,24.8]){scope(x<20?x+.014:x-.014,-.65,z,x<20?PI/2:-PI/2,()=>{
      box(0,0,0,.19,.24,.08,M.darkMetal,0xc4bb9c);torus(0,-.11,.08,.102,.024,M.darkMetal,0xc0b59e,.17,0,0,18);for(const a of [-1,1])ball(a*.059,.061,.05,.017,.017,.016,M.brass,0xc7bea5);
    });}
  }
  // At the eastern berth the stairs and the floating pier can both be walked on.
  const d0=14.78,d1=20.65;
  for(let j=0;j<28;j++){const z=mix(d0,d1,j/28),w=1.52+(random()-.5)*.08;
    box(28.16,-1.455,z,w,.112,(d1-d0)/28-.009,M.wood,[0x9a8262,0xac9071,0xaa8e6b,0x907b5f][j%4]);
    for(const x of [27.66,28.65])cyl(x,-1.396,z,.012,.012,.012,M.darkMetal,0x9e9a85,7);
  }
  for(const x of [27.63,28.70])box(x,-1.60,17.72,.15,.24,6.13,M.wood,0x715c43);
  for(const z of [14.8,17.65,20.71])for(const x of [27.42,28.89]){cyl(x,-1.89,z,.105,.14,1.79,M.wood,0x7c6b50,11);torus(x,-1.14,z,.102,.018,M.fabric,0xb4a282,PI/2,0,0,13);}
  for(let i=0;i<9;i++){const u=(i+.5)/9,x=mix(28.65,30.22,u),y=mix(-1.40,.055,u);box(x,y-.066,15.42,.22,.12,1.17,M.plank,i%2?0x9e8363:0xb39874);}
  for(const z of [14.84,16.0]){rodBox([28.58,-1.55,z],[30.24,-.03,z],.09,.12,M.wood,0x846b4d);for(const [x,y] of [[28.70,-1.39],[30.12,.0]])beam([x,y,z],[x,y+.71,z],.034,M.darkMetal,0xafa999);
    beam([28.65,-.70,z],[30.21,.78,z],.037,M.wood,0xa58762);}
  crate(28.16,-1.397,20.15,.67,.46,.50,.08);for(let j=0;j<4;j++)torus(27.97,-1.379+j*.033,19.29,.23-j*.014,.025,M.fabric,0xad9d7a,PI/2);
  curve([[27.44,-1.02,14.82],[27.13,-1.40,15.48],[26.6,-1.65,15.65]],.025,M.fabric,0xb2a280);curve([[27.45,-1.07,20.7],[27.17,-1.42,20.26],[26.36,-1.61,19.98]],.025,M.fabric,0xb2a280);
  // Hand-laid copper plaques make the name readable when entering from either bank.
  const plaque=makeLabel('白饭小镇','WHITE RICE TOWN',1.29,.39,{bg:'#365851',ink:'#ebd59e'});
  for(const [x,z,a] of [[12.55,bridgeZ+2.62,0],[31.43,bridgeZ-2.62,PI]]){scope(x,0,z,a,()=>{box(0,.49,0,1.36,.45,.10,M.trim,0xdccb9f);addGeo(aoPlane,plaque,0,.49,.057,1.29,.39,1);});}
}
function dockArea(x,z){return (x>=27.61&&x<=28.78&&z>=14.86&&z<=20.54)||(x>=28.38&&x<=30.51&&z>=15.04&&z<=15.81);}
function localHeight(x,z){
  if(dockArea(x,z))return mix(-1.396,.035,clamp((x-28.59)/1.61,0,1));return Math.abs(z-bridgeZ)<2.48?bridgeH(x):0;
}
const lightweightBirds=[];let textWind={value:0};
function makeAwningCloth(){
  const cloth=M.fabric.clone();cloth.userData.shadow=true;cloth.onBeforeCompile=sh=>{
    sh.uniforms.clothTime=textWind;sh.vertexShader='uniform float clothTime;\n'+sh.vertexShader;
    sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat ct=clothTime;transformed.z+=.025*sin(position.x*2.3+position.z*1.1+ct*1.6)+.012*sin(position.x*6.7-ct*2.8);transformed.y+=.014*sin(position.x*2.3+position.z*2.0+ct);');
  };M.awning=cloth;
}
function fountainDetail(){
  for(let i=0;i<8;i++){const a=i*TAU/8+.18;scope(0,0,0,a,()=>{
    box(0,.777,2.57,.22,.075,.32,M.trim,0xe0d1ae);cyl(0,.83,2.60,.081,.112,.093,M.brass,0xd0bb84,16);
    for(let j=0;j<7;j++){const u=(j-3)/3;
      const p=[u*.12,.856+.040*(1-Math.abs(u)),2.62+.04*(1-Math.abs(u))],end=[u*.045,.78,2.43];
      curve([p,[u*.103,.872-.026*Math.abs(u),2.55],end],.019,M.copper,j%2?0xbac9ac:0xbed3b9,7,5);
    }torus(0,.797,2.425,.055,.010,M.brass,0xffffff,-.48,0);
  });}
  for(let i=0;i<32;i++){scope(0,0,0,i*TAU/32,()=>{box(0,.531,2.627,.042,.042,.012,M.brass,0xd3c18d,0,0,PI/4);});}
  for(let i=0;i<14;i++){scope(0,0,0,i*TAU/14,()=>{curve([[-.045,.94,.38],[-.084,1.06,.35],[-.055,1.19,.31],[.012,1.27,.285]],.014,M.copper,0xc3d5b8,9,5);});}
}
function plazaPigeons(){
  const proto=model(()=>{
    ball(0,.29,0,.108,.132,.213,M.solid,0x9a9fa1,.19);
    ball(0,.366,-.066,.091,.135,.110,M.solid,0x748986,-.22);
    ball(0,.472,-.117,.076,.074,.089,M.solid,0x939da2);
    for(const side of [-1,1]){
      ball(side*.072,.484,-.143,.012,.014,.013,M.solid,0xd39c65);ball(side*.080,.485,-.145,.007,.008,.007,M.solid,0x253334);
      ball(side*.075,.292,.028,.047,.090,.179,M.solid,side>0?0x8f969c:0x969da1,.25,0,side*.10);
      for(let j=0;j<2;j++)ball(side*.111,.277+j*.02,.078+j*.048,.008,.052,.022,M.solid,0x555d64,-.45);
      beam([side*.042,.21,.014],[side*.048,.066,.038],.011,M.solid,0xb88073,6);for(const da of [-.5,0,.5])beam([side*.049,.062,.038],[side*.049+da*.088,.042,-.035],.008,M.solid,0xb78071,5);
    }
    ball(0,.226,.187,.070,.038,.130,M.solid,0x525d65,.14);beam([0,.457,-.17],[0,.439,-.234],.017,M.solid,0x71685d,6);
  });
  for(const [x,z,n] of [[-3.56,5.22,1],[4.52,-3.51,6],[7.33,2.3,11],[11.75,9.8,15],[32.16,1.24,21]]){
    const root=proto.clone();root.position.set(x,0,z);root.rotation.y=n;scene.add(root);lightweightBirds.push({root,x,z,n,t:0,fly:0,fromX:x,fromZ:z,toX:x,toZ:z,homeX:x,homeZ:z,cool:n*.18});
  }
}
function animatePigeons(time,dt){
  for(const b of lightweightBirds){
    const g=b.root;if(b.fly>0){const u=clamp((time-b.t)/1.04,0,1),ease=u*u*(3-2*u);g.position.set(mix(b.fromX,b.toX,ease),Math.sin(u*PI)*.72,mix(b.fromZ,b.toZ,ease));g.rotation.x=-Math.sin(u*TAU)*.29;
      if(u===1){b.x=b.toX;b.z=b.toZ;b.fly=0;b.cool=time+3;}continue;}
    const dx=b.x-player.x,dz=b.z-player.z,l=Math.hypot(dx,dz);
    if(mode==='play'&&!player.upper&&l<1.77&&time>b.cool){const u=Math.max(l,.01),farHome=Math.hypot(b.x-b.homeX,b.z-b.homeZ)>4;
      let tx=farHome?b.homeX:b.x+dx/u*2.1,tz=farHome?b.homeZ:b.z+dz/u*2.1;
      if(!blocked(tx,tz)){b.fromX=b.x;b.fromZ=b.z;b.toX=tx;b.toZ=tz;b.t=time;b.fly=1;g.rotation.y=Math.atan2(b.x-tx,b.z-tz);}else b.cool=time+2;
    }else{const peck=Math.pow(Math.max(0,Math.sin(time*1.7+b.n)*Math.sin(time*.65+b.n)),3);g.rotation.x=peck*.52;g.position.set(b.x,.004,b.z);g.rotation.y+=dt*.13*Math.sin(time*.47+b.n);}
  }
}
