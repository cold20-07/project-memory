/**
 * `prune` command — Collapse completed tasks to reduce token consumption.
 *
 * When context.md exceeds the line threshold, this command collapses
 * "Completed Tasks" into a single summary line under "History".
 */

import pc from 'picocolors';
import { prune } from '../pruner.js';
import { readState, writeState, markPruned } from '../state-manager.js';
import { PRUNE_THRESHOLD } from '../types.js';

export interface PruneOptions {
    /** Project root directory (defaults to cwd) */
    cwd?: string;
    /** Force prune even if below threshold */
    force?: boolean;
    /** Custom line threshold */
    threshold?: number;
}

export async function pruneCommand(options: PruneOptions = {}): Promise<void> {
    const projectRoot = options.cwd ?? process.cwd();
    const threshold = options.threshold ?? PRUNE_THRESHOLD;

    console.log(pc.bold(pc.cyan('\n🔧 project-memory prune\n')));

    // Use 0 threshold if force mode to bypass the check
    const effectiveThreshold = options.force ? 0 : threshold;

    const result = await prune(projectRoot, effectiveThreshold);

    if (!result.pruned) {
        console.log(pc.dim(result.reason ?? 'No pruning needed.'));
        console.log('');
        return;
    }

    console.log(pc.green('✓') + ` Collapsed ${pc.bold(String(result.tasksCollapsed))} completed tasks into History`);
    console.log(pc.dim(`  Lines: ${result.linesBefore} → ${result.linesAfter}`));

    // Update state
    const state = await readState(projectRoot);
    if (state) {
        await writeState(projectRoot, markPruned(state));
    }

    console.log(pc.bold(pc.green('\n✅ Context pruned successfully!\n')));
}
