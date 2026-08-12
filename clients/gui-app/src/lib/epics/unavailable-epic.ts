export function isUnavailableEpicReason(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return (
    normalized.includes("gettaskroominfo returned null") ||
    normalized.includes("null roominfo") ||
    normalized.includes("returned null task") ||
    /^epic\s+(?:['"][^'"]+['"]|\S+)\s+was not found$/u.test(normalized)
  );
}
