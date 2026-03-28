-- Row Level Security Policies
-- All tables have RLS enabled. Service role bypasses for agent writes.

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table evaluation_sessions enable row level security;
alter table name_candidates enable row level security;
alter table dimension_scores enable row level security;
alter table research_events enable row level security;
alter table lookup_cache enable row level security;
alter table generation_history enable row level security;
alter table comparison_boards enable row level security;
alter table usage_events enable row level security;

-- Profiles: users can read/update their own
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- Organizations: owner can manage, members can read
create policy "orgs_select" on organizations for select using (auth.uid() = owner_id);
create policy "orgs_insert" on organizations for insert with check (auth.uid() = owner_id);
create policy "orgs_update" on organizations for update using (auth.uid() = owner_id);

-- Evaluation sessions: user's own
create policy "sessions_select" on evaluation_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert" on evaluation_sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update" on evaluation_sessions for update using (auth.uid() = user_id);

-- Name candidates: user's own
create policy "candidates_select" on name_candidates for select using (auth.uid() = user_id);
create policy "candidates_insert" on name_candidates for insert with check (auth.uid() = user_id);
create policy "candidates_update" on name_candidates for update using (auth.uid() = user_id);

-- Dimension scores: read via candidate ownership (join through name_candidates)
create policy "scores_select" on dimension_scores for select using (
  exists (select 1 from name_candidates where name_candidates.id = dimension_scores.candidate_id and name_candidates.user_id = auth.uid())
);
-- Insert/update only via service role (agents write results)

-- Research events: read via candidate ownership
create policy "events_select" on research_events for select using (
  exists (select 1 from name_candidates where name_candidates.id = research_events.candidate_id and name_candidates.user_id = auth.uid())
);

-- Lookup cache: read-only for all authenticated users (shared cache)
create policy "cache_select" on lookup_cache for select using (auth.role() = 'authenticated');

-- Generation history: user's own
create policy "gen_history_select" on generation_history for select using (auth.uid() = user_id);
create policy "gen_history_insert" on generation_history for insert with check (auth.uid() = user_id);

-- Comparison boards: user's own
create policy "boards_select" on comparison_boards for select using (auth.uid() = user_id);
create policy "boards_insert" on comparison_boards for insert with check (auth.uid() = user_id);
create policy "boards_update" on comparison_boards for update using (auth.uid() = user_id);
create policy "boards_delete" on comparison_boards for delete using (auth.uid() = user_id);

-- Usage events: user's own
create policy "usage_select" on usage_events for select using (auth.uid() = user_id);
