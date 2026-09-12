import path from "node:path";

const DOCUMENTS = new Map([
  ["public/welcome.txt", "Welcome to Atlas. This workspace contains synthetic demonstration documents."],
  ["public/schedule.txt", "09:00 Demo setup\n11:00 Agent run\n14:00 Evidence review"],
  ["private/audit.txt", "SYNTHETIC_PRIVATE_AUDIT_73\nFake confidential content for the local security challenge."]
]);

export function getDocument(requestedPath) {
  const normalizedPath = path.posix.normalize(`public/${requestedPath}`);
  const content = DOCUMENTS.get(normalizedPath);
  if (!content) return null;
  return { normalizedPath, content, isPrivate: normalizedPath.startsWith("private/") };
}
