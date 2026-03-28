# NameForge: Startup Name Evaluator SaaS — Implementation Plan

## Context

You're building a universal AI-native platform (UAIP Co) and went through a manual, multi-step naming process covering trademark search, domain availability, social handles, linguistic analysis, and strategic positioning. This plan turns that entire process into a productized SaaS tool that anyone can use — from solo founders to enterprise teams.

Two key insights shape the architecture:
1. **Research transparency**: Like a deep research agent, users should see every step, check, and reasoning trace that produced a recommendation — not just the final answer
2. **LLM Council**: Instead of one AI's opinion, a council of 4–6 LLMs deliberate, critique each other anonymously, and a "chairman" synthesizes the final verdict — inspired by Andrej Karpathy's `llm-council` repo, all routed through **OpenRouter** with a single API key

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), Tailwind CSS, shadcn/ui, Recharts |
| Backend | Next.js API Routes, Vercel Functions (maxDuration 300s) |
| Database | Supabase (Postgres + RLS + Realtime + Edge Functions) |
| **AI Gateway** | **OpenRouter** (`@openrouter/ai-sdk-provider`) — single key, 300+ models |
| **LLM Council** | **4–6 models in parallel via OpenRouter** (Claude, GPT, Gemini, DeepSeek) |
| Auth | Supabase Auth (email + Google OAuth) |
| Billing | Stripe (Checkout, Portal, Webhooks) |
| Deploy | Vercel |

---

## The LLM Council Pattern

Rather than a single AI scoring a name, every evaluation dimension runs through a 3-stage deliberative process — adapted from Karpathy's `llm-council` pattern, implemented independently (no license dependency):

```
Stage 1: Parallel Collection
   All council models receive the same evaluation prompt independently
   → Claude Opus, GPT-4o, Gemini Pro, DeepSeek each produce their analysis

Stage 2: Anonymized Peer Ranking
   Each model receives ALL responses labeled "Response A/B/C/D" (no identities)
   → Each model critiques and ranks the others' work
   → Rankings aggregated by average position score

Stage 3: Chairman Synthesis
   A designated "chairman" model receives:
     - All Stage 1 individual analyses
     - All Stage 2 peer rankings and critiques
   → Synthesizes a final verdict, incorporating consensus patterns
   → Conservative risk rule: disagreement → take the more cautious rating
```

### Council Model Roster (via OpenRouter)

| Role | Model | Strength |
|------|-------|---------|
| Chairman | `anthropic/claude-opus-4-6` | Superior reasoning, legal nuance, synthesis |
| Analyst 1 | `openai/gpt-4o` | Broad strategic + business knowledge |
| Analyst 2 | `google/gemini-2.0-flash-thinking-exp` | Creative + cross-domain synthesis |
| Analyst 3 | `deepseek/deepseek-r1` | Linguistic depth, multilingual sensitivity |
| Analyst 4 | `mistralai/mistral-large` | Fast, cost-efficient secondary perspective |

**OpenRouter config** — single env var, all models accessible:
```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  extraBody: {
    'HTTP-Referer': 'https://nameforge.app',
    'X-Title': 'NameForge',
  }
});

const COUNCIL = {
  chairman: openrouter('anthropic/claude-opus-4-6'),
  analysts: [
    openrouter('openai/gpt-4o'),
    openrouter('google/gemini-2.0-flash-thinking-exp'),
    openrouter('deepseek/deepseek-r1'),
    openrouter('mistralai/mistral-large'),
  ]
};
```

---

## Research Transparency: Showing the Work

Every evaluation should feel like watching a deep research agent think out loud. The UI exposes three levels of detail:

