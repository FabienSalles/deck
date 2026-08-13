import { Command } from 'commander';

import { resolveContentDir } from '../../integration/manifest.js';
import { createConfig } from '../core/ExportConfig.js';
import { ExportOrchestrator, type ExportSummary } from '../core/ExportOrchestrator.js';
import { DeckScanner } from '../core/DeckScanner.js';
import { DecktapeExporter } from '../exporters/DecktapeExporter.js';
import { PuppeteerExporter } from '../exporters/PuppeteerExporter.js';
import { createLogger } from '../utils/Logger.js';

/**
 * Print export summary to the console
 */
function printSummary(summary: ExportSummary): void {
  console.log('\n=== Export Summary ===');
  console.log(`Total:     ${summary.total}`);
  console.log(`Succeeded: ${summary.succeeded}`);
  console.log(`Failed:    ${summary.failed}`);
  console.log(`Duration:  ${(summary.duration / 1000).toFixed(1)}s`);

  if (summary.failed > 0) {
    console.log('\nFailed exports:');
    summary.results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.outputPath}: ${r.error}`);
      });
  }
}

/**
 * Create and configure the CLI
 */
export function createCli(): Command {
  const program = new Command();

  program
    .name('deck-pdf')
    .description('Export deck presentations and documents to PDF')
    .version('1.0.0');

  // Global options
  program
    .option('-v, --verbose', 'Enable verbose logging')
    .option('--base-url <url>', 'Base URL of the server', 'http://localhost:4321')
    .option('--output-dir <dir>', 'Output directory for PDFs', 'public/pdf')
    .option('--content-dir <dir>', "Content directory (default: the integration's contentBase)")
    .option('--concurrency <n>', 'Max concurrent exports', '3');

  // Export all decks
  program
    .command('all')
    .description('Export all decks')
    .action(async () => {
      const summary = await runExport(program, 'all');
      process.exit(exitCode(summary));
    });

  // Export specific deck slides
  program
    .command('slides <path>')
    .description('Export a specific deck (e.g., ddd/session-1)')
    .action(async (path: string) => {
      const summary = await runExport(program, 'slides', { path });
      process.exit(exitCode(summary));
    });

  // Export single exercise
  program
    .command('exercise <deck> <num>')
    .description('Export a single exercise (e.g., ddd/session-1 01)')
    .action(async (deck: string, num: string) => {
      const summary = await runExport(program, 'exercise', { deck, num });
      process.exit(exitCode(summary));
    });

  // Export single correction
  program
    .command('correction <deck> <num>')
    .description('Export a single correction (e.g., ddd/session-1 01)')
    .action(async (deck: string, num: string) => {
      const summary = await runExport(program, 'correction', { deck, num });
      process.exit(exitCode(summary));
    });

  // Default command (export all)
  program.action(async () => {
    const summary = await runExport(program, 'all');
    process.exit(exitCode(summary));
  });

  return program;
}

// An export that found nothing to do is a misconfiguration, not a success: the
// content directory must match the integration's `contentBase`, and a silent
// zero would let a pipeline publish an empty release.
function exitCode(summary: ExportSummary): number {
  if (summary.total === 0) {
    process.stderr.write(
      'No deck found. Build the site once so the integration writes .deck/config.json, ' +
        'or point --content-dir at the collection it renders.\n',
    );

    return 1;
  }

  return summary.failed > 0 ? 1 : 0;
}

/**
 * Run export based on command
 */
async function runExport(
  program: Command,
  command: 'all' | 'slides' | 'exercise' | 'correction',
  args?: { path?: string; deck?: string; num?: string }
): Promise<ExportSummary> {
  const opts = program.opts<{
    verbose?: boolean;
    baseUrl: string;
    outputDir: string;
    contentDir?: string;
    concurrency: string;
  }>();

  // Create configuration
  const config = createConfig({
    baseUrl: opts.baseUrl,
    outputDir: opts.outputDir,
    contentDir: resolveContentDir(process.cwd(), opts.contentDir),
    maxConcurrentDecks: parseInt(opts.concurrency, 10),
  });

  // Create logger
  const logger = createLogger('PDF Export', opts.verbose);

  logger.info('=== PDF Export Script ===');

  // Create services
  const scanner = new DeckScanner(config, logger);
  const orchestrator = new ExportOrchestrator(config, scanner, logger);

  // Register exporters
  orchestrator.registerExporter(new DecktapeExporter(config, logger));
  orchestrator.registerExporter(new PuppeteerExporter(config, logger));

  // Run appropriate export
  let summary: ExportSummary;

  switch (command) {
    case 'all':
      summary = await orchestrator.exportAll();
      break;

    case 'slides':
      if (!args?.path) throw new Error('Deck path is required');
      summary = await orchestrator.exportByPath(args.path);
      break;

    case 'exercise':
      if (!args?.deck || !args?.num) throw new Error('Deck path and number are required');
      summary = await orchestrator.exportSingleItem(args.deck, 'exercice', args.num);
      break;

    case 'correction':
      if (!args?.deck || !args?.num) throw new Error('Deck path and number are required');
      summary = await orchestrator.exportSingleItem(args.deck, 'correction', args.num);
      break;
  }

  printSummary(summary);

  return summary;
}
