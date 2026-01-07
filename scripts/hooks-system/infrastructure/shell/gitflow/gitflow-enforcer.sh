#!/usr/bin/env bash

set -euo pipefail

GIT_BIN="${GIT_BIN:-$(command -v git)}"
REPO_ROOT="$($GIT_BIN rev-parse --show-toplevel 2>/dev/null || echo "")"

if [[ -z "$REPO_ROOT" ]]; then
  echo "❌ Fuera de un repositorio git"
  exit 1
fi

cd "$REPO_ROOT"

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

AUTO_CREATE_PR=${GITFLOW_AUTO_CREATE_PR:-true}
AUTO_MERGE_PR=${GITFLOW_AUTO_MERGE:-false}
PR_BASE_BRANCH=${GITFLOW_PR_BASE:-develop}
STRICT_ATOMIC=${GITFLOW_STRICT_ATOMIC:-true}
REQUIRE_TEST_RELATIONS=${GITFLOW_REQUIRE_TESTS:-true}

print_section() {
  printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
  printf "${BLUE}%s${NC}\n" "$1"
  printf "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

read_json_value() {
  local file="$1"
  local path="$2"
  jq -er "$path" "$file" 2>/dev/null || echo ""
}

evidence_age() {
  local file="${REPO_ROOT}/.AI_EVIDENCE.json"
  if [[ ! -f "$file" ]]; then
    echo "-1"
    return
  fi
  local timestamp
  timestamp=$(read_json_value "$file" '.timestamp')
  if [[ -z "$timestamp" || "$timestamp" == "null" ]]; then
    echo "-1"
    return
  fi
  local clean_ts
  clean_ts=$(echo "$timestamp" | sed 's/\.[0-9]*Z$/Z/')
  local epoch
  epoch=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$clean_ts" +%s 2>/dev/null || echo "0")
  local now
  now=$(date +%s)
  echo $((now - epoch))
}

ensure_evidence_fresh() {
  local age
  age=$(evidence_age)
  if [[ "$age" == "-1" ]]; then
    printf "${YELLOW}⚠️  Evidencia ausente o inválida. Refrescando...${NC}\n"
    refresh_evidence "missing"
    return
  fi
  if [[ "$age" -gt 180 ]]; then
    printf "${YELLOW}⚠️  Evidencia obsoleta (%ss). Refrescando...${NC}\n" "$age"
    refresh_evidence "stale"
  else
    printf "${GREEN}✅ Evidencia fresca (%ss).${NC}\n" "$age"
  fi
}

refresh_evidence() {
  local reason="${1:-manual}"
  local script="${REPO_ROOT}/scripts/hooks-system/bin/update-evidence.sh"
  if [[ ! -x "$script" ]]; then
    printf "${RED}❌ No se encontró update-evidence.sh${NC}\n"
    return 1
  fi
  local platforms="${GITFLOW_PLATFORMS:-1,2,3,4}"
  if printf "%s\n" "$platforms" | grep -q '[^0-9,]'; then
    platforms="1,2,3,4"
  fi
  if ! printf "%s\n" "$platforms" | bash "$script" --auto; then
    printf "${RED}❌ Falló la actualización automática de evidencia (${reason}).${NC}\n"
    return 1
  fi
  printf "${GREEN}✅ Evidencia renovada (${reason}).${NC}\n"
}

lint_hooks_system() {
  local repo_pkg="${REPO_ROOT}/package.json"
  local hooks_pkg="${REPO_ROOT}/scripts/hooks-system/package.json"

  if [[ -f "${repo_pkg}" ]]; then
    printf "${CYAN}🔎 Ejecutando lint (repo root)...${NC}\n"
    if npm --prefix "${REPO_ROOT}" run lint:hooks; then
      printf "${GREEN}✅ Lint hooks-system OK.${NC}\n"
      return 0
    fi
  fi

  if [[ -f "${hooks_pkg}" ]]; then
    printf "${CYAN}🔎 Ejecutando lint (scripts/hooks-system)...${NC}\n"
    if npm --prefix "${REPO_ROOT}/scripts/hooks-system" run lint:hooks; then
      printf "${GREEN}✅ Lint hooks-system OK.${NC}\n"
      return 0
    fi
  fi

  printf "${RED}❌ Lint hooks-system falló.${NC}\n"
  return 1
}

run_mobile_checks() {
  local ios_script="${REPO_ROOT}/scripts/automation/verify-ios-build.sh"
  local android_script="${REPO_ROOT}/scripts/automation/verify-android-build.sh"

  if [[ -x "$ios_script" ]]; then
    printf "${CYAN}📱 Verificando módulo iOS...${NC}\n"
    if ! "$ios_script"; then
      printf "${RED}❌ Verificación iOS falló.${NC}\n"
      return 1
    fi
  else
    printf "${YELLOW}ℹ️  Script iOS no disponible (${ios_script}).${NC}\n"
  fi

  if [[ -x "$android_script" ]]; then
    printf "${CYAN}🤖 Verificando módulo Android...${NC}\n"
    if ! "$android_script"; then
      printf "${RED}❌ Verificación Android falló.${NC}\n"
      return 1
    fi
  else
    printf "${YELLOW}ℹ️  Script Android no disponible (${android_script}).${NC}\n"
  fi

  return 0
}

is_merge_commit() {
  local commit="$1"
  local parents
  parents=$($GIT_BIN rev-list --parents -n 1 "$commit")
  [[ "$(echo "$parents" | wc -w | tr -d ' ')" -gt 2 ]]
}

verify_atomic_commit() {
  if [[ "${STRICT_ATOMIC}" != "true" ]]; then
    return 0
  fi

  local commit="${1:-HEAD}"

  if is_merge_commit "$commit"; then
    return 0
  fi

  if ! $GIT_BIN rev-parse --quiet --verify "${commit}^" >/dev/null 2>&1; then
    # no parent (primer commit), no aplicar regla
    return 0
  fi

  local -a files=()
  while IFS= read -r file; do
    [[ -n "$file" ]] && files+=("$file")
  done < <($GIT_BIN diff --name-only "${commit}^..${commit}")
  if [[ "${#files[@]}" -eq 0 ]]; then
    return 0
  fi

  declare -A roots=()
  for file in "${files[@]}"; do
    local root="${file%%/*}"
    if [[ "$root" == "$file" ]]; then
      root="(root)"
    fi
    case "$root" in
      .AI_EVIDENCE.json|README.md|CHANGELOG.md|docs )
        continue
        ;;
      "" )
        root="(root)"
        ;;
    esac
    roots["$root"]=1
  done

  local root_count=${#roots[@]}
  if (( root_count > 1 )); then
    printf "${RED}❌ Commit %s toca múltiples raíces (%s). Divide los cambios en commits atómicos.${NC}\n" "$commit" "$(printf "%s " "${!roots[@]}")"
    return 1
  fi
  if (( root_count == 0 )); then
    printf "${GREEN}✅ Commit %s se limita a cambios de documentación/mantenimiento permitido.${NC}\n" "$commit"
    return 0
  fi
  local root_name
  for root_name in "${!roots[@]}"; do
    printf "${GREEN}✅ Commit %s cumple atomicidad (raíz %s).${NC}\n" "$commit" "$root_name"
  done
  return 0
}

