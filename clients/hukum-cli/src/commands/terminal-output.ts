import { formatTerminalOutputPointer } from "@hukum/protocol/host/terminal/output-format";
import { readTerminalOutputResponseSchema } from "@hukum/protocol/host/terminal/unary-schemas";
import {
  callHostRpc,
  parseHostResponse,
  toAgentCliError,
} from "../internal/host-rpc";
import { resolveEpicId } from "../internal/agent-context";
import type { CommandFn } from "../runner/runner";

/**
 * `hukum terminal output` - write one interactive terminal's output to a
 * file on this host and print where it landed.
 *
 * Deliberately a POINTER, not the content: a terminal's scrollback is far
 * larger than anything worth pushing through a command's stdout, and the
 * caller is a coding agent that reads and greps files better than it reads a
 * dump. Every call rewrites the same path with the terminal's current state,
 * so re-running is how you refresh rather than a reason to keep the old path.
 *
 * Scoped to a Task exactly like `hukum agent transcript` - ambient from
 * `HUKUM_EPIC_ID` - so the ids this accepts are the ones `hukum terminal
 * list` printed for the same Task.
 */
export function buildTerminalOutputCommand(opts: {
  readonly epicId: string | null;
  readonly terminalId: string;
}): CommandFn {
  return async () => {
    const epicId = resolveEpicId(opts.epicId);
    const result = await toAgentCliError(
      callHostRpc("terminal.readOutput", {
        epicId,
        sessionId: opts.terminalId,
      }),
    );
    const { path } = parseHostResponse(
      readTerminalOutputResponseSchema,
      result,
    );
    // The protocol owns the sentence, so an agent reads the same line whether
    // it came through this command or the injected `hukum_read_terminal`.
    return {
      data: { path },
      human: formatTerminalOutputPointer(path),
      exitCode: 0,
    };
  };
}
