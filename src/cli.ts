/**
 * CLI entrypoint — Wires all commands via Commander.
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { logCommand } from './commands/log.js';
import { readCommand } from './commands/read.js';
import { pruneCommand } from './commands/prune.js';

export function run(): void {
    const program = new Command();

    program
        .name('project-memory')
        .description('🧠 Persistent Long-Term Memory for AI Agents')
        .version('1.0.0');

    // init
    program
        .command('init')
        .description('Initialize project memory in the current directory')
        .option('-f, --force', 'Force re-initialization even if .memory/ exists')
        .action(async (opts: { force?: boolean }) => {
            await initCommand({ force: opts.force });
        });

    // log
    program
        .command('log')
        .description('Log an entry to project memory')
        .option('-m, --mistake <message>', 'Log a mistake to the Wall of Shame')
        .option('-d, --decision <message>', 'Log a key decision')
        .option('-t, --todo <message>', 'Log a new task / TODO')
        .action(async (opts: { mistake?: string; decision?: string; todo?: string }) => {
            await logCommand({
                mistake: opts.mistake,
                decision: opts.decision,
                todo: opts.todo,
            });
        });

    // read
    program
        .command('read')
        .description('Output token-optimized project context for agent consumption')
        .option('-r, --raw', 'Output raw context.md without optimization')
        .action(async (opts: { raw?: boolean }) => {
            await readCommand({ raw: opts.raw });
        });

    // prune
    program
        .command('prune')
        .description('Collapse completed tasks to reduce token consumption')
        .option('-f, --force', 'Force prune even if below the line threshold')
        .option('--threshold <lines>', 'Custom line threshold', parseInt)
        .action(async (opts: { force?: boolean; threshold?: number }) => {
            await pruneCommand({ force: opts.force, threshold: opts.threshold });
        });

    program.parse();
}
