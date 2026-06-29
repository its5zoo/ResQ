import { useState, useEffect, useRef } from 'react';
import { 
  Shield, Brain, AlertTriangle, Play, Volume2, VolumeX, Flame, 
  CheckCircle2, Activity, TrendingUp, CheckSquare, Copy, 
  ChevronRight, Target, X, Zap, Loader2, Pause
} from 'lucide-react';
import { ai, tasks as apiTasks, goals as apiGoals } from '../../services/api.js';

export default function ShieldPage() {
  // Page Tabs: 'foresight' | 'rescue' | 'pre-mortem'
  const [activeTab, setActiveTab] = useState('foresight');

  // Foresight Scanner State
  const [tasks, setTasks] = useState([]);
  const [riskScans, setRiskScans] = useState({}); // taskId -> { riskScore, factors }
  const [scanning, setScanning] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Rescue Mode State
  const [activeRescueTask, setActiveRescueTask] = useState(null); // Task object currently in Rescue Mode
  const [rescuePlan, setRescuePlan] = useState(null); // { coachMessage, microSteps, extensionEmail }
  const [loadingRescue, setLoadingRescue] = useState(false);
  const [countdown, setCountdown] = useState(52 * 60); // 52 minutes default
  const [timerRunning, setTimerRunning] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState([false, false, false, false]);
  const [speaking, setSpeaking] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pre-Mortem Goal State
  const [goalList, setGoalList] = useState([]);
  const [preMortems, setPreMortems] = useState({}); // goalId -> [{ scenario, preventativeAction }]
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [scanningGoalId, setScanningGoalId] = useState(null);

  const countdownIntervalRef = useRef(null);
  const speechUtteranceRef = useRef(null);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedTasks, fetchedGoals] = await Promise.all([
          apiTasks.getAll().catch(() => []),
          apiGoals.getAll().catch(() => [])
        ]);
        setTasks(fetchedTasks.filter(t => !t.completed) || []);
        setGoalList(fetchedGoals || []);
      } catch (err) {
        console.error('Failed to load tasks/goals for Shield:', err);
      } finally {
        setLoadingTasks(false);
        setLoadingGoals(false);
      }
    };
    loadData();
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Run Foresight Scan
  const runForesightScan = async () => {
    setScanning(true);
    try {
      const scanData = await ai.getForesightScan();
      const updatedScans = {};
      if (Array.isArray(scanData)) {
        scanData.forEach(item => {
          updatedScans[item.taskId] = {
            riskScore: item.riskScore,
            factors: item.factors
          };
        });
      }
      setRiskScans(updatedScans);
    } catch (err) {
      console.error('Foresight scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  // Trigger Rescue Mode
  const triggerRescueMode = async (task) => {
    setActiveRescueTask(task);
    setLoadingRescue(true);
    setCheckedSteps([false, false, false, false]);
    setRescuePlan(null);
    try {
      const plan = await ai.getRescuePlan(task._id);
      setRescuePlan(plan);
      
      // Compute Countdown: If task has due date, compute time left, else default to 52 mins
      if (task.dueDate) {
        const diffMs = new Date(task.dueDate) - new Date();
        const diffSecs = Math.floor(diffMs / 1000);
        setCountdown(diffSecs > 0 ? diffSecs : 52 * 60);
      } else {
        setCountdown(52 * 60);
      }
      
      setTimerRunning(true);

      // Speak coaching message out loud
      if (plan.coachMessage && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(plan.coachMessage);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        speechUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Rescue Mode trigger failed:', err);
    } finally {
      setLoadingRescue(false);
    }
  };

  // Toggle Speech Play/Pause
  const toggleSpeech = () => {
    if (!window.speechSynthesis || !rescuePlan) return;
    if (speaking) {
      window.speechSynthesis.pause();
      setSpeaking(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setSpeaking(true);
      } else {
        const utterance = new SpeechSynthesisUtterance(rescuePlan.coachMessage);
        utterance.rate = 0.95;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Monospace Countdown ticking
  useEffect(() => {
    if (timerRunning && countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(countdownIntervalRef.current);
    }
    return () => clearInterval(countdownIntervalRef.current);
  }, [timerRunning, countdown]);

  // Run Pre-Mortem Goal Scan
  const runPreMortemScan = async (goalId) => {
    setScanningGoalId(goalId);
    try {
      const result = await ai.getPreMortem(goalId);
      setPreMortems(prev => ({
        ...prev,
        [goalId]: Array.isArray(result) ? result : []
      }));
    } catch (err) {
      console.error('Pre-Mortem scan failed:', err);
    } finally {
      setScanningGoalId(null);
    }
  };

  const copyEmailToClipboard = () => {
    if (!rescuePlan?.extensionEmail) return;
    const fullText = `Subject: ${rescuePlan.extensionEmail.subject}\n\n${rescuePlan.extensionEmail.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskColor = (score) => {
    if (score >= 8) return { text: 'text-red-400', border: 'border-red-500/25', bg: 'bg-red-500/5', bar: 'bg-red-500', label: 'CRITICAL RISK' };
    if (score >= 5) return { text: 'text-orange-400', border: 'border-orange-500/25', bg: 'bg-orange-500/5', bar: 'bg-orange-500', label: 'MODERATE RISK' };
    return { text: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/5', bar: 'bg-emerald-500', label: 'LOW RISK' };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col pt-4 font-sans select-none relative">
      {/* Tab Header Banner */}
      <header className="mb-8 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-[#E5B842] uppercase tracking-[0.2em] text-xs font-bold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Cognitive Defense Shield
          </h3>
          <h1 className="text-3xl lg:text-4xl font-black text-white font-display tracking-tight flex items-center gap-3">
            ResQ Agentic Shield
            <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-[10px] font-tech uppercase tracking-widest text-[#E5B842] animate-pulse">
              Active Shield
            </span>
          </h1>
          <p className="text-white/50 mt-2 text-sm max-w-xl leading-relaxed">
            Monitor deadline risk vectors, activate emergency rescue protocols, and analyze goals for failure vectors.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/[0.03] border border-white/5 rounded-xl p-1 shrink-0">
          {[
            { id: 'foresight', label: 'Foresight Scanner', icon: Brain },
            { id: 'rescue', label: 'Rescue Station', icon: Flame },
            { id: 'pre-mortem', label: 'Goal Pre-Mortem', icon: AlertTriangle }
          ].map(tab => {
            const ActiveIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  active 
                    ? 'bg-[#E5B842] text-black shadow-md shadow-[#E5B842]/10' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={{ minHeight: 'auto' }}
              >
                <ActiveIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Tab Panels */}
      <div className="flex-1">
        {/* TAB 1: FORESIGHT SCANNER */}
        {activeTab === 'foresight' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#090909] border border-white/[0.04] p-6 rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center text-xl shrink-0">
                  🔮
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Predictive Task Scanner</h3>
                  <p className="text-xs text-white/40 mt-0.5">Scans tasks against reschedule patterns, estimated duration, and due time.</p>
                </div>
              </div>
              <button
                onClick={runForesightScan}
                disabled={scanning}
                className="px-5 py-3 bg-[#E5B842] hover:bg-[#F5C75D] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {scanning ? 'Analyzing Tasks...' : 'Scan for Risks'}
              </button>
            </div>

            {loadingTasks ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-[#E5B842] animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-2xl">
                  🎉
                </div>
                <h3 className="text-white font-bold">No active tasks to scan</h3>
                <p className="text-white/40 text-xs max-w-xs leading-relaxed">
                  All tasks are completed! Add new tasks in the Tasks tab to monitor their failure risk score.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {tasks.map((task, i) => {
                  const scan = riskScans[task._id] || { riskScore: 4, factors: ["Created recently", "Undergoing assessment"] };
                  const colors = getRiskColor(scan.riskScore);
                  const isHovered = hoveredIdx === i;

                  return (
                    <div
                      key={task._id}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className={`p-5 rounded-2xl border transition-all duration-300 bg-[#090909] ${colors.border} relative overflow-hidden group ${
                        scan.riskScore >= 8 ? 'hover:shadow-[0_0_20px_rgba(239,68,68,0.06)]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.bar} ${scan.riskScore >= 8 ? 'animate-pulse' : ''}`} />
                            <h4 className="font-bold text-white truncate text-sm">{task.title}</h4>
                          </div>

                          {isHovered ? (
                            <div className="space-y-1.5 mt-2.5 animate-fade-in">
                              <p className="text-[9px] font-tech text-white/30 uppercase tracking-widest font-bold">Risk Factors</p>
                              {scan.factors.map((f, fi) => (
                                <div key={fi} className="flex items-center gap-2">
                                  <AlertTriangle className={`w-3.5 h-3.5 ${colors.text} shrink-0`} />
                                  <span className="text-xs text-white/70 font-medium">{f}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-white/40 mt-1 leading-none">
                              Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className={`text-2xl font-black font-tech ${colors.text} leading-none`}>
                            {scan.riskScore}
                            <span className="text-xs font-bold text-white/30">/10</span>
                          </div>
                          <span className={`text-[8px] font-tech font-bold uppercase tracking-widest ${colors.text} mt-1 block`}>
                            {colors.label}
                          </span>
                        </div>
                      </div>

                      {/* Urgency/Risk status progress bar */}
                      <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${colors.bar}`}
                          style={{ width: `${scan.riskScore * 10}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RESCUE STATION */}
        {activeTab === 'rescue' && (
          <div className="space-y-6">
            <div className="bg-[#090909] border border-white/[0.04] p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl shrink-0">
                🚨
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Emergency Crisis Station</h3>
                <p className="text-xs text-white/40 mt-0.5">When a deadline is breathing down your neck, trigger Rescue Mode to block distractions, get an emergency AI plan, and read instructions aloud.</p>
              </div>
            </div>

            {loadingTasks ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-[#E5B842] animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-2xl">
                  🌴
                </div>
                <h3 className="text-white font-bold">Your schedule is safe</h3>
                <p className="text-white/40 text-xs max-w-xs leading-relaxed">
                  No active or overdue tasks are posing a threat to your calendar today!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {tasks.map(task => {
                  const isHighUrgency = task.urgency >= 8;
                  return (
                    <div 
                      key={task._id} 
                      className={`p-5 rounded-2xl border bg-[#090909] ${isHighUrgency ? 'border-red-500/20' : 'border-white/[0.04]'} flex flex-col justify-between`}
                    >
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-tech font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            isHighUrgency ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-white/50 border border-white/10'
                          }`}>
                            Urgency: {task.urgency}/10
                          </span>
                          <span className="text-xs text-white/30">
                            {task.category || 'General'}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-base truncate">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{task.description}</p>
                        )}
                        <p className="text-xs text-white/30 pt-1">
                          Deadline: {new Date(task.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <button
                        onClick={() => triggerRescueMode(task)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isHighUrgency 
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/10' 
                            : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        Trigger Rescue Mode
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GOAL PRE-MORTEM */}
        {activeTab === 'pre-mortem' && (
          <div className="space-y-6">
            <div className="bg-[#090909] border border-white/[0.04] p-6 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl shrink-0">
                ☠️
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Pre-Mortem Failure Scanner</h3>
                <p className="text-xs text-white/40 mt-0.5">Define your goal, then let the AI anticipate what will cause you to abandon it, so you can lock down preventative measures beforehand.</p>
              </div>
            </div>

            {loadingGoals ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-[#E5B842] animate-spin" />
              </div>
            ) : goalList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-2xl">
                  🎯
                </div>
                <h3 className="text-white font-bold">No active goals</h3>
                <p className="text-white/40 text-xs max-w-xs leading-relaxed">
                  Add long-term goals in the Goals tab first to analyze potential failure points.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {goalList.map(goal => {
                  const scanResult = preMortems[goal._id] || [];
                  const isScanning = scanningGoalId === goal._id;
                  return (
                    <div 
                      key={goal._id} 
                      className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🎯</span>
                            <h4 className="font-bold text-white text-base">{goal.title}</h4>
                          </div>
                          <p className="text-xs text-white/40 mt-1">
                            Target: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'Flexible'} · Progress: {goal.progress || 0}%
                          </p>
                        </div>
                        <button
                          onClick={() => runPreMortemScan(goal._id)}
                          disabled={isScanning}
                          className="px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {isScanning ? 'Analyzing Failure Path...' : scanResult.length > 0 ? 'Re-run Failure Scan' : 'Run Failure Scan'}
                        </button>
                      </div>

                      {scanResult.length > 0 ? (
                        <div className="grid md:grid-cols-3 gap-4 pt-2">
                          {scanResult.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="p-4 bg-orange-500/[0.02] border border-orange-500/10 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group"
                            >
                              <div className="absolute top-0 left-0 bottom-0 w-1 bg-orange-500/30" />
                              <div className="space-y-1.5 pl-2">
                                <span className="text-[9px] font-tech font-bold uppercase tracking-widest text-orange-400">
                                  Scenario {idx + 1}
                                </span>
                                <h5 className="font-bold text-white text-sm leading-snug">{item.scenario}</h5>
                              </div>
                              <div className="pl-2 pt-2 border-t border-white/5">
                                <span className="text-[8px] font-tech font-bold uppercase tracking-widest text-emerald-400 block mb-1">
                                  Preventative Action:
                                </span>
                                <p className="text-xs text-white/70 leading-relaxed font-medium">{item.preventativeAction}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        !isScanning && (
                          <p className="text-xs text-white/30 italic text-center py-4">
                            No failure scan has been run for this goal. Click the button to identify failure risks.
                          </p>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULL SCREEN TAKE OVER: RESCUE MODE ACTIVE HUD */}
      {activeRescueTask && (
        <div className="fixed inset-0 z-[1000] bg-black text-white flex flex-col font-sans select-none overflow-y-auto">
          {/* Top alert bar */}
          <div className="bg-red-955/40 border-b border-red-500/25 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-tech font-bold uppercase tracking-[0.25em] text-red-400">
                RESCUE MODE ACTIVE — CRITICAL TASK DEFENSE
              </span>
            </div>
            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setActiveRescueTask(null);
                setRescuePlan(null);
                setTimerRunning(false);
              }}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              style={{ minHeight: 'auto' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loadingRescue ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-4">
              <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
              <p className="text-sm font-tech text-white/50 uppercase tracking-widest">Generating Emergency Plan...</p>
            </div>
          ) : (
            rescuePlan && (
              <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 md:py-16 flex flex-col justify-between gap-8">
                {/* Header: Title + Countdown */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <span className="text-[10px] font-tech text-white/40 uppercase tracking-widest font-bold block mb-1">
                      Overdue Crisis Detected
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">{activeRescueTask.title}</h2>
                    <p className="text-xs text-white/50 mt-1 font-medium">
                      Estimated: {activeRescueTask.estimatedMinutes || 30}m · Priority level: {activeRescueTask.urgency}/10
                    </p>
                  </div>
                  
                  {/* Monospace countdown */}
                  <div className="text-right bg-red-955/20 border border-red-500/10 rounded-2xl px-6 py-4 min-w-[150px]">
                    <span className="text-[9px] font-tech text-red-400/80 uppercase tracking-widest font-bold block mb-1">
                      Time Remaining
                    </span>
                    <span className="text-3xl md:text-4xl font-tech font-black text-red-400 tracking-tighter">
                      {formatTime(countdown)}
                    </span>
                  </div>
                </div>

                {/* Coaching readouts */}
                <div className="bg-red-500/[0.03] border border-red-500/15 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Volume2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <h4 className="text-xs font-tech font-bold uppercase tracking-widest text-red-400">AI Coach Message</h4>
                    <p className="text-base text-white/90 leading-relaxed font-medium">
                      "{rescuePlan.coachMessage}"
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={toggleSpeech}
                        className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {speaking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {speaking ? 'Pause Briefing' : 'Read Aloud'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Micro-Step Battle Plan */}
                <div className="space-y-4">
                  <h4 className="text-xs font-tech font-bold uppercase tracking-widest text-white/40">AI Tactical Steps</h4>
                  <div className="space-y-2.5">
                    {rescuePlan.microSteps.map((step, idx) => {
                      const checked = checkedSteps[idx];
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            const updated = [...checkedSteps];
                            updated[idx] = !updated[idx];
                            setCheckedSteps(updated);
                          }}
                          className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all duration-300 cursor-pointer ${
                            checked 
                              ? 'bg-emerald-500/5 border-emerald-500/25 text-white/40' 
                              : 'bg-white/[0.02] border-white/5 text-white/90 hover:border-white/10'
                          }`}
                        >
                          {checked ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-white/20 shrink-0" />
                          )}
                          <span className={`text-sm font-semibold ${checked ? 'line-through' : ''}`}>{step}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Final controls */}
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <button
                    onClick={() => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setActiveRescueTask(null);
                      setRescuePlan(null);
                      setTimerRunning(false);
                    }}
                    className="py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-tech font-bold text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
                  >
                    <CheckSquare className="w-4 h-4" /> I'm On It
                  </button>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-tech font-bold text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Reschedule / Extension Email
                  </button>
                </div>
              </div>
            )
          )}

          {/* DELAY EXTENSION EMAIL MODAL */}
          {showEmailModal && rescuePlan?.extensionEmail && (
            <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
                  style={{ minHeight: 'auto' }}
                >
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[9px] font-tech font-bold uppercase tracking-widest text-[#E5B842]">
                    Emergency Extension Template
                  </span>
                  <h3 className="text-white text-lg font-bold mt-1">Copy Delay Draft</h3>
                  <p className="text-xs text-white/40 mt-0.5">Gemini generated a delay notice in case you cannot make the deadline.</p>
                </div>

                <div className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-tech font-bold">Subject</span>
                    <p className="text-sm font-semibold text-white/90">{rescuePlan.extensionEmail.subject}</p>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-tech font-bold">Body</span>
                    <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line font-medium mt-1">
                      {rescuePlan.extensionEmail.body}
                    </p>
                  </div>
                </div>

                <button
                  onClick={copyEmailToClipboard}
                  className="w-full py-3 bg-[#E5B842] hover:bg-[#F5C75D] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied to Clipboard!' : 'Copy Draft to Clipboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
