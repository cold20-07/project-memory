/**
 * IDE Rule Detector & Injector.
 *
 * Detects which AI-native IDEs are configured in the project and injects
 * "Agent Instructions" into their local rules files so the agent knows
 * how to use project-memory automatically.
 *
 * Supported targets:
 *  - .cursorrules        (Cursor — legacy flat file)
 *  - .cursor/rules/      (Cursor — new rules directory, creates project-memory.mdc)
 *  - .windsurfrules      (Windsurf)
 *  - .clinerules         (Cline / VS Code + Cline extension)
 *  - .github/copilot-instructions.md  (GitHub Copilot)
 *
 * Injection is idempotent: marker comments guard against duplicate injection.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileExists, ensureDir, atomicWrite } from './fs-utils.js';
import { RULE_MARKER_START, RULE_MARKER_END } from './types.js';

/** Represents a detected IDE config target. */
export interface IDETarget {
    /** Human-readable IDE name */
    name: string;
    /** Absolute path to the rules file */
    filePath: string;
    /** Whether the file already existed before we touched it */
    existed: boolean;
    /** Whether rules were injected (false if already present) */
    injected: boolean;
}

/**
 * All known IDE config targets, relative to the project root.
 * Each entry defines:
 *  - name:     IDE display name
 *  - path:     relative path to the rules file
 *  - dirMode:  if true, create a file *inside* this directory instead
 *  - fileName: when dirMode is true, the file to create in the directory
 */
const IDE_CONFIGS = [
    {
        name: 'Cursor (legacy)',
        path: '.cursorrules',
        dirMode: false,
    },
    {
        name: 'Cursor (rules dir)',
        path: '.cursor/rules',
        dirMode: true,
        fileName: 'project-memory.mdc',
    },
    {
        name: 'Windsurf',
        path: '.windsurfrules',
        dirMode: false,
    },
    {
        name: 'Cline',
        path: '.clinerules',
        dirMode: false,
    },
    {
        name: 'GitHub Copilot',
        path: '.github/copilot-instructions.md',
        dirMode: false,
    },
] as const;

/**
 * Detect which IDE configuration files/directories exist in the project root.
 * Returns an array of targets that were found on disk.
 */
export async function detectIDEConfigs(projectRoot: string): Promise<IDETarget[]> {
    const detected: IDETarget[] = [];

    for (const config of IDE_CONFIGS) {
        const fullPath = join(projectRoot, config.path);

        if (config.dirMode) {
            // For directory-mode targets (e.g. .cursor/rules/),
            // we check if the *directory* exists.
            const dirExisted = await fileExists(fullPath);
            if (dirExisted) {
                const targetFile = join(fullPath, config.fileName ?? 'project-memory.md');
                const fileExisted = await fileExists(targetFile);
                detected.push({
                    name: config.name,
                    filePath: targetFile,
                    existed: fileExisted,
                    injected: false,
                });
            }
        } else {
            // For flat-file targets, check if the file exists.
            const existed = await fileExists(fullPath);
            if (existed) {
                detected.push({
                    name: config.name,
                    filePath: fullPath,
                    existed: true,
                    injected: false,
                });
            }
        }
    }

    return detected;
}

/**
 * Create default IDE config files for all known IDEs so agents
 * get project-memory instructions out of the box.
 * Only creates files that don't already exist.
 */
export async function createDefaultIDEConfigs(projectRoot: string): Promise<IDETarget[]> {
    const targets: IDETarget[] = [];

    for (const config of IDE_CONFIGS) {
        const fullPath = join(projectRoot, config.path);

        if (config.dirMode) {
            const targetFile = join(fullPath, config.fileName ?? 'project-memory.md');
            const fileExisted = await fileExists(targetFile);
            // Always ensure the directory exists for dir-mode targets
            await ensureDir(fullPath);
            targets.push({
                name: config.name,
                filePath: targetFile,
                existed: fileExisted,
                injected: false,
            });
        } else {
            const existed = await fileExists(fullPath);
            targets.push({
                name: config.name,
                filePath: fullPath,
                existed,
                injected: false,
            });
        }
    }

    return targets;
}

/**
 * Check if a file already contains the project-memory instructions block.
 */
export function hasExistingRules(content: string): boolean {
    return content.includes(RULE_MARKER_START);
}

/**
 * Inject the agent instructions snippet into a single IDE config file.
 * The injection is idempotent — if the markers are already present,
 * the file is left untouched.
 *
 * @returns true if rules were injected, false if already present
 */
export async function injectRulesIntoFile(
    filePath: string,
    snippet: string,
): Promise<boolean> {
    let existingContent = '';

    try {
        existingContent = await readFile(filePath, 'utf-8');
    } catch {
        // File doesn't exist — we'll create it
    }

    // Idempotency check
    if (hasExistingRules(existingContent)) {
        return false;
    }

    const separator = existingContent.length > 0 && !existingContent.endsWith('\n')
        ? '\n\n'
        : existingContent.length > 0
            ? '\n'
            : '';

    const fullContent = `${existingContent}${separator}${RULE_MARKER_START}\n${snippet}\n${RULE_MARKER_END}\n`;

    await atomicWrite(filePath, fullContent);
    return true;
}

/**
 * High-level function: detect all IDEs and inject rules into each one.
 * Creates default IDE config files if they don't exist, ensuring
 * broad compatibility out of the box.
 *
 * @returns Array of all targets with their injection status
 */
export async function injectRules(projectRoot: string, snippet: string): Promise<IDETarget[]> {
    const targets = await createDefaultIDEConfigs(projectRoot);

    for (const target of targets) {
        target.injected = await injectRulesIntoFile(target.filePath, snippet);
    }

    return targets;
}

/**
 * List all IDE config files that currently contain project-memory rules.
 * Useful for diagnostics and the `read` command.
 */
export async function listInjectedFiles(projectRoot: string): Promise<string[]> {
    const injected: string[] = [];

    for (const config of IDE_CONFIGS) {
        const fullPath = config.dirMode
            ? join(projectRoot, config.path, config.fileName ?? 'project-memory.md')
            : join(projectRoot, config.path);

        try {
            const content = await readFile(fullPath, 'utf-8');
            if (hasExistingRules(content)) {
                injected.push(fullPath);
            }
        } catch {
            // File doesn't exist — skip
        }
    }

    return injected;
}