### Level 1: Progress Feed (always visible)
A live activity stream as agents work, showing every step:
```
[12:00:01] Starting LLM Council evaluation for "Omnara"
[12:00:01] Stage 1 → Dispatching to 4 council analysts in parallel
[12:00:01]   ↳ Claude Opus: analyzing trademark risk...
[12:00:01]   ↳ GPT-4o: analyzing trademark risk...
[12:00:01]   ↳ Gemini Pro: analyzing trademark risk...
[12:00:01]   ↳ DeepSeek R1: analyzing trademark risk...
[12:00:04] Claude Opus responded (3.1s) — Risk: YELLOW
[12:00:05] GPT-4o responded (4.0s) — Risk: GREEN
[12:00:06] Gemini Pro responded (4.8s) — Risk: YELLOW
[12:00:07] DeepSeek R1 responded (6.2s) — Risk: GREEN
[12:00:07] Stage 2 → Peer ranking (anonymized)
[12:00:09] Rankings collected — Consensus: YELLOW (split 2/2)
[12:00:09] Stage 3 → Chairman (Claude Opus) synthesizing...
[12:00:12] LEGAL dimension complete — Final: YELLOW (conservative rule applied)
```

### Level 2: Individual Model Responses (expandable)
Each council member's raw analysis is visible — not just the final verdict:
- What each model said independently
- How it ranked the others' responses
- Why it flagged risks or cleared items

### Level 3: Full Reasoning Trace (downloadable)
The complete deliberation — all prompts, all responses, all rankings, the chairman's synthesis reasoning — exported as a structured JSON or PDF. This is the "show your work" artifact.

### Why This Matters
The reference document (UAIP C corp naming process) shows exactly this kind of layered thinking: initial screening → knockout pass → phonetic test → class strategy. Users should see that same rigor happening live, not just receive a score.

---

## Core User Flow (Minimal Input Design)

```
Step 1: "What's your company about?"
   → One sentence OR select template (AI SaaS, Healthtech, Fintech, etc.)

Step 2: Optional details (skip-able, <30 seconds)
   → Verticals multi-select, target market, company stage, naming level, aesthetic preferences

Step 3: Enter a name OR ask AI to generate suggestions
   → Hit "Evaluate" → Council spins up → research feed streams in real-time
```

---

## The 6 Evaluation Agents (Run in Parallel, Each Uses LLM Council)

### Agent 1: Legal & IP
**Checks performed:**
- USPTO TESS search (exact + phonetic + confusingly similar) — live API Phase 2, AI-estimated Phase 1
- Trademark class strategy (which classes: 9, 35, 41, 42, 44) with filing language
- International conflicts (WIPO, EU, UK, Canada, Australia)
- Common law search (unregistered marks found via web)
- Phonetic similarity test (Soundex + Metaphone algorithms)
- USPTO "confusing similarity" commercial impression test

**Research steps shown:** Search queries run, results found, which model flagged which risk, why chairman ruled GREEN/YELLOW/RED

### Agent 2: Domain & Digital Presence
**Checks performed:**
- .com availability (RDAP protocol — live, free)
- 12 TLD alternatives (.ai, .co, .io, .tech, .app, .inc, .corp, .us, .net, .org, .ai, .studio)
- Aftermarket pricing if taken (GoDaddy/Sedo APIs)
- SEO name competition (Google search result count, domain authority of top result)
- Typosquatting risk (common misspellings registered?)
- Domain age if registered (older = harder/costlier to acquire)

### Agent 3: Social Media Handles
**Checks performed (8 platforms × 4 variations each):**
- Platforms: Instagram, TikTok, LinkedIn, X/Twitter, Facebook, YouTube, GitHub, Reddit
- Variations per platform: @name, @getname, @namehq, @nameai
- Current owner analysis (active account? competitor? dormant?)
- Handle acquisition strategy if taken

### Agent 4: Linguistic & Brand Quality
**Checks performed:**
- IPA pronunciation mapping (international phonetic clarity)
- Spelling difficulty + dictation test simulation
- Memorability score (7 factors: length, pattern, rhythm, distinctiveness, imagery, ease, spelling)
- Cultural sensitivity sweep (25 languages — negative/embarrassing meanings?)
- Phonetic uniqueness vs known brand database
- Semantic evocation analysis (what the name makes people feel/think)
- Syllable count + stress pattern + euphony
- Visual/typographic balance (caps, lowercase, mixed)

