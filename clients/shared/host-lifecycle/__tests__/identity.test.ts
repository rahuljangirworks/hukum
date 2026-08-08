import { describe, expect, it } from "vitest";
import {
  attestHukumRegistration,
  isEvictableHukumIdentity,
  isHukumLabelShape,
  hukumLabelIdsForBase,
  HUKUM_HOST_CONTENT_TAG,
} from "../identity";
import type { HukumLabelIds } from "../identity";
import { extractProgramArgumentsFromPrint } from "../macos/launchctl-print";
import {
  HEALTHY_HUKUM_AGENT_PRINT,
  SYSTEM_AGENT_BARE_ARGUMENTS_PRINT,
} from "./fixtures/launchctl";

const KNOWN: HukumLabelIds = hukumLabelIdsForBase("ai.hukum.host");

describe("hukumLabelIdsForBase", () => {
  it("derives the cli-raw / agent / fallback triple from a base label", () => {
    expect(hukumLabelIdsForBase("ai.hukum.host")).toEqual({
      cliRaw: "ai.hukum.host",
      agent: "ai.hukum.host.agent",
      fallback: "ai.hukum.host.fallback",
    });
  });

  it("derives the triple for an environment-scoped base label", () => {
    expect(hukumLabelIdsForBase("ai.hukum.host.staging")).toEqual({
      cliRaw: "ai.hukum.host.staging",
      agent: "ai.hukum.host.staging.agent",
      fallback: "ai.hukum.host.staging.fallback",
    });
  });
});

describe("isHukumLabelShape", () => {
  it("accepts the bare base label", () => {
    expect(isHukumLabelShape("ai.hukum.host")).toBe(true);
  });

  it("accepts dotted namespace children", () => {
    expect(isHukumLabelShape("ai.hukum.host.agent")).toBe(true);
  });

  it("accepts hyphenated namespace children", () => {
    expect(isHukumLabelShape("ai.hukum.host-legacy")).toBe(true);
  });

  it("rejects labels outside the namespace", () => {
    expect(isHukumLabelShape("com.apple.finder")).toBe(false);
  });

  it("rejects a label that merely contains the namespace as a substring", () => {
    expect(isHukumLabelShape("com.example.ai.hukum.host")).toBe(false);
  });
});

