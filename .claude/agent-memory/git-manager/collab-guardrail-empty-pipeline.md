---
name: collab-guardrail-empty-pipeline
description: agent-collab pre-commit hook is enforced (engine_mode=both) but the tasks pipeline is empty, blocking all commits; --no-verify is the documented escape hatch
metadata:
  type: project
---

The `.githooks/pre-commit` hook enforces the agent-collab workflow: it blocks any commit unless at least one row exists in `tasks` with `status='in-progress'` inside the (gitignored) `.agent-collab/collab.db`, and only when `config.engine_mode='both'`.

As of 2026-08-06 the DB is in a misconfigured state: `engine_mode=both` (enforced) but `tasks`, `epics`, and `epic_tasks` are all empty, and `task_transitions` is 0. The only `activity_log` entry is the 2026-05-11 auto-setup (`strategy=architect-builder, engine=both`). So the documented "proper" path (`claim_task(task_id)`) is structurally impossible -- there is no task to claim, and `claim_task` is not available as a local CLI (only as an external agent-collab function).

**Why:** The team did real work (page-structure refactoring, store refactors, etc.) outside the formal task-tracking flow, so the collab DB was never populated, yet its guardrail stayed active.

**How to apply:** When asked to commit on this repo, expect the pre-commit hook to block. Verify the current DB state first (read-only `sqlite3 .agent-collab/collab.db "SELECT status,COUNT(*) FROM tasks GROUP BY status;"`). If still empty, either (a) seed/claim a task via the proper agent-collab flow, or (b) use `git commit --no-verify` (the hook's own documented emergency escape) and disclose it. Do NOT fabricate rows into the workflow DB manually. Recommend the coordinator either seed the task pipeline or set `engine_mode` to a non-enforcing value. No pre-push hook exists, so `git push` is never blocked by this. Re-verify before relying -- this may have been fixed.
