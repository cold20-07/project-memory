/**
 * Pruner — Token Optimization Module.
 *
 * When context.md exceeds a configurable line threshold, the pruner
 * collapses "Completed Tasks" into a single summary line under "History",
 * reducing token consumption for agents.
 */

import { join } from 'node:path';
import { atomicWrite, safeReadFile } from './fs-utils.js';
import { parseSections, reassembleSections } from './context-manager.js';
import { MEMORY_DIR, CONTEXT_FILE, PRUNE_THRESHOLD } from './types.js';

/** Result of a prune operation. */
export interface PruneResult {
    /** Whether pruning was actually performed */
    pruned: boolean;
    /** Number of lines before pruning */
    linesBefore: number;
    /** Number of lines after pruning (same as before if not pruned) */
    linesAfter: number;
    /** Number of completed tasks that were collapsed */
    tasksCollapsed: number;
    /** Reason if pruning was skipped */
    reason?: string;
}

/**
 * Check if context.md exceeds the prune threshold.
 */
export function shouldPrune(content: string, maxLines: number = PRUNE_THRESHOLD): boolean {
    return content.split('\n').length > maxLines;
}

/**
 * Count completed task entries in the "Completed Tasks" section.
 * Entries are lines starting with `- ` (markdown list items).
 */
function countCompletedTasks(sectionContent: string): number {
    return sectionContent
        .split('\n')
        .filter(line => line.trimStart().startsWith('- '))
        .length;
}

/**
 * Generate a summary line from the completed tasks section.
 * Extracts key information without LLM dependency.
 */
function summarizeCompletedTasks(sectionContent: string): string {
    const entries = sectionContent
        .split('\n')
        .filter(line => line.trimStart().startsWith('- '))
        .map(line => line.replace(/^-\s*\[.*?\]\s*/, '').trim());

    const count = entries.length;
    if (count === 0) return '';

    // Extract date range from timestamps if present
    const timestamps = sectionContent
        .split('\n')
        .map(line => {
            const match = /\[(\d{4}-\d{2}-\d{2})/.exec(line);
            return match?.[1];
        })
        .filter((t): t is string => t !== undefined);

    const dateRange = timestamps.length >= 2
        ? ` (${timestamps[0]} → ${timestamps[timestamps.length - 1]})`
        : timestamps.length === 1
            ? ` (${timestamps[0]})`
            : '';

    return `- ${count} tasks completed${dateRange}. Last items: ${entries.slice(-3).join('; ')}`;
}

/**
 * Run the prune operation on context.md.
 *
 * Strategy:
 * 1. Find the "Completed Tasks" section.
 * 2. Collapse all entries into a single summary line.
 * 3. Move the summary to the "History" section (creating it if needed).
 * 4. Clear the "Completed Tasks" section.
 */
export async function prune(
    projectRoot: string,
    maxLines: number = PRUNE_THRESHOLD,
): Promise<PruneResult> {
    const contextPath = join(projectRoot, MEMORY_DIR, CONTEXT_FILE);
    const content = await safeReadFile(contextPath);

    if (!content) {
        return {
            pruned: false,
            linesBefore: 0,
            linesAfter: 0,
            tasksCollapsed: 0,
            reason: 'context.md not found. Run `project-memory init` first.',
        };
    }

    const linesBefore = content.split('\n').length;

    if (!shouldPrune(content, maxLines)) {
        return {
            pruned: false,
            linesBefore,
            linesAfter: linesBefore,
            tasksCollapsed: 0,
            reason: `Context is ${linesBefore} lines (threshold: ${maxLines}). No pruning needed.`,
        };
    }

    const sections = parseSections(content);

    // Find Completed Tasks section
    const completedIndex = sections.findIndex(s => s.heading === 'Completed Tasks');
    if (completedIndex === -1) {
        return {
            pruned: false,
            linesBefore,
            linesAfter: linesBefore,
            tasksCollapsed: 0,
            reason: 'No "Completed Tasks" section found.',
        };
    }

    const completedSection = sections[completedIndex]!;
    const tasksCollapsed = countCompletedTasks(completedSection.content);

    if (tasksCollapsed === 0) {
        return {
            pruned: false,
            linesBefore,
            linesAfter: linesBefore,
            tasksCollapsed: 0,
            reason: 'No completed tasks to collapse.',
        };
    }

    // Generate summary line
    const summaryLine = summarizeCompletedTasks(completedSection.content);

    // Find or create History section
    let historyIndex = sections.findIndex(s => s.heading === 'History');
    if (historyIndex === -1) {
        // Add History section at the end
        sections.push({ heading: 'History', content: '\n' });
        historyIndex = sections.length - 1;
    }

    // Append summary to History
    const historySection = sections[historyIndex]!;
    const trimmedHistory = historySection.content.trimEnd();
    historySection.content = trimmedHistory.length > 0
        ? `${trimmedHistory}\n${summaryLine}\n`
        : `\n${summaryLine}\n`;

    // Clear Completed Tasks
    completedSection.content = '\n';

    // Reassemble and write
    const updated = reassembleSections(content, sections);
    await atomicWrite(contextPath, updated);

    const linesAfter = updated.split('\n').length;

    return {
        pruned: true,
        linesBefore,
        linesAfter,
        tasksCollapsed,
    };
}
