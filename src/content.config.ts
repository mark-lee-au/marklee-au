import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string().trim().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    summary: z.string().trim().min(1),
    question: z.string().trim().min(1),
    category: z.enum(['data', 'maps', 'lab']),
    status: z.enum(['idea', 'prototype', 'published', 'archived']),
    featured: z.boolean().default(false),
    sortOrder: z.number().int().nonnegative().default(100),
    publishedDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    previewImage: image().optional(),
    previewAlt: z.string().default(''),
    sources: z.array(z.object({
      name: z.string().trim().min(1),
      url: z.url({ protocol: /^https?$/ }),
    })).default([]),
    repositoryUrl: z.url({ protocol: /^https?$/ }).optional(),
  }),
});

export const collections = { projects };
