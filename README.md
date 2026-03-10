# Project Memory

**Persistent Long-Term Memory and Wall of Shame for AI Agents.**

Project-Memory addresses the issue of AI agent amnesia. AI agents (such as those in Cursor, Windsurf, or Cline) often forget architectural decisions, repeat mistakes, or lose track of long-term goals between sessions. This tool provides a structured, human-readable context that agents automatically read and update.

## One-Line Setup

Run this in your project root:
```bash
npx @satyamshree/project-memory init
```

This command creates:
- `.project-memory/.memory/context.md`: The shared project memory.
- `scripts/project-memory.js`: A local fallback script that bypasses npx and PowerShell script execution issues.
- IDE rule files: Trigger files that enable AI agents to discover and use the memory automatically.

## Key Features

- **Rule Injection**: Auto-configures Cursor, Windsurf, Cline, and GitHub Copilot with project-specific instructions.
- **Wall of Shame**: A dedicated section for mistakes to never repeat. Agents are instructed to check this before starting any task.
- **Project Soul**: A space to define the tech stack, core values, and non-negotiable principles of the codebase.
- **Token Optimization**: Use the prune command to collapse completed tasks into a single history line, keeping the context size manageable.
- **Local-First and Team-Friendly**: Memory is stored within the `.project-memory` directory. Commit this to Git to synchronize context across the team.
- **Self-Healing**: A local fallback script ensures the tool remains functional even if npx or PowerShell execution policies cause issues.

## Commands

Commands can be run via the local script (recommended) or npx.

### init
Scaffolds the project memory directory and injects rules into IDE configuration files.
```bash
npx @satyamshree/project-memory init
```

### log
Appends entries to specific sections of the project memory.
```bash
# Using the local script (recommended):
node scripts/project-memory.js log --decision "Use PostgreSQL for the primary database"
node scripts/project-memory.js log --mistake "Do not use inline styles in React components"
node scripts/project-memory.js log --todo "Implement OAuth2 flow"

# Using npx:
npx @satyamshree/project-memory log --decision "Description"
```

### read
Outputs a token-optimized summary of the current project context for AI consumption.
```bash
node scripts/project-memory.js read
```

### prune
Collapses completed tasks into a historical summary when the file length exceeds the threshold.
```bash
node scripts/project-memory.js prune
```

## Project Structure

The project uses a hybrid structure to ensure both organization and automatic detection by AI agents:

- **.project-memory/**: The primary storage location for context.md and state.json.
- **scripts/project-memory.js**: A local fallback runner that should be committed to version control.
- **Project Root**: Contains trigger files (such as .cursorrules) that instruct the agent to use the memory tool.

## Troubleshooting

### Windows PowerShell: Script Execution Blocked
Windows may block the execution of .ps1 scripts by default. There are two solutions:

1. Use the local script directly: `node scripts/project-memory.js read`
2. Update the execution policy: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### npx Failure
If npx fails due to network or configuration issues, you can install the package locally:
```bash
npm install -D @satyamshree/project-memory
```

## IDE Compatibility

| IDE / Extension | Config File | Status |
|---|---|---|
| Cursor | .cursorrules / .cursor/rules/ | Supported |
| Windsurf | .windsurfrules | Supported |
| Cline / Roo Code | .clinerules | Supported |
| GitHub Copilot | .github/copilot-instructions.md | Supported |
| Aider | .aider.conf.yml | Supported |
| Generic / Others | instructions.md | Supported |

### Using with other IDEs or Agents
If using an IDE or agent not listed above, provide this instruction at the start of a session:
"Read the project instructions in .project-memory/instructions.md and follow them."

---

Built for AI-native development. Stop repeating yourself to your AI.