verify_pending_commits_atomic() {
  if [[ "${STRICT_ATOMIC}" != "true" ]]; then
    return 0
  fi

  local branch="$1"
  local base_ref="origin/${branch}"

  if ! $GIT_BIN show-ref --verify --quiet "refs/remotes/origin/${branch}"; then
    # rama nueva, revisar únicamente HEAD
    verify_atomic_commit "HEAD"
    return $?
  fi

  local -a commits=()
  while IFS= read -r commit; do
    [[ -n "$commit" ]] && commits+=("$commit")
  done < <($GIT_BIN rev-list "${base_ref}..${branch}")
  local failed=0
  for commit in "${commits[@]}"; do
    if ! verify_atomic_commit "$commit"; then
      failed=1
    fi
  done

  return $failed
}

fetch_origin() {
  $GIT_BIN fetch --prune >/dev/null 2>&1 || true
}

branch_sync_status() {
  local local_ref="$1"
  local remote_ref="$2"
  if ! $GIT_BIN show-ref --verify --quiet "$local_ref"; then
    echo "missing"
    return
  fi
  if ! $GIT_BIN show-ref --verify --quiet "$remote_ref"; then
    echo "no-upstream"
    return
  fi
  local ahead behind
  read -r behind ahead < <($GIT_BIN rev-list --left-right --count "$remote_ref"..."$local_ref")
  echo "$ahead $behind"
}

