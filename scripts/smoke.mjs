#!/usr/bin/env node

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const bearer = process.env.SMOKE_AUTH_BEARER;

const checks = [
  { name: "home", path: "/" },
  { name: "search", path: "/search?q=inception" },
  { name: "discover", path: "/discover" },
  { name: "mood-api", path: "/api/mood?q=cozy%20comedy" },
  { name: "health", path: "/api/health" },
  { name: "health-dependencies", path: "/api/health/dependencies" },
];

const authChecks = [
  { name: "lists-auth", path: "/lists" },
  { name: "for-you-auth", path: "/for-you" },
  { name: "settings-auth", path: "/settings" },
  { name: "notifications-auth", path: "/notifications" },
  { name: "admin-dashboard-auth", path: "/admin/dashboard" },
];

async function runCheck(check, headers = {}) {
  const url = new URL(check.path, baseUrl);
  const startedAt = Date.now();

  const res = await fetch(url, {
    headers,
    redirect: "manual",
  });

  const duration = Date.now() - startedAt;
  const status = res.status;
  const ok = status >= 200 && status < 400;

  return {
    name: check.name,
    path: check.path,
    status,
    ok,
    duration,
  };
}

function printResult(result) {
  const icon = result.ok ? "PASS" : "FAIL";
  console.log(
    `${icon} ${result.name.padEnd(24)} ${String(result.status).padEnd(4)} ${String(
      result.duration
    ).padStart(4)}ms  ${result.path}`
  );
}

async function main() {
  console.log(`Running smoke checks against ${baseUrl}`);
  const failures = [];

  for (const check of checks) {
    try {
      const result = await runCheck(check);
      printResult(result);
      if (!result.ok) failures.push(result);
    } catch (error) {
      const result = {
        name: check.name,
        path: check.path,
        status: "ERR",
        ok: false,
        duration: 0,
      };
      printResult(result);
      console.error(`  -> ${error instanceof Error ? error.message : String(error)}`);
      failures.push(result);
    }
  }

  if (bearer) {
    console.log("Running authenticated smoke checks");
    for (const check of authChecks) {
      try {
        const result = await runCheck(check, { Authorization: `Bearer ${bearer}` });
        printResult(result);
        if (!result.ok) failures.push(result);
      } catch (error) {
        const result = {
          name: check.name,
          path: check.path,
          status: "ERR",
          ok: false,
          duration: 0,
        };
        printResult(result);
        console.error(`  -> ${error instanceof Error ? error.message : String(error)}`);
        failures.push(result);
      }
    }
  } else {
    console.log(
      "Skipping authenticated checks (set SMOKE_AUTH_BEARER to run them)."
    );
  }

  if (failures.length > 0) {
    console.error(`Smoke checks failed (${failures.length} failure(s)).`);
    process.exit(1);
  }

  console.log("All smoke checks passed.");
}

main().catch((error) => {
  console.error("Smoke script failed unexpectedly.");
  console.error(error);
  process.exit(1);
});
