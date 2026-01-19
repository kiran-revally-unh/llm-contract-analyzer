'use client';

import { Card } from '@/components/ui/card';

export function MetricsFooter({ metrics }: { metrics: { processingTime: number; tokensUsed: any; modelUsed: string; estimatedCost: number; retryCount: number } }) {
  return (
    <Card className="p-4 bg-slate-900 border-slate-800">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300 text-sm">
        <div>
          <p className="text-slate-400">Model</p>
          <p className="font-mono">{metrics.modelUsed}</p>
        </div>
        <div>
          <p className="text-slate-400">Tokens</p>
          <p className="font-mono">{metrics.tokensUsed.total} (in: {metrics.tokensUsed.input}, out: {metrics.tokensUsed.output})</p>
        </div>
        <div>
          <p className="text-slate-400">Latency</p>
          <p className="font-mono">{metrics.processingTime} ms</p>
        </div>
        <div>
          <p className="text-slate-400">Cost</p>
          <p className="font-mono">${metrics.estimatedCost.toFixed(4)}</p>
        </div>
      </div>
      {metrics.retryCount > 0 && (
        <p className="text-yellow-400 text-xs mt-2">Retries: {metrics.retryCount}</p>
      )}
    </Card>
  );
}