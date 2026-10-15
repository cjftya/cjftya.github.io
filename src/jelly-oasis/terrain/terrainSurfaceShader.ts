import { meadowFieldGLSL } from '../meadow/meadowField';
/** Extends StandardMaterial only; Three still owns lighting, shadows, fog and output. */
export const surfaceVaryings = /* glsl */ `
varying float vTerrainBasin;
varying vec3 vTerrainWorld;
varying vec3 vTerrainNormal;
`;
export const surfaceUniforms = /* glsl */ `
uniform sampler2D terrainDetail;
uniform vec3 terrainGrass;
uniform vec3 terrainDirt;
uniform vec3 terrainRock;
uniform vec4 terrainSlopes;
uniform float terrainHeight;
uniform float terrainWorldSize;
uniform float terrainScale;
uniform float terrainMacro;
uniform float terrainDebug;
`;
export const surfaceColor = /* glsl */ `
vec3 surfaceNormal = normalize(cross(dFdx(vTerrainWorld), dFdy(vTerrainWorld)));
if (surfaceNormal.y < 0.) surfaceNormal = -surfaceNormal;
float slope = clamp(1.0 - surfaceNormal.y, 0.0, 1.0);
float macro = texture2D(terrainDetail, vTerrainWorld.xz / 384.0).a - 0.5;
float highland = smoothstep(terrainHeight * 0.35, terrainHeight, vTerrainWorld.y);
// Broad, continuous thresholds calibrated against the actual gentle heightfield.
float exposure = max(0.0, slope + macro * terrainMacro * 0.025);
float soil = smoothstep(terrainSlopes.x, terrainSlopes.y, exposure);
float stone = smoothstep(terrainSlopes.z, terrainSlopes.w, exposure);
soil = clamp(soil + highland * 0.14, 0.0, 1.0);
// Underwater sediment retains its regional colour instead of acquiring the
// mountain's alternating dirt/rock bands on every small change of bed slope.
soil *= 1.0 - vTerrainBasin * 0.92;
stone *= 1.0 - vTerrainBasin * 0.98;
vec3 weights = vec3((1.0 - soil) * (1.0 - stone), soil * (1.0 - stone), stone);
// Six fetches total: macro + grass + dirt + three rock projections.
float grassDetail = texture2D(terrainDetail, vTerrainWorld.xz / (9.0 * terrainScale)).r;
float dirtDetail = texture2D(terrainDetail, (vTerrainWorld.xz + vec2(37.0, 19.0)) / (12.0 * terrainScale)).g;
vec3 projection = pow(abs(surfaceNormal), vec3(4.0));
projection /= max(dot(projection, vec3(1.0)), 0.0001);
vec3 rockPosition = vTerrainWorld / (18.0 * terrainScale);
float rockDetail = texture2D(terrainDetail, rockPosition.yz).b * projection.x
  + texture2D(terrainDetail, rockPosition.xz).b * projection.y
  + texture2D(terrainDetail, rockPosition.xy).b * projection.z;
// Vertex colour is the regional base, not a clamped tint on uniform grass.
// Pond-bank meshes without vertex colours retain the material's green fallback.
vec3 regional = terrainGrass;
#ifdef USE_COLOR
regional = vColor.rgb;
#endif
vec3 grass = regional * (1.0 + (grassDetail - 0.5) * 0.12);
// Reuse existing samples for soft moss/soil mottling without another fetch.
float mossPatch = smoothstep(.40,.64,grassDetail + macro*.22) * (1.-stone) * (1.-vTerrainBasin);
grass = mix(grass, regional * vec3(.80,.94,.87), mossPatch * .42);
float dryPatch = smoothstep(.55,.72,dirtDetail - macro*.12) * (1.-vTerrainBasin);
grass = mix(grass, mix(regional,terrainDirt,.33), dryPatch*.35);
${meadowFieldGLSL}
vec3 dirt = mix(terrainDirt, regional, 0.12) * (1.0 + (dirtDetail - 0.5) * 0.16);
vec3 rock = mix(terrainRock, regional, 0.08) * (1.0 + (rockDetail - 0.5) * 0.20) * (1.0 + .025*sin(vTerrainWorld.y*1.4));
vec3 surface = grass * weights.x + dirt * weights.y + rock * weights.z;
surface *= 1.0 + macro * terrainMacro * 0.12;
diffuseColor.rgb *= surface;
`;
export const surfaceRoughness = /* glsl */ `
roughnessFactor *= clamp(dot(weights, vec3(0.98, 0.95, 0.90)) + (rockDetail - 0.5) * 0.06, 0.85, 1.0);
`;
/** Debug replaces lit output, then goes through the standard output color space. */
export const surfaceDebug = /* glsl */ `
if (terrainDebug > 0.5) {
  vec3 debugColor = weights;
  if (terrainDebug > 1.5 && terrainDebug < 2.5) debugColor = vec3(weights.x);
  if (terrainDebug > 2.5 && terrainDebug < 3.5) debugColor = vec3(weights.y);
  if (terrainDebug > 3.5 && terrainDebug < 4.5) debugColor = vec3(weights.z);
  if (terrainDebug > 4.5 && terrainDebug < 5.5) debugColor = vec3(slope);
  if (terrainDebug > 5.5) debugColor = vec3(macro + 0.5);
  gl_FragColor.rgb = debugColor;
}
`;
