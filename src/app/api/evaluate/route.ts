import { NextRequest, NextResponse } from 'next/server';
import type { BusinessContext } from '@/types/evaluation';
import { randomUUID } from 'crypto';

export const maxDuration = 300;

// Local mode: works without Supabase. Returns mock IDs.
// When NEXT_PUBLIC_SUPABASE_URL is set, switch to real DB.
const isLocalMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, context } = body as { name: string; context: BusinessContext };

  if (!name || !context?.businessDescription) {
    return NextResponse.json({ error: 'Name and business description are required' }, { status: 400 });
  }

  if (isLocalMode) {
    // Local mock mode — no DB needed
    const sessionId = randomUUID();
    const candidateId = randomUUID();

    return NextResponse.json({
      sessionId,
      candidateId,
      name,
      context,
      mode: 'local',
      message: 'Running in local mode (no database). Results will be simulated.',
    }, { status: 202 });
  }

  // Production mode with Supabase
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const { runEvaluation } = await import('@/lib/agents/orchestrator');
  const supabase = createAdminClient();

  const userId = body.userId ?? '00000000-0000-0000-0000-000000000000';

  const { data: session, error: sessionError } = await supabase
    .from('evaluation_sessions')
    .insert({
      user_id: userId,
      business_description: context.businessDescription,
      verticals: context.verticals ?? [],
      target_market: context.targetMarket,
      company_stage: context.companyStage,
      naming_level: context.namingLevel ?? 'company',
      aesthetic_preferences: context.aestheticPreferences ?? {},
      status: 'running',
      mode: 'evaluate',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  const { data: candidate, error: candidateError } = await supabase
    .from('name_candidates')
    .insert({
      session_id: session.id,
      user_id: userId,
      name,
      source: 'user',
      evaluation_status: 'pending',
      agents_total: 6,
    })
    .select()
    .single();

  if (candidateError) {
    return NextResponse.json({ error: candidateError.message }, { status: 500 });
  }

  runEvaluation({ candidateId: candidate.id, name, context, plan: 'pro' })
    .then(async (result) => {
      await supabase.from('evaluation_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', session.id);
      console.log(`Evaluation complete for "${name}": ${result.compositeScore}/100 (${result.overallRisk})`);
    })
    .catch(async (error) => {
      console.error(`Evaluation failed for "${name}":`, error);
      await supabase.from('evaluation_sessions').update({ status: 'failed' }).eq('id', session.id);
    });

  return NextResponse.json({ sessionId: session.id, candidateId: candidate.id, name, context, mode: 'live' }, { status: 202 });
}
