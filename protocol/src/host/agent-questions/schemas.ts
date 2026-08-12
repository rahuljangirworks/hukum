import { z } from "zod";

export const agentQuestionSchema = z.object({
  id: z.string(),
  epicId: z.string(),
  agentId: z.string(),
  question: z.string(),
  status: z.enum(["pending", "answered"]),
  answer: z.string().optional(),
  createdAt: z.number(),
  answeredAt: z.number().optional(),
});
export type AgentQuestion = z.infer<typeof agentQuestionSchema>;

export const agentQuestionsListRequestSchema = z.object({
  epicId: z.string(),
});
export const agentQuestionsListResponseSchema = z.array(agentQuestionSchema);

export const agentQuestionsAnswerRequestSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
});
export const agentQuestionsAnswerResponseSchema = z.object({
  ok: z.boolean(),
});

export const agentQuestionsDismissRequestSchema = z.object({
  questionId: z.string(),
});
export const agentQuestionsDismissResponseSchema = z.object({
  ok: z.boolean(),
});
