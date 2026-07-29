import type { Project } from './Project';
import type { ProjectRepository } from './ProjectRepository';
import { parseProjectCollection } from './validation';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class JsonProjectRepository implements ProjectRepository {
  private projectsPromise: Promise<Project[]> | undefined;

  constructor(
    private readonly dataUrl = '/data/projects.json',
    private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis),
  ) {}

  async getProjects(): Promise<Project[]> {
    this.projectsPromise ??= this.loadProjects();
    const projects = await this.projectsPromise;
    return [...projects];
  }

  async getProject(id: string): Promise<Project | undefined> {
    const projects = await this.getProjects();
    return projects.find((project) => project.id === id);
  }

  private async loadProjects(): Promise<Project[]> {
    const response = await this.fetcher(this.dataUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to load project data: ${response.status} ${response.statusText}`,
      );
    }

    const collection = parseProjectCollection(await response.json());
    return [...collection.projects].sort(
      (left, right) => left.order - right.order || left.id.localeCompare(right.id),
    );
  }
}
