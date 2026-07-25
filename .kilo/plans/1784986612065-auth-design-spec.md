# RenterEasy Authentication – Phase 0 Codebase Gap Analysis

**Date:** 2026-07-25  
**Status:** Implementation Readiness Review  
**Scope:** Entire `rentfy` codebase vs. approved separate-identity auth architecture  

---

## 1. Current Authentication Architecture

### 1.1 Login Flow
- **Two entry points exist:** `/login/agency` and `/login/renter`.
- **One legacy hybrid entry point also exists:** `/auth/login/page.tsx` — a "role-select" page that lets a user choose between Agency and Renter at login time.
- **Wrong-portal handling:** None. The `/auth/login` page queries BOTH `agencies` and `renter_profiles` after login to decide whether to redirect to `/dashboard`, `/renter`, or `/workspace`.
- **Session:** Cookie-based via `@supabase/ssr` (`supabase-browser.ts`).
- **Post-login redirects are client-side** and profile-table-dependent, not role-aware.

### 1.2 Signup Flow
- **Two entry points exist:** `/signup/agency` and `/signup/renter`.
- **One legacy hybrid entry point also exists:** `/auth/signup/page.tsx` — a "role-select" page that submits to `supabase.auth.signUp` with `user_metadata.role`.
- **No duplicate-email check** across account types before signup.
- **No application-level role isolation** before profile creation.

### 1.3 Middleware
- File: `proxy.ts`.
- **Route classification:** Agency routes (`/dashboard`, `/profile`, `/admin`), renter routes (`/favorites`, `/visits`, `/renter`), shared auth routes (`/login/*`, `/signup/*`, `/forgot-password`, `/reset-password`, `/verify-email`), public routes (`/`, `/rent`, `/property`).
- **Critical gap:** Unauthenticated users hitting any protected route are **always redirected to `/login/renter`**, regardless of which route they accessed.
- **No wrong-portal blocking** for logged-in users.
- **Legacy redirects:** `/auth/login` and `/auth/signup` → `/login/agency` (hardcoded, not context-aware).

### 1.4 Route Structure
**Agency routes:** `/login/agency`, `/signup/agency`, `/onboarding/agency`, `/dashboard`, `/profile`, `/admin`, `/add-property`, `/edit-property/[id]`.
**Renter routes:** `/login/renter`, `/signup/renter`, `/renter`, `/favorites`, `/visits/*`.
**Legacy/hybrid routes:** `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/workspace`, `/verify-email` (legacy redirect).
**Public routes:** `/`, `/rent/*`, `/property/*`.

### 1.5 Supabase Auth Usage
- `supabase-browser.ts`: `createBrowserClient` — used by all client auth pages.
- `supabase-server.ts`: `createServerClient` — used by server components and API routes.
- `supabase-admin.ts`: `getSupabaseAdmin` — service-role client for admin actions.
- **Auth metadata pattern:** `user_metadata.role` is set during signup (`"agency"` or `"renter"`), but it is **not enforced** anywhere in middleware or helpers.

### 1.6 Database Tables
**Core auth/profile tables:**
- `agencies` — **legacy table** (pre-migration baseline). Still actively used in RLS policies, property pages, admin actions, and signup onboarding.
- `agency_profiles` — **new table** created in migration 0012. Used by `completeAgencyOnboarding` server action and `admin/actions.ts`.
- `renter_profiles` — exists and is used, but has a `preferences_json` column added in 0012 and a new companion table `renter_preferences`.
- `agency_settings`, `agency_subscriptions`, `renter_preferences` — new tables in 0012, no application code references found yet.

**Business tables still referencing `agencies`:**
- `properties` — has `agency_id` (FK to `agencies`). Migration 0013 adds `agency_profile_id` but **does not migrate existing data**.
- `property_images` — RLS policies join `properties` → `agencies`.
- `leads` — RLS policies reference `agencies`.
- `property_visits` — RLS policies reference `agencies`.
- `seo_reports` — RLS policies reference `agencies`.
- `agency_reviews` — references `agencies` (migration 0005).

