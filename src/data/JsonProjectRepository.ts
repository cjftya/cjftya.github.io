import type { Project, ProjectCollection } from './Project';
import type { ProjectRepository } from './ProjectRepository';
import { parseProjectCollection } from './validation';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class JsonProjectRepository implements ProjectRepository {
  private collectionPromise: Promise<ProjectCollection> | undefined;

  constructor(
    private readonly dataUrl = '/data/projects.json',
    private readonly fetcher: Fetcher = globalThis.fetch.bind(globalThis),
  ) {}

  async getCollection(): Promise<ProjectCollection> {
    this.collectionPromise ??= this.loadCollection();
    const collection = await this.collectionPromise;

    return {
      version: collection.version,
      galaxies: [...collection.galaxies],
      projects: [...collection.projects],
    };
  }

  async getProjects(): Promise<Project[]> {
    return [...(await this.getCollection()).projects];
  }

  async getProject(id: string): Promise<Project | undefined> {
    const projects = await this.getProjects();
    return projects.find((project) => project.id === id);
  }

  private async loadCollection(): Promise<ProjectCollection> {
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
    return {
      ...collection,
      galaxies: [...collection.galaxies].sort(
        (left, right) => left.order - right.order || left.id.localeCompare(right.id),
      ),
      projects: [...collection.projects].sort(
        (left, right) => left.order - right.order || left.id.localeCompare(right.id),
      ),
    };
  }
}
