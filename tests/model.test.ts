import assert from "node:assert/strict";
import test from "node:test";
import { generateText, Output } from "ai";
import { supportModel } from "../lib/model";
import { answerSchema } from "../lib/contracts";

test("LongCat uses native structured output and accepts its Responses envelope", async () => {
  const previousKey = process.env.CHAT_API_KEY;
  const previousBase = process.env.CHAT_BASE_URL;
  const previousModel = process.env.CHAT_MODEL;
  const previousFetch = globalThis.fetch;
  const answer = {
    reply: "Which login issue are you seeing?",
    citations: [],
    suggestions: [],
    needsHuman: false,
    topic: "Login",
    customerEvidence: ["I cannot log in"],
    nextStep: "Clarify the login issue.",
  };
  try {
    process.env.CHAT_API_KEY = "test-only-placeholder";
    delete process.env.CHAT_BASE_URL;
    delete process.env.CHAT_MODEL;
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), "https://api.longcat.chat/openai/v1/responses");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.text.format.type, "json_schema");
      assert.equal(body.text.format.strict, true);
      assert.ok(body.text.format.schema.required.includes("customerEvidence"));
      assert.deepEqual(body.reasoning, { effort: "none" });
      assert.equal(body.store, false);
      return Response.json({
        id: "resp_fixture",
        object: "response",
        status: "completed",
        created_at: 1791623622,
        model: "LongCat-2.5",
        output: [{
          type: "message", id: "msg_fixture", status: "completed", role: "assistant",
          content: [{ type: "output_text", text: JSON.stringify(answer), annotations: [] }],
        }],
        usage: { input_tokens: 20, output_tokens: 40, total_tokens: 60 },
      });
    };
    const { model } = supportModel();
    const result = await generateText({
      model,
      prompt: "I cannot log in",
      output: Output.object({ schema: answerSchema }),
      maxRetries: 0,
    });
    assert.deepEqual(result.output, answer);
  } finally {
    globalThis.fetch = previousFetch;
    for (const [name, value] of Object.entries({
      CHAT_API_KEY: previousKey, CHAT_BASE_URL: previousBase, CHAT_MODEL: previousModel,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
