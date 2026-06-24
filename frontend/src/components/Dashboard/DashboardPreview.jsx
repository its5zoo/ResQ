import { useState } from 'react';
import { Cpu, Calendar, Clock, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPreview() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Draft React Frontend Architecture', urgency: 9, duration: 45, completed: false, category: 'Work' },
    { id: 2, title: 'Submit Vibe2Ship Hackathon Project', urgency: 10, duration: 30, completed: false, category: 'Hackathon' },
    { id: 3, title: 'Drink 3L of Water', urgency: 4, duration: 5, completed: true, category: 'Health' },
    { id: 4, title: 'Renew Google Calendar OAuth scopes', urgency: 7, duration: 15, completed: false, category: 'Admin' }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      urgency: Math.floor(Math.random() * 6) + 5, // 5 to 10
      duration: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
      completed: false,
      category: 'User'
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  // Live Priority Scoring
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedCount = tasks.filter(t => t.completed).length;
  const deadlineRisk = incompleteTasks.some(t => t.urgency >= 9) ? 'CRITICAL' : incompleteTasks.length > 0 ? 'MODERATE' : 'SAFE';
  
  // Total pending estimated focus block time
  const totalFocusTime = incompleteTasks.reduce((acc, t) => acc + t.duration, 0);

  return (
    <section className="py-44 bg-[#050505] bg-noise relative overflow-hidden border-t border-white/[0.03]">
      {/* Background radial spotlight */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.015] rounded-full blur-[130px] mix-blend-screen animate-ambient-glow"></div>
      </div>

      <div className="max-w-7xl mx-auto px-10 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-44">
          <span className="text-sm font-tech font-bold tracking-[0.3em] uppercase text-white/70 block mb-5">
            LIVE SIMULATOR
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight text-silver-gradient text-shine-sweep mb-6 leading-tight">
            Test the AI priority engine <br />
            right here.
          </h2>
          <p className="text-sm sm:text-sm text-white/70 font-light leading-relaxed max-w-xl mx-auto tracking-wide font-sans">
            Click tasks to complete them, add new items, or delete tasks. Watch the system compute the deadline risk index and focus block durations instantly.
          </p>
        </div>

        {/* Live Interface Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Panel: Tasks list control */}
          <div className="lg:col-span-8 bg-[#090909] border border-white/[0.05] rounded-3xl p-8 md:p-10 flex flex-col justify-between hover:border-white/10 transition-all duration-500 layered-shadow-lg hover:layered-shadow-xl">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-8">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  <h3 className="text-sm font-tech font-bold text-white tracking-widest uppercase">Active Task Stack</h3>
                </div>
                <span className="text-sm font-tech bg-white/5 border border-white/10 text-white/50 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                  AI Sorted
                </span>
              </div>

              {/* Task Add Form */}
              <form onSubmit={addTask} className="flex gap-3 mb-8">
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Create a critical task..."
                  className="flex-1 bg-[#050505] border border-white/5 hover:border-white/10 focus:border-white/30 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-hidden transition-all font-sans"
                />
                <button 
                  type="submit"
                  className="bg-transparent hover:bg-white text-white hover:text-black border border-white/30 hover:shadow-lg hover:shadow-white/10 text-sm font-tech font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all duration-500 shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>

              {/* List */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      task.completed 
                        ? 'bg-[#090909] border-white/[0.02] opacity-40' 
                        : 'bg-[#0f0f0f] border-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="text-white/60 hover:text-white transition-colors focus:outline-hidden cursor-pointer"
                      >
                        {task.completed 
                          ? <CheckCircle2 className="w-5 h-5 text-status-green" /> 
                          : <Circle className="w-5 h-5 text-white/50" />
                        }
                      </button>
                      <span className={`text-sm font-medium truncate font-sans ${task.completed ? 'line-through text-white/60' : 'text-white/80'}`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-sm font-tech font-bold px-2 py-0.5 rounded-full ${
                        task.urgency >= 9 
                          ? 'bg-status-red/10 border border-status-red/20 text-status-red' 
                          : 'bg-white/5 border border-white/10 text-white/60'
                      }`}>
                        Priority {task.urgency}
                      </span>

                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="text-white/50 hover:text-status-red transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 mt-8 flex items-center justify-between text-sm font-tech text-white/25">
              <span>Stack Audit Log: RQ-102</span>
              <span>Updated live via local React hooks</span>
            </div>
          </div>

          {/* Right Panel: AI Recommendation & Analysis */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            
            {/* AI Nudge Card */}
            <div className="bg-[#090909] border border-white/5 rounded-3xl p-8 relative overflow-hidden flex-1 flex flex-col justify-between hover:border-white/10 transition-all duration-500 layered-shadow-lg hover:layered-shadow-xl card-shine-sweep">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    <span className="text-sm font-tech font-bold text-white/60 tracking-widest uppercase">AI Recommendation</span>
                  </div>
                  <Cpu className="w-4 h-4 text-white/70" />
                </div>

                <div className="min-h-[140px] flex flex-col justify-center">
                  {incompleteTasks.length === 0 ? (
                    <p className="text-sm text-status-green font-light leading-relaxed tracking-wide font-sans">
                      "Outstanding effort. Your queue is empty and the priority engine registers zero deadline risk. Take this opportunity to recharge."
                    </p>
                  ) : (
                    <p className="text-sm text-white/70 font-light leading-relaxed tracking-wide font-sans">
                      "I detect <span className="font-bold text-white">{incompleteTasks.length} pending tasks</span>. You should focus on <span className="font-bold text-white">'{incompleteTasks.sort((a,b)=>b.urgency - a.urgency)[0].title}'</span> immediately due to its high urgency score. I have reserved a {incompleteTasks[0].duration} min block in your calendar."
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5 pt-5 mt-8">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3.5 rounded-xl text-sm font-tech font-bold tracking-widest uppercase border border-white/20 hover:bg-white hover:text-black hover:border-white text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book Focus Block
                </button>
              </div>
            </div>

            {/* Live Stats Card */}
            <div className="bg-[#090909] border border-white/[0.05] rounded-3xl p-8 layered-shadow-lg">
              <h4 className="text-sm font-tech font-bold tracking-widest uppercase text-white/60 mb-5">System Telemetry</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#050505] border border-white/5 rounded-2xl">
                  <span className="text-sm font-tech text-white/60 block mb-1">Risk Level</span>
                  <span className={`text-sm font-tech font-bold ${
                    deadlineRisk === 'CRITICAL' ? 'text-status-red' : deadlineRisk === 'MODERATE' ? 'text-white/60' : 'text-status-green'
                  }`}>
                    {deadlineRisk}
                  </span>
                </div>
                <div className="p-4 bg-[#050505] border border-white/5 rounded-2xl">
                  <span className="text-sm font-tech text-white/60 block mb-1">Focus Burden</span>
                  <span className="text-sm font-tech font-bold text-white">
                    {totalFocusTime} Min
                  </span>
                </div>
                <div className="p-4 bg-[#050505] border border-white/5 rounded-2xl col-span-2 flex items-center justify-between">
                  <span className="text-sm font-tech text-white/60">Completion Rate</span>
                  <span className="text-sm font-tech font-bold text-status-green">
                    {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
