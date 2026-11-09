// GLSL for the piece. Every string is plain WebGL 2 GLSL that Three.js ShaderMaterial compiles.

export const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

/* Weak-field point lens: moves a world-space point to where its primary image appears.
   theta = (beta + sqrt(beta^2 + 4 thetaE^2)) / 2, thetaE^2 = 2 r_s D_ls / (D_l D_s). */
export const LENS = /* glsl */`
uniform vec3 uCamPos;
uniform float uLens;
vec3 lensWorld(vec3 P){
  vec3 C = uCamPos;
  float Dl = length(C);
  vec3 lh = -C / Dl;
  vec3 V = P - C;
  float Dp = length(V);
  if (Dp < 1e-4) return P;
  vec3 vh = V / Dp;
  float cb = dot(vh, lh);
  float Ds = Dp * cb;
  if (Ds <= Dl) return P;
  float Dls = Ds - Dl;
  float beta = acos(clamp(cb, -1.0, 1.0));
  float thE2 = 2.0 * Dls / (Dl * Ds) * uLens;
  float theta = 0.5 * (beta + sqrt(beta * beta + 4.0 * thE2));
  vec3 perp = vh - lh * cb;
  float pl = length(perp);
  perp = pl > 1e-6 ? perp / pl : normalize(cross(lh, vec3(0.0, 1.0, 0.0)));
  return C + (lh * cos(theta) + perp * sin(theta)) * Dp;
}
`;

export const BH_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** Black hole: integrates one Schwarzschild null geodesic per pixel, x'' = -1.5 h^2 x / r^5. */
export const BH_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform mat4 uInvProj, uCamWorld;
uniform vec3 uCamPos;
uniform float uTime, uEpoch, uHeat, uDiskGlow, uGCam, uCamR, uBirth, uPix, uGlow, uOmK;
${NOISE}
const float RIN = 3.0;
const float ROUT = 16.0;
const float ESC = 23.0;

vec3 hash33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float fbm4(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * snoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s * 0.5 + 0.5; }

