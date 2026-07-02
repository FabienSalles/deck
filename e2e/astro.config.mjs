import { defineConfig } from 'astro/config';
import deck from '@conveycode/deck';

export default defineConfig({
  integrations: [deck()],
  server: { port: 4322 },
  output: 'static',
});
