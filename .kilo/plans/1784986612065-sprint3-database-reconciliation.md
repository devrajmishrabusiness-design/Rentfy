# Sprint 3 — Database Reconciliation Design

## 1. Executive Summary

Sprint 3 eliminates the dual-table (`agencies` + `agency_profiles`) technical debt introduced during Sprint 1–2. The legacy `agencies` table is fully superseded by `agency_profiles` for all application-layer reads, writes, and RLS policies. A dedicated `user_roles` table is introduced as the single authoritative source for role determination, eliminating all cross-role table lookups from login, middleware, verify-email, and navbar code paths.

The migration is **zero-downtime**, **idempotent**, and **fully reversible**. It is split into five phases: create, backfill, switch, validate, and remove. Each phase includes rollback instructions.

---

## 2. Final Recommended Architecture

### Option A: `user_roles` table (RECOMMENDED)

```
user_roles
  auth_user_id  uuid  PK, FK → auth.users(id) ON DELETE CASCADE
  role          text  CHECK (role IN ('agency', 'renter'))
  created_at    timestamptz
  updated_at    timestamptz
```

### Option B: Trusted JWT role claim

Supabase Edge Functions or a `before` trigger on `auth.users` populates `app_metadata.role` server-side. Client code reads `user.app_metadata.role`.

### Comparison

| Criterion | Option A: `user_roles` table | Option B: JWT claim |
|---|---|---|
| **Security** | High — RLS-controlled table; cannot be tampered client-side | High — `app_metadata` is server-controlled |
| **Maintainability** | High — explicit table, easy to query, audit, and extend | Medium — requires trigger/edge function; harder to debug |
| **Performance** | One indexed lookup per auth check | Zero-cost (already in JWT) |
| **Supabase compatibility** | Fully compatible — standard Postgres table with RLS | Compatible — uses `app_metadata` |
| **Migration complexity** | Low — simple INSERT from existing profile tables | Medium — requires trigger on `auth.users` |
| **Long-term scalability** | High — can add role metadata, expiration, etc. | Medium — JWT size limits; harder to revoke |

### Decision: Option A — `user_roles` table

Rationale:
- **Explicit over implicit**: A table is easier to query, audit, and extend than JWT metadata.
- **Lower migration risk**: No trigger on `auth.users` (which requires `SECURITY DEFINER` and careful lifecycle management).
- **Debuggability**: Can inspect `user_roles` directly in SQL; JWT claims require decoding.
- **Extensibility**: Future needs (role expiration, multi-role, role history) are trivial to add.
- **Performance**: The single indexed lookup cost is negligible compared to the network round-trip already required for profile queries.

The `user_roles` table is populated during the backfill phase and maintained via `BEFORE INSERT` triggers on `agency_profiles` and `renter_profiles` (which already enforce role isolation via `check_auth_user_role_isolation`).

---

## 3. Schema Diagram (Text)

