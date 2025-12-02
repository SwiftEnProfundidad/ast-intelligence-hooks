#!/usr/bin/env bash
# =============================================================================
# Git Flow Shell Integration
# =============================================================================
# Purpose: Integrate Git Flow validation into user's shell (zsh/bash)
# Author: AI Assistant + Carlos Merlos
# Version: 1.0.0
# =============================================================================

cat << 'EOF'

# =============================================================================
# Git Flow Enforcer - Shell Integration
# =============================================================================
# Add this to your ~/.zshrc or ~/.bashrc
# =============================================================================

# Git Flow Auto-Check Function
function check_gitflow_silent() {
  local project_root
  project_root=$(git rev-parse --show-toplevel 2>/dev/null)

  if [[ -n "$project_root" ]] && [[ -f "$project_root/scripts/hooks-system/bin/cli.js" ]]; then
    # Run if hook-system exists in project
    if [[ -f "$project_root/scripts/hooks-system/bin/cli.js" ]]; then
      node "$project_root/scripts/hooks-system/bin/cli.js" gitflow check 2>/dev/null
    fi
  fi
}

# Override cd to auto-check Git Flow when entering project
function cd() {
  builtin cd "$@"
  check_gitflow_silent
}

# Check on new shell session (if already in project directory)
check_gitflow_silent

# =============================================================================
# Optional: Add Git Flow status to prompt (PS1/PROMPT)
# =============================================================================
# Uncomment and customize for your shell

# For ZSH (Oh-My-Zsh compatible):
# function gitflow_prompt() {
#   local project_root
#   project_root=$(git rev-parse --show-toplevel 2>/dev/null)
#
#   if [[ -n "$project_root" ]] && [[ -f "$project_root/scripts/hooks-system/bin/cli.js" ]]; then
#     local current_branch
#     current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "")
#
#     if [[ "$current_branch" =~ ^(fix|feature)/ ]]; then
#       echo " %F{yellow}[GF: incomplete]%f"
#     elif [[ "$current_branch" == "develop" ]]; then
#       echo " %F{green}[GF: ready]%f"
#     fi
#   fi
# }
#
# PROMPT='%F{cyan}%~%f$(git_prompt_info)$(gitflow_prompt) %# '

EOF
