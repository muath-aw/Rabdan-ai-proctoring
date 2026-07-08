# Rabdan AI Proctoring — Product Specification

> Purpose of this document: a self-contained starting point for downstream work — user stories, backlog grooming, test-case authoring, and backend planning. It captures what the frontend implements today, the business rules the product depends on, and the entities that the backend must ultimately serve.
>
> Cross-references:
> - **API contract** — [`contracts/openapi.yaml`](../contracts/openapi.yaml) is the canonical, machine-readable surface. This document is prose; when the two disagree, the contract wins.
> - **Design bundle** — [`design/`](../design/) contains the original visual handoff. Historical; not authoritative on business logic.
> - **Frontend source of truth for shapes** — [`src/types/api/`](../src/types/api/) (hand-authored DTOs) and [`src/pages/`](../src/pages/).

---

## 1. Product summary

Rabdan AI Proctoring is a browser-based admin console that lets proctors and administrators review AI-detected exam integrity violations. A CV/AI pipeline (owned by a separate backend team) processes classroom camera feeds, flags suspicious events as **incidents**, and this console surfaces those incidents for human triage and export.

**Two modes of interaction:**

1. **Live monitoring** — during an active exam, incidents stream in and proctors confirm or discard them in near-real-time.
2. **Post-hoc review** — once an exam ends, records go read-only-except-for-triage; open incidents can still be resolved and evidence can be exported.

**Not in this system**: the CV pipeline itself, exam scheduling (the SIS owns that), student records, or grade reporting.

---

## 2. Actors and roles

| Actor | Description | Interacts with |
|---|---|---|
| **Proctor / Admin** | Human user of this console. Triages incidents, manages the locations/cameras registry. Auth is stubbed today; role-based permissioning is deferred. | Every UI in this app. |
| **SIS (Student Information System)** | Upstream system that owns exams and scheduling. Pushes exams to the backend along with a room identifier that maps to `Location.code`. | Backend only. Never talks to the frontend directly. |
| **CV / AI pipeline** | Backend-owned service that watches camera streams, detects violations, and creates `Incident` records. | Backend only. |
| **Camera hardware** | Physical IP cameras installed in exam rooms. Names are predefined and immutable. | CV pipeline consumes streams; admins register them in Settings. |

Only one role exists in the UI today. The API contract lists `User.roles` as `TODO define roles (e.g. proctor, admin) and their permissions.`

---

## 3. System context

```
   ┌────────────┐   exam schedule    ┌──────────────────┐
   │    SIS     │ ─────────────────► │                  │
   └────────────┘   (room code)      │                  │
                                     │     Backend      │
   ┌────────────┐   video streams    │  (this contract) │◄──── camera activation
   │  Cameras   │ ─────────────────► │                  │      derived from
   └────────────┘                    │  ┌────────────┐  │      Exam.locationId
                                     │  │ CV/AI      │  │
                                     │  │ pipeline   │──┼──► creates Incidents
                                     │  └────────────┘  │
                                     └────────┬─────────┘
                                              │ REST + WebSocket/SSE
                                              ▼
                                     ┌──────────────────┐
                                     │  Admin console   │
                                     │   (this repo)    │
                                     └──────────────────┘
```

**Ownership rules:**

- Frontend never talks to the SIS directly. All exam data arrives via the backend.
- Backend owns violation detection and persistence.
- Frontend owns the Locations/Cameras registry UI; the data lives in the backend once it's built (localStorage today).
- Live updates are planned over WebSocket/SSE but are **not implemented** in the frontend yet — today the app is single-shot React Query.

---

## 4. Domain model (text ERD)

### 4.1 Entities

**Location** — admin-managed
| Field | Type | Notes |
|---|---|---|
| `id` | string | Server-assigned. |
| `code` | string | **Stable join key** matched against the identifier the SIS sends per exam. Unique (case-insensitive dedupe on write). Case-sensitive when the backend matches SIS strings against it. |
| `name` | string | Display name. Free to rename without breaking the join. Unique. |
| `description` | string \| null | Optional admin note. |
| `createdAt` | ISO datetime | Server-assigned. |

**Camera** — admin-managed
| Field | Type | Notes |
|---|---|---|
| `id` | string | Server-assigned. |
| `name` | string | The physical camera identifier printed on the device (e.g. `cam-04`). Predefined, treated as immutable-in-spirit. Unique within a Location. |
| `locationId` | string | FK to `Location.id`. Required. |
| `createdAt` | ISO datetime | |

