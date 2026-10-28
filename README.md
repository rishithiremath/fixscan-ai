# FixScan AI - See it. Report it. Fix it.

**NEURA X 2026 - Track 1: Smart Property AI**

## Problem

Today a leak, damp patch, or crack is reported on WhatsApp, in a register, or by word of mouth. The message has no photo proof, no priority, and no owner. Three people report the same leak and three separate follow-ups happen, or none. By the time someone acts, a small seepage has become mould, damaged plaster, and a much larger repair bill.

## Solution - the five-step loop

1. **Report** - photo and/or text, in English or Hinglish.
2. **Diagnose** - AI finds the problem, severity, probable cause, and an indicative cost estimate.
3. **Organise** - location and category are extracted, duplicates are merged, priority and SLA are set by hard rules.
4. **Track** - Open > In Progress > Resolved, with an after photo required to close a task.
5. **Learn** - repeat issues by location and category are visible on the dashboard.

One line: FixScan turns a photo or a messy complaint into a diagnosed, prioritised, deduplicated repair task in under 30 seconds.

## Demo

- Home page: product pitch, 3-step loop, Report a problem, View dashboard.
- Report page: upload a photo, or click **Try a sample photo**, type a complaint, click Analyse, review the card, create the task.
- Dashboard: counts, Kanban board, filters, seeded demo tasks.
- Task detail: full diagnosis, verbatim reporter text, status changer, after-photo rule.

**Demo Mode works with no API keys and no Supabase configured.** Seeded tasks and cached sample diagnoses are used, so a judge opening the link cold sees a full working flow. Sample images in `public/samples/` are realistic property-maintenance photos.

## Features (MVP)

- Photo upload with preview (max 5 MB), text complaint box, location field, optional name/contact.
- Validation: photo OR at least 10 characters of text.
- Review card with title, problem type, severity badge, probable cause, editable location, category, priority + SLA, indicative INR cost band, action steps, and duplicate notice.
- Duplicate detection and merging, with reporter count and similarity score shown to the admin.
- Dashboard counts (Open, High priority, Overdue, Resolved), Kanban, and filters by location/category/priority/status with Clear.
- Task detail with before/after photos, notes, and status changes. Resolved requires an after photo in the UI.
- 7 seeded demo tasks covering all statuses and priorities, at least 3 locations, one deliberate overdue task, and one resolved task with an after photo.

## Tech stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS + React 18, Supabase (Postgres + Storage, optional for Demo Mode), Gemini API (vision + text, optional for Demo Mode).

## How it works

- Browser (Next.js) -> API routes (server only) -> Gemini API for vision/text.
- Browser -> Supabase when configured, otherwise browser localStorage for Demo Mode tasks.
- Photos: uploaded by the user in the demo; in a Supabase deployment they go to the `task-images` bucket and the public URL is stored on the task.

## AI approach

- Prompts are in `lib/prompts.ts`. The vision prompt returns strict JSON: problem_type, ai_diagnosis, probable_cause, severity, severity_reason, professional_needed, action_steps, confidence. The text prompt returns title, category, location, issue_summary, urgency_signals, suggested_priority, priority_reason.
- **Hard rules decide priority, the model only suggests.** See `lib/priority.ts`: High (24 hours) for active leak, electrical fault, wide/structural crack, heavy mould, sewage. Medium (72 hours) for damp patch/seepage stain without dripping, large peeling paint, hairline crack, shut-off-able tap leak. Low (7 days) for cosmetic paint, small dry stain, minor cosmetic issues.
- Duplicate logic is in `lib/duplicates.ts`: candidates are open/in-progress tasks with the same normalised location OR same category. Score = location 0.5 + category 0.3 + shared key terms 0.2. At or above 0.80 = likely duplicate, 0.60-0.80 = show side-by-side, below 0.60 = new task. On merge: report_count increments, photo is appended if supplied, priority escalates one level at report_count 3, and the similarity score is shown to the admin with confirm/unmerge behaviour.
- Confidence and fallback: if Gemini times out (20 second server timeout), returns invalid JSON, or no key is set, the app returns a safe fallback/demo card with `needs_review = true` and never crashes the demo. The Gemini call is retried once on invalid JSON.
- Cost bands are in `lib/costs.ts` and are always labelled as indicative estimates, never as quotes.

## Setup

Requirements: Node.js 18 or later (tested here on Node 24).

```bash
npm install
cp .env.local.example .env.local
# Fill in .env.local with YOUR OWN values only if you want live AI / Supabase.
# Demo Mode works with the file left blank.
npm run dev
```

Open http://localhost:3000

### Environment variables (names only, no values)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

`GEMINI_API_KEY` is server only. It must never appear in browser code or in GitHub. `.env.local` is in `.gitignore`.

### Supabase setup (optional, only for a shared database)

1. Create a project at supabase.com.
2. In Supabase > SQL Editor, run the whole file `supabase/schema.sql`.
3. In Supabase > Storage, create a public bucket named `task-images`.
4. Copy Project URL and anon public key from Project Settings > API into `.env.local` and into Vercel (see below).
5. RLS note: the schema enables RLS with a permissive demo policy. Production would use authenticated policies per property.

### Gemini setup (optional, only for live AI)

1. Go to Google AI Studio and sign in.
2. Click Get API Key, then Create API key.
3. Put it in `.env.local` as `GEMINI_API_KEY` and in Vercel as an environment variable. Never commit it.

## How to push to GitHub

```bash
git init
git add .
git commit -m "FixScan AI - NEURA X 2026 Track 1"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/fixscan-ai.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. Check that `.env.local` is NOT in the commit. If a real key is ever pushed, revoke and regenerate it in the provider console, do not just delete the commit.

## How to deploy on Vercel

1. Go to vercel.com, sign in, click Add New > Project, Import your `fixscan-ai` GitHub repo.
2. In Project Settings > Environment Variables, add the same three variables from `.env.local.example` (only if you want live AI / Supabase; Demo Mode needs none).
3. Click Deploy, then Redeploy after adding variables.
4. Open the live link in an incognito window and on a phone, and confirm the dashboard shows seeded tasks.

## Limitations

- AI output is first-pass triage, not a professional inspection. Every AI output in the app carries: "AI-generated - verify before major work."
- Costs are indicative estimates only, never quotes, and never a structural or electrical safety guarantee.
- Sample images are realistic demo photos, not evidence from a live inspection.
- Demo Mode tasks are stored in the browser (localStorage) and in-memory on the server. A shared Supabase database is needed for multi-user persistence.
- Live Gemini and live Supabase were NOT tested in this build, because no keys were provided and none were requested. Demo Mode was verified by a successful production build and by code paths that do not require env vars.

## Acknowledgements

Gemini API, Supabase, Next.js, React, and Tailwind CSS. Open-source libraries and AI tools are used as permitted by the NEURA X rules, and must be acknowledged in the submission.
