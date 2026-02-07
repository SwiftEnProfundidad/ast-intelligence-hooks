#!/usr/bin/env bash

# Assesses whether a Windsurf session produced both pre-write and post-write events.
# Default mode excludes local simulated events.
# Usage:
#   assess-windsurf-session.sh
#   assess-windsurf-session.sh "2026-02-07T00:00:00.000Z"
#   assess-windsurf-session.sh --include-simulated
#   assess-windsurf-session.sh --include-simulated "2026-02-07T00:00:00.000Z"

set -eu

INCLUDE_SIMULATED=0
SINCE=""

for arg in "$@"; do
  if [ "${arg}" = "--include-simulated" ]; then
    INCLUDE_SIMULATED=1
  elif [ -z "${SINCE}" ]; then
    SINCE="${arg}"
  else
    echo "[pumuki:cascade-hooks] unexpected argument: ${arg}" >&2
    exit 2
  fi
done

if [ -z "${SINCE}" ]; then
  SINCE="$(node -e "console.log(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())")"
fi

RESULTS="$(node -e '
  const fs = require("fs");
  const path = require("path");
  const since = process.argv[1];
  const includeSimulated = process.argv[2] === "1";
  const repoRoot = process.argv[3];
  const hookLog = process.argv[4];
  const writesLog = process.argv[5];

  const counts = {
    analyzing: 0,
    blocked: 0,
    allowed: 0,
    post: 0,
    realAnalyzing: 0,
    realPost: 0
  };

  const simulatedMarkers = [
    "__pumuki_simulated__",
    "apps/backend/src/example.ts",
    "/tmp/demo.ts"
  ];

  const isSimulatedPath = (value) => {
    if (typeof value !== "string") return false;
    return simulatedMarkers.some((marker) => value.includes(marker));
  };

  const isSimulatedTrajectory = (value) => value === "pumuki-local-simulated";

  const isRepoPath = (value) => {
    if (typeof value !== "string" || value.length === 0) return false;
    if (path.isAbsolute(value)) {
      const normalized = path.normalize(value);
      const root = path.normalize(repoRoot);
      return normalized === root || normalized.startsWith(root + path.sep);
    }
    return true;
  };

  if (fs.existsSync(hookLog)) {
    for (const line of fs.readFileSync(hookLog, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const match = line.match(/^\[([^\]]+)\] (.*)$/);
      if (!match) continue;
      const timestamp = match[1];
      const message = match[2];
      if (timestamp < since) continue;

      if (message.startsWith("ANALYZING:")) {
        counts.analyzing += 1;
        const fileMatch = message.match(/^ANALYZING:\s+(.+?)\s+\(\d+\s+edits\)/);
        const filePath = fileMatch ? fileMatch[1] : "";
        const simulated = isSimulatedPath(filePath);
        const repoScoped = isRepoPath(filePath);
        if ((includeSimulated || !simulated) && repoScoped) {
          counts.realAnalyzing += 1;
        }
      }

      if (message.startsWith("BLOCKED:")) counts.blocked += 1;
      if (message.startsWith("ALLOWED:")) counts.allowed += 1;
    }
  }

  if (fs.existsSync(writesLog)) {
    for (const line of fs.readFileSync(writesLog, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line);
        if (typeof item.timestamp !== "string" || item.timestamp < since) continue;
        counts.post += 1;
        const simulated = isSimulatedPath(item.file) || isSimulatedTrajectory(item.trajectory_id);
        const repoScoped = isRepoPath(item.file);
        if ((includeSimulated || !simulated) && repoScoped) {
          counts.realPost += 1;
        }
      } catch {
        // Ignore malformed lines.
      }
    }
  }

  const status = counts.realAnalyzing > 0 && counts.realPost > 0 ? "PASS" : "FAIL";
  console.log([
    `analyzing=${counts.analyzing}`,
    `blocked=${counts.blocked}`,
    `allowed=${counts.allowed}`,
    `post=${counts.post}`,
    `real_analyzing=${counts.realAnalyzing}`,
    `real_post=${counts.realPost}`,
    `status=${status}`
  ].join("\n"));
' "${SINCE}" "${INCLUDE_SIMULATED}" "$(pwd)" ".audit_tmp/cascade-hook.log" ".audit_tmp/cascade-writes.log")"

ANALYZING_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^analyzing=//p')"
BLOCKED_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^blocked=//p')"
ALLOWED_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^allowed=//p')"
POST_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^post=//p')"
REAL_ANALYZING_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^real_analyzing=//p')"
REAL_POST_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^real_post=//p')"
STATUS="$(printf '%s\n' "${RESULTS}" | sed -n 's/^status=//p')"

echo "[pumuki:cascade-hooks] since=${SINCE}"
echo "[pumuki:cascade-hooks] include_simulated=${INCLUDE_SIMULATED}"
echo "[pumuki:cascade-hooks] pre_write.analyzing_total=${ANALYZING_COUNT}"
echo "[pumuki:cascade-hooks] pre_write.blocked_total=${BLOCKED_COUNT}"
echo "[pumuki:cascade-hooks] pre_write.allowed_total=${ALLOWED_COUNT}"
echo "[pumuki:cascade-hooks] post_write.entries_total=${POST_COUNT}"
echo "[pumuki:cascade-hooks] pre_write.analyzing_effective=${REAL_ANALYZING_COUNT}"
echo "[pumuki:cascade-hooks] post_write.entries_effective=${REAL_POST_COUNT}"

if [ "${STATUS}" = "PASS" ]; then
  echo "[pumuki:cascade-hooks] session-assessment=PASS"
  exit 0
fi

echo "[pumuki:cascade-hooks] session-assessment=FAIL" >&2
exit 1
