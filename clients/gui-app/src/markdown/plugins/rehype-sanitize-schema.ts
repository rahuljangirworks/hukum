import {
  HUKUM_AGENT_TAG,
  HUKUM_CHAT_TAG,
  HUKUM_EPIC_TAG,
  HUKUM_MERMAID_TAG,
  HUKUM_SPEC_TAG,
  HUKUM_TICKET_TAG,
} from "./const";
import type { Schema } from "hast-util-sanitize";
import { defaultSchema } from "rehype-sanitize";

// Windows drive pseudo-schemes (`C:\…` → scheme `c`). Sanitize runs before
// react-markdown's urlTransform, so a bare drive href is dropped here unless its
// single-letter scheme is allow-listed. `hast-util-sanitize` matches the scheme
// case-sensitively, so both `A`–`Z` (drives are usually upper-case) and `a`–`z`
// are listed. A single ASCII letter can never collide with an exact-match
// dangerous scheme (`javascript`, `data`, `vbscript`), so permitting these for
// `href` is safe; do not broaden to multi-letter schemes.
const DRIVE_LETTER_SCHEMES = Array.from({ length: 26 }, (_, index) => [
  String.fromCharCode(65 + index),
  String.fromCharCode(97 + index),
]).flat();

const HUKUM_TAG_NAMES = [
  HUKUM_CHAT_TAG,
  HUKUM_AGENT_TAG,
  HUKUM_EPIC_TAG,
  HUKUM_SPEC_TAG,
  HUKUM_TICKET_TAG,
  HUKUM_MERMAID_TAG,
] as const;

const HUKUM_TAG_ATTRIBUTES: Schema["attributes"] = {
  [HUKUM_CHAT_TAG]: ["data-epic-id", "data-chat-id", "data-title"],
  [HUKUM_AGENT_TAG]: ["data-agent-id", "data-display"],
  [HUKUM_EPIC_TAG]: ["data-epic-id", "data-title"],
  [HUKUM_SPEC_TAG]: ["data-epic-id", "data-spec-id", "data-title"],
  [HUKUM_TICKET_TAG]: ["data-epic-id", "data-ticket-id", "data-title"],
  [HUKUM_MERMAID_TAG]: ["data-code"],
};

/**
 * Merge product attribute allowlists onto a base schema without dropping
 * caller-supplied attributes for the same tag (spread overwrite would).
 */
function mergeHukumTagAttributes(
  baseAttributes: Schema["attributes"],
): Schema["attributes"] {
  const base = baseAttributes ?? {};
  const hukumAttrs = HUKUM_TAG_ATTRIBUTES ?? {};
  const merged: NonNullable<Schema["attributes"]> = { ...base };
  for (const tag of HUKUM_TAG_NAMES) {
    const required = hukumAttrs[tag];
    if (!Array.isArray(required)) continue;
    if (!Object.hasOwn(base, tag)) {
      merged[tag] = [...required];
      continue;
    }
    const existing = base[tag];
    const existingList = Array.isArray(existing) ? existing : [];
    merged[tag] = [...existingList, ...required];
  }
  return merged;
}

/**
 * Extend Tailmark's (or any base) sanitize schema with Hukum product tags and
 * file-link protocols. Used as `StreamingMarkdown`'s `sanitizeSchema` so the
 * base `streamdown:` incomplete-link protocol is preserved.
 */
export function extendHukumSanitizeSchema(schema: Schema): Schema {
  return {
    ...schema,
    protocols: {
      ...schema.protocols,
      href: [
        ...(schema.protocols?.href ?? []),
        "file",
        ...DRIVE_LETTER_SCHEMES,
      ],
    },
    tagNames: [...(schema.tagNames ?? []), ...HUKUM_TAG_NAMES],
    attributes: mergeHukumTagAttributes(schema.attributes),
  };
}

/** Assistant-only image source protocols. Other markdown surfaces keep the
 * shared schema above, which deliberately owns only link destinations. */
export function extendAssistantImageSanitizeSchema(schema: Schema): Schema {
  const hukumSchema = extendHukumSanitizeSchema(schema);
  return {
    ...hukumSchema,
    protocols: {
      ...hukumSchema.protocols,
      src: [
        ...(hukumSchema.protocols?.src ?? []),
        "data",
        "file",
        ...DRIVE_LETTER_SCHEMES,
      ],
    },
  };
}

/**
 * Standalone product schema (tests / docs). Prefer
 * {@link extendHukumSanitizeSchema} when composing with Tailmark's base.
 */
export const HUKUM_SANITIZE_SCHEMA: Schema =
  extendHukumSanitizeSchema(defaultSchema);
