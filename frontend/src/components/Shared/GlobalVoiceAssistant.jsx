import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, X, Sparkles, AlertTriangle, CalendarDays, RefreshCw,
  Play, Pause, Flame, Volume2, VolumeX, Coffee, CloudRain, Wind, CheckSquare, Trash2,
  Lock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { voice, tasks as apiTasks, calendar as apiCalendar, ai, settings, auth } from '../../services/api.js';
import { socket } from '../../services/socket.js';
import { wakeWordEngine } from '../../services/WakeWordEngine.js';
import voicePersonality, { INSTANT_RESPONSES } from '../../services/VoicePersonality.js';
import { VoiceActionExecutor } from '../../services/VoiceActionExecutor.js';
import FocusSessionOverlay from './FocusSessionOverlay.jsx';
import './GlobalVoiceAssistant.css';

// State metadata lookup for executed intent confirmation
const getIntentActionMeta = (intent) => {
  switch (intent) {
    case 'create_task':
      return { label: 'Task Created', icon: CheckSquare, color: 'text-emerald-400' };
    case 'complete_task':
      return { label: 'Task Completed', icon: CheckSquare, color: 'text-emerald-400' };
    case 'delete_task':
      return { label: 'Task Deleted', icon: Trash2, color: 'text-red-400' };
    case 'schedule_event':
    case 'reschedule_event':
      return { label: 'Calendar Synced', icon: CalendarDays, color: 'text-blue-400' };
    case 'cancel_event':
      return { label: 'Event Cancelled', icon: CalendarDays, color: 'text-red-400' };
    case 'start_focus_session':
      return { label: 'Focus Mode Engaged', icon: Flame, color: 'text-amber-500' };
    case 'stop_focus_session':
      return { label: 'Focus Mode Disengaged', icon: Flame, color: 'text-gray-400' };
    case 'get_free_time':
      return { label: 'Checked Availability', icon: RefreshCw, color: 'text-cyan-400' };
    case 'get_daily_summary':
      return { label: 'Briefing Loaded', icon: Sparkles, color: 'text-purple-400' };
    default:
      return null;
  }
};

// Sub-component for Speech & Audio Wave visualization
function WaveVisualizer({ bars = 19, micState }) {
  return (
    <div className="flex items-center justify-center gap-0.5 absolute inset-0 z-10 px-2 pointer-events-none">
      {Array.from({ length: bars }).map((_, idx) => {
        const middleIndex = (bars - 1) / 2;
        const distFromCenter = Math.abs(idx - middleIndex);
        const baseHeight = Math.max(4, 20 - distFromCenter * 2);
        
        let animDuration = '0s';
        if (micState === 'listening') animDuration = `${0.6 + (idx % 3) * 0.2}s`;
        else if (micState === 'speaking') animDuration = `${0.3 + (idx % 2) * 0.15}s`;

        return (
          <div
            key={idx}
            className={`w-0.5 rounded-full transition-all duration-300 ${
              micState === 'listening' ? 'bg-[var(--orb-cyan)]' : 'bg-[var(--orb-gold)]'
            }`}
            style={{
              height: `${baseHeight}px`,
              animation: micState !== 'idle' ? `voiceWave ${animDuration} infinite ease-in-out` : 'none',
              animationDelay: `${idx * 0.04}s`,
            }}
          />
        );
      })}
    </div>
  );
}

// Sub-component for the hover/state tooltip label
function StateLabel({ orbState }) {
  let labelText = '';
  switch (orbState) {
    case 'idle':
      labelText = 'Hey ResQ';
      break;
    case 'listening':
      labelText = 'Listening...';
      break;
    case 'processing':
      labelText = 'Thinking...';
      break;
    case 'speaking':
      labelText = 'Speaking...';
      break;
    case 'alert':
      labelText = 'Alert!';
      break;
    case 'focus_active':
      labelText = 'Focus Shield';
      break;
    case 'disabled':
      labelText = 'Voice AI Off';
      break;
    default:
      labelText = '';
  }

  return (
    <span className={`absolute right-16 top-1/2 -translate-y-1/2 bg-[#09090b]/90 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-[10px] font-tech font-bold uppercase tracking-wider text-white whitespace-nowrap shadow-lg transition-all duration-300 pointer-events-none ${
      orbState !== 'idle' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
    }`}>
      {labelText}
    </span>
  );
}

