import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Settings, Minus, Plus } from 'lucide-react';

export function PomodoroTimer() {
  const [workDuration, setWorkDuration] = useState(25 * 60); // Default 25 minutes
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isActive, setIsActive] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      // Could play a sound or show notification here
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(workDuration);
  };

  const adjustDuration = (minutes: number) => {
    const newDuration = Math.max(1 * 60, workDuration + minutes * 60);
    setWorkDuration(newDuration);
    if (!isActive) {
      setTimeLeft(newDuration);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="brut-box p-6 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <span className="font-mono bg-brut-accent text-white px-3 py-1 text-xs inline-block uppercase">Focus Timer</span>
        <button 
          onClick={() => setIsConfiguring(!isConfiguring)}
          className="text-brut-ink hover:text-brut-accent transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {isConfiguring ? (
        <div className="space-y-4 mb-6">
          <div className="text-sm font-extrabold uppercase mb-2">Work Interval (Min)</div>
          <div className="flex items-center justify-between border-4 border-brut-border p-2">
            <button onClick={() => adjustDuration(-5)} className="p-2 hover:bg-brut-bg/50 text-brut-ink">
              <Minus className="w-5 h-5" />
            </button>
            <span className="font-mono text-xl font-bold">{Math.floor(workDuration / 60)}</span>
            <button onClick={() => adjustDuration(5)} className="p-2 hover:bg-brut-bg/50 text-brut-ink">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-5xl md:text-6xl font-display font-extrabold text-center mb-6 py-4">
          {formatTime(timeLeft)}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={toggleTimer}
          className={`flex-1 flex justify-center items-center gap-2 h-12 border-4 border-brut-border font-extrabold uppercase transition-all
            ${isActive 
              ? 'bg-brut-surface text-brut-ink shadow-[4px_4px_0_var(--color-brut-border)] translate-x-1 translate-y-1' 
              : 'bg-brut-green text-white shadow-[8px_8px_0_var(--color-brut-border)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0_var(--color-brut-border)]'
            }`}
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="w-12 h-12 flex justify-center items-center border-4 border-brut-border bg-brut-surface text-brut-ink shadow-[8px_8px_0_var(--color-brut-border)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0_var(--color-brut-border)] transition-all"
        >
          <Square className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
