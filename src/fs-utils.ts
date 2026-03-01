/**
 * Atomic file system utilities.
 * All writes use a write-to-temp-then-rename strategy to prevent
 * corruption when multiple agent windows may be writing concurrently.
 */

import { writeFile, rename, mkdir, readFile, access, appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { constants } from 'node:fs';

/**
 * Atomically write content to a file.
 * Writes to a temporary sibling file, then renames to the target path.
 * This guarantees the file is never in a partially-written state.
 */
export async function atomicWrite(filePath: string, content: string): Promise<void> {
    const dir = dirname(filePath);
    const tmpSuffix = randomBytes(6).toString('hex');
    const tmpPath = join(dir, `.tmp_${tmpSuffix}`);

    await ensureDir(dir);
    await writeFile(tmpPath, content, 'utf-8');
    await rename(tmpPath, filePath);
}

/**
 * Recursively create a directory if it doesn't exist.
 */
export async function ensureDir(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
}

/**
 * Check if a file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await access(filePath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Safely read a UTF-8 file. Returns null if the file doesn't exist.
 */
export async function safeReadFile(filePath: string): Promise<string | null> {
    try {
        return await readFile(filePath, 'utf-8');
    } catch {
        return null;
    }
}

/**
 * Idempotently add entries to .gitignore.
 * Only appends lines that aren't already present.
 */
export async function appendToGitignore(projectRoot: string, entries: string[]): Promise<void> {
    const gitignorePath = join(projectRoot, '.gitignore');
    let existing = '';

    try {
        existing = await readFile(gitignorePath, 'utf-8');
    } catch {
        // .gitignore doesn't exist yet — that's fine
    }

    const existingLines = new Set(existing.split('\n').map(line => line.trim()));
    const newEntries = entries.filter(entry => !existingLines.has(entry.trim()));

    if (newEntries.length === 0) return;

    const suffix = existing.endsWith('\n') || existing === '' ? '' : '\n';
    const block = `${suffix}${newEntries.join('\n')}\n`;

    await appendFile(gitignorePath, block, 'utf-8');
}