describe("attestHukumRegistration", () => {
  it("attests via an explicit matching content-tag", () => {
    const result = attestHukumRegistration({
      labelId: null,
      knownLabels: null,
      programArguments: null,
      contentTag: HUKUM_HOST_CONTENT_TAG,
      sourceText: null,
    });
    expect(result).toEqual({
      kind: "attested",
      signals: [{ kind: "content-tag", value: HUKUM_HOST_CONTENT_TAG }],
    });
  });

  it("rejects a foreign content-tag outright", () => {
    const result = attestHukumRegistration({
      labelId: null,
      knownLabels: null,
      programArguments: null,
      contentTag: "com.other.vendor",
      sourceText: null,
    });
    expect(result).toEqual({
      kind: "not-hukum",
      reason: "foreign content-tag: com.other.vendor",
    });
  });

  it("detects an in-body content tag when no explicit tag key is present", () => {
    const result = attestHukumRegistration({
      labelId: null,
      knownLabels: null,
      programArguments: null,
      contentTag: null,
      sourceText: `some blob containing ${HUKUM_HOST_CONTENT_TAG} inline`,
    });
    expect(result).toEqual({
      kind: "attested",
      signals: [{ kind: "content-tag", value: HUKUM_HOST_CONTENT_TAG }],
    });
  });

  it("attests via a label that matches one of the known triple", () => {
    const result = attestHukumRegistration({
      labelId: KNOWN.agent,
      knownLabels: KNOWN,
      programArguments: null,
      contentTag: null,
      sourceText: null,
    });
    expect(result.kind).toBe("attested");
  });

  it("records an in-namespace label outside the expected triple as a signal, but refuses eviction on that alone", () => {
    const result = attestHukumRegistration({
      labelId: "ai.hukum.host.other-env.agent",
      knownLabels: KNOWN,
      programArguments: null,
      contentTag: null,
      sourceText: null,
    });
    expect(result).toEqual({
      kind: "indeterminate",
      cause: "label shape alone is not positive identity for eviction",
    });
  });

  it("attests an in-namespace-but-unmatched-triple label once a strong signal (ProgramArguments) is also present", () => {
    const result = attestHukumRegistration({
      labelId: "ai.hukum.host.other-env.agent",
      knownLabels: KNOWN,
      programArguments: ["/usr/local/bin/hukum", "host", "start"],
      contentTag: null,
      sourceText: null,
    });
    expect(result.kind).toBe("attested");
  });

  it("rejects a label outside the Hukum namespace when known labels are supplied", () => {
    const result = attestHukumRegistration({
      labelId: "com.apple.finder",
      knownLabels: KNOWN,
      programArguments: null,
      contentTag: null,
      sourceText: null,
    });
    expect(result).toEqual({
      kind: "not-hukum",
      reason: "label 'com.apple.finder' is outside the Hukum host namespace",
    });
  });

  it("attests via label shape alone when no known-labels triple is supplied, given a strong signal too", () => {
    const result = attestHukumRegistration({
      labelId: "ai.hukum.host.agent",
      knownLabels: null,
      programArguments: ["/usr/local/bin/hukum", "host", "start"],
      contentTag: null,
      sourceText: null,
    });
    expect(result.kind).toBe("attested");
  });

  it("attests via ProgramArguments ending in 'host start'", () => {
    const result = attestHukumRegistration({
      labelId: null,
      knownLabels: null,
      programArguments: ["/usr/local/bin/hukum", "host", "start"],
      contentTag: null,
      sourceText: null,
    });
    expect(result).toEqual({
      kind: "attested",
      signals: [
        {
          kind: "program-arguments",
          tokens: ["/usr/local/bin/hukum", "host", "start"],
        },
      ],
    });
  });

  it("attests the label-bound host-start invocation emitted by current registrations", () => {
    const result = attestHukumRegistration({
      labelId: KNOWN.fallback,
      knownLabels: KNOWN,
      programArguments: [
        "/usr/local/bin/hukum",
        "host",
        "start",
        "--service-label",
        KNOWN.fallback,
      ],
      contentTag: null,
      sourceText: null,
    });
    expect(result.kind).toBe("attested");
  });

  it("attests the mixed-version-compatible shell registration only for its own label", () => {
    const result = attestHukumRegistration({
      labelId: KNOWN.fallback,
      knownLabels: KNOWN,
      programArguments: [
        "/bin/sh",
        "-c",
        `"$0" "$@" host start --help 2>&1 | /usr/bin/grep -Fq -- '--service-label' && exec "$0" "$@" host start --service-label '${KNOWN.fallback}' || exec "$0" "$@" host start`,
        "/usr/local/bin/hukum",
      ],
      contentTag: null,
      sourceText: null,
    });
    expect(result.kind).toBe("attested");
  });

  it("does not treat a mismatched --service-label argument as a host invocation", () => {
    const result = attestHukumRegistration({
      labelId: KNOWN.fallback,
      knownLabels: KNOWN,
      programArguments: [
        "/usr/local/bin/hukum",
        "host",
        "start",
        "--service-label",
        KNOWN.agent,
      ],
      contentTag: null,
      sourceText: null,
    });
    expect(result.kind).toBe("attested");
    if (result.kind === "attested") {
      expect(result.signals).toEqual([
        { kind: "label", value: KNOWN.fallback },
      ]);
    }
  });

  it("rejects non-empty ProgramArguments that do not end in 'host start' with no other signals", () => {
    const result = attestHukumRegistration({
      labelId: null,
      knownLabels: null,
      programArguments: ["/usr/bin/some-other-binary", "--flag"],
      contentTag: null,
      sourceText: null,
    });
    expect(result).toEqual({
      kind: "not-hukum",
      reason:
        "ProgramArguments do not end with a recognised 'host start' invocation",
    });
  });

  it("does not reject mismatched ProgramArguments when a content-tag signal already exists", () => {
    const result = attestHukumRegistration({
      labelId: null,
      knownLabels: null,
      programArguments: ["/usr/bin/some-other-binary", "--flag"],
      contentTag: HUKUM_HOST_CONTENT_TAG,
      sourceText: null,
    });
    expect(result.kind).toBe("attested");
  });

  it("is indeterminate when no positive signal is found at all", () => {
    const result = attestHukumRegistration({
      labelId: null,
      knownLabels: null,
      programArguments: null,
      contentTag: null,
      sourceText: null,
    });
    expect(result).toEqual({
      kind: "indeterminate",
      cause: "no positive Hukum identity signals found",
    });
  });

  it("is indeterminate when empty ProgramArguments produce no signal and nothing else does either", () => {
    const result = attestHukumRegistration({
      labelId: null,
      knownLabels: null,
      programArguments: [],
      contentTag: null,
      sourceText: null,
    });
    expect(result).toEqual({
      kind: "indeterminate",
      cause: "no positive Hukum identity signals found",
    });
  });

  it("is indeterminate when label shape alone is the only signal (no eviction on shape alone)", () => {
    const result = attestHukumRegistration({
      labelId: "ai.hukum.host.some-unknown-role",
      knownLabels: null,
      programArguments: null,
      contentTag: null,
      sourceText: null,
    });
    expect(result).toEqual({
      kind: "indeterminate",
      cause: "label shape alone is not positive identity for eviction",
    });
  });
});