```
auth.users (Supabase managed)
  └─ id (uuid, PK)

user_roles  (NEW — single source of truth)
  ├─ auth_user_id  uuid  PK → auth.users(id)
  ├─ role          text  CHECK ('agency' | 'renter')
  ├─ created_at    timestamptz
  └─ updated_at    timestamptz

agency_profiles  (existing — promoted to primary)
  ├─ id            uuid  PK
  ├─ auth_user_id  uuid  UNIQUE → auth.users(id)
  ├─ agency_name   text
  ├─ owner_name    text
  ├─ phone         text
  ├─ city          text
  ├─ email         text
  ├─ verified      boolean
  ├─ is_admin      boolean
  ├─ created_at    timestamptz
  └─ updated_at    timestamptz

renter_profiles  (existing — unchanged)
  ├─ id            uuid  PK
  ├─ user_id       uuid  UNIQUE → auth.users(id)
  ├─ full_name     text
  ├─ phone_number  text
  ├─ preferences_json  jsonb
  ├─ created_at    timestamptz
  └─ updated_at    timestamptz

properties  (MODIFIED — FK changed)
  ├─ id            uuid  PK
  ├─ agency_id     uuid  DEPRECATED (FK → agencies.id) — will be dropped
  ├─ agency_profile_id  uuid  NEW PRIMARY FK → agency_profiles(id)
  └─ ...

property_visits  (MODIFIED — RLS updated)
  ├─ id            uuid  PK
  ├─ property_id   uuid  FK → properties(id)
  ├─ renter_id     uuid  FK → renter_profiles(id)
  └─ ...

leads  (MODIFIED — RLS updated)
  ├─ id            uuid  PK
  ├─ property_id   uuid  FK → properties(id)
  ├─ renter_id     uuid  FK → renter_profiles(id)
  ├─ agency_id     uuid  DEPRECATED — will be dropped
  └─ ...

seo_reports  (MODIFIED — RLS updated)
  ├─ id            uuid  PK
  ├─ property_id   uuid  FK → properties(id)
  └─ ...

agency_reviews  (MODIFIED — FK changed)
  ├─ id            uuid  PK
  ├─ agency_id     uuid  FK → agency_profiles(id)  (was → agencies.id)
  └─ ...

agencies  (DEPRECATED — will be dropped)
  └─ All data migrated to agency_profiles
```

---

## 4. Migration Phases

### Phase 1: Create New Structures

**Goal**: Add `user_roles` table, triggers, and new FK column.

**Actions**:
1. Create `user_roles` table with `auth_user_id`, `role`, `created_at`, `updated_at`.
2. Create unique index on `user_roles.auth_user_id`.
3. Enable RLS on `user_roles`.
4. Create RLS policies:
   - `user_roles_select_own`: authenticated users can read their own role.
   - `user_roles_insert_own`: authenticated users can insert their own role.
5. Create `BEFORE INSERT` trigger on `agency_profiles` that inserts into `user_roles`.
6. Create `BEFORE INSERT` trigger on `renter_profiles` that inserts into `user_roles`.
7. Add `agency_profile_id` column to `properties` (if not already present from migration 0013).
8. Add FK constraint `properties.agency_profile_id → agency_profiles(id)`.
9. Create index `properties_agency_profile_id_idx`.
10. Add `agency_profile_id` column to `leads` (for agency reference).
11. Add `agency_profile_id` column to `property_visits` (for agency reference).

**Rollback**:
- Drop `user_roles` table.
- Drop triggers.
- Drop `agency_profile_id` columns from `properties`, `leads`, `property_visits`.

### Phase 2: Backfill Data

**Goal**: Populate `user_roles` for all existing users and populate `agency_profile_id` on existing rows.

**Actions**:
1. Insert into `user_roles` from `agency_profiles`:
   ```
   INSERT INTO user_roles (auth_user_id, role)
   SELECT auth_user_id, 'agency' FROM agency_profiles
   ON CONFLICT (auth_user_id) DO NOTHING;
   ```
2. Insert into `user_roles` from `renter_profiles`:
   ```
   INSERT INTO user_roles (auth_user_id, role)
   SELECT user_id, 'renter' FROM renter_profiles
   ON CONFLICT (auth_user_id) DO NOTHING;
   ```
3. Populate `properties.agency_profile_id` from existing `agencies` → `agency_profiles`:
   ```
   UPDATE properties p
   SET agency_profile_id = ap.id
   FROM agencies a
   JOIN agency_profiles ap ON ap.auth_user_id = a.auth_user_id
   WHERE p.agency_id = a.id
   AND p.agency_profile_id IS NULL;
   ```
4. Populate `leads.agency_profile_id` from `agencies` → `agency_profiles`.
5. Populate `property_visits.agency_profile_id` via `properties.agency_profile_id`.
6. Update `agency_reviews.agency_id` to reference `agency_profiles.id`.

