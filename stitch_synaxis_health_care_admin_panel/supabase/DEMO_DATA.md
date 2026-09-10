# Demo data

`demo_seed.sql` is a manual demo/testing dataset. It is deliberately outside `supabase/migrations`, is not referenced by `package.json`, and does not run during `npm run build`, Vercel deployment, or `supabase db push`.

## Apply manually

Recommended for the hosted demo project: open the Supabase Dashboard **SQL Editor**, paste `demo_seed.sql`, and run it once.

Alternatively, with a PostgreSQL connection string configured locally:

```powershell
psql "$env:SYNAXIS_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/demo_seed.sql
```

Do not put the database password or service-role key in this repository.

The script is idempotent for its own records: it removes only deterministic demo UUID ranges and reseeds them inside one transaction. It preserves all non-demo rows. Demo purchase numbers use `DEMO-PO000001` format, so they do not affect the production `PO######` number generator. If the database already contains real rows, table totals will naturally exceed the demo counts.

Expected demo rows after a successful run:

| Table | Demo rows |
|---|---:|
| doctors | 10 |
| doctor_entries | 30 |
| customers | 10 |
| customer_ledger | 30 |
| partners | 2 (one for each valid A/B group) |
| partnership_sales | 20 (10 A + 10 B) |
| shared_expenses | 10 |
| vendors | 10 |
| vendor_ledger | 30 |
| products | 10 |
| purchase_orders | 10 |
| purchase_order_items | 30 |

`company_settings` is intentionally not demo-seeded: the schema enforces one row and the project already uses the real Synaxis company profile.

## Remove before go-live

Run `demo_cleanup.sql` through the SQL Editor or:

```powershell
psql "$env:SYNAXIS_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/demo_cleanup.sql
```

The cleanup removes only rows in the documented demo UUID ranges. It leaves the company profile and any real records untouched.