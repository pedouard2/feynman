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
    expect(result.feedback).toContain('expand on the details');
  });

  it('calculates knowledge debt based on jargon count', async () => {
    const result = await evaluateExplanation('Polymorphism and encapsulation are key.');
    expect(result.knowledgeDebt).toBeGreaterThan(0);
  });

  it('handles empty string input', async () => {
    const result = await evaluateExplanation('');
    expect(result.isUnclear).toBe(true);
    expect(result.knowledgeDebt).toBeGreaterThanOrEqual(0);
  });

  it('detects multiple jargon words and scales debt accordingly', async () => {
    const result = await evaluateExplanation('We use polymorphism, encapsulation, and inheritance together with dependency injection.');
    expect(result.isUnclear).toBe(true);
    expect(result.jargonFound?.length).toBeGreaterThanOrEqual(4);
    expect(result.knowledgeDebt).toBeGreaterThanOrEqual(40);
  });

  it('rewards explanations with analogies', async () => {
    const withAnalogy = await evaluateExplanation('A variable is like a box where you store things. Imagine you have a container.');
    const withoutAnalogy = await evaluateExplanation('A variable stores values in memory for later use in the program.');
    expect(withAnalogy.knowledgeDebt).toBeLessThanOrEqual(withoutAnalogy.knowledgeDebt);
  });

  it('handles long clear explanations without jargon', async () => {
    const result = await evaluateExplanation(
      'When you click a button on a website, your computer sends a message to another computer far away. ' +
      'That computer looks up the information you asked for, like finding a book on a shelf. ' +
      'Then it sends the answer back to your computer, which shows it on your screen.'
    );
    expect(result.isUnclear).toBe(false);
    expect(result.knowledgeDebt).toBe(0);
  });

  it('detects jargon regardless of case', async () => {
    const result = await evaluateExplanation('The API handles all the requests from the frontend.');
    expect(result.isUnclear).toBe(true);
    expect(result.jargonFound).toContain('api');
  });

  it('handles explanation with only jargon and no substance', async () => {
    const result = await evaluateExplanation('Microservices API framework.');
    expect(result.isUnclear).toBe(true);
    expect(result.jargonFound?.length).toBeGreaterThanOrEqual(2);
  });
});
