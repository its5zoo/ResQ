import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  SlidersHorizontal, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  X,
  PlusCircle,
  FileText,
  Calendar
} from 'lucide-react';
import { tasks as apiTasks } from '../../services/api.js';

export default function TasksPage({ 
  tasks, 
  setTasks 
}) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priorityRank');
  const [loading, setLoading] = useState(true);
  
  // Voice AI highlighting states
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const [completedAnimationTaskId, setCompletedAnimationTaskId] = useState(null);
  const [highlightedDeadlines, setHighlightedDeadlines] = useState(false);
  
  // Task Creation States
  const [title, setTitle] = useState('');
  const [urgency, setUrgency] = useState(5);
  const [dueDate, setDueDate] = useState('Today');
  const [duration, setDuration] = useState(30);
  const [category, setCategory] = useState('Work');

  // Slide-over states
  const [selectedTask, setSelectedTask] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await apiTasks.getAll();
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

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

    window.addEventListener('resq:refetch-tasks', handleRefetch);
    window.addEventListener('resq:highlight-task', handleHighlightTask);
    window.addEventListener('resq:task-completed-animation', handleCompletedAnimation);
    window.addEventListener('resq:highlight-deadlines', handleHighlightDeadlines);

    return () => {
      window.removeEventListener('resq:refetch-tasks', handleRefetch);
      window.removeEventListener('resq:highlight-task', handleHighlightTask);
      window.removeEventListener('resq:task-completed-animation', handleCompletedAnimation);
      window.removeEventListener('resq:highlight-deadlines', handleHighlightDeadlines);
    };
  }, []);

  // Filtering Logic
  const filteredTasks = (tasks || []).filter((t) => {
    if (filter === 'completed') return t.completed;
    if (filter === 'pending') return !t.completed;
    if (filter === 'critical') return !t.completed && t.urgency >= 9;
    return true; // 'all'
  });

  // Sorting Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priorityRank') {
      const rankA = a.aiPriorityRank !== undefined && a.aiPriorityRank !== null ? a.aiPriorityRank : 999;
      const rankB = b.aiPriorityRank !== undefined && b.aiPriorityRank !== null ? b.aiPriorityRank : 999;
      if (rankA !== rankB) return rankA - rankB;
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
      let resolvedDueDate = new Date();
      if (dueDate === 'Tomorrow') {
        resolvedDueDate.setDate(resolvedDueDate.getDate() + 1);
      } else if (dueDate === 'In 2 Days') {
        resolvedDueDate.setDate(resolvedDueDate.getDate() + 2);
      } else if (dueDate === 'In 3 Days') {
        resolvedDueDate.setDate(resolvedDueDate.getDate() + 3);
      }

      const taskData = {
        title,
        urgency: parseInt(urgency),
        dueDate: resolvedDueDate,
        estimatedMinutes: parseInt(duration),
        category,
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
      const updated = await apiTasks.update(id, { completed: !task.completed });
      setTasks(prev => prev.map(t => t._id === id ? updated : t));
      
      // Update selectedTask panel too if it's currently open
      if (selectedTask?._id === id) {
        setSelectedTask(updated);
      }
    } catch (err) {
      console.error('Error toggling task:', err);
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

  return (
    <div className="space-y-8 animate-fade-in relative font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">TASK SHEETS</span>
          <h2 className="text-3xl font-display font-black tracking-tight text-white leading-none">
            Manage Tasks & Deadlines
          </h2>
        </div>
      </div>

      {/* Task Creation Form */}
      <form onSubmit={handleCreateTask} className="p-6 bg-[#090909] border border-white/[0.04] rounded-2xl space-y-4 layered-shadow-lg">
        <h3 className="text-[10px] font-bold text-[#E5B842] tracking-widest uppercase font-display">Quick Add Priority Node</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <input 
            type="text"
            placeholder="What needs to be finished?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="md:col-span-6 bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-hidden transition-all duration-300"
            required
          />

          <div className="grid grid-cols-3 gap-2 md:col-span-6">
            {/* Urgency */}
            <select 
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-3 py-3 text-sm text-white focus:outline-hidden transition-all duration-300 cursor-pointer"
            >
              <option value="4">Urgency: 4</option>
              <option value="6">Urgency: 6 (Med)</option>
              <option value="8">Urgency: 8 (High)</option>
              <option value="10">Urgency: 10 (Critical)</option>
            </select>

            {/* Time Estimation */}
            <select 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-3 py-3 text-sm text-white focus:outline-hidden transition-all duration-300 cursor-pointer"
            >
              <option value="15">15 Mins</option>
              <option value="30">30 Mins</option>
              <option value="45">45 Mins</option>
              <option value="60">60 Mins</option>
            </select>

            {/* Due date */}
            <select 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-3 py-3 text-sm text-white focus:outline-hidden transition-all duration-300 cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="In 2 Days">In 2 Days</option>
              <option value="In 3 Days">In 3 Days</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-6 py-3 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer font-sans active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Deploy Task
          </button>
        </div>
      </form>

      {/* Filters and sorting strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'completed', 'critical'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer ${
                filter === item 
                  ? 'bg-[#E5B842]/5 border-[#E5B842]/20 text-[#E5B842] shadow-md' 
                  : 'bg-transparent border-white/5 text-white/50 hover:text-white hover:border-white/10'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[10px] text-white/40 uppercase font-bold">Sort:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70 focus:outline-hidden cursor-pointer transition-all duration-300"
          >
            <option value="priorityRank">AI Priority Rank</option>
            <option value="urgency">Manual Urgency</option>
            <option value="duration">Focus Duration</option>
          </select>
        </div>
      </div>

      {/* Tasks Table List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main list */}
        <div className={`space-y-3 transition-all duration-300 ${selectedTask ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
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
                onClick={() => setSelectedTask(task)}
                className={`p-5 border rounded-2xl hover:border-white/10 transition-all duration-300 cursor-pointer layered-shadow-lg ${
                  task.completed ? 'opacity-50' : ''
                } ${selectedTask?._id === task._id ? 'border-[#E5B842]/40 bg-[#E5B842]/[0.01]' : 'border-white/[0.03] bg-black'} ${
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
                      className="text-white/30 hover:text-[#E5B842] transition-colors focus:outline-hidden cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#E5B842]" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/20 hover:text-white/40" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-white/40' : 'text-white/80'} ${
                        completedAnimationTaskId === task._id ? 'animate-strikethrough' : ''
                      }`}>
                        {task.title}
                      </h4>
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{task.category || 'WORK'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span 
                      title={task.aiReason || 'AI Re-ranking is pending...'}
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E5B842]/5 border border-[#E5B842]/20 text-[#E5B842] cursor-help relative group"
                    >
                      Priority {task.urgency}
                      {task.aiReason && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-[#090909] border border-white/10 text-[9px] text-white/80 rounded-lg shadow-lg z-50 normal-case font-normal text-center leading-normal">
                          {task.aiReason}
                        </span>
                      )}
                    </span>
                    
                    <span className="text-xs text-white/45 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-white/40" /> {task.estimatedMinutes || task.duration || 30}m
                    </span>

                    <button 
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-white/20 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Line */}
                <div className="mt-4">
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#E5B842] to-[#C97D2E] rounded-full" style={{ width: task.completed ? '100%' : `${(task.urgency || 5) * 10}%` }}></div>
                  </div>
                </div>
              </div>
            ))
          )}

          {!loading && sortedTasks.length === 0 && (
            <div className="text-center py-20 bg-[#090909] border border-white/[0.04] rounded-2xl layered-shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-[#E5B842]/30 mx-auto mb-3" />
              <p className="text-sm text-white/40 font-light">No tasks matched your filter rules.</p>
            </div>
          )}
        </div>

        {/* Selected Task Details Side-over Panel */}
        {selectedTask && (
          <div className="lg:col-span-5 bg-white/[0.015] border border-[#E5B842]/20 rounded-3xl p-6 space-y-6 animate-slide-up self-start layered-shadow-xl relative overflow-hidden card-shine-sweep">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#E5B842]" />
                <span className="text-[10px] font-bold text-white tracking-wider uppercase font-display">AI Subtask Builder</span>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Task Info Header */}
            <div>
              <span className="text-[9px] bg-[#E5B842]/5 border border-[#E5B842]/20 text-[#E5B842] px-2.5 py-0.5 rounded-full font-bold uppercase mb-2 inline-block">
                Priority: {selectedTask.urgency}
              </span>
              <h3 className="text-sm font-bold text-white leading-snug">{selectedTask.title}</h3>
              <p className="text-[10px] text-white/40 mt-1">Due {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'Today'} · Estimated {selectedTask.estimatedMinutes || selectedTask.duration || 30} Mins</p>
            </div>

            {/* Subtask Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/45">Checklist milestones</h4>
              
              <div className="space-y-2">
                {(selectedTask.subtasks || []).map((sub, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-black/45 border border-white/[0.03] rounded-xl hover:border-white/10 transition-all duration-300 layered-shadow-lg"
                  >
                    <button 
                      onClick={() => toggleSubtask(idx)}
                      className="text-white/30 hover:text-[#E5B842] transition-colors focus:outline-hidden cursor-pointer"
                    >
                      {sub.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#E5B842]" />
                      ) : (
                        <Circle className="w-4 h-4 text-white/20" />
                      )}
                    </button>
                    <span className={`text-[11px] font-medium leading-none ${sub.completed ? 'line-through text-white/35' : 'text-white/70'}`}>
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add subtask Form */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Insert sub-step..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-hidden transition-all duration-300"
                  required
                />
                <button 
                  type="submit"
                  className="bg-black hover:bg-white hover:text-black text-white/60 p-2.5 rounded-xl border border-white/10 hover:border-[#E5B842]/40 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>

            {/* AI Advisor Context Explanation */}
            {selectedTask.aiReason && (
              <div className="border-t border-white/5 pt-5 space-y-2">
                <h5 className="text-[9px] font-bold uppercase tracking-wider text-[#E5B842]">AI Advice Reason</h5>
                <p className="text-[11px] text-white/60 leading-relaxed bg-[#E5B842]/5 border border-[#E5B842]/10 p-3.5 rounded-xl">
                  {selectedTask.aiReason}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
