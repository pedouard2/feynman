import { vi, describe, it, expect } from 'vitest';

describe('API Mocking', () => {
  it('mocks /api/session POST request', async () => {
    const response = await fetch('http://localhost:3000/api/session', {
      method: 'POST'
    });
    const data = await response.json();
    
    expect(data).toEqual({
      client_secret: { value: 'mock-secret-key-123' }
    });
  });
});
