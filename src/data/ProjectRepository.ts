import type { Project, ProjectCollection } from './Project';

export interface ProjectRepository {
  getCollection(): Promise<ProjectCollection>;
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
}
