import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** Grade scene-linear HDR in OutputPass before its existing tone mapping/sRGB.
 * This saves one full-resolution draw, HDR write and subsequent texture fetch.
 * Keep Three's output implementation so exposure/colour-space changes still work.
 */
export function createSanctuaryOutput() {
  const output = new OutputPass();
  const sample = 'gl_FragColor = texture2D( tDiffuse, vUv );';
  const sampler = 'uniform sampler2D tDiffuse;';
  const fragment = output.material.fragmentShader;
  if (!fragment.includes(sample) || !fragment.includes(sampler)) {
    output.dispose();
    throw new Error('OutputPass shader changed; review sanctuary grading integration.');
  }
  output.uniforms.night = { value: 0 };
  output.material.fragmentShader = fragment
    .replace(sampler, `${sampler}\n uniform float night;`)
    .replace(
      sample,
      `${sample}
      float luma = dot(gl_FragColor.rgb, vec3(.2126,.7152,.0722));
      vec3 color = mix(vec3(luma), gl_FragColor.rgb, 1.08);
      float shadows = 1. - smoothstep(.02,.38,luma);
      color *= mix(vec3(1.),vec3(.94,1.025,1.055),shadows*(.4+night*.6));
      gl_FragColor.rgb = max(color, vec3(0.));`,
    );
  return output;
}
