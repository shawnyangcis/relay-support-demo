import { generateText, Output } from "ai";
import { answerSchema, requestSchema, validateEvidence } from "@/lib/contracts";
import { systemPrompt } from "@/lib/prompt";
import { supportModel } from "@/lib/model";
import { z } from "zod";

export const maxDuration = 60;
const windows = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Please send messages from the demo website." },
      { status: 403 },
    );
  // Best-effort per-instance limit. A distributed limiter is required for production.
  const now = Date.now();
  for (const [key, value] of windows)
    if (value.until < now) windows.delete(key);
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0] || "local";
  const window = windows.get(ip) ?? { count: 0, until: now + 60_000 };
  if (window.count >= 20)
    return Response.json(
      { error: "Please wait a minute before sending more messages." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  window.count++;
  windows.set(ip, window);
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return Response.json(
      { error: "Could not read your message." },
      { status: 400 },
    );
  }
  if (raw.length > 30_000)
    return Response.json(
      { error: "This conversation is too long. Start a new conversation." },
      { status: 413 },
    );
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid message format." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      {
        error:
          "Please send a message under 3,000 characters, or start a new conversation.",
      },
      { status: 400 },
    );
  try {
    const { model, id, direct } = supportModel();
    const options = {
      model,
      system:
        systemPrompt +
        "\nReturn ONLY a JSON object (no markdown fences) matching this schema: " +
        JSON.stringify(z.toJSONSchema(answerSchema)),
      messages: parsed.data.messages,
      maxOutputTokens: 2200,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(45_000),
    };
    const answer = direct
      ? answerSchema.parse(
          JSON.parse(
            (await generateText(options)).text
              .replace(/^```(?:json)?\s*|\s*```$/g, "")
              .trim(),
          ),
        )
      : (
          await generateText({
            ...options,
            output: Output.object({ schema: answerSchema }),
          })
        ).output;
    return Response.json({
      ...validateEvidence(answer, parsed.data.messages),
      mode: "live",
      model: id,
      latencyMs: Date.now() - now,
    });
  } catch (error) {
    // Never log conversation contents, provider payloads, credentials, or raw errors.
    const diagnostic = error as {
      name?: string;
      statusCode?: number;
      generationId?: string;
      message?: string;
    };
    const category = [
      "model",
      "provider",
      "authentication",
      "credit",
      "quota",
      "schema",
      "unsupported",
      "not found",
      "payment",
      "verification",
      "timeout",
    ].filter((word) => diagnostic.message?.toLowerCase().includes(word));
    console.error("chat_generation_failed", {
      type: diagnostic.name,
      status: diagnostic.statusCode,
      generationId: diagnostic.generationId,
      category,
    });
    return Response.json(
      {
        error:
          "The live assistant is temporarily unavailable. Please try again shortly. Your conversation is still here, and you can preview a handoff.",
      },
      { status: 503 },
    );
  }
}
