import { defineCollection } from 'astro:content';
import { SlideSchema } from '@fabiensalles/deck/content';

export const collections = {
  decks: defineCollection({ type: 'content', schema: SlideSchema }),
};
