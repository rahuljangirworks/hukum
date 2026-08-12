import { defineRpcContract } from "@hukum/protocol/framework/index";
import {
  agentQuestionsListRequestSchema,
  agentQuestionsListResponseSchema,
  agentQuestionsAnswerRequestSchema,
  agentQuestionsAnswerResponseSchema,
  agentQuestionsDismissRequestSchema,
  agentQuestionsDismissResponseSchema,
} from "./schemas";

export const agentQuestionsListV10 = defineRpcContract({
  method: "agentQuestions.list",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: agentQuestionsListRequestSchema,
  responseSchema: agentQuestionsListResponseSchema,
});

export const agentQuestionsAnswerV10 = defineRpcContract({
  method: "agentQuestions.answer",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: agentQuestionsAnswerRequestSchema,
  responseSchema: agentQuestionsAnswerResponseSchema,
});

export const agentQuestionsDismissV10 = defineRpcContract({
  method: "agentQuestions.dismiss",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: agentQuestionsDismissRequestSchema,
  responseSchema: agentQuestionsDismissResponseSchema,
});
