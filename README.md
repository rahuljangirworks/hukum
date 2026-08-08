<img alt="Hukum" src="https://assets.hukum.ai/hukum-readme-banner.png" />

<div align="center">

[Download](https://hukum.ai/download) · [Docs](https://docs.hukum.ai) · [Releases](https://github.com/hukumai/hukum/releases/latest) · [Contributing](CONTRIBUTING.md)

<br />

[![MIT License](https://img.shields.io/badge/License-MIT-555555.svg?labelColor=333333&color=666666)](./LICENSE)
[![Downloads](https://img.shields.io/github/downloads/hukumai/hukum/total?labelColor=333333&color=666666)](https://github.com/hukumai/hukum/releases)
[![GitHub Stars](https://img.shields.io/github/stars/hukumai/hukum?labelColor=333333&color=666666&logo=github)](https://github.com/hukumai/hukum)
[![Last Commit](https://img.shields.io/github/last-commit/hukumai/hukum?labelColor=333333&color=666666)](https://github.com/hukumai/hukum/commits/main)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/hukumai/hukum?labelColor=333333&color=666666)](https://github.com/hukumai/hukum/graphs/commit-activity)

[![Discord](https://img.shields.io/badge/Discord-Join-%235462eb?labelColor=%235462eb&logo=discord&logoColor=%23f5f5f5)](https://hukum.ai/discord)
[![Follow @HukumAI on X](https://img.shields.io/twitter/follow/HukumAI?logo=X&color=%23f5f5f5)](https://twitter.com/intent/follow?screen_name=hukumai)

</div>

Hukum is an open-source AI orchestration app for advanced agent orchestration. Bring your existing provider subscriptions and run multiple agents in parallel without losing context, using shared memory across all models and providers.

Switch models instantly within the same agent, orchestrate agent-to-agent communication, and collaborate in real time.

[![Hukum Demo Video](https://github.com/user-attachments/assets/a5efda0c-16f2-453b-9f8d-50d09df25aa4)](https://youtu.be/doh2yz3ZFvU)

## Features

- **Bring Your Own Agent (BYOA):** Connect your existing coding agents without paying twice, or use Hukum's own inference subscription.
- **Unified Context:** Instantly switch to another model within the same agent. The context window is seamlessly shared across all providers.
- **Agent-to-Agent Communication:** Create automated loops where agents talk among themselves to debate architecture or peer-review code. Every agent can be referenced; reading a transcript and delivering a message are narrower and depend on user, Host, and runtime - see the [capability matrix](https://docs.hukum.ai/concepts/agent-to-agent).
- **Collaboration:** Invite team members to collaborate using shareable boards, real-time editing, and ticket assignment features directly in the workspace.
- **Cross-Device Sync:** Maintain the same agent state on any device, any OS.

## Installation

| Platform              | Install                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| macOS (Apple Silicon) | [Download .dmg (arm64)](https://github.com/hukumai/hukum/releases/latest/download/hukum-desktop-macos-arm64.dmg)    |
| macOS (Intel)         | [Download .dmg (x64)](https://github.com/hukumai/hukum/releases/latest/download/hukum-desktop-macos-x64.dmg)        |
| Linux (AppImage)      | [Download .AppImage](https://github.com/hukumai/hukum/releases/latest/download/hukum-desktop-linux-x86_64.AppImage) |
| Linux (Debian/Ubuntu) | [Download .deb](https://github.com/hukumai/hukum/releases/latest/download/hukum-desktop-linux-amd64.deb)            |
| Linux (Fedora/RHEL)   | [Download .rpm](https://github.com/hukumai/hukum/releases/latest/download/hukum-desktop-linux-x86_64.rpm)           |
| Windows (x64)         | [Download .exe](https://github.com/hukumai/hukum/releases/latest/download/hukum-desktop-windows-x64.exe)            |

See the [latest release](https://github.com/hukumai/hukum/releases/latest) for all available builds.

## Coding Agents and Subscriptions

An **agent** is the durable session you create in a Task; you work with it through a **Chat** or **Terminal** interface. A **coding agent** is the underlying provider that powers it. Hukum connects seamlessly with the subscriptions you already own, rather than locking you into an isolated ecosystem. Supported coding agents currently include:

| Coding agent                                          | Status                        |
| :---------------------------------------------------- | :---------------------------- |
| [Claude Code](https://claude.com/product/claude-code) | Fully supported               |
| [Codex](https://openai.com/codex)                     | Fully supported               |
| [Cursor](https://cursor.com/)                         | Fully supported               |
| [OpenCode](https://opencode.ai)                       | Fully supported               |
| [Hukum](https://hukum.ai)                         | Native inference subscription |

See [Coding Agents](https://docs.hukum.ai/agents-and-models/coding-agents) for setup commands and provider-specific configurations.

## Collaboration Features

Hukum is built for teams. The integrated collaboration features allow multiple developers to jump into the same shared workspace. You can assign tickets to specific agents, use shareable boards to visualize your development progress, and co-edit code alongside your AI loops.

See our [Sharing docs](https://docs.hukum.ai/panels/sharing) for details on team management and sharing configurations.

## Privacy

Your code is processed in-memory and never stored or used for training. Prompts and conversations follow **Privacy Mode** (default on for Team plans, opt-in for individuals); with it off, prompts may be logged to help improve our Services.

Agent requests for the CLI providers you configure go directly to that provider; Hukum's own inference is served by Hukum. Crash reporting (Sentry) and analytics (PostHog) may be enabled in release builds.

See our full [Privacy Policy](https://hukum.ai/legal/privacy-policy) for details.

## Documentation

For setup, configuration, agent integrations, and provider-specific behavior, head over to our [**docs**](https://docs.hukum.ai).

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) to get started and our [Code of Conduct](CODE_OF_CONDUCT.md). Commits must be signed off under the [Developer Certificate of Origin (DCO)](CONTRIBUTING.md#developer-certificate-of-origin-dco). You can also [open an issue](https://github.com/hukumai/hukum/issues) for bugs and feature requests.

> **Security:** Please don't report security vulnerabilities through public GitHub issues. Report them privately via the email **support@hukum.ai**. See the [Security Policy](SECURITY.md) for details.

<a href="https://github.com/hukumai/hukum/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hukumai/hukum" />
</a>

## Community

Join the Hukum community to get help, share feedback, and connect with other users:

- **[Discord](https://hukum.ai/discord)** — Chat with the team and community
- **[X / Twitter](https://x.com/hukumai)** — Follow for updates and announcements
- **[YouTube](https://www.youtube.com/@HukumAI)** — Subscribe for walkthroughs and other Hukum videos.

## License

Licensed under the [MIT License](LICENSE).
