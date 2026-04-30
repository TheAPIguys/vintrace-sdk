---
name: git-commit
description: Stage and commit changes with a grouped, concise commit message. Run `git diff --cached` and `git diff` to inspect all changes, group them by logical concern, then commit. Use when the user asks to "commit", "commit changes", "make a commit", or similar.
---

Group all uncommitted changes by logical concern and commit them.

1. Run `git diff --cached` and `git diff` (or `git status` first to see what's changed).
2. Categorize changes into logical groups (e.g., "add feature X", "fix bug Y", "refactor Z", "update styles").
3. Draft a concise commit message (1-2 sentences) that focuses on the _why_ rather than the _what_, following the repository's existing commit style.
4. Stage the changes (`git add`) and commit with the drafted message.
5. Confirm the commit succeeded by running `git status` afterward.

Do NOT push unless the user explicitly asks you to.
