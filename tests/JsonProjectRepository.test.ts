import { describe, expect, it, vi } from 'vitest';
import { JsonProjectRepository } from '../src/data/JsonProjectRepository';
import { createValidProjectCollection } from './fixtures';

describe('JsonProjectRepository', () => {
  it('loads the sorted galaxy catalog', async () => {
    const collection = createValidProjectCollection();
    collection.galaxies.push({
      id: 'earlier-galaxy',
      name: 'Earlier galaxy',
      description: 'Earlier in the selector.',
      color: '#b79cff',
      order: 1,
      atmosphere: {
        backgroundColor: '#080719',
        starColor: '#d9ddff',
        dustColor: '#8170cb',
        starOpacity: 0.62,
        dustOpacity: 0.12,
        motionScale: 0.48,
      },
    });
    const fetcher = vi.fn(async () => Response.json(collection, { status: 200 }));
    const repository = new JsonProjectRepository('/data/projects.json', fetcher);

    await expect(repository.getCollection()).resolves.toMatchObject({
      galaxies: [{ id: 'earlier-galaxy' }, { id: 'sample-galaxy' }],
    });
  });

  it('loads and returns projects ordered by the order field', async () => {
    const collection = createValidProjectCollection();
    const secondProject = structuredClone(collection.projects[0]!);
    secondProject.id = 'earlier-project';
    secondProject.name = 'Earlier project';
    secondProject.order = 1;
    collection.projects.push(secondProject);
    const fetcher = vi.fn(async () => Response.json(collection, { status: 200 }));
    const repository = new JsonProjectRepository('/data/projects.json', fetcher);

    await expect(repository.getProjects()).resolves.toMatchObject([
      { id: 'earlier-project' },
      { id: 'sample-project' },
    ]);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('returns a project by id and undefined for an unknown id', async () => {
    const fetcher = vi.fn(async () =>
      Response.json(createValidProjectCollection(), { status: 200 }),
    );
    const repository = new JsonProjectRepository('/data/projects.json', fetcher);

    await expect(repository.getProject('sample-project')).resolves.toMatchObject({
      name: 'Sample project',
    });
    await expect(repository.getProject('missing')).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
