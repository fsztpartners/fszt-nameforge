'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Globe, MessageSquare, Brain, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

const dimensions = [
  { icon: Shield, title: 'Legal & IP', desc: 'USPTO trademark search, class strategy, international conflicts' },
  { icon: Globe, title: 'Domain & Digital', desc: '.com + 12 TLD availability, SEO competition, aftermarket pricing' },
  { icon: MessageSquare, title: 'Social Handles', desc: '8 platforms, 4 variations each — Instagram to GitHub' },
  { icon: Brain, title: 'Linguistic', desc: 'Pronunciation, memorability, cultural sensitivity in 25+ languages' },
  { icon: TrendingUp, title: 'Strategic', desc: 'IPO-readiness, scalability, brand architecture fit' },
  { icon: DollarSign, title: 'Financial', desc: 'Filing costs, domain acquisition, protection budget estimates' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Name your startup
          <br />
          <span className="text-primary">with conviction.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          NameForge evaluates company names across 6 dimensions using a council of AI models
          that deliberate, critique each other anonymously, and synthesize a final verdict.
          See every step of their reasoning in real-time.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/evaluate">
            <Button size="lg" className="gap-2">
              Evaluate a Name <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/generate">
            <Button size="lg" variant="outline">
              Generate Names
            </Button>
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold">How the LLM Council works</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Stage 1</div>
            <h3 className="mt-2 font-semibold">Parallel Analysis</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              4 AI models (Claude, GPT, Gemini, DeepSeek) evaluate your name independently and simultaneously.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Stage 2</div>
            <h3 className="mt-2 font-semibold">Anonymous Peer Review</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Each model ranks the others&apos; work without knowing identities. Prevents authority bias.
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <div className="text-sm font-medium text-muted-foreground">Stage 3</div>
            <h3 className="mt-2 font-semibold">Chairman Synthesis</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A designated chairman model synthesizes all analyses and rankings into a final verdict.
            </p>
          </div>
        </div>
      </div>

      {/* 6 Dimensions */}
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold">6 dimensions, evaluated in parallel</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dimensions.map((d) => (
            <div key={d.title} className="flex gap-4 rounded-lg border p-4">
              <d.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">{d.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Built by <a href="https://github.com/fsztpartners" className="underline">FSZT Partners</a>
      </footer>
    </div>
  );
}
