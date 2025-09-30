import React from 'react';
import { PlusIcon, ClipboardListIcon } from './icons';
import { UI_STRINGS } from '../constants/es';

interface WelcomeProps {
    onNewSong: () => void;
    onNewSetlist: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNewSong, onNewSetlist }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
      <div className="max-w-md">
        <h2 className="text-3xl font-bold text-slate-200 mb-4">{UI_STRINGS.WELCOME_TITLE}</h2>
        <p className="mb-8">
          {UI_STRINGS.WELCOME_MESSAGE}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onNewSong}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900"
            >
              <PlusIcon />
              {UI_STRINGS.CREATE_FIRST_SONG_BUTTON}
            </button>
            <button
              onClick={onNewSetlist}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900"
            >
              <ClipboardListIcon />
              {UI_STRINGS.CREATE_FIRST_SETLIST_BUTTON}
            </button>
        </div>
      </div>
    </div>
  );
};