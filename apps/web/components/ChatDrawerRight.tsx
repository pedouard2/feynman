'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, PanelRight } from 'lucide-react';
import { useFeynmanStore } from '../stores/feynman';
import clsx from 'clsx';

export interface ChatDrawerRightProps {
  isOpen: boolean;
  onToggle: () => void;
  onSendMessage: (text: string) => void;
  onMicToggle: () => void;
  isMicOn: boolean;
  currentTranscript: string;
  sessionId: string | null;
}

export default function ChatDrawerRight({ isOpen, onToggle, onSendMessage, onMicToggle, isMicOn, currentTranscript, sessionId }: ChatDrawerRightProps) {
  const { messages, concepts } = useFeynmanStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTranscript) {
      setInputText(currentTranscript);
    }
  }, [currentTranscript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <>
      <button
        onClick={onToggle}
        aria-label={isOpen ? "Close chat panel" : "Open chat panel"}
        aria-expanded={isOpen}
        className={clsx(
          "fixed top-1/2 -translate-y-1/2 bg-primary/20 hover:bg-primary/30 backdrop-blur-sm border border-primary/30 text-foreground transition-all hover:scale-110 z-40",
          isOpen ? "right-[284px] p-2 rounded-full" : "right-4 p-2 rounded-full"
        )}
      >
        <PanelRight size={16} className={clsx("transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[280px] bg-background border-l border-primary/20 flex flex-col shadow-lg overflow-hidden z-50"
          >
            <div className="p-4 border-b border-primary/20 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-foreground">Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {concepts.length > 0 && (
                <div className="p-4 bg-secondary/20 rounded-[10px] border border-primary/20">
                  <h4 className="text-xs font-bold text-foreground/60 mb-3 uppercase tracking-wider">
                    Concept Coverage
                  </h4>
                  <div className="space-y-2">
                    {concepts.map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'w-2 h-2 rounded-full',
                            c.status === 'covered'
                              ? 'bg-accent-green'
                              : c.status === 'partial'
                              ? 'bg-accent-warm'
                              : 'bg-accent-warm/60'
                          )}
                        />
                        <span
                          className={clsx(
                            'text-sm',
                            c.status === 'covered' ? 'text-foreground' : 'text-foreground/50'
                          )}
                        >
                          {c.name}
                        </span>
                        {c.status === 'covered' && (
                          <span className="text-xs text-accent-green ml-auto">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={clsx(
                    'p-3 rounded-[10px]',
                    msg.role === 'user' 
                      ? 'bg-primary/20 text-foreground ml-8' 
                      : 'bg-secondary/20 text-foreground mr-8'
                  )}
                >
                  {msg.text}
                </div>
              ))}

              {messages.length === 0 && (
                <div className="text-center text-foreground/40 text-sm mt-10">
                  Start the conversation...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-primary/20 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => !isMicOn && setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isMicOn && handleSend()}
                    placeholder={isMicOn ? "Listening..." : "Type a message..."}
                    disabled={isMicOn}
                    className={clsx(
                      "w-full bg-secondary/30 border border-primary/20 rounded-full pl-4 pr-12 py-2 text-foreground text-sm placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors",
                      isMicOn && "opacity-70 cursor-not-allowed"
                    )}
                  />
                  <button
                    onClick={onMicToggle}
                    aria-label={isMicOn ? 'Stop microphone' : 'Start microphone'}
                    aria-pressed={isMicOn}
                    className={clsx(
                      'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors',
                      isMicOn
                        ? 'bg-accent-warm text-foreground'
                        : 'text-foreground/50 hover:text-foreground hover:bg-primary/20'
                    )}
                  >
                    {isMicOn ? <Mic size={16} aria-hidden="true" /> : <MicOff size={16} aria-hidden="true" />}
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isMicOn}
                  aria-label="Send message"
                  className="p-2 bg-primary hover:bg-primary/80 disabled:bg-secondary/30 disabled:text-foreground/30 rounded-full text-foreground transition-colors"
                >
                  <Send size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
