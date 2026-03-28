import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runEvaluation } from '@/lib/agents/orchestrator';
import type { BusinessContext } from '@/types/evaluation';

export const maxDuration = 300; // 5 minutes for full evaluation

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, context } = body as { name: string; context: BusinessContext };

  if (!name || !context?.businessDescription) {
    return NextResponse.json({ error: 'Name and business description are required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // TODO: Get user from auth session. Using a placeholder for now.
  const userId = body.userId ?? '00000000-0000-0000-0000-000000000000';

  // Create evaluation session
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

  // Create name candidate
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

  // Return immediately with IDs, run evaluation in background
  const responseBody = {
    sessionId: session.id,
    candidateId: candidate.id,
    message: 'Evaluation started. Subscribe to Supabase Realtime for live updates.',
  };

  // Fire-and-forget: run evaluation in the background
  // The function stays alive for up to maxDuration
  runEvaluation({
    candidateId: candidate.id,
    name,
    context,
    plan: 'pro',
  })
    .then(async (result) => {
      await supabase
        .from('evaluation_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', session.id);
      console.log(`Evaluation complete for "${name}": ${result.compositeScore}/100 (${result.overallRisk})`);
    })
    .catch(async (error) => {
      console.error(`Evaluation failed for "${name}":`, error);
      await supabase
        .from('evaluation_sessions')
        .update({ status: 'failed' })
        .eq('id', session.id);
    });

  return NextResponse.json(responseBody, { status: 202 });
}
