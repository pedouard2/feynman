'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-1/2 left-0 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 border-l-0 text-white p-3 rounded-r-lg transition-colors z-40"
          title="Open context panel"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full bg-neutral-900 border-r border-white/10 flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-white">Session Context</h3>
                <p className="text-xs text-white/50 mt-1">Add context to guide the conversation</p>
              </div>
              <button
                onClick={onToggle}
                className="text-white/50 hover:text-white transition-colors"
                title="Close context panel"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">
                  Context
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="What's the topic or goal of this session?"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">
                  Assumptions
                </label>
                <textarea
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  placeholder="What should the AI assume you already know?"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">
                  Base Knowledge
                </label>
                <textarea
                  value={baseKnowledge}
                  onChange={(e) => setBaseKnowledge(e.target.value)}
                  placeholder="Any background information or references..."
                  rows={6}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
