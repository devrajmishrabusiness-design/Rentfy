# Supabase migrations

Apply each file in numeric order using the **Supabase SQL editor**
(Dashboard → SQL Editor → New query → paste → Run).

## Files

| File | Purpose |
| --- | --- |
| `0001_add_is_admin.sql` | Adds the `is_admin` flag to agencies and promotes the bootstrap admin. |
| `0002_add_renter_profiles.sql` | Creates email-authenticated renter profiles and RLS policies. |
| `0003_add_renter_id_to_leads.sql` | Links enquiries to signed-in renters. |
| `0004_create_renter_favorites.sql` | Creates renter saved-property records and RLS policies. |
| `0005_create_agency_reviews.sql` | Adds public 1-5 agency ratings and optional renter reviews. |

The renter authentication UI requires migrations `0002` through `0004`.
If Supabase reports that `public.renter_profiles` is missing from the schema
cache, run these three files in numeric order in the SQL Editor, then refresh
the application. No SMS provider is required.

## Promoting yourself to admin later

If you ever need to grant admin to another account, run:

```sql
UPDATE public.agencies
SET is_admin = true
WHERE lower(email) = lower('you@example.com');
```

To revoke admin:

```sql
UPDATE public.agencies
SET is_admin = false
WHERE lower(email) = lower('you@example.com');
```
