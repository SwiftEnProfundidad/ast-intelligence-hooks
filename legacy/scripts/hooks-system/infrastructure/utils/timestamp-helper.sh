#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Timestamp Helper - Consistent ISO 8601 timestamps
# ═══════════════════════════════════════════════════════════════
# Usage:
#   source timestamp-helper.sh
#   NOW=$(get_current_timestamp)
#   AGE=$(get_timestamp_age "$EVIDENCE_TS")
# ═══════════════════════════════════════════════════════════════

# Get current timestamp in ISO 8601 with milliseconds
# Returns: 2025-11-06T10:45:23.123Z
get_current_timestamp() {
  local raw
  raw=$(date +"%Y-%m-%dT%H:%M:%S.000%z")
  echo "$raw" | sed -E 's/([+-][0-9]{2})([0-9]{2})$/\1:\2/'
}

# Get current timestamp in epoch seconds
get_current_epoch() {
  date +%s
}

# Convert ISO 8601 timestamp to epoch
# Args: $1 = ISO 8601 timestamp (with or without milliseconds)
# Returns: epoch seconds or "0" if invalid
iso_to_epoch() {
  local timestamp="$1"

  # Strip milliseconds if present (2025-11-06T10:45:23.123Z → 2025-11-06T10:45:23Z)
  local clean_ts
  clean_ts=$(echo "$timestamp" | sed -E 's/\.[0-9]+Z$/Z/')

  if echo "$clean_ts" | grep -qE 'Z$'; then
    TZ=UTC date -j -f "%Y-%m-%dT%H:%M:%SZ" "$clean_ts" +%s 2>/dev/null || echo "0"
    return 0
  fi

  clean_ts=$(echo "$timestamp" | sed -E 's/\.[0-9]+([+-][0-9]{2}):([0-9]{2})$/\1\2/' | sed -E 's/([+-][0-9]{2}):([0-9]{2})$/\1\2/')
  date -j -f "%Y-%m-%dT%H:%M:%S%z" "$clean_ts" +%s 2>/dev/null || echo "0"
}

# Get age of timestamp in seconds
# Args: $1 = ISO 8601 timestamp
# Returns: age in seconds or "999999" if invalid
get_timestamp_age() {
  local timestamp="$1"

  local ts_epoch=$(iso_to_epoch "$timestamp")
  local now_epoch=$(get_current_epoch)

  if [[ "$ts_epoch" == "0" ]]; then
    echo "999999"  # Invalid timestamp = very old
    return 1
  fi

  echo $((now_epoch - ts_epoch))
}

# Check if timestamp is fresh (less than N seconds old)
# Args: $1 = ISO 8601 timestamp, $2 = max age in seconds (default 180)
# Returns: 0 if fresh, 1 if stale
is_timestamp_fresh() {
  local timestamp="$1"
  local max_age="${2:-180}"  # Default 3 minutes

  local age=$(get_timestamp_age "$timestamp")

  [[ "$age" -le "$max_age" ]]
}

# Update .AI_EVIDENCE.json timestamp
# Args: none (updates in-place)
update_evidence_timestamp() {
  local evidence_file="${1:-.AI_EVIDENCE.json}"

  if [[ ! -f "$evidence_file" ]]; then
    echo "❌ Evidence file not found: $evidence_file"
    return 1
  fi

  local new_timestamp=$(get_current_timestamp)

  # Use jq to update timestamp field
  local temp_file="${evidence_file}.tmp"
  jq --arg ts "$new_timestamp" '.timestamp = $ts' "$evidence_file" > "$temp_file" && mv "$temp_file" "$evidence_file"

  echo "✅ Evidence timestamp updated: $new_timestamp"
}

# Format age for human-readable display
# Args: $1 = age in seconds
# Returns: "2m 30s" or "1h 15m" or "2d 3h"
format_age() {
  local age="$1"

  if [[ $age -lt 60 ]]; then
    echo "${age}s"
  elif [[ $age -lt 3600 ]]; then
    local minutes=$((age / 60))
    local seconds=$((age % 60))
    echo "${minutes}m ${seconds}s"
  elif [[ $age -lt 86400 ]]; then
    local hours=$((age / 3600))
    local minutes=$(((age % 3600) / 60))
    echo "${hours}h ${minutes}m"
  else
    local days=$((age / 86400))
    local hours=$(((age % 86400) / 3600))
    echo "${days}d ${hours}h"
  fi
}

# 🐈 Pumuki approved timestamps 💚
