import { useApp } from '../context/AppContext';
import { Task, DeadlinePrediction } from '../types';
import { AlertTriangle, Clock, Zap, Target, Sparkles, Flame, CheckCircle, ArrowRight } from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const {
    tasks,
    predictions,
    getStressLevel,
    emergencySettings,
    triggerPanicMode,
    isAnalyzingPredictions,
    runDeadlinePrediction,
    setActiveTaskId
  } = useApp();

  const stressLevel = getStressLevel();

  // Get active pending tasks sorted by urgency
  const pendingTasks = [...tasks]
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Formatting remaining time beautifully
  const getRemainingTimeText = (deadlineStr: string) => {
    const diffMs = new Date(deadlineStr).getTime() - Date.now();
    if (diffMs <= 0) return 'Overdue';
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `${mins}m remaining`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs}h remaining`;
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'high':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'medium':
        return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getStressColor = (level: number) => {
    if (level < 30) return 'text-emerald-600';
    if (level < 60) return 'text-amber-500';
    if (level < 85) return 'text-orange-500';
    return 'text-rose-600';
  };

  const getStressBg = (level: number) => {
    if (level < 30) return 'bg-emerald-500';
    if (level < 60) return 'bg-amber-500';
    if (level < 85) return 'bg-orange-500';
    return 'bg-rose-600';
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-emerald-500 bg-emerald-50';
    if (conf >= 50) return 'text-amber-500 bg-amber-50';
    return 'text-rose-500 bg-rose-50';
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* 1. Emergency Crisis Banner */}
      {(emergencySettings.isPanicMode || stressLevel >= 75) && (
        <section className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse shadow-sm" id="emergency-banner">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-rose-900 font-bold text-lg">
                {emergencySettings.isPanicMode ? 'Emergency Panic Mode Active' : 'Extreme Procrastination Crisis Detected'}
              </h3>
              <p className="text-rose-700 text-sm">
                Stress level is at <span className="font-extrabold">{stressLevel}%</span>. Your workflow has been prioritized. Let S.O.S Coach lock down your schedule.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!emergencySettings.isPanicMode) triggerPanicMode(true);
              setActiveTab('panic');
            }}
            className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-rose-200 cursor-pointer"
          >
            Go to Panic Station
          </button>
        </section>
      )}

      {/* 2. Top Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="stats-grid">
        {/* Stress Meter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm" id="stress-meter">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Anxiety Stress Meter</p>
            <Flame className={`w-5 h-5 ${getStressColor(stressLevel)}`} />
          </div>
          <div className="my-3">
            <div className="flex items-baseline justify-between">
              <span className={`text-4xl font-extrabold tracking-tight ${getStressColor(stressLevel)}`}>
                {stressLevel}%
              </span>
              <span className="text-xs font-semibold uppercase text-slate-400">
                {stressLevel < 35 ? 'Calm / Safe' : stressLevel < 65 ? 'Elevated' : stressLevel < 85 ? 'High Risk' : 'CRITICAL PANIC'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${getStressBg(stressLevel)}`}
                style={{ width: `${stressLevel}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Calculated from task deadlines & prediction risk.
          </p>
        </div>

        {/* Task Completion Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm" id="task-completion">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Task Completion</p>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-center space-x-4 my-3">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path 
                  className="stroke-current text-slate-100" 
                  strokeWidth="3.5" 
                  fill="none" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path 
                  className="stroke-current text-indigo-500 transition-all duration-700" 
                  strokeDasharray={`${completionPercentage}, 100`} 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  fill="none" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-slate-800">
                {completionPercentage}%
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">
                {completedCount} <span className="text-sm font-normal text-slate-400">/ {totalCount}</span>
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Tasks archived</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('tasks')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 self-start cursor-pointer"
          >
            <span>Manage Tasks</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Weekly Efficiency */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm" id="weekly-efficiency">
          <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Crisis Prediction Accuracy</p>
          <div className="flex items-end space-x-2 h-14 my-2">
            <div className="flex-1 bg-slate-100 rounded-t h-4" title="Mon"></div>
            <div className="flex-1 bg-slate-100 rounded-t h-7" title="Tue"></div>
            <div className="flex-1 bg-indigo-200 rounded-t h-12" title="Wed"></div>
            <div className="flex-1 bg-indigo-400 rounded-t h-10" title="Thu"></div>
            <div className="flex-1 bg-indigo-500 rounded-t h-14" title="Fri"></div>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">92% Reliable AI</span>
            <span className="text-emerald-500 font-bold">+5% validation</span>
          </div>
        </div>

        {/* Procrastination Cost Saved */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm" id="hours-saved">
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Rescue Hours Saved</p>
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-slate-800">
              8.5<span className="text-lg text-slate-400 font-normal"> hrs</span>
            </p>
            <p className="text-emerald-500 text-xs font-bold mt-1 flex items-center space-x-1">
              <span>🚀 Saved by scope-reducing suggestion</span>
            </p>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Based on completed tasks ahead of predictions.
          </p>
        </div>
      </div>

      {/* 3. Main Dashboard Body: Emergency Queue & AI Coach Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-body">
        {/* Left column: Priority Queue */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col p-6" id="priority-queue">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-extrabold text-xl text-slate-800">Priority Emergency Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">High-impact tasks requiring immediate attention</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={runDeadlinePrediction}
                disabled={isAnalyzingPredictions || pendingTasks.length === 0}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span>{isAnalyzingPredictions ? 'Analyzing...' : 'Recalculate Risk'}</span>
              </button>
              <button 
                onClick={() => setActiveTab('tasks')}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-bold px-3 py-1.5 cursor-pointer"
              >
                All Tasks
              </button>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200" id="no-tasks">
                <CheckCircle className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm font-semibold">No pending tasks!</p>
                <p className="text-xs text-slate-400">You are entirely safe from deadline danger.</p>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                >
                  Create Emergency Task
                </button>
              </div>
            ) : (
              pendingTasks.map((task) => {
                const pred = predictions.find(p => p.taskId === task.id);
                const confidence = task.aiConfidence !== undefined ? task.aiConfidence : 50;

                return (
                  <div 
                    key={task.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all gap-4 shadow-xs"
                    id={`queue-task-${task.id}`}
                  >
                    <div className="flex items-start space-x-3 w-full sm:w-auto">
                      <div className={`w-1.5 h-12 rounded-full shrink-0 ${
                        task.priority === 'critical' ? 'bg-rose-500' :
                        task.priority === 'high' ? 'bg-amber-500' :
                        task.priority === 'medium' ? 'bg-indigo-500' : 'bg-slate-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-800 truncate text-sm sm:text-base">{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                          <span className="flex items-center font-medium text-slate-600">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {getRemainingTimeText(task.deadline)}
                          </span>
                          <span className="uppercase font-semibold tracking-wider text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-sm">
                            {task.difficulty}
                          </span>
                          <span className="text-slate-400">
                            Est: {task.estimatedMinutes}m
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                      <div className="text-left sm:text-right shrink-0">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${getConfidenceColor(confidence)}`}>
                          🔮 AI Confidence: {confidence}%
                        </span>
                        {pred && pred.chanceOfMissing > 40 && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1 max-w-[140px] truncate" title={pred.reason}>
                            ⚠️ High miss risk!
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setActiveTaskId(task.id);
                            if (emergencySettings.isPanicMode) {
                              setActiveTab('panic');
                            } else {
                              setActiveTab('coach');
                            }
                          }}
                          className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          S.O.S Coach
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: AI Coach Feedback widget */}
        <div className="bg-indigo-900 rounded-3xl shadow-xl p-6 text-white flex flex-col justify-between space-y-6" id="coach-quick-widget">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">S.O.S Coach Action Center</h3>
                <p className="text-[10px] text-indigo-300">Powered by Gemini 3.5 Flash</p>
              </div>
            </div>
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          </div>

          <div className="flex-1 bg-white/10 rounded-2xl p-4 text-xs sm:text-sm leading-relaxed overflow-y-auto max-h-[220px]">
            <p className="text-indigo-100 italic font-serif">
              "Anxiety is a warning signal, not an absolute reality. Do not over-schedule or overthink. Choose one high-impact task, throw away distractions, and work for 25 continuous minutes. I am here to help you scope-reduce or time-block your chaos."
            </p>
            <div className="mt-4 p-3 bg-indigo-500/30 rounded-xl border border-white/10">
              <p className="text-[10px] uppercase font-bold text-indigo-300 mb-1 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Panic Quick Guide</span>
              </p>
              <p className="text-xs text-white/90">
                Vibe Mode: <span className="font-extrabold uppercase">{emergencySettings.coachingVibe.replace('_', ' ')}</span> is active. You can customize this anytime on the coach panel.
              </p>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('coach')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-950 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>Ask AI Coach For Assistance</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
