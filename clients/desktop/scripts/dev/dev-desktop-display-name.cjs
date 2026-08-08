"use strict";

const DEV_DESKTOP_DISPLAY_NAME_ENV = "HUKUM_DESKTOP_DEV_DISPLAY_NAME";

function resolveDevDesktopIdentity(env) {
  const rawSlot = env.DEV_DESKTOP_SLOT;
  if (typeof rawSlot !== "string") {
    return null;
  }
  const slot = sanitizeDevDesktopSlot(rawSlot);
  if (slot.length === 0) {
    throw new Error("DEV_DESKTOP_SLOT must contain a usable slot name");
  }
  const worktreeLabel = displayNameForSlot(slot);
  return {
    displayName: `Hukum Dev — ${worktreeLabel}`,
    worktreeLabel,
  };
}

function resolveDevDesktopDisplayName(env) {
  return resolveDevDesktopIdentity(env)?.displayName ?? null;
}

function sanitizeDevDesktopSlot(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function displayNameForSlot(slot) {
  if (/^hukum-[a-f0-9]{8}$/.test(slot)) {
    return slot;
  }
  const worktreeMatch = /^(?:hukum-)?(.+)-[a-f0-9]{8}$/.exec(slot);
  return worktreeMatch?.[1] ?? slot;
}

module.exports = {
  DEV_DESKTOP_DISPLAY_NAME_ENV,
  resolveDevDesktopDisplayName,
};
