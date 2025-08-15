# SBIR Readiness – Click-by-click setup (non-coder friendly)

This starter lets you deploy a working demo in ~15 minutes. It includes:
- A landing page, an Intake form, a Dashboard, and a Project page.
- A demo **Scoring** API that calls OpenAI (no database required to try).
- Optional database with Prisma + Supabase (you can add later).

---

## 1) Create accounts (free tiers)

1. **GitHub** → make an account (if you don’t have one).
2. **Vercel** → sign up with GitHub (press “Continue with GitHub”).
3. **OpenAI API** → create a key at platform.openai.com → “API keys” → “Create new secret key”.
4. (Optional for database) **Supabase** → create a new project (copy Project URL + anon key + connection string).

---

## 2) Get this code into GitHub

1. Download this zip to your computer.
2. Go to GitHub → New Repository → name it `sbir-readiness-starter` → **create repo**.
3. On the repo page, click **Add file → Upload files**, then **drag the entire unzipped folder** into the uploader and **Commit**.

> That’s it—you don’t need to install anything locally.

---

## 3) Deploy to Vercel (no coding)

1. Go to vercel.com → **Add New… → Project**.
2. Import your `sbir-readiness-starter` repo.
3. In the “Environment Variables” step, add:
   - `OPENAI_API_KEY` = your OpenAI secret key
   - (optional for DB) `NEXT_PUBLIC_SUPABASE_URL` = from Supabase
   - (optional for DB) `NEXT_PUBLIC_SUPABASE_ANON_KEY` = from Supabase
   - (optional for DB) `DATABASE_URL` = from Supabase → Settings → Database
4. Click **Deploy**. Wait for build to finish.
5. Open your site → click **New Project** → fill the form → **Save & Continue** → **Open** → **Evaluate against rubric**.

You should see criterion‑level scores appear. 🎉

---

## 4) (Optional) Turn on the database

You can use the app without a database. If you want persistence:

1. In Supabase: create project → copy **connection string** (DATABASE_URL), **Project URL**, **anon key**.
2. In Vercel → your project → **Settings → Environment Variables**:
   - Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` (from Supabase).
3. Locally (optional): If you have a computer with Node.js, you can run the migrations:
   - In a terminal, run:
     ```bash
     npm install
     npx prisma generate
     npx prisma migrate dev --name init
     npm run seed
     ```
   - Then redeploy (Vercel will use your schema).

> If you don’t want to use a terminal, you can skip this for now—the demo scoring still works.

---

## 5) Where things live (mental map)

- **/src/app** – Pages and API endpoints.
  - `/intake` – Basic guided form.
  - `/dashboard` – Shows your saved intake (for demo via browser storage).
  - `/projects/[id]` – Draft editor + “Evaluate against rubric” button.
  - `/api/score-demo` – Calls OpenAI and returns JSON scores.
- **/src/lib** – Helpers (OpenAI client, Supabase, Prisma).
- **/prisma** – Database schema and seed script.
- **/.env.example** – The variables you add on Vercel.

---

## 6) Next steps (Phase 2)

- Replace localStorage with Supabase tables (Projects, Sections, Scores).
- Add real `/api/sections/[id]/score` route using Prisma.
- Enable email notifications (SendGrid) for “score complete”.
- Create a clean landing page with pricing and a Stripe Checkout link.

---

## Troubleshooting

- **Build failed on Vercel?** Ensure `OPENAI_API_KEY` is set.
- **Scoring returns error 500?** Your OpenAI key may be missing or out of credits.
- **I don’t see data after refresh?** In the demo, data is in your browser only (localStorage).

---

You’ve got this. Ship the demo, get feedback, then wire in the database when ready.
