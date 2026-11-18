// Depth-based contact shading grounds close objects. Color and depth are resolved together before display.
let colorTarget,displayScene,displayCamera,displayUniforms;
function makeOptics(){
  colorTarget=new T.WebGLRenderTarget(4,4,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,format:T.RGBAFormat,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});
  colorTarget.depthTexture=new T.DepthTexture(4,4,T.UnsignedIntType);colorTarget.depthTexture.format=T.DepthFormat;
  colorTarget.samples=Math.min(4,renderer.capabilities.maxSamples);
  displayUniforms={image:{value:colorTarget.texture},depthMap:{value:colorTarget.depthTexture},resolution:{value:new T.Vector2(1,1)},invProj:{value:new T.Matrix4()},focal:{value:1},strength:{value:1},viewToActor:{value:new T.Matrix4()},actorOn:{value:0},portraitFocus:{value:0}};
  const pass=new T.ShaderMaterial({uniforms:displayUniforms,depthTest:false,depthWrite:false,toneMapped:false,vertexShader:'varying vec2 tc;void main(){tc=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:[
    'varying vec2 tc;uniform sampler2D image,depthMap;uniform vec2 resolution;uniform mat4 invProj;uniform float focal,strength,actorOn,portraitFocus;uniform mat4 viewToActor;',
    'vec3 getP(vec2 u){float d=texture2D(depthMap,u).r;vec4 p=invProj*vec4(u*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}',
    'void main(){vec3 inputColor=texture2D(image,tc).rgb;float d=texture2D(depthMap,tc).r;vec3 P=getP(tc);float z=-P.z;vec2 pix=1./resolution;',
    'vec3 dx1=getP(tc+vec2(pix.x,0.))-P,dx2=P-getP(tc-vec2(pix.x,0.)),dy1=getP(tc+vec2(0.,pix.y))-P,dy2=P-getP(tc-vec2(0.,pix.y));vec3 N=normalize(cross(dot(dx1,dx1)<dot(dx2,dx2)?dx1:dx2,dot(dy1,dy1)<dot(dy2,dy2)?dy1:dy2));',
    'vec3 localActor=(viewToActor*vec4(P,1.)).xyz;bool toon=actorOn>.5&&abs(localActor.x)<1.34&&abs(localActor.z)<1.01&&localActor.y>-.025&&localActor.y<2.94;float ao=0.;if(!toon&&z<59.&&d<.99999){float j=.53+.64*sin(P.x*.71+P.z*.34)+.42*cos(P.y*.63-P.z*.30);float fade=1.-smoothstep(35.,59.,z);for(int i=0;i<14;i++){float fi=float(i);float r=fi<7.?.46:1.12;float a=fi*2.39996+j;vec2 offset=vec2(cos(a)*resolution.y/resolution.x,sin(a))*min(.087,focal*r/max(z,.5))*(.42+.51*fract(fi*.618+.16));vec3 V=getP(clamp(tc+offset,vec2(.0001),vec2(.9999)))-P;float vv=dot(V,V);float ang=max(dot(N,V)-.023,0.)*inversesqrt(vv+.00015);ao+=ang*(1.-smoothstep(r*.24,r*1.27,sqrt(vv)));}ao=clamp(ao/14.*2.35,0.,.58)*fade*strength;}',
    'vec3 occ=vec3(1.)-ao*vec3(.78,.91,1.02);if(portraitFocus>0.&&!toon&&z>portraitFocus+1.05){float u=clamp((z-portraitFocus-1.)/max(z,.1),0.,1.);vec2 rad=pix*u*min(6.,resolution.y*.0085);vec3 bg=inputColor;float w=1.;for(int i=0;i<12;i++){float h=float(i)+.5;vec2 uv2=tc+vec2(cos(h*2.39996),sin(h*2.39996))*sqrt(h/12.)*rad;float here=-getP(uv2).z;float allow=smoothstep(portraitFocus+.51,portraitFocus+1.22,here);bg+=texture2D(image,uv2).rgb*allow;w+=allow;}inputColor=mix(bg/w,vec3(dot(bg/w,vec3(.2126,.7152,.0722))),u*.065)*(1.-.043*u);}vec3 color=inputColor*occ;',
    'gl_FragColor=vec4(color,1.);','#include <colorspace_fragment>','}'
  ].join('\n')});
  displayScene=new T.Scene();displayCamera=new T.Camera();const mesh=new T.Mesh(new T.PlaneGeometry(2,2),pass);mesh.frustumCulled=false;displayScene.add(mesh);
}
const sceneFilm={value:0};
function prepareSceneColor(){
  const seen=new Set();scene.traverse(o=>{
    if(!o.material)return;
    for(const mat of (Array.isArray(o.material)?o.material:[o.material])){
      if(seen.has(mat)||!mat.toneMapped)continue;seen.add(mat);
      const before=mat.onBeforeCompile,priorKey=mat.customProgramCacheKey();
      mat.customProgramCacheKey=()=>priorKey+'|main-view-film';
      mat.onBeforeCompile=function(shader,render){
        before.call(this,shader,render);if(!shader.fragmentShader.includes('#include <tonemapping_fragment>'))return;
        shader.uniforms.sceneFilm=sceneFilm;
        shader.fragmentShader='uniform float sceneFilm;\nvec3 bellFilm(vec3 x){const mat3 A=mat3(vec3(.59719,.076,.0284),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));const mat3 B=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));x=A*(x*1.02/.6);vec3 a=x*(x+.0245786)-.000090537;vec3 b=x*(.983729*x+.432951)+.238081;return clamp(B*(a/b),0.,1.);}\n'+shader.fragmentShader.replace('#include <tonemapping_fragment>','#include <tonemapping_fragment>\n#ifndef TONE_MAPPING\n if(sceneFilm>.5)gl_FragColor.rgb=bellFilm(gl_FragColor.rgb);\n#endif');
      };
    }
  });
}
function drawScene(){
  if(mode==='inspect'&&portrait.catalogue){renderer.render(portrait.room,camera);return;}
  if(settings.quality==='low'||!colorTarget){renderer.render(scene,camera);return;}
  displayUniforms.invProj.value.copy(camera.projectionMatrixInverse);displayUniforms.focal.value=.5/Math.tan(camera.fov*PI/360);
  camera.updateMatrixWorld();displayUniforms.actorOn.value=summoned&&offering?.visible?1:0;displayUniforms.portraitFocus.value=0;
  if(displayUniforms.actorOn.value){offering.updateMatrixWorld();displayUniforms.viewToActor.value.copy(offering.matrixWorld).invert().multiply(camera.matrixWorld);if(mode==='inspect'||mode==='cinema')displayUniforms.portraitFocus.value=-vMirror.set(offering.position.x,offering.position.y+1.4,offering.position.z).applyMatrix4(camera.matrixWorldInverse).z;}
  sceneFilm.value=1;renderer.setRenderTarget(colorTarget);renderer.render(scene,camera);sceneFilm.value=0;renderer.setRenderTarget(null);renderer.render(displayScene,displayCamera);
}
function resizeOptics(){if(!colorTarget)return;let w=renderer.domElement.width,h=renderer.domElement.height;colorTarget.setSize(w,h);displayUniforms.resolution.value.set(w,h);}
// A synthetic radiance panorama gives glazed ceramic and metal a stable reflection, including inside the fountain.
function glazeReflection(){
  if(!renderer.extensions.has('EXT_color_buffer_float'))return;
  const w=192,h=96,arr=new Float32Array(w*h*4),sunDir=new T.Vector3(-32,55,27).normalize(),v=new T.Vector3(),sky=new T.Color(),horizon=new T.Color(0xe3dfc2),zenith=new T.Color(0x84b4d0),terrain=new T.Color(0x85816a),stone=new T.Color(0xb79b78),tile=new T.Color(0x986c54);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const lat=(y/(h-1)-.5)*PI,a=x/w*TAU-PI;v.set(Math.cos(a)*Math.cos(lat),Math.sin(lat),Math.sin(a)*Math.cos(lat));const edge=.04+.065*Math.sin(3*a+.8)+.03*Math.cos(11*a)+.055*Math.sign(Math.sin(6*a));
    if(v.y>edge){sky.copy(horizon).lerp(zenith,Math.pow(Math.max(v.y,0),.55));const cloud=.13*Math.sin(v.x*8+v.y*5)*Math.cos(v.z*5-v.y*5);sky.multiplyScalar(1.4+Math.max(cloud,0));}
    else{sky.copy(terrain);if(v.y>-.12)sky.lerp(Math.sin(a*8)>.25?tile:stone,.6);sky.multiplyScalar(.69+.24*(Math.sin(a*3)*.5+.5));}
    const gl=Math.pow(Math.max(0,v.dot(sunDir)),320)*6.5,off=(y*w+x)*4;arr[off]=sky.r+gl;arr[off+1]=sky.g+gl*.85;arr[off+2]=sky.b+gl*.63;arr[off+3]=1;
  }
  const tex=new T.DataTexture(arr,w,h,T.RGBAFormat,T.FloatType);tex.mapping=T.EquirectangularReflectionMapping;tex.colorSpace=T.LinearSRGBColorSpace;tex.needsUpdate=true;
  const pm=new T.PMREMGenerator(renderer),probe=pm.fromEquirectangular(tex);for(const [mat,intensity] of [[M.brass,.85],[M.copper,.55],[M.metal,.55],[M.glass,.56],[M.ceramic,.34],[M.blue,.31],[M.waterjet,.44],[M.darkMetal,.25]]){mat.envMap=probe.texture;mat.envMapIntensity=intensity;mat.needsUpdate=true;}
  tex.dispose();pm.dispose();
}