print_sync_table() {
  local develop_status
  local main_status
  develop_status=$(branch_sync_status refs/heads/develop refs/remotes/origin/develop)
  main_status=$(branch_sync_status refs/heads/main refs/remotes/origin/main)

  printf "${CYAN}📌 Sincronización:${NC}\n"
  printf "   develop ↔ origin/develop: %s\n" "${develop_status}"
  printf "   main    ↔ origin/main:    %s\n" "${main_status}"

  if [[ "$develop_status" != "0 0" ]]; then
    printf "${YELLOW}   → Ejecuta git checkout develop && git pull --rebase origin develop${NC}\n"
  fi
  if [[ "$main_status" != "0 0" ]]; then
    printf "${YELLOW}   → Ejecuta git checkout main && git pull --rebase origin main${NC}\n"
  fi
}

list_stale_local_branches() {
  $GIT_BIN branch --merged develop | sed 's/^..//' | grep -Ev "^(main|develop)$"
}

list_stale_remote_branches() {
  $GIT_BIN branch -r --merged origin/develop | sed 's/^..origin\///' | grep -Ev "^(main|develop)$"
}

print_cleanup_candidates() {
  local locals remotes
  locals=$(list_stale_local_branches || true)
  remotes=$(list_stale_remote_branches || true)
  if [[ -z "$locals" && -z "$remotes" ]]; then
    printf "${GREEN}✅ No hay ramas merged pendientes de limpiar.${NC}\n"
    return
  fi
  printf "${YELLOW}⚠️  Ramas locales merged:${NC}\n"
  if [[ -n "$locals" ]]; then
    printf "   %s\n" "$locals"
  else
    printf "   (ninguna)\n"
  fi
  printf "${YELLOW}⚠️  Ramas remotas merged:${NC}\n"
  if [[ -n "$remotes" ]]; then
    printf "   %s\n" "$remotes"
  else
    printf "   (ninguna)\n"
  fi
}

cleanup_branches() {
  local locals remotes
  locals=$(list_stale_local_branches || true)
  remotes=$(list_stale_remote_branches || true)
  if [[ -z "$locals" && -z "$remotes" ]]; then
    printf "${GREEN}✅ Nada que limpiar.${NC}\n"
    return 0
  fi
  printf "${YELLOW}¿Eliminar automáticamente las ramas merged? [y/N]: ${NC}"
  local answer=""
  read -r answer
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    printf "${YELLOW}Operación cancelada.${NC}\n"
    return 1
  fi
  if [[ -n "$locals" ]]; then
    printf "${CYAN}🧹 Eliminando ramas locales...${NC}\n"
    while read -r branch; do
      [[ -z "$branch" ]] && continue
      $GIT_BIN branch -d "$branch" >/dev/null 2>&1 || true
    done <<<"$locals"
  fi
  if [[ -n "$remotes" ]]; then
    printf "${CYAN}🧹 Eliminando ramas remotas...${NC}\n"
    while read -r branch; do
      [[ -z "$branch" ]] && continue
      $GIT_BIN push origin --delete "$branch" >/dev/null 2>&1 || true
    done <<<"$remotes"
  fi
  printf "${GREEN}✅ Limpieza completada.${NC}\n"
}

current_branch() {
  $GIT_BIN branch --show-current 2>/dev/null || echo ""
}

unpushed_commits() {
  local branch="$1"
  if ! $GIT_BIN show-ref --verify --quiet "refs/remotes/origin/${branch}"; then
    echo "0"
    return
  fi
  $GIT_BIN rev-list --count "origin/${branch}..${branch}"
}

cmd_check() {
  print_section "Hook-System Git Flow Enforcer"
  fetch_origin
  local branch
  branch=$(current_branch)
  printf "${CYAN}📍 Rama actual: %s${NC}\n" "$branch"
  ensure_evidence_fresh || true
  lint_hooks_system || true
  run_mobile_checks || true
  print_sync_table
  print_cleanup_candidates
  verify_atomic_commit "HEAD" || true
  if [[ "$REQUIRE_TEST_RELATIONS" == "true" ]]; then
    verify_related_files_commit "HEAD" || true
  fi
  local pending
  pending=$(unpushed_commits "$branch")
  if [[ "$pending" != "0" ]]; then
    printf "${YELLOW}⚠️  Commits sin subir (${pending}). Ejecuta git push.${NC}\n"
  else
    printf "${GREEN}✅ No hay commits pendientes de push.${NC}\n"
  fi
}

