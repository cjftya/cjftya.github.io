import {
  AdditiveBlending,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  SphereGeometry,
} from 'three';

export class Sun {
  readonly object = new Group();

  private readonly geometry = new SphereGeometry(1.15, 32, 24);
  private readonly coreMaterial = new MeshBasicMaterial({ color: '#ffd28a' });
  private readonly innerGlowMaterial = new MeshBasicMaterial({
    color: '#ffb95f',
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  private readonly outerGlowMaterial = new MeshBasicMaterial({
    color: '#ff8f58',
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  private readonly innerGlow = new Mesh(this.geometry, this.innerGlowMaterial);
  private readonly outerGlow = new Mesh(this.geometry, this.outerGlowMaterial);
  private readonly prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  private elapsedSeconds = 0;

  constructor() {
    const core = new Mesh(this.geometry, this.coreMaterial);
    const light = new PointLight('#ffe0ad', 105, 82, 1.45);

    this.innerGlow.scale.setScalar(1.62);
    this.outerGlow.scale.setScalar(2.18);
    this.outerGlow.renderOrder = -1;
    this.object.add(this.outerGlow, this.innerGlow, core, light);
  }

  update(deltaSeconds: number): void {
    if (this.prefersReducedMotion) {
      return;
    }

    this.elapsedSeconds += deltaSeconds;
    const pulse = Math.sin(this.elapsedSeconds * 1.15);
    this.innerGlow.scale.setScalar(1.62 + pulse * 0.035);
    this.outerGlow.scale.setScalar(2.18 + pulse * 0.065);
    this.innerGlowMaterial.opacity = 0.14 + pulse * 0.012;
    this.outerGlowMaterial.opacity = 0.055 + pulse * 0.008;
  }

  dispose(): void {
    this.geometry.dispose();
    this.coreMaterial.dispose();
    this.innerGlowMaterial.dispose();
    this.outerGlowMaterial.dispose();
  }
}
