'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Globe, MessageSquare, Brain, TrendingUp, DollarSign, Clock, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import type { Dimension, RiskLevel } from '@/types/evaluation';

// ----- types for local display -----
interface AnalystResponse {
  model: string;
  modelLabel: string;
  analysis: string;
  score: number;
  riskLevel: RiskLevel;
  processingTimeMs: number;
}
interface LocalDimensionResult {
  dimension: Dimension;
  score: number;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  recommendations: string[];
  analysts: AnalystResponse[];
  chairmanModel: string;
  processingTimeMs: number;
}
interface FeedEvent {
  id: string;
  dimension: string;
  type: string;
  message: string;
  ts: number;
}

const DIMENSION_META: Record<Dimension, { icon: typeof Shield; label: string; color: string }> = {
  legal: { icon: Shield, label: 'Legal & IP', color: 'text-blue-500' },
  domain: { icon: Globe, label: 'Domain & Digital', color: 'text-green-500' },
  social: { icon: MessageSquare, label: 'Social Handles', color: 'text-purple-500' },
  linguistic: { icon: Brain, label: 'Linguistic', color: 'text-orange-500' },
  strategic: { icon: TrendingUp, label: 'Strategic', color: 'text-cyan-500' },
  financial: { icon: DollarSign, label: 'Financial', color: 'text-yellow-500' },
};

const RISK_UI: Record<RiskLevel, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof CheckCircle2 }> = {
  green: { label: 'GREEN', variant: 'default', icon: CheckCircle2 },
  yellow: { label: 'YELLOW', variant: 'secondary', icon: AlertTriangle },
  red: { label: 'RED', variant: 'destructive', icon: XCircle },
};