vec3 starColor(float t){
  vec3 c = mix(vec3(1.0, 0.42, 0.22), vec3(1.0, 0.80, 0.56), smoothstep(0.0, 0.4, t));
  c = mix(c, vec3(1.0, 0.97, 0.93), smoothstep(0.35, 0.7, t));
  return mix(c, vec3(0.62, 0.76, 1.0), smoothstep(0.7, 1.0, t));
}
vec3 starLayer(vec3 d, float scale, float dens, float bright, float seed){
  // 2D grid on the six cube faces, 3x3 neighbourhood so no star is ever clipped by its cell
  vec3 ad = abs(d); vec2 uv; float face;
  if (ad.x >= ad.y && ad.x >= ad.z) { uv = d.yz / ad.x; face = d.x > 0.0 ? 0.0 : 1.0; }
  else if (ad.y >= ad.z) { uv = d.xz / ad.y; face = d.y > 0.0 ? 2.0 : 3.0; }
  else { uv = d.xy / ad.z; face = d.z > 0.0 ? 4.0 : 5.0; }
  vec2 gp = uv * scale;
  vec2 cell = floor(gp);
  float sig0 = max(uPix * scale * 0.55, 0.012);
  vec3 acc = vec3(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = cell + vec2(float(i), float(j));
    vec3 h = hash33(vec3(c, face * 131.0 + seed));
    if (h.x > dens) continue;
    vec3 h2 = hash33(vec3(c, face * 131.0 + seed + 17.3));
    vec2 sp = c + 0.5 + (h2.xy - 0.5) * 0.7;
    float dist = length(gp - sp);
    float temp = pow(h.y, 1.5);
    float mag = 0.2 + pow(h.z, 24.0) * bright;
    float death = mix(14.0, 10.8, temp) + (h2.z - 0.5) * 0.8;
    float born = smoothstep(8.4, 9.6, uEpoch + h2.y * 0.6);
    float life = (1.0 - smoothstep(death - 0.35, death, uEpoch)) * born;
    float nx = (uEpoch - death + 0.32) * 12.0;
    float nova = temp > 0.72 ? exp(-nx * nx) * 40.0 : 0.0;
    float sig = sig0 * (1.0 + mag * 0.04 + nova * 0.03);
    acc += starColor(temp) * exp(-dist * dist / (sig * sig)) * (mag * life + nova * born);
  }
  return acc;
}
vec3 nebula(vec3 d){
  vec3 n = normalize(vec3(0.32, 0.86, -0.40));
  float b = dot(d, n);
  float band = exp(-b * b * 9.0);
  float f1 = fbm4(d * 2.2 + 3.1);
  float f2 = fbm4(d * 5.5 - 1.7);
  float lanes = smoothstep(0.42, 0.72, fbm4(d * 3.6 + 9.0));
  vec3 c = mix(vec3(0.05, 0.09, 0.19), vec3(0.22, 0.09, 0.25), smoothstep(0.3, 0.8, f1));
  c = mix(c, vec3(0.42, 0.25, 0.12), smoothstep(0.62, 0.95, f2) * 0.55);
  float dens = band * (0.25 + 1.1 * f1 * f2) * (1.0 - 0.8 * lanes);
  return c * dens * 0.6 + vec3(0.003, 0.005, 0.011) * (0.5 + band);
}
vec3 sky(vec3 d){
  float E = uEpoch;
  vec3 c = vec3(0.0);
  float neb = (1.0 - smoothstep(10.4, 12.6, E)) * smoothstep(7.0, 9.6, E);
  if (neb > 0.002) c += nebula(d) * neb;
  vec3 n = normalize(vec3(0.32, 0.86, -0.40));
  float band = exp(-pow(dot(d, n), 2.0) * 6.0);
  if (E < 14.5 && E > 8.0) {
    c += starLayer(d, 38.0, 0.07, 14.0, 0.0);
    c += starLayer(d, 95.0, 0.10 + 0.22 * band, 3.0, 31.0) * 0.55;
    c += starLayer(d, 210.0, 0.06 + 0.34 * band, 1.0, 77.0) * 0.3;
  }
  if (uBirth > 0.001) {
    float f = fbm4(d * 3.0 + 2.0);
    vec3 cmb = mix(vec3(1.0, 0.36, 0.12), vec3(1.0, 0.82, 0.55), f) * (0.25 + 1.3 * f);
    c = mix(c, cmb * (0.4 + 9.0 * uBirth * uBirth), smoothstep(0.0, 0.5, uBirth));
  }
  // light falling into a deep potential well is blueshifted for a hovering observer
  float bs = uGCam - 1.0;
  c = mix(c, vec3(dot(c, vec3(0.3, 0.5, 0.2))) * vec3(0.7, 0.86, 1.25), clamp(bs * 0.8, 0.0, 0.85));
  return c * (1.0 + bs * bs * 2.0);
}

