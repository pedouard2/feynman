import { describe, it, expect } from 'vitest';
import { DEFAULT_PERSONAS, DEFAULT_PERSONA_ID, VALID_TTS_VOICES, getPersona, getAllPersonas, Persona } from './personas';

describe('Personas', () => {
  it('has exactly 3 default personas', () => {
    const personas = getAllPersonas();
    expect(personas).toHaveLength(3);
  });

  it('has ELI5, Junior Dev, and Expert personas', () => {
    expect(DEFAULT_PERSONAS['eli5']).toBeDefined();
    expect(DEFAULT_PERSONAS['junior-dev']).toBeDefined();
    expect(DEFAULT_PERSONAS['expert']).toBeDefined();
  });

  it('has a valid default persona ID', () => {
    expect(DEFAULT_PERSONA_ID).toBe('eli5');
    expect(getPersona(DEFAULT_PERSONA_ID)).toBeDefined();
  });

  it('each persona has all required fields', () => {
    const requiredFields: (keyof Persona)[] = [
      'id', 'name', 'description', 'systemPrompt', 'ttsVoice', 'riveConfig', 'conversationalStyle'
    ];
    
    getAllPersonas().forEach(persona => {
      requiredFields.forEach(field => {
        expect(persona[field], `${persona.id} missing ${field}`).toBeDefined();
      });
    });
  });

  it('each persona has a valid TTS voice', () => {
    getAllPersonas().forEach(persona => {
      expect(VALID_TTS_VOICES).toContain(persona.ttsVoice);
    });
  });

  it('each persona has a non-empty system prompt', () => {
    getAllPersonas().forEach(persona => {
      expect(persona.systemPrompt.length).toBeGreaterThan(100);
    });
  });

  it('each persona has valid rive config', () => {
    getAllPersonas().forEach(persona => {
      expect(persona.riveConfig.riveUrl).toBeTruthy();
      expect(persona.riveConfig.stateMachineName).toBeTruthy();
    });
  });

  it('getPersona returns undefined for unknown ID', () => {
    expect(getPersona('unknown-persona')).toBeUndefined();
  });

  it('personas have unique IDs', () => {
    const personas = getAllPersonas();
    const ids = personas.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
