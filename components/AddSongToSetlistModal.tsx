import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Song } from '../types';
import { CloseIcon, SearchIcon } from './icons';
import { UI_STRINGS } from '../constants/es';

interface AddSongToSetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSongs: (songIds: string[]) => void;
  allSongs: Song[];
  existingSongIds: string[];
}

export const AddSongToSetlistModal: React.FC<AddSongToSetlistModalProps> = ({ 
    isOpen, onClose, onAddSongs, allSongs, existingSongIds 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());

  const availableSongs = useMemo(() => {
    const existingIdsSet = new Set(existingSongIds);
    return allSongs
      .filter(song => !existingIdsSet.has(song.id))
      .filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allSongs, existingSongIds, searchTerm]);

  const handleToggleSelection = (songId: string) => {
    setSelectedSongIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const handleAddClick = () => {
    onAddSongs(Array.from(selectedSongIds));
    setSelectedSongIds(new Set());
    setSearchTerm('');
  };
  
  const handleClose = () => {
    setSelectedSongIds(new Set());
    setSearchTerm('');
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-song-title"
        >
          <motion.div
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
              <h2 id="add-song-title" className="text-lg font-semibold text-sky-400">{UI_STRINGS.ADD_SONGS_MODAL_TITLE}</h2>
              <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700" aria-label={UI_STRINGS.CLOSE_MODAL_ARIA_LABEL}>
                <CloseIcon />
              </button>
            </header>
            <div className="p-4 border-b border-slate-700 flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder={UI_STRINGS.SEARCH_PLACEHOLDER}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <SearchIcon />
                </div>
              </div>
            </div>
            <div className="p-2 overflow-y-auto flex-grow">
              {availableSongs.length > 0 ? (
                <ul>
                  {availableSongs.map(song => (
                    <li key={song.id}>
                      <label className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${selectedSongIds.has(song.id) ? 'bg-sky-600/20' : 'hover:bg-slate-700/50'}`}>
                        <input
                          type="checkbox"
                          checked={selectedSongIds.has(song.id)}
                          onChange={() => handleToggleSelection(song.id)}
                          className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"
                        />
                        <div>
                          <p className="font-semibold">{song.title}</p>
                          <p className="text-sm text-slate-400">{song.artist}</p>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center p-8 text-slate-500">{UI_STRINGS.NO_MORE_SONGS_TO_ADD}</p>
              )}
            </div>
            <footer className="flex justify-end p-4 bg-slate-700/50 rounded-b-xl flex-shrink-0">
              <button
                onClick={handleAddClick}
                disabled={selectedSongIds.size === 0}
                className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
              >
                {UI_STRINGS.ADD_SELECTED_SONGS_BUTTON} ({selectedSongIds.size})
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};