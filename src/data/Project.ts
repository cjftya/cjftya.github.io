export type ProjectStatus = 'active' | 'legacy' | 'archived';
export type RotationDirection = 'clockwise' | 'counterclockwise';

export interface GalaxyAtmosphere {
  backgroundColor: string;
  starColor: string;
  dustColor: string;
  starOpacity: number;
  dustOpacity: number;
  motionScale: number;
}

export interface Galaxy {
  id: string;
  name: string;
  description: string;
  color: string;
  order: number;
  atmosphere: GalaxyAtmosphere;
}

export interface ProjectLinks {
  github: string | null;
}

export interface ProjectDetails {
  category: string;
  description: string;
  techStack: string[];
}

export interface OrbitSettings {
  radius: number;
  speed: number;
  startAngle: number;
  inclination: number;
}

export interface RotationSettings {
  speed: number;
  direction: RotationDirection;
  axisTilt: number;
}

export interface ShapeSettings {
  radius: number;
  roughness: number;
  frequency: number;
}

export interface SurfaceSettings {
  baseColor: string;
}

export interface RingSettings {
  enabled: boolean;
  color: string;
  width: number;
  tilt: number;
}

export interface PlanetSettings {
  seed: number;
  orbit: OrbitSettings;
  rotation: RotationSettings;
  shape: ShapeSettings;
  surface: SurfaceSettings;
  ring: RingSettings;
}

export interface Project {
  id: string;
  galaxyId: string;
  name: string;
  summary: string;
  status: ProjectStatus;
  featured: boolean;
  order: number;
  tags: string[];
  links: ProjectLinks;
  details: ProjectDetails;
  planet: PlanetSettings;
}

export interface ProjectCollection {
  version: 3;
  galaxies: Galaxy[];
  projects: Project[];
}
