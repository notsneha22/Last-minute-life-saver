export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO Datetime string
  estimatedMinutes: number;
  actualMinutesSpent?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'work' | 'school' | 'personal' | 'exam' | 'project';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  difficulty: 'easy' | 'medium' | 'hard' | 'brutal';
  aiConfidence?: number; // Calculated probability (0-100) of finishing on time
}

export interface DeadlinePrediction {
  taskId: string;
  taskTitle: string;
  chanceOfMissing: number; // 0-100
  reason: string;
  suggestion: string;
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  isEmergency?: boolean;
}

export interface ScheduleBlock {
  id: string;
  taskId?: string;
  taskTitle: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  isBreak: boolean;
  activity: string;
}

export interface Reminder {
  id: string;
  taskId: string;
  taskTitle: string;
  message: string;
  timeBefore: number; // minutes before deadline
  isSent: boolean;
  severity: 'info' | 'warning' | 'alert' | 'panic';
}

export interface EmergencySettings {
  isPanicMode: boolean;
  blockDistractions: boolean;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  coachingVibe: 'drill_sergeant' | 'comforting_friend' | 'hyper_logical' | 'extreme_urgency';
}
