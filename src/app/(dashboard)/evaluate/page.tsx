'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import type { BusinessContext, NamingLevel, CompanyStage } from '@/types/evaluation';

const TEMPLATES = [
  { label: 'AI SaaS', desc: 'AI-native software platform', verticals: ['technology', 'software'] },
  { label: 'Healthtech', desc: 'Healthcare technology company', verticals: ['healthcare', 'technology'] },
  { label: 'Fintech', desc: 'Financial technology company', verticals: ['finance', 'technology'] },
  { label: 'E-commerce', desc: 'Online retail platform', verticals: ['retail', 'e-commerce'] },
  { label: 'EdTech', desc: 'Education technology platform', verticals: ['education', 'technology'] },
  { label: 'Multi-Vertical', desc: 'Holding company spanning multiple industries', verticals: ['consulting', 'technology', 'healthcare', 'education'] },
];

const NAMING_LEVELS: { value: NamingLevel; label: string; desc: string }[] = [
  { value: 'company', label: 'Company', desc: 'C-Corp / operating company name' },
  { value: 'product', label: 'Product', desc: 'Product or service brand name' },
  { value: 'holding', label: 'Holding Co', desc: 'Parent / holding company name' },
];

const STAGES: { value: CompanyStage; label: string }[] = [
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B+' },
  { value: 'growth', label: 'Growth' },
  { value: 'pre-ipo', label: 'Pre-IPO' },
];

export default function EvaluateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [context, setContext] = useState<Partial<BusinessContext>>({
    businessDescription: '',
    verticals: [],
    namingLevel: 'company',
  });
  const [nameToEvaluate, setNameToEvaluate] = useState('');

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setContext((prev) => ({
      ...prev,
      businessDescription: template.desc,
      verticals: template.verticals,
    }));
  };

  const handleEvaluate = async () => {
    if (!nameToEvaluate.trim() || !context.businessDescription) return;
    setLoading(true);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameToEvaluate.trim(),
          context: {
            businessDescription: context.businessDescription,
            verticals: context.verticals ?? [],
            targetMarket: context.targetMarket,
            companyStage: context.companyStage,
            namingLevel: context.namingLevel ?? 'company',
            aestheticPreferences: context.aestheticPreferences,
          },
        }),
      });

      const data = await res.json();
      if (data.sessionId) {
        router.push(`/evaluate/${data.sessionId}?candidateId=${data.candidateId}`);
      }
    } catch (error) {
      console.error('Evaluation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Evaluate a Name</h1>
        <p className="mt-2 text-muted-foreground">
          3 steps. Under 30 seconds. The LLM Council does the rest.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      {/* Step 1: Business Context */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">What&apos;s your company about?</Label>
            <Textarea
              className="mt-2"
              placeholder="Universal AI-native platform spanning consulting, healthcare, education, and venture studios..."
              value={context.businessDescription}
              onChange={(e) => setContext((prev) => ({ ...prev, businessDescription: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Or pick a template:</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <Badge
                  key={t.label}
                  variant={context.businessDescription === t.desc ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleTemplateSelect(t)}
                >
                  {t.label}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => setStep(2)}
            disabled={!context.businessDescription}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Optional Details */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Naming level</Label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {NAMING_LEVELS.map((level) => (
                <Card
                  key={level.value}
                  className={`cursor-pointer p-3 transition-colors ${
                    context.namingLevel === level.value ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setContext((prev) => ({ ...prev, namingLevel: level.value }))}
                >
                  <div className="font-medium text-sm">{level.label}</div>
                  <div className="text-xs text-muted-foreground">{level.desc}</div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Company stage (optional)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <Badge
                  key={s.value}
                  variant={context.companyStage === s.value ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setContext((prev) => ({ ...prev, companyStage: s.value }))}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button className="flex-1 gap-2" onClick={() => setStep(3)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Skip this step
          </button>
        </div>
      )}

      {/* Step 3: Enter Name */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium">Enter the name to evaluate</Label>
            <Input
              className="mt-2 text-lg"
              placeholder="e.g., Omnara, Torqify, Aevum..."
              value={nameToEvaluate}
              onChange={(e) => setNameToEvaluate(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEvaluate()}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleEvaluate}
              disabled={!nameToEvaluate.trim() || loading}
            >
              {loading ? (
                'Starting evaluation...'
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Evaluate with LLM Council
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
