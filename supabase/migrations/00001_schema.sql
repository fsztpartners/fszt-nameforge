-- NameForge Database Schema
-- Phase 0: Foundation

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-----------------------------------------------------------
-- Organizations (billing entity)
-----------------------------------------------------------
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  plan_period_start timestamptz,
  plan_period_end timestamptz,
  monthly_eval_count integer not null default 0,
  monthly_eval_limit integer not null default 3,
  api_key_hash text,
  settings jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-----------------------------------------------------------
-- Profiles (extends auth.users)
-----------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  company_name text,
  organization_id uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-----------------------------------------------------------
-- Evaluation Sessions
-----------------------------------------------------------
create table evaluation_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  business_description text not null,
  verticals text[] default '{}',
  target_market text,
  company_stage text check (company_stage in ('pre-seed', 'seed', 'series-a', 'series-b', 'growth', 'pre-ipo')),
  naming_level text not null default 'company' check (naming_level in ('company', 'product', 'holding')),
  aesthetic_preferences jsonb default '{}',
  status text not null default 'created' check (status in ('created', 'running', 'completed', 'failed')),
  mode text not null default 'evaluate' check (mode in ('evaluate', 'generate')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-----------------------------------------------------------
-- Name Candidates
-----------------------------------------------------------
create table name_candidates (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references evaluation_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source text not null default 'user' check (source in ('user', 'ai-council', 'ai-generated')),
  composite_score numeric(5,2),
  legal_score numeric(5,2),
  domain_score numeric(5,2),
  social_score numeric(5,2),
  linguistic_score numeric(5,2),
  strategic_score numeric(5,2),
  financial_score numeric(5,2),
  overall_risk text check (overall_risk in ('green', 'yellow', 'red')),
  risk_summary text,
  evaluation_status text not null default 'pending' check (evaluation_status in ('pending', 'evaluating', 'completed', 'failed')),
  agents_completed text[] default '{}',
  agents_total integer not null default 6,
  is_favorited boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-----------------------------------------------------------
-- Dimension Scores (one per agent per candidate)
-----------------------------------------------------------
create table dimension_scores (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references name_candidates(id) on delete cascade,
  dimension text not null check (dimension in ('legal', 'domain', 'social', 'linguistic', 'strategic', 'financial')),
  score numeric(5,2) not null,
  risk_level text not null check (risk_level in ('green', 'yellow', 'red')),
  confidence numeric(3,2) default 0.80,
  results jsonb not null default '{}',
  summary text,
  recommendations text[] default '{}',
  -- LLM Council deliberation trace
  council_stage1 jsonb default '{}',
  council_stage2 jsonb default '{}',
  council_stage3 jsonb default '{}',
  chairman_model text,
  analysts_models text[] default '{}',
  processing_time_ms integer,
  cached boolean not null default false,
  created_at timestamptz not null default now(),
  unique (candidate_id, dimension)
);

-----------------------------------------------------------
-- Research Events (live feed — streamed to UI)
-----------------------------------------------------------
create table research_events (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references name_candidates(id) on delete cascade,
  dimension text not null,
  event_type text not null check (event_type in (
    'agent_start', 'check_start', 'check_complete',
    'model_dispatched', 'model_response', 'stage_complete',
    'agent_complete', 'error'
  )),
  message text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-----------------------------------------------------------
-- Lookup Cache
-----------------------------------------------------------
create table lookup_cache (
  id uuid primary key default uuid_generate_v4(),
  cache_key text unique not null,
  cache_type text not null,
  data jsonb not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-----------------------------------------------------------
-- Generation History
-----------------------------------------------------------
create table generation_history (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references evaluation_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_context jsonb not null,
  model text not null,
  generated_names text[] default '{}',
  reasoning jsonb default '{}',
  created_at timestamptz not null default now()
);

-----------------------------------------------------------
-- Comparison Boards
-----------------------------------------------------------
create table comparison_boards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  name text not null default 'Untitled Comparison',
  candidate_ids uuid[] default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-----------------------------------------------------------
-- Usage Events (for billing)
-----------------------------------------------------------
create table usage_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  event_type text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-----------------------------------------------------------
-- Indexes
-----------------------------------------------------------
create index idx_evaluation_sessions_user on evaluation_sessions(user_id);
create index idx_evaluation_sessions_status on evaluation_sessions(status);
create index idx_name_candidates_session on name_candidates(session_id);
create index idx_name_candidates_user on name_candidates(user_id);
create index idx_dimension_scores_candidate on dimension_scores(candidate_id);
create index idx_research_events_candidate on research_events(candidate_id);
create index idx_research_events_created on research_events(created_at);
create index idx_lookup_cache_key on lookup_cache(cache_key);
create index idx_lookup_cache_expires on lookup_cache(expires_at);
create index idx_usage_events_user_created on usage_events(user_id, created_at);

-----------------------------------------------------------
-- Enable Realtime on key tables
-----------------------------------------------------------
alter publication supabase_realtime add table dimension_scores;
alter publication supabase_realtime add table research_events;
alter publication supabase_realtime add table name_candidates;
