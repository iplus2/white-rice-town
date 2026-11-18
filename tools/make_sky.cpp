#include <array>
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstdint>
#include <vector>
// Offline, original atmosphere: an eroded cumulus layer lit by a warm high sun.
struct V { float x,y,z; V operator+(V o)const{return{x+o.x,y+o.y,z+o.z};} V operator*(float k)const{return{x*k,y*k,z*k};} };
float dot(V a,V b){return a.x*b.x+a.y*b.y+a.z*b.z;}
float lerp(float a,float b,float t){return a+(b-a)*t;}
float sat(float x){return std::clamp(x,0.f,1.f);}
float st(float a,float b,float x){float t=sat((x-a)/(b-a));return t*t*(3-2*t);}
V mix(V a,V b,float t){return a*(1-t)+b*t;}
constexpr float pi=3.14159265f;
float noiseGrid[64*64*64];
inline float val(int x,int y,int z){return noiseGrid[(x&63)|((y&63)<<6)|((z&63)<<12)];}
float n(V p){
  int x=(int)std::floor(p.x),y=(int)std::floor(p.y),z=(int)std::floor(p.z);
  float a=p.x-x,b=p.y-y,c=p.z-z;a=a*a*(3-2*a);b=b*b*(3-2*b);c=c*c*(3-2*c);
  return lerp(lerp(lerp(val(x,y,z),val(x+1,y,z),a),lerp(val(x,y+1,z),val(x+1,y+1,z),a),b),
              lerp(lerp(val(x,y,z+1),val(x+1,y,z+1),a),lerp(val(x,y+1,z+1),val(x+1,y+1,z+1),a),b),c);
}
float density(V p,int detail){
  float level=p.y-1.65f;
  if(level<0||level>2.65)return 0;
  V h={p.x*.48f+.49f,4.21f,p.z*.48f+1.23f};
  float weather=n(h)*.70f+n(h*2.08f)*.30f;
  float top=2.67f*st(.28f,.71f,weather)+.08f;
  float envelope=st(0,.20f,level)*(1-st(top*.4f,top,level));
  if(envelope<=0)return 0;
  V q={p.x*1.02f+p.y*.20f+3.f,p.y*1.40f+1.47f,p.z*1.02f+12.7f};
  float shape=n(q)*.56f+n(q*2.08f+V{4.3f,10.8f,1.3f})*.29f+n(q*4.35f)*.15f;
  float cloud=(weather-.658f)*1.72f + (shape-.5f)*1.18f + envelope*.43f-.280f;
  if(cloud<-.08f)return 0;
  if(detail)cloud+=(n(q*9.34f)-.52f)*.075f+(n(q*18.6f)-.51f)*.045f;
  return sat(cloud*3.4f)*envelope;
}
int main(int argc,char**argv){
  int w=argc>1?atoi(argv[1]):3584,h=argc>2?atoi(argv[2]):950;
  uint32_t s=8743381;for(auto &v:noiseGrid){s=s*1664525+1013904223;v=(s>>8)/16777216.f;}
  V sun={-.4616f,.7934f,.3895f};
  FILE*f=fopen(argc>3?argv[3]:"skybake.ppm","wb");if(!f)return 1;fprintf(f,"P6\n%d %d\n255\n",w,h);
  std::vector<unsigned char> row(w*3);
  for(int yi=0;yi<h;yi++){
    float elev=(1.f-(yi+.5f)/h)*(pi*.5f+.055f)-.055f,dy=sin(elev),cy=cos(elev),amp=std::max(dy,.035f);
    for(int xi=0;xi<w;xi++){
      float a=((xi+.5f)/w-.5f)*(2*pi);V d={cy*cos(a),dy,cy*sin(a)};
      float skyDepth=std::pow(std::max(dy,0.f),.49f), ds=std::max(dot(sun,d),0.f);
      V sky=mix({.748f,.848f,.886f},{.189f,.521f,.752f},skyDepth);
      sky=sky+V{.088f,.062f,.026f}*(std::pow(ds,10.f)*.6f+std::pow(ds,155.f)*2.f);
      float sunRadius=st(.99945f,.99994f,ds);sky=mix(sky,{1.f,.983f,.890f},sunRadius*.90f);
      // Sparse high cirrus above the cumulus layer.
      V cirp={d.x*10/amp,9.21f,d.z*10/amp};cirp.z+=.115f*cirp.x+2.2f*n(cirp*.16f);
      float cir=st(.54f,.82f,n({cirp.x*.20f,2.1f,cirp.z*1.79f})*.52f+n({cirp.x*.58f,3.15f,cirp.z*6.6f})*.29f+n({cirp.x*1.3f,7.6f,cirp.z*13.9f})*.19f);
      sky=mix(sky,{.92f,.95f,.97f},cir*.12f*st(0.f,.22f,dy));
      V acc={0,0,0};float trans=1;
      if(dy>.015f){
        float start=1.65f/amp,end=4.30f/amp,span=end-start;int steps=std::clamp((int)(span*28.f),47,216);
        float dsamp=span/steps;
        uint32_t j=(uint32_t)(xi*73693+yi*191239)*1664525u+1013904223u;float jitter=(j>>16)/65536.f;
        for(int k=0;k<steps&&trans>.015f;k++){
          float t=start+(k+jitter)*dsamp;V p=d*t;float den=density(p,1);if(den<.002f)continue;
          float occl=density(p+sun*.19f,0)*.25f+density(p+sun*.53f,0)*.46f+density(p+sun*1.08f,0)*.79f+density(p+sun*1.83f,0)*.90f;
          float lighting=expf(-occl*2.1f),vertical=st(1.6f,3.5f,p.y);
          V shade=mix({.635f,.713f,.758f},{.81f,.852f,.876f},vertical*.70f+ds*.12f);
          V lit={1.00f,.984f,.938f};V cloud=mix(shade,lit,lighting*.85f+.09f);
          float haze=std::min(.55f,t*.0041f);cloud=mix(cloud,sky,haze);
          float alpha=(1-exp(-den*dsamp*3.15f))*st(.015f,.14f,dy);
          acc=acc+cloud*(trans*alpha);trans*=1-alpha;
        }
      }
      V out=sky*trans+acc;row[xi*3]=std::round(sat(out.x)*255);row[xi*3+1]=std::round(sat(out.y)*255);row[xi*3+2]=std::round(sat(out.z)*255);
    }fwrite(row.data(),1,row.size(),f);
  }fclose(f);
}