cmd_cycle() {
  if [[ -n $($GIT_BIN status --porcelain) ]]; then
    printf "${RED}❌ Working tree sucia. Commitea o stashea antes de continuar.${NC}\n"
    exit 1
  fi
  cmd_check
  local branch
  branch=$(current_branch)
  if [[ -z "$branch" ]]; then
    printf "${RED}❌ HEAD detached.${NC}\n"
    exit 1
  fi
  verify_atomic_commit "HEAD" || {
    printf "${RED}❌ Corrige la atomicidad del último commit antes de continuar.${NC}\n"
    exit 1
  }
  if $GIT_BIN rev-parse --verify develop >/dev/null 2>&1; then
    printf "${CYAN}🔄 Rebase con develop...${NC}\n"
    $GIT_BIN fetch origin develop >/dev/null 2>&1 || true
    $GIT_BIN rebase origin/develop >/dev/null 2>&1 || {
      printf "${RED}❌ Rebase falló. Ejecuta git rebase --abort y resuelve manualmente.${NC}\n"
      exit 1
    }
    printf "${GREEN}✅ Rebase listo.${NC}\n"
  fi
  lint_hooks_system || exit 1
  run_mobile_checks || exit 1
  ensure_evidence_fresh || exit 1
  verify_pending_commits_atomic "$branch" || {
    printf "${RED}❌ Uno o más commits pendientes no son atómicos. Se detiene el ciclo.${NC}\n"
    exit 1
  }
  if [[ "$REQUIRE_TEST_RELATIONS" == "true" ]]; then
    verify_pending_commits_related "$branch" || {
      printf "${RED}❌ Falta cobertura de pruebas relacionada en commits pendientes. Se detiene el ciclo.${NC}\n"
      exit 1
    }
  else
    verify_related_files_commit "HEAD" || true
  fi
  local pending
  pending=$(unpushed_commits "$branch")
  if [[ "$pending" != "0" ]]; then
    printf "${CYAN}🚀 Subiendo commits (${pending})...${NC}\n"
    $GIT_BIN push --set-upstream origin "$branch"
    printf "${GREEN}✅ Push completado.${NC}\n"
  fi
  print_cleanup_candidates
  printf "${CYAN}¿Deseas ejecutar limpieza ahora? [y/N]: ${NC}"
  local answer
  read -r answer
  if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    cleanup_branches || true
  fi
  printf "${GREEN}✅ Ciclo Git Flow completado.${NC}\n"
  auto_create_pr "$branch"
}

cmd_cleanup() {
  fetch_origin
  cleanup_branches
}

auto_create_pr() {
  local branch="$1"

  if [[ "$branch" == "main" || "$branch" == "develop" ]]; then
    printf "${YELLOW}ℹ️  Rama %s no requiere PR automático.${NC}\n" "$branch"
    return
  fi

  if [[ "${AUTO_CREATE_PR}" != "true" ]]; then
    printf "${YELLOW}ℹ️  AUTO_CREATE_PR deshabilitado (GITFLOW_AUTO_CREATE_PR=false).${NC}\n"
    return
  fi

  if ! command -v gh >/dev/null 2>&1; then
    printf "${YELLOW}⚠️  gh CLI no disponible; crea la PR manualmente.${NC}\n"
    return
  fi

  if gh pr view "$branch" >/dev/null 2>&1; then
    printf "${GREEN}✅ PR existente para %s.${NC}\n" "$branch"
    return
  fi

  local base_ref="origin/${PR_BASE_BRANCH}"
  if ! $GIT_BIN show-ref --verify --quiet "refs/remotes/${base_ref}"; then
    base_ref="${PR_BASE_BRANCH}"
  fi

  local title
  title=$($GIT_BIN log -1 --pretty=%s)
  if [[ -z "$title" ]]; then
    title="feat: ${branch}"
  fi

  local summary
  summary=$($GIT_BIN log --pretty='- %s' "${base_ref}..${branch}" 2>/dev/null || echo "- Updates")

  local body="## Summary
${summary}

## Testing
- [ ] Added tests
- [ ] Not run yet
"

  printf "${CYAN}🛠  Creando PR con gh...${NC}\n"
  if gh pr create --base "${PR_BASE_BRANCH}" --head "${branch}" --title "${title}" --body "${body}"; then
    printf "${GREEN}✅ PR creada para %s → %s.${NC}\n" "$branch" "$PR_BASE_BRANCH"
    if [[ "${AUTO_MERGE_PR}" == "true" ]]; then
      if gh pr merge --auto --squash "$branch"; then
        printf "${GREEN}✅ Auto-merge habilitado para la PR.${NC}\n"
      else
        printf "${YELLOW}ℹ️  No se pudo habilitar auto-merge; revisa permisos/estado.${NC}\n"
      fi
    fi
  else
    printf "${RED}❌ Falló la creación de PR automática.${NC}\n"
  fi
}

