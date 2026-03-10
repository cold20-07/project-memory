/**
 * CLI entrypoint — Wires all commands via Commander.
 *
 * Includes global error handling so failures produce
 * actionable messages instead of raw stack traces.
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { logCommand } from './commands/log.js';
import { readCommand } from './commands/read.js';
import { pruneCommand } from './commands/prune.js';

/** Format error for user-friendly output */
function formatError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

/** Show fallback hint on stderr */
function showFallbackHint(): void {
    process.stderr.write('\n');
    process.stderr.write('  \u{1F4A1} If this command keeps failing, use the local fallback:\n');
    process.stderr.write('     node scripts/project-memory.js <command>\n');
    process.stderr.write('\n');
    process.stderr.write('  On Windows PowerShell, if npx is blocked, run:\n');
    process.stderr.write('     Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned\n');
    process.stderr.write('\n');
}

export function run(): void {
    // Catch unhandled promise rejections (since commands are async)
    process.on('unhandledRejection', (reason) => {
        process.stderr.write(`\n  \u274C project-memory error: ${formatError(reason)}\n`);
        showFallbackHint();
        process.exit(1);
    });

    const program = new Command();

    program
        .name('project-memory')
        .description('🧠 Persistent Long-Term Memory for AI Agents')
        .version('1.1.0');

    // init
    program
        .command('init')
        .description('Initialize project memory in the current directory')
        .option('-f, --force', 'Force re-initialization even if .memory/ exists')
        .action(async (opts: { force?: boolean }) => {
            try {
                await initCommand({ force: opts.force });
            } catch (error) {
                process.stderr.write(`\n  \u274C init failed: ${formatError(error)}\n`);
                showFallbackHint();
                process.exitCode = 1;
            }
        });

    // log
    program
        .command('log')
        .description('Log an entry to project memory')
        .option('-m, --mistake <message>', 'Log a mistake to the Wall of Shame')
        .option('-d, --decision <message>', 'Log a key decision')
        .option('-t, --todo <message>', 'Log a new task / TODO')
        .action(async (opts: { mistake?: string; decision?: string; todo?: string }) => {
            try {
                await logCommand({
                    mistake: opts.mistake,
                    decision: opts.decision,
                    todo: opts.todo,
                });
            } catch (error) {
                process.stderr.write(`\n  \u274C log failed: ${formatError(error)}\n`);
                showFallbackHint();
                process.exitCode = 1;
            }
        });

    // read
    program
        .command('read')
        .description('Output token-optimized project context for agent consumption')
        .option('-r, --raw', 'Output raw context.md without optimization')
        .action(async (opts: { raw?: boolean }) => {
            try {
                await readCommand({ raw: opts.raw });
            } catch (error) {
                process.stderr.write(`\n  \u274C read failed: ${formatError(error)}\n`);
                showFallbackHint();
                process.exitCode = 1;
            }
        });

    // prune
    program
        .command('prune')
        .description('Collapse completed tasks to reduce token consumption')
        .option('-f, --force', 'Force prune even if below the line threshold')
        .option('--threshold <lines>', 'Custom line threshold', parseInt)
        .action(async (opts: { force?: boolean; threshold?: number }) => {
            try {
                await pruneCommand({ force: opts.force, threshold: opts.threshold });
            } catch (error) {
                process.stderr.write(`\n  \u274C prune failed: ${formatError(error)}\n`);
                showFallbackHint();
                process.exitCode = 1;
            }
        });

    program.parse();
}
