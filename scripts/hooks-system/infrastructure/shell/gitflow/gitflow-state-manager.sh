#!/bin/bash

# Git Flow State Manager - Enforce strict 16-step workflow
# NO STEPS CAN BE SKIPPED

STATE_FILE=".git/gitflow-state.json"

# Initialize state if doesn't exist
init_state() {
    if [ ! -f "$STATE_FILE" ]; then
        cat > "$STATE_FILE" << 'EOF'
{
  "current_step": 1,
  "current_branch": "develop",
  "feature_branch": null,
  "pr_number": null,
  "sprint_features": [],
  "last_action": "init",
  "timestamp": ""
}
EOF
    fi
}

# Get current state
get_state() {
    init_state
    cat "$STATE_FILE"
}

# Update state
set_state() {
    local step=$1
    local branch=$2
    local feature_branch=$3
    local pr=$4
    local action=$5
    
    # Get existing sprint_features or default to empty array
    local sprint_features=$(jq -r '.sprint_features' "$STATE_FILE" 2>/dev/null || echo "[]")
    
    # Use jq to generate valid JSON (handles null/string escaping correctly)
    jq -n \
      --arg step "$step" \
      --arg branch "$branch" \
      --arg feature_branch "$feature_branch" \
      --arg pr "$pr" \
      --argjson sprint_features "$sprint_features" \
      --arg action "$action" \
      --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      '{
        "current_step": ($step | tonumber),
        "current_branch": $branch,
        "feature_branch": (if $feature_branch == "null" then null else $feature_branch end),
        "pr_number": (if $pr == "null" then null else $pr end),
        "sprint_features": $sprint_features,
        "last_action": $action,
        "timestamp": $timestamp
      }' > "$STATE_FILE"
}

# Validate action is allowed
validate_action() {
    local action=$1
    local current_step=$(jq -r '.current_step' "$STATE_FILE")
    local current_branch=$(git branch --show-current)
    
    case "$action" in
        "checkout_develop")
            if [ "$current_step" -ne 1 ] && [ "$current_step" -ne 9 ] && [ "$current_step" -ne 16 ]; then
                echo "❌ BLOCKED: Must be at step 1, 9, or 16 to checkout develop"
                echo "   Current step: $current_step"
                return 1
            fi
            ;;
        "create_branch")
            if [ "$current_step" -ne 2 ]; then
                echo "❌ BLOCKED: Must complete step 1 (checkout develop) first"
                echo "   Current step: $current_step"
                return 1
            fi
            if [ "$current_branch" != "develop" ]; then
                echo "❌ BLOCKED: Must be on develop to create feature branch"
                return 1
            fi
            ;;
        "make_changes")
            if [ "$current_step" -ne 3 ]; then
                echo "❌ BLOCKED: Must create branch first (step 2)"
                return 1
            fi
            ;;
        "commit")
            if [ "$current_step" -ne 4 ]; then
                echo "❌ BLOCKED: Must be at step 4 to commit"
                return 1
            fi
            ;;
        "push_branch")
            if [ "$current_step" -ne 5 ]; then
                echo "❌ BLOCKED: Must commit first (step 4)"
                return 1
            fi
            ;;
        "create_pr_develop")
            if [ "$current_step" -ne 6 ]; then
                echo "❌ BLOCKED: Must push branch first (step 5)"
                return 1
            fi
            ;;
        "merge_pr_develop")
            if [ "$current_step" -ne 7 ]; then
                echo "❌ BLOCKED: Must create PR first (step 6)"
                return 1
            fi
            ;;
        "delete_branch")
            if [ "$current_step" -ne 8 ]; then
                echo "❌ BLOCKED: Must merge PR first (step 7)"
                return 1
            fi
            ;;
        "pull_develop")
            if [ "$current_step" -ne 10 ]; then
                echo "❌ BLOCKED: Must be at step 10 after checkout develop"
                return 1
            fi
            ;;
        "create_pr_main")
            if [ "$current_step" -ne 12 ]; then
                echo "❌ BLOCKED: Must complete all features and be at step 12"
                echo "   Sprint not complete yet"
                return 1
            fi
            ;;
        "merge_to_main")
            if [ "$current_step" -ne 13 ]; then
                echo "❌ BLOCKED: Must create PR to main first (step 12)"
                return 1
            fi
            ;;
        "create_tag")
            if [ "$current_step" -ne 14 ]; then
                echo "❌ BLOCKED: Must merge to main first (step 13)"
                return 1
            fi
            ;;
        "push_tag")
            if [ "$current_step" -ne 15 ]; then
                echo "❌ BLOCKED: Must create tag first (step 14)"
                return 1
            fi
            ;;
    esac
    
    return 0
}

# Advance to next step
advance_step() {
    local action=$1
    local current_step=$(jq -r '.current_step' "$STATE_FILE")
    local next_step=$((current_step + 1))
    
    # Special cases for loop
    if [ "$current_step" -eq 10 ]; then
        next_step=2  # Repeat 2-10 for each task
    elif [ "$current_step" -eq 16 ]; then
        next_step=2  # Start new sprint
    fi
    
    local current_branch=$(git branch --show-current)
    local feature_branch=$(jq -r '.feature_branch' "$STATE_FILE")
    local pr=$(jq -r '.pr_number' "$STATE_FILE")
    
    set_state "$next_step" "$current_branch" "$feature_branch" "$pr" "$action"
    
    echo "✅ Advanced to step $next_step"
}

# Show current workflow status
show_status() {
    init_state
    local current_step=$(jq -r '.current_step' "$STATE_FILE")
    local current_branch=$(jq -r '.current_branch' "$STATE_FILE")
    local feature_branch=$(jq -r '.feature_branch' "$STATE_FILE")
    local last_action=$(jq -r '.last_action' "$STATE_FILE")
    
    echo "📊 Git Flow State:"
    echo "   Current Step: $current_step/16"
    echo "   Branch: $current_branch"
    echo "   Feature: ${feature_branch:-none}"
    echo "   Last Action: $last_action"
    echo ""
    echo "Next steps:"
    case "$current_step" in
        1) echo "   2. Create branch (fix/...)" ;;
        2) echo "   3. Make changes" ;;
        3) echo "   4. Commit" ;;
        4) echo "   5. Push branch" ;;
        5) echo "   6. Create PR to develop" ;;
        6) echo "   7. Merge PR to develop" ;;
        7) echo "   8. Delete branch" ;;
        8) echo "   9. Checkout develop" ;;
        9) echo "   10. Pull latest develop" ;;
        10) echo "   11. Repeat 2-10 for each task OR go to step 12 for release" ;;
        12) echo "   13. Merge to main" ;;
        13) echo "   14. Create tag" ;;
        14) echo "   15. Push tag" ;;
        15) echo "   16. Checkout develop" ;;
        16) echo "   Ready for new sprint!" ;;
    esac
}

# Main command dispatcher
case "${1:-}" in
    "validate")
        validate_action "$2"
        ;;
    "advance")
        advance_step "$2"
        ;;
    "status")
        show_status
        ;;
    "reset")
        rm -f "$STATE_FILE"
        init_state
        echo "✅ State reset to step 1"
        ;;
    *)
        echo "Usage: $0 {validate|advance|status|reset} [action]"
        exit 1
        ;;
esac

