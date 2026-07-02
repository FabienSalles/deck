import { defineCollection } from 'astro:content';
import { SlideSchema } from '@conveycode/deck/content';

export const collections = {
  decks: defineCollection({ type: 'content', schema: SlideSchema }),
};
