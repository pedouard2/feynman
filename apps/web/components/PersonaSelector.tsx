'use client';

import { DEFAULT_PERSONAS, getAllPersonas, Persona } from '../lib/personas';
import { useFeynmanStore } from '../stores/feynman';
import clsx from 'clsx';

const VOICE_EMOJIS: Record<string, string> = {
  nova: '🌟',
  alloy: '🔧',
  onyx: '🎓',
  echo: '🔊',
  fable: '📖',
  shimmer: '✨',
};

interface PersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  onSelect: () => void;
}

function PersonaCard({ persona, isSelected, onSelect }: PersonaCardProps) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'relative p-6 rounded-2xl border-2 transition-all duration-300 text-left w-full',
        'hover:scale-[1.02] hover:shadow-lg',
        isSelected
          ? 'border-white bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
          : 'border-white/20 bg-white/5 hover:border-white/40'
      )}
    >
      <div className="flex items-start gap-4">
        <div className={clsx(
          'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
          isSelected ? 'bg-white/20' : 'bg-white/10'
        )}>
          {VOICE_EMOJIS[persona.ttsVoice] || '🎤'}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{persona.name}</h3>
          <p className="text-white/60 text-sm mt-1">{persona.description}</p>
          <p className="text-white/40 text-xs mt-2 italic">{persona.conversationalStyle}</p>
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-green-400 animate-pulse" />
      )}
    </button>
  );
}

export default function PersonaSelector() {
  const { currentPersonaId, setCurrentPersonaId } = useFeynmanStore();
  const personas = getAllPersonas();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-white/70 text-sm font-medium uppercase tracking-wider mb-4 text-center">
        Choose Your Learning Partner
      </h2>
      <div className="flex flex-col gap-4">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            isSelected={currentPersonaId === persona.id}
            onSelect={() => setCurrentPersonaId(persona.id)}
          />
        ))}
      </div>
    </div>
  );
}
