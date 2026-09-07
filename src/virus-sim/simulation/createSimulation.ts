import {
  DEFAULT_CONFIG,
  FIXED_DT,
  MODEL_RATES,
  MODEL_VERSION,
  WORLD,
} from '../model/presets';
import type {
  BacteriumPhase,
  PhagePhase,
  Simulation,
  SimulationConfig,
  SimulationEvent,
  SimulationEventType,
  SimulationSnapshot,
  SimulationStatus,
  Vec3,
} from '../model/types';
import {
  closestBacteriumSurface,
  isInsideBacterium,
  reflectCoordinate,
} from './geometry';
import { normalizeSeed, SeededRandom } from './random';

interface MutablePhage {
  id: number;
  position: Vec3;
  previousPosition: Vec3;
  phase: PhagePhase;
  phaseElapsed: number;
  deliveryProgress: number;
  contactPoint: Vec3 | null;
  contactNormal: Vec3 | null;
}

interface MutableBacterium {
  phase: BacteriumPhase;
  phaseElapsed: number;
  remainingResource: number;
  internalGenomes: number;
  componentBundles: number;
  completedPhages: number;
  releasedPhages: number;
  infectionOwnerId: number | null;
  genomeProgress: number;
  componentProgress: number;
  assemblyProgress: number;
}

class VirusSimulation implements Simulation {
  private config = DEFAULT_CONFIG;
  private seed = 1;
  private random = new SeededRandom(1);
  private tick = 0;
  private status: SimulationStatus = 'ready';
  private phages: MutablePhage[] = [];
  private bacterium: MutableBacterium = this.createBacterium();
  private queuedEvents: SimulationEvent[] = [];
  private contactCount = 0;
  private firstDeliveryTime: number | null = null;

  constructor(config: SimulationConfig, seed: number) {
    this.reset(config, seed);
  }

  reset(config: SimulationConfig, seed: number): void {
    this.config = sanitizeConfig(config);
    this.seed = normalizeSeed(seed);
    this.random = new SeededRandom(this.seed);
    this.tick = 0;
    this.status = 'ready';
    this.bacterium = this.createBacterium();
    this.queuedEvents = [];
    this.contactCount = 0;
    this.firstDeliveryTime = null;
    this.phages = Array.from({ length: this.config.initialPhageCount }, (_, index) =>
      this.createPhage(index + 1),
    );
  }

  setStatus(status: Exclude<SimulationStatus, 'completed'>): void {
    if (this.status !== 'completed') this.status = status;
  }

  step(dt: number): void {
    if (Math.abs(dt - FIXED_DT) > 1e-10) {
      throw new Error(`Virus Sim accepts only the fixed dt (${FIXED_DT}).`);
    }
    if (this.status === 'paused' || this.status === 'completed') return;
    if (this.status === 'ready') this.status = 'running';

    this.tick += 1;
    for (const phage of this.phages) this.stepPhage(phage, dt);
    this.stepBacterium(dt);

    if (this.bacterium.phase === 'lysed' || this.bacterium.phase === 'blocked') {
      this.status = 'completed';
    }
  }

  getSnapshot(): SimulationSnapshot {
    const counts = {
      free: 0,
      contacting: 0,
      attached: 0,
      delivering: 0,
      spent: 0,
      completed: this.bacterium.completedPhages,
      released: this.bacterium.releasedPhages,
      contacts: this.contactCount,
    };
    for (const phage of this.phages) counts[phage.phase] += 1;

    return {
      schemaVersion: 1,
      modelVersion: MODEL_VERSION,
      seed: this.seed,
      config: { ...this.config },
      tick: this.tick,
      modelTime: this.tick * FIXED_DT,
      status: this.status,
      bacterium: {
        phase: this.bacterium.phase,
        phaseElapsed: this.bacterium.phaseElapsed,
        remainingResource: this.bacterium.remainingResource,
        internalGenomes: this.bacterium.internalGenomes,
        componentBundles: this.bacterium.componentBundles,
        completedPhages: this.bacterium.completedPhages,
        releasedPhages: this.bacterium.releasedPhages,
        infectionOwnerId: this.bacterium.infectionOwnerId,
      },
      phages: this.phages.map((phage) => ({
        id: phage.id,
        position: { ...phage.position },
        previousPosition: { ...phage.previousPosition },
        phase: phage.phase,
        phaseElapsed: phage.phaseElapsed,
        deliveryProgress: phage.deliveryProgress,
        contactPoint: phage.contactPoint ? { ...phage.contactPoint } : null,
      })),
      counts,
      firstDeliveryTime: this.firstDeliveryTime,
    };
  }

