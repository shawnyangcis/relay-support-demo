import { answerSchema } from "./contracts";

// Compatible providers may wrap their JSON in a code fence or introductory text.
// Extract the object, then validate every field. Never invent missing data.
export function parseAnswer(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start)
    throw new SyntaxError("No complete JSON object");
  return answerSchema.parse(JSON.parse(text.slice(start, end + 1)));
}
