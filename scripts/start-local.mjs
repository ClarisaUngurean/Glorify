import { spawn } from "node:child_process";

const children = [
  spawn(process.execPath, ["services/marker/server.mjs"], { stdio: "inherit" }),
  spawn(process.execPath, ["challenges/reflected-xss/server.mjs"], {
    stdio: "inherit"
  }),
  spawn(process.execPath, ["site1/server.mjs"], {
    stdio: "inherit"
  }),
  spawn(process.execPath, ["site2/server.mjs"], {
    stdio: "inherit"
  })
];

let shuttingDown = false;

function shutdown(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(signal));
}

for (const child of children) {
  child.on("exit", (code) => {
    if (!shuttingDown) {
      process.exitCode = code ?? 1;
      shutdown();
    }
  });
}
