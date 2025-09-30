import React from 'react';
import { ChordShape } from '../types';

interface ChordDiagramProps {
  name: string;
  shape: ChordShape;
}

export const ChordDiagram: React.FC<ChordDiagramProps> = ({ name, shape }) => {
  const FRET_COUNT = 5;
  const STRING_COUNT = 6;
  const FRET_HEIGHT = 18;
  const STRING_SPACING = 12;
  const DOT_RADIUS = 4;
  
  const width = (STRING_COUNT - 1) * STRING_SPACING + 25; // More horizontal space
  const height = FRET_COUNT * FRET_HEIGHT + 25;
  
  const isBarre = (pos: (number | 'x' | 0)[]) => {
    const fretted = pos.filter(p => typeof p === 'number' && p > 0) as number[];
    if (fretted.length < 3) return null;

    const minFret = Math.min(...fretted);
    if (minFret === 0) return null;

    const notesOnMinFret = pos.filter(p => p === minFret).length;
    if (notesOnMinFret < 2) return null;

    const first = pos.indexOf(minFret);
    const last = pos.lastIndexOf(minFret);

    if ((last - first) <= 2) { // Heuristic: avoid A-shape etc. Barre must span > 3 strings
      return null;
    }

    let isPlausibleBarre = true;
    for (let i = first; i <= last; i++) {
      const stringFret = pos[i];
      if (stringFret === 'x' || stringFret === 0 || (typeof stringFret === 'number' && stringFret < minFret)) {
        isPlausibleBarre = false;
        break;
      }
    }
    
    if (isPlausibleBarre) {
        return { fret: minFret, from: first, to: last };
    }
    
    return null;
  }

  const barre = isBarre(shape.positions);

  return (
    <div className="text-center">
      <h4 className="font-semibold text-sm mb-1 text-slate-200">{name}</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <g transform="translate(15, 20)"> {/* Shift diagram right */}
          {/* Base Fret Label */}
          {shape.baseFret > 1 && (
            <text x={-8} y={FRET_HEIGHT * 0.8} fontSize="10" fill="currentColor" textAnchor="end">{shape.baseFret}</text>
          )}

          {/* Frets */}
          {Array.from({ length: FRET_COUNT + 1 }).map((_, i) => (
            <line key={i} x1={0} y1={i * FRET_HEIGHT} x2={(STRING_COUNT - 1) * STRING_SPACING} y2={i * FRET_HEIGHT} stroke="currentColor" strokeWidth={i === 0 ? 2 : 0.5} />
          ))}

          {/* Strings */}
          {Array.from({ length: STRING_COUNT }).map((_, i) => (
            <line key={i} x1={i * STRING_SPACING} y1={0} x2={i * STRING_SPACING} y2={FRET_COUNT * FRET_HEIGHT} stroke="currentColor" strokeWidth={0.5} />
          ))}

          {/* Barre */}
          {barre && (
             <rect 
                x={barre.from * STRING_SPACING - DOT_RADIUS} 
                y={(barre.fret - shape.baseFret + 1) * FRET_HEIGHT - FRET_HEIGHT / 2 - DOT_RADIUS}
                width={(barre.to - barre.from) * STRING_SPACING + DOT_RADIUS * 2}
                height={DOT_RADIUS * 2}
                rx={DOT_RADIUS}
                fill="currentColor"
             />
          )}

          {/* Dots and open/muted strings */}
          {shape.positions.map((pos, i) => {
            const stringX = i * STRING_SPACING;
            if (pos === 0) {
              return <circle key={i} cx={stringX} cy={-8} r={DOT_RADIUS -1} fill="none" stroke="currentColor" strokeWidth={1} />;
            }
            if (pos === 'x') {
              return <path key={i} d={`M ${stringX - 3} -11 L ${stringX + 3} -5 M ${stringX - 3} -5 L ${stringX + 3} -11`} stroke="currentColor" strokeWidth={1.5} />;
            }
            if (typeof pos === 'number' && pos >= shape.baseFret) {
              if (barre && pos === barre.fret) return null; // Don't draw dots on barre
              const fretY = (pos - shape.baseFret + 1) * FRET_HEIGHT - FRET_HEIGHT / 2;
              return <circle key={i} cx={stringX} cy={fretY} r={DOT_RADIUS} fill="currentColor" />;
            }
            return null;
          })}
        </g>
      </svg>
    </div>
  );
};