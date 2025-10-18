import { ParsedSong, ParsedLine, Notation } from '../types';
import { transposeChord } from './chordService';

const parseLyricForBold = (lyric: string): Array<{ lyric: string; isBold: boolean }> => {
  if (!lyric.includes('*')) {
    return [{ lyric, isBold: false }];
  }

  const result: Array<{ lyric: string; isBold: boolean }> = [];
  const parts = lyric.split(/(\*[^*]+\*)/g).filter(Boolean);

  for (const part of parts) {
    if (part.startsWith('*') && part.endsWith('*')) {
      result.push({ lyric: part.slice(1, -1), isBold: true });
    } else {
      result.push({ lyric: part, isBold: false });
    }
  }
  return result;
};

export const parseChordPro = (text: string): ParsedSong => {
  const lines = text.split('\n');
  const parsedSong: ParsedSong = {
    title: 'Untitled',
    artist: 'Unknown',
    key: 'C',
    capo: 0,
    lines: [],
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Directives: {key: value} or {key}
    const directiveMatch = trimmedLine.match(/^\{([^:}]+)(?::\s*(.*?))?\s*\}/);
    if (directiveMatch) {
      const key = (directiveMatch[1] || '').trim().toLowerCase();
      const value = (directiveMatch[2] || '').trim();

      switch (key) {
        case 'title':
        case 't':
          parsedSong.title = value;
          break;
        case 'artist':
        case 'subtitle':
        case 'st':
          parsedSong.artist = value;
          break;
        case 'key':
        case 'k':
          parsedSong.key = value;
          break;
        case 'capo':
          const capoNum = parseInt(value, 10);
          if (!isNaN(capoNum)) parsedSong.capo = capoNum;
          break;
        case 'comment':
        case 'c':
          const capoNumFromC = parseInt(value, 10);
          if (key === 'c' && !isNaN(capoNumFromC) && value.match(/^\d+\s*$/)) {
            parsedSong.capo = capoNumFromC;
          } else {
            parsedSong.lines.push({ type: 'comment', text: value });
          }
          break;
      }
      continue;
    }

    // Comment lines: # This is a comment
     if (trimmedLine.startsWith('#')) {
      parsedSong.lines.push({
        type: 'comment',
        text: trimmedLine.substring(1).trim(),
      });
      continue;
    }

    if (trimmedLine === '') {
      parsedSong.lines.push({ type: 'empty', text: '' });
      continue;
    }
    
    // Lines with lyrics (and possibly chords)
    const segments: Array<{ chord?: string; lyric: string; isBold?: boolean }> = [];
    const parts = trimmedLine.split(/(\[[^\]]+\])/g);
    
    let i = 0;
    while(i < parts.length) {
        const part = parts[i];
        if (!part) {
            i++;
            continue;
        }

        if (part.startsWith('[')) {
            const chord = part.substring(1, part.length - 1);
            const nextPart = (i + 1 < parts.length) ? parts[i+1] : '';
            
            if (nextPart && !nextPart.startsWith('[')) {
                const lyricSegments = parseLyricForBold(nextPart);
                segments.push({ chord, ...lyricSegments[0] });
                if (lyricSegments.length > 1) {
                    segments.push(...lyricSegments.slice(1));
                }
                i += 2; // Consumed chord and lyric part
            } else {
                segments.push({ chord, lyric: '', isBold: false });
                i++; // Consumed chord only
            }
        } else {
            segments.push(...parseLyricForBold(part));
            i++; // Consumed lyric part
        }
    }
    
    parsedSong.lines.push({
        type: 'lyric',
        text: trimmedLine,
        segments: segments,
    });
  }

  return parsedSong;
};

export const transposeChordPro = (text: string, semitones: number, notation: Notation): string => {
  if (semitones === 0) return text;
  
  return text.replace(/\[([^\]]+)\]/g, (match, chord) => {
    const transposed = transposeChord(chord, semitones, notation);
    return `[${transposed}]`;
  });
};

export const extractUniqueChords = (text: string): string[] => {
  const chordRegex = /\[([^\]]+)\]/g;
  const chords = new Set<string>();
  let match;
  while ((match = chordRegex.exec(text)) !== null) {
    chords.add(match[1]);
  }
  return Array.from(chords).sort();
};