**Exam** — SIS-owned, backend-ingested, read-only in this app
| Field | Type | Notes |
|---|---|---|
| `id` | string | From the SIS. |
| `title` | string | e.g. "Calculus II · Final". |
| `locationId` | string \| null | Resolved server-side from the SIS's room code → `Location.code` lookup. Null when no match. |
| `locationName` | string \| null | Denormalized `Location.name` for display. Null when `locationId` is null. |
| `status` | `active` \| `past` | |
| `live` | boolean | True while a session is in-progress (only meaningful for `active`). |
| `startsAt`, `endsAt` | ISO datetime | |
| `totalIncidents` | integer | Convenience count for badges. |
| `openIncidents` | integer | Convenience count for badges. |
| `studentCount` | integer | On `ExamDetail` only. |

**Incident** — CV-pipeline-created, admin-triaged
| Field | Type | Notes |
|---|---|---|
| `id` | string | e.g. `INC-04817`. |
| `examId` | string | FK to `Exam.id`. |
| `type` | `phone` \| `adjacent` | Extensible; frontend renders unknown types generically. |
| `occurredAt` | ISO datetime | Detection time. |
| `camera` | Camera | The specific camera that captured the event. |
| `subjects` | Subject[] | 1 subject for `phone`, 2 for `adjacent`. |
| `confidence` | float 0–1 \| null | CV pipeline confidence. `null` when not available. |
| `status` | `open` \| `confirmed` \| `discarded` | Set by admin triage. |

**Subject** — nested in Incident
| Field | Type | Notes |
|---|---|---|
| `studentId` | string \| null | |
| `name` | string \| null | |

Both null ⇒ the CV pipeline saw a person it could not resolve → renders as "Unidentified".

**User** — auth stub today
| Field | Type | Notes |
|---|---|---|
| `userId`, `name`, `email` | string | |
| `picture` | string \| null | Avatar URL. |
| `roles` | string[] | TODO — undefined. |

### 4.2 Relationships and derivations

```
User            (1) ────── manages ────── (N)     Location
Location        (1) ────── contains ───── (N)     Camera
Location        (1) ◄──── SIS.roomCode == Location.code ─── (N)     Exam   [server-side resolution]
Exam            (1) ────── generates ──── (N)     Incident        [backend, via CV pipeline]
Camera          (1) ────── captured ───── (N)     Incident        [inferred by CV pipeline]
Incident        (1) ────── implicates ── (1–2)   Subject          [nested; unidentified allowed]
```

**Derived, not stored:**

- **Active cameras for an exam** = `SELECT camera FROM Camera WHERE locationId = exam.locationId`.
  - This is what tells the CV pipeline which streams to watch during the exam. Backend derives it; frontend never asks.
- **Exam.locationName** = `Location.name` where `Location.id = Exam.locationId`, denormalized by the backend at read time.

### 4.3 Ownership matrix

| Entity | Source of truth | Frontend can write? |
|---|---|---|
| Location | This app (localStorage today; backend later) | ✓ CRUD |
| Camera | Same | ✓ CRUD |
| Exam | SIS → backend | ✗ read-only |
| Incident | CV pipeline → backend | ✗ read except `status` triage |
| Subject | CV pipeline → backend | ✗ read-only |
| User | Auth provider (TBD) | ✗ read-only |

---

## 5. Business rules

### 5.1 SIS ↔ Location join

- **BR-1** — Every Location has a `code` field. It is the only reliable join key with the SIS.
- **BR-2** — Location codes are unique (case-insensitive dedupe on write; case-sensitive when the backend matches SIS strings against them).
- **BR-3** — When the SIS delivers an exam whose room identifier matches no known `Location.code`, the exam is stored with `locationId = null` and `locationName = null`. The exam still appears in the UI; no cameras are activated for it.
- **BR-4** — Admins can edit a Location's `code`. Doing so may orphan already-ingested exams whose SIS code referenced the previous value. There is no confirmation prompt today; UI guardrails may be added later.
- **BR-5** — Admins can rename a Location's `name` freely; the `code`-based join is unaffected.

### 5.2 Cameras

