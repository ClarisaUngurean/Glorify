export function getRedirectDestination(next) {
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}
