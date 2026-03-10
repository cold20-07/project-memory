/**
 * Template engine for project-memory.
 * Loads boilerplate templates and renders them with project-specific values.
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Root of the package (two levels up from dist/src/) */
const PACKAGE_ROOT = join(__dirname, '..', '..');

/**
 * Load a raw template file from the templates/ directory.
 */
export async function loadTemplate(name: string): Promise<string> {
    const templatePath = join(PACKAGE_ROOT, 'templates', name);
    return readFile(templatePath, 'utf-8');
}

/**
 * Render the context.md template with project-specific values.
 */
export async function renderContext(projectName: string): Promise<string> {
    let template = await loadTemplate('context.md');
    template = template.replaceAll('{{PROJECT_NAME}}', projectName);
    template = template.replaceAll('{{DATE}}', new Date().toISOString().split('T')[0]!);
    return template;
}

/**
 * Load the rules snippet that gets injected into IDE config files.
 */
export async function loadRulesSnippet(): Promise<string> {
    return loadTemplate('rules-snippet.txt');
}

/**
 * Load the local fallback script template.
 */
export async function loadLocalScript(): Promise<string> {
    return loadTemplate('local-script.js');
}
