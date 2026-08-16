import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';

import { DEFAULT_CONFIG } from '../../src/pdf-export/core/ExportConfig';
import { SilentLogger } from '../../src/pdf-export/utils/Logger';

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}));

vi.mock('../../src/pdf-export/exporters/BrowserPool.js', () => ({
  resolveExecutablePath: () => '/path/to/chrome',
}));

import { DecktapeExporter } from '../../src/pdf-export/exporters/DecktapeExporter';

class FakeChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}

describe('DecktapeExporter - export()', () => {
  let fakeChild: FakeChildProcess;

  beforeEach(() => {
    fakeChild = new FakeChildProcess();
    spawnMock.mockReset();
    spawnMock.mockImplementation(() => {
      queueMicrotask(() => fakeChild.emit('close', 0));
      return fakeChild;
    });
  });

  it('should not trigger a browser download on the first run', async () => {
    // GIVEN a Decktape exporter with default config
    const exporter = new DecktapeExporter(DEFAULT_CONFIG, new SilentLogger());

    // WHEN exporting a slide target
    await exporter.export({ deckPath: 'ddd/session-1', type: 'slides' });

    // THEN the spawned process is told to skip Puppeteer's own browser download
    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [, , options] = spawnMock.mock.calls[0] as [string, string[], { env?: Record<string, string> }];
    expect(options.env?.['PUPPETEER_SKIP_DOWNLOAD']).toBe('1');
  });

  it('should still inherit the rest of the process environment', async () => {
    // GIVEN a Decktape exporter and a marker on the current environment
    process.env['DECK_PDF_TEST_MARKER'] = 'present';
    const exporter = new DecktapeExporter(DEFAULT_CONFIG, new SilentLogger());

    // WHEN exporting a slide target
    await exporter.export({ deckPath: 'ddd/session-1', type: 'slides' });

    // THEN the inherited environment is preserved alongside the new variable
    const [, , options] = spawnMock.mock.calls[0] as [string, string[], { env?: Record<string, string> }];
    expect(options.env?.['DECK_PDF_TEST_MARKER']).toBe('present');
    delete process.env['DECK_PDF_TEST_MARKER'];
  });
});
