/**
 * Shared TypeScript interfaces for project-memory.
 * All types are defined here to ensure 100% type-safety across modules.
 */

/** Entry types for the `log` command. */
export type LogEntryType = 'mistake' | 'decision' | 'todo';

/** Metadata stored in .memory/state.json */
export interface ProjectState {
    /** Schema version for forward compatibility */
    version: number;
    /** ISO 8601 timestamp of initialization */
    createdAt: string;
    /** ISO 8601 timestamp of last modification */
    lastUpdated: string;
    /** Total number of log entries written */
    entryCount: number;
    /** ISO 8601 timestamp of last prune, if any */
    prunedAt?: string;
    /** Name of the project (derived from directory) */
    projectName: string;
}

/** Represents a parsed section of context.md */
export interface ContextSection {
    /** The heading text (without the ## prefix) */
    heading: string;
    /** The raw content lines under this heading */
    content: string;
}

/** Map of log entry types to their target section headings */
export const LOG_SECTION_MAP: Record<LogEntryType, string> = {
    mistake: 'Wall of Shame',
    decision: 'Key Decisions',
    todo: 'Active Tasks',
} as const;

/** Default memory directory name */
export const MEMORY_DIR = '.memory';

/** Context file name */
export const CONTEXT_FILE = 'context.md';

/** State file name */
export const STATE_FILE = 'state.json';

/** Current schema version */
export const SCHEMA_VERSION = 1;

/** Maximum lines before suggesting a prune */
export const PRUNE_THRESHOLD = 200;

/** Marker comments for IDE rule injection (to make it idempotent) */
export const RULE_MARKER_START = '# --- PROJECT-MEMORY INSTRUCTIONS (DO NOT EDIT) ---';
export const RULE_MARKER_END = '# --- END PROJECT-MEMORY INSTRUCTIONS ---';
