import { MeshStandardMaterial } from 'three';

export const flowNoiseGLSL = `
float rwHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float rwNoise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(rwHash(i),rwHash(i+vec2(1,0)),f.x),
    mix(rwHash(i+vec2(0,1)),rwHash(i+vec2(1,1)),f.x),f.y);
}
float rwFbm(vec2 p) { return rwNoise(p)*0.57+rwNoise(p*2.13+7.1)*0.29+rwNoise(p*4.57-3.8)*0.14; }
`;

/** Geometry and aeration are transported with travel time, so falling features accelerate. */
export function createFlowMaterial(
  time: { value: number },
  falling: boolean,
  seed: number,
  aerated = false,
  dynamics = false,
  deform = true,
) {
  const material = new MeshStandardMaterial({
    color: dynamics ? '#b7c5c3' : aerated ? '#d8e8e5' : falling ? '#98bdc0' : '#9bbdc0',
    roughness: dynamics ? 0.12 : aerated ? 0.52 : falling ? 0.38 : 0.27,
    metalness: 0,
    transparent: true,
    opacity: dynamics ? 0.42 : aerated ? 0.68 : falling ? 0.94 : 0.62,
    depthWrite: false,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { rwTime: time, rwSeed: { value: seed } });
    const declarations = `uniform float rwTime,rwSeed; varying vec2 rwCoord; varying float rwProgress; ${dynamics ? 'varying float rwThickness;' : ''}\n${flowNoiseGLSL}`;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
      ${declarations}
      attribute float travelTime; attribute float flowProgress;
      ${dynamics ? 'attribute float filmDepth;' : ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        rwCoord=vec2(uv.x,travelTime); rwProgress=flowProgress;
        ${dynamics ? 'rwThickness=filmDepth;' : ''}
        ${
          falling && deform
            ? `
        float age=travelTime-rwTime;
        float anchor=sin(clamp(flowProgress,0.0,1.0)*3.14159265);
        float swell=rwFbm(vec2(age*8.3,rwSeed*3.7));
        float tear=rwNoise(vec2(age*17.3,uv.x*6.1+rwSeed*2.7));
        transformed += normal * ((swell-0.45)*0.17+(tear-0.5)*0.11)*anchor;
        transformed.x += (rwNoise(vec2(age*4.7,rwSeed))-0.5)*0.12*anchor;
        transformed.z += (rwNoise(vec2(age*7.1,rwSeed+9.1))-0.5)*0.13*anchor;`
            : ''
        }`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${declarations}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float age=rwCoord.y-rwTime;
        vec2 advected=vec2(rwCoord.x*6.7+rwSeed*1.9,age*${falling ? '16.0' : '5.3'});
        float density=rwFbm(advected);
        float fine=rwNoise(advected*vec2(3.1,1.7));
        float bubbles=smoothstep(${aerated ? '0.32,0.7' : '0.49,0.82'},density);
        float entrained = ${falling ? 'pow(rwProgress, 1.4) * 0.18' : '0.0'};
        float white=clamp(entrained+bubbles*${dynamics ? '0.15' : falling ? '0.76' : '0.55'} + smoothstep(0.68,0.92,fine)*0.15,0.0,0.88);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.86,0.93,0.92),white);
        ${dynamics ? 'diffuseColor.a *= clamp(0.34 + (1.0-exp(-rwThickness*20.0))*1.2 + bubbles*0.16, 0.72, 1.1);' : aerated ? 'diffuseColor.a *= smoothstep(0.2,0.53,density);' : 'diffuseColor.a *= 0.72+0.28*density;'}
        ${falling && !aerated ? 'diffuseColor.a *= mix(1.0,smoothstep(0.17,0.42,density),smoothstep(0.35,0.97,rwProgress)*0.6);' : ''}
        ${!falling ? `diffuseColor.a *= 1.0-smoothstep(${dynamics ? '0.34' : '0.3'},0.5,abs(rwCoord.x-0.5));` : ''}`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        ${falling ? 'normal = normalize(cross(dFdx(vViewPosition),dFdy(vViewPosition)));' : ''}
        normal = normalize(normal + vec3((fine-0.5)*${dynamics ? '0.26' : '0.16'},(density-0.5)*${dynamics ? '0.20' : '0.12'},0.0));`,
      );
  };
  material.customProgramCacheKey = () =>
    `real-flow-${dynamics ? 8 : 6}-${falling}-${aerated}-${seed}-${deform}`;
  return material;
}
