import { describe, expect, it } from 'vitest';
import type { Project } from '../src/data/Project';
import { getProjectDetailActions } from '../src/ui/projectActionPolicy';
import { createValidProjectCollection } from './fixtures';

function createProject(galaxyId: string): Project {
  const project = structuredClone(createValidProjectCollection().projects[0]!);
  project.galaxyId = galaxyId;
  project.links = {
    github: 'https://github.com/cjftya/sample-project',
    page: '/projects/sample-project/',
  };
  return project;
}

describe('project detail action policy', () => {
  it('shows both available actions in Pages Archive', () => {
    expect(getProjectDetailActions(createProject('pages-archive'))).toEqual({
      github: 'https://github.com/cjftya/sample-project',
      page: '/projects/sample-project/',
    });
  });

  it('shows only the GitHub action in Jelly Garden', () => {
    expect(getProjectDetailActions(createProject('jelly-garden'))).toEqual({
      github: 'https://github.com/cjftya/sample-project',
      page: null,
    });
  });

  it('hides both actions for Wedding Card', () => {
    const project = createProject('pages-archive');
    project.id = 'wedding-card';

    expect(getProjectDetailActions(project)).toEqual({
      github: null,
      page: null,
    });
  });

  it('keeps the Pages Archive action area hidden without a destination', () => {
    const project = createProject('pages-archive');
    project.links = { github: null };

    expect(getProjectDetailActions(project)).toEqual({
      github: null,
      page: null,
    });
  });
});