  drainEvents(): readonly SimulationEvent[] {
    const events = this.queuedEvents;
    this.queuedEvents = [];
    return events;
  }

  private createBacterium(): MutableBacterium {
    return {
      phase: 'susceptible',
      phaseElapsed: 0,
      remainingResource: MODEL_RATES.initialResource,
      internalGenomes: 0,
      componentBundles: 0,
      completedPhages: 0,
      releasedPhages: 0,
      infectionOwnerId: null,
      genomeProgress: 0,
      componentProgress: 0,
      assemblyProgress: 0,
    };
  }

  private createPhage(id: number): MutablePhage {
    const position =
      this.config.placement === 'guided'
        ? this.guidedPosition(id)
        : this.randomPosition();
    return {
      id,
      position,
      previousPosition: { ...position },
      phase: 'free',
      phaseElapsed: 0,
      deliveryProgress: 0,
      contactPoint: null,
      contactNormal: null,
    };
  }

  private guidedPosition(id: number): Vec3 {
    if (id <= Math.min(8, this.config.initialPhageCount)) {
      const angle =
        ((id - 1) / Math.min(8, this.config.initialPhageCount)) * Math.PI * 2;
      const x = this.random.range(
        -WORLD.bacteriumHalfLength * 0.75,
        WORLD.bacteriumHalfLength * 0.75,
      );
      const radius = WORLD.bacteriumRadius + this.random.range(0.22, 0.65);
      return { x, y: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
    }
    return this.randomPosition();
  }

  private randomPosition(): Vec3 {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const position = {
        x: this.random.range(-WORLD.halfExtent, WORLD.halfExtent),
        y: this.random.range(-WORLD.halfExtent, WORLD.halfExtent),
        z: this.random.range(-WORLD.halfExtent, WORLD.halfExtent),
      };
      if (!isInsideBacterium(position, 0.5)) return position;
    }
    return { x: WORLD.halfExtent * 0.8, y: WORLD.halfExtent * 0.8, z: 0 };
  }

  private stepPhage(phage: MutablePhage, dt: number): void {
    phage.previousPosition = { ...phage.position };
    phage.phaseElapsed += dt;
    switch (phage.phase) {
      case 'free':
        this.diffuse(phage, dt);
        break;
      case 'contacting':
        this.resolveContact(phage, dt);
        break;
      case 'attached':
        this.resolveAttachment(phage, dt);
        break;
      case 'delivering':
        phage.deliveryProgress = Math.min(
          1,
          phage.phaseElapsed / MODEL_RATES.deliveryDuration,
        );
        if (phage.deliveryProgress >= 1) this.finishDelivery(phage);
        break;
      case 'spent':
        break;
    }
  }

  private diffuse(phage: MutablePhage, dt: number): void {
    const sigma = Math.sqrt(2 * MODEL_RATES.diffusion * dt);
    const displacement = {
      x: this.random.gaussian() * sigma,
      y: this.random.gaussian() * sigma,
      z: this.random.gaussian() * sigma,
    };
    const length = Math.hypot(displacement.x, displacement.y, displacement.z);
    const subdivisions = Math.max(1, Math.ceil(length / 0.18));
    let position = { ...phage.position };

    for (let index = 0; index < subdivisions; index += 1) {
      const candidate = {
        x: reflectCoordinate(
          position.x + displacement.x / subdivisions,
          WORLD.halfExtent,
        ),
        y: reflectCoordinate(
          position.y + displacement.y / subdivisions,
          WORLD.halfExtent,
        ),
        z: reflectCoordinate(
          position.z + displacement.z / subdivisions,
          WORLD.halfExtent,
        ),
      };
      const surface = closestBacteriumSurface(candidate);
      if (surface.distance <= WORLD.phageCollisionRadius) {
        phage.position = {
          x: surface.point.x + surface.normal.x * WORLD.phageCollisionRadius,
          y: surface.point.y + surface.normal.y * WORLD.phageCollisionRadius,
          z: surface.point.z + surface.normal.z * WORLD.phageCollisionRadius,
        };
        phage.contactPoint = surface.point;
        phage.contactNormal = surface.normal;
        this.transitionPhage(phage, 'contacting');
        this.contactCount += 1;
        this.emit('contact', phage.id);
        return;
      }
      position = candidate;
    }
    phage.position = position;
  }