**Validation**:
- `SELECT COUNT(*) FROM user_roles` should equal count of distinct auth users with profiles.
- `SELECT COUNT(*) FROM properties WHERE agency_profile_id IS NULL` should be 0 (or match count of properties with no agency).
- Check for mixed-role users: `SELECT auth_user_id FROM user_roles GROUP BY auth_user_id HAVING COUNT(*) > 1` should return 0 rows.

**Rollback**:
- `DELETE FROM user_roles;`
- Set `agency_profile_id = NULL` on all rows in `properties`, `leads`, `property_visits`.

### Phase 3: Switch Code

**Goal**: Update all application code to use `agency_profiles` instead of `agencies`, and use `user_roles` for role determination.

**Actions**:
1. **`lib/auth.ts`**: Add `requireRole()` helper that queries `user_roles` instead of both profile tables.
2. **`proxy.ts`**: Replace dual-table query with single `user_roles` lookup.
3. **`app/Navbar.tsx`**: Replace dual-table query with `user_roles` lookup.
4. **`app/login/agency/page.tsx`**: Replace `renter_profiles` check with `user_roles` lookup.
5. **`app/login/renter/page.tsx`**: Replace `agency_profiles` check with `user_roles` lookup.
6. **`app/auth/verify-email/page.tsx`**: Replace dual-table lookup with `user_roles` lookup.
7. **`app/property/[id]/page.tsx`**: Replace `agencies` query with `agency_profiles` query using `agency_profile_id`.
8. **`app/renter/DashboardClient.tsx`**: Replace `agencies` joins with `agency_profiles` joins.
9. **`app/api/properties/similar/route.ts`**: Replace `agencies` join with `agency_profiles` join.
10. **`app/page.tsx`**: Replace `agencies` join with `agency_profiles` join.
11. **`app/dashboard/page.tsx`**: Update visits query to use `agency_profile_id` instead of `agencies.agency_id`.
12. **`app/types.ts`**: Update TypeScript types to use `agency_profiles` instead of `agencies`.
13. **`app/actions.ts`**: Update `createProperty` to use `agency_profile_id` instead of `agency_id`.
14. **`app/admin/page.tsx`**: Already uses `agency_profiles` — verify no `agencies` references remain.
15. **`app/admin/AgencyApprovalQueue.tsx`**: Update to use `agency_profiles` data.
16. **`app/admin/UserManagement.tsx`**: Update to use `agency_profiles` data.
17. **`app/admin/AdminOverview.tsx`**: Update to use `agency_profiles` data.
18. **`app/admin/AdminDashboardClient.tsx`**: Update to use `agency_profiles` data.
19. **`app/renter/EnquiryList.tsx`**: Update `agencies` reference to `agency_profiles`.
20. **`app/renter/VisitList.tsx`**: Update `agencies` reference to `agency_profiles`.
21. **`app/dashboard/VisitManagement.tsx`**: Update `agencies` reference to `agency_profiles`.
22. **`app/api/visits/route.ts`**: Audit and update `agencies` references.
23. **RLS policies**: Replace all `agencies` joins in RLS policies with `agency_profiles` joins.

**Rollback**:
- Revert all code changes to use `agencies` and dual-table lookups.

### Phase 4: Validate

**Goal**: Verify data integrity, test all flows, and confirm no regressions.

**Actions**:
1. Run full test suite — all tests must pass.
2. Run migration validation queries:
   - `SELECT COUNT(*) FROM user_roles WHERE role = 'agency'` matches `agency_profiles` count.
   - `SELECT COUNT(*) FROM user_roles WHERE role = 'renter'` matches `renter_profiles` count.
   - `SELECT COUNT(*) FROM properties WHERE agency_profile_id IS NULL AND agency_id IS NOT NULL` — should be 0 after backfill.
3. Verify no mixed-role users exist.
4. Verify all RLS policies use `agency_profiles` instead of `agencies`.
5. Verify all application code uses `agency_profiles` instead of `agencies`.
6. Run E2E tests for agency login, renter login, property pages, admin panel.
7. Verify wrong-portal detection still works using `user_roles`.
8. Verify verify-email redirects correctly using `user_roles`.

