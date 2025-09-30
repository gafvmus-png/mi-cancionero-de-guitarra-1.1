import React, { useState, useMemo } from 'react';
import { Song } from '../types';
import { SearchIcon, TrashIcon } from './icons';
import { UI_STRINGS } from '../constants/es';

interface SongListProps {
  songs: Song[];
  activeSongId: string | null;
  onSelectSong: (id: string) => void;
  onDeleteSong: (id: string) => void;
}

export const SongList: React.FC<SongListProps> = ({ songs, activeSongId, onSelectSong, onDeleteSong }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSongs = useMemo(() => {
    const sortedSongs = [...songs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (!searchTerm) {
      return sortedSongs;
    }
    return sortedSongs.filter(song =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [songs, searchTerm]);

  const handleDelete = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    onDeleteSong(songId);
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="p-4 border-b border-slate-800">
        <div className="relative">
          <input
            type="text"
            placeholder={UI_STRINGS.SEARCH_PLACEHOLDER}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredSongs.length > 0 ? (
          <ul>
            {filteredSongs.map(song => (
              <li key={song.id} className="group">
                <button
                  onClick={() => onSelectSong(song.id)}
                  className={`w-full text-left p-4 flex justify-between items-center transition-colors duration-150 ${
                    activeSongId === song.id
                      ? 'bg-sky-600/20 border-l-4 border-sky-400'
                      : 'hover:bg-slate-800/50 border-l-4 border-transparent'
                  }`}
                >
                  <div>
                    <h3 className={`font-semibold ${activeSongId === song.id ? 'text-sky-300' : 'text-slate-100'}`}>{song.title}</h3>
                    <p className="text-sm text-slate-400">{song.artist}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, song.id)} 
                    className="p-2 text-slate-500 hover:text-red-400 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`${UI_STRINGS.DELETE_SONG_ARIA_LABEL} ${song.title}`}
                  >
                    <TrashIcon />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-center text-slate-500">{UI_STRINGS.NO_SONGS_FOUND}</p>
        )}
      </div>
    </div>
  );
};