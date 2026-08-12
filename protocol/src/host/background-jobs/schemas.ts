import { z } from "zod";

export const jobStateSchema = z.enum(["running", "exited", "killed"]);

export const backgroundJobListItemSchema = z.object({
  jobId: z.string(),
  command: z.string(),
  state: jobStateSchema,
  startedAt: z.number(),
});
export type BackgroundJobListItem = z.infer<typeof backgroundJobListItemSchema>;

export const backgroundJobsListRequestSchema = z.object({
  epicId: z.string(),
});
export const backgroundJobsListResponseSchema = z.array(backgroundJobListItemSchema);

export const backgroundJobStatusResponseSchema = z.object({
  jobId: z.string(),
  state: jobStateSchema,
  exitCode: z.number().nullable(),
  stdout: z.string(),
  stderr: z.string(),
  command: z.string(),
  startedAt: z.number(),
  endedAt: z.number().nullable(),
});
export type BackgroundJobStatus = z.infer<typeof backgroundJobStatusResponseSchema>;

export const backgroundJobsStatusRequestSchema = z.object({
  jobId: z.string(),
});

export const backgroundJobsCancelRequestSchema = z.object({
  jobId: z.string(),
});
export const backgroundJobsCancelResponseSchema = z.object({
  killed: z.boolean(),
});
