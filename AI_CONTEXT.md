# Rentfy AI Context

## Project
RenterEasy (formerly Rentfy)

Tech Stack:
- Next.js App Router
- TypeScript
- Supabase
- Tailwind CSS

Branch:
development

Latest Stable Commit:
c09c825 - chore: complete phase 3 - reusability and typescript

---

# Completed Work

## Phase 1 - Critical Bugs ✅
- Fixed sector page case-insensitive search.
- Fixed agency null crash on property page.
- Added image upload validation.
- Added 5MB upload limit.
- Prevented orphaned Supabase uploads by authenticating before upload.
- Build passes.

## Phase 2 - Security & Performance ✅
- Optimized next.config.ts for Supabase image optimization.
- Removed duplicate dashboard lead queries.
- Replaced window.location.reload() with router.refresh().
- Replaced window.location.href with router.push().
- Added ISR (revalidate = 60) for public pages.
- Build passes.

## Phase 3 - Reusability & TypeScript ✅
- Created reusable components.
- Improved TypeScript types.
- Reduced duplicated code.
- Build passes.

---

# Current Status

Phase 4 (UI/UX) is partially completed.

Modified files:

- app/ImageGallery.tsx
- app/Logo.tsx
- app/Navbar.tsx
- app/PropertyCard.tsx
- app/StatCard.tsx
- app/dashboard/page.tsx
- app/property/[id]/page.tsx

New file:

- app/MobileMenu.tsx

These changes are NOT committed yet.

Current git status contains uncommitted UI work.

---

# Remaining Work

## Phase 4
- Complete orange branding.
- Finish responsive mobile navigation.
- Improve property cards.
- Improve dashboard UI.
- Improve image gallery UX.
- Keep all functionality unchanged.

## Phase 5
- Accessibility improvements.
- SEO improvements.
- Final production audit.
- Final testing.
- Production deployment readiness.

---

# Project Rules

- Never change database schema unless explicitly requested.
- Never modify Supabase RLS or authentication without approval.
- Never remove existing functionality.
- Preserve all business logic.
- Keep commits small and focused.
- Run:

npm run build

after every phase.

Fix any build errors before committing.

Wait for approval after each completed phase.

---

# Coding Style

- Use existing design system.
- Prefer reusable components.
- Keep TypeScript strict.
- Use Next.js App Router best practices.
- Keep code readable.
- Avoid unnecessary refactoring.

---

# Workflow

Before starting:

1. Read this file.
2. Read CLAUDE.md.
3. Read only files related to the current task.
4. Do NOT perform another full project audit.

After finishing:

1. Run npm run build.
2. Fix any errors.
3. Commit changes.
4. Wait for approval.
