import type { AxisAlignedBox, ChamberDescriptor } from '../chambers/descriptors';
import { createChamberDescriptor } from '../chambers/descriptors';
import { getPhysicsProfileById, scalesForViruses } from '../profiles/registry';
import type {
  LabBodySnapshot,
  LabConfig,
  LabEnvironment,
  PassageResult,
  PhysicsProfile,
  QuaternionTuple,
  Vec3Tuple,
} from '../types';
import {
  add,
  clamp,
  dot,
  finiteVector,
  integrateQuaternion,
  length,
  normalize,
  rotateVector,
  scale,
  subtract,
} from './math';
import type { LabRandom } from './random';
import { sampleLocalRotation, sampleVelocityField } from './velocityField';

export interface MutableLabBody {
  readonly instanceId: string;
  readonly virusId: string;
  readonly variantId: string | null;
  readonly profile: PhysicsProfile;
  readonly scale: number;
  position: Vec3Tuple;
  orientation: QuaternionTuple;
  velocity: Vec3Tuple;
  filamentPoints: Vec3Tuple[];
}

export interface LabWorld {
  readonly bodies: MutableLabBody[];
  readonly results: Map<string, PassageResult>;
  chamber: ChamberDescriptor;
}

export function createLabWorld(config: LabConfig): LabWorld {
  const scales = scalesForViruses(
    config.initialInstances.map((instance) => instance.virusId),
    config.scaleMode,
  );
  const bodies = config.initialInstances.map((instance, index): MutableLabBody => {
    const profile = getPhysicsProfileById(instance.physicsProfileId);
    if (profile.virusId !== instance.virusId)
      throw new Error(`Physics profile mismatch for ${instance.instanceId}`);
    const bodyScale = scales[index]!;
    return {
      instanceId: instance.instanceId,
      virusId: instance.virusId,
      variantId: instance.variantId,
      profile,
      scale: bodyScale,
      position: [...instance.position],
      orientation: [...instance.orientation],
      velocity: [0, 0, 0],
      filamentPoints: createFilamentPoints(
        profile,
        bodyScale,
        instance.position,
        instance.orientation,
      ),
    };
  });
  return {
    bodies,
    chamber: createChamberDescriptor(config.environment),
    results: new Map(
      bodies.map((body) => [
        body.instanceId,
        {
          instanceId: body.instanceId,
          state: 'waiting',
          passedAt: null,
          startPosition: [...body.position],
        },
      ]),
    ),
  };
}

export function stepLabWorld(
  world: LabWorld,
  environment: LabEnvironment,
  dt: number,
  simTime: number,
  random: LabRandom,
): void {
  world.chamber = createChamberDescriptor(environment);
  for (const body of world.bodies) {
    if (world.results.get(body.instanceId)?.state === 'passed') continue;
    if (body.profile.shape === 'filament')
      stepFilament(body, environment, world.chamber, dt, random);
    else stepRigidBody(body, environment, world.chamber, dt, random);
  }
  separateBodies(world.bodies);
  updatePassageResults(world, environment, simTime + dt);
  ensureFiniteWorld(world);
}

export function snapshotBodies(world: LabWorld): readonly LabBodySnapshot[] {
  return world.bodies.map((body) => ({
    instanceId: body.instanceId,
    virusId: body.virusId,
    variantId: body.variantId,
    physicsProfileId: body.profile.id,
    position: [...body.position],
    orientation: [...body.orientation],
    velocity: [...body.velocity],
    scale: body.scale,
    filamentPoints: body.filamentPoints.map((point) => [...point]),
  }));
}

export function bodyAabb(body: MutableLabBody): AxisAlignedBox {
  if (body.filamentPoints.length > 0) {
    const padding = body.profile.radius * body.scale;
    return pointsAabb(body.filamentPoints, padding, body.instanceId);
  }
  const axis = normalize(rotateVector(body.profile.localAxis, body.orientation));
  const radius = body.profile.radius * body.scale;
  const lengthPart = body.profile.halfLength * body.scale;
  let extents: Vec3Tuple = [
    radius + Math.abs(axis[0]) * lengthPart,
    radius + Math.abs(axis[1]) * lengthPart,
    radius + Math.abs(axis[2]) * lengthPart,
  ];
  for (const offset of body.profile.compoundOffsets) {
    const rotated = rotateVector(scale(offset, body.scale), body.orientation);
    extents = [
      Math.max(extents[0], Math.abs(rotated[0]) + radius),
      Math.max(extents[1], Math.abs(rotated[1]) + radius),
      Math.max(extents[2], Math.abs(rotated[2]) + radius),
    ];
  }
  return {
    id: body.instanceId,
    min: subtract(body.position, extents),
    max: add(body.position, extents),
  };
}