**Rollback**:
- If validation fails, revert Phase 3 code changes and Phase 2 backfill.

### Phase 5: Remove Legacy Objects

**Goal**: Drop `agencies` table and deprecated columns.

**Actions**:
1. Drop `agencies` table (all data already migrated to `agency_profiles`).
2. Drop `properties.agency_id` column (data migrated to `agency_profile_id`).
3. Drop `leads.agency_id` column (if present).
4. Drop `property_visits.agency_id` column (if present).
5. Drop `agency_reviews.agency_id` column and re-add as FK to `agency_profiles.id`.
6. Drop `renter_profiles.migrated_from_user_id` column (from migration 0013).
7. Drop `mixed_role_users` view.
8. Drop `properties_archive` table (if it exists — zero code references).
9. Drop `shared_properties` table (if it exists — zero code references).
10. Drop `agency_reviews` table (if it has zero code references).
11. Run `NOTIFY pgrst, 'reload schema'`.

**Rollback**:
- This phase is irreversible (data is dropped). Rollback requires restoring from backup.
- If issues are found in Phase 4 validation, do NOT proceed to Phase 5.

---

## 5. Risk Analysis

### High Risk

1. **Data loss from dropping `agencies` table**: If backfill is incomplete, dropping `agencies` loses data.
   - Mitigation: Phase 4 validation includes row-count comparison. Phase 5 is only executed after validation passes.

2. **Mixed-role users**: Users with both `agencies` and `renter_profiles` entries.
   - Mitigation: Migration 0013 already flags these in `mixed_role_users` view. Phase 2 backfill uses `ON CONFLICT DO NOTHING` to avoid overwriting. The `check_auth_user_role_isolation` trigger prevents new mixed-role creation.

3. **RLS policy breakage**: Replacing `agencies` joins in RLS policies could break access control.
   - Mitigation: Policies are updated in Phase 3 alongside code changes. All tests must pass before proceeding.

### Medium Risk

4. **Performance degradation**: `user_roles` lookup adds one query per auth check.
   - Mitigation: Indexed lookup is negligible. Can be cached at the application layer if needed.

5. **Trigger failures**: `BEFORE INSERT` triggers on profile tables could fail.
   - Mitigation: Triggers are simple inserts with error handling. Tested in Phase 4.

6. **FK constraint violations**: Changing `properties.agency_id` to `agency_profile_id` could fail if data is inconsistent.
   - Mitigation: Phase 2 backfill populates `agency_profile_id` before any code switches. Phase 4 validation confirms completeness.

### Low Risk

7. **Test coverage gaps**: Some edge cases may not be covered by existing tests.
   - Mitigation: Phase 4 includes E2E tests and manual validation.

8. **Admin panel dependencies**: Admin actions may reference `agencies` directly.
   - Mitigation: Admin actions use service role and are updated in Phase 3.

---

## 6. Rollback Plan

### Phases 1–4: Reversible

If any phase fails before Phase 5:

1. **Revert code changes** (Phase 3): Restore all files to use `agencies` and dual-table lookups.
2. **Revert backfill** (Phase 2): `DELETE FROM user_roles;` and set `agency_profile_id = NULL` on all rows.
3. **Revert schema** (Phase 1): Drop `user_roles`, triggers, and new columns.

### Phase 5: Irreversible

Phase 5 drops the `agencies` table and deprecated columns. **No rollback possible** without a database backup.

**Recovery procedure if Phase 5 causes issues**:
1. Restore database from backup taken before Phase 5.
2. Re-run Phase 2 backfill to repopulate `agency_profile_id`.
3. Re-run Phase 3 code changes.

**Prevention**: Phase 5 is only executed after Phase 4 validation passes completely. A backup is taken before Phase 5 begins.

---

## 7. Sprint Breakdown

### Sprint 3A: Schema & Backfill (Phase 1 + Phase 2)
- Create `user_roles` table, triggers, RLS policies
- Backfill `user_roles` from existing profile tables
- Populate `agency_profile_id` on existing rows
- Validate data integrity