### 1.7 Profile Handling
- **Server helpers:** `lib/auth.ts` exports `requireUser`, `requireVerifiedAgency`, `requireRenter`.
- **Server actions:** `app/actions.ts` uses `requireVerifiedAgency` for property/lead actions, `requireUser` for lead creation.
- **Admin actions:** `app/admin/actions.ts` queries `agency_profiles` for admin check.
- **Client-side pages:** Many pages (`/dashboard`, `/renter`, `/add-property`, login/signup pages) query profile tables directly from the browser client.

---

## 2. Architecture Comparison

| Aspect | Current (Actual) | Approved Architecture (PRD/Design) | Gap |
|--------|------------------|------------------------------------|-----|
| **Account model** | Hybrid workspace concept exists (`/workspace`, `lib/workspace.ts`). Users can theoretically have both agency and renter profiles. | Strict one-email-one-type separation. No hybrid users, no workspace switching. | **CRITICAL** — Hybrid paths must be removed. |
| **Login** | `/auth/login` offers role selection. `/login/agency` and `/login/renter` exist but have no wrong-portal enforcement. | Separate, isolated portals. Wrong-portal access blocked. | **HIGH** — Remove `/auth/login`, add wrong-portal redirects. |
| **Signup** | `/auth/signup` offers role selection. `/signup/agency` and `/signup/renter` exist but no duplicate-email check. | Separate portals, pre-check for cross-type email collision. | **HIGH** — Remove `/auth/signup`, add duplicate-email guard. |
| **Post-login routing** | Client-side `getUserCapabilities` checks BOTH agency and renter tables to decide redirect. | Role-aware server/middleware routing. No cross-role querying. | **HIGH** — Eliminate dual-role queries from client. |
| **Session validation** | `requireUser` checks auth + email confirmation. No role validation in middleware. | Middleware + server helpers enforce role per route. | **MEDIUM** — Add role checks to proxy + helpers. |
| **Unauthenticated redirect** | Defaults to `/login/renter` for ALL routes. | Context-aware: agency routes → `/login/agency`, renter routes → `/login/renter`. | **HIGH** — Update proxy.ts. |
| **Database tables** | Both `agencies` and `agency_profiles` exist and are actively used. | Single source of truth (`agency_profiles`). `agencies` deprecated. | **HIGH** — Migrate all references. |
| **RLS policies** | Policies split between old names and new names. Some tables still use `agencies` joins. | All policies use `agency_profiles`. | **MEDIUM** — Policy audit needed. |
| **Wrong-portal enforcement** | None in middleware. Client pages only. | Middleware blocks wrong-portal access for logged-in users. | **HIGH** — Add to proxy.ts. |
| **Email uniqueness** | Not enforced at application level. Supabase handles auth uniqueness but cross-type check is missing. | Explicit pre-signup check against both profile tables. | **HIGH** — Add to signup flow. |
| **Agency approval** | `/dashboard` renders pending UI if `verified=false`. No route-level block. | `/dashboard` and sub-routes require `verified=true`. | **MEDIUM** — Add route-level enforcement. |
| **Renter page** | Queries `agency_profiles` and redirects to `/dashboard` if found. | Never queries agency tables. | **CRITICAL** — Must be removed. |
| **Workspace** | `/workspace` + cookie + sessionStorage for choosing between agency/renter. | No workspace concept. | **CRITICAL** — Must be deleted. |
| **Property pages** | Query `agencies` table directly. | Query `agency_profiles`. | **HIGH** — Update property pages and related queries. |
| **API routes** | `/api/renters/profile` explicitly documents "dual-capability architecture" and uses service role to write. | No dual-capability. RLS-enforced inserts. | **HIGH** — Refactor API to trusted JWT inserts. |
| **Admin actions** | `admin/actions.ts` uses `agency_profiles` — correct. | Same. | ✅ OK. |
| **Server actions** | `completeAgencyOnboarding` uses `agency_profiles` + RLS — correct. `createProperty`, `updateLeadStatus` use `requireVerifiedAgency` — correct. | Same pattern. | ✅ OK. |

