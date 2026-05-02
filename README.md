# Family Car Calendar

Simple mobile-friendly car reservation app for one family car.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase database only

## Setup

1. Install packages:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Use the real values from Supabase Dashboard -> Project Settings -> API.
After changing `.env.local`, restart `npm run dev`.

3. In Supabase SQL Editor, run [supabase/schema.sql](supabase/schema.sql).

4. For a simple no-auth setup, make sure the anon role can `select`, `insert`, and `update` on `public.car_reservations`.

To verify the table exists in the same Supabase project, run this in SQL Editor:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'car_reservations';
```

If the app says `Could not find the table 'public.car_reservations' in the schema cache`, run [supabase/schema.sql](supabase/schema.sql) again in the Supabase project used by `.env.local`, then refresh the browser.

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Main Files

- [app/page.tsx](app/page.tsx)
- [components/Calendar.tsx](components/Calendar.tsx)
- [components/ReservationModal.tsx](components/ReservationModal.tsx)
- [lib/supabaseClient.ts](lib/supabaseClient.ts)
