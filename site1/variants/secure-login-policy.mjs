export function allowLoginAttempt(failedAttempts) {
  return failedAttempts < 3;
}
