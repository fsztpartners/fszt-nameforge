'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Globe, MessageSquare, Brain, TrendingUp, DollarSign, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { DimensionScore, ResearchEvent, Dimension, RiskLevel } from '@/types/evaluation';

const DIMENSION_META: Record<Dimension, { icon: typeof Shield; label: string; color: string }> = {
  legal: { icon: Shield, label: 'Legal & IP', color: 'text-blue-500' },
  domain: { icon: Globe, label: 'Domain & Digital', color: 'text-green-500' },
  social: { icon: MessageSquare, label: 'Social Handles', color: 'text-purple-500' },
  linguistic: { icon: Brain, label: 'Linguistic', color: 'text-orange-500' },
  strategic: { icon: TrendingUp, label: 'Strategic', color: 'text-cyan-500' },
  financial: { icon: DollarSign, label: 'Financial', color: 'text-yellow-500' },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof CheckCircle2 }> = {
  green: { label: 'GREEN', variant: 'default', icon: CheckCircle2 },
  yellow: { label: 'YELLOW', variant: 'secondary', icon: AlertTriangle },
  red: { label: 'RED', variant: 'destructive', icon: XCircle },
};

export default function ResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId');

  const [scores, setScores] = useState<DimensionScore[]>([]);
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [compositeScore, setCompositeScore] = useState<number | null>(null);
  const [overallRisk, setOverallRisk] = useState<RiskLevel | null>(null);

  useEffect(() => {
    if (!candidateId) return;

    const supabase = createClient();

    // Subscribe to dimension_scores (results streaming in)
    const scoresChannel = supabase
      .channel('dimension-scores')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dimension_scores', filter: `candidate_id=eq.${candidateId}` },
        (payload) => {
          const newScore = payload.new as any;
          setScores((prev) => [...prev, {
            id: newScore.id,
            candidateId: newScore.candidate_id,
            dimension: newScore.dimension,
            score: newScore.score,
            riskLevel: newScore.risk_level,
            confidence: newScore.confidence,
            results: newScore.results,
            summary: newScore.summary,
            recommendations: newScore.recommendations ?? [],
            councilStage1: newScore.council_stage1,
            councilStage2: newScore.council_stage2,
            councilStage3: newScore.council_stage3,
            chairmanModel: newScore.chairman_model,
            analystsModels: newScore.analysts_models ?? [],
            processingTimeMs: newScore.processing_time_ms,
            cached: newScore.cached,
          }]);
        },
      )
      .subscribe();

    // Subscribe to research_events (live feed)
    const eventsChannel = supabase
      .channel('research-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'research_events', filter: `candidate_id=eq.${candidateId}` },
        (payload) => {
          const newEvent = payload.new as any;
          setEvents((prev) => [...prev, {
            id: newEvent.id,
            candidateId: newEvent.candidate_id,
            dimension: newEvent.dimension,
            eventType: newEvent.event_type,
            message: newEvent.message,
            metadata: newEvent.metadata,
            createdAt: newEvent.created_at,
          }]);
        },
      )
      .subscribe();

    // Subscribe to candidate updates (composite score)
    const candidateChannel = supabase
      .channel('candidate-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'name_candidates', filter: `id=eq.${candidateId}` },
        (payload) => {
          const updated = payload.new as any;
          if (updated.composite_score) setCompositeScore(updated.composite_score);
          if (updated.overall_risk) setOverallRisk(updated.overall_risk);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scoresChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(candidateChannel);
    };
  }, [candidateId]);

  const completedCount = scores.length;
  const progressPercent = (completedCount / 6) * 100;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evaluation Results</h1>
          <p className="mt-1 text-muted-foreground">Session: {params.sessionId}</p>
        </div>
        {compositeScore !== null && overallRisk && (
          <div className="text-right">
            <div className="text-4xl font-bold">{compositeScore}</div>
            <Badge variant={RISK_CONFIG[overallRisk].variant}>
              {RISK_CONFIG[overallRisk].label}
            </Badge>
          </div>
        )}
      </div>

      {/* Progress */}
      <Card className="mb-8 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Council Progress</span>
          <span className="text-sm text-muted-foreground">{completedCount}/6 dimensions</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </Card>

      {/* Dimension Tabs */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feed">Research Feed</TabsTrigger>
          {Object.entries(DIMENSION_META).map(([key, meta]) => {
            const hasScore = scores.some((s) => s.dimension === key);
            return (
              <TabsTrigger key={key} value={key} className="gap-1.5">
                <meta.icon className={`h-3.5 w-3.5 ${hasScore ? meta.color : 'text-muted-foreground'}`} />
                {meta.label}
                {hasScore && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Research Feed Tab */}
        <TabsContent value="feed">
          <Card className="p-4">
            <h3 className="mb-4 font-semibold">Live Research Feed</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto font-mono text-sm">
              {events.length === 0 ? (
                <p className="text-muted-foreground">Waiting for council to begin deliberation...</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex gap-3 py-1 border-b border-border/50">
                    <span className="shrink-0 text-muted-foreground">
                      [{new Date(event.createdAt).toLocaleTimeString()}]
                    </span>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {event.dimension}
                    </Badge>
                    <span className={event.eventType === 'error' ? 'text-destructive' : ''}>
                      {event.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Dimension Detail Tabs */}
        {Object.entries(DIMENSION_META).map(([key, meta]) => {
          const score = scores.find((s) => s.dimension === key);
          return (
            <TabsContent key={key} value={key}>
              <Card className="p-6">
                {!score ? (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5 animate-pulse" />
                    <span>Waiting for {meta.label} council to complete...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Score Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <meta.icon className={`h-6 w-6 ${meta.color}`} />
                        <h2 className="text-xl font-semibold">{meta.label}</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold">{score.score}</span>
                        <Badge variant={RISK_CONFIG[score.riskLevel].variant}>
                          {RISK_CONFIG[score.riskLevel].label}
                        </Badge>
                      </div>
                    </div>

                    {/* Chairman Synthesis */}
                    <div>
                      <h3 className="mb-2 font-medium">Chairman Verdict</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{score.summary}</p>
                    </div>

                    {/* Recommendations */}
                    {score.recommendations.length > 0 && (
                      <div>
                        <h3 className="mb-2 font-medium">Recommendations</h3>
                        <ul className="space-y-1">
                          {score.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="shrink-0">-</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Council Individual Responses (Stage 1) */}
                    <div>
                      <h3 className="mb-2 font-medium">Individual Council Opinions</h3>
                      <div className="space-y-3">
                        {score.councilStage1?.responses?.map((response, i) => (
                          <Card key={i} className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{response.modelLabel}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{response.score}/100</span>
                                <Badge variant={RISK_CONFIG[response.riskLevel]?.variant ?? 'secondary'} className="text-xs">
                                  {response.riskLevel?.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {(response.processingTimeMs / 1000).toFixed(1)}s
                                </span>
                              </div>
                            </div>
                            <details>
                              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                Show full analysis
                              </summary>
                              <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                                {response.analysis}
                              </p>
                            </details>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Processing Info */}
                    <div className="text-xs text-muted-foreground flex items-center gap-4">
                      <span>Council: {score.analystsModels?.length ?? 0} analysts + chairman</span>
                      <span>Time: {((score.processingTimeMs ?? 0) / 1000).toFixed(1)}s</span>
                      <span>Confidence: {((score.confidence ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
