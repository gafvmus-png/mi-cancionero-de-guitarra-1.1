
import React, { useState, useEffect, useMemo } from 'react';
import { Setlist, Song } from '../types';
import { UI_STRINGS } from '../constants/es';
import { PlusIcon, GripVerticalIcon, TrashIcon } from './icons';
import { AddSongToSetlistModal } from './AddSongToSetlistModal';
import { Reorder, useDragControls } from 'framer-motion';

interface SetlistEditorProps {
    setlist: Setlist;
    songMap: Map<string, Song>;
    onUpdate: (setlist: Setlist) => void;
    onSelectSongInSetlist: (songId: string) => void;
}

const ReorderableSongItem: React.FC<{ song: Song, onRemove: (id: string) => void, onSelect: (id: string) => void }> = ({ song, onRemove, onSelect }) => {
    const controls = useDragControls();
    return (
        <Reorder.Item
            value={song}
            dragListener={false}
            dragControls={controls}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center bg-slate-800/50 p-3 rounded-lg mb-2"
        >
            <button
                onPointerDown={(e) => controls.start(e)}
                className="p-2 text-slate-500 cursor-grab active:cursor-grabbing"
            >
                <GripVerticalIcon />
            </button>
            <div className="flex-grow ml-2 cursor-pointer" onClick={() => onSelect(song.id)}>
                <p className="font-semibold text-slate-200">{song.title}</p>
                <p className="text-sm text-slate-400">{song.artist}</p>
            </div>
            <button onClick={() => onRemove(song.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-full transition-colors">
                <TrashIcon />
            </button>
        </Reorder.Item>
    );
};


export const SetlistEditor: React.FC<SetlistEditorProps> = ({ setlist, songMap, onUpdate, onSelectSongInSetlist }) => {
    const [name, setName] = useState(setlist.name);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const songsInSetlist = useMemo(() => {
        return setlist.songIds.map(id => songMap.get(id)).filter((s): s is Song => !!s);
    }, [setlist.songIds, songMap]);

    const [orderedSongs, setOrderedSongs] = useState(songsInSetlist);

    useEffect(() => {
      setOrderedSongs(songsInSetlist);
    }, [songsInSetlist]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            if (name !== setlist.name) {
                onUpdate({ ...setlist, name });
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [name, setlist, onUpdate]);

    const handleReorder = (newOrder: Song[]) => {
      setOrderedSongs(newOrder);
      onUpdate({ ...setlist, songIds: newOrder.map(s => s.id) });
    };

    const handleAddSongs = (songIdsToAdd: string[]) => {
        const newSongIds = [...setlist.songIds, ...songIdsToAdd];
        onUpdate({ ...setlist, songIds: newSongIds });
        setIsModalOpen(false);
    };

    const handleRemoveSong = (songId: string) => {
        const newSongIds = setlist.songIds.filter(id => id !== songId);
        onUpdate({ ...setlist, songIds: newSongIds });
    };

    const allSongs = useMemo(() => Array.from(songMap.values()), [songMap]);

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <header className="mb-6">
                <h2 className="text-sm uppercase text-slate-400 font-semibold">{UI_STRINGS.EDIT_SETLIST_TITLE}</h2>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={UI_STRINGS.SETLIST_NAME_PLACEHOLDER}
                    className="w-full text-2xl font-bold bg-transparent border-b-2 border-slate-700 focus:outline-none focus:border-sky-400 py-2 mt-1"
                />
            </header>

            <div className="flex-1 flex flex-col min-h-0">
                {orderedSongs.length > 0 ? (
                    <Reorder.Group axis="y" values={orderedSongs} onReorder={handleReorder} className="overflow-y-auto pr-2 -mr-2">
                        {orderedSongs.map(song => (
                           <ReorderableSongItem key={song.id} song={song} onRemove={handleRemoveSong} onSelect={onSelectSongInSetlist} />
                        ))}
                    </Reorder.Group>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-slate-500">
                        <p>{UI_STRINGS.SETLIST_EMPTY_MESSAGE}</p>
                    </div>
                )}
            </div>

            <footer className="mt-6">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900"
                >
                    <PlusIcon /> {UI_STRINGS.ADD_SONGS_TO_SETLIST_BUTTON}
                </button>
            </footer>

            <AddSongToSetlistModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddSongs={handleAddSongs}
                allSongs={allSongs}
                existingSongIds={setlist.songIds}
            />
        </div>
    );
};