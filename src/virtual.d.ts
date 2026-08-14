/**
 * Type declaration for the virtual:deck/config module.
 * Consumers can import this for type-safe access to the resolved config.
 */

declare module 'virtual:deck/config' {
  import type { DeckConfig } from '@conveycode/deck';

  const config: Required<DeckConfig>;
  export default config;
}

declare module 'virtual:deck/styles/presentation' {}
declare module 'virtual:deck/styles/document' {}
declare module 'virtual:deck/styles/home' {}
