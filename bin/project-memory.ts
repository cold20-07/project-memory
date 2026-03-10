#!/usr/bin/env node

/**
 * project-memory CLI entry point.
 * This file is the bin target — it bootstraps the CLI.
 *
 * Wraps the CLI with graceful error handling so failures are loud
 * and actionable instead of raw Node stack traces.
 */

import { run } from '../src/cli.js';

try {
    run();
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('');
    console.error('  \u274C project-memory: Unexpected error');
    console.error('');
    console.error(`  ${message}`);
    console.error('');
    console.error('  If this keeps happening, use the local fallback script instead:');
    console.error('    node scripts/project-memory.js <command>');
    console.error('');
    console.error('  Or reinstall:');
    console.error('    npm install -g @satyamshree/project-memory');
    console.error('');
    process.exit(1);
}
