#!/usr/bin/env node
// Run from e2e/ after installing the packed @fabiensalles/deck tarball: proves that deck-pdf can
// export a fresh install without puppeteer having downloaded a browser of its own — it resolves
// a Chromium executable from the environment instead, then builds, previews and exports itself.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import path from 'node:path';

const BROWSER_BUILD_PREFIX = 'chromium_headless_shell-';
const EXECUTABLE_NAME = platform() === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';
const CACHE_DIRS = [
  path.join(homedir(), 'Library', 'Caches', 'ms-playwright'),
  path.join(homedir(), '.cache', 'ms-playwright'),
];
const PREVIEW_URL = 'http://localhost:4322';

function findExecutable(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      const found = findExecutable(full);
      if (found) return found;
    } else if (entry === EXECUTABLE_NAME) {
      return full;
    }
  }
  return null;
}

function resolveExecutablePath() {
  if (process.env['PUPPETEER_EXECUTABLE_PATH']) return process.env['PUPPETEER_EXECUTABLE_PATH'];

  for (const cacheDir of CACHE_DIRS) {
    if (!existsSync(cacheDir)) continue;

    const builds = readdirSync(cacheDir)
      .filter((entry) => entry.startsWith(BROWSER_BUILD_PREFIX))
      .sort((a, b) => Number(b.slice(BROWSER_BUILD_PREFIX.length)) - Number(a.slice(BROWSER_BUILD_PREFIX.length)));

    for (const build of builds) {
      const executable = findExecutable(path.join(cacheDir, build));
      if (executable) return executable;
    }
  }
  throw new Error(
    `Could not find a ${BROWSER_BUILD_PREFIX}* build under ${CACHE_DIRS.join(' or ')}. ` +
      'Install it with: npx playwright install chromium-headless-shell'
  );
}

function waitForServer(url, timeoutMs = 30000, intervalMs = 500) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          resolve();
          return;
        }
      } catch {
        // Server not up yet, retry until the deadline.
      }

      if (Date.now() > deadline) {
        reject(new Error(`Server at ${url} did not start within ${timeoutMs}ms`));
        return;
      }

      setTimeout(attempt, intervalMs);
    };

    attempt();
  });
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });

    child.on('error', reject);
  });
}

const executablePath = resolveExecutablePath();
console.log(`Using Chromium executable: ${executablePath}`);

await run('npm', ['run', 'build']);

const preview = spawn('npm', ['run', 'preview'], { stdio: 'inherit' });

try {
  await waitForServer(PREVIEW_URL);

  await run(path.join('node_modules', '.bin', 'deck-pdf'), ['all', '--base-url', PREVIEW_URL], {
    env: { ...process.env, PUPPETEER_EXECUTABLE_PATH: executablePath },
  });

  const expectedPdfs = [
    path.join('public', 'pdf', 'demo', 'session-1', 'slides.pdf'),
    path.join('public', 'pdf', 'demo', 'session-1', 'exercice-01.pdf'),
    path.join('public', 'pdf', 'demo', 'session-1', 'correction-01.pdf'),
  ];
  const missing = expectedPdfs.filter((pdfPath) => !existsSync(pdfPath));

  if (missing.length > 0) {
    throw new Error(`Expected PDFs missing after export: ${missing.join(', ')}`);
  }

  console.log(`PDF export check passed: ${expectedPdfs.join(', ')}`);
} finally {
  preview.kill();
}
