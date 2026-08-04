import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parseProjectCollection } from '../src/data/validation';

describe('public/data/projects.json', () => {
  it('matches the runtime project schema', async () => {
    const fileUrl = new URL('../public/data/projects.json', import.meta.url);
    const input: unknown = JSON.parse(await readFile(fileUrl, 'utf8'));

    const collection = parseProjectCollection(input);

    expect(collection.galaxies.map((galaxy) => galaxy.id)).toEqual([
      'jelly-garden',
      'pages-archive',
    ]);
    expect(collection.projects.map((project) => project.id)).toEqual([
      'lottery-chart',
      'rainbow',
      'llm-android-leakchecker',
      'jelly-tracer',
      'jelly-sim-v1',
      'jelly-markdown',
      'viola',
      'wedding-card',
    ]);
    expect(collection.projects).toHaveLength(8);
    expect(
      collection.galaxies.every(
        (galaxy) =>
          galaxy.atmosphere.starOpacity > 0 &&
          galaxy.atmosphere.dustOpacity >= 0 &&
          galaxy.atmosphere.motionScale >= 0,
      ),
    ).toBe(true);
    expect(collection.galaxies[0]!.atmosphere.motionScale).toBeGreaterThan(
      collection.galaxies[1]!.atmosphere.motionScale,
    );
    expect(collection.galaxies[0]!.starProfile.patternScale).toBeLessThan(
      collection.galaxies[1]!.starProfile.patternScale,
    );
    expect(collection.galaxies[0]!.starProfile.corona.outerScale).toBeGreaterThan(
      collection.galaxies[1]!.starProfile.corona.outerScale,
    );
    expect(
      collection.projects.filter((project) => project.galaxyId === 'jelly-garden'),
    ).toHaveLength(6);
    expect(
      collection.projects.filter((project) => project.galaxyId === 'pages-archive'),
    ).toHaveLength(2);
    expect(
      collection.projects
        .filter((project) => project.galaxyId === 'jelly-garden')
        .every(
          (project) =>
            Object.keys(project.links).length === 1 &&
            project.links.github?.startsWith('https://github.com/cjftya/'),
        ),
    ).toBe(true);
    expect(
      collection.projects
        .filter((project) => project.galaxyId === 'pages-archive')
        .every((project) => project.links.github === null),
    ).toBe(true);
    expect(
      collection.projects.find((project) => project.id === 'viola')?.links,
    ).toEqual({
      github: null,
      page: '/projects/viola/',
    });
    expect(
      collection.projects.find((project) => project.id === 'wedding-card')?.links,
    ).toEqual({
      github: null,
      page: '/projects/weddingcard/',
    });
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