---

## 3. Files to Keep

| File | Reason |
|------|--------|
| `app/login/agency/page.tsx` | Dedicated agency login — required. Needs minor UX cleanup (remove client-side role query). |
| `app/login/renter/page.tsx` | Dedicated renter login — required. Same minor cleanup. |
| `app/signup/agency/page.tsx` | Dedicated agency signup — required. Needs duplicate-email guard added. |
| `app/signup/renter/page.tsx` | Dedicated renter signup — required. Same guard. |
| `app/dashboard/page.tsx` | Agency dashboard. Uses `requireUser` + manual agency lookup. Works if helpers are aligned. |
| `app/onboarding/agency/page.tsx` | Agency onboarding — required. Correctly uses `requireUser`. |
| `app/profile/page.tsx` | Agency profile editing — required. Agency-only. |
| `app/admin/page.tsx` | Admin dashboard — required. Uses `requireUser` + `is_admin` check. |
| `app/actions.ts` | Server actions for properties/leads/profile updates. Mostly correct. Needs minor cleanup. |
| `app/admin/actions.ts` | Admin actions — correct. Uses `requireUser` + admin check + service role. |
| `app/verify-email/page.tsx` | Shared verification page. Works for both roles if redirects are fixed. |
| `app/auth/forgot-password/page.tsx` | Shared password reset request. Needs link correction. |
| `app/auth/reset-password/page.tsx` | Shared password reset completion. Needs link correction. |
| `lib/auth.ts` | Core auth helpers. Already has `requireUser`, `requireVerifiedAgency`, `requireRenter`. |
| `lib/supabase-browser.ts` | Client Supabase client — keep. |
| `lib/supabase-server.ts` | Server Supabase client — keep. |
| `lib/supabase-admin.ts` | Admin service-role client — keep. |
| `app/api/renters/favorites/route.ts` | Renter-only API. Correctly uses RLS + renter_profiles lookup. |
| `app/api/visits/route.ts` | Renter/agency visits API — needs audit against `agency_profiles`. |
| `app/property/[id]/page.tsx` | Public property page — needs `agencies` → `agency_profiles` update. |
| `app/__tests__/auth-flow.test.tsx` | Auth tests — needs updates for new routes and removed hybrid paths. |
| `next.config.ts` | Security headers — keep as-is. |
| `proxy.ts` | Middleware — requires significant updates but file is kept. |

---

## 4. Files to Modify

| File | Reason for Modification | Priority | Complexity |
|------|------------------------|----------|------------|
| **`proxy.ts`** | Make unauthenticated redirect role-aware by route. Add wrong-portal blocking for logged-in users. Remove legacy `/auth/*` references. | **P0** | Medium |
| **`app/renter/page.tsx`** | **CRITICAL:** Remove `agency_profiles` existence check and redirect to `/dashboard`. Renter surface must never touch agency tables. | **P0** | Low |
| **`app/login/agency/page.tsx`** | Remove client-side cross-role query. Ensure post-login redirect uses `agency_profiles` only. | **High** | Low |
| **`app/login/renter/page.tsx`** | Remove client-side cross-role query. Ensure post-login redirect uses `renter_profiles` only. | **High** | Low |
| **`app/signup/agency/page.tsx`** | Add pre-submit duplicate-email check against `agency_profiles` and `renter_profiles`. | **High** | Medium |
| **`app/signup/renter/page.tsx`** | Same duplicate-email check. | **High** | Medium |
| **`app/auth/forgot-password/page.tsx`** | Remove hardcoded `/login/renter` link. Make role-agnostic or context-aware. | **Medium** | Low |
| **`app/auth/reset-password/page.tsx`** | Same: remove hardcoded `/login/renter` redirect. | **Medium** | Low |
| **`app/auth/verify-email/page.tsx`** | Remove hardcoded `/login/renter` and `/signup/renter` fallback links. Make role-aware. | **Medium** | Medium |
| **`app/verify-email/page.tsx`** | Legacy redirect to `/verify-email` — can keep as redirect or delete. | **Low** | Low |
| **`app/property/[id]/page.tsx`** | Replace `agencies` table query with `agency_profiles`. | **High** | Medium |
| **`app/api/renters/profile/route.ts`** | Remove dual-capability language. Remove service-role bypass. Use RLS + JWT-derived identity. | **High** | Medium |
| **`app/api/visits/route.ts`** | Audit and replace any `agencies` references with `agency_profiles`. | **Medium** | Medium |
| **`lib/auth.ts`** | Ensure `requireVerifiedAgency` uses `agency_profiles`. No changes needed to `requireRenter`. | **Low** | Low |
| **`app/actions.ts`** | Update `createLead` and any other action that queries `renter_profiles` or `agencies` to use the correct table. | **Medium** | Low |
| **`app/admin/page.tsx`** | Update any queries to use `agency_profiles` instead of `agencies`. | **Medium** | Low |
| **`app/__tests__/auth-flow.test.tsx`** | Update tests for removed hybrid pages, new wrong-portal behavior, and new redirect logic. | **High** | Medium |
| **`app/__tests__/onboarding.test.ts`** | Ensure tests reference `agency_profiles` consistently. | **Low** | Low |

