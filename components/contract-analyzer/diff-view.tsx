'use client';

import { Card } from '@/components/ui/card';

function diffClauses(current: any[], previous: any[]) {
  const byIdPrev: Record<string, any> = {};
  for (const c of previous) byIdPrev[c.id] = c;
  const byIdCurr: Record<string, any> = {};
  for (const c of current) byIdCurr[c.id] = c;

  const added = current.filter(c => !byIdPrev[c.id]);
  const removed = previous.filter(c => !byIdCurr[c.id]);
  const changed = current
    .filter(c => byIdPrev[c.id])
    .map(c => ({ id: c.id, category: c.category, from: byIdPrev[c.id].risk, to: c.risk }))
    .filter(d => d.from !== d.to);

  return { added, removed, changed };
}

export function DiffView({ current, previous }: { current: any; previous: any }) {
  const scoreDelta = (current?.overall?.risk_score ?? 0) - (previous?.overall?.risk_score ?? 0);
  const { added, removed, changed } = diffClauses(current?.clauses ?? [], previous?.clauses ?? []);
  const deltaColor = scoreDelta > 0 ? 'text-red-400' : scoreDelta < 0 ? 'text-green-400' : 'text-slate-300';

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-slate-900 border-slate-800">
        <h3 className="text-white text-sm font-semibold mb-2">Risk Score Change</h3>
        <p className={`text-2xl font-bold ${deltaColor}`}>{scoreDelta > 0 ? '+' : ''}{scoreDelta}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 bg-slate-900 border-slate-800">
          <h4 className="text-white text-sm font-semibold mb-2">Added Clauses</h4>
          {added.length === 0 ? (
            <p className="text-slate-400 text-sm">None</p>
          ) : (
            <ul className="text-slate-300 text-sm list-disc list-inside">
              {added.map((c: any) => (<li key={c.id}>{c.category} ({c.risk})</li>))}
            </ul>
          )}
        </Card>
        <Card className="p-4 bg-slate-900 border-slate-800">
          <h4 className="text-white text-sm font-semibold mb-2">Removed Clauses</h4>
          {removed.length === 0 ? (
            <p className="text-slate-400 text-sm">None</p>
          ) : (
            <ul className="text-slate-300 text-sm list-disc list-inside">
              {removed.map((c: any) => (<li key={c.id}>{c.category} ({c.risk})</li>))}
            </ul>
          )}
        </Card>
        <Card className="p-4 bg-slate-900 border-slate-800">
          <h4 className="text-white text-sm font-semibold mb-2">Risk Changes</h4>
          {changed.length === 0 ? (
            <p className="text-slate-400 text-sm">None</p>
          ) : (
            <ul className="text-slate-300 text-sm list-disc list-inside">
              {changed.map((d: any) => (<li key={d.id}>{d.category}: {d.from.toUpperCase()} → {d.to.toUpperCase()}</li>))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}