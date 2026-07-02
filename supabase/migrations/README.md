# Supabase migrations

Apply each file in numeric order using the **Supabase SQL editor**
(Dashboard → SQL Editor → New query → paste → Run).

## Files

| File | Purpose |
| --- | --- |
| `0001_add_is_admin.sql` | Adds the `is_admin` flag to agencies and promotes the bootstrap admin. |

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
