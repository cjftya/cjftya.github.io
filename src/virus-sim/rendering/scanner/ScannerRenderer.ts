import * as THREE from 'three';
import type { ScannerAxis } from '../../observation/types';
import type { SpecimenView } from '../SpecimenView';

const TARGET_WIDTH = 320;
const TARGET_HEIGHT = 200;

export class ScannerRenderer {
  private readonly target = new THREE.WebGLRenderTarget(TARGET_WIDTH, TARGET_HEIGHT, {
    depthBuffer: true,
    stencilBuffer: false,
  });
  private readonly camera = new THREE.OrthographicCamera(-4, 4, 2.5, -2.5, 0.01, 200);
  private readonly pixels = new Uint8Array(TARGET_WIDTH * TARGET_HEIGHT * 4);
  private lastSignature = '';

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly output: HTMLCanvasElement,
  ) {
    this.output.width = TARGET_WIDTH;
    this.output.height = TARGET_HEIGHT;
  }

  invalidate(): void {
    this.lastSignature = '';
  }

  render(
    scene: THREE.Scene,
    view: SpecimenView,
    axis: ScannerAxis,
    position: number,
    thickness: number,
    signature: string,
  ): void {
    if (signature === this.lastSignature) return;
    this.lastSignature = signature;
    const clip = view.prepareScannerClipping(axis, position, thickness);
    const halfHeight = Math.max(0.2, clip.height * 0.62);
    const halfWidth = Math.max(
      0.2,
      clip.width * 0.62,
      halfHeight * (TARGET_WIDTH / TARGET_HEIGHT),
    );
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.camera.position
      .copy(clip.center)
      .addScaledVector(clip.direction, Math.max(12, clip.depth * 2));
    this.camera.up.copy(clip.up);
    this.camera.lookAt(clip.center);
    this.camera.updateMatrixWorld(true);

    const ambience = scene.getObjectByName('decorative-particles');
    const ambienceVisible = ambience?.visible ?? false;
    if (ambience) ambience.visible = false;
    const previousTarget = this.renderer.getRenderTarget();
    const previousAutoClear = this.renderer.autoClear;
    const previousScissorTest = this.renderer.getScissorTest();
    const previousViewport = this.renderer.getViewport(new THREE.Vector4());
    const previousScissor = this.renderer.getScissor(new THREE.Vector4());
    const previousClear = this.renderer.getClearColor(new THREE.Color());
    const previousAlpha = this.renderer.getClearAlpha();
    try {
      this.renderer.autoClear = true;
      this.renderer.setScissorTest(false);
      this.renderer.setRenderTarget(this.target);
      this.renderer.setViewport(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
      this.renderer.setScissor(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
      this.renderer.setClearColor(0x071421, 1);
      this.renderer.clear(true, true, true);
      this.renderer.render(scene, this.camera);
      this.renderer.readRenderTargetPixels(
        this.target,
        0,
        0,
        TARGET_WIDTH,
        TARGET_HEIGHT,
        this.pixels,
      );
      this.copyToCanvas();
    } finally {
      clip.restore();
      if (ambience) ambience.visible = ambienceVisible;
      this.renderer.setRenderTarget(previousTarget);
      this.renderer.setViewport(previousViewport);
      this.renderer.setScissor(previousScissor);
      this.renderer.autoClear = previousAutoClear;
      this.renderer.setScissorTest(previousScissorTest);
      this.renderer.setClearColor(previousClear, previousAlpha);
    }
  }

  clear(message = '스캐너를 켜면 실제 모델의 얇은 단층이 여기에 보여요.'): void {
    if (this.lastSignature === '__clear__') return;
    this.lastSignature = '__clear__';
    const context = this.output.getContext('2d');
    if (!context) return;
    context.fillStyle = '#071421';
    context.fillRect(0, 0, this.output.width, this.output.height);
    context.fillStyle = '#9ab7c7';
    context.font = '15px sans-serif';
    context.textAlign = 'center';
    context.fillText(message, this.output.width / 2, this.output.height / 2);
  }

  dispose(): void {
    this.target.dispose();
  }

  private copyToCanvas(): void {
    const context = this.output.getContext('2d');
    if (!context) return;
    const image = context.createImageData(TARGET_WIDTH, TARGET_HEIGHT);
    for (let y = 0; y < TARGET_HEIGHT; y += 1) {
      const sourceY = TARGET_HEIGHT - y - 1;
      for (let x = 0; x < TARGET_WIDTH; x += 1) {
        const source = (sourceY * TARGET_WIDTH + x) * 4;
        const destination = (y * TARGET_WIDTH + x) * 4;
        image.data[destination] = this.pixels[source]!;
        image.data[destination + 1] = this.pixels[source + 1]!;
        image.data[destination + 2] = this.pixels[source + 2]!;
        image.data[destination + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }
}