// ---- simulated council data generator ----
function simulateDimensionResult(dimension: Dimension, name: string, context: string): LocalDimensionResult {
  const analysts: AnalystResponse[] = [
    { model: 'openai/gpt-4o', modelLabel: 'GPT-4o', analysis: '', score: 0, riskLevel: 'green', processingTimeMs: 0 },
    { model: 'google/gemini-2.0-flash', modelLabel: 'Gemini Flash', analysis: '', score: 0, riskLevel: 'green', processingTimeMs: 0 },
    { model: 'deepseek/deepseek-r1', modelLabel: 'DeepSeek R1', analysis: '', score: 0, riskLevel: 'green', processingTimeMs: 0 },
    { model: 'mistralai/mistral-large', modelLabel: 'Mistral Large', analysis: '', score: 0, riskLevel: 'green', processingTimeMs: 0 },
  ];

  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  const dimData: Record<Dimension, { base: number; risk: RiskLevel; summary: string; recs: string[]; analyses: string[] }> = {
    legal: {
      base: 72 + Math.floor(Math.random() * 20),
      risk: slug.length > 5 ? 'green' : 'yellow',
      summary: `"${name}" is an invented/fanciful mark with strong distinctiveness. The name has no exact match conflicts in standard trademark databases. The prefix "${slug.slice(0, 3)}" has moderate crowding in Class 9 (software) but the full word is sufficiently unique. Recommended filing across Classes 9, 35, 41, 42, and 44.`,
      recs: [
        `File in Classes 9 (software), 42 (SaaS), 35 (consulting), 41 (education), 44 (healthcare)`,
        `Conduct full TESS search before filing to confirm no phonetic conflicts`,
        `Consider filing Madrid Protocol for international protection in key markets`,
        `Budget $5,000-$8,000 for initial US filing across 5 classes`,
      ],
      analyses: [
        `LEGAL ANALYSIS: "${name}" falls on the fanciful/invented end of the distinctiveness spectrum, which is the strongest position for trademark registration. No exact matches found in standard databases. The prefix pattern has some crowding but the full word appears unique. SCORE: ${72 + Math.floor(Math.random() * 15)} RISK: ${slug.length > 5 ? 'green' : 'yellow'}`,
        `TRADEMARK ASSESSMENT: The name "${name}" is a coined term with no dictionary meaning, placing it in the strongest trademark category. Phonetic analysis shows low collision risk. Cross-class conflicts are minimal. International screening shows no obvious conflicts in EU, UK, or WIPO databases. SCORE: ${75 + Math.floor(Math.random() * 15)} RISK: green`,
        `IP EVALUATION: "${name}" demonstrates high registrability potential. As an invented word, it avoids the descriptiveness objections that plague most startup names. Crowded field analysis shows the root "${slug.slice(0, 4)}" appears in approximately 15-25 registered marks, but none in closely related classes. SCORE: ${68 + Math.floor(Math.random() * 20)} RISK: yellow`,
        `CLEARANCE REVIEW: "${name}" presents a favorable trademark profile. The name is distinctive, pronounceable, and free of obvious conflicts. Recommended classes: 9, 35, 41, 42, 44. Monitor for new filings with similar roots. SCORE: ${70 + Math.floor(Math.random() * 18)} RISK: green`,
      ],
    },
    domain: {
      base: 60 + Math.floor(Math.random() * 25),
      risk: 'yellow',
      summary: `${slug}.com availability is uncertain — likely registered but potentially acquirable. Alternative TLDs ${slug}.ai and ${slug}.co show higher availability probability. SEO competition for "${name}" is low (invented word), giving strong organic ranking potential. Recommended strategy: acquire ${slug}.ai as primary, pursue ${slug}.com through aftermarket.`,
      recs: [
        `Check ${slug}.com via RDAP/WHOIS — if taken, estimate aftermarket value`,
        `Register ${slug}.ai immediately (likely available, $50-80/year)`,
        `Secure ${slug}.co, ${slug}.io as defensive registrations`,
        `Register common misspellings to prevent traffic leakage`,
      ],
      analyses: [
        `DOMAIN ANALYSIS: ${slug}.com is the gold standard but may be registered. The invented nature of "${name}" means aftermarket pricing should be moderate ($2,000-$15,000 range). Alternative TLDs like .ai are increasingly accepted for AI companies. SEO competition is effectively zero for an invented word. SCORE: ${62 + Math.floor(Math.random() * 20)} RISK: yellow`,
        `DIGITAL PRESENCE: The domain landscape for "${slug}" is favorable. As an invented term, there's no existing SEO competition. TLD strategy: .ai for tech credibility, .com for enterprise trust. Domain aftermarket comparable sales for similar 6-8 letter invented words: $3,000-$20,000. SCORE: ${58 + Math.floor(Math.random() * 25)} RISK: yellow`,
        `AVAILABILITY CHECK: ${slug}.com status requires live WHOIS lookup. Alternative TLD availability is typically high for invented words. Recommended defensive portfolio: .com, .ai, .co, .io, .net (5 domains, ~$200/year). SEO difficulty score for "${name}": very low (brand-new term). SCORE: ${65 + Math.floor(Math.random() * 20)} RISK: yellow`,
        `DOMAIN STRATEGY: For an AI-native company, ${slug}.ai is the ideal primary domain. It communicates the company's focus while being available at standard registration pricing. Pursue ${slug}.com as a long-term acquisition. SCORE: ${70 + Math.floor(Math.random() * 15)} RISK: green`,
      ],
    },
    social: {
      base: 65 + Math.floor(Math.random() * 20),
      risk: 'yellow',
      summary: `Handle @${slug} availability varies by platform. LinkedIn company pages allow any name (no unique handle constraint). GitHub, Reddit likely available for invented words. Instagram and TikTok are the most competitive. Recommended strategy: register @${slug} where available, use @get${slug} as fallback on competitive platforms.`,
      recs: [
        `Register @${slug} on all available platforms immediately`,
        `Use @get${slug} or @${slug}hq as fallback on competitive platforms`,
        `Claim LinkedIn company page for "${name}" (no handle restriction)`,
        `Set up @${slug} on GitHub for open-source/developer presence`,
      ],
      analyses: [
        `SOCIAL HANDLE ANALYSIS: @${slug} is a unique invented word, giving moderate-to-high availability across platforms. Instagram: likely available (6+ character invented words have ~70% availability). TikTok: similar odds. X/Twitter: moderate competition. GitHub: likely available. SCORE: ${65 + Math.floor(Math.random() * 20)} RISK: yellow`,
        `PLATFORM SCAN: For an invented word like "${slug}", handle availability probability: GitHub (90%), Reddit (85%), LinkedIn (95% - company pages), YouTube (80%), Instagram (60%), TikTok (65%), X/Twitter (55%), Facebook (70%). SCORE: ${68 + Math.floor(Math.random() * 18)} RISK: yellow`,
        `HANDLE STRATEGY: The key platforms for a B2B AI company are LinkedIn, GitHub, X/Twitter, and YouTube. All have high availability for invented words. Consumer platforms (Instagram, TikTok) are less critical but worth securing. SCORE: ${70 + Math.floor(Math.random() * 15)} RISK: green`,
        `SOCIAL AUDIT: @${slug} across 8 platforms. Primary concern: Instagram and TikTok where short handles are competitive. Recommended variations: @${slug}, @get${slug}, @${slug}ai. Consistency across platforms is achievable with early registration. SCORE: ${60 + Math.floor(Math.random() * 20)} RISK: yellow`,
      ],
    },
    linguistic: {
      base: 75 + Math.floor(Math.random() * 18),
      risk: 'green',
      summary: `"${name}" scores well on linguistic metrics. Pronunciation is intuitive for English speakers with ${name.length <= 7 ? 'excellent' : 'good'} brevity. No negative meanings found in major world languages screened (15+ languages). The name evokes ${slug.includes('a') ? 'openness and innovation' : 'strength and technology'}. Strong memorability due to invented word status — no competing mental associations.`,
      recs: [
        `Create a pronunciation guide for international audiences`,
        `Register common phonetic misspellings as domain redirects`,
        `Test name recall in focus groups before final commitment`,
        `Develop a clear "how to say it" section for media kit`,
      ],
      analyses: [
        `LINGUISTIC PROFILE: "${name}" — Syllable count: ${Math.ceil(name.length / 3)}. Stress pattern: initial syllable emphasis. Phonetic clarity: high for English, moderate for international. Dictation test: likely 70-80% correct on first hearing. Memorability: strong (invented words with vowel patterns are highly memorable). Cultural scan: no negative meanings found in Spanish, French, German, Mandarin, Japanese, Korean, Arabic, Hindi, Portuguese, Russian. SCORE: ${78 + Math.floor(Math.random() * 15)} RISK: green`,
        `BRAND PHONETICS: "${name}" has a pleasant sound profile. The vowel-consonant ratio is balanced. No unfortunate homophones in major languages. The name feels modern without being trendy — important for longevity. Typography: works well in both uppercase (${name.toUpperCase()}) and lowercase (${name.toLowerCase()}). SCORE: ${75 + Math.floor(Math.random() * 15)} RISK: green`,
        `NAMING ANALYSIS: "${name}" occupies the ideal space for a brand name — invented enough to be ownable, but natural enough to feel like a real word. Euphony rating: 7/10. Spelling from audio: moderate difficulty. Visual balance: good. SCORE: ${72 + Math.floor(Math.random() * 18)} RISK: green`,
        `CULTURAL REVIEW: Screened "${name}" across 20 languages for negative associations. No issues found. The phonetic structure avoids common pitfalls (no "shi", "fu", or "ku" sounds that cause issues in East Asian languages). Safe for global deployment. SCORE: ${80 + Math.floor(Math.random() * 12)} RISK: green`,
      ],
    },
    strategic: {
      base: 70 + Math.floor(Math.random() * 22),
      risk: 'green',
      summary: `"${name}" positions well as a ${context.includes('holding') ? 'holding company' : 'platform company'} name. IPO-readiness score is strong — the name sounds like it belongs on NASDAQ. Multi-vertical scalability is excellent (invented words aren't boxed into any industry). Brand architecture flexibility: works as parent company OR product brand. Competitive positioning: sits in the premium/enterprise tier alongside names like Palantir, Confluent, Datadog.`,
      recs: [
        `Use "${name}" as the parent entity; create product sub-brands for verticals`,
        `Test the "earnings call" prompt: "${name} Corporation reports Q4 revenue..."`,
        `Build brand narrative around the name's etymology for investor materials`,
        `Develop a brand architecture document mapping parent → product → vertical brands`,
      ],
      analyses: [
        `STRATEGIC FIT: "${name}" is an excellent platform company name. IPO readiness: high — sounds authoritative without being generic. Multi-vertical test: passes (the name doesn't evoke any single industry). Category creation potential: moderate-to-high. Comparable tier: Palantir, Snowflake, CrowdStrike. VC pitch test: "We're ${name}, the AI-native platform for enterprise transformation" — works naturally. SCORE: ${72 + Math.floor(Math.random() * 20)} RISK: green`,
        `POSITIONING ANALYSIS: "${name}" occupies the premium-enterprise tier of naming. 10-year test: the name avoids trendy suffixes (-ify, -ly, -io) that may feel dated. Brand architecture: flexible enough for parent company OR product. Fortune 500 feel: 7.5/10. Competitive landscape: no direct name conflicts with major tech companies. SCORE: ${75 + Math.floor(Math.random() * 18)} RISK: green`,
        `MARKET POSITIONING: "${name}" differentiates well from the existing AI company naming landscape (which is crowded with "AI" suffixes and neural/cognitive prefixes). The name creates space for a distinct brand identity. Fundraising narrative fit: strong — the name suggests ambition without hyperbole. SCORE: ${68 + Math.floor(Math.random() * 22)} RISK: green`,
        `BRAND STRATEGY: For a multi-vertical AI company, "${name}" provides the right balance of abstraction (broad enough for any vertical) and substance (sounds like a real company, not a side project). Recommended brand architecture: ${name} Corp (parent) → ${name} Health, ${name} Ventures, ${name} Learn (verticals). SCORE: ${74 + Math.floor(Math.random() * 16)} RISK: green`,
      ],
    },
    financial: {
      base: 68 + Math.floor(Math.random() * 20),
      risk: 'yellow',
      summary: `Total first-year brand protection budget estimate: $8,000-$35,000 depending on scope. Minimum path (US trademark + primary domain): ~$3,500. Recommended path (multi-class US filing + 3 TLDs + monitoring): ~$15,000. Comprehensive path (international + full domain portfolio + monitoring): ~$35,000. The name's invented nature reduces likelihood of opposition proceedings (cost savings).`,
      recs: [
        `Start with Minimum tier: 2 USPTO classes + .ai domain ($3,500)`,
        `Upgrade to Recommended within 6 months of funding`,
        `Budget $2,000-$3,000 annually for monitoring after initial filing`,
        `Consider Comprehensive tier before Series A or international expansion`,
      ],
      analyses: [
        `COST ANALYSIS: USPTO filing: $250-$350/class x 5 classes = $1,250-$1,750. Attorney fees: $1,500-$3,000/class for full prosecution. Domain: $10-$80 (new registration) or $2,000-$20,000 (aftermarket .com). Annual monitoring: $500-$3,000. Total Year 1 Minimum: ~$3,500. Recommended: ~$15,000. Comprehensive: ~$35,000. SCORE: ${70 + Math.floor(Math.random() * 18)} RISK: yellow`,
        `BUDGET PROJECTION: For a pre-seed company, the Minimum tier ($3,500) provides adequate protection to operate. Post-seed, upgrade to Recommended ($15,000) for multi-class protection and proper domain portfolio. Pre-Series A, move to Comprehensive ($35,000) for international coverage. These costs are typical for AI/SaaS startups. SCORE: ${72 + Math.floor(Math.random() * 15)} RISK: yellow`,
        `FINANCIAL ASSESSMENT: The invented nature of "${name}" is a financial advantage — lower opposition risk means lower legal costs. Estimated trademark prosecution timeline: 8-14 months. Domain acquisition strategy can be phased to spread costs. International filing via Madrid Protocol saves ~40% vs. direct filing. SCORE: ${65 + Math.floor(Math.random() * 20)} RISK: yellow`,
        `COST-BENEFIT: Brand protection ROI is highest in the first year. For "${name}": the unique name reduces conflict resolution costs. Key budget items: trademark filing ($5K-$10K), domain ($500-$15K), monitoring ($1K-$3K/yr). Total 3-year TCO: $15K-$50K depending on growth trajectory. SCORE: ${68 + Math.floor(Math.random() * 18)} RISK: yellow`,
      ],
    },
  };

  const data = dimData[dimension];
  const scoredAnalysts = analysts.map((a, i) => ({
    ...a,
    analysis: data.analyses[i] ?? data.analyses[0],
    score: data.base + Math.floor(Math.random() * 10) - 5,
    riskLevel: data.risk,
    processingTimeMs: 1200 + Math.floor(Math.random() * 3000),
  }));

  return {
    dimension,
    score: data.base,
    riskLevel: data.risk,
    confidence: 0.78 + Math.random() * 0.15,
    summary: data.summary,
    recommendations: data.recs,
    analysts: scoredAnalysts,
    chairmanModel: 'anthropic/claude-sonnet-4',
    processingTimeMs: 4000 + Math.floor(Math.random() * 6000),
  };
}

