import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('http://localhost:3000/api/session', () => {
    return HttpResponse.json({
      client_secret: { value: 'mock-secret-key-123' }
    });
  }),
  
  http.post('/api/session', () => {
    return HttpResponse.json({
      client_secret: { value: 'mock-secret-key-123' }
    });
  }),

  http.post('https://api.openai.com/v1/realtime/sessions', () => {
    return HttpResponse.json({
      client_secret: { value: 'mock-secret-key-123' }
    });
  })
];
