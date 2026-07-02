import { describe, it, expect } from 'vitest';
import { resolveConfig, DEFAULT_CONFIG } from '../../src/integration/config';

describe('Integration Config - resolveConfig()', () => {
  it('should return all defaults when called with empty input', () => {
    // GIVEN no user configuration
    // WHEN resolving config with empty object
    const config = resolveConfig({});

    // THEN all values match defaults
    expect(config.collection).toBe('decks');
    expect(config.contentBase).toBe('decks');
    expect(config.exercises).toBe(true);
    expect(config.corrections).toBe(true);
    expect(config.homePage).toBe(true);
    expect(config.reveal).toEqual({});
  });

  it('should return all defaults when called with no argument', () => {
    // GIVEN no argument at all
    // WHEN resolving config
    const config = resolveConfig();

    // THEN all values match defaults
    expect(config.collection).toBe('decks');
    expect(config.contentBase).toBe('decks');
    expect(config.exercises).toBe(true);
    expect(config.corrections).toBe(true);
    expect(config.homePage).toBe(true);
    expect(config.reveal).toEqual({});
  });

  it('should override only the specified values', () => {
    // GIVEN partial user configuration
    const userConfig = {
      collection: 'presentations',
      exercises: false,
    };

    // WHEN resolving config
    const config = resolveConfig(userConfig);

    // THEN overridden values are applied
    expect(config.collection).toBe('presentations');
    expect(config.exercises).toBe(false);
    // AND non-overridden values remain default
    expect(config.contentBase).toBe('decks');
    expect(config.corrections).toBe(true);
    expect(config.homePage).toBe(true);
  });

  it('should merge reveal config with defaults (shallow merge)', () => {
    // GIVEN user reveal configuration
    const userConfig = {
      reveal: {
        transition: 'fade',
        controls: false,
      },
    };

    // WHEN resolving config
    const config = resolveConfig(userConfig);

    // THEN reveal config is merged
    expect(config.reveal).toEqual({
      transition: 'fade',
      controls: false,
    });
  });
});

describe('Integration Config - DEFAULT_CONFIG', () => {
  it('should have all required fields defined', () => {
    // GIVEN the default configuration constant
    // THEN all fields exist with correct types
    expect(DEFAULT_CONFIG.collection).toBe('decks');
    expect(DEFAULT_CONFIG.contentBase).toBe('decks');
    expect(typeof DEFAULT_CONFIG.exercises).toBe('boolean');
    expect(typeof DEFAULT_CONFIG.corrections).toBe('boolean');
    expect(typeof DEFAULT_CONFIG.homePage).toBe('boolean');
    expect(DEFAULT_CONFIG.reveal).toBeDefined();
  });

  it('should enable exercises, corrections, and home page by default', () => {
    // GIVEN the default configuration
    // THEN all feature flags are true
    expect(DEFAULT_CONFIG.exercises).toBe(true);
    expect(DEFAULT_CONFIG.corrections).toBe(true);
    expect(DEFAULT_CONFIG.homePage).toBe(true);
  });
});
