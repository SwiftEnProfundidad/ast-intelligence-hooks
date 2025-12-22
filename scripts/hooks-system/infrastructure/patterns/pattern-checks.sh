#!/usr/bin/env bash
# Pattern Checks - Infrastructure Layer
# Implementation of pattern-based code checks

source "$(dirname "${BASH_SOURCE[0]}")/../shell/core/constants.sh"
source "$(dirname "${BASH_SOURCE[0]}")/../shell/core/utils.sh"

check_grep() {
  local name="$1"
  local pattern="$2"
  local files_list="$3"
  if [[ ! -s "$files_list" ]]; then
    echo "$name:0"
    return
  fi
  local count
  count=$(while IFS= read -r file; do
    if [[ -f "$file" ]]; then
      # Excluir archivos del sistema que definen los propios patrones
      if [[ "$file" =~ pattern-checks\.sh$ ]]; then
        continue
      fi
      # Excluir archivos de metadata/configuración (.json, .md)
      if [[ "$file" =~ \.(json|md)$ ]]; then
        continue
      fi
      # Filtrar comentarios de una sola línea (//) y comentarios de bloque (/* */ y *)
      grep -E -n "$pattern" "$file" 2>/dev/null | grep -v "^\s*//" | grep -v "^\s*\*" | grep -v "/\*.*\*/"
    fi
  done < "$files_list" | wc -l | tr -d ' ' || echo "0")
  echo "$name:$count"
}

check_grep_console_exclude_logger() {
  local files_list="$1"
  if [[ ! -s "$files_list" ]]; then
    echo "CONSOLE_LOG:0"
    return
  fi
  local count=0
  while IFS= read -r file; do
    if [[ -f "$file" ]]; then
      while IFS=: read -r line_num line_content; do
        if [[ -n "$line_num" ]] && ! echo "$line_content" | grep -q "logger\\."; then
          count=$((count + 1))
        fi
      done < <(grep -E -n "console\\.(log|debug|warn|error)\\(" "$file" 2>/dev/null || true)
    fi
  done < "$files_list"
  echo "CONSOLE_LOG:$count"
}

check_any_type_ts_only() {
  local files_list="$1"
  # Crear lista temporal solo con archivos TS/JS (excluir .sh, .json, .md, etc.)
  local ts_files=$(mktemp)
  while IFS= read -r file; do
    if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
      echo "$file" >> "$ts_files"
    fi
  done < "$files_list"

  local result=$(check_grep "ANY_TYPE" ": any(\b|[^a-zA-Z_])" "$ts_files")
  rm -f "$ts_files"
  echo "$result"
}

run_pattern_checks() {
  local files_list="$1"
  local checks_total=6
  local step=0
  local check_names=("Task Markers" "Console.log" "Any Types" "Raw SQL" "Hardcoded Secrets" "Disabled Lint")

  step=$((step+1)); progress_bar_simple $step $checks_total "[${step}/${checks_total}] Checking ${check_names[0]}..." >&2; local r1=$(check_grep "TODO_FIXME" "TODO|FIXME|HACK" "$files_list")
  step=$((step+1)); progress_bar_simple $step $checks_total "[${step}/${checks_total}] Checking ${check_names[1]}..." >&2; local r2=$(check_grep_console_exclude_logger "$files_list")
  step=$((step+1)); progress_bar_simple $step $checks_total "[${step}/${checks_total}] Checking ${check_names[2]}..." >&2; local r3=$(check_any_type_ts_only "$files_list")
  step=$((step+1)); progress_bar_simple $step $checks_total "[${step}/${checks_total}] Checking ${check_names[3]}..." >&2; local r4=$(check_grep "SQL_RAW" "SELECT |INSERT |UPDATE |DELETE |DROP |ALTER |TRUNCATE " "$files_list")
  step=$((step+1)); progress_bar_simple $step $checks_total "[${step}/${checks_total}] Checking ${check_names[4]}..." >&2; local r5=$(check_grep "HARDCODED_SECRET" "(API_KEY|SECRET|TOKEN|PASSWORD)\s*[:=]\s*['\"]" "$files_list")
  step=$((step+1)); progress_bar_simple $step $checks_total "[${step}/${checks_total}] Checking ${check_names[5]}..." >&2; local r6=$(check_grep "DISABLED_LINT" "eslint-disable|ts-ignore" "$files_list")

  printf "%b✅ Pattern checks completed%b\n" "$GREEN" "$NC" >&2
  printf "%s\n%s\n%s\n%s\n%s\n%s\n" "$r1" "$r2" "$r3" "$r4" "$r5" "$r6"
}
