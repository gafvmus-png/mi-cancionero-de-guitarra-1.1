import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from './icons';
import { UI_STRINGS } from '../constants/es';
import { UserPrefs, ChordShape } from '../types';

interface ChordPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChord: (chord: string, shape?: ChordShape) => void;
  prefs: UserPrefs;
}

const notesSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const notesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const QUALITIES = [
  { display: 'Mayor', value: '' },
  { display: 'Menor', value: 'm' },
  { display: 'Aum', value: 'aug' },
  { display: 'Dim', value: 'dim' },
  { display: 'Sus2', value: 'sus2' },
  { display: 'Sus4', value: 'sus4' },
];

const EXTENSIONS = ['7', 'maj7', '6', '9', 'add9', '11', '13'];

const BuilderSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-4">
    <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">{title}</h3>
    <div className="flex flex-wrap gap-2">
      {children}
    </div>
  </div>
);

const FRET_COUNT = 5;
const STRING_COUNT = 6;

const initialCustomShape: ChordShape = {
    baseFret: 1,
    positions: ['x', 'x', 'x', 'x', 'x', 'x'],
};

interface VisualEditorProps {
    onChordChange: (name: string) => void;
    onCanInsert: (can: boolean) => void;
    onShapeUpdate: (shape: ChordShape) => void;
}

const VisualEditor: React.FC<VisualEditorProps> = ({ onChordChange, onCanInsert, onShapeUpdate }) => {
    const [name, setName] = useState('');
    const [shape, setShape] = useState<ChordShape>(initialCustomShape);

    useEffect(() => {
      onCanInsert(name.trim() !== '');
      onChordChange(name.trim());
    }, [name, onCanInsert, onChordChange]);
    
    useEffect(() => {
        onShapeUpdate(shape);
    }, [shape, onShapeUpdate]);

    const handleFretClick = (string: number, fret: number) => {
        setShape(prevShape => {
            const newPositions = [...prevShape.positions];
            const currentFret = newPositions[string];
            const clickedFretAbsolute = fret + prevShape.baseFret - 1;
            
            if (typeof currentFret === 'number' && currentFret === clickedFretAbsolute) {
                newPositions[string] = 0; // Toggle off -> open
            } else {
                newPositions[string] = clickedFretAbsolute; // Set fret
            }
            
            return { ...prevShape, positions: newPositions };
        });
    };

    const handleStatusClick = (string: number) => {
        setShape(prevShape => {
            const newPositions = [...prevShape.positions];
            const currentStatus = newPositions[string];
            if (currentStatus === 0) {
                newPositions[string] = 'x'; // Open -> Muted
            } else {
                 newPositions[string] = 0; // Muted or Fretted -> Open
            }
            return { ...prevShape, positions: newPositions };
        });
    };
    
    const handleBaseFretChange = (delta: number) => {
        setShape(prev => {
            const newBaseFret = Math.max(1, prev.baseFret + delta);
            return { ...prev, baseFret: newBaseFret };
        });
    };

    const resetShape = () => {
        setShape(initialCustomShape);
    };

    const FRET_HEIGHT = 22;
    const STRING_SPACING = 15;
    const DOT_RADIUS = 5;
    const width = (STRING_COUNT - 1) * STRING_SPACING + 40;
    const height = FRET_COUNT * FRET_HEIGHT + 30;

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="chord-name" className="text-sm font-semibold text-slate-400 mb-2 block uppercase tracking-wider">{UI_STRINGS.CHORD_NAME_LABEL}</label>
                <input
                    id="chord-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={UI_STRINGS.CHORD_NAME_PLACEHOLDER}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
            </div>
            <div className="flex items-center justify-center gap-4">
                <span className="text-sm font-semibold text-slate-400">{UI_STRINGS.BASE_FRET_LABEL}: {shape.baseFret}</span>
                <div className="flex">
                    <button onClick={() => handleBaseFretChange(-1)} disabled={shape.baseFret <= 1} className="px-3 py-1 bg-slate-700 rounded-l-md hover:bg-slate-600 disabled:opacity-50">-</button>
                    <button onClick={() => handleBaseFretChange(1)} className="px-3 py-1 bg-slate-700 rounded-r-md hover:bg-slate-600">+</button>
                </div>
            </div>
            <div className="flex justify-center">
                 <svg viewBox={`0 0 ${width} ${height}`} className="max-w-[200px] h-auto text-slate-400">
                    <g transform="translate(20, 25)">
                        {shape.baseFret > 1 && (
                            <text x={-8} y={FRET_HEIGHT * 0.8} fontSize="10" fill="currentColor" textAnchor="end">
                                {shape.baseFret}
                            </text>
                        )}
                        {/* Status indicators (open/muted) */}
                        {Array.from({ length: STRING_COUNT }).map((_, i) => {
                            const stringX = i * STRING_SPACING;
                            const status = shape.positions[i];
                            return (
                                <g key={`status-${i}`} onClick={() => handleStatusClick(i)} className="cursor-pointer">
                                    <rect x={stringX - STRING_SPACING/2} y={-20} width={STRING_SPACING} height={20} fill="transparent" />
                                    {status === 'x' && <path d={`M ${stringX - 4} -12 L ${stringX + 4} -4 M ${stringX - 4} -4 L ${stringX + 4} -12`} stroke="currentColor" strokeWidth={1.5} />}
                                    {status === 0 && <circle cx={stringX} cy={-8} r={DOT_RADIUS - 1.5} fill="none" stroke="currentColor" strokeWidth={1.5} />}
                                </g>
                            )
                        })}

                        {/* Frets & Strings */}
                        {Array.from({ length: FRET_COUNT + 1 }).map((_, i) => (
                            <line key={i} x1={0} y1={i * FRET_HEIGHT} x2={(STRING_COUNT - 1) * STRING_SPACING} y2={i * FRET_HEIGHT} stroke="currentColor" strokeWidth={i === 0 ? 1.5 : 0.5} />
                        ))}
                        {Array.from({ length: STRING_COUNT }).map((_, i) => (
                            <line key={i} x1={i * STRING_SPACING} y1={0} x2={i * STRING_SPACING} y2={FRET_COUNT * FRET_HEIGHT} stroke="currentColor" strokeWidth={0.5} />
                        ))}
                        
                        {/* Clickable areas and dots */}
                        {Array.from({ length: STRING_COUNT }).map((_, string) => 
                            Array.from({ length: FRET_COUNT }).map((_, fret) => {
                                const stringX = string * STRING_SPACING;
                                const fretY = (fret + 1) * FRET_HEIGHT - FRET_HEIGHT / 2;
                                const isSelected = shape.positions[string] === fret + shape.baseFret;
                                return (
                                    <g key={`${string}-${fret}`} onClick={() => handleFretClick(string, fret + 1)} className="cursor-pointer">
                                        <rect x={stringX - STRING_SPACING/2} y={fret * FRET_HEIGHT} width={STRING_SPACING} height={FRET_HEIGHT} fill="transparent"/>
                                        {isSelected && <circle cx={stringX} cy={fretY} r={DOT_RADIUS} className="text-sky-400" fill="currentColor" />}
                                    </g>
                                )
                            })
                        )}
                    </g>
                </svg>
            </div>
             <div className="text-center">
                 <button onClick={resetShape} className="px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors">
                    {UI_STRINGS.RESET_SHAPE_BUTTON}
                </button>
            </div>
        </div>
    );
};