export function validateWorld(world: LabWorld): readonly string[] {
  const errors: string[] = [];
  const instanceIds = new Set<string>();
  for (const body of world.bodies) {
    if (instanceIds.has(body.instanceId))
      errors.push(`${body.instanceId}: duplicate instance id`);
    instanceIds.add(body.instanceId);
    const bounds = bodyAabb(body);
    const quaternionLength = Math.hypot(...body.orientation);
    if (
      !finiteVector(body.position) ||
      !finiteVector(bounds.min) ||
      !finiteVector(bounds.max)
    )
      errors.push(`${body.instanceId}: non-finite body state`);
    if (Math.abs(quaternionLength - 1) > 1e-4)
      errors.push(`${body.instanceId}: orientation is not normalized`);
    if (
      bounds.min[1] < world.chamber.bounds.min[1] ||
      bounds.max[1] > world.chamber.bounds.max[1]
    )
      errors.push(`${body.instanceId}: outside chamber height`);
    if (
      bounds.min[2] < world.chamber.bounds.min[2] ||
      bounds.max[2] > world.chamber.bounds.max[2]
    )
      errors.push(`${body.instanceId}: outside chamber depth`);
  }
  for (let first = 0; first < world.bodies.length; first += 1) {
    for (let second = first + 1; second < world.bodies.length; second += 1) {
      if (aabbOverlaps(bodyAabb(world.bodies[first]!), bodyAabb(world.bodies[second]!)))
        errors.push(
          `${world.bodies[first]!.instanceId}/${world.bodies[second]!.instanceId}: initial collision surrogates overlap`,
        );
    }
  }
  return errors;
}

function aabbOverlaps(first: AxisAlignedBox, second: AxisAlignedBox): boolean {
  return (
    first.min[0] < second.max[0] &&
    first.max[0] > second.min[0] &&
    first.min[1] < second.max[1] &&
    first.max[1] > second.min[1] &&
    first.min[2] < second.max[2] &&
    first.max[2] > second.min[2]
  );
}

function stepRigidBody(
  body: MutableLabBody,
  environment: LabEnvironment,
  chamber: ChamberDescriptor,
  dt: number,
  random: LabRandom,
): void {
  const flow = sampleVelocityField(environment, body.position, chamber);
  const flowDirection = normalize(flow);
  const bodyAxis = normalize(rotateVector(body.profile.localAxis, body.orientation));
  const alignment = Math.abs(dot(flowDirection, bodyAxis));
  const mobility =
    body.profile.dragPerpendicular +
    (body.profile.dragParallel - body.profile.dragPerpendicular) *
      alignment *
      alignment;
  const angularVelocity = scale(
    sampleLocalRotation(environment, body.position),
    body.profile.rotationResponse,
  );
  body.orientation = integrateQuaternion(body.orientation, angularVelocity, dt);
  const brownian = brownianDisplacement(environment, body.scale, dt, random);
  body.velocity = scale(flow, mobility);
  body.position = add(body.position, add(scale(body.velocity, dt), brownian));
  resolveRigidContacts(body, chamber);
}

function stepFilament(
  body: MutableLabBody,
  environment: LabEnvironment,
  chamber: ChamberDescriptor,
  dt: number,
  random: LabRandom,
): void {
  const previousCenter = body.position;
  const points = body.filamentPoints;
  const segmentLength =
    (body.profile.halfLength * 2 * body.scale) / Math.max(1, points.length - 1);
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
    const velocity = sampleVelocityField(environment, point, chamber);
    const noise = brownianDisplacement(environment, body.scale * 1.4, dt, random);
    points[index] = add(
      point,
      add(scale(velocity, dt * body.profile.dragPerpendicular), noise),
    );
  }
  for (let pass = 0; pass < 5; pass += 1) {
    constrainFilamentLength(points, segmentLength);
    constrainFilamentBend(points, body.profile.flexibility);
    for (let index = 0; index < points.length; index += 1) {
      points[index] = resolveSphereContacts(
        points[index]!,
        body.profile.radius * body.scale,
        chamber,
      );
    }
  }
  body.position = average(points);
  body.velocity = scale(
    subtract(body.position, previousCenter),
    1 / Math.max(dt, 1e-9),
  );
  const filamentAxis = normalize(subtract(points.at(-1)!, points[0]!));
  const rotation = sampleLocalRotation(environment, body.position);
  body.orientation = integrateQuaternion(body.orientation, rotation, dt);
  if (length(filamentAxis) < 1e-7) body.orientation = [0, 0, 0, 1];
}

