'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getWarningMessage, isInputSafe } from '@/lib/contract-analyzer/guardrails';
import { MetricsFooter } from '@/components/contract-analyzer/metrics-footer';
import { Shield, User, Settings } from 'lucide-react';

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

function Gauge({ score = 62 }: { score?: number }) {
  // Render a simple semi-circle gauge using conic-gradient
  const clamped = Math.max(0, Math.min(100, score));
  const deg = (clamped / 100) * 180; // 0..180
  const gradient = `conic-gradient(from 180deg, #fbbf24 ${deg}deg, #e5e7eb ${deg}deg 180deg)`;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-40 h-20 overflow-hidden">
        <div className="absolute inset-0 rounded-b-full" style={{ backgroundImage: gradient }} />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-3xl font-extrabold text-slate-900">
          {Math.round(clamped)}
        </div>
      </div>
      <div className="text-xs text-slate-500">SCORE INDEX</div>
    </div>
  );
}

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

  useEffect(() => {
    const url = new URL(window.location.href);
    const typeParam = url.searchParams.get('type');
    const textParam = url.searchParams.get('text');
    
    // Auto-populate from URL params when coming from home page
    if (typeParam) {
      setContractType(typeParam as any);
    }
    if (textParam) {
      const decodedText = decodeURIComponent(textParam);
      setContractText(decodedText);
      // Auto-trigger analysis immediately if both type and text are provided
      if (typeParam) {
        // Start loading immediately
        setLoading(true);
        setProgressStep(0);
        
        // Trigger analysis after a brief delay to let state settle
        setTimeout(() => {
          analyzeContract(decodedText, typeParam as any);
        }, 100);
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

    // Simulate progress steps
    const progressInterval = setInterval(() => {
      setProgressStep(prev => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 1500);
    
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
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.isRateLimit 
          ? 'OpenAI rate limit reached. Please wait 60 seconds and try again, or add a payment method to your OpenAI account.'
          : data.error || 'Analysis failed';
        throw new Error(errorMsg);
      }
      
      clearInterval(progressInterval);
      setProgressStep(4);
      
      setAnalysis(data.analysis);
      setMetrics({ processingTime: data.processingTime, tokensUsed: data.tokensUsed, modelUsed: data.modelUsed, estimatedCost: data.estimatedCost, retryCount: data.retryCount });
      if (voiceEnabled) {
        const summary = `Overall risk ${data.analysis.overall.risk_level} with score ${data.analysis.overall.risk_score} and confidence ${(data.analysis.overall.confidence*100).toFixed(0)} percent.`;
        speak(summary);
      }
      localStorage.setItem('contract-last-analysis', JSON.stringify(data.analysis));
    } catch (e: any) {
      clearInterval(progressInterval);
      setError(e.message);
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

  return (
    <div className="min-h-svh w-full bg-white">
      {/* Show loading progress screen when analyzing */}
      {loading && (
        <div className="min-h-svh flex flex-col bg-gradient-to-b from-gray-50 to-white">
          {/* Header */}
          <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-gray-900 text-white grid place-items-center">
                  <Shield className="size-4" />
                </div>
                <span className="font-bold text-lg">Coco</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm font-medium">
                  <span className="text-gray-600">GPT-4o</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm">
                  <span className="text-gray-600">Private</span>
                </div>
                <div className="size-9 rounded-full bg-yellow-400 grid place-items-center">
                  <User className="size-4 text-gray-900" />
                </div>
              </div>
            </div>
          </header>

          {/* Progress Content */}
          <div className="flex-1 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-xl">
              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div className="size-24 rounded-full bg-yellow-50 border-4 border-yellow-100 flex items-center justify-center">
                  <div className="text-4xl">📄</div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-center text-gray-900 mb-3">
                Analysis in Progress
              </h1>
              <p className="text-center text-gray-600 mb-12">
                Our AI is currently auditing your document for risk and compliance.
              </p>

              {/* Progress Steps */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
                <div className="space-y-4">
                  <ProgressStep 
                    completed={progressStep > 0}
                    active={progressStep === 0}
                    text="Scanning document structure"
                  />
                  <ProgressStep 
                    completed={progressStep > 1}
                    active={progressStep === 1}
                    text="Identifying key clauses"
                  />
                  <ProgressStep 
                    completed={progressStep > 2}
                    active={progressStep === 2}
                    text="Analyzing risk vectors"
                  />
                  <ProgressStep 
                    completed={progressStep > 3}
                    active={progressStep === 3}
                    text="Generating plain-English explanations"
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="size-3 rounded-full bg-green-500" />
                <span>Secure AES-256 processing active</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-gray-200 bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 py-6">
              <div className="flex items-center justify-center gap-12 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">10k+</div>
                  <div className="text-xs text-gray-600">Contracts Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">99.9%</div>
                  <div className="text-xs text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">AES-256</div>
                  <div className="text-xs text-gray-600">Encrypted</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-600">
                <a href="#" className="hover:text-gray-900">Terms</a>
                <a href="#" className="hover:text-gray-900">Privacy</a>
                <a href="#" className="hover:text-gray-900">API</a>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Show results page after analysis */}
      {!loading && analysis && (
        <div className="min-h-svh flex flex-col bg-gray-50">
          {/* Header */}
          <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <div className="mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded bg-gray-900 text-white grid place-items-center text-xs">C</div>
                  <span className="font-semibold">Coco</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{contractType.replace('_', ' ')}</span>
                  <span>›</span>
                  <span className="font-medium">Analysis Results</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={exportJSON}>
                  Export Report
                </Button>
                <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
                  Request Revision
                </Button>
                <div className="size-9 rounded-full bg-yellow-400 grid place-items-center">
                  <User className="size-4 text-gray-900" />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content - Split View */}
          <div className="flex-1 flex">
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
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {contractText.split('\n').map((paragraph, idx) => {
                      const hasHighRisk = analysis.clauses.some((c: any) => 
                        c.risk_level === 'high' && paragraph.toLowerCase().includes(c.title?.toLowerCase() || '')
                      );
                      const hasMediumRisk = !hasHighRisk && analysis.clauses.some((c: any) => 
                        c.risk_level === 'medium' && paragraph.toLowerCase().includes(c.title?.toLowerCase() || '')
                      );
                      
                      return (
                        <p 
                          key={idx} 
                          className={`mb-4 ${
                            hasHighRisk ? 'bg-red-50 border-l-4 border-red-400 pl-4 py-2' : 
                            hasMediumRisk ? 'bg-yellow-50 border-l-4 border-yellow-400 pl-4 py-2' : ''
                          }`}
                        >
                          {paragraph || '\u00A0'}
                        </p>
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
                    const risk = (clause.risk_level || '').toLowerCase();
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
                      Total <strong>{analysis.clauses.filter((c: any) => c.risk_level === 'high').length}</strong> critical risks 
                      and <strong>{analysis.clauses.filter((c: any) => c.risk_level === 'medium').length}</strong> minor alerts detected.
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

      {/* Show form when not loading and no analysis */}
      {!loading && !analysis && (
        <>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-yellow-400/20 text-yellow-500 grid place-items-center"><Shield className="size-4" /></div>
          <div>
            <div className="text-lg font-semibold">Coco</div>
            <div className="text-[10px] text-slate-500 tracking-wide">ANALYSIS CONSOLE</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-full grid place-items-center border border-slate-200 text-slate-600">⚙️</div>
          <div className="size-9 rounded-full grid place-items-center border border-slate-200 bg-slate-900 text-white">👤</div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-28">
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

        {/* Risk Profile */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div className="text-slate-900 font-semibold">Risk Profile</div>
            {analysis && (
              <div className="text-[11px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                {analysis.overall.risk_level?.replace('_',' ').toUpperCase()}
              </div>
            )}
          </div>

          <Card className="mt-3 rounded-2xl border border-slate-200 bg-white">
            <div className="p-5 flex flex-col items-center">
              <Gauge score={analysis ? analysis.overall.risk_score : 62} />
              <div className="mt-4 grid grid-cols-3 gap-4 w-full text-center">
                <div>
                  <div className="text-[11px] text-slate-500">CONFIDENCE</div>
                  <div className="text-sm font-semibold">{analysis ? `${(analysis.overall.confidence*100).toFixed(1)}%` : '98.4%'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">CLARITY</div>
                  <div className="text-sm font-semibold">{analysis ? (analysis.overall.clarity || '—') : 'Low'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">EXPOSURE</div>
                  <div className="text-sm font-semibold">{analysis ? (analysis.overall.exposure || '—') : 'Mid'}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Findings */}
        <div className="mt-8">
          <div className="text-[11px] tracking-[0.2em] text-slate-500">DETAILED FINDINGS</div>
          <div className="mt-3 space-y-4">
            {analysis ? (
              analysis.clauses.slice(0, 5).map((clause: any, idx: number) => {
                const risk = (clause.risk_level || '').toLowerCase();
                const badgeColor = risk === 'high' ? 'bg-red-100 text-red-700 border-red-200' : risk === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200';
                const badgeLabel = risk === 'high' ? 'CRITICAL' : risk === 'medium' ? 'STANDARD' : 'SAFE';
                return (
                  <Card key={idx} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-[10px] px-2 py-1 rounded-full border ${badgeColor}`}>{badgeLabel}</div>
                        <div className="size-7 rounded-full grid place-items-center bg-slate-100 text-slate-600 border border-slate-200">!</div>
                      </div>
                      <div className="text-base font-semibold">
                        {clause.title || clause.category || 'Clause'}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{clause.why_risky}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button className="h-10 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black">Fix with AI</Button>
                        <Button variant="outline" className="h-10 rounded-xl">Flag</Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-500">Run an analysis to see detailed findings.</Card>
            )}
          </div>
        </div>

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