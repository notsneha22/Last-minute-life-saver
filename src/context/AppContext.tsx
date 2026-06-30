import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Task, DeadlinePrediction, CoachMessage, ScheduleBlock, Reminder, EmergencySettings } from '../types';

interface AppContextType {
  tasks: Task[];
  predictions: DeadlinePrediction[];
  scheduleBlocks: ScheduleBlock[];
  coachMessages: CoachMessage[];
  reminders: Reminder[];
  emergencySettings: EmergencySettings;
  activeTaskId: string | null;
  loading: boolean;
  isAnalyzingPredictions: boolean;
  isGeneratingSchedule: boolean;
  isCoachTyping: boolean;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  triggerPanicMode: (isOn: boolean) => void;
  updateEmergencySettings: (settings: Partial<EmergencySettings>) => void;
  setActiveTaskId: (id: string | null) => void;
  sendMessageToCoach: (text: string) => Promise<void>;
  clearCoachChat: () => void;
  generateAISchedule: (hours?: number) => Promise<void>;
  runDeadlinePrediction: () => Promise<void>;
  addManualReminder: (taskId: string, minutesBefore: number, customMsg?: string) => void;
  dismissReminder: (reminderId: string) => void;
  getStressLevel: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to calculate initial deadlines relative to now
const getFutureTime = (hoursFromNow: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + Math.round(hoursFromNow * 60));
  return d.toISOString();
};

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Hackathon Slide Deck & Pitch Demo Video',
    description: 'Assemble slides explaining our core value prop and record a 2-minute demo of the application features.',
    deadline: getFutureTime(3.5), // 3.5 hours from now
    estimatedMinutes: 90,
    priority: 'critical',
    category: 'project',
    status: 'in_progress',
    difficulty: 'brutal',
    aiConfidence: 45
  },
  {
    id: 'task-2',
    title: 'Deploy Express Backend to Cloud Run',
    description: 'Bind container port to 3000, set environment secrets, and verify live endpoints return health checks.',
    deadline: getFutureTime(1.5), // 1.5 hours from now
    estimatedMinutes: 45,
    priority: 'high',
    category: 'school',
    status: 'pending',
    difficulty: 'hard',
    aiConfidence: 65
  },
  {
    id: 'task-3',
    title: 'Write Literature Review Paper Draft',
    description: 'Draft intro, methodology, and citation sections for the CS ethics seminar paper.',
    deadline: getFutureTime(12), // 12 hours from now
    estimatedMinutes: 240,
    priority: 'medium',
    category: 'school',
    status: 'pending',
    difficulty: 'hard',
    aiConfidence: 30
  },
  {
    id: 'task-4',
    title: 'Buy Monster Energy & Clean Workspace Desk',
    description: 'Clear caffeine cans, stack journals, and configure secondary monitor to prepare for the midnight marathon.',
    deadline: getFutureTime(2), // 2 hours from now
    estimatedMinutes: 15,
    priority: 'low',
    category: 'personal',
    status: 'completed',
    difficulty: 'easy',
    aiConfidence: 100
  }
];

const INITIAL_COACH_MESSAGES: CoachMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'coach',
    text: "⚠️ STRESS ALARM DETECTED. I'm S.O.S Coach, your direct emergency productivity rescue. Tell me what's paralyzed you or press 'PANIC BUTTON' to enter distraction-free extreme study pacing.",
    timestamp: new Date().toISOString()
  }
];

