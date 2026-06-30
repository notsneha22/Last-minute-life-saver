import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, Clock, Calendar, AlertCircle, Coffee, CheckCircle, 
  ChevronRight, Compass, RefreshCw, Layers 
} from 'lucide-react';

export default function Schedule() {
  const {
    tasks,
    scheduleBlocks,
    isGeneratingSchedule,
    generateAISchedule
  } = useApp();

  const [availableHours, setAvailableHours] = useState(8);

  const activeTasks = tasks.filter(t => t.status !== 'completed');

  const handleGenerate = async () => {
    await generateAISchedule(availableHours);
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBlockDuration = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const mins = Math.round((e - s) / 60000);
    return `${mins}m`;
  };

  return (
    <div className="space-y-6" id="schedule-tab-root">
      {/* Schedule Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">AI Micro-Step Calendar</h2>
          <p className="text-sm text-slate-500">Transform paralyzing multi-hour tasks into simple, hyper-detailed chunks</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center space-x-2 px-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <label className="text-xs font-bold text-slate-600 uppercase">Available Time:</label>
            <select 
              value={availableHours} 
              onChange={e => setAvailableHours(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
            >
              <option value={4}>Next 4 Hours</option>
              <option value={8}>Next 8 Hours</option>
              <option value={12}>Next 12 Hours</option>
              <option value={24}>Next 24 Hours</option>
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGeneratingSchedule || activeTasks.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-100"
            id="generate-ai-schedule-btn"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{isGeneratingSchedule ? 'Sequencing...' : 'Generate AI Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Overview Block */}
      {activeTasks.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900">Zero Critical Sprints Needed</h3>
              <p className="text-sm text-emerald-700">You do not have any pending tasks right now. Sit back, recharge, and breathe easily.</p>
            </div>
          </div>
        </div>
      ) : (
        scheduleBlocks.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                <AlertCircle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">Immediate Action Required</h3>
                <p className="text-sm text-amber-700">You have {activeTasks.length} active tasks but no chronological schedule generated. Press the button above to align your blocks.</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Main Timeline Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="schedule-timeline-layout">
        
        {/* Left 2 columns: The chronological scroll */}
        <div className="lg:col-span-2 space-y-4" id="timeline-blocks-list">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-black text-slate-800 tracking-tight text-lg flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>Today's Burndown Timeline</span>
              </h3>
              <span className="text-xs text-slate-400 font-bold uppercase">
                {scheduleBlocks.length} Scheduled Blocks
              </span>
            </div>

            {scheduleBlocks.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <Calendar className="w-16 h-16 text-slate-200 mb-3 animate-pulse" />
                <p className="text-slate-500 font-bold">No timeline loaded</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Generate an AI schedule above. Gemini will map tasks into structured work intervals with short breathing rests.
                </p>
                {activeTasks.length > 0 && (
                  <button
                    onClick={handleGenerate}
                    disabled={isGeneratingSchedule}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    Generate Now
                  </button>
                )}
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-150 pl-6 ml-4 space-y-6">
                {scheduleBlocks.map((block, index) => {
                  const isBreak = block.isBreak;
                  return (
                    <div key={block.id || index} className="relative group">
                      
                      {/* Timeline Dot Indicator */}
                      <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-all ${
                        isBreak 
                          ? 'bg-emerald-500 group-hover:scale-110' 
                          : 'bg-indigo-600 group-hover:scale-110'
                      }`} />

                      <div className={`p-4 rounded-2xl border transition-all ${
                        isBreak 
                          ? 'bg-emerald-50/55 border-emerald-100 hover:border-emerald-200' 
                          : 'bg-slate-50 border-slate-150 hover:border-indigo-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center space-x-2.5">
                            {isBreak ? (
                              <Coffee className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                            <h4 className={`font-extrabold text-sm sm:text-base ${
                              isBreak ? 'text-emerald-900' : 'text-slate-800'
                            }`}>
                              {block.taskTitle}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
                            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                              🕒 {formatTime(block.startTime)} - {formatTime(block.endTime)}
                            </span>
                            <span className={`px-2 py-1 rounded-lg ${
                              isBreak ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {getBlockDuration(block.startTime, block.endTime)}
                            </span>
                          </div>
                        </div>

                        {/* Activity Guideline */}
                        <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed pl-1">
                          <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider block mb-0.5">
                            {isBreak ? 'Recovery Plan:' : 'Micro-Step Instruction:'}
                          </span>
                          {block.activity}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Action instructions & tips */}
        <div className="space-y-6" id="schedule-guidelines-sidebar">
          {/* Emergency prioritization panel */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-md">
            <h3 className="font-extrabold text-lg flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>AI Scheduling Methodology</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We employ structured **Ultradian Rhythm Pacing** matching standard study workflows:
            </p>

            <ul className="space-y-3 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <li className="flex items-start space-x-2">
                <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>No multi-tasking:</strong> Gemini places only one critical deliverable per sprint.</span>
              </li>
              <li className="flex items-start space-x-2">
                <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Scope Minimization:</strong> Highly complex drafts are simplified into raw bullet lists first.</span>
              </li>
              <li className="flex items-start space-x-2">
                <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Fatigue buffering:</strong> Brief 5-10 minute physical movement buffers preserve overall cognitive speed.</span>
              </li>
            </ul>

            <div className="bg-indigo-950 rounded-2xl border border-indigo-900 p-3 text-xs">
              <p className="font-bold text-indigo-300 uppercase text-[10px] tracking-wide mb-1">💡 Crisis Tip</p>
              <p className="text-indigo-200">
                If deadlines are in less than 3 hours, do NOT try to polish formatting. Submit a raw draft with zero typos. Form follows completeness!
              </p>
            </div>
          </div>

          {/* Active Tasks Reference queue for quick check */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Pending Tasks to Sequence</h3>
            <div className="space-y-2.5">
              {activeTasks.length === 0 ? (
                <p className="text-xs text-slate-400">All clear!</p>
              ) : (
                activeTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-bold text-slate-700 truncate max-w-[150px]" title={t.title}>
                      {t.title}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Est: {t.estimatedMinutes}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