vec3 bb(float t){
  vec3 c = mix(vec3(0.35, 0.03, 0.01), vec3(1.0, 0.30, 0.05), smoothstep(0.0, 0.45, t));
  c = mix(c, vec3(1.0, 0.66, 0.30), smoothstep(0.35, 0.8, t));
  c = mix(c, vec3(1.0, 0.93, 0.80), smoothstep(0.75, 1.25, t));
  return mix(c, vec3(0.70, 0.82, 1.0), smoothstep(1.3, 2.0, t));
}
float diskNoise(float r, float a, float seed){
  vec3 q = vec3(cos(a) * 3.2, sin(a) * 3.2, r * 1.35 + seed);
  float n = snoise(q) * 0.5;
  n += snoise(q * vec3(2.1, 2.1, 2.4) + 11.0) * 0.27;
  n += snoise(q * vec3(4.4, 4.4, 5.0) + 23.0) * 0.14;
  n += snoise(q * vec3(9.0, 9.0, 10.0) + 37.0) * 0.07;
  return n * 0.5 + 0.5;
}
vec4 disk(vec3 hit, vec3 v){
  float r = length(hit.xz);
  if (r < RIN - 0.3 || r > ROUT) return vec4(0.0);
  float phi = atan(hit.z, hit.x);
  float om = uOmK * pow(r, -1.5);
  const float T = 20.0;
  float t1 = fract(uTime / T), t2 = fract(uTime / T + 0.5);
  float w = abs(t1 * 2.0 - 1.0);
  float n = mix(diskNoise(r, phi - om * t1 * T, 0.0), diskNoise(r, phi - om * t2 * T, 5.7), w);
  float inner = smoothstep(RIN - 0.3, RIN + 0.9, r);
  float outer = 1.0 - smoothstep(ROUT * 0.42, ROUT, r);
  float rings = 0.8 + 0.2 * sin(r * 31.0 + n * 5.0) * sin(r * 7.3 + 1.3);
  float dens = inner * outer * (0.22 + 1.15 * smoothstep(0.2, 0.92, n)) * rings;
  float xr = max(r / RIN, 1.0001);
  float tp = pow(xr, -0.75) * pow(max(1.0 - inversesqrt(xr), 0.0), 0.25) / 0.488;
  tp = max(tp, 0.12 * (1.0 - smoothstep(RIN - 0.3, RIN + 0.9, r)));
  vec3 vd = normalize(vec3(-hit.z, 0.0, hit.x));
  float beta = sqrt(0.5 / (r - 1.0));
  float gam = inversesqrt(1.0 - beta * beta);
  float dop = 1.0 / (gam * (1.0 - beta * dot(vd, -normalize(v))));
  float g = dop * sqrt(1.0 - 1.0 / r) * uGCam;
  float tObs = tp * g * uHeat * (0.8 + 0.4 * n);
  vec3 c = bb(tObs) * pow(g, 3.0) * pow(tp, 1.4) * (0.45 + 0.85 * n) * 1.55 * uDiskGlow;
  return vec4(c, clamp(dens * 1.05, 0.0, 0.95));
}

