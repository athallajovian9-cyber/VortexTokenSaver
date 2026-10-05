#!/usr/bin/env node
/**
 * CLI Wrapper for AI tools (claude-code, antigravity, hermes).
 * Automatically redirects API_BASE / OPENAI_BASE_URL through the optimizer.
 */

import { spawn } from "node:child_process";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: node wrap.js <command> [args...]");
  console.log("Example:");
  console.log("  node wrap.js claude");
  console.log("  node wrap.js antigravity --prompt 'fix bug'");
  console.log("  node wrap.js hermes");
  process.exit(1);
}

const command = args[0];
const cmdArgs = args.slice(1);

const env = {
  ...process.env,
  // Universal API base intercepts
  OPENAI_BASE_URL: "http://localhost:8080/v1",
  ANTHROPIC_BASE_URL: "http://localhost:8080",
  OLLAMA_HOST: "http://localhost:8080"
};

console.log(`[VORTEX TOKENSAVER] Launching '${command}' with active token compressor proxy on :8080...`);

const child = spawn(command, cmdArgs, {
  env,
  stdio: "inherit",
  shell: true
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
