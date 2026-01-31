import { evaluateExplanation } from '../lib/judge';

self.onmessage = async (e: MessageEvent<{ transcript: string }>) => {
  const { transcript } = e.data;
  const result = await evaluateExplanation(transcript);
  self.postMessage(result);
};
