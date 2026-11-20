import { z } from 'zod';
import { articles } from './knowledge';

export const messageSchema = z.object({ role: z.enum(['user','assistant']), content: z.string().trim().min(1).max(3000) });
export const requestSchema = z.object({ messages: z.array(messageSchema).min(1).max(30) }).refine(data => data.messages.at(-1)?.role === 'user', 'Last message must be from the user');
export type ChatMessage = z.infer<typeof messageSchema>;
export const answerSchema = z.object({
  reply: z.string().min(1).max(2400).describe('Plain text response, short paragraphs, no Markdown formatting. Answer the latest user message.'),
  citations: z.array(z.object({ articleId: z.string(), quote: z.string().min(15).max(900).describe('Exact verbatim substring of that article supporting the answer.') })).max(3),
  suggestions: z.array(z.string().max(90)).max(3).describe('Short next replies the customer could send. Do not claim they have already performed a step.'),
  needsHuman: z.boolean(),
  topic: z.string().max(100).describe('Short topic of the current issue, without invented facts.'),
  customerEvidence: z.array(z.string().max(500)).max(6).describe('Exact quotes from USER messages describing the issue or confirmed actions, never assistant advice. Keep ambiguous confirmations verbatim; do not expand them into assumed completed steps.'),
  nextStep: z.string().max(400).describe('Suggested follow-up for a human, not an action already performed.'),
});
export type Answer = z.infer<typeof answerSchema>;
export type ChatResponse = Answer & { mode: 'live' | 'sample'; model?: string; latencyMs: number };

export function validateEvidence(answer: Answer, messages: ChatMessage[]): Answer {
  const userTexts = messages.filter(m => m.role === 'user').map(m => m.content);
  return { ...answer,
    citations: answer.citations.filter(c => articles.some(a => a.id === c.articleId && a.content.includes(c.quote))),
    customerEvidence: [...new Set(answer.customerEvidence)].filter(q => userTexts.some(t => t.includes(q))),
  };
}
