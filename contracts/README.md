# Rabdan AI Proctoring — Backend Handoff

This folder is the **API contract** between the frontend (this repo) and the
backend team. It is the single source of truth: backend builds to it, frontend
generates its client against it. When we finish, "linking the dots" is pointing
the frontend's HTTP client at the real base URL.

- [`openapi.yaml`](./openapi.yaml) — the machine-readable contract (endpoints, request/response schemas, auth).
- This README — the things a schema can't express: architecture decisions, the
  realtime channel, how the current mock maps to the contract, and open questions.

> **Status: DRAFT.** Shapes are derived from the *implemented UI*, so they're
> grounded in real usage — but nothing is frozen until both teams sign off.
> Search `TODO` / "open question" for the unresolved bits.

---

## 1. Where the frontend is today

The UI for the exam-integrity feature is **fully built and running**, but it is
**not connected to any backend**. Everything runs on in-memory mock data:

| Concern | Current state | File |
| --- | --- | --- |
| Incidents / exams data | Hardcoded seed arrays | `src/pages/exams/data.ts` |
| Domain types | UI-shaped types (display strings, bare names) | `src/pages/exams/types.ts` |
| Status changes (confirm/discard/…) | Mutate local React state only | `src/pages/exams/ExamWorkspacePage.tsx` |
| Auth | Fully stubbed (`isAuthed: true`, hardcoded user) | `src/lib/hooks/shared/useAuth.ts` |
| HTTP plumbing | Exists (axios + TanStack Query) but only a leftover starter-kit `doctors` handler | `src/api/` |

So the backend is **greenfield**. The contract in `openapi.yaml` is our proposal
for what to build.

## 2. Decisions already made

1. **Backend owns violation detection.** The backend runs or integrates the
   CV/ML proctoring pipeline, persists the resulting incidents, and serves them
   through this API. The frontend never talks to the pipeline directly — it only
   reads/updates incidents. This is why the incident schema includes `confidence`,
   `evidence` (camera stills/clips), and detection `occurredAt`.

2. **Live updates use WebSocket/SSE.** Active exams stream new incidents in real
   time (the UI shows a "Synced live" indicator). This is layered *on top of* the
   REST resources — see [§4](#4-realtime-channel). REST remains the source of
   truth; realtime just pushes deltas.

## 3. Mock → contract: important shape changes

The frontend's current types are **display-shaped**. The contract deliberately
differs where the UI was cutting corners. The frontend will adapt (map API →
view models); backend should implement the **contract** shapes, not the mock:

| UI mock (`types.ts` / `data.ts`) | Contract (`openapi.yaml`) | Why |
| --- | --- | --- |
| `time: '09:42:18'` | `occurredAt: <ISO-8601 date-time>` | Real timestamp; UI formats. Never send preformatted strings. |
| `subjects: (string \| null)[]` (names) | `subjects: Subject[]` = `{ studentId, name }` | UI needs stable IDs and a real "unidentified" representation (both fields null). |
| `cam: 'cam-04'` | `camera: { id, label }` | Is it an ID or a label? Both — split them. |
| `when: '09:00 – 12:00'` / `'Jun 28, 2026'` | `startsAt` / `endsAt` (date-time) | Same reason as `occurredAt`. |
| `letter: 'C'` | *(dropped)* | UI derives the avatar letter from `title`. |
| `ts: 900 / 20260628` | *(dropped)* | Was a mock sort key; use real timestamps. |
| No `examId` on incident | `Incident.examId` | Needed for routing/consistency. |
| No audit fields | `reviewedBy`, `reviewedAt` | Proctoring requires an audit trail of who confirmed/discarded. |
| No evidence | `IncidentDetail.evidence[]` | The detail dialog renders a camera still — it needs a media URL. |

## 4. Realtime channel

The active-exam workspace needs incidents to appear as the pipeline detects them.

- **Transport:** WebSocket or SSE (backend to choose; SSE is simpler if updates
  are one-directional server→client, which they are here).
- **Scope:** per-exam subscription (a proctor is viewing one exam at a time).
- **Suggested contract (TODO finalize):**
  - Connect: `wss://…/v1/exams/{examId}/incidents/stream` (or SSE `GET` same path).
  - Auth: same bearer token (as query param or `Authorization` header on the
    upgrade, backend to decide).
  - Message envelope:
    ```json
    { "event": "incident.created", "data": { /* Incident */ } }
    { "event": "incident.updated", "data": { /* Incident */ } }
    ```
  - `incident.updated` covers status changes made by *other* proctors so views
    stay consistent.
- **Fallback:** frontend can poll `GET /exams/{examId}/incidents` if the socket
  drops — so the REST endpoint must always return the current truth.

## 5. How each team uses this

**Backend**
- Treat `openapi.yaml` as the spec to implement. Generate server stubs/validation
  from it if your stack supports it (e.g. `oapi-codegen`, `openapi-generator`,
  FastAPI, NestJS + swagger).
- Keep it updated as the source of truth — if reality has to diverge, change the
  spec in a PR so the frontend sees it.

**Frontend**
- Generate types/client from the spec (e.g. `openapi-typescript`) and wire the
  existing `src/api/handlers/*` + TanStack Query hooks to the real endpoints.
- Replace `useAuth` stub and the `data.ts` seed imports with API calls.
- The `httpClient` already unwraps `response.data` and throws `error.response.data`
  on failure — so the [`Error`](./openapi.yaml) envelope is what UI `catch`
  blocks receive. Keep `message` populated.

## 6. Open questions (need a decision before backend locks in)

1. **Auth mechanism** — password login vs SSO/OIDC (Rabdan may have an IdP)?
   The spec currently assumes email+password → JWT as a placeholder.
2. **Roles & permissions** — who can confirm/discard vs only view? Can past-exam
   records be reopened, and by whom? The UI shows a reopen path on past exams.
3. **Past-exam immutability** — the UI labels past records "final." Does the
   backend hard-lock status changes on ended exams (→ `409`), or allow reopen?
4. **Export: sync or async** — is a proof PDF generated inline (return URL now)
   or queued (poll `jobId`)? Spec supports async; confirm.
5. **Export "select all"** — when no `incidentIds` are sent, does export mean
   "the full filtered set"? Frontend currently only exports explicit selections.
6. **Incident pagination** — is per-exam incident volume small enough to return
   in full (UI paginates client-side today), or do we need server-side paging
   from day one?
7. **Camera model** — is a camera a first-class entity with its own endpoints,
   or just an embedded `{id,label}` on incidents/exams?
8. **Extensible violation types** — will more types beyond `phone`/`adjacent`
   arrive? Frontend should render unknown types generically if so.
