import { useState, useRef, useEffect, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, Send, Trash2, ShieldAlert, CheckCircle2, 
  User, Compass, Smile, EyeOff, Volume2 
} from 'lucide-react';

export default function AICoach() {
  const {
    tasks,
    activeTaskId,
    setActiveTaskId,
    coachMessages,
    isCoachTyping,
    emergencySettings,
    updateEmergencySettings,
    sendMessageToCoach,
    clearCoachChat
  } = useApp();

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachMessages, isCoachTyping]);

  const activeTask = tasks.find(t => t.id === activeTaskId);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isCoachTyping) return;

    const query = input.trim();
    setInput('');
    await sendMessageToCoach(query);
  };

  const getVibeIcon = (vibe: string) => {
    switch (vibe) {
      case 'drill_sergeant': return '📢';
      case 'comforting_friend': return '🌸';
      case 'hyper_logical': return '🧮';
      default: return '🚨';
    }
  };

  const getVibeLabel = (vibe: string) => {
    switch (vibe) {
      case 'drill_sergeant': return 'Drill Sergeant';
      case 'comforting_friend': return 'Comforting Friend';
      case 'hyper_logical': return 'Hyper Logical';
      default: return 'Extreme Urgency';
    }
  };

  const getVibeColor = (vibe: string) => {
    switch (vibe) {
      case 'drill_sergeant': return 'border-red-400 text-red-700 bg-red-50';
      case 'comforting_friend': return 'border-emerald-400 text-emerald-700 bg-emerald-50';
      case 'hyper_logical': return 'border-indigo-400 text-indigo-700 bg-indigo-50';
      default: return 'border-rose-500 text-rose-700 bg-rose-50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[500px]" id="coach-workspace">
      
      {/* Left panel: Persona Selector & Active Context */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between space-y-6 shadow-sm" id="coach-settings-panel">
        <div className="space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-wider">AI Coaching Vibe</h3>
            <p className="text-xs text-slate-400 mt-0.5">Adapt the coach's voice to match your current psychological state</p>
          </div>

          {/* Vibe Selection Stack */}
          <div className="space-y-2.5" id="vibe-selectors">
            {(['drill_sergeant', 'comforting_friend', 'hyper_logical', 'extreme_urgency'] as const).map((vibe) => {
              const active = emergencySettings.coachingVibe === vibe;
              return (
                <button
                  key={vibe}
                  type="button"
                  onClick={() => updateEmergencySettings({ coachingVibe: vibe })}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                    active 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md font-bold' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-xl shrink-0">{getVibeIcon(vibe)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm truncate">{getVibeLabel(vibe)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Context Widget */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Task Focus</h4>
            {activeTask ? (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3.5 space-y-2" id="active-context-card">
                <p className="text-xs font-extrabold text-indigo-700">Currently assisting you with:</p>
                <p className="font-black text-slate-800 text-sm truncate">{activeTask.title}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                  <span>Est: {activeTask.estimatedMinutes}m</span>
                  <span className="uppercase text-indigo-600 font-bold">{activeTask.priority}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTaskId(null)}
                  className="w-full mt-2 text-center text-[10px] text-rose-500 hover:text-rose-700 font-bold uppercase tracking-wider bg-white py-1.5 border border-rose-100 rounded-lg transition-all cursor-pointer"
                >
                  Clear Task Focus
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center text-xs text-slate-400" id="no-context-card">
                <p>No active task locked.</p>
                <p className="mt-1 text-[10px] text-slate-400">Head to the <strong>Tasks</strong> list and press <strong>"Ask AI Coach"</strong> on any item to load target context.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="border-t border-slate-100 pt-4" id="chat-quick-suggestions">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Stuck? Click to prompt:</p>
          <div className="flex flex-wrap gap-1.5">
            <button 
              onClick={() => setInput("I'm experiencing intense study paralysis. How do I start?")}
              className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-bold transition-all text-left truncate max-w-full cursor-pointer"
            >
              ⚡ Beat Paralysis
            </button>
            <button 
              onClick={() => setInput("This task is huge. Can you break it into 4 micro-steps?")}
              className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-bold transition-all text-left truncate max-w-full cursor-pointer"
            >
              📝 Break it down
            </button>
            <button 
              onClick={() => setInput("Help! I have a deadline in 1 hour and I haven't coded anything.")}
              className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-bold transition-all text-left truncate max-w-full cursor-pointer"
            >
              🔥 1-Hour Deadline
            </button>
          </div>
        </div>
      </div>

      {/* Right 3 columns: Interactive Chat Console */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl flex flex-col justify-between overflow-hidden shadow-sm h-full" id="coach-chat-console">
        
        {/* Chat Console Header */}
        <div className="h-16 border-b border-slate-150 px-6 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg border ${getVibeColor(emergencySettings.coachingVibe)}`}>
              {getVibeIcon(emergencySettings.coachingVibe)}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center space-x-2">
                <span>S.O.S Crisis Coach</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600 uppercase font-extrabold">
                  {emergencySettings.coachingVibe.replace('_', ' ')}
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={clearCoachChat}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Message Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" id="chat-messages-container">
          {coachMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex items-start space-x-3 max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-xs ${
                  isUser 
                    ? 'bg-slate-100 text-slate-700 border-slate-200' 
                    : 'bg-indigo-600 text-white border-indigo-700'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser 
                    ? 'bg-slate-900 text-white rounded-tr-none font-medium' 
                    : msg.isEmergency 
                    ? 'bg-rose-50/80 text-slate-800 border border-rose-100 rounded-tl-none' 
                    : 'bg-slate-50 text-slate-800 border border-slate-150 rounded-tl-none shadow-xs'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className="block text-[9px] mt-2 opacity-40 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isCoachTyping && (
            <div className="flex items-start space-x-3 mr-auto max-w-[80%]" id="coach-typing-indicator">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-indigo-600 text-white border-indigo-700">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 text-slate-800 border border-slate-150 rounded-2xl rounded-tl-none p-4 py-3 shadow-xs">
                <div className="flex space-x-1.5 py-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSend} className="p-4 bg-slate-50 border-t border-slate-150 shrink-0 flex items-center space-x-3" id="coach-input-form">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isCoachTyping}
            placeholder={
              activeTask 
                ? `Ask Gemini about "${activeTask.title}"...` 
                : "Ask S.O.S Coach how to beat procrastination, split tasks, or prioritize..."
            }
            className="flex-1 bg-white px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 text-xs sm:text-sm"
          />
          <button 
            type="submit" 
            disabled={isCoachTyping || !input.trim()}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
