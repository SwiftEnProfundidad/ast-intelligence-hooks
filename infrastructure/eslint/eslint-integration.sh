#!/usr/bin/env bash
# ESLint Integration - Infrastructure Layer
# Implementation of ESLint code analysis

source "$(dirname "${BASH_SOURCE[0]}")/../shell/core/constants.sh"
source "$(dirname "${BASH_SOURCE[0]}")/../shell/core/utils.sh"

run_eslint_for_app() {
  local app_path="$1"
  local report_path="$2"
  pushd "$app_path" >/dev/null
  if command -v npx >/dev/null 2>&1; then
    npx eslint "." -f json --max-warnings=0 > "$report_path" || true
  else
    ./node_modules/.bin/eslint "." -f json --max-warnings=0 > "$report_path" || true
  fi
  popd >/dev/null
}

aggregate_eslint() {
  local json_file="$1"
  if [[ ! -s "$json_file" ]]; then
    echo "0 0 0"
    return
  fi
  local errors warnings infos
  errors=$(grep -o '"severity":2' "$json_file" | wc -l | tr -d ' ' || true)
  warnings=$(grep -o '"severity":1' "$json_file" | wc -l | tr -d ' ' || true)
  infos=0
  echo "$errors $warnings $infos"
}

run_eslint_suite_impl() {
  local root_dir="$1"
  local tmp_dir="$2"
  
  printf "%b%s%b\n" "$YELLOW" "$MSG_ESLINT" "$NC"
  local admin_report="$tmp_dir/eslint-admin.json"
  local web_report="$tmp_dir/eslint-web.json"
  local total_apps=0

  if [[ -d "${root_dir}/apps/admin-dashboard" ]]; then
    total_apps=$((total_apps + 1))
  fi
  if [[ -d "${root_dir}/apps/web-app" ]]; then
    total_apps=$((total_apps + 1))
  fi

  local app_step=0
  if [[ -d "${root_dir}/apps/admin-dashboard" ]]; then
    app_step=$((app_step + 1))
    progress_bar_simple $app_step $total_apps "[${app_step}/${total_apps}] Running ESLint on Admin Dashboard..." >&2
    run_eslint_for_app "${root_dir}/apps/admin-dashboard" "$admin_report"
  fi

  if [[ -d "${root_dir}/apps/web-app" ]]; then
    app_step=$((app_step + 1))
    progress_bar_simple $app_step $total_apps "[${app_step}/${total_apps}] Running ESLint on Web App..." >&2
    run_eslint_for_app "${root_dir}/apps/web-app" "$web_report"
  fi

  printf "%b✅ ESLint audits completed%b\n\n" "$GREEN" "$NC"

  local a_err a_warn _ a2_err a2_warn _2
  read -r a_err a_warn _ < <(aggregate_eslint "$admin_report")
  read -r a2_err a2_warn _2 < <(aggregate_eslint "$web_report")

  local total_err=$((a_err + a2_err))
  local total_warn=$((a_warn + a2_warn))

  local emj_err="$EMJ_ERR"; local emj_warn="$EMJ_WARN"
  printf "ESLint Admin: %s errors=%s %s warnings=%s\n" "$emj_err" "$a_err" "$emj_warn" "$a_warn"
  printf "ESLint Web:   %s errors=%s %s warnings=%s\n" "$emj_err" "$a2_err" "$emj_warn" "$a2_warn"
  printf "%bESLint Total:%b %s errors=%s %s warnings=%s\n" "$GREEN" "$NC" "$emj_err" "$total_err" "$emj_warn" "$total_warn" | tee "$tmp_dir/eslint-summary.txt"
}

