export const noise = /* glsl */`
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 x){vec3 p=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(p),hash(p+vec3(1,0,0)),f.x),mix(hash(p+vec3(0,1,0)),hash(p+vec3(1,1,0)),f.x),f.y),mix(mix(hash(p+vec3(0,0,1)),hash(p+vec3(1,0,1)),f.x),mix(hash(p+vec3(0,1,1)),hash(p+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float f=0.;f+=.5*noise3(p);p=p*2.03+3.1;f+=.25*noise3(p);p=p*2.01+4.7;f+=.125*noise3(p);p=p*2.04+8.2;f+=.0625*noise3(p);return f;}
`;

export const skyVertex = /* glsl */`
varying vec3 vDirection;
void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
export const skyFragment = /* glsl */`
varying vec3 vDirection;
uniform float uTime;
${noise}
void main(){
 vec3 d=normalize(vDirection);
 vec3 p=d*3.1+vec3(0.,0.,uTime*.001);
 float n=fbm(p+fbm(p*1.7)*1.8);
 float mist=pow(max(0.,1.-abs(d.y-.15+d.x*.28)*2.8),3.);
 float clouds=smoothstep(.28,.8,n)*mist;
 vec3 c=vec3(.007,.010,.022);
 c+=vec3(.020,.025,.058)*clouds;
 c+=vec3(.038,.020,.033)*pow(clouds,2.)*smoothstep(-.4,.6,d.x);
 float glow=pow(max(0.,dot(d,normalize(vec3(1.,.35,-1.2)))),12.);
 c+=vec3(.025,.019,.016)*glow;
 gl_FragColor=vec4(c,1.);
}`;

export const coronaVertex = /* glsl */`
varying vec3 vNormal;varying vec3 vView;varying vec3 vLocal;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);vLocal=position;gl_Position=projectionMatrix*mv;}
`;
export const coronaFragment = /* glsl */`
varying vec3 vNormal;varying vec3 vView;varying vec3 vLocal;
uniform float uTime;uniform float uPulse;
${noise}
void main(){
 float f=1.-abs(dot(normalize(vNormal),normalize(vView)));
 float angle=atan(vLocal.y,vLocal.x);
 float flow=fbm(normalize(vLocal)*8.+vec3(uTime*.04));
 float rim=pow(f,9.);
 float thin=pow(f,35.);
 float streams=.65+.35*sin(angle*7.+flow*8.+uTime*.1);
 vec3 gold=mix(vec3(1.,.32,.065),vec3(1.,.79,.39),flow);
 vec3 c=gold*rim*(1.4+streams*.9)+vec3(1.,.86,.62)*thin*2.8;
 c*=1.+uPulse*.65;
 gl_FragColor=vec4(c,clamp(rim*1.9,0.,1.));
}`;

export const diskVertex = /* glsl */`
varying vec3 vLocal;
uniform float uTime;
void main(){vLocal=position;vec3 p=position;float r=length(p.xy);p.z+=sin(r*4.-uTime*.3)*.035;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}
`;
export const diskFragment = /* glsl */`
varying vec3 vLocal;uniform float uTime;uniform float uPulse;
${noise}
void main(){
 float r=length(vLocal.xy);float a=atan(vLocal.y,vLocal.x);
 float t=uTime*.045;
 float flow=fbm(vec3(r*3.,sin(a-t)*3.,cos(a-t)*3.));
 float threads=sin(r*99.+flow*10.+a*2.-t*10.)*.5+.5;
 float threads2=pow(sin(r*38.-a*3.+flow*7.)*.5+.5,5.);
 float edge=smoothstep(3.42,3.85,r)*(1.-smoothstep(5.1,8.9,r));
 float radial=pow(3.6/max(r,3.6),3.4);
 float streak=pow(max(0.,sin(a*4.+flow*9.-t)),3.);
 vec3 gold=mix(vec3(.42,.13,.028),vec3(1.,.66,.27),radial);
 float intensity=(.08+threads*.32+threads2*.65+streak*.16)*radial;
 vec3 c=gold*intensity*3.8;
 c+=vec3(1.,.88,.63)*pow(threads,22.)*radial*.65;
 gl_FragColor=vec4(c*(1.+uPulse*.5),edge*clamp(intensity*1.8,0.,.85));
}`;

export const particleVertex = /* glsl */`
attribute vec4 aData;attribute vec3 aColor;
uniform float uTime;uniform float uPixelRatio;uniform float uPulse;uniform float uMode;
varying vec3 vColor;varying float vAlpha;
void main(){
 float a=aData.x+uTime*aData.w;
 float r=aData.y;
 vec3 p;
 if(uMode<.5){
   float ripple=sin(r*1.3-uPulse*4.)*uPulse*.08;
   p=vec3(cos(a)*r,sin(a)*r,aData.z+sin(a*3.+uTime*.08)*.05+ripple);
 }else{
   p=position;
   p.y+=sin(uTime*.03+aData.x)*.3;
   p.x+=sin(uTime*.017+aData.y)*.25;
 }
 vec4 mv=modelViewMatrix*vec4(p,1.);
 gl_Position=projectionMatrix*mv;
 float size=mix(1.2,3.4,fract(aData.x*19.));
 gl_PointSize=clamp(size*uPixelRatio*(24./max(-mv.z,1.)),.65,5.*uPixelRatio);
 vColor=aColor;
 vAlpha=(.4+.6*sin(aData.x*15.+uTime*.1)*sin(aData.x*15.+uTime*.1));
}`;
export const particleFragment = /* glsl */`
varying vec3 vColor;varying float vAlpha;
void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float alpha=pow(1.-d,2.5);gl_FragColor=vec4(vColor,alpha*vAlpha);}
`;

export const waterShader = {
 uniforms: { color: {value:null}, tDiffuse:{value:null}, textureMatrix:{value:null}, uTime:{value:0}, uPulse:{value:0}, uOrigin:{value:null} },
 vertexShader: /* glsl */`
 uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vWorld;
 void main(){vUv=textureMatrix*vec4(position,1.);vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
 `,
 fragmentShader: /* glsl */`
 uniform sampler2D tDiffuse;uniform float uTime;uniform float uPulse;uniform vec3 uOrigin;
 varying vec4 vUv;varying vec3 vWorld;
 void main(){
 vec2 p=vWorld.xz;
 float d=length(p-uOrigin.xz);
 float wave=sin(p.x*1.5+p.y*.9+uTime*.22)*.4+sin(p.x*.6-p.y*2.8-uTime*.19)*.35;
 float ripple=sin(d*2.8-uTime*.8)*exp(-d*.075)*uPulse;
 vec4 uv=vUv;
 uv.x+=(wave*.002+ripple*.002)*uv.w;
 uv.y+=sin(p.y*3.1+p.x*.7+uTime*.3)*.00065*uv.w;
 vec3 reflected=texture2DProj(tDiffuse,uv).rgb;
 float dist=length(cameraPosition-vWorld);
 float fresnel=pow(1.-max(dot(normalize(cameraPosition-vWorld),vec3(0,1,0)),0.),2.);
 vec3 c=vec3(.008,.013,.025)+reflected*(.32+fresnel*.35);
 c+=vec3(.045,.031,.015)*pow(max(0.,wave),9.)*exp(-d*.07);
 c+=vec3(.08,.048,.022)*pow(max(0.,ripple),8.);
 c=mix(c,vec3(.012,.016,.029),smoothstep(40.,180.,dist));
 gl_FragColor=vec4(c,1.);
 }`
};

export const finalShader = {
 uniforms:{ tDiffuse:{value:null},uTime:{value:0},uPulse:{value:0},uCenter:{value:null},uAspect:{value:1},uResolution:{value:null}},
 vertexShader:/* glsl */`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:/* glsl */`
 uniform sampler2D tDiffuse;uniform float uTime;uniform float uPulse;uniform vec2 uCenter;uniform float uAspect;uniform vec2 uResolution;varying vec2 vUv;
 void main(){
  vec2 uv=vUv;vec2 d=uv-uCenter;d.x*=uAspect;float r=length(d);
  float wave=sin(r*48.-uTime*2.)*exp(-r*4.)*uPulse*.004;
  vec2 dir=normalize(d+vec2(.00001));dir.x/=uAspect;
  uv+=dir*wave;
  vec2 chroma=dir*(.00025+uPulse*.0009)*smoothstep(.05,.9,r);
  vec3 c=vec3(texture2D(tDiffuse,uv+chroma).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-chroma).b);
  c*=1.-.18*pow(length((vUv-.5)*1.1),2.);
  gl_FragColor=vec4(c,1.);
 }`
};
