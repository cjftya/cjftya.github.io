import type { Experiment, ExperimentContext } from '../core/Experiment';
import { BallRollingExperiment } from './ball-rolling/BallRollingExperiment';
import { CellSpaceExperiment } from './cell-space/CellSpaceExperiment';
import { CircleCollisionExperiment } from './circle-collision/CircleCollisionExperiment';
import { FlowSimulationExperiment } from './flow-simulation/FlowSimulationExperiment';
import { SoftbodyExperiment } from './softbody/SoftbodyExperiment';

type ExperimentFactory = (context: ExperimentContext) => Experiment;

const experimentFactories = new Map<string, ExperimentFactory>([
  ['ball-rolling', (context) => new BallRollingExperiment(context)],
  ['cell-space-partitioning', (context) => new CellSpaceExperiment(context)],
  ['collision-circle-circle', (context) => new CircleCollisionExperiment(context)],
  ['flow-simulation', (context) => new FlowSimulationExperiment(context)],
  ['softbody', (context) => new SoftbodyExperiment(context)],
]);

export function createRegisteredExperiment(
  context: ExperimentContext,
): Experiment | undefined {
  return experimentFactories.get(context.definition.id)?.(context);
}

export function registeredExperimentIds(): ReadonlySet<string> {
  return new Set(experimentFactories.keys());
}
