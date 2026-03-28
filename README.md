# NameForge

AI-powered startup name evaluator with LLM Council deliberation. Evaluates names across legal, domain, social, linguistic, strategic & financial dimensions using a council of 4-6 LLMs that deliberate, critique each other anonymously, and synthesize a final verdict.

## How It Works

1. **Describe your company** in one sentence (or pick a template)
2. **Enter a name** or ask AI to generate suggestions
3. **Watch the council deliberate** in real-time across 6 dimensions:
   - Legal & IP (trademark, class strategy, international)
   - Domain & Digital (TLD availability, SEO, aftermarket)
   - Social Media (8 platforms, handle variations)
   - Linguistic (pronunciation, memorability, cultural sensitivity)
   - Strategic (IPO-readiness, scalability, brand architecture)
   - Financial (filing costs, domain acquisition, protection budget)

### The LLM Council

Every evaluation dimension runs through a 3-stage deliberative process:

- **Stage 1**: 4 analyst models evaluate independently in parallel
- **Stage 2**: Each model ranks the others' responses anonymously (prevents bias)
- **Stage 3**: Chairman model synthesizes everything into a final verdict

All powered by [OpenRouter](https://openrouter.ai) — one API key, 300+ models.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Vercel Functions
- **Database**: Supabase (Postgres + RLS + Realtime)
- **AI**: OpenRouter (`@openrouter/ai-sdk-provider`) — Claude, GPT, Gemini, DeepSeek
- **Billing**: Stripe
- **Deploy**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- OpenRouter API key

### Setup

```bash
git clone https://github.com/fsztpartners/fszt-nameforge.git
cd fszt-nameforge
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages + API routes
  lib/
    council/              # LLM Council engine (3-stage deliberation)
    agents/               # 6 evaluation agents
    services/             # External API integrations
    scoring/              # Composite scoring
    supabase/             # DB clients
  components/
    evaluation/           # Wizard, results dashboard, dimension cards
    layout/               # Navbar, sidebar
  hooks/                  # React hooks for streaming, auth
  types/                  # TypeScript type definitions
supabase/
  migrations/             # SQL migrations
docs/
  PLAN.md                 # Full architecture plan
```

## Roadmap

See [PLAN.md](docs/PLAN.md) for the full architecture plan and phased build strategy.

- [x] Phase 0: Foundation (project scaffold, auth, DB, domain agent)
- [ ] Phase 1: MVP (all 6 agents, AI generation, scoring, comparison)
- [ ] Phase 2: Polish & Billing (Stripe, PDF export, landing page)
- [ ] Phase 3: Enterprise (real USPTO, team features, API access)

---

## Changelog

### v0.1.0 — Phase 0: Foundation (2026-03-28)

**Added:**
- Next.js 15 project scaffold with TypeScript, Tailwind CSS, shadcn/ui
- OpenRouter integration with LLM Council engine (3-stage deliberation)
- Supabase schema: organizations, evaluation_sessions, name_candidates, dimension_scores, research_events, lookup_cache
- RLS policies for all tables
- 3-step evaluation wizard UI (context -> details -> name input)
- Domain evaluation agent (end-to-end with RDAP + council)
- Live research feed via Supabase Realtime
- Results dashboard with dimension cards
- Project plan stored in docs/PLAN.md

---

## License

MIT

## Built by

[FSZT Partners LLC](https://github.com/fsztpartners)
