# ADR-0005 — Admin forms on react-hook-form with shared field primitives

- **Status:** Accepted (recorded retroactively) · 2026-09-23
- **Source:** feature commit `1a46de2` (checkpoint RHF migration) building on the shared form kit; `src/components/admin/*Form*`, `src/lib/checkpoint-form.ts`, `src/components/form/*`
- **Related:** `CONTEXT.md` (Form field) · `docs/logic-map.md` §6.4 · architecture review (candidate D is the remaining admin-form gap)

## Context

The checkpoint create/edit forms were hand-rolled controlled state: per-field `useState`, FormData parsing on submit, manual mapping of server `details` onto inputs, and a guide editor holding local state **separate** from the form. Every form re-implemented the same register → validate → display loop, server-error mapping drifted between forms, and guide edits could be lost relative to the rest of the form.

## Decision

Migrate the **checkpoint create, checkpoint edit, and guide editor** to react-hook-form (react-hook-form + Zod, one `FormProvider` per form page):

- **Shared field primitives** (`src/components/form/*`) register through RHF; error precedence is always `serverError ?? peekErrors(...)`; "error replaces hint".
- **String-typed values** — numeric/enum fields stay strings in `FormValues` (what the DOM yields; no `valueAsNumber`). Coercion happens once, in the existing field readers; a thin **transform-resolver wrapper** (`createCheckpointFormSchema` / `updateCheckpointFormSchema`) runs the *real* API schema and re-attaches its issues at their original dotted paths (`vi.name`, `latitude`, …) so RHF can display them inline. The update wrapper re-binds `id`/`slug` after validation (the API schema would strip them).
- **One source for guide content** — `GuideSection` registers `guide.{locale}.content` through the page's `FormProvider` and derives its live preview from `useWatch`: no local state, and the hidden `contentType` input is gone (field readers always emit `"HTML"`).
- **Server errors split by shape** — `details` whose root has a registered input (`isCheckpointFormPath`) are mirrored with `setError`; the rest (`guides.*`, general) surface only via the toast, deduped to the **first message per field**.
- **Stops stay controlled** — `StopsEditor` takes `value`/`onChange`: the tour **create** form bridges it into RHF (`register`/`watch`), while the tour **edit** form keeps plain component state. Parity was scoped to checkpoints + the guide panel; the tour forms were deliberately **not** migrated.

## Consequences

- One register/validate/error-display path for every checkpoint field; `defaultValues` seed inputs and the guide preview simultaneously.
- Zod remains the single validation authority — the client resolver and the server `parseAdminBody` execute the same schema objects, so drift is structurally impossible.
- Known cost: one **non-blocking React Compiler warning** on RHF `watch()` usage (accepted; `eslint` exits 0).
- Test surface: `tests/checkpoint-form.test.ts` (resolver payloads, issue-path re-attachment) and `tests/form-peek-errors.test.ts` (dotted-path lookup).
