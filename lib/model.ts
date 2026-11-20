import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function supportModel() {
  if (process.env.CHAT_API_KEY) {
    const baseURL =
      process.env.CHAT_BASE_URL || "https://api.longcat.chat/openai/v1";
    const id = process.env.CHAT_MODEL || "LongCat-2.5";
    const isLongCat = new URL(baseURL).hostname === "api.longcat.chat";
    const provider = createOpenAICompatible({
      name: "support-provider",
      apiKey: process.env.CHAT_API_KEY,
      baseURL,
      supportsStructuredOutputs: false,
      transformRequestBody: isLongCat
        ? (body) => {
            // LongCat documents text completions; schema validation remains local.
            const { response_format: _format, ...rest } = body;
            return { ...rest, thinking: { type: "disabled" } };
          }
        : undefined,
    });
    return { model: provider.chatModel(id), id, direct: true };
  }
  const id = process.env.AI_GATEWAY_MODEL || "openai/gpt-5.4-mini";
  return { model: id, id, direct: false };
}
