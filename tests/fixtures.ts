import type { ProjectCollection } from '../src/data/Project';

export function createValidProjectCollection(): ProjectCollection {
  return {
    version: 3,
    galaxies: [
      {
        id: 'sample-galaxy',
        name: 'Sample galaxy',
        description: 'A sample galaxy used by the test suite.',
        color: '#ffd28a',
        order: 10,
        atmosphere: {
          backgroundColor: '#071015',
          starColor: '#ffe9bc',
          dustColor: '#67d6c2',
          starOpacity: 0.88,
          dustOpacity: 0.25,
          motionScale: 1,
        },
      },
    ],
    projects: [
      {
        id: 'sample-project',
        galaxyId: 'sample-galaxy',
        name: 'Sample project',
        summary: '',
        status: 'legacy',
        featured: true,
        order: 10,
        tags: [],
        links: {
          github: 'https://github.com/cjftya/sample-project',
        },
        details: {
          category: 'Sample',
          description: 'A sample project used by the test suite.',
          techStack: ['TypeScript'],
        },
        planet: {
          seed: 1001,
          orbit: {
            radius: 5,
            speed: 0.08,
            startAngle: 0,
            inclination: 0,
          },
          rotation: {
            speed: 0.15,
            direction: 'counterclockwise',
            axisTilt: 8,
          },
          shape: {
            radius: 0.7,
            roughness: 0.04,
            frequency: 2,
          },
          surface: {
            baseColor: '#7fd1b9',
          },
          ring: {
            enabled: false,
            color: '#ffffff',
            width: 0.2,
            tilt: 0,
          },
        },
      },
    ],
  };
}
