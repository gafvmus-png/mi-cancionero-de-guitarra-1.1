export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  // Propiedades para el modo interpretación
  bpm?: number;
  timeSignature?: string;
  // backingTrack (base64) se elimina para usar IndexedDB
  backingTrackName?: string;
  duration?: number; // en segundos
}

export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type Notation = 'sharps' | 'flats';

export interface UserPrefs {
  notation: Notation;
}

export interface ParsedChord {
  chord: string;
  position: number;
}

export interface ParsedLine {
  type: 'lyric' | 'comment' | 'empty';
  text: string;
  chords?: ParsedChord[];
  segments?: Array<{ chord?: string; lyric: string; isBold?: boolean }>;
}

export interface ParsedSong {
  title: string;
  artist: string;
  key: string;
  capo: number;
  lines: ParsedLine[];
}

export interface ChordShape {
    baseFret: number;
    // Low E to high E string. 'x' = mute, 0 = open, number = fret
    positions: (number | 'x' | 0)[]; 
}

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
}