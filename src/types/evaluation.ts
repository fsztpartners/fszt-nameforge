export type NamingLevel = 'company' | 'product' | 'holding';
export type CompanyStage = 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth' | 'pre-ipo';
export type RiskLevel = 'green' | 'yellow' | 'red';
export type EvaluationStatus = 'created' | 'running' | 'completed' | 'failed';
export type Dimension = 'legal' | 'domain' | 'social' | 'linguistic' | 'strategic' | 'financial';
export type EvaluationMode = 'evaluate' | 'generate';

export interface BusinessContext {
  businessDescription: string;
  verticals: string[];
  targetMarket?: string;
  companyStage?: CompanyStage;
  namingLevel: NamingLevel;
  aestheticPreferences?: {
    tone?: 'bold' | 'minimal' | 'premium' | 'playful' | 'technical';
    length?: 'short' | 'medium' | 'any';
    style?: 'invented' | 'latin' | 'compound' | 'real-word' | 'any';
  };
}

export interface EvaluationSession {
  id: string;
  userId: string;
  organizationId?: string;
  context: BusinessContext;
  status: EvaluationStatus;
  mode: EvaluationMode;
  createdAt: string;
  completedAt?: string;
}

export interface NameCandidate {
  id: string;
  sessionId: string;
  name: string;
  source: 'user' | 'ai-council' | 'ai-generated';
  compositeScore?: number;
  legalScore?: number;
  domainScore?: number;
  socialScore?: number;
  linguisticScore?: number;
  strategicScore?: number;
  financialScore?: number;
  overallRisk?: RiskLevel;
  riskSummary?: string;
  evaluationStatus: EvaluationStatus;
  agentsCompleted: Dimension[];
  agentsTotal: number;
  isFavorited: boolean;
  notes?: string;
}

export interface CouncilStage1 {
  responses: {
    model: string;
    modelLabel: string;
    analysis: string;
    score: number;
    riskLevel: RiskLevel;
    processingTimeMs: number;
  }[];
}

export interface CouncilStage2 {
  rankings: {
    rankerModel: string;
    rankings: { responseLabel: string; rank: number; critique: string }[];
  }[];
  aggregatedScores: { responseLabel: string; averageRank: number }[];
}

export interface CouncilStage3 {
  chairmanModel: string;
  synthesis: string;
  finalScore: number;
  finalRisk: RiskLevel;
  confidence: number;
  recommendations: string[];
  processingTimeMs: number;
}

export interface DimensionScore {
  id: string;
  candidateId: string;
  dimension: Dimension;
  score: number;
  riskLevel: RiskLevel;
  confidence: number;
  results: Record<string, unknown>;
  summary: string;
  recommendations: string[];
  councilStage1: CouncilStage1;
  councilStage2: CouncilStage2;
  councilStage3: CouncilStage3;
  chairmanModel: string;
  analystsModels: string[];
  processingTimeMs: number;
  cached: boolean;
}

export interface ResearchEvent {
  id: string;
  candidateId: string;
  dimension: Dimension;
  eventType: 'agent_start' | 'check_start' | 'check_complete' | 'model_dispatched' |
    'model_response' | 'stage_complete' | 'agent_complete' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CompositeWeights {
  legal: number;
  domain: number;
  social: number;
  linguistic: number;
  strategic: number;
  financial: number;
}

export const WEIGHTS_BY_LEVEL: Record<NamingLevel, CompositeWeights> = {
  company: { legal: 0.25, domain: 0.20, social: 0.10, linguistic: 0.20, strategic: 0.20, financial: 0.05 },
  product: { legal: 0.20, domain: 0.25, social: 0.20, linguistic: 0.20, strategic: 0.10, financial: 0.05 },
  holding: { legal: 0.30, domain: 0.10, social: 0.05, linguistic: 0.15, strategic: 0.30, financial: 0.10 },
};