---

## 5. Files to Delete

| File | Reason for Deletion |
|------|---------------------|
| **`app/workspace/page.tsx`** | Hybrid workspace chooser. Violates PRD rule: "no hybrid users, no shared dashboards, no role switching." |
| **`app/workspace/WorkspaceChoice.tsx`** | Client component for workspace chooser. Part of hybrid concept. |
| **`lib/workspace.ts`** | `getUserCapabilities` is the implementation of the hybrid capability detection. PRD prohibits any user having both roles. |
| **`app/auth/login/page.tsx`** | Legacy hybrid login with role select. Replaced by dedicated `/login/agency` and `/login/renter`. |
| **`app/auth/signup/page.tsx`** | Legacy hybrid signup with role select. Replaced by dedicated `/signup/agency` and `/signup/renter`. |
| **`app/login/page.tsx`** | Redirect-only wrapper to `/login/agency`. Unnecessary once legacy routes are removed. |
| **`app/signup/page.tsx`** | Redirect-only wrapper to `/signup/agency`. Unnecessary once legacy routes are removed. |

> **Note on `/verify-email/page.tsx`:** This is already a redirect stub. Keep it temporarily as a canonical redirect target from old emails, but remove from middleware matcher once migration is complete.

---

## 6. New Files Required

| New File | Purpose |
|----------|---------|
| **`lib/validation.ts`** (or similar) | Shared validation utilities for email uniqueness checks, phone validation, password strength. Can be extracted from existing inline validators. |
| **`lib/email-uniqueness.ts`** | Pre-signup check: queries both `agency_profiles` and `renter_profiles` for a given email. Returns conflict type or null. |
| **`app/actions/auth.ts`** (optional alternative to client-side auth) | If chosen: Server Actions for `agencySignup`, `renterSignup`, `agencyLogin`, `renterLogin`, `resendVerification`. Centralizes auth mutation logic. |
| **`middleware.test.ts`** (if adding middleware tests) | Unit tests for proxy.ts redirect logic. |
| **`app/__tests__/wrong-portal.test.tsx`** | E2E/unit tests for wrong-portal blocking. |
| **`app/__tests__/duplicate-email.test.tsx`** | Tests for cross-type email collision prevention. |

> **No new database files required.** Existing migration 0012 already creates the required schema. Migration 0013 is a backward-compat bridge that should be superseded by a clean migration once `agencies` table references are removed.

---

## 7. Database Changes

### 7.1 Current Schema
- **`agencies`** — LEGACY primary agency table. Used by: properties (FK `agency_id`), RLS policies, property pages, admin actions, onboarding.
- **`agency_profiles`** — NEW agency table. Used by: `completeAgencyOnboarding`, admin actions, `requireVerifiedAgency`.
- **`renter_profiles`** — Active renter table. Correctly structured.
- **`agency_settings`**, **`agency_subscriptions`**, **`renter_preferences`** — Created in 0012 but no application code references.
- **`properties.agency_id`** — FK to `agencies`. Migration 0013 adds `agency_profile_id` but **does not migrate data**.

