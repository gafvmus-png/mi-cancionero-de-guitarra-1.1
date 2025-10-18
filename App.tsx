import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Song, UserPrefs, ToastData, Setlist } from './types';
import { SongList } from './components/SongList';
import { Editor } from './components/Editor';
import { Welcome } from './components/Welcome';
import { ConfirmModal } from './components/ConfirmModal';
import { Toast } from './components/Toast';
import { PlusIcon, MoreVerticalIcon, ExportIcon, ImportIcon, ClipboardListIcon, MusicIcon, FileTextIcon } from './components/icons';
import { UI_STRINGS } from './constants/es';
import { AnimatePresence, motion } from 'framer-motion';
import { SetlistList } from './components/SetlistList';
import { SetlistEditor } from './components/SetlistEditor';
import { importSongFromPdf } from './services/pdfImportService';

const initialSongTutorial: Song = {
  id: 'tutorial-1',
  title: 'Guía de Uso - Cancionero',
  artist: 'Tu App de Guitarra',
  key: 'C',
  content: `{title: Guía de Uso - Cancionero}
{artist: Tu App de Guitarra}

# ¡Bienvenido a tu Cancionero Digital!
Esta es una canción de ejemplo para mostrarte cómo funciona el formato ChordPro.

---

# 1. Directivas
{c: Las directivas definen los metadatos de la canción.}

Las directivas, entre llaves \`{}\`, definen metadatos. Las más comunes como \`{key: ...}\` y \`{capo: ...}\` se mostrarán al inicio de la vista previa. Otras como \`{title: ...}\` se usarán en la exportación a PDF.

{capo: 2}
{key: G}

---

# 2. Acordes y Letra

Los acordes se escriben entre corchetes \`[]\` justo antes de la sílaba donde cambian.

[C]Esta es una línea de [G]letra con [Am]acordes [F]incluidos.
No te preocupes si un acorde queda solo, la app lo entenderá.
[C] [G] [Am] [F]

---

# 3. Comentarios y Secciones

Puedes añadir comentarios o títulos de sección de dos maneras:
1. Usando el símbolo \`#\` al inicio de la línea.
2. Usando la directiva \`{c: ...}\` o \`{comment: ...}\` para secciones.

¡Recuerda usar llaves \`{}\` para directivas y corchetes \`[]\` para acordes!

# Intro
{c: Coro}
*Esto es un coro en negrita*:
[C]Ojos de cielo, [G]ojos de cielo...

---

# Funciones de la App

*   **Guardar:** Usa el botón (Ctrl+S) para guardar tus cambios.
*   **Asistente IA:** Selecciona un trozo de letra sin acordes y usa el botón de la varita mágica (🪄) para que la IA sugiera los acordes por ti.
*   **Insertar Acorde:** Usa el constructor para crear y añadir cualquier acorde.
*   **Transportar:** Sube o baja el tono de toda la canción con los botones de transposición.
*   **Exportar a PDF:** Genera un PDF profesional de tu canción, ¡incluso con diagramas de acordes!
*   **Modo Interpretación:** Entra en un modo sin distracciones para tocar en vivo, con auto-scroll, metrónomo y más.

¡Explora y crea tu repertorio perfecto!`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const initialSongChordLibrary: Song = {
  id: 'chord-library-1',
  title: 'Librería de Acordes',
  artist: 'Diagramas Disponibles',
  key: 'C',
  content: `{title: Librería de Acordes}
{artist: Diagramas Disponibles}

# Acordes Mayores
[A] [B] [C] [D] [E] [F] [G]
[Ab] [Bb] [Db] [Eb] [Gb]

# Acordes Menores (m)
[Am] [Bm] [Cm] [Dm] [Em] [Fm] [Gm]
[Abm] [Bbm] [Dbm] [Ebm] [Gbm]

# Acordes de Séptima (7)
[A7] [B7] [C7] [D7] [E7] [F7] [G7]
[Ab7] [Bb7] [Db7] [Eb7] [Gb7]

# Acordes de Séptima Mayor (maj7)
[Amaj7] [Bmaj7] [Cmaj7] [Dmaj7] [Emaj7] [Fmaj7] [Gmaj7]
[Abmaj7] [Bbmaj7] [Dbmaj7] [Ebmaj7] [Gbmaj7]

# Acordes Menores con Séptima (m7)
[Am7] [Bm7] [Cm7] [Dm7] [Em7] [Fm7] [Gm7]
[Bbm7] [C#m7] [Ebm7] [F#m7] [G#m7]

# Acordes Aumentados (aug)
[Aaug] [Baug] [Caug] [Daug] [Eaug] [Faug] [Gaug]
[Abaug] [Bbaug] [Dbaug] [Ebaug] [Gbaug]

# Acordes Disminuidos (dim, dim7)
[Adim] [Bdim] [Cdim] [Ddim] [Edim] [Fdim] [Gdim]
[Adim7] [Bdim7] [Cdim7] [Ddim7] [Edim7] [Fdim7] [Gdim7]

# Acordes con Suspensiones (sus2, sus4)
[Asus2] [Asus4] [Bsus2] [Bsus4] [Csus4] [Dsus2] [Dsus4] [Esus2] [Esus4] [Fsus2] [Fsus4] [Gsus2] [Gsus4] [Bbsus2] [Bbsus4]

# Acordes con Extensiones (6, 9, add9)
[A6] [Aadd9] [Am6]
[C6] [Cadd9]
[D6] [D9] [Dadd9]
[Eadd9] [Em9]
[F6]
[G6] [Gadd9]

# Acordes con Bajo Alterado (Inversiones)
[C/E] [C/G] [D/F#] [G/B] [Am/G]`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const NON_EDITABLE_SONG_IDS = ['tutorial-1', 'chord-library-1'];


const App: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  
  const [activeView, setActiveView] = useState<'songs' | 'setlists'>('songs');
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeSetlistContext, setActiveSetlistContext] = useState<string | null>(null);

  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [setlistToDelete, setSetlistToDelete] = useState<Setlist | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [prefs, setPrefs] = useState<UserPrefs>({ notation: 'sharps' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [songsToImport, setSongsToImport] = useState<Song[] | null>(null);
  const [setlistsToImport, setSetlistsToImport] = useState<Setlist[] | null>(null);

  const importSongFileRef = useRef<HTMLInputElement>(null);
  const importSetlistFileRef = useRef<HTMLInputElement>(null);
  const importPdfFileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage
  useEffect(() => {
    try {
      const storedSongs = localStorage.getItem('guitar-songbook-songs');
      const parsedSongs = storedSongs ? JSON.parse(storedSongs) : [];
      if (parsedSongs.length > 0) {
        setSongs(parsedSongs);
        setActiveItemId(parsedSongs[0].id);
      } else {
        const initialSongs = [initialSongTutorial, initialSongChordLibrary];
        setSongs(initialSongs);
        setActiveItemId(initialSongTutorial.id);
      }
      
      const storedSetlists = localStorage.getItem('guitar-songbook-setlists');
      if (storedSetlists) setSetlists(JSON.parse(storedSetlists));

      const storedPrefs = localStorage.getItem('guitar-songbook-prefs');
      if (storedPrefs) {
        const parsedPrefs = JSON.parse(storedPrefs);
        if(parsedPrefs.notation === 'sharps' || parsedPrefs.notation === 'flats') {
          setPrefs(parsedPrefs);
        }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      showToast({ message: UI_STRINGS.TOAST_LOAD_ERROR, type: 'error' });
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('guitar-songbook-songs', JSON.stringify(songs));
    } catch (error) {
      console.error("Failed to save songs to localStorage:", error);
       showToast({ message: UI_STRINGS.TOAST_SAVE_ERROR_QUOTA, type: 'error' });
    }
  }, [songs]);

  useEffect(() => {
    try {
      localStorage.setItem('guitar-songbook-setlists', JSON.stringify(setlists));
    } catch (error) {
      console.error("Failed to save setlists to localStorage:", error);
      showToast({ message: UI_STRINGS.TOAST_SAVE_ERROR, type: 'error' });
    }
  }, [setlists]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUpdatePrefs = (newPrefs: Partial<UserPrefs>) => {
    setPrefs(prev => {
        const updatedPrefs = { ...prev, ...newPrefs };
        try {
            localStorage.setItem('guitar-songbook-prefs', JSON.stringify(updatedPrefs));
        } catch (error) {
            console.error("Failed to save user preferences:", error);
        }
        return updatedPrefs;
    });
  };

  const showToast = (toastData: ToastData) => {
    setToast(toastData);
  };

  // --- Song Management ---
  const handleNewSong = useCallback(() => {
    const newSong: Song = {
      id: Date.now().toString(),
      title: UI_STRINGS.NEW_SONG_TITLE,
      artist: UI_STRINGS.NEW_SONG_ARTIST,
      key: 'C',
      content: UI_STRINGS.NEW_SONG_CONTENT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSongs(prevSongs => [...prevSongs, newSong]);
    setActiveView('songs');
    setActiveItemId(newSong.id);
    setActiveSetlistContext(null);
  }, []);

  const handleSaveSong = useCallback((updatedSong: Song) => {
    setSongs(prevSongs => 
      prevSongs.map(song => 
        song.id === updatedSong.id 
          ? { ...song, ...updatedSong, updatedAt: new Date().toISOString() } 
          : song
      )
    );
    showToast({ message: UI_STRINGS.TOAST_SONG_SAVED, type: 'success' });
  }, []);

  const handleDeleteSongRequest = useCallback((songId: string) => {
    if (NON_EDITABLE_SONG_IDS.includes(songId)) {
      showToast({ message: UI_STRINGS.TOAST_GUIDE_SONG_DELETE_ERROR, type: 'info' });
      return;
    }
    const song = songs.find(s => s.id === songId);
    if(song) setSongToDelete(song);
  }, [songs]);

  const confirmDeleteSong = useCallback(() => {
    if (!songToDelete) return;
    setSongs(prevSongs => prevSongs.filter(song => song.id !== songToDelete.id));
    // Also remove from any setlists
    setSetlists(prevSetlists => prevSetlists.map(setlist => ({
        ...setlist,
        songIds: setlist.songIds.filter(id => id !== songToDelete.id)
    })));
    if (activeView === 'songs' && activeItemId === songToDelete.id) {
      setActiveItemId(null);
    }
    showToast({ message: UI_STRINGS.TOAST_SONG_DELETED, type: 'success' });
    setSongToDelete(null);
  }, [songToDelete, activeItemId, activeView]);

  // --- Setlist Management ---
  const handleNewSetlist = useCallback(() => {
    const newSetlist: Setlist = {
        id: `setlist-${Date.now()}`,
        name: UI_STRINGS.NEW_SETLIST_TITLE,
        songIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    setSetlists(prev => [newSetlist, ...prev]);
    setActiveView('setlists');
    setActiveItemId(newSetlist.id);
    showToast({ message: UI_STRINGS.TOAST_SETLIST_CREATED, type: 'success' });
  }, []);

  const handleUpdateSetlist = useCallback((updatedSetlist: Setlist) => {
    setSetlists(prev => prev.map(s => s.id === updatedSetlist.id ? { ...updatedSetlist, updatedAt: new Date().toISOString() } : s));
    showToast({ message: UI_STRINGS.TOAST_SETLIST_UPDATED, type: 'success' });
  }, []);

  const handleDeleteSetlistRequest = useCallback((setlistId: string) => {
    const setlist = setlists.find(s => s.id === setlistId);
    if(setlist) setSetlistToDelete(setlist);
  }, [setlists]);

  const confirmDeleteSetlist = useCallback(() => {
    if (!setlistToDelete) return;
    setSetlists(prev => prev.filter(s => s.id !== setlistToDelete.id));
    if (activeView === 'setlists' && activeItemId === setlistToDelete.id) {
        setActiveItemId(null);
    }
    showToast({ message: UI_STRINGS.TOAST_SETLIST_DELETED, type: 'success' });
    setSetlistToDelete(null);
  }, [setlistToDelete, activeItemId, activeView]);


  // --- Import/Export ---
  const handleExportSongs = useCallback(() => {
    if (songs.length === 0) {
      showToast({ message: UI_STRINGS.TOAST_NO_SONGS_TO_EXPORT, type: 'info' });
      return;
    }
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(songs, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "cancionero_canciones.json";
      link.click();
      showToast({ message: UI_STRINGS.TOAST_EXPORT_SUCCESS, type: 'success' });
    } catch (error) {
      console.error("Failed to export songs:", error);
      showToast({ message: UI_STRINGS.TOAST_EXPORT_ERROR, type: 'error' });
    }
    setIsMenuOpen(false);
  }, [songs]);
  
  const handleExportSetlists = useCallback(() => {
    if (setlists.length === 0) {
      showToast({ message: UI_STRINGS.TOAST_NO_SETLISTS_TO_EXPORT, type: 'info' });
      return;
    }
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(setlists, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = "cancionero_repertorios.json";
      link.click();
      showToast({ message: UI_STRINGS.TOAST_EXPORT_SETLISTS_SUCCESS, type: 'success' });
    } catch (error) {
      console.error("Failed to export setlists:", error);
      showToast({ message: UI_STRINGS.TOAST_EXPORT_ERROR, type: 'error' });
    }
    setIsMenuOpen(false);
  }, [setlists]);

  const handleImportSongsClick = () => {
    importSongFileRef.current?.click();
    setIsMenuOpen(false);
  };
  
  const handleImportSetlistsClick = () => {
    importSetlistFileRef.current?.click();
    setIsMenuOpen(false);
  };
  
  const handleImportPdfClick = () => {
    importPdfFileRef.current?.click();
    setIsMenuOpen(false);
  };

  const handleSongFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not a string");
        }
        const importedSongs = JSON.parse(text);

        if (!Array.isArray(importedSongs) || !importedSongs.every(s => s.id && s.title && s.content)) {
          throw new Error("Invalid file format");
        }
        
        setSongsToImport(importedSongs);

      } catch (error) {
        console.error("Failed to import songs:", error);
        showToast({ message: UI_STRINGS.TOAST_IMPORT_ERROR, type: 'error' });
      }
    };
    reader.onerror = () => {
        showToast({ message: UI_STRINGS.TOAST_IMPORT_FILE_READ_ERROR, type: 'error' });
    }
    reader.readAsText(file);
    event.target.value = '';
  };

  const confirmImportSongs = useCallback(() => {
    if (!songsToImport) return;

    let importedCount = 0;
    const existingTitles = new Set(songs.map(s => `${s.title.toLowerCase()}|${s.artist.toLowerCase()}`));

    const songsWithNewData = songsToImport.filter(importedSong => {
      const key = `${importedSong.title.toLowerCase()}|${(importedSong.artist || '').toLowerCase()}`;
      if (!existingTitles.has(key)) {
        importedCount++;
        return true;
      }
      return false;
    }).map((song, index) => ({
      ...song,
      id: `${Date.now()}-${index}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setSongs(prevSongs => [...prevSongs, ...songsWithNewData]);
    showToast({ message: `${importedCount} ${UI_STRINGS.TOAST_IMPORT_SUCCESS}`, type: 'success' });
    setSongsToImport(null);
  }, [songsToImport, songs]);

  const handleSetlistFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File content is not a string");
            
            const importedSetlists = JSON.parse(text);
            if (!Array.isArray(importedSetlists) || !importedSetlists.every(s => s.id && s.name && Array.isArray(s.songIds))) {
                throw new Error("Invalid setlist file format");
            }
            setSetlistsToImport(importedSetlists);
        } catch (error) {
            console.error("Failed to import setlists:", error);
            showToast({ message: UI_STRINGS.TOAST_SETLIST_IMPORT_ERROR, type: 'error' });
        }
    };
    reader.onerror = () => showToast({ message: UI_STRINGS.TOAST_IMPORT_FILE_READ_ERROR, type: 'error' });
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const handlePdfFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showToast({ message: UI_STRINGS.TOAST_PDF_IMPORTING, type: 'info' });
    try {
      const { title, artist, content } = await importSongFromPdf(file);
      
      const newSong: Song = {
        id: Date.now().toString(),
        title: title || file.name.replace(/\.pdf$/i, ''),
        artist: artist || UI_STRINGS.NEW_SONG_ARTIST,
        key: 'C',
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setSongs(prevSongs => [...prevSongs, newSong]);
      setActiveView('songs');
      setActiveItemId(newSong.id);
      showToast({ message: UI_STRINGS.TOAST_PDF_IMPORT_SUCCESS, type: 'success' });

    } catch (error) {
      console.error("Failed to import from PDF:", error);
      showToast({ message: UI_STRINGS.TOAST_PDF_IMPORT_ERROR, type: 'error' });
    } finally {
      if(event.target) event.target.value = ''; // Reset file input
    }
  };

  const confirmImportSetlists = useCallback(() => {
    if (!setlistsToImport) return;

    let importedCount = 0;
    const existingNames = new Set(setlists.map(s => s.name.toLowerCase()));

    const newSetlists = setlistsToImport.filter(importedSetlist => {
      if (!existingNames.has(importedSetlist.name.toLowerCase())) {
        importedCount++;
        return true;
      }
      return false;
    }).map((setlist, index) => ({
      ...setlist,
      id: `setlist-${Date.now()}-${index}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setSetlists(prev => [...prev, ...newSetlists]);
    showToast({ message: `${importedCount} ${UI_STRINGS.TOAST_IMPORT_SETLISTS_SUCCESS}`, type: 'success' });
    setSetlistsToImport(null);
  }, [setlistsToImport, setlists]);

  // --- Navigation ---
  const handleSelectSong = (id: string) => {
    setActiveView('songs');
    setActiveItemId(id);
    setActiveSetlistContext(null); // Clear context when selecting from main list
  };

  const handleSelectSongInSetlist = (songId: string, setlistId: string) => {
    setActiveSetlistContext(setlistId);
    setActiveView('songs');
    setActiveItemId(songId);
  };
  
  const handleReturnToSetlist = () => {
    if(activeSetlistContext) {
      setActiveView('setlists');
      setActiveItemId(activeSetlistContext);
      setActiveSetlistContext(null);
    }
  }

  const handleSelectSetlist = (id: string) => {
    setActiveView('setlists');
    setActiveItemId(id);
  };

  const songMap = useMemo(() => new Map(songs.map(song => [song.id, song])), [songs]);
  const activeSong = activeView === 'songs' ? songMap.get(activeItemId || '') : undefined;
  const activeSetlist = activeView === 'setlists' ? setlists.find(setlist => setlist.id === activeItemId) : undefined;
  const activeSetlistForContext = activeSetlistContext ? setlists.find(s => s.id === activeSetlistContext) : undefined;

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-900 text-slate-100">
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 shadow-lg">
        <h1 className="text-xl font-bold text-sky-400">{UI_STRINGS.APP_TITLE}</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleNewSong}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900"
          >
            <PlusIcon />
            {UI_STRINGS.NEW_SONG_BUTTON}
          </button>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="p-2 text-sm font-semibold text-white bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900"
              aria-label={UI_STRINGS.MORE_OPTIONS_ARIA_LABEL}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
            >
              <MoreVerticalIcon />
            </button>
            <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 origin-top-right"
                role="menu"
              >
                <ul className="py-1">
                   <li role="menuitem">
                    <button onClick={handleImportPdfClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors">
                      <FileTextIcon/> {UI_STRINGS.IMPORT_PDF_BUTTON}
                    </button>
                  </li>
                  <li className="my-1 border-t border-slate-700"></li>
                  <li role="menuitem">
                    <button onClick={handleImportSongsClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors">
                      <ImportIcon/> {UI_STRINGS.IMPORT_SONGS_BUTTON}
                    </button>
                  </li>
                  <li role="menuitem">
                    <button onClick={handleImportSetlistsClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors">
                      <ImportIcon/> {UI_STRINGS.IMPORT_SETLISTS_BUTTON}
                    </button>
                  </li>
                  <li className="my-1 border-t border-slate-700"></li>
                  <li role="menuitem">
                    <button onClick={handleExportSongs} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors">
                      <ExportIcon/> {UI_STRINGS.EXPORT_SONGS_BUTTON}
                    </button>
                  </li>
                   <li role="menuitem">
                    <button onClick={handleExportSetlists} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors">
                      <ExportIcon/> {UI_STRINGS.EXPORT_SETLISTS_BUTTON}
                    </button>
                  </li>
                </ul>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
          <input type="file" ref={importSongFileRef} onChange={handleSongFileImport} accept=".json" className="hidden" />
          <input type="file" ref={importSetlistFileRef} onChange={handleSetlistFileImport} accept=".json" className="hidden" />
          <input type="file" ref={importPdfFileRef} onChange={handlePdfFileImport} accept=".pdf" className="hidden" />
        </div>
      </header>
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] overflow-hidden">
        <aside className="border-r border-slate-800 bg-slate-900/70 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 border-b border-slate-800">
            <nav className="flex items-center p-2 gap-2">
              <button onClick={() => setActiveView('songs')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors ${activeView === 'songs' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <MusicIcon /> {UI_STRINGS.SONGS_TAB}
              </button>
              <button onClick={() => setActiveView('setlists')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors ${activeView === 'setlists' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <ClipboardListIcon /> {UI_STRINGS.SETLISTS_TAB}
              </button>
            </nav>
          </div>
          {activeView === 'songs' ? (
            <SongList
              songs={songs}
              activeSongId={activeItemId}
              onSelectSong={handleSelectSong}
              onDeleteSong={handleDeleteSongRequest}
            />
          ) : (
            <SetlistList
              setlists={setlists}
              activeSetlistId={activeItemId}
              onSelectSetlist={handleSelectSetlist}
              onNewSetlist={handleNewSetlist}
              onDeleteSetlist={handleDeleteSetlistRequest}
            />
          )}
        </aside>
        <section className="flex-1 overflow-y-auto bg-slate-800/30">
          {activeView === 'songs' && activeSong ? (
            <Editor
              key={activeSong.id}
              song={activeSong}
              onSave={handleSaveSong}
              showToast={showToast}
              prefs={prefs}
              onUpdatePrefs={handleUpdatePrefs}
              setlistContext={activeSetlistForContext}
              onReturnToSetlist={handleReturnToSetlist}
            />
          ) : activeView === 'setlists' && activeSetlist ? (
            <SetlistEditor 
              key={activeSetlist.id}
              setlist={activeSetlist}
              songMap={songMap}
              onUpdate={handleUpdateSetlist}
              onSelectSongInSetlist={(songId) => handleSelectSongInSetlist(songId, activeSetlist.id)}
            />
          ) : (
            <Welcome onNewSong={handleNewSong} onNewSetlist={handleNewSetlist} />
          )}
        </section>
      </main>
      <ConfirmModal
        isOpen={!!songToDelete}
        onClose={() => setSongToDelete(null)}
        onConfirm={confirmDeleteSong}
        title={UI_STRINGS.DELETE_CONFIRM_TITLE}
        message={`${UI_STRINGS.DELETE_SONG_CONFIRM_MESSAGE} "${songToDelete?.title}"?`}
      />
       <ConfirmModal
        isOpen={!!setlistToDelete}
        onClose={() => setSetlistToDelete(null)}
        onConfirm={confirmDeleteSetlist}
        title={UI_STRINGS.DELETE_SETLIST_CONFIRM_TITLE}
        message={`${UI_STRINGS.DELETE_SETLIST_CONFIRM_MESSAGE} "${setlistToDelete?.name}"?`}
      />
      <ConfirmModal
        isOpen={!!songsToImport}
        onClose={() => setSongsToImport(null)}
        onConfirm={confirmImportSongs}
        title={UI_STRINGS.IMPORT_SONGS_CONFIRM_TITLE}
        message={UI_STRINGS.IMPORT_SONGS_CONFIRM_MESSAGE}
        confirmButtonText={UI_STRINGS.IMPORT_BUTTON}
        confirmButtonClass="bg-sky-600 hover:bg-sky-500"
      />
       <ConfirmModal
        isOpen={!!setlistsToImport}
        onClose={() => setSetlistsToImport(null)}
        onConfirm={confirmImportSetlists}
        title={UI_STRINGS.IMPORT_SETLISTS_CONFIRM_TITLE}
        message={UI_STRINGS.IMPORT_SETLISTS_CONFIRM_MESSAGE}
        confirmButtonText={UI_STRINGS.IMPORT_BUTTON}
        confirmButtonClass="bg-sky-600 hover:bg-sky-500"
      />
      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
};

export default App;