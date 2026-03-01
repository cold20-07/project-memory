/**
 * `log` command — Append entries to context.md under the correct section.
 *
 * Supports flags:
 *  --mistake "description"  → Wall of Shame
 *  --decision "description" → Key Decisions
 *  --todo "description"     → Active Tasks
 */

import pc from 'picocolors';
import { appendToSection } from '../context-manager.js';
import { readState, writeState, bumpState } from '../state-manager.js';
import type { LogEntryType } from '../types.js';
import { LOG_SECTION_MAP } from '../types.js';

export interface LogOptions {
    /** Project root directory (defaults to cwd) */
    cwd?: string;
    /** Mistake entry to log */
    mistake?: string;
    /** Decision entry to log */
    decision?: string;
    /** Todo entry to log */
    todo?: string;
}

/** Map of option keys to LogEntryType */
const OPTION_TYPE_MAP: Record<string, LogEntryType> = {
    mistake: 'mistake',
    decision: 'decision',
    todo: 'todo',
};

export async function logCommand(options: LogOptions): Promise<void> {
    const projectRoot = options.cwd ?? process.cwd();

    // Collect all provided entries
    const entries: Array<{ type: LogEntryType; message: string }> = [];

    for (const [key, entryType] of Object.entries(OPTION_TYPE_MAP)) {
        const value = options[key as keyof LogOptions] as string | undefined;
        if (value) {
            entries.push({ type: entryType, message: value });
        }
    }

    if (entries.length === 0) {
        console.log(pc.yellow('\n⚠  No entry provided. Use one of:\n'));
        console.log(pc.dim('  --mistake "description"  → Wall of Shame'));
        console.log(pc.dim('  --decision "description" → Key Decisions'));
        console.log(pc.dim('  --todo "description"     → Active Tasks\n'));
        return;
    }

    // Read current state
    const state = await readState(projectRoot);
    if (!state) {
        console.log(pc.red('✗ Project memory not initialized. Run `project-memory init` first.\n'));
        process.exitCode = 1;
        return;
    }

    let currentState = state;

    for (const entry of entries) {
        try {
            await appendToSection(projectRoot, entry.type, entry.message);
            currentState = bumpState(currentState);

            const sectionName = LOG_SECTION_MAP[entry.type];
            console.log(
                pc.green('✓') +
                ` Logged to ${pc.bold(sectionName)}: ${pc.dim(entry.message)}`
            );
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.log(pc.red(`✗ Failed to log ${entry.type}: ${msg}`));
            process.exitCode = 1;
            return;
        }
    }

    // Persist updated state
    await writeState(projectRoot, currentState);
}
