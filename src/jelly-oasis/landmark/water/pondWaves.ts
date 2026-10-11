import { flowNoiseGLSL } from './flowMaterial';

// One height field drives displacement, optical normals and advected foam.
// Packets have jittered origins, lifetimes and directional envelopes, not fixed rings.
export const realPondFieldGLSL = `
${flowNoiseGLSL}
float waterHeight(vec2 p,float depth) {
  float time=waterTime;
  vec2 delta=p-waterImpact.xy;
  float radius=length(delta);
  vec2 drift=(delta/max(radius,0.2)+waterFlowDirection*0.45)*exp(-radius*0.28)*waterImpact.z;
  vec2 advected=p-drift*time*0.18;
  float ambient=sin(dot(p,vec2(1.31,0.73))-time*0.68)*0.016
    +sin(dot(p,vec2(-2.17,2.63))-time*0.97)*0.009
    +sin(dot(p,vec2(5.37,3.91))+time*1.19)*0.003;
  float packets=0.0;
  for(int i=0;i<5;i++) {
    float f=float(i);
    float cycle=time/(2.13+f*0.371)+f*0.73;
    float birth=floor(cycle);
    float age=fract(cycle)*(2.13+f*0.371);
    float seed=rwHash(vec2(birth,f+3.1));
    vec2 origin=waterImpact.xy+(vec2(rwHash(vec2(birth,f)),seed)-0.5)*0.85;
    vec2 d=p-origin;
    float r=length(d*vec2(1.0+seed*0.2,0.84+f*0.031));
    float front=age*(1.6+seed*0.7);
    float envelope=exp(-pow((r-front)/(0.34+age*0.16),2.0));
    vec2 direction=normalize(vec2(cos(f*2.39996+seed),sin(f*2.39996+seed))+waterFlowDirection*0.4);
    float directional=pow(0.5+0.5*dot(d/max(length(d),0.1),direction),2.0);
    float warp=(rwNoise(p*1.6+f*3.1)-0.5)*0.35;
    packets+=sin((r-front+warp)*(6.7+seed*2.3))*envelope*directional
      *smoothstep(0.0,0.22,age)*exp(-age*0.82)*0.054;
  }
  float turbulence=(rwFbm(advected*4.1+vec2(time*-0.71,time*0.39))-0.5)
    *exp(-radius*0.95)*0.13;
  return (ambient+(packets+turbulence)*waterImpact.z)*smoothstep(0.02,0.45,depth);
}
float waterFoam(vec2 p,float depth) {
  vec2 d=p-waterImpact.xy;
  float r=length(d*vec2(0.88,1.12));
  vec2 drift=(d/max(length(d),0.2)+waterFlowDirection*0.45)*(0.3+0.35*exp(-r*0.6));
  float swirl=waterTime*0.7*exp(-r*0.8);
  mat2 rotation=mat2(cos(swirl),-sin(swirl),sin(swirl),cos(swirl));
  vec2 advected=rotation*d-drift*waterTime;
  float cells=rwFbm(advected*5.1+vec2(0.1,-waterTime*0.2));
  float breakup=rwNoise(d*13.7-drift*waterTime*2.3);
  float brokenRadius=max(0.0,r+(rwNoise(d*3.9-waterTime*0.31)-0.5)*0.37);
  float source=exp(-brokenRadius*brokenRadius*1.4);
  float trails=exp(-r*0.86)*smoothstep(0.46,0.78,cells)*smoothstep(0.24,0.71,breakup);
  return clamp((source*(0.36+0.55*cells)+trails*0.8)*waterImpact.z,0.0,0.92)
    *smoothstep(0.02,0.28,depth);
}
`;
