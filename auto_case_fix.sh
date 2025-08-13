# Save as: auto_case_fix.sh
# Usage: bash auto_case_fix.sh
#!/usr/bin/env bash
set -euo pipefail

# Remember current ignorecase (may be empty if unset)
orig_ignorecase="$(git config --local core.ignorecase || true)"

# Temporarily set to true (default on macOS); script uses two-step renames so this is safe
git config --local core.ignorecase true

changes=0
declare -a fixed

# Ensure deterministic path output
export LC_ALL=C

# Iterate all tracked files
while IFS= read -r tracked; do
  # Skip if Git thinks it's a submodule or path doesn't exist
  [[ -e "$tracked" ]] || continue

  dir="$(dirname "$tracked")"
  base="$(basename "$tracked")"

  # Find the actual file on disk (case-insensitive match; output preserves real casing)
  fs_path="$(find "$dir" -maxdepth 1 -type f -iname "$base" -print -quit 2>/dev/null || true)"
  # If a directory, also try dirs (rare but helpful)
  if [[ -z "${fs_path:-}" ]]; then
    fs_path="$(find "$dir" -maxdepth 1 -type d -iname "$base" -print -quit 2>/dev/null || true)"
  fi
  [[ -z "${fs_path:-}" ]] && continue

  # If casing differs, fix via two-step rename
  if [[ "$fs_path" != "$tracked" ]]; then
    tmp="$dir/.casefix_tmp_$$_$base"
    echo "Fixing: '$tracked'  ->  '$fs_path'"

    # Step 1: move to a guaranteed different temp name
    git mv "$tracked" "$tmp"
    # Step 2: move to the desired casing
    git mv "$tmp" "$fs_path"

    fixed+=("$tracked -> $fs_path")
    changes=$((changes + 1))
  fi
done < <(git ls-files)

if [[ "$changes" -gt 0 ]]; then
  git commit -m "Normalize filename/directory capitalization on macOS (${changes} path(s))"
  echo
  echo "Committed ${changes} case-only rename(s):"
  printf '  - %s\n' "${fixed[@]}"
else
  echo "No case-only renames detected."
fi

# Restore original ignorecase
if [[ -n "$orig_ignorecase" ]]; then
  git config --local core.ignorecase "$orig_ignorecase"
else
  git config --local --unset core.ignorecase || true
fi
