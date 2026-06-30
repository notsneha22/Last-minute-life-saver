import { useState, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, AlertTriangle, Play, Sparkles, Trash2, 
  Plus, Check, MessageSquare, Clock 
} from 'lucide-react';

export default function Reminders() {
  const {
    tasks,
    reminders,
    addManualReminder,
    dismissReminder
  } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [minutesBefore, setMinutesBefore] = useState(30);
  const [customMsg, setCustomMsg] = useState('');

  const activeTasks = tasks.filter(t => t.status !== 'completed');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId) return;

    addManualReminder(selectedTaskId, minutesBefore, customMsg.trim());
    
    // reset form
    setSelectedTaskId('');
    setMinutesBefore(30);
    setCustomMsg('');
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'panic':
        return 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse';
      case 'alert':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="reminders-panel-root">
      
      {/* Left 2 Columns: Live Alerts & Notification Center */}
      <div className="lg:col-span-2 space-y-6" id="live-alerts-workspace">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <Bell className="w-5 h-5 animate-swing" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg tracking-tight">Procrastination Alert Center</h3>
                <p className="text-xs text-slate-400">Live alarms based on real-time deadline proximity</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              {reminders.length} Active Alarms
            </span>
          </div>

          <div className="space-y-3" id="reminders-logs-stack">
            {reminders.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <Check className="w-12 h-12 text-emerald-500 bg-emerald-50 p-2.5 rounded-full mb-3" />
                <p className="text-slate-800 font-bold">No Urgent Alarms Triggered</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Your upcoming due dates are at a safe distance, or you haven't crossed any major warning intervals yet.
                </p>
              </div>
            ) : (
              reminders.map((rem) => {
                const isOverdue = rem.timeBefore === -1;
                return (
                  <div 
                    key={rem.id} 
                    className="flex items-start justify-between p-4 bg-slate-50 border border-slate-150 rounded-2xl gap-4 hover:border-slate-300 transition-all shadow-xs"
                    id={`reminder-log-${rem.id}`}
                  >
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="mt-1 shrink-0">
                        {isOverdue ? (
                          <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                        ) : (
                          <Clock className="w-5 h-5 text-indigo-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getSeverityBadgeColor(rem.severity)}`}>
                            {isOverdue ? 'CRISIS OVERDUE' : rem.severity}
                          </span>
                          <span className="text-xs font-extrabold text-slate-700 truncate max-w-[150px]">
                            {rem.taskTitle}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1.5 leading-relaxed">
                          {rem.message}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => dismissReminder(rem.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all shrink-0 cursor-pointer"
                      title="Acknowledge & Mute Alarm"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Custom Urgent Alarm Creator */}
      <div className="space-y-6" id="alerts-config-sidebar">
        
        {/* Manual Alarm Scheduler */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center space-x-1.5">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Schedule Custom Alarm</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Target Task</label>
              {activeTasks.length === 0 ? (
                <p className="text-xs text-rose-500 italic">Please create a task first to configure manual alerts.</p>
              ) : (
                <select
                  required
                  value={selectedTaskId}
                  onChange={e => setSelectedTaskId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-none"
                >
                  <option value="" disabled>-- Select Task Target --</option>
                  {activeTasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Alert Time Before Deadline</label>
              <select
                value={minutesBefore}
                onChange={e => setMinutesBefore(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-none"
              >
                <option value={5}>5 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>60 minutes before (1 hr)</option>
                <option value={120}>120 minutes before (2 hrs)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Custom Alert Action Message</label>
              <input
                type="text"
                placeholder="e.g., Commit final git branch! Verify slides are PDF."
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedTaskId || activeTasks.length === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer"
            >
              Set Sub-Task Alert
            </button>
          </form>
        </div>

        {/* Dynamic Alarm Guide rules */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-md">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-indigo-400">System Audio Beeps</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our background coordinator monitors remaining hours and pushes dynamic audio beeps when:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
              <span><strong>Overdue:</strong> Immediate continuous alerts to save content.</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
              <span><strong>15 mins remaining:</strong> Final push alarm guidelines.</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
              <span><strong>60 mins remaining:</strong> Priority scheduling warnings.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
