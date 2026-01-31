'use client';

import { useEffect, useState } from 'react';
import Persona from '../components/Persona';
import ChatDrawer from '../components/ChatDrawer';
import SessionDrawer from '../components/SessionDrawer';
import JudgeFeedback from '../components/JudgeFeedback';
import PersonaSelector from '../components/PersonaSelector';
import { useFeynmanStore } from '../stores/feynman';
import { useRealtimeSession } from '../hooks/use-realtime';
import { Mic, MicOff, Power, Send } from 'lucide-react';
import clsx from 'clsx';

export default function Home() {
  const { agentState, isConnected, isMockMode, setAgentState } = useFeynmanStore();
  const { startSession, stopSession, sendMessage, toggleMic, commitTurn, isMicOn } = useRealtimeSession();

  const handleToggleMic = () => {
    toggleMic();
  };

  const handleCommitTurn = () => {
    commitTurn();
  };

  const handlePower = () => {
    if (isConnected) {
      stopSession();
    } else {
      startSession();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && isMicOn && isConnected) {
        e.preventDefault();
        handleCommitTurn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMicOn, isConnected]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
      
      {/* 1. The Persona Layer */}
      <Persona />

      {/* 1.5 The Feedback Layer */}
      <JudgeFeedback />

      {/* 2. The HUD Layer */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10">
        <div className="text-white/50 text-xs tracking-widest uppercase">
          Feynman Protocol
          <div className="text-white font-bold text-lg">
            System: {isConnected ? (isMockMode ? 'MOCK MODE' : 'ONLINE') : 'OFFLINE'}
          </div>
        </div>
        
        <div className="flex gap-2">
           <div className={clsx(
             "px-3 py-1 rounded-full text-xs font-mono border",
             agentState === 'listening' ? "bg-green-500/20 border-green-500 text-green-400" :
             agentState === 'talking' ? "bg-blue-500/20 border-blue-500 text-blue-400" :
             "bg-white/5 border-white/10 text-white/40"
           )}>
             {agentState.toUpperCase()}
           </div>
        </div>
      </div>

      {/* 3. The Control Layer (Center) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        
        {/* Only show controls if connected */}
        {isConnected && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleMic}
              className={clsx(
                "pointer-events-auto w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm",
                isMicOn 
                  ? "bg-red-500/80 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-110" 
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
              )}
            >
              {isMicOn ? <Mic size={40} /> : <MicOff size={32} />}
            </button>
            
            {isMicOn && (
              <button
                onClick={handleCommitTurn}
                className="pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center bg-green-500/80 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-110 transition-all duration-300 backdrop-blur-sm"
                title="Send (Enter)"
              >
                <Send size={28} />
              </button>
            )}
          </div>
        )}

        {/* Start Button if disconnected */}
        {!isConnected && (
          <div className="pointer-events-auto flex flex-col items-center gap-8 max-h-[80vh] overflow-y-auto p-4">
            <PersonaSelector />
            <button
              onClick={handlePower}
              className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-3 shadow-xl shadow-white/10"
            >
              <Power size={20} />
              Start Session
            </button>
          </div>
        )}
      </div>

      {/* 4. The Drawer Layer */}
      {isConnected && <ChatDrawer onSendMessage={sendMessage} />}
      <SessionDrawer />
      
      {/* 5. Mock Mode Controls */}
      {isConnected && isMockMode && (
        <div className="absolute bottom-24 right-6 z-50 flex flex-col gap-2 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
            <h4 className="text-xs text-white/50 font-bold uppercase mb-2">Debug States</h4>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setAgentState('idle')} className="px-3 py-1 bg-white/5 text-xs text-white hover:bg-white/10 rounded">Idle</button>
                <button onClick={() => setAgentState('listening')} className="px-3 py-1 bg-green-500/20 text-xs text-green-300 hover:bg-green-500/30 rounded">Listening</button>
                <button onClick={() => setAgentState('thinking')} className="px-3 py-1 bg-yellow-500/20 text-xs text-yellow-300 hover:bg-yellow-500/30 rounded">Thinking</button>
                <button onClick={() => setAgentState('talking')} className="px-3 py-1 bg-blue-500/20 text-xs text-blue-300 hover:bg-blue-500/30 rounded">Talking</button>
            </div>
        </div>
      )}
      
    </main>
  );
}
