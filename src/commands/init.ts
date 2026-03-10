/**
 * `init` command — Scaffolds the .memory/ directory and injects IDE rules.
 *
 * This is the first command users run. It:
 * 1. Creates .memory/context.md from the template
 * 2. Creates .memory/state.json with initial metadata
 * 3. Drops a local fallback script at scripts/project-memory.js
 * 4. Adds .memory/state.json to .gitignore
 * 5. Detects IDEs and injects agent instructions
 */

import { join, basename } from 'node:path';
import pc from 'picocolors';
import { ensureDir, fileExists, appendToGitignore } from '../fs-utils.js';
import { renderContext, loadRulesSnippet, loadLocalScript } from '../templates.js';
import { injectRules } from '../ide-detector.js';
import { writeState, createInitialState } from '../state-manager.js';
import { PROJECT_MEMORY_DIR, MEMORY_DIR, CONTEXT_FILE } from '../types.js';
import { atomicWrite } from '../fs-utils.js';

export interface InitOptions {
    /** Project root directory (defaults to cwd) */
    cwd?: string;
    /** Force re-initialization even if .memory/ exists */
    force?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
    const projectRoot = options.cwd ?? process.cwd();
    const projectName = basename(projectRoot);
    const toolRoot = join(projectRoot, PROJECT_MEMORY_DIR);
    const memoryDir = join(toolRoot, MEMORY_DIR);
    const contextPath = join(memoryDir, CONTEXT_FILE);

    console.log(pc.bold(pc.cyan('\n🧠 project-memory init\n')));

    // Check if already initialized
    if (await fileExists(contextPath) && !options.force) {
        console.log(pc.yellow('⚠  .memory/ already exists. Use --force to re-initialize.\n'));
        return;
    }

    // Step 1: Create tool root directory
    await ensureDir(toolRoot);
    await ensureDir(memoryDir);
    console.log(pc.green('✓') + ` Created ${PROJECT_MEMORY_DIR} directory`);

    // Step 2: Render and write context.md
    const contextContent = await renderContext(projectName);
    await atomicWrite(contextPath, contextContent);
    console.log(pc.green('✓') + ` Created ${PROJECT_MEMORY_DIR}/${MEMORY_DIR}/context.md`);

    // Step 3: Write state.json
    const state = createInitialState(projectName);
    await writeState(projectRoot, state);
    console.log(pc.green('✓') + ` Created ${PROJECT_MEMORY_DIR}/${MEMORY_DIR}/state.json`);

    // Step 4: Drop local fallback script
    const scriptsDir = join(projectRoot, 'scripts');
    const localScriptPath = join(scriptsDir, 'project-memory.js');
    await ensureDir(scriptsDir);
    const scriptContent = await loadLocalScript();
    await atomicWrite(localScriptPath, scriptContent);
    console.log(pc.green('✓') + ` Created ${pc.bold('scripts/project-memory.js')} (local fallback)`);

    // Step 5: Update .gitignore
    await appendToGitignore(projectRoot, [
        `${PROJECT_MEMORY_DIR}/${MEMORY_DIR}/state.json`,
    ]);
    console.log(pc.green('✓') + ` Added ${PROJECT_MEMORY_DIR} to .gitignore`);

    // Step 6: Inject IDE rules
    console.log(pc.dim('\nDetecting IDE configurations...'));
    const snippet = await loadRulesSnippet();
    const targets = await injectRules(projectRoot, snippet);

    for (const target of targets) {
        if (target.injected) {
            console.log(pc.green('✓') + ` Injected rules into ${pc.bold(target.name)}`);
        } else if (target.existed) {
            console.log(pc.dim(`· ${target.name} — rules already present`));
        } else {
            console.log(pc.green('✓') + ` Created ${pc.bold(target.name)} config with rules`);
        }
    }

    // Summary
    console.log(pc.bold(pc.green('\n✅ Project memory initialized!\n')));
    console.log(pc.dim('Next steps:'));
    console.log(pc.dim(`  1. Edit ${join(PROJECT_MEMORY_DIR, MEMORY_DIR, CONTEXT_FILE)} to fill in the "Project Soul" section`));
    console.log(pc.dim(`  2. Commit ${join(PROJECT_MEMORY_DIR, MEMORY_DIR, CONTEXT_FILE)} and scripts/project-memory.js to version control`));
    console.log(pc.dim('  3. Your AI agent will now read this context at session start'));
    console.log(pc.dim(`  4. Commands use: ${pc.bold('node scripts/project-memory.js <command>')}\n`));
}
