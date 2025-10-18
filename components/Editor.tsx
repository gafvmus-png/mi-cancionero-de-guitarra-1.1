import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Song, ToastData, UserPrefs, Setlist, ChordShape } from '../types';
import { transposeChordPro, extractUniqueChords } from '../services/chordproService';
import { Preview } from './Preview';
import { ChordPickerModal } from './ChordPickerModal';
import { PerformanceMode } from './PerformanceMode';
import { PDFExportModal } from './PDFExportModal';
import { saveTrack, deleteTrack } from '../services/audioDbService';
import { SaveIcon, TransposeUpIcon, TransposeDownIcon, ChordIcon, PDFIcon, SpinnerIcon, EyeIcon, EyeOffIcon, MusicIcon, UploadCloudIcon, XCircleIcon, InfoIcon, RotateCcwIcon, ArrowLeftIcon, ExportIcon, MagicWandIcon } from './icons';
import { UI_STRINGS } from '../constants/es';
import { useDebounce } from '../hooks/useDebounce';
import { ChordDisplay } from './ChordDisplay';
import { CHORD_DATA } from '../services/chordService';

interface EditorProps {
  song: Song;
  onSave: (song: Song) => void;
  showToast: (toast: ToastData) => void;
  prefs: UserPrefs;
  onUpdatePrefs: (prefs: Partial<UserPrefs>) => void;
  setlistContext?: Setlist;
  onReturnToSetlist?: () => void;
}

const NON_EDITABLE_SONG_IDS = ['tutorial-1', 'chord-library-1'];

