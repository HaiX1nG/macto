---
name: go-backend-repo
description: Location and remote of the Macto Go backend repo (separate from the frontend macto repo)
metadata:
  type: reference
---

The Macto project spans two independent Git repositories:

- **Frontend** (Electron/React): `/Users/megumikato/ReactProject/macto`, remote `git@github.com:HaiX1nG/macto.git`, module under `src/renderer`.
- **Go backend**: `/Users/megumikato/GoProject/Gin-macto/server`, remote `git@github.com:HaiX1nG/Gin-macto.git`, Go module `github.com/yourorg/livemix`. API contract lives at `docs/api-contract.md` in the frontend repo.

The Go backend has NO pre-commit hooks (no `.githooks`, `.husky`, or agent-collab guard), unlike the frontend which has the [[collab-guardrail-empty-pipeline]] guard. Commits to the backend repo do not require `--no-verify`.

Commit style in the backend repo: Conventional Commits with Chinese descriptions (e.g. `feat(api): 补齐...`), matching the frontend repo convention.
