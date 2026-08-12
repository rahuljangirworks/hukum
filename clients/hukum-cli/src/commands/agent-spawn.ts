import {
  spawnAgentRequestSchema,
  spawnAgentResponseSchema,
} from "@hukum/protocol/host/agent/shared";
import {
  callHostRpc,
  parseHostResponse,
  parseUserInput,
  toAgentCliError,
} from "../internal/host-rpc";
import { resolveEpicId, resolveSenderAgentId } from "../internal/agent-context";
import type { CommandFn } from "../runner/runner";

/** Atomically create a GUI child and queue its first assignment. */
export function buildAgentSpawnCommand(opts: {
  readonly epicId: string | null;
  readonly senderAgentId: string | null;
  readonly instruction: string;
  readonly name: string | null;
  readonly harness: string | null;
  readonly model: string | null;
  readonly reasoningEffort: string | null;
  readonly fast: boolean;
  readonly permissionMode: string | null;
  readonly expectReply: boolean;
}): CommandFn {
  return async () => {
    const request = parseUserInput(spawnAgentRequestSchema, {
      epicId: resolveEpicId(opts.epicId),
      senderAgentId: resolveSenderAgentId(opts.senderAgentId),
      name: opts.name,
      surface: "gui",
      harnessId: opts.harness,
      model: opts.model,
      agentMode: "regular",
      reasoningEffort: opts.reasoningEffort,
      fastMode: opts.fast ? true : null,
      workspace: null,
      profileSelection: { kind: "inherit_sender" },
      permissionMode: opts.permissionMode ?? "full_access",
      initialInstruction: opts.instruction,
      expectReply: opts.expectReply,
    });
    const result = parseHostResponse(
      spawnAgentResponseSchema,
      await toAgentCliError(callHostRpc("agent.spawn", request)),
    );
    const human =
      result.warnings.length === 0
        ? result.agentId
        : `${result.agentId}\nWarnings:\n${result.warnings.map((warning) => `- ${warning}`).join("\n")}`;
    return { data: result, human, exitCode: 0 };
  };
}