### 7.2 Approved Schema
- Single agency table: `agency_profiles`.
- Properties reference `agency_profiles.id`.
- All RLS policies use `agency_profiles`.
- No `agencies` table in production.

### 7.3 Changes

| Action | Object | Detail |
|--------|--------|--------|
| **Keep** | `agency_profiles` | Primary agency table. |
| **Keep** | `renter_profiles` | Primary renter table. |
| **Keep** | `renter_favorites`, `renter_preferences` | Renter feature tables. |
| **Keep** | `agency_settings`, `agency_subscriptions` | Agency feature tables. |
| **Modify** | `properties.agency_id` | Add migration to backfill `agency_profile_id` from `agencies` → `agency_profiles`. Then deprecate `agency_id`. |
| **Modify** | All RLS policies on `properties`, `property_images`, `leads`, `property_visits`, `seo_reports` | Replace every `agencies` reference with `agency_profiles`. |
| **Remove** | `agencies` table | After all data is migrated to `agency_profiles` and all code references are gone. |
| **Remove** | `agency_reviews` table | Migration 0005 created it; zero code references per migration 0011. Safe to drop. |
| **Modify** | `renter_profiles.preferences_json` | Already added in 0012. Ensure app code uses it. |
| **Create** | Auth audit table (optional) | `auth_audit_events` for signup, login, logout, approval, rejection, suspension. |

> **Migration sequence:** Keep `agencies` table through the code-migration phase. After all files are updated and tested, create a single migration that:
> 1. Backfills `properties.agency_profile_id`.
> 2. Drops `agency_reviews`.
> 3. Renames/drops `agencies` (only after confirming zero dependencies).

---

## 8. Route Changes

### 8.1 Current Routes

| Route | Status | Notes |
|-------|--------|-------|
| `/login/agency` | ✅ Keep | Agency login |
| `/login/renter` | ✅ Keep | Renter login |
| `/signup/agency` | ✅ Keep | Agency signup |
| `/signup/renter` | ✅ Keep | Renter signup |
| `/auth/login` | ❌ Remove | Hybrid role-select login |
| `/auth/signup` | ❌ Remove | Hybrid role-select signup |
| `/auth/forgot-password` | ⚠️ Keep but rewrite | Shared, but fix links |
| `/auth/reset-password` | ⚠️ Keep but rewrite | Shared, but fix redirects |
| `/auth/verify-email` | ⚠️ Keep but rewrite | Shared, but fix links |
| `/verify-email` | ⚠️ Redirect stub | Keep as redirect, remove from matcher eventually |
| `/dashboard` | ✅ Keep | Agency dashboard |
| `/dashboard/*` | ✅ Keep | Agency routes |
| `/profile` | ✅ Keep | Agency profile |
| `/admin` | ✅ Keep | Admin dashboard |
| `/admin/*` | ✅ Keep | Admin routes |
| `/renter` | ✅ Keep | Renter dashboard |
| `/favorites` | ✅ Keep | Renter favorites |
| `/visits` | ✅ Keep | Renter visits |
| `/workspace` | ❌ Remove | Hybrid workspace chooser |
| `/onboarding/agency` | ✅ Keep | Agency onboarding |
| `/add-property` | ✅ Keep | Agency property creation |
| `/edit-property/[id]` | ✅ Keep | Agency property editing |
| `/rent/*` | ✅ Keep | Public property search |
| `/property/[id]` | ✅ Keep | Public property detail |

### 8.2 New Redirects
- `/auth/login` → `/login/agency` (temporary, for old links)
- `/auth/signup` → `/signup/agency` (temporary)
- `/workspace` → `/` or role-appropriate dashboard

---

## 9. Middleware Changes