### Agent 5: Strategic & Business Positioning
**Checks performed:**
- IPO-readiness score (does it sound like a public company?)
- Multi-vertical scalability (can it span the intended business lines without limitation?)
- Category creation potential (can this name own a new category?)
- Brand architecture fit: parent / product / holding company / all three?
- Competitive tier feel (Fortune 500 vs. scrappy startup vs. VC-backed unicorn)
- VC fundraising narrative fit
- Competitor name landscape (most similar names in market, similarity scores)

### Agent 6: Financial Estimation
**Checks performed:**
- USPTO filing cost per class (official fee schedule)
- Recommended trademark classes with filing language
- Attorney fee range (based on complexity and class count)
- Domain acquisition budget (if .com taken — estimate based on aftermarket comps)
- Brand protection annual monitoring cost
- International filing projection (Madrid Protocol route)
- Total budget: minimum / recommended / comprehensive tiers

### Bonus: Creative Output (Stage 3 Chairman output)
- 3 tagline suggestions with rationale
- Brand color palette concept (3 directions: bold/minimal/premium)
- Logo concept directions
- Brand voice & personality profile

---

## Parallel Orchestration Architecture

```
Client POST /api/evaluate { name, context }
       │
       ├── Creates evaluation_session + name_candidate rows
       ├── Returns { sessionId, candidateId } immediately (HTTP 202)
       │
       └── Background orchestrator:
           Promise.allSettled([
             legalAgent.run(name, context),       ─┐
             domainAgent.run(name, context),        │  Each agent internally
             socialAgent.run(name, context),        │  runs its own 3-stage
             linguisticAgent.run(name, context),    │  LLM Council
             strategicAgent.run(name, context),     │
             financialAgent.run(name, context),    ─┘
           ])
           │
           Each agent pipeline:
             1. External API checks (cache → live)
             2. Stage 1: Parallel council analysts
             3. Stage 2: Anonymized peer ranking
             4. Stage 3: Chairman synthesis
             5. Write dimension_scores + research_trace to Supabase
             6. Supabase Realtime push → client UI update
```

- 45s per-agent timeout; `Promise.allSettled` ensures one failure doesn't block others
- Research traces streamed via Supabase Realtime as they generate
- Conservative risk rule: on council disagreement, take the more cautious rating

---

## Scoring System

**Composite Score (0–100)** with weights by naming level:

| Dimension | Company | Product | Holding Co |
|-----------|---------|---------|------------|
| Legal | 25% | 20% | 30% |
| Domain | 20% | 25% | 10% |
| Social | 10% | 20% | 5% |
| Linguistic | 20% | 20% | 15% |
| Strategic | 20% | 10% | 30% |
| Financial | 5% | 5% | 10% |

**Risk override:** Composite 90 + RED legal = overall RED. Worst dimension wins on risk banner.

---

## Database Schema

```sql
-- Organizations (billing entity)
organizations: id, name, slug, owner_id, stripe_customer_id,
  plan (free/pro/enterprise), monthly_eval_count, monthly_eval_limit

-- Evaluation sessions
evaluation_sessions: id, user_id, org_id, business_description,
  verticals[], target_market, company_stage, naming_level,
  status, mode (evaluate/generate)

-- Name candidates
name_candidates: id, session_id, name, source (user/ai-council/ai-generated),
  composite_score, legal_score, domain_score, social_score,
  linguistic_score, strategic_score, financial_score,
  overall_risk (green/yellow/red), agents_completed[], is_favorited

-- Detailed dimension results + full council deliberation
dimension_scores: id, candidate_id, dimension, score, risk_level,
  confidence, results (JSONB), summary, recommendations[],
  council_stage1 (JSONB),   -- each model's raw analysis
  council_stage2 (JSONB),   -- peer rankings + critiques
  council_stage3 (JSONB),   -- chairman synthesis + reasoning
  chairman_model, analysts_models[], processing_time_ms, cached

-- Live research trace (streams to UI in real-time)
research_events: id, candidate_id, dimension, event_type
  (agent_start/model_response/stage_complete/check_complete/etc),
  message, metadata (JSONB), created_at

-- Cache for expensive external lookups
lookup_cache: cache_key (unique), data (JSONB), expires_at

-- Comparison boards
comparison_boards: id, user_id, name, candidate_ids[]
```

