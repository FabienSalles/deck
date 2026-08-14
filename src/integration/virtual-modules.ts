/**
 * Virtual Modules
 * Provides `virtual:deck/config` so injected pages can access the resolved
 * config, and `virtual:deck/styles/<slot>` so layouts load whichever stylesheet
 * the consumer configured instead of a hardcoded one.
 */

import type { ResolvedDeckConfig, StyleSlot } from './config';
import { STYLE_SLOTS } from './config';
import type { Plugin } from 'vite';

const VIRTUAL_MODULE_ID = 'virtual:deck/config';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

const STYLE_PREFIX = 'virtual:deck/styles/';

function styleSlotOf(id: string): StyleSlot | null {
  const slot = id.startsWith(STYLE_PREFIX) ? id.slice(STYLE_PREFIX.length) : null;

  return STYLE_SLOTS.includes(slot as StyleSlot) ? (slot as StyleSlot) : null;
}

export function virtualDeckConfig(config: ResolvedDeckConfig): Plugin {
  return {
    name: 'deck-virtual-config',

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID || styleSlotOf(id) !== null) {
        return '\0' + id;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `export default ${JSON.stringify(config)};`;
      }

      const slot = styleSlotOf(id.slice(1));

      if (slot !== null) {
        return `import ${JSON.stringify(config.styles[slot])};`;
      }
    },
  };
}
