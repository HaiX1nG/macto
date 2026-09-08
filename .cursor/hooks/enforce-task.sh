#!/usr/bin/env bash
# afterFileEdit hook: fires after every file edit by the Cursor agent.
# Enforces the MCP workflow — blocks rogue edits in "both" mode.
set -euo pipefail

# Consume stdin (Cursor passes file edit details)
cat > /dev/null

DB=".agent-collab/collab.db"

# Skip if agent-collab not set up or sqlite3 missing
if [[ ! -f "$DB" ]] || ! command -v sqlite3 &>/dev/null; then
  exit 0
fi

# Only enforce in "both" mode
engine_mode=$(sqlite3 "$DB" "SELECT value FROM config WHERE key = 'engine_mode'" 2>/dev/null || echo "")
if [[ "$engine_mode" != "both" ]]; then
  exit 0
fi

# Check if Claude Code (Architect) has been involved
hld_exists=$(sqlite3 "$DB" "SELECT COUNT(*) FROM context WHERE key = 'hld'" 2>/dev/null || echo "0")
total_tasks=$(sqlite3 "$DB" "SELECT COUNT(*) FROM tasks" 2>/dev/null || echo "0")

# If no HLD and no tasks — Cursor never called invoke_architect
if [[ "$hld_exists" -eq 0 && "$total_tasks" -eq 0 ]]; then
  cat <<'EOF'
{
  "agent_message": "STOP. You are in 'both' mode — Claude Code is the Architect. The Architect is auto-dispatched when you call get_my_status. Call get_my_status and wait for tasks to appear. Do NOT create tasks or architecture yourself. Do NOT continue editing files until the Architect has created the HLD and tasks."
}
EOF
  exit 0
fi

# Tasks exist — check if one is claimed
in_progress=$(sqlite3 "$DB" "SELECT COUNT(*) FROM tasks WHERE status = 'in-progress'" 2>/dev/null || echo "0")

if [[ "$in_progress" -eq 0 ]]; then
  cat <<'EOF'
{
  "agent_message": "STOP. You are editing files without claiming a task. Call claim_task(task_id) from the agent-collab MCP before making any more changes. Run get_my_status to see available tasks."
}
EOF
fi
