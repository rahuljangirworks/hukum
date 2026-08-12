# @hukumai/cli

The npm distribution of the Hukum command line tool.

Hukum Desktop already includes the CLI and runs it behind the scenes, so most people do not need to install this package directly. Install `@hukumai/cli` when you want to manage the local Hukum Host from a terminal, script Hukum workflows, or use the agent/workspace automation surface outside the desktop app.

The npm package is a fully bundled JavaScript build with no runtime npm dependencies. It runs on Node.js 20.18.1 or newer.

## Installation

```sh
npm install -g @hukumai/cli
```

You can also run it without a global install:

```sh
npx @hukumai/cli --help
```

For the full desktop app, install Hukum from [hukum.ai/download](https://hukum.ai/download).

## Quick Start

```sh
hukum login
hukum host ensure
hukum host status
```

`hukum login` starts the browser-based sign-in flow. `hukum host ensure` installs the host version supported by this CLI, registers it with the operating system service manager when needed, and starts it. `hukum host status` confirms the local host process and endpoint.

## What It Does

- **Host lifecycle:** download, verify, install, start, stop, update, and supervise the local Hukum Host.
- **Authentication:** sign in with OAuth PKCE and share credentials with Hukum Desktop.
- **Diagnostics:** inspect host status, logs, service registration, and setup problems.
- **Configuration:** manage shell selection and environment overrides used by host and agent sessions.
- **Workspaces:** list Hukum workspaces and create isolated Git worktrees.
- **Agent automation:** list, create, message, and inspect agents from Hukum-managed sessions.

## Common Commands

| Command                        | Purpose                                                                |
| ------------------------------ | ---------------------------------------------------------------------- |
| `hukum login`                | Sign in to Hukum.                                                    |
| `hukum logout`               | Remove locally stored credentials.                                     |
| `hukum whoami`               | Show the signed-in user.                                               |
| `hukum host ensure`          | Install, register, and start the local Hukum Host if needed.         |
| `hukum host status`          | Show host process, endpoint, and activity status.                      |
| `hukum host doctor`          | Diagnose host installation and runtime issues.                         |
| `hukum host logs --tail 200` | Print recent host logs.                                                |
| `hukum host update`          | Update the installed host to the latest compatible release.            |
| `hukum host available`       | List host versions available for this environment.                     |
| `hukum cli upgrade`          | Upgrade the installed CLI binary when supported by the install source. |
| `hukum config shell get`     | Show the shell used for host bootstrap and terminal tabs.              |
| `hukum config env list`      | Show environment overrides used by Hukum.                            |

Use `--help` on any command group for the full local reference:

```sh
hukum --help
hukum host --help
hukum agent --help
```

## Scripting

```sh
hukum host status --json
```

Most commands support `--json`, which emits structured NDJSON events suitable for automation. The CLI also supports `--quiet` and `--no-progress` for logs, and honors non-interactive environments such as CI.

## Agent and Workspace Commands

Hukum-launched agent sessions receive environment variables such as `HUKUM_AGENT_ID` and `HUKUM_EPIC_ID`. In that context, the CLI can inspect the current epic, communicate with other agents, and create worktrees:

```sh
hukum agent list
hukum agent inbox
hukum agent spawn --instruction "Investigate the failing tests and report back"
hukum agent send --to <agent-id> --message "Can you review this change?"
hukum workspace list
hukum worktree create --workspace /path/to/repo --branch my-feature
```

These commands are mainly intended for Hukum-managed automation, but they are regular CLI commands and can be scripted when the host is running and the required IDs are supplied.

## Host Security

The npm package ships the CLI bundle only. The Hukum Host is a separate signed binary distributed through GitHub Releases. Before installation, host archives are verified by checksum and minisign signature against the trust root embedded in the CLI.

On supported platforms, the CLI supervises the host through the operating system service manager, including launchd on macOS and systemd user services on Linux.

## Authentication and Local Files

Sign-in uses OAuth with PKCE on a local loopback callback. Credentials and CLI state are stored under your Hukum home directory, including shared auth state used by Hukum Desktop.

Provider API keys are not configured through this CLI. Configure providers in Hukum Desktop under Settings > Providers.

## Troubleshooting

Start with:

```sh
hukum host doctor
hukum host logs --tail 200
```

If the host is missing or stopped, run:

```sh
hukum host ensure
```

If the service is registered but not responding, restart it:

```sh
hukum host restart
```

## Links

- Documentation: [docs.hukum.ai](https://docs.hukum.ai)
- Desktop app: [hukum.ai/download](https://hukum.ai/download)
- Source code: [github.com/hukumai/hukum](https://github.com/hukumai/hukum)
- CLI 1.0.0 release notes: [github.com/hukumai/hukum/releases/tag/cli-v1.0.0](https://github.com/hukumai/hukum/releases/tag/cli-v1.0.0)

## License

MIT. See the repository [LICENSE](https://github.com/hukumai/hukum/blob/main/LICENSE).
