import type { Experiment, ExperimentContext } from '../core/Experiment';
import { CollisionExperiment } from './CollisionExperiment';
import { ConstraintExperiment } from './ConstraintExperiment';
import { MotionExperiment } from './MotionExperiment';
import { ParticleExperiment } from './ParticleExperiment';

const motionIds = new Set([
  'product-calcu-radians',
  'time-scaling',
  'ball-rolling',
  'kinetic',
  'gasket',
  'car',
  'box-throwing',
  'torque',
  'gear',
  'curve-move',
]);

export function createExperiment(context: ExperimentContext): Experiment {
  if (context.definition.category === 'collisions')
    return new CollisionExperiment(context);
  if (
    context.definition.category === 'springs' &&
    !motionIds.has(context.definition.id)
  )
    return new ConstraintExperiment(context);
  if (motionIds.has(context.definition.id)) return new MotionExperiment(context);
  return new ParticleExperiment(context);
}
