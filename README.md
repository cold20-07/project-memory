# Project-Memory 

**Persistent "Long-Term Memory" and "Wall of Shame" for AI Agents.**

Project-Memory solves the "Agent Amnesia" problem. AI agents (in Cursor, Windsurf, Cline, etc.) often forget key architectural decisions, repeat the same mistakes, or lose track of long-term goals between sessions. This tool provides a structured, human-readable context that agents automatically read and update.

##  One-Line Setup

Run this in your project root:
```bash
npx @satyamshree/project-memory init
```

##  Features

- **Rule Injection**: Auto-detects and configures Cursor (`.cursorrules`), Windsurf (`.windsurfrules`), Cline (`.clinerules`), and GitHub Copilot.
- **Wall of Shame**: A dedicated section for mistakes to *never* repeat. Agents check this before every task.
- **Project Soul**: Define the "vibe", tech stack, and non-negotiable principles of your codebase.
- **Token Optimization**: The `prune` command collapses old completed tasks into a single history line to keep context small and fast.
- **Local-First & Team-Friendly**: Memory is stored in `.project-memory/.memory/context.md`. Commit it to Git to share project context with your whole team.

##  Commands

### `init`
Scaffolds the `.project-memory/` folder and injects instructions into your IDE's config files inside that folder.
```bash
npx @satyamshree/project-memory init
```

### `log`
Append entries to specific sections of the memory.
```bash
npx project-memory log --decision "Use PostgreSQL for the primary DB"
npx project-memory log --mistake "Don't use inline styles in React components"
npx project-memory log --todo "Implement OAuth2 flow"
```

### `read`
Outputs a token-optimized summary for the agent. (Agents are instructed to run this automatically).
```bash
npx project-memory read
```

### `prune`
Collapses "Completed Tasks" into "History" when the file gets too long.
```bash
npx project-memory prune
```

##  Structure

To keep your project clean while ensuring AI agents find the memory automatically, we use a hybrid structure:

- **`.project-memory/`**: The "Brain" folder. Contains `context.md` (shared memory) and `state.json` (metadata).
- **Project Root**: Contains small "trigger" files (like `.cursorrules`, `.clinerules`) that tell the AI agent to use the memory tool. These are required for full autonomy.

##  IDE Compatibility (Auto-Detection)

| IDE / Extension | Config File | Status |
|---|---|---|
| **Cursor** | `.cursorrules` / `.cursor/rules/` | ✅ Supported |
| **Windsurf** | `.windsurfrules` | ✅ Supported |
| **Cline / Roo Code** | `.clinerules` | ✅ Supported |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ Supported |
| **Aider** | `.aider.conf.yml` | ✅ Supported |
| **Generic / Others** | `instructions.md` | ✅ Supported |

###  Using with other IDEs / Agents
If you are using an IDE or AI Agent not listed above, simply tell the agent once at the start of your session:
> "Read the project instructions in `.project-memory/instructions.md` and follow them."

The `instructions.md` file is automatically created during `init` and contains everything the agent needs to know about using this tool.

---

Built for AI-native development. Stop repeating yourself to your AI.
