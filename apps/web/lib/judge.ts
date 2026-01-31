export interface JudgeResult {
  isUnclear: boolean;
  feedback?: string;
  knowledgeDebt: number;
  jargonFound?: string[];
}

const JARGON_LIST = [
  'polymorphism',
  'encapsulation',
  'inheritance',
  'abstraction',
  'interface',
  'dependency injection',
  'middleware',
  'microservices'
];

export async function evaluateExplanation(text: string): Promise<JudgeResult> {
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  // Check for jargon
  const jargonFound = JARGON_LIST.filter(jargon => lowerText.includes(jargon));
  
  // Check for brevity (too short)
  const isTooShort = words.length < 5;
  
  let knowledgeDebt = 0;
  let feedback = '';
  const isUnclear = jargonFound.length > 0 || isTooShort;

  if (jargonFound.length > 0) {
    knowledgeDebt += jargonFound.length * 10;
    feedback += `I heard some technical terms: ${jargonFound.join(', ')}. Can you explain those in simple words? `;
  }

  if (isTooShort) {
    feedback += 'That explanation was a bit too short. Can you elaborate?';
  }

  return {
    isUnclear,
    knowledgeDebt,
    jargonFound: jargonFound.length > 0 ? jargonFound : undefined,
    feedback: feedback.trim() || undefined
  };
}
