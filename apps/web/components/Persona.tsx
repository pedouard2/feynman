'use client';

import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { useFeynmanStore } from '../stores/feynman';
import { useEffect, useState, useMemo } from 'react';
import { PERSONAS, DEFAULT_PERSONA_ID, PersonaConfig } from '../lib/persona-config';

// A public placeholder Rive file (Marty animation) usually available for testing
// Switched to 'Robocat' as requested.
// Downloaded from Rive Community.
// const RIVE_URL = "/robocat.riv";
// const STATE_MACHINE_NAME = "State Machine 1"; // This is the default, might need adjustment if file uses different name.

export default function Persona() {
  const { agentState } = useFeynmanStore();
  // In a real app we might select this from store, for now hardcode/select here
  const activePersona: PersonaConfig = PERSONAS[DEFAULT_PERSONA_ID]; 

  const { rive, RiveComponent } = useRive({
    src: activePersona.riveUrl,
    stateMachines: activePersona.stateMachineName,
    layout: new Layout({
      fit: Fit.Cover,
      alignment: Alignment.Center,
    }),
    autoplay: true,
  });

  // const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Robocat Inputs
  // Based on user feedback, the inputs are: "Chat", "Download", "No Internet", "Error"
  // const chatInput = useStateMachineInput(rive, STATE_MACHINE_NAME, "Chat");
  // const downloadInput = useStateMachineInput(rive, STATE_MACHINE_NAME, "Download");
  // const errorInput = useStateMachineInput(rive, STATE_MACHINE_NAME, "Error");
  // const noInternetInput = useStateMachineInput(rive, STATE_MACHINE_NAME, "No Internet");

  // State Management Engine
  useEffect(() => {
    if (!rive) return;

    // 1. Get targets for current state
    const targets = activePersona.states[agentState] || [];
    
    // 2. Apply targets
    targets.forEach(target => {
       try {
           const input = rive.stateMachineInputs(activePersona.stateMachineName).find(i => i.name === target.name);
           if (input) {
               if (target.type === 'trigger') {
                   // Triggers are fired once
                   // We might need logic to avoid re-firing constantly if the effect reruns
                   // For now, let's assume strict state changes drive this.
                   // (input as any).fire(); // Casting due to potential type mismatch in library versions
                   input.value = true; // Some libs use this for triggers too or .fire()
                   // Note: rive-react typings vary. usually .fire() for triggers.
               } else {
                   input.value = target.value;
               }
           }
       } catch { /* no-op */ }
    });

  }, [agentState, rive, activePersona]);
  
  // Debug Overlay Logic
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  useEffect(() => {
    if(!rive) return;

    const smNames = rive.stateMachineNames;
    const animNames = rive.animationNames;
    
    let inputDebug: string[] = [];
    try {
        const inputs = rive.stateMachineInputs(activePersona.stateMachineName);
        inputDebug = inputs.map(i => `${i.name} (${i.type})`);
    } catch {
        // Rive inputs may not be available yet during initialization
    }
    
    setDebugInfo([
        `File: ${activePersona.name}`,
        `State Machine: ${activePersona.stateMachineName} (Found: ${smNames.join(', ')})`,
        `Animations: ${animNames.join(', ')}`,
        '--- Inputs ---',
        ...inputDebug
    ]);
  }, [rive, activePersona]);

  return (
    <div className="absolute inset-0 z-0 bg-neutral-900">
      <RiveComponent className="w-full h-full" />
      
      {/* Fallback Overlay if Rive fails or is loading */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* We can put a glow effect here using Framer Motion as a backup */}
      </div>

    </div>
  );
}
