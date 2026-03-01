/**
 * Context manager for reading, writing, and appending to .memory/context.md.
 * Handles section-aware appending so log entries land in the correct heading.
 */

import { join } from 'node:path';
import { atomicWrite, safeReadFile } from './fs-utils.js';
import {
    PROJECT_MEMORY_DIR,
    MEMORY_DIR,
    CONTEXT_FILE,
    LOG_SECTION_MAP,
    type LogEntryType,
    type ContextSection,
} from './types.js';

/**
 * Read the raw contents of context.md.
 * Returns null if the file doesn't exist.
 */
export async function readContext(projectRoot: string): Promise<string | null> {
    const contextPath = join(projectRoot, PROJECT_MEMORY_DIR, MEMORY_DIR, CONTEXT_FILE);
    return safeReadFile(contextPath);
}

/**
 * Parse context.md into an array of sections.
 * Each section starts with a `## Heading` line.
 */
export function parseSections(content: string): ContextSection[] {
    const sections: ContextSection[] = [];
    const lines = content.split('\n');

    let currentHeading = '';
    let currentLines: string[] = [];

    for (let line of lines) {
        line = line.trimEnd();
        const headingMatch = /^## (.+)$/.exec(line);
        if (headingMatch) {
            // Save previous section
            if (currentHeading) {
                sections.push({
                    heading: currentHeading,
                    content: currentLines.join('\n'),
                });
            }
            currentHeading = headingMatch[1]!;
            currentLines = [];
        } else {
            currentLines.push(line);
        }
    }

    // Save the final section
    if (currentHeading) {
        sections.push({
            heading: currentHeading,
            content: currentLines.join('\n'),
        });
    }

    return sections;
}

/**
 * Reassemble sections back into a full context.md string.
 * Preserves any content before the first ## heading (e.g., the # title).
 */
export function reassembleSections(
    originalContent: string,
    sections: ContextSection[],
): string {
    // Extract content before the first ## heading
    const firstHeadingIndex = originalContent.indexOf('\n## ');
    const preamble = firstHeadingIndex >= 0
        ? originalContent.substring(0, firstHeadingIndex + 1)
        : '';

    const body = sections
        .map(section => `## ${section.heading}\n${section.content}`)
        .join('\n');

    return `${preamble}${body}`;
}

/**
 * Append a timestamped entry to a specific section in context.md.
 * The section is identified by its heading text.
 */
export async function appendToSection(
    projectRoot: string,
    entryType: LogEntryType,
    message: string,
): Promise<void> {
    const contextPath = join(projectRoot, PROJECT_MEMORY_DIR, MEMORY_DIR, CONTEXT_FILE);
    const content = await safeReadFile(contextPath);

    if (!content) {
        throw new Error(
            'context.md not found. Run `project-memory init` first.',
        );
    }

    const targetHeading = LOG_SECTION_MAP[entryType];
    const sections = parseSections(content);
    const sectionIndex = sections.findIndex(s => s.heading === targetHeading);

    if (sectionIndex === -1) {
        throw new Error(
            `Section "## ${targetHeading}" not found in context.md. ` +
            'Your context.md may be corrupted. Re-run `project-memory init`.',
        );
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const entry = `- [${timestamp}] ${message}`;
    const section = sections[sectionIndex]!;

    // Append entry: trim trailing whitespace, add entry, add newline
    const trimmed = section.content.trimEnd();
    section.content = trimmed.length > 0
        ? `${trimmed}\n${entry}\n`
        : `\n${entry}\n`;

    const updated = reassembleSections(content, sections);
    await atomicWrite(contextPath, updated);
}

/**
 * Generate a token-optimized summary of context.md for agent consumption.
 * Strips empty lines, compresses whitespace, and focuses on actionable content.
 */
export function getTokenOptimizedSummary(content: string): string {
    const sections = parseSections(content);
    const result: string[] = [];

    // Extract the # title if present
    const titleMatch = /^# (.+)$/m.exec(content);
    if (titleMatch) {
        result.push(`# ${titleMatch[1]!.trim()}`);
        result.push('');
    }

    for (const section of sections) {
        const trimmedContent = section.content.trim();
        if (trimmedContent.length === 0) continue;

        result.push(`## ${section.heading}`);
        result.push(trimmedContent);
        result.push('');
    }

    return result.join('\n').trim();
}

/**
 * Count the number of lines in context.md.
 */
export function countLines(content: string): number {
    return content.split('\n').length;
}
