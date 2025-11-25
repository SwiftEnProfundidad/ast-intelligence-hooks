#!/usr/bin/env bash
# Utility Functions - Infrastructure Layer
# Helper functions for file operations, progress bars, etc.

source "$(dirname "${BASH_SOURCE[0]}")/constants.sh"

progress_bar() {
  local current=$1 total=$2
  local width=40
  local percentage=$(( current * 100 / total ))
  local filled=$(( current * width / total ))
  local empty=$(( width - filled ))
  local fill_str="" empty_str=""
  
  if (( filled > 0 )); then
    printf -v fill_str '%*s' "$filled" ''
    fill_str=${fill_str// /█}
  fi
  if (( empty > 0 )); then
    printf -v empty_str '%*s' "$empty" ''
    empty_str=${empty_str// /░}
  fi
  
  printf "%b[%s%s] %3d%% (%d/%d)%b\n" "$GREEN" "$fill_str" "$empty_str" "$percentage" "$current" "$total" "$NC"
}

progress_bar_simple() {
  local current=$1 total=$2 label="$3"
  local percentage=$(( current * 100 / total ))
  local width=30
  local filled=$(( current * width / total ))
  local empty=$(( width - filled ))
  local fill_str="" empty_str=""
  
  if (( filled > 0 )); then
    printf -v fill_str '%*s' "$filled" ''
    fill_str=${fill_str// /█}
  fi
  if (( empty > 0 )); then
    printf -v empty_str '%*s' "$empty" ''
    empty_str=${empty_str// /░}
  fi
  
  printf "%b%s%b [%s%s] %3d%%%b\n" "$YELLOW" "$label" "$NC" "$fill_str" "$empty_str" "$percentage" "$NC"
}

