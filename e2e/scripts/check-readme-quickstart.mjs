#!/usr/bin/env node
// Run from the repo root: proves the README's quick-start block is the command sequence the
// e2e workflow actually runs, not a paraphrase of it.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const readmePath = path.resolve('README.md');
const workflowPath = path.resolve('.github/workflows/e2e.yml');

const readme = readFileSync(readmePath, 'utf8');
const workflow = yaml.load(readFileSync(workflowPath, 'utf8'));

const failures = [];

const quickstartHeadingMatch = readme.match(/^#+\s*Quick ?start\s*$/im);
if (!quickstartHeadingMatch) {
  failures.push('README.md has no "Quick start" heading');
}

const afterHeading = quickstartHeadingMatch ? readme.slice(quickstartHeadingMatch.index) : '';
const codeBlockMatch = afterHeading.match(/```(?:bash|sh)\n([\s\S]*?)```/);
if (!codeBlockMatch) {
  failures.push('README.md has no bash/sh code block under "Quick start"');
}

const readmeCommands = codeBlockMatch
  ? codeBlockMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
  : [];

const e2eJob = workflow?.jobs?.e2e;
const ciSteps = (e2eJob?.steps ?? [])
  .filter((step) => typeof step.run === 'string')
  .map((step) => ({
    dir: step['working-directory'] ?? '.',
    commands: step.run
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  }));

let cwd = '.';
let ciIndex = 0;

for (const command of readmeCommands) {
  const cdMatch = command.match(/^cd (\S+)$/);
  if (cdMatch) {
    cwd = cdMatch[1];
    continue;
  }

  let found = false;
  while (ciIndex < ciSteps.length) {
    const step = ciSteps[ciIndex];
    const commandIndexInStep = step.commands.indexOf(command);

    if (step.dir === cwd && commandIndexInStep !== -1) {
      found = true;
      ciIndex += 1;
      break;
    }

    ciIndex += 1;
  }

  if (!found) {
    failures.push(`Quick start command "${command}" (in ${cwd}) does not match the e2e workflow sequence`);
  }
}

if (readmeCommands.length === 0) {
  failures.push('README.md "Quick start" code block has no commands');
}

if (failures.length > 0) {
  console.error('README quickstart check failed:\n' + failures.map((failure) => `  - ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`README quickstart check passed: ${readmeCommands.length} commands match the e2e workflow sequence.`);