function createFilamentPoints(
  profile: PhysicsProfile,
  bodyScale: number,
  position: Vec3Tuple,
  orientation: QuaternionTuple,
): Vec3Tuple[] {
  if (profile.shape !== 'filament') return [];
  const axis = normalize(rotateVector(profile.localAxis, orientation));
  const totalLength = profile.halfLength * 2 * bodyScale;
  return Array.from({ length: profile.segmentCount }, (_, index) => {
    const offset =
      -totalLength / 2 + (totalLength * index) / (profile.segmentCount - 1);
    return add(position, scale(axis, offset));
  });
}

function constrainFilamentLength(points: Vec3Tuple[], target: number): void {
  for (let index = 0; index < points.length - 1; index += 1) {
    const first = points[index]!;
    const second = points[index + 1]!;
    const delta = subtract(second, first);
    const distance = length(delta);
    if (distance < 1e-9) continue;
    const correction = scale(delta, ((distance - target) / distance) * 0.5);
    points[index] = add(first, correction);
    points[index + 1] = subtract(second, correction);
  }
}

function constrainFilamentBend(points: Vec3Tuple[], flexibility: number): void {
  const stiffness = clamp(0.42 - flexibility, 0.12, 0.4);
  const copy = points.map((point) => [...point] as Vec3Tuple);
  for (let index = 1; index < points.length - 1; index += 1) {
    const midpoint = scale(add(copy[index - 1]!, copy[index + 1]!), 0.5);
    points[index] = add(
      copy[index]!,
      scale(subtract(midpoint, copy[index]!), stiffness),
    );
  }
}

function resolveRigidContacts(body: MutableLabBody, chamber: ChamberDescriptor): void {
  const before = body.position;
  let bounds = bodyAabb(body);
  const correction: [number, number, number] = [0, 0, 0];
  const world = chamber.bounds;
  if (bounds.min[1] < world.min[1]) correction[1] += world.min[1] - bounds.min[1];
  if (bounds.max[1] > world.max[1]) correction[1] -= bounds.max[1] - world.max[1];
  if (bounds.min[2] < world.min[2]) correction[2] += world.min[2] - bounds.min[2];
  if (bounds.max[2] > world.max[2]) correction[2] -= bounds.max[2] - world.max[2];
  if (chamber.kind === 'open') {
    if (bounds.min[0] < world.min[0]) correction[0] += world.min[0] - bounds.min[0];
    if (bounds.max[0] > world.max[0]) correction[0] -= bounds.max[0] - world.max[0];
  }
  body.position = add(body.position, correction);
  bounds = bodyAabb(body);
  for (const obstacle of chamber.obstacles) {
    const push = aabbSeparation(bounds, obstacle);
    if (!push) continue;
    body.position = add(body.position, push);
    bounds = bodyAabb(body);
  }
  if (length(subtract(before, body.position)) > 1e-8)
    body.velocity = scale(body.velocity, 0.12);
}

function resolveSphereContacts(
  position: Vec3Tuple,
  radius: number,
  chamber: ChamberDescriptor,
): Vec3Tuple {
  const world = chamber.bounds;
  let resolved: Vec3Tuple = [
    chamber.kind === 'open'
      ? clamp(position[0], world.min[0] + radius, world.max[0] - radius)
      : position[0],
    clamp(position[1], world.min[1] + radius, world.max[1] - radius),
    clamp(position[2], world.min[2] + radius, world.max[2] - radius),
  ];
  for (const obstacle of chamber.obstacles) {
    const sphereBox: AxisAlignedBox = {
      id: 'segment',
      min: subtract(resolved, [radius, radius, radius]),
      max: add(resolved, [radius, radius, radius]),
    };
    const push = aabbSeparation(sphereBox, obstacle);
    if (push) resolved = add(resolved, push);
  }
  return resolved;
}

