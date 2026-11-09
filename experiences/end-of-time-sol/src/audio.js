export class Soundscape {
  constructor(){this.context=null;this.enabled=false;this.master=null;this.oscillators=[];}
  async toggle(){
    if(!this.context)this.create();
    if(this.enabled){this.master.gain.setTargetAtTime(0,this.context.currentTime,.35);this.enabled=false;}
    else{await this.context.resume();this.master.gain.setTargetAtTime(.25,this.context.currentTime,.8);this.enabled=true;}
    return this.enabled;
  }
  create(){
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)throw new Error('此浏览器暂不支持环境声音。');
    const ctx=this.context=new AudioCtx();
    const master=this.master=ctx.createGain();master.gain.value=0;
    const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-20;compressor.ratio.value=4;
    master.connect(compressor);compressor.connect(ctx.destination);
    const delay=ctx.createDelay(3);delay.delayTime.value=.73;
    const feedback=ctx.createGain();feedback.gain.value=.35;
    const wet=ctx.createGain();wet.gain.value=.25;
    delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(master);
    [43.65,65.4,87.4,130.81,174.61,261.63].forEach((f,i)=>{
      const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=f;osc.detune.value=i%2?3:-3;
      const gain=ctx.createGain();gain.gain.value=i<3?.12:.035;
      const lfo=ctx.createOscillator();lfo.frequency.value=.023+i*.008;
      const modulation=ctx.createGain();modulation.gain.value=gain.gain.value*.5;
      lfo.connect(modulation);modulation.connect(gain.gain);lfo.start();
      const pan=ctx.createStereoPanner();pan.pan.value=(i/5-.5)*1.6;
      osc.connect(gain);gain.connect(pan);pan.connect(master);pan.connect(delay);osc.start();
      this.oscillators.push({osc,f});
    });
    const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate);const data=buffer.getChannelData(0);let brown=0;
    for(let i=0;i<data.length;i++){brown=(brown+Math.random()*.035-.0175)/1.015;data[i]=brown;}
    const wind=ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;
    this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=550;
    const windGain=ctx.createGain();windGain.gain.value=.17;
    wind.connect(this.filter);this.filter.connect(windGain);windGain.connect(master);wind.start();
  }
  update(direction,pulse){
    if(!this.context||!this.enabled)return;
    const t=this.context.currentTime;
    this.filter.frequency.setTargetAtTime(350+pulse*850+(direction<0?180:0),t,.4);
    this.oscillators.forEach(({osc,f})=>osc.frequency.setTargetAtTime(f*(direction===0?.94:direction<0?.985:1)+pulse*.6,t,.3));
  }
  chime(index){
    if(!this.context||!this.enabled)return;
    const ctx=this.context;
    [1,1.5,2].forEach((harmonic,i)=>{
      const osc=ctx.createOscillator();osc.frequency.value=[261.63,329.63,392][index]*harmonic;
      const gain=ctx.createGain();const start=ctx.currentTime+i*.16;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.09,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+3);
      osc.connect(gain);gain.connect(this.master);osc.start(start);osc.stop(start+3.1);
    });
  }
}