### 9.1 Current Middleware Behavior
- **Route matching:** Hardcoded array of protected routes.
- **Unauthenticated redirect:** Always → `/login/renter`.
- **Unverified email redirect:** → `/verify-email`.
- **Wrong-portal blocking:** None.
- **Legacy route handling:** Redirects `/auth/login` and `/auth/signup` to `/login/agency`.

### 9.2 Required Middleware Behavior

| Behavior | Current | Required |
|----------|---------|----------|
| **Unauthenticated redirect** | Always `/login/renter` | Role-aware: agency routes → `/login/agency`, renter routes → `/login/renter` |
| **Wrong-portal blocking** | None | Logged-in agency on renter route → redirect to `/dashboard`. Logged-in renter on agency route → redirect to `/renter`. |
| **Legacy route cleanup** | Hardcoded redirects | Remove `/auth/login`, `/auth/signup` from matcher after redirects are no longer needed |
| **Agency approval gate** | Not in middleware | `/dashboard/*` must verify `verified=true`. Redirect unverified agencies to `/onboarding/agency`. |
| **Email verification** | Exists | Keep: unverified → `/verify-email` |

### 9.3 Missing Logic
1. Context-aware unauthenticated redirects.
2. Wrong-portal enforcement for authenticated users.
3. Agency approval gate at route level.

---

## 10. Authentication Flow Changes

### 10.1 Agency Signup
**Current:**
1. User fills form on `/signup/agency`.
2. Client calls `supabase.auth.signUp` with `user_metadata.role: "agency"`.
3. Supabase sends verification email.
4. User clicks link → `/verify-email?code=...`.
5. Email confirmed → user redirected to `/onboarding/agency` (client-side).
6. User fills onboarding form → `completeAgencyOnboarding` creates `agency_profiles` row.
7. Admin approves → `verified=true`.

**Required changes:**
- Add pre-signup duplicate-email check (Step 2).
- Ensure post-verification redirect goes to `/onboarding/agency` without client-side role querying.
- No hybrid fallback.

### 10.2 Agency Login
**Current:**
1. User fills form on `/login/agency`.
2. Client calls `signInWithPassword`.
3. Client queries `agency_profiles` to decide redirect: dashboard, onboarding, or `/dashboard` pending.

**Required changes:**
- Remove client-side cross-role querying.
- Redirect decisions should use role-specific helpers or context-aware middleware.

### 10.3 Renter Signup
**Current:**
1. User fills form on `/signup/renter`.
2. Client calls `supabase.auth.signUp` with `user_metadata.role: "renter"`.
3. Supabase sends verification email.
4. Email confirmed → client redirects to `/renter`.
5. No explicit profile creation step (fallback API exists at `/api/renters/profile`).

**Required changes:**
- Add pre-signup duplicate-email check.
- Ensure profile creation path is clear and role-isolated.

### 10.4 Renter Login
**Current:**
1. User fills form on `/login/renter`.
2. Client calls `signInWithPassword`.
3. Client queries `renter_profiles` to decide redirect.

**Required changes:**
- Remove any client-side agency table lookups.

### 10.5 Wrong Portal Login
**Current:**
- Not enforced. `/auth/login` allows a renter to log in as agency by selecting the role.

**Required:**
- Remove `/auth/login`.
- Middleware must redirect wrong-portal attempts.

### 10.6 Duplicate Email
**Current:**
- Not checked. Supabase auth uniqueness prevents same-email signup twice under the same auth system, but cross-type (agency vs. renter) is not prevented.

**Required:**
- Application-level check before signup on both `agency_profiles` and `renter_profiles`.

### 10.7 Verification Expired / Invalid Token
**Current:**
- Supabase Auth handles expiration natively.
- Client pages show generic "verification failed" or "expired" states.

**Required:**
- Keep existing flow. Ensure all auth pages link to correct role-appropriate login.

### 10.8 Password Reset
**Current:**
- `/forgot-password` → reset email sent.
- `/reset-password` → client-side `updateUser`.
- Hardcoded links to `/login/renter`.

