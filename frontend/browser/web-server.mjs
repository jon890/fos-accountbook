import { spawn, spawnSync } from "node:child_process";
import { cp } from "node:fs/promises";
import { join } from "node:path";
import { WEB_PORT } from "./settings.ts";

const frontendDir = join(import.meta.dirname, "..");
const standaloneDir = join(frontendDir, ".next/standalone");
const mode = process.env.BROWSER_WEB_SERVER ?? "build";

if (mode === "dev") {
  run("pnpm", ["dev", "--hostname", "127.0.0.1", "--port", String(WEB_PORT)], {});
} else if (mode === "build") {
  build();
  await cp(join(frontendDir, ".next/static"), join(standaloneDir, ".next/static"), { recursive: true });
  await cp(join(frontendDir, "public"), join(standaloneDir, "public"), { recursive: true });
  run("node", [join(standaloneDir, "server.js")], {
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    PORT: String(WEB_PORT),
  });
} else {
  throw new Error(`BROWSER_WEB_SERVER must be build or dev: ${mode}`);
}

function build() {
  const result = spawnSync("pnpm", ["build"], {
    cwd: frontendDir,
    env: { ...process.env, SKIP_ENV_VALIDATION: "true", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`Browser test build failed with exit code ${result.status}`);
  }
}

function run(command, args, env) {
  const server = spawn(command, args, {
    cwd: frontendDir,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => server.kill(signal));
  }
  server.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}
