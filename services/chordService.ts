import { ChordShape, Notation } from '../types';

const notesSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const notesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const enharmonicEquivalents: { [key: string]: string } = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
    'B#': 'C', 'E#': 'F'
};

const getNoteIndex = (note: string): number => {
    // First, try to find in sharps
    let index = notesSharp.indexOf(note);
    if (index !== -1) return index;

    // Then, try to find in flats
    index = notesFlat.indexOf(note);
    if (index !== -1) return index;
    
    // Finally, try enharmonic equivalents
    const normalizedNote = enharmonicEquivalents[note];
    if (normalizedNote) {
        return notesSharp.indexOf(normalizedNote);
    }
    return -1;
};

export const transposeChord = (chord: string, semitones: number, notation: Notation = 'sharps'): string => {
    const parts = chord.split('/');
    const mainChord = parts[0];
    const bassNote = parts.length > 1 ? parts[1] : null;

    const transposeNote = (note: string): string => {
        const noteIndex = getNoteIndex(note);
        if (noteIndex === -1) return note; // Can't transpose, return original
        const newIndex = (noteIndex + semitones + 12) % 12;
        return notation === 'flats' ? notesFlat[newIndex] : notesSharp[newIndex];
    };

    const chordRegex = /^([A-G][#b]?)(.*)$/;
    const mainMatch = mainChord.match(chordRegex);

    if (!mainMatch) return chord;

    const [, mainRoot, suffix] = mainMatch;
    const newMainRoot = transposeNote(mainRoot);
    let newChord = newMainRoot + suffix;

    if (bassNote) {
        const bassMatch = bassNote.match(chordRegex);
        if (bassMatch) {
            const newBass = transposeNote(bassMatch[1]);
            newChord += '/' + newBass;
        } else {
            newChord += '/' + bassNote;
        }
    }

    return newChord;
};

// --- New Chord Naming Logic ---

// EADGBe from low E (string 0) to high e (string 5)
const STRING_TUNING = [4, 9, 2, 7, 11, 4]; // indices in notesSharp

const CHORD_FORMULAS = new Map<string, number[]>([
    // Most common first for priority
    ['', [0, 4, 7]], // Major
    ['m', [0, 3, 7]], // Minor
    ['7', [0, 4, 7, 10]], // Dominant 7
    ['m7', [0, 3, 7, 10]], // Minor 7
    ['maj7', [0, 4, 7, 11]], // Major 7
    ['sus2', [0, 2, 7]],
    ['sus4', [0, 5, 7]],
    ['dim', [0, 3, 6]],
    ['aug', [0, 4, 8]],
    ['m7b5', [0, 3, 6, 10]], // Half-diminished
    ['dim7', [0, 3, 6, 9]],
    ['6', [0, 4, 7, 9]],
    ['m6', [0, 3, 7, 9]],
    ['add9', [0, 4, 7, 2]],
    ['madd9', [0, 3, 7, 2]],
    ['9', [0, 4, 7, 10, 2]],
    ['m9', [0, 3, 7, 10, 2]],
    ['maj9', [0, 4, 7, 11, 2]],
]);

const getNoteFromFret = (stringIndex: number, fret: number, notation: Notation): string => {
    if (fret < 0) return '';
    const openNoteIndex = STRING_TUNING[stringIndex];
    const noteIndex = (openNoteIndex + fret) % 12;
    return notation === 'flats' ? notesFlat[noteIndex] : notesSharp[noteIndex];
}

const getNotesFromShape = (shape: ChordShape, notation: Notation): { note: string, stringIndex: number }[] => {
    const notes: { note: string, stringIndex: number }[] = [];
    shape.positions.forEach((fret, stringIndex) => {
        if (typeof fret === 'number' && fret >= 0) {
            const note = getNoteFromFret(stringIndex, fret, notation);
            if (note) {
                notes.push({ note, stringIndex });
            }
        }
    });
    return notes;
};


export const getChordNameFromShape = (shape: ChordShape, notation: Notation, songKey?: string): string | null => {
    const notesWithPosition = getNotesFromShape(shape, notation);
    if (notesWithPosition.length === 0) return null;

    const uniqueNotes = Array.from(new Set(notesWithPosition.map(n => n.note)));
    if (uniqueNotes.length < 2) return uniqueNotes[0] || null;

    const bassNote = notesWithPosition.sort((a,b) => a.stringIndex - b.stringIndex)[0].note;
    
    let bestGuess = { name: '', score: -1 };

    for (const potentialRoot of uniqueNotes) {
        const rootIndex = getNoteIndex(potentialRoot);
        if (rootIndex === -1) continue;

        const intervals = new Set(uniqueNotes.map(note => {
            const noteIndex = getNoteIndex(note);
            return (noteIndex - rootIndex + 12) % 12;
        }));

        for (const [quality, formulaIntervals] of CHORD_FORMULAS.entries()) {
            const formulaSet = new Set(formulaIntervals);
            if (formulaSet.size === intervals.size && [...formulaSet].every(i => intervals.has(i))) {
                let score = 100;
                score -= quality.length; // Shorter names are better (m vs m7b5)
                score -= formulaIntervals.length; // Simpler chords are better

                if (potentialRoot === bassNote) {
                    score += 20; // Big bonus for non-inversions
                }
                
                // TODO: Add scoring based on songKey diatonic relationship

                if (score > bestGuess.score) {
                    const name = potentialRoot + quality + (potentialRoot !== bassNote ? `/${bassNote}` : '');
                    bestGuess = { name, score };
                }
            }
        }
    }
    
    // Fallback if no perfect match is found (e.g., for single notes or dyads)
    if(bestGuess.score === -1 && uniqueNotes.length > 0) {
        return uniqueNotes[0];
    }
    
    return bestGuess.name || null;
}


// --- Existing exports ---

export const ALL_CHORDS = [
  'A', 'A6', 'A7', 'A7(13)', 'A7(13-)', 'A7b13', 'Aadd9', 'Am', 'Am6', 'Am7', 'Amaj7', 'Amaj9', 'Asus2', 'Asus4', 'Adim', 'Adim7', 'Aaug', 'Am/G',
  'Ab', 'Ab7', 'Abmaj7', 'Abm', 'Abm7', 'Abaug',
  'B', 'B7', 'B7b9', 'Bm', 'Bm7', 'Bmaj7', 'Bsus2', 'Bsus4', 'Bdim', 'Bdim7', 'Baug',
  'Bb', 'Bb6', 'Bb7', 'Bb7M', 'Bbmaj7', 'Bbm', 'Bbm7', 'Bbsus2', 'Bbsus4', 'Bbdim', 'Bbdim7', 'Bbaug',
  'C', 'C6', 'C7', 'C7(9)', 'C9', 'Cadd9', 'Cm', 'Cm7', 'Cmaj7', 'Cmaj9', 'Csus4', 'Cdim', 'Cdim7', 'Caug', 'C/E', 'C/G',
  'C#', 'C#m', 'C#m7',
  'D', 'D6', 'D7', 'D7M(9)', 'D7b9', 'D9', 'Dadd9', 'Dm', 'Dm7', 'Dmaj7', 'Dmaj9', 'Dsus2', 'Dsus4', 'Ddim', 'Ddim7', 'Daug', 'D/A', 'D/F#',
  'Db', 'Db7', 'Dbmaj7', 'Dbm', 'Dbm7', 'Dbaug',
  'E', 'E7', 'E7(9)', 'E9', 'Eadd9', 'Em', 'Em7', 'Em9', 'Emaj7', 'Esus2', 'Esus4', 'Edim', 'Edim7', 'Eaug',
  'Eb', 'Eb7', 'Ebmaj7', 'Ebm', 'Ebm7', 'Ebaug',
  'F', 'F6', 'F6(9)', 'F7', 'F7(13)', 'F13', 'F6/9', 'Fm', 'Fm7', 'Fmaj7', 'Fsus2', 'Fsus4', 'Fdim', 'Fdim7', 'Faug',
  'F#', 'F#7', 'F#7/C#', 'F#m', 'F#m7', 'F#m7b5', 'F#dim7',
  'Gb', 'Gb7', 'Gbmaj7',
  'G', 'G6', 'G7', 'G13', 'Gadd9', 'Gm', 'Gm7', 'Gmaj7', 'Gsus2', 'Gsus4', 'Gdim', 'Gdim7', 'Gaug', 'G/B', 'G/D',
  'G#m', 'G#m7'
].sort();


export const CHORD_DATA: Record<string, ChordShape> = {
    'A': { baseFret: 1, positions: ['x', 0, 2, 2, 2, 0] },
    'A6': { baseFret: 1, positions: ['x', 0, 2, 2, 2, 2] },
    'A7': { baseFret: 1, positions: ['x', 0, 2, 0, 2, 0] },
    'A7(13)': { baseFret: 1, positions: ['x', 0, 2, 0, 2, 2] },
    'A7(13-)': { baseFret: 1, positions: ['x', 0, 2, 0, 2, 1] },
    'A7b13': { baseFret: 1, positions: ['x', 0, 2, 0, 2, 1] },
    'Aadd9': { baseFret: 1, positions: ['x', 0, 2, 4, 2, 0] },
    'Am': { baseFret: 1, positions: ['x', 0, 2, 2, 1, 0] },
    'Am6': { baseFret: 1, positions: ['x', 0, 2, 2, 1, 2] },
    'Am7': { baseFret: 1, positions: ['x', 0, 2, 0, 1, 0] },
    'Am9': { baseFret: 5, positions: ['x', 0, 7, 5, 0, 0] },
    'Amaj7': { baseFret: 1, positions: ['x', 0, 2, 1, 2, 0] },
    'Amaj9': { baseFret: 1, positions: ['x', 0, 2, 1, 2, 4] },
    'Asus2': { baseFret: 1, positions: ['x', 0, 2, 2, 0, 0] },
    'Asus4': { baseFret: 1, positions: ['x', 0, 2, 2, 3, 0] },
    'Adim': { baseFret: 1, positions: ['x', 0, 1, 2, 1, 'x'] },
    'Adim7': { baseFret: 1, positions: ['x', 0, 1, 2, 1, 2] },
    'Aaug': { baseFret: 1, positions: ['x', 0, 3, 2, 2, 1] },
    'Am/G': { baseFret: 1, positions: [3, 0, 2, 2, 1, 0] },

    'Ab': { baseFret: 4, positions: [4, 6, 6, 5, 4, 4] },
    'Ab7': { baseFret: 4, positions: [4, 6, 4, 5, 4, 4] },
    'Abmaj7': { baseFret: 4, positions: ['x', 'x', 1, 1, 1, 3] },
    'Abm': { baseFret: 4, positions: [4, 6, 6, 4, 4, 4] },
    'Abm7': { baseFret: 4, positions: [4, 6, 4, 4, 4, 4] },
    'Abaug': { baseFret: 1, positions: ['x', 'x', 2, 1, 1, 0] },

    'Bb': { baseFret: 1, positions: ['x', 1, 3, 3, 3, 1] },
    'Bb6': { baseFret: 1, positions: ['x', 1, 3, 3, 3, 3] },
    'Bb7': { baseFret: 1, positions: ['x', 1, 3, 1, 3, 1] },
    'Bb7M': { baseFret: 1, positions: ['x', 1, 3, 2, 3, 1] },
    'Bbmaj7': { baseFret: 1, positions: ['x', 1, 3, 2, 3, 1] },
    'Bbm': { baseFret: 1, positions: ['x', 1, 3, 3, 2, 1] },
    'Bbm7': { baseFret: 1, positions: ['x', 1, 3, 1, 2, 1] },
    'Bbsus2': { baseFret: 1, positions: ['x', 1, 3, 3, 1, 1] },
    'Bbsus4': { baseFret: 1, positions: ['x', 1, 3, 3, 4, 1] },
    'Bbdim': { baseFret: 1, positions: ['x', 1, 2, 3, 2, 'x'] },
    'Bbdim7': { baseFret: 1, positions: ['x', 1, 2, 0, 2, 0] },
    'Bbaug': { baseFret: 1, positions: ['x', 1, 0, 3, 3, 'x'] },
    
    'B': { baseFret: 2, positions: ['x', 2, 4, 4, 4, 2] },
    'B7': { baseFret: 1, positions: ['x', 2, 1, 2, 0, 2] },
    'B7b9': { baseFret: 1, positions: ['x', 2, 1, 2, 1, 2] },
    'Bm': { baseFret: 2, positions: ['x', 2, 4, 4, 3, 2] },
    'Bm7': { baseFret: 2, positions: ['x', 2, 4, 2, 3, 2] },
    'Bmaj7': { baseFret: 2, positions: ['x', 2, 4, 3, 4, 2] },
    'Bsus2': { baseFret: 2, positions: ['x', 2, 4, 4, 2, 2] },
    'Bsus4': { baseFret: 2, positions: ['x', 2, 4, 4, 5, 2] },
    'Bdim': { baseFret: 1, positions: ['x', 2, 3, 4, 3, 'x'] },
    'Bdim7': { baseFret: 1, positions: ['x', 2, 0, 1, 0, 1] },
    'Baug': { baseFret: 1, positions: ['x', 2, 1, 0, 0, 3] },
    
    'C': { baseFret: 1, positions: ['x', 3, 2, 0, 1, 0] },
    'C6': { baseFret: 1, positions: ['x', 3, 2, 2, 1, 0] },
    'C7': { baseFret: 1, positions: ['x', 3, 2, 3, 1, 0] },
    'C7(9)': { baseFret: 1, positions: ['x', 3, 2, 3, 3, 0] },
    'C9': { baseFret: 3, positions: ['x', 3, 2, 3, 3, 3] },
    'Cadd9': { baseFret: 1, positions: ['x', 3, 2, 0, 3, 3] },
    'Cm': { baseFret: 3, positions: ['x', 3, 5, 5, 4, 3] },
    'Cm7': { baseFret: 3, positions: ['x', 3, 5, 3, 4, 3] },
    'Cmaj7': { baseFret: 1, positions: ['x', 3, 2, 0, 0, 0] },
    'Cmaj9': { baseFret: 3, positions: ['x', 3, 2, 4, 3, 'x'] },
    'Csus4': { baseFret: 1, positions: ['x', 3, 3, 0, 1, 1] },
    'Cdim': { baseFret: 3, positions: ['x', 3, 4, 5, 4, 'x'] },
    'Cdim7': { baseFret: 2, positions: ['x', 3, 4, 2, 4, 'x'] },
    'Caug': { baseFret: 1, positions: ['x', 3, 2, 1, 1, 'x'] },
    'C/E': { baseFret: 1, positions: [0, 3, 2, 0, 1, 0] },
    'C/G': { baseFret: 1, positions: [3, 3, 2, 0, 1, 0] },
    
    'C#': { baseFret: 4, positions: ['x', 4, 6, 6, 6, 4] },
    'C#m': { baseFret: 4, positions: ['x', 4, 6, 6, 5, 4] },
    'C#m7': { baseFret: 4, positions: ['x', 4, 6, 4, 5, 4] },
    'Db': { baseFret: 4, positions: ['x', 4, 6, 6, 6, 4] },
    'Db7': { baseFret: 4, positions: ['x', 4, 6, 4, 6, 4] },
    'Dbmaj7': { baseFret: 4, positions: ['x', 4, 6, 5, 6, 4] },
    'Dbm': { baseFret: 4, positions: ['x', 4, 6, 6, 5, 4] },
    'Dbm7': { baseFret: 4, positions: ['x', 4, 6, 4, 5, 4] },
    'Dbaug': { baseFret: 1, positions: ['x', 4, 3, 2, 2, 'x'] },

    'D': { baseFret: 1, positions: ['x', 'x', 0, 2, 3, 2] },
    'D6': { baseFret: 1, positions: ['x', 'x', 0, 2, 0, 2] },
    'D7': { baseFret: 1, positions: ['x', 'x', 0, 2, 1, 2] },
    'D7M(9)': { baseFret: 4, positions: ['x', 5, 4, 6, 5, 'x'] },
    'D7b9': { baseFret: 4, positions: ['x', 5, 4, 5, 4, 'x'] },
    'D9': { baseFret: 1, positions: ['x', 'x', 0, 2, 1, 0] },
    'Dadd9': { baseFret: 1, positions: ['x', 'x', 0, 2, 3, 0] },
    'Dm': { baseFret: 1, positions: ['x', 'x', 0, 2, 3, 1] },
    'Dm7': { baseFret: 1, positions: ['x', 'x', 0, 2, 1, 1] },
    'Dmaj7': { baseFret: 1, positions: ['x', 'x', 0, 2, 2, 2] },
    'Dmaj9': { baseFret: 5, positions: ['x', 5, 4, 6, 5, 5] },
    'Dsus2': { baseFret: 1, positions: ['x', 'x', 0, 2, 3, 0] },
    'Dsus4': { baseFret: 1, positions: ['x', 'x', 0, 2, 3, 3] },
    'Ddim': { baseFret: 1, positions: ['x', 'x', 0, 1, 3, 1] },
    'Ddim7': { baseFret: 4, positions: ['x', 5, 6, 4, 6, 'x'] },
    'Daug': { baseFret: 1, positions: ['x', 'x', 0, 3, 3, 2] },
    'D/A': { baseFret: 1, positions: ['x', 0, 0, 2, 3, 2] },
    'D/F#': { baseFret: 1, positions: [2, 'x', 0, 2, 3, 2] },

    'Eb': { baseFret: 6, positions: ['x', 6, 8, 8, 8, 6] },
    'Eb7': { baseFret: 6, positions: ['x', 6, 8, 6, 8, 6] },
    'Ebmaj7': { baseFret: 6, positions: ['x', 6, 8, 7, 8, 6] },
    'Ebm': { baseFret: 6, positions: ['x', 6, 8, 8, 7, 6] },
    'Ebm7': { baseFret: 6, positions: ['x', 6, 8, 6, 7, 6] },
    'Ebaug': { baseFret: 1, positions: ['x', 'x', 1, 0, 0, 3] },
    
    'E': { baseFret: 1, positions: [0, 2, 2, 1, 0, 0] },
    'E7': { baseFret: 1, positions: [0, 2, 0, 1, 0, 0] },
    'E7(9)': { baseFret: 1, positions: [0, 2, 0, 1, 3, 0] },
    'E9': { baseFret: 1, positions: [0, 2, 0, 1, 0, 2] },
    'Eadd9': { baseFret: 1, positions: [0, 2, 2, 1, 0, 2] },
    'Em': { baseFret: 1, positions: [0, 2, 2, 0, 0, 0] },
    'Em7': { baseFret: 1, positions: [0, 2, 0, 0, 0, 0] },
    'Em9': { baseFret: 1, positions: [0, 2, 0, 0, 0, 2] },
    'Emaj7': { baseFret: 1, positions: [0, 2, 1, 1, 0, 0] },
    'Esus2': { baseFret: 1, positions: [0, 2, 4, 4, 0, 0] },
    'Esus4': { baseFret: 1, positions: [0, 2, 2, 2, 0, 0] },
    'Edim': { baseFret: 1, positions: [0, 1, 2, 0, 'x', 'x'] },
    'Edim7': { baseFret: 1, positions: [0, 1, 2, 0, 2, 0] },
    'Eaug': { baseFret: 1, positions: [0, 3, 2, 1, 1, 0] },

    'F': { baseFret: 1, positions: [1, 3, 3, 2, 1, 1] },
    'F6': { baseFret: 1, positions: [1, 3, 3, 2, 3, 1] },
    'F6(9)': { baseFret: 1, positions: [1, 3, 1, 2, 3, 'x'] },
    'F7': { baseFret: 1, positions: [1, 3, 1, 2, 1, 1] },
    'F7(13)': { baseFret: 1, positions: [1, 3, 1, 2, 3, 1] },
    'F13': { baseFret: 1, positions: [1, 3, 1, 2, 3, 1] },
    'F6/9': { baseFret: 1, positions: [1, 'x', 1, 2, 3, 3] },
    'Fm': { baseFret: 1, positions: [1, 3, 3, 1, 1, 1] },
    'Fm7': { baseFret: 1, positions: [1, 3, 1, 1, 1, 1] },
    'Fmaj7': { baseFret: 1, positions: ['x', 'x', 3, 2, 1, 0] },
    'Fsus2': { baseFret: 1, positions: [1, 3, 3, 0, 1, 1] },
    'Fsus4': { baseFret: 1, positions: [1, 3, 3, 3, 1, 1] },
    'Fdim': { baseFret: 1, positions: [1, 2, 3, 1, 'x', 'x'] },
    'Fdim7': { baseFret: 1, positions: [1, 2, 1, 2, 'x', 'x'] },
    'Faug': { baseFret: 1, positions: [1, 0, 3, 2, 2, 'x'] },
    
    'F#': { baseFret: 2, positions: [2, 4, 4, 3, 2, 2] },
    'F#7': { baseFret: 2, positions: [2, 4, 2, 3, 2, 2] },
    'F#7/C#': { baseFret: 4, positions: ['x', 4, 4, 3, 5, 'x'] },
    'F#m': { baseFret: 2, positions: [2, 4, 4, 2, 2, 2] },
    'F#m7': { baseFret: 2, positions: [2, 4, 2, 2, 2, 2] },
    'F#m7b5': { baseFret: 1, positions: [2, 'x', 2, 2, 1, 'x'] },
    'F#dim7': { baseFret: 2, positions: [2, 3, 2, 3, 'x', 'x'] },
    'Gb': { baseFret: 2, positions: [2, 4, 4, 3, 2, 2] },
    'Gb7': { baseFret: 2, positions: [2, 4, 2, 3, 2, 2] },
    'Gbmaj7': { baseFret: 2, positions: [2, 4, 3, 3, 2, 2] },
    'Gbaug': { baseFret: 2, positions: ['x', 'x', 0, 3, 3, 2] },

    'G': { baseFret: 1, positions: [3, 2, 0, 0, 0, 3] },
    'G6': { baseFret: 1, positions: [3, 2, 0, 0, 0, 0] },
    'G7': { baseFret: 1, positions: [3, 2, 0, 0, 0, 1] },
    'G13': { baseFret: 3, positions: [3, 5, 3, 4, 5, 3] },
    'Gadd9': { baseFret: 1, positions: [3, 2, 0, 2, 0, 3] },
    'Gm': { baseFret: 3, positions: [3, 5, 5, 3, 3, 3] },
    'Gm7': { baseFret: 3, positions: [3, 5, 3, 3, 3, 3] },
    'Gmaj7': { baseFret: 1, positions: [3, 2, 0, 0, 0, 2] },
    'Gsus2': { baseFret: 1, positions: [3, 0, 0, 0, 3, 3] },
    'Gsus4': { baseFret: 1, positions: [3, 3, 0, 0, 1, 3] },
    'Gdim': { baseFret: 3, positions: [3, 4, 5, 3, 'x', 'x'] },
    'Gdim7': { baseFret: 3, positions: [3, 4, 2, 3, 'x', 'x'] },
    'Gaug': { baseFret: 1, positions: [3, 2, 1, 0, 0, 3] },
    'G/B': { baseFret: 1, positions: ['x', 2, 0, 0, 3, 3] },
    'G/D': { baseFret: 1, positions: ['x', 'x', 0, 0, 0, 3] },

    'G#m': { baseFret: 4, positions: [4, 6, 6, 4, 4, 4] },
    'G#m7': { baseFret: 4, positions: [4, 6, 4, 4, 4, 4] },
    'Dmaj7(V)': { baseFret: 5, positions: ['x', 5, 7, 6, 7, 'x'] }, // Example of a new voicing
};
