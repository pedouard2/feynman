'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeft } from 'lucide-react';
import clsx from 'clsx';

interface SessionContextPanelProps {
  sessionId: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

export default function SessionContextPanel({ sessionId, isOpen, onToggle }: SessionContextPanelProps) {
  const [context, setContext] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [baseKnowledge, setBaseKnowledge] = useState('');

  return (
    <>
      <button
        onClick={onToggle}
        className={clsx(
          "fixed top-1/2 -translate-y-1/2 bg-primary/20 hover:bg-primary/30 backdrop-blur-sm border border-primary/30 text-foreground transition-all hover:scale-110 z-40",
          isOpen ? "left-[284px] p-2 rounded-full" : "left-4 p-2 rounded-full"
        )}
        title={isOpen ? "Close context panel" : "Open context panel"}
      >
        <PanelLeft size={16} className={clsx("transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-background border-r border-primary/20 flex flex-col overflow-hidden z-50 shadow-lg"
          >
            <div className="p-4 border-b border-primary/20 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Session Context</h3>
                <p className="text-xs text-foreground/60 mt-1">Add context to guide the conversation</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-2">
                  Context
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="What's the topic or goal of this session?"
                  rows={4}
                  className="w-full bg-secondary/30 border border-primary/20 rounded-[10px] px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-2">
                  Assumptions
                </label>
                <textarea
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  placeholder="What should the AI assume you already know?"
                  rows={4}
                  className="w-full bg-secondary/30 border border-primary/20 rounded-[10px] px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-2">
                  Base Knowledge
                </label>
                <textarea
                  value={baseKnowledge}
                  onChange={(e) => setBaseKnowledge(e.target.value)}
                  placeholder="Any background information or references..."
                  rows={6}
                  className="w-full bg-secondary/30 border border-primary/20 rounded-[10px] px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
