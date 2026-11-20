import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";

export function supportModel() {
  if (process.env.CHAT_API_KEY) {
    const baseURL =
      process.env.CHAT_BASE_URL || "https://api.longcat.chat/openai/v1";
    const id = process.env.CHAT_MODEL || "LongCat-2.5";
    const isLongCat = new URL(baseURL).hostname === "api.longcat.chat";
    if (isLongCat) {
      // LongCat's Responses API supports strict JSON schema output. Chat
      // Completions can drift into plain text after several assistant turns.
      const provider = createOpenAI({
        apiKey: process.env.CHAT_API_KEY,
        baseURL,
        fetch: (url, init) =>
          fetch(url, {
            ...init,
            body: JSON.stringify({
              ...JSON.parse(String(init?.body)),
              // The SDK does not recognize this custom model's reasoning controls.
              reasoning: { effort: "none" },
              store: false,
            }),
          }),
      });
      return { model: provider.responses(id), id, direct: false };
    }
    const provider = createOpenAICompatible({
      name: "support-provider",
      apiKey: process.env.CHAT_API_KEY,
      baseURL,
      supportsStructuredOutputs: false,
    });
    return { model: provider.chatModel(id), id, direct: true };
  }
  const id = process.env.AI_GATEWAY_MODEL || "openai/gpt-5.4-mini";
  return { model: id, id, direct: false };
}
