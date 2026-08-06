---
name: backend-repo-and-contract
description: macto frontend is paired with a separate Go backend repo; api-contract.md is the alignment authority derived from frontend actual calls
metadata:
  type: reference
---

The `macto` frontend (this repo, `/Users/megumikato/ReactProject/macto`) is paired with a **separate** Go (Gin) backend repo at `/Users/megumikato/GoProject/Gin-macto/server` (module `github.com/yourorg/livemix`). The backend is a distinct git repo — when doing frontend-only work, treat the backend as read-only.

The authoritative API alignment source is `/Users/megumikato/ReactProject/macto/docs/api-contract.md`. It was reverse-derived from the frontend's *actual* service calls (`src/renderer/services/*`), so when the contract and the backend code disagree, the **contract/frontend is the source of truth** (the backend should be made to match). This also means the task description can contain stale/incorrect details (e.g. it once said `PUT /playlist/reorder` but the frontend + contract §8 use `POST` — always confirm the HTTP method against the frontend service, not the prose).

Response envelope (both sides): `{ code, message, data }`; frontend `apiClient` returns `response.data.data` directly. Business success code is `20000`; errors are 5-digit codes in `pkg/errcode/errcode.go`.

How to apply: when asked to "fill backend gaps" or "align the API", read the frontend service file + the contract section for the exact method/path/fields, and make the Go backend match — do not trust the task prose alone.
