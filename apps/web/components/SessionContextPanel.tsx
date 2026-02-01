'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface SessionContextPanelProps {
  sessionId: string | null;
}

export default function SessionContextPanel({ sessionId }: SessionContextPanelProps) {
  const [context, setContext] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [baseKnowledge, setBaseKnowledge] = useState('');

  return (
    <div className="h-full bg-neutral-900 border-l border-r border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Session Context</h3>
        <p className="text-xs text-white/50 mt-1">Add context to guide the conversation</p>
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
    </div>
  );
}
