#!/bin/bash
set -euo pipefail

project_root="$(git rev-parse --show-toplevel)"
# Use env var or fallback to ../ast-intelligence-hooks (portable)
library_root="${LIB_AST_INTELLIGENCE_HOOKS:-$(dirname "$project_root")/ast-intelligence-hooks}"

repo_file="${project_root}/scripts/hooks-system/application/services/AutonomousOrchestrator.js"
library_file="${library_root}/application/services/AutonomousOrchestrator.js"

if [[ ! -f "${repo_file}" ]]; then
  echo "Repositorio no tiene AutonomousOrchestrator.js en ${repo_file}" >&2
  exit 1
fi

if [[ -f "${library_file}" ]]; then
  repo_mtime=$(stat -f %m "${repo_file}")
  library_mtime=$(stat -f %m "${library_file}")

  if (( library_mtime > repo_mtime )); then
    cp "${library_file}" "${repo_file}"
    echo "AutonomousOrchestrator.js actualizado desde la librería (${library_root})"
  else
    cp "${repo_file}" "${library_file}"
    echo "AutonomousOrchestrator.js actualizado en la librería (${library_root})"
  fi
else
  echo "⚠️  Librería no encontrada en ${library_root}. Usando versión del proyecto y creando copia opcional."
  mkdir -p "$(dirname "${library_file}")"
  cp "${repo_file}" "${library_file}"
  echo "AutonomousOrchestrator.js copiado al nuevo directorio de librería."
fi
