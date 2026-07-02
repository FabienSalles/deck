/**
 * Virtual Modules
 * Provides `virtual:deck/config` so injected pages can access the resolved config.
 */

import type { DeckConfig } from './config';
import type { Plugin } from 'vite';

const VIRTUAL_MODULE_ID = 'virtual:deck/config';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export function virtualDeckConfig(config: Required<DeckConfig>): Plugin {
  return {
    name: 'deck-virtual-config',

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `export default ${JSON.stringify(config)};`;
      }
    },
  };
}
