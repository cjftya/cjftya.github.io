import type { Experiment, ExperimentContext } from '../core/Experiment';
import { AreaForceExperiment } from './area-force/AreaForceExperiment';
import { BallRollingExperiment } from './ball-rolling/BallRollingExperiment';
import { BoxThrowingExperiment } from './box-throwing/BoxThrowingExperiment';
import { CapsuleCircleExperiment } from './capsule-circle/CapsuleCircleExperiment';
import { CarExperiment } from './car/CarExperiment';
import { CellSpaceExperiment } from './cell-space/CellSpaceExperiment';
import { CircleCollisionExperiment } from './circle-collision/CircleCollisionExperiment';
import { CircleJellyExperiment } from './circle-jelly/CircleJellyExperiment';
import { ClothDestroyExperiment } from './cloth-destroy/ClothDestroyExperiment';
import { ClosestPointExperiment } from './closest-point/ClosestPointExperiment';
import { ConnectNodeSetExperiment } from './connect-node-set/ConnectNodeSetExperiment';
import { ConstraintListExperiment } from './constraint-list/ConstraintListExperiment';
import { CurveMoveExperiment } from './curve-move/CurveMoveExperiment';
import { CuttingRopeExperiment } from './cutting-rope/CuttingRopeExperiment';
import { EaseMotionBugExperiment } from './ease-motion-bug/EaseMotionBugExperiment';
import { FigureExperiment } from './figure/FigureExperiment';
import { FlowSimulationExperiment } from './flow-simulation/FlowSimulationExperiment';
import { GasketExperiment } from './gasket/GasketExperiment';
import { GearExperiment } from './gear/GearExperiment';
import { GForceExperiment } from './g-force/GForceExperiment';
import { ImageFunExperiment } from './image-fun/ImageFunExperiment';
import { InterpolationRotateExperiment } from './interpolation-rotate/InterpolationRotateExperiment';
import { InterpolationTraceExperiment } from './interpolation-trace/InterpolationTraceExperiment';
import { KineticExperiment } from './kinetic/KineticExperiment';
import { LineCircleExperiment } from './line-circle/LineCircleExperiment';
import { LineDrawingExperiment } from './line-drawing/LineDrawingExperiment';
import { LineResolve2Experiment } from './line-resolve-2/LineResolve2Experiment';
import { LightVer1Experiment } from './light-ver-1/LightVer1Experiment';
import { LightVer2Experiment } from './light-ver-2/LightVer2Experiment';
import { LinearSpringClothExperiment } from './linear-spring-cloth/LinearSpringClothExperiment';
import { MouseMovingEnergyExperiment } from './mouse-moving-energy/MouseMovingEnergyExperiment';
import { OptimizeExperiment } from './optimize/OptimizeExperiment';
import { ParticleCircleExperiment } from './particle-circle/ParticleCircleExperiment';
import { ParticleConnectionExperiment } from './particle-connection/ParticleConnectionExperiment';
import { ParticleEffectExperiment } from './particle-effect/ParticleEffectExperiment';
import { ParticleMouseExperiment } from './particle-mouse/ParticleMouseExperiment';
import { ParticlePoolExperiment } from './particle-pool/ParticlePoolExperiment';
import { ParticleTailExperiment } from './particle-tail/ParticleTailExperiment';
import { PolygonCircleExperiment } from './polygon-circle/PolygonCircleExperiment';
import { SatExperiment } from './sat/SatExperiment';
import { SoftbodyExperiment } from './softbody/SoftbodyExperiment';
import { SoftbodyStructTestExperiment } from './softbody-struct-test/SoftbodyStructTestExperiment';
import { RealitySnowExperiment } from './reality-snow/RealitySnowExperiment';
import { TimeScalingExperiment } from './time-scaling/TimeScalingExperiment';
import { TorqueExperiment } from './torque/TorqueExperiment';
import { VectorRadiansExperiment } from './vector-radians/VectorRadiansExperiment';