---

## External Service Integration (Tiered)

| Service | Phase 1 (MVP) | Phase 2 (Pro) | Phase 3 (Enterprise) |
|---------|--------------|---------------|---------------------|
| USPTO | AI council estimated (labeled) | Trademarkia/Corsearch API | Direct TESS + headless |
| Domain | RDAP (free) + Domainr | + aftermarket pricing APIs | + bulk monitoring |
| Social | Namechk/KnowEm API | + direct platform APIs | + monitoring alerts |
| International TM | AI council estimated | WIPO Global Brand Database | + local market searches |
| SEO | AI estimated | SerpAPI / DataForSEO | + competitor monitoring |

---

## Pricing Tiers

| | Free | Pro ($49/mo) | Enterprise (custom) |
|---|------|-------------|-------------------|
| Evaluations | 3/month | Unlimited | Unlimited |
| Council models | 2 analysts | 4 analysts + chairman | Configurable |
| AI Generation | 5 names | 25 names/session | Unlimited |
| Checks | AI-estimated | Full live external | Full + monitoring |
| Research trace | Summary only | Full trace + export | Full + white-label |
| Comparison | 2 names | Unlimited | Unlimited + sharing |
| API Access | No | No | Yes |
| Team Members | 1 | 5 | Unlimited |

---

## Project Structure

```
fszt-startup-namer/
├── supabase/
│   ├── migrations/
│   │   ├── 00001_schema.sql
│   │   ├── 00002_rls.sql
│   │   └── 00003_functions.sql
│   └── functions/process-queue/
├── src/
│   ├── app/
│   │   ├── (auth)/login, signup, callback
│   │   ├── (dashboard)/
│   │   │   ├── evaluate/page.tsx          # 3-step wizard
│   │   │   ├── evaluate/[sessionId]/      # Live results + research feed
│   │   │   ├── generate/page.tsx
│   │   │   ├── favorites/page.tsx
│   │   │   └── compare/page.tsx
│   │   └── api/
│   │       ├── evaluate/route.ts          # Orchestrator entry point
│   │       ├── generate/route.ts          # AI name generation
│   │       ├── checks/{trademark,domain,social}/
│   │       ├── webhooks/stripe/route.ts
│   │       └── export/[sessionId]/route.ts
│   ├── lib/
│   │   ├── council/                       # LLM Council engine
│   │   │   ├── index.ts                   # Main council runner
│   │   │   ├── stage1-collect.ts          # Parallel model dispatch
│   │   │   ├── stage2-rank.ts             # Anonymized peer ranking
│   │   │   ├── stage3-synthesize.ts       # Chairman synthesis
│   │   │   ├── models.ts                  # OpenRouter model config
│   │   │   └── prompts/                   # Per-dimension prompts
│   │   ├── agents/                        # 6 evaluation agents
│   │   │   ├── orchestrator.ts
│   │   │   ├── base-agent.ts
│   │   │   ├── legal-agent.ts
│   │   │   ├── domain-agent.ts
│   │   │   ├── social-agent.ts
│   │   │   ├── linguistic-agent.ts
│   │   │   ├── strategic-agent.ts
│   │   │   └── financial-agent.ts
│   │   ├── services/{trademark,domain,social,seo}/
│   │   ├── scoring/composite.ts
│   │   ├── billing/stripe.ts
│   │   └── cache/lookup.ts
│   ├── components/
│   │   ├── evaluation/
│   │   │   ├── evaluation-wizard.tsx
│   │   │   ├── results-dashboard.tsx
│   │   │   ├── research-feed.tsx          # Live activity stream
│   │   │   ├── council-deliberation.tsx   # Expandable model responses
│   │   │   ├── agent-progress-panel.tsx
│   │   │   ├── composite-score-card.tsx
│   │   │   └── dimension-cards/           # 6 cards
│   │   ├── generation/
│   │   └── comparison/
│   └── hooks/
│       ├── use-evaluation-stream.ts       # Supabase Realtime
│       ├── use-research-feed.ts           # Live research_events stream
│       └── use-billing.ts
```