- **BR-6** — Camera names are unique **within a Location** (case-insensitive dedupe). The same name can exist in different Locations.
- **BR-7** — Cameras are hardware-bound. Admins register them; the physical device names are the source of truth.
- **BR-8** — Cameras cannot be moved between locations by "reassigning" without care — such an operation is `PUT` today and permitted, but has downstream consequences on future incident attribution.

### 5.3 Deletion

- **BR-9** — A Location cannot be deleted while any Camera references it. UI returns a toast; API returns 409.
- **BR-10** — A Location referenced by exams (past or active) **can** be deleted (BR-9 permitting). Existing exams become orphaned (`locationId` unresolvable server-side) → AI activation no-ops for future occurrences. This is a deliberate choice: the backend must handle orphaned exams gracefully; the alternative would be a permanent lock on Locations that ever had exams, which is impractical.
- **BR-11** — Cameras are always deletable.

### 5.4 Incidents and triage

- **BR-12** — Incidents transition: `open` ⇄ `confirmed`, `open` ⇄ `discarded`, `confirmed` → `discarded`, `discarded` → `open`. Direct `confirmed` → `open` is exposed as "Reopen" in the row-actions menu.
- **BR-13** — Discarded incidents remain visible in the list, dimmed. They can be restored.
- **BR-14** — Past exams are marked "Records final" but incidents still triageable — this is deliberate. The "final" copy indicates that no new incidents will arrive, not that existing ones freeze.
- **BR-15** — A past exam with `openIncidents > 0` shows a warning alert prompting admins to close them out.

### 5.5 Confidence

- **BR-16** — The confidence threshold below which the UI marks an incident visually as "low" is **0.7**. This is a UI-only constant today (`LOW_CONFIDENCE_THRESHOLD` in `src/pages/exams/data.ts`); it does not affect backend behaviour.
- **BR-17** — `confidence = null` renders as an em-dash. It does not gate triage.

### 5.6 Live indicator and sync

- **BR-18** — The exam list has a manual "Sync now" CTA and a synced-status indicator. Today it's a UI simulation (~1.1s). Backend semantics: force a refresh of the exam list from SIS-cached backend state.
- **BR-19** — The active-exam header shows a pulsing "Live" badge while `exam.live = true`. Post-hoc workspaces show a `Lock` icon and "Ended" chip.

---

## 6. Assumptions

Explicit assumptions that must hold for the design to work. Any change to these invalidates the model.

