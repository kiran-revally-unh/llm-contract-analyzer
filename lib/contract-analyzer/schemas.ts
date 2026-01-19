import { z } from 'zod';

export const EvidenceQuoteSchema = z.object({
  quote: z.string().min(5),
  location: z.string().min(2),
});

export const ClauseSchema = z.object({
  id: z.string().min(1),
  category: z.enum(['arbitration','liability','termination','ip','privacy','data_retention','payment','warranty','governing_law','assignment','non_compete','nda','other']).default('other'),
  risk: z.enum(['low','medium','high']),
  who_benefits: z.enum(['company','user','employee','neutral']).default('neutral'),
  why_risky: z.string().min(5),
  evidence_quotes: z.array(EvidenceQuoteSchema).min(1),
  pushback: z.string().min(5),
  suggested_revision: z.string().min(5),
  missing_info_questions: z.array(z.string()).default([]),
  severity_reasoning: z.string().min(5),
});

export const MissingClauseSchema = z.object({
  category: z.string().min(2),
  why_it_matters: z.string().min(5),
  recommended_language: z.string().min(5),
});

export const OverallSchema = z.object({
  risk_score: z.number().min(0).max(100),
  risk_level: z.enum(['low','medium','high']),
  confidence: z.number().min(0).max(1),
  contract_type: z.enum(['tos','nda','employment_offer','saas_agreement','lease','other']).default('tos'),
  jurisdiction: z.enum(['us_general','ca','ny','other']).default('us_general'),
  persona: z.enum(['founder','company','user','employee']).default('company'),
});

export const ContractAnalysisSchema = z.object({
  overall: OverallSchema,
  clauses: z.array(ClauseSchema).min(1),
  missing_or_weak_clauses: z.array(MissingClauseSchema).default([]),
  recommendations: z.array(z.string()).default([]),
});

export type EvidenceQuote = z.infer<typeof EvidenceQuoteSchema>;
export type Clause = z.infer<typeof ClauseSchema>;
export type MissingClause = z.infer<typeof MissingClauseSchema>;
export type Overall = z.infer<typeof OverallSchema>;
export type ContractAnalysis = z.infer<typeof ContractAnalysisSchema>;

export const AnalyzeRequestSchema = z.object({
  contractText: z.string().min(50),
  contractType: OverallSchema.shape.contract_type,
  jurisdiction: OverallSchema.shape.jurisdiction,
  persona: OverallSchema.shape.persona,
  modelId: z.string().default('gpt-4o-mini'),
});

export const AnalyzeResponseSchema = z.object({
  analysis: ContractAnalysisSchema,
  processingTime: z.number(),
  tokensUsed: z.object({ input: z.number(), output: z.number(), total: z.number() }),
  modelUsed: z.string(),
  estimatedCost: z.number(),
  retryCount: z.number().default(0),
});