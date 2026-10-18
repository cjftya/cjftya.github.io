import { HalfFloatType, Vector2, WebGLRenderTarget } from 'three';
import type { Camera, Scene, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/** HDR threshold limits bloom to bright accents; only the bloom pyramid is
 * downsampled on phones, preserving the main scene's render resolution. */
export function createSanctuaryBloom(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  mobile: boolean,
) {
  const size = renderer.getSize(new Vector2());
  const target = new WebGLRenderTarget(size.x, size.y, {
    type: HalfFloatType,
    samples: mobile ? 0 : 2,
  });
  const composer = new EffectComposer(renderer, target);
  const render = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new Vector2(256, 256), 0.3, 0.5, 1.65);
  // Grade scene-linear colour before OutputPass applies tone mapping and sRGB.
  // Shadow hue is restrained; highlights keep their warm/cool source colours.
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, night: { value: 0 } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float night; varying vec2 vUv;
      void main() {
        vec4 source = texture2D(tDiffuse,vUv);
        float luma = dot(source.rgb,vec3(.2126,.7152,.0722));
        vec3 color = mix(vec3(luma),source.rgb,1.08);
        float shadows = 1.-smoothstep(.02,.38,luma);
        color *= mix(vec3(1.),vec3(.94,1.025,1.055),shadows*(.4+night*.6));
        gl_FragColor = vec4(max(color,vec3(0.)),source.a);
      }`,
  });
  const output = new OutputPass();
  composer.addPass(render);
  composer.addPass(bloom);
  composer.addPass(grade);
  composer.addPass(output);
  function resize(width: number, height: number) {
    const ratio = renderer.getPixelRatio();
    composer.setPixelRatio(ratio);
    composer.setSize(width, height);
    const scale = Math.min(
      mobile ? 0.4 : 0.6,
      1024 / Math.max(width * ratio, height * ratio),
    );
    bloom.setSize(
      Math.max(1, Math.floor(width * ratio * scale)),
      Math.max(1, Math.floor(height * ratio * scale)),
    );
  }
  resize(size.x, size.y);
  return {
    resize,
    render(night: number) {
      bloom.strength = 0.24 + Math.max(0, night) * 0.4;
      grade.uniforms.night!.value = Math.max(0, night);
      composer.render();
    },
    dispose() {
      render.dispose();
      bloom.dispose();
      grade.dispose();
      output.dispose();
      composer.dispose();
    },
  };
}