export const ChordPickerModal: React.FC<ChordPickerModalProps> = ({ isOpen, onClose, onSelectChord, prefs }) => {
  const [view, setView] = useState<'builder' | 'visual'>('builder');

  // State for Quick Builder
  const [root, setRoot] = useState<string | null>(null);
  const [quality, setQuality] = useState<string>('');
  const [extensions, setExtensions] = useState<Set<string>>(new Set());
  const [bass, setBass] = useState<string | null>(null);

  // State for Visual Editor
  const [customChordToInsert, setCustomChordToInsert] = useState('');
  const [canInsertCustomChord, setCanInsertCustomChord] = useState(false);
  const customShapeRef = useRef<ChordShape>(initialCustomShape);

  const rootNotes = prefs.notation === 'flats' ? notesFlat : notesSharp;

  const builtChord = useMemo(() => {
    if (!root) return '';
    const extensionStr = EXTENSIONS.filter(ext => extensions.has(ext)).join('');
    const bassStr = bass ? `/${bass}` : '';
    return `${root}${quality}${extensionStr}${bassStr}`;
  }, [root, quality, extensions, bass]);
  
  const handleExtensionToggle = (ext: string) => {
    setExtensions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ext)) {
        newSet.delete(ext);
      } else {
        // Conflicting extensions logic
        if (ext === '7' && newSet.has('maj7')) newSet.delete('maj7');
        if (ext === 'maj7' && newSet.has('7')) newSet.delete('7');
        if (ext === 'sus2' && newSet.has('sus4')) newSet.delete('sus4');
        if (ext === 'sus4' && newSet.has('sus2')) newSet.delete('sus2');
        newSet.add(ext);
      }
      return newSet;
    });
  };

  const resetBuilder = () => {
    setRoot(null);
    setQuality('');
    setExtensions(new Set());
    setBass(null);
  };
  
  const handleInsert = () => {
    const chordToInsert = view === 'builder' ? builtChord : customChordToInsert;
    const shapeToInsert = view === 'builder' ? undefined : customShapeRef.current;
    if (chordToInsert) {
      onSelectChord(chordToInsert, shapeToInsert);
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetBuilder();
      setView('builder');
      setCustomChordToInsert('');
      setCanInsertCustomChord(false);
    }
  }, [isOpen]);

  const renderButton = (
    value: string,
    stateValue: string | null,
    setter: (val: string | null) => void,
    isToggle: boolean = false
  ) => {
    const isActive = isToggle ? stateValue === value : stateValue === value;
    const clickHandler = () => {
      if (isToggle && stateValue === value) {
        setter(null);
      } else {
        setter(value);
      }
    };
    return (
      <button
        onClick={clickHandler}
        className={`py-2 px-3 text-sm rounded-lg font-mono font-semibold transition-colors duration-150 min-w-[40px]
          ${isActive ? 'bg-sky-600 text-white scale-105' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'}`}
      >
        {value || 'Maj'}
      </button>
    );
  };
  
  const renderToggleButton = (
    value: string,
    stateSet: Set<string>,
    handler: (val: string) => void,
  ) => {
    const isActive = stateSet.has(value);
    return (
      <button
        onClick={() => handler(value)}
        className={`py-2 px-3 text-sm rounded-lg font-mono font-semibold transition-colors duration-150
          ${isActive ? 'bg-sky-600 text-white scale-105' : 'bg-slate-700 text-slate-100 hover:bg-slate-600'}`}
      >
        {value}
      </button>
    );
  };
  
  const canInsert = view === 'builder' ? !!builtChord : canInsertCustomChord;
  const chordPreview = view === 'builder' ? builtChord : customChordToInsert;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chord-builder-title"
        >
          <motion.div
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
              <h2 id="chord-builder-title" className="text-lg font-semibold text-sky-400">{UI_STRINGS.CHORD_BUILDER_TITLE}</h2>
              <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700" aria-label={UI_STRINGS.CLOSE_MODAL_ARIA_LABEL}>
                <CloseIcon />
              </button>
            </header>

            <div className="p-2 border-b border-slate-700 bg-slate-900/30 flex-shrink-0">
                <div className="flex rounded-lg bg-slate-700 p-1">
                  <button
                    onClick={() => setView('builder')}
                    className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${view === 'builder' ? 'bg-sky-600 text-white' : 'hover:bg-slate-600'}`}
                  >
                    {UI_STRINGS.CHORD_BUILDER_TAB}
                  </button>
                  <button
                    onClick={() => setView('visual')}
                    className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${view === 'visual' ? 'bg-sky-600 text-white' : 'hover:bg-slate-600'}`}
                  >
                    {UI_STRINGS.VISUAL_EDITOR_TAB}
                  </button>
                </div>
            </div>
            
            <div className="p-4 bg-slate-900/50 text-center flex-shrink-0">
              <span className="font-mono text-3xl font-bold text-white h-10 block">{chordPreview || '...'}</span>
            </div>

            <div className="p-6 overflow-y-auto">
              {view === 'builder' ? (
                <>
                  <BuilderSection title={UI_STRINGS.CHORD_BUILDER_ROOT_NOTE}>
                    {rootNotes.map(note => renderButton(note, root, setRoot))}
                  </BuilderSection>
                  
                  <BuilderSection title={UI_STRINGS.CHORD_BUILDER_QUALITY}>
                    {QUALITIES.map(q => renderButton(q.value, quality, setQuality))}
                  </BuilderSection>

                  <BuilderSection title={UI_STRINGS.CHORD_BUILDER_EXTENSIONS}>
                    {EXTENSIONS.map(ext => renderToggleButton(ext, extensions, handleExtensionToggle))}
                  </BuilderSection>

                  <BuilderSection title={UI_STRINGS.CHORD_BUILDER_BASS}>
                    {rootNotes.map(note => renderButton(note, bass, setBass, true))}
                  </BuilderSection>
                </>
              ) : (
                <VisualEditor 
                    onChordChange={setCustomChordToInsert} 
                    onCanInsert={setCanInsertCustomChord}
                    onShapeUpdate={(s) => customShapeRef.current = s}
                />
              )}
            </div>

            <footer className="flex justify-between items-center p-4 border-t border-slate-700 flex-shrink-0 bg-slate-800/50 rounded-b-xl">
              {view === 'builder' && (
                  <button onClick={resetBuilder} className="px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors">
                    {UI_STRINGS.CHORD_BUILDER_CLEAR}
                  </button>
              )}
              <div className="flex-grow"></div>
              <button onClick={handleInsert} disabled={!canInsert} className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                {UI_STRINGS.CHORD_BUILDER_INSERT}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
