# Account lifecycle Edge Functions

This directory implements the approved Phase 2 authentication and
account-lifecycle boundary. Browser code never receives a Supabase server key,
cannot call Auth Admin directly, and cannot execute the account-lifecycle
prepare/finalize RPCs. Edge authenticates the bearer token, then Postgres
revalidates the supplied actor UUID through server-key-only functions.

## Functions

- `bootstrap_first_admin` uses a deployment-held one-time secret. It creates the
  first Manager + Admin account and can perform the single audited credential
  recovery allowed when the original response is lost.
- `create_member_account` creates and confirms one Auth user, then atomically
  creates its restricted application profile.
- `issue_temporary_password_reset` restricts the profile before rotating the
  Auth password and auditing completion.
- `deactivate_member_account` applies database denial and reassignment effects
  before banning the Auth user.
- `reactivate_member_account` unbans Auth before atomically restoring
  application access.
- `change_own_password` changes the caller's Auth password before clearing the
  mandatory password restriction.

Every mutation accepts a caller-stable `operationId`. Temporary passwords are
generated in the Edge runtime, returned only on the first completed response,
and never sent to Postgres, written to audit, or logged.

## Local runtime

Copy `supabase/functions/.env.example` to the ignored
`supabase/functions/.env.local`, replace the bootstrap values, then run:

```sh
npx supabase functions serve --env-file supabase/functions/.env.local
```

Local Supabase injects its URL and legacy keys. Hosted Supabase supplies modern
publishable and secret keys through the `SUPABASE_PUBLISHABLE_KEYS` and
`SUPABASE_SECRET_KEYS` JSON dictionaries; the runtime prefers their `default`
entries and retains the legacy keys only as a local-development fallback. Modern
secret keys are sent only in the `apikey` header. `DESIGN_FLOW_ALLOWED_ORIGINS`
is a comma-separated exact allowlist.

The initial bootstrap request is a POST to `/functions/v1/bootstrap_first_admin`
with the `x-design-flow-bootstrap-secret` header and this body:

```json
{
  "displayName": "First Admin",
  "email": "first-admin@design-flow.example.invalid",
  "timezone": "Africa/Cairo",
  "operationId": "caller-generated-uuid"
}
```

If that successful response is lost before the temporary password is recorded,
the operator may submit one new operation ID with `"recoverCredential": true`.
After operator verification, remove the bootstrap secret from the hosted
function configuration.

Run `npm run functions:check` and `npm run functions:test` before deployment.
Hosted functions must also be exercised in staging against the approved UI brief
before the full Phase 2 exit gate can close.
