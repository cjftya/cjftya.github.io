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
      'rainbow',
      'llm-android-leakchecker',
      'jelly-tracer',
      'jelly-sim-v1',
      'jelly-markdown',
      'lite-computer-use',
      'viola',
      'wedding-card',
      'uriel',
      'virus-sim',
      'jelly-oasis',
    ]);
    expect(collection.projects).toHaveLength(11);
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
    ).toHaveLength(5);
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
        .filter((project) => !['virus-sim', 'jelly-oasis'].includes(project.id))
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
      collection.projects.find((project) => project.id === 'uriel')?.links,
    ).toEqual({
      github: null,
      page: '/projects/uriel/',
    });
    expect(
      collection.projects.find((project) => project.id === 'virus-sim')?.links,
    ).toEqual({
      github: 'https://github.com/cjftya/cjftya.github.io/tree/master/src/virus-sim',
      page: '/projects/virus-sim/',
    });
    expect(
      collection.projects.find((project) => project.id === 'jelly-oasis'),
    ).toMatchObject({
      galaxyId: 'pages-archive',
      links: {
        github:
          'https://github.com/cjftya/cjftya.github.io/tree/master/src/jelly-oasis',
        page: '/projects/jelly-oasis/',
      },
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
