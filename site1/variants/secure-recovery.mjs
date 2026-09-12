import { randomBytes, timingSafeEqual } from "node:crypto";

const issuedTokens = new Map();

export function issueResetToken(username) {
  const token = randomBytes(24).toString("base64url");
  issuedTokens.set(username, token);
  return token;
}

export function verifyResetToken(username, token) {
  const expected = issuedTokens.get(username);
  if (!expected || expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
