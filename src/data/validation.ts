import { z } from 'zod';
import type { ProjectCollection } from './Project';

const githubLinkSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => URL.canParse(value) && value.startsWith('https://github.com/'),
    'Must be an absolute GitHub URL',
  );

const projectPageLinkSchema = z
  .string()
  .trim()
  .regex(
    /^\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/,
    'Must be an absolute project path ending with a slash',
  );

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a six-digit hexadecimal color');

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a lowercase slug');

const galaxySchema = z.object({
  id: slugSchema,
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  color: colorSchema,
  order: z.number().int(),
  atmosphere: z.object({
    backgroundColor: colorSchema,
    starColor: colorSchema,
    dustColor: colorSchema,
    starOpacity: z.number().min(0).max(1),
    dustOpacity: z.number().min(0).max(1),
    motionScale: z.number().min(0).max(2),
  }),
  starProfile: z.object({
    seed: z.number().int(),
    colors: z.object({
      base: colorSchema,
      middle: colorSchema,
      hot: colorSchema,
    }),
    patternScale: z.number().min(1).max(12),
    flowSpeed: z.number().min(0).max(0.2),
    pulseAmount: z.number().min(0).max(0.05),
    corona: z
      .object({
        color: colorSchema,
        innerScale: z.number().min(1.1).max(2),
        outerScale: z.number().min(1.5).max(3),
        irregularity: z.number().min(0).max(0.18),
        opacity: z.number().min(0).max(0.3),
      })
      .refine((corona) => corona.outerScale > corona.innerScale, {
        message: 'outerScale must be greater than innerScale',
        path: ['outerScale'],
      }),
  }),
});

const projectSchema = z.object({
  id: slugSchema,
  galaxyId: slugSchema,
  name: z.string().trim().min(1),
  summary: z.string(),
  status: z.enum(['active', 'legacy', 'archived']),
  featured: z.boolean(),
  order: z.number().int(),
  tags: z.array(z.string().trim().min(1)),
  links: z.object({
    github: githubLinkSchema.nullable(),
    page: projectPageLinkSchema.optional(),
  }),
  details: z.object({
    category: z.string().trim().min(1),
    description: z.string().trim().min(1),
    techStack: z.array(z.string().trim().min(1)).min(1),
  }),
  planet: z.object({
    seed: z.number().int(),
    orbit: z.object({
      radius: z.number().positive(),
      speed: z.number().nonnegative(),
      startAngle: z.number().finite(),
      inclination: z.number().min(-90).max(90),
    }),
    rotation: z.object({
      speed: z.number().nonnegative(),
      direction: z.enum(['clockwise', 'counterclockwise']),
      axisTilt: z.number().min(-180).max(180),
    }),
    shape: z.object({
      radius: z.number().positive(),
      roughness: z.number().min(0).max(0.5),
      frequency: z.number().positive().max(16),
    }),
    surface: z.object({
      baseColor: colorSchema,
    }),
    ring: z.object({
      enabled: z.boolean(),
      color: colorSchema,
      width: z.number().nonnegative(),
      tilt: z.number().min(-180).max(180),
    }),
  }),
});

const projectCollectionSchema = z
  .object({
    version: z.literal(4),
    galaxies: z.array(galaxySchema).min(1),
    projects: z.array(projectSchema),
  })
  .superRefine(({ galaxies, projects }, context) => {
    const galaxyIds = new Set<string>();
    const projectIds = new Set<string>();

    galaxies.forEach((galaxy, index) => {
      if (galaxyIds.has(galaxy.id)) {
        context.addIssue({
          code: 'custom',
          path: ['galaxies', index, 'id'],
          message: `Duplicate galaxy id: ${galaxy.id}`,
        });
      }

      galaxyIds.add(galaxy.id);
    });

    projects.forEach((project, index) => {
      if (projectIds.has(project.id)) {
        context.addIssue({
          code: 'custom',
          path: ['projects', index, 'id'],
          message: `Duplicate project id: ${project.id}`,
        });
      }

      if (!galaxyIds.has(project.galaxyId)) {
        context.addIssue({
          code: 'custom',
          path: ['projects', index, 'galaxyId'],
          message: `Unknown galaxy id: ${project.galaxyId}`,
        });
      }

      projectIds.add(project.id);
    });
  });

export class ProjectDataValidationError extends Error {
  readonly issues: z.core.$ZodIssue[];

  constructor(error: z.ZodError) {
    const details = error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    super(`Invalid project data: ${details}`);
    this.name = 'ProjectDataValidationError';
    this.issues = error.issues;
  }
}

export function parseProjectCollection(input: unknown): ProjectCollection {
  const result = projectCollectionSchema.safeParse(input);

  if (!result.success) {
    throw new ProjectDataValidationError(result.error);
  }

  return result.data;
}
