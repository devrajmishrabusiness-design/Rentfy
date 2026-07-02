This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Making yourself an admin

Admin is a normal signed-in user whose `agencies.is_admin = true`. To bootstrap:

1. **Run the migration.** In Supabase Dashboard → SQL Editor → New query,
   paste and run `supabase/migrations/0001_add_is_admin.sql`. The script
   is idempotent and will also auto-promote
   `devrajmishrabusiness@gmail.com` if that account exists.
2. **Add the service-role key** to `.env.local`:

   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   Find it under Supabase Dashboard → Settings → API → `service_role`
   (secret). Never expose this key in client code or commit it.
3. **Restart the dev server** (`npm run dev`) so the new env var loads.
4. **Sign in** at `/login` with the admin email, then visit `/admin`.

To promote a different account later, run in the SQL editor:

```sql
UPDATE public.agencies
SET is_admin = true
WHERE lower(email) = lower('you@example.com');
```