---

## Phased Build Plan

### Phase 0: Foundation (Week 1-2)
- Next.js 15 + Supabase + Auth + Tailwind + shadcn/ui scaffold
- OpenRouter integration + council engine (3 stages, configurable models)
- Database migrations (all tables including research_events)
- 3-step evaluation wizard UI
- Domain Agent end-to-end with council + live research feed
- Supabase Realtime subscription for streaming results
- Deploy to Vercel

### Phase 1: MVP (Week 3-5)
- All 6 agents with LLM Council running through each
- AI name generation (council generates + debates name suggestions)
- Research feed for all dimensions (every check streamed in real-time)
- Composite scoring with per-naming-level weights
- All 6 dimension result cards + council deliberation expandable view
- Full reasoning trace export (JSON)
- Favorites, basic comparison, lookup caching, usage limits

### Phase 2: Polish & Billing (Week 6-8)
- Stripe integration (Checkout, Portal, Webhooks, plan gating)
- Live external checks for Pro tier (domain WHOIS, social handle APIs)
- PDF export with full research trace
- Creative output section (taglines, colors, brand voice)
- Public share links, comparison radar charts
- Landing page, rate limiting, error handling polish

### Phase 3: Scale & Enterprise (Week 9-12)
- Real USPTO TESS integration (paid trademark API)
- WIPO Global Brand Database
- Configurable council (users can choose which models to include)
- Supabase Queues for slow/deferred checks
- Enterprise API with API key auth
- Team/organization features + white-label reports
- Admin dashboard

---

## Key Technical Decisions

1. **OpenRouter as sole AI gateway**: One API key, one SDK (`@openrouter/ai-sdk-provider`), swap/add models via config. No need to manage separate Anthropic + OpenAI + Google credentials.

2. **LLM Council per dimension** (not one global council): Each of the 6 agents runs its own 3-stage council specialized for that domain. Legal council uses legal-specific prompts; linguistic council uses phonetics-aware prompts. More precise than one general council.

3. **Research transparency as core feature**: The `research_events` table + Realtime stream is not an afterthought — it's the primary UI. Users watching the council deliberate builds trust in the output.

4. **Conservative risk aggregation**: When council models disagree on risk, always take the more cautious rating. Named after the principle that a bad company name that clears is worse than a good name that gets extra scrutiny.

5. **In-process agents** (not microservices): All 6 run in one Vercel function via `Promise.allSettled`. 300s maxDuration on Vercel Pro.

6. **Supabase Realtime** for streaming: Client subscribes to `dimension_scores` + `research_events` directly. No custom SSE endpoint needed.

7. **Tiered external checks**: Free = AI council estimated (clearly labeled). Pro = live APIs. Ships fast without fragile scraping dependency.

---

## Verification Plan

1. **Council runs end-to-end**: Submit "Omnara" → verify all 3 council stages complete per dimension → check each model's response is stored in `council_stage1/2/3`
2. **Research feed streams live**: Open results page → research_events appear in real-time feed as checks complete
3. **Conservative risk rule**: Engineer a test where 2 models say GREEN and 2 say RED → verify final = RED
4. **OpenRouter model swap**: Change one council model in config → verify new model's responses appear in results
5. **Generate names**: Provide context → council generates + debates name suggestions → evaluate top pick
6. **Free tier limit**: 3 evaluations → 4th blocked with upgrade prompt
7. **Full trace export**: Complete evaluation → download JSON trace → verify all prompts, responses, and rankings included
8. **Failure resilience**: Kill one model mid-council → verify `Promise.allSettled` surfaces partial results, dimension marked incomplete but others unaffected
