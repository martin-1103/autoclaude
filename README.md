# Auto Claude

**Autonomous multi-agent coding framework that plans, builds, and validates software for you.**

![Auto Claude Kanban Board](.github/assets/Auto-Claude-Kanban.png)

[![Version](https://img.shields.io/badge/version-2.7.2-blue?style=flat-square)](https://github.com/AndyMik90/Auto-Claude/releases/latest)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green?style=flat-square)](./agpl-3.0.txt)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/KCXaPBr4Dj)
[![CI](https://img.shields.io/github/actions/workflow/status/AndyMik90/Auto-Claude/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/AndyMik90/Auto-Claude/actions)

## What It Does ✨

**Auto Claude is a desktop app that supercharges your AI coding workflow.** Whether you're a vibe coder just getting started or an experienced developer, Auto Claude meets you where you are.

- **Autonomous Tasks** — Describe what you want to build, and agents handle planning, coding, and validation while you focus on other work
- **Agent Terminals** — Run Claude Code in up to 12 terminals with a clean layout, smart naming based on context, and one-click task context injection
- **Safe by Default** — All work happens in git worktrees, keeping your main branch undisturbed until you're ready to merge
- **Self-Validating** — Built-in QA agents check their own work before you review

**The result?** 10x your output while maintaining code quality.

## Key Features

- **Parallel Agents**: Run multiple builds simultaneously while you focus on other work
- **Context Engineering**: Agents understand your codebase structure before writing code
- **Self-Validating**: Built-in QA loop catches issues before you review
- **Isolated Workspaces**: All work happens in git worktrees — your code stays safe
- **AI Merge Resolution**: Intelligent conflict resolution when merging back to main — no manual conflict fixing
- **Memory Layer**: Agents remember insights across sessions for smarter decisions
- **Cross-Platform**: Desktop app runs on Mac, Windows, and Linux
- **Any Project Type**: Build web apps, APIs, CLIs — works with any software project

## 🚀 Quick Start (Desktop UI)

The Desktop UI is the recommended way to use Auto Claude. It provides visual task management, real-time progress tracking, and a Kanban board interface.

### Prerequisites

1. **Clone this repository** - `git clone git@github.com:AndyMik90/Auto-Claude.git`
2. **Node.js 18+** - [Download Node.js](https://nodejs.org/)
2. **Python 3.10+** - [Download Python](https://www.python.org/downloads/)
3. **Docker Desktop** - Required for the Memory Layer
4. **Claude Code CLI** - `npm install -g @anthropic-ai/claude-code`
5. **Claude Subscription** - Requires [Claude Pro or Max](https://claude.ai/upgrade) for Claude Code access
6. **Git Repository** - Your project must be initialized as a git repository

### Git Initialization

**Auto Claude requires a git repository** to create isolated worktrees for safe parallel development. If your project isn't a git repo yet:

```bash
cd your-project
git init
git add .
git commit -m "Initial commit"
```

> **Why git?** Auto Claude uses git branches and worktrees to isolate each task in its own workspace, keeping your main branch clean until you're ready to merge. This allows you to work on multiple features simultaneously without conflicts.

---

## Download

Get the latest pre-built release for your platform:

| Platform | Download | Notes |
|----------|----------|-------|
| **Windows** | [Auto-Claude-2.7.2.exe](https://github.com/AndyMik90/Auto-Claude/releases/latest) | Installer (NSIS) |
| **macOS (Apple Silicon)** | [Auto-Claude-2.7.2-arm64.dmg](https://github.com/AndyMik90/Auto-Claude/releases/latest) | M1/M2/M3 Macs |
| **macOS (Intel)** | [Auto-Claude-2.7.2-x64.dmg](https://github.com/AndyMik90/Auto-Claude/releases/latest) | Intel Macs |
| **Linux** | [Auto-Claude-2.7.2.AppImage](https://github.com/AndyMik90/Auto-Claude/releases/latest) | Universal |
| **Linux (Debian)** | [Auto-Claude-2.7.2.deb](https://github.com/AndyMik90/Auto-Claude/releases/latest) | Ubuntu/Debian |

> All releases include SHA256 checksums and VirusTotal scan results for security verification.

---

## Requirements

- **Claude Pro/Max subscription** - [Get one here](https://claude.ai/upgrade)
- **Claude Code CLI** - `npm install -g @anthropic-ai/claude-code`
- **Git repository** - Your project must be initialized as a git repo
- **Python 3.12+** - Required for the backend and Memory Layer

---

## Quick Start

1. **Download and install** the app for your platform
2. **Open your project** - Select a git repository folder
3. **Connect Claude** - The app will guide you through OAuth setup
4. **Create a task** - Describe what you want to build
5. **Watch it work** - Agents plan, code, and validate autonomously

---

## Features

| Feature | Description |
|---------|-------------|
| **Autonomous Tasks** | Describe your goal; agents handle planning, implementation, and validation |
| **Parallel Execution** | Run multiple builds simultaneously with up to 12 agent terminals |
| **Isolated Workspaces** | All changes happen in git worktrees - your main branch stays safe |
| **Self-Validating QA** | Built-in quality assurance loop catches issues before you review |
| **AI-Powered Merge** | Automatic conflict resolution when integrating back to main |
| **Memory Layer** | Agents retain insights across sessions for smarter builds |
| **GitHub/GitLab Integration** | Import issues, investigate with AI, create merge requests |
| **Linear Integration** | Sync tasks with Linear for team progress tracking |
| **Cross-Platform** | Native desktop apps for Windows, macOS, and Linux |
| **Auto-Updates** | App updates automatically when new versions are released |

---

## Interface

### Kanban Board
Visual task management from planning through completion. Create tasks and monitor agent progress in real-time.

### Agent Terminals
AI-powered terminals with one-click task context injection. Spawn multiple agents for parallel work.

![Agent Terminals](.github/assets/Auto-Claude-Agents-terminals.png)

### Roadmap
AI-assisted feature planning with competitor analysis and audience targeting.

![Roadmap](.github/assets/Auto-Claude-roadmap.png)

### Additional Features
- **Insights** - Chat interface for exploring your codebase
- **Ideation** - Discover improvements, performance issues, and vulnerabilities
- **Changelog** - Generate release notes from completed tasks

---

## Project Structure

```
Auto-Claude/
├── apps/
│   ├── backend/     # Python agents, specs, QA pipeline
│   └── frontend/    # Electron desktop application
├── guides/          # Additional documentation
├── tests/           # Test suite
└── scripts/         # Build utilities
```

---

## CLI Usage

For headless operation, CI/CD integration, or terminal-only workflows:

```bash
cd apps/backend

# Create a spec interactively
python spec_runner.py --interactive

# Run autonomous build
python run.py --spec 001

# Review and merge
python run.py --spec 001 --review
python run.py --spec 001 --merge
```

See [guides/CLI-USAGE.md](guides/CLI-USAGE.md) for complete CLI documentation.

---

## Configuration

Create `apps/backend/.env` from the example:

```bash
cp apps/backend/.env.example apps/backend/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAUDE_CODE_OAUTH_TOKEN` | Yes | OAuth token from `claude setup-token` |
| `GRAPHITI_ENABLED` | No | Enable Memory Layer for cross-session context |
| `AUTO_BUILD_MODEL` | No | Override the default Claude model |
| `GITLAB_TOKEN` | No | GitLab Personal Access Token for GitLab integration |
| `GITLAB_INSTANCE_URL` | No | GitLab instance URL (defaults to gitlab.com) |
| `LINEAR_API_KEY` | No | Linear API key for task sync |

---

## Building from Source

For contributors and development:

```bash
# Clone the repository
git clone https://github.com/AndyMik90/Auto-Claude.git
cd Auto-Claude

# Install all dependencies
npm run install:all

# Run in development mode
npm run dev

# Or build and run
npm start
```

**System requirements for building:**
- Node.js 24+
- Python 3.12+
- npm 10+

**Installing dependencies by platform:**

<details>
<summary><b>Windows</b></summary>

```bash
winget install Python.Python.3.12
winget install OpenJS.NodeJS.LTS
```

</details>

<details>
<summary><b>macOS</b></summary>

```bash
brew install python@3.12 node@24
```

</details>

<details>
<summary><b>Linux (Ubuntu/Debian)</b></summary>

```bash
sudo apt install python3.12 python3.12-venv
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
```

</details>

<details>
<summary><b>Linux (Fedora)</b></summary>

```bash
sudo dnf install python3.12 nodejs npm
```

</details>

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development setup.

---

## Security

Auto Claude uses a three-layer security model:

1. **OS Sandbox** - Bash commands run in isolation
2. **Filesystem Restrictions** - Operations limited to project directory
3. **Dynamic Command Allowlist** - Only approved commands based on detected project stack

All releases are:
- Scanned with VirusTotal before publishing
- Include SHA256 checksums for verification
- Code-signed where applicable (macOS)

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install backend and frontend dependencies |
| `npm start` | Build and run the desktop app |
| `npm run dev` | Run in development mode with hot reload |
| `npm run package` | Package for current platform |
| `npm run package:mac` | Package for macOS |
| `npm run package:win` | Package for Windows |
| `npm run package:linux` | Package for Linux |
| `npm run lint` | Run linter |
| `npm test` | Run frontend tests |
| `npm run test:backend` | Run backend tests |

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup instructions
- Code style guidelines
- Testing requirements
- Pull request process

---

## Community

- **Discord** - [Join our community](https://discord.gg/KCXaPBr4Dj)
- **Issues** - [Report bugs or request features](https://github.com/AndyMik90/Auto-Claude/issues)
- **Discussions** - [Ask questions](https://github.com/AndyMik90/Auto-Claude/discussions)

---

## License

**AGPL-3.0** - GNU Affero General Public License v3.0

Auto Claude is free to use. If you modify and distribute it, or run it as a service, your code must also be open source under AGPL-3.0.

Commercial licensing available for closed-source use cases.
