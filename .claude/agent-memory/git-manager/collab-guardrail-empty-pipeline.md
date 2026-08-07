---
name: collab-guardrail-empty-pipeline
description: agent-collab pre-commit hook mechanism -- engine_mode was changed from "both" to "disabled" on 2026-08-06, so commits now pass normally; the empty-tasks-table risk remains if re-enabled
metadata:
  type: project
---

The `.githooks/pre-commit` hook (activated via `git config core.hooksPath .githooks`) enforces the agent-collab workflow: it blocks any commit unless at least one row exists in `tasks` with `status='in-progress'` inside the (gitignored) `.agent-collab/collab.db`, and only when `config.engine_mode='both'`. When `engine_mode` is anything else (including `disabled`), the hook exits 0 immediately and commits pass without `--no-verify`.

**Current state (verified 2026-08-06):** `engine_mode=disabled` -- the hook passes. Commits proceed normally, no `--no-verify` needed. This was the resolution applied after the earlier blocking state. The `tasks` table is still empty, but that no longer matters because the hook short-circuits before checking it.

**Why:** The team did real work (page-structure refactoring, store refactors, etc.) outside the formal task-tracking flow, so the collab DB was never populated. Previously `engine_mode=both` was set, which blocked all commits. The fix was to set `engine_mode=disabled`.

**How to apply:** When asked to commit on this repo, run `git commit` normally. If it unexpectedly fails with the "BLOCKED: No task is in-progress" message, check `sqlite3 .agent-collab/collab.db "SELECT value FROM config WHERE key='engine_mode'"` -- if it reverted to `both`, either (a) seed/claim a task via the agent-collab flow, or (b) use `git commit --no-verify` and disclose it. Do NOT fabricate rows into the workflow DB manually. No pre-push hook exists, so `git push` is never blocked.
