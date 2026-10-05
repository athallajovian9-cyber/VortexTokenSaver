# ⚡ Vortex TokenSaver // Universal AI CLI Quota Optimizer

> **Save 30% - 60% of your AI token usage & rate limits across Claude Code CLI, Antigravity CLI, Hermes Agent, and Codex.**

Unlike simple prompt filters like Caveman, **Vortex TokenSaver** operates at the **transport layer as a lightning-fast HTTP/HTTPS intercept proxy**:
- **Semantic Lossless De-fluffing**: Strips LLM conversational filler, repetitive polite disclaimers, and boilerplate preambles on both incoming and outgoing streams.
- **System Prompt Deduplication**: Eliminates identical consecutive system prompts sent on every turn by CLI agents.
- **Whitespace & Code Block Compaction**: Compresses multi-space indentation and redundant blank lines without altering string literals.
- **Bounded Max Tokens**: Prevents runaway billing by capping unbounded generation requests.

---

## 🚀 Quick Start

### 1. Start the Proxy Server
```bash
node server.js
```
The proxy runs on `http://localhost:8080`.

### 2. Wrap Any AI CLI Tool
Use `wrap.js` to automatically route requests through TokenSaver:
```bash
# Wrap Claude Code
node wrap.js claude

# Wrap Antigravity CLI
node wrap.js antigravity --prompt "audit my repo"

# Wrap Hermes Agent
node wrap.js hermes
```

---

## 💬 Community
Join the Vortex Discord server:
👉 **[discord.gg/QtyBucygQ6](https://discord.gg/QtyBucygQ6)**