**Required:**
- Fix all hardcoded login links to be role-agnostic or context-aware.

### 10.9 Logout
**Current:**
- Not explicitly found in inspected pages. Supabase handles via `signOut`.

**Required:**
- Ensure logout invalidates session and redirects to appropriate portal or home.

### 10.10 Agency Approval / Rejection / Suspension
**Current:**
- Admin actions (`verifyAgency`, `unverifyAgency`) exist and work on `agency_profiles`.
- `/dashboard` shows pending UI if unverified.
- No explicit rejection or suspension actions found.

**Required:**
- Add rejection and suspension actions if not present.
- Ensure middleware blocks unverified/suspended agencies from `/dashboard/*`.

---

## 11. Risk Analysis

### 11.1 Breaking Changes
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Removing `/auth/login` and `/auth/signup`** | High — these are existing entry points. | Soft redirects for one release cycle. Update nav links. |
| **Deleting `/workspace`** | High — users with hybrid accounts will break. | Product has not launched; no real users affected yet. |
| **Dropping `agencies` table** | High — all FK references break. | Migrate data first, update all queries, then drop in a separate migration after code deploy. |
| **Changing `properties.agency_id` → `agency_profile_id`** | High — property pages, RLS, and actions all reference `agency_id`. | Backfill column first, update code incrementally, deprecate old column. |

### 11.2 Migration Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Data migration from `agencies` to `agency_profiles`** | Medium — data loss if FK relationships break. | Run migration 0013-style backfill in a controlled migration with transaction. |
| **Mixed-role users in development data** | Medium — triggers will reject new insertions. | Clean dev data before applying isolation triggers. |
| **RLS policy gaps during transition** | High — unauthorized access possible. | Apply new policies before removing old ones. Use `DROP POLICY IF EXISTS` + `CREATE POLICY` pairs. |

### 11.3 Security Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Wrong-portal access** | Medium — agency accessing renter routes. | Enforce in middleware + server helpers. |
| **Duplicate email accounts** | Medium — user confusion. | Pre-signup check + clear error messaging. |
| **Client-side role queries** | Low — `/renter/page.tsx` currently leaks agency info. | Remove immediately. |
| **Service-role bypass in API** | Medium — `/api/renters/profile` uses admin client. | Replace with RLS-insert pattern. |

### 11.4 Testing Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Incomplete route coverage in tests** | Medium — gaps allow regressions. | Add proxy.ts unit tests, update auth-flow tests. |
| **Client-side auth mocking complexity** | Low — existing tests mock `supabase-browser`. | Maintain mock patterns; add new cases for wrong-portal redirects. |
| **E2E flakiness on auth flows** | Medium — email verification is hard to E2E test. | Use E2E for happy paths only; unit/integration for verification edge cases. |

---

## 12. Sprint Breakdown

### Sprint 1: Foundation & Hybrid Removal
**Objectives:** Eliminate all hybrid concepts and establish strict separation.
**Files affected:**
- Delete: `app/workspace/page.tsx`, `app/workspace/WorkspaceChoice.tsx`, `lib/workspace.ts`, `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`.
- Modify: `app/renter/page.tsx` (remove agency check).
- Modify: `proxy.ts` (remove legacy route references, add wrong-portal blocking skeleton).
- Modify: `app/dashboard/page.tsx` (align with `requireVerifiedAgency`).
- Modify: Navigation components (update nav links to remove workspace, fix auth links).

**Dependencies:** None.
**Definition of Done:**
- No references to `getUserCapabilities`, `WorkspaceChoice`, or `/workspace` remain in active code.
- `/renter` page no longer queries `agency_profiles`.
- All `requireUser` calls on protected agency pages are upgraded to `requireVerifiedAgency`.
- Middleware maps unauthenticated redirects to role-appropriate login portals.