export default function GlobalVoiceAssistant({ navigate: propNavigate, setCurrentTab }) {
  const routerNavigate = useNavigate();
  const navigate = propNavigate || routerNavigate;
  const location = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isWoken, setIsWoken] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('How can I help you today? Try saying "Hey ResQ" or click one of the quick scenarios.');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micState, setMicState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [choices, setChoices] = useState([]);
  const [pendingVoiceAction, setPendingVoiceAction] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  // Proactive Alerts State
  const [proactivePulseType, setProactivePulseType] = useState(null); // 'meeting' | 'deadline' | 'focus' | null
  const [pendingDeadlineTaskId, setPendingDeadlineTaskId] = useState(null);
  const [awaitingIdleFocusConfirmation, setAwaitingIdleFocusConfirmation] = useState(false);

  // User Profile Name State
  const [userContextName, setUserContextName] = useState('User');

  // Focus Session State
  const [focusActive, setFocusActive] = useState(false);
  const [focusTask, setFocusTask] = useState('Deep Work Session');
  const [focusDuration, setFocusDuration] = useState(25);

  // Microphone Permission States
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);

  // Gating & Monthly Limits States
  const [isLocked, setIsLocked] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  
  const executorRef = useRef(null);
  if (!executorRef.current) {
    executorRef.current = new VoiceActionExecutor(
      (target) => {
        if (setCurrentTab) {
          setCurrentTab(target);
        }
        navigate(`/dashboard?tab=${target}`);
      },
      (text) => speakBack(text)
    );
  }

  // Keep executor callbacks fresh on every render
  if (executorRef.current) {
    executorRef.current.navigationCallback = (target) => {
      if (setCurrentTab) {
        setCurrentTab(target);
      }
      navigate(`/dashboard?tab=${target}`);
    };
    executorRef.current.speakCallback = (text) => speakBack(text);
  }

  // Check Microphone Permission status on mount
  useEffect(() => {
    const checkMicPermissionStatus = async () => {
      if (!navigator.permissions || !navigator.permissions.query) {
        console.warn('[GlobalVoiceAssistant] Permissions API not supported.');
        wakeWordEngine.init();
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: 'microphone' });
        console.log('[GlobalVoiceAssistant] Microphone permission status:', result.state);
        
        const handleStatusChange = () => {
          console.log('[GlobalVoiceAssistant] Microphone permission changed to:', result.state);
          if (result.state === 'granted') {
            setPermissionDenied(false);
            setShowPermissionModal(false);
            wakeWordEngine.init();
          } else if (result.state === 'denied') {
            setPermissionDenied(true);
            setShowPermissionModal(false);
          } else if (result.state === 'prompt') {
            setPermissionDenied(false);
            setShowPermissionModal(true);
          }
        };

        result.onchange = handleStatusChange;
        handleStatusChange();
      } catch (err) {
        console.warn('[GlobalVoiceAssistant] Error querying mic permissions:', err);
        wakeWordEngine.init();
      }
    };

    checkMicPermissionStatus();
  }, []);

  const handleGrantPermission = async () => {
    localStorage.setItem('resq:mic-prompt-seen', 'true');
    setShowPermissionModal(false);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionDenied(false);
      console.log('[GlobalVoiceAssistant] Mic permission granted successfully.');
      wakeWordEngine.init();
    } catch (err) {
      console.warn('[GlobalVoiceAssistant] Microphone permission request denied:', err);
      setPermissionDenied(true);
    }
  };

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const isBlockedRef = useRef(false);

  const isWokenRef = useRef(isWoken);
  const focusActiveRef = useRef(focusActive);
  const pendingVoiceActionRef = useRef(pendingVoiceAction);
  const focusTaskRef = useRef(focusTask);

  const pendingDeadlineTaskIdRef = useRef(pendingDeadlineTaskId);
  const awaitingIdleFocusConfirmationRef = useRef(awaitingIdleFocusConfirmation);
  const lastInteractionTimeRef = useRef(Date.now());
  const suggestedFocusRef = useRef(false);

  useEffect(() => { isWokenRef.current = isWoken; }, [isWoken]);
  useEffect(() => { focusActiveRef.current = focusActive; }, [focusActive]);
  useEffect(() => { pendingVoiceActionRef.current = pendingVoiceAction; }, [pendingVoiceAction]);
  useEffect(() => { focusTaskRef.current = focusTask; }, [focusTask]);

  useEffect(() => { pendingDeadlineTaskIdRef.current = pendingDeadlineTaskId; }, [pendingDeadlineTaskId]);
  useEffect(() => { awaitingIdleFocusConfirmationRef.current = awaitingIdleFocusConfirmation; }, [awaitingIdleFocusConfirmation]);

  // Fetch user profile and usage stats on mount
  useEffect(() => {
    const fetchUserAndUsage = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await auth.getMe();
          if (userData) {
            if (userData.name) {
              setUserContextName(userData.name);
            }
            
            // Sync isLocked with user's voiceAI properties
            if (userData.voiceAI) {
              const { enabled, monthlyCommandsUsed, monthlyLimit, disabledReason, voiceSpeed, voicePitch } = userData.voiceAI;
              const limitHit = !enabled && disabledReason === 'limit_reached';
              setIsLocked(limitHit);
              if (limitHit) {
                wakeWordEngine.pauseForLimitReached();
              } else {
                wakeWordEngine.limitReached = false;
              }
              
              if (voiceSpeed !== undefined) voicePersonality.rate = voiceSpeed;
              if (voicePitch !== undefined) voicePersonality.pitch = voicePitch;
              
              setUsageStats({
                enabled,
                used: monthlyCommandsUsed,
                limit: monthlyLimit,
                remaining: Math.max(0, monthlyLimit - monthlyCommandsUsed),
                plan: userData.plan || 'free',
                disabledReason
              });
            }
            
            if (userData.aiVoiceEnabled !== undefined) {
              setAiVoiceEnabled(userData.aiVoiceEnabled);
              if (!userData.aiVoiceEnabled) {
                wakeWordEngine.stopBackgroundListener();
                wakeWordEngine.stopCommandListener();
              }
            }
          }

          // Fetch explicit usage endpoint for accuracy
          const usage = await voice.getUsage();
          setUsageStats(usage);
          if (usage.plan === 'free' && usage.used >= usage.limit) {
            setIsLocked(true);
            wakeWordEngine.pauseForLimitReached();
          }
        } catch (e) {
          console.warn('[GlobalVoiceAssistant] Failed to fetch user data or usage stats:', e);
        }
      }
    };
    fetchUserAndUsage();
  }, []);

  // Listen for settings toggles, socket updates, limits, and orb state events
  useEffect(() => {
    const handleVoiceAiToggle = (e) => {
      const { enabled } = e.detail;
      setAiVoiceEnabled(enabled);
      if (!enabled) {
        wakeWordEngine.stopBackgroundListener();
        wakeWordEngine.stopCommandListener();
      } else {
        if (!wakeWordEngine.limitReached) {
          setIsLocked(false);
          wakeWordEngine.init();
        }
      }
    };

    const handleSettingsUpdated = (data) => {
      if (data && data.aiVoiceEnabled !== undefined) {
        setAiVoiceEnabled(data.aiVoiceEnabled);
        if (!data.aiVoiceEnabled) {
          wakeWordEngine.stopBackgroundListener();
          wakeWordEngine.stopCommandListener();
        } else {
          if (!wakeWordEngine.limitReached) {
            setIsLocked(false);
            wakeWordEngine.init();
          }
        }
      }
      if (data && data.voiceAI) {
        const { enabled, monthlyCommandsUsed, monthlyLimit, disabledReason, voiceSpeed, voicePitch } = data.voiceAI;
        const limitHit = !enabled && disabledReason === 'limit_reached';
        setIsLocked(limitHit);
        if (limitHit) {
          wakeWordEngine.pauseForLimitReached();
        } else {
          wakeWordEngine.limitReached = false;
        }
        if (voiceSpeed !== undefined) voicePersonality.rate = voiceSpeed;
        if (voicePitch !== undefined) voicePersonality.pitch = voicePitch;
        setUsageStats({
          enabled,
          used: monthlyCommandsUsed,
          limit: monthlyLimit,
          remaining: Math.max(0, monthlyLimit - monthlyCommandsUsed),
          plan: data.plan || 'free',
          disabledReason
        });
      }
    };

    const handleLimitReached = (e) => {
      setIsLocked(true);
      setShowUpgradeModal(true);
      if (e.detail) {
        setUsageStats(prev => ({
          ...prev,
          used: e.detail.used || 30,
          limit: e.detail.limit || 30,
          remaining: 0
        }));
      }
    };

    const handleOrbState = (e) => {
      const { state, reason } = e.detail;
      if (state === 'locked' && reason === 'limit_reached') {
        setIsLocked(true);
      } else if (state === 'idle') {
        setIsLocked(false);
      }
    };

    window.addEventListener('resq:ai-voice-toggle', handleVoiceAiToggle);
    window.addEventListener('resq:limit_reached', handleLimitReached);
    window.addEventListener('resq:orb_state', handleOrbState);
    socket.on('settings:updated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('resq:ai-voice-toggle', handleVoiceAiToggle);
      window.removeEventListener('resq:limit_reached', handleLimitReached);
      window.removeEventListener('resq:orb_state', handleOrbState);
      socket.off('settings:updated', handleSettingsUpdated);
    };
  }, []);

  // Initialize and listen to custom wakeWordEngine events
  useEffect(() => {
    // Check SpeechRecognition compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    const handleAwakened = () => {
      setIsWoken(true);
      setMicState('listening');
      setTranscript('');
      setChoices([]);
      const welcome = INSTANT_RESPONSES.wake_acknowledged;
      setAiResponse(welcome);
      // DO NOT speak back "Yes? I'm listening" out loud to allow the user to speak immediately without interruption!
    };

    const handleCommand = (e) => {
      const { transcript } = e.detail;
      setTranscript(transcript);

      // Check if we are awaiting confirmation for a deadline alert
      if (pendingDeadlineTaskIdRef.current) {
        const clean = transcript.toLowerCase();
        const isAffirmative = clean.includes('yes') || clean.includes('yeah') || clean.includes('sure') || clean.includes('ok') || clean.includes('confirm') || clean.includes('do it');
        if (isAffirmative) {
          const taskId = pendingDeadlineTaskIdRef.current;
          setPendingDeadlineTaskId(null);
          socket.emit('resq:create_deadline_focus', { taskId });
          setAiResponse("Focus block scheduled. Let's get to work.");
          speakBack("Absolutely. I've scheduled a focus block for you on the calendar.");
        } else {
          setPendingDeadlineTaskId(null);
          setAiResponse("Understood. Let me know if you need help scheduling it later.");
          speakBack("No problem. Let me know if you change your mind.");
        }
        return;
      }

      // Check if we are awaiting confirmation for idle focus session
      if (awaitingIdleFocusConfirmationRef.current) {
        const clean = transcript.toLowerCase();
        const isAffirmative = clean.includes('yes') || clean.includes('yeah') || clean.includes('sure') || clean.includes('ok') || clean.includes('confirm') || clean.includes('do it');
        if (isAffirmative) {
          setAwaitingIdleFocusConfirmation(false);
          startFocusSession('Deep Work Focus Block', 25);
          setAiResponse("Focus session started. Let's do this.");
          speakBack("Starting your focus session now. Twenty-five minutes on the clock.");
        } else {
          setAwaitingIdleFocusConfirmation(false);
          setAiResponse("No problem. Let me know when you're ready.");
          speakBack("Alright. Let me know whenever you're ready.");
        }
        return;
      }

      setMicState('processing');
      sendTranscriptToBackend(transcript);
    };

    const handleClose = () => {
      closeAssistant();
    };

    const handleStartFocus = (e) => {
      const { task, duration } = e.detail;
      startFocusSession(task, duration);
    };
    const handleStopFocus = () => {
      stopFocusSession();
    };
    const handleClarificationPrompt = (e) => {
      const { question } = e.detail;
      setAiResponse(question);
    };
    const handleNavigation = (e) => {
      const { target } = e.detail;
      navigate(`/dashboard?tab=${target}`);
    };
    const handleDisplayFreeTime = (e) => {
      const { text } = e.detail;
      setAiResponse(text);
    };
    const handleShowSummary = (e) => {
      const { summary } = e.detail;
      setAiResponse(summary);
    };
    const handleInterimTranscript = (e) => {
      const { transcript } = e.detail;
      setTranscript(transcript);
    };

    if (executorRef.current) {
      executorRef.current.onClarificationTimeout = () => {
        const timeoutMsg = "No worries — just say Hey ResQ whenever you're ready.";
        setAiResponse(timeoutMsg);
        voicePersonality.speak(timeoutMsg);
      };
    }

    window.addEventListener('resq:awakened', handleAwakened);
    window.addEventListener('resq:command', handleCommand);
    window.addEventListener('resq:close', handleClose);
    window.addEventListener('resq:interim-transcript', handleInterimTranscript);
    window.addEventListener('resq:start-focus', handleStartFocus);
    window.addEventListener('resq:stop-focus', handleStopFocus);
    window.addEventListener('resq:clarification-prompt', handleClarificationPrompt);
    window.addEventListener('resq:navigate', handleNavigation);
    window.addEventListener('resq:display-free-time', handleDisplayFreeTime);
    window.addEventListener('resq:show-summary', handleShowSummary);

    return () => {
      window.removeEventListener('resq:awakened', handleAwakened);
      window.removeEventListener('resq:command', handleCommand);
      window.removeEventListener('resq:close', handleClose);
      window.removeEventListener('resq:interim-transcript', handleInterimTranscript);
      window.removeEventListener('resq:start-focus', handleStartFocus);
      window.removeEventListener('resq:stop-focus', handleStopFocus);
      window.removeEventListener('resq:clarification-prompt', handleClarificationPrompt);
      window.removeEventListener('resq:navigate', handleNavigation);
      window.removeEventListener('resq:display-free-time', handleDisplayFreeTime);
      window.removeEventListener('resq:show-summary', handleShowSummary);
    };
  }, []);

  // Socket listener for voice:response and proactive alerts
  useEffect(() => {
    const handleVoiceResponse = (result) => {
      console.log('[Socket Voice] voice:response received:', result);
      handleVoiceResult(result);
    };

    const handleProactiveAlert = (data) => {
      console.log('[Socket Proactive] Alert received:', data);
      const { message, type, taskId } = data;
      if (!message) return;

      // DND Suppression: Mute all non-critical alerts (like deadline warnings, focus suggestions) during focus sessions
      if (focusActiveRef.current && type !== 'meeting') {
        console.log('[Socket Proactive] DND Active: Suppressing non-critical proactive alert:', message);
        return;
      }

      // Speak message immediately
      speakBack(message);

      // Pulse orb in different color per type
      setProactivePulseType(type);

      // Show alert banner
      setAiResponse(message);
      setIsWoken(true);

      // 10s confirmation window for deadline alerts
      if (type === 'deadline' && taskId) {
        setPendingDeadlineTaskId(taskId);
        setTimeout(() => {
          setPendingDeadlineTaskId(null);
        }, 10000);
      }
    };

    socket.on('voice:response', handleVoiceResponse);
    socket.on('resq:proactive_alert', handleProactiveAlert);

    return () => {
      socket.off('voice:response', handleVoiceResponse);
      socket.off('resq:proactive_alert', handleProactiveAlert);
    };
  }, []);

  const handleVoiceResult = async (result) => {
    if (!result) return;

    // Check if blocked by limit
    if (result.blocked) {
      if (result.reason === 'limit_reached') {
        wakeWordEngine.pauseForLimitReached();
        setIsLocked(true);
        voicePersonality.speak(
          "You've used all 30 of your monthly voice commands. Upgrade to Premium for unlimited access. I'll be here once you do."
        );
        window.dispatchEvent(new CustomEvent('resq:limit_reached', { detail: { used: result.used || 30, limit: result.limit || 30 } }));
      } else if (result.reason === 'user_disabled') {
        voicePersonality.speak(
          "Voice AI is currently disabled. You can turn it back on in your settings."
        );
      }
      setMicState('idle');
      return;
    }

    if (result.voiceUsage) {
      setUsageStats(result.voiceUsage);
    } else {
      try {
        const usage = await voice.getUsage();
        setUsageStats(usage);
      } catch (e) {}
    }

    setLastResult(result);
    setAiResponse(result.response);
    
    // Delegate all speech and visual actions to VoiceActionExecutor
    await executorRef.current.execute(result);
  };

  const sendTranscriptToBackend = async (text) => {
    if (!text) return;
    setMicState('processing');
    
    // Check socket first for lower latency
    if (socket && socket.connected) {
      console.log('[Socket Voice] Emitting voice:transcript:', text);
      socket.emit('voice:transcript', { transcript: text });
    } else {
      // HTTP fallback
      console.log('[HTTP Voice] Sending voice command:', text);
      try {
        const result = await voice.sendCommand(text);
        handleVoiceResult(result);
      } catch (error) {
        console.error('Error sending voice command via HTTP:', error);
        if (error.response?.status === 403) {
          const { reason, used, limit } = error.response.data || {};
          
          if (reason === 'limit_reached') {
            // 1. Stop the wake word engine
            wakeWordEngine.pauseForLimitReached();
            setIsLocked(true);
            
            // 2. Speak the message
            voicePersonality.speak(
              "You've used all 30 of your monthly voice commands. Upgrade to Premium for unlimited access. I'll be here once you do."
            );
            
            // 3. Show upgrade modal
            window.dispatchEvent(new CustomEvent('resq:limit_reached', { detail: { used: used || 30, limit: limit || 30 } }));
            
          } else if (reason === 'user_disabled') {
            voicePersonality.speak(
              "Voice AI is currently disabled. You can turn it back on in your settings."
            );
          }
        } else {
          setAiResponse("Sorry, I had trouble connecting to the server.");
          speakBack("Sorry, I had trouble connecting to the server.");
        }
        setMicState('idle');
      }
    }
  };

  // Voice synthesis feedback helper delegating to voicePersonality
  const speakBack = (text, priority = false) => {
    // Stop recognition to prevent self-listening
    wakeWordEngine.stopBackgroundListener();
    wakeWordEngine.stopCommandListener();
    setIsListening(false);
    setMicState('speaking');

    const resumeListening = () => {
      setMicState(isWokenRef.current ? 'listening' : 'idle');
      if (isWokenRef.current) {
        wakeWordEngine.startCommandListener();
      } else {
        wakeWordEngine.startBackgroundListener();
      }
    };

    voicePersonality.speak(text, {
      priority,
      onEnd: resumeListening
    });
  };

  const handleUpgradeToPremium = async () => {
    setUpgradeLoading(true);
    try {
      // Simulate secure checkout delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update plan to premium on backend
      await settings.updatePlan('premium');
      
      // Re-enable Voice AI setting on backend
      await settings.updateAiVoice(true);
      
      // Reset local engine limits
      wakeWordEngine.limitReached = false;
      setIsLocked(false);
      setAiVoiceEnabled(true);
      
      // Fetch latest profile details
      const freshUser = await auth.getMe();
      if (freshUser) {
        setUserContextName(freshUser.name || 'User');
        // Restart WakeWordEngine
        wakeWordEngine.initialize(freshUser);
      }

      // Fetch fresh usage stats
      const usage = await voice.getUsage();
      setUsageStats(usage);
      
      // Show success response
      setAiResponse("Premium Activated! Voice AI is now unlocked with unlimited commands.");
      speakBack("Thank you for upgrading! Your unlimited voice commands are now active.");
      
      setShowUpgradeModal(false);
      
      // Broadcast settings update to other pages (like SettingsPage)
      window.dispatchEvent(new CustomEvent('resq:ai-voice-toggle', { detail: { enabled: true } }));
      
    } catch (err) {
      console.error('Failed to upgrade via voice assistant checkout:', err);
      alert('Upgrade failed. Please try again or visit Settings page.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Wake up assistant
  const triggerWakeUp = () => {
    wakeWordEngine.triggerWakeSequence();
  };

  // Close assistant
  const closeAssistant = () => {
    wakeWordEngine.resetToIdle();
    setIsWoken(false);
    setMicState('idle');
    setTranscript('');
    setChoices([]);
  };

  // Focus Session Helpers
  const startFocusSession = (taskName, durationMinutes) => {
    setFocusTask(taskName || 'Deep Work Session');
    const mins = parseInt(durationMinutes) || 25;
    setFocusDuration(mins);
    setFocusActive(true);
    navigate('/dashboard?tab=dashboard');
  };

  const stopFocusSession = () => {
    setFocusActive(false);
  };

  // Alt+V shortcut to wake/close assistant
  useEffect(() => {
    const handleAltVShortcut = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (isWoken) {
          closeAssistant();
        } else {
          triggerWakeUp();
        }
      }
    };
    window.addEventListener('keydown', handleAltVShortcut);
    return () => {
      window.removeEventListener('keydown', handleAltVShortcut);
    };
  }, [isWoken]);

  // Cleanup on component unmount and handle Proactive/Idle triggers
  useEffect(() => {
    const updateActivity = () => {
      lastInteractionTimeRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Interval checker running every 30 seconds
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastInteractionTimeRef.current;
      const twentyMins = 20 * 60 * 1000;
      
      // If idle for > 20 minutes, and we haven't already suggested it in this idle streak
      if (idleTime > twentyMins && !suggestedFocusRef.current && !focusActiveRef.current) {
        suggestedFocusRef.current = true;
        
        // Suggest focus session
        const msg = "You've been quiet for a bit. Would you like me to start a focus session?";
        setAiResponse(msg);
        setIsWoken(true);
        setProactivePulseType('focus'); // Gold pulse
        speakBack(msg);

        // Listen for "yes" to start a focus session
        setAwaitingIdleFocusConfirmation(true);
        setTimeout(() => {
          setAwaitingIdleFocusConfirmation(false);
        }, 10000); // 10s window
      }
      
      // Reset suggestion flag once they become active again
      if (idleTime < twentyMins && suggestedFocusRef.current) {
        suggestedFocusRef.current = false;
      }
    }, 30000); // Check every 30s

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(interval);
    };
  }, []);

  // Clear proactivePulseType after 10 seconds
  useEffect(() => {
    if (proactivePulseType) {
      const timer = setTimeout(() => {
        setProactivePulseType(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [proactivePulseType]);

  const getOrbState = () => {
    if (!aiVoiceEnabled) return 'disabled';
    if (isLocked) return 'locked';
    if (focusActive) return 'focus_active';
    if (proactivePulseType) return 'alert';
    return micState;
  };

  const triggerScenario = (phrase) => {
    setTranscript(`[Scenario Click]: "${phrase}"`);
    sendTranscriptToBackend(phrase);
  };

  const orbState = getOrbState();
  const alertColor = proactivePulseType === 'meeting' ? 'var(--orb-blue)' : proactivePulseType === 'deadline' ? 'var(--orb-red)' : 'var(--orb-gold)';
  const alertGlow = proactivePulseType === 'meeting' ? 'var(--orb-blue-glow)' : proactivePulseType === 'deadline' ? 'var(--orb-red-glow)' : 'var(--orb-gold-glow)';
  const actionMeta = lastResult ? getIntentActionMeta(lastResult.intent) : null;

  return (
    <>
      {/* Persistent microphone permission denied banner */}
      {permissionDenied && (
        <div className="fixed top-0 left-0 right-0 bg-red-950/90 border-b border-red-500/20 px-4 py-2.5 text-center text-xs font-semibold text-red-200 z-[10000] backdrop-blur-md flex items-center justify-center gap-2 shadow-lg animate-fade-in-up">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>Enable mic in browser settings for voice features</span>
          <a 
            href="https://support.google.com/chrome/answer/2693767" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-white transition-colors ml-1"
          >
            How to enable
          </a>
        </div>
      )}

      {/* Friendly microphone permission request modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-[var(--orb-gold)]/10 border border-[var(--orb-gold)]/20 flex items-center justify-center mx-auto">
              <Mic className="w-6 h-6 text-[var(--orb-gold)]" />
            </div>
            <h3 className="text-white text-base font-tech font-bold uppercase tracking-wide">Microphone Permission Needed</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              ResQ needs microphone access to listen for 'Hey ResQ'. Allow it to enable hands-free control.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  localStorage.setItem('resq:mic-prompt-seen', 'true');
                  setShowPermissionModal(false);
                }}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                Not Now
              </button>
              <button
                onClick={handleGrantPermission}
                className="flex-1 py-2.5 bg-[var(--orb-gold)] hover:bg-[#FFF2CC] text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Allow Mic
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="resq-orb-container group">
        {/* Drawer expands upward from the orb when active */}
        {isWoken && (
          <div className="voice-console absolute bottom-20 right-0 w-[calc(100vw-32px)] sm:w-[420px] bg-[#09090b]/95 border border-white/10 rounded-3xl p-6 shadow-2xl z-[9998] font-sans backdrop-blur-xl animate-fade-in-up flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--orb-gold)]" />
                <span className="text-xs font-tech font-bold text-[var(--orb-gold)] tracking-wider uppercase">ResQ Voice AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-tech px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 uppercase">
                  {micState === 'speaking' ? 'Speaking' : micState === 'processing' ? 'Thinking' : 'Listening'}
                </span>
                <button 
                  onClick={closeAssistant}
                  className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Last spoken command (user's words) in gray */}
            <div className="space-y-1">
              <span className="text-[10px] font-tech text-white/30 uppercase tracking-widest block">Last Command</span>
              <p className="text-sm font-medium text-white/40 italic pl-1 border-l-2 border-white/10 min-h-[20px]">
                {transcript || 'Waiting for voice input...'}
              </p>
            </div>

            {/* ResQ's response in white */}
            <div className="voice-ai-response-box space-y-1 bg-white/[0.02] border border-white/[0.03] p-4 rounded-2xl relative">
              <span className="text-[10px] font-tech text-[var(--orb-gold)] uppercase tracking-widest block mb-1">ResQ Response</span>
              <p className="text-sm text-white leading-relaxed font-sans">
                {aiResponse}
              </p>

              {/* Action Choices */}
              {choices.length > 0 && (
                <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-white/5">
                  {choices.map((choice, idx) => (
                    <button
                      key={idx}
                      onClick={choice.action}
                      className="w-full text-left text-xs bg-white/5 hover:bg-[var(--orb-gold)] hover:text-black border border-white/10 hover:border-[var(--orb-gold)] text-white/80 px-3.5 py-2 rounded-xl font-semibold transition-all duration-300 cursor-pointer"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action taken confirmation with icon */}
            {actionMeta && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-2xl text-xs font-semibold">
                <actionMeta.icon className={`w-4 h-4 ${actionMeta.color}`} />
                <span className="text-white/40">Action:</span>
                <span className="text-white font-tech uppercase tracking-wider">{actionMeta.label}</span>
              </div>
            )}

            {/* Quick action buttons */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[9px] font-tech text-white/30 uppercase tracking-widest block mb-1.5">Quick Actions</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => triggerScenario("schedule a meeting")}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[var(--orb-gold)]/40 hover:bg-white/[0.08] transition-all text-left group/btn cursor-pointer"
                >
                  <CalendarDays className="w-4 h-4 text-[var(--orb-blue)]" />
                  <span className="text-xs text-white/70 font-semibold font-tech">Schedule</span>
                </button>
                <button 
                  onClick={() => triggerScenario("add a task")}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[var(--orb-gold)]/40 hover:bg-white/[0.08] transition-all text-left group/btn cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-[var(--orb-green)]" />
                  <span className="text-xs text-white/70 font-semibold font-tech">Add Task</span>
                </button>
                <button 
                  onClick={() => triggerScenario("start focus session")}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[var(--orb-gold)]/40 hover:bg-white/[0.08] transition-all text-left group/btn cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-white/70 font-semibold font-tech">Focus Mode</span>
                </button>
                <button 
                  onClick={() => triggerScenario("summarize my day")}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[var(--orb-gold)]/40 hover:bg-white/[0.08] transition-all text-left group/btn cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-white/70 font-semibold font-tech">My Day</span>
                </button>
              </div>
            </div>

            {/* Command Usage Progress Bar (free tier only) */}
            {usageStats && usageStats.plan === 'free' && (
              <div className="space-y-1.5 pt-2.5 border-t border-white/5">
                <div className="flex justify-between items-center text-[9px] font-tech font-bold uppercase tracking-wider">
                  {usageStats.remaining < 5 && usageStats.remaining > 0 ? (
                    <span className="text-amber-500">{usageStats.remaining} commands remaining</span>
                  ) : usageStats.remaining === 0 ? (
                    <span className="text-red-500">0 commands remaining</span>
                  ) : (
                    <span className="text-white/40">Monthly Voice AI Command Usage</span>
                  )}
                  <span className="text-white/60">{usageStats.used} / {usageStats.limit} used</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      usageStats.remaining === 0 ? 'bg-red-500' : usageStats.remaining < 5 ? 'bg-amber-500' : 'bg-[var(--orb-gold)]'
                    }`}
                    style={{ width: `${Math.min(100, (usageStats.used / usageStats.limit) * 100)}%` }}
                  />
                </div>
                {usageStats.remaining === 0 && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full mt-1 py-2 bg-red-500 hover:bg-red-600 text-white font-tech font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10"
                  >
                    Upgrade to Premium
                  </button>
                )}
              </div>
            )}

            {/* Text Input Fallback when SpeechRecognition is offline or for keyboard use */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.target.elements.voiceInput.value.trim();
                if (input) {
                  setTranscript(input);
                  sendTranscriptToBackend(input);
                  e.target.elements.voiceInput.value = '';
                }
              }}
              className="flex gap-2 border-t border-white/5 pt-3"
            >
              <input
                name="voiceInput"
                type="text"
                placeholder="Type a command..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[var(--orb-gold)] transition-all font-sans"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--orb-gold)] hover:bg-[#FFF2CC] text-black font-tech font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Send
              </button>
            </form>

            {/* "Powered by Gemini" micro-badge at bottom in subtle gold */}
            <div className="flex items-center justify-center pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--orb-gold)]/5 border border-[var(--orb-gold)]/15 shadow-[0_0_10px_rgba(229,184,66,0.05)]">
                <Sparkles className="w-3 h-3 text-[var(--orb-gold)] animate-pulse" />
                <span className="text-[9px] font-tech font-bold text-[var(--orb-gold)] uppercase tracking-wider">Powered by Gemini 1.5 Flash</span>
              </div>
            </div>
          </div>
        )}

        {/* Animated outer ring, state-dependent */}
        <div 
          className={`orb-ring-outer state-${orbState}`} 
          style={orbState === 'alert' ? { '--alert-color': alertColor, '--alert-glow': alertGlow } : {}}
        />

        {/* Main circle button */}
        <div 
          className={`orb-core ${!aiVoiceEnabled ? 'state-disabled' : isLocked ? 'state-locked' : ''}`}
          onClick={!aiVoiceEnabled ? null : isLocked ? () => setShowUpgradeModal(true) : (isWoken ? closeAssistant : triggerWakeUp)}
          title={!aiVoiceEnabled ? "Voice AI disabled — Enable in Settings" : isLocked ? "Voice AI limit reached — Upgrade to Premium" : (isWoken ? "Close Assistant" : "Say 'Hey ResQ' or Click to Speak")}
        >
          {/* WaveVisualizer bars={19} - only visible when speaking/listening */}
          {(orbState === 'speaking' || orbState === 'listening') && (
            <WaveVisualizer bars={19} micState={micState} />
          )}

          {/* LockIcon - visible when locked */}
          {isLocked && !(!aiVoiceEnabled) && (
            <Lock className="w-5 h-5 text-gray-500 transition-colors duration-300 group-hover:text-white z-10" />
          )}

          {/* MicOff - visible when disabled */}
          {!aiVoiceEnabled && (
            <MicOff className="w-5 h-5 text-gray-500 z-10" />
          )}

          {/* MicIcon - visible in idle when not locked and enabled */}
          {orbState === 'idle' && !isLocked && aiVoiceEnabled && (
            <Mic className="w-5 h-5 text-[var(--orb-gold)] transition-colors duration-300 group-hover:text-white z-10" />
          )}

          {/* Close icon - visible when woken and processing or alert */}
          {isWoken && (orbState === 'processing' || orbState === 'alert') && (
            <X className="w-5 h-5 text-white z-10" />
          )}

          {/* StateLabel - "Listening...", "Thinking...", etc. */}
          <StateLabel orbState={orbState} />
        </div>

        {/* Status badge: green=on, gray=off, red=error */}
        <div className={`orb-status-badge status-${!speechSupported ? 'error' : (isWoken || isListening) ? 'on' : 'off'}`} />
      </div>

      {/* Fullscreen Focus HUD Overlay */}
      {focusActive && (
        <FocusSessionOverlay
          taskName={focusTask}
          duration={focusDuration}
          userName={userContextName || 'User'}
          onClose={stopFocusSession}
        />
      )}

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-fade-in-up relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-full bg-[var(--orb-gold)]/10 border border-[var(--orb-gold)]/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-[var(--orb-gold)] animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white text-lg font-display font-black uppercase tracking-wide">Upgrade to Premium</h3>
              <p className="text-white/60 text-xs leading-relaxed font-sans">
                You've used all 30 of your monthly voice commands. Upgrade to Premium for unlimited voice commands, smart conflict resolutions, and autopilot scheduling.
              </p>
            </div>
            <button
              onClick={handleUpgradeToPremium}
              disabled={upgradeLoading}
              className="w-full py-3 bg-[var(--orb-gold)] hover:bg-[#FFF2CC] text-black font-tech font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {upgradeLoading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
              ) : (
                "Unlock Unlimited Commands"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
