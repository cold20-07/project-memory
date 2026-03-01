# Project-Memory 🧠

**Persistent "Long-Term Memory" and "Wall of Shame" for AI Agents.**

Project-Memory solves the "Agent Amnesia" problem. AI agents (in Cursor, Windsurf, Cline, etc.) often forget key architectural decisions, repeat the same mistakes, or lose track of long-term goals between sessions. This tool provides a structured, human-readable context that agents automatically read and update.

## 🚀 One-Line Setup

Run this in your project root:
```bash
npx project-memory init
```

## ✨ Features

- **Rule Injection**: Auto-detects and configures Cursor (`.cursorrules`), Windsurf (`.windsurfrules`), Cline (`.clinerules`), and GitHub Copilot.
- **Wall of Shame**: A dedicated section for mistakes to *never* repeat. Agents check this before every task.
- **Project Soul**: Define the "vibe", tech stack, and non-negotiable principles of your codebase.
- **Token Optimization**: The `prune` command collapses old completed tasks into a single history line to keep context small and fast.
- **Local-First & Team-Friendly**: Memory is stored in `.memory/context.md`. Commit it to Git to share project context with your whole team.

## 🛠 Commands

### `init`
Scaffolds the `.memory/` folder and injects instructions into your IDE's config files.
```bash
npx project-memory init
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

## 📂 Structure

- `.memory/context.md`: The human-readable source of truth. **Commit this.**
- `.memory/state.json`: Machine-readable metadata (versioning, last update). **Git-ignored by default.**

## 🤝 IDE Compatibility

| IDE / Extension | Config File | Status |
|---|---|---|
| **Cursor** | `.cursorrules` / `.cursor/rules/` | ✅ Supported |
| **Windsurf** | `.windsurfrules` | ✅ Supported |
| **Cline** | `.clinerules` | ✅ Supported |
| **GitHub Copilot** | `.github/copilot-instructions.md` | ✅ Supported |
| **Standard VS Code** | Instructions via `.clinerules` | ✅ Supported |

---

Built for AI-native development. Stop repeating yourself to your AI.