function aabbSeparation(
  body: AxisAlignedBox,
  obstacle: AxisAlignedBox,
): Vec3Tuple | null {
  if (
    body.max[0] <= obstacle.min[0] ||
    body.min[0] >= obstacle.max[0] ||
    body.max[1] <= obstacle.min[1] ||
    body.min[1] >= obstacle.max[1] ||
    body.max[2] <= obstacle.min[2] ||
    body.min[2] >= obstacle.max[2]
  )
    return null;
  const candidates: readonly Vec3Tuple[] = [
    [obstacle.min[0] - body.max[0], 0, 0],
    [obstacle.max[0] - body.min[0], 0, 0],
    [0, obstacle.min[1] - body.max[1], 0],
    [0, obstacle.max[1] - body.min[1], 0],
    [0, 0, obstacle.min[2] - body.max[2]],
    [0, 0, obstacle.max[2] - body.min[2]],
  ];
  return candidates.reduce((best, candidate) =>
    length(candidate) < length(best) ? candidate : best,
  );
}

function separateBodies(bodies: MutableLabBody[]): void {
  for (let first = 0; first < bodies.length; first += 1) {
    for (let second = first + 1; second < bodies.length; second += 1) {
      const a = bodies[first]!;
      const b = bodies[second]!;
      const delta = subtract(b.position, a.position);
      const distance = length(delta);
      const minimum = (a.profile.radius * a.scale + b.profile.radius * b.scale) * 0.72;
      if (distance >= minimum || distance < 1e-8) continue;
      const correction = scale(normalize(delta), (minimum - distance) * 0.5);
      translateBody(a, scale(correction, -1));
      translateBody(b, correction);
    }
  }
}

function translateBody(body: MutableLabBody, offset: Vec3Tuple): void {
  body.position = add(body.position, offset);
  body.filamentPoints = body.filamentPoints.map((point) => add(point, offset));
}

function updatePassageResults(
  world: LabWorld,
  environment: LabEnvironment,
  simTime: number,
): void {
  for (const body of world.bodies) {
    const current = world.results.get(body.instanceId)!;
    if (current.state === 'passed') continue;
    const bounds = bodyAabb(body);
    const exit = world.chamber.exitPlaneX;
    const passed =
      exit !== null &&
      (environment.flowDirection > 0 ? bounds.min[0] > exit : bounds.max[0] < exit);
    world.results.set(body.instanceId, {
      ...current,
      state: passed ? 'passed' : 'moving',
      passedAt: passed ? simTime : null,
    });
  }
}

function brownianDisplacement(
  environment: LabEnvironment,
  bodyScale: number,
  dt: number,
  random: LabRandom,
): Vec3Tuple {
  if (!environment.brownianEnabled) return [0, 0, 0];
  const diffusion = 0.0028 / (environment.viscosityRatio * Math.max(0.35, bodyScale));
  const sigma = Math.sqrt(2 * diffusion * dt);
  return [random.normal() * sigma, random.normal() * sigma, random.normal() * sigma];
}

function pointsAabb(
  points: readonly Vec3Tuple[],
  padding: number,
  id: string,
): AxisAlignedBox {
  const minimum: [number, number, number] = [Infinity, Infinity, Infinity];
  const maximum: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const point of points) {
    for (let axis = 0; axis < 3; axis += 1) {
      minimum[axis] = Math.min(minimum[axis]!, point[axis]! - padding);
      maximum[axis] = Math.max(maximum[axis]!, point[axis]! + padding);
    }
  }
  return { id, min: minimum, max: maximum };
}

function average(points: readonly Vec3Tuple[]): Vec3Tuple {
  if (points.length === 0) return [0, 0, 0];
  return scale(
    points.reduce<Vec3Tuple>((sum, point) => add(sum, point), [0, 0, 0]),
    1 / points.length,
  );
}

function ensureFiniteWorld(world: LabWorld): void {
  for (const body of world.bodies) {
    if (!finiteVector(body.position) || !body.orientation.every(Number.isFinite))
      throw new Error(`Non-finite physics state for ${body.instanceId}`);
  }
}
