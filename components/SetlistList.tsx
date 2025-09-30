import React from 'react';
import { Setlist } from '../types';
import { PlusIcon, TrashIcon } from './icons';
import { UI_STRINGS } from '../constants/es';

interface SetlistListProps {
  setlists: Setlist[];
  activeSetlistId: string | null;
  onSelectSetlist: (id: string) => void;
  onNewSetlist: () => void;
  onDeleteSetlist: (id: string) => void;
}

export const SetlistList: React.FC<SetlistListProps> = ({ 
    setlists, activeSetlistId, onSelectSetlist, onNewSetlist, onDeleteSetlist 
}) => {

  const handleDelete = (e: React.MouseEvent, setlistId: string) => {
    e.stopPropagation();
    onDeleteSetlist(setlistId);
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onNewSetlist}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900"
        >
          <PlusIcon />
          {UI_STRINGS.NEW_SETLIST_BUTTON}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {setlists.length > 0 ? (
          <ul>
            {setlists.map(setlist => (
              <li key={setlist.id} className="group">
                <button
                  onClick={() => onSelectSetlist(setlist.id)}
                  className={`w-full text-left p-4 flex justify-between items-center transition-colors duration-150 ${
                    activeSetlistId === setlist.id
                      ? 'bg-sky-600/20 border-l-4 border-sky-400'
                      : 'hover:bg-slate-800/50 border-l-4 border-transparent'
                  }`}
                >
                  <div>
                    <h3 className={`font-semibold ${activeSetlistId === setlist.id ? 'text-sky-300' : 'text-slate-100'}`}>{setlist.name}</h3>
                    <p className="text-sm text-slate-400">{setlist.songIds.length} canciones</p>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, setlist.id)} 
                    className="p-2 text-slate-500 hover:text-red-400 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`${UI_STRINGS.DELETE_SETLIST_ARIA_LABEL} ${setlist.name}`}
                  >
                    <TrashIcon />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-center text-slate-500">{UI_STRINGS.NO_SETLISTS_FOUND}</p>
        )}
      </div>
    </div>
  );
};