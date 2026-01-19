import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { AnalyzeRequestSchema, AnalyzeResponseSchema, ContractAnalysisSchema, type ContractAnalysis } from '@/lib/contract-analyzer/schemas';
import { productIntelligencePrompt } from '@/lib/ai/prompts';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];
  return ((inputTokens / 1_000_000) * pricing.input) + ((outputTokens / 1_000_000) * pricing.output);
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function POST(request: Request) {
  const start = Date.now();
  try {
    const json = await request.json();
    console.log('[API] Received request:', JSON.stringify(json).slice(0, 200));
    const parsed = AnalyzeRequestSchema.safeParse(json);
    if (!parsed.success) {
      console.error('[API] Validation failed:', JSON.stringify(parsed.error.errors, null, 2));
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.errors }, { status: 400 });
    }
    console.log('[API] Validation passed, analyzing...');
    const { contractText, contractType, jurisdiction, persona, modelId } = parsed.data;

    const systemPrompt = `${productIntelligencePrompt}

TECHNICAL REQUIREMENTS FOR THIS ANALYSIS:
------------------------------------------
For EVERY clause you identify, you MUST provide evidence_quotes with:
- quote: The EXACT verbatim text from the contract (copy it word-for-word, minimum 15 words)
- location: The precise location like "Section 7", "Paragraph 3", "Article 2.3", "Clause 5"

Return structured JSON matching the provided schema. Every clause MUST include evidence_quotes showing the actual contract text and its location.`;

    const baseUserPrompt = `Perform a comprehensive legal analysis of this ${contractType} contract from the perspective of a ${persona} under ${jurisdiction} jurisdiction.

CONTRACT TEXT:
${contractText}

ANALYSIS REQUIREMENTS:
- Identify ALL risky, unfair, or unusual clauses
- For EACH clause, provide evidence_quotes with:
  * quote: Copy the EXACT text word-for-word from the contract above (minimum 15 words, maximum 200 words)
  * location: Specify exactly where it appears (e.g., "Section 7, Limitation of Liability" or "Paragraph 3" or "Article 5.2")
- Explain each risk in plain English
- Assess who benefits from each clause
- Provide specific negotiation language
- Suggest concrete revisions
- Identify missing protections
- Calculate overall risk score (0-100)
- Give actionable recommendations

CRITICAL: Do NOT invent or paraphrase quotes. Copy the actual text from the contract above. Users need to see the exact language you're analyzing.

Focus on real issues that matter to a ${persona}. Be specific and reference actual contract language.`;

    let retries = 0;
    let lastErr: Error | null = null;
    let result: any = null;

    while (retries <= MAX_RETRIES) {
      try {
        console.log(`[API] Attempt ${retries + 1}/${MAX_RETRIES + 1} - Calling OpenAI with model: ${modelId}`);
        const response = await generateObject({
          model: openai(modelId),
          schema: ContractAnalysisSchema,
          system: systemPrompt,
          prompt: baseUserPrompt + (retries > 0 ? "\n\nIMPORTANT: Extract verbatim quotes from the actual contract text. Every clause MUST include at least one exact evidence quote with proper location. Analyze thoroughly - don't skip major sections." : ''),
          temperature: 0.5,
        });
        result = response;
        console.log('[API] OpenAI call successful');
        break;
      } catch (err: any) {
        lastErr = err;
        console.error(`[API] OpenAI error on attempt ${retries + 1}:`, err.message);
        console.error('[API] Full error:', JSON.stringify(err, null, 2).slice(0, 1000));
        
        // If rate limit hit, stop retrying immediately
        if (err.message && err.message.includes('Rate limit')) {
          console.error('[API] Rate limit detected, stopping retries');
          break;
        }
        
        retries++;
        if (retries > MAX_RETRIES) break;
        await delay(RETRY_DELAY_MS * retries);
      }
    }

    if (!result) {
      console.error('[API] All retries failed');
      const errorMsg = lastErr?.message || 'Unknown error';
      const isRateLimit = errorMsg.includes('Rate limit');
      return NextResponse.json({ 
        error: isRateLimit ? 'OpenAI rate limit reached' : 'Analysis failed', 
        details: errorMsg,
        isRateLimit,
        retryCount: retries 
      }, { status: 500 });
    }

    const tokensUsed = {
      input: result.usage?.promptTokens || 0,
      output: result.usage?.completionTokens || 0,
      total: result.usage?.totalTokens || 0,
    };

    const analysis: ContractAnalysis = result.object;
    const processingTime = Date.now() - start;
    const estimatedCost = calculateCost(modelId, tokensUsed.input, tokensUsed.output);

    const response = {
      analysis,
      processingTime,
      tokensUsed,
      modelUsed: modelId,
      estimatedCost,
      retryCount: retries,
    };

    const valid = AnalyzeResponseSchema.safeParse(response);
    if (!valid.success) {
      return NextResponse.json({ error: 'Response validation failed', details: valid.error.errors }, { status: 500 });
    }

    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error', message: e.message }, { status: 500 });
  }
}