  private resolveContact(phage: MutablePhage, dt: number): void {
    if (phage.phaseElapsed < MODEL_RATES.contactSettleDuration) return;
    if (this.config.recognition === 'mismatch') {
      this.releaseFromSurface(phage, 'recognition-mismatch');
      return;
    }
    if (
      this.bacterium.infectionOwnerId !== null ||
      this.bacterium.phase !== 'susceptible'
    ) {
      this.releaseFromSurface(phage, 'host-occupied');
      return;
    }

    const rate = MODEL_RATES.attachmentRate[this.config.receptorDensity];
    if (this.random.next() < 1 - Math.exp(-rate * dt)) {
      this.transitionPhage(phage, 'attached');
      this.emit('attached', phage.id);
      return;
    }
    if (phage.phaseElapsed >= MODEL_RATES.contactTimeout) {
      this.releaseFromSurface(phage, 'attachment-timeout');
    }
  }

  private resolveAttachment(phage: MutablePhage, dt: number): void {
    if (this.random.next() < 1 - Math.exp(-MODEL_RATES.detachmentRate * dt)) {
      this.releaseFromSurface(phage, undefined, true);
      return;
    }
    if (phage.phaseElapsed < MODEL_RATES.attachmentStableDuration) return;
    if (
      this.bacterium.phase !== 'susceptible' ||
      this.bacterium.infectionOwnerId !== null
    ) {
      this.releaseFromSurface(phage, 'host-occupied');
      return;
    }

    this.bacterium.infectionOwnerId = phage.id;
    this.transitionBacterium('receiving');
    this.transitionPhage(phage, 'delivering');
    this.emit('delivery-started', phage.id);
  }

  private finishDelivery(phage: MutablePhage): void {
    this.transitionPhage(phage, 'spent');
    this.emit('delivery-completed', phage.id);
    this.firstDeliveryTime ??= this.tick * FIXED_DT;
    if (this.config.defenseBlocksInfection) {
      this.transitionBacterium('blocked');
      this.emit('infection-blocked', phage.id);
      return;
    }
    this.bacterium.internalGenomes = 1;
    this.transitionBacterium('producing');
    this.emit('production-started', phage.id);
  }

  private stepBacterium(dt: number): void {
    if (
      this.bacterium.phase === 'susceptible' ||
      this.bacterium.phase === 'blocked' ||
      this.bacterium.phase === 'lysed'
    ) {
      return;
    }
    this.bacterium.phaseElapsed += dt;

    if (this.bacterium.phase === 'producing') {
      this.produce(dt);
      if (this.bacterium.phaseElapsed >= MODEL_RATES.productionDuration) {
        this.transitionBacterium('assembling');
        this.emit('assembly-started');
      }
      return;
    }

    if (this.bacterium.phase === 'assembling') {
      this.bacterium.assemblyProgress += dt;
      while (
        this.bacterium.assemblyProgress >= MODEL_RATES.assemblyInterval &&
        this.bacterium.completedPhages < MODEL_RATES.maxCompletedPhages &&
        this.bacterium.internalGenomes > 0 &&
        this.bacterium.componentBundles > 0
      ) {
        this.bacterium.assemblyProgress -= MODEL_RATES.assemblyInterval;
        this.bacterium.internalGenomes -= 1;
        this.bacterium.componentBundles -= 1;
        this.bacterium.completedPhages += 1;
        this.emit('phage-assembled', undefined, this.bacterium.completedPhages);
      }
      if (
        this.bacterium.phaseElapsed >= MODEL_RATES.assemblyDuration ||
        this.bacterium.completedPhages >= MODEL_RATES.maxCompletedPhages
      ) {
        this.transitionBacterium('lysing');
        this.emit('lysis-started', undefined, this.bacterium.completedPhages);
      }
      return;
    }

    if (
      this.bacterium.phase === 'lysing' &&
      this.bacterium.phaseElapsed >= MODEL_RATES.lysisDuration
    ) {
      this.bacterium.releasedPhages = this.bacterium.completedPhages;
      this.transitionBacterium('lysed');
      this.emit('released', undefined, this.bacterium.releasedPhages);
    }
  }

