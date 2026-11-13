/**
 * One command for local development:
 *   npm run dev
 * starts the Express API (port 4000) and the Vite dev server (port 5173).
 * No extra packages needed — only node:child_process.
 */
import { spawn } from "node:child_process";

const commands = [
  {
    name: "api",
    command: process.execPath,
    args: ["--watch", "server/index.js"],
    env: { ...process.env, PORT: "4000" },
  },
  {
    name: "web",
    command: "npm run dev:client",
    shell: true,
    env: process.env,
  },
];

const children = [];

for (const spec of commands) {
  const child = spawn(spec.command, spec.args || [], {
    stdio: "inherit",
    shell: spec.shell || false,
    env: spec.env,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${spec.name}] exited with code ${code}`);
      shutdown(code);
    }
  });

  children.push(child);
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(code), 200);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("\n  FashionStore dev");
console.log("  → UI  http://localhost:5173");
console.log("  → API http://localhost:4000/api/health\n");
