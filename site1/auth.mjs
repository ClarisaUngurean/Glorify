const ACCOUNTS = new Map([
  ["demo", { password: "demo", role: "user" }]
]);

export function authenticate({ username, password, requestedRole }) {
  const account = ACCOUNTS.get(username);
  if (!account || account.password !== password) return null;

  return {
    username,
    accountRole: account.role,
    role: requestedRole || account.role
  };
}
