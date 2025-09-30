import React, { useMemo } from 'react';
import { parseChordPro } from '../services/chordproService';
import { ParsedLine } from '../types';
import { UI_STRINGS } from '../constants/es';

interface PreviewProps {
  content: string;
  hideChords: boolean;
  fontSize?: number;
}

const renderLine = (line: ParsedLine, index: number, hideChords: boolean): React.ReactElement => {
  if (line.type === 'empty') {
    return <div key={index} className="h-4"></div>;
  }
  
  if (line.type === 'comment') {
    return <p key={index} className="italic text-slate-400 my-2 bg-slate-800 p-2 rounded">{line.text}</p>
  }
  
  if (line.type === 'lyric' && line.segments && line.segments.length > 0) {
    return (
      <div key={index} className="mb-6 whitespace-pre-wrap leading-tight">
        {line.segments.map((segment, i) => {
          const hasChord = segment.chord && !hideChords;
          const lyric = segment.lyric || '';
          const isBold = segment.isBold;

          return (
            <span key={i} className={`inline-block relative align-bottom ${hideChords ? 'pt-0' : 'pt-5'}`}>
              {hasChord && (
                <span className="absolute top-0 left-0 font-bold text-sky-400 text-sm whitespace-nowrap">
                  {segment.chord}
                </span>
              )}
              <span className={`text-slate-200 ${isBold ? 'font-bold' : ''}`}>{lyric}</span>
              {/* If lyric is empty but there's a chord, create space for the chord to be positioned above */}
              {hasChord && lyric.trim() === '' && (
                <span className="opacity-0 select-none">{segment.chord}&nbsp;</span>
              )}
            </span>
          );
        })}
      </div>
    );
  }

  // Fallback for lines without segments (e.g., just lyrics)
  return <p key={index} className="text-slate-200 whitespace-pre-wrap mb-6">{line.text}</p>;
};


export const Preview: React.FC<PreviewProps> = ({ content, hideChords, fontSize = 16 }) => {
  const parsedSong = useMemo(() => {
    return parseChordPro(content);
  }, [content]);
  
  const metadata = [];
  if (parsedSong.key) {
    metadata.push(`${UI_STRINGS.KEY_LABEL}: ${parsedSong.key}`);
  }
  if (parsedSong.capo > 0) {
    metadata.push(`${UI_STRINGS.CAPO_ON_FRET} ${parsedSong.capo}`);
  }

  return (
    <div className="font-mono leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
      {metadata.length > 0 && (
        <p className="font-sans italic text-slate-300 font-semibold mb-6 border-l-4 border-sky-500 pl-3">
            {metadata.join(' | ')}
        </p>
      )}
      {parsedSong.lines.map((line, index) => renderLine(line, index, hideChords))}
    </div>
  );
};