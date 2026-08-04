import type { Project } from '../data/Project';

const DETAIL_ACTION_GALAXY_ID = 'pages-archive';

export interface ProjectDetailActions {
  page: string | null;
  github: string | null;
}

export function getProjectDetailActions(project: Project): ProjectDetailActions {
  if (project.galaxyId !== DETAIL_ACTION_GALAXY_ID) {
    return { page: null, github: null };
  }

  return {
    page: project.links.page ?? null,
    github: project.links.github,
  };
}
