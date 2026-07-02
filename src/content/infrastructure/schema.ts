/**
 * Content Collection Schema — Infrastructure
 * Zod schemas for Astro content collections.
 */

import { z } from 'zod';

/**
 * Schema for individual slide markdown files.
 * Frontmatter is optional — slides can be pure markdown.
 */
export const SlideSchema = z.object({
  slideClass: z.string().optional(),
  notes: z.string().optional(),
  transition: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundColor: z.string().optional(),
});

export type SlideSchemaType = z.infer<typeof SlideSchema>;
