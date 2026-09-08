#!/usr/bin/env bash
set -euo pipefail

DB=".agent-collab/collab.db"

if [[ ! -f "$DB" ]]; then
  cat <<EOF
{
  "agent_message": "Call get_my_status from the agent-collab MCP server. The project needs initial setup — the MCP will walk you through it."
}
EOF
  exit 0
fi

cat <<EOF
{
  "agent_message": "Call get_my_status from the agent-collab MCP server to see your next task. Do NOT write any code until you have claimed a task."
}
EOF
