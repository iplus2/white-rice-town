const HOUSELOTS=[
  [-17.2,4.8,7.5,6.6,6.1,90,0xd99a68,0xb46448,1],[-17.5,-3.3,7.4,6.2,8.1,90,0xe2c17c,0x98513e,2],[-17.9,12.5,6.6,6.5,7.1,90,0xaabaa5,0xc17451,4],
  [8.95,-18.4,4.6,6.8,7.5,0,0xe4b889,0xad6149,3],[-19.1,-16.8,8,8,6.55,0,0xcd856d,0xaa5842,1],
  [-27.8,-17.8,6.5,7.2,8.1,0,0xe4c899,0xaf694b,2],[-26.9,-7.8,6.6,6.3,5.8,90,0xa1b4aa,0x975744,4],
  [-28.4,5.9,7.5,5.5,6.3,90,0xc2a5a2,0xab684f,0],[-26.5,17.5,6.7,6.4,7.7,90,0xe4bb7f,0x97563e,2],
  [-15.6,24.6,8.2,7.6,7.0,180,0xd78f70,0xb76848,0],[-5.7,23.9,8,7.8,6.4,180,0xdab582,0x99523c,3],
  [2.6,24.7,7.1,7.1,7.2,180,0xa5b4a7,0xb96649,1],[8.4,31.0,4.4,5.1,6.6,180,0xe1c597,0xb37859,4],
  [-26.1,-30.2,8.4,6.0,6.8,0,0xc29f80,0xa85d44,0],[-15.2,-30.9,7.5,7.1,7.9,0,0xb5c1a9,0x9c5940,3],
  [-5.8,-30.3,7.2,7.0,6.0,0,0xdbb079,0xab694c,2],[3.8,-31.3,7.1,7.5,8.0,0,0xdfa88d,0xad6247,0],
  [45.3,-12.0,7.2,6.7,6.8,-90,0xd69e76,0xa95d44,3],[44.9,-3.5,7.1,6.5,7.65,-90,0xe8ca8e,0xa75941,2],
  [46.1,6.2,7.6,6.1,6.0,-90,0xacb6a4,0xb66f4e,4],[46.2,22.8,7.4,6.6,7.2,-90,0xd79674,0xa75f4b,1],
  [35.7,28.5,7.9,6.5,5.8,180,0xe2ba87,0xb06e50,0],[35.7,-28.8,7.4,6.7,6.5,0,0xcbb399,0xb56947,4],
  [47,-31.6,8.0,6.5,7.3,0,0xd8a67e,0xb3664a,3]
].map(([x,z,w,d,h,a,c,roof,style])=>({x,z,w,d,h,a:a*DEG,c,roof,style}));
const interiors=[{name:'潮汐档案馆',x:1.5,z:-15,w:11,d:8.5,door:2.7},{name:'守潮钟楼',x:-10.6,z:-13.8,w:5.6,d:6.2,door:2.46},{name:'东岸水磨坊',x:35,z:-9,w:9.2,d:8.6,door:2.9}];
const solids=[],rounds=[];
function block(x,z,w,d,y0=-.1,y1=20,a=0){solids.push({x,z,hw:w/2,hd:d/2,y0,y1,a,ca:Math.cos(a),sa:Math.sin(a)});}
function circleBlock(x,z,r,y0=-.2,y1=18){rounds.push({x,z,r,y0,y1});}
const bridgeZ=3.8, waterY=-2.12;
function bridgeH(x){return x<=12.5||x>=31.5?0:1.28*Math.sin(PI*(x-12.5)/19);}
function bridge(){
  const x0=12.5,x1=31.5,z0=bridgeZ-2.34,z1=bridgeZ+2.34,under=x=>-2.87+3.36*Math.sqrt(Math.max(0,1-((x-22)/7.73)**2)),n=46;
  for(let i=0;i<n;i++){
    const a=mix(x0,x1,i/n),b=mix(x0,x1,(i+1)/n),ya=bridgeH(a),yb=bridgeH(b),ua=under(a),ub=under(b);
    poly([[a,ya,z0],[a,ya,z1],[b,yb,z1],[b,yb,z0]],M.pave,0xe3d2af);
    poly([[a,ua,z0],[b,ub,z0],[b,ub,z1],[a,ua,z1]],M.stone,0xa79980);
    for(const s of [-1,1]){
      const z=s<0?z0:z1,pts=[[a,ua,z],[b,ub,z],[b,yb+.03,z],[a,ya+.03,z]];poly(s<0?pts.reverse():pts,M.stone,0xe1c7a5);
    }
  }
  for(const sign of [-1,1]){
    const z=bridgeZ+sign*2.31;for(let i=0;i<31;i++){
      const a=x0+(x1-x0)*i/31,b=x0+(x1-x0)*(i+1)/31,t=(a+b)/2,y=bridgeH(t),angle=Math.atan2(bridgeH(b)-bridgeH(a),b-a),shade=[0xe3cfad,0xddc8a4,0xd8c5a4,0xe8d6b7][i%4];
      box(t,y+.34,z,b-a+.013,.69,.39,M.stone,shade,0,0,angle);
      box(t,y+.72,z,b-a-.009,.13,.49,M.trim,0xf2dfbc,0,0,angle);
    }
    for(let i=0;i<29;i++){
      const a=PI*i/29+.003,b=PI*(i+1)/29-.003,mid=i===14,d=mid?.54:.40;
      const point=(q,r)=>[22+(7.73+r)*Math.cos(q),-2.87+(3.36+r)*Math.sin(q),z+sign*.224];
      const pts=[point(a,0),point(a,d),point(b,d),point(b,0)];poly(sign>0?pts:pts.reverse(),M.trim,mid?0xf7e1b5:i%3===0?0xd7be97:0xebd6b0);
    }
    for(const x of [12.6,17.1,22,26.9,31.4]){const y=bridgeH(x);
      box(x,y+.5,z,.62,1.02,.60,M.stone,0xe4cfae);box(x,y+1.03,z,.72,.13,.7,M.trim,0xf5dfb4);
      if(x===12.6||x===31.4)streetLamp(x,y+1.11,z,.65,false);else if(x!==22)ball(x,y+1.22,z,.14,.19,.14,M.trim,0xe5d4b2);
    }
  }
}
function ground(){
  box(-57,-.27,0,142,.50,224,M.pave,0xf6eee0);box(94,-.27,0,128,.5,224,M.pave,0xf4ecda);
  for(const x of [13.88,30.12]){
    for(const [a,b] of (x<20?[[-112,112]]:[[-112,14.71],[16.09,112]])){box(x,-2.00,(a+b)/2,.42,3.97,b-a,M.stone,0xbca98c);box(x,-.02,(a+b)/2,.78,.16,b-a,M.trim,0xd8c7aa);}
    for(let z=-39;z<38;z+=2.75){if(z>-1&&z<8.6)continue;if(x>20&&z>-14.2&&z<-5.1)continue;
      const stone=(Math.round((z+39)/2.75)%4===0);if(stone){box(x,.31,z,.46,.65,.45,M.stone,0xcbbb9e);box(x,.67,z,.54,.115,.54,M.trim,0xe5d6b6);}
      else{cyl(x,.34,z,.078,.1,.7,M.darkMetal,0xffffff,10);ball(x,.70,z,.10,.10,.10,M.darkMetal);}
      const next=z+2.75;if(!(x>20&&z<15.55&&next>15.25)&&(next<-.4||z>=8.6)&&!(x>20&&z>=-14.2&&z<-5.1)&&!(x>20&&next>=-14.2&&next<-5.1))curve([[x,.56,z],[x,.43,z+1.37],[x,.56,next]],.023,M.darkMetal,0xa69e86,8,5);
    }
    for(let z=-50;z<50;z+=5.2){box(x+(x<20?.07:-.07),-2.5,z,.54,1.22,.64,M.stone,0x859185);}
  }
  // The plaza has its own compass rose cut into concentric courses of limestone.
  const diskCol=[0xd7c6aa,0xe6d4b6,0xdac9ad,0xcabda7,0xe6d7c0],rr=rng32(45);
  for(const [ri,ro,num] of [[2.92,3.28,48],[3.3,3.50,56],[3.51,3.94,58],[3.95,4.08,68],[4.09,4.53,70],[4.54,4.93,76],[4.94,5.07,78]]){
    for(let i=0;i<num;i++){const a=(i+.012)*TAU/num,b=(i+.988)*TAU/num,pt=(a,r)=>[Math.sin(a)*r,.008,Math.cos(a)*r];poly([pt(a,ri),pt(a,ro),pt(b,ro),pt(b,ri)],M.trim,(ro-ri<.19)?0x87998e:diskCol[Math.floor(rr()*diskCol.length)]);}
  }
  for(let i=0;i<8;i++){const a=i*PI/4;scope(0,.018,0,a,()=>{poly([[0,0,7.08],[.32,0,5.08],[0,0,5.48]],M.trim,0xc2a26d);poly([[0,0,7.08],[0,0,5.48],[-.32,0,5.08]],M.trim,0x819388);});}
  for(const x of [10.7,32.6]){box(x,.002,0,.20,.024,72,M.trim,0xc2ae8b);box(x+.29,.003,0,.07,.025,72,M.trim,0x9a9e8c);}
  for(const h of HOUSELOTS){block(h.x,h.z,h.w+.12,h.d+.14,-.35,26,h.a);contact(h.x,0,h.z,h.w+3,h.d+3,h.a);}
  for(const h of interiors){
    const wall=.33,side=(h.w-h.door)/2;
    block(h.x-h.w/2+.08,h.z,wall,h.d);block(h.x+h.w/2-.08,h.z,wall,h.d);block(h.x,h.z-h.d/2+.08,h.w,wall);
    for(const s of [-1,1])block(h.x+s*(h.door/2+side/2),h.z+h.d/2-.08,side,wall,-.1,10);
    contact(h.x,0,h.z,h.w+2.8,h.d+2.8);
  }
}
function streetLamp(x,y,z,k=1,withBase=true){
  scope(x,y,z,0,()=>{if(withBase){cyl(0,.095*k,0,.30*k,.35*k,.19*k,M.stone,0xc3af8d,8);}
    lathe(0,0,0,[[.21*k,.16*k],[.22*k,.23*k],[.15*k,.30*k],[.13*k,.63*k],[.083*k,.75*k],[.068*k,2.68*k],[.14*k,2.76*k],[.13*k,2.84*k]],M.darkMetal,0xffffff,12);
    cyl(0,2.88*k,0,.249*k,.10*k,.16*k,M.darkMetal,0xffffff,6);cyl(0,3.13*k,0,.245*k,.18*k,.46*k,M.lamp,0xffffff,6);
    for(let i=0;i<6;i++){let a=i*TAU/6;beam([Math.sin(a)*.182*k,2.90*k,Math.cos(a)*.182*k],[Math.sin(a)*.249*k,3.36*k,Math.cos(a)*.249*k],.017*k,M.darkMetal);}
    cyl(0,3.38*k,0,.30*k,.27*k,.07*k,M.darkMetal,0xffffff,6);cyl(0,3.50*k,0,.065*k,.315*k,.195*k,M.darkMetal,0xffffff,6);ball(0,3.64*k,0,.057*k,.095*k,.057*k,M.brass);
  });
}
function bench(x,z,a){
  scope(x,0,z,a,()=>{for(let i=0;i<4;i++)box(0,.49,(i-1.5)*.133,1.98,.085,.122,M.wood,0x9d6744);
    for(let i=0;i<3;i++)box(0,.72+i*.15,-.23-i*.035,2.02,.118,.07,M.wood,i===1?0xaa7450:0x996747,-.10);
    for(const s of [-.73,.73]){beam([s,.05,.23],[s,.49,.16],.052,M.darkMetal);beam([s,.05,-.26],[s,1.03,-.32],.045,M.darkMetal);curve([[s,.48,.22],[s,.72,.18],[s,.74,-.08],[s,.67,-.22]],.031,M.darkMetal);box(s,.43,0,.12,.12,.54,M.darkMetal);}
    contact(0,.014,0,2.4,.94);
  });block(x,z,2,.56,-.15,.98,a);
}
function streetPot(x,y,z,r,seed=1,plants=true){
  const cl=[0xb27b5d,0xb4795c,0x959e88,0xc39166][seed%4];
  lathe(x,y,z,[[.46*r,0],[.47*r,.05*r],[.51*r,.10*r],[.79*r,.98*r],[.83*r,1.05*r],[.91*r,1.05*r],[.92*r,1.20*r],[.80*r,1.23*r],[.75*r,1.14*r]],M.trim,cl,24);
  cyl(x,y+1.10*r,z,.78*r,.78*r,.06*r,M.solid,0x605342,20);
  if(plants)flowerBed(x,y+1.15*r,z,r*.92,seed);
  contact(x,y,z,2*r,2*r);
}
function crate(x,y,z,w=.78,h=.56,d=.61,rot=0,produce=''){
  scope(x,y,z,rot,()=>{box(0,.038,0,w,.075,d,M.wood,0x9b7852);
    for(const s of [-1,1]){for(const j of [0,1,2]){box(0,(j+.5)*h/3,s*(d/2-.025),w,h*.245,.052,M.wood,j===1?0xb38a5f:0xc09a6e);box(s*(w/2-.023),(j+.5)*h/3,0,.054,h*.245,d,M.wood,0xab8059);}
      for(const k of [-1,1])box(s*(w/2-.065),h/2,k*(d/2-.065),.08,h+.05,.08,M.wood,0x8a694b);
    }if(produce){
      box(0,h*.72,0,w*.91,.07,d*.83,M.wood,0x735c45);
      for(let j=0;j<3;j++)for(let i=0;i<5;i++){const xx=(i-2)*w*.171+(random()-.5)*.05,zz=(j-1)*d*.24+(random()-.5)*.055,yy=h*.91+random()*.065;
        ball(xx,yy,zz,w*.08,w*.075,w*.077,M.solid,produce==='lemon'?[0xe7bf56,0xddb753,0xf1cc63][i%3]:[0xc26c33,0xe89c4c,0xd58b3b][(i+j)%3]);}
    }
  });
}
function barrel(x,y,z,r=.39,h=.91){
  lathe(x,y,z,[[.79*r,0],[.86*r,.045*h],[r,.43*h],[r,.58*h],[.85*r,.96*h],[.83*r,h],[0,h]],M.plank,0xa77c51,18);
  for(const yy of [.08,.27,.75,.94]){const radius=(.83+.16*Math.sin(yy*PI))*r;torus(x,y+yy*h,z,radius,.024,M.darkMetal,0xadb0a3,PI/2,0,0,18);}
}
function littleTable(x,z,r=.53){cyl(x,.81,z,r,r,.09,M.wood,0xb18157,28);cyl(x,.44,z,.07,.10,.69,M.darkMetal);for(let i=0;i<3;i++){const a=TAU*i/3;beam([x,.24,z],[x+.36*Math.cos(a),.06,z+.36*Math.sin(a)],.04,M.darkMetal);}circleBlock(x,z,r,-.1,.86);contact(x,0,z,r*2.7,r*2.7);}
function stool(x,z){cyl(x,.46,z,.25,.25,.075,M.wood,0xad8055,18);for(let i=0;i<3;i++){let a=i*TAU/3;beam([x+.15*Math.sin(a),.44,z+.15*Math.cos(a)],[x+.21*Math.sin(a),.035,z+.21*Math.cos(a)],.031,M.darkMetal);}circleBlock(x,z,.21,-.1,.48);}
function canopy(x,z,a,w,d,h,col){
  const stripes=13;scope(x,0,z,a,()=>{for(const si of [-1,1]){beam([si*w/2,0,d],[si*w/2,h,d],.042,M.wood,0x836442);ball(si*w/2,h+.055,d,.07,.12,.07,M.brass);}
    for(let i=0;i<stripes;i++){const l=-w/2+i*w/stripes,r=-w/2+(i+1)*w/stripes,c=i%2?0xf2e7ca:col;
      const yy=q=>h+.58*(1-q)-.32*Math.sin(PI*q);
      for(let j=0;j<6;j++){let u=j/6,v=(j+1)/6;poly([[l,yy(u),d*u],[l,yy(v),d*v],[r,yy(v),d*v],[r,yy(u),d*u]],M.awning,c);}
      const pts=[[l,h,d],[l,h-.15,d],[mix(l,r,.2),h-.22,d],[mix(l,r,.5),h-.26,d],[mix(l,r,.8),h-.22,d],[r,h-.15,d],[r,h,d]];poly(pts,M.awning,c);
    }beam([-w/2,h,d],[w/2,h,d],.042,M.wood,0x7a6148);
  });
}
const treeList=[
  [-6.6,7.9,.92,'plane',103],[7.8,-6.1,.86,'plane',53],[-5.55,-8.9,.73,'cypress',71],[8.5,15,.9,'pine',91],[-20.7,20.2,.90,'pine',86],
  [-22.9,6,.64,'cypress',7],[-32.1,-6.7,.86,'cypress',23],[-22.8,-22.5,.93,'pine',31],[-5.5,-23.4,.75,'cypress',34],[8.6,-27,.78,'cypress',63],
  [33.8,10.2,.80,'plane',45],[40.1,17.4,.75,'orange',72],[44.3,15.7,.83,'orange',35],[47.5,17.2,.73,'orange',91],[37.8,-21.0,.96,'pine',84],
  [46.2,-22.8,.86,'cypress',54],[-30.1,25.2,.82,'cypress',81],[-30.0,28.0,.75,'cypress',83],[11.4,-32.1,.68,'cypress',87]
];
const benches=[[-6.35,5.78,.18],[5.8,-5.63,-1.1],[10.4,10.1,-PI*.5],[33.25,13.04,PI*.5],[-22.4,11.75,PI/2],[42.0,18.98,PI]];
function addWharfAndMarket(){
  for(const [x,z,a] of benches)bench(x,z,a);
  for(const [x,z,k,t,s] of treeList){plantTree(x,z,k,t,s);circleBlock(x,z,k*(t==='cypress'?.29:.35));contact(x,.008,z,k*3.6,k*3.4);
    if((Math.abs(x)<13&&z>-20)||x===33.8){torus(x,.045,z,.88*k,.09*k,M.trim,0xd1bfa0,PI/2,0,0,24);
      cyl(x,.015,z,.88*k,.88*k,.045,M.trim,0x7c775d,28);for(let i=0;i<6;i++){const a=TAU*i/6;flowerBed(x+.56*k*Math.cos(a),.06,z+.56*k*Math.sin(a),.25*k,s+i);}}
  }
  for(const [x,z,k] of [[-6,-7.9,1],[8.8,6.8,1],[-9.6,13,.9],[12,-11.8,.95],[32.3,19.9,.98],[38,2,1],[-21.5,-8,.93],[-6.8,17.1,.96]]){streetLamp(x,0,z,k);circleBlock(x,z,.19);}
  const pots=[[-4.75,-10.5,.51],[7.4,-10.2,.61],[-14.1,-10.7,.46],[-7.45,-11.1,.55],[-13.6,11.8,.6],[-12.8,8.7,.52],[-13.65,1.2,.41],[30.0,6.8,.44],[32.0,-4.1,.52],[39.3,-4.1,.56],[7.55,12.2,.50],[-22.7,9.6,.46],[48,15,.42]];
  pots.forEach(([x,z,r],i)=>{streetPot(x,0,z,r,10+i);circleBlock(x,z,r*.72,-.1,1.3);});
  // The red awning opens onto the square. The blue market stall faces the bell tower.
  canopy(-13.77,4.80,PI/2,6.4,2.55,2.78,0xa95040);
  canopy(-13.98,-3.25,PI/2,5.55,2.15,2.63,0x4e827b);
  littleTable(-12.24,5.82,.58);littleTable(-12.11,3.19,.50);for(const [x,z] of [[-12.18,6.66],[-11.42,5.57],[-12.17,3.98],[-11.37,2.89]])stool(x,z);
  for(let i=0;i<4;i++){const z=-5.02+i*1.14;crate(-12.9,0,z,.96,.72,.65,PI/2);crate(-12.87,.76,z,.94,.25,.64,PI/2,i%2?'lemon':'orange');}
  block(-12.86,-3.38,.74,4.58,-.1,1.15);barrel(-13.02,0,-6.1,.35,.80);
  // Wine casks and dock gear, net drying poles, coil of rope.
  crate(32.32,0,16.1,1.07,.67,.80,.16);crate(32.93,0,16.71,.77,.58,.65,-.14);barrel(32.6,0,17.6,.4,.88);
  block(32.32,16.1,1.04,.8,-.1,.72,.16);block(32.93,16.71,.75,.63,-.1,.62,-.14);
  for(let j=0;j<4;j++)torus(31.12,.056+j*.043,16.93,.34-j*.024,.034,M.fabric,0xaa956b,PI/2,0,0,30);
  for(const [x,z] of [[31.1,14.4],[31.2,20.2],[12.85,-20.2]]){cyl(x,.18,z,.16,.23,.36,M.darkMetal);cyl(x,.39,z,.22,.21,.10,M.darkMetal);}
  // A low garden with a real opening toward the mill lane.
  for(const [x,z,w,d] of [[44.3,20.15,10.2,.38],[49.31,16.62,.38,7.0],[46.8,13.15,5.3,.38],[40,13.15,1.65,.38]]){
    box(x,.29,z,w,.61,d,M.stone,0xcbb799);box(x,.62,z,w+.1,.11,d+.1,M.trim,0xdfceb0);block(x,z,w,d,-.1,.68);}
  for(const [x,z] of [[40.5,14.1],[41.0,19.1],[46.6,18.7],[47.9,14.5],[-22.2,1.3],[-24.7,11.0]])flowerBed(x,.022,z,.58,Math.round(Math.abs(x*8+z)));
  crate(42.1,0,15.4,.92,.55,.72,-.18);block(42.1,15.4,.9,.7,-.1,.6,-.18);
  // The dyer's courtyard has linen, a work bench and narrow shortcuts.
  for(const [x,z] of [[-22.7,3],[-22.7,9.3]])beam([x,.02,z],[x,3.08,z],.066,M.wood,0x8c7153);
  curve([[-22.7,2.95,3],[-22.59,2.64,6.15],[-22.7,2.95,9.3]],.021,M.fabric,0xb59d79);
  for(let i=0;i<6;i++){let z=3.55+i*.90,h=2.71+.17*Math.abs(i-2.5)/2.5,c=[0xdfdfc3,0x98afaa,0xbbb39c,0xe7d6c1,0x91a2b0,0xb2a6aa][i];
    for(let q=0;q<5;q++){const a=q/5,b=(q+1)/5,p=(u,v)=>[-22.63+Math.sin(u*PI*3+i)*(.045+v*.105)+v*.10,h-v*(.91+.22*(i%2))+.04*Math.sin(u*PI),z+u*.70];poly([p(a,0),p(a,1),p(b,1),p(b,0)],M.awning,c);}
  }
  box(-23.35,.76,8.40,1.25,.12,.68,M.plank,0xb58e66);for(const xx of [-23.85,-22.85])for(const zz of [8.15,8.65])box(xx,.37,zz,.08,.75,.08,M.wood,0x805d43);block(-23.35,8.4,1.24,.67,-.1,.83);
  for(const [x,z,r,h] of [[38.8,-4.0,.4,.98],[39.5,-3.7,.31,.73],[-23.7,7.2,.33,.79],[10.8,-19.7,.38,.87]])barrel(x,0,z,r,h);
  // Signal pennants strung across two quieter streets.
  function bunting(a,b,n){const p=t=>[mix(a[0],b[0],t),mix(a[1],b[1],t)-.78*Math.sin(PI*t),mix(a[2],b[2],t)];
    curve([p(0),p(.25),p(.5),p(.75),p(1)],.018,M.fabric,0x987e60,22,5);
    for(let i=0;i<n;i++){const t=(i+.5)/n,l=p(t-.22/n),r=p(t+.22/n),q=p(t);poly([l,[q[0]+.07,q[1]-.44-(i%3)*.04,q[2]+.16],r],M.awning,[0xb36350,0xdac183,0x7a9e97,0xd4cfb8,0x7b94a2][i%5]);}
  }bunting([-13.8,5.7,-.5],[-6.9,5.9,-10.7],13);bunting([34,6.9,-4.6],[41.5,6.1,3.8],11);
  // Public wayfinding is readable up close and the same names appear on the map.
  scope(8.1,0,2.0,-.32,()=>{cyl(0,1.14,0,.066,.095,2.28,M.wood,0x81664a,10);ball(0,2.36,0,.11,.14,.11,M.brass);
    const signs=[['东岸水磨坊','MOLINO  →',.7,1.94],['潮汐档案馆','←  ARCHIVIO',-.64,1.57]];for(const [s,l,x,y] of signs){box(x,y,0,1.52,.36,.12,M.wood,0x6c6248);addGeo(aoPlane,makeLabel(s,l,1.45,.32),x,y,.068,1.45,.32,1);}});
}
function millWheel(){
  const w=model(()=>{for(const x of [-.53,.53]){
    torus(x,0,0,2.40,.125,M.wood,0x785338,0,PI/2,0,56);torus(x,0,0,2.17,.065,M.darkMetal,0x9f937b,0,PI/2,0,48);
    for(let i=0;i<12;i++){const a=i*TAU/12;rodBox([x,.16*Math.sin(a),.16*Math.cos(a)],[x,2.38*Math.sin(a),2.38*Math.cos(a)],.15,.17,M.wood,0x906849);}
  }for(let i=0;i<28;i++){let a=i*TAU/28;box(0,2.39*Math.sin(a),2.39*Math.cos(a),1.28,.105,.33,M.plank,i%3===0?0x9b7854:0x886644,-a,0,0);}
  cyl(0,0,0,.23,.23,2.02,M.wood,0x87623e,16,0,0,PI/2);});
  w.position.set(29.91,.40,-9.40);scene.add(w);
  for(const z of [-10.1,-8.7])beam([29.08,-2.1,z],[29.08,.4,-9.4],.12,M.wood,0x70573f);
  return w;
}
function makeBoat(x,z,angle,scale,clr,sail=false){
  const g=model(()=>{const shape=t=>Math.pow(Math.max(0,1-Math.pow(Math.abs(t),1.65)),.75)*.81+.018,yt=t=>.17*Math.pow(Math.abs(t),2.6),pp=(t,h,side)=>[side*shape(t)*[.13,.61,.89,1][h],yt(t)+[-.38,-.20,.07,.38][h],t*2.75];
    for(let j=0;j<16;j++){const a=-1+j/8,b=a+1/8;for(const side of [-1,1])for(let hi=0;hi<3;hi++){const pts=[pp(a,hi,side),pp(b,hi,side),pp(b,hi+1,side),pp(a,hi+1,side)];
      poly(pts,M.fabric,hi===2?clr:hi===1?0x8c7054:0x665645);poly([...pts].reverse(),M.wood,0x967a56);
      if(hi===2){beam(pp(a,3,side),pp(b,3,side),.039,M.wood,0xc9a979,7);}
    }}
    for(let i=-5;i<6;i++){const t=i/6;box(0,-.12+yt(t),t*2.38,shape(t)*1.33,.06,.36,M.plank,0xb18a61);}
    for(const t of [-.5,.05,.52])box(0,.15+yt(t),t*2.5,shape(t)*1.84,.085,.31,M.wood,0xbb9367);
    if(sail){beam([0,-.10,.15],[0,4.15,.15],.069,M.wood,0xb38e60);beam([0,3.97,.22],[0,1.02,-1.91],.033,M.wood,0xa27b56);
      for(let j=0;j<8;j++){const a=j/8,b=(j+1)/8;const p=(u,v)=>[.24*Math.sin(PI*u)*Math.sin(PI*v)+.025,1.10+u*2.78+(1-u)*.10*v,.1-(1-u)*1.89*v];poly([p(a,0),p(a,1),p(b,1),p(b,0)],M.fabric,j===1?0xb36950:0xe8d7af);}
      beam([0,4.0,.15],[0,.39,2.50],.014,M.fabric,0xae9d7a);
    }else{beam([-.49,.29,1.28],[.57,.32,-1.45],.036,M.wood,0xbc9b74);ball(.59,.33,-1.52,.095,.04,.37,M.wood,0xa4805e,0,-.38);}
  });g.position.set(x,waterY+.12,z);g.rotation.y=angle;g.scale.setScalar(scale);scene.add(g);return g;
}
