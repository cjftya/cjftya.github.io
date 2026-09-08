import * as THREE from 'three';

const MAX_SAMPLES = 78;
const MAX_ECHOES = Math.ceil(MAX_SAMPLES / 6);

export class MotionTrace {
  private readonly samples: THREE.Vector3[] = [];
  private readonly lineGeometry = new THREE.BufferGeometry();
  private readonly echoGeometry = new THREE.BufferGeometry();
  private readonly linePositions = new Float32Array(MAX_SAMPLES * 3);
  private readonly echoPositions = new Float32Array(MAX_ECHOES * 3);
  private readonly line = new THREE.Line(
    this.lineGeometry,
    new THREE.LineBasicMaterial({
      color: 0x65e9df,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );
  private readonly echoes = new THREE.Points(
    this.echoGeometry,
    new THREE.PointsMaterial({
      color: 0xa98be8,
      size: 0.095,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
  );

  constructor(private readonly host: THREE.Group) {
    const lineAttribute = new THREE.BufferAttribute(this.linePositions, 3);
    const echoAttribute = new THREE.BufferAttribute(this.echoPositions, 3);
    lineAttribute.setUsage(THREE.DynamicDrawUsage);
    echoAttribute.setUsage(THREE.DynamicDrawUsage);
    this.lineGeometry.setAttribute('position', lineAttribute);
    this.echoGeometry.setAttribute('position', echoAttribute);
    this.lineGeometry.setDrawRange(0, 0);
    this.echoGeometry.setDrawRange(0, 0);
    this.line.name = 'motion-trace';
    this.echoes.name = 'temporal-echo';
    this.line.userData.ignoreCameraBounds = true;
    this.echoes.userData.ignoreCameraBounds = true;
    this.line.visible = false;
    this.echoes.visible = false;
    this.host.add(this.line, this.echoes);
  }

  record(position: THREE.Vector3): void {
    const latest = this.samples.at(-1);
    if (latest && latest.distanceToSquared(position) < 0.000025) return;
    this.samples.push(position.clone());
    if (this.samples.length > MAX_SAMPLES) this.samples.shift();
    this.rebuildGeometry();
  }

  setVisible(trace: boolean, echoes: boolean): void {
    this.line.visible = trace && this.samples.length > 1;
    this.echoes.visible = echoes && this.samples.length > 1;
  }

  reset(): void {
    this.samples.length = 0;
    this.rebuildGeometry();
  }

  dispose(): void {
    this.host.remove(this.line, this.echoes);
    this.lineGeometry.dispose();
    this.echoGeometry.dispose();
    (this.line.material as THREE.Material).dispose();
    (this.echoes.material as THREE.Material).dispose();
  }

  private rebuildGeometry(): void {
    this.samples.forEach((sample, index) => {
      const offset = index * 3;
      this.linePositions[offset] = sample.x;
      this.linePositions[offset + 1] = sample.y;
      this.linePositions[offset + 2] = sample.z;
    });
    let echoCount = 0;
    this.samples.forEach((sample, index) => {
      if (index % 6 !== 0) return;
      const offset = echoCount * 3;
      this.echoPositions[offset] = sample.x;
      this.echoPositions[offset + 1] = sample.y;
      this.echoPositions[offset + 2] = sample.z;
      echoCount += 1;
    });
    this.lineGeometry.setDrawRange(0, this.samples.length);
    this.echoGeometry.setDrawRange(0, echoCount);
    (this.lineGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate =
      true;
    (this.echoGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate =
      true;
    this.lineGeometry.computeBoundingSphere();
    this.echoGeometry.computeBoundingSphere();
  }
}
