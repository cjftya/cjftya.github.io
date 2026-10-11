/** Height in R, previous height in G. CFL coefficients are set in local units. */
export const pondComputeGLSL = `
uniform sampler2D pondMask;
uniform vec4 pondBounds, impulse;
uniform vec2 courant;
uniform float damping;
void main() {
  vec2 cell = 1.0 / resolution.xy;
  vec2 uv = gl_FragCoord.xy * cell;
  float mask = texture2D(pondMask, uv).r;
  vec2 state = texture2D(pondState, uv).rg;
  float east = texture2D(pondState, uv + vec2(cell.x, 0.0)).r;
  float west = texture2D(pondState, uv - vec2(cell.x, 0.0)).r;
  float north = texture2D(pondState, uv + vec2(0.0, cell.y)).r;
  float south = texture2D(pondState, uv - vec2(0.0, cell.y)).r;
  float next = (2.0 * state.x - state.y
    + courant.x * (east + west - 2.0 * state.x)
    + courant.y * (north + south - 2.0 * state.x)) * damping;
  vec2 point = pondBounds.xy + uv * pondBounds.zw;
  float influence = max(0.0, 1.0 - length(point - impulse.xy) / max(0.01, impulse.z));
  next += influence * influence * impulse.w;
  // Smooth absorbing shore and fixed channel boundary, no hard visible ring.
  gl_FragColor = vec4(clamp(next * mask, -0.35, 0.35), state.x * mask, 0.0, 1.0);
}`;

export const pondSurfaceGLSL = `
uniform sampler2D gpuPondField, gpuPondMask;
uniform vec4 gpuPondBounds;
uniform float gpuPondActive, gpuPondAmplitude;
float gpuPondHeight(vec2 p) {
  vec2 uv = (p - gpuPondBounds.xy) / gpuPondBounds.zw;
  if (uv.x <= 0.0 || uv.y <= 0.0 || uv.x >= 1.0 || uv.y >= 1.0) return 0.0;
  return texture2D(gpuPondField, uv).r * texture2D(gpuPondMask, uv).r * gpuPondAmplitude;
}
`;
