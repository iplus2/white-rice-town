const townSound=(()=>{
  let ctx,master,riverG,airG,wheelG,noise,dry,lastBird=0,lastWheel=0,tunePlayed=false,mutedMemory=.55;
  function init(){
    if(ctx){if(ctx.state==='suspended')ctx.resume().catch(()=>{});return;}
    try{ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=settings.volume*.64;master.connect(ctx.destination);let n=ctx.sampleRate*2;noise=ctx.createBuffer(1,n,ctx.sampleRate);let data=noise.getChannelData(0),r=rng32(803);let acc=0;for(let i=0;i<n;i++){let v=r()*2-1;acc=(acc+.035*v)/1.035;data[i]=.72*v+.28*acc*9;}
      const stream=(lo,hi,g,pan)=>{const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),hp=ctx.createBiquadFilter(),gain=ctx.createGain(),st=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain();src.buffer=noise;src.loop=true;f.type='lowpass';f.frequency.value=hi;hp.type='highpass';hp.frequency.value=lo;if(st.pan)st.pan.value=pan;gain.gain.value=g;src.connect(hp).connect(f).connect(gain).connect(st).connect(master);src.start();return gain;};
      riverG=stream(450,2700,.03,.23);airG=stream(80,450,.036,-.14);wheelG=stream(1100,4500,.01,-.25);
    }catch{ctx=null;}
  }
  function volume(){if(master)master.gain.setTargetAtTime(settings.volume*.64,ctx.currentTime,.12);refreshIcons();writePrefs();}
  function toggle(){if(settings.volume>.001){mutedMemory=settings.volume;settings.volume=0;}else settings.volume=mutedMemory||.55;init();volume();}
  function tone(hz,duration,vol=.1,delay=0,type='sine',endHz=0){
    if(!ctx||!master)return;const time=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(hz,time);if(endHz)o.frequency.exponentialRampToValueAtTime(endHz,time+duration*.83);g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(vol,time+.017);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g).connect(master);o.start(time);o.stop(time+duration+.03);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  function burst(duration,amp,cut){
    if(!ctx||!noise)return;const o=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime;o.buffer=noise;f.type='lowpass';f.frequency.value=cut;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(amp,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(f).connect(g).connect(master);o.start(t,Math.random());o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();f.disconnect();};
  }
  function bell(hz,d,vol,delay){tone(hz,d,vol,delay);tone(hz*2.007,d*.59,vol*.30,delay);tone(hz*3.97,d*.36,vol*.14,delay);}
  function welcome(){init();if(!tunePlayed){tunePlayed=true;bell(261.63,2.5,.11,.22);bell(392,2.1,.081,.79);}}
  function collect(i){init();[587.3,740,880,1174.6].forEach((v,j)=>bell(v*(i===10?1.122:1),.69+j*.12,.092-j*.011,j*.10));}
  function summon(){init();burst(1.1,.22,3300);[196,246.94,293.66,392,493.88,587.33,783.99].forEach((f,i)=>bell(f,1.7,.115,i*.225));[392,493.88,587.33,783.99].forEach((f,i)=>tone(f,2.95,.046,2.05+i*.07));}
  function step(wood,fast){burst(wood?.115:.095,wood?.19:.17,wood?650:1250);tone(wood?105:78,.105,.065,0,'sine',wood?67:48);}
  function tick(t){if(!ctx)return;const p=camera.position,inside=interiors.some(h=>Math.abs(p.x-h.x)<h.w/2&&Math.abs(p.z-h.z)<h.d/2);
    const play=['play','title','cinema'].includes(mode),v=play?1:.30,riverDist=Math.hypot(Math.max(0,Math.abs(p.x-22)-7.5),Math.min(Math.abs(p.y-1.7),14)),fountainD=Math.hypot(p.x,p.z);
    riverG.gain.setTargetAtTime((.037+.14/(1+.16*riverDist)+.165/(1+.25*fountainD))*(inside?.27:1)*v,ctx.currentTime,.40);
    airG.gain.setTargetAtTime((inside?.015:.044)*v,ctx.currentTime,.5);const wm=Math.hypot(p.x-30,p.z+9.4);wheelG.gain.setTargetAtTime(.095/(1+.19*wm)*v,ctx.currentTime,.45);
    if(t>lastBird&&play&&!inside){lastBird=t+5.2+Math.random()*7;const f=1750+Math.random()*600;tone(f,.115,.018,0,'sine',f*1.26);tone(f*1.31,.19,.017,.15,'sine',f*.97);}
    if(t>lastWheel&&wm<10&&play){lastWheel=t+1.14;tone(102,.20,.024,0,'triangle',71);}
  }
  return {init,toggle,volume,summon,collect,step,welcome,tick,climb(){burst(.13,.12,830);bell(208,1.35,.045,.16);}};
})();
