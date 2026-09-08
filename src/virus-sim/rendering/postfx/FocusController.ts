import type * as THREE from 'three';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import type { ExperienceStage } from '../../experience/ExperienceState';
import type { ExperienceQuality } from '../quality/quality';

export class FocusController {
  private readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly bokehPass: BokehPass;
  private readonly outputPass: OutputPass;
  private quality: ExperienceQuality = 'standard';
  private stage: ExperienceStage = 'observe';

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
  ) {
    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.bokehPass = new BokehPass(scene, camera, {
      focus: 8,
      aperture: 0.000012,
      maxblur: 0.0025,
    });
    this.outputPass = new OutputPass();
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bokehPass);
    this.composer.addPass(this.outputPass);
  }

  setQuality(quality: ExperienceQuality): void {
    this.quality = quality;
    this.bokehPass.enabled = quality !== 'performance';
    this.setUniform('maxblur', quality === 'enhanced' ? 0.0055 : 0.0026);
  }

  setStage(stage: ExperienceStage): void {
    this.stage = stage;
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
  }

  render(focusTarget: THREE.Vector3): void {
    if (this.quality === 'performance') {
      this.composer.renderer.render(this.renderPass.scene, this.camera);
      return;
    }
    const focusDistance = Math.max(0.05, this.camera.position.distanceTo(focusTarget));
    this.setUniform('focus', focusDistance);
    this.setUniform('aperture', stageAperture(this.stage, this.quality));
    this.composer.render();
  }

  dispose(): void {
    this.renderPass.dispose();
    this.bokehPass.dispose();
    this.outputPass.dispose();
    this.composer.dispose();
  }

  private setUniform(name: string, value: number): void {
    const uniforms = this.bokehPass.uniforms as Record<
      string,
      { value: number } | undefined
    >;
    const uniform = uniforms[name];
    if (uniform) uniform.value = value;
  }
}

function stageAperture(stage: ExperienceStage, quality: ExperienceQuality): number {
  const multiplier = quality === 'enhanced' ? 1.35 : 1;
  switch (stage) {
    case 'surface':
      return 0.000045 * multiplier;
    case 'interior':
      return 0.000055 * multiplier;
    case 'documentary':
      return 0.000032 * multiplier;
    case 'approach':
      return 0.000022 * multiplier;
    default:
      return 0.000012 * multiplier;
  }
}
