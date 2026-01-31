import { evaluateExplanation } from './judge';
import { describe, it, expect } from 'vitest';

describe('Judge Service', () => {
  it('identifies simple, clear explanations', async () => {
    const result = await evaluateExplanation('The car moves because the engine burns gas to make the wheels turn.');
    expect(result.isUnclear).toBe(false);
    expect(result.knowledgeDebt).toBe(0);
  });

  it('flags jargon words', async () => {
    const result = await evaluateExplanation('The code uses polymorphism to handle different object types.');
    expect(result.isUnclear).toBe(true);
    expect(result.jargonFound).toContain('polymorphism');
    expect(result.feedback).toContain('polymorphism');
  });

  it('flags very short explanations', async () => {
    const result = await evaluateExplanation('It works.');
    expect(result.isUnclear).toBe(true);
    expect(result.feedback).toContain('elaborate');
  });

  it('calculates knowledge debt based on jargon count', async () => {
    const result = await evaluateExplanation('Polymorphism and encapsulation are key.');
    expect(result.knowledgeDebt).toBeGreaterThan(0);
  });
});
