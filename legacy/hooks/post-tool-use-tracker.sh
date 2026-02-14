#!/bin/bash
set -e

tool_info=$(cat)

tool_name=$(echo "$tool_info" | jq -r '.tool_name // empty')
file_path=$(echo "$tool_info" | jq -r '.tool_input.file_path // .tool_input.target_file // empty')
session_id=$(echo "$tool_info" | jq -r '.session_id // empty')

if [[ ! "$tool_name" =~ ^(Edit|MultiEdit|Write)$ ]] || [[ -z "$file_path" ]]; then
    exit 0
fi

if [[ "$file_path" =~ \.(md|markdown)$ ]]; then
    exit 0
fi

cache_dir="$CLAUDE_PROJECT_DIR/.ast-intelligence/tsc-cache/${session_id:-default}"
mkdir -p "$cache_dir"

detect_repo() {
    local file="$1"
    local project_root="$CLAUDE_PROJECT_DIR"

    local relative_path="${file#$project_root/}"

    local repo=$(echo "$relative_path" | cut -d'/' -f1)

    case "$repo" in
        apps)
            local app=$(echo "$relative_path" | cut -d'/' -f2)
            case "$app" in
                backend)
                    echo "apps/backend"
                    ;;
                admin-dashboard|web-app)
                    echo "apps/$app"
                    ;;
                ios)
                    echo "apps/ios"
                    ;;
                android)
                    echo "apps/android"
                    ;;
                *)
                    echo "apps/$app"
                    ;;
            esac
            ;;
        frontend|client|web|app|ui)
            echo "$repo"
            ;;
        backend|server|api|src|services)
            echo "$repo"
            ;;
        database|prisma|migrations)
            echo "$repo"
            ;;
        packages)
            local package=$(echo "$relative_path" | cut -d'/' -f2)
            if [[ -n "$package" ]]; then
                echo "packages/$package"
            else
                echo "$repo"
            fi
            ;;
        *)
            if [[ ! "$relative_path" =~ / ]]; then
                echo "root"
            else
                echo "unknown"
            fi
            ;;
    esac
}

repo=$(detect_repo "$file_path")

if [[ "$repo" == "unknown" ]] || [[ -z "$repo" ]]; then
    exit 0
fi

echo "$(date +%s):$file_path:$repo" >> "$cache_dir/edited-files.log"

if ! grep -q "^$repo$" "$cache_dir/affected-repos.txt" 2>/dev/null; then
    echo "$repo" >> "$cache_dir/affected-repos.txt"
fi

exit 0
