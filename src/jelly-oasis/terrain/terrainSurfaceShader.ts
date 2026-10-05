/** Extends StandardMaterial only; Three still owns lighting, shadows, fog and output. */
export const surfaceVaryings = /* glsl */ `
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
uniform float terrainScale;
uniform float terrainMacro;
uniform float terrainDebug;
`;
export const surfaceColor = /* glsl */ `
vec3 surfaceNormal = normalize(vTerrainNormal);
float slope = clamp(1.0 - surfaceNormal.y, 0.0, 1.0);
float macro = texture2D(terrainDetail, vTerrainWorld.xz / 384.0).a - 0.5;
float highland = smoothstep(terrainHeight * 0.35, terrainHeight, vTerrainWorld.y);
float basin = 1.0 - smoothstep(-terrainHeight * 0.18, 0.0, vTerrainWorld.y);
// Broad, continuous thresholds calibrated against the actual gentle heightfield.
float exposure = max(0.0, slope + macro * terrainMacro * 0.025);
float soil = smoothstep(terrainSlopes.x, terrainSlopes.y, exposure);
float stone = smoothstep(terrainSlopes.z, terrainSlopes.w, exposure);
soil = clamp(soil + highland * 0.14, 0.0, 1.0);
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
vec3 grass = terrainGrass * (1.0 + (grassDetail - 0.5) * 0.28);
vec3 dirt = terrainDirt * (1.0 + (dirtDetail - 0.5) * 0.24);
vec3 rock = terrainRock * (1.0 + (rockDetail - 0.5) * 0.32);
grass *= mix(vec3(1.0), vec3(0.82, 0.92, 0.98), basin * 0.5);
vec3 surface = grass * weights.x + dirt * weights.y + rock * weights.z;
// Preserve the old meadow / highland / basin colors as a restrained regional tint.
#ifdef USE_COLOR
surface *= mix(vec3(1.0), clamp(vColor.rgb / vec3(0.2502, 0.3916, 0.1779), vec3(0.7), vec3(1.3)), 0.18);
#endif
surface *= 1.0 + macro * terrainMacro * 0.22;
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
