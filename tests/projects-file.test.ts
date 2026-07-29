import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parseProjectCollection } from '../src/data/validation';

describe('public/data/projects.json', () => {
  it('matches the runtime project schema', async () => {
    const fileUrl = new URL('../public/data/projects.json', import.meta.url);
    const input: unknown = JSON.parse(await readFile(fileUrl, 'utf8'));

    const collection = parseProjectCollection(input);

    expect(collection.projects.map((project) => project.id)).toEqual([
      'lottery-chart',
      'rainbow',
      'llm-android-leakchecker',
      'jelly-tracer',
      'jelly-sim-v1',
      'jelly-markdown',
    ]);
    expect(collection.projects).toHaveLength(6);
    expect(collection.projects).not.toContainEqual(
      expect.objectContaining({ id: 'viola' }),
    );
    expect(collection.projects).not.toContainEqual(
      expect.objectContaining({ id: 'wedding-card' }),
    );
    expect(
      collection.projects.every((project) =>
        project.links.github?.startsWith('https://github.com/cjftya/'),
      ),
    ).toBe(true);
    expect(
      collection.projects.every(
        (project) =>
          project.details.description.length > 0 &&
          project.details.techStack.length > 0,
      ),
    ).toBe(true);
    expect(
      collection.projects.every(
        (project) => Object.keys(project.planet.surface).length === 1,
      ),
    ).toBe(true);
  });
});
