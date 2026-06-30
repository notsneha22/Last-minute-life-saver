import { useState, FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { 
  Plus, Calendar, ShieldAlert, CheckCircle, Clock, Trash2, 
  Sparkles, Filter, Check, ListChecks, Play, AlertCircle 
} from 'lucide-react';

export default function Tasks() {
  const {
    tasks,
    predictions,
    addTask,
    updateTask,
    deleteTask,
    isAnalyzingPredictions,
    runDeadlinePrediction,
    setActiveTaskId
  } = useApp();

  // State for the "Create Task" form
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState<Task['category']>('school');
  const [difficulty, setDifficulty] = useState<Task['difficulty']>('medium');

  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadlineDate || !deadlineTime) return;

    // Combine date and time to ISO String
    const combinedIso = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();

    addTask({
      title,
      description,
      deadline: combinedIso,
      estimatedMinutes,
      priority,
      category,
      difficulty
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setDeadlineDate('');
    setDeadlineTime('');
    setEstimatedMinutes(45);
    setPriority('medium');
    setCategory('school');
    setDifficulty('medium');
    setShowAddForm(false);
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus: Task['status'] = task.status === 'completed' ? 'pending' : 'completed';
    updateTask(task.id, { status: newStatus });
  };

  const setTaskProgress = (taskId: string, status: Task['status']) => {
    updateTask(taskId, { status });
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    // Put completed at the bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    // Put critical/high priority higher
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (weightDiff !== 0) return weightDiff;

    // Sort by nearest deadline
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const getPriorityColor = (p: Task['priority']) => {
    switch (p) {
      case 'critical': return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getDifficultyColor = (d: Task['difficulty']) => {
    switch (d) {
      case 'brutal': return 'text-red-700 bg-red-100 font-extrabold';
      case 'hard': return 'text-orange-700 bg-orange-100 font-semibold';
      case 'medium': return 'text-amber-700 bg-amber-100 font-medium';
      default: return 'text-emerald-700 bg-emerald-100 font-medium';
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6" id="tasks-panel-root">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Emergency Task Coordinator</h2>
          <p className="text-sm text-slate-500">Add tasks and analyze their deadline risks instantly with AI predictions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-100 cursor-pointer"
            id="toggle-add-form-btn"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Scheduler' : 'Add Emergency Task'}</span>
          </button>
          <button
            onClick={runDeadlinePrediction}
            disabled={isAnalyzingPredictions || tasks.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-100 cursor-pointer disabled:opacity-50"
            id="ai-recalculate-predictions"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>{isAnalyzingPredictions ? 'Analyzing Risk...' : 'Run AI Predictions'}</span>
          </button>
        </div>
      </div>

      {/* Task Creation Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xl animate-fadeIn" id="create-task-form">
          <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">New Deadline Entry</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Task Title</label>
              <input 
                type="text" 
                placeholder="e.g., Deliverable Presentation PDF" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Deadline Date</label>
                <input 
                  type="date" 
                  value={deadlineDate}
                  onChange={e => setDeadlineDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Due Time</label>
                <input 
                  type="time" 
                  value={deadlineTime}
                  onChange={e => setDeadlineTime(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Crisis Description / Requirements</label>
            <textarea 
              placeholder="List down key files needed, references, or instructions to save time..." 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Estimated Time Required</label>
              <select 
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-sm"
              >
                <option value={15}>15 mins (Tweak / Clean)</option>
                <option value={30}>30 mins (Quick draft)</option>
                <option value={45}>45 mins (Sprint)</option>
                <option value={90}>1.5 hrs (Intermediate)</option>
                <option value={180}>3 hrs (Heavy core)</option>
                <option value={300}>5 hrs (Deep coding/writing)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Priority Rating</label>
              <select 
                value={priority}
                onChange={e => setPriority(e.target.value as Task['priority'])}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-sm font-semibold"
              >
                <option value="low">🟢 Low Urgency</option>
                <option value="medium">🔵 Medium Priority</option>
                <option value="high">🟠 High Alert</option>
                <option value="critical">🔴 CRITICAL BURNDOWN</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value as Task['category'])}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-sm"
              >
                <option value="project">💼 Work Project</option>
                <option value="school">🎓 Class / School</option>
                <option value="exam">📝 Exam prep</option>
                <option value="personal">👤 Personal admin</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Complexity / Difficulty</label>
              <select 
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as Task['difficulty'])}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 text-sm"
              >
                <option value="easy">Easy (Brain-dead)</option>
                <option value="medium">Medium (Moderate focus)</option>
                <option value="hard">Hard (Demands high energy)</option>
                <option value="brutal">Brutal (Exhausting grind)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              Initiate Deadline
            </button>
          </div>
        </form>
      )}

      {/* Filter and Command Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between" id="filter-bar">
        <div className="flex items-center space-x-2 text-slate-600 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Filters:</span>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full md:w-auto flex-1 max-w-xl">
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">📁 All Categories</option>
            <option value="project">💼 Project</option>
            <option value="school">🎓 School</option>
            <option value="exam">📝 Exam</option>
            <option value="personal">👤 Personal</option>
          </select>

          <select 
            value={filterPriority} 
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">🔥 All Priorities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🔵 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">📝 All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium shrink-0">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Task List Stack */}
      <div className="space-y-4" id="task-cards-list">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8">
            <ListChecks className="w-16 h-16 text-slate-300 mb-4" />
            <h4 className="text-lg font-bold text-slate-800">No matching tasks found</h4>
            <p className="text-sm text-slate-400 max-w-sm mt-1">Adjust filters above or create an emergency entry to prioritize your study or work schedule.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const pred = predictions.find(p => p.taskId === task.id);
            const isTaskOverdue = new Date(task.deadline).getTime() < Date.now() && task.status !== 'completed';
            const confidence = task.aiConfidence !== undefined ? task.aiConfidence : 50;

            return (
              <div 
                key={task.id} 
                className={`bg-white border rounded-3xl shadow-sm transition-all overflow-hidden ${
                  task.status === 'completed' 
                    ? 'border-slate-100 opacity-60' 
                    : isTaskOverdue
                    ? 'border-rose-400 ring-2 ring-rose-50/50'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
                id={`task-item-${task.id}`}
              >
                {/* Main Card Grid */}
                <div className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  
                  {/* Left: Task Info & Checkbox */}
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <button 
                      onClick={() => toggleTaskStatus(task)}
                      className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-all cursor-pointer ${
                        task.status === 'completed' 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300 hover:border-indigo-500 bg-white'
                      }`}
                    >
                      {task.status === 'completed' && <Check className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-black tracking-tight text-slate-800 text-lg truncate ${
                          task.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}>
                          {task.title}
                        </h3>
                        <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getDifficultyColor(task.difficulty)}`}>
                          {task.difficulty}
                        </span>
                      </div>

                      {task.description && (
                        <p className={`text-slate-500 text-sm max-w-2xl line-clamp-2 ${
                          task.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                        <span className="flex items-center text-slate-500 font-semibold bg-slate-100 px-2 py-1 rounded-md">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                          Due: {formatDate(task.deadline)}
                        </span>
                        <span className="flex items-center bg-indigo-50/50 text-indigo-600 px-2 py-1 rounded-md font-semibold">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Estimated Time: {task.estimatedMinutes} mins
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium uppercase tracking-wider text-[10px]">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: State actions & Confidence Dial */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
                    
                    {/* Status Selectors */}
                    {task.status !== 'completed' && (
                      <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => setTaskProgress(task.id, 'pending')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            task.status === 'pending' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Hold
                        </button>
                        <button
                          onClick={() => setTaskProgress(task.id, 'in_progress')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                            task.status === 'in_progress' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>Sprint</span>
                        </button>
                      </div>
                    )}

                    {/* Prediction confidence pill */}
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Success Probability</p>
                        <p className={`text-base font-extrabold ${
                          confidence >= 80 ? 'text-emerald-500' : confidence >= 50 ? 'text-amber-500' : 'text-rose-500'
                        }`}>
                          {task.status === 'completed' ? '100%' : `${confidence}% Chance`}
                        </p>
                      </div>
                      <div className="w-1.5 h-8 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`w-full rounded-full transition-all duration-500 ${
                            confidence >= 80 ? 'bg-emerald-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} 
                          style={{ height: `${task.status === 'completed' ? 100 : confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* S.O.S Button & Delete */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setActiveTaskId(task.id)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                      >
                        Ask AI Coach
                      </button>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Optional Expanded AI predictions box inside the task card */}
                {pred && task.status !== 'completed' && (
                  <div className="bg-indigo-50/40 border-t border-indigo-50 p-4 px-6 text-xs flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="bg-white p-1.5 rounded-lg border border-indigo-100 shrink-0">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-slate-700 font-semibold">
                        <span className="text-indigo-600 font-extrabold uppercase text-[10px] tracking-wider mr-1.5">AI Bottleneck analysis:</span> 
                        {pred.reason}
                      </p>
                      <p className="text-slate-500">
                        <span className="text-emerald-600 font-extrabold uppercase text-[10px] tracking-wider mr-1.5">Crisis Salvage Step:</span>
                        {pred.suggestion}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center space-x-2 bg-white/80 border border-indigo-100 rounded-xl px-2.5 py-1 font-bold">
                      <ShieldAlert className={`w-3.5 h-3.5 ${pred.chanceOfMissing > 60 ? 'text-rose-500' : 'text-amber-500'}`} />
                      <span className="text-slate-700">{pred.chanceOfMissing}% Miss Probability</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
