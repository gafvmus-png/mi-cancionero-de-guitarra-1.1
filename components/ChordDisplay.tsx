

import React from 'react';
import { CHORD_DATA } from '../services/chordService';
import { ChordDiagram } from './ChordDiagram';
import { UI_STRINGS } from '../constants/es';
import { ChordShape } from '../types';

interface ChordDisplayProps {
  chords: string[];
  customChords?: Record<string, ChordShape>;
}

export const ChordDisplay: React.FC<ChordDisplayProps> = ({ chords, customChords }) => {
  if (chords.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-sky-400 border-b border-slate-700 pb-2">{UI_STRINGS.CHORDS_TITLE}</h3>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-4 gap-x-2">
        {chords.map(chordName => {
          const shape = customChords?.[chordName] || CHORD_DATA[chordName];
          if (shape) {
            return <ChordDiagram key={chordName} name={chordName} shape={shape} />;
          }
          return (
            <div key={chordName} className="text-center opacity-50" title={UI_STRINGS.CHORD_DIAGRAM_NOT_AVAILABLE}>
                <h4 className="font-semibold text-sm mb-1 text-slate-400">{chordName}</h4>
                <div className="w-full aspect-square flex items-center justify-center bg-slate-800/50 rounded">
                    <span className="text-xs text-slate-500">N/A</span>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
