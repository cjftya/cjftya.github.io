import { z } from 'zod';
import type { ProjectCollection } from './Project';

const nullableLinkSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => value.startsWith('/') || URL.canParse(value),
    'Must be a root-relative path or an absolute URL',
  )
  .nullable();

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a six-digit hexadecimal color');

const projectSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a lowercase slug'),
  name: z.string().trim().min(1),
  summary: z.string(),
  status: z.enum(['active', 'legacy', 'archived']),
  featured: z.boolean(),
  order: z.number().int(),
  tags: z.array(z.string().trim().min(1)),
  links: z.object({
    page: nullableLinkSchema,
    github: nullableLinkSchema,
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
      texture: nullableLinkSchema,
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
    version: z.literal(1),
    projects: z.array(projectSchema),
  })
  .superRefine(({ projects }, context) => {
    const ids = new Set<string>();

    projects.forEach((project, index) => {
      if (ids.has(project.id)) {
        context.addIssue({
          code: 'custom',
          path: ['projects', index, 'id'],
          message: `Duplicate project id: ${project.id}`,
        });
      }

      ids.add(project.id);
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
