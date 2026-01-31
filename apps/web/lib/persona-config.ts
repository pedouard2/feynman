export type AgentState = 'idle' | 'listening' | 'thinking' | 'talking';

export interface RiveInputTarget {
  name: string;
  value: boolean | number;
  type: 'boolean' | 'number' | 'trigger';
}

export interface PersonaConfig {
  id: string;
  name: string;
  riveUrl: string;
  stateMachineName: string;
  // Map each agent state to a set of input values that should be applied
  states: Record<AgentState, RiveInputTarget[]>;
}

export const PERSONAS: Record<string, PersonaConfig> = {
  robocat: {
    id: 'robocat',
    name: 'Robocat',
    riveUrl: '/robocat.riv',
    stateMachineName: 'State Machine 1',
    states: {
      idle: [],
      listening: [{ name: 'Download', value: true, type: 'boolean' }, { name: 'Chat', value: false, type: 'boolean' }],
      thinking: [{ name: 'Download', value: true, type: 'boolean' }, { name: 'Chat', value: false, type: 'boolean' }],
      talking: [{ name: 'Chat', value: true, type: 'boolean' }, { name: 'Download', value: false, type: 'boolean' }],
    }
  },
  login_bear: {
    id: 'login_bear',
    name: 'Login Bear',
    riveUrl: '/animated-login.riv',
    stateMachineName: 'Login Machine', // verified from debug
    states: {
      // Common inputs for this file: 'isHandsUp', 'trigSuccess', 'trigFail', 'isChecking', 'numLook'
      // We will try these. If they are wrong, the debug overlay will show us the real ones now that SM name is right.
      idle: [{ name: 'isHandsUp', value: false, type: 'boolean' }, { name: 'isChecking', value: false, type: 'boolean' }],
      listening: [{ name: 'isChecking', value: true, type: 'boolean' }], // Peeking/Listening
      thinking: [{ name: 'isHandsUp', value: true, type: 'boolean' }], // Hiding/Thinking
      talking: [{ name: 'trigSuccess', value: true, type: 'trigger' }, { name: 'isHandsUp', value: false, type: 'boolean' }], // Happy/Talking
    }
  }
};

export const DEFAULT_PERSONA_ID = 'login_bear';