usage() {
  cat <<EOF
Uso: gitflow-enforcer.sh [check|cycle|cleanup]
  check   -> Valida evidencia, lint y sincronización
  cycle   -> Ejecuta ciclo completo (rebase, push, limpieza opcional)
  cleanup -> Limpia ramas locales y remotas mergeadas
EOF
}

main() {
  local cmd="${1:-check}"
  case "$cmd" in
    check)
      cmd_check
      ;;
    cycle)
      cmd_cycle
      ;;
    cleanup)
      cmd_cleanup
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"

is_test_file() {
  local file="$1"
  case "$file" in
    *__tests__*|*__tests__/*|*.spec.js|*.spec.ts|*.spec.jsx|*.spec.tsx|*.test.js|*.test.ts|*.test.jsx|*.test.tsx)
      return 0
      ;;
  esac
  return 1
}

requires_related_test() {
  local file="$1"
  if is_test_file "$file"; then
    return 1
  fi

  case "$file" in
    scripts/hooks-system/application/*)
      return 0
      ;;
    scripts/hooks-system/infrastructure/*)
      return 0
      ;;
    scripts/hooks-system/bin/*.js)
      return 0
      ;;
    apps/backend/src/*)
      return 0
      ;;
    apps/admin-dashboard/src/*)
      return 0
      ;;
    apps/mobile-*/src/*)
      return 0
      ;;
  esac
  return 1
}

check_related_files_list() {
  local context="$1"
  shift
  local needs_test=0
  local has_test=0
  local files=()

  for file in "$@"; do
    [[ -z "$file" ]] && continue
    files+=("$file")
    if is_test_file "$file"; then
      has_test=1
      continue
    fi
    if requires_related_test "$file"; then
      needs_test=1
    fi
  done

  if (( needs_test == 0 )); then
    return 0
  fi

  if (( has_test == 0 )); then
    printf "${YELLOW}⚠️  %s: se modificaron archivos de lógica sin pruebas relacionadas.${NC}\n" "$context"
    printf "   Archivos: %s\n" "${files[*]}"
    return 1
  fi

  printf "${GREEN}✅ %s: se encontraron pruebas relacionadas.${NC}\n" "$context"
  return 0
}

verify_related_files_commit() {
  local commit="$1"
  if [[ -z "$commit" ]]; then
    return 0
  fi

  local diff_args=("--diff-filter=ACMRT" "--name-only")
  local files

  if $GIT_BIN rev-parse --quiet --verify "${commit}^" >/dev/null 2>&1; then
    files=$($GIT_BIN diff "${commit}^..${commit}" "${diff_args[@]}")
  else
    files=$($GIT_BIN diff-tree --no-commit-id -r "$commit" "${diff_args[@]}")
  fi

  [[ -z "$files" ]] && return 0
  check_related_files_list "Commit ${commit}" $files
}

verify_pending_commits_related() {
  if [[ "$REQUIRE_TEST_RELATIONS" != "true" ]]; then
    return 0
  fi

  local branch="$1"
  local base_ref="origin/${branch}"

  if ! $GIT_BIN show-ref --verify --quiet "refs/remotes/origin/${branch}"; then
    return verify_related_files_commit "HEAD"
  fi

  mapfile -t commits < <($GIT_BIN rev-list "${base_ref}..${branch}")
  local failed=0
  local commit
  for commit in "${commits[@]}"; do
    if ! verify_related_files_commit "$commit"; then
      failed=1
    fi
  done
  return $failed
}
