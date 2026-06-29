import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  SlidersHorizontal, 
  CheckCircle2, 
  Circle, 
  X,
  PlusCircle,
  ChevronDown,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { tasks as apiTasks } from '../../services/api.js';
import CustomDatePicker from '../Shared/CustomDatePicker.jsx';

export default function TasksPage({ 
  tasks, 
  setTasks 
}) {
  const [filter, setFilter] = useState('today');
  const [sortBy, setSortBy] = useState('priorityRank');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };
  
  // Voice AI highlighting states
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [completedAnimationTaskId, setCompletedAnimationTaskId] = useState(null);
  const [highlightedDeadlines, setHighlightedDeadlines] = useState(false);
  
  // Procrastination Interception States
  const [reschedulingTask, setReschedulingTask] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [activeInterception, setActiveInterception] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [blockerSelected, setBlockerSelected] = useState(null);
  const [blockerStep, setBlockerStep] = useState(1);

  // Strategy A Countdown Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);
  
  // Task Creation States
  const [title, setTitle] = useState('');
  const [urgency, setUrgency] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [openDropdown, setOpenDropdown] = useState(null);

  const renderDropdown = (name, value, options, onChange) => {
    const isOpen = openDropdown === name;
    const selectedLabel = options.find(o => o.value.toString() === value.toString())?.label;

    return (
      <div className="relative">
        <div 
          onClick={() => setOpenDropdown(isOpen ? null : name)}
          className={`bg-[#0B0B0B] border ${isOpen ? 'border-[#E5B842]/40 shadow-[0_0_10px_rgba(229,184,66,0.1)]' : 'border-white/10'} hover:border-white/20 rounded-xl px-3 py-3 text-sm text-white flex items-center justify-between cursor-pointer transition-all duration-300`}
        >
          <span className="truncate font-semibold text-white/80">{selectedLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#E5B842] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-[#050505] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
            {options.map((opt, i) => (
              <div 
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpenDropdown(null);
                }}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-all font-medium ${
                  value.toString() === opt.value.toString() ? 'text-[#E5B842] bg-[#E5B842]/5' : 'text-white/60 hover:text-white hover:bg-white/5'
                } ${i !== options.length - 1 ? 'border-b border-white/[0.02]' : ''}`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Slide-over states
  const [selectedTask, setSelectedTask] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiTasks.getAll();
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [setTasks]);

  useEffect(() => {
    setTimeout(() => {
      fetchTasks();
    }, 0);

    const handleRefetch = () => {
      fetchTasks();
    };

    const handleHighlightTask = (e) => {
      const taskId = e.detail?.taskId;
      if (taskId) {
        setHighlightedTaskId(taskId);
        setTimeout(() => {
          setHighlightedTaskId(null);
        }, 3000);
      }
    };

    const handleCompletedAnimation = (e) => {
      const taskId = e.detail?.taskId;
      if (taskId) {
        setCompletedAnimationTaskId(taskId);
        setTimeout(() => {
          setCompletedAnimationTaskId(null);
        }, 2000);
      }
    };

    const handleHighlightDeadlines = () => {
      setHighlightedDeadlines(true);
      setTimeout(() => {
        setHighlightedDeadlines(false);
      }, 4000);
    };

    const handleFilterTasks = (e) => {
      const { filter: newFilter, sortBy: newSortBy } = e.detail || {};
      if (newFilter) setFilter(newFilter);
      if (newSortBy) setSortBy(newSortBy);
      
      // Optional: Visual confirmation toast
      const filterName = newFilter === 'today' ? 'Today' : newFilter === 'upcoming' ? 'Upcoming' : newFilter === 'completed' ? 'Completed' : 'All';
      const sortName = newSortBy === 'priorityRank' ? 'Priority' : newSortBy === 'dueDate' ? 'Due Date' : 'Recent';
      showToast(`Showing ${filterName} tasks sorted by ${sortName}`, 'success');
    };

    window.addEventListener('resq:refetch-tasks', handleRefetch);
    window.addEventListener('resq:highlight-task', handleHighlightTask);
    window.addEventListener('resq:task-completed-animation', handleCompletedAnimation);
    window.addEventListener('resq:highlight-deadlines', handleHighlightDeadlines);
    window.addEventListener('resq:filter-tasks', handleFilterTasks);

    return () => {
      window.removeEventListener('resq:refetch-tasks', handleRefetch);
      window.removeEventListener('resq:highlight-task', handleHighlightTask);
      window.removeEventListener('resq:task-completed-animation', handleCompletedAnimation);
      window.removeEventListener('resq:highlight-deadlines', handleHighlightDeadlines);
      window.removeEventListener('resq:filter-tasks', handleFilterTasks);
    };
  }, [fetchTasks]);

  // Filtering Logic
  const isTodayOrNoDate = (dateStr) => {
    if (!dateStr) return true; // No date means do it today
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  const isStrictlyToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  const filteredTasks = (tasks || []).filter((t) => {
    if (filter === 'today') {
      if (!t.completed) {
        return isTodayOrNoDate(t.dueDate);
      } else {
        return isStrictlyToday(t.updatedAt || t.createdAt);
      }
    }
    if (filter === 'completed') return t.completed;
    if (filter === 'pending') return !t.completed;
    if (filter === 'critical') return !t.completed && t.urgency >= 9;
    return true; // 'all'
  });

  // Sorting Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // 1. Always put completed tasks at the very bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // 2. Main sort logic for incomplete tasks
    if (sortBy === 'priorityRank') {
      const rankA = a.aiPriorityRank !== undefined && a.aiPriorityRank !== null ? a.aiPriorityRank : 999;
      const rankB = b.aiPriorityRank !== undefined && b.aiPriorityRank !== null ? b.aiPriorityRank : 999;
      if (rankA !== rankB) return rankA - rankB;
      
      // If same priority, newest created comes first (top)
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      
      return b.urgency - a.urgency;
    }
    if (sortBy === 'urgency') return b.urgency - a.urgency;
    if (sortBy === 'duration') return (b.estimatedMinutes || b.duration || 0) - (a.estimatedMinutes || a.duration || 0);
    return 0;
  });

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const taskData = {
        title,
        urgency: urgency ? parseInt(urgency) : undefined,
        dueDate: new Date(dueDate),
        estimatedMinutes: 30,
        category: 'Work',
        subtasks: [
          { title: 'Formulate core structure', completed: false }
        ]
      };

      const created = await apiTasks.create(taskData);
      setTasks(prev => [created, ...prev]);
      setTitle('');

      // Run AI Reprioritization and fetch new priorities
      await apiTasks.reprioritize();
      const refetched = await apiTasks.getAll();
      setTasks(refetched);
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleToggleTask = async (id) => {
    try {
      const task = tasks.find(t => t._id === id);
      if (!task) return;
      
      // Optimistic UI Update
      setTasks(prev => prev.map(t => t._id === id ? { ...t, completed: !task.completed } : t));
      
      const updated = await apiTasks.update(id, { completed: !task.completed });
      
      // Update with server response just in case
      setTasks(prev => prev.map(t => t._id === id ? updated : t));
      
      // Update selectedTask panel too if it's currently open
      if (selectedTask?._id === id) {
        setSelectedTask(updated);
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      // Revert optimistic update on error
      setTasks(prev => prev.map(t => t._id === id ? { ...t, completed: !t.completed } : t));
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await apiTasks.delete(id);
      setTasks(prev => prev.filter(t => t._id !== id));
      if (selectedTask?._id === id) setSelectedTask(null);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleClearOldTasks = async () => {
    if (!window.confirm("Delete all completed tasks older than 7 days?")) return;
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const oldTasks = tasks.filter(t => t.completed && new Date(t.updatedAt || t.createdAt) < sevenDaysAgo);
      
      for (const t of oldTasks) {
        await apiTasks.delete(t._id);
      }
      
      setTasks(prev => prev.filter(t => !oldTasks.find(ot => ot._id === t._id)));
      showToast(`Cleared ${oldTasks.length} old tasks!`);
    } catch (err) {
      console.error('Error clearing old tasks:', err);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTask) return;
    
    const updatedSubtasks = [
      ...(selectedTask.subtasks || []),
      { title: newSubtaskTitle, completed: false }
    ];

    try {
      const updated = await apiTasks.update(selectedTask._id, { subtasks: updatedSubtasks });
      setTasks(prev => prev.map(t => t._id === selectedTask._id ? updated : t));
      setSelectedTask(updated);
      setNewSubtaskTitle('');
    } catch (err) {
      console.error('Error adding subtask:', err);
    }
  };

  const toggleSubtask = async (subtaskIdx) => {
    if (!selectedTask) return;

    const updatedSubtasks = selectedTask.subtasks.map((st, sIdx) => 
      sIdx === subtaskIdx ? { ...st, completed: !st.completed } : st
    );

    try {
      const updated = await apiTasks.update(selectedTask._id, { subtasks: updatedSubtasks });
      setTasks(prev => prev.map(t => t._id === selectedTask._id ? updated : t));
      setSelectedTask(updated);
    } catch (err) {
      console.error('Error toggling subtask:', err);
    }
  };
  
  // Reschedule & Procrastination Action Handlers
  const handleOpenReschedule = (e, task) => {
    e.stopPropagation();
    setReschedulingTask(task);
    setRescheduleDate(new Date(task.dueDate).toISOString().slice(0, 10));
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!reschedulingTask) return;

    try {
      const response = await apiTasks.update(reschedulingTask._id, { dueDate: new Date(rescheduleDate) });
      
      // Update task list locally. Check if response is the task directly or wrapped
      const updatedTaskObj = response.procrastinationInterception ? response : response;
      setTasks(prev => prev.map(t => t._id === reschedulingTask._id ? (response.procrastinationInterception ? response : response) : t));
      
      setReschedulingTask(null);

      // Check if procrastination interception is triggered
      if (response.procrastinationInterception) {
        const strategy = response.procrastinationInterception;
        setActiveInterception({
          ...strategy,
          task: response
        });
        // If Strategy A (Micro Action), start the 5 minute timer
        if (strategy.strategy === 'A') {
          setTimerSeconds(300);
          setIsTimerRunning(true);
        } else {
          setIsTimerRunning(false);
        }
        setBlockerSelected(null);
        setBlockerStep(1);
      } else {
        showToast("Task rescheduled successfully!");
      }
    } catch (err) {
      console.error('Error rescheduling task:', err);
      showToast("Failed to reschedule task.", 'error');
    }
  };

  const handleMicroActionComplete = async () => {
    if (!activeInterception?.task) return;
    await handleToggleTask(activeInterception.task._id);
    setActiveInterception(null);
    setIsTimerRunning(false);
    showToast("Incredible! You crushed the friction and finished the task.");
  };

  const handleAddBlockerSubtasks = async () => {
    if (!activeInterception?.task) return;
    const subtasks = [
      { title: 'Open the workspace and focus environment', completed: false },
      { title: 'Write down exactly one single line of draft/code', completed: false },
      { title: 'Read the instructions or requirements page for 2 minutes', completed: false }
    ];
    try {
      const updated = await apiTasks.update(activeInterception.task._id, { subtasks });
      setTasks(prev => prev.map(t => t._id === activeInterception.task._id ? updated : t));
      showToast("3 starter subtasks added to help you break the ice!");
      setActiveInterception(null);
    } catch (err) {
      console.error('Error adding subtasks:', err);
    }
  };

  const handleCommitNow = () => {
    setActiveInterception(prev => ({
      ...prev,
      strategy: 'A',
      message: "Great choice! Let's build momentum now.",
      action: "Spend just 5 minutes of focused work on this task."
    }));
    setTimerSeconds(300);
    setIsTimerRunning(true);
  };

  return (
    <div className="space-y-5 lg:space-y-8 animate-fade-in relative font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <span className="text-xs lg:text-sm font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-1.5 lg:mb-2">TASK SHEETS</span>
          <h2 className="text-2xl lg:text-3xl font-display font-black tracking-tight text-white leading-none">
            Manage Tasks
          </h2>
        </div>
      </div>

      {/* Task Creation Form */}
      <form onSubmit={handleCreateTask} className="p-4 lg:p-6 bg-[#090909] border border-white/[0.04] rounded-2xl space-y-4 layered-shadow-lg">
        <h3 className="text-sm font-bold text-[#E5B842] tracking-widest uppercase font-display mb-3 lg:mb-4">Quick Add Priority Node</h3>
        
        <div className="flex flex-col gap-3">
          <input 
            type="text"
            placeholder="What needs to be finished?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-hidden transition-all duration-300"
            required
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Urgency */}
            <div className="col-span-1">
              {renderDropdown('urgency', urgency, [
                { value: '', label: 'Set Urgency' },
                { value: 4, label: 'Urgency: 4' },
                { value: 6, label: 'Urgency: 6 (Med)' },
                { value: 8, label: 'Urgency: 8 (High)' },
                { value: 10, label: 'Urgency: 10 (Crit)' }
              ], setUrgency)}
            </div>

            {/* Due date */}
            <div className="col-span-1">
              <CustomDatePicker 
                value={dueDate}
                onChange={(dateStr) => setDueDate(dateStr)}
              />
            </div>

            <button 
              type="submit"
              className="col-span-2 lg:col-span-2 px-4 py-3 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex justify-center items-center gap-1.5 cursor-pointer font-sans active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Deploy Task
            </button>
          </div>
        </div>
      </form>

      {/* Filters and sorting strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        {/* Filters — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
          {['today', 'all', 'pending', 'completed', 'critical'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              style={{ minHeight: 'auto' }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer shrink-0 ${
                filter === item 
                  ? 'bg-[#E5B842]/5 border-[#E5B842]/20 text-[#E5B842] shadow-md' 
                  : 'bg-transparent border-white/5 text-white/50 hover:text-white hover:border-white/10'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Sort and Clear */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleClearOldTasks}
            className="hidden sm:flex px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Clear Old
          </button>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-white/70" />
            <span className="text-sm text-white/70 uppercase font-bold">Sort:</span>
          </div>
          <div className="relative min-w-[140px]">
            <div 
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className={`bg-[#0B0B0B] border ${openDropdown === 'sort' ? 'border-[#E5B842]/40 shadow-[0_0_10px_rgba(229,184,66,0.1)]' : 'border-white/10'} hover:border-white/20 rounded-lg px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-white flex items-center justify-between cursor-pointer transition-all duration-300`}
            >
              <span className="truncate">{
                sortBy === 'priorityRank' ? 'AI Priority Rank' : 
                sortBy === 'urgency' ? 'Manual Urgency' : 'Focus Duration'
              }</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#E5B842] transition-transform duration-300 ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </div>
            
            {openDropdown === 'sort' && (
              <div className="absolute top-full right-0 mt-1 w-full min-w-[160px] bg-[#050505] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
                {[
                  { value: 'priorityRank', label: 'AI Priority Rank' },
                  { value: 'urgency', label: 'Manual Urgency' },
                  { value: 'duration', label: 'Focus Duration' }
                ].map((opt, i, arr) => (
                  <div 
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`px-3 py-2.5 text-sm font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      sortBy === opt.value ? 'text-[#E5B842] bg-[#E5B842]/5' : 'text-white/60 hover:text-white hover:bg-white/5'
                    } ${i !== arr.length - 1 ? 'border-b border-white/[0.02]' : ''}`}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Table List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main list */}
        <div className="space-y-3 transition-all duration-300 lg:col-span-12">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 bg-white/5 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            sortedTasks.map((task) => (
              <div 
                key={task._id} 
                onClick={() => handleToggleTask(task._id)}
                className={`p-5 border rounded-2xl hover:border-white/10 transition-all duration-300 cursor-pointer select-none active:scale-[0.98] layered-shadow-lg ${
                  task.completed ? 'opacity-50' : ''
                } border-white/15 bg-[#090909] ${
                  highlightedTaskId === task._id ? 'animate-gold-highlight' : ''
                } ${
                  completedAnimationTaskId === task._id ? 'animate-completed-fade' : ''
                } ${
                  highlightedDeadlines && !task.completed && task.urgency >= 9 ? 'animate-deadline-pulse' : ''
                } animate-fade-in`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task._id);
                      }}
                      className="text-white/60 hover:text-[#E5B842] transition-colors focus:outline-hidden cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#E5B842]" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/50 hover:text-white/70" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-white/70' : 'text-white/80'} ${
                        completedAnimationTaskId === task._id ? 'animate-strikethrough' : ''
                      }`}>
                        {task.title}
                      </h4>
                      <span className="text-sm text-white/70 font-bold uppercase tracking-wider">{task.category || 'WORK'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span 
                      title={task.aiReason || 'AI Re-ranking is pending...'}
                      className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-[#E5B842]/5 border border-[#E5B842]/20 text-[#E5B842] cursor-help relative group"
                    >
                      Priority {task.urgency}
                      {task.aiReason && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-[#090909] border border-white/10 text-sm text-white/80 rounded-lg shadow-lg z-50 normal-case font-normal text-center leading-normal">
                          {task.aiReason}
                        </span>
                      )}
                    </span>


                    <button 
                      onClick={(e) => handleOpenReschedule(e, task)}
                      title="Reschedule / Snooze Task"
                      className="text-white/50 hover:text-[#E5B842] transition-colors cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-white/50 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {!loading && sortedTasks.length === 0 && (
            <div className="text-center py-20 bg-[#090909] border border-white/[0.04] rounded-2xl layered-shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-[#E5B842]/30 mx-auto mb-3" />
              <p className="text-sm text-white/70 font-light">No tasks matched your filter rules.</p>
            </div>
          )}
        </div>

      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-status-red/10 border-status-red/30 text-status-red' 
            : 'bg-black/90 border-[#E5B842]/30 text-[#E5B842]'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wide uppercase">{toast.message}</span>
        </div>
      )}

      {/* Reschedule Datepicker Modal */}
      {reschedulingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#090909] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setReschedulingTask(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/50 flex items-center justify-center hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <span className="text-[10px] font-tech font-bold tracking-[0.2em] text-[#E5B842] uppercase block mb-1">POSTPONE DEADLINE</span>
            <h3 className="text-lg font-display font-black text-white mb-4">Reschedule Task</h3>
            
            <p className="text-sm text-white/60 mb-5 leading-normal">
              Rescheduling "{reschedulingTask.title}". Pushing tasks later multiple times triggers procrastination safety interventions.
            </p>
            
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="relative">
                <input 
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#E5B842]/40 focus:outline-hidden transition-all"
                  required
                />
              </div>
              
              <button 
                type="submit"
                className="w-full py-3 bg-[#E5B842] text-black hover:bg-[#F5C75D] text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer animate-fade-in"
              >
                Save New Deadline
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Procrastination Interception Overlay Modal */}
      {activeInterception && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-[#050505] border-2 border-[#E5B842]/40 rounded-[2rem] p-8 w-full max-w-lg shadow-[0_0_50px_rgba(229,184,66,0.15)] relative overflow-hidden text-center flex flex-col gap-5">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#E5B842]/5 rounded-full blur-[60px] pointer-events-none" />

            {/* Alert Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-[#E5B842]/10 border border-[#E5B842]/30 flex items-center justify-center mx-auto mb-1 animate-pulse">
              <AlertTriangle className="w-7 h-7 text-[#E5B842]" />
            </div>

            <div>
              <span className="text-[10px] font-tech font-bold tracking-[0.25em] text-[#E5B842] uppercase block mb-1">
                {activeInterception.strategy === 'A' ? 'Strategy A — Micro Action' 
                 : activeInterception.strategy === 'B' ? 'Strategy B — Blocker Probe' 
                 : 'Strategy C — Emotional Anchor'}
              </span>
              <h3 className="text-xl font-display font-black text-white">Procrastination Intercepted!</h3>
              <p className="text-xs text-white/40 mt-1 font-tech">Task avoided {activeInterception.task?.dismissCount || 3}x in 2 hours</p>
            </div>

            {/* Empathy coaching message */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <p className="text-sm font-medium text-white/80 leading-relaxed">
                "{activeInterception.message}"
              </p>
            </div>

            {/* Prompt action details */}
            <div className="p-4 bg-[#E5B842]/5 border border-[#E5B842]/20 rounded-2xl">
              <p className="text-xs text-[#E5B842]/80 uppercase tracking-widest font-tech font-bold mb-1">Suggested Intervention:</p>
              <p className="text-sm font-semibold text-white/90 leading-relaxed">{activeInterception.action}</p>
            </div>

            {/* STRATEGY SPECIFIC RENDERERS */}
            
            {/* Strategy A: Countdown timer */}
            {activeInterception.strategy === 'A' && (
              <div className="py-4">
                <div className="w-28 h-28 rounded-full border-4 border-dashed border-[#E5B842]/30 flex flex-col items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-tech font-bold text-[#E5B842]">
                    {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-tech">DO NOT THINK. JUST FOCUS FOR 5 MINUTES.</p>
              </div>
            )}

            {/* Strategy B: Blocker Checklist */}
            {activeInterception.strategy === 'B' && blockerStep === 1 && (
              <div className="grid grid-cols-2 gap-3 py-2">
                {[
                  { value: 'clarity', label: 'Lack of Clarity', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10' },
                  { value: 'energy', label: 'Fatigue / Low Energy', color: 'border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10' },
                  { value: 'motivation', label: 'Low Motivation', color: 'border-purple-500/20 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10' },
                  { value: 'tools', label: 'Setup Blocked', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setBlockerSelected(opt.value);
                      setBlockerStep(2);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${opt.color}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {activeInterception.strategy === 'B' && blockerStep === 2 && (
              <div className="bg-[#090909] border border-white/5 p-4 rounded-xl space-y-4">
                <p className="text-xs text-white/70 leading-relaxed font-sans font-medium text-left">
                  {blockerSelected === 'clarity' && "Blocker: Clarity. Let's break this task into 3 easy, bite-sized starting steps to remove ambiguity. No thinking needed."}
                  {blockerSelected === 'energy' && "Blocker: Fatigue. Since your energy is low, do not attempt to finish the whole task. Just work for 2 minutes to show up, then stop if you wish."}
                  {blockerSelected === 'motivation' && "Blocker: Motivation. Remember: Action precedes motivation. Let's do a micro-step to kickstart the dopamine loop."}
                  {blockerSelected === 'tools' && "Blocker: Setup. Let's make the subtasks just about opening the tools, logging in, or creating the folder/document."}
                </p>
                <button
                  onClick={handleAddBlockerSubtasks}
                  className="w-full py-2.5 bg-blue-500 text-white hover:bg-blue-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Create 3 Easy Subtasks & Close
                </button>
              </div>
            )}

            {/* BUTTON CONTROLS */}
            <div className="flex gap-3 mt-4">
              {activeInterception.strategy === 'A' ? (
                <>
                  <button 
                    onClick={handleMicroActionComplete}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Done (I completed it!)
                  </button>
                  <button 
                    onClick={handleCloseInterception}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Skip
                  </button>
                </>
              ) : activeInterception.strategy === 'C' ? (
                <>
                  <button 
                    onClick={handleCommitNow}
                    className="flex-1 py-3 bg-[#E5B842] text-black hover:bg-[#F5C75D] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Commit to 5 min action now
                  </button>
                  <button 
                    onClick={handleCloseInterception}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </>
              ) : (
                /* Strategy B Skip/Close */
                blockerStep === 1 && (
                  <button 
                    onClick={handleCloseInterception}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Close Interception
                  </button>
                )
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