// ---- component ----
export default function ResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const nameParam = searchParams.get('name') ?? 'Unknown';
  const contextParam = searchParams.get('context');
  const contextStr = contextParam ? JSON.parse(decodeURIComponent(contextParam)).businessDescription ?? '' : '';

  const [scores, setScores] = useState<LocalDimensionResult[]>([]);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [compositeScore, setCompositeScore] = useState<number | null>(null);
  const [overallRisk, setOverallRisk] = useState<RiskLevel | null>(null);
  const [running, setRunning] = useState(true);

  const addEvent = useCallback((dimension: string, type: string, message: string) => {
    setEvents((prev) => [...prev, { id: crypto.randomUUID(), dimension, type, message, ts: Date.now() }]);
  }, []);

  useEffect(() => {
    const dimensions: Dimension[] = ['legal', 'domain', 'social', 'linguistic', 'strategic', 'financial'];
    let cancelled = false;

    async function runSimulation() {
      addEvent('system', 'start', `Starting LLM Council evaluation for "${nameParam}"`);
      addEvent('system', 'info', `Dispatching 6 evaluation agents in parallel...`);

      // Simulate agents completing one by one with staggered delays
      for (let i = 0; i < dimensions.length; i++) {
        if (cancelled) return;
        const dim = dimensions[i];
        const meta = DIMENSION_META[dim];

        addEvent(dim, 'agent_start', `${meta.label} agent starting...`);

        // Stage 1 simulation
        await sleep(400);
        if (cancelled) return;
        addEvent(dim, 'model_dispatched', `Stage 1: GPT-4o analyzing ${dim}...`);
        addEvent(dim, 'model_dispatched', `Stage 1: Gemini Flash analyzing ${dim}...`);
        addEvent(dim, 'model_dispatched', `Stage 1: DeepSeek R1 analyzing ${dim}...`);
        addEvent(dim, 'model_dispatched', `Stage 1: Mistral Large analyzing ${dim}...`);

        await sleep(800 + Math.random() * 1500);
        if (cancelled) return;
        addEvent(dim, 'model_response', `GPT-4o responded (${(1.2 + Math.random() * 2).toFixed(1)}s)`);
        await sleep(300 + Math.random() * 800);
        if (cancelled) return;
        addEvent(dim, 'model_response', `Gemini Flash responded (${(0.8 + Math.random() * 1.5).toFixed(1)}s)`);
        await sleep(200 + Math.random() * 600);
        if (cancelled) return;
        addEvent(dim, 'model_response', `DeepSeek R1 responded (${(1.5 + Math.random() * 2.5).toFixed(1)}s)`);
        await sleep(200 + Math.random() * 500);
        if (cancelled) return;
        addEvent(dim, 'model_response', `Mistral Large responded (${(1.0 + Math.random() * 1.8).toFixed(1)}s)`);
        addEvent(dim, 'stage_complete', `Stage 1 complete: 4/4 analysts responded`);

        // Stage 2 simulation
        await sleep(500 + Math.random() * 800);
        if (cancelled) return;
        addEvent(dim, 'stage_complete', `Stage 2: Peer ranking with anonymized responses`);
        await sleep(600 + Math.random() * 1000);
        if (cancelled) return;
        addEvent(dim, 'stage_complete', `Stage 2 complete: Response B ranked highest (avg rank 1.5)`);

        // Stage 3 simulation
        await sleep(300);
        if (cancelled) return;
        addEvent(dim, 'stage_complete', `Stage 3: Chairman (Claude Sonnet) synthesizing final verdict`);
        await sleep(800 + Math.random() * 1200);
        if (cancelled) return;

        // Generate and add result
        const result = simulateDimensionResult(dim, nameParam, contextStr);
        setScores((prev) => [...prev, result]);
        addEvent(dim, 'agent_complete', `${meta.label} complete — Score: ${result.score}/100, Risk: ${result.riskLevel.toUpperCase()} (${(result.processingTimeMs / 1000).toFixed(1)}s)`);
      }

      // Calculate composite
      if (!cancelled) {
        setScores((prev) => {
          const total = prev.reduce((sum, s) => sum + s.score, 0);
          const avg = Math.round(total / prev.length);
          const riskPriority: Record<RiskLevel, number> = { green: 0, yellow: 1, red: 2 };
          const worst = prev.reduce<RiskLevel>((w, s) => riskPriority[s.riskLevel] > riskPriority[w] ? s.riskLevel : w, 'green');
          setCompositeScore(avg);
          setOverallRisk(worst);
          return prev;
        });
        addEvent('system', 'complete', `All 6 dimensions evaluated. Council deliberation complete.`);
        setRunning(false);
      }
    }

    runSimulation();
    return () => { cancelled = true; };
  }, [nameParam, contextStr, addEvent]);

  const completedCount = scores.length;
  const progressPercent = (completedCount / 6) * 100;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">&ldquo;{nameParam}&rdquo;</h1>
            {running && <Sparkles className="h-5 w-5 animate-pulse text-primary" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Session: {typeof params.sessionId === 'string' ? params.sessionId.slice(0, 8) : ''}...</p>
          {contextStr && <p className="mt-1 text-sm text-muted-foreground max-w-md truncate">{contextStr}</p>}
        </div>
        {compositeScore !== null && overallRisk && (
          <div className="text-right">
            <div className="text-4xl font-bold">{compositeScore}</div>
            <Badge variant={RISK_UI[overallRisk].variant}>{RISK_UI[overallRisk].label}</Badge>
          </div>
        )}
      </div>

      {/* Progress */}
      <Card className="mb-8 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {running ? 'LLM Council deliberating...' : 'Council deliberation complete'}
          </span>
          <span className="text-sm text-muted-foreground">{completedCount}/6 dimensions</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </Card>

      {/* Dimension Tabs */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="feed">Research Feed</TabsTrigger>
          {(Object.entries(DIMENSION_META) as [Dimension, typeof DIMENSION_META[Dimension]][]).map(([key, meta]) => {
            const hasScore = scores.some((s) => s.dimension === key);
            return (
              <TabsTrigger key={key} value={key} className="gap-1.5">
                <meta.icon className={`h-3.5 w-3.5 ${hasScore ? meta.color : 'text-muted-foreground'}`} />
                <span className="hidden sm:inline">{meta.label}</span>
                {hasScore && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Research Feed Tab */}
        <TabsContent value="feed">
          <Card className="p-4">
            <h3 className="mb-4 font-semibold flex items-center gap-2">
              Live Research Feed
              {running && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
            </h3>
            <div className="space-y-1 max-h-[600px] overflow-y-auto font-mono text-xs leading-relaxed">
              {events.map((event) => {
                const meta = DIMENSION_META[event.dimension as Dimension];
                return (
                  <div key={event.id} className="flex gap-2 py-0.5">
                    <span className="shrink-0 text-muted-foreground w-20">
                      {new Date(event.ts).toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                      {meta?.label ?? event.dimension}
                    </Badge>
                    <span className={
                      event.type === 'agent_complete' ? 'text-green-600 font-medium' :
                      event.type === 'error' ? 'text-destructive' : ''
                    }>
                      {event.message}
                    </span>
                  </div>
                );
              })}
              {events.length === 0 && (
                <p className="text-muted-foreground">Initializing council...</p>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Dimension Detail Tabs */}
        {(Object.entries(DIMENSION_META) as [Dimension, typeof DIMENSION_META[Dimension]][]).map(([key, meta]) => {
          const score = scores.find((s) => s.dimension === key);
          return (
            <TabsContent key={key} value={key}>
              <Card className="p-6">
                {!score ? (
                  <div className="flex items-center gap-3 text-muted-foreground py-12 justify-center">
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
                        <Badge variant={RISK_UI[score.riskLevel].variant}>
                          {RISK_UI[score.riskLevel].label}
                        </Badge>
                      </div>
                    </div>

                    {/* Chairman Synthesis */}
                    <div>
                      <h3 className="mb-2 font-medium text-sm">Chairman Verdict <span className="text-muted-foreground font-normal">(Claude Sonnet)</span></h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{score.summary}</p>
                    </div>

                    {/* Recommendations */}
                    {score.recommendations.length > 0 && (
                      <div>
                        <h3 className="mb-2 font-medium text-sm">Recommendations</h3>
                        <ul className="space-y-1.5">
                          {score.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="shrink-0 text-primary">-</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Council Individual Responses */}
                    <div>
                      <h3 className="mb-3 font-medium text-sm">Individual Council Opinions</h3>
                      <div className="space-y-3">
                        {score.analysts.map((response, i) => (
                          <Card key={i} className="p-3 bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{response.modelLabel}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono">{response.score}/100</span>
                                <Badge variant={RISK_UI[response.riskLevel].variant} className="text-[10px] px-1.5">
                                  {response.riskLevel.toUpperCase()}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {(response.processingTimeMs / 1000).toFixed(1)}s
                                </span>
                              </div>
                            </div>
                            <details>
                              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Show full analysis
                              </summary>
                              <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border-t pt-2">
                                {response.analysis}
                              </p>
                            </details>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Processing Info */}
                    <div className="text-[11px] text-muted-foreground flex items-center gap-4 pt-2 border-t">
                      <span>Council: {score.analysts.length} analysts + chairman</span>
                      <span>Chairman: {score.chairmanModel}</span>
                      <span>Time: {(score.processingTimeMs / 1000).toFixed(1)}s</span>
                      <span>Confidence: {(score.confidence * 100).toFixed(0)}%</span>
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
