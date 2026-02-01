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
            className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-background rounded-2xl p-6 z-50 shadow-2xl border border-primary/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">New Session</h2>
                <p className="text-sm text-foreground/50 mt-1">
                  Step {currentStep === 'persona' ? '1' : '2'} of 2
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6 min-h-[300px]">
              {currentStep === 'persona' && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">
                    Select a Persona (Required)
                  </h3>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {personas.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => setSelectedPersonaId(persona.id)}
                        className={clsx(
                          'w-full text-left p-4 rounded-[10px] border transition-colors',
                          selectedPersonaId === persona.id
                            ? 'border-primary bg-primary/20'
                            : 'border-primary/20 bg-secondary/30 hover:bg-secondary/40'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-foreground font-bold text-sm flex-shrink-0">
                            {persona.name[0]}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">
                              {persona.name}
                            </h4>
                            <p className="text-sm text-foreground/60">{persona.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}

                    <button
                      onClick={() => setShowCreatePersona(true)}
                      className="w-full text-left p-4 rounded-[10px] border border-dashed border-primary/30 hover:border-primary/50 hover:bg-secondary/20 transition-colors text-foreground/60 hover:text-foreground flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center">
                        <Plus size={20} />
                      </div>
                      <span className="text-sm font-medium">Create New Persona</span>
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'source' && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Add Sources (Optional)
                  </h3>
                  <p className="text-xs text-foreground/50 mb-4">
                    Paste source text or URLs to provide context for this session
                  </p>
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="e.g., Paste documentation, code snippets, or relevant URLs..."
                    rows={10}
                    className="w-full bg-secondary/30 border border-primary/20 rounded-[10px] px-4 py-3 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-colors"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-foreground/60 hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              {currentStep === 'persona' && (
                <button
                  onClick={handleNext}
                  disabled={!selectedPersonaId}
                  className="px-6 py-2 bg-primary hover:bg-primary/80 disabled:bg-secondary/30 disabled:text-foreground/30 text-foreground font-medium rounded-[10px] transition-colors"
                >
                  Next
                </button>
              )}
              {currentStep === 'source' && (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-primary hover:bg-primary/80 text-foreground font-medium rounded-[10px] transition-colors"
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
