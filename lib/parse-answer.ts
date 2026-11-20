import { answerSchema } from "./contracts";
import { jsonrepair } from "jsonrepair";

// Compatible providers may wrap their JSON in a code fence or introductory text.
// Extract the object, then validate every field. Never invent missing data.
export function parseAnswer(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start)
    throw new SyntaxError("No complete JSON object");
  const candidate = text.slice(start, end + 1);
  let value: unknown;
  try {
    value = JSON.parse(candidate);
  } catch {
    value = JSON.parse(jsonrepair(candidate));
  }
  return answerSchema.parse(value);
}
