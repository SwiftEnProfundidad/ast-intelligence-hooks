import os
import sys

from conventional_pre_commit import hook


def main() -> int:
    commit_msg_file = os.environ.get("PRE_COMMIT_COMMIT_MSG_FILE")

    if not commit_msg_file and len(sys.argv) > 1:
        commit_msg_file = sys.argv[1]

    if not commit_msg_file:
        print("conventional-commit-hook: missing commit message file", file=sys.stderr)
        return 1

    return hook.main([commit_msg_file])


if __name__ == "__main__":
    raise SystemExit(main())
