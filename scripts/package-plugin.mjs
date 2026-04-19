#!/usr/bin/env node
// Cross-platform packager. Produces a sideload-ready folder at
// dist/lite-slash-commands/ that mirrors what release CI zips up.
// Runs the same validation CI does before copying anything.
//
// Usage:
//   npm run package
//   node ./scripts/package-plugin.mjs

import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const outputDir = path.join(distRoot, 'lite-slash-commands');

const payloadFiles = ['plugin.json', 'shell.js', 'seed-prompts.json'];
const payloadDirs = ['helpers', 'locales'];

function runNode(scriptRelativePath, label, extraArgs = []) {
    const scriptPath = path.join(projectRoot, scriptRelativePath);
    if (!existsSync(scriptPath)) {
        throw new Error(`${label} script missing: ${scriptRelativePath}`);
    }

    console.log(`\n==> ${label}`);
    const result = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
        cwd: projectRoot,
        stdio: 'inherit',
    });

    if (result.status !== 0) {
        throw new Error(`${label} failed with exit code ${result.status}`);
    }
}

function ensureSourceExists(relativePath, kind) {
    const fullPath = path.join(projectRoot, relativePath);
    if (!existsSync(fullPath)) {
        throw new Error(`Payload ${kind} not found: ${relativePath}`);
    }

    const isDir = statSync(fullPath).isDirectory();
    if (kind === 'file' && isDir) {
        throw new Error(`Expected file but found directory: ${relativePath}`);
    }
    if (kind === 'directory' && !isDir) {
        throw new Error(`Expected directory but found file: ${relativePath}`);
    }
}

function resetOutputDir() {
    if (existsSync(outputDir)) {
        rmSync(outputDir, { recursive: true, force: true });
    }
    mkdirSync(outputDir, { recursive: true });
}

function copyPayload() {
    for (const relativePath of payloadFiles) {
        ensureSourceExists(relativePath, 'file');
        cpSync(path.join(projectRoot, relativePath), path.join(outputDir, relativePath));
    }

    for (const relativePath of payloadDirs) {
        ensureSourceExists(relativePath, 'directory');
        cpSync(path.join(projectRoot, relativePath), path.join(outputDir, relativePath), {
            recursive: true,
        });
    }
}

try {
    runNode('scripts/check-manifests.mjs', 'Validating plugin manifest', ['./plugin.json']);
    runNode('helpers/__selftest__.mjs', 'Running self-tests');

    resetOutputDir();
    copyPayload();

    console.log(`\nPackaged Lite Slash Commands to ${path.relative(projectRoot, outputDir)}`);
    console.log('Sideload this folder directly in Cerebr developer mode.');
} catch (error) {
    console.error(`\n${error.message || error}`);
    process.exit(1);
}
