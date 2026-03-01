/**
 * `read` command — Output a token-optimized summary of project context.
 *
 * Designed for AI agent consumption at the start of a session.
 * Strips empty lines, compresses whitespace, and focuses on actionable content.
 */

import pc from 'picocolors';
import { readContext, getTokenOptimizedSummary, countLines } from '../context-manager.js';
import { readState } from '../state-manager.js';
import { PRUNE_THRESHOLD } from '../types.js';

export interface ReadOptions {
    /** Project root directory (defaults to cwd) */
    cwd?: string;
    /** Output raw content instead of optimized summary */
    raw?: boolean;
}

export async function readCommand(options: ReadOptions = {}): Promise<void> {
    const projectRoot = options.cwd ?? process.cwd();

    const content = await readContext(projectRoot);
    if (!content) {
        console.log(pc.red('✗ Project memory not initialized. Run `project-memory init` first.\n'));
        process.exitCode = 1;
        return;
    }

    if (options.raw) {
        // Raw mode: output the full context.md as-is
        process.stdout.write(content);
        return;
    }

    // Token-optimized mode (default)
    const summary = getTokenOptimizedSummary(content);
    process.stdout.write(summary + '\n');

    // Warn if nearing prune threshold (on stderr so it doesn't pollute agent input)
    const lines = countLines(content);
    if (lines > PRUNE_THRESHOLD * 0.8) {
        const percentage = Math.round((lines / PRUNE_THRESHOLD) * 100);
        process.stderr.write(
            pc.yellow(`\n⚠  Context is ${lines} lines (${percentage}% of prune threshold). `) +
            pc.dim('Run `project-memory prune` to optimize.\n')
        );
    }

    // Show metadata from state.json on stderr
    const state = await readState(projectRoot);
    if (state) {
        process.stderr.write(
            pc.dim(`\n[${state.entryCount} entries | last updated: ${state.lastUpdated}]\n`)
        );
    }
}
