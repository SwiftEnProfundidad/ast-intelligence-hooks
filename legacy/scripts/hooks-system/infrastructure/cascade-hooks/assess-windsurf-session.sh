#!/usr/bin/env bash

# Assesses whether a real Windsurf session produced both pre-write and post-write events.
# Usage:
#   assess-windsurf-session.sh
#   assess-windsurf-session.sh "2026-02-07T00:00:00.000Z"

set -eu

SINCE="${1:-}"
if [ -z "${SINCE}" ]; then
  SINCE="$(node -e "console.log(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())")"
fi

RESULTS="$(node -e '
  const fs = require("fs");
  const since = process.argv[1];
  const hookLog = process.argv[2];
  const writesLog = process.argv[3];

  const counts = {
    analyzing: 0,
    blocked: 0,
    allowed: 0,
    post: 0
  };

  if (fs.existsSync(hookLog)) {
    for (const line of fs.readFileSync(hookLog, "utf8").split("\n")) {
      if (!line.trim()) continue;
      const match = line.match(/^\[([^\]]+)\] (.*)$/);
      if (!match) continue;
      const timestamp = match[1];
      const message = match[2];
      if (timestamp < since) continue;
      if (message.startsWith("ANALYZING:")) counts.analyzing += 1;
      if (message.startsWith("BLOCKED:")) counts.blocked += 1;
      if (message.startsWith("ALLOWED:")) counts.allowed += 1;
    }
  }

  if (fs.existsSync(writesLog)) {
    for (const line of fs.readFileSync(writesLog, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line);
        if (typeof item.timestamp === "string" && item.timestamp >= since) {
          counts.post += 1;
        }
      } catch {
        // Ignore malformed lines.
      }
    }
  }

  const status = counts.analyzing > 0 && counts.post > 0 ? "PASS" : "FAIL";
  console.log([
    `analyzing=${counts.analyzing}`,
    `blocked=${counts.blocked}`,
    `allowed=${counts.allowed}`,
    `post=${counts.post}`,
    `status=${status}`
  ].join("\n"));
' "${SINCE}" ".audit_tmp/cascade-hook.log" ".audit_tmp/cascade-writes.log")"

ANALYZING_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^analyzing=//p')"
BLOCKED_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^blocked=//p')"
ALLOWED_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^allowed=//p')"
POST_COUNT="$(printf '%s\n' "${RESULTS}" | sed -n 's/^post=//p')"
STATUS="$(printf '%s\n' "${RESULTS}" | sed -n 's/^status=//p')"

echo "[pumuki:cascade-hooks] since=${SINCE}"
echo "[pumuki:cascade-hooks] pre_write.analyzing=${ANALYZING_COUNT}"
echo "[pumuki:cascade-hooks] pre_write.blocked=${BLOCKED_COUNT}"
echo "[pumuki:cascade-hooks] pre_write.allowed=${ALLOWED_COUNT}"
echo "[pumuki:cascade-hooks] post_write.entries=${POST_COUNT}"

if [ "${STATUS}" = "PASS" ]; then
  echo "[pumuki:cascade-hooks] session-assessment=PASS"
  exit 0
fi

echo "[pumuki:cascade-hooks] session-assessment=FAIL" >&2
exit 1
