#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-.audit-reports/phase5-latest}"
SUMMARY_PATH="${OUT_DIR}/phase8-ready-handoff-summary.md"
HANDOFF_PATH="${OUT_DIR}/phase5-external-handoff.md"
ESCALATION_DOC="docs/validation/consumer-startup-escalation-handoff-latest.md"

echo "[phase8-ready-handoff] out_dir=${OUT_DIR}"

if ! npm run validation:phase5-latest:ready-check >/tmp/phase8-ready-check.log 2>&1; then
  cat /tmp/phase8-ready-check.log
  echo "[phase8-ready-handoff] chain is not READY; summary not generated" >&2
  exit 1
fi

if [[ ! -f "${HANDOFF_PATH}" ]]; then
  echo "[phase8-ready-handoff] missing handoff report: ${HANDOFF_PATH}" >&2
  exit 1
fi

if [[ ! -f "${ESCALATION_DOC}" ]]; then
  echo "[phase8-ready-handoff] missing escalation doc: ${ESCALATION_DOC}" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"

RUN_URLS="$(rg -o 'https://github.com/[^[:space:]]+/actions/runs/[0-9]+' "${HANDOFF_PATH}" | head -n 5 || true)"
CHECKSUM_LINE="$(rg -n "sha256:" "${ESCALATION_DOC}" | head -n 1 | sed 's/^[0-9]*://')"
GENERATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

{
  echo "# Phase 8 Ready Handoff Summary"
  echo
  echo "- generated_at: ${GENERATED_AT}"
  echo "- out_dir: \`${OUT_DIR}\`"
  echo "- chain_status: \`READY\`"
  echo
  echo "## Publication Checklist"
  echo
  echo "- [ ] Confirm reports are \`READY\`: blockers, closure-status, external-handoff, startup-unblock."
  echo "- [ ] Publish final external handoff artifacts/URLs."
  echo "- [ ] Update \`docs/REFRACTOR_PROGRESS.md\`: mark \`P8-3\` ✅ and set \`P8-4\` 🚧."
  echo "- [ ] Close \`P8-4\` once URLs are attached and handoff is complete."
  echo
  echo "## Latest Run URLs"
  echo
  if [[ -n "${RUN_URLS}" ]]; then
    while IFS= read -r url; do
      [[ -n "${url}" ]] && echo "- ${url}"
    done <<< "${RUN_URLS}"
  else
    echo "- <missing run URLs in ${HANDOFF_PATH}>"
  fi
  echo
  echo "## Escalation Bundle Checksum"
  echo
  if [[ -n "${CHECKSUM_LINE}" ]]; then
    echo "- ${CHECKSUM_LINE}"
  else
    echo "- <missing checksum line in ${ESCALATION_DOC}>"
  fi
} > "${SUMMARY_PATH}"

echo "[phase8-ready-handoff] generated ${SUMMARY_PATH}"
