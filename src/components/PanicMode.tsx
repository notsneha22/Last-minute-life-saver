import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { 
  Flame, Play, Pause, RotateCcw, Volume2, ShieldAlert, 
  Lock, CheckCircle2, ChevronRight, Zap, RefreshCw 
} from 'lucide-react';

export default function PanicMode() {
  const {
    tasks,
    activeTaskId,
    setActiveTaskId,
    emergencySettings,
    triggerPanicMode,
    updateEmergencySettings
  } = useApp();

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simulated site block checklist commits
  const [distractions, setDistractions] = useState([
    { id: 'yt', name: 'Mute YouTube & Twitch Streams', active: true },
    { id: 'dc', name: 'Close Discord & Slack Chat Guilds', active: true },
    { id: 'ph', name: 'Turn Off Smartphone Notifications', active: false },
    { id: 'gm', name: 'Unplug Gaming Console / Close Steam Client', active: true }
  ]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize timer with settings
  useEffect(() => {
    if (!isRunning) {
      const minutes = timerMode === 'work' 
        ? emergencySettings.pomodoroWorkMinutes 
        : emergencySettings.pomodoroBreakMinutes;
      setTimeLeft(minutes * 60);
    }
  }, [emergencySettings.pomodoroWorkMinutes, emergencySettings.pomodoroBreakMinutes, timerMode]);

  // Audio synthethizer helper (using native AudioContext, completely self-contained)
  const playSynthesizedBeep = (freq = 440, duration = 0.15, times = 1) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      let count = 0;
      const trigger = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        // fade out slightly
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        osc.start();
        osc.stop(ctx.currentTime + duration);

        count++;
        if (count < times) {
          setTimeout(trigger, (duration + 0.1) * 1000);
        }
      };

      trigger();
    } catch (e) {
      console.warn("AudioContext failed to trigger:", e);
    }
  };

  // Timer Core logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer concluded!
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            
            if (timerMode === 'work') {
              playSynthesizedBeep(880, 0.25, 3); // High pitch success triplets
              setTimerMode('break');
              return emergencySettings.pomodoroBreakMinutes * 60;
            } else {
              playSynthesizedBeep(520, 0.35, 2); // Warm restart call
              setTimerMode('work');
              return emergencySettings.pomodoroWorkMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timerMode, emergencySettings]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    playSynthesizedBeep(440, 0.08); // standard feedback tick
  };

  const resetTimer = () => {
    setIsRunning(false);
    const minutes = timerMode === 'work' 
      ? emergencySettings.pomodoroWorkMinutes 
      : emergencySettings.pomodoroBreakMinutes;
    setTimeLeft(minutes * 60);
    playSynthesizedBeep(330, 0.12);
  };

  const toggleDistraction = (id: string) => {
    setDistractions(prev => prev.map(d => d.id === id ? { ...d, active: !d.active } : d));
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);
  const eligibleTasks = tasks.filter(t => t.status !== 'completed');

  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6" id="panic-mode-container">
      
      {/* Panic Station Control Banner */}
      <section className={`rounded-3xl p-6 text-white transition-all duration-500 ${
        emergencySettings.isPanicMode 
          ? 'bg-rose-950 border-2 border-rose-500 shadow-xl shadow-rose-900/10' 
          : 'bg-slate-900 border border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className={`w-3.5 h-3.5 rounded-full ${emergencySettings.isPanicMode ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
              <h2 className="text-2xl font-black tracking-tight flex items-center space-x-2">
                <Flame className="w-6 h-6 text-rose-500 fill-rose-500 animate-bounce" />
                <span>Crisis Panic Station</span>
              </h2>
            </div>
            <p className="text-slate-300 text-sm max-w-xl">
              Lock down your browser, activate our extreme focus interval pacing, and burn through your remaining milestones with zero distractions.
            </p>
          </div>

          <button
            onClick={() => {
              const nextVal = !emergencySettings.isPanicMode;
              triggerPanicMode(nextVal);
              playSynthesizedBeep(nextVal ? 880 : 220, 0.4, 2);
            }}
            className={`w-full md:w-auto px-6 py-3 rounded-xl font-black tracking-tight text-sm uppercase transition-all shadow-md cursor-pointer ${
              emergencySettings.isPanicMode 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/20' 
                : 'bg-white hover:bg-slate-100 text-slate-900'
            }`}
            id="emergency-panic-toggle"
          >
            {emergencySettings.isPanicMode ? '⚠️ Disengage Panic Mode' : '🚨 ENGAGE PANIC MODE'}
          </button>
        </div>
      </section>

      {/* Main Focus Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="panic-focus-workspace">
        
        {/* Left Column: Huge Pomodoro Dial */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden" id="pomodoro-workspace">
          
          {/* Subtle countdown background ripple */}
          {isRunning && (
            <div className="absolute inset-0 bg-red-50/10 animate-pulse pointer-events-none" />
          )}

          <div className="space-y-1 mb-6">
            <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
              timerMode === 'work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {timerMode === 'work' ? '🔥 ACTIVE WORK SPRINT' : '🌿 HYDRATION & RECOVERY BREAK'}
            </span>
            <p className="text-xs text-slate-400 font-bold mt-1">
              {timerMode === 'work' ? 'Focus 100% on execution now' : 'Stand up, shake your hands, look outside'}
            </p>
          </div>

          {/* Time digits */}
          <div className="font-black text-7xl sm:text-8xl tracking-tighter text-slate-800 font-mono my-4" id="pomodoro-timer-display">
            {formatTimerDigits(timeLeft)}
          </div>

          {/* Control Strip */}
          <div className="flex items-center space-x-3 my-4">
            <button
              onClick={toggleTimer}
              className={`w-36 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer ${
                isRunning 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
              }`}
              id="pomodoro-toggle-btn"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Sprint</span>
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-xl transition-all cursor-pointer"
              title="Reset Timer"
              id="pomodoro-reset-btn"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Mute alarm beeps' : 'Enable alarm beeps'}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Interval settings toggles directly inside pane */}
          <div className="grid grid-cols-2 gap-3 mt-6 border-t border-slate-100 pt-6 w-full max-w-sm">
            <div className="text-left space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Work Interval</label>
              <select
                value={emergencySettings.pomodoroWorkMinutes}
                onChange={e => updateEmergencySettings({ pomodoroWorkMinutes: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-none"
              >
                <option value={15}>15 Minutes</option>
                <option value={25}>25 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="text-left space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Recovery Break</label>
              <select
                value={emergencySettings.pomodoroBreakMinutes}
                onChange={e => updateEmergencySettings({ pomodoroBreakMinutes: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-none"
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
              </select>
            </div>
          </div>

        </div>

        {/* Right Column: Focus Lock-target & Commit checklist */}
        <div className="space-y-6" id="panic-controls-sidebar">
          
          {/* Target Focus Lock */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>Target Task Focus Lock</span>
            </h3>

            {activeTask ? (
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                  Target locked
                </span>
                <p className="font-black text-slate-800 text-sm leading-snug">{activeTask.title}</p>
                {activeTask.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{activeTask.description}</p>
                )}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase pt-1 border-t border-indigo-100/60">
                  <span>Priority: {activeTask.priority}</span>
                  <span>Due soon</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Choose exactly one task to display here to focus exclusively on. Eliminate choice fatigue!
                </p>
                
                {eligibleTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No pending tasks remaining to select.</p>
                ) : (
                  <select
                    onChange={e => {
                      if (e.target.value) setActiveTaskId(e.target.value);
                    }}
                    defaultValue=""
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-none"
                  >
                    <option value="" disabled>-- Choose Focus Target --</option>
                    {eligibleTasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.priority})</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* commitment Distraction Checklist */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Distraction Lock Commitments</span>
              </h3>
            </div>

            <p className="text-xs text-slate-400">
              Commit to locking down these secondary distraction nodes. Check off to seal your focus:
            </p>

            <div className="space-y-2" id="distractions-checkboxes">
              {distractions.map(d => (
                <label 
                  key={d.id} 
                  className={`flex items-start space-x-3 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    d.active 
                      ? 'bg-rose-50/50 border-rose-100 text-rose-900' 
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={d.active}
                    onChange={() => toggleDistraction(d.id)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span>{d.name}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
