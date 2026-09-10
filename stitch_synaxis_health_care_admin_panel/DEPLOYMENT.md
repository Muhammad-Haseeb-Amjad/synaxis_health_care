# Deployment

This app is a Vite React single-page application deployed from the `stitch_synaxis_health_care_admin_panel` directory.

## Vercel project settings

When importing the `FA23-BSE-130-6B-Advance-Web/Synaxis` repository, set **Root Directory** to:

```text
stitch_synaxis_health_care_admin_panel
```

The checked-in `vercel.json` explicitly configures:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback: every route rewrites to `/index.html`, allowing React Router deep links to refresh correctly.

## Required environment variables

Add both variables in **Vercel → Project Settings → Environment Variables** for Production, Preview, and Development:

```text
VITE_SUPABASE_URL=https://ddvicbhulgrronauvorp.supabase.co
VITE_SUPABASE_ANON_KEY=<the project's publishable anon key>
```

Never commit the real values. `.env` and `.env.*` are ignored; `.env.example` contains blank placeholders only.

## Supabase production configuration

Before live testing:

1. Apply all SQL files in `supabase/migrations` in numeric order, including `0003_purchase_order_tax.sql`.
2. In **Supabase → Authentication → URL Configuration**, set the production Vercel URL as the Site URL.
3. Add the production URL, preview URL pattern if used, and every custom domain to Redirect URLs.
4. Keep RLS enabled. The migrations grant CRUD only to the `authenticated` role.
5. Confirm the public `company-assets` bucket and authenticated object-management policy from `0002_company_assets.sql` exist.

## Deploy and redeploy

With GitHub integration, pushing the configured production branch triggers deployment:

```bash
git push origin main
```

For Vercel CLI deployment:

```bash
npm install -g vercel
vercel login
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod
```

Repeat `vercel env add` with `preview` and `development` for both variables when using those environments.

## Live verification

After deployment, verify on the actual HTTPS URL:

- Login with the existing admin account.
- Open `/customers` directly and refresh; it must not return a Vercel 404.
- Create and delete one temporary doctor to verify authenticated RLS CRUD.
- Upload and display a company logo.
- Generate a PO PDF and test native WhatsApp sharing on a physical mobile device.
- Check all primary pages for browser console errors.

The native file share test cannot be fully reproduced by a local HTTP desktop session; it must be checked on the deployed HTTPS origin and a supported mobile browser.
