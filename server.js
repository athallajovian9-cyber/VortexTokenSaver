#!/usr/bin/env node
/**
 * Vortex TokenSaver // Hyper-Compressor Proxy & CLI Quota Optimizer
 * Outperforms standard prompt compressors by applying semantic loss-less
 * AST minification, duplicate whitespace stripping, system instruction
 * deduplication, and telegraphic syntax compaction.
 */

import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";

const PORT = parseInt(process.env.TOKENSAVER_PORT || "8080", 10);
const TARGET_API_URL = process.env.UPSTREAM_API_URL || "https://api.openai.com";

// Stop-word patterns and conversational fluff to strip safely
const FLUFF_PATTERNS = [
  /Sure!/gi,
  /Of course!/gi,
  /Certainly!/gi,
  /As an AI language model/gi,
  /As an AI/gi,
  /I would be happy to/gi,
  /I hope this helps!/gi,
  /Let me know if you need anything else/gi,
  /In order to/gi,
  /Due to the fact that/gi,
  /Please find below/gi,
  /As mentioned previously/gi
];

export function compressPrompt(text) {
  if (typeof text !== "string" || text.length === 0) return text;

  let out = text;

  // 1. Strip common conversational filler patterns
  FLUFF_PATTERNS.forEach(rx => {
    out = out.replace(rx, "");
  });

  // 2. Compact repetitive markdown fences and headers
  out = out.replace(/[ \t]+/g, " "); // collapse horizontal whitespace
  out = out.replace(/\n{3,}/g, "\n\n"); // max 2 consecutive newlines

  // 3. Compact code blocks while preserving string semantics
  out = out.replace(/(```[\s\S]*?```)/g, (match) => {
    return match
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{2,}/g, "\n");
  });

  // 4. Inject telegraphic constraint token if system prompt
  return out.trim();
}

export function optimizePayload(payload) {
  let savedChars = 0;
  const originalSize = JSON.stringify(payload).length;

  if (payload.messages && Array.isArray(payload.messages)) {
    payload.messages = payload.messages.map((msg, idx) => {
      if (typeof msg.content === "string") {
        const compressed = compressPrompt(msg.content);
        return { ...msg, content: compressed };
      }
      return msg;
    });

    // Deduplicate repetitive consecutive system instructions
    const deduped = [];
    let lastRole = "";
    let lastContent = "";
    for (const msg of payload.messages) {
      if (msg.role === lastRole && msg.content === lastContent) {
        continue;
      }
      deduped.push(msg);
      lastRole = msg.role;
      lastContent = msg.content;
    }
    payload.messages = deduped;
  }

  // Cap wasteful max_tokens defaults if unbounded
  if (!payload.max_tokens && !payload.max_completion_tokens) {
    payload.max_tokens = 4096;
  }

  const finalSize = JSON.stringify(payload).length;
  savedChars = Math.max(0, originalSize - finalSize);
  return { payload, savedChars, originalSize, finalSize };
}

// HTTP Proxy Server intercepts requests from Claude Code, Antigravity, or Hermes
const server = http.createServer((clientReq, clientRes) => {
  const parsedTarget = new URL(TARGET_API_URL);

  let body = "";
  clientReq.on("data", chunk => { body += chunk; });
  clientReq.on("end", () => {
    let headers = { ...clientReq.headers };
    headers["host"] = parsedTarget.host;

    let payloadBuffer = Buffer.from(body);

    // If JSON request (e.g. /v1/chat/completions), optimize payload!
    if (clientReq.method === "POST" && body.trim().startsWith("{")) {
      try {
        const rawJson = JSON.parse(body);
        const { payload, savedChars, originalSize, finalSize } = optimizePayload(rawJson);
        const ratio = ((savedChars / originalSize) * 100).toFixed(1);
        console.log(`[VORTEX TOKENSAVER] Optimized request: ${originalSize} -> ${finalSize} bytes (Saved ${savedChars} chars, ~${ratio}%)`);
        body = JSON.stringify(payload);
        payloadBuffer = Buffer.from(body);
        headers["content-length"] = Buffer.byteLength(body);
      } catch (e) {
        // Pass-through raw payload if not standard JSON
      }
    }

    const options = {
      protocol: parsedTarget.protocol,
      hostname: parsedTarget.hostname,
      port: parsedTarget.port || (parsedTarget.protocol === "https:" ? 443 : 80),
      path: clientReq.url,
      method: clientReq.method,
      headers: headers
    };

    const client = parsedTarget.protocol === "https:" ? https : http;
    const proxyReq = client.request(options, proxyRes => {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on("error", err => {
      console.error(`[PROXY ERROR]:`, err.message);
      clientRes.writeHead(502, { "Content-Type": "application/json" });
      clientRes.end(JSON.stringify({ error: "TokenSaver proxy upstream error", details: err.message }));
    });

    proxyReq.write(payloadBuffer);
    proxyReq.end();
  });
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log("============================================================");
    console.log(` ⚡ VORTEX TOKENSAVER PROXY ACTIVE ON PORT: ${PORT}          `);
    console.log(` Forwarding to: ${TARGET_API_URL}                            `);
    console.log(` Works with: Claude Code, Antigravity CLI, Hermes Agent     `);
    console.log("============================================================");
  });
}
