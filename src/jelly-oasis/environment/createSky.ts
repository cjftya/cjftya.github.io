import {
  BackSide,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { ENVIRONMENT_CONFIG, seededRandom } from './weather';

export function createSky() {
  const group = new Group();
  group.name = 'OasisSky';
  const material = new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      zenith: { value: new Color() },
      horizon: { value: new Color() },
      midSky: { value: new Color() },
      elapsed: { value: 0 },
      night: { value: 0 },
      cloudCover: { value: 0.22 },
      cloudDarkness: { value: 0 },
      cloudsEnabled: { value: 1 },
      planetDirection: { value: new Vector3(-0.76, 0.06, -0.65).normalize() },
      companionDirection: { value: new Vector3(-0.68, 0.055, -0.74).normalize() },
      sunColor: { value: new Color() },
      sunDirection: { value: new Vector3() },
      sunStrength: { value: 1 },
      moonDirection: { value: new Vector3() },
      moonVisibility: { value: 0 },
      moonMist: { value: 0 },
    },
    vertexShader: `varying vec3 direction;
      void main() { direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 direction;
      uniform vec3 zenith, midSky, horizon, sunColor, sunDirection;
      uniform vec3 moonDirection, planetDirection, companionDirection;
      uniform float sunStrength, moonVisibility, moonMist;
      uniform float elapsed, night, cloudCover, cloudDarkness, cloudsEnabled;
      float hash(vec3 p) {
        p = fract(p * .1031); p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
      float noise3(vec3 p) {
        vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                       mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                       mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
      }
      vec2 bodyUV(vec3 ray, vec3 axis, float radius) {
        vec3 right = normalize(cross(vec3(0,1,0), axis));
        return vec2(dot(ray,right),dot(ray,cross(axis,right))) / radius;
      }
      vec3 moon(vec3 color, vec3 ray, vec3 axis, float radius, vec3 tint, float seed) {
        vec2 uv = bodyUV(ray, axis, radius);
        float r2 = dot(uv,uv);
        float edge = max(fwidth(r2), .004);
        float mask = (1. - smoothstep(1.-edge,1.+edge,r2)) * step(0.,dot(ray,axis));
        if (mask > 0.) {
          vec3 normal = vec3(uv,sqrt(max(0.,1.-r2)));
          float light = smoothstep(-.3,.8,dot(normal,normalize(vec3(-.65,.3,.7))));
          float maria = noise3(normal * 5. + seed) * .7 + noise3(normal * 13. + seed) * .3;
          vec3 surface = tint * (.26 + .74 * light) * (.65 + .35 * maria);
          color = mix(color, surface, mask * moonVisibility);
        }
        float halo = exp(-max(0.,r2-1.) * 2.5) * .05 * (1.-mask);
        return color + tint * halo * moonVisibility * step(0.,dot(ray,axis));
      }
      void main() {
        vec3 ray = normalize(direction);
        // Distinct color layers close to the horizon remain visible from the basin.
        vec3 color = mix(horizon, midSky, smoothstep(-.20,.16,ray.y));
        color = mix(color, zenith, smoothstep(.12,.8,ray.y));
        float sunDot = max(0.,dot(ray,sunDirection));
        color += sunColor * (pow(sunDot,24.)*.10 + smoothstep(.9992,.9997,sunDot)*.8) * sunStrength;
        float clearSky = 1. - cloudDarkness * .85;
        // Broad, irregular star river. It fades completely in daylight and storms.
        float river = exp(-pow((dot(ray,normalize(vec3(.2,.9,-.36))) - .24) * 9.,2.));
        float nebula = noise3(ray * 7.) * .65 + noise3(ray * 19.) * .35;
        color += mix(vec3(.08,.16,.25),vec3(.22,.09,.30),nebula) * river * nebula * night * clearSky * .62;

        // Long, domain-warped luminous ribbons fill the sky between celestial
        // bodies. Angular coordinates remain stable as the camera orbits.
        float az = atan(ray.z,ray.x);
        float warp = noise3(ray * 3.2 + vec3(0.,elapsed*.004,0.));
        float beltY = .27 + .11*sin(az*2.+warp*2.) + .045*sin(az*5.-elapsed*.008);
        float veilBand = exp(-pow((ray.y-beltY)*13.,2.));
        float ribbon = exp(-pow((ray.y-beltY+.025*sin(az*13.+warp*5.))*40.,2.));
        float breaks = smoothstep(.24,.70,noise3(ray*9.+vec3(elapsed*.003,0.,0.)));
        vec3 veilColor = mix(vec3(.025,.32,.30),vec3(.24,.09,.36),smoothstep(-.6,.8,sin(az*2.3)));
        color += veilColor * (veilBand*.42+ribbon*.34) * breaks
          * (.14+night*.86) * clearSky;

        // A huge banded gas giant, with a curved terminator and thin atmosphere.
        vec2 uv = bodyUV(ray,planetDirection,.245);
        float r2 = dot(uv,uv), edge = max(fwidth(r2),.002);
        float planetMask = (1.-smoothstep(1.-edge,1.+edge,r2)) * step(0.,dot(ray,planetDirection));
        float veil = mix(.82,.96,night) * clearSky;
        if (planetMask > 0.) {
          vec3 n = vec3(uv,sqrt(max(0.,1.-r2)));
          float curl = noise3(n * 5. + vec3(elapsed*.002,0,0));
          float latitude = dot(n,normalize(vec3(.24,.92,.31)));
          float bands = .5 + .5 * sin(latitude * 62. + curl * 3.);
          float filaments = noise3(n * 18. + vec3(elapsed*.004,0,0));
          vec3 surface = mix(vec3(.10,.18,.34),vec3(.52,.40,.64),bands*.72+filaments*.28);
          surface = mix(surface,vec3(.68,.68,.81),pow(bands,6.)*.3);
          float lit = smoothstep(-.25,.85,dot(n,normalize(vec3(-.6,.3,.75))));
          surface *= .20 + lit * .80;
          surface += vec3(.15,.34,.53) * pow(1.-n.z,3.) * .6;
          color = mix(color,surface,planetMask*veil);
        }
        color += vec3(.16,.30,.48) * exp(-abs(r2-1.)*35.) * .3 * veil * step(0.,dot(ray,planetDirection));
        color = moon(color,ray,moonDirection,.039,vec3(.76,.85,.98),11.);
        color = moon(color,ray,companionDirection,.023,vec3(.91,.67,.66),29.);

        // Two inexpensive cloud scales in the existing sky draw; no raymarching.
        vec3 p = ray * vec3(3.8,11.,3.8) + vec3(elapsed*.006,0,elapsed*.003);
        float broad = noise3(p);
        float detail = noise3(p * 2.7 + vec3(4.,1.,0.));
        float density = broad*.72 + detail*.28;
        float clouds = smoothstep(.59-cloudCover*.17,.76-cloudCover*.12,density);
        float wisps = pow(max(0.,sin(ray.y*55. + noise3(ray*8.)*5. + elapsed*.012)),6.);
        clouds = max(clouds,wisps * smoothstep(.48,.74,noise3(ray*4.)) * .24);
        clouds *= smoothstep(-.22,-.04,ray.y) * (1.-smoothstep(.65,.96,ray.y));
        vec3 cloudLight = mix(vec3(.71,.85,.83),vec3(.075,.18,.25),night);
        cloudLight = mix(cloudLight,vec3(.24,.27,.37),cloudDarkness*.72);
        vec3 cloudColor = mix(cloudLight*.62,cloudLight,smoothstep(.44,.76,density));
        // Silver/peach edges are confined to sun-facing cloud density transitions.
        float cloudEdge = smoothstep(.40,.57,density) * (1.-smoothstep(.58,.73,density));
        cloudColor += mix(vec3(.30,.20,.14),vec3(.07,.20,.22),night)
          * cloudEdge * (.35+.65*pow(sunDot,4.)) * clearSky;
        color = mix(color,cloudColor,clouds * cloudsEnabled * mix(.48,.83,cloudCover));
        gl_FragColor = vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const dome = new Mesh(new SphereGeometry(1400, 24, 12), material);
  dome.frustumCulled = false;
  dome.renderOrder = -100;
  group.add(dome);
  const random = seededRandom(1073);
  const points = new Float32Array(ENVIRONMENT_CONFIG.starCount * 3);
  for (let i = 0; i < ENVIRONMENT_CONFIG.starCount; i++) {
    const y = random() * 1.7 - 0.7;
    const angle = random() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    points.set(
      [Math.cos(angle) * r * 1300, y * 1300, Math.sin(angle) * r * 1300],
      i * 3,
    );
  }
  const starGeometry = new BufferGeometry();
  starGeometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  const starMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      brightness: { value: 0 },
      pixelRatio: { value: 1 },
      moonDirection: material.uniforms.moonDirection!,
      companionDirection: material.uniforms.companionDirection!,
      planetDirection: material.uniforms.planetDirection!,
    },
    vertexShader: `uniform float pixelRatio;
      uniform vec3 moonDirection, companionDirection, planetDirection;
      varying float unoccluded;
      void main() {
        vec3 ray = normalize(position);
        unoccluded = step(dot(ray,planetDirection),sqrt(1.-.245*.245))
          * step(dot(ray,moonDirection),sqrt(1.-.039*.039))
          * step(dot(ray,companionDirection),sqrt(1.-.023*.023));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = 2.2 * pixelRatio; }`,
    fragmentShader: `uniform float brightness; varying float unoccluded; void main() {
      float radius = length(gl_PointCoord - 0.5);
      float alpha = (1.0 - smoothstep(0.12, 0.5, radius)) * brightness * unoccluded;
      gl_FragColor = vec4(0.8, 0.86, 1.0, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
  const stars = new Points(starGeometry, starMaterial);
  stars.frustumCulled = false;
  stars.renderOrder = -90;
  group.add(stars);
  return {
    group,
    material,
    stars,
    starMaterial,
    dispose() {
      dome.geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    },
  };
}
