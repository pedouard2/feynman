'use client';

import { useEffect, useState, useCallback } from 'react';
import Persona from '../components/Persona';
import BottomChatDrawer from '../components/BottomChatDrawer';
import SessionGrid from '../components/SessionGrid';
import NewSessionModal from '../components/NewSessionModal';
import JudgeFeedback from '../components/JudgeFeedback';
import { useFeynmanStore } from '../stores/feynman';
import { useRealtimeSession } from '../hooks/use-realtime';
import { ArrowLeft, Mic, MicOff, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export default function Home() {
  const [currentView, setCurrentView] = useState<'grid' | 'chat'>('grid');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionTimeout, setConnectionTimeout] = useState(false);

  const { agentState, isConnected, isMockMode, setAgentState, createConversation, loadConversation, loadConversations, error: storeError } = useFeynmanStore();
  const { startSession, stopSession, sendMessage, toggleMic, commitTurn, isMicOn, currentTranscript, connectionError: hookConnectionError } = useRealtimeSession();

  const displayError = connectionError || hookConnectionError || storeError;

  // Load conversations only once on mount
  useEffect(() => {
    loadConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle connection timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (currentView === 'chat' && !isConnected && !connectionError) {
      timeoutId = setTimeout(() => {
        setConnectionTimeout(true);
      }, 15000); // 15 second timeout
    }
    
    if (isConnected) {
      setConnectionTimeout(false);
      setConnectionError(null);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentView, isConnected, connectionError]);

  const handleSessionClick = useCallback(async (sessionId: string) => {
    setIsLoadingSession(true);
    setConnectionError(null);
    setConnectionTimeout(false);
    
    try {
      setActiveSessionId(sessionId);
      await loadConversation(sessionId);
      setCurrentView('chat');
      setIsChatDrawerOpen(false);
      await startSession();
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoadingSession(false);
    }
  }, [loadConversation, startSession]);

  const handleNewSession = useCallback(() => {
    setIsNewSessionModalOpen(true);
  }, []);

  const handleCreateSession = useCallback(async (data: { personaId: string; sourceText: string }) => {
    setIsCreatingSession(true);
    setConnectionError(null);
    setConnectionTimeout(false);
    
    try {
      const conversationId = await createConversation(
        data.personaId,
        undefined,
        data.sourceText
      );
      
      if (conversationId) {
        setActiveSessionId(conversationId);
        setCurrentView('chat');
        setIsChatDrawerOpen(false);
        await startSession();
      }
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsCreatingSession(false);
    }
  }, [createConversation, startSession]);

  const handleRetryConnection = useCallback(async () => {
    setConnectionError(null);
    setConnectionTimeout(false);
    try {
      await startSession();
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [startSession]);

  const handleBackToGrid = useCallback(() => {
    stopSession();
    setCurrentView('grid');
    setActiveSessionId(null);
    setConnectionError(null);
    setConnectionTimeout(false);
  }, [stopSession]);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background font-sans select-none">
      {currentView === 'grid' && (
        <SessionGrid
          onSessionClick={handleSessionClick}
          onNewSession={handleNewSession}
          isLoading={isLoadingSession}
        />
      )}

      {currentView === 'chat' && (
        <div className="relative h-full w-full">
          <div className="w-full h-full relative">
            <Persona />
            <JudgeFeedback />

            <div className="absolute top-6 left-6 z-10">
              <button
                onClick={handleBackToGrid}
                aria-label="Back to sessions"
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 backdrop-blur-sm border border-primary/30 rounded-full text-foreground transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="text-sm font-medium">Back to Sessions</span>
              </button>
            </div>

            <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
              {displayError && (
                <div className="px-3 py-2 rounded-lg text-xs font-mono border bg-red-500/20 border-red-500 text-red-400 flex items-center gap-2" role="alert">
                  <span>{displayError}</span>
                  <button 
                    onClick={handleRetryConnection}
                    aria-label="Retry connection"
                    className="p-1 hover:bg-red-500/20 rounded"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              )}
              {!isConnected && !displayError && !connectionTimeout && (
                <div className="px-3 py-1 rounded-full text-xs font-mono border bg-accent-warm/20 border-accent-warm text-accent-warm animate-pulse">
                  CONNECTING...
                </div>
              )}
              {connectionTimeout && !isConnected && (
                <div className="px-3 py-2 rounded-lg text-xs font-mono border bg-accent-warm/20 border-accent-warm text-accent-warm flex items-center gap-2">
                  <span>Connection slow</span>
                  <button 
                    onClick={handleRetryConnection}
                    aria-label="Retry connection"
                    className="p-1 hover:bg-accent-warm/20 rounded"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              )}
              {isConnected && isMockMode && (
                <div className="px-3 py-1 rounded-full text-xs font-mono border bg-secondary/20 border-secondary text-foreground/60">
                  LOCAL MODE
                </div>
              )}
              {isConnected && (
                <div
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-mono border',
                    agentState === 'listening'
                      ? 'bg-accent-green/20 border-accent-green text-accent-green'
                      : agentState === 'talking'
                      ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                      : agentState === 'thinking'
                      ? 'bg-accent-warm/20 border-accent-warm text-accent-warm'
                      : 'bg-secondary/20 border-secondary text-foreground/40'
                  )}
                >
                  {agentState.toUpperCase()}
                </div>
              )}
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={toggleMic}
                disabled={!isConnected}
                aria-label={isMicOn ? 'Turn microphone off' : 'Turn microphone on'}
                aria-pressed={isMicOn}
                className={clsx(
                  'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl',
                  !isConnected && 'opacity-50 cursor-not-allowed',
                  isMicOn
                    ? 'bg-accent-green hover:bg-accent-green/80 scale-110 ring-4 ring-accent-green/30'
                    : 'bg-primary hover:bg-primary/80 hover:scale-105'
                )}
              >
                {isMicOn ? (
                  <Mic size={36} className="text-white" aria-hidden="true" />
                ) : (
                  <MicOff size={36} className="text-white" aria-hidden="true" />
                )}
              </button>
              {isMicOn && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-accent-green/90 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium animate-pulse">
                    Listening...
                  </div>
                </div>
              )}
            </div>

            {isConnected && isMockMode && (
              <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 p-4 bg-background/90 backdrop-blur-sm rounded-[10px] border border-primary/20">
                <h4 className="text-xs text-foreground/50 font-bold uppercase mb-2">
                  Debug States
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAgentState('idle')}
                    className="px-3 py-1 bg-secondary/30 text-xs text-foreground hover:bg-secondary/50 rounded-[10px]"
                  >
                    Idle
                  </button>
                  <button
                    onClick={() => setAgentState('listening')}
                    className="px-3 py-1 bg-accent-green/20 text-xs text-accent-green hover:bg-accent-green/30 rounded-[10px]"
                  >
                    Listening
                  </button>
                  <button
                    onClick={() => setAgentState('thinking')}
                    className="px-3 py-1 bg-accent-warm/20 text-xs text-accent-warm hover:bg-accent-warm/30 rounded-[10px]"
                  >
                    Thinking
                  </button>
                  <button
                    onClick={() => setAgentState('talking')}
                    className="px-3 py-1 bg-accent-blue/20 text-xs text-accent-blue hover:bg-accent-blue/30 rounded-[10px]"
                  >
                    Talking
                  </button>
                </div>
              </div>
            )}
          </div>

          <BottomChatDrawer
            isOpen={isChatDrawerOpen}
            onToggle={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
            onSendMessage={sendMessage}
            currentTranscript={currentTranscript}
            sessionId={activeSessionId}
          />
        </div>
      )}

      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onComplete={handleCreateSession}
      />
    </main>
  );
}
