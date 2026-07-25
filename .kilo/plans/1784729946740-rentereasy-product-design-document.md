# RenterEasy — Product Design Document (PDD)

**Version:** 1.1  
**Status:** Approved for Implementation  
**Sprint:** 5.1.1 — Product Design Enhancement  
**Brand:** RenterEasy (formerly Rentfy)  
**Date:** 2026-07-23

## Change Log (v1.0 → v1.1)

| Enhancement | Description | Sections Added/Modified |
|-------------|-------------|-------------------------|
| 1 | Property Status Lifecycle | New §8.1, updated §8 table |
| 2 | Lead Pipeline (Sales Funnel) | New §9.1, updated §9 table |
| 3 | Notification System | New §12 |
| 4 | Analytics Foundation | New §13 |
| 5 | Property Media Architecture | New §8.2 |
| 6 | Soft-Delete Strategy | New §14 |
| 7 | Dashboard Activity Feed | New §10.1, §11.1 |
| 8 | Search Foundation Architecture | New §16 |
| 9 | Future AI Layer Architecture | New §18 |
| 10 | Marketplace Expansion Readiness | Updated §19 |
| 11 | Operational Readiness | New §17 |
| 12 | Sprint Roadmap Review | Updated §21 |
| — | Schema Versioning & Migration Strategy | New §4 |
| — | RLS Policy Reference | Appendix C |
| — | Error & Edge-Case Catalog | Appendix D |
| — | Acceptance Criteria Traceability | Appendix E |
| — | Rollout & Feature Flags | Appendix F |
| — | Glossary & Abbreviations | Appendix G |

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [User Personas](#2-user-personas)
3. [Information Architecture](#3-information-architecture)
4. [Schema Versioning & Migration Strategy](#4-schema-versioning--migration-strategy)
5. [Navigation](#5-navigation)
6. [Authentication Flow](#6-authentication-flow)
7. [Homepage](#7-homepage)
8. [Browse Rentals](#8-browse-rentals)
9. [Property Details](#9-property-details)
10. [Agency Dashboard](#10-agency-dashboard)
11. [Renter Dashboard](#11-renter-dashboard)
12. [Admin Panel](#12-admin-panel)
13. [Design System](#13-design-system)
14. [Component Library](#14-component-library)
15. [User Journeys](#15-user-journeys)
16. [Page-by-Page Specification](#16-page-by-page-specification)
17. [Mobile Experience](#17-mobile-experience)
18. [Accessibility](#18-accessibility)
19. [Performance Guidelines](#19-performance-guidelines)
20. [Product Principles](#20-product-principles)
21. [Implementation Roadmap](#21-implementation-roadmap)
22. [Enhancement Details (v1.1)](#22-enhancement-details-v11)
    - 22.1 [Property Status Lifecycle](#221-property-status-lifecycle)
    - 22.2 [Lead Pipeline](#222-lead-pipeline)
    - 22.3 [Notification System](#223-notification-system)
    - 22.4 [Analytics Foundation](#224-analytics-foundation)
    - 22.5 [Property Media Architecture](#225-property-media-architecture)
    - 22.6 [Soft-Delete Strategy](#226-soft-delete-strategy)
    - 22.6 [Dashboard Activity Feed](#227-dashboard-activity-feed)
    - 22.8 [Search Foundation Architecture](#228-search-foundation-architecture)
    - 22.9 [Future AI Layer](#229-future-ai-layer)
    - 22.10 [Marketplace Expansion Readiness](#2210-marketplace-expansion-readiness)
    - 22.11 [Operational Readiness](#2211-operational-readiness)
    - 22.12 [Sprint Roadmap Review](#2212-sprint-roadmap-review)

---

## 1. Product Vision

### Mission
Make renting in Noida & NCR simple, safe, and predictable — for both tenants and verified agencies.

### Value Proposition
- **For Renters:** Browse verified rental homes from ID-checked agencies. Zero brokerage. Direct contact. Save favorites. Schedule visits.
- **For Agencies:** Publish listings to high-intent renters. Manage leads and visits in one dashboard. Get verified badge for trust.
- **For Platform:** Renter-first marketplace. Agencies pay to list; tenants never pay. Marketplace always visible.

### Target Audience
| Segment | Priority | Description |
|---------|----------|-------------|
| Renters (tenants) | Primary | Individuals/families searching for verified rentals in Noida & NCR. Age 22–45. Mobile-first. |
| Agencies (landlords/brokers) | Secondary | Verified real estate agencies managing rental inventory. Need lead management, visit scheduling. |
| Admins | Internal | Platform operations: agency verification, property moderation, analytics, system health. |

### Business Goals
1. **Marketplace liquidity:** 10k+ active listings, 500+ verified agencies within 12 months.
2. **Renter conversion:** 15% of search sessions → lead/enquiry within 30 days.
3. **Agency retention:** 80% of verified agencies publish ≥1 listing/month after onboarding.
4. **Trust metrics:** 4.5+ average agency rating; <2% lead spam rate.
5. **Revenue:** Agency subscription/listing fees cover ops within 18 months.

---

## 2. User Personas

### Visitor (Unauthenticated)
- **Goals:** Browse listings, understand value prop, evaluate areas, contact agency if interested.
- **Frustrations:** Fake listings, hidden brokerage, unresponsive agents, no saved state across sessions.
- **Primary Actions:** Search, filter, view property details, click "Contact Agency" / "Schedule Visit" → triggers auth.
- **Permissions:** Read-only public marketplace. No write actions.

### Renter (Authenticated)
- **Goals:** Find a home, shortlist properties, contact agencies efficiently, schedule visits, track applications.
- **Frustrations:** Repeating contact details, losing track of viewed properties, no visit confirmation, spam calls.
- **Primary Actions:** Save/unsave properties, submit enquiry (lead), schedule visit, view visit history, update profile.
- **Permissions:** Create `renter_favorites`, create `leads`, create `property_visits` (Phase 1), read own profile, write own profile.

### Agency (Authenticated, Verified)
- **Goals:** Publish listings, manage leads, schedule/confirm visits, track performance, maintain verified status.
- **Frustrations:** Low-quality leads, no-show visits, manual follow-up, approval delays.
- **Primary Actions:** Create/edit/delete properties, update lead status, accept/reject/reschedule visits, view analytics.
- **Permissions:** CRUD own `properties` (via server actions), read/write own `leads`, read/write `property_visits` for own properties, read own `agency` row, write `agency` profile.

### Admin (Authenticated, `is_admin=true`)
- **Goals:** Approve agencies, moderate listings, monitor platform health, resolve disputes, view analytics.
- **Frustrations:** No bulk tools, no audit trail, limited visibility into lead-to-close funnel.
- **Primary Actions:** Verify/unverify agencies, approve/reject properties, delete any entity, view all leads/visits, export reports.
- **Permissions:** Full read/write via service-role client on all tables. Audit-logged.

---

## 3. Information Architecture

### Complete Site Map

```
/ (Home)
├── /#hero                  Hero + HeroSearch
├── /#why                   Why RenterEasy
├── /#how                   How It Works
├── /#listings              Featured listings (paginated)
├── /#areas                 Popular sectors
├── /#testimonials          Social proof
├── /#stats                 Platform numbers
├── /#faq                   FAQ
├── /#contact               Contact / Agency signup CTA
├── /rent                   Browse Rentals (dedicated page)
│   ├── /rent/noida         City landing (Noida)
│   │   └── /rent/noida/[sector]   Sector page (e.g., sector-18)
│   └── /rent/[city]        Future: other cities
├── /property/[id]          Property Details
├── /login                  Agency login
├── /signup                 Agency signup (creates auth user only)
├── /verify-email           Email verification landing
├── /onboarding/agency      Agency profile creation (post-verification)
├── /renter                 Renter Dashboard (tabs: Shortlisted | Account)
├── /dashboard              Agency Dashboard
│   ├── /dashboard?page=N   Paginated properties
│   ├── /dashboard/leads    (future tab)
│   ├── /dashboard/visits   (future tab)
│   └── /dashboard/analytics (future tab)
├── /profile                Agency Profile Editor
├── /add-property           Create Property (verified agencies only)
├── /edit-property/[id]     Edit Property (owner only)
├── /seo-report/[propertyId] SEO Analysis (agency only)
├── /admin                  Admin Panel
│   ├── /admin/agencies     Agency queue + management
│   ├── /admin/properties   Property moderation
│   ├── /admin/leads        Lead overview
│   ├── /admin/visits       Visit overview (future)
│   ├── /admin/users        User management (future)
│   ├── /admin/reports      Platform reports (future)
│   └── /admin/health       System health (future)
└── /404                    Not Found
```

### Route Hierarchy & Ownership

| Route | Owner | Auth Required | Role Gate |
|-------|-------|---------------|-----------|
| `/` | Public | No | — |
| `/rent/**` | Public | No | — |
| `/property/[id]` | Public | No | — |
| `/login` | Public | No | — |
| `/signup` | Public | No | — |
| `/verify-email` | Public | No | — |
| `/onboarding/agency` | Agency | Yes | Verified email, no agency row yet |
| `/renter` | Renter | Yes | `renter_profiles` row exists |
| `/dashboard` | Agency | Yes | `agencies` row exists, `verified=true` for full access |
| `/profile` | Agency | Yes | `agencies` row exists |
| `/add-property` | Agency | Yes | `verified=true` |
| `/edit-property/[id]` | Agency | Yes | `verified=true` + ownership |
| `/seo-report/[id]` | Agency | Yes | `verified=true` + ownership |
| `/admin/**` | Admin | Yes | `is_admin=true` |

---

## 4. Schema Versioning & Migration Strategy

### 4.1 Migration Naming & Ordering
- **Prefix:** 4-digit zero-padded sequence (`0012_`, `0013_`, etc.)
- **Naming:** `snake_case` descriptive name (`create_property_visits`, `add_soft_deletes`)
- **Location:** `supabase/migrations/` — applied via Supabase SQL Editor in order
- **Idempotency:** Every migration uses `IF NOT EXISTS` / `DROP ... IF EXISTS` / `CREATE POLICY ... IF NOT EXISTS`

### 4.2 Migration Categories
| Category | Prefix | Examples |
|----------|--------|----------|
| Core schema | `0001–0009` | Tables, columns, indexes, RLS |
| Features | `0010–0049` | Visit scheduling, favorites, reviews |
| Platform | `0050–0079` | Admin audit, soft deletes, notifications |
| Analytics/AI | `0080–0099` | Event tables, ML features |
| Expansion | `0100+` | Multi-city, subscriptions, payments |

### 4.3 Safe Migration Patterns
- **Add column:** `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... DEFAULT ...`
- **Add index:** `CREATE INDEX CONCURRENTLY IF NOT EXISTS ...` (non-blocking)
- **Add RLS policy:** `CREATE POLICY ... ON ... FOR ... USING ...` (idempotent via `IF NOT EXISTS`)
- **Enum extension:** `ALTER TYPE ... ADD VALUE IF NOT EXISTS ...`
- **Data backfill:** Separate migration with `UPDATE ... WHERE ... IS NULL` + `NOT NULL` constraint in later migration

### 4.4 Rollback Strategy
- No automatic rollback — migrations are forward-only
- Reversal: Create new migration with `DROP` / `ALTER ... DROP` / `DELETE FROM`
- Test in `develop` branch Supabase project before `main`

### 4.5 Type Generation
```bash
# After every migration apply:
npx supabase gen types typescript --project-id <id> > app/types.ts
# Commit generated types with migration
```

---

## 5. Navigation

### Design Philosophy
- **Marketplace first:** Public browsing never disappears.
- **Hybrid nav:** Single shared header. Contextual dropdowns based on profile rows.
- **No role switcher:** If a user has both renter + agency profiles, both capability sets appear in profile menu.
- **Dashboard is a tool, not the homepage.**

### Desktop Navigation

| State | Left (Logo + Primary) | Right (Actions) |
|-------|----------------------|-----------------|
| **Visitor** | Home · Browse Rentals · Why · Contact | Login · Sign Up |
| **Renter only** | Home · Browse Rentals · Why · Contact | Profile Dropdown → [Renter Profile, Shortlisted, Sign Out] |
| **Agency only (unverified)** | Home · Browse Rentals · Why · Contact | Dashboard (pending badge) · Profile Dropdown → [Agency Profile, Sign Out] |
| **Agency only (verified)** | Home · Browse Rentals · Why · Contact | Dashboard (verified badge) · Profile Dropdown → [Agency Profile, Sign Out] |
| **Hybrid (renter + agency)** | Home · Browse Rentals · Why · Contact | Profile Dropdown → [Renter Profile, Shortlisted, Dashboard, Agency Profile, Sign Out] |
| **Admin** | Home · Browse Rentals · Why · Contact | Admin Panel · Profile Dropdown → [Dashboard, Agency Profile, Sign Out] |

**Visual Details:**
- Logo: `RenterEasy` wordmark, links to `/`
- Primary links: `text-sm font-semibold text-[var(--brand-muted)] hover:text-[var(--brand-primary)]`
- Dashboard button (verified): `bg-orange-50 text-[var(--brand-primary)]` with green dot + "Verified" pill
- Dashboard button (unverified): `border border-[var(--brand-border)]` no badge
- Profile dropdown: `absolute right-0 mt-2 w-56 rounded-2xl border bg-white shadow-lg`

### Mobile Navigation
- **Hamburger menu** (MobileMenu component) slides from right
- Contains: Primary nav links + Profile section (conditional)
- Profile section shows contextual links based on `isRenter` / `isAgency` / `isVerifiedAgency`
- Bottom sheet style on mobile, full-screen overlay
- Touch-friendly: 48px minimum tap targets
- Backdrop blur + `animate-slide-in-right`

### Authenticated Navigation Differences
| Capability | Visitor | Renter | Agency (unverified) | Agency (verified) | Admin |
|------------|---------|--------|---------------------|-------------------|-------|
| Home | ✓ | ✓ | ✓ | ✓ | ✓ |
| Browse Rentals | ✓ | ✓ | ✓ | ✓ | ✓ |
| Property Detail | ✓ | ✓ | ✓ | ✓ | ✓ |
| Save Property | ✗ | ✓ | ✗ | ✗ | ✗ |
| Contact Agency | → login | ✓ | → dashboard | ✓ | ✓ |
| Schedule Visit | → login | ✓ (Phase 1) | → dashboard | ✓ | ✓ |
| Dashboard | ✗ | ✗ | ✓ (pending view) | ✓ (full) | ✓ |
| Add Property | ✗ | ✗ | ✗ | ✓ | ✓ |
| Admin Panel | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 5. Authentication Flow

### Complete Flow Diagram

```
Visitor
  │
  ├─► /login (Agency)
  │     ├─► Email + Password
  │     ├─► Supabase signInWithPassword
  │     ├─► email_confirmed_at? ──No──► /verify-email (resend, wait)
  │     │                              │
  │     │                              └─► Click link ──► /login (auto-redirect)
  │     │
  │     └─► Yes ──► agencies row exists?
  │                ├─► No  ──► /onboarding/agency (create profile)
  │                └─► Yes ──► verified?
  │                       ├─► No  ──► /dashboard (pending view)
  │                       └─► Yes ──► /dashboard (full)
  │
  ├─► /signup (Agency)
  │     ├─► Email + Password
  │     ├─► Supabase signUp (emailRedirectTo: /verify-email)
  │     ├─► /signup shows "Check your inbox"
  │     ├─► User clicks email link ──► /verify-email
  │     ├─► /verify-email: "Email confirmed. Sign in to continue."
  │     └─► /login ──► /onboarding/agency
  │
  └─► Property CTA (Contact / Schedule Visit) ──► RenterAuthDialog
        ├─► Mode: Sign In
        │     ├─► Email + Password
        │     ├─► Supabase signInWithPassword
        │     ├─► email_confirmed_at? ──No──► Notice: "Verify email first"
        │     │                              └─► Resend / Go to /verify-email
        │     └─► Yes ──► renter_profiles exists?
        │            ├─► No ──► Auto-create from user_metadata
        │            └─► Yes ──► Refresh session → close dialog → router.refresh()
        │
        └─► Mode: Create Account
              ├─► Full Name + Phone + Email + Password
              ├─► Supabase signUp (role: "renter", metadata: name, phone)
              ├─► email_confirmed_at? ──No (dev auto-confirm)──► Sign out, force sign-in path
              │                              └─► Notice: "Check email, then sign in"
              ├─► Yes ──► Insert renter_profiles (user_id, full_name, phone_number)
              ├─► Refresh session → close dialog → router.refresh()
              └─► Immediate: can Save Property, Contact Agency, Schedule Visit
```

### Session Handling
- **Server:** `requireUser()` checks `auth.getUser()` + `email_confirmed_at`. Cached per request.
- **Client:** `RenterSessionProvider` maintains `profile`, `session`, `isLoading`. `refreshProfile()` re-fetches.
- **Expiration UX:** `sessionStorage.setItem('rentfy.sessionExpired', '1')` on 401; `/login` reads flag → shows friendly notice.
- **Logout:** `LogoutButton` → `supabase.auth.signOut()` → `router.refresh()` → redirect `/`.

### Forgot Password
- `/login` → "Forgot password?" → Supabase `resetPasswordForEmail` with `redirectTo: /reset-password`
- `/reset-password` page (not yet built) → `updatePassword` → redirect `/login` with success toast.

### Email Verification
- **Signup:** `emailRedirectTo: ${origin}/verify-email`
- **Login:** If `!user.email_confirmed_at` → redirect `/verify-email`
- **/verify-email page:** Handles hash params, shows success/error, "Resend" button, "Go to sign in"

### Renter Auto-Create Guard (Dev Mode)
- If Supabase `CONFIRM_EMAIL=false` (dev), signUp returns session without `email_confirmed_at`.
- `RenterAuthDialog` detects this: `if (!data.user.email_confirmed_at) { await signOut(); show notice; }`
- Forces renter through sign-in path which checks `email_confirmed_at` before profile creation.

---

## 6. Homepage

*Current implementation exists at `app/page.tsx`. The PDD codifies and extends it.*

### Section Specifications

| Section | Purpose | Content | CTA | Expected Action | Priority | Layout |
|---------|---------|---------|-----|-----------------|----------|--------|
| **Hero** | Immediate value prop + search entry | Headline, subhead, trust badge, dual CTA, HeroSearch, 3 stat pills, featured property image | "Browse listings" / "List as agency" | Click → scroll to listings / signup | P0 | Split: 55% copy, 45% visual. Mobile: stacked. |
| **Trust Strip** | Reinforce differentiators | 4 icon+label pills: Verified agencies, Zero brokerage, Direct chat, 24h review | None | Scan trust signals | P0 | 4-col grid, mobile 2-col |
| **Why RenterEasy** | Explain benefits | 4 benefit cards: Verified, Safe, Simple, Local | None | Read, build confidence | P1 | 4-col cards, mobile 1-col |
| **How It Works** | Set expectations | 3 steps: Search → Review → Connect | "List as agency" (secondary) | Understand flow | P1 | 3-col cards with step numbers |
| **Listings** | Show live inventory | PropertyList grid (paginated), pagination controls | Property cards → /property/[id] | Browse, click detail | P0 | Responsive grid: 1/2/3 cols |
| **Popular Areas** | SEO + navigation | 6 sector links (Noida) with icons | Sector links → /rent/noida/[sector] | Navigate to area | P1 | 3-col link cards |
| **Testimonials** | Social proof | 3 cards: tenant, agency, tenant | None | Build trust | P2 | 3-col cards, 5-star rating |
| **Numbers** | Authority | 4 large stats: Active rentals, Verified %, 24h approval, 10k+ searches | None | Credibility | P1 | 4-col on dark brand bg |
| **FAQ** | Reduce support | 4 accordion items + support email | "Contact support" mailto | Self-serve answers | P2 | 2-col: left copy, right accordions |
| **Contact** | Agency acquisition | Email, area, "Create agency account" CTA | Signup → /signup | Agency lead gen | P1 | Split: copy + card with CTA |

### HeroSearch Component
- **Fields:** Location (autocomplete), Property Type (select), Bedrooms (select), Max Rent (input)
- **Action:** "Search" → `/rent/noida?location=...&type=...&bedrooms=...&maxRent=...`
- **Mobile:** Full-width stacked fields

---

## 7. Browse Rentals

### Vision
Dedicated `/rent` page as the primary discovery experience. Phase 1 = MVP on current schema. Phase 2/3 = enhanced UX.

### Phase 1 (Launch — MVP

#### Search
- **Query param:** `q` (free text: sector, landmark, property title)
- **Debounced:** 300ms client-side, triggers router.push with searchParams
- **Server:** `listing-query.ts` → `ilike` on `title`, `location`, `city`

#### Filters (sidebar left, collapsible on mobile)
| Filter | Type | DB Column | Values |
|--------|------|-----------|--------|
| City | Select | `city` | Noida (default), future cities |
| Sector | Multi-select | `location` | Dynamic from distinct values |
| Property Type | Multi-select | `property_type` | Apartment, Flat, House, Villa, PG |
| Bedrooms | Select (min) | `bedrooms` | 1, 2, 3, 4, 5+ |
| Bathrooms | Select (min) | `bathrooms` | 1, 2, 3, 4+ |
| Furnishing | Multi-select | `furnishing` | Furnished, Semi-furnished, Unfurnished |
| Parking | Checkbox | `parking` | true |
| Price Range | Dual range slider | `rent` | ₹0 – ₹2,00,000+ |

#### Sorting
- Newest (default: `created_at desc`)
- Rent: Low to High
- Rent: High to Low
- Most Viewed (`views_count desc`)

#### Property Cards
- **Component:** `PropertyCard` (React.memo)
- **Fields:** Hero image, title, rent, location, bedrooms/bathrooms/area badges, furnishing, parking, agency name + verified badge, "Save" heart (renter), "Contact" / "Schedule Visit" CTAs
- **Hover:** Elevate + border brand-primary
- **Skeleton:** `skeleton h-96` shimmer

#### Saved Properties
- Heart icon on card → toggles `renter_favorites` (requires renter auth)
- Persisted across sessions
- Viewable at `/renter` → Shortlisted tab

#### Pagination
- Server-side: `extractPagination` + `toRange` + `respondPaginated`
- URL: `?page=N` (preserves filters)
- Controls: Prev / Page X of Y / Next
- **Future:** Infinite scroll toggle

### Phase 2 — Enhanced Filter UX
- Filter chips showing active filters with ✕ remove
- "Recently viewed" rail (client-side localStorage)
- "Recommended for you" (collaborative filtering, future)
- Compare properties (checkbox on cards → bottom bar → /compare)
- Search suggestions / popular searches autocomplete
- URL shareable filter state (all filters in query params)

### Phase 3 — Map & Intelligence
- **Map toggle:** List ↔ Map (Leaflet/MapLibre, no Google Maps API cost)
- Clustering for dense sectors
- Click cluster → zoom → individual pins
- Pin click → property preview card → click → detail page
- **Saved searches:** Name + alert frequency (daily/weekly) → email/push
- **Commute insights:** Isochrone from workplace (future integration)
- **Neighborhood scores:** Walk, transit, safety (third-party data)
- **AI search:** Natural language "2BHK near Sector 62 metro under 35k, furnished, parking"

---

## 8. Property Details

*Current: `app/property/[id]/page.tsx` — comprehensive. PDD defines complete vision.*

### Phase 1 (Launch)

| Section | Content | Component | Notes |
|---------|---------|-----------|-------|
| **Gallery** | Large hero + thumbnail strip, zoom modal, keyboard nav | `ImageGallery` | Next.js Image priority, blur placeholder |
| **Overview** | Title, rent, deposit, availability, city, location, property_type, bedrooms, bathrooms, area_sqft, furnishing, parking, description | Structured grid + prose | Rent prominent, deposit secondary |
| **Amenities** | Icon grid from `amenities` array (JSONB) | Custom | 12+ standard icons |
| **Agency Card** | Logo, name, verified badge, owner_name, city, phone, email, rating, review count, "View all listings" link | `AgencyCard` | Verified badge prominent |
| **Map** | Static map image (Mapbox static) centered on property coordinates | `<img>` | Phase 2: interactive |
| **Nearby Places** | Static curated list per sector: Metro, Mall, Hospital, School, Market | List with icons + distance | Phase 2: dynamic via Places API |
| **Reviews** | Agency reviews (rating + optional text), average, count, recent 3 | `AgencyReviews` | Phase 1: stars + short text (≤300 chars) |
| **Schedule Visit** | Modal: date picker, time slots (agency-defined), message | `ScheduleVisitModal` | Creates `property_visits` row |
| **Lead Capture** | Modal: pre-filled name/phone from profile, message | `LeadCaptureModal` | Creates `leads` row, notifies agency |
| **SEO Panel** | Score, grade, issues, recommendations (agency only) | `SeoAnalysisPanel` | Hidden from renters |
| **Related Properties** | 3-4 cards: same city/sector, similar rent ±20%, same bedrooms | `PropertyCard` (horizontal) | Excludes current property |
| **Recently Viewed** | Client-side localStorage (last 5), horizontal scroll | `PropertyCard` | Persists 30 days |

### Primary CTAs (Sticky on Mobile)
1. **Contact Agency** → LeadCaptureModal (primary, brand-primary)
2. **Schedule Visit** → ScheduleVisitModal (secondary, brand-secondary)
3. **Save** → Heart icon (tertiary, outline)

### Phase 2
- Interactive map (MapLibre GL)
- Nearby places via Google Places / OpenStreetMap
- Price comparison chart: similar properties rent distribution
- Commute time input → isochrone visualization
- Availability calendar (agency-managed)
- Virtual tour embed (YouTube/Vimeo/360)

### Phase 3
- AI property summary (LLM-generated from description + amenities)
- AI comparison table vs shortlisted properties
- Neighborhood lifestyle score (walk, transit, nightlife, safety)
- Market trends: rent trajectory, vacancy rate, absorption

---

## 8.1 Property Lifecycle (Enhancement 1)

### Complete State Machine

```
Draft
  ↓ (agency submits)
Pending Review
  ↓ (admin approves)
Approved
  ↓ (auto-publish or agency publishes)
Published
  ↓ (renter books + lease signed)
Rented
  ↓ (lease ends or agency marks)
Archived
  ↓ (time-based or manual)
Expired
  ↓ (soft delete)
Deleted
```

### State Definitions & Transitions

| State | Description | Entered By | Can Transition To | Business Rules |
|-------|-------------|------------|-------------------|----------------|
| **Draft** | Agency creating/editing; not visible publicly | Agency (create) | Pending Review | Auto-save; images uploaded to temp bucket; no SEO analysis |
| **Pending Review** | Submitted for admin moderation | Agency (submit) | Approved, Rejected | Admin must act within 24h SLA; agency notified |
| **Approved** | Passed moderation; ready to publish | Admin (approve) | Published | SEO report generated; agency can publish immediately or schedule |
| **Published** | Live on marketplace; visible to renters | Agency (publish) or Auto (config) | Rented, Archived, Expired | Increments `views_count` on visit; lead/visit enabled |
| **Rented** | Lease signed; off-market but retained | Agency (mark rented) | Archived | Lead/visit disabled; shows "Rented" badge; retained for history |
| **Archived** | Off-market; retained for records/analytics | Agency (archive) or Auto (30d after Rented) | Published (reactivate), Expired | Hidden from search; accessible via direct link; SEO retained |
| **Expired** | Auto-transition after `available_from` + 90d without action | System (cron) | Archived, Deleted | Notification sent 7d before; agency can extend |
| **Deleted** | Soft delete; recoverable by admin only | Agency (delete) or Admin | — (terminal) | `deleted_at` timestamp; excluded from all queries; 90-day retention |

### Permission Matrix

| Action | Renter | Agency (owner) | Agency (other) | Admin |
|--------|--------|----------------|----------------|-------|
| View Draft | ✗ | ✓ | ✗ | ✓ |
| View Pending | ✗ | ✓ | ✗ | ✓ |
| View Approved | ✗ | ✓ | ✗ | ✓ |
| View Published | ✓ | ✓ | ✓ | ✓ |
| View Rented | ✗ | ✓ | ✗ | ✓ |
| View Archived | ✗ | ✓ | ✗ | ✓ |
| View Expired | ✗ | ✓ | ✗ | ✓ |
| View Deleted | ✗ | ✗ | ✗ | ✓ |
| Create Draft | ✗ | ✓ | ✗ | ✓ |
| Submit for Review | ✗ | ✓ | ✗ | ✓ |
| Approve/Reject | ✗ | ✗ | ✗ | ✓ |
| Publish | ✗ | ✓ | ✗ | ✓ |
| Mark Rented | ✗ | ✓ | ✗ | ✓ |
| Archive | ✗ | ✓ | ✗ | ✓ |
| Delete (soft) | ✗ | ✓ | ✗ | ✓ |
| Restore | ✗ | ✗ | ✗ | ✓ |
| Hard Delete | ✗ | ✗ | ✗ | ✓ (audit) |

### Database Implementation

```sql
-- properties table additions
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_review','approved','published','rented','archived','expired','deleted')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rented_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Index for lifecycle queries
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_agency_status ON public.properties(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_published_at ON public.properties(published_at) WHERE status = 'published';

-- RLS: public only sees 'published'
CREATE POLICY "public_published_properties" ON public.properties
  FOR SELECT USING (status = 'published' AND agency_id IN (SELECT id FROM agencies WHERE verified = true));
```

### UI Indicators

| State | Badge Color | Renter View | Agency View |
|-------|-------------|-------------|-------------|
| Draft | `badge-muted` | Hidden | ✓ Edit, Submit |
| Pending Review | `badge-warning` | Hidden | ✓ View, Cancel submission |
| Approved | `badge-info` | Hidden | ✓ Publish, View SEO |
| Published | `badge-success` | ✓ Full | ✓ Manage, Analytics |
| Rented | `badge-muted` | "Rented" label | ✓ Archive, Reactivate |
| Archived | `badge-muted` | Hidden (direct link only) | ✓ Reactivate |
| Expired | `badge-error` | Hidden | ✓ Extend, Archive |
| Deleted | — | Hidden | Hidden (admin only) |

### Cron Jobs (Future)
- **Daily:** Check `available_from` + 90d → transition Published → Expired
- **Daily:** Notify agencies 7d before expiry
- **Weekly:** Clean up Draft > 30d old (notify → delete)

### Cron Jobs (Future)
- **Daily:** Check `available_from` + 90d → transition Published → Expired
- **Daily:** Notify agencies 7d before expiry
- **Weekly:** Clean up Draft > 30d old (notify → delete)

---

## 8.2 Property Media Architecture (Enhancement 5)

### Media Types & Support Matrix

| Media Type | Phase | Storage | Delivery | Notes |
|------------|-------|---------|----------|-------|
| **Photos** | 1 | Supabase Storage (private bucket) | Next.js Image Optimization API (CDN) | AVIF/WebP auto, multiple sizes |
| **Cover Image** | 1 | Same as photos | Same | First image or agency-designated |
| **Videos** | 2 | Supabase Storage (private) | Direct streaming / Mux (future) | Max 500MB, MP4/H.264 |
| **360° Tours** | 2 | External (Kuula, Matterport) | Embed iframe | Link in property media array |
| **Virtual Walkthroughs** | 3 | External (Matterport) | Embed iframe | Full 3D dollhouse view |
| **Floor Plans** | 2 | Supabase Storage | Next.js Image | PDF/PNG, separate field |

### Data Model

```typescript
// Extended property media fields
interface PropertyMedia {
  photos: PropertyPhoto[];
  cover_photo_id: string | null;
  videos: PropertyVideo[];
  virtual_tour_url: string | null;
  floor_plans: PropertyFloorPlan[];
}

interface PropertyPhoto {
  id: string;
  url: string;           // CDN URL via Next.js Image Optimization
  storage_path: string;  // Supabase Storage path
  alt_text: string;
  sort_order: number;
  is_cover: boolean;
  width: number;
  height: number;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface PropertyVideo {
  id: string;
  url: string;
  storage_path: string;
  thumbnail_url: string;
  duration_seconds: number;
  sort_order: number;
  created_at: string;
}

interface PropertyFloorPlan {
  id: string;
  url: string;
  storage_path: string;
  label: string; // "1st Floor", "Site Plan"
  sort_order: number;
}
```

### Database Schema (Migration 0013)

```sql
-- property_photos
CREATE TABLE IF NOT EXISTS public.property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  width INT,
  height INT,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_property_photos_property ON public.property_photos(property_id);

-- property_videos (Phase 2)
CREATE TABLE IF NOT EXISTS public.property_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration_seconds INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- property_floor_plans (Phase 2)
CREATE TABLE IF NOT EXISTS public.property_floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  label TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for all media tables
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_floor_plans ENABLE ROW LEVEL SECURITY;

-- Owner CRUD, public read for published properties
CREATE POLICY "owner_crud_property_photos" ON public.property_photos
  FOR ALL USING (
    property_id IN (SELECT id FROM public.properties WHERE agency_id IN (
      SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
    ))
  );

CREATE POLICY "public_read_published_photos" ON public.property_photos
  FOR SELECT USING (
    property_id IN (SELECT id FROM public.properties WHERE status = 'published')
  );
```

### Upload Flow (Phase 1)

```
Agency Dashboard → Add/Edit Property
       ↓
Multi-file dropzone (drag-drop, click)
       ↓
Client-side validation: type (image/*), max 5MB, max 20 files
       ↓
Upload to Supabase Storage (authenticated, private bucket)
       ↓
Server action: create property_photos rows with metadata
       ↓
Return CDN URLs → immediate preview in form
       ↓
On submit: property status → pending_review
```

### Image Optimization Pipeline

| Step | Tool | Config |
|------|------|--------|
| **Upload** | Supabase Storage | Private bucket, authenticated uploads only |
| **Transform** | Next.js Image Optimization | `loader: 'custom'`, Supabase CDN |
| **Formats** | Auto | AVIF → WebP → JPEG fallback |
| **Sizes** | `sizes` prop | Hero: 1200w, Card: 400w, Thumb: 160w |
| **Placeholder** | Blur | Base64 20px blur data URL |
| **Priority** | `priority` prop | First 3 images above fold |
| **Caching** | Vercel Edge | `Cache-Control: public, max-age=31536000, immutable` |

### Gallery Component Requirements

- **Hero:** Large image, priority load, blur placeholder
- **Thumbnails:** Horizontal strip, click → hero swap
- **Zoom Modal:** Full-screen, pinch-zoom, keyboard nav (← → ESC)
- **Mobile:** Swipe gestures, full-screen bottom sheet
- **Accessibility:** `aria-label`, focus trap, ESC close

### Phase 2+ Extensions

| Feature | Implementation |
|---------|----------------|
| **Video** | `<video controls preload="metadata">` with poster thumbnail |
| **360° Tour** | Embed Kuula/Matterport iframe, lazy-load on tab click |
| **Virtual Walkthrough** | Matterport SDK embed, full-screen mode |
| **Floor Plans** | Separate tab in gallery, PDF download option |
| **AI Tagging** | Phase 3: Auto-tag rooms (bedroom, kitchen) from images |

---

## 9. Agency Dashboard

*Current: `app/dashboard/page.tsx` — functional. PDD defines phased evolution.*

### Phase 1 (Launch)

| Tab / Section | Content | Actions |
|---------------|---------|---------|
| **Overview** | Stats cards (Properties, Leads, Leads This Month, Total Rent Value), Leads chart (monthly bars), Quick actions | Links to Add Property, Edit Profile, View Public |
| **Properties** | Paginated grid (PropertyCard with StatusBadge, SEO badge, Edit, Delete) | Add Property, Edit, Delete, View SEO |
| **Leads** | Table: Property, Source, Status (select), Created, Actions | Update status (new→contacted→qualified→closed), View property |
| **Pending Verification** (if unverified) | Beautiful waiting screen: agency name, city, status badge, contact support | Return home, Contact support |

### Phase 2
- **Leads Tab:** Full table with filters (date, status, property), export CSV, lead detail drawer
- **Visits Tab:** Calendar view, upcoming/past, accept/reject/reschedule, notifications
- **Analytics Tab:** Lead funnel, conversion by property, response time, visit show-rate
- **Profile Tab:** Edit agency profile (name, owner, phone, city, email, logo)

### Phase 3
- **Subscription/Billing:** Plan management, invoice history, payment method
- **Team Members:** Invite agents, role-based access (admin/agent)
- **Automation:** Auto-reply templates, lead assignment rules
- **Advanced Analytics:** Cohort retention, revenue per lead, source attribution

---

## 9.1 Lead Pipeline (Enhancement 2)

### Complete Sales Funnel

```
New
  ↓ (agency contacts)
Contacted
  ↓ (renter requests visit)
Visit Requested
  ↓ (agency confirms slot)
Visit Scheduled
  ↓ (visit occurs)
Visit Completed
  ↓ (terms discussed)
Negotiation
  ↓ (lease signed)
Booked
  ↓ (lost interest / competitor / other)
Lost
  ↓ (invalid / duplicate / test)
Spam
```

### Stage Definitions & Transitions

| Stage | Description | Triggered By | Auto-Transition | Agency Actions | Renter Actions | SLA |
|-------|-------------|--------------|-----------------|----------------|----------------|-----|
| **New** | Lead created via enquiry/visit request | Renter (LeadCaptureModal) | — | Contact (call/WhatsApp), Update status | — | 2h response target |
| **Contacted** | Agency made first contact | Agency | — | Log call notes, Schedule visit | — | 24h to next action |
| **Visit Requested** | Renter asked for visit slot | Renter (ScheduleVisitModal) | — | Confirm/Reject/Reschedule | Choose slot, add message | — |
| **Visit Scheduled** | Slot confirmed by agency | Agency (accept) | — | Prepare for visit | Confirm attendance | — |
| **Visit Completed** | Visit took place | Agency (mark completed) | After `scheduled_end` + 2h auto-complete | Add feedback, Move to Negotiation | Rate agency, Give feedback | — |
| **Negotiation** | Terms discussion (rent, deposit, lease) | Agency | — | Send proposal, Negotiate | Counter-offer, Accept | 7d typical |
| **Booked** | Lease signed, deal closed | Agency | — | Generate lease, Collect docs | Sign lease, Pay deposit | — |
| **Lost** | Renter chose other/withdrew | Agency or Renter | — | Mark reason (competitor, budget, location) | Mark reason | — |
| **Spam** | Invalid/fake/test lead | Agency or Admin | Auto-detect (heuristic) | Report spam | — | Immediate |

### Ownership & Permissions

| Action | Renter | Agency (owner) | Agency (other) | Admin |
|--------|--------|----------------|----------------|-------|
| Create lead | ✓ | ✗ | ✗ | ✓ |
| View own leads | ✓ | ✓ | ✗ | ✓ |
| Update status | ✗ | ✓ | ✗ | ✓ |
| Add notes | ✗ | ✓ | ✗ | ✓ |
| Mark spam | ✗ | ✓ | ✗ | ✓ |
| Export leads | ✗ | ✓ (own) | ✗ | ✓ (all) |
| Bulk actions | ✗ | Phase 2 | ✗ | Phase 2 |

### Reporting Implications

| Metric | Calculation | Dashboard |
|--------|-------------|-----------|
| **Lead Volume** | COUNT(*) by stage, daily/weekly/monthly | Agency Overview, Admin Lead Analytics |
| **Response Time** | AVG(`contacted_at` - `created_at`) where status ≥ Contacted | Agency Analytics |
| **Visit Conversion** | COUNT(Visit Scheduled) / COUNT(New) | Agency Analytics, Admin Visit Analytics |
| **Visit Show Rate** | COUNT(Visit Completed) / COUNT(Visit Scheduled) | Agency Analytics, Admin Visit Analytics |
| **Negotiation Rate** | COUNT(Negotiation) / COUNT(Visit Completed) | Agency Analytics |
| **Close Rate** | COUNT(Booked) / COUNT(New) | Agency Analytics, Admin Lead Analytics |
| **Lost Reasons** | GROUP BY `lost_reason` | Agency Analytics |
| **Spam Rate** | COUNT(Spam) / COUNT(New) | Admin Lead Analytics |

### Database Implementation

```sql
-- leads table additions
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'new'
    CHECK (stage IN ('new','contacted','visit_requested','visit_scheduled','visit_completed','negotiation','booked','lost','spam')),
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS visit_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS negotiation_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lost_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT,
  ADD COLUMN IF NOT EXISTS spam_reason TEXT,
  ADD COLUMN IF NOT EXISTS agency_notes TEXT;

-- Indexes for funnel queries
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_agency_stage ON public.leads(agency_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- Auto-set timestamps via trigger
CREATE OR REPLACE FUNCTION public.set_lead_stage_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stage = 'contacted' AND OLD.stage = 'new' THEN
    NEW.contacted_at = NOW();
  ELSIF NEW.stage = 'visit_requested' AND OLD.stage IN ('new','contacted') THEN
    NEW.visit_requested_at = NOW();
  ELSIF NEW.stage = 'visit_scheduled' AND OLD.stage = 'visit_requested' THEN
    NEW.visit_scheduled_at = NOW();
  ELSIF NEW.stage = 'visit_completed' AND OLD.stage = 'visit_scheduled' THEN
    NEW.visit_completed_at = NOW();
  ELSIF NEW.stage = 'negotiation' AND OLD.stage = 'visit_completed' THEN
    NEW.negotiation_started_at = NOW();
  ELSIF NEW.stage = 'booked' AND OLD.stage = 'negotiation' THEN
    NEW.booked_at = NOW();
  ELSIF NEW.stage = 'lost' THEN
    NEW.lost_at = NOW();
  ELSIF NEW.stage = 'spam' THEN
    NEW.spam_reason = COALESCE(NEW.spam_reason, 'reported_by_agency');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER lead_stage_timestamps
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_lead_stage_timestamp();
```

### UI: Lead Status Select (Agency Dashboard)

```typescript
// LeadStatusSelect.tsx — enhanced with full pipeline
const STAGE_ORDER = [
  'new', 'contacted', 'visit_requested', 'visit_scheduled',
  'visit_completed', 'negotiation', 'booked', 'lost', 'spam'
] as const;

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  visit_requested: 'Visit Requested',
  visit_scheduled: 'Visit Scheduled',
  visit_completed: 'Visit Completed',
  negotiation: 'Negotiation',
  booked: 'Booked',
  lost: 'Lost',
  spam: 'Spam'
};

const STAGE_COLORS: Record<LeadStage, 'default'|'blue'|'amber'|'green'|'red'|'gray'> = {
  new: 'blue',
  contacted: 'blue',
  visit_requested: 'amber',
  visit_scheduled: 'amber',
  visit_completed: 'green',
  negotiation: 'amber',
  booked: 'green',
  lost: 'red',
  spam: 'gray'
};
```

### Migration Path (Existing Data)
- Existing `status` values map: `new`→`new`, `contacted`→`contacted`, `qualified`→`negotiation`, `closed`→`booked`
- Backfill timestamps from `created_at` / `updated_at` where possible
- Add `stage` column, populate from `status`, then deprecate `status` (keep for backward compat)

---

## 10. Renter Dashboard

*Current: `app/renter/page.tsx` — tabs: Shortlisted | Account.*

### Phase 1 (Launch)

| Tab | Content | Actions |
|-----|---------|---------|
| **Shortlisted** | Grid of saved properties (PropertyCard with Remove button) | Remove, View detail, Contact, Schedule Visit |
| **Account** | Accordion: Account Info (email read-only) + Profile Form (name, phone) | Save profile, validation |

### Phase 2
- **Scheduled Visits Tab:** Upcoming (date, time, property, agency, status), Past (with feedback), Reschedule/Cancel
- **Recently Viewed:** Auto-populated from property page visits (localStorage → server sync)
- **Notifications:** In-app bell icon, toast history, email preferences
- **Search History:** Saved searches with alert toggle

### Phase 3
- **Application Tracker:** Multi-property application status, document upload, lease e-sign
- **Commute Planner:** Saved workplace → commute times to shortlisted
- **AI Recommendations:** "Based on your visits, you might like..."
- **Renter Reviews:** Write/edit agency reviews (after completed visit)

---

## 11. Admin Panel

*Current: `app/admin/page.tsx` — agencies + properties tables.*

### Phase 1 (Launch)

| Section | Features |
|---------|----------|
| **Agency Approvals** | Table: name, owner, city, email, phone, verified badge, is_admin badge, Verify/Unverify, Delete (non-admin) |
| **Property Moderation** | Table: title, rent, location, city, status badge, Approve/Reject/Delete |
| **Platform Stats** | 4 StatCards: Total Agencies, Verified, Total Properties, Total Leads (head count) |
| **Audit Log** | All admin actions logged (verify, approve, delete) with timestamp, admin user |

### Phase 2
- **User Management:** Renter list (search, filter, view profile, suspend), Agency list (same + impersonate)
- **Reported Listings:** Moderation queue (reports from renters/agencies)
- **Bulk Actions:** Multi-select → Approve/Reject/Archive
- **Review Moderation:** Flagged reviews, hide/delete, agency reply oversight
- **Lead Analytics:** Platform-wide funnel, source breakdown, conversion by city
- **Visit Analytics:** Requested vs confirmed, no-show rate, agency responsiveness
- **Email Notification Management:** Template editor, send test, delivery logs

### Phase 3
- **System Health Dashboard:** Error rates, latency, DB connections, queue depths, rate-limit hits
- **Platform Analytics:** MAU/DAU, search-to-lead, listing-to-lease, revenue
- **Revenue/Subscription:** MRR, churn, plan distribution, failed payments
- **Support Tickets:** Inbound, SLA, assignment, resolution
- **Feature Flags:** Toggle new features per user segment
- **Admin Roles/Permissions:** Superadmin, Moderator, Support, Read-only
- **Advanced Audit:** Full immutable log, search, export
- **AI-Assisted Moderation:** Auto-flag suspicious listings, duplicate detection, spam leads

---

## 12. Notification System (Enhancement 3)

### Overview
Centralized notification infrastructure supporting in-app, email, and future push/SMS channels. Decoupled from business logic via event-driven architecture.

### Notification Types

| Category | Event | Renter | Agency | Admin | Priority |
|----------|-------|--------|--------|-------|----------|
| **Auth** | Email verification | ✓ | ✓ | — | High |
| | Password reset | ✓ | ✓ | — | High |
| | Session expiry warning | ✓ | ✓ | — | Medium |
| **Leads** | New lead received | — | ✓ | — | High |
| | Lead status changed | ✓ (own) | ✓ (own) | — | Medium |
| | Lead marked spam | — | ✓ | — | Low |
| **Visits** | Visit requested | — | ✓ | — | High |
| | Visit confirmed/rejected/rescheduled | ✓ | ✓ | — | High |
| | Visit reminder (24h, 1h) | ✓ | ✓ | — | High |
| | Visit completed | ✓ | ✓ | — | Medium |
| **Properties** | Property approved/rejected | — | ✓ | — | High |
| | Property marked rented | — | ✓ | — | Medium |
| | Property expired warning (7d) | — | ✓ | — | Medium |
| **Reviews** | New review received | — | ✓ | — | Medium |
| | Review reply | ✓ | ✓ | — | Low |
| **System** | Platform maintenance | ✓ | ✓ | ✓ | High |
| | Feature announcements | ✓ | ✓ | — | Low |
| **Admin** | Agency pending verification | — | — | ✓ | High |
| | Property pending approval | — | — | ✓ | High |
| | Spam lead reported | — | — | ✓ | Medium |
| | System health alerts | — | — | ✓ | Critical |

### Delivery Channels

| Channel | Status | Implementation |
|---------|--------|----------------|
| **In-App (Real-time)** | Phase 1 | Supabase Realtime → `notifications` table → toast + bell icon |
| **Email** | Phase 1 | Resend/SendGrid via Edge Function; templates in DB |
| **Push (Mobile Web)** | Phase 2 | Web Push API (VAPID); service worker |
| **SMS** | Phase 3 | Twilio/Vonage; critical only (OTP, visit reminders) |
| **WhatsApp** | Phase 3 | WhatsApp Business API; visit confirmations |

### Data Model

```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- auth.uid() for renter; agencies.id for agency
    user_type TEXT NOT NULL CHECK (user_type IN ('renter','agency','admin')),
    type TEXT NOT NULL, -- e.g., 'lead.new', 'visit.confirmed'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- { lead_id, property_id, visit_id, action_url }
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
    channels TEXT[] NOT NULL DEFAULT '{in_app}', -- requested channels
    delivered_channels TEXT[] DEFAULT '{}', -- actually delivered
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, user_type, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner" ON notifications
  FOR ALL USING (
    (user_type = 'renter' AND user_id IN (SELECT id FROM renter_profiles WHERE user_id = auth.uid()))
    OR (user_type = 'agency' AND user_id IN (SELECT id FROM agencies WHERE auth_user_id = auth.uid()))
    OR (user_type = 'admin' AND auth.uid() IN (SELECT auth_user_id FROM agencies WHERE is_admin = true))
  );
```

### In-App UX

| Component | Behavior |
|-----------|----------|
| **Bell Icon** | Top-right (desktop) / bottom nav (mobile); badge count = unread |
| **Dropdown/Sheet** | List last 20; "Mark all read"; "View all" → `/notifications` page |
| **Toast** | High-priority → immediate toast; others → batched in dropdown |
| **Grouping** | Same-type within 5min → grouped with count |
| **Actions** | `action_url` in data → deep link (e.g., `/property/123`, `/dashboard/leads/456`) |

### Preferences (Phase 2)

| Preference | Default | Granularity |
|------------|---------|-------------|
| Email: lead notifications | On | Per-type |
| Email: visit reminders | On | Per-type |
| Email: marketing | Off | Global |
| Push: visit reminders | On | Per-type |
| Push: new leads | On | Per-type |
| SMS: visit reminders | Off | Per-type |
| In-app: all | On | Global |

### Event-Driven Generation

```typescript
// lib/notifications.ts
interface NotificationEvent {
  type: string;
  userId: string;
  userType: 'renter' | 'agency' | 'admin';
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    channels?: ('in_app' | 'email' | 'push' | 'sms')[];
  };
}

// Published to Supabase Realtime channel "notifications:events"
// Edge Function consumer picks up, renders templates, sends via channels
async function publishNotification(event: NotificationEvent) {
  await supabase.channel('notifications:events').send({
    type: 'broadcast',
    event: 'notification',
    payload: event
  });
}
```

### Email Templates (Phase 1)

| Template | Variables | Trigger |
|----------|-----------|---------|
| `verify_email` | `verification_url`, `user_name` | Signup |
| `reset_password` | `reset_url`, `user_name` | Forgot password |
| `lead_new` | `property_title`, `renter_name`, `renter_phone`, `dashboard_url` | Lead created |
| `visit_requested` | `property_title`, `renter_name`, `scheduled_at`, `dashboard_url` | Visit requested |
| `visit_confirmed` | `property_title`, `agency_name`, `scheduled_at`, `meet_link` | Visit confirmed |
| `visit_reminder_24h` | `property_title`, `scheduled_at`, `address` | 24h before visit |
| `visit_reminder_1h` | `property_title`, `scheduled_at`, `address` | 1h before visit |
| `property_approved` | `property_title`, `property_url` | Admin approves |
| `property_rejected` | `property_title`, `rejection_reason`, `edit_url` | Admin rejects |

---

## 13. Analytics Foundation (Enhancement 4)

### Event Taxonomy

All events follow: `domain.action` naming (e.g., `search.performed`, `property.viewed`).

| Domain | Events | Key Properties |
|--------|--------|----------------|
| **Search** | `search.performed`, `search.filter_changed`, `search.sort_changed`, `search.result_clicked` | `query`, `filters`, `sort`, `result_count`, `position`, `property_id` |
| **Property** | `property.viewed`, `property.gallery_opened`, `property.gallery_image_viewed`, `property.amenities_viewed`, `property.map_viewed`, `property.nearby_viewed` | `property_id`, `duration_ms`, `image_index` |
| **Engagement** | `favorite.added`, `favorite.removed`, `contact.clicked`, `visit.requested`, `visit.scheduled`, `visit.confirmed`, `visit.completed`, `visit.cancelled` | `property_id`, `agency_id`, `visit_id` |
| **Leads** | `lead.created`, `lead.contacted`, `lead.status_changed`, `lead.marked_spam` | `lead_id`, `stage`, `previous_stage` |
| **Auth** | `auth.signup_started`, `auth.signup_completed`, `auth.login`, `auth.logout`, `auth.email_verified`, `auth.password_reset` | `method`, `user_type` |
| **Agency** | `agency.signup`, `agency.onboarding_completed`, `agency.verified`, `agency.property_published`, `agency.property_marked_rented` | `agency_id`, `property_id` |
| **Admin** | `admin.agency_verified`, `admin.property_approved`, `admin.property_rejected`, `admin.bulk_action` | `admin_id`, `target_id`, `count` |
| **SEO** | `seo.report_generated`, `seo.issue_detected` | `property_id`, `score`, `grade` |
| **Crawler** | `crawl.started`, `crawl.page_discovered`, `crawl.page_crawled`, `crawl.completed` | `crawl_id`, `url`, `status` |
| **AI (Future)** | `ai.summary_generated`, `ai.recommendation_shown`, `ai.recommendation_clicked`, `ai.search_performed` | `model`, `tokens`, `property_ids` |

### Event Schema (TypeScript)

```typescript
// lib/analytics/events.ts
interface BaseEvent {
  event: string;           // e.g., "property.viewed"
  timestamp: string;       // ISO 8601
  session_id: string;      // client-generated, persists 30min
  user_id?: string;        // set after auth
  user_type?: 'renter' | 'agency' | 'admin';
  anonymous_id: string;    // FPJS or cookie, persists 1yr
  properties: Record<string, unknown>;
  context: {
    page: { path: string; referrer: string };
    device: { type: 'desktop'|'mobile'|'tablet'; os: string; browser: string };
    locale: string;
    utm?: { source: string; medium: string; campaign: string; content: string; term: string };
  };
}

// Domain-specific payloads
interface PropertyViewedEvent extends BaseEvent {
  event: 'property.viewed';
  properties: {
    property_id: string;
    agency_id: string;
    rent: number;
    bedrooms: number;
    city: string;
    source: 'search' | 'direct' | 'recommendation' | 'saved' | 'similar';
    position?: number; // if from search results
  };
}

interface LeadCreatedEvent extends BaseEvent {
  event: 'lead.created';
  properties: {
    lead_id: string;
    property_id: string;
    agency_id: string;
    source: 'contact_form' | 'visit_request' | 'phone_click' | 'whatsapp_click';
    has_renter_profile: boolean;
  };
}
```

### Collection Architecture

```
Client (Browser)
  │
  ├─► Client-side buffer (localStorage, max 50 events, flush 10s)
  │
  ▼
/api/analytics/ingest (Edge Function)
  │
  ├─► Validate schema (Zod)
  ├─► Enrich (geoIP, device, session)
  ├─► Write to analytics_events (partitioned by date)
  └─► Forward to:
        ├─► PostHog / Mixpanel (product analytics)
        ├─► BigQuery / Snowflake (data warehouse)
        └─► Supabase Realtime (real-time dashboards)
```

### Data Warehouse Schema

```sql
-- Partitioned by event_date for performance
CREATE TABLE analytics_events (
    id BIGSERIAL,
    event_date DATE NOT NULL,
    event_name TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_id TEXT,
    user_type TEXT,
    anonymous_id TEXT NOT NULL,
    properties JSONB NOT NULL,
    context JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (event_date);

-- Monthly partitions
CREATE TABLE analytics_events_2026_01 PARTITION OF analytics_events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- ... auto-create via pg_partman

-- Indexes
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_name_date ON analytics_events(event_name, event_date);
```

### Dashboards & Consumers

| Consumer | Purpose | Tools |
|----------|---------|-------|
| **Product Team** | Funnel analysis, feature adoption, retention | PostHog, Metabase |
| **Agency Portal** | Lead funnel, visit show-rate, response time | Embedded Metabase / custom React |
| **Admin** | Platform health, MAU/DAU, conversion by city | Grafana, Metabase |
| **SEO Team** | Crawl coverage, indexation, content gaps | Custom dashboard |
| **AI/ML (Future)** | Training data for recommendations, pricing | Feature store, SageMaker/Vertex |

### Privacy & Compliance

- **No PII in events** — `user_id` is UUID only; email/phone never logged
- **Consent** — Cookie banner; analytics opt-out respects `Do Not Track`
- **Retention** — Raw events: 13 months; Aggregated: 5 years
- **GDPR/IT Act** — `anonymous_id` deletable on request; DSAR workflow

---

## 14. Soft-Delete Strategy (Enhancement 6)

### Philosophy
**Never hard-delete user-facing data.** All deletions are soft with `deleted_at` timestamp. Hard delete only via admin audit after retention period.

### Tables with Soft Delete

| Table | Soft Delete Column | Retention | Recovery |
|-------|-------------------|-----------|----------|
| `properties` | `deleted_at` | 90 days | Agency (own), Admin |
| `agencies` | `deleted_at` | 180 days | Admin only |
| `leads` | `deleted_at` | 365 days | Agency (own), Admin |
| `property_visits` | `deleted_at` | 365 days | Agency (own), Admin |
| `agency_reviews` | `deleted_at` | 180 days | Renter (own, 24h), Admin |
| `renter_profiles` | `deleted_at` | 30 days | Admin only (GDPR) |
| `seo_reports` | `deleted_at` | 90 days | Admin only |

### Implementation Pattern

```sql
-- Standard soft-delete columns (add to each table)
ALTER TABLE target_table
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Partial unique index: allow re-creation of same slug/email after delete
CREATE UNIQUE INDEX uq_properties_slug_active ON properties(slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_agencies_email_active ON agencies(email) WHERE deleted_at IS NULL;

-- RLS: exclude deleted by default
CREATE POLICY "active_only" ON properties
  FOR SELECT USING (deleted_at IS NULL);

-- Admin can see deleted
CREATE POLICY "admin_all" ON properties
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM agencies WHERE auth_user_id = auth.uid() AND is_admin = true)
  );
```

### Recovery & Admin Restore

| Actor | Action | UI |
|-------|--------|----|
| Agency (own) | Restore property/lead/visit within 90d | "Trash" tab in dashboard → "Restore" |
| Renter (own) | Restore review within 24h | Review history → "Undelete" |
| Admin | Restore any entity | Admin → "Trash" → search → "Restore" |
| Admin | Hard delete (purge) | Admin → "Trash" → "Purge" (audit logged) |

### Audit Trail

```sql
-- admin_audit_log already captures delete actions
-- Additional: deletion_reason required for all soft deletes
-- Admin purge requires second confirmation + reason
```

### Cron Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| `cleanup_expired_drafts` | Daily 03:00 | `DELETE FROM properties WHERE status='draft' AND updated_at < NOW() - INTERVAL '30 days'` |
| `hard_delete_expired` | Weekly | Hard delete rows where `deleted_at < NOW() - retention_interval` AND no active references |
| `notify_before_purge` | Daily | Email admin 7d before hard delete of agency data |

---

## 15. Dashboard Activity Feed (Enhancement 7)

### Agency Dashboard — Activity Timeline

| Event Type | Trigger | Display Format | Link |
|------------|---------|----------------|------|
| **New Lead** | `lead.created` | "🔔 New lead: {property_title} — {renter_name}" | `/dashboard/leads/{id}` |
| **Lead Status** | `lead.stage_changed` | "📋 {property_title} → {new_stage}" | `/dashboard/leads/{id}` |
| **Visit Requested** | `visit.requested` | "📅 Visit requested: {property_title} for {date}" | `/dashboard/visits/{id}` |
| **Visit Confirmed** | `visit.confirmed` | "✅ Visit confirmed: {property_title} on {date}" | `/dashboard/visits/{id}` |
| **Visit Completed** | `visit.completed` | "✅ Visit completed: {property_title}" | `/dashboard/visits/{id}` |
| **Property Approved** | `property.approved` | "✅ {property_title} approved & published" | `/property/{id}` |
| **Property Rejected** | `property.rejected` | "❌ {property_title} rejected: {reason}" | `/edit-property/{id}` |
| **New Review** | `review.created` | "⭐ New {rating}-star review from {reviewer}" | `/dashboard#reviews` |

### Renter Dashboard — Activity Timeline

| Event Type | Trigger | Display Format | Link |
|------------|---------|----------------|------|
| **Property Saved** | `favorite.added` | "♡ Saved: {property_title}" | `/property/{id}` |
| **Visit Scheduled** | `visit.scheduled` | "📅 Visit scheduled: {property_title} on {date}" | `/renter#visits` |
| **Visit Confirmed** | `visit.confirmed` | "✅ Visit confirmed: {property_title} on {date}" | `/renter#visits` |
| **Visit Reminder** | `visit.reminder` | "⏰ Visit in 1 hour: {property_title}" | `/renter#visits` |
| **Visit Completed** | `visit.completed` | "✅ Visit completed: {property_title} — Leave a review?" | `/property/{id}#reviews` |
| **Lead Sent** | `lead.created` | "📤 Enquiry sent to {agency_name} for {property_title}" | `/renter` |
| **Review Reminder** | `review.reminder` (7d post-visit) | "✍️ How was your visit to {property_title}?" | `/property/{id}#reviews` |

### Admin Dashboard — Platform Alerts

| Alert Type | Trigger | Severity | Action |
|------------|---------|----------|--------|
| **Agency Pending > 24h** | `agency.verification_pending` > 24h | Warning | "Verify agencies" → `/admin/agencies` |
| **Property Pending > 24h** | `property.pending_review` > 24h | Warning | "Review properties" → `/admin/properties` |
| **Spam Lead Spike** | `lead.spam` rate > 5% in 1h | Critical | "Investigate leads" → `/admin/leads` |
| **Error Rate Spike** | HTTP 5xx > 1% in 5min | Critical | "View logs" → Grafana |
| **DB Connection Pool > 80%** | `pg_stat_activity` count | Warning | "Scale DB" → Vercel/Supabase |
| **New Agency Signup** | `agency.signup` | Info | "Review onboarding" → `/admin/agencies` |

### Implementation

```sql
-- activity_events table (append-only, partitioned)
CREATE TABLE activity_events (
    id BIGSERIAL,
    event_date DATE NOT NULL,
    user_id UUID NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('renter','agency','admin')),
    event_type TEXT NOT NULL, -- e.g., 'lead.created'
    title TEXT NOT NULL,
    body TEXT,
    entity_type TEXT, -- 'lead', 'visit', 'property', 'review'
    entity_id UUID,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (event_date);

-- Indexes
CREATE INDEX idx_activity_user_date ON activity_events(user_id, user_type, event_date DESC);
CREATE INDEX idx_activity_entity ON activity_events(entity_type, entity_id);
```

```typescript
// lib/activity.ts
async function recordActivity(params: {
  userId: string;
  userType: 'renter' | 'agency' | 'admin';
  eventType: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  await supabase.from('activity_events').insert({
    user_id: params.userId,
    user_type: params.userType,
    event_type: params.eventType,
    title: params.title,
    body: params.body,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action_url: params.actionUrl,
    metadata: params.metadata,
    event_date: new Date().toISOString().split('T')[0]
  });
}
```

### UI Components

| Dashboard | Component | Props |
|-----------|-----------|-------|
| Agency | `ActivityFeed` | `events: ActivityEvent[]; limit?: number; onLoadMore?: () => void` |
| Renter | `ActivityFeed` | Same |
| Admin | `AlertBanner` | `alerts: Alert[]; onDismiss: (id) => void` |

---

## 16. Design System

### Colors (CSS Custom Properties — `globals.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-primary` | `#ea580c` | Primary actions, links, focus rings |
| `--brand-primary-hover` | `#c2410c` | Hover states |
| `--brand-accent` | `#f97316` | Gradients, accents |
| `--brand-secondary` | `#fed7aa` | Light backgrounds |
| `--brand-background` | `#fafaf9` | Page background |
| `--brand-surface` | `#ffffff` | Cards, modals, inputs |
| `--brand-text` | `#1c1917` | Primary text |
| `--brand-muted` | `#78716c` | Secondary text, placeholders |
| `--brand-border` | `#e7e5e4` | Borders, dividers |
| `--brand-success` | `#10b981` | Success states, verified badges |
| `--brand-warning` | `#f59e0b` | Warnings, pending |
| `--brand-error` | `#ef4444` | Errors, destructive actions |

### Typography
- **Font:** Geist Sans (variable) — `next/font/google`
- **Mono:** Geist Mono — code, numbers
- **Scale:**
  - `text-xs` (12px) — labels, badges, meta
  - `text-sm` (14px) — body, inputs, buttons
  - `text-base` (16px) — comfortable reading
  - `text-lg` (18px) — subheadings
  - `text-xl` (20px) — section headers
  - `text-2xl` (24px) — page titles
  - `text-3xl` (30px) — hero
  - `text-4xl`+`text-5xl`+`text-6xl` — marketing hero
- **Weights:** `font-semibold` (600) default, `font-extrabold` (800) headings, `font-bold` (700) emphasis

### Spacing (Tailwind scale — 4px base)
- `space-y-1` (4px) — tight groups
- `space-y-2` (8px) — form fields
- `space-y-3` (12px) — card sections
- `space-y-4` (16px) — major sections
- `space-y-6` (24px) — page sections
- `space-y-8` (32px) — large gaps
- Container: `container-app` → `max-w-7xl px-4 sm:px-6 lg:px-8`

### Border Radius
- `rounded-xl` (12px) — cards, buttons, inputs, modals
- `rounded-2xl` (16px) — featured cards, dialogs
- `rounded-3xl` (24px) — hero containers, major CTAs
- `rounded-full` — pills, badges, avatars, icon buttons

### Buttons (`.btn` family)
| Variant | Classes | Use Case |
|---------|---------|----------|
| `.btn-primary` | `bg-[var(--brand-primary)] text-white shadow-sm hover:-translate-y-0.5` | Primary CTA: Save, Contact, Schedule, Submit |
| `.btn-secondary` | `border border-[var(--brand-border)] bg-white text-[var(--brand-text)] hover:border-[var(--brand-primary)]` | Secondary: Cancel, Back, View Listings |
| `.btn-ghost` | `bg-transparent hover:bg-stone-100` | Tertiary: Edit, Link-style |
| `.btn-danger` | `bg-[var(--brand-error)] text-white` | Delete, Reject, Destructive |
| `.btn` (base) | `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition active:scale-[0.98]` | All share |

### Inputs
- `.input` — text, email, password, tel, number
- `.select` — native select, styled
- `.textarea` — min-h-[120px], resize-y
- `.label` — `mb-2 block text-sm font-semibold`
- Focus: `focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-orange-100`

### Cards
- `.card` — `rounded-2xl border border-[var(--brand-border)] bg-white shadow-sm`
- `.card-hover` — adds `hover:-translate-y-1 hover:border-[var(--brand-primary)] hover:shadow-lg`

### Dialogs / Modals
- Backdrop: `bg-slate-950/60 backdrop-blur-sm`
- Container: `max-w-3xl rounded-3xl bg-white shadow-2xl`
- Mobile: full-width, bottom sheet feel
- Focus trap, ESC to close, click backdrop to close
- ARIA: `role="dialog" aria-modal="true" aria-labelledby`

### Tables
- Header: `text-sm font-semibold text-[var(--brand-muted)]`
- Row: `border-t border-[var(--brand-border)] hover:bg-[var(--brand-background)]`
- Cell: `px-4 py-3 text-sm`
- Responsive: horizontal scroll on `< lg`

### Badges
| Variant | Classes | Use |
|---------|---------|-----|
| `.badge-success` | `bg-emerald-50 text-emerald-700` | Verified, Approved, Completed |
| `.badge-warning` | `bg-amber-50 text-amber-700` | Pending, In Progress |
| `.badge-error` | `bg-red-50 text-red-700` | Rejected, Failed, Error |
| `.badge-info` | `bg-orange-50 text-[var(--brand-primary)]` | Info, New, Stats |
| `.badge-muted` | `bg-stone-100 text-stone-600` | Neutral, Admin, Archived |

### Icons
- Inline SVG (current pattern) — tree-shakeable, colorable via `currentColor`
- Standard set: Heroicons outline (24×24) + custom brand icons
- Sizes: `h-4 w-4` (inline), `h-5 w-5` (buttons), `h-6 w-6` (cards), `h-8 w-8` (features), `h-12 w-12` (hero)

### Loading States
- **Skeleton:** `.skeleton` — shimmer gradient, applies to cards, tables, lists
- **Page:** `loading.tsx` per route (Next.js 16)
- **Button:** `disabled` + "Please wait..." text + spinner
- **Image:** `blur` placeholder + `priority` for hero

### Empty States
- Illustration (SVG) + headline + subtext + primary CTA
- Example: "No saved properties yet" + heart icon + "Browse properties"

### Error States
- Inline: `ErrorMessage` component (red badge + icon)
- Toast: `ToastProvider` — top-right, auto-dismiss 5s, action button optional
- Page: `error.tsx` boundary + "Try again" button
- Form: Field-level `aria-invalid` + `aria-describedby` error id

### Success States
- Toast: green badge + check icon
- Inline: `bg-emerald-50 text-emerald-700` message
- Modal: Success illustration + "Done" button

---

## 13. Component Library

### Layout & Navigation
| Component | Path | Props | Notes |
|-----------|------|-------|-------|
| `Navbar` | `app/Navbar.tsx` | — | Server component, reads auth, renders contextual links |
| `MobileMenu` | `app/MobileMenu.tsx` | `navItems`, `showProfileButton`, `profileButton` | Client, slide-in panel |
| `Footer` | `app/Footer.tsx` | — | Links, copyright, social |
| `Logo` | `app/Logo.tsx` | `className` | SVG wordmark |
| `ProfileDropdown` | `app/ProfileDropdown.tsx` | `isRenter`, `isAgency`, `isVerifiedAgency` | Client, portal to body |

### Property & Listings
| Component | Path | Props | Notes |
|-----------|------|-------|-------|
| `PropertyCard` | `app/PropertyCard.tsx` | `property`, `actions?` | `React.memo`, image, badges, CTAs |
| `PropertyList` | `app/PropertyList.tsx` | `properties[]` | Grid wrapper |
| `PropertyFormFields` | `app/PropertyFormFields.tsx` | `form`, `errors` | React Hook Form fields |
| `ImageGallery` | `app/ImageGallery.tsx` | `images[]`, `heroIndex` | Zoom modal, keyboard nav |
| `HeroSearch` | `app/HeroSearch.tsx` | — | Search form, redirects to /rent |
| `SectionHeader` | `app/SectionHeader.tsx` | `eyebrow`, `title`, `description`, `align` | Consistent section intro |
| `StatCard` | `app/StatCard.tsx` | `label`, `value`, `sub`, `icon` | Dashboard stats |
| `StatusBadge` | `app/StatusBadge.tsx` | `status` | approved/pending/rejected/verified |

### Auth & Renter
| Component | Path | Props | Notes |
|-----------|------|-------|-------|
| `RenterAuthDialog` | `app/renter/RenterAuthDialog.tsx` | — | Client, sign in/up, email guard |
| `RenterNavButton` | `app/renter/RenterNavButton.tsx` | — | Opens dialog |
| `RenterSessionProvider` | `app/renter/RenterSessionProvider.tsx` | `children` | Context: profile, session, refresh |
| `FavoriteButton` | `app/renter/FavoriteButton.tsx` | `propertyId` | Heart toggle, optimistic UI |
| `ScheduleVisitButton` | `app/renter/ScheduleVisitButton.tsx` | `propertyId` | Opens ScheduleVisitModal |
| `LeadCaptureModal` | `app/LeadCaptureModal.tsx` | `propertyId`, `agencyId` | Pre-filled from profile |
| `ScheduleVisitModal` | (new) | `propertyId`, `agencyId`, `slots[]` | Date picker, time slots |

### Agency & Dashboard
| Component | Path | Props | Notes |
|-----------|------|-------|-------|
| `AgencyOnboardingForm` | `app/onboarding/agency/AgencyOnboardingForm.tsx` | — | Server action createAgency |
| `EditAgencyProfile` | `app/EditAgencyProfile.tsx` | — | Server action updateAgencyProfile |
| `EditPropertyForm` | `app/EditPropertyForm.tsx` | `property` | Server action updateProperty |
| `VerifyAgencyButton` | `app/VerifyAgencyButton.tsx` | `agencyId` | Admin only |
| `UnverifyAgencyButton` | `app/UnverifyAgencyButton.tsx` | `agencyId` | Admin only |
| `ApprovePropertyButton` | `app/ApprovePropertyButton.tsx` | `propertyId` | Admin only |
| `RejectPropertyButton` | `app/RejectPropertyButton.tsx` | `propertyId` | Admin only |
| `DeleteButton` | `app/DeleteButton.tsx` | `id`, `type` | ConfirmDialog + server action |
| `DeleteAgencyButton` | `app/DeleteAgencyButton.tsx` | `agencyId`, `agencyName?` | Admin only |
| `DeletePropertyAdminButton` | `app/DeletePropertyAdminButton.tsx` | `propertyId`, `propertyTitle?` | Admin only |
| `LeadStatusSelect` | `app/LeadStatusSelect.tsx` | `leadId`, `currentStatus` | Inline select, server action |
| `AgencyReviews` | `app/renter/AgencyReviews.tsx` | `agencyId` | Stars + optional text |

### UI Primitives
| Component | Path | Props | Notes |
|-----------|------|-------|-------|
| `Toast` / `ToastProvider` | `app/Toast.tsx` | `message`, `type` | Top-right, auto-dismiss |
| `ConfirmDialog` / `ConfirmProvider` | `app/ConfirmDialog.tsx` | `title`, `description`, `onConfirm` | Accessible, focus trap |
| `ErrorMessage` | `app/ErrorMessage.tsx` | `message` | Inline error display |
| `ApplicationSubmitted` | `app/ApplicationSubmitted.tsx` | `onClose` | Success screen after lead/visit |

### SEO & Admin
| Component | Path | Props | Notes |
|-----------|------|-------|-------|
| `SeoAnalysisPanel` | `app/SeoAnalysisPanel.tsx` | `report` | Agency-only property SEO |
| `SimilarListings` | `app/SimilarListings.tsx` | `propertyId` | Related properties rail |

---

## 14. User Journeys

### Journey 1: Visitor → Renter
```
1. Lands on / (Hero + listings)
2. Clicks "Contact Agency" on property card
3. RenterAuthDialog opens → "Create account" tab
4. Enters: Full Name, Phone, Email, Password
5. Submits → Supabase signUp (emailRedirectTo: /verify-email)
6. Dialog: "Check your inbox" → switches to Sign In tab
7. User clicks email link → /verify-email → "Email confirmed"
8. Returns to site → RenterAuthDialog (Sign In)
9. Enters Email + Password → signInWithPassword
10. email_confirmed_at ✓ → renter_profiles auto-create (from metadata)
11. refreshProfile → dialog closes → router.refresh()
12. Original CTA re-fires → LeadCaptureModal pre-filled → Submit
13. Toast: "Enquiry sent" → Lead created, agency notified
```

### Journey 2: Visitor → Agency
```
1. Lands on / → "List as agency" → /signup
2. Email + Password → signUp → "Check inbox"
3. Clicks email link → /verify-email → "Confirmed"
4. /login → Email + Password → signInWithPassword
5. requireUser ✓ → agencies row? No → redirect /onboarding/agency
6. AgencyOnboardingForm: Agency Name, Owner Name, Phone, City
7. Submit → createAgency server action (RLS: auth.uid())
8. Redirect /dashboard → Pending verification screen
9. Admin verifies → Agency sees full dashboard
10. Clicks "Add Property" → /add-property
11. Fills PropertyFormFields → createProperty server action
12. Property status: "pending" → Admin approves → "approved"
13. Property appears on marketplace → Leads start arriving
```

### Journey 3: Agency Publishing
```
1. Verified agency on /dashboard → "Add new property"
2. /add-property: Title, Description, Images (multi-upload), Rent, City, Location, Type, Bedrooms, Bathrooms, Furnishing, Parking, Available From, Contact Number
3. Image upload: authenticated → Supabase Storage (private bucket) → public URL via CDN
4. Submit → createProperty (server action) → status: "pending"
4. Toast: "Submitted for review"
5. Admin approves → property status "approved" → appears on /rent
6. Agency sees property in dashboard with "Pending" badge → updates to "Approved"
```

### Journey 4: Renter Searching
```
1. /rent → HeroSearch or filter sidebar
2. Applies: Sector 62, 2 BHK, Furnished, Parking, Max ₹40,000
3. URL updates: /rent/noida?sector=sector-62&bedrooms=2&furnishing=furnished&parking=true&maxRent=40000
4. Results: PropertyCard grid, paginated
5. Clicks card → /property/[id]
6. Reviews gallery, overview, amenities, agency, reviews
7. Clicks "Save" → heart fills → renter_favorites insert
8. Clicks "Schedule Visit" → ScheduleVisitModal → picks date/time → submits
9. property_visits row created → agency notified
```

### Journey 5: Visit Scheduling (Phase 1)
```
Renter:
1. On property detail → "Schedule Visit"
2. Modal: Date picker (min today, max 30 days), Time slots (agency-defined 1hr blocks), Optional message
3. Submit → POST /api/visits → creates property_visits (status: "requested")
4. Toast: "Visit requested. Agency will confirm."

Agency:
1. Dashboard → Visits tab (Phase 2) or Leads table with visit flag
2. Sees "Requested" visit → Clicks → Accept / Reject / Reschedule
3. Accept → status "confirmed" → both parties notified (email + in-app)
4. Reschedule → proposes new slots → renter accepts/rejects
5. Day of visit → status "completed" (manual or auto after time)
```

### Journey 6: Favorite Property
```
1. Renter on /property/[id] or /rent grid → clicks heart
2. Optimistic UI: heart fills immediately
3. POST /api/favorites → renter_favorites upsert (on conflict do nothing)
4. Success: toast "Saved" → /renter Shortlisted tab shows property
5. Remove: heart outline → DELETE → removed from grid
```

### Journey 7: Admin Approval
```
1. Admin logs in → /admin
2. Agency queue: sees unverified agencies → "Verify" → VerifyAgencyButton (server action)
3. Property queue: sees pending properties → "Approve" → ApprovePropertyButton
4. Reject: RejectPropertyButton → property status "rejected" → agency notified
5. Delete: DeleteAgencyButton / DeletePropertyAdminButton → ConfirmDialog → hard delete
6. All actions audit-logged (admin id, target, action, timestamp)
```

---

## 15. Page-by-Page Specification

*For each page: Purpose, Target User, Components, Primary CTA, Secondary CTA, Data Required, Loading, Error, Empty, Success.*

### `/` (Home)
- **Purpose:** Convert visitors to renters/agencies, showcase live inventory
- **Target:** Visitor, Renter, Agency
- **Components:** HeroSearch, PropertyList, SectionHeader, Footer, trust strip, testimonials, stats, FAQ, contact
- **Primary CTA:** "Browse listings" → `#listings`
- **Secondary CTA:** "List as agency" → `/signup`
- **Data:** `properties` (approved, verified agencies, paginated), `count`
- **Loading:** `loading.tsx` → skeleton hero + skeleton grid
- **Error:** `error.tsx` → "Unable to load listings. Try again."
- **Empty:** "No listings yet" + "List as agency" CTA
- **Success:** Live grid with pagination

### `/rent` (Browse Rentals)
- **Purpose:** Primary discovery interface
- **Target:** Visitor, Renter, Agency
- **Components:** FilterSidebar, PropertyList, Pagination, HeroSearch (compact), MobileFilterDrawer
- **Primary CTA:** Property card → `/property/[id]`
- **Secondary CTA:** "Save" (renter), "Clear filters"
- **Data:** Filtered `properties` + `count` (server, indexed columns)
- **Loading:** FilterSidebar skeleton + PropertyList skeletons
- **Error:** Inline toast + retry button
- **Empty:** "No properties match your filters" + "Clear filters" + "Browse all"
- **Success:** Results with active filter chips

### `/rent/noida/[sector]` (Sector Page)
- **Purpose:** SEO landing for sector + pre-filtered results
- **Target:** Visitor (organic search)
- **Components:** SectorHero (sector name, avg rent, property count), PropertyList
- **Data:** `properties` where `city='Noida' AND location ILIKE sector`
- **Loading/Error/Empty:** Same as `/rent`

### `/property/[id]` (Property Details)
- **Purpose:** Conversion page — enquiry or visit
- **Target:** Visitor, Renter, Agency (owner), Admin
- **Components:** ImageGallery, OverviewGrid, AmenitiesGrid, AgencyCard, StaticMap, NearbyPlaces, AgencyReviews, LeadCaptureModal, ScheduleVisitModal, SeoAnalysisPanel (agency), SimilarListings, RecentlyViewed
- **Primary CTA:** "Contact Agency" (LeadCaptureModal)
- **Secondary CTA:** "Schedule Visit" (ScheduleVisitModal), "Save" (heart)
- **Data:** `property` (full), `agency` (joined), `seo_report` (optional), `reviews` (agency), `favorites` (renter check)
- **Loading:** `loading.tsx` → skeleton gallery + skeleton sections
- **Error:** `not-found.tsx` if property missing; `error.tsx` for server error
- **Empty:** N/A (property exists)
- **Success:** Full page, modals functional

### `/login` (Agency Login)
- **Purpose:** Authenticate agency, route to dashboard/onboarding
- **Target:** Agency
- **Components:** LoginForm, ErrorMessage, sessionExpired notice, Footer
- **Primary CTA:** "Sign in"
- **Secondary CTA:** "Create account" → `/signup`
- **Data:** Session check on mount (auto-redirect if valid)
- **Loading:** Button "Signing in..."
- **Error:** Inline "Invalid credentials" / "Email not verified"
- **Empty:** N/A
- **Success:** Redirect → `/dashboard` or `/onboarding/agency`

### `/signup` (Agency Signup)
- **Purpose:** Create auth user only (no agency row yet)
- **Target:** Visitor → Agency
- **Components:** SignupForm, ErrorMessage, verify-email success screen
- **Primary CTA:** "Create account"
- **Secondary CTA:** "Sign in" → `/login`
- **Data:** None (client-only Supabase)
- **Loading:** Button "Creating account..."
- **Error:** Inline (email taken, weak password)
- **Success:** Screen "Check your inbox" → "Go to sign in"

### `/verify-email`
- **Purpose:** Handle email confirmation link, show status
- **Target:** Agency, Renter
- **Components:** Status card (success/error), Resend button, "Go to sign in"
- **Data:** Hash params from Supabase
- **Loading:** "Verifying..." spinner
- **Error:** "Link expired/invalid" + Resend
- **Success:** "Email confirmed. Sign in to continue."

### `/onboarding/agency`
- **Purpose:** Create agency profile row (RLS: auth.uid())
- **Target:** Verified email, no agency row
- **Components:** AgencyOnboardingForm (name, owner, phone, city), ErrorMessage
- **Primary CTA:** "Submit for verification"
- **Secondary CTA:** "Return home" → `/`
- **Data:** None (writes only)
- **Loading:** Button "Submitting..."
- **Error:** Inline (name taken, validation)
- **Success:** Redirect `/dashboard` → pending screen

### `/dashboard` (Agency Dashboard)
- **Purpose:** Manage listings, leads, visits, analytics
- **Target:** Verified agency
- **Components:** StatsCards, LeadsChart, QuickActions, PropertyGrid (PropertyCard + actions), TopPerformers, RecentLeads, Pagination
- **Primary CTA:** "Add new property" → `/add-property`
- **Secondary CTA:** "Edit profile" → `/profile`, "View public" → `/`
- **Data:** `agency`, `properties` (paginated + count), `leads`, `seo_reports` (for page), computed stats
- **Loading:** `loading.tsx` → skeleton stats + skeleton grid
- **Error:** Inline toast per section
- **Empty:** "No properties yet" + "Add property" CTA
- **Success:** Full dashboard with live data

### `/profile` (Agency Profile Editor)
- **Purpose:** Edit agency public profile
- **Target:** Agency (any verification state)
- **Components:** EditAgencyProfile form, ErrorMessage, success toast
- **Primary CTA:** "Save changes"
- **Data:** `agency` row
- **Loading:** Form disabled + "Saving..."
- **Success:** Toast "Profile updated" → router.refresh()

### `/add-property` & `/edit-property/[id]`
- **Purpose:** Create/update property (verified agencies only)
- **Target:** Verified agency (owner for edit)
- **Components:** PropertyFormFields (all fields), ImageUpload (multi, 5MB limit, validation), ErrorMessage, Submit
- **Primary CTA:** "Submit for review" / "Update property"
- **Data:** Cities, property types, furnishing options (static), existing property (edit)
- **Loading:** Image upload progress + button "Submitting..."
- **Error:** Field-level + toast
- **Success:** Toast "Submitted" / "Updated" → redirect `/dashboard`

### `/renter` (Renter Dashboard)
- **Purpose:** Manage saved properties, profile, visits (future)
- **Target:** Renter (authenticated)
- **Components:** TabNav (Shortlisted | Account), ShortlistedGrid (PropertyCard + Remove), AccountInfoCard (ProfileForm)
- **Primary CTA:** Property card → `/property/[id]`
- **Secondary CTA:** "Remove" (shortlisted), "Save changes" (profile), "View Listings" → `/#listings`
- **Data:** `profile`, `session`, `favorites` → `properties` (joined)
- **Loading:** `loading.tsx` → skeleton tabs + skeleton grid
- **Error:** Inline toast
- **Empty:** "No saved properties" + "Browse properties"
- **Success:** Live grid, profile saves

### `/admin` (Admin Panel)
- **Purpose:** Platform operations
- **Target:** Admin (`is_admin=true`)
- **Components:** StatCards, AgencyTable (Verify/Unverify/Delete), PropertyTable (Approve/Reject/Delete), Pagination
- **Primary CTA:** Verify agency, Approve property
- **Secondary CTA:** Bulk actions (future), Export (future)
- **Data:** `agencies` (all), `properties` (all), `leads` count
- **Loading:** Skeleton tables
- **Error:** Toast per action
- **Empty:** "No agencies/properties found"
- **Success:** Actions execute, tables update

---

## 16. Mobile Experience

### Design Principles
- **Mobile-first:** All components designed at 375px first, enhanced at breakpoints
- **Touch targets:** Minimum 48×48px (WCAG 2.5.5)
- **Thumb zone:** Primary actions bottom-right, navigation bottom
- **Progressive enhancement:** Core features work without JS (server components), JS adds interactivity

### Navigation
- **Hamburger menu** (MobileMenu) — slide-in from right, backdrop blur
- **Bottom nav** (Phase 2): Home, Browse, Saved, Profile — fixed, safe-area inset
- **Profile dropdown** → full-screen bottom sheet on mobile

### Search & Filters
- **HeroSearch:** Stacked fields, full-width, "Search" fixed bottom on scroll
- **Browse Rentals filters:** Collapsible drawer (slide-up sheet), "Apply (N)" sticky footer
- **Filter chips:** Horizontal scroll under search bar, tap ✕ to remove

### Property Cards
- **Grid:** 1 col (<640px), 2 col (640-1024px), 3 col (>1024px)
- **Image:** 16:9 aspect, `object-cover`, priority on first 3
- **CTAs:** Full-width stacked on card bottom: Contact (primary), Schedule (secondary), Save (icon)

### Dialogs & Modals
- **Full-screen** on mobile (max-w-full, rounded-t-3xl)
- **Drag handle** + swipe down to dismiss
- **Focus trap** within modal
- **Virtual keyboard** handling: `inputmode`, `autocomplete`, prevent zoom on focus (16px font)

### Dashboards
- **Cards stack:** Single column, generous whitespace
- **Tables:** Horizontal scroll with sticky first column
- **Charts:** Responsive SVG, touch-friendly tooltips
- **Tabs:** Scrollable pill row (Shortlisted | Account | Visits)

### Forms
- **Single column:** Labels above inputs
- **Native controls:** `<select>`, `<input type="date">`, `<input type="time">`
- **Auto-complete:** `autocomplete="name|tel|email|current-password|new-password"`
- **Validation:** Inline, on blur + submit, `aria-live="polite"` for errors

### Performance
- **Images:** `sizes` per breakpoint, `placeholder="blur"`, `priority` above fold
- **Code splitting:** `dynamic()` for heavy modals (RenterAuthDialog, ImageGallery zoom)
- **Prefetch:** `Link` prefetch on hover/focus (Next.js default)
- **Bundle:** Monitor with `@next/bundle-analyzer`, target <200KB gzipped JS initial

---

## 17. Accessibility

### Standards
- **WCAG 2.1 AA** minimum (target AAA for critical flows)
- **EN 301 549** / **Section 508** compliance for public sector readiness
- **Testing:** axe-core in CI, manual keyboard/screen reader testing per release

### Keyboard Navigation
- **Skip link:** "Skip to content" (first focusable element)
- **Focus order:** Logical DOM order, no traps except modals
- **Focus visible:** `focus-visible: outline: 2px solid var(--brand-primary) outline-offset: 2px`
- **Modal trap:** `FocusTrap` (custom or `react-aria`), ESC closes, focus returns to trigger
- **Dropdowns:** Arrow keys navigate, Enter/Space activate, ESC closes
- **Tabs:** Arrow keys switch, Enter activates, Home/End jump

### ARIA
- **Landmarks:** `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section aria-labelledby>`
- **Labels:** All inputs have `<label htmlFor>` or `aria-label`
- **Live regions:** `aria-live="polite"` for toasts, form errors, loading states
- **Dialogs:** `role="dialog" aria-modal="true" aria-labelledby="dialog-title"`
- **Expanded/collapsed:** `aria-expanded` on dropdown triggers, accordions
- **Selected:** `aria-selected` on tabs, `aria-current="page"` on active nav
- **Required/invalid:** `aria-required`, `aria-invalid`, `aria-describedby="error-id"`

### Focus Management
- **Route change:** Next.js 16 App Router — focus moves to `<main>` (via `next/navigation` `router.push` + `focus-management` in layout)
- **Modal open:** Focus first focusable element
- **Modal close:** Focus returns to trigger
- **Dynamic content:** `aria-live` announcements for filter results, saves, submissions

### Contrast
- **Text:** 4.5:1 minimum (AA), 7:1 for large text (AAA)
- **UI components:** 3:1 against adjacent (borders, focus rings)
- **Brand primary on white:** 4.5:1 ✓
- **Brand primary on brand-secondary:** 3:1 ✓ (large text only)
- **Muted text on background:** 4.5:1 ✓

### Screen Reader Support
- **Semantic HTML:** Proper heading hierarchy (h1 → h2 → h3)
- **Images:** `alt` descriptive (property: "3 BHK apartment in Sector 62, ₹35,000/month"), decorative `alt=""`
- **Icons:** `aria-hidden="true"` + text label or `aria-label` on button
- **Forms:** `fieldset` + `legend` for groups (e.g., filters)
- **Tables:** `<caption>`, `<th scope="col">`, `<th scope="row">`
- **Status:** `role="status" aria-live="polite"` for loading, success

---

## 18. Performance Guidelines

### Server vs Client Components
| Pattern | Rule |
|---------|------|
| **Default: Server Components** | All pages, data fetching, static UI |
| **Client when needed:** | Interactivity (modals, forms, dropdowns, optimistic UI), browser APIs (localStorage, geolocation), `useSearchParams`/`usePathname`/`useRouter` |
| **Boundary:** | Push client components to leaves (e.g., `RenterAuthDialog`, `MobileMenu`, `ImageGallery` zoom) |
| **Avoid:** | Client components at route level unless necessary |

### Caching
| Layer | Strategy |
|-------|----------|
| **Next.js Data Cache** | `fetch(..., { next: { revalidate: 60 }})` for public pages (ISR 60s) |
| **Route Cache** | Static routes: `export const dynamic = 'force-static'`; Dynamic: `export const dynamic = 'force-dynamic'` |
| **React Cache** | `cache()` on `requireUser`, `requireVerifiedAgency` (per-request memo) |
| **Supabase** | PostgREST query caching via `pg_stat_statements`; no client cache |
| **Browser** | `Cache-Control: public, max-age=0, must-revalidate` for HTML; `immutable` for hashed assets |

### Image Loading
- **Next.js Image:** Always use `<Image>` with `sizes`, `priority` (above fold), `placeholder="blur"` (blur data URL)
- **Formats:** AVIF/WebP automatic via `next.config.ts` Supabase loader
- **Sizes:** Hero 1200w, Card 400w, Thumbnail 160w — `srcSet` auto
- **Optimization:** Supabase Storage → CDN → Next.js Image Optimization API

### Lazy Loading
- **Components:** `dynamic(() => import(...), { ssr: false })` for modals, heavy charts, maps
- **Images:** `loading="lazy"` (default) below fold
- **Routes:** Next.js 16 automatic code splitting per route

### Code Splitting
- **Route-level:** Automatic (App Router)
- **Component-level:** `dynamic()` for:
  - `RenterAuthDialog` (large, infrequent)
  - `ImageGallery` zoom modal
  - `SeoAnalysisPanel` (agency only)
  - `MapView` (Phase 3)
  - Admin bulk action dialogs

### Bundle Size Targets
| Metric | Target |
|--------|--------|
| **Initial JS (gzipped)** | < 200 KB |
| **Homepage FCP** | < 1.2s (p75) |
| **Homepage LCP** | < 2.0s (p75) |
| **TTI** | < 3.0s (p75) |
| **CLS** | < 0.1 |
| **INP** | < 200ms |

### Monitoring
- **Vercel Analytics / Web Vitals** — production
- **Lighthouse CI** — PR gates
- **Custom metrics:** `metrics.ts` → `eventBus` → storage for dashboard

---

## 19. Product Principles

1. **Marketplace first.** Public browsing is the product. Dashboards are tools.
2. **Renters first.** Every decision optimizes for renter trust, speed, and success.
3. **Simple before clever.** Boring technology, obvious UX. No dark patterns.
4. **One primary CTA per screen.** Secondary actions visually distinct.
5. **Dashboard is a tool, not the homepage.** Agencies land on marketplace.
6. **Public browsing never disappears.** Authenticated users keep full marketplace access.
7. **Consistency over novelty.** Reuse components, tokens, patterns.
8. **Trust is earned, not claimed.** Verified badges, real photos, review transparency.
9. **Zero brokerage for tenants.** Business model aligned with renter value.
10. **Progressive disclosure.** Simple default, advanced on demand.
11. **Design for the 90% case.** Power features hidden but accessible.
12. **Fast by default.** Server components, ISR, optimized images, minimal JS.
13. **Accessible by default.** Semantic HTML, ARIA, contrast, keyboard — not afterthought.
14. **Data-driven iteration.** Instrument everything. Measure → learn → improve.
15. **Phased delivery.** Ship MVP, enhance in phases. No big bang.
16. **Mobile parity.** Every feature works on 375px viewport.
17. **Privacy by design.** Minimal data, purpose-limited, user-controlled.
18. **Error as guidance.** Inline, actionable, non-technical language.
19. **Agency success = platform success.** Tools that save them time → more listings.
20. **Local first.** Noida/NCR depth > broad shallow coverage.

---

## 20. Implementation Roadmap

### Sprint 5.2 — Navigation & Layout Foundation
**Effort:** 2-3 days  
**Scope:**
- Refine `Navbar`/`MobileMenu` per PDD navigation spec (hybrid, contextual)
- Add bottom navigation (mobile) — Phase 1: Home, Browse, Saved, Profile
- Skip link, focus management, ARIA landmarks audit
- Responsive container, spacing tokens verified

**Deliverables:**
- Unified nav for all auth states
- Mobile drawer + bottom nav
- Accessibility baseline pass

---

### Sprint 5.3 — Homepage Polish & HeroSearch
**Effort:** 2-3 days  
**Scope:**
- Homepage sections per Section 6 spec (trust strip, why, how, listings, areas, testimonials, numbers, FAQ, contact)
- `HeroSearch` → `/rent` with query params
- ISR `revalidate: 60` confirmed
- SEO metadata, Open Graph, structured data (WebSite, Organization)

**Deliverables:**
- Production-ready homepage
- Search entry point functional

---

### Sprint 5.4 — Browse Rentals (`/rent`)
**Effort:** 4-5 days  
**Scope:**
- `/rent` page with FilterSidebar (all Phase 1 filters)
- URL-synced filter state (nuqs or native searchParams)
- PropertyList grid + pagination (preserves filters)
- Mobile filter drawer (slide-up sheet)
- Filter chips + clear-all
- Skeleton loading states
- Empty/error states

**Deliverables:**
- Complete browse experience
- Shareable, bookmarkable filter URLs

---

### Sprint 5.5 — Property Details (`/property/[id]`)
**Effort:** 4-5 days  
**Scope:**
- Gallery with zoom modal, keyboard nav
- Overview, Amenities, AgencyCard, StaticMap, NearbyPlaces (static data)
- AgencyReviews (stars + short text, Phase 1)
- LeadCaptureModal (pre-filled from renter profile)
- ScheduleVisitModal (date picker, time slots, creates `property_visits`)
- Save/unsave (optimistic, `renter_favorites`)
- SimilarListings rail
- RecentlyViewed (localStorage → server sync)
- SEO structured data (Product, RealEstateListing)

**Deliverables:**
- Conversion-optimized property page
- Visit scheduling functional (Phase 1)

---

### Sprint 5.6 — Dashboards (Agency + Renter)
**Effort:** 5-6 days  
**Scope:**

**Agency Dashboard:**
- Stats cards, leads chart, quick actions
- Property grid with StatusBadge, SEO badge, Edit/Delete
- Leads table with inline status select
- Pending verification screen (unverified)
- Add/Edit property forms (image upload, validation)

**Renter Dashboard:**
- Shortlisted tab (grid + remove)
- Account tab (profile form, email read-only)
- Visits tab skeleton (Phase 2 ready)

**Shared:**
- Server actions for all mutations
- Optimistic UI + toast feedback
- Pagination preserved

---

### Sprint 5.7 — Mobile Polish & Accessibility
**Effort:** 3-4 days  
**Scope:**
- Full mobile audit (375px, 414px, iPad)
- Touch targets 48px minimum
- Bottom navigation (Home, Browse, Saved, Profile)
- Modal full-screen behavior, swipe dismiss
- Form native controls, autocomplete
- Keyboard navigation audit (Tab, Enter, ESC, Arrows)
- ARIA audit (landmarks, labels, live regions, roles)
- Contrast audit (text, UI, focus rings)
- Screen reader test (NVDA, VoiceOver)

**Deliverables:**
- Mobile parity checklist ✓
- WCAG 2.1 AA compliance ✓

---

### Sprint 5.8 — Admin Panel & Platform Features
**Effort:** 3-4 days  
**Scope:**
- Admin panel: Agency table (verify/unverify/delete), Property table (approve/reject/delete)
- Platform stats cards
- Audit logging for admin actions
- Rate limiting on auth endpoints (already in `rate-limit.ts`)
- Error boundaries (`error.tsx` per route)
- Toast system refinement (position, duration, action buttons)

---

### Sprint 5.9 — Performance & Launch Readiness
**Effort:** 2-3 days  
**Scope:**
- Lighthouse CI gate (FCP, LCP, CLS, INP thresholds)
- Bundle analysis (`@next/bundle-analyzer`), prune unused
- Image optimization audit (sizes, priority, blur placeholders)
- ISR verification (60s revalidate, fallback)
- Prefetch tuning (link hover/focus)
- Monitoring: Vercel Analytics + custom metrics
- Load test (k6) — 100 concurrent users, <2s p95
- Security headers audit (`next.config.ts`)
- Documentation: README, deployment, env vars

---

## 21. Sprint Task Breakdown (Executable)

### Sprint 5.2 — Navigation & Layout Foundation

| Task ID | Task | Files to Create/Modify | Acceptance Criteria | Tests |
|---------|------|------------------------|---------------------|-------|
| 5.2.1 | Refactor `Navbar` for hybrid auth states | `app/Navbar.tsx` | Shows correct links for: Visitor, Renter-only, Agency-unverified, Agency-verified, Hybrid, Admin | Unit: render per auth state; E2E: navigate all states |
| 5.2.2 | Enhance `MobileMenu` with profile section | `app/MobileMenu.tsx` | Slide-in from right; shows conditional profile links based on `isRenter`/`isAgency`/`isVerifiedAgency` | Unit: render props; E2E: open/close, tap links |
| 5.2.3 | Add mobile bottom navigation | `app/BottomNav.tsx` (new) | Fixed bottom: Home, Browse, Saved, Profile; safe-area inset; highlights active route | Unit: active route highlighting; E2E: tap navigation |
| 5.2.4 | Add skip-to-content link | `app/layout.tsx` | First focusable element; visible on focus; jumps to `#main-content` | Axe: skip link present; Keyboard: Tab → Enter works |
| 5.2.5 | Verify ARIA landmarks | `app/layout.tsx`, `app/Navbar.tsx` | `<header>`, `<nav>`, `<main>`, `<footer>` present; `aria-labelledby` on sections | Axe: landmarks complete |
| 5.2.6 | Focus management on route change | `app/layout.tsx` (client wrapper) | Focus moves to `<main>` after `router.push`; no focus loss | E2E: navigate → focus on main |

---

### Sprint 5.3 — Homepage Polish & HeroSearch

| Task ID | Task | Files to Create/Modify | Acceptance Criteria | Tests |
|---------|------|------------------------|---------------------|-------|
| 5.3.1 | Implement Trust Strip section | `app/page.tsx` | 4 pills: Verified, Zero brokerage, Direct chat, 24h review; responsive 4/2 col | Visual: matches design; Responsive: 375px/768px/1440px |
| 5.3.2 | Implement Why RenterEasy | `app/page.tsx` | 4 benefit cards with icons; mobile single column | Visual; Axe: heading hierarchy |
| 5.3.3 | Implement How It Works | `app/page.tsx` | 3 step cards with numbers; secondary "List as agency" CTA | Visual |
| 5.3.4 | Enhance Listings section | `app/page.tsx` | `PropertyList` with pagination; "Previous/Next" links preserve `#listings` anchor | E2E: pagination works; URL updates |
| 5.3.5 | Implement Popular Areas | `app/page.tsx` | 6 sector link cards with icons; hover elevation | Visual; E2E: click → sector page |
| 5.3.6 | Implement Testimonials | `app/page.tsx` | 3 cards with 5-star ratings, author avatar initials | Visual |
| 5.3.7 | Implement Numbers section | `app/page.tsx` | 4 large stats on dark brand bg; responsive 4-col | Visual |
| 5.3.8 | Implement FAQ accordions | `app/page.tsx` | 4 `<details>` items; animated +/–; support email link | Keyboard: Enter/Space toggles; Axe: accordion pattern |
| 5.3.9 | Implement Contact section | `app/page.tsx` | Email, area, "Create agency account" CTA → `/signup` | E2E: CTA navigation |
| 5.3.10 | Build `HeroSearch` component | `app/HeroSearch.tsx` (modify) | Location autocomplete, Type select, Bedrooms select, Max Rent input; submits to `/rent/noida` with params | Unit: form submission; E2E: search → results page |
| 5.3.11 | Add SEO metadata & structured data | `app/page.tsx`, `app/layout.tsx` | Title, description, OG, Twitter; `WebSite`, `Organization` JSON-LD | Lighthouse: SEO 100; Schema.org validator |
| 5.3.12 | Confirm ISR revalidate=60 | `app/page.tsx` | `export const revalidate = 60`; cache headers correct | Network: `cache-control: public, max-age=0, must-revalidate` |

---

### Sprint 5.4 — Browse Rentals (`/rent`)

| Task ID | Task | Files to Create/Modify | Acceptance Criteria | Tests |
|---------|------|------------------------|---------------------|-------|
| 5.4.1 | Create `/rent/page.tsx` (server) | `app/rent/page.tsx` (new) | Fetches filtered properties; passes to `BrowseRentalsClient` | Unit: query params → supabase query |
| 5.4.2 | Build `BrowseRentalsClient` | `app/rent/BrowseRentalsClient.tsx` (new) | FilterSidebar + PropertyList + Pagination; URL-synced state | E2E: filter → URL updates → refresh preserves |
| 5.4.3 | Build `FilterSidebar` | `app/rent/FilterSidebar.tsx` (new) | All Phase 1 filters: City, Sector (multi), Type (multi), Bedrooms, Bathrooms, Furnishing (multi), Parking, Price range slider | Unit: each filter → query param; Visual: collapse/expand |
| 5.4.4 | Build `FilterChips` | `app/rent/FilterChips.tsx` (new) | Horizontal scroll; shows active filters with ✕ remove; "Clear all" | E2E: add filter → chip appears → remove → filter clears |
| 5.4.5 | Mobile filter drawer | `app/rent/FilterDrawer.tsx` (new) | Slide-up sheet; "Apply (N)" sticky footer; backdrop close | E2E: open → apply → results update |
| 5.4.6 | URL-synced filter state | `app/rent/page.tsx`, client components | All filters in `searchParams`; shareable/bookmarkable; nuqs or native | E2E: copy URL → new tab → same results |
| 5.4.7 | Pagination with filter preservation | `app/rent/Pagination.tsx` (new) | Prev/Page X of Y/Next; `?page=N&filter=...` | E2E: page 2 → refresh → page 2 |
| 5.4.8 | Skeleton loading states | `app/rent/BrowseRentalsClient.tsx` | FilterSidebar skeleton + 6 PropertyCard skeletons | Visual: shimmer animation |
| 5.4.9 | Empty & error states | `app/rent/BrowseRentalsClient.tsx` | "No properties match" + "Clear filters" CTA; toast on fetch error | E2E: filter to empty → message; network fail → toast |
| 5.4.10 | Create `/rent/noida/page.tsx` | `app/rent/noida/page.tsx` (modify) | Pre-filters city=Noida; inherits browse layout | E2E: direct URL → Noida results |
| 5.4.11 | Create `/rent/noida/[sector]/page.tsx` | `app/rent/noida/[sector]/page.tsx` (modify) | Pre-filters sector; SEO title/meta per sector | Lighthouse: SEO; E2E: sector page loads |

---

### Sprint 5.5 — Property Details (`/property/[id]`)

| Task ID | Task | Files to Create/Modify | Acceptance Criteria | Tests |
|---------|------|------------------------|---------------------|-------|
| 5.5.1 | Enhance `ImageGallery` zoom modal | `app/ImageGallery.tsx` | Full-screen zoom; thumbnail strip; keyboard arrows; ESC close; swipe mobile | E2E: click hero → modal → nav → close |
| 5.5.2 | Build Overview grid | `app/property/[id]/PropertyOverview.tsx` (new) | Rent, deposit, availability, city, location, type, beds, baths, area, furnishing, parking, description | Visual: data matches DB; Responsive |
| 5.5.3 | Build Amenities icon grid | `app/property/[id]/PropertyAmenities.tsx` (new) | 12+ standard icons from `amenities` JSONB; responsive grid | Unit: amenity → icon mapping |
| 5.5.4 | Build `AgencyCard` | `app/AgencyCard.tsx` (modify) | Logo, name, verified badge, owner, city, phone, email, rating, review count, "View all listings" | Visual: verified badge prominent |
| 5.5.5 | Add Static Map | `app/property/[id]/PropertyMap.tsx` (new) | Mapbox static image centered on coords; fallback if no coords | Visual: map loads; Network: static URL |
| 5.5.6 | Add Nearby Places (static) | `app/property/[id]/NearbyPlaces.tsx` (new) | Curated list per sector: Metro, Mall, Hospital, School, Market with distance | Data: sector → places mapping |
| 5.5.7 | Enhance `AgencyReviews` | `app/renter/AgencyReviews.tsx` | Stars + optional text (≤300 chars); average, count, recent 3; "Write review" (Phase 2) | E2E: review display; Unit: rating calc |
| 5.5.8 | Build `LeadCaptureModal` | `app/LeadCaptureModal.tsx` (modify) | Pre-filled name/phone from renter profile; message; submit → `createLead` action; toast success | E2E: renter → modal → submit → lead created |
| 5.5.9 | Build `ScheduleVisitModal` | `app/ScheduleVisitModal.tsx` (new) | Date picker (today+30d), time slots (agency-defined), message; submit → `property_visits` insert | **Requires migration 0012**; E2E: request → visit row |
| 5.5.10 | Save/unsave (optimistic) | `app/renter/FavoriteButton.tsx` | Heart toggle → `renter_favorites` upsert/delete; immediate UI update; rollback on error | E2E: save → heart fills → refresh persists |
| 5.5.11 | Build `SimilarListings` rail | `app/SimilarListings.tsx` (modify) | 3-4 cards: same city/sector, rent ±20%, same beds; horizontal scroll | Unit: query logic; Visual: rail layout |
| 5.5.12 | Recently Viewed (localStorage) | `app/property/[id]/RecentlyViewed.tsx` (new) | Client-side array (max 5); persists 30d; horizontal `PropertyCard` scroll | E2E: view 3 → rail shows 3 |
| 5.5.13 | SEO structured data | `app/property/[id]/page.tsx` | `Product` + `RealEstateListing` JSON-LD with price, address, bedrooms, bathrooms, image | Schema.org validator; Lighthouse SEO |
| 5.5.14 | Sticky mobile CTAs | `app/property/[id]/PropertyCTAs.tsx` (new) | Fixed bottom: Contact (primary), Schedule (secondary), Save (icon) | Visual: safe-area; E2E: tap → modal |

---

### Sprint 5.6 — Dashboards (Agency + Renter)

| Task ID | Task | Files to Create/Modify | Acceptance Criteria | Tests |
|---------|------|------------------------|---------------------|-------|
| 5.6.1 | Agency Dashboard: Stats cards | `app/dashboard/page.tsx` | 4 cards: Properties, Leads, Leads This Month, Total Rent Value | Unit: computed values match DB |
| 5.6.2 | Agency Dashboard: Leads chart | `app/dashboard/LeadsChart.tsx` (new) | Monthly bar chart (12 months); responsive SVG; tooltip on hover | Visual: chart renders; Unit: data transform |
| 5.6.3 | Agency Dashboard: Quick actions | `app/dashboard/QuickActions.tsx` (new) | Add Property, Edit Profile, View Public links | E2E: click → navigation |
| 5.6.4 | Agency Dashboard: Property grid | `app/dashboard/PropertyGrid.tsx` (new) | Paginated `PropertyCard` with StatusBadge, SEO badge, Edit, Delete | E2E: pagination; delete → confirm → removed |
| 5.6.5 | Agency Dashboard: Leads table | `app/dashboard/LeadsTable.tsx` (new) | Columns: Property, Source, Status (select), Created, Actions; inline status update | E2E: change status → toast → row updates |
| 5.6.6 | Agency Dashboard: Top performers | `app/dashboard/TopPerformers.tsx` (new) | 5 properties by lead count; link to property | Unit: sort logic |
| 5.6.7 | Agency Dashboard: Recent leads | `app/dashboard/RecentLeads.tsx` (new) | 5 latest leads with property title, source, date, status select | E2E: status change |
| 5.6.8 | Pending verification screen | `app/dashboard/page.tsx` (modify) | Shows agency name, city, status badge, contact support, return home | Visual: matches design |
| 5.6.9 | Add Property form | `app/add-property/page.tsx` (modify) | All fields; multi-image upload (5MB, validation); submit → `createProperty` | E2E: fill → upload → submit → redirect dashboard |
| 5.6.10 | Edit Property form | `app/edit-property/[id]/page.tsx` (modify) | Pre-filled; ownership check; update → `updateProperty` | E2E: edit → save → changes persist |
| 5.6.11 | Renter Dashboard: Shortlisted tab | `app/renter/page.tsx` (modify) | Grid of saved properties with Remove button; empty state | E2E: remove → toast → grid updates |
| 5.6.12 | Renter Dashboard: Account tab | `app/renter/page.tsx` (modify) | Accordion: email (read-only) + ProfileForm (name, phone); validation; save toast | E2E: save → profile updates |
| 5.6.13 | Renter Dashboard: Visits tab skeleton | `app/renter/VisitsTab.tsx` (new) | Placeholder: "Visit scheduling coming soon" | Visual: tab exists |
| 5.6.14 | Server actions for all mutations | `app/actions.ts` (extend) | `createProperty`, `updateProperty`, `deleteProperty`, `updateLeadStatus`, `updateRenterProfile`, `requestVisit`, `acceptVisit`, `rejectVisit`, `rescheduleVisit` | Unit: each action → DB change + revalidate |

---

### Sprint 5.7 — Mobile Polish & Accessibility

| Task ID | Task | Files to Create/Modify | Acceptance Criteria | Tests |
|---------|------|------------------------|---------------------|-------|
| 5.7.1 | Mobile audit checklist | All pages | 375px, 414px, 768px: no horizontal scroll; touch targets ≥48px; text ≥16px | Visual regression: Percy/Chromatic |
| 5.7.2 | Bottom navigation implementation | `app/BottomNav.tsx` | Fixed; Home/Browse/Saved/Profile; safe-area; active indicator | E2E: tap each → correct route |
| 5.7.3 | Modal full-screen mobile | `app/ConfirmDialog.tsx`, `app/Toast.tsx`, modals | `max-w-full rounded-t-3xl`; drag handle; swipe down dismiss; focus trap | E2E: open → swipe → closed; Keyboard: Tab trap |
| 5.7.4 | Form native controls | All forms | `<select>`, `<input type="date">`, `<input type="time">`; `autocomplete` attrs | Visual: native pickers; Axe: form labels |
| 5.7.5 | Keyboard navigation audit | All interactive | Tab order logical; Enter/Space activates; ESC closes; Arrow keys in menus/tabs | Manual: Tab through every page |
| 5.7.6 | ARIA audit | All components | Landmarks, labels, live regions, roles, expanded/selected, required/invalid | Axe-core CI: 0 violations |
| 5.7.7 | Contrast audit | `app/globals.css` | All text 4.5:1; UI 3:1; focus rings 3:1 | Tool: colour-contrast-analyzer |
| 5.7.8 | Screen reader testing | Critical flows | NVDA (Windows) + VoiceOver (Mac): Home → Search → Property → Lead → Dashboard | Manual: each flow announced correctly |

---

### Sprint 5.8 — Admin Panel & Platform Features

| Task ID | Task | Files to Create/Modify | Acceptance Criteria | Tests |
|---------|------|------------------------|---------------------|-------|
| 5.8.1 | Admin: Agency table | `app/admin/AgencyTable.tsx` (new) | Columns: name, owner, city, email, phone, verified, is_admin; Verify/Unverify/Delete (non-admin) | E2E: verify → badge updates; delete → confirm → removed |
| 5.8.2 | Admin: Property table | `app/admin/PropertyTable.tsx` (new) | Columns: title, rent, location, city, status; Approve/Reject/Delete | E2E: approve → status badge changes |
| 5.8.3 | Admin: Platform stats | `app/admin/StatCards.tsx` (reuse) | 4 cards: Total Agencies, Verified, Total Properties, Total Leads (head count) | Unit: counts match DB |
| 5.8.4 | Admin audit logging | `app/actions.ts` (extend) | Every admin action: `admin_audit_log` insert (admin_id, target_type, target_id, action, timestamp) | Unit: action → log row |
| 5.8.5 | Rate limiting on auth | `lib/rate-limit.ts` (verify) | `/api/auth/*` endpoints: 5 req/min per IP; 20 req/min per user | E2E: brute force → 429 |
| 5.8.6 | Error boundaries per route | `app/*/error.tsx` (add) | Each route segment has `error.tsx` with "Try again" button; logs to Sentry | E2E: throw → boundary catches |
| 5.8.7 | Toast system refinement | `app/Toast.tsx` | Top-right; 5s auto-dismiss; action button support; stack max 3; accessible live region | E2E: success/error/info toasts |
| 5.8.8 | Admin authentication guard | `app/admin/page.tsx` | `requireUser` → `is_admin` check → redirect `/` if not admin | E2E: non-admin → redirect |

---

### Sprint 5.9 — Performance & Launch Readiness

| Task ID | Task | Files to Create/Modify | Acceptance Criteria | Tests |
|---------|------|------------------------|---------------------|-------|
| 5.9.1 | Lighthouse CI gate | `.github/workflows/lighthouse.yml` (new) | PR fails if: FCP>1.2s, LCP>2.0s, CLS>0.1, INP>200ms | CI: runs on PR |
| 5.9.2 | Bundle analysis | `@next/bundle-analyzer` config | Initial JS <200KB gzipped; identify largest chunks | Script: `npm run analyze` |
| 5.9.3 | Image optimization audit | All `<Image>` usage | `sizes` per breakpoint; `priority` above fold; `placeholder="blur"` with data URL | Lighthouse: images optimized |
| 5.9.4 | ISR verification | `app/page.tsx`, `app/rent/page.tsx`, `app/property/[id]/page.tsx` | `revalidate=60`; `fallback` works; cache headers correct | Network: `x-vercel-cache: HIT/STALE` |
| 5.9.5 | Prefetch tuning | `app/Navbar.tsx`, `app/PropertyCard.tsx` | `prefetch` on hover/focus (default); disable for heavy modals | Network: prefetch requests |
| 5.9.6 | Monitoring setup | `lib/metrics.ts`, `app/layout.tsx` | Vercel Analytics + custom `eventBus` → storage; Web Vitals logged | Dashboard: metrics visible |
| 5.9.7 | Load test (k6) | `k6/script.js` (new) | 100 VUs, 2min; p95 <2s; error rate <1% | k6 report: thresholds pass |
| 5.9.8 | Security headers | `next.config.ts` | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy | Securityheaders.com: A+ |
| 5.9.9 | Documentation | `README.md`, `DEPLOYMENT.md`, `.env.example` | Local dev, env vars, deploy steps, Supabase setup, migration order | New dev: follows README → running app |

## Appendix: Component API Contracts (TypeScript Interfaces)

*Exact props/types for every component in Section 13 + missing components from sprints. Implementation agents must match these signatures.*

### Layout & Navigation

```typescript
// app/Navbar.tsx
interface NavbarProps {} // Server component, no props

// app/MobileMenu.tsx
interface MobileMenuProps {
  navItems: Array<{ label: string; href: string }>;
  showProfileButton: boolean;
  profileButton?: React.ReactNode;
}

// app/BottomNav.tsx (new - Sprint 5.7)
interface BottomNavProps {
  items: Array<{
    href: string;
    label: string;
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
  }>;
  activeHref: string;
}

// app/ProfileDropdown.tsx
interface ProfileDropdownProps {
  isRenter: boolean;
  isAgency: boolean;
  isVerifiedAgency: boolean;
}

// app/Footer.tsx
interface FooterProps {} // Static

// app/Logo.tsx
interface LogoProps {
  className?: string;
}
```

### Property & Listings

```typescript
// app/PropertyCard.tsx
interface PropertyCardProps {
  property: Property; // from app/types.ts
  actions?: React.ReactNode;
  variant?: 'default' | 'horizontal' | 'compact';
  showSave?: boolean;
  onSave?: (propertyId: string) => Promise<void>;
  saved?: boolean;
}

// app/PropertyList.tsx
interface PropertyListProps {
  properties: Property[];
}

// app/PropertyFormFields.tsx
interface PropertyFormFieldsProps {
  form: UseFormReturn<PropertyFormData>; // React Hook Form
  errors: FieldErrors<PropertyFormData>;
  isEditing?: boolean;
  existingImages?: string[];
}

// app/ImageGallery.tsx
interface ImageGalleryProps {
  images: string[];
  heroIndex?: number;
  propertyTitle?: string; // for alt text
}

// app/HeroSearch.tsx
interface HeroSearchProps {
  defaultValues?: Partial<SearchFilters>;
  onSearch?: (filters: SearchFilters) => void;
}

// app/SectionHeader.tsx
interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  action?: React.ReactNode;
}

// app/StatCard.tsx
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string; positive: boolean };
}

// app/StatusBadge.tsx
type StatusBadgeStatus = 'approved' | 'pending' | 'rejected' | 'verified' | 'requested' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';
interface StatusBadgeProps {
  status: StatusBadgeStatus;
  size?: 'sm' | 'md' | 'lg';
}

// app/BrowseRentals/FilterSidebar.tsx (new - Sprint 5.4)
interface FilterSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  sectors: string[];
  propertyTypes: string[];
  furnishingOptions: string[];
  isOpen?: boolean;
  onClose?: () => void;
}

// app/BrowseRentals/FilterChips.tsx (new - Sprint 5.4)
interface FilterChipsProps {
  filters: SearchFilters;
  onRemoveFilter: (key: keyof SearchFilters) => void;
  onClearAll: () => void;
}

// app/BrowseRentals/FilterDrawer.tsx (new - Sprint 5.4)
interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
  sectors: string[];
  propertyTypes: string[];
  furnishingOptions: string[];
}

// app/BrowseRentals/Pagination.tsx (new - Sprint 5.4)
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  baseUrl: string;
  preserveParams?: Record<string, string>;
}

// app/property/[id]/PropertyOverview.tsx (new - Sprint 5.5)
interface PropertyOverviewProps {
  property: Property & { agency: Agency };
}

// app/property/[id]/PropertyAmenities.tsx (new - Sprint 5.5)
interface PropertyAmenitiesProps {
  amenities: string[]; // from property.amenities JSONB
}

// app/property/[id]/PropertyMap.tsx (new - Sprint 5.5)
interface PropertyMapProps {
  lat?: number;
  lng?: number;
  address?: string;
  zoom?: number;
}

// app/property/[id]/NearbyPlaces.tsx (new - Sprint 5.5)
interface NearbyPlace {
  name: string;
  type: 'metro' | 'mall' | 'hospital' | 'school' | 'market';
  distance: string; // e.g., "0.5 km"
  icon: React.ReactNode;
}
interface NearbyPlacesProps {
  sector: string; // e.g., "sector-62"
  places: NearbyPlace[];
}

// app/LeadCaptureModal.tsx
interface LeadCaptureModalProps {
  propertyId: string;
  agencyId: string;
  isOpen: boolean;
  onClose: () => void;
  prefill?: { name?: string; phone?: string };
}

// app/ScheduleVisitModal.tsx (new - Sprint 5.5)
interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
  available: boolean;
}
interface ScheduleVisitModalProps {
  propertyId: string;
  agencyId: string;
  isOpen: boolean;
  onClose: () => void;
  slots: TimeSlot[];
  minDate: Date;
  maxDate: Date;
}

// app/ScheduleVisitButton.tsx
interface ScheduleVisitButtonProps {
  propertyId: string;
  agencyId: string;
}

// app/FavoriteButton.tsx
interface FavoriteButtonProps {
  propertyId: string;
  initialSaved?: boolean;
  onToggle?: (saved: boolean) => void;
}

// app/AgencyCard.tsx
interface AgencyCardProps {
  agency: Agency & { rating?: number; reviewCount?: number };
  variant?: 'default' | 'compact';
  showViewListings?: boolean;
}

// app/AgencyReviews.tsx
interface AgencyReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}
interface AgencyReviewsProps {
  agencyId: string;
  reviews?: AgencyReview[];
  averageRating?: number;
  reviewCount?: number;
  maxDisplay?: number;
}

// app/SimilarListings.tsx
interface SimilarListingsProps {
  propertyId: string;
  limit?: number;
}

// app/property/[id]/PropertyCTAs.tsx (new - Sprint 5.5)
interface PropertyCTAsProps {
  propertyId: string;
  agencyId: string;
  saved?: boolean;
  onSave?: (saved: boolean) => void;
}

// ============================================
// AGENCY AVAILABILITY COMPONENTS (Sprint 5.5)
// ============================================

// app/agency/AvailabilitySettings.tsx (new - Sprint 5.5)
interface DaySchedule {
  dayOfWeek: number; // 0-6
  isActive: boolean;
  windows: Array<{
    id: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
  }>;
}
interface AvailabilitySettingsProps {
  agencyId: string;
  initialSchedule: DaySchedule[];
  slotDuration: 30 | 60;
  bufferMinutes: number;
  onSave: (schedule: DaySchedule[], slotDuration: 30 | 60, bufferMinutes: number) => Promise<void>;
  isLoading?: boolean;
}

// app/agency/AvailabilityExceptions.tsx (new - Sprint 5.5)
interface AvailabilityException {
  id: string;
  exceptionDate: string; // YYYY-MM-DD
  isAvailable: boolean;
  customStartTime?: string;
  customEndTime?: string;
  reason?: string;
}
interface AvailabilityExceptionsProps {
  agencyId: string;
  exceptions: AvailabilityException[];
  onAdd: (exception: Omit<AvailabilityException, 'id'>) => Promise<void>;
  onDelete: (exceptionId: string) => Promise<void>;
  onUpdate: (exception: AvailabilityException) => Promise<void>;
  isLoading?: boolean;
}

// lib/visit-slots.ts (utility - Sprint 5.5)
interface GenerateSlotsParams {
  agencyId: string;
  startDate: Date;
  endDate: Date;
  agencyAvailability: AgencyAvailability[];
  exceptions: AvailabilityException[];
  existingVisits: PropertyVisit[];
  slotDuration: 30 | 60;
  bufferMinutes: number;
}
interface GeneratedSlot {
  start: Date;
  end: Date;
  available: boolean;
  visitId?: string; // if booked
  visitStatus?: PropertyVisit['status'];
}
function generateAvailableSlots(params: GenerateSlotsParams): GeneratedSlot[];

// Types for agency_availability table
interface AgencyAvailability {
  id: string;
  agency_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: 30 | 60;
  buffer_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Auth & Renter

```typescript
// app/renter/RenterAuthDialog.tsx
interface RenterAuthDialogProps {} // No props, uses context

// app/renter/RenterNavButton.tsx
interface RenterNavButtonProps {
  variant?: 'primary' | 'secondary';
  children?: React.ReactNode;
}

// app/renter/RenterSessionProvider.tsx
interface RenterSessionContextValue {
  profile: RenterProfile | null;
  session: Session | null;
  isLoading: boolean;
  openAuthDialog: (mode?: 'signin' | 'signup') => void;
  refreshProfile: (userId: string) => Promise<void>;
}

// app/renter/useFavorites.ts
interface UseFavoritesReturn {
  favorites: string[]; // property IDs
  toggleFavorite: (propertyId: string) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  isLoading: boolean;
}

// app/renter/useRenterSession.ts
interface UseRenterSessionReturn {
  profile: RenterProfile | null;
  session: Session | null;
  isLoading: boolean;
  openAuthDialog: (mode?: 'signin' | 'signup') => void;
  refreshProfile: (userId: string) => Promise<void>;
}
```

### Agency & Dashboard

```typescript
// app/onboarding/agency/AgencyOnboardingForm.tsx
interface AgencyOnboardingFormProps {} // Server action form

// app/EditAgencyProfile.tsx
interface EditAgencyProfileProps {} // Server action form

// app/EditPropertyForm.tsx
interface EditPropertyFormProps {
  property: Property;
}

// app/VerifyAgencyButton.tsx
interface VerifyAgencyButtonProps {
  agencyId: string;
  agencyName?: string;
}

// app/UnverifyAgencyButton.tsx
interface UnverifyAgencyButtonProps {
  agencyId: string;
  agencyName?: string;
}

// app/ApprovePropertyButton.tsx
interface ApprovePropertyButtonProps {
  propertyId: string;
  propertyTitle?: string;
}

// app/RejectPropertyButton.tsx
interface RejectPropertyButtonProps {
  propertyId: string;
  propertyTitle?: string;
}

// app/DeleteButton.tsx
interface DeleteButtonProps {
  id: string;
  type: 'property' | 'lead' | 'visit' | 'agency';
  name?: string;
  onSuccess?: () => void;
}

// app/DeleteAgencyButton.tsx
interface DeleteAgencyButtonProps {
  agencyId: string;
  agencyName?: string;
}

// app/DeletePropertyAdminButton.tsx
interface DeletePropertyAdminButtonProps {
  propertyId: string;
  propertyTitle?: string;
}

// app/LeadStatusSelect.tsx
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'spam';
interface LeadStatusSelectProps {
  leadId: string;
  currentStatus: LeadStatus;
  onChange: (status: LeadStatus) => Promise<void>;
}

// app/dashboard/LeadsChart.tsx (new - Sprint 5.6)
interface LeadsChartProps {
  data: Array<{ label: string; count: number }>;
  maxCount: number;
  year: number;
}

// app/dashboard/QuickActions.tsx (new - Sprint 5.6)
interface QuickActionsProps {
  isVerified: boolean;
  onAddProperty: () => void;
  onEditProfile: () => void;
  onViewPublic: () => void;
}

// app/dashboard/PropertyGrid.tsx (new - Sprint 5.6)
interface PropertyGridProps {
  properties: Array<Property & { seo_report?: SeoReport | null }>;
  pagination: PaginationResult<Property>;
  onPageChange: (page: number) => void;
  onEdit: (propertyId: string) => void;
  onDelete: (propertyId: string) => void;
  onViewSeo: (propertyId: string) => void;
}

// app/dashboard/TopPerformers.tsx (new - Sprint 5.6)
interface TopPerformersProps {
  properties: Array<Property & { leadCount: number }>;
}

// app/dashboard/RecentLeads.tsx (new - Sprint 5.6)
interface RecentLeadsProps {
  leads: Lead[];
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

// app/renter/VisitsTab.tsx (new - Sprint 5.6)
interface VisitsTabProps {
  visits: Array<PropertyVisit & { property: Property; agency: Agency }>;
  onReschedule: (visitId: string, newDate: Date, newSlot: TimeSlot) => Promise<void>;
  onCancel: (visitId: string) => Promise<void>;
}

// Type for property_visits table
interface PropertyVisit {
  id: string;
  property_id: string;
  renter_id: string;
  agency_id: string;
  scheduled_at: string;
  status: 'requested' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';
  message: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}
```

### UI Primitives

```typescript
// app/Toast.tsx
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastProps {
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
  duration?: number;
}
interface ToastProviderProps {
  children: React.ReactNode;
}

// app/ConfirmDialog.tsx
interface ConfirmDialogProps {
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'secondary';
  isOpen: boolean;
  onClose: () => void;
}
interface ConfirmProviderProps {
  children: React.ReactNode;
}

// app/ErrorMessage.tsx
interface ErrorMessageProps {
  message: string | null;
  className?: string;
}

// app/ApplicationSubmitted.tsx
interface ApplicationSubmittedProps {
  onClose: () => void;
  type: 'lead' | 'visit';
  referenceId?: string;
}
```

### SEO & Admin

```typescript
// app/SeoAnalysisPanel.tsx
interface SeoReport {
  id: string;
  property_id: string;
  overall_score: number;
  overall_grade: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  report_json: unknown;
  analyzer_version: string;
  created_at: string;
  updated_at: string;
}
interface SeoAnalysisPanelProps {
  report: SeoReport | null;
  propertyId: string;
}

// app/admin/AgencyTable.tsx (new - Sprint 5.8)
interface AgencyTableProps {
  agencies: Agency[];
  onVerify: (agencyId: string) => Promise<void>;
  onUnverify: (agencyId: string) => Promise<void>;
  onDelete: (agencyId: string, agencyName: string) => Promise<void>;
  isLoading?: boolean;
}

// app/admin/PropertyTable.tsx (new - Sprint 5.8)
interface PropertyTableProps {
  properties: Property[];
  onApprove: (propertyId: string) => Promise<void>;
  onReject: (propertyId: string) => Promise<void>;
  onDelete: (propertyId: string, propertyTitle: string) => Promise<void>;
  isLoading?: boolean;
}

// app/admin/StatCards.tsx (reuse from StatCard)
interface AdminStatCardsProps {
  stats: Array<{
    label: string;
    value: string | number;
    sub: string;
    icon: React.ReactNode;
  }>;
}
```

### Search & Filter Types

```typescript
// lib/listing-query.ts (shared)
interface SearchFilters {
  q?: string;                    // free text search
  city?: string;                 // e.g., "Noida"
  location?: string | string[];  // sector(s)
  property_type?: string | string[];
  bedrooms?: number;             // minimum
  bathrooms?: number;            // minimum
  furnishing?: string | string[];
  parking?: boolean;
  minRent?: number;
  maxRent?: number;
  sort?: 'newest' | 'rent_asc' | 'rent_desc' | 'most_viewed';
  page?: number;
  limit?: number;
}
```

---

## Appendix: Missing Components Referenced in Sprints

*Components from sprint task tables not listed in Section 13. Must be created.*

| Component | Sprint | Path | Purpose |
|-----------|--------|------|---------|
| `FilterSidebar` | 5.4 | `app/rent/FilterSidebar.tsx` | Desktop filter panel |
| `FilterChips` | 5.4 | `app/rent/FilterChips.tsx` | Active filter tags |
| `FilterDrawer` | 5.4 | `app/rent/FilterDrawer.tsx` | Mobile filter sheet |
| `Pagination` | 5.4 | `app/rent/Pagination.tsx` | Reusable pagination |
| `PropertyOverview` | 5.5 | `app/property/[id]/PropertyOverview.tsx` | Details grid |
| `PropertyAmenities` | 5.5 | `app/property/[id]/PropertyAmenities.tsx` | Amenity icons |
| `PropertyMap` | 5.5 | `app/property/[id]/PropertyMap.tsx` | Static map image |
| `NearbyPlaces` | 5.5 | `app/property/[id]/NearbyPlaces.tsx` | Sector POIs |
| `ScheduleVisitModal` | 5.5 | `app/ScheduleVisitModal.tsx` | Visit booking |
| `PropertyCTAs` | 5.5 | `app/property/[id]/PropertyCTAs.tsx` | Sticky mobile CTAs |
| `LeadsChart` | 5.6 | `app/dashboard/LeadsChart.tsx` | Monthly bar chart |
| `QuickActions` | 5.6 | `app/dashboard/QuickActions.tsx` | Dashboard actions |
| `PropertyGrid` | 5.6 | `app/dashboard/PropertyGrid.tsx` | Paginated grid |
| `TopPerformers` | 5.6 | `app/dashboard/TopPerformers.tsx` | Lead-ranked properties |
| `RecentLeads` | 5.6 | `app/dashboard/RecentLeads.tsx` | Latest leads table |
| `VisitsTab` | 5.6 | `app/renter/VisitsTab.tsx` | Renter visits placeholder |
| `BottomNav` | 5.7 | `app/BottomNav.tsx` | Mobile bottom bar |
| `AgencyTable` | 5.8 | `app/admin/AgencyTable.tsx` | Admin agency management |
| `PropertyTable` | 5.8 | `app/admin/PropertyTable.tsx` | Admin property management |
| `AdminStatCards` | 5.8 | `app/admin/StatCards.tsx` | Admin stats (reuse StatCard) |
| `AgencyAvailabilityForm` | 5.5 | `app/agency/AgencyAvailabilityForm.tsx` | Agency sets weekly schedule |
| `AvailabilityExceptionsForm` | 5.5 | `app/agency/AvailabilityExceptionsForm.tsx` | Agency sets holidays/exceptions |
| `VisitSlotsGenerator` | 5.5 | `lib/visit-slots.ts` | Generates slots from availability |

---

## Appendix: Performance Budgets per Route

| Route | Target LCP | Target CLS | Target INP | JS Budget (gz) |
|-------|------------|------------|------------|----------------|
| `/` (Home) | <1.5s | <0.1 | <200ms | <80KB |
| `/rent` | <2.0s | <0.1 | <200ms | <100KB |
| `/rent/noida/[sector]` | <2.0s | <0.1 | <200ms | <90KB |
| `/property/[id]` | <2.0s | <0.1 | <200ms | <120KB |
| `/dashboard` | <2.5s | <0.1 | <200ms | <150KB |
| `/renter` | <2.0s | <0.1 | <200ms | <100KB |
| `/admin` | <3.0s | <0.1 | <200ms | <150KB |
| `/login`, `/signup` | <1.5s | <0.1 | <200ms | <60KB |
| `/onboarding/agency` | <2.0s | <0.1 | <200ms | <80KB |
| `/add-property`, `/edit-property/[id]` | <2.5s | <0.1 | <200ms | <120KB |

---

## Appendix: Migration Application Checklist

**Pre-Sprint 5.5 (required for Visit Scheduling):**
- [ ] `0012_create_property_visits.sql` applied to Supabase
- [ ] `property_visits` table exists with indexes and RLS
- [ ] `admin_audit_log` table exists with indexes and RLS
- [ ] TypeScript types generated: `npx supabase gen types typescript --project-id <id> > app/types.ts`

**Post-Sprint 5.9 (Production):**
- [ ] All migrations applied to production Supabase
- [ ] RLS policies verified in production
- [ ] Storage bucket `property-images` created (private, CDN via Next.js Image)
- [ ] Edge Functions deployed (if any)
- [ ] Environment variables set in Vercel
- [ ] Custom domain `renterseasy.in` configured
- [ ] SSL/TLS active (HSTS header)
- [ ] Monitoring alerts configured (Vercel + Sentry)

---

**End of Product Design Document**

### Core Tables (Current)
| Table | Key Columns | RLS Policy |
|-------|-------------|------------|
| `agencies` | id, auth_user_id, agency_name, owner_name, phone, city, email, verified, is_admin | Owner read/write; Admin all; Public read verified |
| `properties` | id, agency_id, title, description, image_url, cover_image_url, rent, city, location, property_type, bedrooms, bathrooms, furnishing, parking, available_from, contact_number, status, area_sqft, views_count | Owner CRUD; Admin all; Public read approved+verified |
| `leads` | id, lead_name, lead_phone, property_id, agency_id, source, status, renter_id, notes | Agency read/write own; Renter read own; Admin all |
| `renter_profiles` | id, user_id, full_name, phone_number | Owner read/write; Public none |
| `renter_favorites` | renter_id, property_id, created_at | Owner CRUD |
| `agency_reviews` | id, renter_id, agency_id, reviewer_name, rating, comment | Renter CRUD own; Public read; Agency read own |
| `property_visits` | (Phase 1 migration) id, property_id, renter_id, agency_id, scheduled_at, status, message | Renter create own; Agency read/write own; Admin all |
| `seo_reports` | id, property_id, overall_score, overall_grade, report_json | Agency read own; Admin all |

### Enums / Constants
- `property.status`: `pending` | `approved` | `rejected`
- `lead.status`: `new` | `contacted` | `qualified` | `closed` | `spam`
- `visit.status`: `requested` | `confirmed` | `rescheduled` | `completed` | `cancelled` | `no_show`
- `review.rating`: 1-5 integer

### Missing Migration: `0012_create_property_visits.sql` (Required for Sprint 5.5)

```sql
-- 0012_create_property_visits.sql
-- Creates property_visits + agency_availability + availability_exceptions for Phase 1 visit scheduling

-- ============================================================
-- agency_availability: Weekly recurring availability
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agency_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes SMALLINT NOT NULL DEFAULT 60 CHECK (slot_duration_minutes IN (30, 60)),
    buffer_minutes SMALLINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (agency_id, day_of_week, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_agency_availability_agency ON public.agency_availability(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_availability_day ON public.agency_availability(day_of_week);

ALTER TABLE public.agency_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_availability_owner" ON public.agency_availability
    FOR ALL USING (
        agency_id IN (
            SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
        )
    ) WITH CHECK (
        agency_id IN (
            SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "agency_availability_public_read" ON public.agency_availability
    FOR SELECT USING (
        agency_id IN (
            SELECT id FROM public.agencies WHERE verified = true
        ) AND is_active = true
    );

-- ============================================================
-- availability_exceptions: Holiday / unavailable dates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.availability_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT false,
    custom_start_time TIME,
    custom_end_time TIME,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (agency_id, exception_date)
);

CREATE INDEX IF NOT EXISTS idx_availability_exceptions_agency ON public.availability_exceptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_date ON public.availability_exceptions(exception_date);

ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_exceptions_owner" ON public.availability_exceptions
    FOR ALL USING (
        agency_id IN (
            SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
        )
    ) WITH CHECK (
        agency_id IN (
            SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "availability_exceptions_public_read" ON public.availability_exceptions
    FOR SELECT USING (
        agency_id IN (
            SELECT id FROM public.agencies WHERE verified = true
        )
    );

-- ============================================================
-- property_visits: Booked visits (updated with scheduled_start/end)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES public.renter_profiles(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show')),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_property_visits_property ON public.property_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_renter ON public.property_visits(renter_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_agency ON public.property_visits(agency_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_status ON public.property_visits(status);
CREATE INDEX IF NOT EXISTS idx_property_visits_scheduled ON public.property_visits(scheduled_start);

ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "renter_create_visits" ON public.property_visits
    FOR INSERT WITH CHECK (
        renter_id IN (
            SELECT id FROM public.renter_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "renter_read_visits" ON public.property_visits
    FOR SELECT USING (
        renter_id IN (
            SELECT id FROM public.renter_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "agency_manage_visits" ON public.property_visits
    FOR ALL USING (
        agency_id IN (
            SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
        )
    ) WITH CHECK (
        agency_id IN (
            SELECT id FROM public.agencies WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "admin_all_visits" ON public.property_visits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.agencies WHERE auth_user_id = auth.uid() AND is_admin = true
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.agencies WHERE auth_user_id = auth.uid() AND is_admin = true
        )
    );

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.property_visits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- admin_audit_log (Sprint 5.8)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log(created_at);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_log_admin" ON public.admin_audit_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.agencies WHERE auth_user_id = auth.uid() AND is_admin = true
        )
    );
```

**Apply order:** After `0011_database_reconciliation.sql`, run `0012_create_property_visits.sql` in Supabase SQL Editor.

---

## Appendix: API Routes (Current)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/properties` | GET | Public | List with filters, pagination |
| `/api/properties` | POST | Verified Agency | Create property (server action) |
| `/api/properties/[id]` | GET | Public | Property detail |
| `/api/properties/[id]` | PATCH | Owner/Admin | Update property |
| `/api/properties/[id]` | DELETE | Owner/Admin | Delete property |
| `/api/leads` | POST | Renter | Create lead (server action) |
| `/api/leads/[id]` | PATCH | Agency/Admin | Update lead status |
| `/api/favorites` | POST/DELETE | Renter | Toggle favorite |
| `/api/visits` | POST | Renter | Request visit |
| `/api/visits/[id]` | PATCH | Agency/Admin | Accept/reject/reschedule |
| `/api/agencies` | GET | Admin | List all agencies |
| `/api/agencies/[id]/verify` | POST | Admin | Verify agency |
| `/api/admin/stats` | GET | Admin | Platform statistics |
| `/api/visits/available-slots` | GET | Public (verified agency) | Get generated slots for date range |
| `/api/agencies/[id]/availability` | GET | Public (verified agency) | Get agency availability config |

---

## Appendix: Server Actions (`app/actions.ts`)

| Action | Auth | Purpose |
|--------|------|---------|
| `createAgency` | Verified email, no agency row | Onboarding form submit |
| `updateAgencyProfile` | Agency owner | Profile edit |
| `createProperty` | Verified agency | Add property |
| `updateProperty` | Verified agency + owner | Edit property |
| `deleteProperty` | Verified agency + owner / Admin | Delete |
| `createLead` | Renter (or visitor → triggers auth) | Enquiry submit |
| `updateLeadStatus` | Agency owner / Admin | Lead pipeline |
| `updateRenterProfile` | Renter | Profile edit |
| `verifyAgency` / `unverifyAgency` | Admin | Agency approval |
| `approveProperty` / `rejectProperty` | Admin | Property moderation |
| `deleteAgency` / `deletePropertyAdmin` | Admin | Hard delete |
| `requestVisit` | Renter | Create visit request |
| `confirmVisit` | Agency owner | Accept visit request |
| `rejectVisit` | Agency owner | Decline visit request |
| `rescheduleVisit` | Agency owner / Renter | Propose new time |
| `completeVisit` | Agency owner | Mark as completed |
| `cancelVisit` | Agency owner / Renter | Cancel with reason |
| `updateAgencyAvailability` | Agency owner | Set weekly schedule |
| `deleteAgencyAvailability` | Agency owner | Remove schedule row |
| `createAvailabilityException` | Agency owner | Add holiday/exception |
| `deleteAvailabilityException` | Agency owner | Remove exception |

---

## 22. Enhancement Details (v1.1)

### 22.1 Search Foundation Architecture (Enhancement 8)

*Architectural preparation for advanced search — no implementation yet.*

#### Current State (Phase 1)
- PostgreSQL `ilike` on `title`, `location`, `city`
- Basic filters via `WHERE` clauses
- Pagination via `LIMIT/OFFSET`

#### Target Architecture (Phases 2–3)

**Phase 2: PostgreSQL Full-Text Search**
```sql
-- Add tsvector column for searchable content
ALTER TABLE properties ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(location,'')), 'C') ||
    setweight(to_tsvector('english', coalesce(city,'')), 'C')
  ) STORED;

CREATE INDEX idx_properties_search ON properties USING GIN (search_vector);

-- Query: websearch_to_tsquery for natural language
SELECT * FROM properties
WHERE search_vector @@ websearch_to_tsquery('english', $1)
  AND status = 'published'
ORDER BY ts_rank_cd(search_vector, websearch_to_tsquery('english', $1)) DESC;
```

**Phase 2: Search Indexing Strategy**
| Aspect | Approach |
|--------|----------|
| **Incremental updates** | Trigger on `properties` insert/update → refresh `search_vector` |
| **Synonyms** | `ts_thesaurus` for common terms (e.g., "flat" ↔ "apartment") |
| **Typo tolerance** | `trigram` extension (`pg_trgm`) + similarity threshold |
| **Ranking** | `ts_rank_cd` with weights: title > description > location |

**Phase 3: Semantic Search Compatibility**
```typescript
// Future: Vector embeddings for semantic search
interface SearchEmbedding {
  property_id: string;
  embedding: number[]; // 1536-dim (text-embedding-3-small)
  model: string;
  created_at: string;
}

// Hybrid search: keyword + vector
// PostgreSQL pgvector + IVFFlat index
```

**Autocomplete & Suggestions**
| Feature | Implementation |
|---------|----------------|
| **Query autocomplete** | Trie/prefix table on popular queries; refresh daily |
| **Entity autocomplete** | Separate index: sectors, landmarks, property types |
| **Recent searches** | Client-side `localStorage` (10 max, 30-day TTL) |
| **Popular searches** | Aggregated from `analytics_events` → materialized view |

**Saved Searches (Phase 2)**
```sql
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renter_id UUID REFERENCES renter_profiles(id),
    name TEXT NOT NULL,
    filters JSONB NOT NULL, -- SearchFilters serialized
    alert_frequency TEXT CHECK (alert_frequency IN ('instant','daily','weekly')),
    last_alerted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**AI Search Compatibility (Phase 3)**
- **Natural language → SQL**: LLM translates "2BHK near Sector 62 metro under 35k" → structured filters
- **Reranking**: Cross-encoder reranks top-50 results by relevance
- **Personalization**: User embeddings from interaction history

---

### 22.2 Future AI Layer Architecture (Enhancement 9)

*All AI features are ROADMAP ONLY — no implementation in MVP.*

#### AI Capability Matrix

| Feature | Phase | Description | Data Dependencies |
|---------|-------|-------------|-------------------|
| **AI Property Summary** | 2 | LLM generates 2-sentence summary from description + amenities | Property description, amenities, photos (alt text) |
| **AI Description Generator** | 2 | Agency inputs specs → LLM writes compelling description | Structured property data |
| **AI Recommendations** | 3 | "Based on your visits, you might like…" | Visit history, favorites, search patterns |
| **AI Similar Properties** | 3 | Semantic similarity beyond filters | Property embeddings + user behavior |
| **AI Lead Scoring** | 3 | Predict close probability per lead | Lead funnel data, agency response time, property views |
| **AI Duplicate Detection** | 2 | Flag near-duplicate listings at submit time | Property images (pHash), title+location similarity |
| **AI Pricing Suggestions** | 3 | "Similar properties rent for ₹X–Y" | Market data, comparable properties, seasonality |
| **AI Search (Natural Language)** | 3 | "2BHK near Sector 62 metro under 35k, furnished" | NLU → structured filters + semantic rerank |
| **AI Market Insights** | 3 | Rent trajectory, vacancy rate, absorption by sector | Historical listings, lease data, macro indicators |

#### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Feature Layer                          │
│  (React components calling /api/ai/*)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI Gateway (Edge Function)                 │
│  • Rate limiting, auth, PII scrubbing                       │
│  • Prompt templates, few-shot examples                      │
│  • Model selection (gpt-4o-mini, embedding models)          │
│  • Response caching (Redis, 24h TTL)                        │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │  LLM API    │     │ Embedding   │     │  Vector DB  │
   │ (OpenAI/    │     │  Model      │     │  (pgvector/ │
   │  Anthropic) │     │  (text-emb- │     │   Pinecone)  │
   │             │     │   3-small)  │     │             │
   └─────────────┘     └─────────────┘     └─────────────┘
```

#### Data Preparation (Do Now for Future AI)

| Action | Reason |
|--------|--------|
| Store property descriptions in clean Markdown | Better LLM input |
| Normalize amenities to controlled vocabulary | Consistent embeddings |
| Capture alt text for all images | Multimodal future |
| Log all user interactions with timestamps | Training data for recommendations |
| Archive all LLM prompts/responses | Audit, evaluation, fine-tuning |

#### Governance
- **No PII to LLMs** — scrub emails, phones, names before prompt
- **Human-in-the-loop** — AI suggestions require agency/renter confirmation
- **Explainability** — Show "Why this recommendation?" with feature weights
- **Cost controls** — Daily token budget per feature; fallback to rules-based

---

### 22.3 Marketplace Expansion Readiness (Enhancement 10)

*Architecture decisions today that enable multi-city, multi-country growth.*

#### Multi-City / Multi-State / Multi-Country

| Layer | Current | Expansion-Ready |
|-------|---------|-----------------|
| **Routing** | `/rent/noida/[sector]` | `/rent/{country}/{state}/{city}/{sector}` (dynamic segments) |
| **Data Model** | `city`, `location` on properties | Add `country_code`, `state_code`, `timezone`, `currency` |
| **Agency** | Single city | `operating_cities` array; `operating_countries` |
| **SEO** | Noida-focused | Per-city landing pages; hreflang for multi-language |
| **Payments** | INR only | Multi-currency via Stripe/Adyen; local payment methods |

#### Localization (i18n)

| Requirement | Approach |
|-------------|----------|
| **Languages** | English, Hindi (Phase 2), regional (Phase 3) |
| **Translation** | Crowdin/Lokalise; JSON per locale; `next-intl` or `next-i18next` |
| **RTL** | CSS logical properties; test Arabic/Hebrew later |
| **Date/Number** | `Intl.DateTimeFormat`, `Intl.NumberFormat` per locale |
| **Currency** | ISO 4217; display in local + INR equivalent |

#### Currency & Payments

| Phase | Scope |
|-------|-------|
| 1 | INR only; agency subscription in INR |
| 2 | USD, AED for NRI landlords; Stripe multi-currency |
| 3 | Local payment methods (UPI, NetBanking, Wallets) per country |

#### Document Verification & Digital Lease (Phase 3)

| Feature | Description |
|---------|-------------|
| **KYC** | Agency: PAN, GST, address proof; Renter: Aadhaar/Passport (via DigiLocker) |
| **Document Vault** | Encrypted storage (Supabase Storage + SSE); access-controlled |
| **Digital Lease** | Template engine → PDF → e-sign (DocuSign/Adobe Sign integration) |
| **Registry Integration** | Future: State government APIs for lease registration |

#### Referrals & Teams (Phase 2+)

| Feature | Scope |
|---------|-------|
| **Renter Referral** | "Invite friend → both get ₹500 credit" |
| **Agency Referral** | "Refer agency → commission bonus" |
| **Team/Agent** | Agency adds team members; role: Admin/Agent/Viewer |
| **Branch Offices** | Agency manages multiple branches; separate inventory per branch |

---

### 22.4 Operational Readiness (Enhancement 11)

*Internal systems needed to run the platform at scale.*

#### Customer Support

| Channel | Phase | Tooling |
|---------|-------|---------|
| **In-app Chat** | 2 | Intercom/Crisp; integrated with user context |
| **Email** | 1 | Resend → shared inbox; SLA: 4h business hours |
| **Phone** | 2 | Cloud telephony (Exotel); click-to-call from admin |
| **Help Center** | 2 | Notion/GitBook → public docs; SEO-indexed |
| **Chatbot** | 3 | RAG over help docs; escalate to human |

#### Ticketing System

```sql
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_type TEXT CHECK (user_type IN ('renter','agency','admin')),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_user','resolved','closed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    assignee_id UUID REFERENCES agencies(id),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);
```

#### Feature Flags

| Flag | Purpose | Default |
|------|---------|---------|
| `enable_visit_scheduling` | Toggle visit feature | `true` |
| `enable_ai_recommendations` | Phase 3 AI | `false` |
| `enable_saved_searches` | Phase 2 | `false` |
| `enable_map_view` | Phase 2 | `false` |
| `maintenance_mode` | Emergency off-switch | `false` |

```typescript
// lib/flags.ts (client-side evaluation via Edge Config)
async function getFlags(userId: string): Promise<Record<string, boolean>> {
  const base = await fetch('/api/flags').then(r => r.json());
  const overrides = await supabase.from('user_flags').select('flag, enabled').eq('user_id', userId);
  return { ...base, ...Object.fromEntries(overrides.data?.map(f => [f.flag, f.enabled]) ?? []) };
}
```

#### System Monitoring

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| **Error Rate** | Sentry / Vercel | > 1% in 5min |
| **Latency (p95)** | Vercel Analytics | > 2s |
| **DB Connections** | Supabase Dashboard | > 80% pool |
| **Queue Depth** | Custom / BullMQ | > 100 pending |
| **Storage Usage** | Supabase | > 80% quota |
| **Email Delivery** | Resend Webhooks | Bounce > 5% |
| **Auth Success Rate** | Supabase | < 95% |

#### Audit Logs

- **All admin actions** → `admin_audit_log` (already designed)
- **Data exports** → Logged with requestor, scope, timestamp
- **Permission changes** → Before/after diff
- **Retention** — 7 years

---

### 22.5 Sprint Roadmap Review (Enhancement 12)

#### Recommended Sprint Order (Optimized for Value Delivery)

| Sprint | Focus | Rationale |
|--------|-------|-----------|
| **5.2** | Navigation & Layout Foundation | Prerequisite for all pages; enables auth-aware nav |
| **5.3** | Homepage Polish & HeroSearch | First impression; search entry point |
| **5.4** | Browse Rentals (`/rent`) | Core renter experience; primary discovery |
| **5.5** | Property Details (`/property/[id]`) | Conversion page; leads + visits happen here |
| **5.6** | Dashboards (Agency + Renter) | Agency tools + renter retention |
| **5.7** | Mobile Polish & Accessibility | Parity + compliance; required for launch |
| **5.8** | Admin Panel & Platform Features | Operations; supports agency onboarding |
| **5.9** | Performance & Launch Readiness | Production hardening |

#### Priority Principles

1. **Core Renter Experience** — Search → Property → Lead/Visit (Sprints 5.3–5.5)
2. **Core Agency Experience** — Dashboard → Properties → Leads (Sprint 5.6)
3. **Conversion Optimization** — CTAs, forms, visit scheduling (Sprints 5.5, 5.6)
4. **Mobile Parity** — Every feature works at 375px (Sprint 5.7)
5. **Accessibility** — WCAG 2.1 AA; not afterthought (Sprint 5.7)
6. **Admin** — Supports agency onboarding, not customer-facing (Sprint 5.8)
7. **Future AI** — Architectural readiness only; no implementation until post-launch

---

## Appendix D: Rollout & Feature Flags (Enhancement 11)

### Launch Strategy

| Phase | Audience | Duration | Criteria to Proceed |
|-------|----------|----------|---------------------|
| **Internal Alpha** | Team + 5 agencies | 2 weeks | Zero P0 bugs; core flows work |
| **Closed Beta** | 50 agencies, 200 renters | 4 weeks | < 1% error rate; positive NPS |
| **Open Beta** | All verified agencies | 4 weeks | Stable metrics; support load manageable |
| **General Availability** | Public | — | All launch criteria met |

### Feature Flag Rollout

```typescript
// lib/flags.ts
const FLAGS = {
  // Core (always on)
  enable_visit_scheduling: { default: true, rollout: 100 },
  enable_lead_capture: { default: true, rollout: 100 },
  enable_property_favorites: { default: true, rollout: 100 },

  // Phase 2 (gradual)
  enable_saved_searches: { default: false, rollout: 0 },
  enable_map_view: { default: false, rollout: 0 },
  enable_visit_calendar: { default: false, rollout: 0 },
  enable_ai_summaries: { default: false, rollout: 0 },

  // Phase 3 (off by default)
  enable_ai_recommendations: { default: false, rollout: 0 },
  enable_ai_pricing: { default: false, rollout: 0 },
  enable_digital_lease: { default: false, rollout: 0 },
  enable_subscriptions: { default: false, rollout: 0 },
} as const;

// Per-user override via Supabase
async function isEnabled(flag: keyof typeof FLAGS, userId: string): Promise<boolean> {
  const config = FLAGS[flag];
  if (config.rollout === 100) return true;
  if (config.rollout === 0) return false;

  // Percentage rollout via user ID hash
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId + flag));
  const bucket = new DataView(hash).getUint32(0) % 100;
  return bucket < config.rollout;
}
```

### Canary Deployment

| Component | Strategy |
|-----------|----------|
| **Frontend** | Vercel Preview Deployments → promote to production |
| **Edge Functions** | Deploy to staging → smoke test → promote |
| **DB Migrations** | Apply to staging → verify → apply to prod (maintenance window) |
| **Feature Flags** | Toggle in Supabase `user_flags` table; no deploy needed |

### Rollback Procedures

| Scenario | Action |
|----------|--------|
| **Frontend regression** | Vercel instant rollback to previous deployment |
| **Edge Function bug** | Revert to previous version in Vercel |
| **Bad migration** | Restore Supabase PITR (Point-in-Time Recovery) |
| **Feature flag issue** | Disable flag in Supabase; instant |
| **Performance regression** | Revert deployment; investigate in staging |

---

## Appendix E: Glossary & Abbreviations

| Term | Definition |
|------|------------|
| **Agency** | Verified real estate business that lists properties |
| **Renter** | Authenticated tenant searching for rentals |
| **Visitor** | Unauthenticated user browsing marketplace |
| **Lead** | Enquiry from renter to agency about a property |
| **Visit** | Scheduled property viewing appointment |
| **Property** | Rental listing (apartment, house, villa, PG, etc.) |
| **Sector** | Noida administrative division (e.g., Sector 62) |
| **RLS** | Row-Level Security (PostgreSQL policy) |
| **ISR** | Incremental Static Regeneration (Next.js) |
| **SSG** | Static Site Generation |
| **SSR** | Server-Side Rendering |
| **RSC** | React Server Components |
| **CSR** | Client-Side Rendering |
| **FCP** | First Contentful Paint |
| **LCP** | Largest Contentful Paint |
| **CLS** | Cumulative Layout Shift |
| **INP** | Interaction to Next Paint |
| **TTI** | Time to Interactive |
| **PWA** | Progressive Web App |
| **VAPID** | Voluntary Application Server Identity (Web Push) |
| **SLA** | Service Level Agreement |
| **NPS** | Net Promoter Score |
| **MRR** | Monthly Recurring Revenue |
| **DAU/MAU** | Daily/Monthly Active Users |
| **CAC** | Customer Acquisition Cost |
| **LTV** | Lifetime Value |
| **KYC** | Know Your Customer |
| **DigiLocker** | Indian government document wallet |
| **UPI** | Unified Payments Interface |
| **GST** | Goods and Services Tax (India) |
| **PAN** | Permanent Account Number (India tax ID) |
| **PITR** | Point-in-Time Recovery (Supabase) |
| **CDN** | Content Delivery Network |
| **CSP** | Content Security Policy |
| **HSTS** | HTTP Strict Transport Security |
| **COOP/COEP** | Cross-Origin Opener/Embedder Policy |

---

**End of Product Design Document v1.1**

*This PDD is the single source of truth for all future UI/UX implementation. Any deviation requires explicit approval and PDD update.*