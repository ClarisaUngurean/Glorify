export function issueResetToken(username) {
  return `reset-${username}`;
}

export function verifyResetToken(username, token) {
  return token === `reset-${username}`;
}
