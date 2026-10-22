import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    category: z.string(),
    readingTime: z.string(),
    featured: z.boolean().default(false),
    externalUrl: z.string().url().optional(),
    summary: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    hero: image().optional(),
    heroAlt: z.string().optional(),
    heroCaption: z.string().optional(),
    ogImage: z.string().optional(),
    ogImageAlt: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    sourceLabel: z.string().optional(),
    license: z.string().url().optional(),
    credit: z.string().optional(),
    temporalCoverage: z.string().optional(),
    geo: z.object({ region: z.string(), placename: z.string(), lat: z.number(), lon: z.number() }).optional(),
    places: z.array(z.record(z.any())).default([]),
    sources: z.array(z.object({ name: z.string(), url: z.string().url() })).default([]),
    downloads: z.array(z.object({ file: z.string(), label: z.string(), width: z.number(), height: z.number() })).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([])
  })
});

export const collections = { posts };
