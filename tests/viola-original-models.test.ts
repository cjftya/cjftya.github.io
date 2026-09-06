import { describe, expect, it } from 'vitest';
import { FixedRateStepper } from '../src/viola/core/FixedRateStepper';
import { Random } from '../src/viola/core/Random';
import { Vector2 } from '../src/viola/core/Vector2';
import { BallRollingModel } from '../src/viola/experiments/ball-rolling/BallRollingModel';
import { CellSpaceModel } from '../src/viola/experiments/cell-space/CellSpaceModel';
import { CircleCollisionModel } from '../src/viola/experiments/circle-collision/CircleCollisionModel';
import { FlowSimulationModel } from '../src/viola/experiments/flow-simulation/FlowSimulationModel';
import { registeredExperimentIds } from '../src/viola/experiments/registry';
import { SoftbodyModel } from '../src/viola/experiments/softbody/SoftbodyModel';
import { resolveCircleOverlap } from '../src/viola/physics/collision/CircleOverlap';
import { UniformGrid } from '../src/viola/physics/spatial/UniformGrid';

describe('Viola original experiment architecture', () => {
  it('routes each restored experiment through the dedicated registry', () => {
    expect(registeredExperimentIds()).toEqual(
      new Set([
        'ball-rolling',
        'cell-space-partitioning',
        'collision-circle-circle',
        'flow-simulation',
        'softbody',
      ]),
    );
  });

  it('runs fixed-rate legacy updates without frame-rate dependent scale values', () => {
    const stepper = new FixedRateStepper(1 / 60);
    let steps = 0;
    expect(stepper.consume(1 / 30, () => (steps += 1))).toBe(2);
    expect(steps).toBe(2);
  });
});

describe('shared Viola physics modules', () => {
  it('reports neighboring grid pairs once', () => {
    const grid = new UniformGrid(100, 100, 20);
    grid.rebuild([new Vector2(10, 10), new Vector2(15, 10), new Vector2(90, 90)]);
    const pairs: string[] = [];
    grid.forEachNeighborPair((left, right) => pairs.push(`${left}:${right}`));
    expect(pairs).toEqual(['0:1']);
  });

  it('separates overlapping circles and transfers the positional impulse', () => {
    const left = {
      position: new Vector2(0, 0),
      velocity: new Vector2(),
      radius: 10,
    };
    const right = {
      position: new Vector2(15, 0),
      velocity: new Vector2(),
      radius: 10,
    };
    expect(resolveCircleOverlap(left, right)).toBe(true);
    expect(Vector2.distance(left.position, right.position)).toBeCloseTo(20);
    expect(left.velocity.x).toBeCloseTo(-2.5);
    expect(right.velocity.x).toBeCloseTo(2.5);
  });
});

describe('C#-faithful Viola models', () => {
  it('applies the original Ball Rolling gravity and damping order', () => {
    const model = new BallRollingModel();
    model.step();
    expect(model.velocity.y).toBeCloseTo(0.2985);
    expect(model.position.y).toBeCloseTo(100.2985);
  });

  it('restores the original experiment population sizes', () => {
    expect(new CircleCollisionModel(new Random(1)).circles).toHaveLength(500);
    expect(new FlowSimulationModel(new Random(1)).particles).toHaveLength(300);
    expect(new CellSpaceModel(new Random(1)).bodies).toHaveLength(7_000);
  });

  it('keeps the circle collision model finite after an update', () => {
    const circles = new CircleCollisionModel(new Random(11));
    circles.step();
    for (const position of circles.circles
      .slice(0, 20)
      .map((circle) => circle.position)) {
      expect(Number.isFinite(position.x)).toBe(true);
      expect(Number.isFinite(position.y)).toBe(true);
    }
  });

  it('applies the original WASD impulse to the first collision circle', () => {
    const circles = new CircleCollisionModel(new Random(11), 1);
    circles.accelerateFirst(-1, 1);
    expect(circles.circles[0]?.velocity).toMatchObject({ x: -1, y: 1 });
  });

  it('keeps the flow model finite after an update', () => {
    const flow = new FlowSimulationModel(new Random(12));
    flow.step();
    for (const position of flow.particles
      .slice(0, 20)
      .map((particle) => particle.position)) {
      expect(Number.isFinite(position.x)).toBe(true);
      expect(Number.isFinite(position.y)).toBe(true);
    }
  });

  it('keeps the cell-space model finite after an update', () => {
    const cells = new CellSpaceModel(new Random(13));
    cells.step();
    for (const position of cells.bodies.slice(0, 20).map((body) => body.position)) {
      expect(Number.isFinite(position.x)).toBe(true);
      expect(Number.isFinite(position.y)).toBe(true);
    }
  });

  it('recreates the Softbody node and constraint topology', () => {
    const model = new SoftbodyModel();
    expect(model.nodes).toHaveLength(16);
    expect(model.links).toHaveLength(32);
    const fixedBefore = model.nodes.slice(14).map((node) => node.position.clone());
    model.step();
    expect(model.nodes[14]?.position).toMatchObject(fixedBefore[0] ?? {});
    expect(model.nodes[15]?.position).toMatchObject(fixedBefore[1] ?? {});
  });
});
