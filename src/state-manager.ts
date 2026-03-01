/**
 * State manager for .memory/state.json.
 * Handles typed JSON I/O with atomic writes.
 */

import { join } from 'node:path';
import { atomicWrite, safeReadFile } from './fs-utils.js';
import {
    PROJECT_MEMORY_DIR,
    MEMORY_DIR,
    STATE_FILE,
    SCHEMA_VERSION,
    type ProjectState,
} from './types.js';

/**
 * Read state.json. Returns null if it doesn't exist.
 */
export async function readState(projectRoot: string): Promise<ProjectState | null> {
    const statePath = join(projectRoot, PROJECT_MEMORY_DIR, MEMORY_DIR, STATE_FILE);
    const raw = await safeReadFile(statePath);

    if (!raw) return null;

    return JSON.parse(raw) as ProjectState;
}

/**
 * Write state.json atomically.
 */
export async function writeState(
    projectRoot: string,
    state: ProjectState,
): Promise<void> {
    const statePath = join(projectRoot, PROJECT_MEMORY_DIR, MEMORY_DIR, STATE_FILE);
    const content = JSON.stringify(state, null, 2) + '\n';
    await atomicWrite(statePath, content);
}

/**
 * Create a fresh ProjectState for initialization.
 */
export function createInitialState(projectName: string): ProjectState {
    const now = new Date().toISOString();
    return {
        version: SCHEMA_VERSION,
        createdAt: now,
        lastUpdated: now,
        entryCount: 0,
        projectName,
    };
}

/**
 * Increment entry count and update the lastUpdated timestamp.
 */
export function bumpState(state: ProjectState): ProjectState {
    return {
        ...state,
        entryCount: state.entryCount + 1,
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * Mark the state as pruned.
 */
export function markPruned(state: ProjectState): ProjectState {
    return {
        ...state,
        prunedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
    };
}
