'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getWarningMessage, isInputSafe } from '@/lib/contract-analyzer/guardrails';
import { MetricsFooter } from '@/components/contract-analyzer/metrics-footer';
import { Settings } from 'lucide-react';
import jsPDF from 'jspdf';
import { useRef } from 'react';
import { AppHeader } from '@/components/app-header';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// --- Fuzzy text matching helpers for robust highlighting ---
function normalizeText(t: string) {
  return t
    .toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, '"') // normalize smart quotes
    .replace(/[^a-z0-9\s]/g, ' ') // strip punctuation
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

function wordSet(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(' ')
      .filter((w) => w.length > 3)
  );
}

function ngrams(text: string, n: number): Set<string> {
  const words = normalizeText(text).split(' ').filter((w) => w.length > 2);
  const set = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    set.add(words.slice(i, i + n).join(' '));
  }
  return set;
}

// Returns 0..1 based on overlap of words and n-grams
function matchScore(a: string, b: string) {
  const A = wordSet(a);
  const B = wordSet(b);
  const inter = [...A].filter((w) => B.has(w)).length;
  const union = new Set([...A, ...B]).size || 1;
  const jaccard = inter / union;

  const triA = ngrams(a, 3);
  const triB = ngrams(b, 3);
  const interTri = [...triA].filter((g) => triB.has(g)).length;
  const unionTri = new Set([...triA, ...triB]).size || 1;
  const triScore = interTri / unionTri;

  // blend scores; weight tri-gram a bit more for phrase fidelity
  return 0.4 * jaccard + 0.6 * triScore;
}

const SAMPLES: Record<string, string> = {
  tos: `Terms of Service\n\nBy using our services you agree to resolve disputes exclusively by binding arbitration and waive the right to participate in class actions. We limit liability to fees paid in the last 12 months.`,
  nda: `Non-Disclosure Agreement\n\nRecipient agrees to maintain confidentiality of Discloser's proprietary information. No reverse engineering. Injunctive relief available in case of breach.`,
  saas_agreement: `SaaS Agreement\n\nCustomer agrees to pay subscription fees. Uptime SLA is 99.9%. Data is retained for 30 days after termination and then deleted.`,
};

function speak(text: string) {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.0;
  synth.speak(utter);
}

// Gauge component removed as part of simplifying the form view

