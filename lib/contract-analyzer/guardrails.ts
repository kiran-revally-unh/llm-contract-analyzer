const profanityList = ['fuck','shit','bitch','asshole','bastard'];

const patterns = {
  ssn: /\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b/gi,
  phone: /\b(?:\+?1\s*)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/gi,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
};

export type GuardrailHit = { type: 'ssn'|'phone'|'email'|'profanity', match: string };

export function detectSensitiveAndProfanity(text: string): GuardrailHit[] {
  const hits: GuardrailHit[] = [];
  for (const [key, regex] of Object.entries(patterns)) {
    const matches = text.match(regex) || [];
    for (const m of matches) hits.push({ type: key as GuardrailHit['type'], match: m });
  }
  const lower = text.toLowerCase();
  for (const word of profanityList) {
    if (lower.includes(word)) hits.push({ type: 'profanity', match: word });
  }
  return hits;
}

export function isInputSafe(text: string): { safe: boolean; hits: GuardrailHit[] } {
  const hits = detectSensitiveAndProfanity(text);
  return { safe: hits.length === 0, hits };
}

export function getWarningMessage(hits: GuardrailHit[]): string {
  const byType: Record<string, number> = {};
  for (const h of hits) byType[h.type] = (byType[h.type] ?? 0) + 1;
  const parts = Object.entries(byType).map(([t, n]) => `${t} (${n})`);
  return `Detected sensitive content: ${parts.join(', ')}. Please remove and try again.`;
}