// This is the redesigned results section - copy this into page.tsx replacing the current results section

{/* Show results page after analysis */}
{!loading && analysis && (
  <div className="min-h-screen flex flex-col bg-white">
    {/* Header */}
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gray-900 text-white grid place-items-center">
              <Shield className="size-4" />
            </div>
            <div>
              <div className="font-bold text-lg">Coco</div>
              <div className="text-xs text-gray-500">Contract Analysis</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportJSON}>
            Export PDF/JSON
          </Button>
          <Button size="sm" variant="outline">
            Generate Negotiation Email
          </Button>
          <div className="size-9 rounded-full bg-gray-900 text-white grid place-items-center">
            <User className="size-4" />
          </div>
        </div>
      </div>
    </header>

    {/* Summary Strip */}
    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-5 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{analysis.overall.risk_score}</div>
            <div className="text-xs text-gray-500 mt-1">Risk Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 capitalize">
              {analysis.overall.contract_type.replace('_', ' ')}
            </div>
            <div className="text-xs text-gray-500 mt-1">Contract Type</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {analysis.clauses.filter((c: any) => c.risk === 'high').length}
            </div>
            <div className="text-xs text-gray-500 mt-1">High-Risk Items</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 capitalize">
              {analysis.overall.persona || 'Company'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Favors</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {Math.round((analysis.overall.confidence || 0.85) * 100)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Confidence</div>
          </div>
        </div>
        {metrics && (
          <div className="mt-4 text-center text-xs text-gray-500">
            {metrics.tokensUsed?.total || 0} tokens · {(metrics.processingTime / 1000).toFixed(1)}s · ${(metrics.estimatedCost || 0).toFixed(4)}
          </div>
        )}
      </div>
    </div>

    {/* Main Content */}
    <div className="flex-1">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Original Document */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Original Document</h2>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 max-h-[600px] overflow-auto">
                <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                  {contractText.substring(0, 1000)}...
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => {
                  setAnalysis(null);
                  setContractText('');
                }}
              >
                Analyze New Contract
              </Button>
            </div>
          </div>

          {/* Right: Risk Categories */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Risk Analysis by Category</h2>
            
            {(() => {
              // Group clauses by category
              const categoryMap: Record<string, any[]> = {};
              const categoryNames: Record<string, string> = {
                'termination': 'Termination & Exit',
                'ip': 'IP Ownership',
                'non_compete': 'Non-compete / Restrictions',
                'arbitration': 'Dispute Resolution',
                'liability': 'Liability & Damages',
                'payment': 'Payment / Fees',
                'privacy': 'Data Privacy / Usage',
                'data_retention': 'Data Privacy / Usage',
                'warranty': 'Warranties & Disclaimers',
                'governing_law': 'Governing Law',
                'assignment': 'Assignment Rights',
                'nda': 'Confidentiality',
                'other': 'Other Terms'
              };

              analysis.clauses.forEach((clause: any) => {
                const cat = clause.category || 'other';
                const displayName = categoryNames[cat] || cat;
                if (!categoryMap[displayName]) {
                  categoryMap[displayName] = [];
                }
                categoryMap[displayName].push(clause);
              });

              return Object.entries(categoryMap).map(([categoryName, clauses]) => {
                const highestRisk = clauses.some(c => c.risk === 'high') ? 'high' : 
                                   clauses.some(c => c.risk === 'medium') ? 'medium' : 'low';
                const avgConfidence = clauses.reduce((sum, c) => sum + (c.confidence || 0.85), 0) / clauses.length;
                
                return (
                  <Card key={categoryName} className="border-2 border-gray-200 overflow-hidden">
                    <details className="group">
                      <summary className="cursor-pointer list-none">
                        <div className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-gray-900">{categoryName}</h3>
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  highestRisk === 'high' ? 'bg-red-100 text-red-700' :
                                  highestRisk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {highestRisk.toUpperCase()}
                                </div>
                                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  {Math.round(avgConfidence * 100)}% Confidence
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {clauses[0].why_risky || clauses[0].plain_english}
                              </p>
                            </div>
                            <svg className="size-5 text-gray-400 group-open:rotate-180 transition-transform ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </summary>
                      
                      <div className="px-6 pb-6 pt-2 bg-white border-t border-gray-100">
                        {clauses.map((clause: any, idx: number) => (
                          <div key={idx} className={`${idx > 0 ? 'mt-6 pt-6 border-t border-gray-100' : ''}`}>
                            
                            {/* Why it matters */}
                            <div className="mb-4">
                              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Why It Matters</div>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {clause.severity_reasoning || clause.why_risky}
                              </p>
                            </div>

                            {/* Evidence */}
                            {clause.evidence_quotes && clause.evidence_quotes.length > 0 && (
                              <div className="mb-4">
                                <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Evidence from Contract</div>
                                <div className="space-y-2">
                                  {clause.evidence_quotes.slice(0, 4).map((ev: any, evIdx: number) => (
                                    <div key={evIdx} className="bg-gray-50 rounded p-3 border-l-2 border-blue-500">
                                      <div className="text-xs text-blue-600 font-medium mb-1">{ev.location}</div>
                                      <p className="text-xs text-gray-700 italic">"{ev.quote}"</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Who benefits */}
                            <div className="mb-4 flex items-center gap-4">
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Who Benefits</div>
                                <div className={`inline-flex px-3 py-1 rounded text-sm font-medium ${
                                  clause.who_benefits === 'company' ? 'bg-red-50 text-red-700' :
                                  clause.who_benefits === 'user' || clause.who_benefits === 'employee' ? 'bg-green-50 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {(clause.who_benefits || 'neutral').replace('_', ' ').toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Market Standard</div>
                                <div className="inline-flex px-3 py-1 rounded text-sm font-medium bg-purple-50 text-purple-700">
                                  STANDARD
                                </div>
                              </div>
                            </div>

                            {/* What to negotiate */}
                            <div className="mb-4">
                              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">What to Negotiate</div>
                              <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {clause.pushback || 'Request clarification on specific terms'}
                                </li>
                                <li className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {clause.suggested_revision || 'Propose balanced language'}
                                </li>
                                <li className="flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  Consider adding sunset or limitation clauses
                                </li>
                              </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4">
                              <Button variant="outline" size="sm">
                                <svg className="size-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save to Report
                              </Button>
                              <Button variant="outline" size="sm">
                                <svg className="size-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Add Note
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </Card>
                );
              });
            })()}

            {/* Missing Clauses */}
            {analysis.missing_or_weak_clauses && analysis.missing_or_weak_clauses.length > 0 && (
              <Card className="border-2 border-yellow-200 bg-yellow-50">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Missing / Unclear Clauses</h3>
                  <div className="space-y-4">
                    {analysis.missing_or_weak_clauses.map((missing: any, idx: number) => (
                      <div key={idx} className="bg-white rounded p-4 border border-yellow-200">
                        <div className="font-semibold text-gray-900 mb-2">{missing.category}</div>
                        <p className="text-sm text-gray-600 mb-2">{missing.why_it_matters}</p>
                        <p className="text-xs text-gray-500 italic">{missing.recommended_language}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  </div>
)}