void main(){
  vec2 ndc = vUv * 2.0 - 1.0;
  vec4 pv = uInvProj * vec4(ndc, 1.0, 1.0);
  vec3 dir = normalize((uCamWorld * vec4(pv.xyz / pv.w, 0.0)).xyz);
  vec3 p = uCamPos;
  vec3 v = dir;
  vec3 col = vec3(0.0);
  float T = 1.0;
  float glow = 0.0;
  vec3 hv = cross(p, v);
  float h2 = dot(hv, hv);
  bool escaped = false;
  float capR = min(1.02, 1.0 + (uCamR - 1.0) * 0.5);
  if (sqrt(h2) > ESC - 1.0 && uCamR > ESC) {
    escaped = true;
  } else {
    for (int i = 0; i < 320; i++) {
      float r2 = dot(p, p);
      float r = sqrt(r2);
      float dt = r * mix(0.04, 0.13, smoothstep(1.8, 9.0, r));
      v += -1.5 * h2 * p / (r2 * r2 * r) * dt;
      vec3 np = p + v * dt;
      if (p.y * np.y < 0.0) {
        float t = p.y / (p.y - np.y);
        vec4 d = disk(mix(p, np, t), v);
        col += T * d.rgb * d.a;
        T *= 1.0 - d.a;
      }
      float nr = length(np);
      p = np;
      if (nr < capR) { T = 0.0; break; }
      if (nr > ESC && dot(p, v) > 0.0) { escaped = true; break; }
      if (T < 0.01) break;
    }
  }
  if (escaped && T > 0.005) {
    vec3 vn = normalize(v);
    float s = dot(p, vn);
    vec3 bv = p - s * vn;
    float bl = max(length(bv), 1e-3);
    float alpha = (1.0 / bl) * (1.0 - s / sqrt(s * s + bl * bl));
    vec3 fd = normalize(vn * cos(alpha) - (bv / bl) * sin(alpha));
    col += T * sky(fd);
  }
  float bimp = sqrt(h2);
  glow = exp(-pow((bimp - 2.62) * 7.0, 2.0)) + (bimp > 2.6 ? exp(-(bimp - 2.6) * 1.3) * 0.22 : 0.0);
  vec3 gc = mix(vec3(0.45, 0.32, 0.85) * 0.5, mix(vec3(1.0, 0.5, 0.2), vec3(1.0, 0.86, 0.68), uHeat), smoothstep(0.02, 0.4, uHeat));
  col += glow * gc * uGlow * uGCam;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Final grade: chromatic aberration, freeze desaturation, ACES, split tone, vignette, grain, white-out. */
export const FINAL_FRAG = /* glsl */`
  uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime, uFreeze, uWhite, uDive, uExposure, uGrain;
  varying vec2 vUv;
  vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
  float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  void main(){
    vec2 cc = vUv - 0.5;
    float r2 = dot(cc, cc);
    float ca = (0.0025 + uDive * 0.012 + uFreeze * 0.004) * r2 * 4.0;
    vec3 col = vec3(texture2D(tDiffuse, vUv - cc * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + cc * ca).b);
    col *= uExposure;
    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(col, l * vec3(0.72, 0.9, 1.18), uFreeze * 0.8);
    col = aces(col);
    float lt = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(col * vec3(0.9, 0.97, 1.1) + vec3(0.002, 0.004, 0.009), col, smoothstep(0.0, 0.3, lt));
    float vig = 1.0 - smoothstep(0.35, 1.15, length(cc * vec2(uRes.x / uRes.y, 1.0)) * 1.15);
    col *= mix(1.0, vig, 0.8);
    col = pow(max(col, 0.0), vec3(1.0 / 2.2));
    col += (hash(vUv * uRes + fract(uTime * 7.31) * 311.0) - 0.5) * uGrain;
    col = mix(col, vec3(0.985, 0.975, 0.955), uWhite);
    gl_FragColor = vec4(col, 1.0);
  }`;

/** Screen-space lines with a minimum pixel width, lensed per endpoint. Quads wind either way, so draw both sides. */
export const LINE_VERT = /* glsl */`
${LENS}
uniform vec2 uRes; uniform float uPx, uRot, uHand, uReveal, uDim, uSweepK;
attribute vec3 aOther; attribute float aSide; attribute float aEnd; attribute float aWidth;
attribute vec4 aCol; attribute float aAng; attribute float aOrder;
varying vec4 vC; varying float vD; varying float vH;
vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z); }
vec4 clipOf(vec3 p){ vec4 w = modelMatrix * vec4(rotY(p, uRot), 1.0); w.xyz = lensWorld(w.xyz); return projectionMatrix * viewMatrix * w; }
void main(){
  vec4 c0 = clipOf(position);
  vec4 c1 = clipOf(aOther);
  if (c0.w < 0.05 || c1.w < 0.05) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vC = vec4(0.0); vD = 0.0; vH = 0.0; return; }
  vec2 hr = uRes * 0.5;
  vec2 s0 = c0.xy / c0.w * hr, s1 = c1.xy / c1.w * hr;
  vec2 dir = s1 - s0; float L = length(dir);
  dir = (L > 1e-4 ? dir / L : vec2(1.0, 0.0)) * aEnd;
  vec2 nrm = vec2(-dir.y, dir.x);
  float wpx = aWidth * uPx / c0.w;
  float wd = max(wpx, 1.3);
  float hw = wd * 0.5 + 1.0;
  gl_Position = c0;
  gl_Position.xy += nrm * aSide * hw / hr * c0.w;
  vD = aSide * hw; vH = wd * 0.5;
  float d = mod(uHand - aAng + 12.566370, 6.283185);
  float sweep = exp(-min(d, 6.283185 - d) * min(d, 6.283185 - d) * 60.0) * 2.2 + exp(-d * 1.6) * 0.7;
  float rev = smoothstep(aOrder, aOrder + 0.03, uReveal);
  vC = vec4(aCol.rgb * aCol.a * (1.0 + sweep * uSweepK) * uDim * min(1.0, wpx / 1.3 + 0.25) * (0.15 + 0.85 * smoothstep(12.0, 30.0, c0.w)), rev);
}`;

export const LINE_FRAG = /* glsl */`
varying vec4 vC; varying float vD; varying float vH;
void main(){
  float a = clamp(vH + 0.5 - abs(vD), 0.0, 1.0) * vC.a;
  if (a <= 0.001) discard;
  float x = abs(vD) / max(vH, 0.5);
  float beam = vH > 2.5 ? mix(1.0, 0.25, x * x) : 1.0;
  gl_FragColor = vec4(vC.rgb * beam, a);
}`;