const highlightSyntax = (text: string) => {
  const escapeHtml = (unsafe: string) => 
    unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");

  let highlighted = escapeHtml(text)
    .replace(/\{([^}]+)\}/g, '<span class="text-green-400">{$1}</span>')
    .replace(/\[([^\]]+)\]/g, '<span class="text-sky-400 font-bold">[$1]</span>')
    .replace(/^(#.*)/gm, '<span class="text-slate-500 italic">$1</span>')
    .replace(/\*([^*]+)\*/g, '<span class="text-yellow-400 font-bold">$1</span>');

  return highlighted;
};


export const Editor: React.FC<EditorProps> = ({ song, onSave, showToast, prefs, onUpdatePrefs, setlistContext, onReturnToSetlist }) => {
  // Main song data
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [content, setContent] = useState(song.content);
  // Performance settings
  const [bpm, setBpm] = useState(song.bpm || '');
  const [timeSignature, setTimeSignature] = useState(song.timeSignature || '4/4');
  const [backingTrackName, setBackingTrackName] = useState(song.backingTrackName);
  const [duration, setDuration] = useState(song.duration);
  // Custom user data
  const [customChords, setCustomChords] = useState<Record<string, ChordShape>>({});

  // UI State
  const [isChordPickerOpen, setChordPickerOpen] = useState(false);
  const [isPDFModalOpen, setPDFModalOpen] = useState(false);
  const [isPerformanceMode, setPerformanceMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hideChords, setHideChords] = useState(false);
  const [lastCursorPosition, setLastCursorPosition] = useState<number | null>(null);
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [isSuggestingChords, setIsSuggestingChords] = useState(false);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const pdfWorkerRef = useRef<Worker | null>(null);

  const debouncedContent = useDebounce(content, 250);
  
  const isReadOnly = NON_EDITABLE_SONG_IDS.includes(song.id);

  const hasChanges = useMemo(() => {
    return title !== song.title || 
           artist !== song.artist || 
           content !== song.content ||
           Number(bpm || 0) !== (song.bpm || 0) ||
           timeSignature !== (song.timeSignature || '4/4') ||
           backingTrackName !== song.backingTrackName;
  }, [title, artist, content, bpm, timeSignature, backingTrackName, song]);

  const transposedContent = useMemo(
    () => transposeChordPro(content, transposeSteps, prefs.notation),
    [content, transposeSteps, prefs.notation]
  );
  
  const lineNumbers = useMemo(() => {
    const count = content.split('\n').length || 1;
    let lines = '';
    for (let i = 1; i <= count; i++) {
        lines += i + '\n';
    }
    return lines;
  }, [content]);

  const { chordPaletteChords, isUsingDefaultChords } = useMemo(() => {
      const chords = extractUniqueChords(content);
      if (chords.length > 0) {
          return { chordPaletteChords: chords, isUsingDefaultChords: false };
      }
      return { chordPaletteChords: ['C', 'G', 'Am', 'F', 'D', 'Em', 'A', 'E'], isUsingDefaultChords: true };
  }, [content]);

  const uniqueChordsForDiagrams = useMemo(() => {
      return extractUniqueChords(transposedContent);
  }, [transposedContent]);

  const highlightedContent = useMemo(() => highlightSyntax(debouncedContent), [debouncedContent]);
  
  const handleScroll = () => {
    if(textareaRef.current && highlightRef.current && lineNumbersRef.current) {
        const scrollTop = textareaRef.current.scrollTop;
        const scrollLeft = textareaRef.current.scrollLeft;
        highlightRef.current.scrollTop = scrollTop;
        highlightRef.current.scrollLeft = scrollLeft;
        lineNumbersRef.current.scrollTop = scrollTop;
    }
  };

  const handleSave = useCallback(() => {
    if (isReadOnly) return;
    const songDataToSave: Song = {
      ...song,
      title,
      artist,
      content,
      bpm: Number(bpm) || undefined,
      timeSignature: timeSignature || undefined,
      backingTrackName: backingTrackName || undefined,
      duration: duration || undefined,
    };
    onSave(songDataToSave);
  }, [onSave, song, title, artist, content, bpm, timeSignature, backingTrackName, duration, isReadOnly]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !isReadOnly) {
          handleSave();
        }
      }
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isReadOnly) setTransposeSteps(prev => prev + 1);
      }
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isReadOnly) setTransposeSteps(prev => prev - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, handleSave, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !isReadOnly) {
        e.preventDefault();
        e.returnValue = UI_STRINGS.UNSAVED_CHANGES_WARNING;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isReadOnly]);
  
  // Cleanup worker on component unmount
  useEffect(() => {
      return () => {
          if (pdfWorkerRef.current) {
              pdfWorkerRef.current.terminate();
          }
      };
  }, []);

  const handleOpenChordPicker = () => {
    if (textareaRef.current) {
      setLastCursorPosition(textareaRef.current.selectionStart);
    }
    setChordPickerOpen(true);
  };
  
  const insertTextAtCursor = useCallback((textToInsert: string) => {
    if (!textareaRef.current || isReadOnly) return;
    const { selectionStart, selectionEnd } = textareaRef.current;

    const newContent =
      content.substring(0, selectionStart) +
      textToInsert +
      content.substring(selectionEnd);
    
    setContent(newContent);
    
    const newCursorPos = selectionStart + textToInsert.length;
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content, isReadOnly]);

  const handleInsertChord = useCallback((chord: string, shape?: ChordShape) => {
    insertTextAtCursor(`[${chord}]`);
    if (shape) {
      setCustomChords(prev => ({
        ...prev,
        [chord]: shape,
      }));
    }
    setChordPickerOpen(false);
  }, [insertTextAtCursor]);
  
  const handleChordPaletteClick = (chord: string) => {
    insertTextAtCursor(`[${chord}]`);
  };

  const handleSuggestChords = async () => {
      if (!textareaRef.current || isReadOnly) return;
      const { selectionStart, selectionEnd } = textareaRef.current;
      
      if (selectionStart === selectionEnd) {
          showToast({ message: UI_STRINGS.TOAST_SELECT_TEXT_FIRST, type: 'info' });
          return;
      }

      const selectedText = content.substring(selectionStart, selectionEnd);
      setIsSuggestingChords(true);

      try {
          const { GoogleGenerativeAI } = await import('@google/genai');
          const ai = new GoogleGenerativeAI(process.env.API_KEY as string);
          const model = ai.getGenerativeModel({ model: "gemini-pro" });
          const prompt = `Eres un experto músico guitarrista. Analiza la siguiente letra de canción y añade acordes de guitarra en formato ChordPro (ej: [G]palabra). Retorna únicamente la letra con los acordes insertados. No añadas explicaciones, títulos o comentarios adicionales. La letra es:\n\n${selectedText}`;
          
          const result = await model.generateContent(prompt);
          const generationResponse = await result.response;
          const suggestedText = generationResponse.text();

          const newContent = 
              content.substring(0, selectionStart) + 
              suggestedText + 
              content.substring(selectionEnd);
          
          setContent(newContent);

      } catch (error) {
          console.error("Gemini API error:", error);
          showToast({ message: UI_STRINGS.TOAST_GEMINI_ERROR, type: 'error' });
      } finally {
          setIsSuggestingChords(false);
      }
  };
  
  // --- Audio File Handling with IndexedDB ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isReadOnly) return;

    if (file.size > 15 * 1024 * 1024) { // 15MB limit for IndexedDB for safety
        showToast({ message: UI_STRINGS.TOAST_AUDIO_FILE_TOO_LARGE, type: 'error' });
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const dataUrl = e.target?.result as string;
            await saveTrack(song.id, dataUrl, file.name);
            setBackingTrackName(file.name);

            const audio = new Audio(dataUrl);
            audio.onloadedmetadata = () => {
                setDuration(audio.duration);
                // Auto-save metadata when a new track is successfully uploaded
                const songDataToSave: Song = { ...song, title, artist, content, backingTrackName: file.name, duration: audio.duration };
                onSave(songDataToSave);
            };
        } catch (error) {
            console.error(error);
            showToast({ message: UI_STRINGS.TOAST_SAVE_ERROR, type: 'error' });
        }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTrack = async () => {
    if (isReadOnly) return;
    try {
        await deleteTrack(song.id);
        setBackingTrackName(undefined);
        setDuration(undefined);
        if(audioFileRef.current) {
            audioFileRef.current.value = '';
        }
        // Auto-save metadata when a track is removed
        const songDataToSave: Song = { ...song, title, artist, content, backingTrackName: undefined, duration: undefined };
        onSave(songDataToSave);
    } catch (error) {
        console.error(error);
        showToast({ message: UI_STRINGS.TOAST_SAVE_ERROR, type: 'error' });
    }
  };

  const handleExportSongJson = useCallback(() => {
    const songToExport: Song = {
      ...song,
      title,
      artist,
      content,
      bpm: Number(bpm) || undefined,
      timeSignature: timeSignature || undefined,
      backingTrackName: backingTrackName || undefined,
      duration: duration || undefined,
    };
    
    try {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(songToExport, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const fileName = `${title.replace(/ /g, '_')}.json`;
        link.download = fileName;
        link.click();
        showToast({ message: `${UI_STRINGS.TOAST_SONG_EXPORTED}: ${fileName}`, type: 'success' });
    } catch (error) {
        console.error("Failed to export song:", error);
        showToast({ message: UI_STRINGS.TOAST_EXPORT_ERROR, type: 'error' });
    }
}, [song, title, artist, content, bpm, timeSignature, backingTrackName, duration, showToast]);

  const handleExportToPDF = useCallback(async ({ columns, includeDiagrams }: { columns: 1 | 2, includeDiagrams: boolean }) => {
    if (!content) {
        showToast({message: UI_STRINGS.TOAST_PDF_NO_CONTENT, type: 'error'});
        return;
    }
    setPDFModalOpen(false);
    setIsExporting(true);

    if (pdfWorkerRef.current) {
        pdfWorkerRef.current.terminate();
    }
    
    const workerCode = `
      self.onmessage = (event) => {
        try {
          // --- SETUP & LIBRARIES ---
          try {
            self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
          } catch (e) {
            console.error('Failed to load jspdf:', e);
            self.postMessage({ error: 'Failed to load a required library (jspdf).' });
            return;
          }

          if(!self.jspdf) {
            self.postMessage({ error: 'jsPDF library not found.' });
            return;
          }
          
          const { jsPDF } = self.jspdf;

          const UI_STRINGS = { CHORDS_TITLE: "Acordes", CAPO_ON_FRET: "Capo en traste" };
          const CHORD_DATA = ${JSON.stringify(CHORD_DATA)};

          // --- HELPERS ---
          const parseLyricForBold = (lyric) => {
            if (!lyric || !lyric.includes('*')) { return [{ lyric: lyric || '', isBold: false }]; }
            const result = [];
            const parts = lyric.split(/(\\*[^\\*]+\\*)/g).filter(Boolean);
            for (const part of parts) {
              if (part.startsWith('*') && part.endsWith('*')) {
                result.push({ lyric: part.slice(1, -1), isBold: true });
              } else {
                result.push({ lyric: part, isBold: false });
              }
            }
            return result;
          };
          
          const parseChordPro = (text) => {
            const lines = text.split('\\n');
            const parsedSong = { title: 'Untitled', artist: 'Unknown', key: 'C', capo: 0, lines: [] };
            for (const line of lines) {
              const trimmedLine = line.trim();
              const directiveMatch = trimmedLine.match(/^\\{([^:}]+)(?::\\s*(.*?))?\\s*\\}/);
              if (directiveMatch) {
                const key = (directiveMatch[1] || '').trim().toLowerCase();
                const value = (directiveMatch[2] || '').trim();
                switch (key) {
                  case 'title': case 't': parsedSong.title = value; break;
                  case 'artist': case 'subtitle': case 'st': parsedSong.artist = value; break;
                  case 'key': case 'k': parsedSong.key = value; break;
                  case 'capo': const capoNum = parseInt(value, 10); if (!isNaN(capoNum)) parsedSong.capo = capoNum; break;
                }
                continue;
              }
              if (trimmedLine.startsWith('#')) {
                parsedSong.lines.push({ type: 'comment', text: trimmedLine.substring(1).trim() });
                continue;
              }
              if (trimmedLine === '') {
                parsedSong.lines.push({ type: 'empty', text: '' });
                continue;
              }
              const segments = [];
              const parts = trimmedLine.split(/(\\[[^\\]]+\\])/g);
              let i = 0;
              while (i < parts.length) {
                const part = parts[i];
                if (!part) { i++; continue; }
                if (part.startsWith('[')) {
                  const chord = part.substring(1, part.length - 1);
                  const nextPart = (i + 1 < parts.length) ? parts[i + 1] : '';
                  if (nextPart && !nextPart.startsWith('[')) {
                    const lyricSegments = parseLyricForBold(nextPart);
                    segments.push({ chord, ...lyricSegments[0] });
                    if (lyricSegments.length > 1) segments.push(...lyricSegments.slice(1));
                    i += 2;
                  } else {
                    segments.push({ chord, lyric: '', isBold: false }); i++;
                  }
                } else {
                  segments.push(...parseLyricForBold(part)); i++;
                }
              }
              parsedSong.lines.push({ type: 'lyric', text: trimmedLine, segments: segments });
            }
            return parsedSong;
          };

          const extractUniqueChords = (text) => {
            const chordRegex = /\\[([^\\]]+)\\]/g;
            const chords = new Set();
            let match;
            while ((match = chordRegex.exec(text)) !== null) {
              chords.add(match[1].split('/')[0]);
            }
            return Array.from(chords).sort();
          };
          
          const drawChordDiagramPDF = (pdfInstance, name, shape, x, y) => {
            const FRET_COUNT = 5, STRING_COUNT = 6, FRET_HEIGHT = 8, STRING_SPACING = 6, DOT_RADIUS = 1.5;
            const diagramWidth = (STRING_COUNT - 1) * STRING_SPACING;
            const diagramHeight = FRET_COUNT * FRET_HEIGHT;
            pdfInstance.setFont('helvetica', 'bold');
            pdfInstance.setFontSize(10);
            pdfInstance.text(name, x + diagramWidth / 2, y - 2, { align: 'center' });
            const startX = x, startY = y + 4;
            pdfInstance.setFont('helvetica', 'normal');
            pdfInstance.setFontSize(8);
            if (shape.baseFret > 1) pdfInstance.text(\`\${shape.baseFret}\`, startX - 2, startY + FRET_HEIGHT * 0.8, { align: 'right' });
            pdfInstance.setLineWidth(0.2);
            for (let i = 0; i <= FRET_COUNT; i++) pdfInstance.line(startX, startY + i * FRET_HEIGHT, startX + diagramWidth, startY + i * FRET_HEIGHT);
            pdfInstance.setLineWidth(0.5);
            pdfInstance.line(startX, startY, startX + diagramWidth, startY);
            pdfInstance.setLineWidth(0.2);
            for (let i = 0; i < STRING_COUNT; i++) pdfInstance.line(startX + i * STRING_SPACING, startY, startX + i * STRING_SPACING, startY + diagramHeight);
            const isBarre = (pos) => {
              const fretted = pos.filter(p => typeof p === 'number' && p > 0);
              if (fretted.length < 3) return null;
              const minFret = Math.min(...fretted);
              if (minFret === 0) return null;
              const notesOnMinFret = pos.filter(p => p === minFret).length;
              if (notesOnMinFret < 2) return null;
              const first = pos.indexOf(minFret); const last = pos.lastIndexOf(minFret);
              if ((last - first) <= 2) return null;
              let isPlausibleBarre = true;
              for (let i = first; i <= last; i++) {
                const stringFret = pos[i];
                if (stringFret === 'x' || stringFret === 0 || (typeof stringFret === 'number' && stringFret < minFret)) {
                  isPlausibleBarre = false; break;
                }
              }
              return isPlausibleBarre ? { fret: minFret, from: first, to: last } : null;
            };
            const barre = isBarre(shape.positions);
            if (barre) {
              const barreY = startY + (barre.fret - shape.baseFret + 1) * FRET_HEIGHT - FRET_HEIGHT / 2;
              const barreX = startX + barre.from * STRING_SPACING;
              const barreWidth = (barre.to - barre.from) * STRING_SPACING;
              pdfInstance.rect(barreX - DOT_RADIUS, barreY - DOT_RADIUS, barreWidth + 2 * DOT_RADIUS, 2 * DOT_RADIUS, 'F');
            }
            shape.positions.forEach((pos, i) => {
              const stringX = startX + i * STRING_SPACING;
              if (pos === 'x') pdfInstance.text('x', stringX, startY - 1, { align: 'center' });
              else if (pos === 0) pdfInstance.circle(stringX, startY - 2, DOT_RADIUS - 0.2, 'S');
              else if (typeof pos === 'number' && pos >= shape.baseFret) {
                if (barre && pos === barre.fret) return;
                const fretY = startY + (pos - shape.baseFret + 1) * FRET_HEIGHT - FRET_HEIGHT / 2;
                pdfInstance.circle(stringX, fretY, DOT_RADIUS, 'F');
              }
            });
          };

          // --- PDF Generation Logic ---
          const { content, title, artist, options, customChords } = event.data;
          const ALL_CHORD_DATA = { ...CHORD_DATA, ...(customChords || {}) };
          const { columns, includeDiagrams } = options;
          const pdf = new jsPDF({ unit: 'pt' });

          // --- STYLES & SIZES ---
          const FS_TITLE = 22, FS_ARTIST = 14, FS_META = 10, FS_BODY = 10, FS_SECTION = 10;
          const LINE_HEIGHT_BODY = 13, LINE_HEIGHT_SECTION = 16;
          const COLOR_TEXT = '#333333', COLOR_CHORD = '#0ea5e9', COLOR_ARTIST = '#666666';
          
          const parsedSong = parseChordPro(content);
          const pdfTitle = parsedSong.title !== 'Untitled' ? parsedSong.title : title;
          const pdfArtist = parsedSong.artist !== 'Unknown' ? parsedSong.artist : artist;
          
          // --- LAYOUT ---
          const pageHeight = pdf.internal.pageSize.height;
          const pageWidth = pdf.internal.pageSize.width;
          const margin = 40;
          const colWidth = (pageWidth - margin * 2 - (columns - 1) * 20) / columns;
          let y = margin;
          let col = 1;
          let x = margin;
          
          const checkPageBreak = (needed = 20) => {
            if (y > pageHeight - margin - needed) {
              if (columns === 2 && col === 1) {
                col = 2; x = margin + colWidth + 20; y = margin;
              } else {
                pdf.addPage(); col = 1; x = margin; y = margin;
              }
            }
          };

          // --- HEADER ---
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(FS_TITLE);
          pdf.setTextColor(COLOR_TEXT);
          pdf.text(pdfTitle, margin, y);
          y += FS_TITLE * 0.8;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(FS_ARTIST);
          pdf.setTextColor(COLOR_ARTIST);
          pdf.text(\`por \${pdfArtist}\`, margin, y);
          y += FS_ARTIST * 1.5;

          const metaInfo = [];
          if(parsedSong.key) metaInfo.push(\`Tono: \${parsedSong.key}\`);
          if(parsedSong.capo > 0) metaInfo.push(\`\${UI_STRINGS.CAPO_ON_FRET} \${parsedSong.capo}\`);
          if (metaInfo.length > 0) {
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(FS_META);
              pdf.setTextColor(COLOR_TEXT);
              pdf.text(metaInfo.join(' | '), margin, y);
              y += FS_META * 2;
          }

          // --- BODY ---
          for (const line of parsedSong.lines) {
            checkPageBreak(LINE_HEIGHT_BODY * 2);

            if (line.type === 'empty') { y += LINE_HEIGHT_BODY * 0.7; continue; }
            
            if (line.type === 'comment') {
                y += LINE_HEIGHT_SECTION * 0.5;
                checkPageBreak(LINE_HEIGHT_SECTION);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(FS_SECTION);
                pdf.setTextColor(COLOR_TEXT);
                pdf.text(line.text, x, y);
                y += LINE_HEIGHT_SECTION;
                continue;
            }

            if (line.type === 'lyric' && line.segments) {
                let currentX = x;
                const CHORD_Y_OFFSET = y;
                const LYRIC_Y_OFFSET = y + FS_BODY;

                const lineBreak = () => {
                    y += LINE_HEIGHT_BODY * 1.5;
                    checkPageBreak(LINE_HEIGHT_BODY * 1.5);
                    currentX = x;
                };

                for (const segment of line.segments) {
                    const chord = segment.chord || '';
                    const lyric = segment.lyric || '';
                    const isBold = segment.isBold || false;
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(FS_BODY);
                    const chordWidth = pdf.getStringUnitWidth(chord) * FS_BODY / pdf.internal.scaleFactor;
                    
                    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
                    pdf.setFontSize(FS_BODY);
                    const lyricWidth = pdf.getStringUnitWidth(lyric) * FS_BODY / pdf.internal.scaleFactor;
                    
                    const segmentWidth = Math.max(chordWidth, lyricWidth) + (lyric.endsWith(' ') ? 0 : 2);
                    
                    if (currentX > x && currentX + segmentWidth > x + colWidth) {
                        lineBreak();
                    }
                    
                    if (chord) {
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(FS_BODY);
                        pdf.setTextColor(COLOR_CHORD);
                        pdf.text(chord, currentX, CHORD_Y_OFFSET);
                    }
                    
                    if (lyric) {
                        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
                        pdf.setFontSize(FS_BODY);
                        pdf.setTextColor(COLOR_TEXT);
                        pdf.text(lyric, currentX, LYRIC_Y_OFFSET);
                    }
                    
                    currentX += segmentWidth;
                }
                y += LINE_HEIGHT_BODY * 1.5;
            }
          }
          
          // --- DIAGRAMS ---
          const availableChords = extractUniqueChords(content).filter(c => ALL_CHORD_DATA[c]);
          if (includeDiagrams && availableChords.length > 0) {
              y += 10;
              checkPageBreak(80);
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(14);
              pdf.setTextColor(COLOR_TEXT);
              pdf.text(UI_STRINGS.CHORDS_TITLE, x, y);
              y += 20;

              const diagramBlockWidth = 65, diagramBlockHeight = 75;
              const diagramsPerLine = Math.max(1, Math.floor(colWidth / diagramBlockWidth));
              let diagramCountInLine = 0;

              for (const chordName of availableChords) {
                  if (ALL_CHORD_DATA[chordName]) {
                      if (diagramCountInLine >= diagramsPerLine) {
                          y += diagramBlockHeight;
                          diagramCountInLine = 0;
                      }
                      checkPageBreak(diagramBlockHeight);
                      const currentX = x + (diagramCountInLine * diagramBlockWidth);
                      drawChordDiagramPDF(pdf, chordName, ALL_CHORD_DATA[chordName], currentX, y);
                      diagramCountInLine++;
                  }
              }
            }
          
          const pdfBlob = pdf.output('blob');
          self.postMessage(pdfBlob);
        } catch (error) {
          console.error('PDF Worker Error:', error);
          self.postMessage({ error: error.message });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    const worker = new Worker(workerUrl);
    pdfWorkerRef.current = worker;
    
    worker.onmessage = (event: MessageEvent<Blob | { error: string }>) => {
        if (event.data instanceof Blob) {
            const pdfBlob = event.data;
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/ /g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast({message: UI_STRINGS.TOAST_PDF_EXPORT_SUCCESS, type: 'success'});
        } else if (event.data.error) {
            console.error('Error from PDF Worker:', event.data.error);
            showToast({message: UI_STRINGS.TOAST_PDF_EXPORT_ERROR, type: 'error'});
        }

        setIsExporting(false);
        URL.revokeObjectURL(workerUrl); // Clean up the blob URL
        worker.terminate();
        pdfWorkerRef.current = null;
    };

    worker.onerror = (error) => {
        console.error('Error constructing/running PDF Worker:', error);
        showToast({message: UI_STRINGS.TOAST_PDF_EXPORT_ERROR, type: 'error'});
        setIsExporting(false);
        URL.revokeObjectURL(workerUrl); // Clean up
        worker.terminate();
        pdfWorkerRef.current = null;
    };

    worker.postMessage({
        content: transposedContent,
        title,
        artist,
        customChords,
        options: { columns, includeDiagrams }
    });
  }, [title, artist, content, showToast, transposedContent, customChords]);


  const currentSongStateForPerformanceMode = useMemo(() => ({
    ...song,
    title,
    artist,
    content,
    bpm: Number(bpm) || undefined,
    timeSignature: timeSignature || undefined,
    backingTrackName,
    duration
  }), [song, title, artist, content, bpm, timeSignature, backingTrackName, duration]);

  return (
    <div className="flex flex-col h-full">
      {isReadOnly && (
        <div className="p-2 bg-yellow-900/50 border-b border-yellow-700 text-yellow-300 text-center flex items-center justify-center gap-2 text-sm">
            <InfoIcon />
            <span>{UI_STRINGS.READ_ONLY_SONG_INFO}</span>
        </div>
      )}
      {setlistContext && onReturnToSetlist && (
        <div className="p-2 bg-slate-700/50 border-b border-slate-600 text-center">
          <button onClick={onReturnToSetlist} className="flex items-center justify-center gap-2 text-sm text-sky-300 hover:text-sky-200 w-full">
            <ArrowLeftIcon/> {UI_STRINGS.RETURN_TO_SETLIST_BUTTON} '{setlistContext.name}'
          </button>
        </div>
      )}
      <header className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onFocus={e => e.target.value === UI_STRINGS.NEW_SONG_TITLE && setTitle('')}
              onBlur={e => e.target.value.trim() === '' && setTitle(UI_STRINGS.NEW_SONG_TITLE)}
              placeholder={UI_STRINGS.TITLE_PLACEHOLDER}
              readOnly={isReadOnly}
              className={`flex-grow px-3 py-2 text-lg font-bold bg-transparent border-b-2 border-slate-600 focus:outline-none focus:border-sky-400 ${isReadOnly ? 'cursor-default' : ''}`}
            />
            <input
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              onFocus={e => e.target.value === UI_STRINGS.NEW_SONG_ARTIST && setArtist('')}
              onBlur={e => e.target.value.trim() === '' && setArtist(UI_STRINGS.NEW_SONG_ARTIST)}
              placeholder={UI_STRINGS.ARTIST_PLACEHOLDER}
              readOnly={isReadOnly}
              className={`w-full md:w-1/3 px-3 py-2 bg-transparent border-b-2 border-slate-600 focus:outline-none focus:border-sky-400 ${isReadOnly ? 'cursor-default' : ''}`}
            />
        </div>
      </header>
      
      <div className="p-2 bg-slate-900/30 border-b border-slate-700 flex items-center gap-2 flex-wrap">
        <button onClick={handleSave} disabled={!hasChanges || isReadOnly} className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${hasChanges && !isReadOnly ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>
          <SaveIcon /> {hasChanges ? UI_STRINGS.SAVE_CHANGES_BUTTON : UI_STRINGS.SAVED_BUTTON}
        </button>
        <button onClick={handleOpenChordPicker} disabled={isReadOnly} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <ChordIcon /> {UI_STRINGS.INSERT_CHORD_BUTTON}
        </button>
        <button onClick={handleSuggestChords} disabled={isSuggestingChords || isReadOnly} title={UI_STRINGS.SUGGEST_CHORDS_TOOLTIP} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors disabled:bg-purple-800 disabled:cursor-wait">
            {isSuggestingChords ? <SpinnerIcon /> : <MagicWandIcon />} {isSuggestingChords ? UI_STRINGS.SUGGESTING_CHORDS_BUTTON : UI_STRINGS.SUGGEST_CHORDS_BUTTON}
        </button>
        <button onClick={() => setPDFModalOpen(true)} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:bg-red-800 disabled:cursor-wait">
            {isExporting ? <SpinnerIcon /> : <PDFIcon />} {isExporting ? UI_STRINGS.EXPORTING_PDF_BUTTON : UI_STRINGS.EXPORT_PDF_BUTTON}
        </button>
        <button onClick={handleExportSongJson} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          <ExportIcon /> {UI_STRINGS.EXPORT_JSON_BUTTON}
        </button>
        <div className="h-6 w-px bg-slate-700 mx-2"></div>
        <button onClick={() => setTransposeSteps(prev => prev + 1)} disabled={isReadOnly} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><TransposeUpIcon/> {UI_STRINGS.TRANSPOSE_UP_BUTTON}</button>
        <button onClick={() => setTransposeSteps(prev => prev - 1)} disabled={isReadOnly} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><TransposeDownIcon/> {UI_STRINGS.TRANSPOSE_DOWN_BUTTON}</button>
        {transposeSteps !== 0 && (
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-sky-300">
                {transposeSteps > 0 ? '+' : ''}{transposeSteps}
              </span>
              <button onClick={() => setTransposeSteps(0)} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-600 rounded-full transition-colors" title={UI_STRINGS.RESET_TRANSPOSE_BUTTON_TITLE}>
                <RotateCcwIcon />
              </button>
            </div>
          )}
        <div className="flex items-center rounded-lg bg-slate-700 ml-2">
            <button onClick={() => onUpdatePrefs({ notation: 'sharps'})} className={`px-3 py-2 text-sm font-bold rounded-l-lg transition-colors ${prefs.notation === 'sharps' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>♯</button>
            <button onClick={() => onUpdatePrefs({ notation: 'flats'})} className={`px-3 py-2 text-sm font-bold rounded-r-lg transition-colors ${prefs.notation === 'flats' ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>♭</button>
        </div>
        <div className="h-6 w-px bg-slate-700 mx-2"></div>
        <button onClick={() => setHideChords(prev => !prev)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors" title={UI_STRINGS.TOGGLE_CHORDS_VIEW_TITLE}>{hideChords ? <EyeOffIcon/> : <EyeIcon/>} {hideChords ? UI_STRINGS.SHOW_CHORDS_BUTTON : UI_STRINGS.HIDE_CHORDS_BUTTON}</button>
        <button onClick={() => setPerformanceMode(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"><MusicIcon /> {UI_STRINGS.PERFORMANCE_MODE_BUTTON}</button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
        <div className="flex flex-col gap-2 h-full overflow-hidden">
            <div className="px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-2">
                    {isUsingDefaultChords ? UI_STRINGS.COMMON_CHORDS_TITLE : UI_STRINGS.CHORD_PALETTE_TITLE}
                </h4>
                <div className="flex flex-wrap gap-2">
                    {chordPaletteChords.map(chord => (
                        <button key={chord} onClick={() => handleChordPaletteClick(chord)} disabled={isReadOnly} className="px-3 py-1 text-sm font-mono font-semibold bg-slate-700 text-slate-100 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {chord}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex w-full flex-1 border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
                <div ref={lineNumbersRef} className="p-4 font-mono text-sm text-right text-slate-500 bg-slate-800/60 select-none overflow-y-hidden leading-6">
                    <pre className="min-h-full">{lineNumbers}</pre>
                </div>
                <div className="relative flex-1">
                    <div
                      ref={highlightRef}
                      className="absolute inset-0 p-4 font-mono text-sm whitespace-pre-wrap pointer-events-none overflow-auto leading-6"
                      dangerouslySetInnerHTML={{ __html: highlightedContent }}
                    />
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      onScroll={handleScroll}
                      onFocus={e => e.target.value === UI_STRINGS.NEW_SONG_CONTENT && setContent('')}
                      onBlur={e => e.target.value.trim() === '' && setContent(UI_STRINGS.NEW_SONG_CONTENT)}
                      placeholder={UI_STRINGS.EDITOR_PLACEHOLDER}
                      readOnly={isReadOnly}
                      className={`absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent focus:outline-none resize-none caret-white text-transparent leading-6 ${isReadOnly ? 'cursor-default' : ''}`}
                      spellCheck="false" autoComplete="off" autoCorrect="off" autoCapitalize="off"
                    />
                </div>
            </div>
        </div>

        <div className="h-full overflow-y-auto bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-sky-400 border-b border-slate-700 pb-2 sticky top-0 bg-slate-800/50 py-2 -mt-4 pt-4 z-10">{UI_STRINGS.PREVIEW_TITLE}</h3>
            <Preview content={transposedContent} hideChords={hideChords} />
          </div>
          <div className="border-t border-slate-700 pt-4"><ChordDisplay chords={uniqueChordsForDiagrams} customChords={customChords} /></div>
          <div className="border-t border-slate-700 pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-sky-400 border-b border-slate-700 pb-2">{UI_STRINGS.SONG_SETTINGS_TITLE}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{UI_STRINGS.BPM_LABEL}</label>
                <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} readOnly={isReadOnly} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">{UI_STRINGS.TIME_SIGNATURE_LABEL}</label>
                <input type="text" value={timeSignature} onChange={e => setTimeSignature(e.target.value)} readOnly={isReadOnly} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{UI_STRINGS.BACKING_TRACK_LABEL}</label>
              {backingTrackName ? (
                <div className="flex items-center justify-between bg-slate-700 p-2 rounded-lg">
                  <p className="text-sm text-slate-200 truncate">{backingTrackName}</p>
                  <button onClick={handleRemoveTrack} disabled={isReadOnly} className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"><XCircleIcon /></button>
                </div>
              ) : (
                <>
                  <input type="file" accept="audio/*" ref={audioFileRef} onChange={handleFileChange} className="hidden" />
                  <button onClick={() => audioFileRef.current?.click()} disabled={isReadOnly} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><UploadCloudIcon /> {UI_STRINGS.UPLOAD_TRACK_BUTTON}</button>
                </>
              )}
              <div className="flex items-start gap-2 mt-2 text-xs text-slate-400">
                <InfoIcon />
                <span>{UI_STRINGS.AUDIO_SAVED_INFO}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChordPickerModal isOpen={isChordPickerOpen} onClose={() => setChordPickerOpen(false)} onSelectChord={handleInsertChord} prefs={prefs} songKey={song.key} />
      <PDFExportModal isOpen={isPDFModalOpen} onClose={() => setPDFModalOpen(false)} onExport={handleExportToPDF}/>
      {isPerformanceMode && (<PerformanceMode song={currentSongStateForPerformanceMode} onClose={() => setPerformanceMode(false)}/>)}
    </div>
  );
};