import { describe, expect, it } from 'vitest';
import {
  parseProjectCollection,
  ProjectDataValidationError,
} from '../src/data/validation';
import { createValidProjectCollection } from './fixtures';

describe('parseProjectCollection', () => {
  it('parses valid project JSON', () => {
    const input = createValidProjectCollection();

    expect(parseProjectCollection(input)).toEqual(input);
  });

  it('rejects a missing required field', () => {
    const input = createValidProjectCollection();
    const invalidProject = { ...input.projects[0] };
    Reflect.deleteProperty(invalidProject, 'name');

    expect(() =>
      parseProjectCollection({ ...input, projects: [invalidProject] }),
    ).toThrow(ProjectDataValidationError);
  });

  it('rejects duplicate project ids', () => {
    const input = createValidProjectCollection();
    input.projects.push(structuredClone(input.projects[0]!));

    expect(() => parseProjectCollection(input)).toThrow(/Duplicate project id/);
  });

  it('rejects an invalid rotation direction', () => {
    const input = createValidProjectCollection() as unknown as {
      projects: Array<{ planet: { rotation: { direction: string } } }>;
    };
    input.projects[0]!.planet.rotation.direction = 'sideways';

    expect(() => parseProjectCollection(input)).toThrow(/direction/);
  });

  it('rejects a negative planet radius', () => {
    const input = createValidProjectCollection();
    input.projects[0]!.planet.shape.radius = -1;

    expect(() => parseProjectCollection(input)).toThrow(/radius/);
  });

  it('rejects an empty technology stack', () => {
    const input = createValidProjectCollection();
    input.projects[0]!.details.techStack = [];

    expect(() => parseProjectCollection(input)).toThrow(/techStack/);
  });

  it('rejects a non-GitHub project link', () => {
    const input = createValidProjectCollection();
    input.projects[0]!.links.github = 'https://example.com/project';

    expect(() => parseProjectCollection(input)).toThrow(/GitHub URL/);
  });
});
