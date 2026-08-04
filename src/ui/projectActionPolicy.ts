import type { Project } from '../data/Project';

const JELLY_GARDEN_GALAXY_ID = 'jelly-garden';
const PAGES_ARCHIVE_GALAXY_ID = 'pages-archive';
const HIDDEN_ACTION_PROJECT_ID = 'wedding-card';

export interface ProjectDetailActions {
  page: string | null;
  github: string | null;
}

export function getProjectDetailActions(project: Project): ProjectDetailActions {
  if (project.id === HIDDEN_ACTION_PROJECT_ID) {
    return { page: null, github: null };
  }

  if (project.galaxyId === JELLY_GARDEN_GALAXY_ID) {
    return { page: null, github: project.links.github };
  }

  if (project.galaxyId === PAGES_ARCHIVE_GALAXY_ID) {
    return {
      page: project.links.page ?? null,
      github: project.links.github,
    };
  }

  return { page: null, github: null };
}
