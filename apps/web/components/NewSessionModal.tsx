'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { getAllPersonas } from '../lib/personas';
import clsx from 'clsx';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { personaId: string; sourceText: string }) => void;
}

export default function NewSessionModal({ isOpen, onClose, onComplete }: NewSessionModalProps) {
  const [currentStep, setCurrentStep] = useState<'persona' | 'source'>('persona');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [showCreatePersona, setShowCreatePersona] = useState(false);

  const personas = getAllPersonas();

  const handleNext = () => {
    if (currentStep === 'persona' && selectedPersonaId) {
      setCurrentStep('source');
    }
  };

  const handleComplete = () => {
    if (selectedPersonaId) {
      onComplete({ personaId: selectedPersonaId, sourceText });
      onClose();
      setCurrentStep('persona');
      setSelectedPersonaId(null);
      setSourceText('');
    }
  };

  const handleClose = () => {
    onClose();
    setCurrentStep('persona');
    setSelectedPersonaId(null);
    setSourceText('');
    setShowCreatePersona(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-neutral-900 rounded-2xl p-6 z-50 shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">New Session</h2>
                <p className="text-sm text-white/50 mt-1">
                  Step {currentStep === 'persona' ? '1' : '2'} of 2
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6 min-h-[300px]">
              {currentStep === 'persona' && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">
                    Select a Persona (Required)
                  </h3>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {personas.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => setSelectedPersonaId(persona.id)}
                        className={clsx(
                          'w-full text-left p-4 rounded-lg border transition-colors',
                          selectedPersonaId === persona.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {persona.name[0]}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">
                              {persona.name}
                            </h4>
                            <p className="text-sm text-white/60">{persona.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}

                    <button
                      onClick={() => setShowCreatePersona(true)}
                      className="w-full text-left p-4 rounded-lg border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors text-white/60 hover:text-white flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                        <Plus size={20} />
                      </div>
                      <span className="text-sm font-medium">Create New Persona</span>
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'source' && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Add Sources (Optional)
                  </h3>
                  <p className="text-xs text-white/50 mb-4">
                    Paste source text or URLs to provide context for this session
                  </p>
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="e.g., Paste documentation, code snippets, or relevant URLs..."
                    rows={10}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {currentStep === 'persona' && (
                <button
                  onClick={handleNext}
                  disabled={!selectedPersonaId}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-medium rounded-lg transition-colors"
                >
                  Next
                </button>
              )}
              {currentStep === 'source' && (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                >
                  Create Session
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