  private produce(dt: number): void {
    this.bacterium.genomeProgress += MODEL_RATES.genomeRate * dt;
    this.bacterium.componentProgress += MODEL_RATES.componentRate * dt;

    while (
      this.bacterium.genomeProgress >= 1 &&
      this.bacterium.remainingResource >= MODEL_RATES.resourcePerGenome
    ) {
      this.bacterium.genomeProgress -= 1;
      this.bacterium.remainingResource -= MODEL_RATES.resourcePerGenome;
      this.bacterium.internalGenomes += 1;
    }
    while (
      this.bacterium.componentProgress >= 1 &&
      this.bacterium.remainingResource >= MODEL_RATES.resourcePerComponent
    ) {
      this.bacterium.componentProgress -= 1;
      this.bacterium.remainingResource -= MODEL_RATES.resourcePerComponent;
      this.bacterium.componentBundles += 1;
    }
    this.bacterium.remainingResource = Math.max(0, this.bacterium.remainingResource);
  }

  private releaseFromSurface(
    phage: MutablePhage,
    reason?: 'recognition-mismatch' | 'attachment-timeout' | 'host-occupied',
    detached = false,
  ): void {
    const normal = phage.contactNormal ?? { x: 0, y: 1, z: 0 };
    phage.position = {
      x: phage.position.x + normal.x * 0.12,
      y: phage.position.y + normal.y * 0.12,
      z: phage.position.z + normal.z * 0.12,
    };
    phage.contactPoint = null;
    phage.contactNormal = null;
    this.transitionPhage(phage, 'free');
    if (detached) this.emit('detached', phage.id);
    else this.emit('contact-rejected', phage.id, undefined, reason);
  }

  private transitionPhage(phage: MutablePhage, phase: PhagePhase): void {
    phage.phase = phase;
    phage.phaseElapsed = 0;
    if (phase !== 'delivering') phage.deliveryProgress = phase === 'spent' ? 1 : 0;
  }

  private transitionBacterium(phase: BacteriumPhase): void {
    this.bacterium.phase = phase;
    this.bacterium.phaseElapsed = 0;
  }

  private emit(
    type: SimulationEventType,
    phageId?: number,
    count?: number,
    reason?: SimulationEvent['reason'],
  ): void {
    this.queuedEvents.push({
      tick: this.tick,
      modelTime: this.tick * FIXED_DT,
      type,
      ...(phageId === undefined ? {} : { phageId }),
      ...(count === undefined ? {} : { count }),
      ...(reason === undefined ? {} : { reason }),
    });
  }
}

export function createSimulation(
  config: SimulationConfig = DEFAULT_CONFIG,
  seed = 1,
): Simulation {
  return new VirusSimulation(config, seed);
}

function sanitizeConfig(config: SimulationConfig): SimulationConfig {
  return {
    initialPhageCount: Math.max(1, Math.min(64, Math.round(config.initialPhageCount))),
    recognition: config.recognition === 'mismatch' ? 'mismatch' : 'match',
    receptorDensity:
      config.receptorDensity === 'sparse' || config.receptorDensity === 'dense'
        ? config.receptorDensity
        : 'default',
    placement: config.placement === 'random' ? 'random' : 'guided',
    ...(config.defenseBlocksInfection ? { defenseBlocksInfection: true } : {}),
  };
}
