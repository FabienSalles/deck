/**
 * PDF export configuration
 */
export interface ExportConfig {
  /** Base URL of the dev/preview server */
  baseUrl: string;

  /** Output directory for generated PDFs */
  outputDir: string;

  /** Source directory for deck content */
  contentDir: string;

  /** Decktape CLI options for slide export */
  decktapeOptions: string[];

  /** Maximum number of decks to export in parallel */
  maxConcurrentDecks: number;

  /** Maximum number of documents per browser instance */
  maxConcurrentDocuments: number;

  /** Timeout for page navigation in ms */
  navigationTimeout: number;

  /** Timeout for waiting for selectors in ms */
  selectorTimeout: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ExportConfig = {
  baseUrl: 'http://localhost:4321',
  outputDir: 'public/pdf',
  contentDir: 'src/content/decks',
  decktapeOptions: ['--chrome-arg=--no-sandbox', '--load-pause', '3000', '--pause', '300'],
  maxConcurrentDecks: 3,
  maxConcurrentDocuments: 5,
  navigationTimeout: 30000,
  selectorTimeout: 10000,
};

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate and coerce a configuration value
 */
function validateString(value: unknown, field: string, defaultValue: string): string {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value !== 'string') {
    throw new ConfigValidationError(`${field} must be a string`, field);
  }
  return value;
}

function validateUrl(value: unknown, field: string, defaultValue: string): string {
  const str = validateString(value, field, defaultValue);
  try {
    new URL(str);
  } catch {
    throw new ConfigValidationError(`${field} must be a valid URL`, field);
  }
  return str;
}

function validatePositiveInt(value: unknown, field: string, defaultValue: number): number {
  if (value === undefined || value === null) return defaultValue;
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new ConfigValidationError(`${field} must be a positive integer`, field);
  }
  return num;
}

function validateStringArray(value: unknown, field: string, defaultValue: string[]): string[] {
  if (value === undefined || value === null) return defaultValue;
  if (!Array.isArray(value)) {
    throw new ConfigValidationError(`${field} must be an array of strings`, field);
  }
  for (const item of value) {
    if (typeof item !== 'string') {
      throw new ConfigValidationError(`${field} must contain only strings`, field);
    }
  }
  return value as string[];
}

/**
 * Validate a complete configuration object
 */
export function validateConfig(config: Record<string, unknown>): ExportConfig {
  return {
    baseUrl: validateUrl(config['baseUrl'], 'baseUrl', DEFAULT_CONFIG.baseUrl),
    outputDir: validateString(config['outputDir'], 'outputDir', DEFAULT_CONFIG.outputDir),
    contentDir: validateString(config['contentDir'], 'contentDir', DEFAULT_CONFIG.contentDir),
    decktapeOptions: validateStringArray(
      config['decktapeOptions'],
      'decktapeOptions',
      DEFAULT_CONFIG.decktapeOptions
    ),
    maxConcurrentDecks: validatePositiveInt(
      config['maxConcurrentDecks'],
      'maxConcurrentDecks',
      DEFAULT_CONFIG.maxConcurrentDecks
    ),
    maxConcurrentDocuments: validatePositiveInt(
      config['maxConcurrentDocuments'],
      'maxConcurrentDocuments',
      DEFAULT_CONFIG.maxConcurrentDocuments
    ),
    navigationTimeout: validatePositiveInt(
      config['navigationTimeout'],
      'navigationTimeout',
      DEFAULT_CONFIG.navigationTimeout
    ),
    selectorTimeout: validatePositiveInt(
      config['selectorTimeout'],
      'selectorTimeout',
      DEFAULT_CONFIG.selectorTimeout
    ),
  };
}

/**
 * Create configuration from environment and overrides
 */
export function createConfig(overrides: Partial<ExportConfig> = {}): ExportConfig {
  const envConfig: Record<string, unknown> = {};

  if (process.env['PDF_BASE_URL'] !== undefined) {
    envConfig['baseUrl'] = process.env['PDF_BASE_URL'];
  }

  return validateConfig({
    ...DEFAULT_CONFIG,
    ...envConfig,
    ...overrides,
  });
}