### Sprint 2: Login & Signup Unification
**Objectives:** Make auth flows role-isolated and add duplicate-email prevention.
**Files affected:**
- `app/login/agency/page.tsx` — remove client-side agency/renter dual queries.
- `app/login/renter/page.tsx` — same.
- `app/signup/agency/page.tsx` — add duplicate-email guard.
- `app/signup/renter/page.tsx` — add duplicate-email guard.
- `app/verify-email/page.tsx` — make redirect role-aware.
- `app/auth/verify-email/page.tsx` — same.
- `app/auth/forgot-password/page.tsx` — fix login links.
- `app/auth/reset-password/page.tsx` — fix redirect links.

**Dependencies:** Sprint 1 complete.
**Definition of Done:**
- No client-side auth page queries both `agency_profiles` and `renter_profiles`.
- Duplicate-email error shown when email exists in opposite-role profile table.
- All password-reset and verification links point to correct role contexts.

### Sprint 3: Database & API Reconciliation
**Objectives:** Replace all `agencies` references with `agency_profiles`.
**Files affected:**
- `app/property/[id]/page.tsx` — replace `agencies` table query.
- `app/api/renters/profile/route.ts` — remove dual-capability, use RLS insert.
- `app/api/visits/route.ts` — replace `agencies` joins with `agency_profiles`.
- `app/actions.ts` — audit for `agencies` references.
- `app/admin/page.tsx` — audit for `agencies` references.

**Dependencies:** Sprint 2 complete.
**Definition of Done:**
- Zero code references to `public.agencies` outside of a single migration file.
- All RLS policies verified against `agency_profiles`.
- API routes no longer use service-role bypass for profile creation.

### Sprint 4: Middleware Hardening
**Objectives:** Complete proxy.ts role enforcement.
**Files affected:**
- `proxy.ts` — add wrong-portal blocking, agency approval gate, context-aware redirects.

**Dependencies:** Sprint 1-3 complete.
**Definition of Done:**
- Unauthenticated agency-route access → `/login/agency`.
- Unauthenticated renter-route access → `/login/renter`.
- Logged-in agency on renter route → `/dashboard`.
- Logged-in renter on agency route → `/renter`.
- Unverified agency on `/dashboard` → `/onboarding/agency`.
- No legacy `/auth/*` routes in production matcher.

### Sprint 5: Testing & Documentation
**Objectives:** Validate isolation and update docs.
**Files affected:**
- `app/__tests__/auth-flow.test.tsx` — update for removed routes and new redirects.
- `app/__tests__/onboarding.test.ts` — verify `agency_profiles` references.
- New tests: `middleware.test.ts`, `wrong-portal.test.tsx`, `duplicate-email.test.tsx`.

**Dependencies:** Sprint 4 complete.
**Definition of Done:**
- Unit coverage of `proxy.ts` redirect logic ≥ 90%.
- Integration tests cover wrong-portal blocking and duplicate-email rejection.
- E2E tests cover full agency and renter journeys.
- README/auth docs updated to describe the separated model.

---

## 13. Final Readiness Report

### Is the project ready for implementation?

**YES — with one blocker to resolve first.**

### Blocker
The approved architecture requires the `agencies` table to be fully replaced by `agency_profiles`. Currently, the codebase has **active dual references** to both tables in:
- `proxy.ts` (indirectly, via helpers)
- `app/property/[id]/page.tsx`
- `app/actions.ts`
- `app/admin/page.tsx`
- All RLS policies

**Resolution:** Before Sprint 1 begins, create and apply a **single data migration** that:
1. Backfills `properties.agency_profile_id` from `agencies` → `agency_profiles`.
2. Verifies zero orphaned `agency_id` values.
3. Leaves the `agencies` table in place (do not drop yet) but marks it as deprecated in comments.

This allows Sprint 1 code changes to reference `agency_profiles` safely while the old table still exists as a rollback option.

### Recommended First Implementation Task
**Sprint 1, Task 1:** Delete all hybrid/concept files (`app/workspace/`, `lib/workspace.ts`, legacy `/auth/*` pages) and update `proxy.ts` for role-aware redirects. This is the highest-leverage change because it removes the architectural violation that enables hybrid users and unblocks all subsequent isolation work.

---
*End of Phase 0 Codebase Gap Analysis*