- **A-1** — Exams are ingested from the SIS. The frontend never creates them.
- **A-2** — Camera physical names are stable at the site (the university doesn't rename `cam-04` to `cam-04-v2`).
- **A-3** — Locations map to physical rooms. A single exam occupies at most one Location. Multi-room exams are out of scope.
- **A-4** — The SIS's identifier per room can be captured as a string. If the SIS sends structured data (e.g. `{ building, room }`), the admin agreement is "concatenate to a canonical string that goes into `Location.code`."
- **A-5** — The tenant is single-university-scoped for v1. Multi-tenant partitioning is out of scope.
- **A-6** — Camera streams are ingested by the backend, not by the browser. The frontend only shows metadata (id, name) and evidence stills — never live video.
- **A-7** — Incident evidence artifacts (stills, clips, PDF proofs) are backend-produced. The frontend renders a placeholder texture for the still today; the real image URL will come from the backend.
- **A-8** — Two violation types are enough for v1: `phone` (1 subject) and `adjacent` (2 subjects). The contract is extensible; the UI renders unknown types with a generic label.
- **A-9** — English (LTR) and Arabic (RTL) are the two supported locales. Any new UI text must ship translations in both.
- **A-10** — Auth is deferred. The console is currently accessible to anyone who reaches the URL; wiring OIDC is a separate workstream.

---

## 7. Frontend use cases

Every UC below reflects what is **implemented in the app today** unless flagged with **[NOT IMPLEMENTED]**. Actors default to Proctor/Admin.

### 7.1 Sidebar navigation

**UC-01 — Navigate the app**

- **Actor**: Proctor/Admin
- **Trigger**: User loads the app.
- **Precondition**: (Auth stubbed as authenticated.)
- **Main flow**: Sidebar shows two entries — "Exams" and "Settings". User clicks one → route change.
- **Rules invoked**: none.
- **Postcondition**: Corresponding page loads (lazy-loaded).

### 7.2 Exam List (`/exams`)

**UC-02 — Browse active exams**

- **Trigger**: User navigates to `/exams`.
- **Precondition**: None (mock data available today).
- **Main flow**:
  1. "Active" tab is default, showing exam cards sorted by scheduled start time.
  2. Each card shows: room-letter tile, title, room name, session window, "Live" badge (if `live=true`) with pulse animation, "New incidents" badge (if `open > 0`), open-count badge, chevron.
  3. Sync-status indicator on the top-right shows last synced time.
- **Alternates**:
  - User clicks "Sync now" → the button spins, indicator flips to "Syncing…", then to "Synced · just now" after ~1.1s (UC-06).
- **Postcondition**: Displayed list matches the current mock/backend state.
- **Rules invoked**: BR-18.

**UC-03 — Browse past exams**

- **Trigger**: User clicks "Past" tab.
- **Main flow**:
  1. Past exams render as cards with the same shape as active but no "Live" badge, no "New incidents" badge.
  2. Search field (title / room), date-range filter ("All time", "Last 7 days", "Last 30 days"), sort selector ("Most recent", "Oldest", "Most incidents") appear above the list.
  3. Filters combine (AND).
  4. If a past exam has open incidents, its badge shows the open count in warning color.
- **Alternates**:
  - No matches → BlankSlate with SearchX icon and message.
- **Postcondition**: Filtered/sorted list rendered.

**UC-04 — Open an exam's workspace**

- **Trigger**: User clicks an exam card.
- **Main flow**: Route to `/exams/active` (if selected from Active tab) or `/exams/past` (from Past tab).
- **Note**: Today, all cards route to the same two workspace pages regardless of which specific card was clicked — the workspaces render fixed mock data. When wiring to backend, route will become `/exams/:examId` and the workspace loads that exam's data.
- **Postcondition**: Workspace page loads.

### 7.3 Active Exam Workspace (`/exams/active`)

**UC-05 — Review incidents for an active exam**

- **Precondition**: An active exam exists.
- **Main flow**:
  1. Header shows: back link, exam title, room, session window, current session state ("In session 0:42"), pulsing Live badge, stat boxes ("Students: 38", "Open: N").
  2. Incident feed renders as a `DataTable`:
     - Columns: checkbox, thumbnail, type badge, incident ID + time (mono), student(s), confidence bar, status badge, kebab actions.
     - Search bar (global), faceted filters (Type, Students identified/unidentified, Status), pagination.
  3. User can:
     - Click a row → opens Incident Detail Dialog (UC-08).
     - Click kebab → contextual menu based on status: Confirm/Discard/Reopen/Restore/Review/Export proof.
     - Select rows (checkbox) → bulk bar appears with "Confirm", "Discard", "Export selected", "Clear".
- **Rules invoked**: BR-12, BR-13, BR-16, BR-19.
- **Postcondition**: Any status changes reflected in the row and in the "Open" stat.

**UC-06 — Sync incidents (active exam)**

- **[Partially IMPLEMENTED]** Active workspace has a "Synced · live" indicator (no manual button — sync is expected to be live). Backend will drive this via WebSocket/SSE (**[NOT IMPLEMENTED]** in the frontend).

**UC-07 — Bulk-triage or bulk-export**

- **Trigger**: Selection ≥ 1.
- **Main flow**:
  1. Bulk bar displays "N selected".
  2. Click "Confirm" or "Discard" → all selected incidents transition to that status; toast confirms; selection clears.
  3. Click "Export selected" → opens Export Dialog (UC-09).
  4. Click "Clear" → deselects all.
- **Rules invoked**: BR-12.

**UC-08 — View incident detail and triage**

- **Trigger**: Click a row or "Review incident" from kebab.
- **Main flow**:
  1. Dialog opens with: camera still, status badge, subject list, confidence bar, metadata grid (violation, camera, timestamp, incident ID).
  2. Actions are status-adaptive:
     - `open` → Confirm violation | Discard
     - `confirmed` → Discard instead
     - `discarded` → Restore to open
     - Always: Export PDF proof.
  3. Selecting an action mutates status via mutation; toast confirms.
- **Rules invoked**: BR-12.

**UC-09 — Export selected incidents**

- **Trigger**: Bulk-bar "Export selected".
- **Main flow**:
  1. Dialog shows preview table of selected incidents (type, time, subjects, status).
  2. User confirms → toast "Exported violations table · N rows"; dialog closes.
- **[NOT IMPLEMENTED]** Actual file generation — today it's just a toast. Backend contract: `POST /exams/:examId/incidents:export`.

**UC-10 — Export a single incident's PDF proof**

- **Trigger**: Kebab → "Export PDF proof" (or detail dialog "Export as PDF proof").
- **Main flow**: Toast confirms. Backend contract: `POST /exams/:examId/incidents/:incidentId:export-proof`.
- **[NOT IMPLEMENTED]** Actual PDF generation.

### 7.4 Past Exam Workspace (`/exams/past`)

**UC-11 — Post-hoc incident review**

- Same as UC-05, with these differences:
  - "Ended" badge with lock icon replaces "Live".
  - "Records final" copy replaces sync indicator.
  - When `openIncidents > 0`, a warning `Alert` is shown at the top with a "Review open" button that pre-applies a status filter of `open`.
- **Rules invoked**: BR-14, BR-15.

### 7.5 Settings — Locations (`/settings`, top section)

**UC-12 — Browse locations**

- **Trigger**: User navigates to `/settings`.
- **Main flow**: The Locations section displays a DataTable with columns Name | SIS code (mono) | Description | Cameras | Created | Actions. Search across name/description; sorting on Name/Code/Cameras/Created; pagination.
- **Alternates**:
  - Query loading → skeleton rows.
  - Query error → destructive `Alert` with "Retry".
  - Empty list → BlankSlate with pin icon, title, description, "Add location" CTA.
- **Postcondition**: Displayed list matches storage.

**UC-13 — Add a location**

- **Trigger**: Click "Add location" (header button or empty-state CTA).
- **Precondition**: none.
- **Main flow**:
  1. `LocationFormDialog` opens with fields: Name (required, max 60), SIS code (required, max 40, monospaced, help text: "Must match exactly what the SIS sends for this room. Case-sensitive."), Description (optional, max 200).
  2. On submit:
     - Client-side Zod validation.
     - Handler dedupes case-insensitively on both `code` and `name`.
     - Success → dialog closes; toast "Location \"X\" added"; list refreshes.
- **Alternates**:
  - Duplicate code → inline error on `code` field: "A location with this SIS code already exists".
  - Duplicate name → inline error on `name` field.
  - Other error → destructive toast.
- **Rules invoked**: BR-1, BR-2, BR-5.

**UC-14 — Edit a location**

- **Trigger**: Row kebab → "Edit".
- **Main flow**: Same dialog as UC-13, prefilled. Same validation and dedupe rules apply, excluding self.
- **Alternates**: Same as UC-13 duplicate cases.
- **Rules invoked**: BR-4, BR-5. **Warning surface not yet built** — editing `code` will silently orphan already-mapped exams (see BR-4).

**UC-15 — Delete a location**

- **Trigger**: Row kebab → "Delete".
- **Main flow**:
  1. `ConfirmDialog` opens with location name.
  2. On confirm, mutation runs:
     - Handler first calls `camerasHandler.getByLocation(id)`.
     - If any cameras returned → throws `LocationInUseError(cameraCount)`.
     - Else deletes.
  3. Success → toast; dialog closes.
- **Alternates**:
  - `LocationInUseError` → destructive toast: "Cannot delete — N cameras are assigned to this location"; dialog closes without deleting.
- **Rules invoked**: BR-9, BR-10.

### 7.6 Settings — Cameras (`/settings`, bottom section)

**UC-16 — Browse cameras**

- Similar structure to UC-12. Columns: Name | Location | Created | Actions.
- Displays `Unknown location` (i18n key) when a camera references a location that no longer exists (BR-10 fallout).

**UC-17 — Add a camera**

- **Trigger**: Click "Add camera".
- **Precondition**: At least one Location must exist. When zero → the "Add camera" button is **disabled**, and the empty state shows a "Add a location first" CTA that smooth-scrolls to the Locations section.
- **Main flow**:
  1. `CameraFormDialog` opens with fields: Name (required, max 60), Location (required, Select from existing Locations, first location prefilled).
  2. On submit:
     - Client-side validation.
     - Handler dedupes case-insensitively on `(locationId, name)`.
     - Success → toast; dialog closes.
- **Alternates**:
  - Duplicate name in this Location → inline error: "A camera with this name already exists in this location".
- **Rules invoked**: BR-6, BR-7.

**UC-18 — Edit a camera**

- Same as UC-17 with prefilled values. Dedupe excludes self.

**UC-19 — Delete a camera**

- Same shape as UC-15, without the in-use check. Cameras are always deletable.
- **Rules invoked**: BR-11.

### 7.7 Cross-cutting UI

**UC-20 — Localize the UI**

- User toggles language via the language switcher.
- Impacts: text, date formatting, layout direction (RTL for Arabic).
- **[NOT ENFORCED]** No tenant-preference persistence beyond browser localStorage; multi-user preference sync deferred.

**UC-21 — Theme**

- Light is default (as designed). Dark mode is supported; theme switcher available in shared components.
- **A-9** applies: every design token exists in both themes.

**UC-22 — Notifications bell**

- Header on exam list shows a bell with a red badge (5). **UI-only, non-functional.** No notification store, no click handler. Placeholder for future work.

**UC-23 — Auth**

- **[NOT IMPLEMENTED]** — `useAuth` returns a hardcoded user. `AuthGuard` never redirects. `/auth/login` route renders a placeholder.

---

## 8. Data flows (representative sequences)

### 8.1 Exam appearance in the console (end-to-end, target state)

```
SIS  ──► Backend  : POST /exams/ingest (or webhook)
Backend          : normalize + resolve locationId by matching SIS.room → Location.code
Backend          : persist Exam with locationId (null if unmatched)
Backend          : if locationId is set, subscribe CV pipeline to cameras where locationId = X
CV pipeline      : detect violations → POST Incident to Backend
Backend          : broadcast via WebSocket/SSE to any subscribed frontend clients
Frontend         : GET /exams?status=active (initial); WS/SSE for live updates
Frontend         : render exam card / incident row
```

Today the frontend performs only the last two steps against local mocks. Everything above is backend responsibility.

### 8.2 Location code edit fallout

```
Admin edits Location.code from "HALL_B" to "HALL_B_MAIN"
  │
  ▼
Backend accepts (409 only on duplicates)
  │
  ▼
Next SIS ingestion sends { room: "HALL_B" } for an exam
  │
  ▼
No match → Exam.locationId = null → no cameras activated
  │
  ▼
Admin sees the exam in the UI with no location metadata; no incidents ever generated
```

The frontend currently has **no warning UI** for this. It is a business risk called out in BR-4.

### 8.3 Bulk triage

```
User selects 5 incidents in Active workspace
  │
  ▼
Clicks "Confirm" → applyBulk('confirmed')
  │
  ▼
For each incident: setStatus(id, 'confirmed')  [today: local React state; target: mutation]
  │
  ▼
Toast "5 incidents confirmed"
  │
  ▼
Selection cleared; "Open" stat decrements; row status badges flip green
```

### 8.4 Camera activation derivation

```
When Exam X starts (backend cron / SIS webhook):
  cameras_for_exam = SELECT * FROM Camera WHERE locationId = X.locationId
  for each cam in cameras_for_exam:
      CV pipeline attach(cam.streamUrl, examId=X.id)
```

`Camera.streamUrl` is not yet in the schema — it's implicit that cameras have stream endpoints known to the backend. Adding a stream URL field is a candidate for a future contract change; **do not build this into the current stories without confirmation**.

---

## 9. What the frontend already covers vs. gaps

### Implemented and stable
- Full Exam List UI with tabs, filters, sort, sync simulation, empty states.
- Full Active + Past Exam Workspace with data table, filters, search, bulk bar, row/detail dialog triage, export dialogs (toast-only).
- Full Settings page with two-section stacked layout, locations + cameras CRUD, dedupe, delete-in-use guard, empty/error/loading states, localized (EN + AR).
- Design-system compliance sweep applied to the exam pages (Conditional.If, tokens, RTL, a11y).

### Stubbed with local mocks (must move to real backend)
- Exam list data (`src/pages/exams/data.ts`).
- Incident feed data.
- Locations + Cameras storage (localStorage today; API-shape ready — handlers are the only file that needs swapping).
- Export actions (toast-only).
- Auth (`useAuth` returns hardcoded user).

### Not implemented — will need stories
- OIDC login flow and real `AuthGuard` redirect behaviour.
- Notifications bell (currently non-functional).
- WebSocket/SSE live-updates channel.
- PDF proof generation.
- Violation-table export file generation.
- Exam creation UI (waiting on SIS integration; may never be needed if SIS is the sole source).
- Warning UI when editing a Location's `code` would orphan mapped exams.
- "Unmapped exams" indicator (surfaces exams where `locationId=null`).
- Role-based UI permissioning.
- Storing user preferences (language, theme, filters) server-side.
- Multi-tenant scoping.
- Multi-room exams (schema doesn't support them today; if needed, `Exam.locationId` becomes `Exam.locationIds[]`).

---

## 10. Glossary

| Term | Meaning |
|---|---|
| **Active exam** | Exam whose scheduled window is currently open (`status = active`). May or may not be `live`. |
| **Live exam** | Active exam currently in-session (`live = true`). |
| **Past exam** | Exam whose scheduled window has ended (`status = past`). |
| **Incident** | A single AI-detected event flagged by the CV pipeline. |
| **Open / Confirmed / Discarded** | Incident triage states. |
| **Reopen** | Move a confirmed incident back to open. |
| **Restore** | Move a discarded incident back to open. |
| **SIS** | Student Information System — external, upstream, source of truth for exams. |
| **Location** | Physical room/hall registered in Settings. |
| **Code** (Location.code) | Admin-entered string that matches whatever the SIS sends as the room identifier. |
| **Camera** | Physical camera registered in Settings, linked to exactly one Location. |
| **Subject** | Person implicated in an incident (student or unidentified). |
| **Unidentified** | The CV pipeline saw a person but couldn't match them to the roster. |

---

## 11. References

**Code**
- Exam pages: [`src/pages/exams/`](../src/pages/exams/)
- Settings pages: [`src/pages/settings/`](../src/pages/settings/)
- DTOs: [`src/types/api/`](../src/types/api/)
- Handlers (localStorage v1): [`src/api/handlers/`](../src/api/handlers/)
- Query/mutation hooks: [`src/lib/hooks/queries/`](../src/lib/hooks/queries/), [`src/lib/hooks/mutations/`](../src/lib/hooks/mutations/)
- Routes: [`src/routes/`](../src/routes/)
- Locales: [`src/locales/en/`](../src/locales/en/), [`src/locales/ar/`](../src/locales/ar/)

**Contracts**
- API contract: [`contracts/openapi.yaml`](../contracts/openapi.yaml)
- Backend handoff notes: [`contracts/README.md`](../contracts/README.md)

**Design (historical)**
- Design brief: [`design/HANDOFF.md`](../design/HANDOFF.md)
- HTML prototypes: [`design/project/`](../design/project/)

**Git**
- Branch: `feat/exam-integrity-screens`
- Notable commits:
  - `25f4381` Implement Exam Integrity screens from Claude Design handoff
  - `9d14514` Refactor exam integrity screens to project standards
  - `d5ab392` Add Settings page with Locations and Cameras management
  - `de857e8` Update API contract for SIS-linked Locations and derived exam cameras

---

## 12. Suggested next actions for downstream planning

For user stories:
1. Group work by feature area (Exams, Settings, Auth, Realtime, Export).
2. Turn each UC into one or more stories keyed to acceptance criteria drawn from the flow bullets.
3. Cross-check every story against Section 5 (business rules) and Section 6 (assumptions).

For test cases:
1. For each UC, enumerate: happy path, each alternate flow, each business rule that could invalidate the flow, each dedupe/uniqueness constraint, each empty/loading/error state.
2. i18n regression: every user-visible string in both EN and AR.
3. RTL layout regression: any UC that uses directional icons, tables, or drawers.
4. Boundary cases: empty registries (0 locations → no cameras allowed), max lengths (name 60, code 40, description 200), null confidence, subjects with mixed identified/unidentified.

For backend planning:
1. Every entity in Section 4 must have persistence, plus the derivation rule in Section 8.4.
2. Every path in `contracts/openapi.yaml` must have a handler.
3. Ingest webhook from SIS → normalize → resolve locationId → persist.
4. WebSocket/SSE broker for live updates.
5. Export services (PDF proof, table CSV/XLSX/PDF).
