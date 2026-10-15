import { HalfFloatType, Vector2, WebGLRenderTarget } from 'three';
import type { Camera, Scene, WebGLRenderer } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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
  const output = new OutputPass();
  composer.addPass(render);
  composer.addPass(bloom);
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
      composer.render();
    },
    dispose() {
      render.dispose();
      bloom.dispose();
      output.dispose();
      composer.dispose();
    },
  };
}
