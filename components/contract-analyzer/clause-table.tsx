'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';

export function ClauseTable({ clauses, missing }: { clauses: any[]; missing: any[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <Card className="p-4 bg-slate-900 border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">Clauses</h2>
        <p className="text-slate-400 text-sm">{clauses.length} items</p>
      </div>
      <div className="space-y-2">
        {clauses.map((c) => (
          <div key={c.id} className="border border-slate-800 rounded-md overflow-hidden">
            <div className="p-3 bg-slate-950 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded((e) => ({...e, [c.id]: !e[c.id]}))}>
              <div className="flex-1 grid grid-cols-6 gap-3 items-center">
                <div>
                  <p className="text-white font-medium">{c.category}</p>
                  <p className="text-slate-400 text-xs">{c.who_benefits}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-300 text-sm">{c.why_risky}</p>
                </div>
                <div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${c.risk === 'high' ? 'border-red-500 text-red-400' : c.risk === 'medium' ? 'border-yellow-500 text-yellow-400' : 'border-green-500 text-green-400'}`}>{c.risk.toUpperCase()}</span>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 text-xs">Evidence: "{c.evidence_quotes?.[0]?.quote}"</p>
                </div>
              </div>
            </div>
            {expanded[c.id] && (
              <div className="p-3 bg-slate-900 space-y-2">
                <div>
                  <p className="text-slate-300 text-sm">Suggested Redline</p>
                  <p className="text-green-400 text-sm">{c.suggested_revision}</p>
                </div>
                <div>
                  <p className="text-slate-300 text-sm">Lawyer Pushback</p>
                  <p className="text-slate-400 text-sm italic">{c.pushback}</p>
                </div>
                {c.missing_info_questions?.length > 0 && (
                  <div>
                    <p className="text-slate-300 text-sm">Missing Info / Questions</p>
                    <ul className="text-slate-400 text-sm list-disc list-inside">
                      {c.missing_info_questions.map((q: string, i: number) => (<li key={i}>{q}</li>))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {missing?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-white text-sm font-semibold">Missing or Weak Clauses</h3>
          <ul className="text-slate-400 text-sm list-disc list-inside">
            {missing.map((m, i) => (
              <li key={i}><span className="text-slate-200 font-medium">{m.category}:</span> <span className="italic">{m.why_it_matters}</span> — <span className="text-green-400">{m.recommended_language}</span></li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}