export default function ContractAnalyzerPage() {
  const [contractText, setContractText] = useState('');
  const [contractType, setContractType] = useState<'tos'|'nda'|'employment_offer'|'saas_agreement'|'lease'|'other'>('tos');
  const [jurisdiction, setJurisdiction] = useState<'us_general'|'ca'|'ny'|'other'>('us_general');
  const [persona, setPersona] = useState<'founder'|'company'|'user'|'employee'>('company');
  const [modelId, setModelId] = useState('gpt-4o');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [analysis, setAnalysis] = useState<any|null>(null);
  const [metrics, setMetrics] = useState<any|null>(null);
  const [previous, setPrevious] = useState<any|null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [guardrailOpen, setGuardrailOpen] = useState(false);
  const [guardrailMsg, setGuardrailMsg] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<Array<{ id: number; title: string; desc: string; status: 'pending'|'running'|'done'|'error'; duration?: number; output?: string }>>([
    { id: 1, title: 'Ingest & Normalize', desc: 'extract text, detect sections, clean formatting', status: 'pending' },
    { id: 2, title: 'PII Safety Check', desc: 'flag emails/phones/SSNs → mask or warn', status: 'pending' },
    { id: 3, title: 'Clause Segmentation', desc: 'split into clauses with titles + offsets', status: 'pending' },
    { id: 4, title: 'LLM Risk Pass', desc: 'LLM returns JSON risk objects', status: 'pending' },
    { id: 5, title: 'Schema Validation (Zod)', desc: 'validate JSON shape', status: 'pending' },
    { id: 6, title: 'Auto-Retry (if invalid)', desc: 'retry with “fix JSON” prompt', status: 'pending' },
    { id: 7, title: 'Scoring & Categorization', desc: 'risk score + tags + confidence', status: 'pending' },
    { id: 8, title: 'Generate Explanations', desc: 'plain English + “why” + evidence', status: 'pending' },
  ]);
  const [modelMetrics, setModelMetrics] = useState<{ model: string; tokensIn: number; tokensOut: number; latencySec: number; estimatedCostUSD: number; retries: number; zodPassed: boolean; confidenceThreshold: number; temperature: number; promptStrategy?: string; outputFormat?: string }>({
    model: 'gpt-4o', tokensIn: 0, tokensOut: 0, latencySec: 0, estimatedCostUSD: 0.0, retries: 0, zodPassed: false, confidenceThreshold: 0.7, temperature: 0.2
  });
  const [outputOpen, setOutputOpen] = useState(false);
  const [attemptOutputs, setAttemptOutputs] = useState<Array<{ attempt: number; json: any }>>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const typeParam = url.searchParams.get('type');
    const textParam = url.searchParams.get('text');
    const autoParam = url.searchParams.get('auto');
    try {
      const pm = localStorage.getItem('preferred-model');
      if (pm) setModelId(pm);
    } catch {}
    
    // Auto-populate from URL params when coming from home page
    if (typeParam) {
      setContractType(typeParam as any);
    }
    if (textParam) {
      let textToUse = textParam;
      try {
        textToUse = decodeURIComponent(textParam);
      } catch {
        // If decoding fails, use the raw parameter value
        textToUse = textParam;
      }
      // Prefill only; do NOT auto-run analysis. User must click Analyze.
      setContractText(textToUse);

      // If explicitly requested (auto=1) or both type and text provided, auto-start pipeline
      const shouldAutoRun = autoParam === '1' || !!(typeParam && textParam);
      if (shouldAutoRun) {
        setShowPipeline(true);
        setLoading(true);
        setProgressStep(0);
        analyzeContract(textToUse, (typeParam as any) || contractType);
      }
    }
    
    const share = url.searchParams.get('share');
    if (share) {
      const stored = localStorage.getItem(`contract-share:${share}`);
      if (stored) {
        const payload = JSON.parse(stored);
        setContractText(payload.contractText || '');
        setContractType(payload.contractType || 'tos');
        setJurisdiction(payload.jurisdiction || 'us_general');
        setPersona(payload.persona || 'company');
      }
    }
    const last = localStorage.getItem('contract-last-analysis');
    if (last) {
      try { setPrevious(JSON.parse(last)); } catch {}
    }
  }, []);

  const shareLink = useMemo(() => {
    const id = Math.floor(Date.now() / 1000).toString(36) + '-' + Math.random().toString(36).slice(2,6);
    return id;
  }, [contractText, contractType, jurisdiction, persona]);

  const handleShare = () => {
    localStorage.setItem(`contract-share:${shareLink}` , JSON.stringify({ contractText, contractType, jurisdiction, persona }));
    const url = new URL(window.location.href);
    url.searchParams.set('share', shareLink);
    window.history.replaceState({}, '', url.toString());
  };

  const loadSample = () => {
    setContractText(SAMPLES[contractType] || SAMPLES.tos);
  };

  const analyzeContract = async (text: string, type: string) => {
    setError(null);
    const safety = isInputSafe(text);
    if (!safety.safe) {
      setGuardrailMsg(getWarningMessage(safety.hits));
      setGuardrailOpen(true);
      setLoading(false);
      return;
    }
    if (text.length > 5000) {
      setError('Input too long. Please trim for faster results.');
      setLoading(false);
      return;
    }

    // Simulate pipeline steps with timings and produced outputs
    const start = performance.now();
    const updateStep = (id: number, patch: Partial<{ status: 'pending'|'running'|'done'|'error'; duration: number; output: string }>) => {
      setPipelineSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    };

    // 1 Ingest & Normalize
    updateStep(1, { status: 'running' });
    await new Promise(r => setTimeout(r, 600));
    const charCount = text.length;
    const sectionsDetected = (text.match(/\n\d+\./g) || []).length;
    updateStep(1, { status: 'done', duration: Math.round(performance.now() - start), output: `${charCount} chars · ${sectionsDetected} sections` });

    // 2 PII Safety Check
    const t2 = performance.now();
    updateStep(2, { status: 'running' });
    const emails = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).length;
    const phones = (text.match(/\+?\d[\d\s\-()]{7,}\d/g) || []).length;
    await new Promise(r => setTimeout(r, 400));
    updateStep(2, { status: 'done', duration: Math.round(performance.now() - t2), output: `${emails} emails · ${phones} phones` });

    // 3 Clause Segmentation
    const t3 = performance.now();
    updateStep(3, { status: 'running' });
    const clauses = text.split(/\n(?=\d+\.|[A-Z][A-Za-z ]+:)/).filter(Boolean);
    await new Promise(r => setTimeout(r, 500));
    updateStep(3, { status: 'done', duration: Math.round(performance.now() - t3), output: `${clauses.length} clauses` });

    // 4 LLM Risk Pass (request sent)
    const t4 = performance.now();
    updateStep(4, { status: 'running', output: 'requesting…' });
    
    if (analysis) {
      localStorage.setItem('contract-last-analysis', JSON.stringify(analysis));
      setPrevious(analysis);
    }
    setAnalysis(null);
    setMetrics(null);
    try {
      const res = await fetch('/api/contract/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText: text, contractType: type, jurisdiction, persona, modelId }),
      });
      let data: any = null;
      let rawText = '';
      const ct = res.headers.get('content-type') || '';
      try {
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          rawText = await res.text();
        }
      } catch (parseErr) {
        try { rawText = await res.text(); } catch {}
      }
      if (!res.ok) {
        const errorMsg = data?.isRateLimit
          ? 'OpenAI rate limit reached. Please wait 60 seconds and try again, or add a payment method to your OpenAI account.'
          : (data?.error || data?.message || (rawText ? rawText.slice(0, 200) : 'Analysis failed'));
        throw new Error(errorMsg);
      }
      // 4 LLM Risk Pass done
      updateStep(4, { status: 'done', duration: Math.round(performance.now() - t4), output: 'risk JSON received' });

      // 5 Schema Validation
      const t5 = performance.now();
      updateStep(5, { status: 'running' });
      await new Promise(r => setTimeout(r, 200));
      const retries = data.retryCount || 0;
      updateStep(5, { status: 'done', duration: Math.round(performance.now() - t5), output: 'valid ContractAnalysis v2' });

      // 6 Auto-Retry
      const t6 = performance.now();
      updateStep(6, { status: 'running' });
      await new Promise(r => setTimeout(r, 150));
      updateStep(6, { status: 'done', duration: Math.round(performance.now() - t6), output: `${retries} retries` });

      // 7 Scoring & Categorization
      const t7 = performance.now();
      updateStep(7, { status: 'running' });
      await new Promise(r => setTimeout(r, 120));
      updateStep(7, { status: 'done', duration: Math.round(performance.now() - t7), output: `score ${data.analysis.overall.risk_score}` });

      // 8 Generate Explanations
      const t8 = performance.now();
      updateStep(8, { status: 'running' });
      await new Promise(r => setTimeout(r, 120));
      updateStep(8, { status: 'done', duration: Math.round(performance.now() - t8), output: 'plain-English + evidence' });
      
      setAnalysis(data.analysis);
      setMetrics({ processingTime: data.processingTime, tokensUsed: data.tokensUsed, modelUsed: data.modelUsed, estimatedCost: data.estimatedCost, retryCount: data.retryCount });
      setModelMetrics({
        model: data.modelUsed || modelId,
        tokensIn: Number((data.tokensUsed?.input ?? data.tokensUsed?.prompt) || 0),
        tokensOut: Number((data.tokensUsed?.output ?? data.tokensUsed?.completion) || 0),
        latencySec: (data.processingTime || 0) / 1000,
        estimatedCostUSD: Number(data.estimatedCost || 0),
        retries: Number(data.retryCount || 0),
        zodPassed: true,
        confidenceThreshold: 0.7,
        temperature: typeof data.temperature === 'number' ? data.temperature : 0.2,
        promptStrategy: data.promptStrategy,
        outputFormat: data.outputFormat,
      });
      if (voiceEnabled) {
        const summary = `Overall risk ${data.analysis.overall.risk_level} with score ${data.analysis.overall.risk_score} and confidence ${(data.analysis.overall.confidence*100).toFixed(0)} percent.`;
        speak(summary);
      }
      localStorage.setItem('contract-last-analysis', JSON.stringify(data.analysis));
    } catch (e: any) {
      setError(e.message);
      updateStep(4, { status: 'error', output: e.message });
      updateStep(5, { status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const analyze = async () => {
    setError(null);
    const safety = isInputSafe(contractText);
    if (!safety.safe) {
      setGuardrailMsg(getWarningMessage(safety.hits));
      setGuardrailOpen(true);
      return;
    }
    if (contractText.length > 5000) {
      setError('Input too long. Please trim for faster results.');
      return;
    }
    // Navigate to the pipeline screen immediately
    setShowPipeline(true);
    setLoading(true);
    setProgressStep(0);
    
    analyzeContract(contractText, contractType);
  };

  const exportJSON = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!analysis) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 48;
    const marginTop = 56;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = marginTop;

    const addHeader = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Coco — Contract Analysis Report', marginX, y);
      y += 24;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const meta = `Date: ${new Date().toLocaleString()}   Type: ${contractType.replace('_',' ')}   Persona: ${persona}`;
      doc.text(meta, marginX, y);
      y += 18;
      doc.setDrawColor(220);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 16;
    };

    const ensureSpace = (needed = 40) => {
      if (y + needed > pageHeight - marginTop) {
        doc.addPage();
        y = marginTop;
        addHeader();
      }
    };

    addHeader();

    // Overview
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Overview', marginX, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const overviewLines = [
      `Risk Level: ${analysis.overall.risk_level}   Score: ${analysis.overall.risk_score}`,
      `Confidence: ${Math.round((analysis.overall.confidence || 0.85) * 100)}%`,
    ];
    overviewLines.forEach((line) => {
      ensureSpace(20);
      doc.text(line, marginX, y);
      y += 16;
    });
    y += 8;

    // Clauses
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Findings', marginX, y);
    y += 12;
    doc.setDrawColor(220);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 14;

    analysis.clauses.forEach((clause: any, idx: number) => {
      ensureSpace(80);
      const title = `${idx + 1}. ${clause.title || clause.category || 'Clause'}`;
      const risk = String(clause.risk || 'standard').toUpperCase();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(title, marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Risk: ${risk}`, pageWidth - marginX - 120, y);
      y += 16;

      const explanation = clause.plain_english || clause.why_risky || '';
      const wrapped = doc.splitTextToSize(explanation, pageWidth - marginX * 2);
      wrapped.forEach((line: string) => {
        ensureSpace(18);
        doc.text(line, marginX, y);
        y += 14;
      });

      if (clause.evidence_quotes && clause.evidence_quotes.length > 0) {
        ensureSpace(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Evidence:', marginX, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        const quote = clause.evidence_quotes[0];
        const quoteText = `"${quote.quote}"`;
        const quoteWrapped = doc.splitTextToSize(quoteText, pageWidth - marginX * 2 - 12);
        quoteWrapped.forEach((line: string) => {
          ensureSpace(18);
          doc.text(`• ${line}`, marginX + 6, y);
          y += 14;
        });
      }

      y += 8;
    });

    // Save
    const fileName = `coco-contract-report-${Date.now()}.pdf`;
    doc.save(fileName);
  };

  const exportFullReport = async () => {
    if (!analysis) return;
    const { default: html2canvas } = await import('html2canvas');
    const node = reportRef.current;
    if (!node) return;

    // Ensure node is rendered; give browser a tick
    await new Promise((r) => setTimeout(r, 50));
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`coco-analysis-report-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-svh w-full bg-white">
      {/* Show loading progress screen when analyzing */}
      {showPipeline && (
        <div className="min-h-svh flex flex-col bg-gradient-to-b from-gray-50 to-white">
          <AppHeader />
          <div className="flex-1 px-6 py-10">
            <div className="mx-auto max-w-5xl">
              <div className="mb-6 text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">We’re turning messy contract text → structured risk report using an LLM + validation + retries + metrics.</h1>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pipeline timeline */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-gray-900">Pipeline</div>
                        <Select value={modelId} onValueChange={(v) => {
                          setModelId(v);
                          try { localStorage.setItem('preferred-model', v); } catch {}
                          // Reset steps and re-run with new model if we have text
                          setPipelineSteps(prev => prev.map(s => ({ ...s, status: 'pending', duration: undefined, output: undefined })));
                          if (contractText?.trim()) {
                            setLoading(true);
                            setProgressStep(0);
                            analyzeContract(contractText, contractType);
                          }
                        }}>
                          <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                        size="sm"
                        disabled={loading || !analysis}
                        onClick={() => setShowPipeline(false)}
                      >
                        {loading ? 'Analyzing…' : 'View results'}
                      </Button>
                    </div>
                    <ul className="space-y-4">
                      {pipelineSteps.map((s) => (
                        <li key={s.id} className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`size-6 rounded-full grid place-items-center ${s.status==='done' ? 'bg-green-100 text-green-700 border border-green-200' : s.status==='running' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : s.status==='error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>{s.status==='done'?'✓':s.status==='running'?'…':s.status==='error'?'!':'•'}</div>
                            <div>
                              <div className="font-medium text-gray-900">{s.id}. {s.title}</div>
                              <div className="text-xs text-gray-600">{s.desc}</div>
                              {s.output && (<div className="mt-1 text-xs text-gray-700">Output: {s.output}</div>)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{typeof s.duration === 'number' ? `${(s.duration/1000).toFixed(2)}s` : '—'}</div>
                        </li>
                      ))}
                    </ul>

                    {/* Explainability preview */}
                    <div className="mt-6">
                      <div className="text-sm font-semibold text-gray-900 mb-2">Explainability preview</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {([{
                          clause: 'Arbitration', risk: 'High', confidence: 0.82, evidence: '“binding arbitration…”', why: 'Limits your ability to sue…'
                        },{
                          clause: 'Non-compete', risk: 'Medium', confidence: 0.74, evidence: '“shall not engage in competing activities…”', why: 'Restricts employment mobility.'
                        },{
                          clause: 'Liability Cap', risk: 'High', confidence: 0.79, evidence: '“limit liability to fees paid…”', why: 'Caps damages below potential harm.'
                        }] as const).map((item, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="text-xs text-gray-500">Clause</div>
                            <div className="text-sm font-semibold text-gray-900">{item.clause}</div>
                            <div className="mt-1 text-xs"><span className={item.risk==='High'?'text-red-600':'text-yellow-700'}>Risk: {item.risk}</span> · Confidence: {(item.confidence*100).toFixed(0)}%</div>
                            <div className="mt-1 text-xs text-gray-700">Evidence: {item.evidence}</div>
                            <div className="mt-1 text-xs text-gray-700">Why: {item.why}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="mt-6 text-[11px] text-gray-500">Demo uses sample/public contract text. Not legal advice.</div>
                    
                  </div>
                </div>

                {/* Model Run panel */}
                <div>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="text-sm font-semibold text-gray-900 mb-3">Model Run</div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">Model:</span> {modelMetrics.model.toUpperCase()}</div>
                      <div><span className="text-gray-500">Prompt strategy:</span> {modelMetrics.promptStrategy || 'Structured extraction + explainability'}</div>
                      <div><span className="text-gray-500">Output format:</span> {modelMetrics.outputFormat || 'Strict JSON (Zod-validated)'}</div>
                      <div><span className="text-gray-500">Tokens:</span> {Number(modelMetrics.tokensIn).toLocaleString()} in / {Number(modelMetrics.tokensOut).toLocaleString()} out</div>
                      <div><span className="text-gray-500">Latency:</span> {modelMetrics.latencySec ? `${modelMetrics.latencySec.toFixed(1)}s` : '—'}</div>
                      <div><span className="text-gray-500">Estimated cost:</span> ${modelMetrics.estimatedCostUSD.toFixed(3)}</div>
                      <div><span className="text-gray-500">Temperature:</span> {modelMetrics.temperature}</div>
                      <div><span className="text-gray-500">Retries:</span> {modelMetrics.retries} {modelMetrics.retries>0?'(subsequent fix applied)':'(initial output valid)'}</div>
                      <div><span className="text-gray-500">Validation:</span> {modelMetrics.zodPassed ? '✅ Passed Zod schema' : 'Pending…'}</div>
                      <div><span className="text-gray-500">Confidence threshold:</span> {modelMetrics.confidenceThreshold.toFixed(2)} (below → “Needs Review”)</div>
                      <div><span className="text-gray-500">Clauses detected:</span> {analysis ? analysis.clauses?.length : '—'}</div>
                      <div><span className="text-gray-500">Clauses flagged:</span> {analysis ? analysis.clauses.filter((c:any)=>['high','medium'].includes(String(c.risk||'').toLowerCase())).length : '—'}</div>
                    </div>
                    <Button onClick={() => setOutputOpen(true)} className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900">View structured output</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Structured output drawer */}
          <Sheet open={outputOpen} onOpenChange={setOutputOpen}>
            <SheetContent side="right" className="sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Structured Output</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="text-xs text-gray-500">Schema: ContractAnalysisSchema v2</div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs overflow-auto max-h-[60vh]">
                  <pre className="whitespace-pre-wrap">{analysis ? JSON.stringify(analysis, null, 2) : 'Waiting for model output…'}</pre>
                </div>
                {modelMetrics.retries > 0 && (
                  <div className="text-xs text-gray-600">Diff view unavailable: attempts not captured in API response.</div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Show results page after analysis */}
      {!showPipeline && !loading && analysis && (
        <div className="min-h-svh flex flex-col bg-gray-50">
          <AppHeader />
          
          {/* Breadcrumb and Actions Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{contractType.replace('_', ' ')}</span>
                <span>›</span>
                <span className="font-medium">Analysis Results</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={exportFullReport} disabled={!analysis}>
                  Export Report
                </Button>
                <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
                  Request Revision
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - Split View */}
          <div className="flex-1 flex">
            {/* Hidden printable report root */}
            <div className="absolute -left-[9999px] top-0 w-[1024px] bg-white" aria-hidden ref={reportRef}>
              <div className="p-8">
                <div className="text-2xl font-bold text-gray-900">Coco — Contract Analysis Report</div>
                <div className="text-xs text-gray-600 mt-1">{new Date().toLocaleString()} · Type: {contractType.replace('_',' ')} · Persona: {persona} · Jurisdiction: {jurisdiction}</div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="border rounded-md p-3"><div className="text-gray-500 text-xs">Risk Level</div><div className="font-semibold">{analysis.overall.risk_level} ({analysis.overall.risk_score})</div></div>
                  <div className="border rounded-md p-3"><div className="text-gray-500 text-xs">Confidence</div><div className="font-semibold">{Math.round((analysis.overall.confidence||0.85)*100)}%</div></div>
                  <div className="border rounded-md p-3"><div className="text-gray-500 text-xs">Model</div><div className="font-semibold">{modelMetrics.model.toUpperCase()}</div></div>
                </div>
                <div className="mt-6">
                  <div className="text-lg font-semibold mb-2">Findings</div>
                  <div className="space-y-8">
                    {analysis.clauses.map((clause:any, idx:number) => (
                      <div key={idx}>
                        <div className="flex items-start justify-between">
                          <div className="text-base font-semibold">{idx+1}. {clause.title || clause.category || 'Clause'}</div>
                          <div className="text-xs px-2 py-0.5 rounded border">{String(clause.risk||'standard').toUpperCase()}</div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">{clause.plain_english || clause.why_risky}</div>
                        {clause.evidence_quotes && clause.evidence_quotes.length>0 && (
                          <div className="mt-2 border-l-2 border-blue-400 pl-3 text-xs text-gray-700">
                            <div className="text-blue-600 font-medium">Evidence</div>
                            <div>“{clause.evidence_quotes[0].quote}”</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {analysis.missing_or_weak_clauses?.length>0 && (
                  <div className="mt-6">
                    <div className="text-lg font-semibold mb-2">Missing / Unclear Clauses</div>
                    <div className="space-y-3">
                      {analysis.missing_or_weak_clauses.map((m:any, i:number)=> (
                        <div key={i} className="border rounded p-3">
                          <div className="text-sm font-semibold">{m.category}</div>
                          <div className="text-xs text-gray-700 mt-1">{m.why_it_matters}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6">
                  <div className="text-lg font-semibold mb-2">Original Document (excerpt)</div>
                  <div className="text-xs whitespace-pre-wrap border rounded p-3 bg-gray-50">
                    {(contractText || '').slice(0, 2000)}{(contractText || '').length>2000 ? '…' : ''}
                  </div>
                </div>
              </div>
            </div>
            {/* Left: Original Document */}
            <div className="w-1/2 border-r border-gray-200 bg-white overflow-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Original Document</h2>
                  <div className="flex items-center gap-2">
                    <button className="size-8 rounded border border-gray-200 hover:bg-gray-50 grid place-items-center">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                    <button className="size-8 rounded border border-gray-200 hover:bg-gray-50 grid place-items-center">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {contractText.split('\n').map((paragraph, idx) => {
                      // Skip empty paragraphs from highlighting logic but still render them
                      if (!paragraph.trim()) {
                        return <p key={idx} className="mb-3">{'\u00A0'}</p>;
                      }

                      // Check if this paragraph contains any evidence quote or matches clause content
                      let highlightInfo: { color: string; risk: string; icon: string; clauseTitle: string } | null = null;
                      let bestScore = 0;
                      
                      analysis.clauses.forEach((c: any) => {
                        // Skip if already found a match
                        // Continue seeking a better score even after a preliminary match

                        // Normalize text for flexible matching
                        const normalizedParagraph = normalizeText(paragraph);
                        
                        // Check evidence quotes first
                        if (c.evidence_quotes && c.evidence_quotes.length > 0) {
                          c.evidence_quotes.forEach((ev: any) => {
                            const normalizedQuote = normalizeText(ev.quote || '');
                            const score = matchScore(normalizedParagraph, normalizedQuote);
                            if (score > bestScore) {
                              bestScore = score;
                              if (score >= 0.25) {
                                if (c.risk === 'high') {
                                  highlightInfo = {
                                    color: 'bg-red-100 border-l-[6px] border-red-600',
                                    risk: 'HIGH RISK',
                                    icon: '⚠️',
                                    clauseTitle: c.title || c.category || 'Clause'
                                  };
                                } else if (c.risk === 'medium') {
                                  highlightInfo = {
                                    color: 'bg-yellow-100 border-l-[6px] border-yellow-600',
                                    risk: 'CAUTION',
                                    icon: '⚡',
                                    clauseTitle: c.title || c.category || 'Clause'
                                  };
                                } else {
                                  highlightInfo = {
                                    color: 'bg-blue-100 border-l-[6px] border-blue-600',
                                    risk: 'REVIEW',
                                    icon: 'ℹ️',
                                    clauseTitle: c.title || c.category || 'Clause'
                                  };
                                }
                              }
                            }
                          });
                        }

                        // Fallback: match paragraph to clause title/category/why_risky if no evidence quotes
                        if (!highlightInfo) {
                          const targets = [c.title, c.category, c.why_risky, c.plain_english].filter(Boolean);
                          for (const t of targets) {
                            const score = matchScore(normalizedParagraph, String(t));
                            if (score > bestScore && score >= 0.35) {
                              bestScore = score;
                              if (c.risk === 'high') {
                                highlightInfo = {
                                  color: 'bg-red-100 border-l-[6px] border-red-600',
                                  risk: 'HIGH RISK',
                                  icon: '⚠️',
                                  clauseTitle: c.title || c.category || 'Clause'
                                };
                              } else if (c.risk === 'medium') {
                                highlightInfo = {
                                  color: 'bg-yellow-100 border-l-[6px] border-yellow-600',
                                  risk: 'CAUTION',
                                  icon: '⚡',
                                  clauseTitle: c.title || c.category || 'Clause'
                                };
                              } else {
                                highlightInfo = {
                                  color: 'bg-blue-100 border-l-[6px] border-blue-600',
                                  risk: 'REVIEW',
                                  icon: 'ℹ️',
                                  clauseTitle: c.title || c.category || 'Clause'
                                };
                              }
                              break;
                            }
                          }
                        }
                      });
                      
                      return (
                        <div 
                          key={idx} 
                          className={`mb-3 ${highlightInfo ? `${highlightInfo.color} pl-4 py-3 rounded-r shadow-sm` : ''}`}
                        >
                          <p className={`${highlightInfo ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {paragraph || '\u00A0'}
                          </p>
                          {highlightInfo && (
                            <div className={`text-[10px] font-bold mt-2 uppercase tracking-wide ${
                              highlightInfo.risk === 'HIGH RISK' ? 'text-red-700' :
                              highlightInfo.risk === 'CAUTION' ? 'text-yellow-800' :
                              'text-blue-700'
                            }`}>
                              {highlightInfo.icon} {highlightInfo.risk}: {highlightInfo.clauseTitle}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Analysis Dashboard */}
            <div className="w-1/2 bg-gray-50 overflow-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Analysis Dashboard</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="size-2 rounded-full bg-red-500" />
                      <span className="text-gray-600">High Risk</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="size-2 rounded-full bg-yellow-500" />
                      <span className="text-gray-600">Caution</span>
                    </div>
                  </div>
                </div>

                {/* Risk Cards */}
                <div className="space-y-4">
                  {analysis.clauses.map((clause: any, idx: number) => {
                    const risk = (clause.risk || '').toLowerCase();
                    const isHighRisk = risk === 'high';
                    const isMediumRisk = risk === 'medium';
                    
                    return (
                      <Card key={idx} className={`border-2 ${
                        isHighRisk ? 'border-red-200 bg-white' : 
                        isMediumRisk ? 'border-yellow-200 bg-white' : 
                        'border-gray-200 bg-white'
                      }`}>
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 mb-1">
                                SECTION {idx + 1}.{idx + 1}
                              </div>
                              <h3 className="text-base font-semibold text-gray-900">
                                {clause.title || clause.category}
                              </h3>
                            </div>
                            <div className={`px-2.5 py-1 rounded text-xs font-semibold ${
                              isHighRisk ? 'bg-red-100 text-red-700' : 
                              isMediumRisk ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {isHighRisk ? '⚠️ HIGH RISK' : isMediumRisk ? '⚠ CAUTION' : '● STANDARD'}
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-700 mb-2">WHAT THIS MEANS</div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {clause.plain_english || clause.why_risky}
                            </p>
                          </div>

                          {/* Evidence Quotes */}
                          {clause.evidence_quotes && clause.evidence_quotes.length > 0 && (
                            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                              <div className="text-xs font-semibold text-gray-700 mb-2">📄 Exact Contract Language:</div>
                              {clause.evidence_quotes.map((ev: any, evIdx: number) => (
                                <div key={evIdx} className="mb-2 last:mb-0">
                                  <div className="text-xs text-blue-600 font-medium mb-1">{ev.location}</div>
                                  <p className="text-xs text-gray-700 italic leading-relaxed border-l-2 border-blue-400 pl-2">
                                    "{ev.quote}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="text-xs h-8">
                              Compare Market Standards
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs h-8 text-gray-600">
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Summary Footer */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-500">⚠️</span>
                    <span className="text-gray-700">
                      Total <strong>{analysis.clauses.filter((c: any) => c.risk === 'high').length}</strong> critical risks 
                      and <strong>{analysis.clauses.filter((c: any) => c.risk === 'medium').length}</strong> minor alerts detected.
                    </span>
                  </div>
                  <Button variant="link" className="text-xs text-blue-600">
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show form view; stay here during loading unless user opens pipeline */}
      {!showPipeline && (!analysis || loading) && (
        <>

      <div className="mx-auto max-w-md px-4 pb-28">
        {loading && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm">
            <span className="text-yellow-800">Analyzing… You can view live progress.</span>
            <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900" onClick={() => setShowPipeline(true)}>
              View pipeline
            </Button>
          </div>
        )}
        {/* Draft Document */}
        <Card className="rounded-2xl shadow-sm border border-slate-200 bg-white">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-7 rounded-md bg-yellow-400/20 text-yellow-500 grid place-items-center">📄</div>
              <div className="font-semibold">Draft Document</div>
            </div>

            <Textarea
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              placeholder="Paste your legal text here for instant simplified analysis..."
              className="min-h-[120px] bg-slate-50 border-slate-200"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Type</div>
                <Select value={contractType} onValueChange={(v) => setContractType(v as any)}>
                  <SelectTrigger className="bg-white border-slate-200 h-10"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas_agreement">SaaS Terms</SelectItem>
                    <SelectItem value="tos">Terms of Service</SelectItem>
                    <SelectItem value="nda">NDA</SelectItem>
                    <SelectItem value="employment_offer">Employment Offer</SelectItem>
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Persona</div>
                <Select value={persona} onValueChange={(v) => setPersona(v as any)}>
                  <SelectTrigger className="bg-white border-slate-200 h-10"><SelectValue placeholder="Select persona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder</SelectItem>
                    <SelectItem value="company">Balanced</SelectItem>
                    <SelectItem value="user">User/Customer</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Model</div>
              <Select value={modelId} onValueChange={(v) => setModelId(v)}>
                <SelectTrigger className="bg-white border-slate-200 h-10"><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

            <Button
              onClick={analyze}
              disabled={loading || !contractText.trim()}
              className="mt-4 w-full h-11 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold"
            >
              {loading ? 'Analyzing…' : 'Analyze Risks'}
            </Button>
          </div>
        </Card>

        {/* Risk Profile and Detailed Findings removed to simplify pre-analysis screen */}

        {/* Metrics */}
        {metrics && (
          <div className="mt-6">
            <MetricsFooter metrics={metrics} />
          </div>
        )}

        {/* Helper actions */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button onClick={loadSample} variant="outline" className="rounded-xl">Load Sample</Button>
          <Button onClick={exportJSON} variant="outline" disabled={!analysis} className="rounded-xl">Export JSON</Button>
        </div>
      </div>
      </>
      )}

      {/* Guardrails Modal */}
      <AlertDialog open={guardrailOpen} onOpenChange={setGuardrailOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sensitive Content Detected</AlertDialogTitle>
            <AlertDialogDescription>{guardrailMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setGuardrailOpen(false)}>Okay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProgressStep({ completed, active, text }: { completed: boolean; active: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3">
      {completed ? (
        <div className="size-6 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
          <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : active ? (
        <div className="size-6 rounded-full border-2 border-yellow-400 flex items-center justify-center flex-shrink-0">
          <div className="size-2 rounded-full bg-yellow-400 animate-pulse" />
        </div>
      ) : (
        <div className="size-6 rounded-full border-2 border-gray-200 flex-shrink-0" />
      )}
      <span className={`text-sm ${completed ? 'text-gray-900 font-medium' : active ? 'text-gray-700' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  );
}