type ExperimentFactory = (context: ExperimentContext) => Experiment;

const experimentFactories = new Map<string, ExperimentFactory>([
  ['area-force', (context) => new AreaForceExperiment(context)],
  ['ball-rolling', (context) => new BallRollingExperiment(context)],
  ['box-throwing', (context) => new BoxThrowingExperiment(context)],
  ['car', (context) => new CarExperiment(context)],
  ['cell-space-partitioning', (context) => new CellSpaceExperiment(context)],
  ['collision-capsule-circle', (context) => new CapsuleCircleExperiment(context)],
  ['collision-circle-circle', (context) => new CircleCollisionExperiment(context)],
  ['collision-line-circle', (context) => new LineCircleExperiment(context)],
  ['collision-poly-circle', (context) => new PolygonCircleExperiment(context)],
  ['circle-jelly', (context) => new CircleJellyExperiment(context)],
  ['cloth-destroy', (context) => new ClothDestroyExperiment(context)],
  ['closest-point', (context) => new ClosestPointExperiment(context)],
  ['connect-node-set', (context) => new ConnectNodeSetExperiment(context)],
  ['constraint-list', (context) => new ConstraintListExperiment(context)],
  ['curve-move', (context) => new CurveMoveExperiment(context)],
  ['cutting-rope', (context) => new CuttingRopeExperiment(context)],
  ['ease-motion-bug', (context) => new EaseMotionBugExperiment(context)],
  ['figure', (context) => new FigureExperiment(context)],
  ['flow-simulation', (context) => new FlowSimulationExperiment(context)],
  ['gasket', (context) => new GasketExperiment(context)],
  ['gear', (context) => new GearExperiment(context)],
  ['g-force', (context) => new GForceExperiment(context)],
  ['image-fun', (context) => new ImageFunExperiment(context)],
  ['interpolation-rotate', (context) => new InterpolationRotateExperiment(context)],
  ['interpolation-trace', (context) => new InterpolationTraceExperiment(context)],
  ['kinetic', (context) => new KineticExperiment(context)],
  ['line-resolve-2', (context) => new LineResolve2Experiment(context)],
  ['line-resolve-drawing', (context) => new LineDrawingExperiment(context)],
  ['light-ver-1', (context) => new LightVer1Experiment(context)],
  ['light-ver-2', (context) => new LightVer2Experiment(context)],
  ['linear-spring-cloth', (context) => new LinearSpringClothExperiment(context)],
  ['mouse-moving-energy', (context) => new MouseMovingEnergyExperiment(context)],
  ['optimize', (context) => new OptimizeExperiment(context)],
  ['particle', (context) => new ParticlePoolExperiment(context)],
  ['particle-circle', (context) => new ParticleCircleExperiment(context)],
  ['particle-connection', (context) => new ParticleConnectionExperiment(context)],
  ['particle-effect', (context) => new ParticleEffectExperiment(context)],
  ['particle-mouse', (context) => new ParticleMouseExperiment(context)],
  ['particle-tail', (context) => new ParticleTailExperiment(context)],
  ['reality-snow', (context) => new RealitySnowExperiment(context)],
  ['softbody', (context) => new SoftbodyExperiment(context)],
  ['softbody-struct-test', (context) => new SoftbodyStructTestExperiment(context)],
  ['time-scaling', (context) => new TimeScalingExperiment(context)],
  ['torque', (context) => new TorqueExperiment(context)],
  ['product-calcu-radians', (context) => new VectorRadiansExperiment(context)],
  ['sat', (context) => new SatExperiment(context)],
]);

export function createRegisteredExperiment(
  context: ExperimentContext,
): Experiment | undefined {
  return experimentFactories.get(context.definition.id)?.(context);
}

export function registeredExperimentIds(): ReadonlySet<string> {
  return new Set(experimentFactories.keys());
}
