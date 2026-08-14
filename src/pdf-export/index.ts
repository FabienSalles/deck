#!/usr/bin/env node

/**
 * @conveycode/deck -- PDF Export CLI
 *
 * Usage:
 *   deck-pdf all                          # Export all decks
 *   deck-pdf slides ddd/session-1         # Export specific deck slides
 *   deck-pdf exercise ddd/session-1 01    # Export single exercise
 *   deck-pdf correction ddd/session-1 01  # Export single correction
 *
 * Options:
 *   -v, --verbose           Enable verbose logging
 *   --base-url <url>        Base URL of the server
 *   --output-dir <dir>      Output directory for PDFs
 *   --content-dir <dir>     Content directory (default: the integration's contentBase)
 *   --concurrency <n>       Max concurrent exports
 */

import { createCli } from './cli/cli.js';

const cli = createCli();
cli.parse(process.argv);