describe("isEvictableHukumIdentity", () => {
  it("is true only for an attested identity", () => {
    expect(isEvictableHukumIdentity({ kind: "attested", signals: [] })).toBe(
      true,
    );
  });

  it("refuses eviction for not-hukum", () => {
    expect(
      isEvictableHukumIdentity({ kind: "not-hukum", reason: "x" }),
    ).toBe(false);
  });

  it("refuses eviction for indeterminate", () => {
    expect(
      isEvictableHukumIdentity({ kind: "indeterminate", cause: "x" }),
    ).toBe(false);
  });
});

/**
 * §2.1.2 — attestation must parse what launchd really emits, and the
 * label-suppresses-refutation rule is a **decision**, not an accident of the
 * order in which signals happen to be pushed.
 */
describe("identity attestation over real launchd bytes (annex §2.1.2)", () => {
  const KNOWN_LABELS = hukumLabelIdsForBase("ai.hukum.host");

  it("attests the live Hukum agent on its real, bare ProgramArguments", () => {
    const args = extractProgramArgumentsFromPrint(HEALTHY_HUKUM_AGENT_PRINT);
    expect(args).not.toBeNull();

    const attestation = attestHukumRegistration({
      labelId: KNOWN_LABELS.agent,
      knownLabels: KNOWN_LABELS,
      programArguments: args,
      contentTag: null,
      sourceText: null,
    });

    expect(attestation.kind).toBe("attested");
    if (attestation.kind === "attested") {
      // The finding was that this reduced to a label match alone, because the
      // args reader returned `null` for every real job. Invocation evidence
      // must actually be present.
      expect(attestation.signals.map((s) => s.kind)).toContain(
        "program-arguments",
      );
    }
  });

  it("refutes a foreign program on a label outside our namespace", () => {
    // Real bytes: a system agent whose program is /usr/libexec/enhancedloggingd.
    const args = extractProgramArgumentsFromPrint(
      SYSTEM_AGENT_BARE_ARGUMENTS_PRINT,
    );
    expect(args).toEqual(["/usr/libexec/enhancedloggingd"]);

    expect(
      attestHukumRegistration({
        labelId: "com.apple.enhancedloggingd",
        knownLabels: KNOWN_LABELS,
        programArguments: args,
        contentTag: null,
        sourceText: null,
      }).kind,
    ).toBe("not-hukum");
  });

  it("refutes foreign arguments when there is no ownership signal at all", () => {
    expect(
      attestHukumRegistration({
        labelId: null,
        knownLabels: KNOWN_LABELS,
        programArguments: ["/usr/libexec/enhancedloggingd"],
        contentTag: null,
        sourceText: null,
      }),
    ).toEqual({
      kind: "not-hukum",
      reason:
        "ProgramArguments do not end with a recognised 'host start' invocation",
    });
  });

  /**
   * DECISION, recorded and tested rather than left emergent: a squatter on one
   * of **our** labels, running a provably foreign program, still attests — the
   * label is the thing we own, and refusing to evict a squatter is how a
   * lockout survives its own repair.
   *
   * Previously this behaviour fell out of `if (signals.length === 0)`, so
   * moving the label block below the arguments block would have silently
   * reversed it with every test still green.
   */
  it("still attests a squatter on OUR label running a foreign program (intended)", () => {
    const attestation = attestHukumRegistration({
      labelId: KNOWN_LABELS.agent,
      knownLabels: KNOWN_LABELS,
      programArguments: ["/usr/libexec/enhancedloggingd"],
      contentTag: null,
      sourceText: null,
    });
    expect(attestation.kind).toBe("attested");
    if (attestation.kind === "attested") {
      expect(attestation.signals.map((s) => s.kind)).toEqual(["label"]);
    }
  });

  it("a content-tag also suppresses argument refutation", () => {
    expect(
      attestHukumRegistration({
        labelId: null,
        knownLabels: KNOWN_LABELS,
        programArguments: ["/usr/libexec/enhancedloggingd"],
        contentTag: HUKUM_HOST_CONTENT_TAG,
        sourceText: null,
      }).kind,
    ).toBe("attested");
  });

  // The rule the suppression must NOT weaken: a label *shape* we do not own,
  // with no invocation evidence at all, is still not evictable.
  it("does not attest an in-namespace label shape with no invocation evidence", () => {
    expect(
      attestHukumRegistration({
        labelId: "ai.hukum.host.someone-elses-env",
        knownLabels: KNOWN_LABELS,
        programArguments: null,
        contentTag: null,
        sourceText: null,
      }).kind,
    ).toBe("indeterminate");
  });
});
