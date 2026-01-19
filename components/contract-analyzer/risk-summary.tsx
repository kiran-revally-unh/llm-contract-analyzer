'use client';

import { Card } from '@/components/ui/card';

export function RiskSummary({ overall }: { overall: any }) {
  const pct = overall.risk_score ?? 0;
  const level = overall.risk_level ?? 'low';
  const confidence = Math.round((overall.confidence ?? 0) * 100);
  const color = level === 'high' ? 'text-red-400' : level === 'medium' ? 'text-yellow-400' : 'text-green-400';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card className="p-4 bg-slate-900 border-slate-800">
        <p className="text-slate-300 text-sm">Overall Risk Score</p>
        <p className={`text-3xl font-bold ${color}`}>{pct}/100</p>
      </Card>
      <Card className="p-4 bg-slate-900 border-slate-800">
        <p className="text-slate-300 text-sm">Risk Level</p>
        <span className={`px-2 py-1 rounded-full text-xs ${color} border ${color.replace('text','border')}`}>{level.toUpperCase()}</span>
      </Card>
      <Card className="p-4 bg-slate-900 border-slate-800">
        <p className="text-slate-300 text-sm">Confidence</p>
        <p className="text-3xl font-bold text-blue-400">{confidence}%</p>
      </Card>
    </div>
  );
}