import { defineRpcContract } from "@hukum/protocol/framework/index";
import {
  backgroundJobsListRequestSchema,
  backgroundJobsListResponseSchema,
  backgroundJobsStatusRequestSchema,
  backgroundJobStatusResponseSchema,
  backgroundJobsCancelRequestSchema,
  backgroundJobsCancelResponseSchema,
} from "./schemas";

export const backgroundJobsListV10 = defineRpcContract({
  method: "backgroundJobs.list",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: backgroundJobsListRequestSchema,
  responseSchema: backgroundJobsListResponseSchema,
});

export const backgroundJobsStatusV10 = defineRpcContract({
  method: "backgroundJobs.status",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: backgroundJobsStatusRequestSchema,
  responseSchema: backgroundJobStatusResponseSchema,
});

export const backgroundJobsCancelV10 = defineRpcContract({
  method: "backgroundJobs.cancel",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: backgroundJobsCancelRequestSchema,
  responseSchema: backgroundJobsCancelResponseSchema,
});
