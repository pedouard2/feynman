export interface JudgeResult {
  isUnclear: boolean;
  feedback?: string;
  knowledgeDebt: number;
  jargonFound?: string[];
}

const JARGON_LIST = [
  'polymorphism', 'encapsulation', 'inheritance', 'abstraction', 'interface', 
  'dependency injection', 'middleware', 'microservices', 'jwt', 'oauth', 
  'recursion', 'asynchronous', 'promise', 'callback', 'latency', 'throughput',
  'api', 'framework', 'library', 'compiler'
];

const ANALOGY_TRIGGERS = ['like a', 'imagine', 'comparable to', 'similar to', 'analogy'];

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

  // Check for analogies (Good!)
  const hasAnalogy = ANALOGY_TRIGGERS.some(trigger => lowerText.includes(trigger));

  if (jargonFound.length > 0) {
    knowledgeDebt += jargonFound.length * 10;
    feedback += `Whoa there! You used some fancy terms: ${jargonFound.join(', ')}. Try again without them. `;
  }

  if (isTooShort) {
    knowledgeDebt += 5;
    feedback += 'That was a bit brief. Can you expand on the details? ';
  }
  
  if (hasAnalogy) {
      knowledgeDebt = Math.max(0, knowledgeDebt - 5); // Reward analogies
  }

  // If no specific issues but high debt accumulated previously
  if (knowledgeDebt === 0 && feedback === '') {
      feedback = "That makes sense! Keep going.";
  }

  return {
    isUnclear,
    knowledgeDebt,
    jargonFound: jargonFound.length > 0 ? jargonFound : undefined,
    feedback: feedback.trim() || undefined
  };
}