const DEFAULT_EMERGENCY_SETTINGS: EmergencySettings = {
  isPanicMode: false,
  blockDistractions: true,
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  coachingVibe: 'drill_sergeant'
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('llsaver_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [predictions, setPredictions] = useState<DeadlinePrediction[]>(() => {
    const saved = localStorage.getItem('llsaver_predictions');
    return saved ? JSON.parse(saved) : [];
  });

  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>(() => {
    const saved = localStorage.getItem('llsaver_schedule');
    return saved ? JSON.parse(saved) : [];
  });

  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>(() => {
    const saved = localStorage.getItem('llsaver_messages');
    return saved ? JSON.parse(saved) : INITIAL_COACH_MESSAGES;
  });

  const [emergencySettings, setEmergencySettings] = useState<EmergencySettings>(() => {
    const saved = localStorage.getItem('llsaver_settings');
    return saved ? JSON.parse(saved) : DEFAULT_EMERGENCY_SETTINGS;
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    return localStorage.getItem('llsaver_active_task_id') || null;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('llsaver_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);
  const [isAnalyzingPredictions, setIsAnalyzingPredictions] = useState(false);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [isCoachTyping, setIsCoachTyping] = useState(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('llsaver_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('llsaver_predictions', JSON.stringify(predictions));
  }, [predictions]);

  useEffect(() => {
    localStorage.setItem('llsaver_schedule', JSON.stringify(scheduleBlocks));
  }, [scheduleBlocks]);

  useEffect(() => {
    localStorage.setItem('llsaver_messages', JSON.stringify(coachMessages));
  }, [coachMessages]);

  useEffect(() => {
    localStorage.setItem('llsaver_settings', JSON.stringify(emergencySettings));
  }, [emergencySettings]);

  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem('llsaver_active_task_id', activeTaskId);
    } else {
      localStorage.removeItem('llsaver_active_task_id');
    }
  }, [activeTaskId]);

  useEffect(() => {
    localStorage.setItem('llsaver_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Generate dynamic reminders based on urgency
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newReminders: Reminder[] = [];

      tasks.forEach(task => {
        if (task.status === 'completed') return;
        const deadlineTime = new Date(task.deadline).getTime();
        const diffMinutes = Math.round((deadlineTime - now) / 60000);

        if (diffMinutes > 0) {
          // Alert at 60 mins, 30 mins, 10 mins
          const alertIntervals = [120, 60, 30, 15, 5];
          alertIntervals.forEach(mins => {
            const alreadyExists = reminders.some(r => r.taskId === task.id && r.timeBefore === mins);
            if (!alreadyExists && diffMinutes <= mins && diffMinutes > mins - 5) {
              let severity: 'info' | 'warning' | 'alert' | 'panic' = 'info';
              if (mins <= 15) severity = 'panic';
              else if (mins <= 30) severity = 'alert';
              else if (mins <= 60) severity = 'warning';

              newReminders.push({
                id: `reminder-${task.id}-${mins}`,
                taskId: task.id,
                taskTitle: task.title,
                message: `⏰ [${task.priority.toUpperCase()}] ${task.title} is due in ${diffMinutes} minutes! Action required immediately!`,
                timeBefore: mins,
                isSent: true,
                severity
              });
            }
          });
        } else {
          // Overdue detection
          const alreadyOverdue = reminders.some(r => r.taskId === task.id && r.timeBefore === -1);
          if (!alreadyOverdue) {
            newReminders.push({
              id: `reminder-${task.id}-overdue`,
              taskId: task.id,
              taskTitle: task.title,
              message: `🚨 EXPIRED: Deadline for "${task.title}" has passed! Pivot and salvage immediately!`,
              timeBefore: -1,
              isSent: true,
              severity: 'panic'
            });

            // Update task status to overdue if not completed
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'overdue' } : t));
          }
        }
      });

      if (newReminders.length > 0) {
        setReminders(prev => [...newReminders, ...prev]);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tasks, reminders]);

  // CRUD operations
  const addTask = (newTask: Omit<Task, 'id' | 'status'>) => {
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}`,
      status: 'pending',
      aiConfidence: 50 // initial guess
    };
    setTasks(prev => [task, ...prev]);
    // Auto trigger prediction calculation
    setTimeout(() => {
      runDeadlinePrediction().catch(console.error);
    }, 500);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const merged = { ...t, ...updates };
        // If deadline or estimated time changed, we recalculate confidence
        return merged;
      }
      return t;
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setPredictions(prev => prev.filter(p => p.taskId !== taskId));
    setScheduleBlocks(prev => prev.filter(s => s.taskId !== taskId));
    setReminders(prev => prev.filter(r => r.taskId !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const triggerPanicMode = (isOn: boolean) => {
    setEmergencySettings(prev => ({ ...prev, isPanicMode: isOn }));
    
    // Add S.O.S coach message
    const msg: CoachMessage = {
      id: `msg-${Date.now()}`,
      sender: 'coach',
      text: isOn 
        ? "🚨 EMERGENCY PANIC MODE ACTIVATED. Distractions blocked. Full-focus Pomodoro timer online. No looking back. What is our target task?"
        : "🧘 Stress level managed. Returning to normal scheduling mode. Great effort on keeping focused.",
      timestamp: new Date().toISOString(),
      isEmergency: isOn
    };
    setCoachMessages(prev => [...prev, msg]);
  };

  const updateEmergencySettings = (settings: Partial<EmergencySettings>) => {
    setEmergencySettings(prev => ({ ...prev, ...settings }));
  };

  // Stress Level Calculator (0-100) based on tasks remaining, priorities, and remaining time
  const getStressLevel = (): number => {
    const activeTasks = tasks.filter(t => t.status !== 'completed');
    if (activeTasks.length === 0) return 10;

    let totalWeight = 0;
    let highRiskCount = 0;

    activeTasks.forEach(t => {
      let weight = 10; // base
      if (t.priority === 'critical') weight += 30;
      if (t.priority === 'high') weight += 20;
      if (t.priority === 'medium') weight += 10;

      if (t.difficulty === 'brutal') weight += 25;
      if (t.difficulty === 'hard') weight += 15;

      // Deadline proximity factor
      const hrsRemaining = (new Date(t.deadline).getTime() - Date.now()) / 3600000;
      if (hrsRemaining > 0) {
        if (hrsRemaining < 2) weight += 30;
        else if (hrsRemaining < 6) weight += 20;
        else if (hrsRemaining < 12) weight += 10;
      } else {
        weight += 40; // overdue stress
      }

      // Check prediction risk
      const pred = predictions.find(p => p.taskId === t.id);
      if (pred && pred.chanceOfMissing > 50) {
        highRiskCount++;
        weight += (pred.chanceOfMissing / 5);
      }

      totalWeight += weight;
    });

    const calculated = Math.min(100, Math.round((totalWeight / (activeTasks.length * 110)) * 100));
    return isNaN(calculated) ? 20 : calculated;
  };

  // AI Integration - Send chat message
  const sendMessageToCoach = async (text: string) => {
    const userMsg: CoachMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    setCoachMessages(prev => [...prev, userMsg]);
    setIsCoachTyping(true);

    try {
      // Get current task context to feed to AI
      const currentTask = tasks.find(t => t.id === activeTaskId);

      const response = await fetch("/api/coach/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...coachMessages, userMsg],
          vibe: emergencySettings.coachingVibe,
          isEmergency: emergencySettings.isPanicMode,
          currentTaskContext: currentTask ? {
            title: currentTask.title,
            deadline: currentTask.deadline,
            difficulty: currentTask.difficulty,
            estimatedMinutes: currentTask.estimatedMinutes,
            status: currentTask.status
          } : null
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get coaching advice.");
      }

      const data = await response.json();
      const coachMsg: CoachMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'coach',
        text: data.text,
        timestamp: new Date().toISOString(),
        isEmergency: emergencySettings.isPanicMode
      };
      setCoachMessages(prev => [...prev, coachMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: CoachMessage = {
        id: `msg-error-${Date.now()}`,
        sender: 'coach',
        text: `⚠️ [S.O.S System]: I was offline momentarily. Hold on, but remember: action is the antidote to anxiety. Go work on your slides or coding! (Error: ${err.message})`,
        timestamp: new Date().toISOString()
      };
      setCoachMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsCoachTyping(false);
    }
  };

  const clearCoachChat = () => {
    setCoachMessages(INITIAL_COACH_MESSAGES);
  };

  // AI Integration - Generate timeline/blocks
  const generateAISchedule = async (hours = 8) => {
    setIsGeneratingSchedule(true);
    try {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      const response = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: activeTasks,
          availableHours: hours
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate schedule from AI.");
      }

      const data = await response.json();
      if (Array.isArray(data.blocks)) {
        setScheduleBlocks(data.blocks);
      }
    } catch (err: any) {
      console.error(err);
      // Fallback timeline generation if server/Gemini fails
      const fallbackBlocks: ScheduleBlock[] = [];
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      let current = new Date();

      activeTasks.forEach((t, i) => {
        // schedule 45 mins work
        const workStart = new Date(current);
        current.setMinutes(current.getMinutes() + Math.min(t.estimatedMinutes, 45));
        const workEnd = new Date(current);

        fallbackBlocks.push({
          id: `block-fallback-work-${t.id}-${i}`,
          taskId: t.id,
          taskTitle: t.title,
          startTime: workStart.toISOString(),
          endTime: workEnd.toISOString(),
          isBreak: false,
          activity: `Focus strictly on: ${t.title}`
        });

        // 5 mins break
        const breakStart = new Date(current);
        current.setMinutes(current.getMinutes() + 5);
        const breakEnd = new Date(current);

        fallbackBlocks.push({
          id: `block-fallback-break-${t.id}-${i}`,
          taskTitle: 'Quick Breath & Stretch',
          startTime: breakStart.toISOString(),
          endTime: breakEnd.toISOString(),
          isBreak: true,
          activity: 'Stand up, hydrate, and prepare for the next sprint.'
        });
      });

      setScheduleBlocks(fallbackBlocks);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  // AI Integration - Deadline Risk Predictions
  const runDeadlinePrediction = async () => {
    setIsAnalyzingPredictions(false);
    const activeTasks = tasks.filter(t => t.status !== 'completed');
    if (activeTasks.length === 0) return;

    setIsAnalyzingPredictions(true);
    try {
      const response = await fetch("/api/deadline/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: activeTasks })
      });

      if (!response.ok) {
        throw new Error("Failed to predict deadlines.");
      }

      const data = await response.json();
      if (Array.isArray(data.predictions)) {
        setPredictions(data.predictions);

        // Update task confidence levels directly
        setTasks(prev => prev.map(t => {
          const match = data.predictions.find((p: any) => p.taskId === t.id);
          if (match) {
            return {
              ...t,
              aiConfidence: Math.max(0, 100 - match.chanceOfMissing)
            };
          }
          return t;
        }));
      }
    } catch (err: any) {
      console.error(err);
      // Fallback simple prediction math
      const fallbackPredictions: DeadlinePrediction[] = activeTasks.map(t => {
        const hrsRemaining = (new Date(t.deadline).getTime() - Date.now()) / 3600000;
        const requiredHrs = t.estimatedMinutes / 60;
        let risk = 10;

        if (hrsRemaining <= 0) {
          risk = 100;
        } else if (requiredHrs > hrsRemaining) {
          risk = 90;
        } else {
          risk = Math.min(95, Math.round((requiredHrs / Math.max(0.1, hrsRemaining)) * 60));
        }

        return {
          taskId: t.id,
          taskTitle: t.title,
          chanceOfMissing: risk,
          reason: `Task requires approx. ${t.estimatedMinutes} mins, but only ${hrsRemaining.toFixed(1)} hours remain until submission.`,
          suggestion: "Request scope reduction immediately. Submit a draft, or use a boiler template to save 40% setup time."
        };
      });

      setPredictions(fallbackPredictions);
      setTasks(prev => prev.map(t => {
        const match = fallbackPredictions.find(p => p.taskId === t.id);
        if (match) {
          return {
            ...t,
            aiConfidence: 100 - match.chanceOfMissing
          };
        }
        return t;
      }));
    } finally {
      setIsAnalyzingPredictions(false);
    }
  };

  const addManualReminder = (taskId: string, minutesBefore: number, customMsg?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newReminder: Reminder = {
      id: `manual-reminder-${Date.now()}`,
      taskId,
      taskTitle: task.title,
      message: customMsg || `⚠️ Custom Alert: "${task.title}" is due soon! Stay alert!`,
      timeBefore: minutesBefore,
      isSent: false,
      severity: 'warning'
    };
    setReminders(prev => [newReminder, ...prev]);
  };

  const dismissReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  return (
    <AppContext.Provider value={{
      tasks,
      predictions,
      scheduleBlocks,
      coachMessages,
      reminders,
      emergencySettings,
      activeTaskId,
      loading,
      isAnalyzingPredictions,
      isGeneratingSchedule,
      isCoachTyping,
      addTask,
      updateTask,
      deleteTask,
      triggerPanicMode,
      updateEmergencySettings,
      setActiveTaskId,
      sendMessageToCoach,
      clearCoachChat,
      generateAISchedule,
      runDeadlinePrediction,
      addManualReminder,
      dismissReminder,
      getStressLevel
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