### Sprint 3B: Code Migration (Phase 3)
- Update `lib/auth.ts` with `requireRole()` helper
- Update `proxy.ts` middleware to use `user_roles`
- Update login pages to use `user_roles` for wrong-portal detection
- Update verify-email to use `user_roles` for redirects
- Update all property/admin/renter pages to use `agency_profiles`
- Update all RLS policies to use `agency_profiles`
- Update TypeScript types

### Sprint 3C: Validation & Cleanup (Phase 4 + Phase 5)
- Run full test suite
- Run migration validation queries
- Run E2E tests
- Take database backup
- Drop legacy `agencies` table and deprecated columns
- Final validation

---

## 8. Definition of Done

### Phase 1 Complete
- [ ] `user_roles` table created with RLS
- [ ] Triggers on `agency_profiles` and `renter_profiles` insert into `user_roles`
- [ ] `agency_profile_id` column added to `properties`, `leads`, `property_visits`
- [ ] FK constraints and indexes created

### Phase 2 Complete
- [ ] All existing auth users have a `user_roles` entry
- [ ] All existing `properties` rows have `agency_profile_id` populated
- [ ] No mixed-role users in `user_roles`
- [ ] `agency_reviews` references updated to `agency_profiles.id`

### Phase 3 Complete
- [ ] `lib/auth.ts` has `requireRole()` using `user_roles`
- [ ] `proxy.ts` uses `user_roles` — no dual-table queries
- [ ] `app/Navbar.tsx` uses `user_roles` — no dual-table queries
- [ ] Login pages use `user_roles` for wrong-portal detection
- [ ] Verify-email uses `user_roles` for redirects
- [ ] `app/property/[id]/page.tsx` queries `agency_profiles` instead of `agencies`
- [ ] `app/renter/DashboardClient.tsx` uses `agency_profiles` joins
- [ ] `app/api/properties/similar/route.ts` uses `agency_profiles` joins
- [ ] `app/page.tsx` uses `agency_profiles` joins
- [ ] `app/dashboard/page.tsx` uses `agency_profile_id` for visits query
- [ ] `app/actions.ts` uses `agency_profile_id` for property creation
- [ ] All admin pages use `agency_profiles` data
- [ ] All TypeScript types updated
- [ ] All RLS policies use `agency_profiles` instead of `agencies`
- [ ] Zero references to `agencies` table in application code

### Phase 4 Complete
- [ ] Full test suite passes (693+ tests)
- [ ] Migration validation queries return expected results
- [ ] E2E tests pass for all auth flows
- [ ] Wrong-portal detection works correctly
- [ ] Verify-email redirects work correctly
- [ ] Database backup taken

### Phase 5 Complete
- [ ] `agencies` table dropped
- [ ] `properties.agency_id` column dropped
- [ ] `leads.agency_id` column dropped (if applicable)
- [ ] `property_visits.agency_id` column dropped (if applicable)
- [ ] `renter_profiles.migrated_from_user_id` column dropped
- [ ] `mixed_role_users` view dropped
- [ ] `shared_properties` and `properties_archive` dropped (if they exist)
- [ ] `NOTIFY pgrst, 'reload schema'` executed
- [ ] Final test suite run passes

---

## 9. Remaining Sprint 4 Work

The following items are explicitly out of scope for Sprint 3 and deferred:

1. **Property system migration**: `properties.agency_id` → `agency_profile_id` in all client-side queries (Sprint 3B handles this as part of code migration, but full property system audit is ongoing).
2. **Agency approval workflow**: Admin verification of agency accounts (Sprint 4).
3. **Agency onboarding completion**: Post-signup profile completion flow (Sprint 4).
4. **Analytics and reporting**: Admin dashboard analytics using `agency_profiles` (Sprint 4).
5. **Performance optimization**: Query optimization and caching for `user_roles` lookups (Sprint 4).
