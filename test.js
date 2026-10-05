// Test suite for Vortex TokenSaver compression engine
import test from "node:test";
import assert from "node:assert/strict";
import { compressPrompt, optimizePayload } from "./server.js";

test("compressPrompt strips AI conversational filler and collapses whitespace", () => {
  const input = "Sure! I would be happy to help.    In order to fix this:   \n\n\n\nconsole.log(1);";
  const result = compressPrompt(input);
  assert.ok(!result.includes("Sure!"));
  assert.ok(!result.includes("I would be happy to"));
  assert.ok(!result.includes("In order to"));
  assert.ok(result.length < input.length);
});

test("optimizePayload deduplicates identical consecutive system messages", () => {
  const payload = {
    messages: [
      { role: "system", content: "You are an assistant." },
      { role: "system", content: "You are an assistant." },
      { role: "user", content: "hello" }
    ]
  };

  const { payload: opt, savedChars } = optimizePayload(payload);
  assert.equal(opt.messages.length, 2);
  assert.ok(savedChars > 0);
});

test("optimizePayload sets default bounded max_tokens", () => {
  const payload = { messages: [{ role: "user", content: "test" }] };
  const { payload: opt } = optimizePayload(payload);
  assert.equal(opt.max_tokens, 4096);
});
