let river,riverUniforms,mirrorTick=0,wheel,boats=[],birds=[],fountainFlow,offering,maiden,arrivalGlow;
const riverVert=[
  'uniform float time; uniform mat4 mirrorMatrix; varying vec3 wp; varying vec4 mirrorCoord;',
  'void main(){vec4 p=modelMatrix*vec4(position,1.0);',
  'p.y+=.018*sin(p.z*1.72+p.x*.63+time*1.45)+.016*sin(p.x*2.2-p.z*.63-time*.88);wp=p.xyz;mirrorCoord=mirrorMatrix*p;gl_Position=projectionMatrix*viewMatrix*p;}'
].join('\n');
const riverFrag=[
  'uniform float time;uniform sampler2D reflected;uniform float useReflect;varying vec3 wp;varying vec4 mirrorCoord;',
  'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}',
  'void main(){vec2 p=wp.xz;float t=time;float bend=noise(p*.43+vec2(t*.065,-t*.052));float s1=sin(p.y*3.25+p.x*1.28+bend*6.+t*1.34);float s2=sin(p.y*5.61-p.x*2.11+bend*2.-t*1.8);float s3=sin(p.x*3.81+p.y*1.87-t*1.40+noise(p*.94)*3.);',
  'vec3 n=normalize(vec3(.07*s1+.055*s3,1.,.13*s1+.075*s2));vec3 v=normalize(cameraPosition-wp);float fres=pow(1.-max(dot(v,n),0.),3.);',
  'vec2 uv=mirrorCoord.xy/mirrorCoord.w*.5+.5;vec3 refl=texture2D(reflected,clamp(uv+n.xz*.023,.002,.998)).rgb;',
  'float bank=min(abs(p.x-14.),abs(p.x-30.));float shoal=exp(-bank*.59);float c=sin(p.x*4.1+p.y*2.4+bend*6.+t*.72)+sin(p.x*-2.7+p.y*3.3+sin(p.y*1.4-t*.41)*1.2);float caust=pow(max(0.,1.-abs(c)*.90),12.);',
  'vec3 deep=mix(vec3(.025,.224,.219),vec3(.102,.43,.345),shoal*.85+bend*.19);deep+=vec3(.17,.20,.115)*caust*(shoal*.54+.10);',
  'float shade=1.-.52*exp(-pow((p.y-3.78)/3.3,4.))*smoothstep(12.,16.,p.x)*(1.-smoothstep(28.,32.,p.x));deep*=shade;',
  'refl=mix(vec3(.38,.64,.68),refl,useReflect);vec3 col=mix(deep,refl,clamp(.19+fres*.68,.1,.87));',
  'vec3 light=normalize(vec3(-32.,55.,27.));float glint=pow(max(dot(reflect(-light,n),v),0.),135.);col+=vec3(1.3,1.10,.70)*glint;',
  'float foam=exp(-bank*5.5)*(.33+.48*s1*s2);float spray=exp(-dot((p-vec2(29.8,-9.4))*vec2(1.35,.65),(p-vec2(29.8,-9.4))*vec2(1.35,.65)));',
  'col=mix(col,vec3(.67,.79,.70),clamp(foam+spray*smoothstep(.1,.85,s1*s2)*.7,0.,.68));float fd=length(cameraPosition-wp);col=mix(col,vec3(.59,.73,.70),1.-exp(-.000032*fd*fd));gl_FragColor=vec4(col,1.);',
  '#include <tonemapping_fragment>','#include <colorspace_fragment>','}'
].join('\n');
function makeRiver(){
  reflectionTarget=new T.WebGLRenderTarget(640,384,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true});reflectionCamera=new T.PerspectiveCamera();
  riverUniforms={time:{value:0},mirrorMatrix:{value:new T.Matrix4()},reflected:{value:reflectionTarget.texture},useReflect:{value:1}};
  const mat=new T.ShaderMaterial({uniforms:riverUniforms,vertexShader:riverVert,fragmentShader:riverFrag});
  river=new T.Mesh(new T.PlaneGeometry(16.25,272,18,176),mat);river.rotation.x=-PI/2;river.position.set(22,waterY,0);scene.add(river);
}
const planeMirror=new T.Plane(),vMirror=new T.Vector3(),wpMirror=new T.Vector3(0,waterY,0),upMirror=new T.Vector3(0,1,0),clipMirror=new T.Vector4(),qMirror=new T.Vector4();
const waterFrustum=new T.Frustum(),waterVP=new T.Matrix4(),ribbonBounds=[[-136,-45],[-45,-18],[-18,8],[8,35],[35,73],[73,136]].map(([a,b])=>new T.Box3(new T.Vector3(13.8,waterY-.08,a),new T.Vector3(30.2,waterY+.08,b)));
function riverInView(){camera.updateMatrixWorld();waterFrustum.setFromProjectionMatrix(waterVP.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));return ribbonBounds.some(b=>waterFrustum.intersectsBox(b));}
function reflectRiver(){
  const c=reflectionCamera;camera.updateMatrixWorld();c.position.copy(camera.position);c.position.y=2*waterY-c.position.y;camera.getWorldDirection(vMirror);vMirror.y*=-1;c.up.copy(camera.up).applyQuaternion(camera.quaternion);c.up.y*=-1;c.lookAt(vMirror.add(c.position));c.near=camera.near;c.far=camera.far;c.updateMatrixWorld();c.projectionMatrix.copy(camera.projectionMatrix);
  riverUniforms.mirrorMatrix.value.multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse);
  planeMirror.setFromNormalAndCoplanarPoint(upMirror,wpMirror).applyMatrix4(c.matrixWorldInverse);clipMirror.set(planeMirror.normal.x,planeMirror.normal.y,planeMirror.normal.z,planeMirror.constant);
  const p=c.projectionMatrix.elements;qMirror.set((Math.sign(clipMirror.x)+p[8])/p[0],(Math.sign(clipMirror.y)+p[9])/p[5],-1,(1+p[10])/p[14]);
  clipMirror.multiplyScalar(2/clipMirror.dot(qMirror));p[2]=clipMirror.x;p[6]=clipMirror.y;p[10]=clipMirror.z+1-.003;p[14]=clipMirror.w;
  river.visible=false;const needs=renderer.shadowMap.needsUpdate;renderer.shadowMap.needsUpdate=false;renderer.setRenderTarget(reflectionTarget);renderer.render(scene,c);renderer.setRenderTarget(null);renderer.shadowMap.needsUpdate=needs;river.visible=true;
}
function fountain(){
  const stone=0xf1debd,shade=0xd3bfa1,patina=0x80a79a;
  circleBlock(0,0,2.74,-.2,4.1);contact(0,.019,0,7.3,7.3);
  lathe(0,0,0,[[0,.018],[2.93,.018],[2.96,.08],[2.91,.15],[2.75,.16],[2.75,.24],[2.64,.30],[2.56,.30],[2.55,.37],[2.61,.49],[2.64,.64],[2.78,.69],[2.79,.76],[2.74,.83],[2.52,.83],[2.45,.77],[2.42,.62],[2.33,.43],[0,.43]],M.trim,stone,64);
  for(let i=0;i<64;i++){const a=i*TAU/64;scope(2.607*Math.sin(a),.535,2.607*Math.cos(a),a,()=>{box(0,0,.012,.221,.14,.028,i%4?M.copper:M.brass,i%4?0xc2d4c7:0xdcc8a3);});}
  for(let i=0;i<16;i++){const a=i*TAU/16;scope(0,0,0,a,()=>{ball(0,.71,2.735,.070,.064,.030,M.brass);});}
  const poolMat=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 p; void main(){p=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:[
    'varying vec2 p; uniform float time;void main(){float d=length(p);float a=atan(p.y,p.x);float dir=floor((a+.18)/.785398+.5)*.785398-.18;vec2 source=vec2(cos(dir),sin(dir));float l=length(p-source*1.57);float l2=length(p-source*.68);float ripple=sin(l*44.-time*6.2)*exp(-l*2.75)+sin(l2*36.-time*5.1)*exp(-l2*3.3);float caustic=pow(max(0.,1.-abs(sin(p.x*13.7+p.y*3.1+sin(p.y*6.-time*.9))+.84*sin(p.y*11.2-p.x*4.9+time*1.1))*.92),10.);float swirl=.5+.5*sin(d*7.+sin(a*3.+time*.33));vec3 c=mix(vec3(.039,.205,.183),vec3(.105,.358,.300),.30+.32*swirl+.14*ripple);c+=vec3(.11,.15,.095)*caustic+vec3(.12,.16,.145)*pow(max(0.,ripple),3.);c+=vec3(.10,.12,.093)*smoothstep(2.34,2.51,d);gl_FragColor=vec4(c,1.);',
    '#include <tonemapping_fragment>','#include <colorspace_fragment>','}'].join('\n')});
  const g=new T.CircleGeometry(2.52,80);g.rotateX(-PI/2);const pool=new T.Mesh(g,poolMat);pool.position.y=.714;scene.add(pool);
  torus(0,.278,0,2.66,.037,M.brass,0xc7b894,PI/2,0,0,72);
  lathe(0,.44,0,[[.7,0],[.75,.14],[.67,.25],[.57,.28],[.52,.41],[.40,.48],[.32,.58],[.27,.93],[.31,1.05],[.46,1.13],[.43,1.24],[.55,1.29],[.85,1.40],[1.10,1.57],[1.18,1.72],[1.19,1.78],[1.11,1.82],[.97,1.69],[.72,1.58],[.28,1.52]],M.trim,stone,56);
  for(let i=0;i<20;i++){let a=TAU*i/20;scope(0,0,0,a,()=>{ball(0,1.14,.309,.047,.30,.065,M.trim,shade,-.10);curve([[0,1.81,.55],[0,1.93,.81],[0,2.10,1.08]],.038,M.trim,0xe1cbaa,8,5);});}
  torus(0,2.18,0,1.16,.031,M.brass,0xffffff,PI/2,0,0,64);
  lathe(0,1.96,0,[[.28,0],[.30,.14],[.20,.24],[.15,.53],[.22,.64],[.36,.71],[.40,.79],[.31,.85],[.135,.89]],M.copper,0xecf1d9,36);
  cyl(0,3.05,0,.033,.054,.62,M.brass);ball(0,3.23,0,.14,.14,.14,M.brass,0xf5dca2);
  for(const [rx,ry,rz] of [[0,.2,.41],[.82,.52,-.72],[PI/2,.1,0]])torus(0,3.23,0,.39,.020,M.brass,0xffe4a1,rx,ry,rz,56);
  ball(0,3.69,0,.051,.13,.051,M.brass);for(let i=0;i<4;i++){let a=TAU*i/4;scope(0,0,0,a,()=>{rodBox([0,3.23,.25],[0,3.23,.52],.034,.045,M.brass);});}
  const streams=[];
  function makeJet(start,end,h,r,rad){const pp=t=>[mix(start[0],end[0],t),mix(start[1],end[1],t)+4*h*t*(1-t),mix(start[2],end[2],t)];
    const pts=[];for(let j=0;j<=8;j++)pts.push(pp(j/8));curve(pts,r,M.waterjet,0xf3ffff,24,6);streams.push({pp,rad});}
  for(let i=0;i<8;i++){const a=TAU*i/8+.18,x=Math.sin(a),z=Math.cos(a);ball(x*2.38,.77,z*2.38,.1,.10,.1,M.copper);
    makeJet([x*2.38,.79,z*2.38],[x*.68,.72,z*.68],1.05,.025,.05);
    makeJet([x*1.15,2.19,z*1.15],[x*1.57,.72,z*1.57],.19,.018,.043);
  }
  makeJet([0,2.8,0],[.05,2.13,0],.84,.032,.055);
  const count=streams.length*24,arr=new Float32Array(count*3),sizes=new Float32Array(count),ph=new Float32Array(count),pr=rng32(3444);
  for(let i=0;i<count;i++){sizes[i]=.018+pr()*.037;ph[i]=pr();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(arr,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('sz',new T.BufferAttribute(sizes,1));
  const mat=new T.ShaderMaterial({uniforms:{vh:{value:600}},vertexShader:'attribute float sz;uniform float vh;void main(){vec4 v=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(sz*vh/max(.1,-v.z),1.,8.);gl_Position=projectionMatrix*v;}',fragmentShader:'void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(.83,.96,.92,(1.-d*d)*.64);}',transparent:true,depthWrite:false});
  const particles=new T.Points(geo,mat);particles.frustumCulled=false;scene.add(particles);
  fountainFlow=t=>{poolMat.uniforms.time.value=t;mat.uniforms.vh.value=renderer.domElement.height;
    for(let i=0;i<count;i++){const st=streams[Math.floor(i/24)],p=(ph[i]+t*(.51+ph[i]*.52))%1,j=i*3,q=st.pp(p),k=st.rad*Math.sin(p*PI);
      arr[j]=q[0]+Math.sin(i*37+p*12)*k;arr[j+1]=q[1]+Math.sin(i*11+p*21)*k;arr[j+2]=q[2]+Math.cos(i*16+p*14)*k;}
    geo.attributes.position.needsUpdate=true;};
}
const gifts=[
 {name:'树影下的长椅',hint:'泉庭南侧，梧桐树荫里有一张长椅。',x:-5.83,z:5.72,y:.54},
 {name:'红帆食铺',hint:'西边的红条纹遮阳篷下，饭已经上桌了。',x:-12.24,z:5.82,y:.86},
 {name:'档案馆阅览桌',hint:'走进潮汐档案馆，找靠近后墙的阅览桌。',x:4.4,z:-17.1,y:.94},
 {name:'钟匠的晚餐',hint:'守潮钟楼底层，钟匠给自己留了一份。',x:-9.15,z:-15.45,y:.94},
 {name:'高处的钟声',hint:'钟楼内的梯子通向钟廊，朝河的一侧藏着一碗。',x:-9.15,z:-14.95,y:12.81},
 {name:'石桥栏上',hint:'穿过拱桥时，看看桥中央南边的石栏柱顶。',x:22,z:bridgeZ+2.31,y:bridgeH(22)+1.10},
 {name:'磨坊的工间饭',hint:'绕到东岸水磨坊的正门，进去看看工台。',x:37.4,z:-10.9,y:.91},
 {name:'系舟人的午饭',hint:'东岸码头靠近小船的货箱上，留着系舟人的午饭。',x:32.32,z:16.1,y:.70},
 {name:'染坊的后院',hint:'绕进西街房屋背后，晾着织物的小院里有一张木案。',x:-23.35,z:8.4,y:.83},
 {name:'橘树之间',hint:'桥东向南有一座小橘园，检查树下的摘果箱。',x:42.1,z:15.4,y:.57}
];
function riceModel(){
  const seedG=new T.SphereGeometry(1,7,5);return model(()=>{
    lathe(0,0,0,[[.104,0],[.124,.011],[.120,.039],[.137,.052],[.182,.079],[.221,.121],[.251,.19],[.259,.222],[.253,.236],[.242,.238],[.236,.216],[.208,.157],[.155,.105],[.04,.090]],M.ceramic,0xfffdf0,42);
    torus(0,.217,0,.254,.0065,M.blue,0xffffff,PI/2,0,0,40);torus(0,.054,0,.140,.006,M.blue,0xffffff,PI/2,0,0,36);
    for(let i=0;i<14;i++){const a=i*TAU/14;scope(0,0,0,a,()=>{ball(0,.139,.229,.023,.029,.005,M.blue,0xffffff,-.38,0,-.55);ball(.027,.154,.232,.013,.026,.004,M.blue,0xffffff,-.25,0,.55);});}
    ball(0,.215,0,.239,.109,.238,M.solid,0xf5eacc);const r=rng32(5840);
    for(let i=0;i<176;i++){const rr=Math.sqrt((i+.5)/176),a=i*2.39996;const x=.23*rr*Math.cos(a),z=.23*rr*Math.sin(a),y=.222+.103*Math.sqrt(1-rr*rr)+r()*.007;
      addGeo(seedG,M.ceramic,x,y,z,.010+r()*.003,.009,.018+r()*.008,(r()-.5)*.9,r()*TAU,(r()-.5)*.9,[0xfff6df,0xf6e8cc,0xfbf4de,0xfff9e7][i%4]);}
  });
}
let riceNodes=[],beacons;
function makeGifts(){
  const proto=riceModel(),sparkMat=new T.ShaderMaterial({uniforms:{time:{value:0},scale:{value:720}},vertexShader:'attribute float phase;uniform float time,scale;varying float f;void main(){float u=fract(time*.31+phase);f=sin(3.14159*u);vec3 p=position+vec3(sin(phase*52.+u*5.)*.13,.12+u*.56,cos(phase*32.+u*4.)*.13);vec4 v=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((.038+.023*f)*scale/max(.1,-v.z),1.3,10.);gl_Position=projectionMatrix*v;}',fragmentShader:'varying float f;void main(){vec2 p=abs(gl_PointCoord-.5)*2.;float s=max(0.,1.-p.x)*max(0.,1.-p.y);float a=pow(s,3.)*f;if(a<.04)discard;gl_FragColor=vec4(1.,.83,.43,a);}',transparent:true,depthWrite:false});
  const marks=[];gifts.forEach((g,i)=>{let node=proto.clone();node.position.set(g.x,g.y+.008,g.z);scene.add(node);
    const sg=new T.BufferGeometry(),p=new Float32Array(15),ph=new Float32Array(5);for(let j=0;j<5;j++)ph[j]=((j+i*.16)/5)%1;sg.setAttribute('position',new T.BufferAttribute(p,3));sg.setAttribute('phase',new T.BufferAttribute(ph,1));let s=new T.Points(sg,sparkMat);s.frustumCulled=false;s.position.set(0,.26,0);node.add(s);riceNodes.push(node);marks.push(s);
  });beacons=t=>{sparkMat.uniforms.time.value=t;sparkMat.uniforms.scale.value=renderer.domElement.height;};
}
function makeCeremony(){
  maiden=createWhaleMaiden();offering=new T.Group();scene.add(offering);offering.visible=false;offering.add(maiden.root);maiden.root.position.y=.08;
  const ring=model(()=>{cyl(0,.003,0,.86,.91,.03,M.copper,0x9bcabb,56);for(const [r,thick] of [[.90,.018],[.78,.011],[.66,.010]])torus(0,.027,0,r,thick,M.brass,0xffe5a3,PI/2,0,0,64);
    for(let i=0;i<12;i++)scope(0,0,0,TAU*i/12,()=>{box(0,.029,.83,.017,.018,.072,M.brass);});});offering.add(ring);
  const n=160,p=new Float32Array(n*3),clock=new Float32Array(n),r=rng32(201);for(let i=0;i<n;i++){let a=r()*TAU,rad=.9+.9*r();p[i*3]=Math.cos(a)*rad;p[i*3+1]=r()*2;p[i*3+2]=Math.sin(a)*rad;clock[i]=r();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(p,3));geo.setAttribute('phase',new T.BufferAttribute(clock,1));
  const mat=new T.ShaderMaterial({uniforms:{time:{value:0},show:{value:1},vheight:{value:700}},vertexShader:'attribute float phase;uniform float time,show,vheight;varying float f;void main(){float u=fract(phase+time*.22);float a=time*.61+u;vec3 p=position;p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz*(.71+u*.7);p.y=u*(2.1+position.y);f=sin(u*3.14159)*show;vec4 v=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(.047*vheight/max(-v.z,.1),1.2,12.);gl_Position=projectionMatrix*v;}',fragmentShader:'varying float f;void main(){vec2 p=abs(gl_PointCoord-.5)*2.;float a=pow(max(0.,1.-p.x)*max(0.,1.-p.y),2.)*f;if(a<.025)discard;gl_FragColor=vec4(1.,.85,.45,a);}',transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const obj=new T.Points(geo,mat);obj.frustumCulled=false;offering.add(obj);arrivalGlow=mat;
}
function makeBirds(){
  const g=new T.BufferGeometry(),p=[0,0,0,.43,.12,-.04,.88,.13,.13,.88,.13,.13,.43,.12,-.04,.33,.09,.12,0,0,0,.33,.09,.12,.43,.12,-.04];g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();let mat=new T.MeshStandardMaterial({color:0xf4f0df,side:T.DoubleSide,roughness:.8});
  for(let i=0;i<8;i++){const root=new T.Group(),l=new T.Mesh(g,mat),r=new T.Mesh(g,mat);r.scale.x=-1;root.add(l,r);const body=new T.Mesh(new T.SphereGeometry(1,8,6),mat);body.scale.set(.088,.08,.27);root.add(body);root.scale.setScalar(.7+random()*.45);scene.add(root);birds.push({root,l,r,i});}
}
