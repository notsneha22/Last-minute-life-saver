import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Schedule from './components/Schedule';
import AICoach from './components/AICoach';
import PanicMode from './components/PanicMode';
import Reminders from './components/Reminders';

import { 
  Flame, LayoutDashboard, CheckSquare, Calendar, Sparkles, 
  AlertOctagon, Bell, Clock, User, ShieldAlert 
} from 'lucide-react';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { 
    emergencySettings, 
    getStressLevel,
    reminders 
  } = useApp();

  const stressLevel = getStressLevel();

  // Clock Update Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getSidebarItemClass = (tabName: string) => {
    const base = "flex items-center px-4 py-3 rounded-xl space-x-3 cursor-pointer transition-all font-bold text-sm w-full text-left ";
    if (activeTab === tabName) {
      return base + "bg-indigo-600 text-white shadow-md shadow-indigo-950/20";
    }
    return base + "text-slate-300 hover:bg-slate-800 hover:text-white";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900" id="life-saver-shell">
      
      {/* 1. Sidebar Panel */}
      <aside className="w-full md:w-64 bg-slate-900 flex flex-col justify-between text-slate-300 border-r border-slate-800 shrink-0" id="sidebar-panel">
        
        {/* Sidebar Header / Brand */}
        <div className="p-6 pb-2" id="sidebar-header">
          <div className="flex items-center space-x-3 text-white">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-950/50">
              L
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block leading-none">LifeSaver AI</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Last Minute Rescue</span>
            </div>
          </div>

          {/* Stress Index Badge */}
          <div className="mt-6 p-3 bg-slate-850 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className={`w-4 h-4 ${stressLevel > 65 ? 'text-rose-500 animate-pulse' : 'text-indigo-400'}`} />
              <span className="text-xs font-bold text-slate-200">Anxiety Level:</span>
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-sm ${
              stressLevel > 75 ? 'bg-rose-900/50 text-rose-300 border border-rose-800' : 'bg-indigo-950 text-indigo-300'
            }`}>
              {stressLevel}%
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 space-y-1.5 mt-4" id="sidebar-nav">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={getSidebarItemClass('dashboard')}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="flex-1">Overview Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab('tasks')} 
            className={getSidebarItemClass('tasks')}
          >
            <CheckSquare className="w-5 h-5 shrink-0" />
            <span className="flex-1">Task Coordinator</span>
          </button>

          <button 
            onClick={() => setActiveTab('schedule')} 
            className={getSidebarItemClass('schedule')}
          >
            <Calendar className="w-5 h-5 shrink-0" />
            <span className="flex-1">AI Chrono Schedule</span>
          </button>

          <button 
            onClick={() => setActiveTab('coach')} 
            className={getSidebarItemClass('coach')}
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            <span className="flex-1">AI S.O.S Coach</span>
          </button>

          <button 
            onClick={() => setActiveTab('panic')} 
            className={`${getSidebarItemClass('panic')} ${
              emergencySettings.isPanicMode 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-950/20 animate-pulse' 
                : 'hover:bg-rose-950/30 text-slate-300 hover:text-rose-400'
            }`}
          >
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <span className="flex-1">Panic Station</span>
            {emergencySettings.isPanicMode && (
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('reminders')} 
            className={getSidebarItemClass('reminders')}
          >
            <Bell className="w-5 h-5 shrink-0" />
            <span className="flex-1">Proximity Alarms</span>
            {reminders.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {reminders.length}
              </span>
            )}
          </button>
        </nav>

        {/* Sidebar Footer: AI Service Indicator */}
        <div className="p-4" id="sidebar-footer">
          <div className="bg-indigo-650/10 border border-indigo-500/10 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Gemini status</p>
            <div className="flex items-center mt-1.5 space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-indigo-200 font-semibold">Gemini 3.5 Flash online</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <main className="flex-1 flex flex-col min-w-0" id="main-scroll-pane">
        
        {/* Main Sticky Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0" id="main-header">
          
          {/* Left Header Info */}
          <div className="flex items-center space-x-2.5">
            <h1 className="text-base sm:text-lg font-black text-slate-800 capitalize tracking-tight">
              {activeTab === 'dashboard' && 'Production Overview Dashboard'}
              {activeTab === 'tasks' && 'Emergency Task Control'}
              {activeTab === 'schedule' && 'AI Chronological Sprints'}
              {activeTab === 'coach' && 'S.O.S Crisis Advisory'}
              {activeTab === 'panic' && 'Distraction Lockdown Station'}
              {activeTab === 'reminders' && 'Proximity Alarms Log'}
            </h1>
          </div>

          {/* Right Header Controls (Clock + Avatar) */}
          <div className="flex items-center space-x-4">
            
            {/* Live Clock widget */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-600 font-mono shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-extrabold">{formatClock(currentTime)}</span>
            </div>

            {/* Profile widget */}
            <div className="flex items-center space-x-2" id="user-avatar-pill">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800">Life Saver User</p>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Emergency Mode</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center font-black text-sm text-indigo-700 shadow-sm shrink-0">
                LS
              </div>
            </div>

          </div>
        </header>

        {/* 3. Primary Content Mount */}
        <div className="flex-1 p-6 overflow-y-auto" id="primary-view-mount">
          <div className="max-w-7xl mx-auto h-full animate-fadeIn" id="inner-view-container">
            {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
            {activeTab === 'tasks' && <Tasks />}
            {activeTab === 'schedule' && <Schedule />}
            {activeTab === 'coach' && <AICoach />}
            {activeTab === 'panic' && <PanicMode />}
            {activeTab === 'reminders' && <Reminders />}
          </div>
        </div>

      </main>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
