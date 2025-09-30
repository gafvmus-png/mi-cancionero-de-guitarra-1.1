
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Preview } from './Preview';
import { CloseIcon, PlayIcon, PauseIcon, EyeIcon, EyeOffIcon, FontSizeDownIcon, FontSizeUpIcon, MetronomeIcon, Volume1Icon, Volume2Icon, VolumeXIcon, PinIcon, PinOffIcon } from './icons';
import { UI_STRINGS } from '../constants/es';
import { Song } from '../types';
import { getTrack } from '../services/audioDbService';

// Base64 encoded WAV files for metronome clicks
const clickAccent = "data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==";
const click = "data:audio/wav;base64,UklGRlAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==";

interface PerformanceModeProps {
  song: Song;
  onClose: () => void;
}

const MetronomeVisualizer: React.FC<{ beat: number, totalBeats: number }> = ({ beat, totalBeats }) => {
    if (beat === 0) return null;
    const isAccent = beat === 1;
    return (
        <motion.div 
            key={beat}
            className={`w-4 h-4 rounded-full ${isAccent ? 'bg-sky-400' : 'bg-slate-400'}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: isAccent ? 1.5 : 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
        />
    );
};

export const PerformanceMode: React.FC<PerformanceModeProps> = ({ song, onClose }) => {
  // View State
  const [fontSize, setFontSize] = useState(20);
  const [hideChords, setHideChords] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [areControlsPinned, setAreControlsPinned] = useState(false);

  // AutoScroll State
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDuration, setScrollDuration] = useState(180); // Default 3 minutes

  // Backing Track State
  const [backingTrackUrl, setBackingTrackUrl] = useState<string | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  
  // Metronome State
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(0.5);
  const [usePrecount, setUsePrecount] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(0);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);
  const metronomeInterval = useRef<number | undefined>(undefined);
  const clickAccentAudio = useRef<HTMLAudioElement>(new Audio(clickAccent));
  const clickAudio = useRef<HTMLAudioElement>(new Audio(click));
  
  const timeSignatureBeats = parseInt(song.timeSignature?.split('/')[0] || '4', 10);

  // Load backing track from IndexedDB
  useEffect(() => {
    if (song.backingTrackName) {
      getTrack(song.id).then(trackData => {
        if (trackData) {
          // Create a Blob URL from the base64 data
          const byteCharacters = atob(trackData.audioData.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {type: 'audio/mpeg'}); // Adjust MIME type if needed
          const url = URL.createObjectURL(blob);
          setBackingTrackUrl(url);
        }
        setIsLoadingTrack(false);
      });
    } else {
      setIsLoadingTrack(false);
    }
    
    // Cleanup Blob URL on component unmount
    return () => {
        if (backingTrackUrl) {
            URL.revokeObjectURL(backingTrackUrl);
        }
    };
  }, [song.id, song.backingTrackName]);
  
  const hideControls = useCallback(() => {
    if (!areControlsPinned) {
        setShowControls(false);
    }
  }, [areControlsPinned]);
  
  const handleActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!areControlsPinned) {
        controlsTimeoutRef.current = window.setTimeout(hideControls, 4000);
    }
  }, [hideControls, areControlsPinned]);

  // Metronome logic
  useEffect(() => {
    clickAccentAudio.current.volume = metronomeVolume;
    clickAudio.current.volume = metronomeVolume;
  }, [metronomeVolume]);

  useEffect(() => {
    if (isMetronomeOn && song.bpm) {
      let beat = 0;
      const tick = () => {
        beat = (beat % timeSignatureBeats) + 1;
        setCurrentBeat(beat);
        if (beat === 1) {
            clickAccentAudio.current.play().catch(e => console.error("Audio play failed", e));
        } else {
            clickAudio.current.play().catch(e => console.error("Audio play failed", e));
        }
      };
      
      const startMetronome = () => {
          tick(); // Play first beat immediately
          metronomeInterval.current = window.setInterval(tick, (60 / song.bpm) * 1000);
      };
      
      if (usePrecount && (isAudioPlaying || isScrolling)) {
          // Logic for pre-count is handled in play/pause functions
      } else {
          startMetronome();
      }
    }
    
    return () => {
      if (metronomeInterval.current) {
        clearInterval(metronomeInterval.current);
        setCurrentBeat(0);
      }
    };
  }, [isMetronomeOn, song.bpm, timeSignatureBeats, isAudioPlaying, isScrolling, usePrecount]);
  
  const startWithPrecount = (startFunction: () => void) => {
    if (usePrecount && song.bpm) {
        let precountBeat = 0;
        const precountInterval = setInterval(() => {
            precountBeat++;
            setCurrentBeat(precountBeat);
            if (precountBeat === 1) {
                clickAccentAudio.current.play().catch(e => console.error("Audio play failed", e));
            } else {
                clickAudio.current.play().catch(e => console.error("Audio play failed", e));
            }
            if (precountBeat >= timeSignatureBeats) {
                clearInterval(precountInterval);
                startFunction();
            }
        }, (60 / song.bpm) * 1000);
    } else {
        startFunction();
    }
  };

  const resetScroll = useCallback(() => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const handlePlayPauseAudio = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isAudioPlaying) {
          audio.pause();
      } else {
          startWithPrecount(() => audio.play());
      }
  };
  
  const handleTimeUpdate = () => {
    if (!audioRef.current || !scrollContainerRef.current) return;
    const { currentTime, duration } = audioRef.current;
    const { scrollHeight, clientHeight } = scrollContainerRef.current;
    const maxScroll = scrollHeight - clientHeight;

    setAudioProgress((currentTime / duration) * 100);
    setAudioCurrentTime(currentTime);

    if (maxScroll > 0) {
        scrollContainerRef.current.scrollTop = maxScroll * (currentTime / duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = (Number(e.target.value) / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setAudioVolume(newVolume);
    if(audioRef.current) audioRef.current.volume = newVolume;
  };

  useEffect(() => {
    let animationFrame: number;
    if (isScrolling && !backingTrackUrl && scrollContainerRef.current) {
        const scrollHeight = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
        const pixelsPerSecond = scrollHeight / scrollDuration;
        let lastTime: number;

        const animateScroll = (timestamp: number) => {
            if (lastTime === undefined) lastTime = timestamp;
            const deltaTime = timestamp - lastTime;
            const scrollAmount = (pixelsPerSecond / 1000) * deltaTime;
            if(scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop += scrollAmount;
                if (scrollContainerRef.current.scrollTop >= scrollHeight) {
                    setIsScrolling(false);
                    return;
                }
            }
            lastTime = timestamp;
            animationFrame = requestAnimationFrame(animateScroll);
        };
        animationFrame = requestAnimationFrame(animateScroll);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isScrolling, scrollDuration, backingTrackUrl]);

  const handlePlayPauseManualScroll = () => {
    if (isScrolling) {
        setIsScrolling(false);
    } else {
        if (scrollContainerRef.current && scrollContainerRef.current.scrollTop >= scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight - 1) {
            resetScroll();
        }
        startWithPrecount(() => setIsScrolling(true));
    }
  };
  
  const handleScrollDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const [minutes, seconds] = e.target.value.split(':').map(Number);
      setScrollDuration((minutes * 60) + (seconds || 0));
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        if(backingTrackUrl) handlePlayPauseAudio();
        else handlePlayPauseManualScroll();
      }
      if (e.key === 'ArrowUp') setFontSize(f => Math.min(f + 1, 48));
      if (e.key === 'ArrowDown') setFontSize(f => Math.max(f - 1, 10));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    handleActivity();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove',handleActivity);
      window.removeEventListener('touchstart',handleActivity);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [onClose, handleActivity, backingTrackUrl]);
  
  const formatTime = (seconds: number) => new Date(seconds * 1000).toISOString().substr(14, 5);
  const VolumeIcon = audioVolume === 0 ? VolumeXIcon : audioVolume < 0.5 ? Volume1Icon : Volume2Icon;
  const scrollDurationFormatted = `${Math.floor(scrollDuration / 60).toString().padStart(2, '0')}:${(scrollDuration % 60).toString().padStart(2, '0')}`;

  return (
    <motion.div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 text-xl md:text-2xl" onClick={hideControls}>
        <div className="max-w-4xl mx-auto">
            <Preview content={song.content} hideChords={hideChords} fontSize={fontSize} />
        </div>
        {!isLoadingTrack && backingTrackUrl && (
            <audio 
                ref={audioRef} 
                src={backingTrackUrl} 
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsAudioPlaying(true)}
                onPause={() => setIsAudioPlaying(false)}
                onEnded={() => { setIsAudioPlaying(false); resetScroll(); }}
            />
        )}
      </div>

      <AnimatePresence>
      {showControls && (
        <motion.div 
            className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-4 flex flex-col gap-4"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center gap-4">
            {backingTrackUrl ? (
                <>
                  <button onClick={handlePlayPauseAudio} className="p-2 text-white text-3xl" aria-label={isAudioPlaying ? UI_STRINGS.PAUSE_ARIA_LABEL : UI_STRINGS.PLAY_ARIA_LABEL}><AnimatePresence mode="wait">{isAudioPlaying ? <PauseIcon /> : <PlayIcon />}</AnimatePresence></button>
                  <span className="text-xs text-white font-mono">{formatTime(audioCurrentTime)}</span>
                  <input type="range" value={audioProgress} onChange={handleSeek} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer range-sm accent-sky-400" />
                  <span className="text-xs text-white font-mono">{formatTime(song.duration || 0)}</span>
                </>
            ) : (
                <>
                  <button onClick={handlePlayPauseManualScroll} className="p-2 text-white text-3xl" aria-label={isScrolling ? UI_STRINGS.PAUSE_ARIA_LABEL : UI_STRINGS.PLAY_ARIA_LABEL}><AnimatePresence mode="wait">{isScrolling ? <PauseIcon /> : <PlayIcon />}</AnimatePresence></button>
                  <label htmlFor="scroll-duration" className="text-xs font-mono text-white whitespace-nowrap">{UI_STRINGS.AUTOSCROLL_DURATION_LABEL}</label>
                  <input type="text" id="scroll-duration" value={scrollDurationFormatted} onChange={handleScrollDurationChange} className="w-20 bg-slate-700/50 text-white text-center font-mono text-sm p-1 rounded"/>
                </>
            )}
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Left: Close & Pin */}
            <div className="flex items-center gap-2">
                <button onClick={onClose} className="p-3 text-white bg-slate-700/50 rounded-full hover:bg-slate-600/70 transition-colors" aria-label={UI_STRINGS.CLOSE_MODAL_ARIA_LABEL}><CloseIcon /></button>
                <button onClick={() => setAreControlsPinned(p => !p)} className={`p-3 rounded-full transition-colors ${areControlsPinned ? 'bg-sky-500 text-white' : 'bg-slate-700/50 text-white hover:bg-slate-600/70'}`} aria-label={UI_STRINGS.PIN_CONTROLS_ARIA_LABEL}>{areControlsPinned ? <PinOffIcon/> : <PinIcon />}</button>
            </div>
            {/* Center: View Controls */}
            <div className="flex items-center gap-2 justify-center">
              <button onClick={() => setFontSize(f => Math.max(f - 1, 10))} className="p-2 text-white bg-slate-700/50 rounded-full hover:bg-slate-600/70"><FontSizeDownIcon /></button>
              <span className="text-sm font-semibold text-white font-mono w-12 text-center">{fontSize}px</span>
              <button onClick={() => setFontSize(f => Math.min(f + 1, 48))} className="p-2 text-white bg-slate-700/50 rounded-full hover:bg-slate-600/70"><FontSizeUpIcon /></button>
              <button onClick={() => setHideChords(h => !h)} className="p-2 text-white bg-slate-700/50 rounded-full hover:bg-slate-600/70">{hideChords ? <EyeOffIcon/> : <EyeIcon />}</button>
            </div>
            {/* Right: Metronome & Audio Volume */}
            <div className="flex items-center gap-2 justify-end">
                {song.bpm && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50">
                        <button onClick={() => setIsMetronomeOn(on => !on)} className={`p-2 rounded-full transition-colors text-xl ${isMetronomeOn ? 'bg-sky-500 text-white' : 'text-white'}`}><MetronomeIcon/></button>
                        <div className="w-5 h-5 flex items-center justify-center"><AnimatePresence><MetronomeVisualizer beat={currentBeat} totalBeats={timeSignatureBeats} /></AnimatePresence></div>
                        <input type="range" min="0" max="1" step="0.05" value={metronomeVolume} onChange={(e) => setMetronomeVolume(Number(e.target.value))} className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer range-sm accent-sky-400"/>
                        <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer"><input type="checkbox" checked={usePrecount} onChange={() => setUsePrecount(p => !p)} className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"/>{UI_STRINGS.PRECOUNT_LABEL}</label>
                    </div>
                )}
                {backingTrackUrl && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50">
                        <VolumeIcon />
                        <input type="range" min="0" max="1" step="0.05" value={audioVolume} onChange={handleVolumeChange} className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer range-sm accent-sky-400"/>
                    </div>
                )}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};