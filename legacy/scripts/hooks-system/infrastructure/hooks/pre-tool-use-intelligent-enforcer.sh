#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
MAX_VIOLATIONS=0

read_hook_input() {
    local raw=""
    while IFS= read -r line; do
        raw+="$line"
    done

    if [[ -z "$raw" ]]; then
        echo "{}"
        return
    fi

    echo "$raw"
}

detect_phase_mismatch() {
    local current_branch
    current_branch=$(git branch --show-current 2>/dev/null || echo "")

    if [[ -z "$current_branch" ]]; then
        return 0
    fi

    local branch_phase=""
    if [[ "$current_branch" =~ phase([0-9]+) ]]; then
        branch_phase="${BASH_REMATCH[1]}"
    else
        return 0
    fi

    local violations=()
    local untracked_files
    untracked_files=$(git status --porcelain | grep "^??" | cut -c4- || echo "")

    while IFS= read -r file; do
        [[ -z "$file" ]] && continue

        if [[ "$file" =~ phase([0-9]+) ]]; then
            local file_phase="${BASH_REMATCH[1]}"
            if [[ "$file_phase" != "$branch_phase" ]]; then
                violations+=("$file (fase $file_phase en rama fase $branch_phase)")
            fi
        fi
    done <<< "$untracked_files"

    if [[ ${#violations[@]} -gt 0 ]]; then
        cat >&2 <<EOF
⚠️ BLOCKED - Phase Mismatch Detected

📋 VIOLATIONS:
$(printf '%s\n' "${violations[@]}")

📋 REQUIRED ACTION:
1. Remove files from wrong phase branch
2. Move files to correct phase branch
3. Then retry this edit

Reason: Files from phase $file_phase detected in phase $branch_phase branch
Branch: $current_branch

💡 This ensures phase isolation and prevents mixing work from different phases
EOF
        return 1
    fi

    return 0
}

detect_missing_tests() {
    local tool_input="$1"
    local file_path
    file_path=$(echo "$tool_input" | jq -r '.tool_input.file_path // .tool_input.target_file // ""' 2>/dev/null || echo "")

    if [[ -z "$file_path" ]]; then
        return 0
    fi

    if [[ ! "$file_path" =~ \.(ts|tsx|swift|kt)$ ]]; then
        return 0
    fi

    local test_file=""
    if [[ "$file_path" =~ \.(ts|tsx)$ ]]; then
        test_file="${file_path%.*}.test.${file_path##*.}"
        if [[ ! -f "$PROJECT_DIR/$test_file" ]]; then
            test_file="${file_path%.*}.spec.${file_path##*.}"
        fi
    elif [[ "$file_path" =~ \.swift$ ]]; then
        test_file="${file_path%.*}Tests.swift"
    elif [[ "$file_path" =~ \.kt$ ]]; then
        test_file="${file_path%.*}Test.kt"
    fi

    if [[ -n "$test_file" ]] && [[ ! -f "$PROJECT_DIR/$test_file" ]]; then
        cat >&2 <<EOF
⚠️ BLOCKED - Missing Tests Detected

📋 REQUIRED ACTION:
1. Create test file: $test_file
2. Write tests for functionality
3. Ensure tests pass
4. Then retry this edit

Reason: Implementation file modified without corresponding test file
File: $file_path
Expected test: $test_file

💡 TDD workflow requires tests before implementation
EOF
        return 1
    fi

    return 0
}

detect_non_english_text() {
    local tool_input="$1"
    local file_path
    file_path=$(echo "$tool_input" | jq -r '.file_path // .target_file // ""' 2>/dev/null || echo "")
    local file_content
    file_content=$(echo "$tool_input" | jq -r '.contents // .new_string // ""' 2>/dev/null || echo "")

    if [[ -z "$file_path" ]] && [[ -z "$file_content" ]]; then
        return 0
    fi

    if [[ -z "$file_content" ]] && [[ -n "$file_path" ]] && [[ -f "$PROJECT_DIR/$file_path" ]]; then
        file_content=$(cat "$PROJECT_DIR/$file_path" 2>/dev/null || echo "")
    fi

    if [[ -z "$file_content" ]]; then
        return 0
    fi

    local non_english_patterns=(
        "[áéíóúñüÁÉÍÓÚÑÜ]"
        "[àèìòùÀÈÌÒÙ]"
        "[äëïöüÄËÏÖÜ]"
        "[çÇ]"
        "[ß]"
        "[åæøÅÆØ]"
        "[čćđšžČĆĐŠŽ]"
        "[αβγδεζηθικλμνξοπρστυφχψω]"
        "[абвгдеёжзийклмнопрстуфхцчшщъыьэюя]"
        "[あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん]"
        "[的了一是在不人有我他这为之大来以个中上]"
    )

    local english_indicators=(
        "should"
        "must"
        "will"
        "can"
        "the"
        "and"
        "or"
        "not"
        "is"
        "are"
        "was"
        "were"
        "has"
        "have"
        "had"
        "does"
        "do"
        "did"
        "test"
        "describe"
        "expect"
        "assert"
        "function"
        "class"
        "const"
        "let"
        "var"
        "return"
        "if"
        "else"
        "for"
        "while"
        "async"
        "await"
    )

    local violations=()
    local line_num=0
    local has_non_english=false

    while IFS= read -r line; do
        ((line_num++))

        local is_test_or_string=false
        if [[ "$line" =~ (describe|test|it|expect|assert|describe\.skip|test\.skip|it\.skip) ]]; then
            is_test_or_string=true
        elif [[ "$line" =~ ^[[:space:]]*["\'] ]]; then
            is_test_or_string=true
        fi

        if [[ "$is_test_or_string" == "true" ]]; then
            local line_lower=$(echo "$line" | tr '[:upper:]' '[:lower:]')
            local has_english_indicator=false

            for indicator in "${english_indicators[@]}"; do
                if echo "$line_lower" | grep -qE "\b${indicator}\b"; then
                    has_english_indicator=true
                    break
                fi
            done

            if [[ "$has_english_indicator" == "false" ]]; then
                for pattern in "${non_english_patterns[@]}"; do
                    if echo "$line" | grep -qE "$pattern"; then
                        has_non_english=true
                        if [[ "$line" =~ (describe|test|it|expect|assert) ]]; then
                            violations+=("Line $line_num: Non-English text in test/assertion: ${line:0:60}...")
                        elif [[ "$line" =~ ^[[:space:]]*["\'] ]]; then
                            violations+=("Line $line_num: Non-English text in string literal: ${line:0:60}...")
                        fi
                        break
                    fi
                done
            fi
        fi
    done <<< "$file_content"

    if [[ ${#violations[@]} -gt 0 ]]; then
        cat >&2 <<EOF
⚠️ BLOCKED - Non-English Text Detected in Code

📋 VIOLATION:
  - Rule: All code must be in English (strings, test descriptions, etc.)
  - File: ${file_path:-unknown}
  - Violations found: ${#violations[@]}

📋 VIOLATIONS:
$(printf '%s\n' "${violations[@]}")

📋 REQUIRED ACTION:
1. Translate all non-English text to English
2. Test descriptions must be in English
3. String literals must be in English (use i18n for UI)
4. Then retry this edit

Reason: Code must be in English. Only UI strings can be translated via i18n.
File: ${file_path:-unknown}

💡 Rule: "Nombres autodescriptivos - Todo en inglés (usar i18n para UI)"
EOF
        return 1
    fi

    return 0
}

detect_compilation_errors() {
    local tool_input="$1"
    local file_path
    file_path=$(echo "$tool_input" | jq -r '.tool_input.file_path // .tool_input.target_file // ""' 2>/dev/null || echo "")

    if [[ -z "$file_path" ]]; then
        return 0
    fi

    if [[ "$file_path" =~ \.(ts|tsx)$ ]] && [[ -f "$PROJECT_DIR/package.json" ]]; then
        if ! npm run build --if-present >/dev/null 2>&1; then
            cat >&2 <<EOF
⚠️ BLOCKED - Compilation Errors Detected

📋 REQUIRED ACTION:
1. Fix compilation errors
2. Run: npm run build
3. Ensure build succeeds
4. Then retry this edit

Reason: Project does not compile after changes
File: $file_path

💡 Code must compile before committing
EOF
            return 1
        fi
    fi

    return 0
}

get_current_branch() {
    git branch --show-current 2>/dev/null || echo ""
}

detect_work_phase_mismatch() {
    local current_branch
    current_branch=$(get_current_branch)

    if [[ -z "$current_branch" ]]; then
        return 0
    fi

    local hook_input
    hook_input=$(read_hook_input 2>/dev/null || echo "{}")
    local prompt
    prompt=$(echo "$hook_input" | jq -r '.prompt // ""' 2>/dev/null || echo "")

    local tool_input
    tool_input=$(echo "$hook_input" | jq -c '.tool_input // {}' 2>/dev/null || echo "{}")
    local file_path
    file_path=$(echo "$tool_input" | jq -r '.file_path // .target_file // ""' 2>/dev/null || echo "")

    local prompt_lower=""
    if [[ -n "$prompt" ]]; then
        prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')
    fi

    local work_phase=""

    if [[ -n "$prompt_lower" ]]; then
        if echo "$prompt_lower" | grep -qE "(fase\s*2|phase\s*2|skills\s*multiplataforma|adaptar.*guidelines|configurar.*enforcement|skill-rules\.json|SKILL\.md)"; then
            work_phase="2"
        elif echo "$prompt_lower" | grep -qE "(fase\s*3|phase\s*3|dev\s*docs|comandos|/dev-docs)"; then
            work_phase="3"
        elif echo "$prompt_lower" | grep -qE "(fase\s*1|phase\s*1|autoactivaci[oó]n|pre.*tool.*use|evidence.*validator)"; then
            work_phase="1"
        elif echo "$prompt_lower" | grep -qE "(fase\s*0|phase\s*0|preparaci[oó]n|inventario)"; then
            work_phase="0"
        fi
    fi

    if [[ -z "$work_phase" ]] && [[ -n "$file_path" ]]; then
        if echo "$file_path" | grep -qE "(\.ast-intelligence/skills/|skill-rules\.json|SKILL\.md|skills/README\.md)"; then
            work_phase="2"
        elif echo "$file_path" | grep -qE "(dev-docs|/dev-docs|dev/active)"; then
            work_phase="3"
        elif echo "$file_path" | grep -qE "(pre-tool-use|evidence-validator|intelligent-enforcer)"; then
            work_phase="1"
        fi
    fi

    if [[ -z "$work_phase" ]]; then
        local recent_commits
        recent_commits=$(git log --oneline -5 --format="%s" 2>/dev/null || echo "")
        if echo "$recent_commits" | grep -qiE "(skill|guidelines|multiplataforma)"; then
            work_phase="2"
        elif echo "$recent_commits" | grep -qiE "(dev-docs|comandos)"; then
            work_phase="3"
        elif echo "$recent_commits" | grep -qiE "(pre-tool-use|evidence|enforcer)"; then
            work_phase="1"
        fi
    fi

    if [[ -z "$work_phase" ]]; then
        return 0
    fi

    local branch_phase=""
    if [[ "$current_branch" =~ phase([0-9]+) ]]; then
        branch_phase="${BASH_REMATCH[1]}"
    elif [[ "$current_branch" =~ pumuki-phase([0-9]+) ]]; then
        branch_phase="${BASH_REMATCH[1]}"
    fi

    if [[ "$current_branch" == "develop" ]] || [[ "$current_branch" == "main" ]]; then
        cat >&2 <<EOF
⚠️ BLOCKED - Phase Work Detected on Main Branch

📋 VIOLATION:
  - Current branch: $current_branch
  - Work context: phase $work_phase
  - Detected from: ${prompt:+prompt} ${file_path:+file: $file_path} ${recent_commits:+recent commits}

📋 REQUIRED ACTION:
1. Create phase branch: git checkout -b feature/pumuki-phase$work_phase
2. Or switch if exists: git checkout feature/pumuki-phase$work_phase
3. Then retry this action

Reason: Phase work must be done in dedicated feature branches, not in develop/main
Branch: $current_branch
Work phase: $work_phase

💡 Git Flow: Each phase must be completed, tested, and merged before starting next phase
EOF
        return 1
    fi

    if [[ -n "$branch_phase" ]] && [[ "$work_phase" != "$branch_phase" ]]; then
        cat >&2 <<EOF
⚠️ BLOCKED - Phase Work Mismatch Detected

📋 VIOLATION:
  - Current branch: $current_branch (phase $branch_phase)
  - Work context: phase $work_phase
  - Detected from: ${prompt:+prompt} ${file_path:+file: $file_path} ${recent_commits:+recent commits}

📋 REQUIRED ACTION:
1. Complete current phase (commit, test, compile, merge to develop)
2. Delete current branch: git branch -d $current_branch
3. Switch to correct branch: git checkout feature/pumuki-phase$work_phase
4. Or create it: git checkout -b feature/pumuki-phase$work_phase
5. Then retry this action

Reason: Working on phase $work_phase from phase $branch_phase branch violates Git Flow
Branch: $current_branch

💡 Git Flow: Complete phase $branch_phase first (commit, test, compile, merge), then start phase $work_phase
EOF
        return 1
    fi

    return 0
}

detect_no_verify_bypass() {
    local hook_input
    hook_input=$(read_hook_input 2>/dev/null || echo "{}")
    local prompt
    prompt=$(echo "$hook_input" | jq -r '.prompt // ""' 2>/dev/null || echo "")

    if [[ -z "$prompt" ]]; then
        return 0
    fi

    if echo "$prompt" | grep -qE "(git\s+.*--no-verify|--no-verify|skip.*hook|bypass.*hook)"; then
        cat >&2 <<EOF
⚠️ BLOCKED - Unauthorized Hook Bypass Detected

📋 VIOLATION:
  - Detected: --no-verify flag or hook bypass attempt
  - Context: Git commit/hook bypass without explicit user permission

📋 REQUIRED ACTION:
1. Remove --no-verify flag from command
2. Fix underlying issue causing hook failure
3. If bypass is truly necessary, explicitly request user permission first
4. Then retry this action

Reason: --no-verify bypasses critical safety checks (pre-commit hooks, linting, tests)
This violates architectural rules and Git Flow compliance

💡 Rule: Always fix the root cause, never bypass hooks without explicit permission
EOF
        return 1
    fi

    return 0
}

hook_input=$(read_hook_input)
tool_name=$(echo "$hook_input" | jq -r '.tool_name // ""' 2>/dev/null || echo "")

if [[ "$tool_name" == "write" ]] || [[ "$tool_name" == "edit" ]] || [[ "$tool_name" == "multi_edit" ]]; then
    violations=0

    if ! detect_phase_mismatch; then
        violations=$((violations + 1))
    fi

    if ! detect_work_phase_mismatch; then
        violations=$((violations + 1))
    fi

    if ! detect_no_verify_bypass; then
        violations=$((violations + 1))
    fi
    tool_input=$(echo "$hook_input" | jq -c '.tool_input // {}' 2>/dev/null || echo "{}")

    if ! detect_non_english_text "$tool_input"; then
        violations=$((violations + 1))
    fi

    if ! detect_missing_tests "$tool_input"; then
        violations=$((violations + 1))
    fi

    if ! detect_compilation_errors "$tool_input"; then
        violations=$((violations + 1))
    fi

    if [[ $violations -gt $MAX_VIOLATIONS ]]; then
        exit 2
    fi
fi

exit 0
